# Implementation and configuration log

Every implementation must update this log and its detailed setup guide in the
same change. Record exact files, functionality, schema names, permissions, site
settings, tests, and deployment state. Never describe a proposed tenant change
as deployed merely because local code or documentation exists.

## 2026-10-31 Preserve working Finance page configuration after UI publication

- User reports read-only mode after setting the flow ID; live Console explicitly
  returns flowId empty, reviewed false (Boolean), ready false. The local Finance
  HTML also still contained disabled placeholders. This confirms defaults are
  being served; live cache/include source of the overwrite is not yet inspected.
- Finance Cash Management.html now contains the previously user-confirmed native
  site invocation GUID 0b0976ac-a6d3-f111-a05d-70a8a52176fd and Boolean true review
  flag before the existing Modules include. Shared-script defaults and reusable
  example remain disabled; the example is no longer described as a page mirror.
- Added regression coverage that the actual page config enables flowReady without
  an API call, is ordered before the include, and example/missing config remain
  disabled. Updated publication guide, README and Finance setup. No transport,
  ledger, write validation, role check, flow, table/column or permission changes.
- Local unit checks and generated-style consistency pass. This does not submit
  cash or deploy the page; corrected live ready state still needs user confirmation.

## 2026-10-31 Refresh New request, My Requests, Finance and Admin UI

- User authorizes a modern, simpler UI across all four working pages, with
  existing functionality preserved. Login/header/footer/home remain for later.
- Introduced scoped pettycash-ui.css and scripts/build_ui_styles.cjs. Generated
  CSS is embedded in all four page fragments; no new tenant asset/template is
  needed. Added UI_REFRESH_SETUP.md with exact publication steps and live Finance
  config preservation; defaults remain blank/false in the local Finance fragment.
- Simplified page and routine success/ready instructions, retained visible error
  and pending references/recovery guidance, moved longer tips into details.
  Reworked balance cards, grouped forms, table styling and mobile item, request
  and transaction cards; statuses/amounts stay visible without scrolling sideways.
  Labels/options retain saved values, IDs and event handlers. Added named inputs
  and remove buttons to request-created/reset rows and kept canonical/inline
  request scripts synchronized; only labels and suggestion copy changed there.
- pettycash-modules.js version finance-posting-v5 adds local request search/status
  filtering, loaded-set counts, result counts, plain-text status badges, clear
  empty states, disabled filters/unavailable counts on read failure and recovery.
  No extra API calls for filtering. Ledger calculations, flow transport/payload,
  pending-key state, own-account restriction and authorization gates unchanged.
- pettycash-admin.js version admin-profiles-v3 adds shorter routine messages,
  Saving state and authorized explicit form display for Studio's inline hiding.
  Seven fields, credentials separation, write/readback and retry logic retained.
- Receipt selection and PDF-ready messages shortened; regenerated Petty Cash
  Receipts.html from unchanged pinned jsPDF and the local receipt module. No
  conversion, limit, output-byte or upload behavior changes.
- Added scripts/verify_ui_pages.cjs for all four layouts at 1440/768/390/320px,
  host control isolation, visible control names, keyboard focus/reduced motion,
  filter semantics/no API calls, counts, refresh, untrusted text and error recovery.
  Updated existing Admin QA assertions for version and concise success wording.
- Local validation: 132 unit checks; 13 Finance, seven Admin, four shared-page
  browser states; suggestions and receipt PDF/upload/retry browser suites; four
  responsive UI cases. Reviewed generated desktop/mobile screenshots. All data
  synthetic, requests intercepted; no live site/flow/data writes or deployment.
- No schema, web role, site setting, table permission or flow changes. Existing
  manager-approval duplicate-guard guidance remains a separate pending task.

## 2026-10-31 Guide existing approved-expense lookup and creation gate

- User asks to implement the first approval recommendation and reports adding
  a condition before the approval action. MANAGER_APPROVAL_FLOW.md now guides
  write-time placement in approval outcome True, before/outside For each 1.
- Add Find_Existing_Expense on Cash Transactions filtered by the triggering
  request's Linked Request GUID and Expense Approved type 123140001, row count
  2, relevant comparison columns selected, pagination off. It also catches
  existing unkeyed expenses.
- No_Existing_Expense compares length(value) to numeric 0. Yes contains the
  existing approved For each 1/actions; no approved writes may remain after the
  shared join. No temporarily terminates Cancelled OUTSIDE a loop pending
  existing-row verification, rather than blindly declaring success.
- Stable expense posting key still required for concurrent runs; installation
  is not reported. Contact-summary action is not assumed removed. Native run,
  matching existing expense comparison and final behavior remain pending.
- Microsoft List rows field/filter guidance checked; docs only, no new table,
  column, frontend, tenant action/write or test execution. Diff checked.

## 2026-10-31 Self-posting installation reported; recommend approval posting keys

- User reports Finance condition and new script installed. Updated self-posting
  guide/flowchart/setup status accordingly; native denial tests remain unverified.
- User confirms approval-created cash transactions have no posting keys.
  Verified source: balance reader does not select posting key; it totals amounts
  by type and detects duplicate approved expenses using Linked Request.
- MANAGER_APPROVAL_FLOW.md now recommends setting crec6_postingkey through fx
  to concat('expense-', toLower(triggerBody()?['hr_pettycashrequestid'])) for
  the request trigger, reusing the same request-derived key on every replay.
  Existing Active Text key is shared; Finance's UUID/length-36 parser unchanged.
- Recommended same-request expense lookup/compare before create to catch old
  unkeyed rows, and preserving unique-key protection for concurrent runs. Legacy
  rows still count; backfill existing row only after one-row-per-request review,
  never recreate/reapprove expenses to fill keys or silently remove duplicates.
- Flagged that current Contact-summary subtraction occurs before cash insert;
  duplicate-key failure cannot undo that earlier side effect. Recommend removing
  the unused incremental summary action or reconciling it separately. No tenant
  action/data changed. Currency, receipt readiness and exact expressions remain
  separate verification items.
- Microsoft alternate-key uniqueness/null behavior and expression references
  checked. Documentation only; no new code/schema/permission changes or runtime
  tests. Recommended approval edits are not reported implemented.

## 2026-10-31 Implement Finance self-posting restriction and record approval flow

- User reports the latest pre-v4 script published, shares the separately built
  manager approval flow and requests self-posting work next. Applied the prior
  recommended policy to both Add and Cash Returned; own viewing stays allowed.
- Canonical pettycash-modules.js is finance-posting-v4. UI disables own cash
  fields/Post and estimates with an explanatory notice; own ledger/history/
  Refresh and selecting others stay available. postMovement rejects normalized
  employee/actor equality before nonce/token/POST. No client bypass flag.
- Finance Cash Management.html contains pcFinanceSelfPostingNotice. Helper
  creates it on legacy deployed HTML, so a template-only deployment preserves
  the user's existing live config. Default local gates stay blank/false.
- Added FINANCE_SELF_POSTING_SETUP.md: one native Is_Self_Posting condition at
  the start of Actor_Is_Active Yes; cloned early rejected response uses trigger
  tokens (later Compose outputs unavailable), Terminate in Yes, No empty,
  existing validation below whole condition. This server step is instructed,
  not deployed/verified. No new table/column/role/site setting.
- Tests pass: all 132 unit tests, 13 mocked Finance browser states and 4 shared
  pages. Covers both self directions through helper, own read/refresh, switching
  to another employee, legacy HTML, repeated includes and existing retries.
  Corrected the initial test's fieldset isDisabled matcher to inspect the actual
  disabled property and child input; production behavior was already correct.
- Added MANAGER_APPROVAL_FLOW.md from user screenshots: manager/request/employee
  reads, receipt download/Compose/approval, approved status + summary update +
  Expense Approved transaction, rejected status. Six visible transaction fields
  recorded; expressions, currency/key, trigger details and runtime are unverified.
  Highlighted request-header-before-lines/receipt readiness, one expense per
  request, stable dedupe/currency and summary consistency as later review items.
  No user approval actions deleted/rebuilt; website still uses ledger only.
- Updated FINANCE_FLOWCHART.md, FINANCE_FLOW_SETUP.md, FINANCE_SETUP.md,
  BALANCE_MODULE_SETUP.md and README.md. Frontend/guide completion is distinct
  from pending v4 deployment/native self-denial checks. No tenant writes by
  assistant, no messages/emails sent or financial movements executed.

## 2026-10-30 Document current Finance flowchart and manager handoff

- User requests a flowchart for understanding and asks whether Finance is
  complete before starting manager approval.
- Added FINANCE_FLOWCHART.md: Mermaid diagram covering website input, native
  Finance authorization, employee/caller/input/key validation, create-or-reuse,
  durable read-back/comparison, success/failure responses, and separate website
  ledger calculation/refresh. Includes exact guided action mapping, signs,
  operator audit, unchanged Contact summary and same-key retry explanation.
- Diagram shows the actual simpler design, not the removed in-flow ledger
  loop or unimplemented self-posting rule. Unexpected failures remain
  unconfirmed; no blanket catch/finalizer is invented.
- Completion checklist distinguishes implemented/user-reported core Finance
  behavior from pending self-posting policy/implementation, latest query-cap
  fix publication and controlled live return/retry/access/concurrency checks.
  Manager approval can begin independently; Finance is not production-signed-off.
- Added links in FINANCE_SETUP.md, FINANCE_FLOW_SETUP.md and README.md.
  Microsoft flow integration and Run after references checked. Docs only;
  no frontend/flow/schema/permission/data changes or new live tests.

## 2026-10-30 Finance balance discrepancy resolved after hard refresh

- User confirms read-only Finance API returns all three transactions, then
  reports hard refresh restored the correct logs and balance. Record the
  observed discrepancy as resolved, without claiming a particular cache layer
  or fresh financial data mutation was verified.
- Updated FINANCE_FLOW_SETUP.md and FINANCE_SETUP.md with the outcome. No extra
  cash transaction, Contact summary update, flow/code/permission change or new
  runtime test is required for this status update. The independent large-ledger
  cap fix remains locally tested; deployment is not separately confirmed.
- Self-posting remains unimplemented/proposed. Existing broader live test
  limitations remain. Documentation diff whitespace checked.

## 2026-10-30 Investigate Finance-only wrong balance; remove ledger result cap

- User reports three transactions, expected +100, latest +100 missing on Finance
  while other pages show correct balance. Requested read-only API-row sum vs
  DOM balance, widget count, version and pending state to distinguish stale
  reads from deployed UI behavior. Root cause not yet established.
- Verified signed calculation uses agreed types. Found independent query
  defect: cashTransactions used $top=100 as if it were a page-size setting;
  OData instead limits the whole result. Removed the ledger-only limit and
  retained the existing nextLink/origin/100-page safety checks. No directory
  or request query changes, Contact writes, flow changes or cash mutations.
- Added a meaningful 101-row regression that models actual $top truncation.
  Passed all 131 unit tests and 11 mocked Finance browser states. This cap fix
  affects larger histories and does not explain the user's three-row case.
- Microsoft documents portal per-user data caching and non-immediate workflow
  write visibility; this is a diagnostic possibility, not a confirmed cause.
  Do not refresh away a pending key, repeat cash, or force Contact totals to
  mask the discrepancy. User's raw read diagnostic remains outstanding.
- Updated FINANCE_FLOW_SETUP.md and FINANCE_SETUP.md; deployment/current
  Finance balance remains unverified. Diff whitespace checked.

## 2026-10-30 User reports working Finance posting; discuss self-posting

- User reports the preceding step working and asks about balance changes and
  preventing Finance users from increasing their own balance. Record this as
  user-observed success, not independently verified rows/run/amounts or all
  financial tests complete.
- Verified local source: cash_given adds and cash_returned subtracts through
  Cash Transaction rows; displayed balances are ledger-derived. This flow does
  not update Contact.hr_currentbalance. Expense-approval posting remains a
  separate backend task.
- Verified current client has no self-posting check. FINANCE_FLOW_SETUP.md
  records a proposed native employee-versus-actor check plus matching UI.
  Recommendation: another Finance user handles both Add and Returned for the
  operator's own account; this broader policy is not yet selected/implemented.
- Discussion/docs only, no frontend/flow/schema/permission changes or new tests.
  Microsoft site flow role authorization reference checked; diff verified.

## 2026-10-30 Flow starts; correct Parse_Posting_Key expression entry

- User reports an actual flow run and HTTP 200 rejected response after transport
  repair. Current pending key is 5817c32c-5480-4dc9-a164-de75a96435f1 (different
  from earlier HTTP 500 key); preserve the current page's operation.
- Parse_Posting_Key failed InvalidJSON, unexpected 'a' at position 0; parallel
  rejection/Terminate executed. No successful cash posting is reported.
- FINANCE_FLOW_SETUP.md / FINANCE_SETUP.md now instruct clearing Content and
  committing addProperty(json('{}'),'postingKey',outputs('Posting_Key')) through
  the Expression/fx tab. The character matches a literal function string but
  actual Content has not been inspected; describe this as an inference. Keep
  the length-36 object schema and failure/success run-after unchanged.
