# Admin Users: profile-only setup

Current implementation: **admin-profiles-v3**, UI refresh 2026-10-31; profile-only
behavior from 2026-10-19 is retained. See [UI_REFRESH_SETUP.md](UI_REFRESH_SETUP.md)
for the updated page/template publication and responsive design checks.
This guide supersedes
earlier credential rollout instructions. Local implementation and mock tests do
not mean the updated page/template or site settings have been deployed.

## What the page does

Seven fields: optional first name, required last name, email, separate username,
business role, department and Reports To Manager. Names are limited to 50
characters; email is trimmed/lowercased and limited to 100. Username is trimmed,
case preserved, 3–100 letters/digits/dots/underscores/hyphens, starting with a
letter or digit. All four confirmed business-role choice values are retained.

One complete Contact POST writes firstname, lastname, emailaddress1,
adx_identity_username, adx_identity_logonenabled=true, hr_userrole,
hr_currentbalance=0 and both exact lookup binds hr_Department/hr_ReportsToManager.
The login flag alone does NOT provision a password or verify sign-in. The
Department table is hr_departments, set hr_departmentses, GUID hr_departmentsid;
its text name is hr_departmentname. Contact business role is not a website role.

No password input, native password-column write, hash/stamp access, password
email, invitation, ledger transaction, web-role assignment, existing-Contact
update or balance adjustment. Credential-like API input keys are rejected before
any request; legacy credential flags cannot restore the removed write path.

The script checks all Contact pages, including inactive records, for duplicate
email/username case-insensitively. Those checks are not atomic uniqueness
constraints. Active manager and Department selection, exact public read-back,
zero summary verification, same-origin session/CSRF and HTTPS checks remain.
Known saved IDs retry verification only. Changed retry inputs and uncertain
POST outcomes block further creation in the same open page. Nothing is stored
in browser storage. POST/transport errors are sanitized and rendered as text.

## Configuration and security

The page's embedded PC_ADMIN_CONFIG matches pettycash-admin-config.example.js:
creationEnabled=true and securityReviewed=true for this user's already reviewed
admin-only setup. The script's defaults stay false if flags are missing.
Only these two release switches remain. All metadata/choice values are unchanged.
To disable creation, set creationEnabled=false in the page before the Admin
template include, then publish/reload. That preserves read-only setup checks.

Retain the existing Petty Cash Admin-only page Read restriction, Contact Global
Read/Create/Append/Append To grant and Department lookup permission. Employees
keep Self-scoped Contact Read and no Contact Create/Write. Hidden inputs and
business-role choices are cosmetic UI context, not server authorization. No
permission widening or new table/column/key/role is required by this cleanup.

Current Contact API field union (preserve extra independently validated public
fields required elsewhere, never wildcard or secret fields):

```text
_hr_department_value,_hr_reportstomanager_value,adx_identity_logonenabled,adx_identity_username,contactid,emailaddress1,firstname,fullname,hr_Department,hr_ReportsToManager,hr_currentbalance,hr_userrole,lastname,statecode
```

Remove ONLY adx_identity_newpassword from the previously tested union; hash and
security stamp remain absent. Keep Webapi/contact/enabled=true and Department
fields hr_departmentname,hr_departmentsid,statecode. Preserve current column
profiles, including the Create-only input exception while the Admin profile has
default Read; removing an exception without review could restore default access.
No password-column permission or authorization-model change is needed. These
are user-admin deployment instructions, not assistant-applied tenant changes.

## Publish both matching artifacts

1. Update existing Web Template **Petty Cash Admin** Source with one script tag,
   complete pettycash-admin.js, and closing script tag. Do not upload a Web File.
2. Replace existing Admin Users page HTML with complete **Admin Users.html**.
   Keep the existing route, page restriction and one User Context include.
   Config must occur before the Admin template include; do not load either twice.
3. Save/sync/Preview and reload. Authorized admins should see seven usable fields
   and the profile-only readiness message. The script rejects old password-form
   HTML with an explicit paired-deployment error instead of acting on it.
4. Check window.PettyCashAdmin.version returns **admin-profiles-v2**. Optionally
   await PettyCashAdmin.checkSetup(): profileOnly=true, passwordSetupRequired=true,
   loginProvisioned=false; it reads only and does not verify server write rights.
5. Create a unique test profile once and verify username, zero summary and lookup
   values. If the result is uncertain, inspect Contacts before another attempt;
   don't recreate the account or automatically patch it.

## Set the password separately

Open the same saved Contact in Management, selecting All/Active Contacts rather
than a restrictive view if needed. Select Change Password (may be under More
commands), supply a fresh non-empty password, and complete the process. This
requires Dataverse System Administrator privileges, not just the website role.
Do not use the command's blank-input/remove-password path. Assign website roles
separately where needed and test sign-in in a private browser session.

User already reported this Management password/sign-in/request path successful
on the earlier test Contact. Clear any retained plaintext New Password Input
test value through a Dataverse administrator without sharing/reusing it. That
cleanup and current API field removal remain unconfirmed. This new page does
not change previously saved Contacts or their credentials.

## Verification and boundaries

87 unit tests pass (31 Admin). Mock browser checks pass seven states: enabled,
disabled, non-admin, unconfigured, old HTML, rejected POST and verification retry;
desktop/mobile profile layouts reviewed. Tests assert no password controls or
credential payloads, profile/username/zero/binds, disabled default guards, duplicate
and error handling, and no repeated POST during verification. No live tenant
record, password, setting, permission or role was changed by the assistant.
Repeat signed-out/non-admin page denial and direct-API access checks after
deployment; mocks and cosmetic role checks do not certify server authorization.

## References

- [Microsoft account/password management](https://learn.microsoft.com/en-us/power-pages/security/external-access)
- [Microsoft Web API column permissions](https://learn.microsoft.com/en-us/power-pages/security/column-permissions)
