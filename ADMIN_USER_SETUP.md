# Administrator user management setup

## Current implementation: admin-profiles-v2 (2026-10-19)

The requested cleanup is implemented locally. Use **ADMIN_PROFILE_SETUP.md** for
the current seven-field page, profile-only POST, two configuration switches,
password-free API field union, paired page/template deployment and Management
password setup. Creation is enabled in the supplied page configuration for the
existing user-reviewed admin-only setup; script defaults remain fail-closed.
No password controls or password-writing path remain. No existing Contact,
schema, permission or live site configuration was changed by the assistant.
The older status/configuration narrative below is retained as history and does
not override the current guide. Publication of this revision is pending.

Current result (2026-10-19, user-reported): changing the Management Contacts
view/filter exposed the existing records. The user then used Change Password,
signed in as the new account and successfully submitted a petty cash request.
Do not recreate those Contacts. The earlier direct portal Create left New
Password Input populated without generating a hash; it did not provision a
password. Exact native trigger behavior was not inspected. The supported
Management credential path is working, not custom website password provisioning.

Local creation/credential flags remain disabled. Live rollback of test flags,
removal of the transient password API field, and cleanup of its retained test
value were instructed but not separately confirmed. No secret values were
requested or received. See ADMIN_CREDENTIAL_SETUP.md; its current-result section
supersedes earlier experimental rollout guidance. No backend provisioning or
profile-only revision was implemented in this documentation update.

Latest (2026-10-15): the user pasted the complete credential Contact field union.
Admin zero-row reads returned contactid 200 and New Password Input 403 with an
attribute-not-found message. Credential creation remains disabled: a rejected
GET does not verify Create/native login processing. Built-in local registration
supports password entry; custom admin provisioning is a separate unverified
path. See ADMIN_CREDENTIAL_SETUP.md. The request-page balance fix only decouples
own-ledger viewing from submission profile validation; no admin permission or
manager-assignment change is required to display a balance.

Status: user reports creating the admin web role and completing its Contact
assignment instructions. User has now deployed the Admin page and run its
read-only diagnostics successfully while signed in as admin (screenshot).
Department GUID key `hr_departmentsid` is confirmed.
Contact navigation names are confirmed from the user's live console output.
User reports creating both admin permissions. The screenshot confirms their
table/scope/privileges; assigned web roles and website are not visible in that
view. User subsequently reports passing signed-out/non-admin page denial and
confirming both new permissions are bound only to Petty Cash Admin.
The previous profile-only edition created a Contact, with omitted balance and
username blank. A local credential edition adds separate username/masked
passwords/zero initialization. Its creation/credential guards are reset off
until column access is reviewed. See ADMIN_CREDENTIAL_SETUP.md for the current
next step. This edition is not deployed or verified on a portal Create call.
User now reports applying the two API field-list updates and retaining enabled
settings true. Runtime screenshot confirms Contact and Department list reads;
the full saved settings have not been independently inspected.
User confirms manual username/New Password Input save generates a hash and
allows sign-in, and Enhanced Authorization is unchecked. Native portal POST
processing/clearing remains unverified. No new server flow/email is deployed.
Live role flags/membership have not been independently inspected. Reported
access checks are not a complete server-security certification.
Subsequent screenshots confirm the Admin Contact Column Permission Profile's
Create/Read defaults, Create-only New Password Input exception, correct website
and sole Petty Cash Admin association. A later profile-list screenshot confirms
the employee Contact profile exists with empty default permissions. Further
screenshots show all 12 Read-only rows, Rows:12 and Authenticated Users on the
correct website. Effective secret-read denial remains pending and credential
guards remain off. The next stage is the reviewed API union and zero-row
public/control-vs-password-column probe in ADMIN_CREDENTIAL_SETUP.md, with no
actual password values or Contact writes involved.

## Confirmed authentication requirements

- User reports existing local email/password sign-in; keep this provider for now.
- No invitation workflow requested. User prefers password-reset links instead of
  emailed passwords only if setup is quick; reset delivery is not yet working.
