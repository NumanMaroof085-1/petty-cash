# Petty Cash Request System

Power Pages saves employee expense requests, products, and receipts through its
session-authenticated Dataverse Web API. Power Automate should handle manager
approval and accounting integration after a complete submission is available.

## Files

- `New Petty Cash Request.html`: the Power Pages page fragment, including its script and shared template includes.
- `pettycash-api.js`: the same client script, kept separately for development.
- `tests/pettycash-api.test.cjs`: local regression tests using simulated portal and Dataverse responses.
- `DATAVERSE_SETUP.md`: required mappings, site settings, permissions, and live verification steps.
- `WEBAPI_SITE_SETTINGS.md`: prepared explicit field lists and the remaining live mapping checks.
- `My Petty Cash Requests.html`: source for the live employee page named **My Requests**; balance and request-status dashboard. Filename retained; confirmed partial URL `My-Requests`.
- `Accounts Cash Management.html`: restricted accounts page fragment; cash posting disabled until the secured backend is configured.
- `pettycash-modules.js`: canonical shared ledger/dashboard/accounts JavaScript; paste inside script tags in the `Petty Cash Modules` Web Template.
- `Petty Cash User Context.html`: Source for the `Petty Cash User Context` Web Template; renders escaped dynamic user inputs and the cosmetic Accounts-role indicator outside editable page attributes.
- `pettycash-module-config.example.js`: accounts flow configuration example; blank/disabled by default.
- `BALANCE_MODULE_SETUP.md`: exact confirmed ledger mappings, roles/permissions, new page deployment, and backend contract.
- `IMPLEMENTATION_LOG.md`: dated inventory of every new page/function/column/configuration requirement and its deployment state.
- `scripts/correct_project_docs.py`: localized Word corrections with source backups and comments; prepares candidates for visual verification.
- `scripts/finalize_project_docs.py`: guards publication with backup/hash, PDF-content, and rendered-page checks for this documentation revision.
- The three root Word documents are corrected and visually verified against all 13 pages of the user's Office exports. Pre-edit copies remain in `documentation/backups/2026-10-12`. Use the Markdown guides for exact deployment steps and implementation status.

## Current implementation

The client waits for the signed-in Contact profile and requires its Department
and Reports To Manager lookups. It reads only that employee Contact, not the
manager's Contact; the manager GUID comes from the employee profile lookup and
is still bound and verified on the Request. Self Read plus a separate proposed
Append-only manager binding permission has user-confirmed live submission
success. User's console screenshot also confirms a manager Contact balance
read is denied with HTTP 403. Other role/record and Request/ledger isolation
tests remain pending; this single check is not a full security certification.
This corrects the earlier Append-To-only instruction after the user's association
403: Contact is the lookup target in Power Pages' permission check, not the source.
It checks that the requested columns are readable
before saving, sends one complete header payload, and reads the saved fields back.
It then saves and verifies each product before uploading the receipt. The user
confirmed that `hr_totalprice` is a Simple currency column, so the client now
saves Quantity multiplied by Unit Price on each line and verifies it. Each
line total is rounded to two decimal places; the displayed and saved grand
total is the sum of those rounded line totals.

A receipt is mandatory: the form rejects a missing receipt before any API
calls or writes, and does not report success if its upload fails. This is a
client-side requirement; server-side completeness validation remains necessary.

Errors never cause selected fields, lookups, or categories to be removed from a
payload. Success is shown only after these operations succeed. Confirmed partial
saves can resume on the same open page, without recreating already saved rows.
Ambiguous create results stop further attempts and display a reference for an
administrator to check.

The user confirmed that `hr_othercategory` (schema name `hr_OtherCategory`)
belongs to the **Petty Cash Line Item** table, not the request table. Both
scripts now save and verify its text on every line when the form category is
Others. Standard categories omit it. Header payloads, read checks, and field
settings no longer include it. The form has one category for the whole request,
so every product receives the same category and Other Category description.

