# My Requests clarification replies

## Status - 9 November 2026

Current user confirmation: answering a new clarification automatically sends the
next manager approval email in the instructed retest without manual stage updates.
The manager reply/resumption path is user-reported working. Final financial,
boss/rejection and independent permission acceptance remain separate checks.
Earlier diagnostic paragraphs below are historical, not current blockers.

Latest runtime report: explicit manual same-value stage Update caused both test
and MAIN flows to run, and a new manager approval email contains the question
and answer. Automatic reply-to-review triggering without that manual update is
still pending. Next use Need Clarification on the CURRENT new approval, answer
the new question on My Requests, and check for automatic main run/email without
manual diagnostics. Temporary test-flow cleanup instructed, not yet confirmed.

Latest supplied registration output matches both intended triggers. Read of
the stored configuration is now evidenced, not successful callback delivery.
Next inspect Callback Registration System Jobs using REVIEW_HANDOFF_PLAN.md;
automatic resumption is still unverified. Reply UI and native data are unchanged.
The following paragraphs retain earlier diagnostic checkpoints as history.

Latest evidence: supplied Queue input includes the exact watched stage column
on Request b73e9530-92db-f111-84ea-70a8a52176fd; user reports green Dataverse and
Approvals connections. Next inspect persisted Callback Registrations using one
standard List rows action in the temporary manual diagnostic, not the portal.
Query/selected fields are in REVIEW_HANDOFF_PLAN.md. No results yet, no source
change, extra approval flow or HTTP/Entra consent. Automatic restart unresolved.

User now confirms main flow On, clean Flow Checker and only initial successful
run visible in All runs. Awaiting the queue action's actual input parameters
and status of the main trigger's Dataverse connection before any further edit.
The reply UI/accepted answer is not changed by this trigger-delivery diagnostic.

Current result: user reports no main flow run after the fresh native stage test.
No more row edits or answer submissions are instructed. Await MAIN flow Details
status/warning text and All runs evidence (including queued/cancelled/skipped)
to distinguish trigger delivery from a hidden or early-terminated run. No change
to the answer UI, source, flow count or schema is needed for this read-only check.

Latest checkpoint: user reports completing main-flow save/Off/On. Next create
one fresh watched-stage event on the existing queued test Request, only if it
remains Pending/Ready Manager with no newer approval run. In native Dataverse,
save Awaiting Employee - Manager, then save Ready for Manager, changing no other
data. Expected new main run/approval is unverified. Full conditions/recovery
limits in REVIEW_HANDOFF_PLAN.md. This one-time diagnostic does not replace
the required subsequent automatic reply test; no source change is needed.

Newest evidence: supplied main trigger uses Added or Modified, correct column
selection and row filter; queued Outputs are Ready for Manager / Pending and
satisfy it. No new main run is still reported. Next save/toggle the main flow
Off/On and check trigger health, leaving page, filters and answer unchanged.
Restart is a troubleshooting attempt, not a proven fix; it will not replay the
old webhook event. Existing queued record recovery and a new automatic event
test will follow after re-enabling. See REVIEW_HANDOFF_PLAN.md.

Latest evidence: the supplied answer response is status answered with the
expected queued message and clarification GUID. Queue_Clarification_Review is
reported Succeeded. Acceptance at this response level is established; no new
manager run is still the reported issue. Next inspect CURRENT main trigger
Code view and queued Request stage/status Outputs, expected Ready for Manager
123140003 / Pending 123140000. Do not resubmit the answer or change filters yet.

User now reports a new Request was submitted, manager selected Need
Clarification in the approval email, the question appeared on the employee's
page, and the employee submitted an answer. The initial manager flow and answer
flow show Succeeded by user report. They confirm NO new manager flow run after
answer submission. Notification email delivery is not reported. A successful
answer-flow run alone does not prove its returned status was answered: the
common response can report rejected/unconfirmed after validation/processing.

Current diagnostic request: Outputs from Return_Clarification_Result (status,
clarificationid, message) and whether Queue_Clarification_Review Succeeded or
was Skipped. No repeated submission, wider trigger filter or new flow is
instructed until that evidence identifies whether the answer was queued.

Prepared and tested locally with synthetic APIs. The user now reports the main
approval trigger changed to Added or Modified. The site-specific My Requests
flag is now ON. The user confirms the published question card is visible and
the console returns clarification-replies-v1 / ready true. This is user-reported
publication, not independent inspection or a native answer/resumption test.
No new page, Web
Template, Web File, table or column is required for this UI.

