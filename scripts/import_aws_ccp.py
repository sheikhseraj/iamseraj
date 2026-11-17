"""Extract and validate the CLF-C02 practice bank using Python 3.10+."""
import argparse
import csv
from collections import Counter, defaultdict
from difflib import SequenceMatcher
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET
from zipfile import ZipFile

APP = Path(__file__).resolve().parents[1]
SOURCE_ROOT = APP.parents[1]
DOMAINS = {
    1: ("Cloud Concepts", 24, 16),
    2: ("Security and Compliance", 30, 20),
    3: ("Cloud Technology and Services", 34, 22),
    4: ("Billing, Pricing, and Support", 12, 7),
}
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
R = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"
HEADER = re.compile(
    r"^(?P<label>(?:Q\s*|Question\s+)\d{1,3})(?:\s*[.:\-)]\s*|\s+(?=\()|$)"
    r"|^(?P<bare>\d{1,3})\s*[.:\-)](?:\s+|$)",
    re.IGNORECASE,
)
OPTION = re.compile(r"^([A-H])\s*[.):–—-]\s*(.+)$", re.IGNORECASE)
ANSWER = re.compile(r"^[^\w]*correct\s+(answer[s]?)\s*:\s*(.*)$", re.IGNORECASE)
EXPLANATION = re.compile(
    r"^[^\w]*(?P<label>correct explanation|incorrect explanations?|incorrect options?(?: explained)?"
    r"|incorrect answers?(?: explained)?|explanations?(?:\s*\([^)]+\)|\s+for\s+[^:]+)?)"
    r"\s*:\s*(?P<text>.*)$",
    re.IGNORECASE,
)
BARE_KEYS = re.compile(r"[A-H](?:(?:\s*[,;/&+]\s*|\s+and\s+)[A-H])*", re.IGNORECASE)
OPTION_FEEDBACK = re.compile(r"^([A-H])\s+(?:is\s+)?(correct|incorrect)\s*:\s*(.*)$", re.IGNORECASE)
URL = re.compile(r"""https?://[^\s<>"'()\[\]]+""", re.IGNORECASE)
PICK_COUNT = re.compile(
    r"\b(?:choose|select|pick)\s+(one|two|three|four|five|six|[1-9])\b",
    re.IGNORECASE,
)
COUNT_WORDS = dict(zip(("one", "two", "three", "four", "five", "six"), range(1, 7)))


def docx_lines(path):
    """Return source lines and hyperlink targets in document order."""
    with ZipFile(path) as docx:
        xml = ET.fromstring(docx.read("word/document.xml"))
        links = {}
        if "word/_rels/document.xml.rels" in docx.namelist():
            rels = ET.fromstring(docx.read("word/_rels/document.xml.rels"))
            links = {
                element.attrib["Id"]: element.attrib["Target"]
                for element in rels
                if element.get("Type", "").endswith("/hyperlink")
                and element.get("Target", "").lower().startswith(("https://", "http://"))
            }
    result = []
    for paragraph in xml.find(f"{W}body").iter(f"{W}p"):
        line, references = "", []
        for node in paragraph.iter():
            if node.tag == f"{W}t":
                line += node.text or ""
            elif node.tag in {f"{W}br", f"{W}cr"}:
                if line.strip() or references:
                    result.append((line.strip(), references))
                line, references = "", []
            elif node.tag == f"{W}tab":
                line += "\t"
            elif node.tag == f"{W}hyperlink" and node.get(f"{R}id") in links:
                references.append(links[node.get(f"{R}id")])
        if line.strip() or references:
            result.append((line.strip(), references))
    return result


def extract_entries(lines):
    blocks = []
    for line, references in lines:
        header = HEADER.match(line)
        if header:
            label = header["label"] or header["bare"]
            blocks.append((label, [(line[header.end():].strip(), references)]))
        elif blocks:
            blocks[-1][1].append((line, references))
        elif line:
            raise ValueError(f"Unexpected text before the first question: {line!r}")
    if not blocks:
        raise ValueError("No question headers were detected in the DOCX.")
    return blocks


