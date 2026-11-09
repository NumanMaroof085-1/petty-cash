# Request clarification upgrade

## Current runtime status - automatic manager reply cycle working

9 November user confirms a new approval email is now sent automatically after
the employee answers, following the no-manual-update retest. Manager resumption
is user-confirmed end to end; earlier missing-event cause remains unknown.
No fresh full native export/run was inspected. Final approval/one expense/one
ledger deduction, boss clarification and rejection acceptance remain separate.
See REVIEW_HANDOFF_PLAN.md; older diagnostic notes below are historical.

## Latest runtime report - manual event resumes review; automatic retest pending

User reports controlled same-value stage Update triggered both Dataverse flows
and a manager approval email containing clarification question/answer. This is
successful user-reported resumption for the manual event; original missing event
cause remains unknown. Next repeat Need Clarification on that current approval,
answer the NEW question through My Requests and verify a new review automatically
without manual flow/record edits. Details and temporary diagnostic cleanup are in
REVIEW_HANDOFF_PLAN.md. Boss and final financial acceptance are not inferred.

## Latest result - persisted trigger configuration matches

9 November supplied Callback Registrations output matches both notification and
main approval trigger settings, including Added or Modified and Ready for Manager.
Evidence: documentation/flow-snapshots/callback-registrations.received-2026-11-09.json.
No trigger-setting repair is established. Next inspect existing Callback
Registration System Jobs in the same environment for status/error details;
bounded instructions in REVIEW_HANDOFF_PLAN.md. No further Request updates,
answer retries or registration mutations. Automatic resumption remains unresolved.
Earlier diagnostic checkpoints below are history.

## Latest evidence - watched update included; connections green

User supplies Queue_Clarification_Review UpdateOnlyRecord inputs targeting
hr_pettycashrequests, Request b73e9530-92db-f111-84ea-70a8a52176fd and
item/hr_workflowstage 123140003. Both Dataverse and Approvals connections are
green by user report. Exact Update input is now inspected; no source/filter or
connection repair identified. Supplied input is preserved separately under
documentation/flow-snapshots/clarification-queue-input.received-2026-11-09.json.
Next use standard Dataverse List rows in the temporary manual check flow to read
Callback Registrations for this Request table. Exact bounded field list/query
in REVIEW_HANDOFF_PLAN.md. No HTTP/Entra consent, main-flow redesign or new
business table; diagnostic creation/run/results remain unverified. Keep the
queued request/answer and main flow logic unchanged pending this evidence.

## Current diagnostic - only initial run, connection/inputs requested

User confirms main flow On, no Flow Checker warnings/errors and only the initial
successful run in All runs; no subsequent running/cancelled entry. Next inspect
the successful Queue_Clarification_Review raw Inputs parameters (entityName,
recordId, item/hr_workflowstage) and exact main-trigger Dataverse connection
status. Matching output values do not prove the watched attribute was included
in the Update request. No repeat answer/state changes or new flow are instructed;
no source/schema/permission fix is established. See REVIEW_HANDOFF_PLAN.md.

## Latest native result - no reported run after fresh update

User reports direct Workflow Stage changes still did not start the main flow
after the save/Off/On attempt. Do not repeat those changes or submit the answer
again. Next inspect MAIN flow Details status/trigger-connection warnings and
Run history -> All runs, including Running/Waiting/Cancelled/Skipped entries.
Requested read-only evidence is pending; no new trigger/filter/source change is
instructed. Current code and queued status/stage match, so the restart did not
prove a fix or identify the cause. See REVIEW_HANDOFF_PLAN.md.

## Current next test - fresh event after reported trigger restart

User reports main flow refresh done (9 November); no repaired trigger/run is yet
confirmed. On ONLY the same queued test Request, first check it is still Pending
and Ready for Manager with no newer/in-progress manager run. If already reviewing
or completed, leave it alone. Otherwise native Dataverse Workflow Stage ->
Awaiting Employee - Manager, save completely; then Ready for Manager, save.
This generates a fresh eligible changed-column event while retaining the saved
answer and existing correlation fields. Do not replay the answer, create another
Request, reset Not Started, change balances or bypass validation.
Exact guardrails and expected new run/approval in REVIEW_HANDOFF_PLAN.md.
This is instructed one-time recovery/test, not a normal manual reply step or a
claim automation is repaired. A later genuine reply must resume automatically.

## Latest evidence - trigger declaration and queued values match

User supplies current main trigger Code view on 9 November: message 4, Request
table, Organization scope, filteringattributes hr_workflowstage and the exact
Pending plus initial/Ready stage filter. Microsoft CallbackRegistration metadata
confirms message 4 means Added or Modified. Queue Outputs show approval status
123140000 Pending and workflow stage 123140003 Ready for Manager. This output
satisfies the supplied filter; no filter widening or new state/column is needed.
Current trigger and queue fragment are preserved separately under
documentation/flow-snapshots; older root snapshots remain unchanged.

No new manager run is still reported. Actual callback registration health,
timing/environment and the queue action's input column set are not yet verified.
Next bounded troubleshooting step: save the main flow, turn it Off then On,
and check for a trigger warning on Details. This is a documented troubleshooting
attempt, not proof that registration is the cause or is repaired. Leave filters,
answer flow and source unchanged. Do not replay the answer or create a new test
request during this step. A webhook restart does not replay the already-queued
row; a controlled fresh event/recovery will be needed after re-enabling.

## Latest evidence - answer accepted; main restart still missing

On 9 November the user supplies Return_Clarification_Result Outputs with status
answered and matching clarification ID 69f97072-92db-f111-84ea-70a8a52176fd,
message Your answer was saved and queued for review. They also report
Queue_Clarification_Review Succeeded. Preserve the supplied response in
documentation/flow-snapshots/clarification-answer-response.received-2026-11-09.json.
No new manager run remains the reported problem; the accepted-answer question
is now resolved at the response/report level, without assuming the queued row
has the correct persisted stage or the main trigger handles modifications.

Next requested: CURRENT main trigger Code view from Power Automate (the local
approval-trigger-current.json is still the older Added-only snapshot), and
Queue_Clarification_Review Outputs hr_workflowstage/hr_approvalstatus. Expected
manager reply values are 123140003 Ready for Manager and 123140000 Pending.
No resubmission, speculative filter edit, new flow or source change instructed.

## Current diagnostic checkpoint - 9 November 2026

User reports Request -> initial manager approval -> Need Clarification -> own
question visible -> employee submits answer. Initial manager flow and answer
flow show Succeeded. User confirms no NEW manager flow run after the answer.
This demonstrates initial question-path progress by user report, not complete
answer acceptance/resumption. Notification email delivery is not reported.
Next inspect answer Return_Clarification_Result Outputs and whether
Queue_Clarification_Review Succeeded/Skipped. Do not infer successful queueing
from the overall run status; no new flow/filter or repeat submission instructed.
Earlier trigger-typo blocker is historical: manager flow now runs on creation,
but current native trigger Code view/modified subscription remains uninspected.

## Current blocker - invalid main trigger filtering attribute

During the first native test the user reports the Request saves but the manager
flow does not run. Flow checker reports: "The following filtering attributes
are not valid in entity hr_pettycashrequest: hr_workflowstagev". The supplied
error identifies an extra trailing v in the configured filtering attribute.
Correct the main trigger Select columns to exactly `hr_workflowstage`, retain
the documented Filter rows and Added or Modified setting, save and confirm the
flow is On. No new column, flow, public field or source change is required.
Correction/save/registration and a successful manager run are not yet confirmed.
This supersedes the earlier tentative blank-workflow-stage hypothesis; row
stage values and actual run history were not supplied. Do not widen filters or
create another flow based on that unverified hypothesis.

## Current checkpoint - reply page publication reported

User reports the new question card visible and expected console output
clarification-replies-v1 / ready true on 8 November. This confirms loaded source
by user report, not independent native delivery/caller/permission validation.
Next turn on the existing clarification notification flow and conduct the first
controlled manager Need Clarification test from a NEW small request, stopping
after employee email/link/question visibility. Exact steps and expected Pending/
unchanged balance behavior in CLARIFICATION_UI_SETUP.md. Activation and test are
instructed, not yet confirmed executed. Earlier publication/Off notices below
are previous checkpoints, not a request to disable the newly staged test.

## Current checkpoint - automatic resumption reported; publication next

User reports the main trigger now uses Added or Modified (8 November). Current
native Code view/runtime remains uninspected. The site's My Requests local flag
is now true for controlled publication; reusable/shared defaults stay false.
Publish ONLY the updated existing My Requests HTML and existing Petty Cash Modules
template source as described in CLARIFICATION_UI_SETUP.md, then hard refresh and
check the feature version/ready state. Keep notification Off until publication
is confirmed. Earlier disabled/Added-only notices below are historical stages.
No native deployment, answer run, caller/permission or end-to-end acceptance is
claimed. All existing filtering/ownership/current-review checks are retained.

## Latest checkpoint - receipt wait reported; stage automatic resumption

User reports Wait_For_Receipt complete on 8 November; native definition/runtime
uninspected. The guided first-version setup can now move toward controlled
activation under the accepted ordinary-write limitation. Next change ONLY the
existing main approval trigger to Added or Modified, preserving the configured
workflow-stage selection, Pending/initial/Ready filter and existing guards.
Exact staged activation in REVIEW_HANDOFF_PLAN.md. This change is instructed,
not confirmed configured. Keep notification Off and My Requests flag false until
the prepared page/template are published; no answers/tests in the staging gap.
Automatic resume, actual caller/permissions and final financial behavior are
not runtime-verified merely by saving the designer.

