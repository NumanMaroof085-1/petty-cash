# Petty Cash Project Handover

**Current navigation and runtime note, 9 November 2026:** files are grouped by
page/component/flow; see the [root README](../../README.md) and
[folder guide](../PROJECT_STRUCTURE.md). Manager clarification/answer/automatic
review resumption and subsequent smooth boss approval are user-reported working.
Final acceptance items remain in HANDOVER_CHECKLIST.md. The live-read freshness
flow is explicitly deferred by the user; cache delay is a retained limitation.
The older dated addition below is history and does not override these updates.

**In-progress addition, 8 November 2026:** My Requests clarification replies are
implemented and publication is now user-reported: question card visible and
feature version/ready checks correct. It is not independently inspected. The
answer flow URL is confirmed;
its corrected trigger now declares both required inputs. Compose/caller mappings,
native delivery and acceptance remain pending. Main-flow resumption is now
user-reported configured, not runtime-verified. See
[CLARIFICATION_UI_SETUP.md](../../pages/my-requests/CLARIFICATION_UI_SETUP.md)
and [CLARIFICATION_SETUP.md](../../flows/clarifications/CLARIFICATION_SETUP.md); this is outside the accepted
deployment baseline described below.

**Documentation baseline: 2 November 2026.** Start here when taking over this
project. This guide describes the checked-in implementation and user-reported
tenant setup. It is not a certificate that the production site, permissions or
flows have passed acceptance testing.

The website source and current deployment/operation instructions are available.
Final company sign-off still requires the native website/solution/flow exports,
company ownership and connection assignments, and the checks in
[HANDOVER_CHECKLIST.md](HANDOVER_CHECKLIST.md). On 2 November the user confirmed
manager approval duplicate protection is complete and Header/Footer/Home are
published. Final expressions, exported definitions and acceptance runs have not
been independently reviewed.

## Which documentation to use

1. This document defines the current implementation baseline.
2. [OPERATIONS_RUNBOOK.md](OPERATIONS_RUNBOOK.md) covers normal use and support.
3. [HANDOVER_CHECKLIST.md](HANDOVER_CHECKLIST.md) records missing delivery assets
   and acceptance evidence. Unchecked items are not implicitly complete.
4. [DOCUMENTATION_AUDIT.md](DOCUMENTATION_AUDIT.md) records the audit findings.
5. Detailed current guides: [UI refresh](../../shared/styles/UI_REFRESH_SETUP.md),
   [Header Footer Home](../../shared/shell/SITE_SHELL_HOME_SETUP.md),
   [Admin profiles](../../pages/admin/ADMIN_PROFILE_SETUP.md), [Finance](../../pages/finance/FINANCE_SETUP.md),
   [self posting](../../flows/finance/FINANCE_SELF_POSTING_SETUP.md),
   [receipt PDF](../../shared/receipts/RECEIPT_PDF_SETUP.md),
   [item suggestions](../../pages/new-request/ITEM_SUGGESTIONS_SETUP.md),
   [product units](../../pages/new-request/PRODUCT_UNITS_SETUP.md), and
   [Web API settings](../platform/WEBAPI_SITE_SETTINGS.md).

The long Finance flow guide, implementation log, older Accounts instructions,
credential experiment and original Word documents are development records.
They contain superseded steps. Do not combine their old recipes with the current
implementation. The three original DOCX files and copies in
documentation/corrected are an older planning/schema baseline, not the current
handover specification; they have not been reissued as current Word deliverables.

## System and business rules

Power Pages provides the website and local sign-in. Dataverse stores Contacts,
Departments, expense requests, line items and cash transactions. Power Automate
handles Finance postings and manager approval using its Dataverse connection.

The **Cash Transaction ledger is authoritative for website balances**:

| Event | Choice value | Balance effect |
|---|---:|---:|
| Advance Given or reimbursement paid | 123140000 | Add amount |
| Expense Approved | 123140001 | Deduct amount once per request |
| Cash Returned by employee | 123140002 | Deduct amount |

Everyone starts at zero. Positive means company cash held; negative means the
company owes the employee. Negative balances are allowed. Pending/rejected
requests do not change the ledger. Enter the cash movement amount, not a new
replacement balance. Amounts are positive values; the transaction type supplies
the sign. Approved expenses are deductions regardless of payment source.

Contact.hr_currentbalance is retained as a summary field and initialized to zero
when Admin creates a profile. Website balance readers use the ledger, not that
summary. The user-created approval flow was shown updating the Contact summary;
its current treatment and reconciliation remain an acceptance item.

