# Business Central export after final approval

Recorded 18 November 2026 from the user's proposed flow change and supplied
Business Central column screenshot. This is a planned integration specification,
not a confirmed native flow implementation or successful export.

## Proposed change

The user is adding Business Central actions to the existing approval flow,
immediately before the actions that set the Request Approval Status to Approved.
The proposed locations are the two final success paths:

- Manager approves and the request does not require boss approval.
- Boss approves a request routed for boss review.

A manager approval that still requires boss review must not export to BC yet.
Reject and Need Clarification paths must not export. Existing approval-resumption,
request-readiness and financial duplicate protection remain in place.

The user confirms one BC row per product item, with one equivalent Create record
action in each mutually exclusive final approval path. Each branch's Create
record action must run for every product, not just once for the Request. These
are two placements of the export operation, not two BC rows per approved item.
No current BC action definition, target API metadata, company selection or
completed native run has been supplied.

## Confirmed decisions and remaining mapping questions

| Decision | Recorded proposal or recommendation | Status |
|---|---|---|
| Row granularity | One BC row per product line, repeating the appropriate request-level context. | User-confirmed 18 November |
| Two actions | One equivalent BC Create record action in each final approval branch; only the applicable branch runs, and its action repeats for all product lines. | User-confirmed 18 November |
| Description and product name | Confirm whether Description contains the request purpose or the product name. If it contains the purpose, retain Item Name separately so products remain identifiable. | Mapping pending |
| Amount | Confirm whether this is the full request amount or the individual line amount. Do not repeat a request total on every product row and then sum it as line expenditure. | Mapping pending |
| Source identity | Recommend retaining Request ID and Line Item ID. Enforce uniqueness for the source line at the BC target/API; the user-facing Request Title is not a reliable unique key. | Recommended; no target key confirmed |
| Attachment Link | Store the user-supplied Dataverse Web API file-download URL ending in `/hr_receiptimage/$value`; keep the PDF in Dataverse. Formula reproduced below. | Destination/formula user-confirmed; ordinary BC-user access untested |
| Failure behavior | In the proposed before-Approved order, a BC failure prevents the downstream Approved update. Decide whether that coupling is intended; an alternative is recording the business approval separately from ERP synchronization failure. | Proposed placement recorded; policy not independently confirmed |
| BC target | Confirm environment, company, connector action, API category/version/entity set, field names/types and write permissions. | Not supplied |

These questions do not authorize new Dataverse columns, additional flows, a
SharePoint site, public attachment access or changes to the website.

## Supplied Business Central columns

The screenshot contains these 16 display labels. The types below are mapping
recommendations; they are not inspected BC schema or API property names.

| BC display label | Dataverse source or mapping | Suggested value or clarification |
|---|---|---|
| Employee Name | Request `hr_submittedby` lookup to Contact `fullname` | Employee display name, not the lookup GUID. Retain a stable employee identifier separately if the BC design needs one. |
| Expense Date | Request `hr_transactiondate` | Date of expense. Confirm native source date behavior and target Date handling; avoid an unintended time-zone date shift. |
| Amount | Request `hr_totalamount` if intended as request total; otherwise line `hr_totalprice` | Decimal monetary value in PKR. Meaning depends on target row granularity and must be confirmed. |
| Description | Request `hr_purpose`, or line `hr_itemname` if the target uses Description for the item | Confirm its intended meaning. Preserve both purpose and product name where both are required. |
| Attachment Link | Construct the confirmed Dataverse Web API URL from the Request GUID, ending in `/hr_receiptimage/$value` | Same Request PDF link on all its BC item rows. The URL carries no authentication token; BC-user download access must be verified. |
| Request Title | Request `hr_requesttitle` | Human-readable request reference. Do not use it alone to prevent duplicates. |
| Department | Request `hr_department` lookup to Department `hr_departmentname` | Department display name, or confirmed BC code mapping if the API requires a code. |
| Assigned Manager | Request `hr_assignedmanager` lookup to Contact `fullname` | Assigned manager display name. This is not automatically the boss or the person who supplied the final approval. |
| Payment Method | Request `hr_paymentmethod` | Map its configured Choice to the expected BC text/enum: Cash, Card / Online or Borrow. |
| Category | Line Item `hr_category` | Map the configured Choice to the target text/enum. The category is stored on each line item. |
| Other Category | Line Item `hr_othercategory` | Text for Other-category items; normally blank for other categories. |
| Quantity | Line Item `hr_quantity` | Positive decimal; fractional quantities are supported. |
| Unit | Line Item `hr_unit` | Saved text such as Liter or Kilogram. Map explicitly if BC requires a Unit of Measure code rather than this text. |
| Unit Price | Line Item `hr_unitprice` | Decimal monetary value in PKR per selected unit. |
| Total Price | Line Item `hr_totalprice` | Stored rounded line total. The full Request total is the sum of its line totals. |