## Latest checkpoint - main trigger filters reported configured

User reports the main trigger's Select columns and Filter rows completed on
8 November; updated native code/runtime uninspected, Added-only still instructed.
Next add bounded Wait_For_Receipt polling after the whole Review_Is_Resume and
before manager lookup, using existing hr_receiptimage. The browser uploads it
after saving all lines. Exact Delay/Get/condition/limits and missing-upload
recovery are in REVIEW_HANDOFF_PLAN.md. Keep existing later receipt download
and success-only preparation; no approvals when it fails. No new column/flow.
This loop is instructed, not confirmed configured. Notification Off; UI false.

## Latest checkpoint - answer input bindings reported configured

On 8 November the user reports completing Input_Clarification/Input_Answer
bindings to the inspected text/text_1 trigger properties. Actual action Code view,
caller identity and runtime delivery remain uninspected. No further trigger
input recreation is needed. Next prepare the existing MAIN approval trigger's
Select columns and Filter rows as documented in REVIEW_HANDOFF_PLAN.md. Keep
Change type Added only at this checkpoint; automatic Modified resumption is not
enabled merely by adding these filters. Reply UI remains disabled/unpublished
and notification Off pending remaining setup and controlled tests.

## Latest checkpoint - 8 November 2026, reply UI prepared but disabled

User reports final Approved/Rejected updates now set workflow stage Completed
and clear old markers. Updated native definition/runtime remains uninspected.
The My Requests reply UI and shared helpers are implemented locally with mock
unit/browser QA; no publication or native answer call has been performed. See
[CLARIFICATION_UI_SETUP.md](CLARIFICATION_UI_SETUP.md) for source/configuration,
deployment and limitations. Earlier "UI unimplemented" notes are historical.

User confirms invocation URL ending 0a9693f4-61d8-f111-84ea-70a8a52176fd. Following
the earlier empty schema, their corrected code now declares required Text
properties text (title clarificationId) and text_1 (title answer). Both received
versions are preserved. Next ensure Input_Clarification reads triggerBody()['text']
and Input_Answer reads triggerBody()['text_1'] (or corresponding dynamic tokens).
Page eventData retains input titles clarificationId/answer per the Microsoft
Power Pages worked example. Input_Caller remains platform User ID. Bindings,
actual caller and runtime delivery are uninspected. My Requests stays disabled,
main trigger Added only and notification Off pending remaining setup/tests.

## Latest decision - 8 November 2026

At the user's request, defer the HTTP with Microsoft Entra ID connection,
administrator consent, WhoAmI diagnostic and ETag/transactional write work.
Continue the first functional version using existing Dataverse actions and
checks. REVIEW_HANDOFF_PLAN.md records the accepted concurrent-run limitation
and remaining resume/UI work. Earlier references to conditional writes or the
connection check as the mandatory next step are superseded. Keep ownership,
stage/round/source validation and existing unique keys. This decision changes
the implementation plan only; no native flow or portal code is changed here.

## Current checkpoint — 7 November 2026

The user now reports notification revision Part B completed: existing
Can_Notify_Employee guard, child-based reply link and Question email token.
Together with reported Part A, this completes the guided notification revision;
keep the notification flow Off until the reply UI and controlled tests are ready.
No native definition, event payload, email delivery or end-to-end run is verified.

The user now reports Manager_Can_Restore_Question and
Restore_Manager_Question_Link configured after the earlier existing-row guards.
The manager recovery branch's guided designer structure is user-reported done;
native definition, runtime, conditional-write protection and insert-time
conflict recovery remain unverified/incomplete. The user supplies Boss_Approval_ID
Compose Code view: boss StartAndWait body/name, success-only after
Boss_Clarification_Question. This confirms the configured token reference, not
its runtime value or the question's exact Inputs. The user now reports
Get_Boss_Clarification_Request and Find_Boss_Clarification configured; native
read outputs are uninspected. On 7 November the user also reports the boss
responder Compose, active Contact lookup and Boss_Clarification_Valid configured.
The user now also reports Boss_Can_Link_Clarification and Boss_Question_Is_New
configured. Their native definitions/evaluations/runtime remain uninspected.
The user now reports Create_Boss_Clarification and Set_Boss_Awaiting_Employee
configured in the new-question True branch. No native updated definition, row,
parent activation or runtime is inspected. The user now also reports the boss
existing-child Compose, combined reuse condition and Restore_Boss_Question_Link
configured. Current Switch/trigger files are now supplied and statically reviewed:
61 actions, no duplicate names/unresolved sibling dependencies, depth 8. The user
now reports both functional corrections done: new boss parent stage 123140005
and intended boss recipient. Refreshed native code/runtime is uninspected; local
received JSON/report still describe the older values and are preserved unchanged.
Exact findings and prepared layout are in APPROVAL_FLOW_REVIEW.md; source hashes
are in the static review JSON. Originals are unchanged; evidence request is
satisfied. No full export/runtime/atomic acceptance verified. Do not wrap the
depth-8 Switch in a new container. The user now reports main-level
Get_Review_Request and Review_Entry_Allowed configured; native placement/outputs
are uninspected. The user now reports Review_Is_Resume, Get_Resume_Clarification
and Resume_Is_Current configured. Native validation/placement/run uninspected.
The user now reports the coordinated Run_Manager_Review move, outer Switch
On/runAfter and existing 10k edits configured. Updated native placement,
dependencies and runtime remain uninspected. Next is protected review handoff.
The user supplies the Dataverse API address; its anonymous 401 challenge confirms
the advertised resource URI. A signed-in connection has not been tested. Follow
[REVIEW_HANDOFF_PLAN.md](REVIEW_HANDOFF_PLAN.md) for the next manual read-only
WhoAmI connection check and the draft conditional parent/child handoff contract.
No conditional writes or further native approval are instructed at this point.
Keep trigger Added only until manager skipping/handoff is wired. Conflicts,
claims, initial completeness, resumption and reply UI remain pending.
Approval Status stays Pending and completed manager approval is preserved.
No financial posting or new approval is instructed here.
Do not copy the full manager tree into the deeper boss branch because of the
eight-level nesting limit. Resumption dispatch, reply UI and
atomic answer/handoff protection remain incomplete. Keep notification Off.

This feature is in progress and is not ready for end-to-end use. The user chose
email notification with an authenticated answer on the existing My Requests
page (`/My-Requests/`). Direct email replies are outside the agreed first version.

**Save blocker resolved, user report:** disabling trigger concurrency allowed the
answer flow to save on 5 November 2026. The earlier concurrency-1 instruction
below is superseded. Keep trigger concurrency disabled and the Power Pages
response synchronous. Answer-update concurrency protection remains unresolved;
ordinary read conditions followed by Update a row are not atomic.

The user reports completing these guided changes to the manager approval flow:

- Custom Responses - Wait for one response: Approve, Reject, Need Clarification
  (exact case now inspected in the supplied manager action).
- Switch on Outcome, with existing approval processing in Approve and rejection
  in Reject. The original supplied Switch had an empty Need Clarification branch
  and Default Terminate with Succeeded status. Later user-reported manager
  question creation and parent activation are recorded below; the original
  snapshot does not represent those later changes.

The user also confirms the table shell exists and supplies these exact names:

| Item | Confirmed logical/entity-set name |
|---|---|
| Table | `hr_requestclarification` |
| Entity set | `hr_requestclarifications` |
| Primary GUID column | `hr_requestclarificationid` |
| Primary name/reference column | `hr_clarificationreference` |
| Request lookup column | `hr_request` |
| Employee lookup column | `hr_employee` |
| Requested By lookup column | `hr_requestedby` |
| Question column | `hr_question` |
| Answer column | `hr_answer` |
| Approval Stage column | `hr_approvalstage` |
| Clarification Status column | `hr_clarificationstatus` |
| Answered On column | `hr_answeredon` |
| Review Round column | `hr_reviewround` |
| Source Approval ID column | `hr_sourceapprovalid` |

The user confirms the instructed autonumber configuration on
`hr_clarificationreference`: `CL-{SEQNUM:6}`, seed 1. This is a user-reported
configuration, not an independent metadata inspection.

The user's Keys screenshot confirms **Source Approval Unique**, name
`hr_sourceapprovalunique`, status **Active**. Its column display is truncated
in the screenshot; the instructed definition is Source Approval ID only
(`hr_sourceapprovalid`). Retain that definition in the eventual native export.

User-confirmed Choice values, 4 November 2026:

| Column | Label | Numeric value |
|---|---|---:|
| `hr_approvalstage` | Manager | 123140000 |
| `hr_approvalstage` | Boss | 123140001 |
| `hr_clarificationstatus` | Awaiting Answer | 123140000 |
| `hr_clarificationstatus` | Answered | 123140001 |
| `hr_clarificationstatus` | Processed | 123140002 |
| `hr_clarificationstatus` | Cancelled | 123140003 |

