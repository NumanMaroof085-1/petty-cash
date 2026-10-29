# Finance cash management

Latest user update (2026-10-29): Finance page is reported working after the
visibility/helper corrections. This confirms the user-observed UI outcome;
effective access and backend posting are not independently verified. The next
stage is section 4: build the secured Finance posting flow, then test it before
enabling cash movements. Local posting configuration remains disabled.

## Inline hiding and duplicate page content (2026-10-29)

User browser diagnostics show two Finance sections, two helper copies, but only
one employee selector/status/form. The form has hidden=false while its inline
style still has display:none. This confirms independent inline hiding; it does
not establish where the second rendered section originates.

The current helper version is finance-ledger-v2. After the Finance role check,
it explicitly displays the Finance form and history, leaving posting gates
unchanged. A repeated include of the same version preserves the existing helper,
handlers and pending posting key instead of initializing again.

Publish the complete updated pettycash-modules.js inside one script wrapper in
the Petty Cash Modules Web Template Source. In the existing Finance page source,
replace the old Finance fragment with Finance Cash Management.html, rather than
appending another fragment. Keep one Finance content block and one Modules include.
If a second heading remains, inspect the page's other content blocks and assigned
Web Template for a second Finance fragment/include; the duplicate's exact source
has not been inspected. Do not delete the page or change permissions to fix this.

After publishing and reloading, verify version finance-ledger-v2, one Finance
section, one employee selector and a visible form/history. The employee directory
and balance/history should work; cash posting remains disabled until the secured
flow is connected and tested. These local changes do not enable financial writes.

Implemented locally 2026-10-29. User selected a NEW exact Power Pages web role
**Petty Cash Finance**. No role, page, permission, flow or transaction was created
in the tenant by the assistant. Posting is deliberately disabled in the supplied
page configuration until the protected backend is connected and tested.

Status update 2026-10-29: the user reports the Petty Cash Finance role created.
Its website/default flags, Contact assignments and effective privileges have
not been independently inspected or separately confirmed. Next: verify its
intended members and credential-field exclusion, then create the two Finance-
only Global Read table permissions below. No posting flow is connected yet.

Subsequent user update: the Finance read-permission/checklist step is reported
done. This is not independent inspection of the settings or effective access.
Next: restrict/publish the Finance page and update the two shared templates,
then verify employee selection, balance/history and non-Finance denial. Posting
must remain disabled; amount/movement fields being disabled is expected until
the protected flow is configured, not a page initialization error.

This guide supersedes the older Accounts-page/flow naming in
BALANCE_MODULE_SETUP.md. That guide's signed-ledger rules remain valid. The old
Accounts Cash Management.html is a retired draft; the updated module disables
it. Do not publish a second cash-entry page or allow the old Accounts role to
call the Finance flow.

## Page and cash rules

Finance Cash Management selects an active Contact by name, separate username
and GUID suffix (duplicate names are not identity keys). It reads the entire
authorized employee-filtered Cash Transaction ledger, shows its signed balance
and interpretation, and displays the latest 10 rows with UTC dates. It does not
use Contact.hr_currentbalance as the authoritative balance.

- Add / cash given = positive movement. Reimbursement uses the same operation.
- Deduct / cash returned by employee = negative movement.
- Enter a positive movement amount with up to two decimals, not the desired
  replacement balance. The preview uses integer cents and is NOT a posting.
- Negative employee balances remain allowed. Approved expenses are posted only
  by the separate approval backend; this page cannot post expense approvals.
- A reason/reference (1–100 characters) and explicit checked confirmation are
  required by the UI before posting. Changing draft details unchecks it.

All ledger amounts stay positive; the confirmed type choices are Advance Given
123140000, Expense Approved 123140001, Cash Returned 123140002. The existing
table is hr_cashtransaction / hr_cashtransactions. No new balance table, schema
column or arbitrary balance-override field is introduced by this page.

