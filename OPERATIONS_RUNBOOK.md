# Petty Cash Operations Runbook

Baseline 2 November 2026. Read [HANDOVER.md](HANDOVER.md) first. Named business,
Finance, platform and support owners are to be assigned in the handover checklist.
This runbook does not authorize arbitrary production financial corrections.

## Employee requests

1. Sign in. The balance is company cash held when positive and money owed when
   negative; a negative balance does not block a request.
2. Open New request. Choose date, category, payment source and method. Suggestions
   enter product names; fill quantity, unit and price per selected unit. Positive
   fractional quantities are allowed; there is no automatic unit conversion.
   Enter Other Category when used.
3. Select one PDF or up to ten JPG/PNG images. Reorder images, prepare and inspect
   the PDF preview. A receipt and purpose are required.
4. Submit once. On a known partial save, keep the page/form unchanged and use its
   resume action. An uncertain create requires administrator inspection before
   another attempt. Do not reload to clear an unresolved submission.
5. My Requests shows the decision and manager feedback. Search/status filtering
   applies locally to loaded records. Pending/rejected requests do not post cash.

## Finance cash movements

Choose the employee carefully; the directory includes username and a GUID hint
to distinguish duplicate names. Review their ledger balance/history. Choose
Cash given (+) when the company hands money to the employee, including a cash
advance or reimbursement; choose Cash returned (−) when the employee hands cash
back. Enter the positive amount physically transferred, reference, confirmation
and submit. The projected balance is an estimate, not a confirmed posting.

The Finance operator cannot post either direction to their own account; another
authorized Finance person must record it. Own viewing/Refresh remains allowed.
A successful posting creates a new ledger event through the flow.
Do not change Contact.hr_currentbalance to fix a website balance.

If the page says the movement was saved but Refresh failed, refresh the balance
only. If it says unconfirmed, keep the page open and retry the same movement
using the same posting key. Never generate a fresh key or repeat a cash handover
simply to refresh the display.

## Administrator onboarding

Create one Contact profile using the seven Admin fields. The form initializes
username, login-enabled and zero summary; it does not provision a password or
grant website web roles. Open that same Contact in Management, use Change
Password with an appropriately privileged operator, assign required web roles
separately, and test sign-in as the employee. Use the All/Active Contacts view if
the record is absent from a filtered list. Do not recreate it for password setup.

Do not collect/email plaintext credentials, write hashes, or expose password,
new-password input or security-stamp fields through the portal API. Native
Forgot Password email was previously failing and must be verified before it is
promised as a supported recovery route. Refer recovery to the platform owner
until that path has passed acceptance.

## Manager approval support

An accepted request should reach the assigned manager only after all products
and the receipt are ready. Approval should set the decision and create one linked
Expense Approved row; rejection must not create an expense row. Monitor the
native flow run history and reconcile a decision written before a failed cash
insert. Do not rerun an approval against real cash merely to test the flow.
Final duplicate/readiness/recovery configuration remains to be reviewed from
the actual flow export and acceptance runs.

## Troubleshooting

| Symptom | Inspect and next action |
|---|---|
| Finance read-only mode | Read PC_MODULE_CONFIG and PettyCashModules.flowReady(). Expected this site's invocation GUID and Boolean true, config before Modules. Publish the source correction, then reload after pending work is resolved. |
| Form not visible or duplicated | Check paired page/template versions, native page role, one form/include/context, and inline display:none. Replace content rather than append another fragment. |
| Contact association 403 | Review lookup Append/Append To and target permissions, including manager binding. Do not fix by widening employee Contact Read globally. |
| Request setup probe passes but save fails | Probe reads do not prove create/association/file-upload privileges. Inspect the failing stage and native response; preserve all fields and any saved ID. |
| File/PDF error | Check supported format, dimensions, input/output limits, live file-column limit and complete bundled receipt template. No reduced request should be submitted as a fallback. |
| Flow POST fails with no run | Inspect site invocation mapping, role binding, session/CSRF, AJAX header and native response. Keep the pending key. A maker flow GUID is not the site invocation GUID. |
| Parse_Posting_Key fails | Verify Content is evaluated JSON, not text beginning addProperty; omit unsupported pattern properties from Parse JSON schema. |
| Balance/history is stale | Use read-only Refresh; portal caching can delay backend writes. Resolve pending operations before a hard refresh. Do not post compensating money just to alter the screen. |
| Duplicate expense/invalid ledger | Balance reader intentionally refuses a partial/unsafe sum. Escalate with request/transaction references for reconciliation; do not ignore errors or delete a row automatically. |
| Contact summary differs from website | Website totals cash rows. Check any backend summary writer and repeated approval effects; do not replace the authoritative ledger with that summary. |

Useful read-only browser checks:

```js
console.log(window.PettyCashModules?.version);
console.log(window.PettyCashModules?.flowReady());
console.log(window.PettyCashAdmin?.version);
await window.pettyCashDiagnostics?.checkSetup();
```

Use diagnostics only on the relevant signed-in page. Remove personal data and
tokens from shared evidence. A probe returning success does not verify all write
or permission paths. Current module/Admin versions are finance-posting-v5 and
admin-profiles-v3; context is web-template-v2-finance; receipts receipt-pdf-v1.

## Deploying a change

Preserve the source commit, native export and current template/configuration
before editing. Review changes, run relevant checks, publish matching page and
template files, then sync and verify in the actual site. Finish or investigate
pending operations before changing loaded scripts. Never enable generic blank
config examples on the working site. Keep each context/helper include once.

Generate UI, receipt, shell and Home templates with their scripts documented in
HANDOVER.md. Do not edit a generated bundle while leaving its canonical source
stale. Test restored files/configuration after rollback. Reverting source does
not roll back posted cash, approval decisions, Contact creation or uploaded data;
those require a separately reviewed business reconciliation.

## Local verification

From repository root using the tested Node runtime:

```powershell
node --test --test-isolation=none tests/pettycash-api.test.cjs tests/pettycash-modules.test.cjs tests/pettycash-admin.test.cjs tests/pettycash-receipts.test.cjs tests/pettycash-suggestions.test.cjs tests/pettycash-shell-home.test.cjs
node scripts/build_ui_styles.cjs --check
node scripts/build_request_page.cjs --check
node scripts/build_home_template.cjs --check
node scripts/build_shell_template.cjs --check
node scripts/verify_handover.cjs --date 2026-11-02
```

Unit checks do not need tenant access. Browser/PDF QA scripts in scripts/verify_*
currently use the developer's Codex dependency path and installed Windows Chrome
path; they are not portable as-is. An incoming developer must provide equivalent
Playwright, Chrome, sharp, pdf-lib, pdfjs-dist and canvas dependencies and adapt
those test-only paths. This does not affect deployed website runtime, which
uses its bundled PDF library. Do not claim a new machine's browser QA passed
until that environment is configured and run results recorded.

## Monitoring and incidents

Platform owner monitors flow failures, disabled/expired connections, approvals
waiting too long, site access/errors, storage/capacity and backups. Finance owner
reconciles cash movements and approved-expense uniqueness. Agree the cadence,
alert recipients, support hours and escalation contact before handover.

For an incident, record UTC time, environment, page/flow version, failure stage,
request/transaction ID and posting key when applicable. Obtain the native run
error without distributing tokens, passwords or unrestricted personal exports.
If writing is unsafe, disable the relevant client release switch and restrict/
disable the native write flow through authorized operations; a UI flag alone
does not block a direct native call. Preserve evidence and validate recovery
before normal posting resumes.