- Forgot Password currently produces a generic failure, reference
  `d148e7b7-a447-4d04-a904-a8bb2721daf0`. This is a correlation reference, not a
  diagnosis. No reset-process activation status or backend exception is known.
- User confirmed existing Contact columns `adx_identity_newpassword` (New
  Password Input) and `adx_identity_passwordhash` (Password Hash). Microsoft's
  Contact reference lists both native authentication columns. No new password
  column is needed. An existing field does not prove a direct update provisions
  a usable local login or clears any transient password value.
- Keep hash/security-stamp fields excluded. New Password Input must stay out of
  the API allow-list until reviewed Create-only/no-Read controls apply to all
  effective Contact-reading roles. Never email/log/store plaintext in client
  persistence or query saved password fields. Do not change existing passwords
  based only on the reset error.

## Profile first phase (user reports successful creation)

`Admin Users.html` and `pettycash-admin.js` create Contact profiles using native
session/CSRF API calls. Inputs are first/last name, email, business role,
department and manager. Last name and all non-name fields are required; first
name is optional. Email is trimmed/lowercased. Complete paged Contact reads,
including inactive Contacts, support case-insensitive duplicate checks. Manager
choices are all active Contacts (not restricted by business role); Department
choices must be active. One complete POST is followed by a read-back of every
submitted field and lookup. Success explicitly reports a profile, not a login.

Known saved IDs resume verification only with unchanged form values. Ambiguous
POST outcomes/missing IDs block another create on the same page. Retry state
is in memory only; do not reload after an uncertain outcome until inspected.
Duplicate checking is client-side, not an atomic guarantee: two admins can
race it. Production uniqueness/server validation needs a separate reviewed
implementation; no email key or plugin was created in this phase.

The former profile-only edition omitted credentials. The new local credential
edition submits username, Login Enabled and New Password Input once under
separate guards; it never reads saved secrets back or assigns web roles/ledger
entries. Following the first creation report,
local code now initializes `hr_currentbalance` to literal 0 on NEW Contact
POST only and verifies it is numeric zero (null/missing/nonzero fail). No
starting amount input is accepted and arbitrary passed balance input is ignored.
No PATCH/PUT/DELETE or update of an existing balance is introduced. The empty
ledger remains authoritative zero; later summary changes belong to the backend.
The already-created record is not automatically backfilled or recreated.

To keep email troubleshooting out of this phase, initial local credentials can
temporarily be provisioned using Portal Management's supported Username and
Change Password process. That process requires Dataverse System Administrator
privileges; a website administrator web role does not grant those privileges.
This fallback is a recommendation, not a claim of automated provisioning.

Dedicated website role name instructed: `Petty Cash Admin`. Both Authenticated Users
Role and Anonymous Users Role flags must be No; assign it only to authorized
admin Contacts. Protect the page and its actual create operation, not just menu
visibility or a business `hr_userrole` Choice. User reports role creation on
2026-10-13 and subsequently confirmed completing Contact assignment. Exact saved
name, website, default flags, and assignment have not been independently
verified. Preserve existing employee Self-scoped Contact reads.

## Reported role configuration

Assign the role to the administrator's existing sign-in Contact. For this
enhanced-model site, open Power Pages Management > Security > Contacts, select
the Contact, choose Portal Contact (Enhanced Form), then General > Web Roles >
Add Existing Web Role. Select `Petty Cash Admin`, add, and save. Confirm both
default role flags remain No. Role assignment does not itself create page or
table permissions or grant Dataverse System Administrator privileges.

## Confirmed and pending mappings

- Contact Choice `hr_userrole`: Employee `123140000`, Manager `123140001`,
  Accounts `123140002`, Admin `123140003`, confirmed by user. These business
  attributes do not grant website web roles.
