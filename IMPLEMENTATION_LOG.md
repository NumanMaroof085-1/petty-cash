# Implementation and configuration log

Every implementation must update this log and its detailed setup guide in the
same change. Record exact files, functionality, schema names, permissions, site
settings, tests, and deployment state. Never describe a proposed tenant change
as deployed merely because local code or documentation exists.

## 2026-10-28 Multi-image receipt PDF upload implemented locally

- User approved one existing PDF OR up to 10 JPG/PNG images combined locally
  into one PDF, with order/remove controls and preview. Current folder was found
  at Desktop/petty-cash after the former workspace path ceased to exist. No user
  file was moved/deleted and no live tenant data was read or written.
- Added pettycash-receipts.js (receipt-pdf-v1), generated Petty Cash Receipts.html
  Web Template Source, vendor/jsPDF 4.2.1 MIT library/license and deterministic
  build script. Pinned npm tarball SHA-512 is checked on --fetch; runtime needs
  no CDN or external conversion service. Template includes raw guards/script
  tags and is approximately 427 KiB. User must publish it and the updated request
  HTML; actual tenant Source/CSP limits remain unverified, never bypassed.
- Picker supports append, up/down ordering, removal/clear, image thumbnails and
  prepared PDF preview/download links. Rejects mixed/multiple PDFs, unsupported
  formats, invalid headers and selection limits without dropping valid files.
  Enforces 15 MiB/image, 40 MiB combined, 32 MP/12k dimensions and final 10 MiB
  PDF. Header dimensions are checked before thumbnail decoding. PDF conversion
  is sequential, bounded/resized, white-flattened JPEG quality .88; normal A4 and
  custom-height long pages preserve ratios and browser EXIF orientation.
- Existing PDF bytes pass through. No OCR, original-image upload, storage,
  telemetry, schema/table/column/key, financial/approval flow, role, permission
  or Web API field/configuration change. Receipt remains mandatory and one
  native session/CSRF PUT writes the existing hr_receiptimage file column.
- Updated canonical pettycash-api.js and identical inline script to prepare and
  validate the PDF before any request write, reject expense edits made during
  preparation and retain the exact File in pending state. Fingerprints include
  source identity/order; monotonic IDs prevent cleared selections aliasing old
  snapshots. Preparation/partial saves lock receipt controls; retries reuse PDF
  bytes and existing request/line IDs, ambiguous POST blocking is unchanged.
- Added receipt unit tests and extended API/module browser fixtures plus
  scripts/verify_receipt_upload.cjs. 106 tests pass. Mock Chrome checks verify
  ordered four-page PDF, long/landscape/EXIF layout, mobile width, no preview API
  writes, cached generation, byte-identical failed-upload retry, existing PDF
  and corrupt/HEIC/mixed/count/encoding error cases. Independent PDF parser and
  renderer verified output; PNGs of all pages visually reviewed using PDF skill.
  Synthetic intermediate files are ignored under tmp/pdfs/. Existing module
  page browser checks also pass. No real phone/Safari/tenant behavior claimed.
- Added RECEIPT_PDF_SETUP.md and updated README, Dataverse/API setup guides with
  exact artifacts, limits, dependency rebuild, two-part deployment and manual
  acceptance checks. Approval/accounting must still validate all lines plus
  uploaded receipt server-side; no completion flag/atomic transaction added.

## 2026-10-19 Admin Users cleaned up to profiles only

- User explicitly requested Admin cleanup. Removed two password controls and
  credential-writing/validation/guard code from Admin Users.html and
  pettycash-admin.js. Version is admin-profiles-v2; seven profile fields remain.
  Any credential-like API input keys are rejected before network requests, and
  stale credential-enable configuration cannot restore password submission.
  Script initialization rejects old password-form HTML with a deployment error.
- Retained separate username, login-enabled=true eligibility flag, exact
  profile/role/lookup values, literal zero initial balance and read-back. No
  native hash/stamp access, email/invitation, role assignment, ledger entry,
  existing-Contact update or arbitrary balance adjustment. Login eligibility
  does not provision credentials. Supported Management Change Password on the
  same Contact remains the separate password operation; no account recreation.
- Kept two release switches creationEnabled/securityReviewed. Mirrored canonical
  page/example configuration has both true for this user's existing reviewed
  admin-only deployment; script defaults still false without explicit settings.
  No live flag, table/column/profile/page permission or role changed by assistant.
- Preserved paging/duplicate checks including inactive Contacts, active lookup
  options, HTTPS/session/CSRF, sanitized POST/transport errors, known-ID GET-only
  retry and uncertain-save blocking. Updated return/diagnostic state to report
  profileOnly/passwordSetupRequired and never claim login provisioning.
