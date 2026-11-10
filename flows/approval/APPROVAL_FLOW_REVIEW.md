# Approval-flow fragments reviewed — 5 November 2026

**Latest decision, 8 November 2026:** the user requests a simpler first version.
HTTP/Entra consent, connection diagnostics and atomic ETag/batch claims are
deferred. Earlier statements making these the next required work are superseded
by REVIEW_HANDOFF_PLAN.md. Continue using existing Dataverse actions and guards;
retain identity/ownership checks and unique keys. Simultaneous-run races remain
an accepted limitation of this plan, not a verified concurrency guarantee.
No supplied snapshot or native action was changed by this plan revision.

This is a static review of user-supplied action Code view, not a tenant export,
runtime test or deployment. No live flow has been edited by the assistant.
The exact Switch attachment is preserved in
[the received JSON snapshot](snapshots/manager-approval-switch.received-2026-11-05.json).
Manager approval, trigger and line-item List rows were supplied separately in
the chat. This material is enough to begin bounded changes without requesting
more overview screenshots. Further native action outputs may still be needed
when wiring approval IDs and current-round tracking.

## Confirmed from supplied code

| Area | Actual configuration |
|---|---|
| Trigger | Dataverse SubscribeWebhookTrigger, hr_pettycashrequest, message 1, scope 4; no supplied filter/select/trigger conditions |
| Manager action | StartAndWaitForAnApproval; approvalType CustomResponse; exact responses Approve, Reject, Need Clarification |
| Manager assignment | Get_a_row_by_ID_-_manager body/emailaddress1 |
| Manager Switch | Start_and_wait_for_an_approval_-_manager body/outcome; exact matching case values |
| Clarification case | Case_-_clarification is empty |
| Default | Terminate_2, runStatus Succeeded (not Cancelled) |
| Threshold | Condition_-_10k uses greaterOrEquals(total, 10000) |
| Boss action | Start_and_wait_for_an_approval_-_boss, approvalType Basic |
| Boss assignment | Also Get_a_row_by_ID_-_manager body/emailaddress1; this supersedes the earlier fixed-boss-email description for this received version |
| Boss outcome | Condition_1 tests only outcome == Approve; all other successful outcomes use rejection branch |
| Reassignment | Both approval actions enable reassignment |
| List_rows_-_PC_request | Actually hr_pettycashlineitems, parent lookup filter, top 1; it does not list Request headers or all items |
| Expense lookup | List_rows_-_Find_Existing_Expense queries Cash Transactions for trigger Request + Expense Approved, top 2 |
| Expense lookup timing | After manager decision, before optional boss approval wait |
| Cash posting key | Both final branches use expense- plus lowercase triggering request GUID in crec6_postingkey |
| Cash Request bind | Both derive parent Request from first returned line item |
| Contact balance | Both subtract total from Get_a_row_by_ID_-_employee body/hr_currentbalance fetched before approval waits |
| Write order | Approved Request status, Contact balance update, then Cash Transaction creation |
| Boss transaction operator | Recorded By uses assigned manager lookup, rather than the fixed boss Contact |

The manager details include request title/date/employee/total and receipt, with
no clarification-history context yet. Manager-only final status does not include
manager comments in the supplied action. Boss comments are written into the same
hr_managercomments column. These observations describe the received version;
they do not imply any native run failure or that the setup is production-ready.

## Initial corrections — user reports completed

1. In Condition - 10k, replace is greater than or equal to with **is greater
   than**, retaining Total Amount and numeric 10000. The agreed requirement is
   above 10,000; exactly 10,000 needs manager only. This changes routing and must
   receive boundary acceptance tests at 9999.99, 10000 and 10000.01.
2. In List rows - PC request, replace only Filter rows with Expression:

   ```text
   concat('_hr_parentrequest_value eq ', triggerBody()?['hr_pettycashrequestid'])
   ```

   This uses the triggering GUID without string quotes in the OData lookup
   comparison. Keep top 1 for now, and do not rename the action while existing
   expressions refer to it. It is an existence sample, not a completeness check
   or a product list for the approval email.
3. In BOTH Add a new row - cash transaction and Add a new row - cash transaction 1,
   set **Linked Request (Petty Cash Requests)** using Expression:

   ```text
   concat('hr_pettycashrequests(', triggerBody()?['hr_pettycashrequestid'], ')')
   ```

   Keep the entity-set lookup format used by the existing connector. This binds
   directly to the triggering Request and removes first(lineItems) as an identity
   dependency. It does not prove that all lines/receipt are saved; readiness is a
   separate prerequisite for approval dispatch.

The user reports all three corrections completed on 5 November 2026. Their
updated native definitions and boundary/runtime tests have not been inspected.
The received JSON snapshot above is deliberately unchanged historical evidence.
Do not
change the boss to CustomResponse until its outcome routing can handle all three
outcomes; the existing Condition_1 False branch would otherwise reject Need
Clarification. Actual boss assignment must be corrected/confirmed for deployment
using the intended boss identity, without assuming the manager target is wrong
for the user's present test setup. No boss email needs to be invented.

## Boss response routing — user reports completed

Coordinate response configuration and routing in one designer edit/save. Build
the new routing first so Need Clarification never falls into the old rejection
else. No financial field values are changed in this structural step.

1. Add **Control > Switch** named **Boss_Outcome** immediately after
   Start and wait for an approval - boss and before the existing Condition 1.
   Its On Expression is:

   ```text
   outputs('Start_and_wait_for_an_approval_-_boss')?['body/outcome']
   ```

2. Add exact case values **Approve**, **Reject**, **Need Clarification**.
   Move existing containers, preserving their names and contents:

   | Existing location/container | New location |
   |---|---|
   | Condition 1 > True > Condition No Existing Expense (Condition__No_Existing_Expense) | Boss_Outcome > Approve |
   | Condition 1 > False > For each 2 (For_each_2) | Boss_Outcome > Reject |

   Move the entire expense condition, including its status loop, balance update,
   cash insert and duplicate branch; do not move only the status action. Moving
   the full rejection loop preserves its items('For_each_2')/item references.
   Do not copy the containers and leave original active duplicates. Verify both
   old branches are empty, then delete only empty Condition 1. If the designer
   refuses a move, report the message before deleting/rebuilding live actions.

3. Leave Need Clarification empty at this intermediate checkpoint. In Default,
   add Terminate, Status **Cancelled**, outside any For each. An unexpected
   response must not approve, reject or post money automatically.
4. In the EXISTING boss approval action, set Approval type to **Custom Responses
   - Wait for one response** and exact response options **Approve**, **Reject**,
   **Need Clarification**. Keep its action name so the new Switch references
   stay valid. Check the intended boss/test recipient; the earlier supplied
   manager-addressed version is not proof of a correct production boss address.
5. Save only after both custom responses and routing are configured. The manager
   Switch and all financial expressions remain unchanged in this step. Full
   clarification automation/testing still waits for record creation, resume,
   conditional-save protection and frontend wiring.

The user reports these coordinated changes completed on 5 November 2026. Updated
native Code view, recipient, runAfter/reference adjustments and execution have
not been independently inspected. Actual designer adjustments must be checked after
moving actions. This step does not resolve the separately recorded stale balance
or expense read timing problems.

## Manager approval-ID token — selected expression confirmed

Inside manager Switch > Need Clarification, add Compose named
**Manager_Clarification_Question**, with Expression:

```text
trim(string(first(outputs('Start_and_wait_for_an_approval_-_manager')?['body/responses'])?['comments']))
```

The supplied successful-response branches already use the manager responses
array and each response's comments. This first-response extraction matches the
configured first-response custom approval. No automatic For each is needed.
It is not yet a write: reject/handle a blank or over-4000 question before creating
a child record; approval comments are not intrinsically required.

Add a short instruction to the manager and boss approval Details:
`If you choose Need Clarification, enter your question in Comments.`
Retain the existing request details and receipt attachment. This text is guidance,
not a required-field control, and does not by itself handle missing comments.

Next add Compose named **Manager_Approval_ID** in the same clarification case.
Search the Dynamic content belonging to Start and wait for an approval - manager
for **Approval ID**. If offered, select that actual token and request this Compose's
Code view, to establish its exact native expression before using Source Approval
ID or Current Approval ID. If not offered, report `Approval ID is not listed`;
do not guess body/name, use a response-row ID or invent a random/workflow-run ID.
The official connector reference declares dynamic output schemas; it does not
prove a universal static property for this configured operation.

No new approval needs to be run just to inspect the token picker. Do not create
Request Clarification or parent workflow writes at this checkpoint. Source-ID
uniqueness, active-round tracking, caller/approver identity, question validation
and retry-safe creation must be wired together after the native token is known.
The user now supplies Manager_Approval_ID Compose Code view:

```json
{
  "type": "Compose",
  "inputs": "@outputs('Start_and_wait_for_an_approval_-_manager')?['body/name']",
  "runAfter": {
    "Manager_Clarification_Question": ["Succeeded"]
  }
}
```