def answer_ids(text):
    if BARE_KEYS.fullmatch(text.rstrip(".")):
        return [match.upper() for match in re.findall(r"\b[A-H]\b", text, re.IGNORECASE)]
    option = OPTION.fullmatch(text)
    return [option[1].upper()] if option else []


def parse_question(lines):
    prompt, options, answers, raw_key, explanation = [], [], [], [], []
    wrong, wrong_intro, references, issues = {}, [], [], []
    state, wrong_id = "prompt", None
    key_sections = 0
    plural_key = False
    for line, targets in lines:
        references.extend(targets)
        references.extend(match.rstrip(".,;") for match in URL.findall(line))
        if not line or URL.fullmatch(line):
            continue

        if match := ANSWER.fullmatch(line):
            key_sections += 1
            plural_key |= match[1].lower().endswith("s")
            state = "answer"
            if key_text := match[2].strip():
                raw_key.append(key_text)
                answers.extend(answer_ids(key_text))
            continue

        if match := EXPLANATION.fullmatch(line):
            state = "incorrect" if "incorrect" in match["label"].lower() else "explanation"
            wrong_id = None
            line = match["text"].strip()
            if not line:
                continue

        if state == "answer":
            if ids := answer_ids(line):
                raw_key.append(line)
                answers.extend(ids)
                continue
            # Keep an unresolved inline key and preserve any unlabelled explanation.
            state = "explanation"

        if state in {"explanation", "incorrect"} and (feedback := OPTION_FEEDBACK.fullmatch(line)):
            if feedback[2].lower() == "correct":
                state, wrong_id = "explanation", None
                explanation.append(line)
            else:
                state, wrong_id = "incorrect", feedback[1].upper()
                wrong.setdefault(wrong_id, []).append(feedback[3])
            continue

        option = OPTION.fullmatch(line)
        if state in {"prompt", "options"} and option:
            state = "options"
            options.append({"id": option[1].upper(), "text": option[2]})
        elif state == "prompt":
            prompt.append(line)
        elif state == "options":
            options[-1]["text"] += "\n" + line
        elif state == "incorrect":
            if option:
                wrong_id = option[1].upper()
                wrong.setdefault(wrong_id, []).append(option[2])
            elif wrong_id:
                wrong[wrong_id].append(line)
            else:
                wrong_intro.append(line)
        elif state == "explanation":
            if option and line[1:2] == ":" and option[1].upper() not in answers:
                wrong_id = option[1].upper()
                wrong.setdefault(wrong_id, []).append(option[2])
                state = "incorrect"
            else:
                explanation.append(line)

    q = "\n".join(prompt)
    option_ids = [option["id"] for option in options]
    unique_answers = list(dict.fromkeys(answers))
    choices = PICK_COUNT.search(q)
    pick_count = COUNT_WORDS.get(choices[1].lower(), choices[1]) if choices else None
    pick_count = int(pick_count) if pick_count else None
    multiple = (
        len(unique_answers) > 1 or plural_key or (pick_count is not None and pick_count > 1)
        or bool(re.search(r"\b(?:choose|select) all\b|\bwhich (?:two|three|four|five)\b", q, re.I))
    )
    if not q:
        issues.append("missing_question")
    if len(options) < 2 or any(not option["text"].strip() for option in options):
        issues.append("missing_options")
    if len(set(option_ids)) != len(option_ids):
        issues.append("duplicate_option_ids")
    if not answers:
        issues.append("missing_answer_key")
    if any(not answer_ids(text) for text in raw_key) or set(answers) - set(option_ids):
        issues.append("invalid_answer_reference")
    if key_sections > 1 or len(unique_answers) != len(answers):
        issues.append("ambiguous_answer_key")
    if answers and ((pick_count is not None and len(unique_answers) != pick_count)
                    or (multiple and len(unique_answers) < 2)):
        issues.append("answer_count_conflict")
    return {
        "question": q,
        "type": "multiple_response" if multiple else "single_choice",
        "options": options,
        "correctAnswers": unique_answers,
        "sourceAnswerKey": "\n".join(raw_key),
        "explanation": "\n".join(explanation),
        "incorrectExplanations": {key: "\n".join(value) for key, value in wrong.items()},
        "incorrectExplanationNotes": "\n".join(wrong_intro),
        "references": list(dict.fromkeys(references)),
        "validationIssues": issues,
    }


