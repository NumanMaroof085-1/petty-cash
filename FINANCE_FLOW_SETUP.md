# Finance cash movement flow setup

For the current simpler flow, start with [FINANCE_FLOWCHART.md](FINANCE_FLOWCHART.md).
It separates the flow's save/confirm work from the website's balance calculation
and lists the remaining Finance controls/tests before production sign-off.
Core Finance functionality is user-reported working; self-posting is still
proposed, and the separate manager approval backend can be the next module.

## Current status: Finance history and balance correct after hard refresh

2026-10-30: user first confirms the read-only Finance API diagnostic returns all
three transactions, then reports that hard-refreshing the Finance page restores
the correct transaction history and balance. Treat the displayed discrepancy
as user-reported resolved. No new movement, data edit or Contact balance update
is needed to compensate. This is consistent with stale page/data, but does not
isolate browser code, browser cache, portal server cache or a refresh race as the
specific cause; the exact earlier calculated/displayed values were not supplied.
No fresh code change or tenant mutation was performed for this resolution.

The independent ledger $top=100 removal remains a local tested correction for
larger histories, not an explanation for this three-row case; its deployment
has not been separately confirmed. Self-posting restriction remains proposed
and unimplemented. Broader live authorization/concurrency/return tests are not
implied complete by this observed correct display.

## Previous investigation: Finance balance omits the latest transaction

2026-10-30: user reports three transactions for the selected employee, expected
balance +100, but Finance omits the latest +100 transaction and shows a wrong
balance. Other pages show the correct balance. This narrows the investigation
to Finance's loaded script/UI or its ledger read/cache/permissions; arithmetic
on identical returned rows should be identical. Actual API rows versus DOM
values still need inspection. Do not change cash data, flow writes or add a
Contact balance update to compensate.

Requested read-only console diagnostic on the Finance page, employee selected:

```javascript
const pcRows = await PettyCashModules.cashTransactions(document.getElementById('pcEmployee').value);
console.table(pcRows.map(r => ({reference: r.hr_transactionreference, type: r.hr_transactiontype, amount: r.hr_amount})));
console.log({records: pcRows.length, calculated: PettyCashModules.sumTransactions(pcRows), displayed: document.getElementById('pcEmployeeBalance').textContent, widgets: document.querySelectorAll('#pcEmployeeBalance').length, version: PettyCashModules.version, pending: PettyCashModules.pendingPostingKey});
```

If GET returns three correct rows and sum +100 but display differs, inspect
deployed code/duplicate widgets/refresh path. If GET returns only two, inspect
the exact returned rows/employee filter and Power Pages caching; native flow
writes do not guarantee immediate portal reads. Microsoft documents per-user
data caching and a refresh window up to 15 minutes; an authorized one-time
Studio Preview or clear-cache can be a diagnostic, not a normal cash-posting
operation. Browser cache bypass alone does not bypass this server cache.
Do not force a reload while an operation is pending or resend cash to refresh.

Independent confirmed local query defect found and fixed: cashTransactions used
$top=100, which caps the overall OData result and is NOT a page-size request.
Removed that cap from the ledger query only; existing nextLink loop/origin/100-
page safety guard remain. No employee-directory/request-list scope change.
This affects histories over 100 rows; it does NOT explain the reported three-row
case and is not claimed as its fix. Local checks pass all 131 unit tests
(101-row OData-limit regression included) and 11 mocked Finance browser states.
Tenant root cause and correctness of the displayed +100 remain unresolved
pending the requested read result; no deployment or data mutation claimed.
References:
https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/query/overview#limit-the-number-of-rows
https://learn.microsoft.com/en-us/power-pages/admin/clear-server-side-cache

## Previous status: user reports working Finance movement; self-posting policy proposed

2026-10-30: user reports the preceding correction done and working, then asks
whether balance changing is implemented and whether Finance should be blocked
from increasing their own balance. This is user-reported success; no row/run
export, return movement, duplicate/concurrent run or before/after values have
been independently inspected.

Existing behavior: Finance cash_given creates an Advance Given ledger row and
adds to the displayed balance; cash_returned creates a Cash Returned row and
subtracts. Website balance is derived from all accessible Cash Transactions.
This flow does not write Contact.hr_currentbalance. Approved-expense posting
still belongs to the separate approval backend, not this Finance page/flow.

Self-posting is NOT currently blocked by the local client or the guided flow.
Recommend requiring another authorized Finance user to record all movements
for the Finance operator's own account (both Add and Cash Returned). Blocking
only increases leaves self-recorded returns able to reduce cash accountability.
This is a policy recommendation, not an implemented or user-selected expansion.
The user specifically asked about self-increases; do not silently deploy a
broader restriction before their intended policy is clear.

The implementation would be one server-side comparison of native Get_Employee
and trusted Get_Actor Contact IDs before creating cash, plus matching UI
prevention. Web role authorization still applies separately. No new table,
column, role, password handling or approval workflow is needed for this rule.
No code/flow/permission change is made at this discussion checkpoint.

## Previous issue: Parse_Posting_Key Content is not evaluated JSON

2026-10-30: after transport repair, user reports a flow run and HTTP 200
rejected response with lowercased output names. Current operation key is
5817c32c-5480-4dc9-a164-de75a96435f1, employee
b2f3ee91-69c8-f111-a05c-70a8a52176fd. This is a DIFFERENT key from the previous
500 report; retain the currently open page's key, not an older hardcoded one.
Parse_Posting_Key fails InvalidJSON: unexpected character 'a' at position 0;
the parallel invalid-key response/Terminate ran. This reports failure before
the create stage in this run, not successful financial posting.

The first character is consistent with a literal addProperty(...) string in
Content rather than an evaluated expression (inference; actual action inputs
not yet inspected). It is JSON syntax failure, not evidence of an invalid UUID.
Repair in flow edit mode > Parse_Posting_Key:

1. Clear Content completely, select the EXPRESSION / fx tab, then paste:

```text
addProperty(json('{}'),'postingKey',outputs('Posting_Key'))
```

2. Click Add/Update/OK to commit the expression token. Do not paste this as plain
   text or surround it with quotes. In the fx editor omit a leading @. Peek
   code, if checked, should show a content expression beginning @addProperty,
   not a bare literal starting addProperty. The evaluated Inputs > Content
   must be an object such as {"postingKey":"5817c32c-5480-4dc9-a164-de75a96435f1"}.
3. Keep the existing required string length-36 object schema unchanged and
   regex-free. Keep both run-after paths unchanged. Save the flow.
4. On the SAME still-open Finance page use Retry same cash movement once. The
   current pending operation is reused. If JSON parsing still fails, inspect
   only Parse_Posting_Key Inputs > Content before proposing other changes.

Publish the permanent updated pettycash-modules.js to the existing shared Web
Template (the one-time console fix only affects this browser page). This can
be done in another management tab; do not reload the pending Finance page yet.
No need for new modules/actions/tables, relaxed guards or regenerated keys.
The current AJAX transport fix is user-observed to reach the flow; successful
posting and permanent template publication still require confirmation.
Sources: https://learn.microsoft.com/en-us/azure/logic-apps/expression-functions-reference#addProperty
and https://learn.microsoft.com/en-us/azure/logic-apps/logic-apps-perform-data-operations#parse-json-action

## Previous issue: HTTP 500 before any Finance flow run

2026-10-30: user confirms the current site invocation URL matches 0b0976ac...
and submits a movement. Browser POST returns 500; user reports NO matching flow
run. Original pending key is 9eb9ba6f-71da-4dda-82b3-492fde257399. The supplied
Response is generic Power Pages HTML, with empty RTGE01 error and correlation
01ee3f96-c050-4f54-9cac-21f9e739ed38 at 2026-10-30 10:45:40 UTC. It does not
prove a sign-in failure or identify a failed flow action. No cash row existence
or nonexistence has been independently verified. Do not change the flow ID.

Concrete local defect: the fetch POST omitted X-Requested-With: XMLHttpRequest.
Microsoft's own cloud-flow sample documents a masked 500 with zero flow runs
when this AJAX header is absent. This strongly matches the report; it is not yet
tenant-verified as the only cause. The incidental nosniff warning in the HTML
does not identify the cloud-flow invocation cause; no site settings changed.

Permanent fix in pettycash-modules.js (still finance-posting-v3):

- Add the required AJAX header only to the native cloud-flow POST. Keep existing
  CSRF token, same-origin credentials, form-encoded eventData, endpoint and key.
- Read canonical or lowercased postingKey/employeeId/transactionId response
  names, as Microsoft documents lowercase Power Pages outputs. Still require
  HTTP 200, posted, matching key/employee and valid saved-row GUID. No values
  are substituted to bypass confirmation; balance remains ignored.
- Non-JSON errors now retain the HTTP status and suggest run-history/API
  inspection rather than assuming a sign-in problem. Do not echo raw HTML,
  tokens or response bodies. Pending operations remain locked on every error.

Recovery for the EXISTING open page, without losing its in-memory key:

1. Keep the Finance page open and unchanged. Do NOT reload it to install a new
   template while the result is uncertain.
2. Copy the WHOLE scripts/repair_open_finance_page.js into that page's Console
   and execute it. Installation sends NO request and is idempotent. It wraps
   only the exact configured flow route, adds the header while preserving CSRF
   and body, and copies actual lowercase output fields to their camelCase
   aliases for the older loaded v3 code. HTTP status/field values stay intact;
   it never clears the pending operation or confirms a save by itself.
3. Use the existing Retry same cash movement button ONCE, preserving the
   original key and payload. Inspect the resulting flow run/row if unconfirmed.
   No new movement/key or automatic POST is introduced by the repair.
4. After resolving the pending posting, replace the existing Petty Cash Modules
   Web Template's script with the full updated pettycash-modules.js for future
   page loads. Keep one script wrapper. No flow-action/role/column change.

Local checks passed: 130 unit tests (26 shared module tests), 11 mocked Finance
browser states using the required header and LOWERCASE response fields, plus
the exact console repair tested against a simulated already-loaded old helper:
no request on repeated install, original CSRF/body/key preserved on retry,
one saved mock row. Initial fixture failure was CRLF-sensitive setup, corrected
before passing; no tenant invocation performed by the assistant. Live repair
and subsequent flow input/caller/action behavior remain pending user results.

Primary references:
https://github.com/microsoft/power-pages-samples/blob/main/samples/spa/snippets/cloud-flow/README.md#troubleshooting
https://github.com/microsoft/power-pages-samples/blob/main/samples/spa/snippets/cloud-flow/src/cloudFlowClient.ts

## Previous identifier check: Power Automate ID versus site invocation ID

2026-10-30: user supplies the Power Automate details URL in environment
61901d93-5934-e60d-bf80-14e618d0e242 with flow ID
ac94fb2d-b491-3d0c-0ab8-f3431a5c7e57. This identifies the flow in the maker
portal; it does not establish the current Power Pages site invocation URL.
The local helper appends financeFlowId to /_api/cloudflow/v1.0/trigger/ and
therefore needs the GUID from the site's generated invocation URL.