This confirms the chosen token's expression is body/name for THIS configured
action, and the dependency on Manager_Clarification_Question. A completed native
run/value, exact question Compose inputs and Details edits have not been
inspected. Do not generalize this property to other connector versions/actions.

## Current Request and existing-question reads — user reports configured

In manager Switch > Need Clarification, immediately after Manager_Approval_ID,
add Dataverse Get a row by ID named **Get_Manager_Clarification_Request**:

| Property | Value |
|---|---|
| Table | Petty Cash Requests |
| Row ID, Expression | `triggerBody()?['hr_pettycashrequestid']` |

Keep other advanced options blank at this checkpoint. This is a current backend
Request read after the approval wait, rather than relying solely on the original
trigger snapshot for state/round/ownership. It does not read Contact credentials.

Immediately afterward add Dataverse List rows named
**Find_Manager_Clarification**:

| Property | Value |
|---|---|
| Table | Request Clarifications |
| Row count | 1 |
| Pagination | Off |
| Filter rows, Expression | `concat('hr_sourceapprovalid eq ''', string(outputs('Manager_Approval_ID')), '''')` |

Source Approval ID is a text column, hence OData string quotes; the value is the
platform approval token, not browser input. The user-confirmed Active unique key
on this nonempty ID provides at most one matching row. Keep other advanced
options blank so subsequent state/reuse logic can read the existing row fields.
Do not prefix the connector Filter rows field with $filter=.

The user reports these reads configured on 5 November 2026; execution and native
Code view remain uninspected. Before
any create/reuse writes, require nonempty approval ID and a nonempty question
within 4000 characters; validate the current Pending review/round/actor and
existing-row identity. A pre-read does not atomically prevent parallel creates:
the unique key conflict must recover the matching row rather than invent a new
source ID or send duplicate notifications. Parent activation and notification
ordering also still need coordination. No new clarification rows, Request stage
updates, approvals or emails are instructed at this checkpoint.

## Question validation and create/reuse routing — user reports configured

After Find_Manager_Clarification, add Condition **Manager_Clarification_Valid**.
Left is evaluated Expression:

```text
and(
  not(empty(trim(string(outputs('Manager_Approval_ID'))))),
  not(empty(trim(string(outputs('Manager_Clarification_Question'))))),
  lessOrEquals(length(trim(string(outputs('Manager_Clarification_Question')))), 4000),
  equals(body('Get_Manager_Clarification_Request')?['hr_approvalstatus'], 123140000)
)
```

Compare is equal to Expression Boolean `true`. False: Control > Terminate,
Status Failed, Code `ManagerClarificationInvalid`, Message:
`The clarification question is missing or exceeds 4,000 characters, the approval ID is missing, or the request is no longer pending.`
This diagnoses the failed run without setting Request status to Rejected or
sending a blank question. Keep Terminate outside For each. Missing-comment
recovery/owner notification remains an exception policy to finalize.

In True add Condition **Manager_Question_Is_New**. Left Expression
`length(body('Find_Manager_Clarification')?['value'])`, is equal to right
Expression Number `0`. Leave both branches empty: True will create after
current-review/actor validation; False will verify/reuse the source-ID match
without replacing saved text or restarting an old review. The Active unique key
and conflict recovery, not this pre-read, must handle parallel duplicate creates.
Check the native nesting limit before adapting this to the deeper boss branch.

The user reports these conditions configured on 5 November 2026; native Code
view/execution remains uninspected. No child/parent writes or emails are
added; current round/actor checks, activation/notification ordering and atomic
save protection remain pending before live use.

## Responding approver Contact lookup — user reports configured

Inside **Manager_Question_Is_New > True**, add Compose named
**Manager_Clarification_Responder_Email**, with Expression:

```text
toLower(trim(string(first(outputs('Start_and_wait_for_an_approval_-_manager')?['body/responses'])?['responder']?['email'])))
```

This uses the responding Microsoft 365 user's email from the first response;
Requested By requires a Contact GUID, not the responder's Entra/Microsoft 365
user ID. Both supplied approvals allow reassignment. Preserve that behavior and
resolve the actual responder rather than silently recording the original manager
as the person who asked. The official connector documents responder email; the
current native runtime shape/value must still be verified in testing, and empty
email must fail before any lookup result is used for a write.

After Compose add Dataverse List rows named
**Find_Manager_Clarification_Requester**:

| Property | Value |
|---|---|
| Table | Contacts |
| Select columns | `contactid,emailaddress1` |
| Row count | 2 |
| Pagination | Off |
| Filter rows, Expression | `concat('statecode eq 0 and emailaddress1 eq ''', replace(outputs('Manager_Clarification_Responder_Email'), '''', ''''''), '''')` |

The expression escapes apostrophes in a valid email before building the quoted
OData text comparison. Select only these identity fields; do not fetch credentials
or balance fields in this new Contact query. Two-row cap permits rejecting an
ambiguous email match; do not take first() and bind it unless email is nonempty
and exactly one active Contact matches. Missing/inactive/duplicate Contact matches
must be diagnosed, not resolved by creating a new Contact or granting a role.

The user reports these input/lookup actions configured on 5 November 2026;
native Code view and runtime values remain uninspected.
Next combine unique-responder/current-review checks before creating a child row.
Source-key conflict recovery and parent activation/notification ordering remain
pending. No clarification, Request, Contact, permission or financial write is
instructed at this checkpoint. Verify ancestry before adapting to the boss case.

## New manager clarification creation — user reports configured

After Find_Manager_Clarification_Requester, still in Manager_Question_Is_New >
True, add Condition **Manager_Can_Create_Clarification**. Left Expression:

```text
and(
  not(empty(outputs('Manager_Clarification_Responder_Email'))),
  equals(length(body('Find_Manager_Clarification_Requester')?['value']), 1),
  not(empty(body('Get_Manager_Clarification_Request')?['_hr_submittedby_value'])),
  equals(
    toLower(string(body('Get_Manager_Clarification_Request')?['_hr_submittedby_value'])),
    toLower(string(triggerBody()?['_hr_submittedby_value']))
  ),
  equals(
    toLower(string(body('Get_Manager_Clarification_Request')?['_hr_assignedmanager_value'])),
    toLower(string(triggerBody()?['_hr_assignedmanager_value']))
  ),
  or(
    equals(body('Get_Manager_Clarification_Request')?['hr_workflowstage'], 123140000),
    equals(body('Get_Manager_Clarification_Request')?['hr_workflowstage'], 123140001)
  ),
  empty(body('Get_Manager_Clarification_Request')?['_hr_activeclarification_value']),
  greater(coalesce(body('Get_Manager_Clarification_Request')?['hr_reviewround'], 1), 0),
  or(
    empty(body('Get_Manager_Clarification_Request')?['hr_currentapprovalid']),
    equals(
      string(body('Get_Manager_Clarification_Request')?['hr_currentapprovalid']),
      string(outputs('Manager_Approval_ID'))
    )
  )
)
```

Compare is equal to Expression Boolean `true`. Earlier Manager_Clarification_Valid
already requires Pending and a valid question/source ID. This adds unique active
Contact resolution, unchanged submitting employee/assigned manager, eligible
initial/manager-review stage, no active question, a positive round and no
conflicting recorded approval ID. Reassignment is honored through the actual
responder lookup; it does not alter the Request's assigned-manager relationship.

False: Terminate, Status Failed, Code `ManagerClarificationNotReady`, Message
`The approver does not match exactly one active Contact, or the request review has changed.`
No Request status or profile changes are made on this path.

True: Dataverse Add a new row named **Create_Manager_Clarification**, table
**Request Clarifications**. Each expression below goes through Expression/fx;
choice labels are selected normally:

| Field | Value |
|---|---|
| Request (Petty Cash Requests), Expression | `concat('hr_pettycashrequests(', triggerBody()?['hr_pettycashrequestid'], ')')` |
| Employee (Contacts), Expression | `concat('contacts(', body('Get_Manager_Clarification_Request')?['_hr_submittedby_value'], ')')` |
| Requested By (Contacts), Expression | `concat('contacts(', first(body('Find_Manager_Clarification_Requester')?['value'])?['contactid'], ')')` |
| Question, Expression | `outputs('Manager_Clarification_Question')` |
| Approval Stage | Manager (123140000) |
| Clarification Status | Awaiting Answer (123140000) |
| Review Round, Expression | `coalesce(body('Get_Manager_Clarification_Request')?['hr_reviewround'], 1)` |
| Source Approval ID, Expression | `outputs('Manager_Approval_ID')` |

Leave Clarification Reference for the confirmed autonumber; Answer/Answered On
stay blank. Do not choose an array token that adds an automatic For each: first()
is safe only inside the unique-match True branch. No Contact creation or web-role
assignment is performed. The user reports the eligibility condition and creation
action configured on 5 November 2026; native definition/execution remain
uninspected. Save configuration only; do not run the incomplete branch yet.