These names and the later setup checkpoints below are user-confirmed. Native
column types, relationships, API exposure and permissions have not been
independently inspected. The user now reports the answer flow's first-answer
checks, save, Ready-stage update and common response configured in the designer.
The subsequent concurrency save error was resolved by disabling that setting;
the user reports a successful save. Exact action contents have not been inspected.
No controlled reply execution has been verified. The user now reports the
guided retry-recovery actions configured as well. Review of the native approval
definition, atomic save/handoff protection, main approval routing and the My
Requests reply UI are still pending.

These are user-reported checkpoints, not an inspected flow export or a completed
clarification implementation. No automatic notification, reply form or resume
handler has been deployed by the assistant. Manager/boss action fragments have
now been statically reviewed in their original supplied state; the user now
reports boss Custom Responses and Boss_Outcome routing configured. Updated
native code/recipient and runtime remain uninspected. See
[APPROVAL_FLOW_REVIEW.md](APPROVAL_FLOW_REVIEW.md).

## Agreed design

Each question and answer will be saved in a Request Clarification row. An email
links the employee to that question on My Requests. A trusted backend validates
the employee's ownership, accepts one answer for an open question and signals
review to resume at the approver/stage that asked it. Answering does not approve
the request. Manager approval must be retained when the boss asks a question.
No expense or balance change is allowed before final approval.

The proposed split is a modified approval flow plus two focused flows:
notification after the Request enters an active awaiting-employee stage, and a
site-associated answer-submission flow. Request workflow stage, active approval
ID, review round and active
clarification link provide durable routing. Exact columns, generated logical
names, choice numbers and relationships confirmed during setup are recorded
below. Native trigger input/caller mapping and site invocation URL still need
verification before the frontend is connected.

## Completed guided step: table shell

Inside the existing project solution in Power Apps, create a Standard table:

| Property | Value |
|---|---|
| Display name | Request Clarification |
| Plural name | Request Clarifications |
| Primary name column | Clarification Reference |

Keep the primary name as text at this checkpoint. Its automatic reference
generation will be configured before any flow writes clarification rows. Leave
the default User or team record ownership; portal employee access will be scoped
through a Contact relationship, not Dataverse ownership. Save the table only;
there is no live clarification write path yet.

Record the generated table logical name, entity-set name (Copy set name), primary
GUID column logical name and primary name/reference column logical name. Do not
infer any publisher prefix or entity-set pluralization from display names.

## Completed guided step: three lookup columns

On Request Clarification, add these Lookup columns as Business required:

| Display name | Related table | Purpose |
|---|---|---|
| Request | Petty Cash Request (`hr_pettycashrequest`) | Expense being clarified |
| Employee | Contact (`contact`) | Request's submitted employee; used for own-record access |
| Requested By | Contact (`contact`) | Manager or boss asking the question |

The user supplies the three lookup logical names on 4 November, recorded above.
The native flow must eventually derive
Employee from the linked Request and validate all lookups server-side; Business
required alone is not an authorization rule. Relationship schema/navigation
names, native type/requirement properties and tenant permission behavior have
not been inspected. Portal permissions will be configured in subsequent steps.

## Completed guided step: question, answer, stage and status

The user supplies all four logical names and their Choice numbers, recorded
above. The requested configuration for those fields is:

| Display name | Data type | Required | Configuration |
|---|---|---|---|
| Question | Multiline Text, plain text | Business required | Maximum length 4000 |
| Answer | Multiline Text, plain text | Optional | Maximum length 4000; initially empty |
| Approval Stage | Single-select Choice | Business required | Local choices Manager, Boss; no default |
| Clarification Status | Single-select Choice | Business required | Local choices Awaiting Answer, Answered, Processed, Cancelled; default Awaiting Answer |

Names and Choice numbers are confirmed; the requested types, lengths, defaults
and publication have not been independently inspected. Answer must be optional
because the question exists before its reply.
Awaiting Answer means open for the employee; Answered means the reply is saved;
Processed means handed back to approval review, not final expense approval;
Cancelled means the exchange is no longer actionable.

## Completed guided step: reply and approval tracking

Add these three columns to Request Clarification:

| Display name | Data type | Required | Configuration/purpose |
|---|---|---|---|
| Answered On | Date and Time | Optional | User local behavior; backend records the reply timestamp |
| Review Round | Whole Number | Business required | Format None, minimum 1; backend supplies the round when creating the question |
| Source Approval ID | Single line of text | Business required | Maximum length 100; ID of the approval that requested clarification |

Source Approval ID will support duplicate protection for repeated processing
of the same approval response; the unique-key and retry behavior are still to
be configured. A review round identifies the applicable review when old replies
or outcomes arrive. Neither field is an employee-editable workflow control.

Edit the EXISTING primary name column `hr_clarificationreference` to Autonumber,
custom format `CL-{SEQNUM:6}`, seed 1 (example CL-000001). Keep its logical name.
This generates the readable reference automatically for new rows. It does not
replace the primary GUID or the later approval-source duplicate key.

The user supplies `hr_answeredon`, `hr_reviewround`, `hr_sourceapprovalid` and
confirms the autonumber is configured. Native property/publication verification,
Request workflow tracking and all flow/UI integration remain pending.

## Completed guided step: source-approval unique key

In Request Clarification > Schema > Keys, create one alternate key:

| Setting | Value |
|---|---|
| Display name | Source Approval Unique |
| Selected column | Source Approval ID (`hr_sourceapprovalid`) only |

The screenshot confirms name `hr_sourceapprovalunique` and Active status. This
establishes the activation checkpoint; it does not verify the future flow's
correct source-ID writes or duplicate-recovery behavior.

This key enforces at most one clarification row for a given nonempty source
approval ID. The flow must populate that actual approval ID and compare an
existing record on duplicate/retry; the key does not itself implement recovery,
serialize separate approvals or guarantee one active clarification per request.
Null source IDs must be rejected because alternate-key uniqueness does not
apply to nulls. Request-level round/stage routing is still required next.

## Completed guided step: Request workflow tracking

On the EXISTING **Petty Cash Request** table (`hr_pettycashrequest`), add:

| Display name | Data type | Required | Configuration |
|---|---|---|---|
| Workflow Stage | Single-select Choice | Optional | Local choices listed below; default Not Started |
| Current Approval ID | Single line of text | Optional | Maximum length 100 |
| Review Round | Whole Number | Optional | Format None, minimum 1; flow initializes/increments it |
| Active Clarification | Lookup | Optional | Related table Request Clarification (`hr_requestclarification`) |

Workflow Stage labels, in this order:

1. Not Started
2. Manager Review
3. Awaiting Employee - Manager
4. Ready for Manager
5. Boss Review
6. Awaiting Employee - Boss
7. Ready for Boss
8. Completed

The fields are optional on the native table to accommodate existing records and
the initial request save. Backend processing will validate/initiate workflow
tracking. Do not bulk-fill old requests or expose these fields for employee
writes. These stages supplement the existing Pending/Approved/Rejected status;
they do not replace it. The initial Not Started route must retain the existing
request-completeness check before sending an approval. A default alone must
never be treated as proof that products/receipt are saved.

The user confirms these Request column names:

| Request field | Logical name |
|---|---|
| Workflow Stage | `hr_workflowstage` |
| Current Approval ID | `hr_currentapprovalid` |
| Review Round | `hr_reviewround` |
| Active Clarification | `hr_activeclarification` |

The supplied Workflow Stage screenshot confirms:

| Label | Numeric value |
|---|---:|
| Not Started | 123140000 |
| Manager Review | 123140001 |
| Awaiting Employee - Manager | 123140002 |
| Ready for Manager | 123140003 |
| Boss Review | 123140004 |
| Awaiting Employee - Boss | 123140005 |
| Ready for Boss | 123140006 |
| Completed | 123140007 |

`hr_reviewround` exists on both the Request and Request Clarification tables;
keep the table context explicit. Names/Choice values are user-confirmed;
native type/default/publication and relationship properties are not independently
inspected. Resumption triggers, per-request concurrency, approval-ID persistence
and recovery are still to be implemented and tested.

## Completed guided step: employee clarification Read permission

Create a table permission in Power Pages Management:

| Setting | Value |
|---|---|
| Name | Request Clarifications - Employee Read |
| Table | Request Clarification (`hr_requestclarification`) |
| Website | Existing petty cash site |
| Access type | Contact |
| Contact relationship | `hr_requestclarification_Employee_contact` via Employee (`hr_employee`) |
| Privileges | Read only |
| Web role | Authenticated Users |

Leave Write, Create, Delete, Append and Append To unchecked. Save, associate the
web role and keep the record Active. The user reports selecting
`hr_requestclarification_Employee_contact`. The Employee relationship gives the submitting employee access;
Requested By is a different Contact relationship and is not the employee scope.

Relationship selection is user-confirmed; effective Read scope, all privilege
flags, web-role association and cross-employee denial have not been independently
inspected/tested. Employees will submit an
answer through the validated site-associated backend flow, rather than receiving
direct table Write.

## Completed guided step: clarification Web API read settings

On the existing website, create these Site Settings (table logical name, not
the plural entity set, belongs in their names):

| Name | Value |
|---|---|
| `Webapi/hr_requestclarification/enabled` | `true` |
| `Webapi/hr_requestclarification/fields` | Copy the exact comma-separated list below |

