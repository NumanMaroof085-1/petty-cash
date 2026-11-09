# Manager approval flow: user-created configuration

**Current 9 November blocker:** user reports Condition_-_10k greater() fails on
a Boolean operand. Correct its one designer row to left full Boolean routing
expression / is equal to / right Expression true; preserve Ready for Boss OR
amount strictly >10000 and existing branches. Exact expression and current-code
review step in REVIEW_HANDOFF_PLAN.md. Current native condition has not been
supplied; likely outer numeric comparison is an inference, not inspected code.
Do not claim final posting passed or replay the failed run without state review.

**9 November current runtime confirmation:** user reports new manager approval
email automatically after the employee answers the new question, following the
no-manual-update retest. Manager clarification resumption is user-confirmed working.
Root cause of the earlier missed event unknown. Final Approved/Completed, one
linked expense and correct ledger deduction still need this test's confirmation;
boss clarification/rejection and security acceptance are separate. Older notes
below are diagnostic history.

**9 November latest runtime report:** controlled manual same-value stage update
caused both Dataverse flows to run and a new manager approval email with question
and answer. No root cause identified; automatic answer update still needs a new
round test without manual intervention. Use current manager approval / Need
Clarification, new employee answer, then automatic email/run check. Diagnostic
cleanup instructed; see REVIEW_HANDOFF_PLAN.md. No final financial acceptance inferred.

**9 November latest evidence:** supplied Callback Registrations read shows main
message 4, Organization scope, hr_workflowstage watched, and intended Pending /
Not Started-or-Ready filter. Notification registration also matches its waiting
stages. Root cause remains unknown; next inspect existing Callback Registration
System Jobs (REVIEW_HANDOFF_PLAN.md) for status/error evidence. No further native
row/filter/registration changes are instructed. Earlier checkpoints below are history.

**9 November next diagnostic:** inspected queue UpdateOnlyRecord includes
item/hr_workflowstage on the Request row; both connections green by user report.
Read persisted Callback Registrations using standard Dataverse List rows in the
temporary manual check flow, same environment/connection, exact safe field list
in REVIEW_HANDOFF_PLAN.md. No main flow/filter/record change is instructed.
Stored registration health remains unknown until actual output is supplied.

**9 November current diagnostic:** main flow On and clean Flow Checker, only
initial successful run visible by user report. Await exact queue action raw
parameters and main-trigger Dataverse connection status. Matching declared
filter/output does not prove event delivery or update input columns. No further
row/filter/trigger/connection mutation instructed until evidence is supplied.

**9 November current result:** user reports no run after direct stage updates
following restart. Stop further toggles/replays. Requested MAIN flow Details
Status/trigger-connection warnings and Run history All runs including Running,
Waiting, Cancelled and Skipped. Callback/connection health and actual current
run visibility remain unverified; no root cause or new mutation is inferred.

**9 November latest supplied evidence:** main trigger message 4 means Added or
Modified; its hr_workflowstage selection and filter match queued Pending / Ready
Manager Outputs. No logic/filter correction identified from these fragments.
Next save and toggle this main flow Off/On, then check Details trigger warnings.
Registration is only a hypothesis, not a proven cause/fix. Webhook restart does
not replay old queued events. No repeat answer/new request instructed yet; see
latest REVIEW_HANDOFF_PLAN.md diagnostic and preserved received JSON evidence.

**9 November latest evidence:** supplied answer response is answered and queue
action is reported Succeeded, but no new manager run. Current native main trigger
Code view and queued Request stage/status Outputs requested next; expected Ready
for Manager 123140003 and Pending 123140000. The old local Added-only snapshot
is not proof of current native configuration. No repeat submission/filter change
or additional flow is instructed pending evidence.

**9 November diagnostic:** user reports initial manager approval, question visible
and employee answer submitted; manager and answer flows show Succeeded, but no
new main flow run after the answer. Inspect final answer response plus queue
action status before changing subscription/filter settings. No new flow or
repeat submission instructed. See latest CLARIFICATION_SETUP.md checkpoint;
native response, saved stage and current trigger definition remain uninspected.

**8 November current checkpoint:** user reports My Requests question card and
feature version/ready true. Next turn on existing clarification notification and
test a NEW small request -> manager Need Clarification/comment -> employee email
and linked question. Stop before answering; expected Pending and unchanged
balance are not yet measured. See CLARIFICATION_UI_SETUP.md. Native question,
email, answer/caller/resumption and financial acceptance remain pending.