## Features and recorded status

| Area | Implementation and evidence |
|---|---|
| New request | Header, products, totals, mandatory receipt, lookup bindings and recovery implemented. User reported successful saves and populated fields. |
| Product units | Required 23-option dropdown per line, text saved/read back through hr_unit, fractional quantities and preserved suggestion/retry behavior. User confirmed a successful live unit save on 3 November and supplied all-passing setup diagnostics; specific fractional/email acceptance remains separate. |
| Suggestions | Category-specific product-name shortcuts; reuse untouched blank row, preserve edited rows, focus existing item on repeat. User reported working. |
| Receipts | One PDF or 1–10 ordered JPG/PNG images converted locally into one PDF. User reported working. |
| My Requests | Own ledger balance, request history/comments, search/status filters, counts and mobile cards. User reported the page working; exact route My-Requests. |
| Finance | Ledger viewing, given/returned movements, confirmation and safe retries. User reported successful posting and correct history/balance. Native duplicate/concurrency/authorization evidence is still required. |
| Self posting | Client rejects both own cash directions. User reported adding the native Finance guard; reviewed native denial/no-write evidence is absent. |
| Admin Users | Seven-field Contact profile creation, separate username, department/manager, zero summary, duplicate checks and readback. Management Change Password/sign-in were user-confirmed. |
| Four-page UI | Implemented and locally tested; user said the new UI looked good. Finance read-only config issue was subsequently user-confirmed fixed. |
| Header Footer Home | Implemented and locally tested on 1 November; user confirmed publication on 2 November. Formal live acceptance evidence remains to be attached. |
| Manager approval | User built the flow and confirmed duplicate protection complete on 2 November. The final native definition/expressions and controlled acceptance runs have not been reviewed. |
| Password reset email | A prior native Forgot Password attempt returned an error. Resolution/email configuration is not recorded; manual management password setup is the confirmed path. |
| ERP integration | hr_erpsyncstatus exists and is initialized. No implemented/tested ERP synchronization is established by this repository. |

## Source to website map

| Local source | Destination |
|---|---|
| pages/new-request/New Petty Cash Request.html | Existing New Petty Cash Request page |
| pages/my-requests/My Petty Cash Requests.html | Existing My Requests page; /My-Requests/ |
| pages/finance/Finance Cash Management.html | Existing Finance page; /Finance-Cash-Management/ in project navigation |
| pages/admin/Admin Users.html | Existing Admin Users page; /Admin-Users/ in project navigation |
| pages/home/Home.html | Existing Home page Copy; one Petty Cash Home include |
| shared/shell/Header.html and shared/shell/Footer.html | Existing Header and Footer Web Template Source |
| pages/home/Petty Cash Home.html | Petty Cash Home Web Template; complete file |
| shared/identity/Petty Cash User Context.html | Petty Cash User Context Web Template; complete file |
| shared/modules/pettycash-modules.js | Petty Cash Modules Web Template, inside one script wrapper |
| pages/admin/pettycash-admin.js | Petty Cash Admin Web Template, inside one script wrapper |
| shared/receipts/Petty Cash Receipts.html | Petty Cash Receipts Web Template; complete generated file with library/wrappers |

The receipt/home/header HTML files already contain required script/style tags.
Do not wrap the whole file again, remove required Liquid processing, duplicate
identity includes, append another form, or upload the plain JS as a substitute
for the bundled receipt template. documentation/archive/retired-pages/Accounts Cash Management.html is retired.

`pages/new-request/pettycash-api.js` is the canonical request script mirrored in its page's inline
script; do not load both. Other canonical sources/builders:

- pages/new-request/pettycash-api.js → scripts/build_request_page.cjs → pages/new-request/New Petty Cash Request.html inline script.
- shared/styles/pettycash-ui.css → scripts/build_ui_styles.cjs → four application fragments.
- shared/receipts/pettycash-receipts.js plus pinned vendor library → scripts/build_receipt_template.cjs.
- shared/shell/pettycash-shell.css/js → scripts/build_shell_template.cjs → Header.html.
- pages/home/pettycash-home.css/js plus existing UI CSS → scripts/build_home_template.cjs.

## Environment specific configuration