The page uses the existing native-session/CSRF flow transport, not direct ledger
POSTs or Contact balance PATCHes. A UUID operation key is retained on every
failure; changed details are blocked, inputs lock and Retry same cash movement
keeps the same key. Only HTTP 200 with matching posting/employee/transaction IDs
and a numeric two-decimal balance confirms success. 202, mismatched or malformed
responses remain unconfirmed. Refresh while pending does NOT preview the same
movement again. Keep the page open; the key is in memory, not browser storage.
After confirmed success, amount/reason/confirmation clear and a fresh movement
gets a new key. A page reload/new key cannot deduplicate a human entering the
same cash event again—check the ledger/reference before restarting.

## 1. Create and assign the website role

In Management, create **Petty Cash Finance** on the Petty Cash website. Both
Authenticated Users Role and Anonymous Users Role flags must be No. Assign it
only to authorized Finance Contacts. Do not grant it to every authenticated
user. The Contact hr_userrole business choice (including existing Accounts
123140002) does not authorize the page/flow; no Choice rename/value change is
required. Admin-only and Petty Cash Accounts-only users are not Finance.

## 2. Finance-only page and read permissions

Create one page **Finance Cash Management**, proposed partial URL
**Finance-Cash-Management** under Home. If the old Accounts page already exists,
replace/rename that page rather than keeping duplicate financial entry points;
the existing actual route has not been confirmed. Set its Page Permissions to
restrict Read to Petty Cash Finance only; restrict navigation too. Review
inherited/overlapping grants. Hiding a menu or modifying hidden role inputs is
not authorization. Test signed-out/employee/Admin-only/Accounts-only URL denial.

Add two table permissions, attached ONLY to Petty Cash Finance:

Before granting Global Contact Read, confirm Webapi/contact/fields excludes
adx_identity_newpassword, adx_identity_passwordhash and adx_identity_securitystamp.
Retain all other working public fields. The old password-input cleanup/API
removal was instructed but not separately tenant-verified; do not accidentally
expose that historical input through a new global role.

| Name | Logical table | Scope | New privileges |
| --- | --- | --- | --- |
| Finance — Employee Directory Read | contact | Global | Read only |
| Finance — Cash Ledger Read | hr_cashtransaction | Global | Read only |

Do NOT grant portal Create/Write/Delete on cash transactions or Contact balance
columns. Existing employee Self Contact/Contact-scoped ledger permissions stay.
Global Finance Read intentionally permits authorized Finance staff to inspect
other employees' profiles/ledger, not ordinary employees. Review cumulative
web roles/column profiles; a narrow new grant does not cancel broader grants.

The current Contact API union already includes contactid, fullname,
adx_identity_username and statecode. Preserve that full working public union;
never replace it with only the Finance subset. For standard authorization
(reported Enhanced Authorization off), associate a Finance Contact Column
Permission Profile with no All Column Permissions defaults and those four
explicit Read columns if required by the site's current model. Keep password,
hash and stamp excluded; do not remove existing protective exceptions. Existing
Authenticated Users column profiles may cumulatively permit more public fields.

Keep Webapi/contact/enabled and Webapi/hr_cashtransaction/enabled true. Required
ledger fields already used by balances/history:

```text
_hr_employee_value,_hr_linkedrequest_value,createdon,hr_amount,hr_notespurpose,hr_transactionreference,hr_transactiontype
```

No posting-key exposure is needed in the browser field list. Do not add secret
fields or broaden authenticated-user scopes to fix Finance read failures.

## 3. Publish matching local sources

Troubleshooting reported during publication: the user's pasted visible page
text shows the full pettycash-modules.js body after "Checking Finance access".
The browser is rendering the helper as text rather than executing it. Check
the Petty Cash Modules Web Template Source for a missing/escaped script wrapper:
replace its content with ONE opening script tag, the complete raw JS and ONE
closing tag. Do not use Markdown code fences, escaped &lt;script&gt;, a visual
text editor or append a duplicate copy. This is a script-publication issue,
not proof that Finance permissions or ledger reads work. After save/sync/reload,
the visible code should disappear and window.PettyCashModules?.version should
return finance-ledger-v2. No additional permission or posting enablement is
needed to correct the wrapper. Further live read checks remain pending.