- Contact Department logical `hr_department`, schema `hr_Department`; Reports
  To Manager logical `hr_reportstomanager`, schema `hr_ReportsToManager`.
  Live associated-navigation annotations in the user's console screenshot on
  2026-10-15 confirm write names `hr_Department` and `hr_ReportsToManager`,
  respectively. This is lookup metadata evidence, not a create/permission test.
- Department logical table `hr_departments`, entity set `hr_departmentses`,
  text primary name `hr_departmentname` and GUID primary key `hr_departmentsid`
  are confirmed. User supplied key schema spelling `hr_Departmentsld` on
  2026-10-15; only its exact confirmed logical name is used by the API.
- `pettycash-admin-config.example.js` has the confirmed role values and GUID key,
  plus both confirmed navigation names. Current local credential rollout has
  creationEnabled false, securityReviewed true, credentialSubmissionEnabled
  false and credentialSecurityReviewed false. Existing access checks do not
  approve credential exposure. Core defaults stay false without config.
  Generic tests use fictional mappings; a
  separate regression checks the confirmed configuration and exact POST binds.

For future re-verification, an authenticated Dataverse administrator can read
the GUID key/navigation metadata from the organization's API (not portal routes):

```text
GET <Dataverse organization URL>/api/data/v9.2/EntityDefinitions(LogicalName='hr_departments')?$select=PrimaryIdAttribute
GET <Dataverse organization URL>/api/data/v9.2/EntityDefinitions(LogicalName='contact')/ManyToOneRelationships?$select=ReferencingAttribute,ReferencingEntityNavigationPropertyName&$filter=ReferencingAttribute eq 'hr_department' or ReferencingAttribute eq 'hr_reportstomanager'
```

After Context/Admin template deployment, the optional read-only helper
`await PettyCashAdmin.inspectProfileRelationships()` requests associated
navigation annotations for the administrator's own populated Contact lookups.
If absent/null, use Dataverse metadata; do not guess. `checkSetup()` checks
read lists only, not write mappings/permissions, role isolation or login setup.

Before deploying the Admin template, this alternative can be run on the already
working New Petty Cash Request page. It uses that page's native API helper,
reads only the signed-in Contact's two lookups, and prints only navigation
names. Missing annotations are inconclusive; use Dataverse metadata if null.

```javascript
(async () => {
  const id = normalizeGuid(document.getElementById("portalUserId")?.value);
  if (!id) throw new Error("Sign in on the working New Petty Cash Request page first.");
  const { data } = await callWebAPI({
    method: "GET",
    url: `/_api/contacts(${id})?$select=_hr_department_value,_hr_reportstomanager_value`,
    headers: { Prefer: 'odata.include-annotations="*"' }
  });
  const suffix = "@Microsoft.Dynamics.CRM.associatednavigationproperty";
  console.log({
    department: data?.["_hr_department_value" + suffix] ?? null,
    manager: data?.["_hr_reportstomanager_value" + suffix] ?? null
  });
})();
```

## Tenant deployment checklist (partly user-completed)

1. Confirm Petty Cash Admin is assigned only to authorized admins and both
   default-role flags are No. Preserve existing employee Self/Parent scopes.
2. Create one Studio page named `Admin Users`, proposed partial URL `Admin-Users`
   (not yet user-confirmed/live). Restrict page Read to Petty Cash Admin only;
   review inherited/child permissions. A hidden menu or UI check is not security.
3. Screenshot confirms table permission `Contact - Admin Profiles`: table `contact`, Global,
   Read/Create/Append/Append To only; Write/Delete off. Assign only Petty Cash
   Admin, not Authenticated Users/Anonymous. Global Read is needed for email
   checks and managers. In Power Pages' association check, new Contact is source
   (Append To); existing manager Contact is target (Append). No existing Contact
   is changed by this page. Privilege configuration is user-completed; verify
   the assigned web role and website on the actual record, not only the grid.
4. Screenshot confirms `Departments - Admin Lookup`: table `hr_departments`, Global,
   Read/Append only, assigned only to Petty Cash Admin; other privileges off.
   Reuse an already applicable equivalent grant if available. Never broaden
   employee permissions to fix admin setup. Its privileges are user-completed;
   assigned web role and website are not shown in the grid.