This is not completion of the workflow. Parent Awaiting Employee stage, current
approval ID, review round and active-clarification link must be set consistently
after creation; existing Added-child notification may otherwise run before that
activation is ready. Coordinate notification timing before end-to-end tests.
Existing-row reuse, unique-key conflict recovery and conditional/atomic writes
are still pending. The eligibility expression reads a snapshot, not a lock, and
does not compare a captured per-run round because dispatch-round capture is not
wired yet. Future Ready dispatch must initialize/increment and retain that round
per run, clear old active/current markers only after durable handoff, and reject
stale approval responses before activation. No financial row or Contact balance
is touched by this new-question action.

## Parent waiting-state link — user reports configured

Immediately after Create_Manager_Clarification in the SAME
Manager_Can_Create_Clarification > True branch, add Dataverse Update a row named
**Set_Manager_Awaiting_Employee**. Use default success-only Run after; it must
not run if creation fails or in parallel with creation.

| Property | Value |
|---|---|
| Table | Petty Cash Requests |
| Row ID, Expression | `body('Get_Manager_Clarification_Request')?['hr_pettycashrequestid']` |
| Workflow Stage | Awaiting Employee - Manager (123140002) |
| Current Approval ID, Expression | `outputs('Manager_Approval_ID')` |
| Review Round, Expression | `coalesce(body('Get_Manager_Clarification_Request')?['hr_reviewround'], 1)` |
| Active Clarification (Request Clarifications), Expression | `concat('hr_requestclarifications(', outputs('Create_Manager_Clarification')?['body/hr_requestclarificationid'], ')')` |

Update only the four listed workflow fields; leave other optional columns blank.
Reference the GUID of the existing Request read earlier, never guid() for an
Update row, to avoid accidental upsert of another Request. The child ID is the
confirmed primary logical name from this Create action; verify native returned
ID/binding in controlled tests. The round expression exactly matches the child
creation input. The current approval ID matches the child's stable source ID.

Approval Status remains Pending; no balance/cash/Contact/permission update is
added. This records the current waiting question but does not itself send a new
approval when the employee answers: Added-only main dispatch still needs routing.

The user reports this parent update configured on 5 November 2026; native Code
view, saved state and runtime are uninspected. Keep the
feature untested/live-disabled while notification timing and existing-row/retry
handoff are incomplete. The current notification flow triggers on child Added,
so it can start before this parent activation; notification must be coordinated
to send only after the active waiting state is persisted. A Request Modified
workflow-stage event is a candidate, using the ordinary hr_workflowstage column
as Select columns (not a lookup column), followed by fresh parent/child checks.
The next coordinated notification rewrite is now specified in
[CLARIFICATION_SETUP.md](../clarifications/CLARIFICATION_SETUP.md): existing notification flow Off,
Request Modified on scalar hr_workflowstage, read event-linked clarification,
update employee/Request sources, current-question condition and email/link tokens.
It is instructed only, not assumed applied. Keep notification off until reply UI
and end-to-end tests are ready; do not run both old/new notification variants.

The user subsequently reports notification revision Part A configured: Off,
Request Modified trigger and new/updated lookup sources. Part B is next: edit
the existing condition rows without deleting its branches, then replace the
reply link/Question token with Get_Notification_Clarification outputs. Part A
confirmation alone does not verify the full revision or native email behavior.

The guard/read + child creation + parent update are still separate operations,
not an atomic transaction. Failed parent activation must be recoverable through
the same source-ID row; never create a new question or rewind a newer review on
retry. Captured per-run round validation/conditional writes and stale approval
handling remain required before live acceptance.

## Manager existing-question recovery: read checkpoint

On 6 November 2026 the user reports notification revision Part B completed after
Part A. This is reported configuration, not inspected native code or email
delivery. Keep notification Off until reply UI and controlled tests are ready.

Return to the existing manager/boss approval flow. Inside the manager's Need
Clarification case, use **Manager_Question_Is_New > False** (a clarification
already exists for this source approval ID). Add these two sequential actions:

1. Data Operations > Compose, named **Existing_Manager_Clarification**.
   Inputs, Expression tab:

   ```text
   first(body('Find_Manager_Clarification')?['value'])
   ```

   This branch is reached only when the existing source-ID lookup found a row.
   Keep its stable ID and original question/answer; do not create another row.

2. Dataverse > Get a row by ID, named **Get_Manager_Reuse_Request**.
   Table: Petty Cash Requests. Row ID, Expression tab:

   ```text
   triggerBody()?['hr_pettycashrequestid']
   ```

   Select columns:

   ```text
   hr_pettycashrequestid,hr_approvalstatus,hr_workflowstage,hr_currentapprovalid,hr_reviewround,_hr_activeclarification_value,_hr_submittedby_value,_hr_assignedmanager_value
   ```

   Leave other advanced options blank. Run only after Compose succeeds.

Save after these two reads. Reuse eligibility and any parent activation will be
configured separately after this checkpoint; these actions do not claim/lock
the Request, overwrite a question, clear an answer, rewind a later stage or
handle an insert-time unique-key conflict. The initial Find action can race a
concurrent creation, so its existing-row branch alone is not full conflict
recovery. Captured per-run round and conditional writes remain outstanding.

## Manager existing-question identity condition — next guided step

The user reports the two recovery reads configured on 6 November 2026; no
native action definition, row output or run is inspected. In the SAME
Manager_Question_Is_New > False branch, immediately after
Get_Manager_Reuse_Request, add Condition **Manager_Existing_Question_Matches**.
Left side: Expression tab, paste:

```text
and(
  equals(
    string(outputs('Existing_Manager_Clarification')?['hr_sourceapprovalid']),
    string(outputs('Manager_Approval_ID'))
  ),
  equals(
    toLower(string(outputs('Existing_Manager_Clarification')?['_hr_request_value'])),
    toLower(string(body('Get_Manager_Reuse_Request')?['hr_pettycashrequestid']))
  ),
  not(empty(outputs('Existing_Manager_Clarification')?['_hr_employee_value'])),
  equals(
    toLower(string(outputs('Existing_Manager_Clarification')?['_hr_employee_value'])),
    toLower(string(body('Get_Manager_Reuse_Request')?['_hr_submittedby_value']))
  ),
  not(empty(outputs('Existing_Manager_Clarification')?['_hr_requestedby_value'])),
  equals(outputs('Existing_Manager_Clarification')?['hr_approvalstage'], 123140000),
  equals(
    trim(string(outputs('Existing_Manager_Clarification')?['hr_question'])),
    trim(string(outputs('Manager_Clarification_Question')))
  ),
  greater(coalesce(outputs('Existing_Manager_Clarification')?['hr_reviewround'], 0), 0),
  equals(
    outputs('Existing_Manager_Clarification')?['hr_reviewround'],
    coalesce(body('Get_Manager_Reuse_Request')?['hr_reviewround'], 1)
  )
)
```

Operator: is equal to. Right side: Expression Boolean `true`.

- **False:** Control > Terminate, Status **Failed**, Code
  `ManagerClarificationMismatch`, Message:
  `The existing clarification does not match this request, question or review round. Check the flow run before retrying.`
- **True:** leave empty for the next state-handling step. Save configuration
  only; do not create another clarification or update the existing child.

This verifies correlation to the known approval and current Request, preserves
the original recorded requester, and uses the same initial parent-round fallback
1 as creation. It does not re-resolve the approver's current email or change the
requester. A missing requester/employee or nonpositive child round fails closed.
The matching question is trimmed only at its edges, not replaced or normalized
into a different saved question.

Do not treat True as permission for an unconditional parent update: the child
could already be answered/processed/cancelled, or its answer could change after
the List read. Parent Pending, unchanged owner/assigned manager, workflow stage,
current approval and active-child state still need handling before any recovery.
Existing active waiting state should be a no-write success; an already advanced
review must not be rewound. Conditional writes/per-run round validation and
insert-time unique-key conflict recovery remain incomplete. Notification stays
Off until reply UI and controlled tests are ready. This step adds no native
write, email, approval, role, API field or schema change.

## Existing manager question: open-state guard — next guided step

On 6 November 2026 the user reports Manager_Existing_Question_Matches configured.
No native Code view or runtime is inspected. Inside its **True** branch, add
Condition **Manager_Question_Still_Open**.

Left field, Expression:

```text
and(
  equals(outputs('Existing_Manager_Clarification')?['hr_clarificationstatus'], 123140000),
  empty(trim(string(outputs('Existing_Manager_Clarification')?['hr_answer']))),
  empty(outputs('Existing_Manager_Clarification')?['hr_answeredon'])
)
```

Compare **is equal to** right-side Expression Boolean `true`.

- **False:** Control > Terminate, Status **Cancelled**. Stop this old approval
  run without changing the question, answer, parent Request or any cash data.
- **True:** leave empty at this checkpoint. Current parent eligibility and
  no-write versus activation handling must be added before any parent update.

This tests the existing row's snapshot for Awaiting Answer plus no saved answer
and no Answered On timestamp. Answered, Processed, Cancelled, missing/unknown
statuses and inconsistent partially answered rows are never reopened through
this branch. A cancelled run here is not a new rejection of the employee's
Request and does not signal an answer was successfully handed back to review.
An inconsistent row may require administrator inspection; the flow does not
erase its answer to repair it.

