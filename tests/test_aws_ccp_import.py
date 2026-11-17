import json
from pathlib import Path
import tempfile
import unittest
from zipfile import ZipFile

from scripts.import_aws_ccp import W, R, docx_lines, extract_entries, parse_question

APP = Path(__file__).resolve().parents[1]


class ImportTests(unittest.TestCase):
    def test_docx_preserves_order_unicode_breaks_and_hyperlink(self):
        xml = f'''<w:document xmlns:w="{W[1:-1]}" xmlns:r="{R[1:-1]}">
          <w:body>
            <w:p><w:r><w:t>Q131</w:t></w:r></w:p>
            <w:p><w:r><w:t>Prompt — </w:t><w:t>continued</w:t><w:br/><w:t>Next line</w:t></w:r></w:p>
            <w:p><w:hyperlink r:id="r1"><w:r><w:t>Source</w:t></w:r></w:hyperlink></w:p>
            <w:p><w:r><w:t>Question 133 (Scenario-Based MCQ)</w:t></w:r></w:p>
            <w:p><w:r><w:t>133. Another entry</w:t></w:r></w:p>
          </w:body>
        </w:document>'''
        references = '''<Relationships><Relationship Id="r1" Type="test/hyperlink"
            Target="https://docs.aws.amazon.com/example"/></Relationships>'''
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "test.docx"
            with ZipFile(source, "w") as document:
                document.writestr("word/document.xml", xml)
                document.writestr("word/_rels/document.xml.rels", references)
            entries = extract_entries(docx_lines(source))
        self.assertEqual([label for label, _ in entries], ["Q131", "Question 133", "133"])
        self.assertEqual(entries[0][1][1][0], "Prompt — continued")
        self.assertEqual(entries[0][1][2][0], "Next line")
        self.assertEqual(entries[0][1][3][1], ["https://docs.aws.amazon.com/example"])

    def test_multiline_key_and_explanation_groups(self):
        parsed = parse_question([(line, []) for line in """
Prompt (Choose TWO.)
a) First
b) Second
C. Third
D. Fourth
✅ Correct Answers: A, C
Explanation:
The original explanation.
B is incorrect: second feedback
C is correct: third feedback
D is incorrect: fourth feedback
""".strip().splitlines()])
        self.assertEqual(parsed["options"][0], {"id": "A", "text": "First"})
        self.assertEqual(parsed["type"], "multiple_response")
        self.assertEqual(parsed["correctAnswers"], ["A", "C"])
        self.assertEqual(parsed["sourceAnswerKey"], "A, C")
        self.assertEqual(parsed["validationIssues"], [])
        self.assertEqual(parsed["incorrectExplanations"], {"B": "second feedback", "D": "fourth feedback"})
        self.assertIn("C is correct: third feedback", parsed["explanation"])

    def test_missing_and_out_of_range_keys(self):
        lines = [("Prompt", []), ("A. First", []), ("B. Second", [])]
        self.assertIn("missing_answer_key", parse_question(lines)["validationIssues"])
        self.assertIn("invalid_answer_reference",
                      parse_question(lines + [("Correct Answer: E", [])])["validationIssues"])


class GeneratedBankTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.bank = json.loads((APP / "src/aws-practice/question-bank.json").read_text(encoding="utf-8"))
        cls.questions = cls.bank["questions"]

    def test_full_bank_source_order_and_classifications(self):
        questions = self.questions
        self.assertEqual(len(questions), 306)
        self.assertEqual([q["id"] for q in questions], [f"ccp-{n:04d}" for n in range(1, 307)])
        self.assertEqual([q["sourceOrder"] for q in questions], list(range(1, 307)))
        self.assertEqual(sum(d["total"] for d in self.bank["summary"]["domains"]), len(questions))
        for q in questions:
            self.assertIn(q["domain"], range(1, 5))
            self.assertTrue(q["topic"] and q["subtopic"])
        self.assertEqual(self.bank["summary"]["missingNumbers"], [5, 86, 238])
        self.assertEqual(self.bank["summary"]["repeatedNumbers"], [105, 251])
        for number in ("Q105", "Q251"):
            entries = [q for q in questions if q["originalQuestionNumber"] == number]
            self.assertEqual([q["sourceOccurrence"] for q in entries], [1, 2])

    def test_unresolved_keys_are_preserved_and_block_scoring(self):
        missing = next(q for q in self.questions if q["originalQuestionNumber"] == "Q41")
        conflicting = next(q for q in self.questions if q["originalQuestionNumber"] == "Q67")
        self.assertEqual(missing["correctAnswers"], [])
        self.assertEqual(conflicting["correctAnswers"], ["A", "B", "C", "D", "F"])
        self.assertEqual(conflicting["type"], "multiple_response")
        for q in (missing, conflicting):
            self.assertEqual(q["reviewStatus"], "needs_review")
            self.assertFalse(q["eligibleForScoredMock"])


if __name__ == "__main__":
    unittest.main()
