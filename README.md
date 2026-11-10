# Petty Cash Request System

Power Pages website backed by Dataverse and Power Automate. Start with the
[handover guide](documentation/handover/HANDOVER.md),
[acceptance checklist](documentation/handover/HANDOVER_CHECKLIST.md), or
[project folder guide](documentation/PROJECT_STRUCTURE.md).

## Find the files

| Folder | Contents |
|---|---|
| [pages/](pages/README.md) | New Request, My Requests, Finance, Admin and Home; each page's source and related guides |
| [shared/](shared/README.md) | Reused balance/clarification module, receipts, user context, header/footer and common styles |
| [flows/](flows/README.md) | Finance, approval and clarification flow guides, contracts and supplied JSON snapshots |
| [documentation/](documentation/README.md) | Handover, platform configuration, original/corrected Word files, QA and deferred plans |
| `scripts/` | Build tools and local verification scripts |
| `tests/` | Automated regression tests |
| `vendor/` | Pinned jsPDF library and its license |

The folder move changes local organization only. Website partial URLs, Liquid
Web Template names, flow IDs, security configuration and published app contents
are unchanged. Open files from their new locations; do not create extra tenant
pages/templates just because local folders changed.

## Main publishing sources

| Power Pages destination | Local source |
|---|---|
| New request page | [New Petty Cash Request.html](<pages/new-request/New Petty Cash Request.html>) |
| My Requests page (`My-Requests`) | [My Petty Cash Requests.html](<pages/my-requests/My Petty Cash Requests.html>) |
| Finance page | [Finance Cash Management.html](<pages/finance/Finance Cash Management.html>) |
| Admin page | [Admin Users.html](<pages/admin/Admin Users.html>) |
| Home page / Home Web Template | [Home.html](pages/home/Home.html) / [Petty Cash Home.html](<pages/home/Petty Cash Home.html>) |
| Header / Footer Web Templates | [Header.html](shared/shell/Header.html) / [Footer.html](shared/shell/Footer.html) |
| Petty Cash Modules Web Template | [pettycash-modules.js](shared/modules/pettycash-modules.js), inside script tags |
| Petty Cash Admin Web Template | [pettycash-admin.js](pages/admin/pettycash-admin.js), inside script tags |
| Petty Cash Receipts Web Template | [Petty Cash Receipts.html](<shared/receipts/Petty Cash Receipts.html>) already includes the wrapper/library |
| Petty Cash User Context Web Template | [Petty Cash User Context.html](<shared/identity/Petty Cash User Context.html>) |

Keep the working site configuration when publishing. Reusable `.example.js`
configuration remains intentionally disabled. Never publish archived material
as the current implementation.

## Build and verify

Run from this project folder with Node.js:

```powershell
node scripts/build_request_page.cjs --check
node scripts/build_ui_styles.cjs --check
node scripts/build_home_template.cjs --check
node scripts/build_shell_template.cjs --check
node scripts/verify_handover.cjs --date 2026-11-09
```

Omit `--check` from a build command only when regenerating its HTML after a
source change. `build_receipt_template.cjs` regenerates the bundled receipts
template from local pinned assets; `--fetch` is an explicit dependency download.
Use the actual audit date for subsequent handover audits. Browser verification
scripts use the existing local Playwright runtime and intercepted test data.
Set `PC_QA_OUTPUT_ROOT` to a separate folder when retaining existing QA evidence.

## Current status and history

Manager clarification -> employee answer -> automatic new approval email is
user-confirmed working. Final financial, boss/rejection, access and handover
checks are tracked in the acceptance checklist. The live-read/cache freshness
upgrade is [deferred at the user's request](documentation/plans/DATA_FRESHNESS_PLAN.md).
ERP synchronization is not an established delivered capability.

The full earlier README is preserved in the
[archive](documentation/archive/README-before-organization.md). Supplied flow
snapshots and older Word documents are evidence/reference material; they are
not complete current native exports. See the
[implementation log](documentation/handover/IMPLEMENTATION_LOG.md) for the change history.