The earlier source lookup is still a snapshot. This condition does not close
the race between an employee answer and a later parent update, nor prove the
parent remains Pending/in the same review. Current ownership/manager,
workflow stage, approval/active-child markers and conditional-write handling
remain outstanding before recovery activation. Do not put the new-question
Create action in this branch. Keep notification Off pending reply UI/testing.
No new schema, website setting, permission, frontend or financial change.

## Restore the existing manager question link — next guided step

On 6 November 2026 the user reports Manager_Question_Still_Open configured.
No native action definition/output/run is inspected. Finish the existing-question
branch with the following grouped condition and parent update, while keeping
notification Off and the incomplete feature out of live use.

Inside **Manager_Question_Still_Open > True**, add Condition
**Manager_Can_Restore_Question**. Left field, Expression:

```text
and(
  equals(body('Get_Manager_Reuse_Request')?['hr_approvalstatus'], 123140000),
  equals(
    toLower(string(body('Get_Manager_Reuse_Request')?['_hr_submittedby_value'])),
    toLower(string(triggerBody()?['_hr_submittedby_value']))
  ),
  equals(
    toLower(string(body('Get_Manager_Reuse_Request')?['_hr_assignedmanager_value'])),
    toLower(string(triggerBody()?['_hr_assignedmanager_value']))
  ),
  or(
    equals(body('Get_Manager_Reuse_Request')?['hr_workflowstage'], 123140000),
    equals(body('Get_Manager_Reuse_Request')?['hr_workflowstage'], 123140001)
  ),
  empty(body('Get_Manager_Reuse_Request')?['_hr_activeclarification_value']),
  or(
    empty(body('Get_Manager_Reuse_Request')?['hr_currentapprovalid']),
    equals(
      string(body('Get_Manager_Reuse_Request')?['hr_currentapprovalid']),
      string(outputs('Manager_Approval_ID'))
    )
  )
)
```

Compare **is equal to** right-side Expression Boolean `true`.

- **False:** Control > Terminate, Status **Cancelled**. Do not update anything.
  This includes a Request already in active awaiting state, a progressed review,
  changed employee/assigned manager, another active question, a non-Pending
  Request or a conflicting current approval ID. For this branch, a no-write
  Cancelled run is the chosen duplicate/obsolete-run handling; it supersedes the
  earlier suggestion of a separate no-write success path. Cancellation of this
  old run does not set Approval Status to Rejected.
- **True:** Dataverse > Update a row, named **Restore_Manager_Question_Link**,
  table **Petty Cash Requests**, with only the following workflow fields.

| Field | Value |
|---|---|
| Row ID, Expression | `body('Get_Manager_Reuse_Request')?['hr_pettycashrequestid']` |
| Workflow Stage | Awaiting Employee - Manager (123140002) |
| Current Approval ID, Expression | `outputs('Manager_Approval_ID')` |
| Review Round, Expression | `outputs('Existing_Manager_Clarification')?['hr_reviewround']` |
| Active Clarification, Expression | `concat('hr_requestclarifications(', outputs('Existing_Manager_Clarification')?['hr_requestclarificationid'], ')')` |

Leave other optional inputs blank. This binds the original child GUID and
positive round verified by the earlier identity condition. It never creates a
second child, edits the stored question/answer or writes approval status,
balances or cash rows. The original requester remains unchanged. Place the
update in True only, with normal success-only run-after; add no automatic loop.
Save configuration only, and retain notification Off pending UI/testing.

This completes the *instructed designer structure* of the source-ID existing-row
branch, not production acceptance or atomic recovery. All reads/conditions are
snapshots: an answer or parent review may change before this ordinary Update
executes. Supported conditional child/parent writes and per-run review claims
still need resolution before live use. This branch also does not catch a new
row's insert-time unique-key conflict; the initial empty List result may race
another creator. Boss clarification and Ready-stage resumption remain pending.
No native save, execution or deployment of the new actions is assumed until
the user confirms them.

## Boss clarification inputs — next guided step

On 6 November 2026 the user reports Manager_Can_Restore_Question and
Restore_Manager_Question_Link configured. This completes the guided designer
structure for the manager's existing-source-row branch by user report. No
updated native definition, recovery run or concurrency test has been inspected.
The snapshot/ordinary-write and insert-time conflict gaps described above remain.

Next go to **Boss_Outcome > Need Clarification** in the existing approval flow.
Do not copy the manager's entire nested condition tree into this deeper branch:
the platform permits eight nesting levels; the boss implementation must keep
within that limit while preserving completed manager approval.

Add these two sequential Data Operations > Compose actions:

1. **Boss_Clarification_Question**, Inputs through Expression:

   ```text
   trim(string(first(outputs('Start_and_wait_for_an_approval_-_boss')?['body/responses'])?['comments']))
   ```

   This captures the boss's first response comments for the configured
   Custom Responses - Wait for one response approval. It does not prove a
   question was entered; the subsequent write gate must reject empty/overlong
   comments. Preserve the action's existing response choices and recipient.

2. **Boss_Approval_ID**. In Inputs, select the **Approval ID** dynamic-content
   token from **Start and wait for an approval - boss** specifically.

   Do not use the manager ID, approval response-row ID, flow run ID or guid().
   Outputs for this connector are dynamic. The manager action's earlier
   body/name token is not independent verification of the boss's selected token.
   After choosing the boss token, open this Compose's **Code view** and send only
   its JSON block so the actual configured reference can be recorded before
   wiring source-key lookup/creation.

Save these two actions. Keep notification Off; no boss child/parent write,
approval redispatch, website, schema, role or financial change is instructed at
this checkpoint. No boss token, native runtime ID, save or execution is assumed
verified from manager completion. When adding approval Details guidance, use
"If you choose Need Clarification, enter your question in Comments.";
that sentence alone does not make Comments mandatory.

## Boss approval token confirmed; current Request and source-question reads

On 6 November 2026 the user supplies the actual **Boss_Approval_ID** Compose
Code view:

```json
{
  "type": "Compose",
  "inputs": "@outputs('Start_and_wait_for_an_approval_-_boss')?['body/name']",
  "runAfter": {
    "Boss_Clarification_Question": [
      "SUCCEEDED"
    ]
  }
}
```

This confirms the configured reference to this boss action's body/name and its
success dependency on Boss_Clarification_Question. Preserve the designer's
generated runAfter value; no casing repair is needed based on this snippet.
It does not verify a runtime Approval ID value, the question Compose's exact
Inputs, the recipient, action execution or native save. No additional screenshot
of this token is needed.

Next add these two sequential Dataverse reads in the SAME
**Boss_Outcome > Need Clarification** branch after Boss_Approval_ID:

1. Get a row by ID, name **Get_Boss_Clarification_Request**.
   Table **Petty Cash Requests**. Row ID via Expression:

   ```text
   triggerBody()?['hr_pettycashrequestid']
   ```

   Select columns:

   ```text
   hr_pettycashrequestid,hr_totalamount,hr_approvalstatus,hr_workflowstage,hr_currentapprovalid,hr_reviewround,_hr_activeclarification_value,_hr_submittedby_value,_hr_assignedmanager_value
   ```

   Leave other advanced options blank. This reads the current parent after the
   boss approval wait, including workflow controls and threshold amount.

2. List rows, name **Find_Boss_Clarification**.
   Table **Request Clarifications**, Row count **1**, Pagination **Off**.
   Filter rows via Expression:

   ```text
   concat('hr_sourceapprovalid eq ''', string(outputs('Boss_Approval_ID')), '''')
   ```

   Leave other advanced options blank so downstream checks can inspect the
   matching child fields. Do not prefix with $filter=. The existing unique
   Source Approval ID key is the intended one-row invariant; this preliminary
   lookup is not an atomic claim or insert-time conflict handler.

Save these two reads. No child creation/activation, status changes, approval
redispatch, Contact credentials, email or financial writes are instructed here.
Do not copy the manager's full nested condition tree into the boss branch;
later input/actor/state checks must be arranged within the nesting limit.
Use the boss source ID for lookup, never the earlier manager ID or a random ID.
Nonempty source/question, valid length, current review/round/actor, unchanged
employee and matching existing-row checks remain required before boss writes.
Completed manager approval is preserved. Notification remains Off until reply
UI and controlled tests are ready. The new reads are instructed only, not yet
user-reported configured or runtime-verified.

## Boss responder and input validation — next guided step

On 6 November 2026 the user reports Get_Boss_Clarification_Request and
Find_Boss_Clarification configured. No native read definition/output/run is
inspected. Next, after Find_Boss_Clarification, add the following three actions
sequentially at the same Boss_Outcome > Need Clarification case level, rather
than adding unnecessary nested containers.

1. Compose **Boss_Clarification_Responder_Email**, Inputs Expression:

   ```text
   toLower(trim(string(first(outputs('Start_and_wait_for_an_approval_-_boss')?['body/responses'])?['responder']?['email'])))
   ```

   This resolves the actual responding identity, including reassignment; the
   intended fixed boss Contact GUID is not automatically the responder. Runtime
   responder shape/email remains to be checked in controlled testing.

