# Petty Cash Handover Checklist

As of 9 November 2026. Technical documentation is available; **company acceptance
is pending**. An unchecked item requires evidence or a company decision. Record
the actual result, date, environment and reviewer rather than assuming success.

## Documentation delivered locally

- [x] Current implementation and deployment inventory: HANDOVER.md.
- [x] Staff/support/recovery instructions: OPERATIONS_RUNBOOK.md.
- [x] Correct Finance role/key/configuration and old Accounts/credential paths identified.
- [x] UI, Home/Header/Footer, receipts and suggestions deployment covered.
- [x] Product Unit dropdown and `hr_unit` setup documented in PRODUCT_UNITS_SETUP.md.
- [x] User confirmed the updated request saves its unit to Dataverse, with all
  setup checks passing (3 November 2026).
- [ ] Verify native `hr_unit` type/length in the exported schema, specific
  distinct-unit/fractional examples and approval-email display if required.
- [x] Documentation audit and local verification report; historical Word references identified.
- [ ] If company requires Word deliverables, reissue the original three DOCX files
  from the current baseline and perform fresh rendered-page review. The old Word
  files are not current substitutes for HANDOVER.md.

## User confirmed completion on 2 November 2026

- [x] Manager approval duplicate protection completed, as reported by the user.
- [x] Header, Footer and Home published, as reported by the user.

These confirmations establish reported completion/publication, not an exported
definition review or each individual acceptance result below. Keep the remaining
evidence, ownership and sign-off items open until recorded.

## Clarification runtime confirmation on 9 November 2026

- [x] User confirms manager Need Clarification -> employee answer on My Requests
  -> new manager approval email automatically, following retest without manual update.
- [ ] Complete this resumed Request's final approval and confirm exactly one
  linked Expense Approved transaction and correct single ledger deduction.
- [ ] Verify boss-stage clarification/resumption and rejection behavior separately.
- [ ] Confirm temporary Trigger Test and manual diagnostic Update action disabled/removed.

These are user-reported native results, not an independent full flow/export audit.

## Deferred freshness upgrade - user decision on 9 November 2026

- [x] Record user decision: no additional live-read flow unless requested by manager.
- [x] Existing portal cache lag / possible stale question after reload documented
  in documentation/plans/DATA_FRESHNESS_PLAN.md; current behavior retained. No freshness fix implemented.

This deferred feature is not an outstanding development requirement for this
iteration. Company acceptance still needs the cache limitation communicated.

## Native assets and access

- [ ] Company-controlled source repository and agreed release commit/tag recorded.
- [ ] Current Power Pages configuration/site export, matched to actual data model.
- [ ] Dataverse solution export: tables, columns/types, relationships, choices,
  alternate keys, privileges and relevant model-driven management components.
- [ ] Native Finance and manager approval flow definitions/solution export,
  connection references and environment variables/dependencies.
- [ ] Current page/table/column permissions, web-role associations and site settings exported.
- [ ] Company application owner, platform administrator, Finance owner, support
  contact and escalation route recorded; departing developer is not the sole owner.
- [ ] Flow owners and connection accounts reviewed/rebound under company control.
- [ ] Target tenant/environment/site URLs/IDs, licenses/capacity, mail/authentication
  dependencies, domain/certificate responsibility and storage needs recorded.
- [ ] Restore/rollback package, retention and restore responsibility agreed and tested.
- [ ] Vendor license included; no passwords, tokens, private financial data or
  unrestricted run exports included in ordinary documentation/source delivery.

## Approval flow checks requiring native evidence

- [ ] Added-request trigger cannot consume an incomplete header before lines/receipt.
- [ ] Correct manager, receipt and item details reach one intended approval.
- [ ] One approved request creates exactly one linked Expense Approved cash row.
- [ ] Rejection creates no expense row; ordinary status updates do not trigger reapproval.
- [ ] Stable request-derived key populated; existing blank-key history handled safely.
- [ ] Existing-row match/multiple/mismatch paths complete; no temporary Cancelled
  checkpoint is mistaken for a completed duplicate-recovery implementation.
- [ ] Concurrent/replayed approvals cannot double post; currency, amount and actor correct.
- [ ] Contact summary writer removed or reconciled safely; repeated subtraction ruled out.
- [ ] Failure after decision update but before cash insert has a documented recovery.

## Live acceptance matrix

| Test | Expected result | Evidence and reviewer |
|---|---|---|
| Employee creates multi-item request with images | Complete fields, one readable PDF, correct rounded lines and grand total | Pending |
| Product units and fractions | Required units saved per line; 1.5 Liter × 280 and 0.5 Kilogram × 600 total 720 | Unit save/setup user-confirmed 3 November; specific fractional example locally tested, live result pending |
| Partial/uncertain request save | Resume known saves; no blind duplicate creates | Pending |
| Own data and cross-employee direct API | Own permitted; another employee denied | Pending |
| Employee changes protected decision/identity fields | Native policy prevents unauthorized approval/status/lookup mutation | Pending |
| Finance cash given and returned | Correct ledger signs and displayed balances | User reported working; attach controlled results |
| Finance same-key replay/uncertain response/concurrency | Same durable event, no duplicate/lost money | Pending |
| Finance own-account movement via direct native call | Server rejection and no row created in both directions | Guard reported installed; native evidence pending |
| Employee/Admin without Finance role calls Finance flow | Denied by server role binding | Pending |
| Approval and rejection | Correct decision, unique expense on approval only | Duplicate protection user-confirmed complete; attach native acceptance results |
| Admin profile and supported password setup | One Contact, username, lookups, zero start, successful sign-in | User reported working; attach controlled results |
| Employee attempts Admin creation/direct API | Denied by native permissions | Pending |
| Password/hash/new-password API read/write exposure | No unauthorized access; retained experimental plaintext addressed | Pending |
| Forgot Password | Email/reset works, or approved documented manual recovery | Prior error unresolved in record |
| Header/Footer/Home | Native account/search/language/mobile controls work; correct role shortcuts and own data | Publication user-confirmed; attach formal live acceptance results |
| Clean environment restore | Site, schema, connections and flows rebind and smoke tests pass | Pending |

Use a test environment or approved controlled test records. Do not create
unexplained production cash movements just to fill this checklist.

## Sign off

| Responsibility | Named owner | Date and evidence |
|---|---|---|
| Business acceptance | To be assigned | Pending |
| Finance reconciliation and operational policy | To be assigned | Pending |
| Platform permissions and connection ownership | To be assigned | Pending |
| Source/export custody and restore | To be assigned | Pending |
| Support readiness | To be assigned | Pending |

ERP synchronization and any further login-page redesign are not delivered
capabilities unless separately implemented and accepted. A completed documentation
audit or a passing local test run does not approve these outstanding items.