- Permanent shared-template publication remains necessary; management tab can
  be updated without reloading the still-pending Finance page. After flow save,
  user can retry the same current movement/key. No new browser transport code,
  modules, schema, role, columns or tenant writes by the assistant in this step.
- Microsoft addProperty and Parse JSON references checked; documentation diff
  verified. Existing local test results unchanged; tenant correction/save and
  successful movement outcome remain pending.

## 2026-10-30 Repair pre-trigger Finance HTTP 500 transport

- User confirms the earlier site route matches, then reports a POST 500 with
  pending key 9eb9ba6f-71da-4dda-82b3-492fde257399 and no matching flow run.
  Response HTML is the generic Power Pages error page, correlation
  01ee3f96-c050-4f54-9cac-21f9e739ed38, empty RTGE01 error. No known sign-in
  cause, cash row or executed flow action is inferred.
- Found missing required X-Requested-With: XMLHttpRequest in the canonical
  fetch POST. Microsoft power-pages-samples documents a masked 500/no-run for
  this omission. Added the header with CSRF/credentials/eventData unchanged.
  Also accept documented lowercase response field names while preserving
  HTTP/status/key/employee/saved GUID confirmation checks and ignored balance.
- Non-JSON API errors now retain HTTP status instead of asserting a sign-in
  problem, without copying raw HTML/private response contents. Error paths
  retain the pending key and never automatically resubmit.
- Added scripts/repair_open_finance_page.js for the still-open pending page:
  install sends no requests, exact flow-route wrapper preserves original body,
  CSRF and key, adds header and aliases actual returned field names. This lets
  the user explicitly retry the original movement without a reload/new key.
  Permanent shared-template publication follows resolution of the pending item.
- Tests passed: all 130 unit tests, including 26 module tests and the exact
  console repair against a simulated old loaded helper; 11 mocked Finance
  browser states enforce header and lowercase replies. Corrected a CRLF-sensitive
  test fixture after its first failure. No live invocation/financial writes or
  actual root-cause resolution claimed. Source version remains v3.
- Updated FINANCE_FLOW_SETUP.md, FINANCE_SETUP.md and README.md. No flow/role/
  column/site-setting changes; local gates remain disabled. User may apply the
  pending-page repair and report the retry outcome. Diff whitespace checked.

## 2026-10-30 Distinguish Finance maker ID from site invocation ID

- User supplies make.powerautomate.com details URL: environment
  61901d93-5934-e60d-bf80-14e618d0e242, maker flow
  ac94fb2d-b491-3d0c-0ab8-f3431a5c7e57, questioning the earlier route GUID.
- Confirmed from local source that financeFlowId is appended to the native
  Power Pages /_api/cloudflow/v1.0/trigger/ route. Microsoft documents the
  site-associated invocation URL is generated when adding a flow to the site.
- FINANCE_FLOW_SETUP.md now explicitly distinguishes the two identifiers and
  requests the CURRENT site's Cloud flows URL before test activation. Earlier
  site GUID 0b0976ac-a6d3-f111-a05d-70a8a52176fd remains screenshot evidence,
  not independent proof of the current association with the maker flow.
- No config substitutions, association changes or cash tests performed. Docs
  only; no code/permissions/tenant writes. Existing draft inputs/key, if any,
  remain preserved.

## 2026-10-30 Guide controlled Finance tenant test activation

- User reports the shared-template and final confirmation-response steps done;
  no actual native response, cash row or refreshed balance has been supplied.
- FINANCE_FLOW_SETUP.md / FINANCE_SETUP.md now guide temporary live page config
  for the first controlled test, reusing previously supplied site route GUID
  0b0976ac-a6d3-f111-a05d-70a8a52176fd if still current. Preserve Finance-only
  site flow role, verify v3, leave other config intact. Canonical local defaults
  stay blank/false. No assistant tenant mutation or production activation.
- Test: designated test employee, note B, Add 100 once, expect one row and B+100;
  inspect employee/operator/key/reference/type/amount and retain the original
  pending operation on uncertainty. Saved-but-refresh-failed uses GET only.
- Clarifies test unlock is needed before posting tests; it does not establish
  production readiness. Return/retry/concurrency/role-denial tests remain next.
- Microsoft native site flow integration/role association reference checked;
  documentation-only diff check, no new code/schema/permissions or runtime test.

## 2026-10-30 Implement separate Finance posting confirmation and balance refresh

- User reports removing in-flow ledger scanning/calculation. Updated canonical
  pettycash-modules.js to finance-posting-v3. A matching HTTP 200 / posted / key /
  employee / transaction GUID confirms the durable posting independently of
  the old balance field; the returned object excludes that field entirely.
- Finance clears the confirmed draft/key, then reloads the existing employee
  ledger/history. No returned placeholder/old balance is displayed. Failed or
  invalid ledger refresh shows Unavailable plus saved confirmation; manual GET
  refresh preserves that confirmation, does not POST cash again, and permits
  a fresh draft only after a valid balance is loaded. Same-key retry remains
  locked for transport/status/identity failures. Same-version duplicate include
  guard and Finance-only/read-only behavior remain.
- Extended module unit and browser tests: acceptance without balance, ignored
  legacy/placeholder balances, wrong response status/IDs/key still rejected,
  automatic history refresh, failed/invalid refresh and manual GET recovery.
  Also verified a second, unconfirmed movement retains its own key and error
  message through ledger refresh; an older saved confirmation cannot replace
  that pending result. Two separate movements get separate keys and each
  committed-but-unconfirmed retry still creates only one mocked ledger row.
  Passed all 127 unit tests, 11 mocked Finance browser states and 4 shared-page
  states, plus diff whitespace checks. Browser launch required sandbox elevation;
  runs used intercepted mock APIs only, no tenant reads/writes.
- Updated FINANCE_FLOW_SETUP.md current final Posting_Confirmed action guide:
  copy the existing six-output response into Saved_Row_Matches Yes, status
  posted, current key/employee/saved GUID, Number balance 0 solely for schema
  compatibility, message Cash movement recorded. Existing rejection schemas
  stay unchanged. No new sum/variables or Contact balance writes.
- Updated FINANCE_SETUP.md, BALANCE_MODULE_SETUP.md and README.md. Deployment
  requires replacing existing Petty Cash Modules template Source script with
  v3; no page HTML/identity/receipt template, columns, roles or permissions
  change. Local flow ID and review flag remain blank/false. Tenant final save,
  output naming/native caller, authorization, concurrent retry and real cash
  testing/deployment remain unverified. User will configure the final response.

## 2026-10-30 Simplify Finance posting; remove in-flow balance scan

- User accepts the simpler save/confirm then website balance-refresh approach
  and requests exact flow actions to remove. Prior full-history validation was
  more than needed to acknowledge one Finance movement.
- FINANCE_FLOW_SETUP.md records the manual removal order: Each_Ledger_Row and
  its children, Ledger_Is_Complete and its children, List_Ledger, then the four
  calculation variable initializers. Keep vActorId, input amount validation,
  all role/caller/input/key/create/recovery checks and Saved_Row_Matches.
- FINANCE_SETUP.md and README.md now identify the old full-ledger flow recipe
  as superseded. No Dataverse rows/columns or permissions are removed.
- Local source inspection confirms finance-ledger-v2 still requires/displays
  response.balance. Frontend and success-response adaptation remain pending;
  never supply posted plus a placeholder zero to the old UI. Posting gates
  remain disabled. Rejection schemas stay identical and unchanged for now.
- Documentation-only change; no actual tenant action deletion, frontend code
  change, successful cash run or balance result is claimed. Diff checked.

## 2026-10-30 Check missing or repeated approved-expense references

- User reports basic ledger-row validation and invalid-state setter added;
  runtime execution and financial results remain unverified.
- FINANCE_FLOW_SETUP.md now guides normalized Expense_Request_Id Compose and
  two sibling conditions in Row_Is_Valid Yes: Expense_Link_Is_Invalid sets
  vLedgerValid false for an expense with missing/repeated request; Remember_Expense
  appends only valid expense references to vSeenExpenseRequests.
- Keeps given/returned movements independent of request links, prevents double
  expense counting, avoids extra nested conditions and never resets invalid
  history to valid. Signed summation/presence/final confirmation remain next.
- Documentation-only change; Microsoft variable reference consulted and diff
  whitespace checked. No frontend/schema/permission changes, tenant writes,
  verified run or website posting enablement.

## 2026-10-30 Validate rows before including them in Finance balance

- User reports four calculation variables and sequential loop/validity guard
  added; no tenant run or balance calculation result supplied.
- FINANCE_FLOW_SETUP.md now guides Row_Scaled_Text, Row_Cents and Row_Is_Valid
  inside Ledger_Still_Valid Yes, reusing the existing full row expression for
  positive exact cents, safe range, matching employee/currency and known type.
- Invalid rows set vLedgerValid false; no Return/Terminate inside the loop.
  Later duplicate-expense checks and sum belong in Row_Is_Valid Yes. Conversion
  errors must fail without confirmation, never substitute a zero amount.
- Microsoft expression reference consulted; documentation diff checked. No
  runtime verification, frontend/schema/permissions/tenant writes or posting
  enablement. Expense checks, summation and final result remain pending.

## 2026-10-30 Initialize Finance ledger calculation state

- User reports complete-history read and its guard done; runtime results and
  cash posting remain unverified.
- FINANCE_FLOW_SETUP.md now guides four top-level variable initializations:
  vBalanceCents Integer 0, vSeenExpenseRequests Array [], vPostedRowSeen Boolean
  false, vLedgerValid Boolean true. Existing vActorId remains; avoid duplicates
  and initialization inside conditions/scopes.
- Added guided sequential Each_Ledger_Row loop after the completeness guard,
  input List_Ledger.value, with Ledger_Still_Valid condition and empty branches
  pending row checks. No Terminate inside loop; invalid history is rejected
  after it. Calculation/confirmation and success response are not complete.
- Microsoft variable scope and loop concurrency guidance checked. Documentation
  only, whitespace verification; no tenant run, new columns/permissions,
  frontend changes or website posting enablement.

## 2026-10-30 Load complete employee ledger in guided Finance build

- User reports Saved_Row_Matches and its rejection path done. No live run,
  saved transaction, amount change or returned balance has been shown.
- FINANCE_FLOW_SETUP.md documents List_Ledger below the whole comparison guard:
  employee-only filter, all transaction types/history, explicit stable ordering,
  selected ledger fields, no Row count, pagination threshold 100000.
- Added guided Ledger_Is_Complete check for count below cap AND empty nextLink,
  cloned unconfirmed response and terminating No branch. Microsoft documents
  that pagination can omit nextLink at a threshold; both checks are needed.
- Summation variables/loop, row validation/presence and success response remain
  pending. Documentation-only change; no Contact writes, website gate changes,
  new permissions/schema or tenant execution. Verified diff whitespace.

## 2026-10-30 Compare recovered Finance event

- User reports the one-row stopping guard and Saved_Row added. No flow run,
  stored transaction or balance result is supplied.
- FINANCE_FLOW_SETUP.md now guides Saved_Row_Matches with the existing full
  event/operator/currency/amount comparison, followed by a cloned six-output
  conflict response and Terminate in No. Yes stays empty to preserve sequential
  guards. No mutation/rollback claims; a zero response balance is a placeholder.
- Whole-ledger reading and confirmation remain pending. No undefined variables
  introduced, no frontend/tenant/schema/permission changes, no posting enabled.
  Microsoft expression reference consulted; documentation-only verification.

## 2026-10-30 Wire one-row recovery guard

- User reports the recovery scope, lookup and One_Saved_Row setup done; no run
  results or cash posting supplied.
- Updated FINANCE_FLOW_SETUP.md with a cloned six-output unconfirmed response
  and Terminate Succeeded in One_Saved_Row No. Balance 0 remains a failure
  placeholder. Yes stays empty; only after No terminates, add Saved_Row Compose
  below the whole condition using first(body('Resolve_Key')?['value']). This
  preserves a sequential success path without adding nested Yes conditions.
- Saved-event comparison remains next. No variables, schema/permissions,
  frontend code, tenant writes or website posting gates changed. Documentation
  checked against Microsoft action-copy and expression references; no runtime
  verification claimed.

## 2026-10-30 Continue Finance flow after schema repair

- User reports the previous step done and requests continuation. Record the
  save repair as user-reported; no tenant run, generated reference or cash
  posting verified.
- Documented the next guided actions in FINANCE_FLOW_SETUP.md: Resolve_Posting
  scope after the whole Is_New_Posting condition, run after success/failure/
  timeout only; Resolve_Key read with escaped key filter and row count 2;
  One_Saved_Row condition requiring numeric count 1. Branch wiring/comparison
  remain next; keep website posting disabled and do not test cash yet.
- Documentation only. Microsoft run-after and List rows references checked;
  no application, tenant configuration, schema or permission change.

## 2026-10-29 Parse JSON pattern rejected by connector workflow

- User reports ActionSchemaNotSupported for Parse_Posting_Key pattern or
  patternProperties with OpenApiConnection. The supplied regex schema was
  incompatible; no successful cash run/autonumber conversion inferred.