- Updated 31 Admin tests and seven mock browser states, including rejection of
  old HTML and credential-like input. All 87 unit tests pass; mock browser
  desktop/mobile checks pass. No real tenant/credential processing tested.
- Added ADMIN_PROFILE_SETUP.md; updated Admin/credential/API guides and README
  to mark old credential guidance historical. Documented exact password-free
  Contact API union and user-only removal of adx_identity_newpassword, paired
  template/page deployment, existing permission preservation, safe prior-input
  cleanup and Management workflow. No new page/table/column/key/role/flow needed.
  New local revision is not yet published or live-verified by the user.

## 2026-10-19 Management password setup and new-account request verified by user

- User confirmed the balance now displays normally, not only after a console
  refresh. User also confirmed live Admin script version admin-credentials-v1.
- Live custom credential Create saved other profile values but left New Password
  Input populated without generating a hash. This is failed native processing
  for the tested Create path; no exact plugin/workflow trigger cause is claimed.
  The earlier manual field-save report did not prove Create would behave alike.
- Missing Management Contacts were a list-filter issue: user changed the filter
  and found all Contacts. User then ran Change Password on the existing test
  Contact, signed in successfully, and successfully created a petty cash request.
  Record this as user-reported native Management/sign-in/submission success,
  not assistant tenant inspection, hash inspection, custom provisioning success
  or a complete multi-role isolation/security certification.
- Confirmed canonical Admin HTML and example configuration still have
  creationEnabled=false, securityReviewed=true, credentialSubmissionEnabled=
  false and credentialSecurityReviewed=false. No release flags changed locally
  or in the tenant by assistant. User was instructed to stop the failed path;
  live rollback, removal of adx_identity_newpassword from the API allow list and
  safe clearing of its retained test value remain separately unconfirmed.
  No password/hash values were requested or received. Do not repeat POST/PATCH,
  write hashes, recreate Contacts or change the working account's ledger.
- Updated ADMIN_CREDENTIAL_SETUP.md, ADMIN_USER_SETUP.md, WEBAPI_SITE_SETTINGS.md
  and README.md with the actual result and explicit supersession of earlier
  experimental enablement guidance. Kept supported Management provisioning as
  the working path. No new table/column/key/role/page/flow/backend integration,
  permissions, live settings or profile-only implementation added. The current
  form's credential gates disable its save operation, not just password fields.
- Documentation only; no code tests rerun, since mocks cannot verify native
  credential processing. Earlier attempted failure-documentation save was
  unverified and its entry was absent on inspection; this update records both
  the failure and the subsequent supported-path success.

## 2026-10-15 Own balance decoupled from submission profile; credential probe recorded

- User authorized needed fixes after the admin's balance widget reported an
  unassigned manager. Traced to refreshEmployeeBalance calling the full
  submission-profile resolver. Changed pettycash-api.js and its identical inline
  copy in New Petty Cash Request.html to normalize signed-in identity and read
  only that Contact's ledger through the existing shared module. No Contact
  lookup is required for balance viewing. Real ledger/identity failures remain
  visible; no fabricated zero, role bypass, permission widening or balance write.
- Department/manager validation remains required for request submission and
  setup diagnostics. Separate initialization may warn about an incomplete
  submission profile without preventing a valid ledger balance from rendering.
- Added seven regression cases in tests/pettycash-api.test.cjs: missing manager,
  department, both lookups, denied Contact read, and three invalid/absent identity
  cases. Tests verify zero profile calls for refresh, unchanged blocked writes,
  zero/positive/negative displays and refresh-button restoration. Existing
  ledger-error test also verifies no incidental Contact calls.
- Extended scripts/verify_module_pages.cjs with actual request-page mock browser
  states expense-no-manager and expense-profile-denied, including refresh and
  employee-filter checks. All four page states pass desktop/mobile; all 86 unit
  tests pass (30 Admin unchanged). Browser requests were intercepted; no live
  tenant read/write or credential processing was tested. git diff --check passes.
- Updated BALANCE_MODULE_SETUP.md and README.md: publish the updated HTML to the
  existing request page, save/sync/reload and verify as admin and employee. Do
  not load the canonical JS a second time. No shared-template update, new page,
  table, column, key, web role, setting, permission or flow is required. Live
  deployment of this balance correction is not yet user-confirmed.
- User pasted the complete Webapi/contact/fields credential union, including
  adx_identity_newpassword. Their zero-row admin probe returned contactid 200 and
  New Password Input 403 with an attribute-not-found message. Recorded this in
  ADMIN_CREDENTIAL_SETUP.md, ADMIN_USER_SETUP.md and WEBAPI_SITE_SETTINGS.md.
  The field is not missing from the reported list. GET failure does not verify
  Create support or the cause/effective scope of secret-read protection; do not
  make password Read available merely to pass this probe. Hash/stamp stay absent.