**8 November current checkpoint:** user reports Added or Modified main trigger
configured. Native code/runtime uninspected. Publish the prepared existing My
Requests page and Petty Cash Modules template next; the site's local reply flag
is now true for controlled publication, reusable/shared defaults remain false.
Keep notification Off until publication is confirmed. See CLARIFICATION_UI_SETUP.md.
Earlier Added-only/disabled notices below are historical checkpoints; no native
answer/caller/permission or end-to-end acceptance is inferred from source config.

**8 November current next step after reported receipt wait:** stage automatic
resumption by changing the EXISTING main Request trigger to Added or Modified,
preserving its configured scalar column/row filters. This is instructed, not
confirmed native configuration. Keep notification Off and reply UI false until
publication; no answer/testing during the staging gap. All first-version guided
transitions are user-reported, not independent runtime acceptance. See the
latest activation section of REVIEW_HANDOFF_PLAN.md; older Added-only notices
describe checkpoints before this staged change.

**8 November next step after reported trigger-filter configuration:** retain
Added-only while adding Wait_For_Receipt at main level after Review_Is_Resume,
before manager lookup. Bounded 5-second polling of existing hr_receiptimage
prevents treating header creation as finished browser submission. Preserve
existing mandatory receipt download before review writes/approval. Detailed
steps/limits and interrupted-upload handling in REVIEW_HANDOFF_PLAN.md; new loop
is instructed, not native-verified. UI false; notification Off.

**8 November 2026 current next step:** answer Input_Clarification/Input_Answer
bindings are user-reported done; native definitions/caller/runtime uninspected.
Prepare the existing main Request trigger's Select columns = hr_workflowstage
and Pending plus Not Started/Ready Manager/Ready Boss Filter rows in
REVIEW_HANDOFF_PLAN.md. Keep Change type Added only for now. This prepares, but
does not activate, Modified reply resumption. UI disabled; notification Off.

**8 November 2026 simplification:** user requests skipping the HTTP/Entra consent
path. Defer ETag/batch claims and the manual connection diagnostic; use the
existing Dataverse connector for the first functional clarification version.
Retain current ownership/state/round guards and unique keys; ordinary updates
still permit concurrent-run races. REVIEW_HANDOFF_PLAN.md supersedes earlier
connection/conditional-write prerequisites. Resume transitions, answer context,
reply UI and controlled tests remain unfinished; no native action changed here.

**7 November 2026 routing reported configured; handoff connection next:** user
confirms the coordinated manager-action move, outer On/runAfter and 10k edits.
Native updated structure/runtime uninspected. User supplies Developer resources
API URL; anonymous WhoAmI challenge advertises the same api-host resource URI
(401, no credentials/data). Next create manual read-only Dataverse Connection
Check using HTTP with Microsoft Entra ID and GET WhoAmI. No authenticated
connection or conditional update is confirmed. Exact URI/action settings and
draft handoff semantics in REVIEW_HANDOFF_PLAN.md. Added-only/notification Off
remain while claims, completeness, handoff and UI are unfinished.

**7 November 2026 resume-child validation reported configured:** user confirms
Review_Is_Resume/Get_Resume_Clarification/Resume_Is_Current; native prefix and
runtime uninspected. Next coordinated edits put only the existing manager
approval inside root Run_Manager_Review, keep the outer Switch at root, replace
its On and successful runAfter to route validated boss Ready via the existing
Approve/boss path, and update the old 10k condition to force boss resume while
preserving strict >10000 for other entries. Preserve approval action names and
case trees; no new outer wrapper. Instructed only, not runtime-verified.
Keep Added-only trigger/notification Off until protected handoff, markers,
round claims and saved-answer context are wired; exact settings in review guide.

**7 November 2026 root entry guard reported configured:** user confirms
Get_Review_Request and Review_Entry_Allowed. Native prefix placement, dependencies,
outputs/runtime uninspected. Next at root before manager lookup add
Review_Is_Resume; True gets the active child and validates Resume_Is_Current
(Answered, answer/date present, same Request/employee/source/positive round and
correct Manager/Boss Ready pair). False of outer condition stays empty for
initial entry; invalid resume cancels, valid branch remains empty. Existing
actions follow the entire condition at root, preserving boss nesting depth.
This is instructed snapshot validation, not a claim or completed dispatch.
Keep Added-only trigger and notification Off; exact steps in review guide.