- Replaced regex with required String minLength/maxLength 36 in the posting-key
  recipe and finance-cash-request.schema.json (also employeeId). Explicitly
  document this as text length/type validation, not full UUID syntax; native
  Contact lookups validate IDs. Frontend UUID generation is unchanged.
- Updated Find_Key and future Resolve_Key filter expressions to double internal
  apostrophes before quoting the OData string literal. No query/create may run
  after a failed validation/query. Text keys remain deduplicated by the existing
  Active unique key plus full event/operator comparison; no financial guard or
  role grant removed. Removed the unused Parse_Actor regex instruction.
- Updated FINANCE_FLOW_SETUP.md, FINANCE_SETUP.md and README.md. This repairs
  schemas/query guidance without new flow actions or frontend/site changes.
  Actual flow Save/enforcement/read behavior remains pending tenant verification.
- Local checks passed: 22 shared-module tests; regex-free request schema and all
  three guide JSON examples; four escaped-filter literal round-trips including
  apostrophe/query-like text; key type/length boundaries; git diff --check.
  The expression was checked locally with its string-function subset, not run
  in Power Automate or against Dataverse. No live Save/run success claimed.

## 2026-10-29 Transaction Reference autonumber format recommended

- User explicitly requests conversion of the existing column to Autonumber and
  asks for its format. Recommended Custom CT-{SEQNUM:6}, seed 1 if no existing
  CT references, otherwise above the highest existing CT sequence number.
  Examples CT-000001/CT-000002; no fixed seed assumption for populated history.
- Reuse hr_transactionreference; no duplicate column or replacement of
  crec6_postingkey. Save/publish and reopen editor; connector required-field
  resolution and generated reference remain unverified. No requirement-level
  relaxation, action-table switching or cash test instructed.
- Updated FINANCE_FLOW_SETUP.md. Conversion not yet reported complete; no
  assistant tenant write, application change or runtime test.

## 2026-10-29 Create action reports Transaction Reference required

- User reports Transaction Reference required in Create_Cash. Exact validation
  (designer label, save error or runtime) and column settings are not supplied.
  Prior leave-empty advice relied on the documented primary-name Autonumber;
  actual data type/requirement must be checked rather than assumed.
- Request Data type and Required settings for hr_transactionreference in Power
  Apps Columns. No dummy/manual reference, unverified null bypass, requirement
  relaxation, type change or cash test instructed.
- Updated FINANCE_FLOW_SETUP.md current issue and reference mappings to flag
  the unverified assumption. Documentation only; no code, tenant write or tests.

## 2026-10-29 Fixed PKR ID supplied; cash create action prepared

- User supplied f8719944-3bac-f111-aaab-70a8a52176fd as PKR Currency record GUID.
  Checked GUID syntax only; no tenant currency/state/precision/access inspection.
- Replaced currency placeholders in FINANCE_FLOW_SETUP.md create and comparison
  expressions, updated FINANCE_SETUP.md and resolved stale pending-ID wording.
  Fixed lookup value transactioncurrencies(f8719944-3bac-f111-aaab-70a8a52176fd);
  no currency query/count/new constant action added to the guided flow.
- Next instructed action: Create_Cash Add a new row inside Is_New_Posting Yes,
  full header/lookup/Choice/amount/key/operator/currency mapping, Retry policy
  None. Uses existing Input_Amount and Get_Actor.contactid so no unbuilt Parse_Input
  or Actor_Id Compose is referenced by this guided create. Autonumber and linked
  request left unset; No branch stays empty pending common recovery/read-back.
- Configure/save only until remaining backend is complete; no cash test or page
  enablement yet. Is_New_Posting completion and Create_Cash are not inferred from
  the ID response. Documentation only; no code/tenant writes or runtime tests.

## 2026-10-29 Amount column screenshot is not the PKR record ID

- User asks if hr_Amount/hr_amount column metadata is the requested currency
  GUID. Clarified column logical name versus existing PKR Currency row ID
  (transactioncurrencyid). Actual PKR record ID remains unprovided.
- Added one-time navigation: Power Platform admin center > Manage > Environments
  > selected environment > Settings > Business > Currencies, open PKR and copy
  the record GUID from its URL. No column change, currency creation or runtime
  PKR query instructed. Is_New_Posting completion/run is still unverified.
- Updated FINANCE_FLOW_SETUP.md. Documentation only; no app code, tenant
  mutation, financial write or tests.

## 2026-10-29 Fixed-currency approach accepted; new-key condition next

- User reports all previous steps complete excluding PKR actions. Recorded as
  reported progress, not query/flow execution verification.
- Next guided action: Condition Is_New_Posting below Find_Key on parser-success
  branch; compare row count to numeric 0. Keep branches empty until create/retry
  handling is configured. Existing key is never sufficient proof of success.
- Simplified FINANCE_FLOW_SETUP.md: remove runtime PKR query/count from canonical
  recipe, use a one-time verified currency GUID in create/comparison expressions,
  and let Is_New_Posting Condition be the create/recovery boundary (no redundant
  wrapping scope). Updated run-after references and FINANCE_SETUP.md. Historical
  runtime-query instructions marked superseded. Actual PKR GUID still needed.
- No frontend/config changes, tenant mutation, cash posting or runtime tests.

## 2026-10-29 Currency complexity questioned; one-time PKR setup recommended

- User asks what PKR lookup does and whether repeated checks are necessary.
  Explain the Currency column associates an amount with a row currency; no new
  currency conversion feature is needed for this single-currency portal.
- Recommended simplification: verify actual active PKR record/precision once,
  explicitly configure its fixed currency ID for transaction creates and ledger
  checks, rather than List_PKR/count on every request. Do not rely on an unknown
  connection default or guess the GUID. Core validation/deduplication remains.
- Added a discussion note to FINANCE_FLOW_SETUP.md pausing the prior dynamic
  currency lookup instructions. No flow deletion, frontend/config/permission
  change, financial write or runtime test. Actual PKR GUID still unprovided.

## 2026-10-29 Cash Transaction ID and operator column names supplied

- User supplied primary GUID hr_cashtransactionid and Recorded By lookup
  hr_recordedby. Replaced schema placeholders throughout FINANCE_FLOW_SETUP.md;
  expected lookup read property _hr_recordedby_value is derived, pending actual
  connector read verification. No duplicate lookup/table creation instructed.
- Next batch: expand Find_Key's selected columns using confirmed names; add
  List_PKR for active PKR currencies (bounded 2 rows), then PKR_Count_Is_Valid
  requiring exactly one match. Leave new guard's branches empty until rejection
  handling. The PKR record ID and precision are not assumed.
- Updated FINANCE_SETUP.md and WEBAPI_SITE_SETTINGS.md to record names and keep
  operator/key backend-only. Find_Key execution and new actions are not inferred
  from metadata answers. No app/config/permission change, tenant mutation by
  assistant or financial posting. Documentation only.

## 2026-10-29 Finance key routing reported added; bounded key query next

- User reports Employee_Id successful branch and Reject_Invalid_Key parallel
  response/Terminate branch added. No branch graph or run inspected.
- Next instructed action: Dataverse Find_Key List rows below Employee_Id only,
  Cash Transactions, select crec6_postingkey, filter by validated Posting_Key
  with quoted OData string, Row count 2. No employee-wide/unfiltered ledger read.
  Presence is not proof of an identical event; compare full saved data later.
- Request actual Cash Transaction primary GUID logical name and Recorded By
  Contact lookup logical name/status before preparing writes. Expand Find_Key
  later with those mappings; no guessed schema or new key.
- Updated FINANCE_FLOW_SETUP.md checkpoint and section 9. Documentation only;
  no query/run verification, financial posting, code/permission/config change.

## 2026-10-29 Finance key parser reported added; explicit failure routing next

- User reports Input_Key, Posting_Key and Parse_Posting_Key added. No parsing or
  invalid-input behavior tested in tenant.
- Next batch: Employee_Id Compose from Get_Employee.contactid after parser
  success ONLY; a sibling parallel Reject_Invalid_Key canonical response on
  parser failed/timed-out ONLY, followed by Terminate Succeeded within that
  failure branch. Future financial work goes below Employee_Id, never after a
  skipped catch or unconditional merge. Retain the six-output schema unchanged.
- Updated FINANCE_FLOW_SETUP.md with exact expressions, Run after states and
  branch placement. New routing not yet reported built; no app/permission change,
  financial write, test execution or posting enablement.

## 2026-10-29 Finance trigger names visibly corrected; key format next

- User screenshot now shows the five requested trigger names on the left with
  correct input type icons. Right-side input1-input5 are descriptions; no further
  rename needed. Raw schema/token/runtime mapping still has not been inspected.
- Next guided batch: Input_Key Compose from postingKey token, normalized
  Posting_Key Compose, and Parse_Posting_Key with an object containing the key
  and a required canonical GUID pattern. The object wrapper avoids treating an
  unquoted GUID as JSON text. No lookup/write before validation succeeds.
- Updated FINANCE_FLOW_SETUP.md with exact Content/Schema and pending failure
  handling. Format validation is not deduplication; lookup, unique-key recovery,
  currency and ledger stages remain incomplete. No app code, permissions, cash
  posting or runtime verification by assistant.

## 2026-10-29 Finance trigger screenshot reveals names in description boxes

- User reports latest batch done (Valid_Amount No response/Terminate, Notes and
  Movement_Type) and supplies trigger screenshot. Left names visibly remain
  Input/Input 1/Number/Input 2/Input 3; intended employeeId/movement/amount/notes/
  postingkey text appears in the right-hand prompt/description fields.
- Instruct correction of existing left names to employeeId/movement/amount/notes/
  postingKey, preserving Text/Text/Number/Text/Text types and input identities.
  No delete/recreate, Compose action rename or guessed raw-property change.
  Save/binding/runtime confirmation is still pending; key wiring waits.
- Updated FINANCE_FLOW_SETUP.md checkpoint and trigger setup instructions to
  distinguish name versus description and exact camelCase. No app code, tenant
  mutation by assistant, tests or cash posting.

## 2026-10-29 Finance role association and Valid_Amount reported complete

- User reports Finance-only flow association done and Valid_Amount condition
  created. No role-denial test, underlying trigger schema or amount execution
  supplied; website posting gates remain off.
- Next batch: clone canonical six-output rejection into Valid_Amount No, change
  message body value only, Terminate Succeeded; then sibling Notes and
  Movement_Type Compose actions below the whole guard inside actor Yes.
  Movement_Type uses confirmed Choice values 123140000/123140002 after the
  earlier allowed-movement guard. New actions are not yet reported added.
- Request trigger-input screenshot before posting-key wiring because earlier
  tokens were labeled Input and Input 3; exact website-facing names/mappings
  remain unverified. Updated FINANCE_FLOW_SETUP.md; no frontend/tenant mutation,
  tests or financial posting performed by assistant.

## 2026-10-29 Finance flow saves; Finance-only association instructed

- User reports flow saving succeeds. Add cloud flow dialog visibly lists Petty
  Cash - Finance Cash Movement, no selected roles, and native site trigger GUID
  0b0976ac-a6d3-f111-a05d-70a8a52176fd. Successful site association/run is not yet
  reported; no underlying schemas were supplied to identify the prior mismatch.
- Instructed Add roles > Petty Cash Finance ONLY, then confirm dialog. Preserve
  the intended employee/other-role exclusion; role binding alone does not certify
  the unfinished financial backend.
- Updated FINANCE_FLOW_SETUP.md status. Local financeFlowId remains blank and
  financeSecurityReviewed false; no frontend edit, tenant mutation by assistant,
  run verification or cash posting.

## 2026-10-29 Finance rejection card screenshot reviewed

- Screenshot shows the expected six output names; balance has the Number icon,
  the other five have Text icons. Rejected status, empty transactionId, zero
  failure placeholder and employee-inactive message are visibly appropriate.
- postingKey uses token labeled Input 3; employeeId uses Input. Their actual
  trigger mappings and request input names remain unverified, as do other Return
  schemas and successful saving. Confirm mappings before using this as the clone
  source; visible field agreement alone does not certify the whole flow.
- Updated FINANCE_FLOW_SETUP.md. Documentation only; no code, tenant operation,
  financial posting or tests performed.

## 2026-10-29 Finance flow save blocked by response schema mismatch

- User reports ActionSchemaInvalid: response schemas sharing HTTP 200 must match.
  Exact offending action/property is uninspected; amount-batch completion is not
  inferred from this error. Pause further flow construction until Save succeeds.
- Confirmed local pettycash-modules.js already validates positive finite amounts,
  up to two decimals/safe cents, movement and notes. Frontend validation remains
  present; server validation protects the actual financial write boundary.
- Updated FINANCE_FLOW_SETUP.md: canonical six-output response, classic-designer
  Copy to my clipboard to replace other Return cards, change message body values
  only, preserve branch/Terminate wiring; inspect only inputs.schema if unresolved.
  Requirement comes from the supplied save error; no culprit/repair verified yet.