The user confirms this site-generated URL for the existing
**Petty Cash - Submit Clarification Answer** flow:

```text
/_api/cloudflow/v1.0/trigger/0a9693f4-61d8-f111-84ea-70a8a52176fd
```

The first supplied trigger had empty properties/required; preserve that earlier
[received snapshot](documentation/flow-snapshots/clarification-answer-trigger.received-2026-11-08.json)
as history. The user now supplies
[corrected trigger code](documentation/flow-snapshots/clarification-answer-trigger.with-inputs.received-2026-11-08.json)
declaring both required Text inputs. This resolves the declaration issue only;
it is partial supplied code, not an export or a successfully invoked flow.

| Input title / Power Pages payload name | Internal trigger body property | Existing Compose |
|---|---|---|
| clarificationId | text | Input_Clarification |
| answer | text_1 | Input_Answer |

Keep the page's payload names clarificationId and answer. Microsoft Power Pages'
worked example sends the input titles in eventData; inside this flow the supplied
schema uses text/text_1. These are different layers, not an instruction to rename
the public inputs or send internal property names from the page.

Next native step: ensure existing Input_Clarification uses Expression
`triggerBody()?['text']` and Input_Answer uses `triggerBody()?['text_1']`, or reselect
their corresponding trigger dynamic tokens. Save. Input_Caller stays the built-in
Power Pages User ID; do not add a caller/employee input or another flow. Compose
bindings, actual caller identity and native parameter delivery remain uninspected.
The user now reports completing those Compose bindings; no additional input
recreation is instructed. Code view/runtime confirmation is still pending.

## Source and behavior

| File | Responsibility |
|---|---|
| My Petty Cash Requests.html | Existing page; question/reply area, page-local styles and configuration |
| pettycash-modules.js | Existing Petty Cash Modules template source; own-question reads, rendering and reply transport |
| pettycash-module-config.example.js | Disabled reusable example, including unchanged disabled Finance defaults |
| tests/pettycash-modules.test.cjs | Ownership, transport, input, failure and retry tests |
| scripts/verify_clarification_page.cjs | Intercepted mock-browser desktop/mobile checks |

Finance's module version stays finance-posting-v5; the added feature has separate
`PettyCashModules.clarificationVersion`, clarification-replies-v1. Fully reload
after deployment so the repeated-include guard does not retain an older instance.

Questions appear above request history. Awaiting Answer questions have a required
1-4000 character answer; Answered/Processed/Cancelled records are read-only under
Earlier questions & answers. Question/answer/message content uses plain text DOM
APIs. No expense items, receipts, outcome, balance or ledger is editable here.

`/My-Requests/?clarificationId=<guid>` highlights an OWN returned question. The
link does not authorize access, fetch another person's record or issue a write.
Invalid/unavailable links show a neutral message. Drafts survive question refresh
within the open page. No localStorage/sessionStorage is used. Reloading loses
unsent drafts and in-memory pending state; keep the page open after uncertainty.

Reads use the existing read-only Contact-scoped Request Clarification permission
and explicit public field list in [CLARIFICATION_SETUP.md](CLARIFICATION_SETUP.md).
No source approval ID, Request tracking columns or write privilege is exposed.
Foreign employee rows/paging URLs, duplicate IDs and unsupported fields are
rejected. Clarification loading/errors are independent of requests and balance.

## Configuration and transport

My Requests merges its configuration into PC_MODULE_CONFIG, preserving any
existing Finance values. Current local settings:

```javascript
clarificationsEnabled: true,
clarificationFlowId: "0a9693f4-61d8-f111-84ea-70a8a52176fd",
clarificationInputNames: { clarificationId: "clarificationId", answer: "answer" }
```

The two payload names match the titles in the now-inspected corrected schema.
The internal text/text_1 properties are used by flow actions, not this mapping.
Only this site's page flag is enabled; shared-script defaults and reusable
example stay false. Setting the page flag false hides the section and prevents
clarification reads/POSTs, without changing Finance configuration. Keep the
notification flow Off until both existing page/template sources are published.

Answers use same-origin Power Pages cloud-flow POST, CSRF,
X-Requested-With: XMLHttpRequest and form-encoded eventData. Exactly two configured
inputs are sent: question GUID and trimmed answer. Caller identity comes from
the platform trigger; the server must revalidate ownership, current question,
source/round/stage and answer state. Client checks are not authorization.

