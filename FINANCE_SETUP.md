# Finance cash management

2026-10-31 read-only configuration correction: the live Console returned an
empty flow ID and Boolean false after the UI publication. Local Finance HTML now
retains the user-confirmed invocation GUID 0b0976ac-a6d3-f111-a05d-70a8a52176fd
and financeSecurityReviewed:true before the Modules include. The reusable example
and shared script still default to disabled. Publish the corrected page and
reload once pending operations are resolved; this change does not run a flow or
change server permissions. Older blank/default instructions below are historical.

2026-10-31 UI refresh: the local shared script is now finance-posting-v5.
The redesigned page preserves the cash-posting contract and self-posting guard;
see [UI_REFRESH_SETUP.md](UI_REFRESH_SETUP.md). Keep the existing live
PC_MODULE_CONFIG when replacing the Finance HTML. No native flow changes are
needed for this UI update, which has not yet been published by the assistant.

Latest 2026-10-31 report: user added the Finance self-posting condition and
published the new script. Record installation as user-reported; native denial
tests remain unverified. User also confirms approval-created cash rows lack
posting keys. MANAGER_APPROVAL_FLOW.md now recommends stable expense-<request
GUID> keys, same-request expense lookup/compare, safe legacy backfill, and
avoiding repeated incremental Contact-summary changes. Balance display itself
uses type/amount/employee and duplicate expense Linked Request, not posting keys.

2026-10-31 update: user reports the latest pre-v4 shared script published and
the separate manager approval flow created. Screenshot inventory and limits
are in [MANAGER_APPROVAL_FLOW.md](MANAGER_APPROVAL_FLOW.md). Approval-trigger
readiness, deterministic expense posting key/currency, loop cardinality and
Contact summary consistency are not independently verified.

The newly requested self-posting rule is implemented locally in
finance-posting-v4. Own history/Refresh remain available; both own Add and own
Returned are blocked in controls and the helper. Old Finance HTML receives
the explanatory notice dynamically, so preserve live config and replace only
the existing shared template script. User now reports adding the native
Is_Self_Posting condition from [FINANCE_SELF_POSTING_SETUP.md](FINANCE_SELF_POSTING_SETUP.md).
Its installation is reported complete; native denial checks are pending. No
role/column/site-setting changes. Local checks: 132 unit tests, 13 Finance
browser states and 4 shared-page states pass (mock APIs only).

See [FINANCE_FLOWCHART.md](FINANCE_FLOWCHART.md) for the current flowchart,
action-name map, balance explanation and completion/handoff checklist.
Core functionality is user-reported working. Self-posting condition and v4
publication are user-reported installed; final live checks remain pending. The user has created
the separate manager approval flow. Finance rollout is not signed off yet.

Current balance status (2026-10-30): user confirms the Finance API returns all
three transactions and a subsequent hard refresh restores correct history and
balance. Discrepancy is resolved by user report. Specific stale-code/cache layer
was not isolated; no new cash row or Contact balance write was needed. Do not
insert a compensating movement for the earlier stale display.
Separately fixed cashTransactions' overall $top=100 cap locally; now follows
uncapped ledger query nextLinks within existing safety limits. 131 unit tests
and 11 mocked Finance browser states pass. That large-history fix does not
explain this three-row discrepancy. Details at the top of FINANCE_FLOW_SETUP.md.

Latest run (2026-10-30): user reports HTTP 200 rejected and an actual flow run
after the AJAX repair. Parse_Posting_Key Content fails InvalidJSON at character
'a', consistent with addProperty(...) being pasted as literal text rather than
committed through the Expression tab. The top of FINANCE_FLOW_SETUP.md now
gives the exact fx Content correction; retain schema and branch wiring. This
run did not reach the reported create stage. Preserve the CURRENT pending key
5817c32c-5480-4dc9-a164-de75a96435f1 for retry. Permanent shared-template update
is still needed, but do not reload the current pending Finance page to apply it.

Current issue (2026-10-30): user confirmed the site URL and got HTTP 500 with no
flow run. Generic HTML response does not establish a sign-in failure. The fetch
caller was missing the required X-Requested-With: XMLHttpRequest header;
Microsoft's sample documents this exact pre-trigger symptom. Local v3 now adds
it and accepts actual lowercase output property names, retaining all posting
identity checks. Non-JSON error wording now preserves status without raw HTML.
130 unit tests and 11 mocked Finance browser states pass; no live resolution
claimed. Use the top of FINANCE_FLOW_SETUP.md for the one-time console repair
of the still-open pending page. Preserve its original key; publish the updated
shared template for future loads after the pending result is resolved. No
changes to flow actions, website permissions, columns or transport payload.

Current manual checkpoint (2026-10-30): user reports the v3 shared-template and
final response steps done. The top of FINANCE_FLOW_SETUP.md now describes
controlled test activation using the previously supplied site-associated route
GUID and Finance-only web role. Canonical local defaults stay blank/false.
Temporary test activation is necessary to verify the native trigger/response;
it is not a production authorization review or a claimed successful cash run.
Test one 100 PKR Add movement for a designated test employee, compare B+100,
exactly one durable row and the recorded Finance caller. If uncertain, retain
the original key and inspect before another submission. Balance-only refresh
failure after a confirmed save requires a GET refresh, never another cash POST.