In Power Pages Studio > this site > Set up > Cloud flows, open the existing
Petty Cash - Finance Cash Movement entry and copy its URL. Use the final GUID
from that /_api/cloudflow/v1.0/trigger/<GUID> route, not the ID after /flows/
in make.powerautomate.com. The earlier screenshot showed site route GUID
0b0976ac-a6d3-f111-a05d-70a8a52176fd; its current mapping to the supplied maker
flow is not independently verified. Do not replace it with ac94... based only
on the maker URL, recreate associations or run a cash test to discover the ID.
Await the current site URL before the controlled activation/test below.
Source: https://learn.microsoft.com/en-us/power-pages/configure/cloud-flow-integration#add-a-flow-to-your-site

## Pending guided checkpoint: connect for the first controlled tenant test

2026-10-30: user reports the shared-template update and final response done.
Treat publication/version/response save as user-reported, not a successful
posting. Native trigger input/output property names, caller mapping and
duplicate behavior still need actual run evidence. No cash run is reported.

The earlier user screenshot supplied site route
/_api/cloudflow/v1.0/trigger/0b0976ac-a6d3-f111-a05d-70a8a52176fd.
Reuse that site-associated GUID, NOT a Power Automate designer flow ID, if the
current site association still shows that route. If it changed, use the GUID
from the current site route instead. Check the site flow is enabled and its
only allowed web role remains Petty Cash Finance (previously user-reported).

For a CONTROLLED test, edit just these two settings in the live Finance page's
existing PC_MODULE_CONFIG, before its Petty Cash Modules include:

```javascript
financeFlowId: "0b0976ac-a6d3-f111-a05d-70a8a52176fd",
financeSecurityReviewed: true,
```

Keep requestStatus and other existing configuration intact. This temporarily
unlocks the Finance page for testing; it is not proof of production readiness.
Save/publish and hard-refresh as Finance. Verify helper finance-posting-v3.
Canonical local Finance HTML/example/defaults intentionally remain blank/false;
no assistant tenant mutation or production activation is performed here.
This replaces the circular earlier wording that demanded posting tests before
allowing any controlled invocation. Final rollout still requires the test suite.

Select a designated test employee and note current balance B. Submit cash_given
100 with reason Finance setup test and confirmation checked ONCE. It creates
real persistent ledger history for the test employee, not a dry run. Expected:
posted UI confirmation, exactly one new Cash Transaction of type Advance Given,
positive amount 100, selected employee, Recorded By the signed-in Finance
Contact, populated posting key/reference and no Linked Request; refreshed
balance B+100. It must not display the response placeholder zero.

If any error/unconfirmed result appears, keep the page open and original input/
key unchanged; inspect the flow run and transaction row before further cash
submissions. Do not create a fresh test or edit/delete a saved row to retry.
If posting is confirmed but balance refresh fails, only Refresh employee balance
(GET); no repeat cash POST. Cache-delayed history is not proof the create failed.
Test outcome, failed action/message, row count and Recorded By result are enough
to continue; no passwords, hashes, tokens or full sensitive run exports needed.
Cash-return, duplicate/concurrent tests and non-Finance denial are next, not
claimed complete. Disable the test configuration if the setup is left incomplete.
Reference: https://learn.microsoft.com/en-us/power-pages/configure/cloud-flow-integration

## Previous guided checkpoint: return posting confirmation

2026-10-30: user reports removing the full-ledger flow actions/variables. The
local shared script is now finance-posting-v3. It validates posting identity,
ignores the legacy balance output, clears the completed submission, then reads
the existing employee ledger to refresh balance/history. A failed refresh shows
the saved confirmation and Refresh employee balance; it does not retry cash.
Tenant deployment and real posting are not verified. Local checks: 127 unit
tests, 11 synthetic Finance browser states and 4 shared-page browser states pass.

Inside Resolve_Posting > Saved_Row_Matches > IF YES, paste a COPY of an existing
six-output Return value(s) to Power Pages. Rename it Posting_Confirmed. Change
values only; keep the same output names, types and schema metadata:

| Output | Type | Value |
| --- | --- | --- |
| status | Text | posted |
| postingKey | Text | Expression outputs('Posting_Key') |
| employeeId | Text | Expression outputs('Employee_Id') |
| transactionId | Text | Expression outputs('Saved_Row')?['hr_cashtransactionid'] |
| balance | Number | 0 |
| message | Text | Cash movement recorded. |

The numeric balance 0 is ONLY a compatibility placeholder so the existing
responses retain matching schemas. It is NOT the employee balance and is never
used/displayed by finance-posting-v3. Do not add a sum, Contact Current Balance
update or new variables. Response belongs in the matching row's Yes branch,
not after the whole guard or in No. Keep all previous failure responses intact.
No second/default success response should run after it.

Publish the complete pettycash-modules.js in the EXISTING Petty Cash Modules
Web Template Source, inside one script wrapper. Replace the old code; do not
append another copy. Reload and check window.PettyCashModules.version is
finance-posting-v3. No request/receipt/Admin/User Context HTML or permissions
need changing. Confirm this version before any enabled posting: the old v2 UI
would display the placeholder as a real zero. Configuration remains blank/false
locally; final response save, native trigger/output names, caller identity,
Finance-only authorization and controlled duplicate/create tests are pending.

Expected successful HTTP 200 body (flat object; balance is not a financial result):

```json
{"status":"posted","postingKey":"<same-key>","employeeId":"<same-contact-guid>","transactionId":"<saved-row-guid>","balance":0,"message":"Cash movement recorded."}
```

Only matching HTTP 200 / posted / key / employee / valid transaction GUID clears
the pending operation. Extra/missing/invalid legacy balance is ignored entirely.
Wrong IDs/status/key, 202 and failed transport retain the key. After confirmed
posting, separate ledger read/validation errors mark balance Unavailable, clear
the completed amount/reason/checkbox, and disable another movement until a
valid refresh. Refresh makes GET requests only. Current portal cache visibility
can lag writes; the refreshed balance is from the returned ledger, not a lock
or a backend-computed guarantee. Never resubmit cash to refresh a balance.

All earlier full-ledger-in-flow checkpoints/sections below are superseded for
the current implementation. They are historical reference, not additional
actions to build. Native flow build and tests are still user/manual work.
References: https://learn.microsoft.com/en-us/power-pages/configure/power-automate-how-to
and https://learn.microsoft.com/en-us/power-automate/guidance/coding-guidelines/use-peekcode-addnotes

## Previous agreed direction: save and confirm cash; refresh balance in the website

2026-10-30: user accepts simplifying the Finance flow and asks which actions
to remove. This supersedes the full-ledger calculation checkpoints/recipe below.
Keep caller/input checks, key lookup/create/recovery and saved-event comparison.
The website already reads employee ledger balances; the posting flow need not
scan and validate that same history to acknowledge one durable cash movement.

Manual removal list (in this order, to remove references before initializers):

1. Delete the WHOLE Each_Ledger_Row loop. Its children are removed with it:
   Ledger_Still_Valid, Row_Scaled_Text, Row_Cents, Row_Is_Valid, all in-loop Set
   variable actions, and Expense_Request_Id / Expense_Link_Is_Invalid /
   Remember_Expense or any other ledger calculation actions IF already added.
2. Delete the WHOLE Ledger_Is_Complete condition, including Ledger_Incomplete
   response and its Terminate. These are history-read guards, not posting guards.
3. Delete List_Ledger.
4. Delete only the four TOP-LEVEL Initialize variable actions whose Name fields
   are vBalanceCents, vSeenExpenseRequests, vPostedRowSeen, vLedgerValid. Retain
   vActorId. Do not delete input validation Amount_Cents or Amount_Scaled_Text;
   these still validate the cash amount and support saved-event comparison.

Do not delete Resolve_Posting itself, Resolve_Key, One_Saved_Row and its No
response/Terminate, Saved_Row, Saved_Row_Matches and its conflict response/
Terminate. Keep all earlier employee/caller/input/key/Create_Cash actions and
the existing Active crec6_postingkey unique key. No Dataverse rows/columns or
permissions are being removed. No balance summary writes are introduced.

Save the partial flow after removal. It is NOT ready for cash testing: current
pettycash-modules.js finance-ledger-v2 still requires response.balance and
displays it as backend-confirmed. Frontend response handling and the final
flow success response must be reconciled before enabling posting. In particular
never send posted with a placeholder zero and let the existing UI display that
as a real balance. Keep financeFlowId blank and financeSecurityReviewed false.

Next implementation: accept a confirmed posting only when HTTP/status/key/
employee/transaction ID match, clear the pending posting state independently
of balance refresh, then reload the employee ledger. If refresh fails, retain
the saved confirmation and show refresh-needed, not a posting failure/retry.
Changing response fields must also preserve identical schemas across Return
actions; leave current six-output rejection schemas alone during this removal.
This simplification/removal is instructed, not yet reported completed or
tenant-tested. Earlier ledger-loop instructions remain historical context.

## Superseded guided checkpoint: reject missing or duplicate expense links

2026-10-30: user reports Row_Scaled_Text, Row_Cents and Row_Is_Valid with No
setting vLedgerValid false added. No tenant run is verified. Inside
Each_Ledger_Row > Ledger_Still_Valid > Yes > Row_Is_Valid > Yes add these
SEQUENTIAL actions; do not nest the second condition inside the first:

1. Compose Expense_Request_Id. Expression:
   toLower(string(items('Each_Ledger_Row')?['_hr_linkedrequest_value']))
2. Condition Expense_Link_Is_Invalid. Left Expression:

```text
and(
  equals(items('Each_Ledger_Row')?['hr_transactiontype'],123140001),
  or(
    empty(outputs('Expense_Request_Id')),
    contains(variables('vSeenExpenseRequests'),outputs('Expense_Request_Id'))
  )
)
```

Operator is equal to; right Boolean Expression true. Yes: Set variable
vLedgerValid to Boolean Expression false. No: empty.

3. BELOW the WHOLE Expense_Link_Is_Invalid condition, still in Row_Is_Valid Yes,
   add Condition Remember_Expense. Left Expression:

```text
and(
  variables('vLedgerValid'),
  equals(items('Each_Ledger_Row')?['hr_transactiontype'],123140001)
)
```

Operator is equal to; right Boolean Expression true. Yes: Variables > Append
to array variable, Name vSeenExpenseRequests, Value Expression
outputs('Expense_Request_Id'). No: empty.

The two sibling conditions avoid unnecessary nesting and ensure a missing or
duplicate request marks the whole calculation invalid. Only a valid approved
expense records its normalized request ID; given/returned cash does not need a
linked request. Empty lookup normalizes to empty string and is never appended.
No Return or Terminate inside the loop. Do not reset vLedgerValid to true.
Save only: next step adds signed cents only while vLedgerValid remains true,
checks safe range and records whether Saved_Row is present. No Dataverse
writes, new columns/permissions or website posting enablement.