def expand_keys(specification):
    for word in specification.split():
        if "-" in word:
            start, end = map(int, word.split("-"))
            yield from map(str, range(start, end + 1))
        else:
            yield word


def index_groups(groups):
    index = {}
    for *data, key_specification in groups:
        for key in expand_keys(key_specification):
            if key in index:
                raise ValueError(f"Duplicate classification key: {key}")
            index[key] = data
    return index


def normalize(text):
    return " ".join(re.findall(r"\w+", text.casefold()))


def duplicate_groups(questions):
    by_prompt, by_options = defaultdict(list), defaultdict(list)
    for q in questions:
        by_prompt[normalize(q["question"])].append(q["id"])
        signature = tuple(sorted(normalize(item["text"]) for item in q["options"]))
        if signature:
            by_options[signature].append(q)
    exact = [ids for prompt, ids in by_prompt.items() if prompt and len(ids) > 1]
    near = []
    for group in by_options.values():
        for i, left in enumerate(group):
            for right in group[i + 1:]:
                a, b = normalize(left["question"]), normalize(right["question"])
                same_final_line = (
                    normalize(left["question"].splitlines()[-1]) == normalize(right["question"].splitlines()[-1])
                    if a and b else False
                )
                if a != b and (same_final_line or SequenceMatcher(None, a, b).ratio() >= 0.88):
                    near.append([left["id"], right["id"]])
    return exact, near


