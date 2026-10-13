# Balance and employee portal module setup

## Business rules

Use the existing Cash Transaction table `hr_cashtransaction` / `hr_cashtransactions`.
Keep positive PKR amounts; derive the sign from `hr_transactiontype`:
123140000 Advance Given adds, 123140001 Expense Approved subtracts, 123140002
Cash Returned subtracts. Reimbursement is cash given. Both Own Pocket and
Company Cash approved requests subtract once. Pending/rejected requests never
create expense transactions. Everyone starts at zero. Do not delete existing
history to reset balances; agree how any test history is handled before launch.

The new pages calculate balance from all accessible transactions for the selected
employee, including every returned page. No records means zero. Invalid amounts,
unknown types, a duplicated expense request, another employee's record, or paging
errors produce an error rather than a misleading partial/zero balance.
`Contact.hr_currentbalance` remains the server-maintained summary; it must be
reconcilable to the ledger. This version does not directly overwrite it.

## Local artifacts and page deployment

Live status (2026-10-13, user-reported): the request-page balance widget now
displays after switching identity rendering to the User Context template.
This verifies the reported UI read path, not nonzero balance arithmetic,
cross-user authorization, or cash/approval posting. Before publishing the
employee dashboard, review Request access scope/Submitted By relationship and
role associations, including any overlapping Global employee permissions.

1. Create a Web Template named exactly `Petty Cash User Context` on the Petty
   Cash website. Paste the entire local `Petty Cash User Context.html` into its
   Source (HTML/Liquid, not wrapped in script tags). It renders dynamic escaped
   `portalUserId`, `portalUserName`, `portalUserEmail`, `pcModuleUserId`, and the
   cosmetic `pcAccountsAllowed` role indicator. No employee GUID is hardcoded.
   All three pages include it exactly once before `Petty Cash Modules`.
   Do not retain duplicate identity inputs or user-role Liquid in page Copy.
   Department/manager GUIDs continue to be read from the authenticated Contact
   API, not the removed unused hidden lookup inputs.
2. Create the shared Web Template named exactly `Petty Cash Modules` on the
   Petty Cash website. Its Source must contain `<script>`, the complete contents
   of the local canonical `pettycash-modules.js`, and `</script>` in that order.
   The user reports this template created and `window.PettyCashModules` is an
   object on the live request page. A temporary probe in the template also
   returned the signed-in Contact GUID for both `user.id` and `user.contactid`.
   Remove that temporary `pcIdentityProbe` block; leave the module script intact.
   No Page Template or new
   page is needed just to include this shared fragment. Do not put it in a
   global header/footer as well: load it exactly once on each consuming page.
   Update the template Source whenever the canonical JavaScript changes.
3. Replace New Petty Cash Request page code with its updated HTML. It loads
   `{% include 'Petty Cash User Context' %}` and then
   `{% include 'Petty Cash Modules' %}` before its inline submission script. Paste
   this into the page's HTML Copy or a Web Template that renders Liquid, not
   the Custom JavaScript field (Liquid is server-side). The balance
   widget uses existing employee context and does not block expense submission.
4. Create the authenticated page `My Petty Cash Requests`, suggested partial URL
   `my-petty-cash-requests`, using the supplied HTML fragment. Create its Web
   Template/Page Template if your deployment uses templates; the local fragment
   does not create these tenant records. Add it to employee navigation.
5. Create `Accounts Cash Management`, suggested partial URL `accounts-cash`,
   using its HTML. Restrict page access and navigation to `Petty Cash Accounts`.
   Hiding navigation or the Liquid check is not authorization.
6. Copy `pettycash-module-config.example.js` into the Accounts page template
   before the shared script. Keep the flow blank/disabled until the backend and
   role checks are verified. Do not additionally load this shared script twice.
7. Publish/sync changes, refresh configuration through Design Studio Preview,
   and sign in again when roles change.

Pages use safe DOM text for employee names, errors, and manager comments.
Refresh reads saved values; it is not a push/live-stream update. Power Pages
server-side caching may delay another process's writes. After an accounts
posting, the UI uses the trusted flow's returned balance immediately.

### Web File upload fallback replaced

The initial Web File upload was rejected with HTTP 400 at
`powerpagecomponents(...)/filecontent`; the browser's response body was evicted.
The exact rejection reason remains unknown, not a confirmed extension block.
This path indicates enhanced-model file storage; the earlier Notes attachment
instructions were for the standard model. No blocked-file security setting was
changed. The shared Web Template now replaces the Web File dependency in all
three local pages; no `/pettycash-modules.js` request is needed. Leave any unused
Web File record alone for now. Open in VS Code can edit existing site content,
but should not be treated as a bypass for attachment restrictions.