2. Dataverse List rows **Find_Boss_Clarification_Requester**:
   - Table: **Contacts**
   - Select columns: `contactid,emailaddress1`
   - Row count: **2**
   - Pagination: **Off**
   - Filter rows, Expression:

   ```text
   concat('statecode eq 0 and emailaddress1 eq ''', replace(outputs('Boss_Clarification_Responder_Email'), '''', ''''''), '''')
   ```

   Leave other advanced options blank. The email is escaped for OData string
   quoting. Query only active Contact identities; read no credentials/balances.
   Two results permit rejecting an ambiguous match instead of arbitrarily taking
   the first. Never auto-create a Contact or assign roles to resolve a mismatch.

3. Condition **Boss_Clarification_Valid**, left field Expression:

   ```text
   and(
  not(empty(trim(string(outputs('Boss_Approval_ID'))))),
  not(empty(trim(string(outputs('Boss_Clarification_Question'))))),
  lessOrEquals(length(trim(string(outputs('Boss_Clarification_Question')))), 4000),
  not(empty(outputs('Boss_Clarification_Responder_Email'))),
  equals(length(body('Find_Boss_Clarification_Requester')?['value']), 1),
  equals(body('Get_Boss_Clarification_Request')?['hr_approvalstatus'], 123140000)
)
   ```

   Compare **is equal to** right-side Expression Boolean `true`.

   - **False:** Control > Terminate, Status **Failed**, Code
     `BossClarificationInvalid`, Message:
     `The question is missing or exceeds 4,000 characters, the approver does not match exactly one active Contact, the approval ID is missing, or the request is no longer pending.`
   - **True:** leave empty for create/reuse routing and current-review guards.

Save configuration; keep notification Off. These checks establish valid
inputs/actor correlation/Pending state, not eligibility for an unconditional
write. Positive matching round, unchanged owner/manager, applicable stage,
current approval and active-child state still need validation before creating
or restoring a boss question. Source-ID lookup is a snapshot, not a uniqueness
claim. No child/parent/Contact/financial changes or new approval are instructed.
Keep completed manager approval, the boss recipient and existing expense paths
intact. The three new actions are instructed only, not yet user-confirmed or
runtime-tested; future boss routing must remain within the nesting limit.

## Boss current-request gate and new/existing routing — next guided step

On 7 November 2026 the user reports Boss_Clarification_Responder_Email,
Find_Boss_Clarification_Requester and Boss_Clarification_Valid configured.
Native definitions, responder values, unique Contact match and runtime are not
inspected. Keep the notification flow Off.

Inside **Boss_Clarification_Valid > True**, add Condition
**Boss_Can_Link_Clarification**. Left field, Expression:

```text
and(
  not(empty(body('Get_Boss_Clarification_Request')?['_hr_submittedby_value'])),
  equals(
    toLower(string(body('Get_Boss_Clarification_Request')?['_hr_submittedby_value'])),
    toLower(string(triggerBody()?['_hr_submittedby_value']))
  ),
  equals(
    toLower(string(body('Get_Boss_Clarification_Request')?['_hr_assignedmanager_value'])),
    toLower(string(triggerBody()?['_hr_assignedmanager_value']))
  ),
  greater(coalesce(body('Get_Boss_Clarification_Request')?['hr_reviewround'], 1), 0),
  or(
    equals(body('Get_Boss_Clarification_Request')?['hr_workflowstage'], 123140000),
    equals(body('Get_Boss_Clarification_Request')?['hr_workflowstage'], 123140004)
  ),
  empty(body('Get_Boss_Clarification_Request')?['_hr_activeclarification_value']),
  or(
    empty(body('Get_Boss_Clarification_Request')?['hr_currentapprovalid']),
    equals(
      string(body('Get_Boss_Clarification_Request')?['hr_currentapprovalid']),
      string(outputs('Boss_Approval_ID'))
    )
  )
)
```

Compare **is equal to** right-side Expression Boolean `true`.

- **False:** Control > Terminate, Status **Cancelled**. No writes. This includes
  an already-linked waiting question, progressed review, changed employee or
  assigned manager, conflicting approval ID, invalid round or ineligible stage.
  Cancellation stops this obsolete run; it does not reject the Request.
- **True:** add Condition **Boss_Question_Is_New**. Left field, Expression:

  ```text
  length(body('Find_Boss_Clarification')?['value'])
  ```

  Compare **is equal to** right-side Expression Number `0`.
  Leave both branches empty at this checkpoint: True will create; False will
  validate/reuse the existing source-ID question before any parent write.

The earlier Boss_Clarification_Valid already checks Pending, source/question and
unique actual-responder Contact. This shared parent gate applies to both new
and orphan-existing questions, keeping recovery flatter in the deeper boss
branch. It requires unchanged employee/assigned-manager and no active question;
the initial Request stage **Not Started (123140000)** is allowed for compatibility
with the current Added-only path, whose enclosing manager Approve case leads to
the boss. **Boss Review (123140004)** is allowed for the later explicit dispatch
path. It deliberately does not accept Awaiting/Ready/Completed or Manager Review:
future manager-to-boss dispatch must enter Boss Review and hand off/clear prior
markers before invoking the boss; this guard must not clear them on its own.
The initial null round falls back to 1 consistently with earlier first-question
setup; final dispatch still needs captured, monotonic review rounds.

These are snapshot eligibility/routing conditions, not conditional writes or a
lock. Source-key insert conflict recovery, captured per-run comparisons, boss
creation/activation, resumption and reply UI remain incomplete. Check native
ancestry when completing the boss path; do not copy the manager's deeper nested
tree or add gratuitous Scopes. No new child, parent stage, question, answer,
approval, permission, schema, website setting, Contact or financial write is
instructed here. The two new conditions are instructed, not yet user-confirmed
or runtime-verified. Save configuration and keep notification Off.

## Create the boss question and activate its parent link — next guided step

On 7 November 2026 the user reports Boss_Can_Link_Clarification and
Boss_Question_Is_New configured. No updated native action definition, evaluated
guard or runtime is inspected. Inside **Boss_Question_Is_New > True**, add these
two actions sequentially, without a new Scope/For each.

### Create_Boss_Clarification

Dataverse > Add a new row, table **Request Clarifications**. Use Expression/fx
for the expressions below and select the choice labels normally:

| Field | Value |
|---|---|
| Request (Petty Cash Requests), Expression | `concat('hr_pettycashrequests(', body('Get_Boss_Clarification_Request')?['hr_pettycashrequestid'], ')')` |
| Employee (Contacts), Expression | `concat('contacts(', body('Get_Boss_Clarification_Request')?['_hr_submittedby_value'], ')')` |
| Requested By (Contacts), Expression | `concat('contacts(', first(body('Find_Boss_Clarification_Requester')?['value'])?['contactid'], ')')` |
| Question, Expression | `outputs('Boss_Clarification_Question')` |
| Approval Stage | Boss (123140001) |
| Clarification Status | Awaiting Answer (123140000) |
| Review Round, Expression | `coalesce(body('Get_Boss_Clarification_Request')?['hr_reviewround'], 1)` |
| Source Approval ID, Expression | `outputs('Boss_Approval_ID')` |

Leave Clarification Reference for its configured autonumber. Answer and Answered
On stay blank. Use first() only because the enclosing Boss_Clarification_Valid
requires exactly one active responding Contact; do not select an array token
that inserts a For each. Do not substitute the originally assigned manager or
the fixed boss GUID for the verified actual-responder match.

### Set_Boss_Awaiting_Employee

Immediately after successful Create_Boss_Clarification, in the SAME True branch,
Dataverse > Update a row, table **Petty Cash Requests**:

| Field | Value |
|---|---|
| Row ID, Expression | `body('Get_Boss_Clarification_Request')?['hr_pettycashrequestid']` |
| Workflow Stage | Awaiting Employee - Boss (123140005) |
| Current Approval ID, Expression | `outputs('Boss_Approval_ID')` |
| Review Round, Expression | `coalesce(body('Get_Boss_Clarification_Request')?['hr_reviewround'], 1)` |
| Active Clarification, Expression | `concat('hr_requestclarifications(', outputs('Create_Boss_Clarification')?['body/hr_requestclarificationid'], ')')` |

Update only those four workflow fields on the existing Request; leave other
optional inputs blank. Use normal success-only run-after, not parallel or
run-after-failure activation. Do not generate an Update Row ID with guid().
The parent round equals the child input; native returned child ID/lookup bind
still needs controlled runtime verification.

Approval Status stays Pending. This path preserves completed manager approval
and does not send the employee back to manager review, invoke financial posting
or alter Contact balances. The revised notification trigger is intended to react
only after the active awaiting parent state is saved, but remains Off while UI
and testing are incomplete. Leave Boss_Question_Is_New > False untouched until
the source-row reuse handler is added.

Save configuration only. These two writes are instructed, not reported
configured or executed. They are separate operations over prior snapshots, not
an atomic transaction. Partial child creation/parent failure must recover the
same boss source row; unique-insert conflict handling, conditional writes,
per-run round/approval claims, resume dispatch and reply UI remain incomplete.
No schema, permission, API field, website configuration, additional approval or
financial change is introduced at this step. Avoid additional nesting when
completing the boss existing-row branch.