**7 November 2026 two functional corrections reported done:** user confirms
new boss waiting stage and intended recipient corrected in the native flow.
Refreshed code/runtime uninspected; received JSON/report are preserved as-is.
Next add Get_Review_Request and Review_Entry_Allowed at main level immediately
after trigger, before manager lookup. Allow only Pending initial/Ready stages;
False cancels, True stays empty, existing actions continue after the condition
at main level. No enclosing wrapper. Keep trigger Added only and notification
Off: selective manager skipping, claims and handoff are not wired yet. Exact
read/condition settings in APPROVAL_FLOW_REVIEW.md; instructed, not configured.

**7 November 2026 current trigger/Switch statically inspected:** supplied JSON
files are valid and preserved unchanged. The Switch has 61 actions and depth 8,
with no duplicate names or unresolved sibling dependencies. Two corrections
precede resume wiring: new boss parent Update_a_row uses Manager waiting
123140002 (must be Boss 123140005); boss approval still assigns the manager
lookup email (use agreed fixed boss address). Actual boss outcome/reuse names
are Switch_1 and Condition_3. Trigger is still Added only. Avoid a new enclosing
Switch wrapper; selective manager skipping/boss routing needs protected claims
and handoff. Native corrections/runtime unverified; notification stays Off.
Findings, source hashes and target layout are in APPROVAL_FLOW_REVIEW.md.

**7 November 2026 boss reuse branch reported configured:** user confirms
Existing_Boss_Clarification, Boss_Can_Reuse_Clarification and
Restore_Boss_Question_Link. Both approver question branches are now configured
by report; no full updated native definition/runtime/atomic acceptance verified.
Next inspect current main trigger and outer manager Switch including nested
boss/clarification branches before preparing controlled initial/Ready dispatch.
Request approval-trigger-current.json and approval-flow-current.json in project;
only the historical Switch snapshot was found locally. No trigger/branch move
or new resume flow instructed yet. Keep notification Off pending UI/tests;
details and intended routing in APPROVAL_FLOW_REVIEW.md.

**7 November 2026 boss new-question path reported configured:** user confirms
Create_Boss_Clarification and Set_Boss_Awaiting_Employee. Native code, rows and
runtime uninspected. Next in Boss_Question_Is_New > False add the existing-child
Compose, combined Boss_Can_Reuse_Clarification (matching source/Request/employee/
actual requester/question/stage/round, Awaiting Answer and no saved answer/date),
then True Restore_Boss_Question_Link; False cancels without writes. Reuses the
shared parent guards and preserves original child and manager approval. This is
instructed designer setup, not atomic recovery or runtime acceptance. Keep
notification Off; exact settings in APPROVAL_FLOW_REVIEW.md.

**7 November 2026 boss state/routing guards reported configured:** user confirms
Boss_Can_Link_Clarification and Boss_Question_Is_New. Native definitions,
evaluations and runs are uninspected. Next in new-question True add
Create_Boss_Clarification, then success-only Set_Boss_Awaiting_Employee linking
the created child and matching source/round to Awaiting Employee - Boss.
Pending status and completed manager approval remain; no financial action.
Two writes instructed only, not configured/runtime-verified. Existing-row reuse,
insert conflict/conditional protection, resume and UI remain incomplete.
Keep notification Off; field mapping in APPROVAL_FLOW_REVIEW.md.

**7 November 2026 boss input/actor guard reported configured:** user confirms
Boss_Clarification_Responder_Email, Find_Boss_Clarification_Requester and
Boss_Clarification_Valid. Native definitions/matches/runtime remain uninspected.
Next in True add shared Boss_Can_Link_Clarification parent gate (unchanged
employee/manager, positive round, Not Started/Boss Review, empty active question,
absent/matching source ID); False cancels without writes. True then adds
Boss_Question_Is_New, comparing source-row count to numeric 0. Both branches
stay empty pending create/reuse. No new boss writes/dispatch or concurrency
protection inferred. Notification remains Off; details in APPROVAL_FLOW_REVIEW.md.

**6 November 2026 boss parent/source reads reported configured:** user confirms
Get_Boss_Clarification_Request and Find_Boss_Clarification. Native definition,
row outputs and runtime are uninspected. Next add the boss responder-email
Compose, active Contact lookup (contactid/emailaddress1, top 2) and
Boss_Clarification_Valid guard at the same case level. False fails diagnostically;
True stays empty before create/reuse/current-state routing. Preserve actual
reassignment identity and completed manager approval. No boss writes or new
approval yet; notification remains Off. Exact settings in APPROVAL_FLOW_REVIEW.md.