After deploying the request page, sync/Preview and hard-refresh the signed-in
live page. In its console run `typeof window.PettyCashModules`; expect `object`.
Also inspect `document.getElementById('portalUserId').value`: it must be the
current signed-in Contact GUID, not `id`, `contactid`, or an unresolved Liquid
expression. The `pcUserContext` wrapper has version `web-template-v1` to confirm
the new template is actually rendered. Inspect the page in a separate signed-in
browser session, not just the design canvas. If anonymous, the ID must be blank
and the Accounts role indicator false; do not introduce a hardcoded fallback.
Refresh the balance widget: an empty accessible ledger displays `0.00`, otherwise
the signed ledger sum. No cash writes or flow enabling is needed for this test.
If the include appears literally in page source or the module is `undefined`,
verify the exact template names, website, context/include order, script tags, and that the host field
renders Liquid. If the browser reports an inline-script CSP violation, inspect
the existing CSP configuration rather than weakening it globally.

## Website settings

Preserve fields used by the working submission page. Union these new fields
with the corresponding existing allow-lists, not replace them blindly:

| Setting | Additional value/fields |
| --- | --- |
| Webapi/contact/enabled | true |
| Webapi/contact/fields | contactid,fullname,hr_currentbalance,statecode |
| Webapi/hr_pettycashrequest/fields | hr_managercomments (existing request id/title/date/total/source/status and _hr_submittedby_value remain required) |
| Webapi/hr_cashtransaction/enabled | true |
| Webapi/hr_cashtransaction/fields | _hr_employee_value,_hr_linkedrequest_value,createdon,hr_amount,hr_notespurpose,hr_transactionreference,hr_transactiontype |

Cash ledger access from these pages is read-only. Its write lookup navigation
properties and `crec6_postingkey` need not be exposed to the portal: the trusted
posting backend uses Dataverse directly. Keep `Webapi/error/innererror=false`
after troubleshooting. No new special balance site setting is required.

## Roles and table permissions

User's 2026-10-13 screenshot shows saved `Cash Transactions — Employee Read`
on `hr_cashtransaction`, Contact access, relationship
`hr_cashtransaction_Employee_contact`, Read checked and Write unchecked.
The field allow-list above is also shown saved. In a follow-up the user
confirmed Authenticated Users is assigned, only Read is allowed, and
`Webapi/hr_cashtransaction/enabled=true` is created. These details are
user-reported. Overlapping permissions and live cross-employee authorization
still need verification. The shared Modules Web Template/global object and its
signed-in identity probe have been confirmed by user output. The new separate
User Context change was followed by the user's confirmation of a displayed
request-page balance. Cross-user authorization and nonzero totals remain
unverified, as do the employee dashboard and Accounts page deployments.

Employee role: Self Read on Contact; Contact-scoped Read on Request through
Submitted By; Contact-scoped Read on Cash Transaction through Employee;
Parent-scoped Line Item reads through the employee's Request. Preserve required
Create/Append/receipt privileges for the working form while verifying scoping.
Do not grant employees Write on `hr_currentbalance`, approval status/comments,
or ledger rows. Server-side validation must also prevent spoofed submitters and
approvers; hidden input values and client ownership checks are not security boundaries.

Accounts role: read authorized employees' Contact records (needed fields only)
and their Cash Transactions. No portal ledger Create/Write/Delete or direct
Contact balance Write is needed for the accounts page; the attached backend
performs writes after validation. Protect the page AND flow. Existing
`hr_userrole` Choice does not automatically create/assign a Power Pages web role.
Audit overlapping Global employee permissions: they can undermine limited reads.

The latest 2026-10-13 permission-list screenshot still shows Global Contact,
Request, and Line Item permissions; Request also allows Write. Their web roles
are not visible. Review those associations before publishing the dashboard;
if Authenticated Users is attached, adding a narrower permission alone does
not remove the existing broad grant. No permission changes were made during
this review. Manager Contact lookup/read needs must be retained when narrowing
Contact access; do not blindly switch the only Contact permission to Self.

## Confirmed posting-key schema

On 2026-10-13 the user confirmed the Cash Transaction column logical name
`crec6_postingkey`, schema `crec6_PostingKey`, and an Active alternate key.
This supersedes the proposed `hr_postingkey` / `hr_PostingKey` names in the
2026-10-12 Word snapshots and their historical correction scripts. The assistant
has not independently inspected the tenant. Text type, max length 100, and key
membership (Posting Key only) remain the intended configuration; these details
were not separately confirmed in the user's update.
No new table is needed. Reject null/empty posting keys in the posting backend.
Do not assume the autonumber Transaction Ref prevents duplicate financial
events: different rows can have different references for the same expense.