## Boss existing-question reuse branch — next guided step

On 7 November 2026 the user reports Create_Boss_Clarification and
Set_Boss_Awaiting_Employee configured. Native updated action code, saved records,
returned child ID, parent activation and runtime have not been inspected.
The new-question branch is configured by report, not end-to-end accepted.

Inside **Boss_Question_Is_New > False**, add these actions without additional
Scopes or nested validation containers:

1. Compose **Existing_Boss_Clarification**, Inputs Expression:

   ```text
   first(body('Find_Boss_Clarification')?['value'])
   ```

2. Condition **Boss_Can_Reuse_Clarification**, left field Expression:

   ```text
and(
  equals(
    string(outputs('Existing_Boss_Clarification')?['hr_sourceapprovalid']),
    string(outputs('Boss_Approval_ID'))
  ),
  equals(
    toLower(string(outputs('Existing_Boss_Clarification')?['_hr_request_value'])),
    toLower(string(body('Get_Boss_Clarification_Request')?['hr_pettycashrequestid']))
  ),
  equals(
    toLower(string(outputs('Existing_Boss_Clarification')?['_hr_employee_value'])),
    toLower(string(body('Get_Boss_Clarification_Request')?['_hr_submittedby_value']))
  ),
  equals(
    toLower(string(outputs('Existing_Boss_Clarification')?['_hr_requestedby_value'])),
    toLower(string(first(body('Find_Boss_Clarification_Requester')?['value'])?['contactid']))
  ),
  equals(outputs('Existing_Boss_Clarification')?['hr_approvalstage'], 123140001),
  equals(outputs('Existing_Boss_Clarification')?['hr_clarificationstatus'], 123140000),
  empty(trim(string(outputs('Existing_Boss_Clarification')?['hr_answer']))),
  empty(outputs('Existing_Boss_Clarification')?['hr_answeredon']),
  equals(
    trim(string(outputs('Existing_Boss_Clarification')?['hr_question'])),
    trim(string(outputs('Boss_Clarification_Question')))
  ),
  greater(coalesce(outputs('Existing_Boss_Clarification')?['hr_reviewround'], 0), 0),
  equals(
    outputs('Existing_Boss_Clarification')?['hr_reviewround'],
    coalesce(body('Get_Boss_Clarification_Request')?['hr_reviewround'], 1)
  )
)
   ```

   Compare **is equal to** right-side Expression Boolean `true`.

   **False:** Control > Terminate, Status **Cancelled**, no writes. Closed,
   answered, cancelled, mismatching or inconsistent child snapshots are not
   reopened. A cancellation of this old run does not reject the Request.

   **True:** add the following parent update.

3. Dataverse > Update a row, name **Restore_Boss_Question_Link**, table
   **Petty Cash Requests**, only these workflow fields:

| Field | Value |
|---|---|
| Row ID, Expression | `body('Get_Boss_Clarification_Request')?['hr_pettycashrequestid']` |
| Workflow Stage | Awaiting Employee - Boss (123140005) |
| Current Approval ID, Expression | `outputs('Boss_Approval_ID')` |
| Review Round, Expression | `outputs('Existing_Boss_Clarification')?['hr_reviewround']` |
| Active Clarification, Expression | `concat('hr_requestclarifications(', outputs('Existing_Boss_Clarification')?['hr_requestclarificationid'], ')')` |

Leave other optional inputs blank. Use ordinary success-only run-after inside
True, no generated Update GUID and no array token/For each. This reconnects the
original child and its positive matching round, preserves the question/answer/
requester and completed manager decision, and keeps Approval Status Pending.
No new child, approval, financial write or employee/Contact change is made.

The earlier shared Boss_Clarification_Valid and Boss_Can_Link_Clarification guard
Pending/actor/input/unchanged owner-manager/current-stage/empty active marker/
source compatibility before either routing branch. This combined child check
avoids copying the manager's deeper tree into the boss branch. It also verifies
Requested By against the unique actual-responder Contact selected for this
boss response. The reference first() is inside the earlier unique-match True
path; it is not an arbitrary choice among multiple Contacts.

Save configuration only; keep notification Off. The three new actions are
instructed, not yet user-confirmed configured/executed. This finishes only the
instructed existing-row designer branch. Snapshots may become stale before an
ordinary parent Update; conditional writes and captured per-run review claims
remain incomplete. The lookup branch does not catch an insert-time unique-key
conflict after a zero-row lookup. Full boss/main resumption, reply UI, runtime
permissions/caller mapping and concurrent/partial-write tests are still pending.
No schema, site/API/permission setting, email or financial change is introduced.
Verify native nesting/save before adding further containers to this boss path.

## Boss reuse reported configured; inspect the current flow before resume wiring

On 7 November 2026 the user reports Existing_Boss_Clarification,
Boss_Can_Reuse_Clarification and Restore_Boss_Question_Link configured.
The guided manager/boss question creation and existing-source reuse branches
are now configured by user report. No updated native full definition, runtime,
partial-failure/concurrency results or deployment acceptance has been inspected.
This is not a completed automated clarification feature.

Next connect Ready-stage resumption. The intended routing is:

| Request state | Intended next review |
|---|---|
| Initial eligible request | Manager |
| Ready for Manager (123140003) | New manager approval round |
| Ready for Boss (123140006) | New boss approval round, preserving completed manager decision |
| Awaiting employee, review already active, Completed or non-Pending | Do not start a duplicate review |

The user-confirmed answer flow currently queues Ready for Manager/Boss, but the
last inspected main trigger was Added only. That trigger cannot respond to an
existing Request's Ready-stage update. Routing is a new approval instance,
not reopening the completed approval. Initial routing still needs the real
request-completeness gate: a Request header is created before its lines/receipt.

A local file search on 7 November 2026 found only the historical supplied
manager Switch JSON snapshot, no updated native flow export or current Switch
JSON. Before giving instructions to move/reuse approval/financial containers,
obtain these current Code view blocks from the SAME main approval flow:

1. The **outer manager outcome Switch**, including every nested manager/boss
   case, action, dependency and newly added clarification branch. Save its full
   JSON into a project file named **flows/approval/approval-flow-current.json**.
2. The main **When a row is added, modified or deleted** trigger. Save its Code
   view JSON into **flows/approval/approval-trigger-current.json** in the project folder.

In the new designer, select the action/trigger, then Code view and copy the
entire block. These are inspection copies; do not edit native Code view or run
a flow to obtain them. Plain text JSON files are sufficient; no screenshots,
passwords, tokens or signed HTTP URLs are requested. If supplied blocks contain
credentials/signed URLs, redact those values while preserving action names and
references needed for review.

Use the supplied current structure to prepare a concrete, bounded dispatch
change: preserve completed manager approval for boss resume, capture and advance
review rounds, mark durable clarification handoff as Processed, attach question/
answer context to the fresh approval, reject obsolete events and avoid ordinary
updates starting approvals. Do not infer this restructure from labels or copy
the historical Switch over the user's newer branches.

No trigger replacement, branch move, new resume flow or frontend enablement is
instructed at this checkpoint. Keep notification Off pending reply UI and
controlled tests. Conditional answer/parent writes, source-key conflict recovery,
per-run dispatch claims and the documented financial stale-read/write-order
findings remain unresolved and must be addressed before production acceptance.
The current Code view request is missing implementation evidence, not an
additional permission/approval gate.

## Current supplied Switch and trigger reviewed — 7 November 2026

The requested files are supplied and parsed: [current Switch](approval-flow-current.json)
and [current trigger](approval-trigger-current.json). The earlier evidence request
is satisfied. Originals are preserved unchanged. Source hashes and findings are in
the [static review report](snapshots/approval-current-review.2026-11-07.json).

Inspection found **61 actions**, no duplicate action names or unresolved local
sibling runAfter dependencies, and maximum action depth **8** with the supplied
Switch at the workflow root. This is not a full flow export or runtime audit;
external prefix actions are not included. Actual boss outcome/reuse names are
**Switch_1** and **Condition_3**; renaming those to guide labels is unnecessary.

### Two functional corrections before resumption

1. In the boss Need Clarification path, **Boss_Question_Is_New > True**, the
   Update a row immediately after Create_Boss_Clarification is internally named
   **Update_a_row**. Its workflow stage is **123140002 (Awaiting Employee -
   Manager)**. Change it to **Awaiting Employee - Boss (123140005)**.
   The Boss child stage and Restore_Boss_Question_Link stage are already correct.
   The wrong new-question parent stage conflicts with both notification and
   answer flow's Boss-stage/current-parent guards.
2. **Start and wait for an approval - boss > Assigned to** still uses:

   ```text
   outputs('Get_a_row_by_ID_-_manager')?['body/emailaddress1']
   ```

   Use the intended **fixed boss work email**, as agreed. The actual address is
   not supplied or guessed. No new lookup, role, schema or credential is needed
   to retain this recipient method.