- Documentation only. No frontend rewrite, tenant mutation, financial write,
  posting enablement or runtime test performed by assistant.

## 2026-10-29 Finance basic-input condition reported added; exact cents next

- User reports the three input Compose actions and Basic_Input_Is_Valid added.
  No actual payload/condition execution inspected.
- Next batch: Basic's No rejected response/Terminate; then sibling Compose
  Amount_Scaled_Text and Amount_Cents below the whole Basic condition (still
  within actor Yes), followed by Valid_Amount checking positive safe integer
  cents and exact decimal equality. Leave the new guard's branches empty until
  the next instruction. This avoids nesting every new validation in its own Yes.
- Updated FINANCE_FLOW_SETUP.md with the guided source Input_Amount and placement.
  UUIDs, field limits, currency, duplicate recovery and exceptions remain unbuilt.
  Documentation only; no runtime tests, cash writes or posting enablement.

## 2026-10-29 Finance operator rejection reported done; basic input batch next

- User reports the actor No rejection/Terminate added, confirms their understanding
  of employee versus operator active checks, and now requests a few steps per turn.
- Next instructed batch in Actor_Is_Active > If yes: Input_Movement, Input_Amount,
  Input_Notes Compose actions using trigger tokens, then Basic_Input_Is_Valid
  Condition (two allowed movements, positive Number amount, trimmed notes 1-100).
  Its branches stay empty at this checkpoint; invalid branch/remaining validation
  follow. Exact cents, UUIDs, column limits, PKR and idempotency remain unbuilt.
- Updated FINANCE_FLOW_SETUP.md with the expression and reuse instructions.
  No app code, flow run verification, financial write or posting enablement.
  Documentation only; no runtime tests claimed.

## 2026-10-29 Finance operator active condition reported added; rejection next

- User reports Actor_Is_Active added; no condition execution inspected.
- Next instructed action pair in Actor_Is_Active > If no: Return value(s) with
  the same six-field response (status rejected, operator-inactive message), then
  Terminate Succeeded. Empty transactionId and balance 0 are failure placeholders,
  never a saved transaction/balance. Actor Yes remains empty for the next step.
- Updated FINANCE_FLOW_SETUP.md checkpoint. Documentation only; no new code,
  permissions, financial writes, run verification or posting enablement.

## 2026-10-29 Finance operator lookup reported added; active condition next

- User reports Get_Actor added under Employee_Is_Active > If yes. No run/result
  or trusted-caller-to-Contact mapping inspected.
- Next guided action: Actor_Is_Active Condition directly after Get_Actor, inside
  the same Yes branch; raw body('Get_Actor')?['statecode'] equals numeric 0.
  Branches stay empty at this checkpoint. Operator rejection/stop follows next;
  future permitted actions go in the new Yes branch.
- Updated FINANCE_FLOW_SETUP.md checkpoint. Documentation only; no application
  code, permissions, financial writes, tests or posting enablement changed.

## 2026-10-29 Finance inactive rejection reported added; operator lookup next

- User reports the inactive-employee No response and Terminate added. No run or
  rejection response inspected.
- Next guided action: inside Employee_Is_Active > If yes, Dataverse Get a row
  by ID named Get_Actor, Contacts, Row ID from vActorId, select contactid,statecode.
  This is the trusted operator lookup, not employeeId; active/mapping checks
  follow. Role authorization still depends on the site-associated Finance role.
- Updated FINANCE_FLOW_SETUP.md checkpoint. No code/permission changes, tenant
  financial writes, tests rerun or posting enablement.

## 2026-10-29 Finance active condition reported added; No branch response next

- User reports Employee_Is_Active added. Next guided instruction: in No, add
  Return value(s) to Power Pages (status rejected, inactive message), then
  Terminate Succeeded after responding. Leave Yes empty at this checkpoint;
  permitted processing will be added there. No execution/denial verified.
- Standardized the build guide's response recipe to six output names/types:
  Text status/postingKey/employeeId/transactionId/message and Number balance.
  Failures use balance 0 only as a placeholder; existing frontend refuses a
  non-posted response. Success adds an empty message, which the helper ignores.
  This is our response design, not a verified tenant schema restriction.
- Updated FINANCE_FLOW_SETUP.md only; no application code, tenant write, new
  privilege, financial posting, run verification or tests rerun.

## 2026-10-29 Finance employee lookup reported added; active condition next

- User reports Get_Employee added; no lookup execution/result inspected.
- Next instruction: Condition Employee_Is_Active compares raw numeric
  body('Get_Employee')?['statecode'] to numeric 0 (Contact Active), not the
  formatted label or Status Reason. Leave branches empty at this checkpoint;
  rejection/termination in No and permitted processing in Yes follow next.
- Updated FINANCE_FLOW_SETUP.md checkpoint. No enforcement verified, financial
  writes, code/permission changes or posting enablement. Documentation only.

## 2026-10-29 Finance caller variable reported added; employee lookup next

- User reports completion of Initialize variable vActorId using trigger User ID.
  Recorded as setup reported, not a verified caller Contact mapping or flow run.
- Next guided action: Dataverse Get a row by ID, named Get_Employee, Contacts,
  Row ID from employeeId trigger dynamic token, Select columns
  contactid,fullname,statecode. Active-status validation will follow; this lookup
  alone does not validate eligibility. Reuse it later instead of duplicating it.
- Updated FINANCE_FLOW_SETUP.md checkpoint. No code/tenant writes, tests rerun,
  permission changes or posting enablement.

## 2026-10-29 Finance flow guided build requested

- User reports the five trigger inputs added and requests simpler instructions.
  Switch to one small action per turn. No Cash Transaction list/create is needed
  at this checkpoint. Next instructed action is Initialize variable vActorId,
  String, from built-in trigger User ID (not employeeId). Later normalization,
  identity verification and posting gates still apply.
- Updated FINANCE_FLOW_SETUP.md checkpoint. No new action/flow run verified,
  no code changes or financial writes; documentation only.

## 2026-10-29 Full Finance flow build recipe prepared

- User reports the trigger-finding step done and requests the entire flow setup.
  Actual trigger inputs/outputs, caller mapping and flow runs remain uninspected.
- Added FINANCE_FLOW_SETUP.md: exact five-input contract, named Compose/actions,
  validation, PKR lookup, existing crec6_postingkey uniqueness, one create attempt,
  read/compare recovery even after create failure, complete paginated ledger,
  sequential cent calculation, typed success and unconfirmed responses, Finance-
  only site association and end-to-end tests. No tenant flow/import was created.
- Identified missing durable operator audit in the existing Word schema. Proposed
  one Recorded By lookup to Contact on Cash Transaction, populated in the create
  from the built-in trusted User ID. No table/column was created by assistant.
  Actual publisher-generated name and Cash Transaction primary GUID remain to
  be copied from the tenant; placeholders are explicitly marked, not invented.
- Updated README.md, FINANCE_SETUP.md and WEBAPI_SITE_SETTINGS.md. No portal/API
  privilege expansion; no balance table; no password fields or frontend changes.
  Contact hr_currentbalance remains unchanged by this proposed flow. A reconciled
  summary/approval process is separate work. Posting gates remain disabled.
- Documentation-only change: reviewed against current primary Microsoft docs;
  flow expressions and connector/runtime behavior require live validation.
  Existing local frontend/mock tests do not certify a deployed financial flow.
- Local document checks passed: balanced Markdown fences, valid JSON examples,
  balanced delimiters in 12 expression blocks, matching five required inputs,
  and git diff --check. These checks do not execute Power Automate expressions.

## 2026-10-29 Finance trigger not visible; creation guidance clarified

- User cannot find When Power Pages calls a flow. Clarified trigger versus flow
  name, searching Power Pages from the site's creation path, same environment,
  and classic designer where available. Microsoft documentation currently lists
  the trigger as unsupported in the new designer; user's exact cause unverified.
- Updated FINANCE_SETUP.md with primary references and screenshot follow-up if
  still missing. No substitute trigger, code/permission changes, deployed flow
  or cash posting. Documentation only; no tests rerun.

## 2026-10-29 Finance page reported working; secured posting flow next

- User reports everything working after the Finance visibility/helper fixes.
  Record the page outcome as user-confirmed, not independent inspection of
  effective permissions, rendered copy counts or backend writes.
- Next stage is a solution-aware Finance cash-movement flow using When Power
  Pages calls a flow, associated with this site and Petty Cash Finance only.
  Validate inputs, record the trusted operator, deduplicate with the existing
  crec6_postingkey and return a confirmed signed-ledger balance before enabling
  posting. Approval/expense posting follows as a separate workflow.
- Local financeFlowId remains blank and financeSecurityReviewed remains false.
  No flow or tenant configuration created by assistant; no financial writes.

## 2026-10-29 Finance inline hiding and repeated helper initialization

- User DOM report: two Finance sections, two version-bearing helper scripts,
  one employee selector/status/form; form hidden=false but inline/computed
  display=none. Exact source of the second section remains uninspected.
- Updated pettycash-modules.js to finance-ledger-v2: explicitly display only
  Finance form/history after the role check; ignore repeated same-version helper
  loads, preserving initialization and any unconfirmed movement/key.
- Expanded synthetic Finance browser QA to reproduce inline display:none and
  duplicate scripts, assert authorized visibility/single directory initialization,
  unauthorized form/history hiding, and pending-key retention after another load.
- Updated FINANCE_SETUP.md with paired deployment and duplicate-fragment checks.
  No schema, permission, configuration gate or backend posting changes. Tenant
  publication/duplicate-source cleanup and live outcome remain unverified.
- Validation: all 126 existing unit tests passed; all eight synthetic Finance
  browser scenarios passed with inline-hidden containers and repeated helpers,
  including role denial and pending-key retention. git diff --check passed.

## 2026-10-29 Finance page renders helper JS as text; template wrapper correction

- Read user attachment ed59653d-bc33-49eb-bd4b-d2d868b6e711/Pasted text.txt.
  Visible output contains Finance heading, the initial Checking Finance access
  message and the complete shared helper body. This indicates the script is
  rendered as text (missing/escaped wrapper), not completed initialization or
  successful access testing. Exact live template Source was not inspected.
- User instructed to replace Petty Cash Modules Source with complete raw JS
  wrapped once in script tags, no escaped tags/code fences/duplicate append;
  save/sync and reload, then check finance-ledger-v1 and the status message.
- Updated FINANCE_SETUP.md. Documentation only; no application code change,
  tests rerun, tenant write, cash posting or permission modification.

## 2026-10-29 Finance read-permission checklist reported done; page publication next

- User reports completion of the preceding Finance read-permission checklist.
  No screenshot or live API test was supplied; record user-reported setup, not
  independent verification of scopes, role bindings or credential exclusion.
- Next user steps: create/reuse the single Finance page with Finance-only Read,
  publish complete User Context and Modules Web Template sources plus Finance
  HTML, then test authorized employee/balance/history reads and unauthorized
  direct URL denial. Keep flow ID blank/security gate false: disabled cash
  movement fields and Record button are expected in this read-only phase.
- Updated FINANCE_SETUP.md. Documentation only; no code tests rerun, no tenant
  configuration changed and no cash posting enabled by assistant.

## 2026-10-29 Finance role creation reported; read-permission setup next

- User reports the Petty Cash Finance role created. Record role existence as
  user-reported, not verification of website, default flags, membership or
  effective access. No role assigned/changed by assistant.
- Next instructed setup is the two Finance-only Global READ table permissions
  (contact and hr_cashtransaction), all other new privileges off. Keep employee
  and Admin grants unchanged. Before Global Contact Read, verify historical
  password input/hash/stamp are excluded from the Contact API field allow list;
  no secret-field Read or password-policy change is authorized.
- Updated FINANCE_SETUP.md. Documentation only; no code tests rerun, no tenant
  settings/table permissions modified, no cash posting enabled.

## 2026-10-29 Finance cash-management page prepared; backend still required

- User reports suggestions working perfectly. Recorded as user-confirmed UI
  workflow, not independent tenant/security inspection. User requested Finance
  add/deduct balances and explicitly selected new exact web role Petty Cash
  Finance rather than the earlier planned Petty Cash Accounts role.
- Added Finance Cash Management.html with active employee name/username/GUID
  selection, full signed-ledger balance, latest ten transactions, refresh,
  positive cash-given/cash-returned amounts, integer-cent preview, reason and
  confirmation. Read-only setup is usable once authorized; posting defaults off.
- Updated shared pettycash-modules.js to finance-ledger-v1 with Finance-specific
  flow/config keys, guarded employee lookup/posting, strict decimal/safe-cent
  validation and typed response checks. No browser ledger/Contact writes.
  Preserved employee balance/dashboard helpers and request status configuration.
  Retired old Accounts page initialization; kept its source as a labeled draft.
- Added pcFinanceAllowed to User Context (web-template-v2-finance), preserving
  all existing identity/Admin/legacy Accounts fields. Only exact Finance role
  authorizes the new UI; Admin-only, employee and Accounts-only are denied.
  Those markers are cosmetic; actual page/table/flow enforcement is user setup.
