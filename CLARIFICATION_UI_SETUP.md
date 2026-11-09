# My Requests clarification replies

## Status - 8 November 2026

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

## Next controlled native test - manager question and notification

First attempt is now blocked: user reports the record saves but the manager
flow does not run. Flow checker specifically reports `hr_workflowstagev` is an
invalid filtering attribute. Correct main trigger Select columns to exactly
`hr_workflowstage`, save and confirm the flow is On before continuing. No
successful manager approval/question or notification delivery is confirmed.
No change to the UI, field allow-list or schema is needed for this typo.

Remaining test steps/expected results:

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