Make these edits in the native designer and save. No supplied JSON or tenant
has been edited by the assistant; native corrections/runtime are unconfirmed.
Keep notification Off until reply UI and controlled testing are ready.

### Other inspected differences and retained risks

- Manager_Can_Restore_Question > False is empty rather than guided Terminate
  Cancelled. It performs no write but may make an ineligible run look successful.
- Manager Default Terminate_2 and boss Default Terminate_2_1 use Succeeded.
  Unknown outcomes make no decision; choose explicit cancellation/failure
  instead of silently reporting success during cleanup.
- Strict >10000, three boss custom responses, direct Request cash binds, stable
  expense keys, responder lookups and question create/reuse guards are present.
- Native configured lookup bindings are hr_Request, hr_Employee, hr_RequestedBy
  on clarifications, and hr_ActiveClarification on the Request. These are
  inspected action configuration, not runtime metadata/authorization proof.
- Main trigger remains Added only: message 1, hr_pettycashrequest, scope 4,
  without supplied column/row filters or trigger conditions. It cannot dispatch
  review when an existing Request changes to a Ready stage.
- Expense existence is still queried before the boss wait. Final paths update
  status/Contact summary before the unique-key cash insert and reference the
  external employee lookup's balance. Current prefix is omitted; freshness/
  atomicity is not established. The recorded financial ordering risk remains.
- Snapshot guards and separate create/update operations still need conditional
  writes, captured per-run claims and insert-time conflict recovery.

### Prepared resumption layout constraints

Boss reuse reaches the documented eight-level action limit. A new enclosing
Condition/Scope/Switch around the current Switch would exceed that limit.
A root condition around **only** the external manager Start and wait action can
skip that approval on a validated Ready for Boss entry without deepening the
boss branch. The existing outer routing then needs a stage-aware path into its
Approve/boss processing; a skipped manager approval is not a new manager
decision. Capture entry stage before updating workflow state.

Before enabling this layout, validate trusted initial submission completeness
and Ready handoff; capture/claim monotonic rounds conditionally; preserve the
completed manager decision; persist Processed handoff; transition to Manager
Review/Boss Review and hand off old markers; include saved question/answer in
the fresh approval; reject stale events. Initial Request creation precedes
line/receipt completion, so one line alone is not a readiness gate.

This is a reviewed target layout, not an import-ready flow or completed native
change. No trigger replacement, branch move, new resume flow, approval or
financial operation is instructed/performed here. First confirm the two
functional corrections above. Native caller/permissions, concurrent and
partial-write behavior, reply UI and full resumption acceptance remain pending.

## Functional corrections reported; prepare root review entry — next guided step

On 7 November 2026 the user reports the two native corrections done: new boss
question parent now uses Awaiting Employee - Boss 123140005, and boss Assigned
to uses the intended boss email. No refreshed native action code/run is inspected.
The original supplied current JSON remains unchanged locally (Manager waiting
123140002 and manager lookup recipient), so it and the static review report
remain evidence of the received version. Do not overwrite that evidence or
mistake it for the user's latest tenant configuration.

Next prepare entry routing in the SAME main approval flow. Keep its trigger
**Added only** until routing/claims/handoff are complete. Immediately below the
trigger, before the existing Get a row by ID - manager, add:

1. Dataverse > Get a row by ID, name **Get_Review_Request**.
   Table **Petty Cash Requests**, Row ID through Expression:

   ```text
   triggerBody()?['hr_pettycashrequestid']
   ```

   Select columns:

   ```text
   hr_pettycashrequestid,hr_approvalstatus,hr_workflowstage,hr_reviewround,hr_currentapprovalid,_hr_activeclarification_value,_hr_submittedby_value,_hr_assignedmanager_value,hr_totalamount
   ```

   Leave other advanced options blank. Its output is the captured current
   Request snapshot for this run; later native updates do not mutate this
   earlier action output. No separate stage-only Compose is necessary.

2. Condition **Review_Entry_Allowed**, immediately after Get_Review_Request.
   Left field through Expression:

   ```text
and(
  equals(body('Get_Review_Request')?['hr_approvalstatus'], 123140000),
  or(
    equals(body('Get_Review_Request')?['hr_workflowstage'], 123140000),
    equals(body('Get_Review_Request')?['hr_workflowstage'], 123140003),
    equals(body('Get_Review_Request')?['hr_workflowstage'], 123140006)
  )
)
   ```

   Compare **is equal to** right-side Expression Boolean `true`.

   - **False:** Control > Terminate, Status **Cancelled**.
   - **True:** empty at this checkpoint.

Continue the EXISTING manager lookup/preparation/approval/outcome actions below
the WHOLE condition at the main workflow level, using normal success-only
dependencies. Do not move them into True. A False Terminate stops the run;
True completes and the following main-level action continues. This avoids a
new wrapper around the depth-8 boss branch. Exact intended sequence:
Trigger -> Get_Review_Request -> Review_Entry_Allowed -> existing manager lookup
-> remaining existing preparation -> manager approval -> outer Switch.

This allows only Pending + initial Not Started, Ready for Manager or Ready for
Boss at the entry snapshot. Unknown/null workflow stages, active reviews,
awaiting stages and completed decisions stop. It is only preliminary eligibility:
it neither validates an answered active child nor authorizes an unconditional
resume. Request completeness, trigger/current-stage correspondence, captured
round/source/owner checks, conditional per-request claim, Processed handoff and
selective manager skipping are still pending. Do not enable Modified triggering
yet: existing approval routing would still send a Ready for Boss entry through
the manager until it is reworked. Keep notification Off pending UI/tests.

The two new actions/False termination are instructed, not reported configured
or executed. They read/gate only; no schema/site/API/permission, child/parent,
approval or financial update is introduced by this setup step. This does not
resolve the separately documented snapshot or financial ordering risks.

## Review entry reported configured; validate the answered child — next guided step

On 7 November 2026 the user reports Get_Review_Request and Review_Entry_Allowed
configured at main level. Updated native prefix, placement/dependencies, action
outputs and runtime are uninspected. Existing supplied JSON/report remain the
older fragment, without this prefix.

Keep the main trigger Added only and notification Off. Between the WHOLE
Review_Entry_Allowed condition and existing manager lookup, add at **main level**:

1. Condition **Review_Is_Resume**, left field Expression:

   ```text
   or(
     equals(body('Get_Review_Request')?['hr_workflowstage'], 123140003),
     equals(body('Get_Review_Request')?['hr_workflowstage'], 123140006)
   )
   ```

   Compare is equal to Expression Boolean `true`. False stays empty for the
   initial Not Started path; the preceding entry guard has already excluded
   other workflow states. True contains the following read and validation.

2. Inside **Review_Is_Resume > True**, Dataverse Get a row by ID named
   **Get_Resume_Clarification**, table **Request Clarifications**.
   Row ID via Expression:

   ```text
   body('Get_Review_Request')?['_hr_activeclarification_value']
   ```

   Select columns:

   ```text
   hr_requestclarificationid,_hr_request_value,_hr_employee_value,hr_question,hr_answer,hr_answeredon,hr_approvalstage,hr_clarificationstatus,hr_reviewround,hr_sourceapprovalid
   ```

   Leave other advanced options blank. A missing/invalid active lookup must
   fail this read and stop the success-only continuation; do not substitute
   another question or use guid() to fill it.

3. Immediately after the Get, still in True, Condition **Resume_Is_Current**.
   Left field Expression:

   ```text
and(
  equals(body('Get_Resume_Clarification')?['hr_clarificationstatus'], 123140001),
  not(empty(trim(string(body('Get_Resume_Clarification')?['hr_answer'])))),
  not(empty(body('Get_Resume_Clarification')?['hr_answeredon'])),
  not(empty(body('Get_Review_Request')?['_hr_submittedby_value'])),
  equals(
    toLower(string(body('Get_Resume_Clarification')?['_hr_request_value'])),
    toLower(string(body('Get_Review_Request')?['hr_pettycashrequestid']))
  ),
  equals(
    toLower(string(body('Get_Resume_Clarification')?['_hr_employee_value'])),
    toLower(string(body('Get_Review_Request')?['_hr_submittedby_value']))
  ),
  greater(coalesce(body('Get_Resume_Clarification')?['hr_reviewround'], 0), 0),
  equals(
    body('Get_Resume_Clarification')?['hr_reviewround'],
    body('Get_Review_Request')?['hr_reviewround']
  ),
  not(empty(trim(string(body('Get_Resume_Clarification')?['hr_sourceapprovalid'])))),
  equals(
    string(body('Get_Resume_Clarification')?['hr_sourceapprovalid']),
    string(body('Get_Review_Request')?['hr_currentapprovalid'])
  ),
  or(
    and(
      equals(body('Get_Resume_Clarification')?['hr_approvalstage'], 123140000),
      equals(body('Get_Review_Request')?['hr_workflowstage'], 123140003)
    ),
    and(
      equals(body('Get_Resume_Clarification')?['hr_approvalstage'], 123140001),
      equals(body('Get_Review_Request')?['hr_workflowstage'], 123140006)
    )
  )
)
   ```

   Compare is equal to Expression Boolean `true`.
   - False: Control > Terminate, Status **Cancelled**, no writes.
   - True: empty pending protected handoff/dispatch setup.