5. Keep contact/Department Web API enabled settings true. Merge existing field
   lists with Contact `firstname,lastname,emailaddress1,hr_userrole,hr_Department,
   hr_ReportsToManager`. Existing `contactid,fullname,statecode,
   _hr_department_value,_hr_reportstomanager_value` are also used. Add verified
   `hr_departmentsid` and `statecode` to Department's `hr_departmentname`. Never expose
   password/hash/authentication fields or wildcard. Shared field lists are not
   role-specific: employee Read remains Self-scoped and Create remains denied;
   admin Global Read exposes allowed Contact data to that trusted role. Review
   column permissions and other components, not just this page. User reports
   completing these field-list instructions on 2026-10-15; runtime read checks
   remain pending. Do not create duplicate Site Setting records.
6. Update the existing `Petty Cash User Context` Web Template from its local
   file. The new cosmetic `pcAdminAllowed` input checks the Admin role in Liquid.
   Escaped identity values, existing IDs and Accounts check remain unchanged.
7. Create Web Template `Petty Cash Admin`: Source is `<script>` plus the full
   `pettycash-admin.js` plus `</script>`. Include it only on Admin Users, not
   globally. Put the complete `Admin Users.html` in the page; confirmed config
   is embedded between Context and Admin includes. Initial deployment used both
   flags false; the current reviewed local copy enables the controlled test.
   Do not paste another config block or separately load the JS file. A regression
   keeps the embedded configuration identical to pettycash-admin-config.example.js.
8. Keep both flags false during metadata/read checks. Refresh config using
   supported Preview/Clear config tools; run `await PettyCashAdmin.checkSetup()`.
   Enable both flags only after exact write mappings and admin-only page/table
   permissions are reviewed. Flags are release guards, not server security.
9. Test signed-out and ordinary employee denial of both page and direct Contact
   POST. Confirm employees still cannot read another Contact/email/balance and
   existing Request, balance and My Requests work. Local mocks cannot establish
   tenant authorization.
10. Create a test profile as admin, inspect every saved field/lookup and duplicate
    rejection (including inactive Contacts); confirm no ledger/password writes.
    Provision its native username/password and website role manually using the
    supported Management process. Record actual login testing separately. Reset
    delivery remains unresolved; automated onboarding is not complete.

This phase adds no table, column, key, flow or credential store. The user has
reported creating/assigning the admin role and creating the two permissions;
the screenshot confirms the permission scopes/privileges. Their role bindings,
page restriction and role bindings still need live isolation verification.
The user now demonstrates Admin page/helper deployment and successful API list
reads; exact live source versions/URL casing are not independently inspected.
No tenant configuration was deployed by the assistant.

## API field lists (user reports completed)

Edit the existing site settings for the same Petty Cash website; do not create
duplicate records. The complete union lists are in WEBAPI_SITE_SETTINGS.md.
Contact adds firstname/lastname/email, business role and verified lookup write
names while preserving current profile/balance readers. Department adds its
GUID key and statecode. Preserve any additional validated fields needed by
other pages. Keep both enabled settings true. These settings are not a grant
of record access; admin table permissions must be assigned only to Petty Cash
Admin and employee Self/Parent permissions must remain unchanged. Do not expose
password/hash fields or enable either save flag yet. User reports completion;
this is not an independently verified live field/permission test.

## Deployment instructions (admin read check now user-confirmed)

1. In Studio create `Admin Users`, proposed partial URL `Admin-Users`; under its
   Page Settings > Permissions choose unique/restricted Read access for only
   Petty Cash Admin. Do not apply the restriction to Home. Ensure ordinary
   employees do not have home-level Grant Change that overrides Restrict Read.
   User now reports opening the deployed admin-users page; exact route casing
   and restriction configuration are not separately confirmed by its read test.
2. In Management > Web Templates update existing Petty Cash User Context Source
   with the complete local `Petty Cash User Context.html` (no script wrapper).