- Finance request retries keep one UUID, lock inputs after any unconfirmed
  result and block changed data. No double projection after an uncertain event.
  Server confirmation drives displayed balance, then Refresh reloads history.
  A generation token prevents stale A→B→A ledger reads replacing newer data.
- Added Finance schema/FINANCE_SETUP.md, canonical disabled page config and
  eight-state mock browser QA. Updated module tests and existing browser context
  fixtures. 126 unit tests pass; Finance desktop/mobile UI reviewed. Existing
  module/Admin browser checks pass. Tests use synthetic intercepted requests,
  not actual tenant authorization, duplicate enforcement or money movement.
- Documented required Petty Cash Finance role (both default flags No), Finance-
  only page access and two Global READ-only table grants. Existing Contact/ledger
  API fields suffice; no schema/key/column/role/permission was created or changed
  in tenant. Cash Transaction crec6_postingkey remains the existing dedupe key;
  no direct portal Create/Write permission or balance overwrite introduced.
- The new flow itself is NOT implemented/deployed in this session. Documented
  its required site/Finance association, strict inputs, trusted actor audit,
  PKR/employee eligibility, uniqueness race handling, durable ledger/read-back,
  all-page total and concurrency-safe summary policy. Actual trigger property
  names, identity/audit storage, currency and tenant metadata require review.
  No public HTTP URL, guessed lookup or unsafely enabled posting shipped.
- User next steps: create/assign Finance role/read grants/page, publish Context,
  Modules and Finance HTML, verify read-only behavior, then configure/test the
  secured posting backend. README, API, balance and suggestion-status docs updated.

## 2026-10-29 Category item suggestions implemented; receipt live success reported

- User reports image-to-PDF conversion working perfectly in live testing.
  Recorded as user-reported success, not assistant tenant inspection, universal
  device coverage or full security verification. Receipt code/template unchanged.
- User authorized recommended suggestion behavior. Added a card above Itemized
  Details in New Petty Cash Request.html and matching helpers/config in canonical
  pettycash-api.js. DATAVERSE_CONFIG.itemSuggestions initially contains only
  supplied examples: Travel Petrol/Hotel/Food, Kitchen/Food Chicken/Naan/Eggs.
  Other exact categories have empty lists/manual-entry messaging pending user
  regular-item lists. No product names were invented as company-approved data.
- Clicks focus existing names with case/whitespace normalization without changing
  values; otherwise reuse the first untouched blank/default row or append via
  existing Add Item helper, which now returns the created row. Name alone is
  filled, quantity stays 1, price stays blank, quantity receives focus and existing
  total logic runs. Manual edits, explicit zero prices, custom quantities and
  previously touched/cleared rows are never overwritten. Delegated input tracking
  handles initial/new rows without replacing their input-calculation handlers.
- Category changes only refresh buttons/Other detail visibility, never delete
  rows. Existing all-lines category semantics remain. Manual name edits, Add Item
  and deletion remain available; repeated suggested names do not increment qty.
  Buttons are non-submit, keyboard accessible and rendered with textContent.
- Suggestion controls and direct helper calls are guarded during submission and
  partial/uncertain recovery, including after category refresh. Definite header
  rejection unlocks controls; successful reset restores the default card. Existing
  fingerprint/receipt retry behavior and unchanged payload shape remain tested.
- Added 13 focused unit cases and scripts/verify_item_suggestions.cjs. All 119
  tests pass. Mock browser verifies desktop/mobile/keyboard, safe literal labels,
  blank/new-row behavior, draft preservation, matching item focus, category/Other,
  posted names/quantities/prices/totals/category, partial retry with one header and
  no duplicate lines, uncertain-create lock, definite-rejection unlock and reset.
  Card screenshots visually reviewed. No tenant records or messages created.
- Added ITEM_SUGGESTIONS_SETUP.md and updated README/receipt status. Deployment
  is request-page HTML only; no new library/template/page/table/column/role, API
  field setting, permission, backend flow or accounting change. User publication
  and live suggestion acceptance remain pending; actual server security unchanged.

## 2026-10-28 Multi-image receipt PDF upload implemented locally

- User approved one existing PDF OR up to 10 JPG/PNG images combined locally
  into one PDF, with order/remove controls and preview. Current folder was found
  at Desktop/petty-cash after the former workspace path ceased to exist. No user
  file was moved/deleted and no live tenant data was read or written.
- Added pettycash-receipts.js (receipt-pdf-v1), generated Petty Cash Receipts.html
  Web Template Source, vendor/jsPDF 4.2.1 MIT library/license and deterministic
  build script. Pinned npm tarball SHA-512 is checked on --fetch; runtime needs
  no CDN or external conversion service. Template includes raw guards/script
  tags and is approximately 427 KiB. User must publish it and the updated request
  HTML; actual tenant Source/CSP limits remain unverified, never bypassed.
- Picker supports append, up/down ordering, removal/clear, image thumbnails and
  prepared PDF preview/download links. Rejects mixed/multiple PDFs, unsupported
  formats, invalid headers and selection limits without dropping valid files.
  Enforces 15 MiB/image, 40 MiB combined, 32 MP/12k dimensions and final 10 MiB
  PDF. Header dimensions are checked before thumbnail decoding. PDF conversion
  is sequential, bounded/resized, white-flattened JPEG quality .88; normal A4 and
  custom-height long pages preserve ratios and browser EXIF orientation.
- Existing PDF bytes pass through. No OCR, original-image upload, storage,
  telemetry, schema/table/column/key, financial/approval flow, role, permission
  or Web API field/configuration change. Receipt remains mandatory and one
  native session/CSRF PUT writes the existing hr_receiptimage file column.
- Updated canonical pettycash-api.js and identical inline script to prepare and
  validate the PDF before any request write, reject expense edits made during
  preparation and retain the exact File in pending state. Fingerprints include
  source identity/order; monotonic IDs prevent cleared selections aliasing old
  snapshots. Preparation/partial saves lock receipt controls; retries reuse PDF
  bytes and existing request/line IDs, ambiguous POST blocking is unchanged.
- Added receipt unit tests and extended API/module browser fixtures plus
  scripts/verify_receipt_upload.cjs. 106 tests pass. Mock Chrome checks verify
  ordered four-page PDF, long/landscape/EXIF layout, mobile width, no preview API
  writes, cached generation, byte-identical failed-upload retry, existing PDF
  and corrupt/HEIC/mixed/count/encoding error cases. Independent PDF parser and
  renderer verified output; PNGs of all pages visually reviewed using PDF skill.
  Synthetic intermediate files are ignored under tmp/pdfs/. Existing module
  page browser checks also pass. No real phone/Safari/tenant behavior claimed.
- Added RECEIPT_PDF_SETUP.md and updated README, Dataverse/API setup guides with
  exact artifacts, limits, dependency rebuild, two-part deployment and manual
  acceptance checks. Approval/accounting must still validate all lines plus
  uploaded receipt server-side; no completion flag/atomic transaction added.

## 2026-10-19 Admin Users cleaned up to profiles only

- User explicitly requested Admin cleanup. Removed two password controls and
  credential-writing/validation/guard code from Admin Users.html and
  pettycash-admin.js. Version is admin-profiles-v2; seven profile fields remain.
  Any credential-like API input keys are rejected before network requests, and
  stale credential-enable configuration cannot restore password submission.
  Script initialization rejects old password-form HTML with a deployment error.
- Retained separate username, login-enabled=true eligibility flag, exact
  profile/role/lookup values, literal zero initial balance and read-back. No
  native hash/stamp access, email/invitation, role assignment, ledger entry,
  existing-Contact update or arbitrary balance adjustment. Login eligibility
  does not provision credentials. Supported Management Change Password on the
  same Contact remains the separate password operation; no account recreation.
- Kept two release switches creationEnabled/securityReviewed. Mirrored canonical
  page/example configuration has both true for this user's existing reviewed
  admin-only deployment; script defaults still false without explicit settings.
  No live flag, table/column/profile/page permission or role changed by assistant.
- Preserved paging/duplicate checks including inactive Contacts, active lookup
  options, HTTPS/session/CSRF, sanitized POST/transport errors, known-ID GET-only
  retry and uncertain-save blocking. Updated return/diagnostic state to report
  profileOnly/passwordSetupRequired and never claim login provisioning.
- Updated 31 Admin tests and seven mock browser states, including rejection of
  old HTML and credential-like input. All 87 unit tests pass; mock browser
  desktop/mobile checks pass. No real tenant/credential processing tested.
- Added ADMIN_PROFILE_SETUP.md; updated Admin/credential/API guides and README
  to mark old credential guidance historical. Documented exact password-free
  Contact API union and user-only removal of adx_identity_newpassword, paired
  template/page deployment, existing permission preservation, safe prior-input
  cleanup and Management workflow. No new page/table/column/key/role/flow needed.
  New local revision is not yet published or live-verified by the user.

## 2026-10-19 Management password setup and new-account request verified by user

- User confirmed the balance now displays normally, not only after a console
  refresh. User also confirmed live Admin script version admin-credentials-v1.
- Live custom credential Create saved other profile values but left New Password
  Input populated without generating a hash. This is failed native processing
  for the tested Create path; no exact plugin/workflow trigger cause is claimed.
  The earlier manual field-save report did not prove Create would behave alike.
- Missing Management Contacts were a list-filter issue: user changed the filter
  and found all Contacts. User then ran Change Password on the existing test
  Contact, signed in successfully, and successfully created a petty cash request.
  Record this as user-reported native Management/sign-in/submission success,
  not assistant tenant inspection, hash inspection, custom provisioning success
  or a complete multi-role isolation/security certification.
- Confirmed canonical Admin HTML and example configuration still have
  creationEnabled=false, securityReviewed=true, credentialSubmissionEnabled=
  false and credentialSecurityReviewed=false. No release flags changed locally
  or in the tenant by assistant. User was instructed to stop the failed path;
  live rollback, removal of adx_identity_newpassword from the API allow list and
  safe clearing of its retained test value remain separately unconfirmed.
  No password/hash values were requested or received. Do not repeat POST/PATCH,
  write hashes, recreate Contacts or change the working account's ledger.
- Updated ADMIN_CREDENTIAL_SETUP.md, ADMIN_USER_SETUP.md, WEBAPI_SITE_SETTINGS.md
  and README.md with the actual result and explicit supersession of earlier
  experimental enablement guidance. Kept supported Management provisioning as
  the working path. No new table/column/key/role/page/flow/backend integration,
  permissions, live settings or profile-only implementation added. The current
  form's credential gates disable its save operation, not just password fields.
- Documentation only; no code tests rerun, since mocks cannot verify native
  credential processing. Earlier attempted failure-documentation save was
  unverified and its entry was absent on inspection; this update records both
  the failure and the subsequent supported-path success.

## 2026-10-15 Own balance decoupled from submission profile; credential probe recorded

- User authorized needed fixes after the admin's balance widget reported an
  unassigned manager. Traced to refreshEmployeeBalance calling the full
  submission-profile resolver. Changed pettycash-api.js and its identical inline
  copy in New Petty Cash Request.html to normalize signed-in identity and read
  only that Contact's ledger through the existing shared module. No Contact
  lookup is required for balance viewing. Real ledger/identity failures remain
  visible; no fabricated zero, role bypass, permission widening or balance write.
- Department/manager validation remains required for request submission and
  setup diagnostics. Separate initialization may warn about an incomplete
  submission profile without preventing a valid ledger balance from rendering.
- Added seven regression cases in tests/pettycash-api.test.cjs: missing manager,
  department, both lookups, denied Contact read, and three invalid/absent identity
  cases. Tests verify zero profile calls for refresh, unchanged blocked writes,
  zero/positive/negative displays and refresh-button restoration. Existing
  ledger-error test also verifies no incidental Contact calls.
- Extended scripts/verify_module_pages.cjs with actual request-page mock browser
  states expense-no-manager and expense-profile-denied, including refresh and
  employee-filter checks. All four page states pass desktop/mobile; all 86 unit
  tests pass (30 Admin unchanged). Browser requests were intercepted; no live
  tenant read/write or credential processing was tested. git diff --check passes.
- Updated BALANCE_MODULE_SETUP.md and README.md: publish the updated HTML to the
  existing request page, save/sync/reload and verify as admin and employee. Do
  not load the canonical JS a second time. No shared-template update, new page,
  table, column, key, web role, setting, permission or flow is required. Live
  deployment of this balance correction is not yet user-confirmed.
- User pasted the complete Webapi/contact/fields credential union, including
  adx_identity_newpassword. Their zero-row admin probe returned contactid 200 and
  New Password Input 403 with an attribute-not-found message. Recorded this in
  ADMIN_CREDENTIAL_SETUP.md, ADMIN_USER_SETUP.md and WEBAPI_SITE_SETTINGS.md.
  The field is not missing from the reported list. GET failure does not verify
  Create support or the cause/effective scope of secret-read protection; do not
  make password Read available merely to pass this probe. Hash/stamp stay absent.