Current agreed simplification (2026-10-30): the Finance flow records and confirms
one cash movement; the website then refreshes the balance from its existing
ledger reader. FINANCE_FLOW_SETUP.md begins with the final confirmation action;
its preceding checkpoint lists the removed history loop/read/guard and four
calculation variables. Keep native
Finance role/caller and input checks, unique posting key and saved-event
comparison. No tenant rows, columns or permissions are deleted.
The old full-ledger-in-flow recipe is superseded for this work. Local helper
finance-posting-v4 accepts a matching posting confirmation independently of the
balance field, clears the completed draft, then refreshes balance/history from
the ledger. A failed refresh preserves the saved confirmation and offers GET
refresh, never cash resubmission. The legacy Number balance output stays 0 only
to preserve the six matching response schemas; v3 never displays it. Deploy v3
before any enabled posting; v2 would incorrectly display that placeholder.
Publish the complete pettycash-modules.js inside one script wrapper in the
existing Petty Cash Modules template; verify window.PettyCashModules.version.
No page HTML, identity/receipt template, columns or permissions change here.
User reports full-ledger action removal done. Final success response instructions
are at the top of FINANCE_FLOW_SETUP.md; tenant save/deployment/testing remain
pending. Keep local posting config blank/false until controlled verification.

Local verification for this change: 127 unit tests, 11 mocked Finance browser
states (including no response balance, placeholder zero, failed/invalid refresh,
manual GET recovery, same-key retry and role denials), and 4 shared-page browser
states pass. No tenant permission or financial posting result is inferred.

Parse JSON compatibility correction: the tenant rejects pattern/patternProperties
when OpenApiConnection actions are present. Use the updated regex-free
finance-cash-request.schema.json and the Parse_Posting_Key schema/filter repair
in FINANCE_FLOW_SETUP.md. Keys are bounded text IDs; the frontend still generates
UUIDs. Native Contact lookups validate actual employee/operator GUIDs. Escape
apostrophes in both key query filters; the unique key and saved-event comparison
remain the duplicate protection. Repair is local/instructed, not tenant-tested.

Single-currency simplification: user reports completing the guided steps while
excluding runtime PKR lookup/count actions. Use one verified PKR currency record
GUID in create/ledger comparisons instead. User supplied the PKR record GUID
f8719944-3bac-f111-aaab-70a8a52176fd; actual metadata/save behavior still needs testing. See
FINANCE_FLOW_SETUP.md. The new-key Condition can also serve as the create/recovery
boundary without a separate wrapping scope. No live posting is enabled here.

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

The current helper version is finance-posting-v4. After the Finance role check,
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

After publishing and reloading, verify version finance-posting-v4, one Finance
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
return finance-posting-v4. No additional permission or posting enablement is
needed to correct the wrapper. Further live read checks remain pending.

1. Update **Petty Cash User Context** Web Template Source with complete
   Petty Cash User Context.html. Context version is web-template-v2-finance,
   adding pcFinanceAllowed from exact Finance web-role membership. Existing
   signed-in IDs/Admin role inputs are preserved. pcAccountsAllowed remains a
   legacy marker only and never authorizes Finance.
2. Update **Petty Cash Modules** Source with one script tag, complete
   pettycash-modules.js and closing script tag. Module version finance-posting-v4.
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

## 4. Posting backend contract and remaining checks

Use [FINANCE_FLOW_SETUP.md](FINANCE_FLOW_SETUP.md) for the complete manual build
recipe. The user supplied Cash Transaction primary GUID hr_cashtransactionid
and Recorded By Contact lookup hr_recordedby; these replace the prior placeholders.
The current guide covers trusted caller mapping, create/recover, saved-event
comparison and posting confirmation. The former full-ledger scan is superseded.
Connector behavior and lookup read property still require
verification. The recipe does not maintain the Contact
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
validation is not sufficient: validate Contact GUIDs through native lookups, active eligible
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
   Contact. Use the user-supplied hr_recordedby Contact lookup for this audit,
   populated in the same create as the movement. Verify its connection mapping;
   no column was created by the assistant.
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
6. Read the durable row and compare it with the submitted event and caller.
   The posting flow does not scan the employee's full history. Do not increment
   Contact.hr_currentbalance; the website refreshes its existing authoritative
   ledger reader after confirmation. A future summary projection would need a
   separate concurrency-safe/reconciled process.
7. Return confirmed success only after durable posting, with typed fields:

```json
{"status":"posted","postingKey":"<same-uuid>","employeeId":"<same-contact-guid>","transactionId":"<saved-row-guid>","balance":0,"message":"Cash movement recorded."}
```

balance remains a Number compatibility placeholder, not an employee balance.
All responses retain the same six output schemas. HTTP 202 is not confirmation.
The v3 UI ignores this field and automatically refreshes balance/history through
the existing ledger reader. If that fails, it preserves the saved confirmation
and clears the draft; manual Refresh must make no new cash POST. Test actual
tenant visibility/cache timing. The backend must not trust the
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
