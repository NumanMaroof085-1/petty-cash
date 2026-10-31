# Manager approval flow: user-created configuration

Recorded 2026-10-31 from the user's description and two screenshots. The user
built this flow independently. No flow export, run results or action expressions
were inspected; do not treat it as a tenant audit or an assistant deployment.
User subsequently reports Finance self-posting condition and v4 script installed.
The current discussion is expense posting keys and duplicate prevention.

## Current guided step: lookup and zero-existing-expense condition

2026-10-31: user asks to implement the first recommendation and says they
inserted a condition BEFORE the approval action. For the write-time duplicate
guard, move it into the existing approval outcome's Approved/True branch,
BEFORE the existing For each 1 (outside that loop). A pre-approval check alone
can become stale while the manager considers the request.

Immediately before the new condition add Dataverse > List rows, named
Find_Existing_Expense, table Cash Transactions. Select columns:

```text
hr_cashtransactionid,_hr_employee_value,_hr_linkedrequest_value,hr_amount,hr_transactiontype,_transactioncurrencyid_value,crec6_postingkey
```

Row count 2; pagination off. Filter rows, through Expression/fx:

```text
concat(
  '_hr_linkedrequest_value eq ',
  triggerBody()?['hr_pettycashrequestid'],
  ' and hr_transactiontype eq 123140001'
)
```

This uses the native triggering Petty Cash Request GUID and checks BOTH old
unkeyed expenses and new keyed ones. It does not query the request table or
look only for a newly added key; missing/null trigger ID must not fall through
to creation. Do not add $filter= in the connector field.

Rename the condition No_Existing_Expense. Left Expression:

```text
length(body('Find_Existing_Expense')?['value'])
```

Operator is equal to; right Expression numeric 0. YES: move the EXISTING For
each 1 with all its approved status/balance/transaction actions INTO Yes.
Do not leave any of those writes below the whole condition where No could run
them. Preserve each loop's internal expressions. NO: at this checkpoint add
Control > Terminate, Status Cancelled, outside any loop. This stops for review;
it does not assert an existing/multiple/mismatched expense is correct or that a
new expense was posted. Next guided step verifies the existing row before
treating matching replays as completed. Do not put Terminate inside For each.

Save only at this intermediate checkpoint. The request-derived posting key
must also be set before a live approval posting test; completion not reported.
The lookup/condition is not an atomic lock: concurrent runs can both find zero.
Existing unique key remains necessary. The Contact-summary update is still
user-created; no removal is inferred and its concurrency risk remains noted.
No native flow change/run is performed by the assistant.
Reference: https://learn.microsoft.com/en-us/power-automate/dataverse/list-rows

## Posting key recommendation (2026-10-31)

User confirms approval-created cash transactions currently have NO posting
keys. Earlier screenshots did not establish this; it is now user-reported.
Currency and the exact lookup/operator expressions remain unverified.

The frontend does not query crec6_postingkey for balance calculation. It totals
positive hr_amount with signs from hr_transactiontype, checks employee identity,
and detects repeated Expense Approved deductions using _hr_linkedrequest_value.
Blank posting keys do not inherently make the displayed balance wrong, but
they leave server retry/concurrency duplicate protection incomplete. Dataverse
does not enforce alternate-key uniqueness when its column value is null.

Recommended stable key for each approved request:

```text
expense-<lowercase Petty Cash Request GUID>
```

In the approval flow's Add a new row - cash transaction > Posting Key
(crec6_postingkey), enter through the EXPRESSION/fx tab and commit:

```text
concat('expense-', toLower(triggerBody()?['hr_pettycashrequestid']))
```

This assumes the reported trigger is the Petty Cash Request row. Use that
native request ID, not the newly created Cash Transaction ID, a line-item ID,
approval-response ID, guid() or a timestamp. Do not put the formula in as
literal text. The resulting text is 44 characters; ensure the existing Text
column permits it (documented configuration is length 100, not freshly tenant-
inspected). Hyphen avoids the alternate-key URL-special characters in a colon
prefix. The Finance flow still uses UUID operation keys and its length-36 input
schema; approval writes are separate Dataverse connector actions and do not
pass through that parser. No change to the Finance parser or frontend needed.

Before adding an expense row, query Cash Transactions for this Linked Request
and Expense Approved type. If there is one, verify employee, total, currency and
request match and reuse/skip the write; never insert another expense just
because its old row has a blank posting key. Multiple or mismatched rows need
review, not arbitrary first-row acceptance. The unique key remains necessary
for simultaneous runs which can both pass a pre-create lookup.