- Clarified supported native local registration can accept passwords, whereas
  custom admin Contact provisioning is a separate unverified route. No open
  registration enabled, credential guard changed, credential POST performed,
  existing Contact repaired, or new server endpoint deployed. Management setup
  remains the documented fallback. No tenant changes made by the assistant.

## 2026-10-15 Employee column rules and role confirmed; API permission probe next

- Two user screenshots show all 12 requested public Contact columns with Read
  only, Rows:12, and sole Authenticated Users role on the Petty Cash website.
  Together with prior grid, employee profile has no default column grant and
  no secret-column entries. Both profile configurations now screenshot-verified;
  this is not proof of effective runtime access under every role combination.
- Updated ADMIN_CREDENTIAL_SETUP.md, ADMIN_USER_SETUP.md and
  WEBAPI_SITE_SETTINGS.md. Next user instruction: merge reviewed credential union
  into existing Contact field setting, refresh config, run a read-only zero-GUID
  query twice selecting public contactid vs adx_identity_newpassword. It matches
  no real Contact and logs status/error metadata only, never field values.
- Public control distinguishes general denial; successful empty/400/401 results
  are inconclusive for value protection and must not enable credentials. Repeat
  effective-access checks as employee and recheck normal app reads. No credential
  request or Contact write performed, no native processing/sign-in verified.
- Save flags unchanged/off; new API field-list application not yet reported.
  Documentation only; git diff --check verified, no code tests rerun or tenant
  changes by assistant.

## 2026-10-15 Employee column profile listed; detailed verification pending

- User's Active Column Permission Profiles grid shows Contact - Employee Column
  Access on contact with blank All Column Permissions. Admin profile remains
  contact with Create/Read. No individual employee column rows, website or role
  assignment shown; do not infer all 12 rules or Authenticated Users binding.
- Updated Admin/credential/API setup guides with partial evidence and request
  for employee profile Column Permissions and Web Roles sections. No repeated
  creation needed; password API exposure and credential release remain blocked.
- Documentation only, git diff --check verification. No code, tenant, schema,
  permission or credential change by assistant; no tests rerun.

## 2026-10-15 Admin column profile confirmed in screenshots

- User screenshots show saved Contact - Admin Column Access on contact and
  the Petty Cash website, All Column Permissions Create/Read, explicit
  adx_identity_newpassword Create only, and only Petty Cash Admin in Web Roles.
  Recorded as screenshot evidence of configuration, not runtime secret denial.
- Updated ADMIN_CREDENTIAL_SETUP.md, ADMIN_USER_SETUP.md and
  WEBAPI_SITE_SETTINGS.md. Next instructed profile Contact - Employee Column
  Access has no All Column Permissions selections and 12 explicit public
  Contact logical-name Read-only records, associated with Authenticated Users.
  No secret columns/default Read, no employee Contact Create/Write grant.
- Other Contact-reading roles and overlapping profiles still need review;
  normal reads and effective secret-read denial must be tested before exposure.
  Credential API allow-list and all local credential release guards unchanged.
  No assistant tenant mutation, secret access, code or new schema/flow changes.
- Documentation-only verification: git diff --check; code tests not rerun.

## 2026-10-15 Credential edition prepared; standard column controls pending

- User selects separate username and confirms manual username/New Password
  Input save generates a hash and permits sign-in. Input clearing not separately
  confirmed; no password/hash contents requested or received. Manual save is
  not treated as verification of portal Create processing.
- Enhanced Authorization is reported unchecked. Use standard Power Pages Column
  Permission Profiles, not inferred from enhanced data model. No setting toggled.
- Local Admin Users.html adds username and masked password/confirmation.
  Username 3–100 letters/digits/dot/_/- (letter/digit first); password 12–100,
  no trimming/NUL/line breaks, confirmation required. These are app limits;
  tenant may add password rules. No forced first-login password change configured.
- pettycash-admin.js version admin-credentials-v1 adds paged case-insensitive
  username duplicate checks including inactive Contacts. One full POST includes
  adx_identity_username, adx_identity_logonenabled true, transient
  adx_identity_newpassword and original profile/binds/zero summary. Public
  read-back excludes secrets. Result states submitted, not processing/login
  verified. No email, role assignment, existing-user update, ledger write or flow.
- Password absent from fingerprints, retry state, diagnostics, storage or URLs.
  Inputs clear at submit and after outcomes; known saved IDs retry GET-only
  without password resubmission. Sensitive errors discard server/transport/read
  exception messages that may echo secrets. HTTPS required; transient string
  lifetime is not a physical memory-erasure guarantee.