| Item | Recorded value or action |
|---|---|
| Finance site invocation GUID | 0b0976ac-a6d3-f111-a05d-70a8a52176fd |
| Finance maker flow GUID | ac94fb2d-b491-3d0c-0ab8-f3431a5c7e57; not the site invocation GUID |
| Finance page config | financeFlowId above; financeSecurityReviewed Boolean true in this site's HTML |
| Reusable config and script defaults | Blank GUID and false; intentionally disabled for unconfigured sites |
| PKR currency row | f8719944-3bac-f111-aaab-70a8a52176fd; user-supplied, environment-specific |
| Admin page config | creationEnabled/securityReviewed true for the reported restricted setup; script defaults remain false |
| Target environment | Company must record tenant, environment, organization URL, site ID/URL and owners from the actual admin center |

Load the page config before its shared script include. A browser global changed
after script initialization does not update the script's captured configuration.
Check PettyCashModules.flowReady() after publication. An invalid/disabled config
shows read-only mode. Rebind invocation/currency IDs when moving environments;
these values must not be assumed portable. They are identifiers, not credentials.

## Data model

Names below are sourced from client configuration and user-supplied metadata,
not a current tenant metadata export. Use the native solution export as the final
authority for column types, precision, required fields and relationship schema.

| Table logical name | API entity set | Primary ID |
|---|---|---|
| contact | contacts | contactid |
| hr_departments | hr_departmentses | hr_departmentsid |
| hr_pettycashrequest | hr_pettycashrequests | hr_pettycashrequestid |
| hr_pettycashlineitem | hr_pettycashlineitems | hr_pettycashlineitemid |
| hr_cashtransaction | hr_cashtransactions | hr_cashtransactionid |

- Requests: hr_requesttitle, hr_totalamount, hr_purpose, hr_transactiondate,
  hr_paymentsource, hr_paymentmethod, hr_approvalstatus, hr_erpsyncstatus,
  hr_managercomments, hr_receiptimage, hr_submittedby, hr_department,
  hr_assignedmanager. Lookup navigation names are hr_SubmittedBy, hr_Department
  and hr_AssignedManager. Request status Pending/Approved/Rejected uses
  123140000/123140001/123140002.
- Line items: hr_itemname, hr_quantity, hr_unit (Text, maximum 30), hr_unitprice, hr_totalprice, hr_category,
  hr_othercategory, hr_parentrequest; parent navigation hr_ParentRequest.
  **hr_totalprice is a Simple currency column**, supplied by the client as rounded
  quantity × unit price. Other Category belongs on each line, not the request.
- Cash: hr_amount, hr_transactiontype, hr_transactionreference, hr_notespurpose,
  hr_employee, hr_linkedrequest, hr_recordedby, createdon and native currency.
  hr_transactionreference was selected for autonumber CT-{SEQNUM:6}; confirm the
  actual tenant format/seed. Notes are limited to 100 characters by the client.
- Posting key: **crec6_postingkey**, schema crec6_PostingKey, Text with an Active
  alternate key reported by the user. Do not create/use the old proposed
  hr_postingkey. Operator lookup hr_recordedby and primary ID were user-supplied.
- Contact: firstname, lastname, fullname, emailaddress1, adx_identity_username,
  adx_identity_logonenabled, statecode, hr_userrole, hr_currentbalance,
  hr_department and hr_reportstomanager. Lookup navigation names hr_Department
  and hr_ReportsToManager were confirmed by live lookup annotations.
- Department name: hr_departmentname; it is not the GUID key.

Business role choices Employee/Manager/Accounts/Admin are
123140000/123140001/123140002/123140003. These choices do not assign website roles.
Payment Source Company Cash/Own Pocket is 123140000/123140001; Payment Method
Cash/Card Online/Borrow is 123140000/123140001/123140002. Travel, Kitchen/Food,
IT Equipments, Finance Things, Technical Equipments, Others map in that order to
123140000 through 123140005. ERP Not Synced/Synced/Failed maps to
123140000/123140001/123140002; this mapping does not implement an integration.

## Access model

| Access | Expected scope and boundary |
|---|---|
| Authenticated employee | Own Contact Self Read, own submitted requests Contact scope, own cash Contact scope Read only; line items inherit parent-request access |
| Request submission | Existing request Read/Create/Write/Append/Append To for receipt/submission; line Read/Create/Append/Append To, no line Write/Delete; review writable sensitive columns server-side |
| Manager lookup binding | Separate Contact Global Append-only permission, no broad Contact Read; department lookup Read/Append permissions |
| Petty Cash Finance | Restricted Finance page/native flow; Global Contact/ledger Read for authorized directory/history; no direct portal ledger Create/Write/Delete or Contact balance Write |
| Petty Cash Admin | Restricted Admin page; Contact Global Read/Create/Append/Append To and department lookup; no profile password submission or website-role assignment through the form |
| Approval/backend connection | Trusted Dataverse writes and approval actions; connection privileges and website role assignments must be reviewed separately |

