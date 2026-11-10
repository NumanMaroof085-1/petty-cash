# Website data freshness - assessment and proposed change

Status: DEFERRED by the user on 9 November 2026. Do not create the live-read
flow or implement this proposal unless the user's manager requests it and the
user resumes the work. No application or native flow change has been made.

The existing cache delay remains a documented limitation for this iteration,
not a remaining implementation task. This is a scope decision by the user,
not evidence of company acceptance or an instantaneous-data guarantee.

## Observed behavior and inspected source

User reports approval flow now running smoothly, with boss approval / Approved
shown in logs, while My Requests can still show the question as unanswered after
reload. It catches up later or after maker synchronization. This is a user report,
not a supplied HTTP trace or independently measured cache delay. Exact 10k
condition correction and financial single-post results have not been inspected.

shared/modules/pettycash-modules.js reads requests, clarifications and ledger through the Power
Pages /_api table endpoints. mountClarifications keeps confirmed answers in an
in-memory Map: confirmed flow replies cannot be reopened by stale data in the
same mounted page, but reloading destroys that Map. Thus a stale Awaiting Answer
response can present an editable question again after reload. Current backend
state/source/round checks must still reject invalid repeat answers.

Microsoft documents separate server-side caching for business tables, with
refresh within 15 minutes. Writes made by website users invalidate the relevant
table cache, but external flow writes are not guaranteed immediate reflection.
Browser hard refresh, no-store, query-string changes or repeated portal GETs
must not be represented as a supported server-cache bypass. Whole-site cache
clearing is discouraged for routine use because it can degrade performance.

## Recommendation - a live read path, with explicit scope

For promptly current My Requests data, add ONE Power Pages-invoked read-only
flow using the normal Dataverse connector. Scope initially to request and
clarification status/data needed on My Requests. Derive the employee from the
trusted Power Pages User ID; enforce ownership server-side for every returned
request/child, using explicit fields and pagination/limits. Do not accept a browser
employee ID as authorization or expose credentials/signed URLs. Role Authenticated
Users is appropriate only with this per-caller isolation. Reuse existing tables;
do not change approval/cash-write logic or widen employee table Write permissions.

The frontend would use that live result on load/manual refresh and after confirmed
answer submission, with bounded refresh where justified. Retain a confirmed
answer display while fetching authoritative fresh state. Handle errors visibly;
do not silently substitute old cached data and label it current. Show final
Approved/Rejected only from authoritative results, never infer it from answer
submission. Reads do not alter workflow stage, post expenses or clear site cache.

Ledger freshness is a separate scope choice: if included in the live snapshot,
return the caller's complete relevant ledger data (with pagination) for the
existing validated signed calculation, or implement an equally validated server
calculation. Do not switch to Contact.hr_currentbalance, omit older transactions
or drop duplicate-expense checks to make the displayed figure update faster.
No balance source change is currently implemented or silently proposed as done.

## Smaller UX-only alternative and limits

A bounded, per-contact confirmation receipt (ID/time only, no answer text) could
prevent a successfully answered question reopening across a reload. Storage
would need explicit expiry/account isolation and would be a presentation aid,
not proof of current approval state. It would not make external boss decisions
or ledger changes immediately available. Automatic refresh of cached endpoints
can improve eventual display but cannot guarantee current data. Do not claim
either alternative fully solves the server-cache problem.

## Implementation and acceptance still pending

The live read flow/schema, invocation ID, frontend integration, loading/error
states, caller-isolation tests, refresh/reload test after an answer and external
approval, and any optional ledger scope must be implemented/documented if this
recommendation is selected. No flow endpoint has been created or guessed, no
script/site setting changed, and no polling/storage added in this assessment.

References:

- [Power Pages server-side cache behavior and limits](https://learn.microsoft.com/en-us/power-pages/admin/clear-server-side-cache)
- [Power Pages Web API also uses server-side caching](https://learn.microsoft.com/en-us/power-pages/configure/web-api-overview)
- [Power Pages cloud flow integration](https://learn.microsoft.com/en-us/power-pages/configure/cloud-flow-integration)
