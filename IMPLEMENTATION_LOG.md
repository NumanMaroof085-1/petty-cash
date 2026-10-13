# Implementation and configuration log

Every implementation must update this log and its detailed setup guide in the
same change. Record exact files, functionality, schema names, permissions, site
settings, tests, and deployment state. Never describe a proposed tenant change
as deployed merely because local code or documentation exists.

## 2026-10-13 Current permission list reviewed

- User's current list shows Cash Transaction Contact-scoped Read only.
- Contact - Lookup: Global Read, Append, Append To; no Write/Create/Delete.
- Department - lookup: Global Read, Append, Append To; no Write/Create/Delete.
- Petty Cash Line Item - Create: Global Read, Create, Append, Append To;
  no Write/Delete.
- Petty Cash Request - Create: Global Read, Write, Create, Append, Append To;
  no Delete.
- Assigned web roles are not visible. Need roles for Contact, Request, and
  Line Item permissions to establish which users inherit these global grants.
  If assigned to Authenticated Users, broad reads/writes conflict with employee
  isolation. No tenant permissions changed. Retain working submission/receipt
  and manager-lookup requirements while planning scoped replacements.

## 2026-10-13 Request-page balance display confirmed live by user

- After the User Context template deployment instructions, the user reports
  the request-page balance now displays instead of Unavailable. This is a live
  UI result reported by the user, not an independently inspected tenant trace.
- The displayed amount, nonzero ledger arithmetic, another employee's access,
  anonymous behavior, and cash posting/approval effects were not demonstrated.
  Do not treat this as verification of all financial or authorization behavior.
- No new code or tenant changes by the assistant in this confirmation step.
  Next gate is review of current Request permissions/web roles before publishing
  My Petty Cash Requests: Contact-scoped via Submitted By, with no overlapping
  Global employee reads. Preserve working submission/receipt privileges.
  Accounts posting and approval/backend work remain pending.

## 2026-10-13 User context moved from page attributes to a Web Template

- Live user output confirms the Modules global is an object. Request-page
  hidden identity attributes rendered literal `id` / `contactid`, even after
  a version-marker update. This stopped profile loading before any ledger read.
- An isolated probe in the existing Modules Web Template returned the same real
  signed-in Contact GUID for `user.id` and `user.contactid`. This confirms the
  Web Template context works in that session; the exact page-attribute rewriting
  or preview mechanism has not been established.
- Added `Petty Cash User Context.html`, Source for a new Web Template named
  exactly `Petty Cash User Context`. It renders escaped dynamic Contact ID,
  name/email, module ID, and the Accounts-role indicator. No hardcoded identity.
  It is a new required website record, locally prepared, not yet tenant-confirmed.
- All three local pages include User Context once before Modules. Removed page
  user-input attributes and the Accounts page's inline role check. Removed unused
  Department/Manager hidden inputs; profile lookups still come from the existing
  authenticated Contact API. Existing JavaScript input IDs/API contract unchanged.
- Role indicator is cosmetic only. Server page/flow/table authorization remains
  required; Accounts posting defaults remain disabled. No new column, table,
  financial rule, permission, site setting, or flow was implemented here.
- Added context-template regression checks and updated local browser QA to
  simulate both includes and verify one dynamic GUID input per expected ID.
- Updated README.md, BALANCE_MODULE_SETUP.md, and DATAVERSE_SETUP.md. Prior
  reviewed Word snapshots remain dated 2026-10-12 and contain old page-inline
  identity instructions; current Markdown guides supersede those instructions.
- Deployment: create User Context template from its local Source; replace page
  HTML with updated versions; remove temporary `pcIdentityProbe` from Modules
  Source without changing its script; sync and verify the dynamic GUID, then
  ledger balance. Actual ledger access and cross-user authorization still need
  live verification. Local tests cannot emulate the site's full Liquid engine.
- Verification: all 45 local unit/regression tests passed, including script
  synchronization and identity/include checks. Hidden Chrome dashboard and
  Accounts checks passed on desktop/mobile with simulated template output,
  one expected GUID input per ID, and mock API responses. No tenant writes.

## 2026-10-13 Shared Web Template replaces Web File upload

- User reports creating the `Petty Cash Modules` Web Template after the `.js`
  Web File upload failed with HTTP 400 on the enhanced-model
  `powerpagecomponents(...)/filecontent` path. Error response was evicted from
  DevTools; exact cause remains unknown. No attachment security list changed.