- Canonical/embedded config: creationEnabled=false, securityReviewed=true,
  credentialSubmissionEnabled=false, credentialSecurityReviewed=false. No
  credential field exposure or enablement deployed. Old/new script-page mismatch
  fails closed during rollout. Existing profile edition is not modified live.
- Added ADMIN_CREDENTIAL_SETUP.md with metadata/evidence, standard authorization,
  next Admin column profile, all-role no-read review, future API list, release
  gates and synthetic processing/login test. Main guide/README/API guide updated.
- All 79 tests pass (30 Admin). Seven mocked browser modes pass, including
  credentials-disabled, redacted rejection and password-free verification retry.
  Desktop/mobile visually reviewed, masked/cleared inputs checked. No tenant
  calls or real credentials used. No new schema/column/profile/flow by assistant.

## 2026-10-15 First Contact created; zero summary added, credential extension pending

- User reports the test Contact was created; Current Balance/username blank.
  Both fields were omitted by the prior profile-only payload. No success text,
  actual login test or complete record-field screenshot supplied.
- Updated pettycash-admin.js to include literal hr_currentbalance:0 only on
  Contact POST and select/verify it after save. Reject null/missing/nonzero
  initial summary without PATCH/PUT/DELETE or overwriting any existing balance.
  Arbitrary starting balance input is ignored. No ledger transaction is created.
- Updated Admin page explanatory note, tests and mocked browser fixture/payload
  checks. Existing hr_currentbalance field setting and Admin Create grant suffice;
  no extra schema/permission needed. Existing blank Contact not automatically
  backfilled or recreated; local patch not yet user-deployed/live-verified.
- User requests username and adx_identity_newpassword input, reporting automatic
  password assignment. Native adx_identity_username identified in Microsoft
  Contact reference. Asked email-as-username vs separate name, and actual login/
  input-clearing result after direct field save, never password/hash contents.
  No username/password implementation or API exposure added pending answers and
  processing/column-security verification. Management flow is documented; native
  portal Create password-processing behavior is not verified in this tenant.
- Updated ADMIN_USER_SETUP.md, WEBAPI_SITE_SETTINGS.md, README.md and
  BALANCE_MODULE_SETUP.md with zero-init exception/evidence and credential scope.
- Verification: all 69 tests pass (20 Admin), plus all four mocked Admin browser
  modes. No tenant access or credential/balance mutations by assistant.

## 2026-10-15 Access checks reported passed; controlled create enabled locally

- User replies "done" to signed-out Admin page denial, non-admin page denial
  and new permissions assigned only to Petty Cash Admin. Recorded as user-
  reported, not independently inspected. No employee collection/direct POST
  denial output provided; broader production checks remain pending.
- Set creationEnabled/securityReviewed true in Admin Users.html and mirrored
  canonical config for this site's controlled test only. Core defaults stay
  false without config. No metadata/grant/script-template-source changes. User
  must update the page before live activation; no confirmation yet.
- Tests updated for reviewed enabled config while retaining either-off/missing
  flags, non-admin/signed-out, exact full payload and safe-retry checks.
- Updated ADMIN_USER_SETUP.md, WEBAPI_SITE_SETTINGS.md and README.md with
  evidence boundaries and one test-profile procedure. No live Contact,
  credentials, website role, balance/ledger write or tenant mutation by assistant.
  Actual create/read-back and native login provisioning remain untested.
- Verification: all 68 local tests pass; git diff --check passes. Mock browser
  QA passes enabled, disabled, non-admin and unconfigured modes. No tenant calls.

## 2026-10-15 Admin page live read diagnostics pass (user screenshot)

- User reports running checkSetup on admin-users page while signed in as admin.
  Screenshot: contactsReadable true, departmentsReadable true, contactCount 2,
  departmentCount 2, creationEnabled false, writePermissionsVerified false,
  loginProvisioned false. This demonstrates deployed helper/context/config and
  successful list reads in that session, not create rights or page isolation.
- Explained all three false values are expected: saving remains disabled;
  diagnostics are GET-only and do not provision credentials. No runtime code or
  save flags changed. No live Contact created by this diagnostic.
- Updated ADMIN_USER_SETUP.md, WEBAPI_SITE_SETTINGS.md and README.md with the
  observed deployment/read status. Exact URL casing, template source versions,
  full settings and role bindings are not independently inspected.
- Next instructed checks: signed-out and non-admin page denial; verify only
  Admin role binds to new permissions; ordinary employee Contact collection
  read returns no other Contact. Added read-only query with count/boolean output,
  no passwords or personal record details. Direct Create-denial/production
  server validation and actual admin creation/read-back remain untested.