Expected synchronous Text outputs: status, clarificationid, message. Status is
answered/rejected/unconfirmed. A camel-case clarificationId alias is accepted;
the returned GUID must match. answered confirms the answer-flow handoff, not a
final decision or approval-email delivery. Unconfirmed results lock the exact
answer and other submissions until a manual same-answer retry; no auto retry.
A definitive rejected response keeps the draft but releases the pending lock.
Only answered confirmation moves a question to read-only history. During the
same page session, a stale read cannot reopen a confirmed answer.

## Publication - user reports loaded, 8 November 2026

1. User reports the two input Compose mappings, main-flow stage/round tracking,
   bounded receipt wait and Added or Modified trigger configured. Current native
   definitions/runtime are not independently inspected; no further input/flow
   recreation is instructed.
2. Copy My Petty Cash Requests.html to the EXISTING My Requests page, exact route
   My-Requests, and publish/save using the current page workflow. The local source
   already contains the site's confirmed flow URL, input titles and true flag.
3. Replace the EXISTING Petty Cash Modules Web Template's Source with the complete
   pettycash-modules.js inside ONE script wrapper. Reuse its existing page include;
   do not paste the JS into the page as well or create another template/Web File.
4. Hard refresh My Requests. It should show Questions from your reviewer, even
   when there are no questions. Check PettyCashModules.clarificationVersion equals
   clarification-replies-v1 and clarificationReady() equals true. These are local
   configuration checks, not proof of a native flow invocation.
5. The publication checkpoint is now user-confirmed. Next enable notification
   enable it for controlled end-to-end acceptance: manager/boss questions,
   wrong-account isolation, repeat reply, rejection, uncertain same-answer retry
   and no balance change during clarification. Verify actual parameter delivery,
   platform User ID, effective Authenticated Users role and backend validation
   using those controlled runs, not a client-ready flag.

No deployment was performed by the assistant; the user reports publication.
No native response/caller/permission check or live answer call was performed by
the assistant. Ordinary flow writes retain the accepted simultaneous-run limitation
in [REVIEW_HANDOFF_PLAN.md](REVIEW_HANDOFF_PLAN.md).

## First controlled native test - progress and unresolved resumption

The earlier first attempt was blocked: user reported the record saved but the manager
flow does not run. Flow checker specifically reports `hr_workflowstagev` is an
invalid filtering attribute. Correct main trigger Select columns to exactly
`hr_workflowstage`, save and confirm the flow is On before continuing. No
successful manager approval/question was confirmed at that earlier checkpoint.
No change to the UI, field allow-list or schema is needed for this typo.

The later 9 November report confirms initial approval/question visibility and
answer submission by user report; its automatic restart is missing. The test
recipe below is retained as history/expected behavior, not a request to repeat
the submission. Actual clarification notification delivery remains unverified.

Test recipe/expected results:

1. Turn ON the existing Petty Cash - Clarification Notification flow.
2. As a normal employee with the existing department/manager profile, submit a
   NEW small test request below PKR 10000 with valid items/units and receipt.
   Do not use an old pending approval run that could carry the older definition.
3. The manager selects Need Clarification and writes a real question in Comments,
   for example: Please explain what this purchase was used for.
4. The employee should receive the clarification email and open its link to their
   question on My Requests. Confirm both email and question; do not send an answer
   yet. Expected parent remains Pending/Awaiting Employee - Manager, with no new
   approved-expense transaction or balance deduction. These are expected results,
   not measured acceptance.

If either is missing, inspect that existing run's first failed action/output;
do not create repeated questions or duplicate requests to work around a failure.
Answer submission/caller/automatic manager resumption are the next test phase,
followed by boss routing, boundary, isolation, retry and ledger checks.

## Local verification

Eight added unit tests cover disabled behavior, caller/paged reads, foreign
records/links, exact CSRF/AJAX transport, invalid inputs, retry locks, response
correlation and duplicate clicks. Existing Finance regression checks remain.
Browser reply/denied-read/foreign-link cases passed on desktop/mobile with all
network intercepted, including draft retention, plain text, closed questions and
stale-read protection. Screenshots in documentation/qa/clarifications were
visually inspected. These fixtures are not production or concurrency evidence.

Reference: [Power Pages input names, authentication and eventData](https://learn.microsoft.com/en-us/power-pages/configure/cloud-flow-integration).
See also the [Microsoft worked example using input titles in eventData](https://learn.microsoft.com/en-us/power-pages/configure/image-library-how-to).