- Updated New Petty Cash Request.html, My Petty Cash Requests.html, and
  Accounts Cash Management.html to include the exact template name once with
  `{% include 'Petty Cash Modules' %}`, removing the external Web File request.
- Template Source must wrap the full canonical pettycash-modules.js in script
  tags. Changes to that JavaScript require updating the tenant template Source.
  Include goes in Liquid-rendered HTML, not the Custom JavaScript field.
- Updated the missing-module diagnostic in both the embedded submission script
  and pettycash-api.js. No expense/cash payloads or financial rules changed.
  Accounts remains disabled until its secured backend is configured/reviewed.
- Added a regression test for one include per page, load order, no old external
  dependency, and script safety inside the template. Browser QA now simulates
  the Liquid include using canonical source, not a mocked Web File request.
- Updated BALANCE_MODULE_SETUP.md, README.md, and DATAVERSE_SETUP.md. The
  2026-10-12 reviewed Word files/scripts remain historical snapshots of the old
  Web File approach; this guide/log supersedes that deployment instruction.
- Tenant template creation is user-reported; page deployment, CSP behavior,
  module execution, cross-employee authorization, and flows remain unverified.
- Verification: all 44 local unit/regression tests pass. Hidden Chrome checks
  pass for employee and Accounts pages on desktop/mobile with the simulated
  inline template and intercepted mock APIs only. No tenant data was accessed.

## 2026-10-13 Cash Transaction read settings reported configured

- User reports the requested Cash Transaction API settings and employee read
  permission are done. Screenshot verifies saved `Webapi/hr_cashtransaction/fields`
  on the Petty Cash website with `_hr_employee_value,_hr_linkedrequest_value,createdon,hr_amount,hr_notespurpose,hr_transactionreference,hr_transactiontype`.
- Saved permission: `Cash Transactions — Employee Read`; table
  `hr_cashtransaction`; Contact access; exact relationship
  `hr_cashtransaction_Employee_contact`; Read checked, Write unchecked.
- In a follow-up the user explicitly confirmed the Authenticated Users web
  role is assigned, only Read is allowed, and
  `Webapi/hr_cashtransaction/enabled=true` is created. These details are
  user-reported; no authenticated API/ownership test has been run.
- Historical next step (superseded by the Web Template entry above): publish `/pettycash-modules.js` as a Web File under Home with
  Published state and the local JavaScript attached as a Note. This is an
  instruction, not a reported completed deployment. Audit overlapping Global
  permissions before exposing the employee dashboard or enabling posting.
  Existing Contact/Request permissions must be inspected before changing them
  so the working submission and manager/department reads are preserved.
- Documentation updated only; no runtime code or tenant changes by assistant.

## 2026-10-13 Posting key confirmed by user

- Cash Transaction Posting Key schema: `crec6_PostingKey`; logical name:
  `crec6_postingkey`. The user reports the alternate key status is Active.
- This supersedes the earlier proposed `hr_PostingKey` / `hr_postingkey`.
  No duplicate column is needed. Backend Dataverse mappings must use the
  confirmed name; the browser JSON property remains `postingKey`.
- Updated BALANCE_MODULE_SETUP.md, WEBAPI_SITE_SETTINGS.md, and README.md.
  No runtime code, tenant setting, role, page, or flow was changed by the assistant.
- Confirmation is user-reported, not independently verified. Column type,
  length, and key membership were not separately shown in this update.
- The three reviewed Word documents and their regeneration/verification scripts
  remain dated 2026-10-12 snapshots, containing the old proposed column name.
  Use this entry and the current setup guide for the actual backend mapping;
  a future Word revision needs fresh export/render review, not the old PDFs.

## 2026-10-12 Balance modules

### Confirmed business rules and existing schema

- All employees start at zero; no opening-balance transaction is required.
- Positive means company cash held; negative means company owes the employee.
- Cash given, including reimbursement, adds to balance (Advance Given 123140000).
- Approved expense subtracts once (Expense Approved 123140001); both payment sources count.
- Cash returned by employee subtracts (Cash Returned 123140002). No arbitrary manual adjustments are implemented.
- Existing Cash Transaction logical name: `hr_cashtransaction`; entity set: `hr_cashtransactions`.
- Existing columns: `hr_employee`, `hr_transactiontype`, `hr_amount`, `hr_linkedrequest`, `hr_transactionreference`, `hr_notespurpose`.
- Existing Contact summary: `hr_currentbalance`. No extra balance table is created or required.

### Locally implemented