**6 November 2026 boss Approval ID token inspected:** supplied Boss_Approval_ID
Compose references Start_and_wait_for_an_approval_-_boss body/name and follows
Boss_Clarification_Question on SUCCEEDED. This confirms the configured token,
not a completed native runtime ID or the question's exact input expression.
Next add Get_Boss_Clarification_Request (current parent/workflow/amount) and
Find_Boss_Clarification (existing child by boss source ID, top 1). Exact read
settings are in APPROVAL_FLOW_REVIEW.md. No boss writes/dispatch or native run
are inferred; keep notification Off pending reply UI/testing.

**6 November 2026 manager recovery structure reported configured:** user confirms
Manager_Can_Restore_Question and Restore_Manager_Question_Link. No native code,
write/run or concurrency result inspected. Next capture boss comments and select
the boss Approval ID token in two Composes inside Boss_Outcome > Need
Clarification, then inspect Boss_Approval_ID Code view. Keep completed manager
approval and existing finance paths intact; do not copy the full nested manager
tree into the deeper boss branch. Notification remains Off; conditional writes,
insert-time conflict recovery, boss creation, resumption and UI remain pending.
See APPROVAL_FLOW_REVIEW.md for exact next action names/settings.

**6 November 2026 open-question guard reported configured:** user confirms
Manager_Question_Still_Open. Next finish that True branch with
Manager_Can_Restore_Question: eligible Pending manager review with unchanged
employee/manager, empty active child and no conflicting approval ID. False
cancels the old run without writes; True Restore_Manager_Question_Link updates
only the parent workflow fields with the existing question and round. These
actions are instructed only; native configuration/runtime are unverified.
Snapshot races/conditional-write protection and unique-insert conflict recovery
remain incomplete. Notification stays Off pending UI/testing. Exact mapping is
in APPROVAL_FLOW_REVIEW.md.

**6 November 2026 existing-question identity check reported configured:** user
confirms Manager_Existing_Question_Matches. Next, inside its True branch, add
Manager_Question_Still_Open (Awaiting Answer, empty answer and Answered On).
False terminates this run Cancelled without rejecting the Request or changing
records; True remains empty before current parent eligibility/activation setup.
This snapshot is not atomic write protection. Native definition/run remain
uninspected; notification stays Off pending UI/testing. Exact steps are in
APPROVAL_FLOW_REVIEW.md.

**6 November 2026 existing-question reads reported configured:** user confirms
Existing_Manager_Clarification and Get_Manager_Reuse_Request. Next configure
Manager_Existing_Question_Matches after those reads inside the same False branch.
It compares the original row's source/Request/employee/question/manager stage/
positive matching round and requires a recorded requester. True remains empty;
False diagnoses a mismatch without altering data. This is snapshot identity
validation, not permission to activate, overwrite an answer or rewind a review.
Native configuration and runtime remain uninspected.

**6 November 2026 notification revision reported configured:** user confirms
Part B guard/link/Question-token edits following the reported Part A trigger and
lookup edits. Notification stays Off pending reply UI and controlled testing.
Next add Existing_Manager_Clarification Compose and Get_Manager_Reuse_Request
in Manager_Question_Is_New > False, as specified in APPROVAL_FLOW_REVIEW.md.
These are instructed read-only setup actions, not a completed reuse/activation
handler. No native flow definition, delivery or resumption test is verified.

**5 November 2026 parent waiting link reported configured:** user confirms
Set_Manager_Awaiting_Employee configured. Native row/activation run is unverified.
Next revise the existing notification flow to Request Modified hr_workflowstage,
with current event-linked child/owner/waiting checks and updated email sources.
Keep that notification flow off during revision and until reply UI/testing are
ready; no native delivery or resumption completion is inferred.

**5 November 2026 manager question creation reported configured:** user confirms
the guard/Create action done; no actual native row or runtime is inspected.
Next Set_Manager_Awaiting_Employee links the new child and saves Awaiting Employee
- Manager/current approval/matching round on the existing Request. Only workflow
fields are updated; notification timing, retry activation and atomicity remain
pending before live use. See APPROVAL_FLOW_REVIEW.md for exact expressions.

**5 November 2026 responder lookup reported configured:** user confirms actual
responder-email Compose and active Contact lookup done. Next configure guarded
Create_Manager_Clarification using that unique Contact and stable approval ID.
No native creation/run is confirmed. Parent activation, notification readiness,
reuse/conflict handling, captured review rounds and atomic writes remain pending.

**5 November 2026 question guards reported configured:** user reports input/
Pending validation and new-versus-existing clarification condition done. Next
resolve responding approver email to an active Contact using a narrow query,
since supplied approvals allow reassignment and Requested By expects a Contact
GUID. Native output shape and one-match/current-review gates still need testing;
no clarification or parent writes are instructed at this checkpoint.