## Previous guided checkpoint: validate each ledger row

2026-10-30: user reports four calculation variables, Each_Ledger_Row and
Ledger_Still_Valid added. No runtime validation or balance is verified. Inside
Each_Ledger_Row > Ledger_Still_Valid > Yes add these sequential actions:

1. Data Operations > Compose, Row_Scaled_Text. Expression:
   string(mul(decimal(string(items('Each_Ledger_Row')?['hr_amount'])),decimal('100')))
2. Compose, Row_Cents. Expression:
   int(first(split(outputs('Row_Scaled_Text'),'.')))
3. Condition, Row_Is_Valid. Use the full and(...) row validation expression
   in section 13: positive safe integer cents, exact decimal cents equality,
   matching employee and fixed PKR currency, known transaction type. Operator
   is equal to, right Expression true (Boolean). Row_Cents truncation alone
   is not validation; the exact equality rejects fractional cents.
4. Row_Is_Valid > No: Variables > Set variable, vLedgerValid, Boolean Expression
   false. Leave Yes empty at this checkpoint. Leave the OUTER Ledger_Still_Valid
   No empty as well. No Return or Terminate inside this loop.

Future expense-duplicate checks and summation go inside Row_Is_Valid Yes, not
after its shared join where invalid rows could otherwise be counted. Null or
unparseable amounts cause an action failure; do not coalesce them to zero or
configure success continuation after a failed conversion. Save only: no sum,
confirmed balance, posting test or website enablement yet. These actions only
read rows and change in-run state; no Dataverse writes or columns are added.
Reference: https://learn.microsoft.com/en-us/azure/logic-apps/expression-functions-reference

## Previous guided checkpoint: initialize calculation state and add the loop

2026-10-30: user reports List_Ledger / Ledger_Is_Complete and its terminating No
path done. No actual run or balance result is verified. Add four individual
Variables > Initialize variable actions at the TOP LEVEL, after existing
vActorId initialization and before Get_Employee, outside ALL conditions/scopes:

| Variable name | Type | Initial value entered in Expression |
| --- | --- | --- |
| vBalanceCents | Integer | 0 |
| vSeenExpenseRequests | Array | json('[]') |
| vPostedRowSeen | Boolean | false |
| vLedgerValid | Boolean | true |

Reuse an already initialized variable only if name/type/value match; never add
duplicate names or initialize inside Resolve_Posting. These variables live only
in this flow run: they do not create Dataverse columns or change employee data.
vBalanceCents accumulates integer cents; the array detects repeated expense
requests; flags record valid history and presence of this saved transaction.

Back inside Resolve_Posting, below the WHOLE Ledger_Is_Complete guard, add
Control > Apply to each named Each_Ledger_Row. Input Expression:

```text
body('List_Ledger')?['value']
```

Keep default successful run-after. In loop Settings leave Concurrency Control
OFF so shared calculation variables update sequentially. Inside the loop add
Condition Ledger_Still_Valid: left Expression variables('vLedgerValid'), is
equal to, right Boolean Expression true. Leave both branches empty for this
checkpoint; later row calculations go in Yes, No stays empty. Never Terminate
inside Apply to each; later invalid rows set vLedgerValid false and final
rejection happens after the loop. Save only, not a cash test or enablement.

Guided build does not yet use vTransactionId / vConfirmed / Work / Finalize;
do not reference uninitialized full-recipe variables or absent wrapping scopes.
The later row-presence check can compare directly with Saved_Row's primary ID.
Reference: https://learn.microsoft.com/en-us/power-automate/create-variable-store-values

## Previous guided checkpoint: load the complete employee ledger

2026-10-30: user reports Saved_Row_Matches and its conflict response/Terminate
done. No run or money movement is verified. Next, below the WHOLE condition,
still inside Resolve_Posting, add Dataverse List rows named List_Ledger:

| Setting | Value |
| --- | --- |
| Table | Cash Transactions |
| Select columns | hr_cashtransactionid,_hr_employee_value,hr_amount,hr_transactiontype,_hr_linkedrequest_value,_transactioncurrencyid_value,createdon |
| Filter rows (Expression) | concat('_hr_employee_value eq ',outputs('Employee_Id')) |
| Sort by (plain text) | createdon asc,hr_cashtransactionid asc |
| Row count | Leave empty |
| Settings > Pagination | On |
| Threshold | 100000 |

Default successful run-after only. Include ALL types/history for this employee;
no latest-ten filter, FetchXML, status/type filter or Contact balance query.
Pagination is required beyond the default 5000 rows. Because thresholded
responses can omit nextLink despite truncation, reject at the threshold too.

Immediately below List_Ledger add Condition Ledger_Is_Complete. Left Expression:

```text
and(
  less(length(body('List_Ledger')?['value']),100000),
  empty(body('List_Ledger')?['@odata.nextLink'])
)
```

Operator is equal to; right Expression true. In No COPY Unconfirmed_Posting
response as Ledger_Incomplete. Keep identical output names/types and all values
except message: "Could not load the complete transaction history. Retry the
unchanged submission. If the problem continues, contact your administrator."
Status stays unconfirmed; empty transactionId and numeric balance 0 are failure
placeholders. Add Terminate Succeeded directly after it in No. Leave Yes empty.

Save only; ledger sum/validation, saved-row presence, confirmation and response
remain pending. No loop or new variables are introduced in this checkpoint;
top-level initialization must be guided before the later summation loop.
No Contact balance update or website posting enablement.
Reference: https://learn.microsoft.com/en-us/power-automate/dataverse/list-rows

## Previous guided checkpoint: compare the saved event

2026-10-30: user reports the one-row No response/Terminate and Saved_Row Compose
done. Continue directly below Saved_Row, inside Resolve_Posting:

1. Add Condition Saved_Row_Matches. Left Expression is the full and(...) saved
   event comparison in section 11 below; operator is equal to; right Expression
   true (Boolean, not typed text). It compares key, employee, native caller,
   movement type, exact amount cents, unchanged notes, fixed PKR currency,
   absent Linked Request and nonempty primary row ID. Amount_Cents has already
   passed the positive amount guard. Null/nonnumeric saved amount must never
   fall through to success; expression/query failure remains unconfirmed.
2. In No paste a COPY of Unconfirmed_Posting, rename Posting_Conflict. Preserve
   all six output names/types/metadata. Change status to conflict and message
   to "The saved transaction does not match this submission. No existing
   transaction was changed. Contact your administrator." Other values stay:
   Posting_Key, Employee_Id, empty transactionId, numeric balance 0. This is
   a failure placeholder, not a confirmed balance. A preceding create attempt
   might have saved a row: do not promise rollback or that no row was created.
3. Directly after the response in the same No branch add Terminate Succeeded.
   Leave Yes empty; keep default successful run-after on later actions. The
   next guided checkpoint reads the whole employee ledger below this guard.

Save only. vTransactionId is part of the full reference recipe but has not been
initialized in the guided build; do not add Set variable for it yet or refer
to absent Parse_Input/Actor_Id actions. No successful posting response, cash
test or website enablement yet. This is manual guidance, not tenant execution.

## Previous guided checkpoint: wire the one-row guard

2026-10-30: user reports Resolve_Posting / Resolve_Key / One_Saved_Row done.
No tenant run or cash write is inferred. Next wire One_Saved_Row as a stopping
guard so later actions can remain sequential without deeper Yes nesting:

1. In No, paste a COPY of an existing six-output Return value(s) to Power Pages.
   Name it Unconfirmed_Posting. Change values only: status unconfirmed,
   postingKey outputs('Posting_Key'), employeeId outputs('Employee_Id'),
   transactionId Expression '', balance Number 0, message "Could not confirm
   one saved transaction. Retry the unchanged submission with the same posting
   key. If the problem continues, contact your administrator." All six output
   names/types/metadata stay identical to other Return actions. Zero is a
   failure placeholder, not a confirmed balance or a Contact/ledger update.
2. In the same No branch directly after that Return, add Control > Terminate,
   Status Succeeded. This prevents any continuation after a zero/multiple-row
   result; it does not mean a financial operation succeeded.
3. Leave Yes empty. Below the WHOLE One_Saved_Row condition, still inside
   Resolve_Posting, add Compose Saved_Row with Expression
   first(body('Resolve_Key')?['value']). Keep its default successful run-after.

This placement is safe only AFTER the No response AND Terminate are present;
it supersedes the temporary instruction below that left both branches empty.
Do not run first() on an unguarded array or allow continuation from the No
branch. Next: compare the Saved_Row event to the input before reading balances.
Save only; website posting stays disabled. No new variables, tenant columns or
permissions are needed for this checkpoint.

## Previous guided checkpoint: continue with saved-row recovery

2026-10-30: user says the preceding repair is done and requests continuation.
Treat this as user-reported completion of the save repair, not a verified cash
run, autonumber generation or finished flow. Website posting stays disabled.

Next, below the WHOLE Is_New_Posting Condition (outside both Yes and No, but
still on the valid-input success path), add Control > Scope Resolve_Posting.
Configure Run after Is_New_Posting: successful, failed and timed out checked;
skipped unchecked. This permits lookup after a create collision/timeout without
entering recovery when earlier validation skipped the create decision.

Inside the scope add Dataverse List rows Resolve_Key, Cash Transactions:

- Select columns:
  hr_cashtransactionid,crec6_postingkey,_hr_employee_value,hr_amount,hr_transactiontype,hr_notespurpose,_hr_linkedrequest_value,_transactioncurrencyid_value,_hr_recordedby_value
- Filter rows: the escaped Posting_Key expression in the compatibility repair
  below (same as Find_Key).
- Row count: 2. Pagination off.

Then add Condition One_Saved_Row: left Expression
length(body('Resolve_Key')?['value']), is equal to, right numeric Expression 1.
Leave both branches empty at this guided checkpoint. Next guidance will wire
the failure response and saved-event comparison; no cash test or website
enablement yet. Until the No branch has its terminating response, do not place
Saved_Row/financial continuation after the shared condition join: it must only
run after the one-row check passes. The current checkpoint above wires this
stopping guard before adding Saved_Row sequentially.

## Current issue: Parse JSON regex keywords prevent saving

User reports ActionSchemaNotSupported: Parse_Posting_Key schema pattern or
patternProperties is unsupported when OpenApiConnection triggers/actions are
present. This is direct tenant save-error evidence, not a failed cash run.
The earlier supplied pattern schema was incompatible. Keep posting disabled.
Autonumber conversion/create configuration completion is not inferred from
this new error.

Repair Parse_Posting_Key Schema (leave Content and Run after paths intact):