```text
_hr_employee_value,_hr_request_value,_hr_requestedby_value,createdon,hr_answer,hr_answeredon,hr_approvalstage,hr_clarificationreference,hr_clarificationstatus,hr_question,hr_requestclarificationid,hr_reviewround
```

The user reports completing these settings and site sync on 4 November 2026.
The user subsequently confirms the expected status 200 / recordsReturned 0
result from the full-field read probe. The employee table permission
remains Read only; including Answer in the fields list does not grant Write.
Keep `hr_sourceapprovalid` and the Request workflow controls outside the portal
field list; trusted native flows maintain them. Do not use a wildcard or change
existing tables' field lists for this step. If a restrictive column permission
profile already applies to this new table, its read fields must agree with
this list. Read-only API verification and own/cross-employee isolation tests
will follow; zero clarification records is expected before the creation flow
is connected.

## Completed guided step: read-only API verification

On the live New Request page while signed in, use its existing token-aware
`callWebAPI` helper in Console. This reads at most one accessible row and logs
only a status/count or error; it creates no rows and submits no approval:

```js
(async () => {
  try {
    const fields = [
      'hr_requestclarificationid', 'hr_clarificationreference',
      '_hr_request_value', '_hr_employee_value', '_hr_requestedby_value',
      'hr_question', 'hr_answer', 'hr_approvalstage',
      'hr_clarificationstatus', 'hr_answeredon', 'hr_reviewround', 'createdon'
    ];
    const { data, xhr } = await callWebAPI({
      method: 'GET',
      url: '/_api/hr_requestclarifications?$select=' + fields.join(',') + '&$top=1'
    });
    console.log({ status: xhr.status, recordsReturned: data.value.length });
  } catch (error) {
    console.log({ status: error.status, message: error.message });
  }
})();
```

Expected initial result: status 200 and recordsReturned 0 if there are no
accessible clarification rows. This does not prove cross-employee isolation or
answer authorization; those need controlled owned/other-user records later.
The user confirms the expected result on 4 November 2026: status 200,
recordsReturned 0. This verifies basic read/API field access for the tested
session; isolation and reply authorization are not established by an empty read.
Do not create a dummy request/cash movement or broaden employee permissions to
get a successful read.

## Historical guided step: child-Added notification skeleton

The following three notification sections record the original configured setup.
The next guided revision below changes delivery to a Request waiting-stage update
so parent activation is saved before email. That revision is instructed, not yet
reported applied. Do not mix the old trigger fields with the new action sources.

Inside the existing project solution, create an Automated cloud flow named
**Petty Cash - Clarification Notification**. This is a backend Dataverse-triggered
flow, not a site-associated public invocation.

Trigger: Microsoft Dataverse > When a row is added, modified or deleted:

| Property | Value |
|---|---|
| Change type | Added |
| Table name | Request Clarifications (`hr_requestclarification`) |
| Scope | Organization |
| Filter rows | `hr_clarificationstatus eq 123140000` |
| Select columns | Leave empty; the trigger's column filter applies to updates |

Add Microsoft Dataverse > Get a row by ID, rename **Get_Clarification_Employee**:

| Property | Value |
|---|---|
| Table name | Contacts |
| Row ID — evaluated Expression | `triggerBody()?['_hr_employee_value']` |
| Select columns | `fullname,emailaddress1` |

This retrieves the destination employee's name/email without fetching credential
columns. Expression is the GUID value from Employee, not an OData binding path.
The user reports configuring the trigger and employee lookup action. Next
steps fetch the linked request, validate notification context and
add the email with a My Requests link. No delivery or notification run is
claimed while these parts remain missing. The latest approval-flow definition
is still needed before editing its resume/manager/boss routing.

## Completed guided step: request lookup and notification routing

After Get_Clarification_Employee, add Dataverse > Get a row by ID named
**Get_Clarification_Request**:

| Property | Value |
|---|---|
| Table name | Petty Cash Requests |
| Row ID — evaluated Expression | `triggerBody()?['_hr_request_value']` |
| Select columns | `hr_requesttitle,hr_approvalstatus,_hr_submittedby_value` |

Add a Condition named **Can_Notify_Employee**, combining both rows with AND:

| Left Expression | Operator | Right |
|---|---|---|
| `body('Get_Clarification_Request')?['hr_approvalstatus']` | is equal to | Expression numeric `123140000` (Pending) |
| `body('Get_Clarification_Request')?['_hr_submittedby_value']` | is equal to | Expression `triggerBody()?['_hr_employee_value']` |

Yes/True is reserved for the email action, to be added next. In No/False add
Terminate, Status Cancelled. This stops this notification run without changing
the Request. Use the normal successful-action dependencies; failed lookups must
not run the email branch. This checks current request decision and recipient
association; it is not the full reply/resume authorization or a current-question
replay check. The user reports configuring these two actions; actual runtime,
condition branches and recipient isolation remain untested.

## Completed guided step: employee email and reply link

Inside Can_Notify_Employee > True, add Data Operations > Compose named
**Clarification_Reply_Link**, with this evaluated Expression:

```text
concat(
  'https://industrad-petty-cash.powerappsportals.com/My-Requests/?clarificationId=',
  triggerBody()?['hr_requestclarificationid']
)
```

The origin is the site address previously supplied by the user; keep it matched
to the actual deployment. The route is the confirmed `/My-Requests/` page.
`clarificationId` is the proposed deep-link query contract for the future reply
panel; the current page does not yet implement clarification replies. The GUID
identifies a record but does not authorize reading or answering it.

After Compose, add Office 365 Outlook > **Send an email (V2)**. Suggested action
name **Send_Clarification_Email**. Set:

| Field | Value |
|---|---|
| To | Email (`emailaddress1`) from Get_Clarification_Employee |
| Subject | Static `Clarification needed: ` followed by Request Title (`hr_requesttitle`) from Get_Clarification_Request |

Use the rich-text Body editor and replace every bracketed placeholder below
with its actual dynamic-content token:

```text
Hello [Full Name],

Your approver needs clarification on request [Request Title].

Question:
[Question]

Open My Requests to submit your answer:
[Reply Link]

Please submit your answer on the website.
```

| Body placeholder | Dynamic-content source |
|---|---|
| Full Name | Get_Clarification_Employee > Full Name (`fullname`) |
| Request Title | Get_Clarification_Request > Request Title (`hr_requesttitle`) |
| Question | Dataverse trigger > Question (`hr_question`) |
| Reply Link | Clarification_Reply_Link > Outputs |

Use the rich-text hyperlink control with Compose Outputs as its address if
formatting a named link. The user reports configuring Compose/email and saving
the flow. Actual delivery, final email content and link opening are not yet
verified. No email has been sent by the assistant. The create
question branch, reply UI/backend and current-question/replay guards still need
integration before controlled end-to-end testing.

## Next guided revision: notify after the Request's waiting state is saved

The user reports Set_Manager_Awaiting_Employee configured on 5 November 2026;
native Code view/state/run is not inspected. Modify the existing backend flow
**Petty Cash - Clarification Notification**, not the approval or answer flow.
Turn THIS notification flow off while editing and keep it off until the reply UI
and controlled end-to-end tests are ready. Do not create a second notification
flow or leave the child-Added version running alongside the revision.

Guided pacing: configure the trigger/new child lookup/existing lookup sources
first (Part A), save while off, then revise the existing condition/link/email
sources (Part B). A user confirmation of Part A alone must not be recorded as
completion of the full revision below. Neither partial configuration is ready
to turn on or test email delivery.

Part A is now user-reported configured on 5 November 2026: notification Off,
Request Modified trigger, event-linked clarification Get and updated employee/
Request lookups. Native Code view, saved Off state and run payload remain
uninspected. Part B (existing condition, link and Question email token below)
is the next instruction; its completion must not be inferred from Part A.

Change the EXISTING Dataverse trigger parameters:

| Property | Value |
|---|---|
| Change type | Modified |
| Table name | Petty Cash Requests (`hr_pettycashrequest`) |
| Scope | Organization |
| Select columns | `hr_workflowstage` |
| Filter rows (plain OData text) | `hr_approvalstatus eq 123140000 and (hr_workflowstage eq 123140002 or hr_workflowstage eq 123140005) and _hr_activeclarification_value ne null` |

hr_workflowstage is a Choice scalar supported by Select columns; do not put the
Active Clarification lookup into Select columns. Filter rows is evaluated after
the update is saved and has no $filter= prefix. Parent activation writes the
waiting stage and active-child lookup in the same Request update. An unchanged
workflow-stage value included in another update can still trigger another run;
this is not exactly-once email delivery or deduplication.

Immediately after the trigger, BEFORE Get_Clarification_Employee, add Dataverse
Get a row by ID named **Get_Notification_Clarification**:

| Property | Value |
|---|---|
| Table | Request Clarifications |
| Row ID, Expression | `triggerBody()?['_hr_activeclarification_value']` |
| Select columns | `hr_requestclarificationid,_hr_request_value,_hr_employee_value,hr_question,hr_clarificationstatus,hr_approvalstage` |

This uses the activation event's linked child, not whichever question happens
to be active later. Controlled tests must confirm the trigger emits the lookup
value written by Set_Manager_Awaiting_Employee; never use an employee/browser
supplied question ID to bypass native missing-event data.

Keep existing action names. Update their fields:

| Action/field | New value |
|---|---|
| Get_Clarification_Employee Row ID, Expression | `body('Get_Notification_Clarification')?['_hr_employee_value']` |
| Get_Clarification_Employee Select columns | `fullname,emailaddress1` (unchanged) |
| Get_Clarification_Request Row ID, Expression | `triggerBody()?['hr_pettycashrequestid']` |
| Get_Clarification_Request Select columns | `hr_requesttitle,hr_approvalstatus,hr_workflowstage,_hr_submittedby_value,_hr_activeclarification_value` |

Sequence is trigger, Get_Notification_Clarification, Get_Clarification_Employee,
Get_Clarification_Request, Can_Notify_Employee, then Compose/email in True.
Use success-only action dependencies. Keep the existing False Terminate Cancelled.

Edit the EXISTING Can_Notify_Employee, replacing its old comparison rows with
ONE comparison row (do not delete the condition container or its existing
True/False actions): left evaluated Expression below, is equal to right
Expression Boolean `true`:

```text
and(
  equals(body('Get_Clarification_Request')?['hr_approvalstatus'], 123140000),
  equals(body('Get_Notification_Clarification')?['hr_clarificationstatus'], 123140000),
  not(empty(body('Get_Clarification_Request')?['_hr_activeclarification_value'])),
  equals(
    toLower(string(body('Get_Clarification_Request')?['_hr_activeclarification_value'])),
    toLower(string(body('Get_Notification_Clarification')?['hr_requestclarificationid']))
  ),
  equals(
    toLower(string(body('Get_Notification_Clarification')?['_hr_request_value'])),
    toLower(string(triggerBody()?['hr_pettycashrequestid']))
  ),
  equals(
    toLower(string(body('Get_Clarification_Request')?['_hr_submittedby_value'])),
    toLower(string(body('Get_Notification_Clarification')?['_hr_employee_value']))
  ),
  not(empty(trim(string(body('Get_Clarification_Employee')?['emailaddress1'])))),
  not(empty(trim(string(body('Get_Notification_Clarification')?['hr_question'])))),
  or(
    and(
      equals(body('Get_Notification_Clarification')?['hr_approvalstage'], 123140000),
      equals(body('Get_Clarification_Request')?['hr_workflowstage'], 123140002)
    ),
    and(
      equals(body('Get_Notification_Clarification')?['hr_approvalstage'], 123140001),
      equals(body('Get_Clarification_Request')?['hr_workflowstage'], 123140005)
    )
  )
)
```

This checks the current own-request active waiting question and delivery fields;
it is not answer authorization, a write lock, source/round claim or a guarantee
that state cannot change after reading. A stale/answered/cancelled question in
the read snapshots goes to notification cancellation, without Request changes.

Update Clarification_Reply_Link Compose Expression:

```text
concat(
  'https://industrad-petty-cash.powerappsportals.com/My-Requests/?clarificationId=',
  body('Get_Notification_Clarification')?['hr_requestclarificationid']
)
```

In Send_Clarification_Email Body replace ONLY the old trigger Question token with
**Get_Notification_Clarification > Question**, or Expression
`body('Get_Notification_Clarification')?['hr_question']`. Keep recipient/name from
Get_Clarification_Employee, title from Get_Clarification_Request, link from Compose.
The trigger is now a Request, so no child question/employee/reference field can
continue to be taken directly from it.

Save the complete coordinated revision and keep the notification flow off.
Part A is reported configured; Part B guard/link/email token changes are
instructed only and not reported configured/tested. No email has been sent by
the assistant. Native event payload, no-early
delivery, current-question cancellation, link access and repeated-event behavior
require controlled acceptance tests before enabling it.

## Answer-submission trigger and captured inputs

In Power Pages Studio > Set up > Cloud flows > Create new flow, create
**Petty Cash - Submit Clarification Answer** using **When Power Pages calls a
flow**. Keep it solution-aware in the same environment. Add only these two Text
inputs, with the names entered in the actual name box (not the description):

| Input name | Type | Meaning |
|---|---|---|
| `clarificationId` | Text | Request Clarification row GUID from the selected question |
| `answer` | Text | Employee's written answer; the backend will trim/validate length |

Add these Data Operations > Compose actions, selecting dynamic-content tokens:

| Action name | Input token |
|---|---|
| Input_Clarification | Trigger > clarificationId |
| Input_Answer | Trigger > answer |
| Input_Caller | Trigger's built-in User ID |

Do not add a client-supplied employeeId/userId/approval stage or trust those
fields for ownership. The Finance setup already uses the platform User ID token;
Microsoft's Power Pages image-library example also uses it. Its actual Contact
GUID mapping must be confirmed in the new flow's native invocation before reply
writes are enabled. Use the dynamic token, not a guessed header/body property.
Actual input schema/internal names will be inspected before the website call
is connected, avoiding assumptions about text/text_1 parameter names.

The user confirms creating the Power Pages-triggered answer flow and shows its
Add cloud flow screen. Authenticated Users was instructed for the role; the user
subsequently reports flow creation complete. Effective role association, the
actual trigger/input schema and all three Compose actions still need verification.
Copy/paste confirmation of the site invocation URL is pending before client
configuration. There are no answer writes at this checkpoint. Next steps retrieve the clarification
and Request, validate ownership/current stage/current approval and reply state,
save once, trigger resumption and return a consistent response to the website.
Native caller/parameter verification, final site invocation/role confirmation
and the page/helper changes remain pending.

## Completed guided step: retrieve clarification and linked request

In Submit Clarification Answer, after the three Input_* Compose actions, add
Control > Scope named **Process_Clarification_Answer**. Put both lookups below
inside that Scope so later response/error handling can cover processing together.
This assumes the previously instructed Input_Clarification/Input_Answer/
Input_Caller actions exist; verify their names and selected tokens before wiring.

Add Dataverse > Get a row by ID named **Get_Reply_Clarification**:

| Property | Value |
|---|---|
| Table | Request Clarifications |
| Row ID — Expression | `outputs('Input_Clarification')` |
| Select columns | `hr_requestclarificationid,_hr_request_value,_hr_employee_value,hr_clarificationstatus,hr_approvalstage,hr_reviewround,hr_sourceapprovalid,hr_answer,hr_answeredon` |

Then add Get a row by ID named **Get_Reply_Request**:

| Property | Value |
|---|---|
| Table | Petty Cash Requests |
| Row ID — Expression | `body('Get_Reply_Clarification')?['_hr_request_value']` |
| Select columns | `hr_pettycashrequestid,_hr_submittedby_value,hr_approvalstatus,hr_workflowstage,hr_reviewround,hr_currentapprovalid,_hr_activeclarification_value` |

These are trusted backend Dataverse reads. They do not require publishing
source/current approval IDs or Request workflow controls in portal API fields.
No answer/Request updates or approvals are added at this checkpoint. The user
reports adding the Scope and both lookups; runtime/selected tokens have not been
independently inspected. Subsequent steps validate
the actual caller against Employee and Submitted By, active question/round/source
approval and awaiting state, answer length and safe retry behavior before writes.

## Completed guided step: one shared answer-flow response

After the three Input_* Compose actions, immediately BEFORE the processing
Scope, add two top-level Initialize variable actions:

| Name | Type | Initial value |
|---|---|---|
| vReplyStatus | String | `unconfirmed` |
| vReplyMessage | String | `Your answer could not be confirmed. Keep this page open and try again.` |

Initialize variables outside scopes/conditions/loops. Then add ONE Power Pages
**Return value(s) to Power Pages** action AFTER and OUTSIDE
Process_Clarification_Answer, named **Return_Clarification_Result**. Add three
Text outputs using these exact lowercase names:

| Output name | Value |
|---|---|
| status | vReplyStatus variable token |
| clarificationid | Input_Clarification Outputs token |
| message | vReplyMessage variable token |

Configure Return_Clarification_Result > Run after on the processing Scope:
is successful, has failed, is skipped, has timed out (all four). Subsequent
branches set these two variables, and all converge on this single response.
Do not Terminate inside reply processing before this action. Notification-flow
Terminate actions are separate and unchanged.

This is the new reply protocol: `status`, `clarificationid`, `message`, all
strings. Status values will be answered (confirmed save), rejected (business/
ownership denial) or unconfirmed (an operation could not be confirmed). No
success is set merely because record reads succeeded, and no Request GUID or
private record contents are returned on unauthorized/failure paths. The page
already knows the Request from its authorized clarification read, so a separate
request ID response/variable is unnecessary.

The user reports configuring these variable/response actions and Run after.
Native output schema, response shape and error outcomes have not yet been tested.
The current default response deliberately reports no completed answer. Caller/current-review
validation and write/retry logic follow in later steps; no reply writes are
enabled at this checkpoint.

## Completed guided step: caller ownership condition

Inside Process_Clarification_Answer, immediately after Get_Reply_Request, add
Condition named **Caller_Owns_Clarification**. Its left value is an evaluated
Expression (without leading @ or @{...}):

```text
and(
  not(empty(trim(string(outputs('Input_Caller'))))),
  equals(
    toLower(trim(string(outputs('Input_Caller')))),
    toLower(string(body('Get_Reply_Clarification')?['_hr_employee_value']))
  ),
  equals(
    toLower(trim(string(outputs('Input_Caller')))),
    toLower(string(body('Get_Reply_Request')?['_hr_submittedby_value']))
  )
)
```