1. Update **Petty Cash User Context** Web Template Source with complete
   Petty Cash User Context.html. Context version is web-template-v2-finance,
   adding pcFinanceAllowed from exact Finance web-role membership. Existing
   signed-in IDs/Admin role inputs are preserved. pcAccountsAllowed remains a
   legacy marker only and never authorizes Finance.
2. Update **Petty Cash Modules** Source with one script tag, complete
   pettycash-modules.js and closing script tag. Module version finance-ledger-v2.
3. Publish complete **Finance Cash Management.html** as that page's HTML. It
   includes User Context, then its embedded configuration, then Modules exactly
   once. Do not put user-role Liquid into editable attribute values or load the
   shared script twice. Existing request/dashboard/Admin/receipt sources need
   no replacement for this addition, but the shared templates must be updated.
4. Save/sync/Preview/reload as Finance. Select an employee and verify balance and
   history. Read-only setup is expected; Record remains disabled until backend
   setup. A failed ledger read shows Unavailable, never a false zero/partial sum.

Page configuration matches pettycash-module-config.example.js:

```javascript
financeFlowId: "",
financeSecurityReviewed: false
```

Old accountsFlowId/accountsSecurityReviewed no longer enable posting. Do not
replace the blank value with a public/signed HTTP flow URL. Use only the GUID of
the site-associated Power Pages flow, before the Modules include.

## 4. Posting backend: required next deployment stage, not implemented here

Use [FINANCE_FLOW_SETUP.md](FINANCE_FLOW_SETUP.md) for the complete manual build
recipe. It includes a new Recorded By Contact lookup (proposed, not created by
the assistant), trusted caller mapping, create/recover scopes, full-ledger checks
and typed responses. Copy the actual generated column/primary ID names before
using its metadata placeholders. The recipe does not maintain the Contact
summary; the existing portal continues to read the authoritative ledger.

### Finding the trigger

The user reports that "When Power Pages calls a flow" is not visible. It is a
trigger under the Power Pages connector, not an existing flow/template name.
Start from this site's Set up > Cloud flows > Create new flow, and search the
trigger picker for Power Pages. Confirm the selected environment matches the
site. If the editor shows a New designer toggle, turn it off: Microsoft currently
lists this trigger as unsupported in the new designer. This documented limitation
is a troubleshooting lead, not confirmation of why this user's picker lacks it.
If still absent, inspect a screenshot of the current picker before substituting
any trigger or changing the frontend transport. Keep posting disabled.