Existing unkeyed history still counts in balances. Do not rerun approvals or
insert replacement transactions to populate keys. Backfill the EXISTING row's
key only after confirming exactly one valid Expense Approved row per Linked
Request. Do not automatically delete or merge historical duplicates. Until
legacy rows are checked/backfilled, key-only lookup cannot safely deduplicate
reapproval of an old request.

The screenshot shows Contact balance updated BEFORE Add cash transaction. A
stable key cannot undo an earlier repeated Contact balance subtraction. Since
the current website uses only the cash ledger, recommend removing the unused
incremental Contact-summary update from this posting path, or maintaining it
separately from reconciled ledger totals. No tenant actions/rows are modified
by this recommendation. If a create conflicts/times out, read and compare the
existing expense instead of changing the key or blindly retrying another write.

These are recommended changes, not reported deployed or runtime-tested. No new
table, column or public API field exposure is required. The existing Active
crec6_postingkey key can be shared by Finance and approval operations.
Reference: https://learn.microsoft.com/en-us/power-apps/maker/data-platform/define-alternate-keys-reference-records

## Observed sequence

1. Dataverse trigger card: When a row is added, modified or deleted. User says
   it is configured to start when a new request is added; actual Change type,
   trigger filters and concurrency settings are not visible.
2. Get a row by ID - manager.
3. List rows - PC request.
4. Get a row by ID - employee.
5. Download a file or an image.
6. Compose.
7. Start and wait for an approval, sent to the manager per user description.
8. Condition on the approval outcome.
   - True: For each 1 contains Update a row - request status, Update a row -
     update balance, and Add a new row - cash transaction.
   - False: For each contains Update a row 1, reported as rejection status.

User explains the auxiliary reads populate information for the approval email.
The exact approval type, recipient expressions, outcome/status values, loops'
input arrays and per-run row counts are not visible.

## Observed approved cash transaction fields

The screenshot shows six selected advanced parameters:

| Field | Visible configuration |
| --- | --- |
| Amount | Total Amount dynamic-content token; exact source action not visible |
| Employee (Contacts) | concat(...) expression; exact value not visible |
| Linked Request (Petty Cash Requests) | concat(...) expression; exact value not visible |
| Notes/Purpose | Petty Cash Request |
| Recorded By (Contacts) | concat(...) expression; exact operator/manager mapping not visible |
| Transaction Type | Expense Approved |

These settings align with a positive-amount Expense Approved ledger deduction
if lookups/token sources resolve as intended. Currency and crec6_postingkey
were NOT shown in the screenshot. The user later confirms posting keys are
not set; currency remains unverified. The Parameters tab screenshot does not show
retry policy/action Settings despite the user's general description.

## Alignment with website balances

The website derives employee balance from Cash Transactions:

```text
Cash Given - Expense Approved - Cash Returned
```

The separate Contact balance update is user-created and is not used by the
current frontend. It does not create a second website deduction. Its expression
and concurrency/reconciliation behavior remain unverified. No action is deleted
or rewritten as part of Finance self-posting work. Contact summary should not
be assumed authoritative or synchronized with Finance, whose flow does not
update that column.

## Items to verify when reviewing approval behavior

- **Complete submission:** the current request page creates the parent request
  first, saves line items next and uploads the mandatory receipt last. An
  Added-only trigger can therefore start before receipt/products finish saving.
  Verify readiness/waiting before file download or sending approval; the
  screenshot alone does not show a gate. Do not assume header creation proves
  complete submission.
- **One expense row per request:** verify deterministic operation identity
  using the existing unique crec6_postingkey, and read/compare on replay. A
  fresh guid() per retry does not deduplicate approval of the same request.
  Ensure the visible For each loops do not create one expense per line item
  or approval response when only one expense total is intended.
- **PKR:** verify the same configured Currency row and positive two-decimal
  request total; the website applies the subtraction from Expense Approved type.
- **Lookups/audit:** ensure Employee is the submitter, Linked Request is this
  exact request, and Recorded By represents the intended approving actor.
- **Outcome/trigger:** confirm only intended requests start, approved/rejected
  values are correct, later updates do not initiate duplicate approvals, and
  approval timeouts/cancellations do not create an expense.
- **Partial failure:** request-status update preceding cash creation can leave
  an approved request without a ledger expense if the cash write fails. Verify
  retry/reconciliation rather than blindly posting another expense.

These are identified review items, not proof the user's flow is failing. No
new table/column/flow configuration or live approval test was performed here.
Do not alter this approval flow while adding the separate Finance self rule.

Related: [Finance flowchart](FINANCE_FLOWCHART.md),
[Finance self-posting setup](FINANCE_SELF_POSTING_SETUP.md),
[implementation log](IMPLEMENTATION_LOG.md).