3. Create Web Template Petty Cash Admin on this website. Its Source is script
   opening tag, complete pettycash-admin.js contents, then script closing tag.
   No Page Template or Web File is required for this include.
4. Paste the entire Admin Users.html into the new page's HTML/code editor.
   It includes confirmed config and both template includes. Initial deployment
   used false flags; the current local copy enables the reviewed test form.
   Do not put native JS into the File Content uploader or duplicate config.
5. Save/sync/preview, sign in as the assigned admin and visit Admin-Users. Run
   `await PettyCashAdmin.checkSetup()` in the browser console and share the
   report. Expected read success with creationEnabled false and
   writePermissionsVerified false. No profile is created by this diagnostic.
   Keep the button disabled while role isolation/page access tests are pending.

## Live read result and next access checks

User's 2026-10-15 console screenshot reports contactsReadable true,
departmentsReadable true, contactCount 2, departmentCount 2,
creationEnabled false, writePermissionsVerified false, loginProvisioned false.
The two true values demonstrate successful paged list reads for this session.
The false values are expected: writes are disabled, checkSetup never tests
creation privileges, and login provisioning is outside this page. They are not
errors or evidence of failed password setup. No Contact was created by this
read-only call; no actual profile create/read-back has been tested live yet.

The following initial checks were instructed with both flags false:

1. Open the actual Admin page URL in a signed-out private session; it must not
   render the Admin form/page content (sign-in/access-denied is acceptable).
2. In a separate browser/profile sign in as a Contact without Petty Cash Admin.
   The same URL must be inaccessible, not merely absent from navigation.
   Do not test using the admin account or remove its only administrative role.
3. Check Contact - Admin Profiles and Departments - Admin Lookup role bindings
   contain only Petty Cash Admin, and that role's two default flags are No.
4. From the ordinary employee's working New Request page, a read-only collection
   query below must not return another Contact. Forbidden is also a denial but
   employee own-profile reads must still work. A successful read check is not a
   direct Create-denial test; direct POST isolation and protected-field/server
   validation remain part of the production checklist.

```javascript
(async () => {
  const ownId = normalizeGuid(document.getElementById("portalUserId")?.value);
  if (!ownId) throw new Error("Sign in as a non-admin employee first.");
  try {
    const { data } = await callWebAPI({
      method: "GET", url: "/_api/contacts?$select=contactid&$top=2"
    });
    if (!Array.isArray(data?.value)) throw new Error("Unexpected Contact response.");
    console.log({ returnedContacts: data.value.length,
      otherContactReadable: data.value.some(row => normalizeGuid(row.contactid) !== ownId) });
  } catch (error) {
    console.log({ status: error.status, message: error.message });
  }
})();
```

Expected successful self-scope result: returnedContacts 1 and
otherContactReadable false. The $top=2 query is sufficient to reveal any
additional row in this simple self-only Contact grant, not a complete security
audit of all roles/records/columns. Stop if otherContactReadable is true or the
Admin page renders for a non-admin. Do not change save flags merely to remove
the expected disabled button.

## Previous controlled profile create (user-reported complete)

User's subsequent "done" confirms the three requested checks: signed-out page
denial, non-admin page denial, and only Petty Cash Admin bound to the two new
table permissions. No separate employee collection/direct POST denial result
was supplied; broader tests remain unverified. Page denial alone is not proof
of direct-API denial or a complete security review.

Local Admin Users.html and canonical config now set creationEnabled and
securityReviewed true for this reviewed site. No server privilege or script
Web Template source changes. Update only the Admin page HTML, save/sync/preview
and reload as admin. Live enablement is not yet user-confirmed. Do not broaden
permissions, re-upload templates or deploy enabled config to unreviewed sites.

Create exactly one test employee profile using a distinct email controlled by
the tester and not already used by a Contact. Choose existing Department and
active manager Contact, business role Employee. Click Create once, wait and
share success/error text. Inspect saved names, email, business role, Department
and Reports To Manager in Dataverse. Success explicitly states profile created
and verified but login not provisioned. Do not email a password or change the
ledger. The test employee's empty cash ledger starts at zero.