- Clarified supported native local registration can accept passwords, whereas
  custom admin Contact provisioning is a separate unverified route. No open
  registration enabled, credential guard changed, credential POST performed,
  existing Contact repaired, or new server endpoint deployed. Management setup
  remains the documented fallback. No tenant changes made by the assistant.

## 2026-10-15 Employee column rules and role confirmed; API permission probe next

- Two user screenshots show all 12 requested public Contact columns with Read
  only, Rows:12, and sole Authenticated Users role on the Petty Cash website.
  Together with prior grid, employee profile has no default column grant and
  no secret-column entries. Both profile configurations now screenshot-verified;
  this is not proof of effective runtime access under every role combination.
- Updated ADMIN_CREDENTIAL_SETUP.md, ADMIN_USER_SETUP.md and
  WEBAPI_SITE_SETTINGS.md. Next user instruction: merge reviewed credential union
  into existing Contact field setting, refresh config, run a read-only zero-GUID
  query twice selecting public contactid vs adx_identity_newpassword. It matches
  no real Contact and logs status/error metadata only, never field values.
- Public control distinguishes general denial; successful empty/400/401 results
  are inconclusive for value protection and must not enable credentials. Repeat
  effective-access checks as employee and recheck normal app reads. No credential
  request or Contact write performed, no native processing/sign-in verified.
- Save flags unchanged/off; new API field-list application not yet reported.
  Documentation only; git diff --check verified, no code tests rerun or tenant
  changes by assistant.

## 2026-10-15 Employee column profile listed; detailed verification pending

- User's Active Column Permission Profiles grid shows Contact - Employee Column
  Access on contact with blank All Column Permissions. Admin profile remains
  contact with Create/Read. No individual employee column rows, website or role
  assignment shown; do not infer all 12 rules or Authenticated Users binding.
- Updated Admin/credential/API setup guides with partial evidence and request
  for employee profile Column Permissions and Web Roles sections. No repeated
  creation needed; password API exposure and credential release remain blocked.
- Documentation only, git diff --check verification. No code, tenant, schema,
  permission or credential change by assistant; no tests rerun.

## 2026-10-15 Admin column profile confirmed in screenshots

- User screenshots show saved Contact - Admin Column Access on contact and
  the Petty Cash website, All Column Permissions Create/Read, explicit
  adx_identity_newpassword Create only, and only Petty Cash Admin in Web Roles.
  Recorded as screenshot evidence of configuration, not runtime secret denial.
- Updated ADMIN_CREDENTIAL_SETUP.md, ADMIN_USER_SETUP.md and
  WEBAPI_SITE_SETTINGS.md. Next instructed profile Contact - Employee Column
  Access has no All Column Permissions selections and 12 explicit public
  Contact logical-name Read-only records, associated with Authenticated Users.
  No secret columns/default Read, no employee Contact Create/Write grant.
- Other Contact-reading roles and overlapping profiles still need review;
  normal reads and effective secret-read denial must be tested before exposure.
  Credential API allow-list and all local credential release guards unchanged.
  No assistant tenant mutation, secret access, code or new schema/flow changes.
- Documentation-only verification: git diff --check; code tests not rerun.

## 2026-10-15 Credential edition prepared; standard column controls pending

- User selects separate username and confirms manual username/New Password
  Input save generates a hash and permits sign-in. Input clearing not separately
  confirmed; no password/hash contents requested or received. Manual save is
  not treated as verification of portal Create processing.
- Enhanced Authorization is reported unchecked. Use standard Power Pages Column
  Permission Profiles, not inferred from enhanced data model. No setting toggled.
- Local Admin Users.html adds username and masked password/confirmation.
  Username 3–100 letters/digits/dot/_/- (letter/digit first); password 12–100,
  no trimming/NUL/line breaks, confirmation required. These are app limits;
  tenant may add password rules. No forced first-login password change configured.
- pettycash-admin.js version admin-credentials-v1 adds paged case-insensitive
  username duplicate checks including inactive Contacts. One full POST includes
  adx_identity_username, adx_identity_logonenabled true, transient
  adx_identity_newpassword and original profile/binds/zero summary. Public
  read-back excludes secrets. Result states submitted, not processing/login
  verified. No email, role assignment, existing-user update, ledger write or flow.
- Password absent from fingerprints, retry state, diagnostics, storage or URLs.
  Inputs clear at submit and after outcomes; known saved IDs retry GET-only
  without password resubmission. Sensitive errors discard server/transport/read
  exception messages that may echo secrets. HTTPS required; transient string
  lifetime is not a physical memory-erasure guarantee.
- Canonical/embedded config: creationEnabled=false, securityReviewed=true,
  credentialSubmissionEnabled=false, credentialSecurityReviewed=false. No
  credential field exposure or enablement deployed. Old/new script-page mismatch
  fails closed during rollout. Existing profile edition is not modified live.
- Added ADMIN_CREDENTIAL_SETUP.md with metadata/evidence, standard authorization,
  next Admin column profile, all-role no-read review, future API list, release
  gates and synthetic processing/login test. Main guide/README/API guide updated.
- All 79 tests pass (30 Admin). Seven mocked browser modes pass, including
  credentials-disabled, redacted rejection and password-free verification retry.
  Desktop/mobile visually reviewed, masked/cleared inputs checked. No tenant
  calls or real credentials used. No new schema/column/profile/flow by assistant.

## 2026-10-15 First Contact created; zero summary added, credential extension pending

- User reports the test Contact was created; Current Balance/username blank.
  Both fields were omitted by the prior profile-only payload. No success text,
  actual login test or complete record-field screenshot supplied.
- Updated pettycash-admin.js to include literal hr_currentbalance:0 only on
  Contact POST and select/verify it after save. Reject null/missing/nonzero
  initial summary without PATCH/PUT/DELETE or overwriting any existing balance.
  Arbitrary starting balance input is ignored. No ledger transaction is created.
- Updated Admin page explanatory note, tests and mocked browser fixture/payload
  checks. Existing hr_currentbalance field setting and Admin Create grant suffice;
  no extra schema/permission needed. Existing blank Contact not automatically
  backfilled or recreated; local patch not yet user-deployed/live-verified.
- User requests username and adx_identity_newpassword input, reporting automatic
  password assignment. Native adx_identity_username identified in Microsoft
  Contact reference. Asked email-as-username vs separate name, and actual login/
  input-clearing result after direct field save, never password/hash contents.
  No username/password implementation or API exposure added pending answers and
  processing/column-security verification. Management flow is documented; native
  portal Create password-processing behavior is not verified in this tenant.
- Updated ADMIN_USER_SETUP.md, WEBAPI_SITE_SETTINGS.md, README.md and
  BALANCE_MODULE_SETUP.md with zero-init exception/evidence and credential scope.
- Verification: all 69 tests pass (20 Admin), plus all four mocked Admin browser
  modes. No tenant access or credential/balance mutations by assistant.

## 2026-10-15 Access checks reported passed; controlled create enabled locally

- User replies "done" to signed-out Admin page denial, non-admin page denial
  and new permissions assigned only to Petty Cash Admin. Recorded as user-
  reported, not independently inspected. No employee collection/direct POST
  denial output provided; broader production checks remain pending.
- Set creationEnabled/securityReviewed true in Admin Users.html and mirrored
  canonical config for this site's controlled test only. Core defaults stay
  false without config. No metadata/grant/script-template-source changes. User
  must update the page before live activation; no confirmation yet.
- Tests updated for reviewed enabled config while retaining either-off/missing
  flags, non-admin/signed-out, exact full payload and safe-retry checks.
- Updated ADMIN_USER_SETUP.md, WEBAPI_SITE_SETTINGS.md and README.md with
  evidence boundaries and one test-profile procedure. No live Contact,
  credentials, website role, balance/ledger write or tenant mutation by assistant.
  Actual create/read-back and native login provisioning remain untested.
- Verification: all 68 local tests pass; git diff --check passes. Mock browser
  QA passes enabled, disabled, non-admin and unconfigured modes. No tenant calls.

## 2026-10-15 Admin page live read diagnostics pass (user screenshot)

- User reports running checkSetup on admin-users page while signed in as admin.
  Screenshot: contactsReadable true, departmentsReadable true, contactCount 2,
  departmentCount 2, creationEnabled false, writePermissionsVerified false,
  loginProvisioned false. This demonstrates deployed helper/context/config and
  successful list reads in that session, not create rights or page isolation.
- Explained all three false values are expected: saving remains disabled;
  diagnostics are GET-only and do not provision credentials. No runtime code or
  save flags changed. No live Contact created by this diagnostic.
- Updated ADMIN_USER_SETUP.md, WEBAPI_SITE_SETTINGS.md and README.md with the
  observed deployment/read status. Exact URL casing, template source versions,
  full settings and role bindings are not independently inspected.
- Next instructed checks: signed-out and non-admin page denial; verify only
  Admin role binds to new permissions; ordinary employee Contact collection
  read returns no other Contact. Added read-only query with count/boolean output,
  no passwords or personal record details. Direct Create-denial/production
  server validation and actual admin creation/read-back remain untested.
- Documentation-only change, no code tests rerun. Validation: git diff --check.

## 2026-10-15 Admin API fields applied (user-reported); deployment prepared

- User reports completing the Contact/Department union field setting instructions
  and enabled=true. Live values/website and runtime reads are not independently
  inspected. Admin permission role bindings still not shown in grid screenshot.
- Embedded confirmed config in Admin Users.html before the Admin include, with
  creationEnabled=false/securityReviewed=false. Updated canonical config comment
  and regression enforcing exact embedded/canonical match and include order.
  This removes a manual config assembly step; no new operation is enabled.
- Updated ADMIN_USER_SETUP.md/WEBAPI_SITE_SETTINGS.md/README.md. Next user
  deployment: restrict Admin Users page to Petty Cash Admin, update existing
  User Context template, create Admin script template, paste complete page and
  run read-only checkSetup. Page URL remains proposed Admin-Users; no page,
  template or permission was deployed by assistant and no user report of them yet.
- No new schema/flow/credential/balance writes. Save flags remain off.
- Verification: all 68 tests pass; git diff --check passes. Updated Admin page
  browser QA passes enabled, disabled, non-admin and unconfigured states with
  mocked APIs only; desktop/mobile screenshots regenerated. No tenant requests.

## 2026-10-15 Admin table permissions created (user screenshot)

- User reports completion and provides Active Table Permissions screenshot.
  Contact - Admin Profiles shows contact / Global / Read Yes, Create Yes,
  Append Yes, Append To Yes, Write No, Delete No. Departments - Admin Lookup
  shows hr_departments / Global / Read Yes, Append Yes, all other privileges No.
- Screenshot also retains employee Contact Self, Request Contact, Line Item
  Parent and Cash Transaction Contact scopes. It does not show assigned web
  roles, website, relationships or prove live operation/isolation. Previous
  instructions assign only Petty Cash Admin to the two new permissions; remind
  user to verify these bindings and not attach Authenticated/Anonymous roles.
- Updated ADMIN_USER_SETUP.md/WEBAPI_SITE_SETTINGS.md to distinguish screenshot-
  confirmed privileges from pending role review, API fields, restricted page,
  templates and live tests. Next user action is editing existing Contact and
  Department field settings to the documented complete union values, retaining
  any other validated fields and enabled=true. No password fields added.
- Documentation-only change. Both save flags remain false. No assistant tenant
  mutation, new schema, code behavior, credential change or flow deployment.
  Validation: git diff --check; no code tests rerun for this documentation change.

## 2026-10-15 Contact navigation names confirmed from live annotations

- User's console screenshot from the documented read-only Contact query returns
  department `hr_Department` and manager `hr_ReportsToManager`. These confirm
  exact Contact lookup write names, not merely schema-name guesses. The
  assistant did not directly query the tenant; no create permissions tested.
- Filled both navigation mappings in pettycash-admin-config.example.js. Role
  values and GUID key remain as previously confirmed; both save flags stay false.
- Updated ADMIN_USER_SETUP.md, README.md and WEBAPI_SITE_SETTINGS.md with
  confirmed mappings and complete Contact/Department union field lists. No live
  settings changed, no credential/balance writes, no new schema/flow/permission.
- Added exact-bind regression using the confirmed configuration; it verifies
  one mocked full POST/read-back and separately that shipped flags block writes.
  All 68 tests pass (19 Admin tests). No runtime/UI change or new browser run.
- Next tenant action: separate Global Contact Read/Create/Append/Append To and
  Department Read/Append permissions for Petty Cash Admin only, other privileges
  off. Preserve existing employee scopes. Restricted page/templates/API settings
  and live direct-API isolation tests still pending; no deployment by assistant.

## 2026-10-15 Department GUID key confirmed for Admin page

- User confirms Department primary key logical name `hr_departmentsid`; schema
  spelling supplied as `hr_Departmentsld`. API configuration uses the logical
  name exactly, not the schema spelling or primary-name text hr_departmentname.
- Updated pettycash-admin-config.example.js, ADMIN_USER_SETUP.md,
  WEBAPI_SITE_SETTINGS.md and README.md. Documented future Admin Department
  field list hr_departmentname,hr_departmentsid,statecode; no live setting changed.