def build_bank(docx_path, csv_path, classification_path):
    rules = json.loads(classification_path.read_text(encoding="utf-8"))
    assigned = index_groups(rules["classifications"])
    reviews = {}
    for keys, reason, *references in rules["technicalReviews"]:
        for key in expand_keys(keys):
            reviews.setdefault(key, []).append({"reason": reason, "references": references})

    with csv_path.open(encoding="utf-8-sig", newline="") as file:
        csv_rows = list(csv.DictReader(file))

    questions, occurrences, differences, row_mismatches = [], Counter(), [], []
    for order, (label, lines) in enumerate(extract_entries(docx_lines(docx_path)), start=1):
        number = int(re.search(r"\d+", label)[0])
        occurrences[number] += 1
        key = str(number) if occurrences[number] == 1 else f"{number}#{occurrences[number]}"
        if key not in assigned:
            raise ValueError(f"Classify source question {key} before generating the bank.")
        domain, topic, subtopic = assigned.pop(key)
        q = parse_question(lines)
        technical_reviews = reviews.pop(key, [])
        review_required = bool(q["validationIssues"] or technical_reviews)
        csv_row = csv_rows[order - 1] if order <= len(csv_rows) else {}
        csv_preview = normalize(csv_row.get("question_preview", ""))
        question = normalize(q["question"])
        # The CSV may truncate the prompt or omit a heading. It supplies no exam content.
        if (csv_row.get("original_number") != str(number) or not csv_preview
                or (csv_preview[:80] not in question and question[:80] not in csv_preview)):
            row_mismatches.append(key)
        elif normalize(csv_row["domain"]) != normalize(DOMAINS[domain][0]):
            differences.append({"number": key, "csvDomain": csv_row["domain"], "domain": domain})
        questions.append({
            "id": f"ccp-{order:04d}",
            "originalQuestionNumber": f"Q{number}",
            "sourceLabel": label,
            "sourceOccurrence": occurrences[number],
            "sourceOrder": order,
            "domain": domain,
            "domainName": DOMAINS[domain][0],
            "topic": topic,
            "subtopic": subtopic,
            **q,
            "reviewStatus": "needs_review" if review_required else "structurally_validated",
            "technicalVerification": "not_independently_verified",
            "technicalReview": technical_reviews,
            "eligibleForScoredMock": not review_required,
            "source": docx_path.name,
        })
    if assigned or reviews:
        raise ValueError(f"Unused classification or review keys: {sorted(set(assigned) | set(reviews))}")

    exact, near = duplicate_groups(questions)
    counts = Counter(question["type"] for question in questions)
    problems = Counter(issue for question in questions for issue in question["validationIssues"])
    summary = {
        "total": len(questions),
        "structurallyValid": sum(not q["validationIssues"] for q in questions),
        "needsReview": sum(q["reviewStatus"] == "needs_review" for q in questions),
        "technicalReview": sum(bool(q["technicalReview"]) for q in questions),
        "eligibleForScoredMock": sum(q["eligibleForScoredMock"] for q in questions),
        "missingExplanations": sum(not q["explanation"] for q in questions),
        "withReferences": sum(bool(q["references"]) for q in questions),
        "withAwsReferences": sum(
            any(re.match(r"https?://(?:[a-z0-9-]+\.)*aws\.amazon\.com(?:[/:]|$)", ref, re.I)
                for ref in q["references"]) for q in questions
        ),
        "types": dict(counts),
        "issues": dict(problems),
        "missingNumbers": [n for n in range(1, max(occurrences) + 1) if n not in occurrences],
        "repeatedNumbers": [n for n, count in sorted(occurrences.items()) if count > 1],
        "exactDuplicateGroups": exact,
        "potentialDuplicatePairs": near,
        "csvRows": len(csv_rows),
        "csvUnmatchedEntries": row_mismatches,
        "csvDomainDifferences": differences,
        "domains": [
            {
                "id": domain,
                "name": name,
                "weight": weight,
                "total": sum(q["domain"] == domain for q in questions),
                "eligible": sum(q["domain"] == domain and q["eligibleForScoredMock"] for q in questions),
                "mockTarget": target,
                "topics": dict(sorted(Counter(q["topic"] for q in questions if q["domain"] == domain).items())),
            }
            for domain, (name, weight, target) in DOMAINS.items()
        ],
    }
    return {"schemaVersion": 1, "summary": summary, "questions": questions}


