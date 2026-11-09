# Review handoff plan

## Current blocker - 10k condition compares a Boolean numerically

After automatic manager resumption user reports Condition_-_10k failing with
greater expecting numbers but receiving Boolean. Exact current condition JSON
has not been supplied. A likely designer configuration is the full Boolean
routing expression placed under an outer 'is greater than' comparison. Do not
claim this exact nesting is inspected; runtime only proves a Boolean operand.

Correct the EXISTING Condition - 10k to one row. Left Expression (without @):

```text
or(
  equals(body('Get_Review_Request')?['hr_workflowstage'], 123140006),
  greater(coalesce(body('Get_Review_Request')?['hr_totalamount'], 0), 10000)
)
```

Operator **is equal to**. Right **Expression** `true` (Boolean, not quoted text).
Remove obsolete comparison rows. Preserve True/False actions. This retains boss
resumption for captured Ready for Boss and strict amount >10000 for other entry
stages. Do not compare the outer or()/greater() result numerically, use >=10000,
or replace the captured Get_Review_Request with the subsequently mutated stage.
Expected code shape is equals [@or(...greater(number,10000)), @true], possibly
inside a designer-generated and/or array. Request current condition-only Code
view after saving to verify actual configuration. Do not edit Code view itself.

No numeric cast is needed to correct Boolean-vs-number designer nesting. If the
error persists, inspect exact condition and Get_Review_Request amount before any
further change. Do not blindly resubmit the failed run: resubmission restarts
from entry and the Request may already be Manager Review/old child Processed.
Recovery/test event should be chosen after current condition/state inspection.
No native fix or final posting success is claimed from these instructions.

Reference: [Workflow expression comparison functions](https://learn.microsoft.com/en-us/azure/logic-apps/expression-functions-reference#greater).

## Current status - automatic manager resumption confirmed by user

9 November user confirms answering the new clarification now automatically sends
the next approval email, following the instructed retest without manual updates.
Manager clarification -> employee answer -> new manager review is therefore
user-reported working end to end. No new run export has been independently
inspected. The earlier missing-event root cause is unknown; do not credit the
temporary test flow with a demonstrated permanent repair.

Next finish final approval on the current test Request (boss also if amount is
strictly greater than PKR 10,000). Confirm final Approved/Completed, one linked
Expense Approved transaction and one correct ledger deduction for this Request.
Do not infer these financial results from email delivery alone. Boss clarification
and rejection acceptance, native cross-user security/concurrent reply checks and
diagnostic cleanup remain separate checks. Do not reset/replay the Request.

The diagnostic checkpoints below are history, not further required checks for
the now user-confirmed automatic manager resumption path.

## Latest result - controlled update resumes manager approval by user report

User reports manually running the explicit same-value stage Update, after which
both Dataverse-triggered flows ran and a new approval email included clarification
question and answer. This establishes user-reported delivery/resumption for that
controlled event. It does not identify why the original answer update produced no
run, or verify automatic answer-to-review resumption without manual intervention.
No new native run JSON/export has been supplied.

Next end-to-end check uses the CURRENT new manager approval for the same test
Request: select Need Clarification again and provide a short question; employee
refreshes My Requests and submits an answer to that NEW question once. Do not
replay the old answered child or run either manual diagnostic. Expect a fresh
main flow run and manager approval email containing the new question/answer.
Pending status and no Expense Approved transaction should remain during this
additional clarification round. Final approval/cash acceptance remains separate.

Turn off temporary automated Trigger Test after recording its result; stop using
the manual Connection Check's Update action (turn off its temporary flow or
remove that test Update action). Keep main, notification and answer business
flows On. Cleanup is instructed, not user-confirmed. If the new question does
not appear or answer does not resume automatically, report that precise step and
run status without forcing Ready again. No root cause/fix completion is claimed.

## Latest checkpoint - test flow created by report; one controlled stage update

User replies Done to temporary Trigger Test setup. Creation/On status is user
reported, not an inspected export. No test run or event has yet been supplied.

Before the test, inspect affected Request b73e9530-92db-f111-84ea-70a8a52176fd:
Approval Status must still be Pending and Workflow Stage Ready for Manager,
with no newer main approval run already reviewing it. If any prerequisite differs,
stop and report it; do not reset a review or processed/final request.

In the EXISTING temporary manually triggered Dataverse Connection Check flow,
add Microsoft Dataverse Update a row after its read action, same environment /
connection. Table Petty Cash Requests, Row ID the affected Request above, set
ONLY Workflow Stage = Ready for Manager (123140003). Leave other fields unset.
Save and manually run ONCE. This explicitly includes the watched column even
though its value is unchanged; Dataverse can evaluate update triggers on such
requests. It may legitimately resume MAIN manager review if that trigger works.
Do not use portal answer retry (the already-queued retry branch may emit no update)
or a native UI Save of an unchanged value (may not send the column).

If Update a row succeeds, inspect both Trigger Test and MAIN All runs for this
event, allowing a short asynchronous delay. Send whether each has a new run,
its status, and test Compose's SdkMessage / hr_workflowstage / hr_approvalstatus
if available. If Update fails, send exact error and stop. No repeated update,
stage toggling, new request or test-flow business actions. Compare results before
further trigger repair; turning off temporary diagnostic flows is cleanup once
their evidence is captured, not proof the underlying issue is resolved.

## Latest result - trigger conditions empty; isolate update delivery

User confirms MAIN trigger Settings / Trigger conditions is Empty. This agrees
with the earlier supplied code; no additional trigger expression is identified.
Stored registrations match, Administration mode is disabled by user report,
connections green, and the filtered expander-job view is empty. Cause unresolved.

Next create a TEMPORARY automated diagnostic named Petty Cash - Trigger Test in
the same environment, using the main trigger's Dataverse connection:

- Trigger: Microsoft Dataverse When a row is added, modified or deleted.
- Change type Modified; table Petty Cash Requests; scope Organization.
- Select columns empty (all updates for the one filtered Request).
- Filter rows: hr_pettycashrequestid eq b73e9530-92db-f111-84ea-70a8a52176fd
- Trigger conditions and Delay until empty, remaining settings default.
- Only action: Compose with expression triggerBody(). No writes, approvals,
  email, child-flow invocation or cash actions. Do not attach to Power Pages.

Save and ensure On, then report ready or exact creation error. No new event or
Request edit is instructed in this setup step. This diagnostic's registration
is new but it is not a permanent business/resumption flow. Existence/run/output
are not yet confirmed. A subsequent controlled update will need the current
Request state and absence of an in-progress approval checked first. If the test
runs while main does not on the same matching update, investigation narrows to
main-specific registration/filter/runtime differences; if neither runs, investigate
shared delivery/connection/environment before changing business flow logic.

Reference: [Dataverse update trigger and filter semantics](https://learn.microsoft.com/en-us/power-automate/dataverse/create-update-delete-trigger).

## Latest result - administration mode disabled; inspect trigger conditions

User reports Administration mode disabled. The admin-mode/background-disabled
combination is therefore not supported as the current cause. No environment
setting change is instructed. Next inspect MAIN approval trigger -> Settings ->
Trigger conditions, distinct from Dataverse Filter rows. Send exact expressions
or report Empty; do not remove them yet. Earlier supplied trigger code showed
no conditions block, so this is a direct current-designer confirmation, not an
identified defect. Microsoft documents that unmet trigger conditions can prevent
a run and its run-history entry. Root cause/resumption remain unresolved.

Reference: [Trigger conditions](https://learn.microsoft.com/en-us/power-automate/customize-triggers).

## Latest result - expander job filter empty; inspect environment settings

User selected the available CallbackRegistration Expander Operation job-type
option and reports no rows. This is an expander-job search result, not proof
that all callback delivery jobs are absent, and retained-job visibility alone
does not establish a broken service or root cause. No jobs were modified.

Next read Power Platform admin center -> Manage -> Environments -> this
environment -> Details -> Edit. Report Administration mode Enabled/Disabled
and Background operations setting if shown (retain its exact label/value).
Do not change/save environment settings yet; if Edit is inaccessible, report
that rather than seeking a new role or attempting the earlier Entra detour.
Microsoft documents that administration mode with background operations disabled
prevents Dataverse-triggered flows from firing. Current environment values have
not been supplied; this is a diagnostic possibility, not a confirmed cause.

Reference: [Administration mode and background operations](https://learn.microsoft.com/en-us/power-platform/admin/admin-mode).

## Latest screenshot - name search shows cleanup jobs only

9 November user reports no jobs near submission/run time. Supplied screenshot
shows top-right text search 'callback' and two Bulk Delete rows named Callback
Registration Soft Delete Bulk Delete Job. These are cleanup jobs; the screenshot
does not establish an actual Callback Registration job-type filter or absence
of event-delivery jobs. Do not conclude the asynchronous service is broken.

Next clear the top-right text search with X. Keep All System Jobs, open Edit
filters and use System Job Type (Type) = Callback Registration if that option is
available. Include all statuses and inspect the previous answer/stage-edit date
and time; no new event is needed. If the type option is unavailable, report the
available options instead of selecting Bulk Delete. Send relevant Status Reason
and error, or report an empty result AFTER clearing the name search and applying
the type filter. No jobs, records, registrations or flow settings are mutated.

## Latest result - stored registrations match; inspect System Jobs

9 November user supplies List rows output, preserved in
documentation/flow-snapshots/callback-registrations.received-2026-11-09.json.
Two returned registrations match the intended configurations: notification
Modified + waiting stages, and main Added or Modified + Not Started/Ready stages.
Both are Organization scoped and watch hr_workflowstage. Main registration ID
is 77467b8e-81d3-f111-a05d-70a8a52176fd. No configuration mismatch is shown in
these fields. This does not prove event delivery, valid callback credentials or
successful execution. No internal SoftDeleteStatus meaning is inferred.

Next read Power Platform admin center -> same environment -> Settings ->
System Jobs. Choose an All jobs view, filter Type to Callback Registration and
inspect jobs around the answer/manual stage-edit times, including Waiting,
Failed and Succeeded. Match the main registration ID above if it appears in
job details/name. Open the relevant job and report Status Reason and error
message; if none is visible or access is unavailable, report that instead.
Do not retry/delete jobs or submit/edit the Request again for this inspection.
Successful jobs may be cleaned up; no visible job is not conclusive proof that
Dataverse never attempted delivery. Root cause and resumed review remain unverified.

Reference: [Dataverse callback system-job monitoring](https://learn.microsoft.com/en-us/power-automate/dataverse/powerautomate-callbackregistration-flow).

The earlier checkpoints below are chronological diagnostic history.

## Current next diagnostic - read stored callback registrations

User supplies successful Queue input on 9 November: UpdateOnlyRecord on
hr_pettycashrequests / b73e9530-92db-f111-84ea-70a8a52176fd with
item/hr_workflowstage 123140003. The watched attribute is explicitly submitted;
the earlier missing-input possibility is resolved by this supplied evidence.
The user reports both Dataverse and Approvals connections show green status.
The main trigger/filter and queued output also match; root cause of missing
update delivery remains unknown. No connection change is justified by green
status alone, and green status does not inspect the active callback records.

Next read Microsoft's EXISTING Callback Registrations table using the standard
Dataverse connector, in the SAME environment and with the SAME Dataverse
connection as the main flow. Reuse the temporary Petty Cash - Dataverse Connection
Check manual flow if it exists; otherwise a temporary Instant cloud flow with
Manually trigger a flow may be used. This diagnostic is not an approval/resume
flow and is not attached to the portal. Replace the unconnected HTTP action if
that earlier draft still contains it; no HTTP/Entra consent is involved.

Add ONLY Microsoft Dataverse List rows named **Read_Request_Registrations**:

| Field | Value |
|---|---|
| Table | Callback Registrations; Enter custom value callbackregistrations if absent from dropdown |
| Filter rows | entityname eq 'hr_pettycashrequest' |
| Row count | 100 |
| Select columns | callbackregistrationid,name,entityname,message,sdkmessagename,scope,filteringattributes,filterexpression,postponeuntil,softdeletestatus,createdon,modifiedon |

Keep paging defaults. Save and run this MANUAL diagnostic once; send only the
List rows Outputs body.value array or its actual error. The selected fields are
documented readable attributes. Do not use a wildcard, include callback URLs or
add an Update/Delete action. Do not alter main trigger filters or queued state.

This directly inspects persisted message/column/filter/delay configuration and
can reveal differences from the displayed flow definition, or an actual read-
privilege error. Results must be interpreted under that connection's visibility:
empty rows do not by themselves prove no registrations exist for all owners.
SoftDeleteStatus is internal metadata; do not invent active/inactive semantics.
Creation/run/permissions/results of this diagnostic are INSTRUCTED, not verified.
No stored registration has been read or modified by the assistant.

Reference: [Callback Registration table, entity set and readable fields](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/reference/entities/callbackregistration).

## Current evidence - On with only the initial run visible

User confirms on 9 November that main flow Status is On, Flow Checker reports
no warning/error, and All runs shows only the initial successful request run.
No newer running/cancelled entry is reported. The displayed code and saved queue
values already match, but successful delivery of an update callback is unresolved.
Clean Flow Checker is not proof that registration/connection/event delivery is
healthy; no specific trigger fault has yet been identified.

Next requested read-only evidence:

- Queue_Clarification_Review -> Inputs -> raw parameters, especially entityName,
  recordId and item/hr_workflowstage. Output stage alone does not establish which
  watched column/record was actually submitted in that action's Update request.
- Status of the Dataverse connection actually used by the MAIN trigger in
  Power Automate More -> Connections. Do not switch/recreate it without evidence.

Do not repeat stage edits or answer submissions, widen filters, delete triggers
or add another flow. Registration refresh and native stage test did not repair
the issue; collect exact inputs and connection status before the next mutation.
This request is diagnostic only; no connection/flow/source/record change occurs.

References: [trigger/connection troubleshooting](https://learn.microsoft.com/en-us/troubleshoot/power-platform/power-automate/flow-run-issues/triggers-troubleshoot),
[watched columns must be included in updates](https://learn.microsoft.com/en-us/power-automate/dataverse/create-update-delete-trigger).

## Current result - fresh-stage test still produces no reported run

On 9 November the user reports no manager flow run after the native stage edits
on the existing queued Request. The earlier Off/On attempt has therefore not
established a repair. Stop further stage toggles, answer replays and filter
changes. No source, schema or additional flow change is justified by this result.

Next requested read-only evidence from the MAIN flow Details page: actual Status
and trigger/connection warning text, and Run history -> All runs for any new
Running/Waiting/Cancelled/Skipped entry after the column edit. This distinguishes
an absent trigger from an overlooked/queued/cancelled execution before touching
connections or registration again. The supplied code/queue outputs already match;
callback health/current registration, connection status and saved manual-event
details remain unverified. No root cause or fix is claimed.

Reference: [trigger warnings and skipped-run checks](https://learn.microsoft.com/en-us/troubleshoot/power-platform/power-automate/flow-run-issues/triggers-troubleshoot).

## Next diagnostic - one fresh event on the existing test Request

On 9 November the user reports completing the main-flow save/Off/On refresh.
No new trigger event/run or fix is inferred from that acknowledgement alone.
Next use only the SAME affected test Request to exercise a fresh watched-column
update after re-enabling, rather than another Request or replaying the answer.

Prerequisites immediately before editing: Request is still Pending and Ready for
Manager, with no newer main flow run or manager approval already in progress for
that Request. If its stage is already Manager Review/Boss Review/Completed or a
new run exists, leave it unchanged and report current state instead. The saved
answer and correlation markers must be retained for the existing resume guard;
do not force a cancelled/processed/stale question through validation.

In native Dataverse Petty Cash Requests, edit only Workflow Stage on this test
row in two separately completed saves:

1. Awaiting Employee - Manager (123140002); save and let the save finish.
2. Ready for Manager (123140003); save.

The first value is excluded by the main trigger's row filter; the second is
eligible and is an actual changed watched attribute, avoiding a UI save that
silently omits an unchanged value. Both values are existing choices. Preserve
Approval Status Pending, saved answer, child state, round, approval ID and active
lookup. Do not set Not Started, generate IDs or remove guards. The notification
flow may observe the intermediate Awaiting stage but its existing child-Awaiting
guard should reject an already Answered question; delivery is not assumed.

Expected after the second save: a NEW main run, normal fresh resume validation,
next manager review round and new approval containing the saved question/answer.
No final approval or cash effect is expected from this diagnostic. Stop and
report whether a run/email appears; do not repeatedly toggle/requeue it. If a
run fails, inspect its first failing/cancelling guard without rewriting state.

This is one-time recovery/diagnosis of the previously missed event, not the
normal employee reply procedure or proof that automatic resumption is fixed.
After recovery, a subsequent genuine clarification/answer round must trigger
automatically without manual edits before acceptance. No new flow/source/schema,
portal permission or financial logic is introduced; the native edits are
instructed, not performed by the assistant or yet confirmed completed.

Reference: [watched-column updates and saved-row filtering](https://learn.microsoft.com/en-us/power-automate/dataverse/create-update-delete-trigger).

## Latest diagnostic - matching trigger and queued output, 9 November

Supplied current main trigger declares message 4 (Added or Modified), scope 4
(Organization), hr_pettycashrequest and hr_workflowstage selection. Its exact row
filter matches the supplied Queue Outputs: Pending 123140000 / Ready Manager
123140003. These now-inspected fragments replace the earlier uncertainty about
current message/selection/filter and saved stage/status. They do not prove active
callback registration or the exact watched attribute in the outgoing Update.

Next instruct Save -> main flow Off -> On, then inspect Details for trigger
warnings. Keep the existing filter/column settings; do not delete/recreate a
trigger or expose tracking fields via portal API. This is a reversible,
documented troubleshooting attempt with an unconfirmed cause/outcome. Webhook
triggers process new events after re-enabling; this alone will not reprocess the
already-queued Request. No immediate repeat answer/new Request is instructed.
Plan controlled recovery of that existing queued record only after the main
flow is On; automatic resumption still requires an actual subsequent event test.

References: [message/scope choice mapping](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/reference/entities/callbackregistration),
[trigger restart troubleshooting and webhook event behavior](https://learn.microsoft.com/en-us/troubleshoot/power-platform/power-automate/flow-run-issues/triggers-troubleshoot).

## Latest diagnostic evidence - 9 November 2026

User supplies answered response for clarification
69f97072-92db-f111-84ea-70a8a52176fd and reports Queue_Clarification_Review
Succeeded. The prior accepted-vs-rejected diagnostic is resolved by the supplied
response; actual persisted Request values are still unknown and the user
reported no new main flow run. Request current native MAIN trigger Code view
and queue Outputs hr_workflowstage/hr_approvalstatus (expected 123140003 /
123140000). Do not infer a trigger cause from the OLD Added-only received local
file, replay the answer or widen filters without those current values.
No source/permission/schema/financial change is made for this diagnostic.

## Current diagnostic - missing post-answer run, 9 November 2026

Initial manager approval and question display now work by user report; answer
was submitted and its flow shows Succeeded. User confirms no new manager run
afterward. Intended sequence is child Answered / parent Ready for Manager ->
NEW run of same main flow -> parent Manager Review at next round / child
Processed -> fresh manager approval showing question/answer, while parent
Approval Status remains Pending and no expense deduction occurs yet.

Requested current evidence: Return_Clarification_Result Outputs (status,
clarificationid, message) and Queue_Clarification_Review Succeeded vs Skipped.
The common response permits a successful run returning rejected/unconfirmed;
first establish whether queueing actually occurred before changing the trigger.
No answer text, credentials, repeat request or new flow is needed for this
diagnostic. Native stage values/trigger code, response and queue status have not
yet been supplied. Preserve all source and filter guards until cause is known.

## Current native test blocker - 8 November 2026

User reports Request saved without manager flow running; Flow checker identifies
invalid filtering attribute `hr_workflowstagev`. Correct Select columns to
`hr_workflowstage` (remove the final v), preserving row filter and change type.
Save and confirm On. No source/column/flow/permission change. This correction is
instructed, not confirmed saved or successfully triggered. Earlier possible null
stage diagnosis is unverified and is not a reason to alter request payloads or
broaden workflow-stage access. Current approval-trigger-current.json is still
the older received snapshot, not proof of the failing native attribute settings.

## Current decision - simplified connector-based version, 8 November 2026

The user asks to skip the HTTP/Entra consent work and avoid further complexity.
The HTTP connection, administrator consent, manual WhoAmI diagnostic, ETag
claims and transactional batch handoff are deferred. They are not prerequisites
for the agreed first functional clarification version. Keep any unused manual
connection-check flow Off; do not remove the working approval/answer flows or
their existing conditions, ownership validation, source IDs or unique keys.

Continue with the existing Microsoft Dataverse connector and ordinary row
updates. Preserve the same intended Manager/Boss stage and review-round
transitions, saved-answer context and Processed handoff meaning below. Exact
ordinary-update ordering and partial-failure handling still need bounded native
instructions and tests; none are newly configured by this documentation edit.
Finish review resumption and the My Requests answer UI before enabling the
modified trigger/notification and testing end to end. No new connection, table
or flow is needed merely to replace the deferred HTTP approach.

This accepts a specific reliability limitation: ordinary read/check/update
actions do not prevent simultaneous runs from starting duplicate reviews or
overwriting concurrent answers. Existing unique keys prevent duplicate inserts
for their keyed values; they do not make approval dispatch or multiple row
updates atomic. Do not describe this version as race-safe or exactly-once.
Employee identity/ownership and current-request checks remain required.

The sections below preserve the earlier optional concurrency-hardening design
and connection investigation as history. Their connection/consent/conditional
write instructions are superseded as next steps by the decision above.

## Start_Review_Round - user reports configured, 8 November 2026

The user reports completing this action. Updated native code, null clearing,
save and runtime behavior have not been independently inspected.

In the existing manager/boss flow, add Dataverse **Update a row** at main level
after the existing preparation Compose and immediately before Run_Manager_Review.
Name it **Start_Review_Round**. Keep the existing conditions and outcome Switch
in place. Preparation, including the existing receipt download, must succeed
before this update; its failure must stop success-only approval continuation.
Do not wrap the existing depth-8 Switch in another container.

- Table: Petty Cash Requests.
- Row ID, Expression: `body('Get_Review_Request')?['hr_pettycashrequestid']`.
- Workflow Stage: Enter custom value, Expression:

  ```text
  if(equals(body('Get_Review_Request')?['hr_workflowstage'],123140006),123140004,123140001)
  ```

- Review Round, Expression:

  ```text
  if(equals(body('Get_Review_Request')?['hr_workflowstage'],123140000),1,add(coalesce(body('Get_Review_Request')?['hr_reviewround'],0),1))
  ```

- Current Approval ID: Expression `null`.
- Active Clarification lookup: Expression `null`.
- Leave other columns out of the update. Approval Status stays Pending; no
  balance/Contact/cash write. Explicit null clears the two old markers; blank
  inputs would be skipped by the connector.

Use the original Get_Review_Request snapshot in the existing routing expressions,
not this update's new stage: Ready for Boss still needs to bypass manager.
Get_Resume_Clarification preserves the previous question/answer for later
approval details, even though the parent lookup is cleared.

Save only, without running a submission test. Keep the trigger Added only and
notification Off. This single instructed action is not a complete handoff: next
mark the validated prior child Processed on a resume after this parent update
succeeds and before any approval dispatch. Failures between those ordinary
writes stop dispatch and may need administrator repair; automatic recovery is
not yet implemented. Manager-to-boss transition and new approval answer context
also remain unfinished. No ETag/atomic-concurrency guarantee is introduced.

Reference: [Dataverse Update a row and explicit null values](https://learn.microsoft.com/en-us/power-automate/dataverse/update).

## Complete_Clarification_Handoff - user reports configured, 8 November 2026

The user reports completing this condition and child update. Native placement,
success-only dependencies, save and runtime have not been independently inspected.

At main level, immediately after Start_Review_Round and before Run_Manager_Review,
add Condition **Complete_Clarification_Handoff**. Left field Expression:

```text
or(
  equals(body('Get_Review_Request')?['hr_workflowstage'],123140003),
  equals(body('Get_Review_Request')?['hr_workflowstage'],123140006)
)
```

Compare is equal to Expression Boolean `true`. Use the original snapshot,
because Start_Review_Round has already changed the saved stage and cleared the
parent's active-child lookup. Existing Resume_Is_Current must still validate
the child before Start_Review_Round; this condition does not replace that guard.

- True: Dataverse Update a row named **Mark_Clarification_Processed**.
  Table Request Clarifications; Row ID Expression:
  `body('Get_Review_Request')?['_hr_activeclarification_value']`.
  Set only Clarification Status to **Processed (123140002)**. Preserve Question,
  Answer, Answered On, source approval ID, review round and all lookups.
- False: empty (initial request; no previous clarification).

Run_Manager_Review must follow the whole Complete_Clarification_Handoff condition
with success-only run-after. The condition follows Start_Review_Round on success
only. Do not place the existing approval/Switch tree in True. A failed child
update must stop approval dispatch; no financial write is added.

Processed records that the answer was handed back into the new review round,
not that the next approval email was successfully delivered or the expense
approved. The previous answer remains in the captured Get_Resume_Clarification
output for approval details. This is a separate ordinary write after the parent
update, not a transaction; interrupted handoff can require administrator repair.

Save only. Keep main trigger Added only and notification Off until remaining
stage transitions, answer context, reply UI and controlled tests are ready.
Configuration is user-reported; runtime has not been tested.

## Saved answer in approvals - user reports configured, 8 November 2026

User reports the Compose and both Details edits completed. Updated native
definition, save, skipped-path evaluation and actual approval rendering remain
uninspected; this is not a runtime acceptance result.

At main level, after the whole Complete_Clarification_Handoff condition and
before Run_Manager_Review, add Data Operation Compose named
**Review_Clarification_Context**. Inputs via Expression:

```text
if(
  or(
    equals(body('Get_Review_Request')?['hr_workflowstage'],123140003),
    equals(body('Get_Review_Request')?['hr_workflowstage'],123140006)
  ),
  concat(
    'Previous clarification',
    decodeUriComponent('%0A%0A'),
    'Question: ',string(body('Get_Resume_Clarification')?['hr_question']),
    decodeUriComponent('%0A%0A'),
    'Employee answer: ',string(body('Get_Resume_Clarification')?['hr_answer'])
  ),
  ''
)
```

The captured entry stage determines whether a prior answer exists. The already
validated Get_Resume_Clarification output preserves the question/answer from
before parent-marker clearing and child processing. Initial entries produce
an empty context; no prior-child data is required on that path.

In BOTH existing manager and boss Start and wait for an approval actions, append
the **Outputs** dynamic-content token from Review_Clarification_Context at the
bottom of Details, separated from the existing content with a blank line.
Preserve current request details, receipt attachment, response options,
recipients and instruction to enter clarification questions in Comments.
The text also lets the boss see a manager-stage clarification when a resumed
manager review approves an amount requiring boss approval. It contains the
latest clarification for this resumed run, not the entire question history.

Success-only order becomes Complete_Clarification_Handoff ->
Review_Clarification_Context -> Run_Manager_Review -> existing outer Switch.
Keep the Switch's dependency on Run_Manager_Review. No extra condition wraps
the existing deep boss branch. No schema, permission, API or financial change.

Save only; keep main trigger Added only and notification Off. Configuration is
user-reported, not independently confirmed or runtime-tested. Manager-to-boss
stage transition, remaining lifecycle checks, reply UI and controlled tests
remain unfinished. Text rendering must be checked in the actual approval client.

References: [workflow expressions](https://learn.microsoft.com/en-us/azure/logic-apps/expression-functions-reference),
[approval Details formatting](https://learn.microsoft.com/en-us/power-automate/approvals-markdown-support).

## Start_Boss_Review - user reports configured, 8 November 2026

The user reports this action completed. Its current native parameters,
success-only dependency and runtime have not been independently inspected.

In the existing outer Approve case -> Condition - 10k -> True, insert Dataverse
Update a row **Start_Boss_Review** immediately before the EXISTING boss approval.
Keep the boss action and Switch_1 in place; no new condition/scope or approval
copy. The boss approval must run only after this update succeeds.

- Table: Petty Cash Requests.
- Row ID Expression: `body('Get_Review_Request')?['hr_pettycashrequestid']`.
- Workflow Stage: Boss Review (123140004).
- Review Round Expression:

  ```text
  if(
    equals(body('Get_Review_Request')?['hr_workflowstage'],123140006),
    add(coalesce(body('Get_Review_Request')?['hr_reviewround'],0),1),
    if(
      equals(body('Get_Review_Request')?['hr_workflowstage'],123140000),
      2,
      add(coalesce(body('Get_Review_Request')?['hr_reviewround'],0),2)
    )
  )
  ```

- Current Approval ID: Expression `null`.
- Active Clarification: Expression `null`.
- Leave other fields untouched; no Approval Status, Contact or cash write.

The formula uses the validated original entry snapshot, not an assumed update
response field. On an initial request manager review is round 1 and boss round
2. After a manager clarification at round r, resumed manager is r+1 and the
subsequent boss is r+2. For a boss clarification at round r, Start_Review_Round
has already set Boss Review at r+1; this action retains r+1, not r+2. Exactly
10000 remains on the manager-only path under the existing strict threshold.

This lets the existing fresh Get_Boss_Clarification_Request see Boss Review
rather than Manager Review if the boss asks a question. Existing old-round and
state validation must remain. This ordinary update is not an atomic claim and
must not bypass checks for a stale approval outcome; those lifecycle checks,
completion bookkeeping, UI and native tests remain pending. Save only with the
trigger Added only and notification Off. Configuration is user-reported, not
independently verified or runtime-tested.

Reference: [Dataverse Update a row](https://learn.microsoft.com/en-us/power-automate/dataverse/update).

## Final workflow tracking - user reports configured, 8 November 2026

User reports these field edits completed. Native parameters, save and runtime
remain uninspected. Reply UI is now prepared locally but disabled; see
CLARIFICATION_UI_SETUP.md for the corrected trigger schema and pending integration.

Edit the four EXISTING Request updates that already set final Approval Status;
do not add new updates, loops or copies. Locations and names in the received
snapshot (current display names may differ):

| Final path | Existing action reference |
|---|---|
| Manager Approve, Condition - 10k False (amount <= 10000) | Update_a_row_-_request_status_1 |
| Manager Reject | Update_a_row_1 |
| Boss Approve | Update_a_row_-_request_status |
| Boss Reject | Update_a_row_1_1 |

In each, add/set:

- Workflow Stage: Completed (123140007).
- Current Approval ID: Expression `null`.
- Active Clarification: Expression `null`.

Preserve each existing Approval Status, row ID, comments and other mapped
fields. Keep Review Round unchanged. Do not apply Completed to Need
Clarification branches or the manager-approve path awaiting a boss decision;
those paths remain Pending at their appropriate workflow stages.

This closes workflow tracking for both final approval and final rejection. It
does not mean rejected expenses are approved, and it is not evidence that an
approved expense's ledger write has succeeded. Existing approval status / Contact
summary / cash-row write order is unchanged by this bookkeeping edit; its
documented partial-write and stale-summary risks remain. No cash or balance
action is added, moved or changed here.

Save only; keep Added-only trigger and notification Off. These edits are
user-reported, not independently confirmed or runtime-tested. Remaining review-state
checks, initial readiness/resume triggering, reply activation and native tests
must be completed before enabling the clarification feature.

Reference: [Dataverse Update a row and explicit null](https://learn.microsoft.com/en-us/power-automate/dataverse/update).

## Main trigger filters - user reports configured, 8 November 2026

The user reports both advanced fields completed. Updated native trigger Code
view/save/runtime remain uninspected. Change type is still instructed Added only.

The user reports the answer flow's two existing Input_* Compose mappings done.
Native action definitions, caller and runtime delivery remain unverified. In the
EXISTING main manager/boss approval flow's Dataverse Request trigger, show its
advanced parameters and set:

- Select columns: `hr_workflowstage`.
- Filter rows, plain OData text (no $filter= prefix):

  ```text
  hr_approvalstatus eq 123140000 and (hr_workflowstage eq 123140000 or hr_workflowstage eq 123140003 or hr_workflowstage eq 123140006)
  ```

Keep table Petty Cash Requests, Organization scope and Change type **Added only**
for this staged edit. Do not change the Power Pages answer trigger or notification
trigger; this is the existing main approval flow's Dataverse trigger only.
Save. Keep notification Off and page feature false. These two filters do not
enable automatic reply resumption until the later activation changes the main
trigger to Added and Modified, after remaining readiness/lifecycle setup.

When Modified is subsequently enabled, scalar workflow-stage selection plus the
Pending/Not Started-or-Ready filter excludes the flow's own Review, Awaiting
Employee and Completed stage writes. Select columns applies only to updates;
creation still uses Filter rows against the saved row. Same-value eligible stage
updates can still trigger runs, so this is not duplicate/concurrency protection.
Do not add lookups to Select columns or remove existing entry/child guards.

The initial header-before-receipt timing and actual current-state outcome handling
remain acceptance/setup items; filters alone are not a submission-ready signal.
No new schema, web API privilege, portal flag, financial action or flow is added.
Supplied source snapshots remain historical and are not edited into tenant proof.

Reference: [Dataverse trigger column and row filters](https://learn.microsoft.com/en-us/power-automate/dataverse/create-update-delete-trigger).

## Receipt wait - user reports configured, 8 November 2026

User reports completing Wait_For_Receipt. Updated loop definition, placement,
limits, dependencies and runtime remain uninspected; slow/missing-upload behavior
has not yet been verified natively.

Source inspection confirms the browser creates the Request header, sequentially
saves/verifies every line item, then uploads the mandatory single PDF. Header
creation alone is not a completed submission. Use the EXISTING receipt field
instead of a new flag/column, public tracking-field write or extra flow.

At main level AFTER the WHOLE Review_Is_Resume condition and BEFORE the existing
Get a row by ID - manager, add Control Do until named **Wait_For_Receipt**.
Keep the existing preparation and approval tree outside the loop. Inside the
loop add these two sequential actions:

1. Schedule Delay: Count **5**, Unit **Second**.
2. Dataverse Get a row by ID named **Get_Submission_Receipt**:
   Table Petty Cash Requests; Row ID Expression
   `body('Get_Review_Request')?['hr_pettycashrequestid']`;
   Select columns `hr_receiptimage`.

Set the Do until condition's left field via Expression:

```text
not(empty(body('Get_Submission_Receipt')?['hr_receiptimage']))
```

Compare is equal to Expression Boolean `true`. Set Count **60** and Timeout
**PT5M** in Change limits. This polls the actual file-column identifier every
five seconds for a bounded period; the delay alone is not a readiness signal.
The file ID indicates column occupancy, not returned PDF binary data. The
existing later Download a file or an image must remain before approval dispatch
and Start_Review_Round, on the same success-only preparation path.

Existing manager preparation follows the WHOLE Wait_For_Receipt action on
success only. No existing action is moved inside the loop, and the depth-8
Switch is not wrapped. Do not proceed on loop failure/timeout. A count-limited
Until can finish without its condition being true; keep the existing mandatory
receipt download as an additional fail-closed gate before any approval or state
write. Missing/unreadable receipt must not be converted into a default attachment
or skipped to send an approval.

This fixes the known browser submission timing for this application path; it
does not verify items/totals from arbitrary external clients or make parent/child
writes atomic. If upload is interrupted or exceeds this wait, the request can
remain Pending with no approval; an operator must inspect the existing row/run
and receipt before recovery rather than asking for a duplicate submission. Slow
upload and missing-receipt paths need controlled native tests.

Save only with main trigger Added only, notification Off and reply UI false.
No native implementation/run is confirmed for this new loop. No source behavior,
schema, site setting, extra flow or financial action changes are introduced.

References: [Dataverse file identifier on retrieval](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/file-column-data),
[Until loop behavior and limits](https://learn.microsoft.com/en-us/azure/logic-apps/logic-apps-control-flow-loops#until-loops).

## Automatic resumption - user reports configured, 8 November 2026

User reports changing the main trigger's Change type to Added or Modified.
Updated native definition/save/runtime remains uninspected. This completes the
guided trigger-configuration checkpoint, not native feature acceptance.

All guided ordinary stage/round transitions, prior-child processing, approval
answer context, final decision tracking, trigger filters and receipt wait are
now configured by user report. This is sufficient to proceed toward controlled
testing of the accepted first version, not independent runtime acceptance or an
atomic/concurrency guarantee. Earlier conditional-hardening prerequisites remain
deferred under the user's simplification decision.

In the EXISTING main manager/boss approval flow, change only the Dataverse trigger
Change type from Added to **Added or Modified** (designer wording may be Added
and Modified). Keep table Petty Cash Requests, Organization scope, Select columns
hr_workflowstage and the existing Pending plus Not Started/Ready Manager/Ready
Boss Filter rows. Save. Do not edit the Power Pages answer trigger or notification
trigger. No extra resume flow is needed.

This allows Queue_Clarification_Review's Ready update to start the next review
run. Internal Review/Awaiting/Completed writes remain excluded by the row filter.
Creation continues through the Not Started path and receipt wait. All existing
entry/child correlation and final-expense checks remain; ordinary races and
financial partial-write risks documented earlier are not claimed resolved.

Keep the notification flow Off and the My Requests feature false until the next
publication step, so no clarification emails promise an answer page before it
is available. Do not submit answers or create test questions during this staged
configuration change. Next publish the prepared existing page/template, then
enable notification for controlled manager/boss end-to-end tests.

This trigger change is instructed, not yet user-reported complete or inspected.
No native trigger/site deployment, email, answer POST or financial operation is
performed by the assistant. Native caller/permissions, repeat answer, manager and
boss resumption, slow receipt and balance behavior still need controlled evidence.

Reference: [Dataverse trigger change types and filtering](https://learn.microsoft.com/en-us/power-automate/dataverse/create-update-delete-trigger).

## Publication reported; next test manager question and notification

User confirms the card and expected feature version/ready true. Publication is
user-reported, not independently inspected. Next turn on the existing notification
flow and test NEW employee request -> manager Need Clarification with Comments ->
employee email/link/question visibility, stopping before answer submission. Steps
and expected Pending/unchanged balance state in CLARIFICATION_UI_SETUP.md; test
and notification activation are instructed, not yet reported executed.

My Petty Cash Requests.html now has the site-specific true activation flag,
confirmed answer-flow GUID and input-title mapping. Shared script defaults and
reusable config remain disabled. Publish the existing page at My-Requests and
replace the EXISTING Petty Cash Modules template with the full shared JS inside
one script wrapper. No new template, Web File or include. Exact publication and
read-only console checks are in CLARIFICATION_UI_SETUP.md.

Keep notification Off until publication is confirmed; native answer/caller/
permission checks and end-to-end resume/financial acceptance follow controlled
tests. Source activation is prepared, not proof it has reached the website.
The assistant has not invoked a native flow, sent an email or changed records.

## Historical investigation status - before simplification

Draft backend handoff plan. No conditional update, connection or diagnostic flow
has been created by the assistant. Main trigger stays Added only and notification
stays Off until handoff, reply UI and controlled tests are complete.

The user's connection dialog now reports **Consent Required / Failed to create
OAuth connection** for HTTP with Microsoft Entra ID. Connection creation and the
authenticated WhoAmI check have not succeeded. This is a connector application
consent prerequisite, separate from Power Pages web roles and Dataverse table
permissions; no protected write or new approval dispatch is enabled.

Microsoft documents a Global Administrator using its ManagePermissionGrant.ps1
procedure for this connector (PowerShell 7 or later). Consent is for the required
Dataverse/Dynamics CRM delegated scope, user_impersonation. Where available,
limit the grant to the intended connection user. This does not grant that user
additional Dataverse data privileges. Do not register an unrelated replacement
app or change portal roles to resolve this dialog. The user reports no entries
under their account's Assigned roles. No administrator role has been confirmed;
eligible/group assignments were not independently inspected. Next step is for
company IT's authorized Global Administrator to handle connector consent, not
to assign the portal maker a new administrator role. No script, consent grant
or tenant permission change was performed by the assistant. After the
authorized administrator completes consent, create
a fresh connection and run only the manual GET WhoAmI diagnostic below.

References: [connector consent procedure](https://learn.microsoft.com/en-us/connectors/webcontentsv2/#authorize-the-connector-to-act-on-behalf-of-a-signed-in-user),
[Microsoft consent script](https://github.com/microsoft/PowerApps-Samples/blob/master/powershell/connectors/HTTPWithMicrosoftEntraId/ManagePermissionGrant.ps1),
[Dataverse delegated authentication](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/authenticate-oauth).

User reports the coordinated Run_Manager_Review move, outer Switch On/runAfter
and existing 10k edits configured. Updated native prefix/dependencies and runtime
are uninspected. The local 27-case routing model is not a native approval test.

## Confirmed API address

User supplies the Developer resources Web API endpoint:

```text
https://orgc513a088.api.crm15.dynamics.com/api/data/v9.2
```

An anonymous GET to its WhoAmI endpoint returned **401**, with an authentication
challenge declaring this resource:

```text
https://orgc513a088.api.crm15.dynamics.com/
```

This verifies the advertised authentication resource only. The request carried
no credentials and returned no identity/business records. It does not verify an
authenticated connector, permissions, optimistic-concurrency settings or a
successful Dataverse operation. Do not substitute the older host from previous
screenshots or remove the api subdomain from this verified resource.

## Deferred diagnostic: read-only connection check

Create an Instant cloud flow with **Manually trigger a flow**, named
**Petty Cash - Dataverse Connection Check**. This is a temporary/manual backend
diagnostic, not a site-associated Power Pages flow. It has no portal invocation
URL, page include or web-role association.

Add **HTTP with Microsoft Entra ID > Invoke an HTTP request**.
For a new connection:

| Connection property | Value |
|---|---|
| Microsoft Entra ID Resource URI | https://orgc513a088.api.crm15.dynamics.com/ |
| Base Resource URL | https://orgc513a088.api.crm15.dynamics.com/ |

Sign in through the native Microsoft connection dialog with an account that
has access to this Dataverse environment. Keep credentials/tokens in the native
connection, not source files, portal pages or chat. Connector consent/access
depends on the tenant and connection account; an anonymous 401 does not prove
those prerequisites are configured.

Configure the action:

| Action property | Value |
|---|---|
| Method | GET |
| URL of the request | /api/data/v9.2/WhoAmI |
| Header Accept | application/json |
| Request body | blank |

Save and run this manual check. Expected authenticated success is **200** with
the connection's UserId, BusinessUnitId and OrganizationId. The user only needs
to report success or the error message, not credentials or a token.
No approval, email, Request, Contact or cash update belongs in this flow.
Creation, consent, authenticated run and native response shape are instructed,
not confirmed. Retain its connection reference for the protected-update work
after success; do not treat this check as employee ownership validation.

## Deferred conditional handoff design

The planned update must claim a review before sending its next approval. Use
the current row version (ETag) and Dataverse optimistic concurrency; ordinary
snapshot conditions followed by an unconditional Update do not claim a row.
Verify optimistic concurrency is enabled for the Request and clarification
tables before relying on version checks. Preserve ETags exactly; If-Match *
only prevents upsert and is not a version comparison.

| Captured eligible entry | Target workflow stage | Target round | Prior child |
|---|---|---|---|
| New complete Pending request / Not Started | Manager Review (123140001) | 1 | none |
| Ready for Manager (123140003) | Manager Review (123140001) | answered child round + 1 | Processed |
| Ready for Boss (123140006) | Boss Review (123140004) | answered child round + 1 | Processed |

For a resume, revalidate Request/employee/source/round/approval-stage/active-child
correlation and saved Answered state against the exact versions being changed.
Handoff the previous question to Processed, advance the parent stage/round and
clear its old active-question/current-approval markers together. Preserve the
captured entry stage for routing even after the parent changes to Review.
Do not write balance, expense, final Approval Status or the employee's answer
during this transition.

A conditional Web API change set is a candidate for combining the parent and
child changes atomically; all changes must succeed or roll back together. This
requires authenticated connection/ETag/table metadata and native response-format
verification before concrete write instructions. A batch envelope HTTP 200
alone is not proof every inner request succeeded. Do not advance to approval
on a failed, ambiguous or unparsed result; do not automatically retry a stale
ETag or substitute a wildcard. Recovery must reread/revalidate current state.

The initial route also needs an actual submission-completeness signal/gate;
the browser currently creates a header before lines and receipt are complete.
Manager-approve-to-boss dispatch needs its own protected transition to Boss
Review and a new captured round; it must not rely on the earlier Not Started
compatibility allowance. Approval results must still match their captured
review stage/round before finalization or a new clarification.

Remaining work includes conditional answer save/queue recovery, unique-source
insert conflicts, new approval question/answer context, failed/uncertain handoff
recovery, final expense write ordering/freshness, UI and native tests. This
draft does not claim end-to-end exact-once approval delivery or cash posting.
No extra table/column is proposed by this contract.

## References

- [Dataverse conditional operations and ETags](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/perform-conditional-operations-using-web-api)
- [Transactional Web API change sets and batch responses](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/execute-batch-operations-using-web-api)
- [HTTP with Microsoft Entra ID connection/action parameters](https://learn.microsoft.com/en-us/connectors/webcontentsv2/)
