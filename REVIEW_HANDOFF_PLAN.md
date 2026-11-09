# Review handoff plan

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