Use current explicit public field unions in WEBAPI_SITE_SETTINGS.md. Password,
hash/security stamp and new-password input are not application API fields.
Existing column-permission profiles and cumulative grants require native review;
client flags and hidden navigation are not enforcement. The reported global
request Write used for submission does not by itself prevent approval-status or
lookup tampering. Acceptance must establish the intended server-side restrictions.

## Receipt constraints

One PDF OR 1–10 JPG/PNG images, not a mix or multiple PDFs. Images are ordered,
previewed and converted locally using pinned jsPDF 4.2.1. Limits are 15 MiB per
image, 40 MiB combined input, 32 million pixels, 12,000 pixels per side and 10 MiB
final PDF; the live file column limit must also permit the result. HEIC/GIF/WebP
are not supported. Conversion bounds canvas memory and normalizes transparency.
Prepared bytes are cached for the same selection and reused on save retries.
Keep vendor/jspdf-LICENSE.txt with vendor/jspdf-4.2.1.umd.min.js.

## Backend flow contract

Finance uses the site-associated When Power Pages calls a flow trigger with
employeeId Text, movement Text, amount Number, notes Text, postingKey Text.
The actor comes from the native trigger User ID, never a browser actor field.
The expected build checks active employee/actor, rejects self posting, validates
movement/amount/reference/key, looks up the operation key, creates once if absent,
then resolves and compares the durable saved row before confirming.

All Return actions have the same six field names/types: status Text, postingKey
Text, employeeId Text, transactionId Text, balance Number and message Text.
Power Pages may lowercase returned names. Success is posted with matching IDs;
balance is a compatibility placeholder and is ignored by the website. The browser
refreshes the full ledger separately. An uncertain result retains the same key.
The frontend transport uses same-origin session/CSRF, eventData and the required
X-Requested-With header. There are no public signed HTTP trigger URLs in source.

Finance JSON key parsing must not include pattern/patternProperties; that caused
a native save failure. Parse Content must be an evaluated object expression, not
literal formula text. See flows/finance/FINANCE_FLOW_SETUP.md as history and use the actual
exported definition for maintenance; its old Work/Finalize/full-ledger recipe
was superseded and must not be reinstalled.

For approval, the intended behavior is one manager decision and one linked
Expense Approved row, or rejection with no expense row. Before company sign-off,
verify submission readiness (parent is created before products/receipt), actual
trigger filters and loop cardinality, request-derived expense posting key,
existing-row comparison, currency and Contact-summary behavior. See
flows/approval/MANAGER_APPROVAL_FLOW.md; it is not a complete exported flow.

## Verification and operational acceptance

The current baseline is 148 passing unit checks and mocked browser checks for
Finance/Admin/request/receipt/suggestion/UI/shell behavior. The documentation
audit re-runs unit checks and generated-template synchronization; see
documentation/handover/verification.json. This evidence is local, not native
permission, authentication, cache, connection or concurrency validation.

Unit tests run from repository root using Node.js; the checked runtime is
v24.22.1. Commands and known browser-tool path assumptions are recorded in
OPERATIONS_RUNBOOK.md. Live acceptance is separate and is not replaced by a
successful test command or source hash.

## Native assets and ownership still required

The repository contains source fragments and guidance, not a native website,
Dataverse customization or flow solution export. Obtain a current site export
and solution containing tables, relationships, keys, flows, connection references
and applicable configuration, matched to the site's data model. Website metadata
alone does not include Dataverse schema. Microsoft's
[website migration guide](https://learn.microsoft.com/en-us/power-pages/admin/migrate-site-configuration)
and [flow solution export guide](https://learn.microsoft.com/en-ca/power-automate/export-flow-solution)
describe those distinct assets.

Record company application/platform/support owners, flow owners and connection
accounts, required licenses/capacity, backups/restore responsibility, environment
URLs and any email/authentication dependencies. Transfer account access through
the company's approved process, not passwords/tokens in this repository.
Production acceptance and approval-flow completion must be signed by named
company owners; blank ownership and evidence fields remain open items.
