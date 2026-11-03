# Documentation correction status

## Current company handover baseline

As of 2 November 2026, the maintained entry point is
[HANDOVER.md](../HANDOVER.md), with
[OPERATIONS_RUNBOOK.md](../OPERATIONS_RUNBOOK.md),
[HANDOVER_CHECKLIST.md](../HANDOVER_CHECKLIST.md) and
[DOCUMENTATION_AUDIT.md](../DOCUMENTATION_AUDIT.md).
Local verification/source hashes are in handover/verification.json.

The new product Unit dropdown and `hr_unit` column/API publication are covered in
[PRODUCT_UNITS_SETUP.md](../PRODUCT_UNITS_SETUP.md). These implementation details
are part of the current Markdown baseline, not the historical Word schema.

The three root Word documents, corrected copies and PDFs below are **historical
references**, not the final implementation specification. Their text still
includes the old hr_postingkey/Accounts proposal and omits later features.
They have not been reissued or newly render-approved for company handover.
Do not hand them over as current standalone schema/configuration instructions.

## Historical Word correction milestone

The following is the record of the earlier correction and visual-review work,
not a current deployment or handover sign-off. Older backup/QA paths may not be
present in every checkout; do not infer current verification from this narrative.

At the earlier correction milestone, the three root Word documents were corrected
and finalized for that revision only. Their complete
Office-exported PDFs were rasterized with bundled Poppler and all 13 pages
were visually inspected on 2026-10-12. The reviewed copies remain in `corrected/`.
Backups of the exact pre-edit originals are in `backups/2026-10-12/`.

Corrections include Simple currency Total Price, Line Item Other Category,
correct Department logical/entity-set names, mandatory receipt, explicit field
lists, signed-balance semantics, reuse of Cash Transaction, zero starting
balance, employee/accounts modules, and proposed posting-key/permission/flow
requirements. Word comments mark the correction points. The user's added
overview modules are preserved and updated rather than replaced wholesale.

Verification covered six schema pages, four overview pages, and three
configuration pages. Correction comments were retained and are visible as
side balloons in the user's review PDFs. Content/ZIP checks confirmed the
required changes and comments; final root files match the reviewed DOCX hashes.
`qa/word-verification.json` records page counts and original/corrected/PDF hashes.
The user's modified overview modules and existing document structure are preserved.

The bundled DOCX renderer had no LibreOffice on this Windows runtime, and
automated Word export stalled. The user exported the corrected copies in
Office; those complete PDF exports supplied the final visual-verification route.
No Word application was closed or user document edited through automation.

The current, usable implementation/deployment documentation is in
`../README.md`, `../IMPLEMENTATION_LOG.md`, `../BALANCE_MODULE_SETUP.md`,
`../DATAVERSE_SETUP.md`, and `../WEBAPI_SITE_SETTINGS.md`.

## Verification for future corrections

Open the three non-raw files in `corrected/` in Office and use Save As or Export
to save a PDF alongside each corrected DOCX, using the same base filename:

- Petty Cash App - Database Schema.pdf
- Petty Cash Request System - Project Overview.pdf
- Configuration document.pdf

For a future change, create a fresh backup before editing. Do not reuse an old
PDF to approve changed Word content. Render the latest corrected copy, inspect
every page, and then publish it. `scripts/finalize_project_docs.py` validates
the current revision and rejects unexpected original-file changes; it is not a
general replacement tool for later edits. Any content changes made during
manual review must be saved in the corrected DOCX before exporting its PDF.