def render_report(bank):
    s = bank["summary"]
    by_id = {q["id"]: q for q in bank["questions"]}

    def names(ids):
        return ", ".join(label(by_id[id_]) for id_ in ids)

    def label(q):
        return f'{q["originalQuestionNumber"]} ({q["id"]})'

    lines = [
        "# AWS Cloud Practitioner question bank validation",
        "",
        f'- DOCX entries extracted and retained: {s["total"]}',
        f'- Structurally valid: {s["structurallyValid"]}',
        f'- Single choice: {s["types"].get("single_choice", 0)}',
        f'- Multiple response: {s["types"].get("multiple_response", 0)}',
        f'- Entries requiring review: {s["needsReview"]} ({s["technicalReview"]} with technical flags)',
        f'- Structurally eligible after known review exclusions: {s["eligibleForScoredMock"]}',
        '- Independently technically verified: 0',
        f'- Entries with AWS references: {s["withAwsReferences"]}',
        "",
        "Structural checks validate the extraction and the recorded key. They do not establish that the key is correct under current AWS guidance. Flagged source keys remain intact and are excluded from scoring. Future mock selection should also avoid choosing multiple entries from the same duplicate group.",
        "",
        "## Domains",
        "",
        "| CLF-C02 domain | Weight | Entries | Eligible | Mock target |",
        "| --- | ---: | ---: | ---: | ---: |",
    ]
    for d in s["domains"]:
        lines.append(f'| {d["name"]} | {d["weight"]}% | {d["total"]} | {d["eligible"]} | {d["mockTarget"]} |')
    lines.extend([
        "",
        "Domain titles and weights follow the [AWS CLF-C02 exam guide](https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/).",
        "",
        "## Structural findings",
        "",
        f'- Missing source numbers: {", ".join(f"Q{n}" for n in s["missingNumbers"]) or "None"}',
        f'- Repeated source numbers: {", ".join(f"Q{n}" for n in s["repeatedNumbers"]) or "None"}',
    ])
    issue_labels = {
        "missing_question": "Missing prompt",
        "missing_options": "Missing answer choices",
        "duplicate_option_ids": "Repeated option labels",
        "missing_answer_key": "Missing answer key",
        "invalid_answer_reference": "Invalid answer references",
        "ambiguous_answer_key": "Ambiguous answer key",
        "answer_count_conflict": "Answer count conflicts",
    }
    for issue, title in issue_labels.items():
        matches = [label(q) for q in bank["questions"] if issue in q["validationIssues"]]
        lines.append(f'- {title}: {len(matches)}' + (f' ({", ".join(matches)})' if matches else ""))
    missing_explanations = [label(q) for q in bank["questions"] if not q["explanation"]]
    lines.append(f'- Missing general explanations: {len(missing_explanations)}'
                 + (f' ({", ".join(missing_explanations)})' if missing_explanations else ""))
    lines.extend(["", "## Duplicate content", "",
                  "Exact groups match normalized question text. Potential duplicates have identical normalized option sets and either a matching final prompt line or at least 88% prompt similarity.", ""])
    lines.extend(f"- Exact: {names(ids)}" for ids in s["exactDuplicateGroups"])
    lines.extend(f"- Potential: {names(ids)}" for ids in s["potentialDuplicatePairs"])
    lines.extend(["", "## Technical review", ""])
    for q in bank["questions"]:
        for review in q["technicalReview"]:
            links = " ".join(f"[AWS reference]({url})" for url in review["references"])
            lines.append(f'- {label(q)} — {review["reason"]}' + (f" {links}" if links else ""))
    lines.extend([
        "",
        "## Preliminary CSV reconciliation",
        "",
        f'The CSV contains {s["csvRows"]} rows. The classification manifest records a prompt-based review against the AWS exam guide. The CSV was used only for comparison.',
        "",
        f'- Different domain assignments in matched rows: {len(s["csvDomainDifferences"])}',
        f'- Question numbers or previews requiring CSV alignment review: {", ".join(s["csvUnmatchedEntries"]) or "None"}',
        "",
    ])
    return "\n".join(lines)


def main():
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("--docx", type=Path, default=SOURCE_ROOT / "AWS CCP MCQs.docx")
    cli.add_argument("--csv", type=Path, default=SOURCE_ROOT / "aws_ccp_domain_mapping.csv")
    cli.add_argument("--classification", type=Path, default=APP / "scripts/aws_ccp_classification.json")
    cli.add_argument("--bank", type=Path, default=APP / "src/aws-practice/question-bank.json")
    cli.add_argument("--report", type=Path, default=APP / "docs/aws-practice-question-bank.md")
    cli.add_argument("--check", action="store_true", help="Check generated files without writing them.")
    args = cli.parse_args()

    bank = build_bank(args.docx, args.csv, args.classification)
    outputs = {
        args.bank: json.dumps(bank, ensure_ascii=False, indent=2) + "\n",
        args.report: render_report(bank),
    }
    for path, value in outputs.items():
        if args.check:
            if not path.is_file() or path.read_text(encoding="utf-8") != value:
                cli.exit(1, f"Generated output differs: {path}\n")
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(value, encoding="utf-8", newline="\n")
    print(f'{bank["summary"]["total"]} questions, {bank["summary"]["needsReview"]} requiring review')


if __name__ == "__main__":
    main()