| Artifact | Functionality | Deployment state |
| --- | --- | --- |
| New Petty Cash Request.html / pettycash-api.js | Read-only balance widget, Refresh button, signed-balance explanation; balance failure does not break working request submission | Local changes; not deployed by this assistant |
| My Petty Cash Requests.html | New employee page: ledger-derived balance, own requests, saved approval status, manager comments, Refresh | Local page fragment; page/template must be created in Power Pages |
| Accounts Cash Management.html | New accounts page: employee selection, balance, cash-given/cash-returned inputs, notes, server-confirmed posting | Local page fragment; posting disabled by default |
| pettycash-modules.js | Shared Web API reads, complete same-origin paging, ownership checks, money validation, ledger sum, safe text rendering, CSRF-protected flow transport and same-key retry protection | Initially Web File; replaced by shared Web Template on 2026-10-13 (see above) |
| pettycash-module-config.example.js | Per-site flow GUID and security-review switch; no secret URLs or credentials | Template example only; blank/disabled by default |
| tests/pettycash-modules.test.cjs | Ledger signs, empty balance, duplicate expense detection, ownership/paging security, flow transport/confirmation/retries | Local mocked tests; no tenant writes |
| scripts/verify_module_pages.cjs | Hidden-browser desktop/mobile checks with intercepted local mock APIs; plain-text manager-comment rendering | Verified locally; no Dataverse connection |
| scripts/correct_project_docs.py | Surgical schema, overview, and configuration corrections; source backups and Word comments | Corrected root Word documents finalized after PDF review |
| scripts/finalize_project_docs.py | Validates backup/current/corrected hashes, required text in DOCX and PDF, comment preservation, and rendered page counts before replacing originals | Ran successfully; originals backed up and verified replacements published locally |

### Documentation verification completed

Corrected Word candidates are in `documentation/corrected`. The selected
Windows runtime has no bundled LibreOffice; the supplied renderer fails to
resolve soffice.exe. A hidden Word-export fallback initially failed to start.
A follow-up connected to the already-open Word instance, but PDF export still
stalled without producing files. Only its verified helper was stopped; the
user's Word process/document was not closed. The user then exported all three
corrected copies to PDF in Office. Bundled Poppler rendered all pages, and
the assistant visually reviewed all 13 pages: schema 6, overview 4, configuration 3.
Content/ZIP/comment checks passed and the finalizer verified source backups and
PDF freshness before replacing the three root Word files. Original pre-edit
copies, including the user's modified overview, are preserved under
`documentation/backups/2026-10-12`; reviewed root files match corrected-copy
hashes. The QA manifest is `documentation/qa/word-verification.json`.
The renderer script can reuse an active Word instance, checks for unsaved
candidate changes, exports existing saved candidates without saving/closing
them, and closes only documents it opened itself. Manual Office PDF export
instructions in documentation/README.md document the fallback used to finish
this verification. No tenant configuration or financial posting occurred.

### Tenant changes required but not yet performed

- Posting Key was proposed here as `hr_postingkey`; creation and Active key
  were subsequently reported on 2026-10-13 as `crec6_postingkey` (see above).
- Create the `Petty Cash Accounts` web role; restrict accounts page and attached posting flow to it. Existing `hr_userrole` Choice alone does not authorize the page/flow.
- Set employee Contact/Request/Cash Transaction reads to self/contact scope; remove overlapping broad employee permissions before production.
- Add explicit field allow-lists detailed in BALANCE_MODULE_SETUP.md and WEBAPI_SITE_SETTINGS.md. No wildcard settings.
- Attach a solution-aware, role-protected accounts posting flow; fill its GUID and finish server validation/uniqueness testing before enabling cash posting.
- Implement approval/completeness processing and transaction-safe Contact summary maintenance. No approval flow, posting backend, or Business Central integration was deployed by this change.

### Earlier submission corrections included in documentation

- Department table is `hr_departments`; API entity set is `hr_departmentses`.
- Other Category `hr_othercategory` belongs to Line Item, not Request.
- Total Price `hr_totalprice` is Simple Currency, not Calculated; client writes and verifies it.
- Receipt is mandatory; one File column holds one file. Multiple files require related attachments/receipt rows and are not implemented here.
- No fallback that strips fields; header/lines are verified; known partial saves resume only on the same open page.

## Recording subsequent changes

Add a dated entry naming each new or changed page, file, column, key, table
permission, web role, website setting, flow, business rule, and test. State
whether it is local, configured in the tenant, or verified live, and identify
any migration/backfill or user action required.