- Documentation-only change, no code tests rerun. Validation: git diff --check.

## 2026-10-15 Admin API fields applied (user-reported); deployment prepared

- User reports completing the Contact/Department union field setting instructions
  and enabled=true. Live values/website and runtime reads are not independently
  inspected. Admin permission role bindings still not shown in grid screenshot.
- Embedded confirmed config in Admin Users.html before the Admin include, with
  creationEnabled=false/securityReviewed=false. Updated canonical config comment
  and regression enforcing exact embedded/canonical match and include order.
  This removes a manual config assembly step; no new operation is enabled.
- Updated ADMIN_USER_SETUP.md/WEBAPI_SITE_SETTINGS.md/README.md. Next user
  deployment: restrict Admin Users page to Petty Cash Admin, update existing
  User Context template, create Admin script template, paste complete page and
  run read-only checkSetup. Page URL remains proposed Admin-Users; no page,
  template or permission was deployed by assistant and no user report of them yet.
- No new schema/flow/credential/balance writes. Save flags remain off.
- Verification: all 68 tests pass; git diff --check passes. Updated Admin page
  browser QA passes enabled, disabled, non-admin and unconfigured states with
  mocked APIs only; desktop/mobile screenshots regenerated. No tenant requests.

## 2026-10-15 Admin table permissions created (user screenshot)

- User reports completion and provides Active Table Permissions screenshot.
  Contact - Admin Profiles shows contact / Global / Read Yes, Create Yes,
  Append Yes, Append To Yes, Write No, Delete No. Departments - Admin Lookup
  shows hr_departments / Global / Read Yes, Append Yes, all other privileges No.
- Screenshot also retains employee Contact Self, Request Contact, Line Item
  Parent and Cash Transaction Contact scopes. It does not show assigned web
  roles, website, relationships or prove live operation/isolation. Previous
  instructions assign only Petty Cash Admin to the two new permissions; remind
  user to verify these bindings and not attach Authenticated/Anonymous roles.
- Updated ADMIN_USER_SETUP.md/WEBAPI_SITE_SETTINGS.md to distinguish screenshot-
  confirmed privileges from pending role review, API fields, restricted page,
  templates and live tests. Next user action is editing existing Contact and
  Department field settings to the documented complete union values, retaining
  any other validated fields and enabled=true. No password fields added.
- Documentation-only change. Both save flags remain false. No assistant tenant
  mutation, new schema, code behavior, credential change or flow deployment.
  Validation: git diff --check; no code tests rerun for this documentation change.

## 2026-10-15 Contact navigation names confirmed from live annotations

- User's console screenshot from the documented read-only Contact query returns
  department `hr_Department` and manager `hr_ReportsToManager`. These confirm
  exact Contact lookup write names, not merely schema-name guesses. The
  assistant did not directly query the tenant; no create permissions tested.
- Filled both navigation mappings in pettycash-admin-config.example.js. Role
  values and GUID key remain as previously confirmed; both save flags stay false.
- Updated ADMIN_USER_SETUP.md, README.md and WEBAPI_SITE_SETTINGS.md with
  confirmed mappings and complete Contact/Department union field lists. No live
  settings changed, no credential/balance writes, no new schema/flow/permission.
- Added exact-bind regression using the confirmed configuration; it verifies
  one mocked full POST/read-back and separately that shipped flags block writes.
  All 68 tests pass (19 Admin tests). No runtime/UI change or new browser run.
- Next tenant action: separate Global Contact Read/Create/Append/Append To and
  Department Read/Append permissions for Petty Cash Admin only, other privileges
  off. Preserve existing employee scopes. Restricted page/templates/API settings
  and live direct-API isolation tests still pending; no deployment by assistant.

## 2026-10-15 Department GUID key confirmed for Admin page

- User confirms Department primary key logical name `hr_departmentsid`; schema
  spelling supplied as `hr_Departmentsld`. API configuration uses the logical
  name exactly, not the schema spelling or primary-name text hr_departmentname.
- Updated pettycash-admin-config.example.js, ADMIN_USER_SETUP.md,
  WEBAPI_SITE_SETTINGS.md and README.md. Documented future Admin Department
  field list hr_departmentname,hr_departmentsid,statecode; no live setting changed.
- Added a read-query/config regression using the confirmed GUID key. All 67
  local tests pass (18 Admin tests). No UI/runtime script change; prior mock
  browser results still describe the 2026-10-13 UI test run, not a live tenant test.
- Contact navigation-property verification and admin-only permission review
  remain pending. Both save flags remain false; no deployment, credential change,
  new table, column, permission or flow by assistant.
- Documented an alternative read-only console query on the existing Request
  page for own-Contact navigation annotations; it outputs only names. The query
  has not been run against the tenant; null annotations are not a metadata result.