- Added a read-query/config regression using the confirmed GUID key. All 67
  local tests pass (18 Admin tests). No UI/runtime script change; prior mock
  browser results still describe the 2026-10-13 UI test run, not a live tenant test.
- Contact navigation-property verification and admin-only permission review
  remain pending. Both save flags remain false; no deployment, credential change,
  new table, column, permission or flow by assistant.
- Documented an alternative read-only console query on the existing Request
  page for own-Contact navigation annotations; it outputs only names. The query
  has not been run against the tenant; null annotations are not a metadata result.

## 2026-10-13 Admin profile page implemented locally; saving gated

- User reports completing Admin web-role assignment. Live role defaults and
  membership have not been independently inspected.
- Confirmed hr_userrole Employee 123140000, Manager 123140001, Accounts 123140002,
  Admin 123140003; Contact schema names hr_Department and hr_ReportsToManager.
  Exact write navigation properties remain unverified. User supplied Department
  primary name hr_departmentname; clarified that its Unique identifier GUID key
  is required, not this text/name column.
- Added Admin Users.html, pettycash-admin.js, pettycash-admin-config.example.js.
  Proposed page Admin Users / Admin-Users and template Petty Cash Admin are not
  deployed. First/last name, email, business role, Department/manager saved as
  one complete payload, then verified. Complete Contact reads include inactive
  rows for duplicate checks. Options require active Departments/Contacts.
- No field stripping or credential/role/balance/ledger writes. Known saved ID
  resumes verification only; ambiguous creates block retries in memory. Email
  duplicate checks are client-side, not atomic; server validation remains pending.
- Shared User Context adds cosmetic Liquid pcAdminAllowed; existing escaped
  identity IDs and Accounts check preserved. Existing browser mock updated.
- ADMIN_USER_SETUP.md documents artifact inventory, pending metadata, admin-only
  Global Contact Read/Create/Append/Append To, Department Read/Append, merged
  API fields, restricted page, templates, gates, manual native login fallback,
  and pending direct-API security tests. README/WEBAPI_SITE_SETTINGS updated.
- No tenant page, permission, setting, table, column, key or flow was created
  by assistant. Reset error unchanged; profile creation is not login provisioning.
- Verification: all 66 tests pass (17 new admin tests). Mock browser passes
  enabled/disabled/non-admin/unconfigured Admin states; desktop/mobile visually
  reviewed, no overflow. Existing Requests/Accounts browser QA also passes after
  context change. No live tenant calls. Word snapshots unchanged.

## 2026-10-13 Admin web role created (user-reported)

- User reports creating the administrator web role in Power Pages Management
  after the `Petty Cash Admin` setup instructions. Exact saved name, website,
  default role flags, and assignment to a Contact are not independently verified.
- Updated ADMIN_USER_SETUP.md with the reported creation and the next enhanced-
  model Contact assignment step. Both default flags must remain No; ordinary
  authenticated employees must not automatically receive the administrator role.
- No admin page, new table permission, credential provisioning, or email flow
  was implemented or deployed in this change. Existing employee permissions and
  authentication remain unchanged. Documentation-only change.

## 2026-10-13 Admin onboarding requirements and native password fields recorded

- User requests a dedicated administrator-only Contact creation page next.
  Existing authentication is reported as local email/password; invitations are
  not wanted. Reset links are conditionally preferred if quick to configure.
- Confirmed native fields: `adx_identity_newpassword` and
  `adx_identity_passwordhash`. No new password column, portal field exposure,
  password storage, or credential change implemented.
- User reports Forgot Password generic failure, Error ID
  `d148e7b7-a447-4d04-a904-a8bb2721daf0`; cause and reset process state unknown.
- Added ADMIN_USER_SETUP.md to separate Contact profile creation from supported
  login provisioning, record minimal phased design and proposed Petty Cash Admin
  role, and keep password/email work explicitly unimplemented. No admin page,
  role, permission, flow, or email was created/sent by the assistant.

## 2026-10-13 Employee dashboard working; actual page name My Requests

- User confirms the employee dashboard is created and working, with website
  page display name `My Requests` instead of the suggested longer name.
  In a follow-up the user confirmed the exact partial URL `My-Requests`.
  No additional page/template creation or source-file rename is required.
  Preserve configured casing; `/My-Requests/` is the relative link if the page
  is directly under Home (parent hierarchy/full live URL not independently
  inspected). No tenant route changed by assistant.
- Changed the local dashboard h2 to `My Requests`; retained source filename
  `My Petty Cash Requests.html`, shared template names, data-pc-page="requests",
  API filters, and table/column mappings. A local heading-only redeploy is
  optional if the live heading already matches or only navigation was renamed.
- Added a regression for heading/module identity; updated README.md,
  BALANCE_MODULE_SETUP.md, DATAVERSE_SETUP.md, and this log. No tenant writes,
  new table, column, permission, web role, setting, or flow by assistant.
- User's "working" report does not separately verify signed-out page denial,
  all comments/statuses, Refresh, or two-employee Request/Line Item/ledger tests.
  These and backend/protected-field hardening remain pending. Accounts posting
  stays disabled. The earlier Word snapshots contain the old suggested name.
- Verification: all 49 local tests pass after the heading-only change.

## 2026-10-13 Other-Contact read denied; dashboard testing next

