# Administrator credential creation setup

## Superseded by profile-only cleanup — 2026-10-19

The user requested removal of website password collection/submission. That
cleanup is now implemented locally as **admin-profiles-v2**, with seven profile
fields, username/zero initialization and only creationEnabled/securityReviewed
switches. Credential flags and the password-writing path were removed, not
merely hidden. Passwords are set separately on the saved Contact in Management.
See **ADMIN_PROFILE_SETUP.md** for current deployment/configuration instructions.
The retained test report and experimental design below are historical only;
do not restore old credential flags, password controls or native-input exposure.

## Current result — 2026-10-19

User-reported live testing supersedes the experimental rollout instructions
below. The user confirmed admin-credentials-v1 on the website. Contact/profile
creation worked, but the submitted New Password Input remained populated and
no hash was generated after refresh. Direct portal Contact Create did not
provision credentials in this environment. Do not repeat the experimental
password POST, retry it through PATCH or generate a password hash in browser code.
The exact native workflow/plugin trigger configuration was not inspected.

The user subsequently found the Contacts by changing the Management list filter,
used the supported Change Password command, signed in successfully as the new
account and created a petty cash request. This verifies the reported native
Management credential path and that account's sign-in/submission, not custom
website password provisioning or every role/record access restriction.

Canonical local flags remain creationEnabled=false, securityReviewed=true,
credentialSubmissionEnabled=false and credentialSecurityReviewed=false. The user
was instructed to disable the live experimental creation/credential flags;
that rollback has not been separately confirmed. Stop website password
submissions. Remove only adx_identity_newpassword from Webapi/contact/fields
while this path is stopped; preserve working public fields and table grants.
Never add passwordhash/securitystamp or broaden secret Read/Update access.

The retained test password must not be reused. Have a Dataverse administrator
clear only the retained New Password Input test value and verify it is empty,
without sharing values or selecting Confirm Remove Password. Cleanup/retention
was not separately confirmed by the successful sign-in report. Do not delete
or recreate the Contact, remove its working password or change its ledger.

For now, use the supported Management Change Password command with a fresh,
non-empty password on an existing Contact. Keeping provisioning entirely inside
the custom Admin website needs a separately reviewed supported server-side
design; none is implemented or authorized by this test report. No new password
column, automatic password email, invitation scheme or identity-provider change
was introduced. The current credential form is not a profile-only mode: keeping
its credential gates off disables its save operation as a whole. A future
profile-only revision would need an explicit implementation and tests.