Accounts movements use one UUID per operation, unchanged on retries in the
same open page. Expense posting uses a deterministic value such as
`expense-<request-guid>`. Map the browser/flow input `postingKey` to Dataverse
`crec6_postingkey`; do not rename the JSON input or create a duplicate column.
Capture the authenticated accounts actor in server audit history; never trust
an actor ID supplied in a browser payload. If your backend cannot identify that
actor reliably, add an actor lookup only after deciding its trusted source.

## Accounts posting backend contract

Create a solution-aware flow with `When Power Pages calls a flow`, attach it
to the site, and allow ONLY `Petty Cash Accounts` (not all authenticated users
or Anonymous). Use the generated Power Pages flow GUID, not a public signed
HTTP URL. Set `accountsFlowId` and then `accountsSecurityReviewed=true` only
after the negative authorization tests below pass.

The documented browser transport is form-encoded `eventData` containing JSON.
The flow input names must match exactly. Its Dataverse create/find operations
must use `crec6_postingkey` for the generic `postingKey` input:

```json
{"employeeId":"<contact-guid>","movement":"cash_given","amount":1000,"notes":"Cash advance","postingKey":"<operation-uuid>"}
```

`movement` can ONLY be `cash_given` or `cash_returned`. The browser cannot post
an expense approval. Use the supplied confirmed transaction choice values on
the server, require an active authorized employee, positive two-decimal amount,
nonempty reason up to 100 characters, and a nonempty posting key. Enforce these
rules on the server regardless of the HTML checks.

Use a uniqueness-enforced, transaction-safe posting implementation. A flow that
blindly reads a Contact balance and writes old balance +/- amount can lose
concurrent updates. A sequence of Add row then Update Contact is also not atomic.
Use a Dataverse server-side transaction/plugin/custom API with duplicate-safe
posting and summary update, or treat the ledger as authoritative and maintain
the summary through a separately reconciled, concurrency-safe process. Do not
claim completed posting until the selected design is durably recorded.

On a retry, find the same posting key, compare employee/type/amount/reason, and
return the original confirmed result; reject a different payload using that key.
Return HTTP 200 with typed response values (balance must be a number):

```json
{"status":"posted","postingKey":"<same-operation-uuid>","employeeId":"<same-contact-guid>","transactionId":"<cash-transaction-guid>","balance":1000}
```

HTTP 202 or missing/mismatched confirmation is NOT success. The local page
keeps the posting key and blocks changing the operation after an uncertain
result. Keep the page open for recovery; closing/reloading loses that in-memory
key. Accounts must check the reference before starting another operation.

## Approval flow and completeness

This change does not deploy an approval flow or completion marker. Before one
runs, validate that all intended lines and the mandatory receipt are saved,
employee identity/manager relationships are correct, and totals reconcile.
Never trigger a deduction solely because the request header exists. Post one
Expense Approved row with required Linked Request only after a trusted approval.
Prevent repeated updates/retries from posting twice. Approved expenses must not
be editable or deletable in a way that silently changes accounting history.

## Verification before enabling writes

- Empty employee ledger displays zero; +1000 cash given, -1200 approved expense,
  -100 returned cash displays -300. Reimbursement +300 restores zero.
- Employee A cannot read Employee B's Request, Contact balance, or ledger even
  through direct API calls. Test permissions, not just UI filters.
- Non-accounts user cannot open the accounts page or invoke the flow directly.
- Accounts selection handles duplicate names using the Contact GUID, not username text.
- Repeated posting key creates one row; altered data with the same key is rejected.
- Two concurrent movements do not lose balance updates; a failed summary update
  is recoverable without creating another financial transaction.
- Flow failures/202 responses never show successful cash posting.
- Pending/rejected/partial requests create no expense deductions.
- New pages do not break the existing submission tests.

Run `node --test --test-isolation=none tests/*.test.cjs` locally. These mocks
cannot prove real tenant authorization, flow mappings, or concurrent posting.

## References

- [Power Pages cloud-flow integration](https://learn.microsoft.com/en-us/power-pages/configure/cloud-flow-integration)
- [Power Pages table permissions](https://learn.microsoft.com/en-us/power-pages/security/table-permissions)
- [Liquid template includes](https://learn.microsoft.com/en-us/power-pages/configure/liquid/template-tags#include)
- [Dataverse alternate keys](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/define-alternate-keys-entity)
- [Dataverse concurrency](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/optimistic-concurrency)