Operator is equal to; right value is Expression Boolean `true`. The condition
requires a nonempty platform caller ID matching BOTH the clarification Employee
and linked Request Submitted By, comparing case-insensitively. It uses the
built-in trigger User ID captured earlier; a browser-supplied identity must not
be substituted if native mapping fails. Actual native Contact mapping/denial
tests remain mandatory before reply writes are enabled.

In False, add two Set variable actions:

| Variable | Plain text value |
|---|---|
| vReplyStatus | `rejected` |
| vReplyMessage | `You can only answer clarifications for your own requests.` |

Leave True empty at this checkpoint; subsequent active-review/answer/retry
checks and writes go inside it. Do not add Terminate or a second Response in
either branch: processing ends through the existing common response. Owner
match alone does not authorize changing a closed/obsolete question. The user
reports configuring this condition on 5 November 2026. Native caller mapping,
ownership-denial execution and all reply writes remain unverified.

## Completed guided step: validate the answer text

Inside Caller_Owns_Clarification > True, add Condition named
**Valid_Clarification_Answer**. Left value is an evaluated Expression:

```text
and(
  not(empty(trim(string(outputs('Input_Answer'))))),
  lessOrEquals(length(trim(string(outputs('Input_Answer')))), 4000)
)
```

Operator is equal to; right value is Expression Boolean `true` (not text).
The condition rejects empty/whitespace-only answers and trimmed text over the
configured 4,000-character Answer limit. Subsequent save and same-answer retry
comparisons must use the same `trim(string(outputs('Input_Answer')))` value;
preserve internal whitespace and case. Do not silently truncate an answer.

In False, add two Set variable actions:

| Variable | Plain text value |
|---|---|
| vReplyStatus | `rejected` |
| vReplyMessage | `Enter an answer between 1 and 4,000 characters.` |

Leave True empty for the current-question/state and retry checks. Keep the
single common Return_Clarification_Result; do not add Terminate or another
response. Input validity alone does not authorize a write. The user reports
configuring this condition on 5 November 2026; native execution is not verified.
No answer or Request updates are enabled at this checkpoint.

## Completed guided step: distinguish a new answer from a retry

Inside Valid_Clarification_Answer > True, add Condition named
**Clarification_Awaiting_Answer**:

| Property | Value |
|---|---|
| Left, Expression | `body('Get_Reply_Clarification')?['hr_clarificationstatus']` |
| Operator | is equal to |
| Right, Expression (Number) | `123140000` |

This is the confirmed Awaiting Answer choice. Leave both branches empty at this
checkpoint, with no response, Terminate or updates. True will hold the active
request/stage/round/source-approval checks before a first answer is saved.
False will distinguish a confirmed same-answer retry from an already answered
with different text, Processed, Cancelled or unknown-status record. It must not
blindly reject all retries, overwrite saved text, or restart an obsolete review.
Those branches are not implemented by this routing condition alone. The user
reports configuring this condition on 5 November 2026; native execution remains
unverified.

## Completed guided step: validate the active review before a first answer

Inside Clarification_Awaiting_Answer > True, add Condition named
**Clarification_Is_Current**. Left value is an evaluated Expression:

```text
and(
  equals(body('Get_Reply_Request')?['hr_approvalstatus'], 123140000),
  not(empty(body('Get_Reply_Request')?['_hr_activeclarification_value'])),
  equals(
    toLower(string(body('Get_Reply_Request')?['_hr_activeclarification_value'])),
    toLower(string(body('Get_Reply_Clarification')?['hr_requestclarificationid']))
  ),
  greater(coalesce(body('Get_Reply_Clarification')?['hr_reviewround'], 0), 0),
  equals(
    body('Get_Reply_Request')?['hr_reviewround'],
    body('Get_Reply_Clarification')?['hr_reviewround']
  ),
  not(empty(trim(string(body('Get_Reply_Clarification')?['hr_sourceapprovalid'])))),
  equals(
    string(body('Get_Reply_Request')?['hr_currentapprovalid']),
    string(body('Get_Reply_Clarification')?['hr_sourceapprovalid'])
  ),
  empty(trim(string(body('Get_Reply_Clarification')?['hr_answer']))),
  or(
    and(
      equals(body('Get_Reply_Clarification')?['hr_approvalstage'], 123140000),
      equals(body('Get_Reply_Request')?['hr_workflowstage'], 123140002)
    ),
    and(
      equals(body('Get_Reply_Clarification')?['hr_approvalstage'], 123140001),
      equals(body('Get_Reply_Request')?['hr_workflowstage'], 123140005)
    )
  )
)
```

Operator is equal to; right value is Expression Boolean `true`. This requires
Pending approval, the same nonempty active clarification, a matching positive
review round, matching nonempty source/current approval IDs, no existing answer,
and the matching Manager/Boss Awaiting Employee stage. Numeric values use the
user-confirmed mappings. Null rounds/IDs cannot authorize a new answer. Source
approval IDs are compared exactly as stored; active lookup GUIDs ignore case.

In False, set vReplyStatus to `rejected` and vReplyMessage to
`This clarification is no longer available for a new answer. Refresh My Requests.`
Leave True empty for the save/handoff actions. The outer
Clarification_Awaiting_Answer > False remains reserved for saved-answer retries;
this first-answer rejection must not replace retry recovery.

The user reports configuring this condition on 5 November 2026; native execution
is not verified. No writes were added at that checkpoint. Checking two read snapshots is not an atomic
claim: reply concurrency/write protection and current-state handoff handling
must be completed before enabling saves. Main approval flow still needs to
populate these tracking fields and implement controlled resume routing.

## First-answer save and review handoff — configured; save subsequently reported

The user asks to keep the implementation simple. Group the first-answer actions
below rather than introducing more conditions on that path. Existing ownership,
text and current-review checks stay. The normal path is save answer, mark review
ready, return confirmation; repeat-answer/partial-failure recovery is still pending.

**Correction, 5 November 2026:** do NOT enable trigger concurrency on this
synchronous Power Pages answer flow. The user reports the native save error:

```text
InvalidConcurrencyConfiguration: The concurrency configuration of workflow
trigger 'manual' of type 'Request' ... is not valid. The concurrency control
is not supported when the workflow contains actions of type 'response'
without the operationOptions flag set to 'asynchronous'.
```

The earlier instruction to enable degree 1 was incorrect for this trigger and
response combination. It was general trigger advice applied without checking
this restriction. To resolve this save blocker, try trigger > Settings >
Concurrency Control **Off**, then save. Keep Return_Clarification_Result and
its outputs synchronous and unchanged. Do not enable an asynchronous response
just to satisfy this error: the planned page expects the completed JSON result.
If the designer disables the Off toggle, stop and report that state. Do not
delete/recreate the trigger blindly, discard recent unsaved actions, or change
the site association/URL. Microsoft documents that removing persisted concurrency
can require trigger recreation; any such repair must preserve/rebind the two
input tokens, built-in caller token and site association and be verified afterward.

The user reports disabling concurrency and successfully saving on 5 November
2026. No trigger replacement or asynchronous-response change was reported.
This correction fixes a save-schema
conflict only, not simultaneous-write safety. Before live use, replace the
serialization assumption with an atomic Dataverse save/claim or other supported
write protection. Keep activation pending; no new tables or flows are instructed
at this checkpoint. The native retry guard's latest persistence is also unknown.

Inside Clarification_Is_Current > True, add these actions sequentially with
default success-only Run after. No parallel branches:

1. Dataverse Update a row named **Save_Clarification_Answer**:

   | Property | Value |
   |---|---|
   | Table | Request Clarifications |
   | Row ID, Expression | `body('Get_Reply_Clarification')?['hr_requestclarificationid']` |
   | Answer, Expression | `trim(string(outputs('Input_Answer')))` |
   | Answered On, Expression | `utcNow()` |
   | Clarification Status | Answered (123140001) |

   Leave all other fields untouched. Do not alter Question, Employee, Requested
   By, Source Approval ID, Review Round or Approval Stage.

2. Dataverse Update a row named **Queue_Clarification_Review**:

   | Property | Value |
   |---|---|
   | Table | Petty Cash Requests |
   | Row ID, Expression | `body('Get_Reply_Request')?['hr_pettycashrequestid']` |
   | Workflow Stage, custom value Expression | `if(equals(body('Get_Reply_Clarification')?['hr_approvalstage'], 123140000), 123140003, 123140006)` |

   This sets Ready for Manager or Ready for Boss using the already validated
   stage. Change only Workflow Stage: approval status stays Pending; retain
   Active Clarification, Current Approval ID and Review Round for safe handoff
   recovery/dispatch. Do not change balances, cash transactions or approvers.

3. Set variable **vReplyMessage** to plain text
   `Your answer was saved and queued for review.`
4. Set variable **vReplyStatus** to plain text `answered` as the final success
   marker after both updates. Keep the existing single Return action outside Scope.

The user reports configuring these grouped steps on 5 November 2026; selected
native fields, concurrency setting and runtime remain unverified. Do not connect
or test live submission until retry/partial-save recovery and controlled approval
resumption are complete. Main approval trigger is still user-reported Added only,
so setting Ready stage alone does not send a new approval yet. If save succeeds
but queuing fails, the common response remains unconfirmed; pending same-answer
recovery must finish that handoff without overwriting text or re-dispatching an
old round. Trigger concurrency cannot protect this synchronous answer flow;
supported atomic save protection is still pending. The main flow must also
respect awaiting/current-round state. Native caller mapping,
permissions, inputs and selected update fields require controlled verification.

