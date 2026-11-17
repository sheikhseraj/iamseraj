# AWS Cloud Practitioner Practice Lab

The lab is integrated into the React portfolio at `/aws-practice`. Use it to practise by block, domain or topic, run timed 65-question mock exams, review flashcards and mistakes, bookmark questions, and track performance. This independent learning tool has no affiliation with or endorsement from AWS.

## Run locally

Use Node.js 22.12 or later. The checks below were run on Node.js 24.

From `D:\Project_All\Portfolio\portfolio-v2\Portfolio v02`:

```powershell
npm ci
npm run dev:web
```

Open `http://localhost:5173/aws-practice`, or follow **AWS Practice Lab** from the portfolio menu under **Tools** (`/tools`). Guest practice can run with Vite alone. To test accounts, configure MySQL in `.env` using the existing `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` settings, then run:

```powershell
npm run migrate:aws-practice
npm run dev
```

On a deployed site, apply the migration to the target MySQL database and serve the portfolio over HTTPS. The account API expects same-origin requests. If the app sits behind a TLS-terminating proxy, configure `TRUST_PROXY_HOPS` for the actual proxy chain or set `AWS_PRACTICE_ORIGIN` to the public HTTPS origin.

## Refresh the question bank

Use Python 3.10 or later. The importer uses the standard library to read the Word document’s Open XML paragraphs, line breaks and hyperlinks. The default input paths point to `AWS CCP MCQs.docx` and `aws_ccp_domain_mapping.csv` two directories above the app. Use `--docx` and `--csv` for alternate locations. Input files are read-only.

```powershell
python -B scripts/import_aws_ccp.py
python -B scripts/import_aws_ccp.py --check
```

The generated files are `src/aws-practice/question-bank.json` and [the question bank validation report](docs/aws-practice-question-bank.md). IDs are assigned in source order. Repeated source numbers retain separate entries and occurrence numbers. Keep existing source order when adding questions so future progress can continue to identify the same questions.

Add new entries to the authoritative DOCX and add the corresponding classification key to `scripts/aws_ccp_classification.json`. Its row format is `[domain, topic, subtopic, source numbers]`. Number ranges are inclusive and `105#2` means the second occurrence. Classification uses the meaning of each prompt relative to the official exam task statements. CSV rows are compared against the final choices by number and preview. Maintain a short review reason and AWS reference in the manifest when a key or statement needs follow-up.

## Checks

```powershell
python -B -m unittest discover -s tests -p test_aws_ccp_import.py
npm test
npm run build
```

Structural validation checks prompts, choices, answer references, format and counts. It preserves questionable answer keys and flags known issues. The bank records structural validation separately from independent technical verification. The mock exam excludes flagged entries and draws at most one entry from each detected duplicate group.

## Practice and mock exam scoring

Sessions store your position and selections. Practice shows the source explanation after Check answer. A multiple-response answer is correct when the selected choices match the complete source answer set. Structurally valid but flagged practice items carry a review notice. Incomplete items remain searchable.

The mock exam uses 16 Cloud Concepts, 20 Security and Compliance, 22 Cloud Technology and Services, and 7 Billing, Pricing, and Support questions. The countdown runs for 90 minutes, including after refresh. An expired session is scored when it expires or when you next open the lab. The percentage counts unanswered items against the total, and the configurable 70% default target is a study benchmark. Practice results report accuracy among submitted answers and show skipped questions separately.

Completion counts distinct attempted practice-bank questions across both modes. Practice accuracy, first-attempt accuracy, and latest-attempt accuracy use practice answers only. Domain and topic accuracy use the latest answer per question across both modes. The unofficial readiness estimate appears after 20 unique questions have been practised. It combines completion and first-attempt accuracy equally until a mock exists, then weights those two measures at 30% each and the latest mock at 40%.

## Progress and flashcards

Guest progress is stored in IndexedDB under the current browser origin. Signed-in progress is stored in MySQL and includes answer history, active sessions, mock results, flashcards, bookmarks, issue notes, and preferences. The lab uses a username and password independent of portfolio administrator accounts. Lab accounts do not use email or email-based password recovery. The Account page can copy guest progress into the account after confirming replacement. Signing out switches back to the guest profile. Use Export progress on the Progress page to download a JSON backup. Import validates a selected file and shows a preview before you confirm replacement. Reset clears lab progress after confirmation. If browser storage is blocked, the lab displays a message and keeps changes only for the open page.

Question flashcards show the prompt and source answers. Concept flashcards show the same source-supported prompt with an explanation on the back. Review again schedules a review in 10 minutes and adds the card to the review queue immediately. Know it starts at one day and doubles the scheduled interval up to 30 days. Reviews are tracked separately for each card type. Report issue saves a private note with your progress and includes it in exported backups.