Continue existing manager/preparation actions AFTER the WHOLE Review_Is_Resume
condition at main level, using success-only dependencies. Do not put the old
outer Switch or approval tree inside its True branch. New nested actions are
limited to this separate root-level validation condition, leaving the existing
boss depth unchanged. A nested Terminate stops the entire run; a failed Get/
validation action must not continue to manager preparation.

The captured parent snapshot is already Pending by Review_Entry_Allowed. Child
must be Answered with nonempty answer/date, match Request/employee/source and a
positive identical round, and pair Manager with Ready for Manager or Boss with
Ready for Boss. Processed/Cancelled/Awaiting children are not new dispatch
candidates. Reading source ID here is trusted backend access; no portal API
field/permission is added.

This is correlation and input-state validation, not an atomic dispatch claim.
Snapshots may change afterward. Do not mark Processed, clear active/source
markers or update workflow stage yet. Conditional parent/answer writes,
captured per-run ownership, initial submission completeness, manager skipping,
question/answer approval context and finalization ordering remain unfinished.
No update, approval, email, schema/site setting or financial action is introduced
in this step. The new actions are instructed, not reported configured/runtime-
verified. Save only; keep Modified triggering and notification disabled.

## Saved-answer validation reported; selective approval routing — next guided step

On 7 November 2026 the user reports Review_Is_Resume, Get_Resume_Clarification
and Resume_Is_Current configured. The current native prefix, nesting, output
values, validation and run results have not been inspected. Keep the trigger
Added only and notification Off while preparing the coordinated routing edits.

Do the following together, then save. All existing preparation remains in its
current main-level sequence; the outer outcome Switch remains at main level.

1. Immediately before the existing manager Start and wait action (after the
   existing preceding Compose), add main-level Condition **Run_Manager_Review**.
   Left field through Expression:

   ```text
   not(equals(body('Get_Review_Request')?['hr_workflowstage'], 123140006))
   ```

   Compare is equal to Expression Boolean `true`.

   Move the EXISTING **Start and wait for an approval - manager** into True,
   preserving its action name `Start_and_wait_for_an_approval_-_manager`,
   recipient, details, receipt, response options and other settings. Use the
   designer's action drag/drop. False stays empty. Do not duplicate/create a
   second approval or move the outer Switch into this condition. The moved
   manager action starts as the first action of its True branch; it must not
   retain a cross-scope runAfter reference to the former outside Compose.

2. In the EXISTING **outer manager-outcome Switch**, replace only **On** with
   Expression:

   ```text
   if(
  equals(body('Get_Review_Request')?['hr_workflowstage'], 123140006),
  'Approve',
  outputs('Start_and_wait_for_an_approval_-_manager')?['body/outcome']
)
   ```

   Preserve all existing cases and their actions. A validated Ready for Boss
   entry uses the existing Approve processing as an internal routing label;
   no new manager response is generated and no Request approval status is
   changed by this expression. Initial/Ready for Manager entries use the actual
   manager response as before.

3. Configure that outer Switch's **Run after** to **Run_Manager_Review ->
   is successful only**. Remove the former direct runAfter link to the manager
   approval, now nested. It must be a sibling dependency on the main-level
   condition, not a cross-scope dependency on its child.

   Expected resulting Switch Code view dependency, reference only:

   ```json
   "runAfter": {
     "Run_Manager_Review": ["Succeeded"]
   }
   ```

   On the boss route the empty False branch completes successfully, allowing
   the Switch to continue. A failed/timed-out manager approval must not run
   outcome/finalization handling as though it succeeded.

4. In the EXISTING **Condition - 10k** inside the outer Approve case, preserve
   both branches but replace its comparison row with left-side Expression:

   ```text
   or(
  equals(body('Get_Review_Request')?['hr_workflowstage'], 123140006),
  greater(coalesce(body('Get_Review_Request')?['hr_totalamount'], 0), 10000)
)
   ```

   Compare is equal to Expression Boolean `true`. True keeps the existing
   boss approval and Switch_1; False keeps manager-only finalization. A boss
   resume must always go back to the boss, and must never fall into the
   manager-only path that references a skipped manager response. Other entries
   retain the strict >10000 threshold, now using the captured current Request
   total instead of assuming the event payload contains a fresh total.

Expected main-level tail:
existing preparation -> Run_Manager_Review (True: existing manager approval;
False: empty) -> existing outer Switch.
No new enclosing container is added around the outer Switch; its boss branch
depth remains unchanged. Native save/Code view still needs verification after
the move. If action names change, repair references using their actual names
rather than inventing suffixes; do not delete the working outcome tree.

Local validation of the proposed decision table covered 27 combinations:
initial/manager Ready/boss Ready, amounts 9999.99/10000/10000.01 and the three
manager responses. The local model preserved the strict boundary and always
returned boss Ready to boss without manager approval. This is not a native
expression execution, flow-save validation, live approval or concurrency test.

These are instructed native routing edits, not user-confirmed implementation
or runtime acceptance. They do not complete resume: before Modified triggering
is enabled, finish protected round/claim and Processed handoff, transition to
Manager Review/Boss Review and clear prior markers only after durable handoff.
Currently the clarification guards reject a new question while parent remains
Ready with its old active child; this routing alone intentionally does not
bypass them. Add saved question/answer context to fresh approvals and verify
initial submission completeness, native caller/permissions and final expense
ordering/freshness. No schema, portal/API permission, financial or frontend
change is introduced here; supplied snapshot files remain unchanged.

## Routing reported configured; conditional handoff preparation

On 7 November 2026 the user reports the coordinated Run_Manager_Review move,
outer Switch On/runAfter and existing 10k edits done. Native updated placement,
save and runtime have not been inspected. Keep Added-only trigger and
notification Off until protected handoff and reply UI/testing are complete.

The user supplies the Dataverse Web API address. An anonymous WhoAmI GET
returns 401 with its api-host root as advertised resource_id, confirming the
authentication resource only; no credentials or identity/business data were
sent/returned. A signed-in connector and optimistic-concurrency settings remain
unverified. The next read-only manual connection check, exact resource/base URL
and conditional parent/child handoff contract are documented in
[REVIEW_HANDOFF_PLAN.md](REVIEW_HANDOFF_PLAN.md).

No unconditional status/Processed/marker updates are instructed at this point.
The connection check is a temporary/manual backend diagnostic, not a portal
flow or an additional public endpoint. Actual native creation/run and later
conditional update instructions are still pending.

## Required work before completing clarification/resumption

- Correct the new boss question's parent waiting stage and intended boss
  recipient in the supplied current code; verify saved values/runtime.
- Verify the configured question/source/actor guards and child/parent bindings
  live. Approval-ID token references are inspected; completed runtime values
  and end-to-end handoff still need validation.
- Track the actual responder when reassignment is allowed, or explicitly decide
  to restrict reassignment. Requested By/Recorded By must not silently claim
  the intended manager acted when someone else responded.
- Replace Added-only dispatch with controlled initial/Ready-stage handling, with
  an actual request-completeness gate. The browser creates the Request before
  saving all lines and uploading its receipt. One returned line is not readiness.
- Make final expense dedupe fresh at posting time: the current cached List rows
  result can be obsolete after the boss wait. The active unique cash key limits
  duplicate row creation, but is not an atomic claim over other preceding writes.
- Fix financial partial-failure/concurrency ordering. A duplicate cash-row insert
  can fail after an earlier Contact deduction. The pre-wait Contact balance can
  also be stale after Finance movements/other approved expenses. Reconstruct a
  summary from the authoritative ledger through a consistent writer or another
  supported serialized/atomic design. Do not just add more snapshot conditions
  or treat moving the lookup as full concurrency protection.
- Complete supported conditional writes for answer/handoff. The synchronous
  answer flow cannot use trigger concurrency; current read-and-Update actions
  do not atomically prevent two different replies or a stale workflow update.
- Implement My Requests reply UI, confirm platform caller mapping, and test both
  approvers, repeated rounds, stale/replayed decisions, simultaneous saves,
  partial writes, correct threshold routing and exactly one final expense.

The ledger remains authoritative for website balances. No financial adjustment
or contact correction has been made as part of this static review. The findings
above qualify the older user report that duplicate protection was completed;
that report was not an inspected atomic-posting guarantee.

## References

- [Custom response configuration and routing](https://learn.microsoft.com/en-us/power-automate/create-approval-response-options)
- [Standard approvals connector dynamic outputs](https://learn.microsoft.com/en-us/connectors/approvals/)
- [Dataverse List rows](https://learn.microsoft.com/en-us/power-automate/dataverse/list-rows)
- [Lookup filtering](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/query/filter-rows)
- [Create rows and set lookup fields](https://learn.microsoft.com/en-us/power-automate/dataverse/create)
- [Update rows and lookup fields](https://learn.microsoft.com/en-us/power-automate/dataverse/update)