## 2026-10-13 Admin profile page implemented locally; saving gated

- User reports completing Admin web-role assignment. Live role defaults and
  membership have not been independently inspected.
- Confirmed hr_userrole Employee 123140000, Manager 123140001, Accounts 123140002,
  Admin 123140003; Contact schema names hr_Department and hr_ReportsToManager.
  Exact write navigation properties remain unverified. User supplied Department
  primary name hr_departmentname; clarified that its Unique identifier GUID key
  is required, not this text/name column.
- Added Admin Users.html, pettycash-admin.js, pettycash-admin-config.example.js.
  Proposed page Admin Users / Admin-Users and template Petty Cash Admin are not
  deployed. First/last name, email, business role, Department/manager saved as
  one complete payload, then verified. Complete Contact reads include inactive
  rows for duplicate checks. Options require active Departments/Contacts.
- No field stripping or credential/role/balance/ledger writes. Known saved ID
  resumes verification only; ambiguous creates block retries in memory. Email
  duplicate checks are client-side, not atomic; server validation remains pending.
- Shared User Context adds cosmetic Liquid pcAdminAllowed; existing escaped
  identity IDs and Accounts check preserved. Existing browser mock updated.
- ADMIN_USER_SETUP.md documents artifact inventory, pending metadata, admin-only
  Global Contact Read/Create/Append/Append To, Department Read/Append, merged
  API fields, restricted page, templates, gates, manual native login fallback,
  and pending direct-API security tests. README/WEBAPI_SITE_SETTINGS updated.
- No tenant page, permission, setting, table, column, key or flow was created
  by assistant. Reset error unchanged; profile creation is not login provisioning.
- Verification: all 66 tests pass (17 new admin tests). Mock browser passes
  enabled/disabled/non-admin/unconfigured Admin states; desktop/mobile visually
  reviewed, no overflow. Existing Requests/Accounts browser QA also passes after
  context change. No live tenant calls. Word snapshots unchanged.

## 2026-10-13 Admin web role created (user-reported)

- User reports creating the administrator web role in Power Pages Management
  after the `Petty Cash Admin` setup instructions. Exact saved name, website,
  default role flags, and assignment to a Contact are not independently verified.
- Updated ADMIN_USER_SETUP.md with the reported creation and the next enhanced-
  model Contact assignment step. Both default flags must remain No; ordinary
  authenticated employees must not automatically receive the administrator role.
- No admin page, new table permission, credential provisioning, or email flow
  was implemented or deployed in this change. Existing employee permissions and
  authentication remain unchanged. Documentation-only change.

## 2026-10-13 Admin onboarding requirements and native password fields recorded

- User requests a dedicated administrator-only Contact creation page next.
  Existing authentication is reported as local email/password; invitations are
  not wanted. Reset links are conditionally preferred if quick to configure.
- Confirmed native fields: `adx_identity_newpassword` and
  `adx_identity_passwordhash`. No new password column, portal field exposure,
  password storage, or credential change implemented.
- User reports Forgot Password generic failure, Error ID
  `d148e7b7-a447-4d04-a904-a8bb2721daf0`; cause and reset process state unknown.
- Added ADMIN_USER_SETUP.md to separate Contact profile creation from supported
  login provisioning, record minimal phased design and proposed Petty Cash Admin
  role, and keep password/email work explicitly unimplemented. No admin page,
  role, permission, flow, or email was created/sent by the assistant.

## 2026-10-13 Employee dashboard working; actual page name My Requests

- User confirms the employee dashboard is created and working, with website
  page display name `My Requests` instead of the suggested longer name.
  In a follow-up the user confirmed the exact partial URL `My-Requests`.
  No additional page/template creation or source-file rename is required.
  Preserve configured casing; `/My-Requests/` is the relative link if the page
  is directly under Home (parent hierarchy/full live URL not independently
  inspected). No tenant route changed by assistant.
- Changed the local dashboard h2 to `My Requests`; retained source filename
  `My Petty Cash Requests.html`, shared template names, data-pc-page="requests",
  API filters, and table/column mappings. A local heading-only redeploy is
  optional if the live heading already matches or only navigation was renamed.
- Added a regression for heading/module identity; updated README.md,
  BALANCE_MODULE_SETUP.md, DATAVERSE_SETUP.md, and this log. No tenant writes,
  new table, column, permission, web role, setting, or flow by assistant.
- User's "working" report does not separately verify signed-out page denial,
  all comments/statuses, Refresh, or two-employee Request/Line Item/ledger tests.
  These and backend/protected-field hardening remain pending. Accounts posting
  stays disabled. The earlier Word snapshots contain the old suggested name.