## Guided retry guard: recognize an unchanged saved answer

Inside **Clarification_Awaiting_Answer > False**, add Condition named
**Same_Answer_Already_Saved**. This is the retry branch, separate from the
first-answer save actions. Left is Expression:

```text
and(
  or(
    equals(body('Get_Reply_Clarification')?['hr_clarificationstatus'], 123140001),
    equals(body('Get_Reply_Clarification')?['hr_clarificationstatus'], 123140002)
  ),
  equals(
    trim(string(body('Get_Reply_Clarification')?['hr_answer'])),
    trim(string(outputs('Input_Answer')))
  )
)
```

Operator is equal to; right is Expression Boolean `true`. Ownership and valid
nonempty input have already been checked before reaching this branch. Only
Answered or Processed with the same trimmed text enter True. Preserve text case
and internal whitespace; do not normalize away a different answer. Cancelled,
unknown status or a different answer enter False.

In False, set vReplyStatus to `rejected` and vReplyMessage to
`This clarification is closed or already has a different answer. Refresh My Requests.`
Leave True empty for the subsequent handoff-recovery/confirmation handling. Do
not copy Save_Clarification_Answer into this retry branch: stored Answer and
Answered On must stay unchanged. Do not set success solely on this text match;
Answered may mean the first save succeeded but the parent Ready update failed.
Processed can later be confirmed without changing an old parent workflow stage.
No retry action may rewind a newer review, a cancelled question or a completed
request. The user reports a successful flow save after removing concurrency;
the exact saved retry-guard contents and runtime have not been inspected.

## Completed guided step: confirm a retry for an already processed answer

Inside **Same_Answer_Already_Saved > True**, add Condition named
**Clarification_Already_Processed**:

| Property | Value |
|---|---|
| Left, Expression | `body('Get_Reply_Clarification')?['hr_clarificationstatus']` |
| Operator | is equal to |
| Right, Expression (Number) | `123140002` |

In True, add Set variable actions in this order:

| Variable | Plain text value |
|---|---|
| vReplyMessage | `Your answer was already saved and returned for review.` |
| vReplyStatus | `answered` |

This path already passed caller ownership and unchanged nonempty answer checks.
Processed means the backend has handed that answer back to review, not that the
expense was approved. Confirm it without any Dataverse update or new approval;
do not rewind a later review or require the parent still to reference this older
clarification. The resume implementation must set Processed only after a durable
handoff. Keep the single common response outside the Scope.

Leave False empty: the outer guard means this is Answered with identical text,
so subsequent steps must inspect whether Ready handoff is done or safely recover
it. They must not overwrite Answer/Answered On or set success merely because
text matches. The user reports configuring this processed-retry condition and
confirmation actions on 5 November 2026; native execution remains unverified.
Trigger concurrency stays disabled; simultaneous-write
protection and approval resume routing remain pending before live use.

## Completed guided step: recover or confirm an Answered-state handoff

Inside **Clarification_Already_Processed > False**, add Compose named
**Reply_Review_State** with this Expression:

```text
if(
  and(
    equals(body('Get_Reply_Request')?['hr_approvalstatus'], 123140000),
    not(empty(body('Get_Reply_Request')?['_hr_activeclarification_value'])),
    equals(
      toLower(string(body('Get_Reply_Request')?['_hr_activeclarification_value'])),
      toLower(string(body('Get_Reply_Clarification')?['hr_requestclarificationid']))
    ),
    greater(coalesce(body('Get_Reply_Clarification')?['hr_reviewround'], 0), 0),
    equals(
      body('Get_Reply_Request')?['hr_reviewround'],
      body('Get_Reply_Clarification')?['hr_reviewround']
    ),
    not(empty(trim(string(body('Get_Reply_Clarification')?['hr_sourceapprovalid'])))),
    equals(
      string(body('Get_Reply_Request')?['hr_currentapprovalid']),
      string(body('Get_Reply_Clarification')?['hr_sourceapprovalid'])
    ),
    or(
      and(
        equals(body('Get_Reply_Clarification')?['hr_approvalstage'], 123140000),
        or(
          equals(body('Get_Reply_Request')?['hr_workflowstage'], 123140002),
          equals(body('Get_Reply_Request')?['hr_workflowstage'], 123140003)
        )
      ),
      and(
        equals(body('Get_Reply_Clarification')?['hr_approvalstage'], 123140001),
        or(
          equals(body('Get_Reply_Request')?['hr_workflowstage'], 123140005),
          equals(body('Get_Reply_Request')?['hr_workflowstage'], 123140006)
        )
      )
    )
  ),
  if(
    or(
      equals(body('Get_Reply_Request')?['hr_workflowstage'], 123140002),
      equals(body('Get_Reply_Request')?['hr_workflowstage'], 123140005)
    ),
    'queue',
    'ready'
  ),
  'unconfirmed'
)
```

The previous branches guarantee Answered and the same valid saved answer. This
Compose checks Pending, active clarification, positive matching round, nonempty
matching approval ID and corresponding manager/boss awaiting-or-ready stage.
It classifies the read snapshot as queue, ready or unconfirmed without writing.

Immediately after Compose, at the same branch level, add Condition
**Retry_Needs_Queue**, left Expression `outputs('Reply_Review_State')`, operator
is equal to, right plain text `queue`.

In True, add sequential actions with default success-only Run after:

1. Dataverse Update a row **Retry_Queue_Clarification_Review**, Petty Cash Requests,
   Row ID Expression `body('Get_Reply_Request')?['hr_pettycashrequestid']`. Update
   only Workflow Stage, custom Expression:
   `if(equals(body('Get_Reply_Clarification')?['hr_approvalstage'], 123140000), 123140003, 123140006)`.
2. Set vReplyMessage plain text `Your answer was saved and queued for review.`
3. Set vReplyStatus plain text `answered`.

In False, add two Set variable actions in order:

vReplyMessage, Expression:

```text
if(
  equals(outputs('Reply_Review_State'), 'ready'),
  'Your answer was already saved and queued for review.',
  'Your answer is saved, but its review status could not be confirmed. Refresh My Requests or contact your administrator.'
)
```

vReplyStatus, Expression:

```text
if(equals(outputs('Reply_Review_State'), 'ready'), 'answered', 'unconfirmed')
```

Ready-state retries make no Dataverse update, so they do not re-trigger review
by writing the same stage. Unconfirmed-state retries leave all records unchanged
and do not claim successful handoff. Keep Answer and Answered On unchanged in
every retry branch. Use no further nested Scope/Condition here: Power Automate's
documented nesting limit is eight; with the instructed ancestry, the deepest
actions are at that boundary. Actual native export/save must confirm structure.

The user reports these grouped actions configured on 5 November 2026; native
definition, invocation and save structure have not been inspected. This is
read-snapshot recovery logic, not atomic write protection. Trigger concurrency
remains disabled. Conditional Dataverse writes/claims and controlled main-flow
resumption remain prerequisites for live use; no native record writes or flow
invocations were performed by the assistant.

## Current checkpoint: approval overview and trigger received; action code needed

**Subsequent evidence received:** user supplies manager approval, List rows and
the complete Switch attachment. These fragments have been parsed/reviewed; more
overview screenshots are not needed. The earlier request below is satisfied.
Exact findings and the next bounded threshold/filter/Request-bind corrections
are in [APPROVAL_FLOW_REVIEW.md](APPROVAL_FLOW_REVIEW.md). No corrected native
configuration/save/runtime is assumed. Financial write ordering and reply atomic
save gaps remain outstanding, along with clarification creation/resume and UI.

**Latest user confirmation:** on 5 November 2026 the user reports the threshold,
line lookup filter and both direct cash Request binds corrected. Native updated
definitions/tests are not inspected. The next coordinated step in the review
guide replaces boss Condition 1 with Boss_Outcome Switch while moving existing
Approve/Reject containers intact, then sets the boss's three custom responses.
Need Clarification remains empty until question creation is wired. No boss
response/routing or recipient correction is inferred completed from the earlier
three-fix confirmation.

**Subsequent confirmation:** the user reports the coordinated boss response and
Boss_Outcome routing change done on 5 November 2026. No updated action code/run
or precise recipient is inferred verified. Next capture manager comments in
Manager_Clarification_Question and inspect the actual Approval ID dynamic token
using Manager_Approval_ID Compose Code view. Official action outputs are dynamic;
do not invent an approval ID property. The review guide gives exact bounded steps.

**Selected token now confirmed:** user supplies Manager_Approval_ID Code view
with `@outputs('Start_and_wait_for_an_approval_-_manager')?['body/name']`, running
after Manager_Clarification_Question succeeds. This establishes the configured
token reference for this manager action, not a verified native runtime value.
Next add Get_Manager_Clarification_Request and Find_Manager_Clarification reads
using the triggering Request and source approval ID, as specified in the review.
No clarification create, parent activation or notification is instructed yet.

**Latest read checkpoint confirmed:** user reports the current Request and
source-ID clarification lookup configured. Next add Manager_Clarification_Valid
(nonempty source/question, <=4000, current Pending) with Failed diagnostic on
invalid input, then Manager_Question_Is_New (matching row count equals 0).
Create/reuse branches remain empty pending current-review/actor checks and safe
activation/notification ordering. Exact expressions are in APPROVAL_FLOW_REVIEW.md.
No native write or execution is inferred from the reported read setup.