The current source schema and Choice/unit values remain in the
[two-table dictionary](<Petty Cash Tables for Business Central.docx>). That
document is a source dictionary and has not been rewritten as a target contract.

## Item identity and multiple products

### Manager and department name expressions

For BC fields that accept display-name text, the recorded flow action names
support these mappings in both final approval branches:

Assigned Manager:

```text
outputs('Get_a_row_by_ID_-_manager')?['body/fullname']
```

Department:

```text
body('Get_Review_Request')?['_hr_department_value@OData.Community.Display.V1.FormattedValue']
```

The earlier documented `Get_Review_Request` Select columns list does not include
Department. Append `_hr_department_value` to that list, preserving its existing
columns, before using the Department expression. If the manager lookup uses
Select columns, ensure `fullname` is included. The formatted lookup annotation
returns the related row's display name; the raw lookup value is a GUID.

These expressions are supplied mapping guidance, not user-confirmed native
outputs. If the department annotation is absent, inspect that Get action's
output; explicitly retrieving the Department row's `hr_departmentname` is the
fallback. Do not send a blank name or a raw GUID as a substitute for a required
BC department name. If BC expects a code or relationship ID, agree that mapping
instead of substituting a display-name expression.

For the user-confirmed per-product target:

1. Read all Line Items belonging to the current Request, not only the first row.
   Source entity set: `hr_pettycashlineitems`; relationship filter uses
   `_hr_parentrequest_value` and the current Request GUID. Follow paging.
2. Resolve request-level values once and combine them with each line's values.
3. Write one BC item row for each source line. Each row needs product identity;
   use Description for the product only if that is the agreed definition, or
   add a separate Item Name mapped from `hr_itemname`.
4. Retain `hr_pettycashrequestid` and `hr_pettycashlineitemid` as stable source
   identifiers. These existing Dataverse columns do not need to be recreated.
   Their BC field names, exposure and uniqueness enforcement are not yet supplied.
5. Keep request-level Approved/status, Contact summary and Cash Transaction
   operations outside the product loop. Three products must not cause three
   full-request balance deductions or three full-request expense transactions.

Each final branch can use Apply to each over the complete source line-item
collection, with its BC Create record action inside. The Approved update and
existing financial completion actions stay after the complete loop, outside it.
The target API and actual loop wiring still need native confirmation.

## Success and failure ordering

For the user's proposed blocking order, the intended sequence is:

```text
Final business approval on the applicable manager-only or boss path
  -> existing duplicate/state guards
  -> write or confirm the expected BC request/items
  -> record ERP Sync Status = Synced
  -> update Approval Status = Approved
  -> existing request-level financial completion actions
```

This is conceptual ordering, not an inspected action layout. Preserve the
existing financial guards and actual dependencies. BC writes must not be bypassed
because a product loop returned no rows, and status updates must not run under
an unconditional run-after setting when the BC action failed or was skipped.

The Request already has `hr_erpsyncstatus`; no new source status column is needed:

| Existing state | Value | Proposed use |
|---|---|---|
| Not Synced | `123140000` | Initial state; the browser already initializes it. |
| Synced | `123140001` | Only after every expected BC record is created or confirmed with matching values. |
| Failed | `123140002` | Export did not complete; record/review the flow error and reconcile any partial BC writes. |

Setting this column does not itself synchronize data. A timeout can leave an
unknown create result, even if the action is marked failed. Check BC by the
stable source key before attempting another create. Do not rerun approval emails
or repeat a cash deduction simply to retry a technical export.