Reference: [Management account provisioning](https://learn.microsoft.com/en-us/power-pages/security/external-access).

## Historical experimental design and test procedure — not release approval

The local Admin form collects a separate username, temporary password and
confirmation, initializes a new Contact summary to zero and submits New Password
Input once when all guards are enabled. The following describes that existing
implementation and the earlier experiment; it must not be treated as permission
to re-enable the failed native-input path.

## Evidence and limits

- User requests a separate username, not automatic email-as-username.
- User reports that manually entering username and New Password Input in
  Dataverse generates a hash and permits website sign-in. No actual password
  or hash was requested or received. Automatic clearing of the input was not
  separately confirmed. Manual save does not prove portal Contact POST processing.
- User reports Enable Enhanced Authorization is unchecked/disabled. This is
  different from the site's enhanced data model. Use Power Pages Column
  Permission Profiles, not the preview enhanced-authorization security profiles.
  Do not switch authorization models for this feature.
- The existing profile-only page created a Contact successfully. The new zero
  initialization and credential POST have not been tested live. The original
  blank fields are not automatically backfilled, updated or recreated.
- User now pasted the complete Contact field setting shown below, including
  `adx_identity_newpassword`. The zero-row admin probe returned 200 for
  `contactid` and 403 with `Attribute adx_identity_newpassword cannot be found
  for table .` for New Password Input. No secret value was returned. This is
  not a missing entry in the reported allow list; it does not establish whether
  column filtering, portal field availability or cached configuration produced
  the message, nor whether Create would work. Keep credential release disabled;
  do not grant secret Read or remove the Create-only exception to make GET pass.

## Password inputs are possible; registration and provisioning differ

Power Pages' built-in local registration accepts a username/password and creates
the associated Contact. That supported registration process is not the same as
an admin creating another employee through this custom Contact Web API form.
Do not enable public/open registration for this private employee portal just to
avoid the custom provisioning issue. No registration settings changed here.

The local admin form already has masked initial-password inputs, but successful
portal Contact Create processing and subsequent sign-in remain unverified. The
reported GET failure does not prove that Create is unsupported or supported.
The documented Management username/Change Password process remains a supported
fallback. A reviewed server-side provisioning endpoint is another possible
design, not something implemented or deployed here. Do not add a new plaintext
password column or write password hashes from browser code.

See [native local registration](https://learn.microsoft.com/en-us/power-pages/security/authentication/set-authentication-identity)
and [Management account provisioning](https://learn.microsoft.com/en-us/power-pages/security/external-access).

## New local functionality

`Admin Users.html` adds required username and two masked password inputs.
Username is trimmed, case preserved, 3–100 characters, starts with a letter or
digit and allows letters/digits/dot/underscore/hyphen. Email is separate and
lowercased. Password is 12–100 characters, not trimmed, may contain spaces,
cannot contain NUL/line breaks, and must match confirmation. These are local
application limits; Dataverse/site password rules may reject additional values.
No forced first-login password change is configured or promised.

`pettycash-admin.js` version is `admin-credentials-v1`. It selects all pages of
Contacts including inactive rows to reject duplicate email or username
case-insensitively. These browser checks are not atomic uniqueness guarantees.
It submits one complete Contact POST containing:

- Existing profile fields and verified Department/manager binds.
- `hr_currentbalance: 0`, only for a new Contact, never an arbitrary amount.
- `adx_identity_username`: independently entered username.
- `adx_identity_logonenabled: true`: native initial login flag.
- `adx_identity_newpassword`: transiently supplied temporary password.

No password hash, security stamp, email-confirmed flag, website-role assignment,
existing-user update or cash-ledger entry is written. A business hr_userrole
value does not grant website permissions. Table Create remains Admin-only.

## Secret handling and honest verification

Credentials require HTTPS, native session/CSRF and all four release flags.
The password is not placed in retry state, fingerprints, return values,
diagnostics, logs, URLs or browser storage. UI inputs clear immediately after
submission starts and again after success/failure. Temporary JS/request strings
are released after use; this is not a guarantee of physical memory erasure.
Authorized browser network tools can see submitted request bodies, so do not
share HARs, request bodies or raw response screenshots containing credentials.

Sensitive POST errors discard server messages that may echo input; only a
generic HTTP/status hint is shown. Transport/read errors discard original
exceptions. Do not add payload logging, raw exception diagnostics, or expose
credentials through flows, telemetry or Dataverse audit/history. Review native
input processing/retention/auditing before use with real employee passwords.

Read-back verifies public profile fields, username, Login Enabled and zero
summary only; it never requests the password input, hash or security stamp.
Success reports password submitted, NOT verified credential processing or
successful sign-in. Diagnostics return credentialProcessingVerified false and
loginProvisioned false until actual login is separately tested/recorded; the
current diagnostic implementation does not perform or remember a login test.

If a Contact is known saved but read-back failed, retain its public values/ID
and retry GET verification only, without asking for or resending the password.
Ambiguous POST outcome blocks another create. Retry state is in memory only;
keep the page open and inspect Contacts before any further attempt. Never
retry a credential POST by stripping fields or automatically updating a password.

## Release guards

Current canonical config and embedded page config:

```javascript
creationEnabled: false,
securityReviewed: true,
credentialSubmissionEnabled: false,
credentialSecurityReviewed: false
```

Existing page/table checks are user-reported passed; this does not approve the
new credential exposure. Both credential guards must explicitly be true and
creationEnabled must be true before any credential save. Core defaults are
false. While credential guards are false, initialization makes no API calls
and keeps all fields/button disabled with a security-setup message.
Creation is also false so a new page pasted against the old profile-only
template cannot silently ignore credentials and create another incomplete login.

## Admin column profile (user screenshot confirms configuration)

Do not change API fields yet. In Power Pages Management > Security > Web Roles,
open Petty Cash Admin > Related > Column Permission Profiles. Review existing
Contact profiles first; do not silently replace unrelated grants.

Create profile `Contact - Admin Column Access`, table `contact`, correct
Petty Cash website, associated only with Petty Cash Admin. Set All Column
Permissions to Read and Create, not Update. Add an explicit Column Permission
for `adx_identity_newpassword` with Create only: Read and Update unselected.
Save and inspect the actual row and role association. Do not leave that column
undefined: it would inherit the profile's default Read/Create. If the UI differs
or cannot express Create without Read, stop and share the settings screenshot
without credentials; do not broaden permissions as a workaround.

This profile alone is NOT sufficient. Keep the native input out of the API
allow-list and save guards off until all Contact-reading roles are reviewed.

The user's 2026-10-15 screenshots confirm the saved profile on the correct
Petty Cash website/table, All Column Permissions Create/Read, explicit
adx_identity_newpassword Create only, and only Petty Cash Admin in its Web
Roles grid. This confirms those profile settings/association, not effective
read denial when overlapping roles/profiles are combined. No secrets shown.

## Remaining protection before exposure

Review Authenticated Users and any Accounts/Manager/other role that can read
Contact, plus all overlapping column profiles. No effective role combination
may read New Password Input; only Admin may Create it, nobody may Update it
through this form. Ordinary employees keep Self Read and no Contact Create/
Write. Do not enable ordinary employee Create or Update in table permissions.

Next create `Contact - Employee Column Access`, table contact, same website,
and associate it with Authenticated Users. Leave All Column Permissions empty
(no Read, Create or Update selected). Add one Column Permission record per
logical column below, with Read only. This is a positive allow-list, not an
empty password override inheriting a broad Read default:

```text
contactid
firstname
lastname
fullname
emailaddress1
statecode
hr_userrole
hr_currentbalance
hr_department
hr_reportstomanager
adx_identity_username
adx_identity_logonenabled
```

Do not add New Password Input, Password Hash or Security Stamp to this profile.
Do not attach the Admin Create/Read profile to Authenticated Users, enable any
employee Contact Create/Write, or change the existing Self-scoped table grant.
Required extra public Contact columns used by other pages must be explicitly
reviewed/added Read-only, not addressed by granting all columns.
Review any other Contact-reading role and ensure its effective profiles also
exclude secret reads; future Accounts/Manager grants need the same review.
The current screenshot inventory shows employee Self Read and Admin Global
Read, not proof of all future/custom role configurations.
Do not assume multiple profiles or roles cancel a broader grant. Validate
effective permissions as admin and employee; keep guards off if inconclusive.
The profile-grid screenshot confirmed blank default permissions. The user's
subsequent detailed screenshots now show all 12 requested columns with Read
only (Rows: 12) and Authenticated Users on the correct Petty Cash website.
No password/hash/stamp entries appear. Both documented column profiles are
configuration-confirmed; the later zero-row test rejected secret selection,
but does not establish effective value-level protection or Create support. Normal
employee profile/balance/request reads and admin public reads still need a
regression after the new profiles. Do not infer effective rights solely from
screenshots or cancel broader grants by assuming restrictive profiles win.

Power Pages column permissions apply only to Web API. Do not expose input/hash
via Liquid, forms, lists, search, exports or other routes. Hash and security
stamp remain excluded from all website field lists and diagnostic queries.
If no-read handling/native processing cannot be verified, retain the supported
Management credential procedure or use a reviewed server provisioning endpoint
instead; neither a new flow nor alternate identity provider is deployed here.

## Contact field allow list and reported empty-result permission probe

Both profile configurations are confirmed in screenshots. The user now reports
the existing Webapi/contact/fields setting equals the union below. No need to
repeat this update. Preserve any additional validated public columns required
elsewhere; keep enabled=true.
No duplicate setting, hash/stamp entry or wider table grant. This stage makes
the native input allow-listed, not proof of portal Create support, while guards
remain false and no passwords are submitted yet. Do not enable if other custom
Contact-reading roles/profiles beyond the shown inventory have broad secret
Read grants; review those first.

Username/Login Enabled are public read-back fields. Normal app GETs never
select New Password Input; the empty-result diagnostic below is a narrowly
scoped exception for permission validation that cannot match a real Contact.
Complete union:

```text
_hr_department_value,_hr_reportstomanager_value,adx_identity_logonenabled,adx_identity_newpassword,adx_identity_username,contactid,emailaddress1,firstname,fullname,hr_Department,hr_ReportsToManager,hr_currentbalance,hr_userrole,lastname,statecode
```

No passwordhash/securitystamp field. Site field lists alone do not distinguish
Read from Create; the screenshot-reviewed controls must remain attached.
Keep Department list and existing page/table grants unchanged. No new table,
column, key, role, flow or direct Contact Write permission is needed here.

The user ran the following read-only probe as admin on the working
New Petty Cash Request page (not Admin Users, which has no global callWebAPI).
The all-zero GUID filter matches no real Contact; only status/
error metadata are output, never field values or response bodies. The public
selection is a control to distinguish general API denial from column rejection.

```javascript
(async () => {
  if (typeof callWebAPI !== "function") throw new Error("Open the New Petty Cash Request page first.");
  const base = "/_api/contacts?$filter=contactid eq 00000000-0000-0000-0000-000000000000&$top=1&$select=";
  const report = [];
  for (const column of ["contactid", "adx_identity_newpassword"]) {
    try {
      const { xhr } = await callWebAPI({ method: "GET", url: base + column });
      report.push({ column, status: xhr.status, message: "Request succeeded" });
    } catch (error) {
      report.push({ column, status: error.status, message: error.message });
    }
  }
  console.table(report);
})();
```

Record the actual output. Public request should succeed while protected-column
selection should be rejected for lack of Read. A successful empty response is
inconclusive, not proof that values are readable or safely denied: the backend
may skip value checks when no rows match. A 400/401/general error is not by
itself proof of column enforcement either. Review exact result before enabling.
If inconclusive, use further configuration/effective-access review or a blank
synthetic record probe, never retrieve an existing real password. Repeat under
an ordinary employee session and rerun normal employee setup/balance reads.
Current flags remain false; this probe creates/updates no Contact and does not
verify the Create operation or native password processing.

## Later controlled rollout not yet authorized by configuration

If the empty-result probe is inconclusive, test input GET denial with a blank synthetic test Contact
(never a real employee password). A returned null alone is not proof of denial
when the field is empty. Stop if read access is granted or the result unclear.
Check normal employee balance/profile/request reads still work. Obtain only
status/permission screenshots, not raw secret-field responses.

Then update Petty Cash Admin template from the canonical JS inside script tags,
and update Admin page HTML. Unlike the preceding config-only step, both files
changed in this credential edition. Check PettyCashAdmin.version equals
admin-credentials-v1; keep release flags false until a controlled test is ready.
Do not duplicate scripts/config or recreate the page/role.

Run read-only checkSetup once username fields/read permissions are available.
It reports version, list counts and guard state, not password contents or login
success. Enable reviewed guards only for an isolated test with a new unique
username, email controlled by the tester and a never-reused synthetic password.
Verify one Contact, public fields and zero summary; separately sign in as that
Contact in another private/browser session and confirm expected native input
consumption via Management without sharing values. If password stays stored,
hash/sign-in does not work or processing is uncertain, stop; do not use real
employee passwords or retry with PATCH/stripped fields. User-reported manual
Management processing is not a substitute for this new portal Create test.

No automatic repair of the earlier blank Contact, password email, bulk creation
or password reset is implemented. No tenant changes were made by the assistant.

## Local verification

79 tests pass (30 Admin). Coverage includes four save gates, HTTPS, native
username/zero/login flag read-back, password validation, exact single POST,
duplicate checks including inactive/paged Contacts, server/transport/read error
redaction, secret-free retry state/diagnostics, and verification without password
resubmission. Mock browser passes seven states: enabled, disabled, non-admin,
unconfigured, credentials-disabled, rejected POST, verification-only retry.
Desktop/mobile masked layouts were visually reviewed; secret inputs clear on
success and failure. Test data are synthetic; none of this verifies tenant
column policies, native password consumption, real sign-in or reset email.

## Sources

- [Native Contact fields](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/reference/entities/contact)
- [Power Pages column permissions](https://learn.microsoft.com/en-us/power-pages/security/column-permissions)
- [Enhanced authorization and its separate control model](https://learn.microsoft.com/en-us/power-pages/security/unify-pages-security-with-dataverse)
- [Supported Management username/password setup](https://learn.microsoft.com/en-us/power-pages/security/external-access)
- [Microsoft security guidance for all rendering paths](https://learn.microsoft.com/en-us/power-pages/security/security-best-practices)
