# Project organization - 9 November 2026

The workspace is organized by page, shared feature and native flow. Only
README.md and .gitignore need to remain as root files; existing scripts, tests,
vendor assets and documentation remain grouped in their own directories.

```text
petty-cash/
  README.md
  pages/
    new-request/    my-requests/    finance/    admin/    home/
  shared/
    modules/    receipts/    identity/    shell/    styles/
  flows/
    finance/    approval/    clarifications/    diagnostics/
  documentation/
    handover/    platform/    originals/    corrected/
    archive/     plans/       backups/      qa/
  scripts/
  tests/
  vendor/
```

Each page directory contains its HTML and any page-specific JavaScript/styles
or setup guides. Reused templates/assets are in shared. Flow folders contain
guides and exact received evidence, not invented deployable exports. The
[root README](../README.md) lists the actual Power Pages publishing sources.

## Preservation and cleanup

66 existing files were relocated. Files with ongoing references were archived
rather than discarded: the retired Accounts page, two older admin guides, the
one-time Finance repair helper and previous README. Current app HTML/JS/CSS,
Word/PDF originals/corrected copies/backups, vendor files/licenses and supplied
JSON snapshots retain their original bytes. Only development tooling, document
navigation and generated audit metadata need reference updates.

Removed seven ignored synthetic receipt-test outputs, totaling 1,026,441 bytes:

- `tmp/pdfs/picker-desktop.png` and `picker-mobile.png`.
- `tmp/pdfs/receipt-page-1.png` through `receipt-page-4.png`.
- `tmp/pdfs/receipt-preview.pdf`.

These are reproducible outputs of scripts/verify_receipt_upload.cjs, not employee
attachments. The existing documentation/qa evidence and backups are preserved.
The temporary organization utilities are removed after checks. Native temporary
flows are unaffected and must be disabled separately in Power Automate.

The [organization report](handover/file-organization.json) records every old/new
path, original size/hash, explicit deletions and final preservation result.
The [handover verification](handover/verification.json) records current links,
generated-template checks and regression results. No git history, staged state,
website route, Liquid template name, flow ID, approval logic or financial data
has been changed as part of this cleanup.

Final checks: all 140 retained existing files accounted for; 85 protected files
byte-identical; no unexpected changes. All 157 regression tests, 119 Markdown
links, generated-template checks and eight mocked browser suites passed. One
existing shell integration fixture was updated to recognize the already deployed
clarification read endpoint; website application code was not changed.

Run all scripts from the project root as shown in README.md. Source files in
their new folders remain the same publishing artifacts; no site republishing
is required just because the local files moved.