- User's console screenshot shows manager Contact GET selecting `contactid,
  hr_currentbalance` returns HTTP 403 with permission-denied-to-read-Contact
  message. The same output passes employee/profile and all three setup checks.
- This verifies the specific other-Contact denial for the tested session/record,
  not all roles/Contacts or cross-user Request/Line Item/ledger isolation.
- Next instructed deployment, not yet reported done: create authenticated
  `My Petty Cash Requests` page, URL `my-petty-cash-requests`; page permissions
  restrict Read to Authenticated Users (not Anyone/Anonymous). Paste updated
  local fragment into Liquid-rendered HTML. Both shared templates already exist.
- Ensure `hr_managercomments` is included in the existing Request field allow-list
  without removing validated submission fields. No new table permission is
  needed for dashboard reads beyond the existing scoped grants.
- Test own balance, request list/status/comments, Refresh, and signed-out page
  restriction. Use a second employee test account to verify Request/Line Item/
  ledger isolation before production. Approval/Accounts posting stays pending.
- Documentation updated only; no page, permission, or tenant mutation by assistant.

## 2026-10-13 Contact binding correction works live (user-reported)

- User confirms request submission works after changing Contact - Manager Binding
  to Global Append rather than Append To. This verifies reported compatibility
  after the corrected instruction, not independent inspection of all role flags.
- Current intended configuration: Contact - Lookup Self Read with existing self
  association flags; separate Global Append-only binding grant; Contact Global
  Read remains disabled. Request Contact scope and Line Item Parent scope were
  confirmed earlier. Runtime code unchanged in this confirmation step.
- Next gate: as an ordinary employee, attempt a read of the manager's Contact
  balance through readSavedBalance(profile.managerId). Expect an authorization
  denial, not a returned balance. Test is read-only; no approval/cash movements.
  Capture HTTP status/message; arbitrary errors are not proof of denied access.
- Cross-employee Request/Line Item/ledger denial tests, protected field hardening,
  dashboard deployment, and financial flows still need verification/implementation.

## 2026-10-13 Contact association 403; binding direction corrected

- User reports Request POST HTTP 403: permission denied associating/disassociating
  `contact` to `hr_pettycashrequest`, after Self Contact Read plus the earlier
  Global Append-To-only instruction. All three read checks still pass. This is
  an association authorization failure, not a schema/receipt/shared-script error.
- The assistant's earlier binding flag was wrong. Microsoft's Power Pages audit
  guidance explicitly requires Append on lookup target tables and Append To on
  tables setting lookup binds. Contact needs Global Append for the manager target;
  Request already retains Append To. No broad Contact Read is required by this
  documented mapping; live compatibility and read-denial tests remain necessary.
- Corrected next tenant instruction (not yet user-confirmed applied): edit
  Contact - Manager Binding to Global, ONLY Append enabled, Append To/Read/Write/
  Create/Delete off; same website and authenticated-user role. Contact - Lookup
  stays Self with its existing flags. Sync/re-sign-in and retry the labelled test.
  If still rejected, inspect exact grants/roles/website; never restore broad Read
  or strip Submitted By/Assigned Manager fields to obtain success.
- Corrected BALANCE_MODULE_SETUP.md, DATAVERSE_SETUP.md, and README.md, plus the
  association comment in both script copies. Runtime behavior/payload unchanged.
  Added a local regression for complete-payload
  Contact-association 403 rejection and retry after a definite permission rejection.
- No tenant writes by assistant. Association grants are not trusted manager
  validation; server hardening and cross-user denial testing remain pending.
- All 48 local tests pass, including the new 403 rejection/retry regression.
  This verifies client behavior, not the live tenant permission correction.

## 2026-10-13 Scoped submission verified; Contact-read hardening prepared

- User reports a complete test request submitted without errors and all columns
  retained values under the scoped permissions. No independent tenant inspection
  or cross-employee denial test was performed by the assistant.
- Line Item screenshot confirms Parent access, parent permission
  `Petty Cash Request - Create`, exact relationship
  `hr_pettycashlineitem_ParentRequest_hr_pettycashrequest`, on
  `hr_pettycashlineitem`. This supersedes earlier pending relationship notes.
- Removed the redundant preflight GET of the manager Contact from both embedded
  request script and pettycash-api.js. Manager GUID is still required from the
  authenticated employee's own Contact lookup; its binding and read-back check
  remain mandatory. Missing manager still blocks writes. No payload reduction.
- Added regression tests: complete save without reading any other Contact, and
  missing profile manager prevents all writes. Browser/UI/financial rules unchanged.
- Historical instructions (binding flag corrected in the later 403 entry): change existing
  Contact - Lookup to Self Read (retain existing self Append/Append To), and add
  a separate Global Contact binding permission with ONLY Append To, no Read/
  Write/Create/Delete/Append, for the authenticated-user role. This preserves the
  intended manager binding without broad Contact reads. Portal binding under
  these exact grants needs a live complete-save test; it is not guaranteed by
  mocked tests. If rejected, stop and inspect; do not silently restore Global Read.
- Global Append To still permits associations to known Contact GUIDs; it is not
  an authorization check of the chosen manager. Trusted server validation of
  employee/manager, initial statuses, completion, and protected fields remains
  required before approval/accounting. Accounts posting stays disabled.
- Updated BALANCE_MODULE_SETUP.md, DATAVERSE_SETUP.md, and README.md alongside
  this log. No new column/table/flow/site setting; new binding-only permission
  is proposed. Earlier reviewed Word files remain dated deployment snapshots.
- Verification: all 47 local tests pass, including embedded/standalone script
  synchronization, required manager binding/read-back, and receipt completion
  without another Contact GET. These mocks do not prove live Append To behavior.

## 2026-10-13 Follow-up read checks passed after Line Item instructions

- User's follow-up `checkSetup()` output passes Request columns, Product columns,
  and Department target with employee/department/manager context resolved.
- This is a read-only result after the Line Item Parent-scope instructions.
  No saved Line Item permission screenshot or exact parent relationship name
  was supplied, so Parent configuration/role inheritance remains unverified.
- Next verification is a complete submission using clearly labelled test data,
  two products, Others text, and a mandatory test receipt. This creates real
  Dataverse test records: leave pending, do not approve/post financial movements,
  and inspect the Request/Line Items/receipt. No test write made by assistant.
- Global Contact hardening, protected financial/status fields, cross-employee
  denial tests, dashboard deployment, and trusted posting flows remain pending.

## 2026-10-13 Request scope configured; read diagnostics passed

- User screenshot shows saved `Petty Cash Request - Create` on
  `hr_pettycashrequest`, Contact access, relationship
  `hr_pettycashrequest_SubmittedBy_contact`, on the Petty Cash website.
- User's read-only `checkSetup()` output passes request columns, product columns,
  and department target; the signed-in employee/department/manager resolved.
  This does not verify writes, receipts, or denial of another employee's records.
  Privilege flags and assigned roles were instructed to remain unchanged but
  are not visible in this cropped screenshot.
- Next instructed change, awaiting confirmation: edit the existing Line Item
  permission from Global to Parent, with Request permission above as parent and
  the relationship using Line Item `hr_parentrequest`. Preserve Read/Create/
  Append/Append To; keep Write/Delete off and authenticated-user role consistent.
  The exact Line Item relationship schema name has not yet been supplied.
- If Parent isn't exposed in the management form, inspect the options or use
  Design Studio's Child permissions under the scoped Request permission;
  ensure any superseded Global employee grant is removed from effect. Do not
  silently keep Global access as a fallback. Contacts remain a separate pending
  hardening step; no permission or runtime code changed by the assistant here.

## 2026-10-13 Current permission list reviewed

- User's current list shows Cash Transaction Contact-scoped Read only.
- Contact - Lookup: Global Read, Append, Append To; no Write/Create/Delete.
- Department - lookup: Global Read, Append, Append To; no Write/Create/Delete.
- Petty Cash Line Item - Create: Global Read, Create, Append, Append To;
  no Write/Delete.
- Petty Cash Request - Create: Global Read, Write, Create, Append, Append To;
  no Delete.
- User subsequently confirmed the authenticated-user web role is attached to
  Contact, Request, and Line Item permissions. These Global grants therefore
  conflict with employee isolation. No tenant permissions changed by assistant.
- First instructed change (subsequently confirmed scoped above): edit the existing Request
  permission to Contact access via Submitted By (`hr_submittedby`), preserving
  current privilege flags and role for the submission/receipt regression check.
  Do not add a narrow permission while leaving the same Global employee grant.
- Next stages: scope Line Items through employee-owned Requests; address Contact
  reads without breaking the explicit manager-target GET/binding requirements.
  Preserve working submission/receipt and manager-lookup requirements. Keep
  dashboard publication and financial posting pending until security checks pass.
- Request Write retention is a compatibility step, not completed hardening:
  employee edits of approvals/sync/comments and financial fields must be blocked
  appropriately, with server validation, before enabling approval/accounting.

## 2026-10-13 Request-page balance display confirmed live by user

- After the User Context template deployment instructions, the user reports
  the request-page balance now displays instead of Unavailable. This is a live
  UI result reported by the user, not an independently inspected tenant trace.
- The displayed amount, nonzero ledger arithmetic, another employee's access,
  anonymous behavior, and cash posting/approval effects were not demonstrated.
  Do not treat this as verification of all financial or authorization behavior.
- No new code or tenant changes by the assistant in this confirmation step.
  Next gate is review of current Request permissions/web roles before publishing
  My Petty Cash Requests: Contact-scoped via Submitted By, with no overlapping
  Global employee reads. Preserve working submission/receipt privileges.
  Accounts posting and approval/backend work remain pending.

## 2026-10-13 User context moved from page attributes to a Web Template

- Live user output confirms the Modules global is an object. Request-page
  hidden identity attributes rendered literal `id` / `contactid`, even after
  a version-marker update. This stopped profile loading before any ledger read.
- An isolated probe in the existing Modules Web Template returned the same real
  signed-in Contact GUID for `user.id` and `user.contactid`. This confirms the
  Web Template context works in that session; the exact page-attribute rewriting
  or preview mechanism has not been established.
- Added `Petty Cash User Context.html`, Source for a new Web Template named
  exactly `Petty Cash User Context`. It renders escaped dynamic Contact ID,
  name/email, module ID, and the Accounts-role indicator. No hardcoded identity.
  It is a new required website record, locally prepared, not yet tenant-confirmed.
- All three local pages include User Context once before Modules. Removed page
  user-input attributes and the Accounts page's inline role check. Removed unused
  Department/Manager hidden inputs; profile lookups still come from the existing
  authenticated Contact API. Existing JavaScript input IDs/API contract unchanged.
- Role indicator is cosmetic only. Server page/flow/table authorization remains
  required; Accounts posting defaults remain disabled. No new column, table,
  financial rule, permission, site setting, or flow was implemented here.
- Added context-template regression checks and updated local browser QA to
  simulate both includes and verify one dynamic GUID input per expected ID.
- Updated README.md, BALANCE_MODULE_SETUP.md, and DATAVERSE_SETUP.md. Prior
  reviewed Word snapshots remain dated 2026-10-12 and contain old page-inline
  identity instructions; current Markdown guides supersede those instructions.
- Deployment: create User Context template from its local Source; replace page
  HTML with updated versions; remove temporary `pcIdentityProbe` from Modules
  Source without changing its script; sync and verify the dynamic GUID, then
  ledger balance. Actual ledger access and cross-user authorization still need
  live verification. Local tests cannot emulate the site's full Liquid engine.
- Verification: all 45 local unit/regression tests passed, including script
  synchronization and identity/include checks. Hidden Chrome dashboard and
  Accounts checks passed on desktop/mobile with simulated template output,
  one expected GUID input per ID, and mock API responses. No tenant writes.

## 2026-10-13 Shared Web Template replaces Web File upload

- User reports creating the `Petty Cash Modules` Web Template after the `.js`
  Web File upload failed with HTTP 400 on the enhanced-model
  `powerpagecomponents(...)/filecontent` path. Error response was evicted from
  DevTools; exact cause remains unknown. No attachment security list changed.
- Updated New Petty Cash Request.html, My Petty Cash Requests.html, and
  Accounts Cash Management.html to include the exact template name once with
  `{% include 'Petty Cash Modules' %}`, removing the external Web File request.
- Template Source must wrap the full canonical pettycash-modules.js in script
  tags. Changes to that JavaScript require updating the tenant template Source.
  Include goes in Liquid-rendered HTML, not the Custom JavaScript field.
- Updated the missing-module diagnostic in both the embedded submission script
  and pettycash-api.js. No expense/cash payloads or financial rules changed.
  Accounts remains disabled until its secured backend is configured/reviewed.
- Added a regression test for one include per page, load order, no old external
  dependency, and script safety inside the template. Browser QA now simulates
  the Liquid include using canonical source, not a mocked Web File request.
- Updated BALANCE_MODULE_SETUP.md, README.md, and DATAVERSE_SETUP.md. The
  2026-10-12 reviewed Word files/scripts remain historical snapshots of the old
  Web File approach; this guide/log supersedes that deployment instruction.
- Tenant template creation is user-reported; page deployment, CSP behavior,
  module execution, cross-employee authorization, and flows remain unverified.
- Verification: all 44 local unit/regression tests pass. Hidden Chrome checks
  pass for employee and Accounts pages on desktop/mobile with the simulated
  inline template and intercepted mock APIs only. No tenant data was accessed.

## 2026-10-13 Cash Transaction read settings reported configured

- User reports the requested Cash Transaction API settings and employee read
  permission are done. Screenshot verifies saved `Webapi/hr_cashtransaction/fields`
  on the Petty Cash website with `_hr_employee_value,_hr_linkedrequest_value,createdon,hr_amount,hr_notespurpose,hr_transactionreference,hr_transactiontype`.
- Saved permission: `Cash Transactions — Employee Read`; table
  `hr_cashtransaction`; Contact access; exact relationship
  `hr_cashtransaction_Employee_contact`; Read checked, Write unchecked.
- In a follow-up the user explicitly confirmed the Authenticated Users web
  role is assigned, only Read is allowed, and
  `Webapi/hr_cashtransaction/enabled=true` is created. These details are
  user-reported; no authenticated API/ownership test has been run.
- Historical next step (superseded by the Web Template entry above): publish `/pettycash-modules.js` as a Web File under Home with
  Published state and the local JavaScript attached as a Note. This is an
  instruction, not a reported completed deployment. Audit overlapping Global
  permissions before exposing the employee dashboard or enabling posting.
  Existing Contact/Request permissions must be inspected before changing them
  so the working submission and manager/department reads are preserved.
- Documentation updated only; no runtime code or tenant changes by assistant.

## 2026-10-13 Posting key confirmed by user

- Cash Transaction Posting Key schema: `crec6_PostingKey`; logical name:
  `crec6_postingkey`. The user reports the alternate key status is Active.
- This supersedes the earlier proposed `hr_PostingKey` / `hr_postingkey`.
  No duplicate column is needed. Backend Dataverse mappings must use the
  confirmed name; the browser JSON property remains `postingKey`.
- Updated BALANCE_MODULE_SETUP.md, WEBAPI_SITE_SETTINGS.md, and README.md.
  No runtime code, tenant setting, role, page, or flow was changed by the assistant.
- Confirmation is user-reported, not independently verified. Column type,
  length, and key membership were not separately shown in this update.
- The three reviewed Word documents and their regeneration/verification scripts
  remain dated 2026-10-12 snapshots, containing the old proposed column name.
  Use this entry and the current setup guide for the actual backend mapping;
  a future Word revision needs fresh export/render review, not the old PDFs.

## 2026-10-12 Balance modules

### Confirmed business rules and existing schema

- All employees start at zero; no opening-balance transaction is required.
- Positive means company cash held; negative means company owes the employee.
- Cash given, including reimbursement, adds to balance (Advance Given 123140000).
- Approved expense subtracts once (Expense Approved 123140001); both payment sources count.
- Cash returned by employee subtracts (Cash Returned 123140002). No arbitrary manual adjustments are implemented.
- Existing Cash Transaction logical name: `hr_cashtransaction`; entity set: `hr_cashtransactions`.
- Existing columns: `hr_employee`, `hr_transactiontype`, `hr_amount`, `hr_linkedrequest`, `hr_transactionreference`, `hr_notespurpose`.
- Existing Contact summary: `hr_currentbalance`. No extra balance table is created or required.

### Locally implemented

| Artifact | Functionality | Deployment state |
| --- | --- | --- |
| New Petty Cash Request.html / pettycash-api.js | Read-only balance widget, Refresh button, signed-balance explanation; balance failure does not break working request submission | Local changes; not deployed by this assistant |
| My Petty Cash Requests.html | Employee page: ledger-derived balance, own requests, saved approval status, manager comments, Refresh | User reports live page working as My Requests, partial URL My-Requests; broader checks pending |
| Accounts Cash Management.html | New accounts page: employee selection, balance, cash-given/cash-returned inputs, notes, server-confirmed posting | Local page fragment; posting disabled by default |
| pettycash-modules.js | Shared Web API reads, complete same-origin paging, ownership checks, money validation, ledger sum, safe text rendering, CSRF-protected flow transport and same-key retry protection | Initially Web File; replaced by shared Web Template on 2026-10-13 (see above) |
| pettycash-module-config.example.js | Per-site flow GUID and security-review switch; no secret URLs or credentials | Template example only; blank/disabled by default |
| tests/pettycash-modules.test.cjs | Ledger signs, empty balance, duplicate expense detection, ownership/paging security, flow transport/confirmation/retries | Local mocked tests; no tenant writes |
| scripts/verify_module_pages.cjs | Hidden-browser desktop/mobile checks with intercepted local mock APIs; plain-text manager-comment rendering | Verified locally; no Dataverse connection |
| scripts/correct_project_docs.py | Surgical schema, overview, and configuration corrections; source backups and Word comments | Corrected root Word documents finalized after PDF review |
| scripts/finalize_project_docs.py | Validates backup/current/corrected hashes, required text in DOCX and PDF, comment preservation, and rendered page counts before replacing originals | Ran successfully; originals backed up and verified replacements published locally |

### Documentation verification completed

Corrected Word candidates are in `documentation/corrected`. The selected
Windows runtime has no bundled LibreOffice; the supplied renderer fails to
resolve soffice.exe. A hidden Word-export fallback initially failed to start.
A follow-up connected to the already-open Word instance, but PDF export still
stalled without producing files. Only its verified helper was stopped; the
user's Word process/document was not closed. The user then exported all three
corrected copies to PDF in Office. Bundled Poppler rendered all pages, and
the assistant visually reviewed all 13 pages: schema 6, overview 4, configuration 3.
Content/ZIP/comment checks passed and the finalizer verified source backups and
PDF freshness before replacing the three root Word files. Original pre-edit
copies, including the user's modified overview, are preserved under
`documentation/backups/2026-10-12`; reviewed root files match corrected-copy
hashes. The QA manifest is `documentation/qa/word-verification.json`.
The renderer script can reuse an active Word instance, checks for unsaved
candidate changes, exports existing saved candidates without saving/closing
them, and closes only documents it opened itself. Manual Office PDF export
instructions in documentation/README.md document the fallback used to finish
this verification. No tenant configuration or financial posting occurred.

### Tenant changes required but not yet performed

- Posting Key was proposed here as `hr_postingkey`; creation and Active key
  were subsequently reported on 2026-10-13 as `crec6_postingkey` (see above).
- Create the `Petty Cash Accounts` web role; restrict accounts page and attached posting flow to it. Existing `hr_userrole` Choice alone does not authorize the page/flow.
- Set employee Contact/Request/Cash Transaction reads to self/contact scope; remove overlapping broad employee permissions before production.
- Add explicit field allow-lists detailed in BALANCE_MODULE_SETUP.md and WEBAPI_SITE_SETTINGS.md. No wildcard settings.
- Attach a solution-aware, role-protected accounts posting flow; fill its GUID and finish server validation/uniqueness testing before enabling cash posting.
- Implement approval/completeness processing and transaction-safe Contact summary maintenance. No approval flow, posting backend, or Business Central integration was deployed by this change.

### Earlier submission corrections included in documentation

- Department table is `hr_departments`; API entity set is `hr_departmentses`.
- Other Category `hr_othercategory` belongs to Line Item, not Request.
- Total Price `hr_totalprice` is Simple Currency, not Calculated; client writes and verifies it.
- Receipt is mandatory; one File column holds one file. Multiple files require related attachments/receipt rows and are not implemented here.
- No fallback that strips fields; header/lines are verified; known partial saves resume only on the same open page.

## Recording subsequent changes

Add a dated entry naming each new or changed page, file, column, key, table
permission, web role, website setting, flow, business rule, and test. State
whether it is local, configured in the tenant, or verified live, and identify
any migration/backfill or user action required.