**5 November 2026 selected manager approval-ID token confirmed:** supplied
Manager_Approval_ID Compose uses manager approval body/name and follows
Manager_Clarification_Question. Native value/run is not inspected. Next read the
latest Request and existing clarification by this source ID before deciding
create/reuse, with nonempty question/source and current-review checks still
required before writes. Exact guided settings are in APPROVAL_FLOW_REVIEW.md.

**5 November 2026 boss routing reported configured:** user confirms the coordinated
Boss_Outcome Switch/custom response change done, with existing finalization and
rejection containers moved by the instructions. Updated native definition,
recipient and runtime have not been inspected. Next manager clarification step
captures first-response comments and checks the actual Approval ID token; no
child/parent workflow writes are instructed before that token is established.

**5 November 2026 three corrections reported completed:** user confirms strict
>10000 threshold, standard line-item lookup filter and direct triggering Request
bind on both cash inserts. Native updated code/tests remain uninspected; the
received Switch snapshot is historical. Next coordinated instruction is boss
Custom Responses plus Boss_Outcome Switch with existing expense/reject containers
moved intact before deleting empty Condition 1. No financial write expression
or approval dispatch change is made by the assistant.

**5 November 2026 action code reviewed:** manager approval is CustomResponse with
Approve/Reject/Need Clarification, matched by its Switch. Boss is still Basic,
assigned to the manager email in the supplied code, with two-way outcome logic.
Threshold is >=10000, while the agreed requirement is >10000. List rows - PC
request actually selects one line item. Cash key exists, but the expense read
precedes the boss wait, and cached Contact balance is deducted before cash row
creation. These are static findings, not runtime tests. See
[APPROVAL_FLOW_REVIEW.md](APPROVAL_FLOW_REVIEW.md) for exact next corrections and
remaining reply/financial consistency work; no native changes made by assistant.

**5 November 2026 current evidence received:** user supplies manager/boss overview
screenshots and trigger Code view: OpenApiConnectionWebhook / SubscribeWebhookTrigger,
hr_pettycashrequest, message 1, scope 4, with no trigger filter shown. Manager
Switch's clarification case is now empty and Default has Terminate 2; this
supersedes the earlier reported temporary termination inside clarification.
Boss outcome uses Condition 1; exact outcome/options and threshold are unread.
Need manager approval, full Switch and List rows - PC request Code view before
rewiring. Overview shows topology, not verified lookup filters or write logic.

**5 November 2026 checkpoint:** the user reports the clarification answer-flow
structure and retries configured. Native runtime and atomic answer/handoff writes
remain unverified. Next obtain the CURRENT manager/boss flow definition (or
expanded overview plus trigger Code view) before prescribing routing edits.
No exported native approval definition/package was found locally. Preserve
request completeness and final expense dedupe; the existing Added-only trigger
cannot implement Ready-stage resumption by itself. See
[CLARIFICATION_SETUP.md](CLARIFICATION_SETUP.md) for the recorded checkpoint.

**4 November 2026 configuration clarification:** the user confirms the existing
approval trigger is Added only and the boss recipient is a fixed email. Automatic
clarification resumption needs controlled stage-update routing; it is not wired
yet. The boss uses Start and wait for an approval addressed to the fixed email.
User supplies the new boss Contact GUID bb427249-63d8-f111-84ea-70a8a52176fd;
email/role properties and the boss custom-response configuration remain unverified. Refer to
CLARIFICATION_SETUP.md for the current guided checkpoint; no native trigger or
recipient change is performed by the assistant.

**3 November 2026 clarification checkpoint:** user reports switching manager
approval to custom Approve/Reject/Need clarification responses and routing with
a Switch. Clarification/Default temporarily terminate without posting. This
upgrade is incomplete; see [CLARIFICATION_SETUP.md](CLARIFICATION_SETUP.md).
The table, notification, employee reply UI and resume handlers are not connected.

**2 November 2026 update:** the user confirms manager approval duplicate
protection is complete. Record it as user-reported completion. Final expressions,
the chosen duplicate-handling method, native export and controlled run evidence
have not been supplied for independent review. The guided checkpoint below is
historical and must not be treated as the current unfinished tenant state.

Recorded 2026-10-31 from the user's description and two screenshots. The user
built this flow independently. No flow export, run results or action expressions
were inspected; do not treat it as a tenant audit or an assistant deployment.
User subsequently reports Finance self-posting condition and v4 script installed.
The earlier discussion below covers expense posting keys and duplicate prevention.

## Historical guided step: lookup and zero-existing-expense condition

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