```json
{
  "type": "object",
  "properties": {
    "postingKey": { "type": "string", "minLength": 36, "maxLength": 36 }
  },
  "required": ["postingKey"],
  "additionalProperties": false
}
```

This validates a bounded text operation key, NOT full UUID syntax. The frontend
still generates a UUID; the Dataverse posting key is Text. Its Active unique
constraint, event comparison and operator authorization provide retry safety.
UUID syntax is not required for a text identifier to provide deduplication.
Native Contact lookups still validate employee/operator GUIDs. Do not present
length checks as UUID validation.

Because format validation no longer excludes apostrophes, use this escaped
Filter rows Expression in Find_Key and the later Resolve_Key (when added):

```text
concat(
  'crec6_postingkey eq ',
  decodeUriComponent('%27'),
  replace(outputs('Posting_Key'),decodeUriComponent('%27'),decodeUriComponent('%27%27')),
  decodeUriComponent('%27')
)
```

Doubling any internal apostrophe keeps it inside the OData string literal. Do
not interpolate a text key into the old unescaped filter or add $filter= in the
connector field. Other special characters may yield a query error; those errors
must not fall through to a cash create. Both query actions use the same
normalized key and escaping. No new flow actions are required for this repair.

finance-cash-request.schema.json is also updated without regex keywords so the
full-recipe Parse_Input cannot reintroduce this save error. The redundant
Parse_Actor regex step is removed from the recipe; Get_Actor validates its actual
Contact ID. Actor/amount/currency/dedupe/ledger checks remain required.
Save compatibility and enforcement need tenant verification after repair.
Reference: [OData apostrophe escaping](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/query/filter-rows#manage-single-quotes).

## Current checkpoint: user chooses Transaction Reference autonumber

User explicitly asks to convert/configure the existing hr_transactionreference
column as Autonumber. Recommended setup in modern Power Apps:

| Setting | Value |
| --- | --- |
| Existing column | Transaction Reference (hr_transactionreference) |
| Data type | Autonumber |
| Autonumber type | Custom |
| Autonumber format | CT-{SEQNUM:6} |
| Seed | 1 only if no existing CT sequence values; otherwise above the largest existing CT number |

With seed 1 the examples are CT-000001, CT-000002, CT-000003. The six digits
are minimum padding, not a reset/maximum. Reuse the column and retain its logical
name; no new reference column/table/key is needed. Do not reseed over existing
references. Save/publish, then reopen the flow editor to inspect current metadata;
do not promise this automatically clears a required-field connector error or
change Required separately without evidence. Existing configured action mappings
should be preserved; do not switch tables blindly just to refresh metadata.
The user has authorized the conversion instructions, but completion, seed,
existing data and generated/save behavior are not yet verified. No cash run yet.
The existing crec6_postingkey unique constraint remains the retry protection.

## Earlier issue: Transaction Reference shown as required

User reports Create_Cash requires Transaction Reference. The project documents
describe hr_transactionreference as the primary-name Autonumber, but the actual
column data type/requirement and connector validation have not been inspected.
Do not infer a successful create/save or change the field based only on a star.

Next: Power Apps > Cash Transaction > Columns > Transaction Reference; inspect
Data type and Required (a screenshot of those settings is sufficient). A true
Autonumber generates its reference on create; a normal required Text column
needs a defined reference strategy. Do not insert a dummy, guid(), utcNow() or
posting-key reference, change the type/requirement, or rely on an unverified
null-expression workaround before confirming the actual metadata. No cash test
yet. Resolve this field before continuing Create_Cash setup.

Reference: [Autonumber columns](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/autonumber-fields).

## Current checkpoint: fixed PKR ID supplied; configure Create_Cash next

User supplied PKR Currency record GUID f8719944-3bac-f111-aaab-70a8a52176fd.
Its syntax is valid; ISO code, active status, precision and connection access
are user-reported context rather than independently inspected tenant metadata.
Use this same environment-specific ID in create, saved-row and ledger checks.
No List_PKR/count/extra currency Compose is needed.

Next action goes inside Is_New_Posting > If yes (Find_Key row count = 0):
Dataverse Add a new row named Create_Cash, table Cash Transactions. If the
condition has not yet been added, use the previous zero-match instruction first;
its completion is not inferred merely from the currency GUID response.

| Field | Guided-build value |
| --- | --- |
| Employee | Expression concat('contacts(',outputs('Employee_Id'),')') |
| Transaction Type | Enter custom value; Outputs from Movement_Type |
| Amount | Outputs from Input_Amount, not the scaled Amount_Cents |
| Notes / Purpose | Outputs from Notes |
| Posting key (crec6_postingkey) | Outputs from Posting_Key |
| Recorded By (hr_recordedby) | Expression concat('contacts(',body('Get_Actor')?['contactid'],')') |
| Currency | Plain text transactioncurrencies(f8719944-3bac-f111-aaab-70a8a52176fd) |
| Linked Request | Leave empty |
| Transaction Reference | Documented Autonumber; confirm actual data type/requirement before deciding how to supply/omit |

Set Create_Cash > Settings > Retry policy None. Keep Is_New_Posting No empty;
common lookup/comparison recovery follows. Configure/save only at this stage;
do not run cash tests or enable website posting before read-back, ledger, response
and failure paths are complete. A saved action is not a confirmed posted event.
No Create_Cash configuration/execution or actual cash write is reported yet.

## Earlier new-key condition instruction

User reports all preceding steps complete except the PKR actions, accepting the
fixed-currency approach. Treat Find_Key and its expanded field list as reported
added, not a verified query/run. Next: below Find_Key on the parser-success path,
add Control > Condition named Is_New_Posting. Left Expression:
length(body('Find_Key')?['value']); operator is equal to; right numeric Expression
0. Leave both branches empty at this checkpoint. Yes is a new-key candidate; No
is an existing-key event requiring full comparison, never automatic success.
The condition itself will contain the later create attempt, so an extra wrapping
Is_New_Posting/Post_Or_Find scope is unnecessary. Recovery in section 11 runs
after this Condition's success/failure/timeout, preserving uncertain-save handling.

The fixed PKR record ID was requested once; the later user response is recorded
above. No runtime query/count or reliance on an unspecified default is needed.
The new-key condition's actual execution remains unverified. Website posting
gates stay disabled until the complete backend is tested.

Currency-ID clarification: the user supplied a screenshot of column metadata
Schema hr_Amount / Logical hr_amount. That identifies the Amount COLUMN, not
the PKR Currency ROW. The required GUID is transactioncurrencyid of the existing
PKR record. To open it: Power Platform admin center > Manage > Environments >
this environment > Settings > Business > Currencies, then open the existing PKR
row. Its record URL normally contains its GUID in the id parameter. No currency
column/schema rename or new runtime lookup is needed. If PKR is absent, report
the displayed currencies rather than assuming a different currency's ID.
Reference: [Currency settings navigation](https://learn.microsoft.com/en-us/power-platform/admin/manage-transactions-with-multiple-currencies).
The later response supplied the PKR GUID. Is_New_Posting completion is not
inferred from the earlier column metadata screenshot.

## Single-currency configuration (accepted approach)

User questions the PKR lookup/count steps and the growing flow complexity.
Those two runtime actions are not inherently required for a PKR-only app.
Accepted simplification: verify the actual active PKR record and currency/amount precision
once during setup, then explicitly set that fixed currency on each new Cash
Transaction. Use the same fixed currency GUID for saved-row/ledger comparisons;
do not assume an unspecified default or invent a currency GUID.

Earlier List_PKR/PKR_Count_Is_Valid instructions are historical and superseded.
The user reports excluding them. Section 8 now uses the user-supplied fixed
PKR GUID f8719944-3bac-f111-aaab-70a8a52176fd in its expressions. Resolve the
appropriate record again when deploying to another environment rather than
copying this ID blindly. No flow action/configuration was changed by the assistant;
currency assignment/runtime behavior remains unverified.

Finance-only authorization, required amount/movement validation, immutable ledger
posting, operator audit, duplicate-key protection and a validated balance remain
the essential financial behavior. Frontend validation already gives immediate
feedback; the server write still validates inputs. No currency-conversion UI,
additional currency table or currency-management feature is being added.

Reference: [Dataverse Currency columns and row currency](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/types-of-fields#using-currency-columns).

## Earlier currency-query proposal (superseded; do not add these actions)

User supplied these exact column logical names:

| Purpose | Logical name |
| --- | --- |
| Cash Transaction primary GUID | hr_cashtransactionid |
| Recorded By lookup to Contact | hr_recordedby |
| Expected Recorded By lookup read property | _hr_recordedby_value |

The first two names are user-confirmed; the lookup read-property spelling is
derived from the Dataverse convention and still needs a connector-output check.
Reuse the existing lookup; do not create another. Table publication, connection
access, target and actual saved/read behavior have not been inspected here.

Next batch:
1. In the existing/new Find_Key action below Employee_Id, expand Select columns
   to the full nine-field list in section 9 now that names are supplied. Preserve
   the bounded key filter and Row count 2. Do not assume the earlier query action
   was built/tested merely because the user answered the metadata questions.
2. Below Find_Key in the successful branch add List_PKR, Dataverse List rows,
   Currencies (transactioncurrency), select transactioncurrencyid,isocurrencycode,
   statecode,currencyprecision; Filter rows = isocurrencycode eq 'PKR' and
   statecode eq 0; Row count 2. No portal API permission/settings are needed.
3. Add Condition PKR_Count_Is_Valid: Expression
   length(body('List_PKR')?['value']) is equal to numeric Expression 1. Leave its
   branches empty for this checkpoint. Rejection/stop follows next; currency
   precision and ID extraction must happen only after the count guard is enforced.

The PKR record GUID is not assumed. New lookup/guard steps are instructed, not
reported built or run. Posting stays disabled; no financial write is authorized
by a mere currency match. Metadata, guards, event comparison and ledger still
require actual flow testing before enabling the page.

## Earlier filtered key lookup instruction

User reports Employee_Id success path and the parallel invalid-key response/stop
path added. No diagram, Run after definition or execution has been inspected.
Next action is Dataverse List rows named Find_Key, directly BELOW Employee_Id
inside its success branch, not below the parallel merge:

| Setting | Guided-build value |
| --- | --- |
| Table | Cash Transactions (hr_cashtransaction) |
| Select columns | crec6_postingkey |
| Filter rows | Expression below |
| Row count | 2 |
| Other query options | Leave empty; pagination not needed for this bounded key lookup |

```text
concat(
  'crec6_postingkey eq ',
  decodeUriComponent('%27'),
  replace(outputs('Posting_Key'),decodeUriComponent('%27'),decodeUriComponent('%27%27')),
  decodeUriComponent('%27')
)
```

This first lookup only establishes key presence (0 new candidate; 1 existing;
2 indicates the uniqueness/query setup needs investigation). It is not an
identical-event confirmation and does not authorize a write. Do not report
posted merely because a matching key exists. Expand read fields for full saved
event comparison in section 11 once actual primary ID and operator lookup names
are known. No create/confirmation at this checkpoint.

The later user response supplied hr_cashtransactionid and hr_recordedby, recorded
above. Reuse them; do not recreate either the operator lookup or posting key.
Local frontend config remains blank/disabled. No live cash query/run verified.

## Key parser success/error paths (user reported added)

The user reports Input_Key, Posting_Key and Parse_Posting_Key added. No parser
run, native input delivery or financial posting is verified. The original regex
schema was later replaced after the unsupported-keyword error above.
Next batch, still inside Actor_Is_Active > If yes:

1. Add Compose Employee_Id directly below Parse_Posting_Key, Expression:
   toLower(string(body('Get_Employee')?['contactid'])). It uses the Contact row
   already retrieved. Its Run after must be Parse_Posting_Key is successful ONLY.
2. At the connector between Parse_Posting_Key and Employee_Id choose Add a
   parallel branch. Paste the canonical six-output rejection Return into that
   branch via My clipboard; rename the action Reject_Invalid_Key. Keep its
   schema/body fields and rejected status, changing only message VALUE to
   'Posting key is invalid. Contact your administrator.'.
3. On Reject_Invalid_Key > Configure run after, target Parse_Posting_Key:
   select has failed and has timed out; UNCHECK is successful and is skipped.
4. Add Terminate Status Succeeded directly below Reject_Invalid_Key inside that
   error branch ONLY. Keep all successful continuation under Employee_Id;
   do not place Terminate below the parallel branches' shared join.

Both sibling paths depend on Parse_Posting_Key directly, with mutually exclusive
Run after states. This avoids resuming financial work merely because a catch
action was skipped after some unrelated upstream failure. Employee_Id must NOT
be configured to run after Reject_Invalid_Key. Future key lookup belongs below
Employee_Id inside the successful branch, not below the shared join. The new
branches/actions are instructions, not reported complete yet. Save and review
the branch layout before adding cash-table operations. Posting remains disabled.

## Trigger names and key parser preparation (user reported)

The latest screenshot visibly shows employeeId, movement, amount, notes and
postingKey in the left-hand NAME boxes, with Text/Text/Number/Text/Text icons.
Right-hand input1-input5 descriptions are harmless. Actual raw trigger properties,
existing token bindings and runtime website delivery still need verification.
No trigger recreation or further description edit is needed.

Completed instruction batch (user reported), below Movement_Type inside actor Yes:

1. Compose Input_Key, input = trigger postingKey dynamic token.
2. Compose Posting_Key, expression:
   toLower(trim(coalesce(outputs('Input_Key'),''))).
3. Data Operations Parse JSON named Parse_Posting_Key. Content Expression:
   addProperty(json('{}'),'postingKey',outputs('Posting_Key')). Schema below.

```json
{
  "type": "object",
  "properties": {
    "postingKey": {
      "type": "string",
      "minLength": 36,
      "maxLength": 36
    }
  },
  "required": ["postingKey"],
  "additionalProperties": false
}
```

Wrapping the key in an object makes the Parse JSON Content an actual JSON object,
not an unquoted GUID string. This validates key length/type only; the database lookup,
unique-key recovery and financial write remain unbuilt. The invalid-key error
response/Run after handling is the current instructed batch above; until added, a
Parse JSON failure stops the default successful path without a friendly response.
Do not issue a cash-table filter/create unless Parse_Posting_Key succeeds.
Reuse Input_Key/Posting_Key in the full recipe rather than adding duplicates.
No new action execution, length enforcement or cash posting is verified.

## Earlier trigger naming correction (now visibly corrected)

The user reports the Valid_Amount rejection branch, Notes and Movement_Type
added. Their trigger screenshot now explains the generic dynamic-content labels:
left-hand input NAME boxes still read Input, Input 1, Number, Input 2, Input 3;
the intended names were typed into the right-hand prompt/description boxes.
Correct the EXISTING left-hand names in place as follows, retaining input types:

| Current trigger name | Required trigger name | Type |
| --- | --- | --- |
| Input | employeeId | Text |
| Input 1 | movement | Text |
| Number | amount | Number |
| Input 2 | notes | Text |
| Input 3 | postingKey | Text |

Use exact camelCase, including capital I in employeeId and K in postingKey.
Right-hand descriptions can be blank or explanatory; they do not replace names.
Rename the existing inputs, not delete/recreate them, to preserve their property
identities and existing dynamic references. Change the trigger fields only,
not the named Compose actions used by expressions. Save and verify bindings;
renaming completion, actual schema property mappings and runtime delivery are
not yet inspected at that checkpoint. The later screenshot above confirms the
visible correction; actual schema/runtime bindings remain to be checked.
No website/helper edit or cash posting is required for this correction.

## Finance role association and amount guard (user reported)

User reports the flow now saves. The Add cloud flow screenshot shows Petty Cash -
Finance Cash Movement and the native site route
`/_api/cloudflow/v1.0/trigger/0b0976ac-a6d3-f111-a05d-70a8a52176fd`, with no role
selected yet. The user subsequently reports completion of Add roles > Petty Cash
Finance ONLY and confirms Valid_Amount created. Association is user-reported;
effective access/flow execution is not independently tested. Do not add
Authenticated Users, Anonymous Users or Admin/old Accounts as additional callers.
Role assignment authorizes invocation; it does not establish that the financial
flow is complete/tested. Local financeFlowId remains empty and
financeSecurityReviewed false. Finish validation, recovery, ledger and response
testing before enabling the page. No flow execution or financial write verified.

## Response schema save issue (user reports saving now succeeds)

The following records the prior save error and repair guidance. The user reports
successful saving afterward; the exact differing schemas were not supplied.

Screenshot update: the employee-inactive Return card visibly has the expected
six names, five Text icons, Number balance 0, rejected status, empty transactionId
and the correct employee-inactive message. This confirms that card's visible
configuration only, not equality of all underlying response schemas or a saved
flow. Its postingKey token displays Input 3 and employeeId token displays Input;
the trigger definitions have not been supplied, so those mappings and the actual
website-facing input names still need confirmation. Do not assume generic token
labels establish which input GUID each contains. An empty transactionId is
appropriate for rejection. Use a correctly mapped six-field card as the master
for cloning the other responses. The later user report above confirms saving
succeeds, without proving which schema discrepancy was corrected.

User reports ActionSchemaInvalid on Save: schema definitions for actions with
the same status code 200 must match. This is a response-definition error, not an
amount-expression error. The differing action/property has not been inspected.
Pause new flow steps until Save succeeds. The instructed amount-check batch may
have been added, but exact designer contents are not confirmed by this report.

Repair in the classic designer:

Inspect EVERY Return action, including any default/empty one already present at
the bottom of a newly created flow. Such a response is also subject to the same
schema requirement; its presence here is a possibility, not confirmed evidence.

1. Choose one Return value(s) to Power Pages action and ensure it has the exact
   six outputs in section 14: Text status/postingKey/employeeId/transactionId/
   message, and Number balance. Preserve exact names/casing and output metadata.
2. Use its ellipsis > Copy to my clipboard. In each other existing rejection
   branch, add the clone via Add an action > My clipboard BEFORE that branch's
   existing Terminate. Remove only the old mismatching Return action; preserve
   the condition, branch and Terminate.
3. Change only the cloned response's message VALUE for that branch. Keep output
   names/types unchanged. Verify Terminate follows the replacement response on
   successful completion; no stale Run after reference to the removed action.
4. Save again. Later success/failure responses should also be cloned from the
   same action, changing body values only. status='posted' belongs only to a
   verified saved transaction; failure balance 0 remains a placeholder.
5. If still blocked, inspect only each response's inputs.schema using Peek code
   (not whole flow/run payloads). Compare property names/types, required list and
   other schema metadata. Visible labels alone do not prove underlying equality.

Microsoft documents [classic copy/paste and Peek code](https://learn.microsoft.com/en-us/power-automate/guidance/coding-guidelines/use-peekcode-addnotes).
The requirement to match 200 schemas is confirmed by the user's actual save error;
the exact culprit and successful repair are not yet verified.

Frontend checks already exist in pettycash-modules.js cashAmount/validateMovement:
positive finite amounts, up to two decimals, safe integer cents, allowed movement
and trimmed notes length. No new frontend change is needed for that request.
Server checks remain necessary because the frontend is not the write boundary.
No financial posting, permission change or frontend rewrite is authorized by this
troubleshooting checkpoint. Existing posting gates remain off.

Guided-build checkpoint: Valid_Amount is now reported created. Next batch:
1. Valid_Amount > If no: clone the existing six-output rejection Return action,
   changing only message VALUE to 'Enter a positive amount with no more than two
   decimal places, within the supported range.', then Terminate Succeeded.
2. Below the ENTIRE Valid_Amount card, still in Actor_Is_Active > If yes and
   outside Valid_Amount's branches, add Compose Notes:
   trim(outputs('Input_Notes')). Keep Valid_Amount's Yes empty.
3. Add Compose Movement_Type below Notes:
   if(equals(outputs('Input_Movement'),'cash_given'),123140000,123140002).
   Basic_Input_Is_Valid's No rejection/Terminate must be in place before this
   expression, so unsupported movements cannot default to Cash Returned.
Request a screenshot of the trigger's five input definitions to resolve the
generic Input/Input 3 token labels before posting-key wiring. These next actions
are instructed, not yet reported added/run. UUIDs, actual column limits, currency,
idempotency, response mapping and exception handling remain required. No writes
or posting enablement. Reuse existing actions; keep validation guards sequential.

Basic_Input_Is_Valid left Expression (right Expression is true):

```text
and(
  or(
    equals(outputs('Input_Movement'),'cash_given'),
    equals(outputs('Input_Movement'),'cash_returned')
  ),
  greater(coalesce(outputs('Input_Amount'),0),0),
  greater(length(trim(coalesce(outputs('Input_Notes'),''))),0),
  lessOrEquals(length(trim(coalesce(outputs('Input_Notes'),''))),100)
)
```

Use the trigger's Number amount token directly in Input_Amount; do not turn it
into formatted currency text. This additional basic condition is a guided-build
aid and does not replace the Parse_Input and exact-cent checks in the full recipe.

Build one solution-aware Power Automate flow named **Petty Cash - Finance Cash
Movement**, using **When Power Pages calls a flow** in the classic designer.
This guide is a manual build recipe, not an importable flow or a deployed backend.
The user reports the Finance page working and has reached the trigger setup.
No flow run, trigger/output schema, connection privileges or currency metadata
has been inspected in the tenant. Keep the website posting switches disabled
until the final checks pass.

The flow records cash actually given to an employee or returned by an employee.
It creates an immutable Cash Transaction, calculates the signed ledger balance,
and returns that balance to the Finance page. Manager expense approvals are a
separate flow. No new balance table is required.

## 1. Prepare the existing table and one operator lookup

Use the existing mappings:

| Item | Confirmed value |
| --- | --- |
| Cash table logical name | hr_cashtransaction |
| Cash table entity set | hr_cashtransactions |
| Cash table primary GUID | hr_cashtransactionid (user supplied) |
| Recorded By Contact lookup | hr_recordedby (user supplied) |
| Employee lookup | hr_employee, targeting Contact |
| Amount | hr_amount, Currency; save a positive value |
| Type | hr_transactiontype |
| Notes | hr_notespurpose, client maximum 100 characters |
| Request lookup | hr_linkedrequest; empty for Finance movements |
| Reference | hr_transactionreference; user plans Autonumber CT-{SEQNUM:6}, conversion/generation not yet confirmed |
| Posting key column | crec6_postingkey, schema crec6_PostingKey |
| Cash given type | 123140000 (Advance Given) |
| Cash returned type | 123140002 (Cash Returned) |
| Approved expense type | 123140001; read in the ledger, never created here |

In Power Apps > the solution > Cash Transaction > Keys, check the existing
alternate key on **crec6_postingkey** is **Active**. The column alone is not a
unique constraint. Do not recreate the older proposed hr_postingkey. Historical
Word documents still contain that older proposal; the confirmed mapping above
supersedes it. Do not delete or change historical ledger entries during setup.

The user supplied hr_recordedby for the Recorded By lookup. Reuse that column;
the table below documents its intended configuration, not an instruction to
create a duplicate. Verify its Contact target and publication in the connector.

| Setting | Value |
| --- | --- |
| Display name | Recorded By |
| Type | Lookup |
| Related table | Contact |
| Requirement | Optional at table level; mandatory in this Finance flow |
| Logical name | hr_recordedby (user supplied) |

Optional at table level preserves existing history and future automated expense
rows. The Finance flow must populate it on every new Finance row. This records
the website operator; Dataverse Created By normally identifies the connection's
system user instead. Store it in the SAME create as the movement, not a later
update. Do not use the employee being paid as the operator.

The user supplied the two column names; no primary-ID/operator placeholders
remain in the action expressions below:

- `hr_cashtransactionid`: the Cash Transaction primary GUID, not its autonumber.
- `hr_recordedby`: the operator's Contact lookup logical name.
- `_hr_recordedby_value`: expected lookup read property, derived from the confirmed
  logical name; validate against an actual connector row output before posting.

The operator lookup and posting key are backend fields. Do not add them to the
portal Web API field list or grant portal cash Create/Write access for this flow.
Publish the table customization and refresh the connector if its fields are stale.

## 2. Flow connection and solution

Use the same environment as the website. Keep the flow inside the project's
unmanaged solution and use a Dataverse connection reference.

The connection identity needs the required Dataverse security-role privileges:
read eligible Contacts and Transaction Currency; read/create Cash Transactions;
and the Dataverse lookup association privileges needed for Employee, Recorded By
and Currency. Connection privileges are separate from portal table permissions.
It does not need Contact balance Write, Cash Transaction Update/Delete, or
password/security fields for this recipe.

If the trigger offers concurrency control, set degree of parallelism to **1**
for this small Finance flow. It serializes this flow only; it does not serialize
other flows or replace the unique key. Enabling trigger concurrency cannot simply
be undone in place, according to Microsoft. If this trigger does not expose the
setting, do not substitute another trigger; the dedupe design still relies on
the database key. Avoid parallel branches around the ledger scan.

## 3. Define the five trigger inputs

In **When Power Pages calls a flow**, add these inputs with these exact labels:

In the classic trigger card the LEFT box is the input name. Enter employeeId,
movement, amount, notes and postingKey there. The RIGHT box is its description/
prompt. The user's first screenshot put intended names on the right and left
the default Input/Number names on the left; those existing names must be edited
in place, not accepted as correctly named parameters.

| Name | Type | Meaning |
| --- | --- | --- |
| employeeId | Text | Employee Contact GUID |
| movement | Text | cash_given or cash_returned |
| amount | Number | Positive PKR movement amount |
| notes | Text | Reason/reference, 1-100 characters after trimming |
| postingKey | Text | UUID generated by the website for this operation |

Do not add actorId, currentBalance, resultingBalance, transactionType or password
inputs. The trigger's built-in **User ID** dynamic content supplies the caller.

Inspect Peek code and record the actual input property names as well as labels.
Use dynamic-content tokens in the next section so internal names such as text_1
are never guessed. Microsoft requires request parameter names to match the
trigger definition. The current page sends the five camelCase names above.
If your trigger schema differs, reconcile the mapping before live posting;
do not silently read null properties. No trigger/output schema has been verified
from this tenant yet.

## 4. Add variables at the top level

Initialize these BEFORE any Scope, Condition or Apply to each:

| Name | Type | Initial value |
| --- | --- | --- |
| vConfirmed | Boolean | false |
| vPostingKey | String | empty |
| vEmployeeId | String | empty |
| vActorId | String | empty |
| vTransactionId | String | empty |
| vBalanceCents | Integer | 0 |
| vSeenExpenseRequests | Array | [] |
| vPostedRowSeen | Boolean | false |
| vLedgerValid | Boolean | true |

Use the action names below before pasting expressions. In Expression fields,
paste expressions without a leading @ or @{...}. In ordinary fields, insert
dynamic-content tokens rather than typing their displayed labels as text.

## 5. Build Work and Finalize scopes

Add a Scope named **Work**. Put sections 6-13 inside it in order.

After Work, add a Scope named **Finalize**. Configure its Run after on Work for
**is successful**, **has failed**, **has timed out** and **is skipped**. Inside
Finalize, return success ONLY if vConfirmed is true; otherwise return the
unconfirmed response in section 14. This catches parse, lookup, create, read and
calculation failures without a misleading success response.

The action layout is:

```text
When Power Pages calls a flow
Initialize variables (top level)
Work
  Capture inputs / Parse_Input / normalize / validate
  Get_Actor / Get_Employee / Find_Key
  Is_New_Posting (Condition: key absent?)
    If key absent: Create_Cash
    Else: no write
  Resolve_Posting   [after Is_New_Posting success, failure OR timeout]
    Resolve_Key / Saved_Row / compare original event
    List_Ledger / guard completeness
    Each_Ledger_Row (sequential; validation failures set vLedgerValid=false)
    Check ledger valid and saved row included
    Balance_Result / precision check
    Set vConfirmed = true
Finalize           [after any Work outcome]
  If vConfirmed: return posted + IDs + numeric balance
  Else: return unconfirmed
```

For validation Conditions OUTSIDE Apply to each, use this reusable rejection pattern
in each invalid branch: **Return value(s) to Power Pages** with the uniform
six-output shape in section 14, `status = rejected` and a short `message`, then
**Terminate** with Succeeded to
end the already-responded run. A rejected business operation is not a posted
transaction. Never place a Terminate before its rejection response: that would
prevent the response/finalizer. If validation itself throws, Finalize returns
unconfirmed. Do not return raw connector exceptions or whole Contact records.

## 6. Capture inputs and validate their structure

Inside Work, add six Compose actions:

For the guided build, Input_Movement, Input_Amount and Input_Notes may already
exist under the active-actor Yes branch. Reuse them and add only missing actions;
do not create a second set with auto-suffixed names that break the expressions.

| Action name | Input |
| --- | --- |
| Input_Employee | employeeId trigger dynamic token |
| Input_Movement | movement trigger dynamic token |
| Input_Amount | amount trigger dynamic token |
| Input_Notes | notes trigger dynamic token |
| Input_Key | postingKey trigger dynamic token |
| Input_Actor | built-in trigger User ID dynamic token |

User ID must be the platform-supplied caller, not a new browser input. Microsoft's
Power Pages image-library example uses this token as the user identity. On a
test invocation, confirm it matches the signed-in Finance Contact GUID. If it
is absent or is not a Contact identifier in this tenant, do not enable posting
or substitute a browser-provided value; resolve that identity mapping first.

Compose **Input_Object**, Expression:

```text
addProperty(addProperty(addProperty(addProperty(addProperty(json('{}'),
  'employeeId', outputs('Input_Employee')),
  'movement', outputs('Input_Movement')),
  'amount', outputs('Input_Amount')),
  'notes', outputs('Input_Notes')),
  'postingKey', outputs('Input_Key'))
```

Add **Parse JSON**, rename **Parse_Input**. Content = Input_Object output;
Schema = the entire object in finance-cash-request.schema.json. The $schema
metadata is not an action definition. It validates the five declared parameters;
additional incoming browser parameters are not trusted identity/configuration.
Test key type/length enforcement and the separate exact-cent checks. Contact
GUIDs must resolve through Get_Employee/Get_Actor; no regex check is implied.

Compose the following, in order:

| Action | Expression |
| --- | --- |
| Employee_Id | toLower(trim(body('Parse_Input')?['employeeId'])) |
| Posting_Key | toLower(trim(body('Parse_Input')?['postingKey'])) |
| Actor_Id | toLower(trim(string(outputs('Input_Actor')))) |
| Notes | trim(body('Parse_Input')?['notes']) |
| Movement_Type | if(equals(body('Parse_Input')?['movement'], 'cash_given'), 123140000, 123140002) |

Guided Employee_Id is already obtained from the verified-ID Get_Employee row via
toLower(string(body('Get_Employee')?['contactid'])); reuse that Compose rather
than adding another. An actual lookup result is still to be tested in the tenant.

Movement_Type is used ONLY after allowed-movement validation. In the full recipe
that is Parse_Input; in the guided build Basic_Input_Is_Valid must reject/stop
unsupported movements first. Guided Notes uses trim(outputs('Input_Notes')) and
Movement_Type uses Input_Movement as shown in the checkpoint. Reuse these
actions rather than creating duplicate names. Do not let an arbitrary third
value fall into Cash Returned. Remaining schema checks are still required.

Set vEmployeeId, vPostingKey and vActorId to their normalized Compose outputs.
Do not add a regex Parse_Actor action: this connector workflow rejects regex
schema keywords. The trusted Actor_Id must resolve to its active Contact through
Get_Actor before any cash create; that native lookup validates the actual GUID.

Add Condition **Valid_Notes**:

```text
and(greater(length(outputs('Notes')),0),lessOrEquals(length(outputs('Notes')),100))
```

Reject the No branch with a reason-length message. Conditions described as
"reject unless" below use the same response-then-Terminate pattern. Contact GUIDs
must resolve through native lookups. Text posting keys need length/type
validation and the escaped string filter, not a regex schema.

## 7. Validate currency amounts in cents

Guided build: these actions are placed after Basic_Input_Is_Valid as siblings
inside Actor_Is_Active > If yes. Basic's No response/Terminate must be completed
first. Use outputs('Input_Amount') instead of body('Parse_Input')?['amount'] in
Amount_Scaled_Text when assembling this stage before Parse_Input. Reuse the same
Compose actions when adding the remaining schema checks; do not duplicate them.

Compose **Amount_Scaled_Text**:

```text
string(mul(decimal(string(body('Parse_Input')?['amount'])), decimal('100')))
```

Compose **Amount_Cents**:

```text
int(first(split(outputs('Amount_Scaled_Text'), '.')))
```

Condition **Valid_Amount**:

```text
and(
  greater(outputs('Amount_Cents'),0),
  lessOrEquals(outputs('Amount_Cents'),9007199254740991),
  equals(decimal(outputs('Amount_Scaled_Text')),decimal(string(outputs('Amount_Cents'))))
)
```

Reject the No branch. This rejects fractional cents rather than silently rounding
them. Decimal intermediates are deliberately preserved as strings. A decimal
parse or integer overflow is a failed validation caught by Finalize. The existing
Dataverse Currency column's minimum/maximum must ALSO be respected; inspect
hr_amount metadata and add the actual financial upper limit to Valid_Amount.
Do not invent a company cash limit. Until that metadata/limit check is completed,
the guide is not ready for production enablement.

## 8. Verify actor, employee and PKR

Add Dataverse **Get a row by ID**, name **Get_Actor**:

- Table: Contacts; Row ID = Actor_Id.
- Select columns: contactid,statecode.
- Reject unless the returned contactid equals Actor_Id and statecode is 0.

Add **Get_Employee** similarly, Row ID = Employee_Id; same selected columns;
reject unless the ID matches and statecode is 0. This uses the same active-Contact
eligibility as the Finance selector. Do not require the employee to have Finance
role, a manager or a nonnegative balance. If later policy excludes some Contacts,
apply the same eligibility policy to both selector and flow.

One-time currency setup, not repeated flow actions:

- The user supplied PKR GUID f8719944-3bac-f111-aaab-70a8a52176fd.
- Confirm once that its precision and hr_amount's configured precision support
  two decimal places. Do not change existing ledger/currency records blindly.
- The create and comparison expressions below now use that exact record ID.
- Currency lookup value: transactioncurrencies(f8719944-3bac-f111-aaab-70a8a52176fd).

Do not add List_PKR, PKR_Count_Is_Valid or a separate currency-ID Compose. No
extra table, conversion feature or repeated lookup is required. Retain explicit
currency assignment and compare existing ledger rows to the same configured
currency. On environment migration, resolve and replace the environment's GUID
during deployment. The supplied record's metadata/access and actual save/read
behavior remain to be tested before website posting is enabled.

## 9. Find the existing posting key

Guided build starts with Select columns = crec6_postingkey only, under Employee_Id
in the parser success branch. Reuse this Find_Key when expanding to the full
columns below after metadata confirmation; the initial presence check alone is
not sufficient to verify the saved employee/actor/amount/type/reason/currency.

Add Dataverse List rows named **Find_Key**:

| Setting | Value |
| --- | --- |
| Table | Cash Transactions |
| Select columns | hr_cashtransactionid,crec6_postingkey,_hr_employee_value,hr_amount,hr_transactiontype,hr_notespurpose,_hr_linkedrequest_value,_transactioncurrencyid_value,_hr_recordedby_value |
| Filter rows | Expression below |
| Row count | 2 |

```text
concat(
  'crec6_postingkey eq ',
  decodeUriComponent('%27'),
  replace(outputs('Posting_Key'),decodeUriComponent('%27'),decodeUriComponent('%27%27')),
  decodeUriComponent('%27')
)
```

Do not add `$filter=` in a connector Filter rows field. The posting key must pass
length/type checks and use the escaped OData literal expression above. A UUID
format check is not provided by this Parse JSON schema.

If more than one row returns, reject and repair the key configuration before
posting. If one returns, **do not create or update anything**. Proceed to the
common key resolution/comparison in section 11. A zero-row result permits one
create attempt in the next section.

## 10. Attempt exactly one create when the key is absent

Add a **Condition** named **Is_New_Posting** after Find_Key. No extra wrapping
scope is needed. Configure its left Expression as
length(body('Find_Key')?['value']), operator is equal to, right numeric 0.
Equivalently its complete Boolean expression is:

```text
equals(length(body('Find_Key')?['value']),0)
```

In Yes, add Dataverse **Add a new row**, name **Create_Cash**. Table: Cash
Transactions. Set its Retry policy to **None**; recovery reads by key instead of
unconditional POST retry. Populate:

| Field | Value |
| --- | --- |
| Employee (Contacts) | concat('contacts(',outputs('Employee_Id'),')') |
| Transaction Type | Movement_Type output (numeric Choice) |
| Amount | Outputs from Input_Amount (already validated by earlier guards) |
| Notes / Purpose | Notes output |
| Posting key | Posting_Key output |
| Recorded By (Contacts) | concat('contacts(',body('Get_Actor')?['contactid'],')') |
| Currency (Transaction Currencies) | concat('transactioncurrencies(','f8719944-3bac-f111-aaab-70a8a52176fd',')') |
| Linked Request | Leave empty |
| Transaction Reference | For confirmed Autonumber, let Dataverse generate it; current required-field report needs metadata review first |

Those concat values go into the Expression editor; they are not literal text.
Use the displayed connector lookup fields, not guessed navigation-property
names. Lookup syntax is entity-set-name(GUID). The two known sets here are
contacts and transactioncurrencies.

In No, leave the branch empty. Existing history is immutable: never use Update a
row/upsert for key recovery. A create collision or timeout can mean the row
already exists. The next scope resolves that outcome, even if Is_New_Posting fails.

## 11. Resolve the durable row and compare every field

Add Scope **Resolve_Posting** immediately after Is_New_Posting. Configure Run after
on Is_New_Posting for **is successful**, **has failed**, **has timed out** ONLY.
Leave **is skipped** unchecked so earlier validation failures cannot enter this
scope. This is essential: a failed create must not skip key recovery.

Inside Resolve_Posting, add List rows **Resolve_Key**, with the same table,
select columns, filter and Row count 2 as Find_Key.

Reject unless exactly one row is returned. If a timed-out create has not become
visible yet, return unconfirmed; the page keeps the key and an identical user
retry re-runs the lookup. Do not generate a new key, blindly re-create, or claim
the original transaction was rolled back. The Active unique key protects against
concurrent misses and a previous delayed create.

Compose **Saved_Row**:

```text
first(body('Resolve_Key')?['value'])
```

Reject unless ALL of these are true:

- Saved key equals Posting_Key.
- _hr_employee_value equals Employee_Id.
- _hr_recordedby_value equals Get_Actor.contactid (case-normalize GUID strings).
- hr_transactiontype equals Movement_Type as a number.
- The saved amount is positive and its decimal value multiplied by 100 equals
  Amount_Cents exactly. Use decimal(), not rounded float equality.
- hr_notespurpose equals Notes exactly; do not trim old values to hide changes.
- _transactioncurrencyid_value equals the fixed configured PKR currency GUID.
- _hr_linkedrequest_value is empty.
- hr_cashtransactionid is a nonempty GUID.

A different actor/employee/amount/type/reason/currency under the same key is a
conflict, not a retry to accept. Never overwrite it. Verify saved create output
through this same read path; do not rely only on Create_Cash's success status.

Using the user-supplied metadata/currency, this is the Condition expression:

```text
and(
  equals(toLower(string(outputs('Saved_Row')?['crec6_postingkey'])),outputs('Posting_Key')),
  equals(toLower(string(outputs('Saved_Row')?['_hr_employee_value'])),outputs('Employee_Id')),
  equals(toLower(string(outputs('Saved_Row')?['_hr_recordedby_value'])),toLower(string(body('Get_Actor')?['contactid']))),
  equals(outputs('Saved_Row')?['hr_transactiontype'],outputs('Movement_Type')),
  equals(mul(decimal(string(outputs('Saved_Row')?['hr_amount'])),decimal('100')),decimal(string(outputs('Amount_Cents')))),
  equals(outputs('Saved_Row')?['hr_notespurpose'],outputs('Notes')),
  equals(toLower(string(outputs('Saved_Row')?['_transactioncurrencyid_value'])),'f8719944-3bac-f111-aaab-70a8a52176fd'),
  empty(outputs('Saved_Row')?['_hr_linkedrequest_value']),
  not(empty(outputs('Saved_Row')?['hr_cashtransactionid']))
)
```

Set **vTransactionId** from Saved_Row's actual hr_cashtransactionid. Place all remaining
ledger/calculation actions INSIDE Resolve_Posting, following this comparison.
They then run after a recovered create failure, rather than depending on the
failed status of Is_New_Posting or the aggregate Work scope.

## 12. Read the whole employee ledger

Inside Resolve_Posting add Dataverse List rows **List_Ledger**:

| Setting | Value |
| --- | --- |
| Table | Cash Transactions |
| Select columns | hr_cashtransactionid,_hr_employee_value,hr_amount,hr_transactiontype,_hr_linkedrequest_value,_transactioncurrencyid_value,createdon |
| Filter rows | concat('_hr_employee_value eq ',outputs('Employee_Id')) |
| Sort by | createdon asc,hr_cashtransactionid asc |
| Row count | Leave empty |
| Pagination (action Settings) | On |
| Threshold | 100000 |

Reject unless `length(body('List_Ledger')?['value'])` is LESS THAN 100000, and
`body('List_Ledger')?['@odata.nextLink']` is empty. Microsoft notes a thresholded
pagination response can omit nextLink even when truncated, so the length guard
is required too. Reject exactly-at-cap as well; do not display a partial balance.
No FetchXML aggregation is used in this recipe: the connector's FetchXML limits
and pagination differ from this OData List rows setup.

Include all ledger types, including approved expenses. Do not filter to the
latest ten or only this Finance operation. No balance may be confirmed unless
the saved vTransactionId is found in the retrieved ledger below.

A very large ledger may also exceed synchronous request/time limits before the
row cap. That remains unconfirmed; do not loosen this into a partial success.
The portal reader also has its existing finite paging guard. At that scale,
implement a trusted aggregation/paging service rather than silently truncating.

## 13. Validate and sum the ledger sequentially

Add **Apply to each**, rename **Each_Ledger_Row**, input:

```text
body('List_Ledger')?['value']
```

Leave its concurrency OFF (one row at a time), because the loop maintains a sum
and a set of seen expense IDs. Do not put Terminate inside Apply to each. Use
vLedgerValid to record validation failures, then reject AFTER the loop. Inside
each iteration add a Condition vLedgerValid equals true; leave No empty and put
the following actions in Yes:

1. Compose **Row_Scaled_Text**:

   ```text
   string(mul(decimal(string(items('Each_Ledger_Row')?['hr_amount'])),decimal('100')))
   ```

2. Compose **Row_Cents**:

   ```text
   int(first(split(outputs('Row_Scaled_Text'),'.')))
   ```

3. Add a Condition requiring Row_Cents > 0 and <= 9007199254740991,
   Row_Scaled_Text equals Row_Cents as decimals, the employee equals Employee_Id,
   the currency equals the fixed configured PKR GUID, and the numeric type is one of 123140000,
   123140001, 123140002. In No, set vLedgerValid = false and do no more work on
   that row. Put steps 4-7 in Yes. Null amounts, unknown types, fractional cents
   and mixed currencies must never be converted to zero. A conversion exception
   fails Work and leaves vConfirmed false.

   ```text
   and(
     greater(outputs('Row_Cents'),0),
     lessOrEquals(outputs('Row_Cents'),9007199254740991),
     equals(decimal(outputs('Row_Scaled_Text')),decimal(string(outputs('Row_Cents')))),
     equals(toLower(string(items('Each_Ledger_Row')?['_hr_employee_value'])),outputs('Employee_Id')),
     equals(toLower(string(items('Each_Ledger_Row')?['_transactioncurrencyid_value'])),'f8719944-3bac-f111-aaab-70a8a52176fd'),
     contains(createArray(123140000,123140001,123140002),items('Each_Ledger_Row')?['hr_transactiontype'])
   )
   ```

4. If type = 123140001, require a Linked Request GUID. Set vLedgerValid = false
   if it is empty or its normalized value is already in vSeenExpenseRequests;
   otherwise Append to array variable vSeenExpenseRequests. Thus duplicate
   expense postings make the ledger invalid rather than being silently counted
   twice. Finance given/returned rows do not require a Linked Request.

5. Only if vLedgerValid is still true, use **Increment variable vBalanceCents**,
   Value:

   ```text
   if(equals(items('Each_Ledger_Row')?['hr_transactiontype'],123140000),
     outputs('Row_Cents'),sub(0,outputs('Row_Cents')))
   ```

6. If vBalanceCents leaves -9007199254740991 through 9007199254740991 (the client
   safe-integer cents range), set vLedgerValid = false.

7. If the row's hr_cashtransactionid equals vTransactionId, set vPostedRowSeen = true.

After the loop (outside it), reject unless BOTH vLedgerValid and vPostedRowSeen
are true. Compose **Balance_Result**:

```text
div(variables('vBalanceCents'),100.0)
```

The .0 is intentional; integer division would lose cents. Confirm that converting
the result back to decimal cents still equals vBalanceCents:

```text
equals(
  mul(decimal(string(outputs('Balance_Result'))),decimal('100')),
  decimal(string(variables('vBalanceCents')))
)
```

Reject if not. Set **vConfirmed = true** as the VERY LAST action inside
Resolve_Posting, after all saved-row and full-ledger checks. There must be no
later financial/calculation action that can fail after setting this flag.

Do not add an Update Contact Current Balance action. The website already derives
balances from Cash Transactions. A second-step summary write can fail after a
successful create or overwrite a concurrent approval's newer projection. This
recipe leaves hr_currentbalance unchanged. If another application needs that
column current, implement a separate reconciled projection/transactional service
shared with expense approval; that is not implemented by this recipe.

The returned balance reflects the successful ledger read, not a permanent lock
against later/concurrent movements from other writers. Refresh reads it again.

## 14. Return a typed result in Finalize

Use the SAME six output names and types for every Return value(s) action, including
early rejection branches: status (Text), postingKey (Text), employeeId (Text),
transactionId (Text), balance (Number), message (Text). The user's ActionSchemaInvalid
save error confirms that responses sharing status code 200 need matching schemas
in this flow. Clone one canonical response rather than recreating each by hand;
compare inputs.schema in Peek code if matching visible fields still fail to save.
The current frontend ignores the extra message on success and rejects any
non-posted status before accepting a balance.

For the guided inactive-employee No branch, set status to rejected, postingKey
and employeeId to their trigger dynamic tokens, transactionId to Expression '',
balance to Number 0 and message to 'This employee is inactive. Select an active
employee.'. Then add Terminate with Status Succeeded below the return in No.
The 0 is a failure-schema placeholder, not an employee balance or cash adjustment.
Do not put the return/Terminate outside No. Successful processing goes in Yes.

In Finalize add Condition: vConfirmed equals true.

YES: **Power Pages > Return value(s) to Power Pages**, with these outputs:

| Output name | Type | Value |
| --- | --- | --- |
| status | Text | posted |
| postingKey | Text | vPostingKey |
| employeeId | Text | vEmployeeId |
| transactionId | Text | vTransactionId |
| balance | Number | Balance_Result output |
| message | Text | Empty string (Expression '') |

Expected HTTP 200 JSON body:

```json
{"status":"posted","postingKey":"<same UUID>","employeeId":"<same Contact GUID>","transactionId":"<saved Cash Transaction GUID>","balance":1000.25}
```

Do not put that object inside a Text result field and do not return balance as
a quoted string. Inspect actual returned property names/casing in a test: the
current frontend checks these camelCase names. If the designer normalizes them
or wraps results, reconcile that with the helper before enabling real posting;
labels alone are not verified response keys. No success is accepted by the page
unless HTTP status, IDs, key, numeric balance and posted status all match.

NO: Return value(s) to Power Pages, with the same six outputs:

| Output name | Type | Value |
| --- | --- | --- |
| status | Text | unconfirmed |
| postingKey | Text | vPostingKey |
| employeeId | Text | vEmployeeId |
| transactionId | Text | vTransactionId (possibly empty) |
| balance | Number | 0 (failure placeholder, not a balance) |
| message | Text | Posting could not be confirmed. Keep the page open and check this posting key before retrying. |

The existing page intentionally treats any response other than confirmed posted
as a failure/unconfirmed operation and retains the key. Its general error may
not display a custom message from an HTTP 200 non-posted body. Do not change a
failed response to posted just to make that message disappear.

If a row was saved and calculation/response later failed, that row remains saved.
A same-key retry must resolve it rather than insert another. This flow is not a
transactional rollback of all steps. An HTTP 202 or missing response does not
prove failure or success; keep the same key and inspect/retry safely.

## 15. Attach the flow to the site

Save the flow. In Power Pages Studio > Set up > Cloud flows > Add cloud flow,
select it and associate ONLY **Petty Cash Finance**. Do not select Anonymous
Users, Authenticated Users, Admin-only or the old Accounts role.

Copy the site-generated /_api/cloudflow/v1.0/trigger/<GUID> address. The config
uses the GUID in that SITE route, not a guessed Power Automate designer ID and
not a signed HTTP trigger URL. Keep financeSecurityReviewed false while building.
The native route handles the signed-in session and CSRF; the role marker in HTML
does not grant permission. Connection privileges do not replace site authorization.

## 16. Test before normal Finance posting

Use a test environment and synthetic/test Contacts, not unexplained production
cash movements. A passing mock test in this repository is not a deployed-flow
test. Run the following checks on the actual configured flow:

| Test | Expected result |
| --- | --- |
| Employee/Admin-only/old Accounts/signed-out call | Denied by the site before the flow writes |
| Finance call | Trusted User ID matches that Finance Contact |
| Zero ledger, give 1000 | One positive 123140000 row; balance 1000 |
| Return 250 using a new key | One 123140002 row; balance 750 |
| New key, amount 0.01 | Exactly one cent change |
| Negative starting balance -500, give 200 | Balance -300; allowed |
| Same key and identical actor/input, repeated/concurrent | Same transaction ID; one row total; current validated ledger balance |
| Same key, different amount/employee/type/notes/actor | Rejected; old row unchanged |
| Malformed Contact GUID, missing/wrong-type/wrong-length key | No cash create; native lookup or schema rejects the input |
| A 36-character key containing an apostrophe | Query treats the whole key as one escaped string literal; never widens the filter |
| Zero/negative/1.001 amount, bad type, empty/overlong notes | Rejected; no create |
| Inactive/missing employee or actor | Rejected; no create |
| Missing/duplicate PKR or wrong ledger currency | No confirmed balance; resolve currency setup |
| Unknown type, null/invalid amount or duplicate linked expense | No confirmed balance; repair ledger through an audited process |
| Create commits, then response is lost | Same-key retry recovers row; no duplicate |
| Create fails for real; no row exists | Unconfirmed; never report posted |
| Is_New_Posting fails, recovery succeeds | Resolve_Posting still runs; Finalize uses vConfirmed rather than aggregate Work status |
| Ledger excludes the newly saved row or hits paging cap | Unconfirmed; no partial sum |
| Successful response | Exact expected keys, Number balance, HTTP 200 |
| Contact summary | Not changed by this flow; portal still shows ledger total |

To verify end-to-end before allowing normal users, use an isolated test site/copy
of the Finance page with its test flow GUID/config, or another authenticated test
harness calling the native site route with native CSRF. Do not expose tokens,
signed endpoints or whole run histories when sharing results. Do not enable the
production Finance page simply to bypass incomplete backend checks. The current
portal has no special test mode; isolate test enablement explicitly.

Once the backend and authorization tests pass, set the existing Finance page's
config to the verified site route GUID and financeSecurityReviewed: true. Save,
sync and reload the Finance page. No shared helper or employee/receipt/Admin page
replacement is needed if the trigger/response contract matches the current helper.

## Build status and exact remaining metadata

This document defines all actions and branches but does not create/import them.
The user supplied hr_cashtransactionid and hr_recordedby. Before calling the
recipe tenant-ready, verify their connector behavior, hr_amount precision/range,
PKR row, trusted User ID,
actual trigger inputs/return keys and connection/site authorization. These facts
cannot be safely inferred from the frontend or the older Word schema. Copy the
names from the tenant and keep them in this guide as the build is verified.

## Microsoft references

- [Power Pages flow integration and request parameters](https://learn.microsoft.com/en-us/power-pages/configure/cloud-flow-integration)
- [Power Pages flow inputs and Return value(s) example](https://learn.microsoft.com/en-us/power-pages/configure/power-automate-how-to)
- [Built-in trigger User ID example](https://learn.microsoft.com/en-us/power-pages/configure/image-library-how-to)
- [Classic/new designer limitations](https://learn.microsoft.com/en-us/power-automate/flows-designer#limitations-and-known-issues-in-the-new-designer)
- [Dataverse create and lookup syntax](https://learn.microsoft.com/en-us/power-automate/dataverse/create)
- [List rows pagination limits](https://learn.microsoft.com/en-us/power-automate/dataverse/list-rows)
- [Decimal and other workflow expressions](https://learn.microsoft.com/en-us/azure/logic-apps/expression-functions-reference)
- [Scopes and error handling](https://learn.microsoft.com/en-us/power-automate/guidance/coding-guidelines/error-handling)
- [Trigger concurrency considerations](https://learn.microsoft.com/en-us/power-automate/guidance/coding-guidelines/optimize-power-automate-triggers)
- [Alternate-key activation](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/define-alternate-keys-portal)