References: [integration creation steps](https://learn.microsoft.com/en-us/power-pages/configure/cloud-flow-integration)
and [designer limitations](https://learn.microsoft.com/en-us/power-automate/flows-designer#limitations-and-known-issues-in-the-new-designer).

This page alone cannot safely post money. There is no tenant connector available
to create/deploy a flow in this session. The contract below is not an importable
flow or proof that a posting backend exists. Keep the switches disabled.

Create a solution-aware flow using **When Power Pages calls a flow**, associate
it with THIS site and allow ONLY Petty Cash Finance. Native flow invocation is
form-encoded eventData JSON via /_api/cloudflow/v1.0/trigger/<flow-guid>. The
frontend sends exactly these input keys:

```json
{"employeeId":"<contact-guid>","movement":"cash_given","amount":1000,"notes":"Cash advance","postingKey":"<operation-uuid>"}
```

finance-cash-request.schema.json documents that payload only. Verify actual
trigger schema/property names, not just friendly designer labels. Schema/HTML
validation is not sufficient: explicitly validate UUIDs, active eligible
employee, the two allowed movements, positive decimal cents, field/financial
limits, trimmed nonempty reason and posting key on the server. Reject attempts
to send expense_approved, negative amounts, replacement balances or actor IDs.
Ensure currency is PKR and consistent with the employee ledger; confirm the
actual Dataverse currency row/configuration rather than assuming a base currency.

Use the existing **crec6_postingkey**, schema crec6_PostingKey, with its Active
unique key (user-confirmed earlier; recheck in the tenant). Do not create the
old proposed hr_postingkey or use an autonumber reference as a dedupe key.

Required server algorithm:

1. Enforce site/Finance authorization and obtain actor identity from trusted
   trigger context (the documented User ID dynamic value), never eventData.
   Verify that actual identity mapping and record a durable actor audit. A
   Dataverse service-connection Created By is NOT necessarily the Finance
   Contact. No actor-column schema is assumed/created here; resolve existing
   audit storage or an explicitly approved new lookup before production.
2. Validate employee eligibility, PKR currency and all input fields using decimal
   or integer-cent arithmetic, not a floating-point read/increment/write balance.
3. Find the existing key. On retry compare all canonical movement fields AND
   actor; return the original confirmed transaction for an identical event,
   reject altered data. Never update an existing movement via upsert.
4. For a new key add exactly one Cash Transaction with positive hr_amount,
   Employee lookup, hr_transactiontype 123140000 or 123140002, reason and
   crec6_postingkey. Leave Linked Request empty for these movements. Use actual
   tenant lookup metadata/connector fields, not guessed navigation names.
5. Concurrent requests can both miss the initial lookup. The unique key must
   enforce one create. A duplicate-key failure must re-read/compare the existing
   event, not retry an unconditional create or blindly report failure/success.
6. Read the durable row and calculate the signed ledger total across ALL employee
   rows/pages. Never silently truncate aggregation/pagination. Do not naively
   increment Contact.hr_currentbalance: sequential Add Row then Update Contact
   is not atomic. The ledger is authoritative; a summary projection needs a
   separate concurrency-safe/reconciled process, or a transactional server API.
7. Return confirmed success only after durable posting, with typed fields:

```json
{"status":"posted","postingKey":"<same-uuid>","employeeId":"<same-contact-guid>","transactionId":"<saved-row-guid>","balance":1000}
```

balance must be a JSON number, not a quoted string. HTTP 202 is not confirmation.
The UI uses the returned confirmed balance, then offers Refresh for ledger rows;
test actual tenant visibility/cache timing. The backend must not trust the
browser's current balance, preview, confirmation checkbox or cosmetic role flag.

Before enabling, test direct flow denial for every non-Finance role, duplicate
key retries, mismatched-key payload/actor, concurrent events, partial failure,
precision/currency/employee validation and ledger/summary reconciliation. Only
then fill financeFlowId and explicitly set financeSecurityReviewed=true. Portal
permission and connection-principal privileges are different security layers.
Power Automate licensing/site-version prerequisites also need tenant review.

## Test results and remaining user actions

126 code tests pass, including existing request/receipt/suggestion/Admin tests.
Eight mocked Finance browser states pass: read-only, committed-but-unconfirmed
retry, employee/Admin-only/Accounts-only/signed-out denial, invalid ledger and
out-of-order A→B→A selection. Tests demonstrate one ledger movement per retried
key, reset/confirmation, add/return negative balances, duplicate-name selection,
no double projection while pending, mobile layout and no direct table writes.
Desktop/mobile screenshots visually reviewed. Existing module-page and Admin
browser checks pass. These are synthetic tests, NOT tenant authorization or
real-money concurrency guarantees.

The user has now reported the Finance role/read setup complete and the page
working. Next: build/connect the secured posting flow with the above unresolved
audit/currency/metadata checks and authorization/retry tests before enabling it.
No actual money posting has been enabled by the assistant.

## Sources

- [Power Pages cloud flows](https://learn.microsoft.com/en-us/power-pages/configure/cloud-flow-integration)
- [Trigger User ID example](https://learn.microsoft.com/en-us/power-pages/configure/image-library-how-to)
- [Page permissions](https://learn.microsoft.com/en-us/power-pages/security/page-security)
- [Table permissions](https://learn.microsoft.com/en-us/power-pages/security/table-permissions)
- [Column permissions](https://learn.microsoft.com/en-us/power-pages/security/column-permissions)
- [Alternate-key uniqueness and null restrictions](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/define-alternate-keys-reference-records)