The request's `hr_department` column (schema name `hr_Department`) and the
Department entity set `hr_departmentses` are confirmed. Both scripts use that
entity set for reads and lookup bindings.

The user also confirmed the Department table logical name `hr_departments` and
its text/name column `hr_departmentname`. Site settings now use the correct
table name, and Department read checks select that known name column. The
client does not need to guess the Department GUID-key column name.

The Department lookup's exact navigation property and other configuration
values still need live verification if the binding fails. A lookup column's
schema name does not prove its navigation property. The configured Pending and
Not Synced choice integers also require confirmation; they are sent explicitly
instead of depending on table defaults.

## Run local checks

With Node.js 22 or later:

```powershell
node --check pettycash-api.js
node --test --test-isolation=none tests/pettycash-api.test.cjs tests/pettycash-modules.test.cjs
```

These tests make no network requests. They verify field preservation, read-back
checks, sign-in requirements, duplicate-click handling, partial-save retries,
receipt failures, mapping overrides, and synchronization of the two scripts.

## Deployment

All three pages first include `{% include 'Petty Cash User Context' %}`, then
load the shared script through `{% include 'Petty Cash Modules' %}`. Create the
User Context template using the complete matching local HTML file; do not also
retain the old hidden identity inputs in page Copy. The Modules template Source must contain
the complete `pettycash-modules.js` wrapped in script tags; the user reports the
template created on 2026-10-13 and its global object loaded. Its identity probe
renders the real signed-in GUID; the page-copy inputs instead rendered column
names. After the separate context template instructions, the user confirmed
the request-page balance displays live. Nonzero totals and cross-user access
are not yet verified. Remove the temporary identity probe from Modules Source.
No JavaScript Web File upload is required.
The request's inline script remains embedded;
do not additionally load `pettycash-api.js`. The two new page fragments load
the same shared script. Follow BALANCE_MODULE_SETUP.md for their deployment.

Cash Transaction table metadata and choice integers were confirmed by the
user. The ledger drives displayed signed balances; the Contact summary is not
directly written by the browser. Cash posting is a prepared client contract,
not a deployed flow or server-side posting implementation. On 2026-10-13 the
user reported Posting Key `crec6_postingkey` (schema `crec6_PostingKey`) created
with its alternate key Active. This replaces the earlier proposed `hr_postingkey`.
The user also confirmed the Cash Transaction field list/enabled setting and
Contact-scoped Read-only permission assigned to Authenticated Users. Other
Accounts page/flows and broader live authorization tests remain unconfirmed.
The user reports the employee dashboard working under the page name `My Requests`;
its confirmed partial URL is `My-Requests`. Signed-out/cross-employee tests remain
unconfirmed. Preserve the configured URL casing; no page/source rename is needed.
The reviewed
2026-10-12 Word snapshots retain the old posting-key proposal and Web File
deployment approach and page-inline user context; use BALANCE_MODULE_SETUP.md
and IMPLEMENTATION_LOG.md for the current mapping and Web Template deployment.

Confirm the mappings and portal configuration in `DATAVERSE_SETUP.md`, then
replace the custom code of the New Petty Cash Request page with the HTML file.
That file already contains the script. Do not additionally load the standalone
JavaScript on the same page.

The user confirmed the earlier request submission works live. No new module
deployment or authenticated balance/flow verification has been performed from
this workspace. Local tests do not verify your tenant's actual metadata,
permissions, file-column behavior, or Power Automate flows.

## Submission and approval boundaries

The header, products, and receipt are separate operations, not a database
transaction. Retry state is kept in memory on the current page only; reloading
or closing the page loses it. Inspect partial requests before attempting a new
submission. Existing incomplete requests are not automatically repaired.

Do not trigger financial processing merely because the header was created. The
approval workflow must wait for a server-validated complete submission. A next
step is a completion flag or submission state checked on the server, or an atomic
header-and-products deep insert after verifying the collection relationship.
Neither a browser verification nor a sequence of Power Automate Add a new row
actions alone provides an atomic transaction or trusted financial validation.