**Question validation/routing now reported done:** user confirms
Manager_Clarification_Valid and Manager_Question_Is_New configured. Next in the
new-question branch capture the first manager approval responder email and query
only contactid/emailaddress1 for up to two active Contact matches. Both supplied
approvals enable reassignment; Requested By must resolve the actual responder
to a Contact rather than use an Entra GUID or assume the original manager acted.
No nonempty/unique-contact/current-review write gate or question creation is
inferred implemented yet. The review guide records exact settings and safeguards.

**Responder lookup now reported configured:** user confirms the responder Compose
and narrow active-Contact lookup done. Next configure Manager_Can_Create_Clarification
and Create_Manager_Clarification with exact Request/Employee/actual Requested By,
question, Manager stage, Awaiting Answer, round and stable approval ID. Review
guide records full eligibility expression/field mapping. Creation is instructed,
not reported executed. Parent activation, notification timing, reuse/conflict
recovery and per-run/atomic state protection remain incomplete; do not run the
partial branch or connect the frontend yet.

**New manager-question action now reported configured:** user confirms the create
guard and Create_Manager_Clarification action done; no native row/run is verified.
Next Set_Manager_Awaiting_Employee updates the existing Request's workflow stage,
current approval ID, matching round and active-child lookup after successful
creation. Exact field mapping is in APPROVAL_FLOW_REVIEW.md. Pending and financial
state remain unchanged. Notification currently starts on child Added and must be
coordinated with parent activation before testing; reuse/partial recovery, per-run
round claims and atomic writes are also outstanding. Parent update is instructed
only, not reported configured/executed.

The reply-flow structure is now user-reported configured, including retries;
this is not completed end-to-end acceptance. A local search found no exported
native flow definition/package in the project on 5 November 2026. Existing
approval documentation and historical screenshots do not supply the current
manager/boss action names, full nesting and trigger filters.

On 5 November 2026 the user supplies two current overview screenshots and the
trigger Code view. The trigger is OpenApiConnectionWebhook with
SubscribeWebhookTrigger, entity hr_pettycashrequest, message 1, scope 4, connection
shared_commondataserviceforapps. No filter/select columns or trigger conditions
are shown in the supplied trigger JSON. These values are consistent with the
previous user-confirmed Added-only/Organization setup; the screenshot's generic
trigger title alone must not be read as Added-and-Modified configuration.

The overview shows manager lookup, List rows - PC request, employee lookup,
receipt download, Compose, then Start and wait for an approval - manager and
Switch. Manager Switch has approve, reject and clarification cases plus Default.
The clarification case is visibly empty in this latest image; Default contains
Terminate 2. Approve includes List rows - Find Existing Expense, Condition - 10k,
boss approval on True and a separate no-boss finalization path on False. Boss
decision is shown as Condition 1 with True/False branches. Finalization includes
status/balance/cash actions and expense guards, with different loop structure
between paths. Field values, precise comparisons, response options, loop inputs
and expressions cannot be verified from the overview alone.

Request Code view for only these remaining action blocks:

1. **Start and wait for an approval - manager**: response option strings,
   assignee/details and actual dependency names.
2. **Switch**: copy the whole JSON, including nested cases/actions, to inspect
   manager outcome, exact threshold comparison, boss response/condition,
   expense checks and final writes.
3. **List rows - PC request**: inspect the filter and row selection because the
   downstream loops must target the one triggering request.

The user can paste these blocks or add them to one local text file named
approval-flow-details.txt, with a heading for each action. No new screenshots
are needed if those Code view blocks include their nested contents. In the new
designer select the action and Code view; copy without editing. Trigger code
does not need to be sent again. Keep working actions unchanged pending review.
Do not request passwords, tokens or signed invocation URLs. These blocks have
not yet been supplied; no expression/action internals are inferred from labels.

Use that definition to connect question creation, current approval/round tracking
and Ready-stage resumption with the existing request-completeness gate and final
expense dedupe intact. Preserve completed manager review on boss clarification.
The answer flow's atomic-save/handoff gap is still outstanding and must be
resolved before live connection. Do not treat more snapshot conditions as a
substitute for supported conditional writes. No native main-flow change or
frontend enablement is instructed at this checkpoint.

## Confirmed existing approval configuration

The user confirms the current approval flow trigger is **Added only**, and the
boss recipient is a **fixed email address**. Keep that recipient method unless
the user requests a change; the actual address/current action expressions have
not been supplied in this checkpoint.

An Added-only flow cannot resume from an existing Request update. The planned
upgrade must introduce controlled workflow-stage update handling, preserving
the initial request-completeness gate and completed manager decision. Trigger
filtering, round/approval-ID validation and concurrency/replay handling must
prevent ordinary updates from starting fresh approvals. The actual trigger has
not been changed by the assistant; obtain the latest definition before replacing
or moving live actions.

Because Requested By is a Contact lookup, the boss's fixed email needs a matching
Contact identity when the boss asks a question. Initially no boss Contact existed;
the user now supplies the new Contact GUID on 4 November 2026:
**`bb427249-63d8-f111-84ea-70a8a52176fd`**. This is user-confirmed identity metadata;
the actual Contact email/role/login properties have not been independently read.
The instructed setup is a profile-only Contact in Power Pages Management > Contacts,
with the boss's first/last name and the same fixed email. Website login can stay
disabled; creating this record does not provision a password or grant web roles.
Contact creation/GUID are user-confirmed. The fixed email can remain the
approval destination while the Contact GUID identifies Requested By.

For this profile-only boss record, use Management > Contacts with name and the
same email. If the business-role field `hr_userrole` needs a value, Manager is
appropriate for the approver profile. That business choice does not grant site
permissions. Do not assign Petty Cash Admin solely because the person is the
boss: that role grants administrator website access and is separate from email
approval assignment. Website login can remain disabled for this recordkeeping
use case. The GUID is confirmed; separate role/login configuration or admin-role
assignment must not be inferred from that confirmation.

The user confirms the boss action is **Start and wait for an approval**, addressed
to the fixed email. This resolves the earlier send-an-email wording. The planned
boss clarification path can use the same custom responses as the manager;
the boss action's actual custom-response configuration, comments and outcome
branches are not yet confirmed. Its name/expressions still require the current
flow definition. Boss Contact GUID is confirmed; answer-flow internal action/input
verification remains pending independently of the reported flow creation.

## Remaining work

- Verify reported column properties, lookup relationships and the unique-key
  definition in the native export.
  Use native Created On for the question timestamp; retain separate records
  for later rounds. Prevent two active questions for the same review.
- Protect confirmed Request workflow tracking and implement reliable resume routing.
- Require a nonempty question; approval comments are not assumed mandatory.
- Build notification and authenticated answer-submission flows, with replay,
  duplicate-trigger and obsolete-response handling.
- Add own-record read permissions/API field exposure and protected flow access;
  employees must not write approvers/questions/workflow controls directly.
- Update My Requests and its helper code with question history and answer panel.
- Reconnect approval processing with preserved stage and existing cash dedupe.
- Test both approvers, repeated rounds, ownership denial, retries, notifications,
  timeouts and one final expense only. Record actual results before enabling.
- Export updated schema/site/flows and update handover/operations instructions.

## Platform references

- [Custom approval responses](https://learn.microsoft.com/en-us/power-automate/create-approval-response-options)
- [Create Dataverse tables](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/create-edit-entities-portal)
- [Alternate keys and Active status](https://learn.microsoft.com/en-us/power-apps/maker/data-platform/define-alternate-keys-reference-records)
- [Site-associated flows and roles](https://learn.microsoft.com/en-us/power-pages/configure/cloud-flow-integration)
- [Contact-scoped table permissions](https://learn.microsoft.com/en-us/power-pages/security/table-permissions)
- [Dataverse create/update triggers](https://learn.microsoft.com/en-us/power-automate/dataverse/create-update-delete-trigger)
- [Get row by ID](https://learn.microsoft.com/en-us/power-automate/dataverse/get-row-id)
- [Send an email (V2) and dynamic content](https://learn.microsoft.com/en-us/power-automate/email-top-scenarios)
- [Power Pages trigger User ID example](https://learn.microsoft.com/en-us/power-pages/configure/image-library-how-to)
- [Top-level variable initialization](https://learn.microsoft.com/en-us/power-automate/create-variable-store-values)
- [Scope Run after and error handling](https://learn.microsoft.com/en-us/power-automate/guidance/coding-guidelines/error-handling)
- [Workflow expression functions](https://learn.microsoft.com/en-us/azure/logic-apps/expression-functions-reference)
- [Trigger concurrency](https://learn.microsoft.com/en-us/power-automate/guidance/coding-guidelines/optimize-power-automate-triggers)
- [Concurrency and waiting-run limits](https://learn.microsoft.com/en-us/power-automate/limits-and-config)
- [Asynchronous response behavior](https://learn.microsoft.com/en-us/power-automate/guidance/coding-guidelines/asychronous-flow-pattern)

No website source, tenant permissions, schema or financial rows are changed by
this guide. Native creation and subsequent publication must be confirmed by the
user; a table shell alone does not complete this upgrade.