The first record is now reported created; the user observed blank username and
Current Balance. The former profile-only code deliberately omitted both.
The new local zero-initialization patch is not yet live-confirmed. Deployment
requires updating both Petty Cash Admin Web Template from pettycash-admin.js
and Admin page HTML for the revised explanatory text. No new API field or
Write privilege is required: hr_currentbalance is already in the field list
and the only change is to the new-Contact Create payload/read-back. Do not
recreate the first Contact just to fill blank columns.

User confirmed separate username and manual field save generating a hash and
a usable sign-in. Input clearing was not separately confirmed. New local code
sends native username, login-enabled flag and New Password Input, but no new
API exposure/enablement is applied. Enhanced Authorization is reported off;
Power Pages Column Permission Profiles apply. ADMIN_CREDENTIAL_SETUP.md has
the staged profiles, all-role no-read review, gated future API list and native
processing/login test. Manual save does not prove processing on portal POST.
Never request password/hash contents or infer usable login from Contact save.

If the outcome is uncertain, keep the page/form unchanged and inspect Contacts
before another attempt. Do not send duplicate/reduced POST payloads or delete
an uncertain/partially verified Contact automatically. This phase does not
update/delete existing users. After recording the first result, separately
test duplicate email and ordinary employee isolation. The read-only checkSetup
function always reports writePermissionsVerified false; it is not a stored
indicator of whether an earlier actual create succeeded.

## Local verification

All 79 project tests pass, including 30 Admin tests for disabled gates,
role/context checks, input/payload, paging/duplicates, CSRF, single POST/read-back,
definite rejection, uncertain results, verification-only retries and diagnostics.
`scripts/verify_admin_page.cjs` passes mocked enabled, disabled, non-admin and
unconfigured states. Desktop/mobile screenshots were visually reviewed without
overflow. Existing Requests/Accounts browser regressions pass after the shared
context change. No tenant calls are made. Word documents remain historical
snapshots; this guide/log describe the current Admin phase. On 2026-10-15 a
configuration/read-query regression was added for confirmed `hr_departmentsid`,
followed by an exact-bind regression for live-confirmed Contact navigation
names. Save gates remained off during initial deployment. After embedding the configuration, the 68 tests
and mocked Admin browser QA were rerun successfully for enabled, disabled,
non-admin and unconfigured modes; desktop/mobile screenshots regenerated.
These tests do not verify tenant page permissions or actual Contact writes.
After the user-reported access checks, the current enabled configuration passed
all 68 tests and the same four mocked browser modes again. This does not replace
the live Contact create/read-back test. User subsequently reports that first
record created. The zero-summary extension then passed all 69 local tests and
the four mocked browser modes. Null/missing/nonzero summary fails verification
without overwriting it. The credential edition subsequently passed all 79 tests
and seven mocked browser modes, with desktop/mobile visual review. Actual
credential POST, column security and login are untested in the tenant; only
manual username/password processing and sign-in are user-confirmed.

## Sources

- [Contact authentication columns](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/reference/entities/contact#adx_identity_newpassword)
- [Supported local-account setup](https://learn.microsoft.com/en-us/power-pages/security/external-access)
- [Password reset process](https://learn.microsoft.com/en-us/power-pages/security/authentication/set-authentication-identity#reset-a-password)
- [Power Pages web roles](https://learn.microsoft.com/en-us/power-pages/security/create-web-roles)
- [Page restrictions](https://learn.microsoft.com/en-us/power-pages/security/page-security)
- [Role-based table permissions](https://learn.microsoft.com/en-us/power-pages/security/table-permissions)
- [Native Web API create and bind](https://learn.microsoft.com/en-us/power-pages/configure/write-update-delete-operations)
- [Column access controls and enhanced authorization caveat](https://learn.microsoft.com/en-us/power-pages/security/column-permissions)