- Verification: all 49 local tests pass after the heading-only change.

## 2026-10-13 Other-Contact read denied; dashboard testing next

- User's console screenshot shows manager Contact GET selecting `contactid,
  hr_currentbalance` returns HTTP 403 with permission-denied-to-read-Contact
  message. The same output passes employee/profile and all three setup checks.
- This verifies the specific other-Contact denial for the tested session/record,
  not all roles/Contacts or cross-user Request/Line Item/ledger isolation.
- Next instructed deployment, not yet reported done: create authenticated
  `My Petty Cash Requests` page, URL `my-petty-cash-requests`; page permissions
  restrict Read to Authenticated Users (not Anyone/Anonymous). Paste updated
  local fragment into Liquid-rendered HTML. Both shared templates already exist.
- Ensure `hr_managercomments` is included in the existing Request field allow-list
  without removing validated submission fields. No new table permission is
  needed for dashboard reads beyond the existing scoped grants.
- Test own balance, request list/status/comments, Refresh, and signed-out page
  restriction. Use a second employee test account to verify Request/Line Item/
  ledger isolation before production. Approval/Accounts posting stays pending.
- Documentation updated only; no page, permission, or tenant mutation by assistant.

## 2026-10-13 Contact binding correction works live (user-reported)

- User confirms request submission works after changing Contact - Manager Binding
  to Global Append rather than Append To. This verifies reported compatibility
  after the corrected instruction, not independent inspection of all role flags.
- Current intended configuration: Contact - Lookup Self Read with existing self
  association flags; separate Global Append-only binding grant; Contact Global
  Read remains disabled. Request Contact scope and Line Item Parent scope were
  confirmed earlier. Runtime code unchanged in this confirmation step.
- Next gate: as an ordinary employee, attempt a read of the manager's Contact
  balance through readSavedBalance(profile.managerId). Expect an authorization
  denial, not a returned balance. Test is read-only; no approval/cash movements.
  Capture HTTP status/message; arbitrary errors are not proof of denied access.
- Cross-employee Request/Line Item/ledger denial tests, protected field hardening,
  dashboard deployment, and financial flows still need verification/implementation.

## 2026-10-13 Contact association 403; binding direction corrected

- User reports Request POST HTTP 403: permission denied associating/disassociating
  `contact` to `hr_pettycashrequest`, after Self Contact Read plus the earlier
  Global Append-To-only instruction. All three read checks still pass. This is
  an association authorization failure, not a schema/receipt/shared-script error.
- The assistant's earlier binding flag was wrong. Microsoft's Power Pages audit
  guidance explicitly requires Append on lookup target tables and Append To on
  tables setting lookup binds. Contact needs Global Append for the manager target;
  Request already retains Append To. No broad Contact Read is required by this
  documented mapping; live compatibility and read-denial tests remain necessary.
- Corrected next tenant instruction (not yet user-confirmed applied): edit
  Contact - Manager Binding to Global, ONLY Append enabled, Append To/Read/Write/
  Create/Delete off; same website and authenticated-user role. Contact - Lookup
  stays Self with its existing flags. Sync/re-sign-in and retry the labelled test.
  If still rejected, inspect exact grants/roles/website; never restore broad Read
  or strip Submitted By/Assigned Manager fields to obtain success.
- Corrected BALANCE_MODULE_SETUP.md, DATAVERSE_SETUP.md, and README.md, plus the
  association comment in both script copies. Runtime behavior/payload unchanged.
  Added a local regression for complete-payload
  Contact-association 403 rejection and retry after a definite permission rejection.
- No tenant writes by assistant. Association grants are not trusted manager
  validation; server hardening and cross-user denial testing remain pending.
- All 48 local tests pass, including the new 403 rejection/retry regression.
  This verifies client behavior, not the live tenant permission correction.

## 2026-10-13 Scoped submission verified; Contact-read hardening prepared

- User reports a complete test request submitted without errors and all columns
  retained values under the scoped permissions. No independent tenant inspection
  or cross-employee denial test was performed by the assistant.
- Line Item screenshot confirms Parent access, parent permission
  `Petty Cash Request - Create`, exact relationship
  `hr_pettycashlineitem_ParentRequest_hr_pettycashrequest`, on
  `hr_pettycashlineitem`. This supersedes earlier pending relationship notes.
- Removed the redundant preflight GET of the manager Contact from both embedded
  request script and pettycash-api.js. Manager GUID is still required from the
  authenticated employee's own Contact lookup; its binding and read-back check
  remain mandatory. Missing manager still blocks writes. No payload reduction.
- Added regression tests: complete save without reading any other Contact, and
  missing profile manager prevents all writes. Browser/UI/financial rules unchanged.
- Historical instructions (binding flag corrected in the later 403 entry): change existing
  Contact - Lookup to Self Read (retain existing self Append/Append To), and add
  a separate Global Contact binding permission with ONLY Append To, no Read/
  Write/Create/Delete/Append, for the authenticated-user role. This preserves the
  intended manager binding without broad Contact reads. Portal binding under
  these exact grants needs a live complete-save test; it is not guaranteed by
  mocked tests. If rejected, stop and inspect; do not silently restore Global Read.
- Global Append To still permits associations to known Contact GUIDs; it is not
  an authorization check of the chosen manager. Trusted server validation of
  employee/manager, initial statuses, completion, and protected fields remains
  required before approval/accounting. Accounts posting stays disabled.
- Updated BALANCE_MODULE_SETUP.md, DATAVERSE_SETUP.md, and README.md alongside
  this log. No new column/table/flow/site setting; new binding-only permission
  is proposed. Earlier reviewed Word files remain dated deployment snapshots.
- Verification: all 47 local tests pass, including embedded/standalone script
  synchronization, required manager binding/read-back, and receipt completion
  without another Contact GET. These mocks do not prove live Append To behavior.

## 2026-10-13 Follow-up read checks passed after Line Item instructions

- User's follow-up `checkSetup()` output passes Request columns, Product columns,
  and Department target with employee/department/manager context resolved.
- This is a read-only result after the Line Item Parent-scope instructions.
  No saved Line Item permission screenshot or exact parent relationship name
  was supplied, so Parent configuration/role inheritance remains unverified.
- Next verification is a complete submission using clearly labelled test data,
  two products, Others text, and a mandatory test receipt. This creates real
  Dataverse test records: leave pending, do not approve/post financial movements,
  and inspect the Request/Line Items/receipt. No test write made by assistant.
- Global Contact hardening, protected financial/status fields, cross-employee
  denial tests, dashboard deployment, and trusted posting flows remain pending.

## 2026-10-13 Request scope configured; read diagnostics passed

- User screenshot shows saved `Petty Cash Request - Create` on
  `hr_pettycashrequest`, Contact access, relationship
  `hr_pettycashrequest_SubmittedBy_contact`, on the Petty Cash website.
- User's read-only `checkSetup()` output passes request columns, product columns,
  and department target; the signed-in employee/department/manager resolved.
  This does not verify writes, receipts, or denial of another employee's records.
  Privilege flags and assigned roles were instructed to remain unchanged but
  are not visible in this cropped screenshot.
- Next instructed change, awaiting confirmation: edit the existing Line Item
  permission from Global to Parent, with Request permission above as parent and
  the relationship using Line Item `hr_parentrequest`. Preserve Read/Create/
  Append/Append To; keep Write/Delete off and authenticated-user role consistent.
  The exact Line Item relationship schema name has not yet been supplied.
- If Parent isn't exposed in the management form, inspect the options or use
  Design Studio's Child permissions under the scoped Request permission;
  ensure any superseded Global employee grant is removed from effect. Do not
  silently keep Global access as a fallback. Contacts remain a separate pending
  hardening step; no permission or runtime code changed by the assistant here.

## 2026-10-13 Current permission list reviewed

- User's current list shows Cash Transaction Contact-scoped Read only.
- Contact - Lookup: Global Read, Append, Append To; no Write/Create/Delete.
- Department - lookup: Global Read, Append, Append To; no Write/Create/Delete.
- Petty Cash Line Item - Create: Global Read, Create, Append, Append To;
  no Write/Delete.
- Petty Cash Request - Create: Global Read, Write, Create, Append, Append To;
  no Delete.
- User subsequently confirmed the authenticated-user web role is attached to
  Contact, Request, and Line Item permissions. These Global grants therefore
  conflict with employee isolation. No tenant permissions changed by assistant.
- First instructed change (subsequently confirmed scoped above): edit the existing Request
  permission to Contact access via Submitted By (`hr_submittedby`), preserving
  current privilege flags and role for the submission/receipt regression check.
  Do not add a narrow permission while leaving the same Global employee grant.
- Next stages: scope Line Items through employee-owned Requests; address Contact
  reads without breaking the explicit manager-target GET/binding requirements.
  Preserve working submission/receipt and manager-lookup requirements. Keep
  dashboard publication and financial posting pending until security checks pass.
- Request Write retention is a compatibility step, not completed hardening:
  employee edits of approvals/sync/comments and financial fields must be blocked
  appropriately, with server validation, before enabling approval/accounting.

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
| My Petty Cash Requests.html | Employee page: ledger-derived balance, own requests, saved approval status, manager comments, Refresh | User reports live page working as My Requests, partial URL My-Requests; broader checks pending |
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