BC and Dataverse actions do not form one automatic cross-system transaction.
A later status or financial action can fail after BC has already accepted data.
The same source IDs must therefore be used when recovering the incomplete flow.
The existing Cash Transaction posting key prevents a different kind of duplicate;
it does not by itself prevent duplicate BC rows.

An alternative failure policy is to keep the Request Approved once the final
decision is made and track BC failures only through ERP Sync Status. That would
change the proposed coupling and requires a business decision before rewiring.

## Receipt and target access

The existing receipt is one PDF per Request in Dataverse, up to the app's 10 MiB
limit. An Attachment Link is a reference, not a copy of that file or an access
grant. The user has selected a direct Dataverse download link and supplied this
Power Automate expression:

```text
concat(
  'https://orgc513a088.crm15.dynamics.com/api/data/v9.2/hr_pettycashrequests(',
  triggerOutputs()?['body/hr_pettycashrequestid'],
  ')/hr_receiptimage/$value'
)
```

This matches the documented file-column Web API route shape: organization URL,
entity set, Request GUID, file-column logical name and `$value`. It retrieves the
current PDF for that Request; it is not a permanent copy of the approved bytes.
Every product row for one Request refers to the same file.

The endpoint requires valid Dataverse Web API authentication and authorization.
It is not a Power Pages `/_api` route, a SharePoint sharing URL or a BC attachment.
A BC sign-in or a local portal Contact account does not by itself authorize this
Dataverse API request. The flow's connection does not transfer its token into
the stored hyperlink. A simple browser click does not automatically add a Web
API bearer token and may return 401/403; do not claim one-click download works
until it is tested with the intended non-administrator BC user's normal session.
Direct Dataverse access rights/licensing must be checked separately from portal
table permissions; no access has been granted by this documentation update.

The organization host is environment-specific. If the application moves to a new
Dataverse environment, update/parameterize that base URL and verify that the
export uses the matching Request GUIDs rather than retaining a developer host.
Do not make receipts public or embed reusable access tokens in the link.

If the decision is to store the actual PDF in BC, confirm the target's attachment
API and parent record behavior separately. The BC connector documents an 8 MB
record-size limit for record actions, so the current 10 MiB receipt limit must
not be assumed safe for an inline Create record payload. A file-upload operation
is different from saving an Attachment Link.

The current supplied target is a table field list. Writing a custom/staging
table does not establish that a BC journal has been posted to the general ledger.
No journal posting, employee/vendor account mapping or automatic FX conversion
is claimed. Confirm the BC company's currency and the target table's purpose.

## Acceptance before calling this implemented

- A request with multiple products exports every product once, with correct
  quantity, unit, price, category and source IDs.
- Request-total and line-total fields reconcile without double counting.
- Both final approval routes work; rejection and clarification create no BC rows.
- A failed/uncertain/partially completed BC write is recoverable without duplicate
  BC rows, new approval emails or repeated financial postings.
- The supplied Dataverse receipt link downloads the file for the intended BC
  user with appropriate authentication and access, not just the flow owner/admin.
- ERP Sync Status reflects confirmed export results; approval/failure behavior
  matches the agreed policy.
- Record the BC environment/company/API mapping and a native successful test
  before marking the handover or SBOM as including an implemented BC integration.

No website, native flow, BC schema, connection, permission or licensing assignment
was changed by this documentation update. The 16 November licensing report is a
dated assessment and still treats BC integration as future scope; review it when
the native integration and its access pattern are confirmed.

## Platform references

- [Business Central connector actions and record-size limits](https://learn.microsoft.com/en-us/connectors/dynamicssmbsaas/)
- [BC custom API page metadata and write operations](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/devenv-api-pagetype)
- [BC attachment resources](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/api-reference/v2.0/resources/dynamics_attachment)
- [Power Automate error handling and retry policies](https://learn.microsoft.com/en-us/power-automate/guidance/coding-guidelines/error-handling)
- [Dataverse file-column Web API download route](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/file-column-data#download-a-file-in-a-single-request-by-using-web-api)
- [Dataverse Web API OAuth authentication](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/authenticate-oauth)
- [Dataverse Get a row by ID selected columns](https://learn.microsoft.com/en-us/power-automate/dataverse/get-row-id)
- [Lookup display-name annotations](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/multitable-lookup)
