# Petty Cash Request System

Power Pages saves employee expense requests, products, and receipts through its
session-authenticated Dataverse Web API. Power Automate should handle manager
approval and accounting integration after a complete submission is available.

## Files

- `New Petty Cash Request.html`: the Power Pages page fragment, including its script and shared template includes.
- `pettycash-api.js`: the same client script, kept separately for development.
- `ITEM_SUGGESTIONS_SETUP.md`: frontend category-name shortcuts, non-destructive row selection, editable starter lists, save/retry locks and request-HTML-only deployment.
- `Petty Cash Receipts.html`: complete generated Source for the new Petty Cash Receipts Web Template; pinned PDF library and receipt module already wrapped.
- `pettycash-receipts.js`: up to 10 ordered JPG/PNG images combined locally into one previewable PDF, or one unchanged existing PDF; limits and safe preparation cache.
- `RECEIPT_PDF_SETUP.md`: dependency, two-part website deployment, limits, retry behavior and live test checklist.
- `tests/pettycash-api.test.cjs`: local regression tests using simulated portal and Dataverse responses.
- `DATAVERSE_SETUP.md`: required mappings, site settings, permissions, and live verification steps.
- `WEBAPI_SITE_SETTINGS.md`: prepared explicit field lists and the remaining live mapping checks.
- `My Petty Cash Requests.html`: source for the live employee page named **My Requests**; balance and request-status dashboard. Filename retained; confirmed partial URL `My-Requests`.
- `Finance Cash Management.html`: Finance-only employee balance, cash-given/returned form, preview/confirmation and ledger history. Posting disabled until the secured backend is configured.
- `FINANCE_SETUP.md`: current Finance role/read permissions, three-source publication and required posting-flow contract/testing; no live flow deployed.
- `FINANCE_FLOW_SETUP.md`: complete manual Finance flow build, inputs, action layout, validation, operator lookup, same-key recovery, ledger scan, outputs and live tests. Not an importable or tenant-tested flow.
- `finance-cash-request.schema.json`: request eventData schema, not an importable flow or server authorization implementation.
- `Accounts Cash Management.html`: retired historical draft; do not publish it alongside Finance. New shared code leaves it disabled.
- `pettycash-modules.js`: canonical shared ledger/dashboard/Finance JavaScript (finance-ledger-v2); paste inside script tags in the `Petty Cash Modules` Web Template. Handles inline-hidden Finance containers after the role check and ignores repeated same-version loads.
- `Petty Cash User Context.html`: shared escaped identity and cosmetic Admin/Finance role markers (web-template-v2-finance); actual server page/table/flow permissions remain mandatory.
- `pettycash-module-config.example.js`: Finance flow configuration mirrored in the Finance HTML; blank/disabled by default. Old Accounts config flags no longer enable posting.
- `BALANCE_MODULE_SETUP.md`: exact confirmed ledger mappings, roles/permissions, new page deployment, and backend contract.
- `Admin Users.html`: seven-field profile-only edition, with separate username and zero new balance. No password controls; use Management Change Password on the saved Contact. Paired page/template deployment required.
- `pettycash-admin.js`: version admin-profiles-v2 for Petty Cash Admin template; public profile-only POST/read-back, duplicate checks, safe retries and redacted errors. No password path, ledger entries or existing-user/balance updates.
- `pettycash-admin-config.example.js`: mirrored in Admin Users.html; profile creation enabled for the user-reviewed admin-only setup. Missing script configuration still defaults to disabled; old credential switches are removed.
- `ADMIN_PROFILE_SETUP.md`: current Admin configuration, password-free API union, deployment, security boundaries and separate Management password setup.
- `ADMIN_USER_SETUP.md`: current Admin permissions/metadata/deployment checklist and unresolved native login/email provisioning.
- `ADMIN_CREDENTIAL_SETUP.md`: historical failed credential experiment and supported Management test results; superseded by ADMIN_PROFILE_SETUP.md. Do not re-enable that path.
- `IMPLEMENTATION_LOG.md`: dated inventory of every new page/function/column/configuration requirement and its deployment state.
- `scripts/correct_project_docs.py`: localized Word corrections with source backups and comments; prepares candidates for visual verification.
- `scripts/finalize_project_docs.py`: guards publication with backup/hash, PDF-content, and rendered-page checks for this documentation revision.
- The three root Word documents are corrected and visually verified against all 13 pages of the user's Office exports. Pre-edit copies remain in `documentation/backups/2026-10-12`. Use the Markdown guides for exact deployment steps and implementation status.

## Current implementation

Balance viewing uses only the signed-in Contact GUID and the authorized cash
ledger, independently of department/manager profile readiness. Deploy the
updated request-page HTML for this fix; shared templates and permissions are
unchanged. Request submission still waits for the Contact profile and requires its Department
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

A receipt is mandatory. The page accepts one PDF or up to 10 JPG/PNG images
combined locally into one PDF before request writes. Previews create no records;
partial-save retries retain the exact prepared PDF. Publish the new receipt
Web Template and updated HTML together; see RECEIPT_PDF_SETUP.md.
The form rejects a missing receipt before any API
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
node scripts/build_receipt_template.cjs
node --test --test-isolation=none tests/pettycash-api.test.cjs tests/pettycash-modules.test.cjs tests/pettycash-admin.test.cjs tests/pettycash-receipts.test.cjs tests/pettycash-suggestions.test.cjs
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
user. The ledger drives displayed signed balances; the Admin creation form now
initializes a new Contact summary to zero only. Existing summaries are not
directly updated by the browser. Cash posting is a prepared client contract,
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
