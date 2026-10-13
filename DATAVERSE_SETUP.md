# Dataverse setup and live verification

The architecture decision is direct submission through the Power Pages Web API.
Power Automate remains the approval and accounting workflow engine. Moving
creation to a flow would not remove the need to verify columns, relationships,
choice values, permissions, or partially completed requests.

## What the screenshots establish

The first submission succeeded at A4, whose payload excluded Department. The
earlier attempts containing the Department binding returned HTTP 500. This
isolates that binding path, but does not distinguish an incorrect navigation
property from a target-table, permission, relationship, or server-side error.

The second submission included `hr_othercategory`. Even the payload without
lookups, date, and payment source failed with `0x80048d19`. The final attempt
sent only title, total, and purpose and succeeded. The Other Category property
was sent to the wrong table: the user subsequently found it on the Petty Cash
Line Item table, not the request table. The logical name is correct, but its
table ownership was wrong in the client and earlier setup instructions. Both
scripts now save and verify it on each line for Others, never on the header.
Every field omitted by the old final attempt necessarily remained unset or
defaulted.

The user confirmed the Department table's entity set is `hr_departmentses`.
The old code bound to `hr_departments`, a different resource. Both client
scripts now use the confirmed entity set for lookup bindings and target reads.
This is a concrete mapping error; an authenticated live submission is still
needed to confirm that no additional configuration error remains.

The new script removes this fallback behavior. A failed full payload is an
error; it is never replaced with a reduced payload.

## Confirm the live mappings

In Power Apps, select the correct environment and inspect these tables.
Use column **logical names**, not display labels. Use **Copy set name** for
entity sets. Lookup writes use the case-sensitive navigation property, which
is not necessarily the lookup column's schema name.

| Mapping in DATAVERSE_CONFIG | Current value | Verification status |
| --- | --- | --- |
| columns.lineItems.otherCategory | hr_othercategory | Confirmed by user on the Line Item table; schema name hr_OtherCategory |
| columns.lineItems.total | hr_totalprice | Confirmed Simple currency column, not Calculated |
| columns.requests.department | hr_department | Confirmed by user; schema name hr_Department |
| navigationProperties.department | hr_Department | ReferencingEntityNavigationPropertyName for that lookup |
| entitySets.departments | hr_departmentses | Confirmed by user via Copy set name |
| tableLogicalNames.departments | hr_departments | Confirmed by user; used in site-setting names |
| columns.departments.name | hr_departmentname | Confirmed by user; schema name hr_DepartmentName |
| columns.requests.date | hr_transactiondate | Actual date column, and whether its behavior is Date Only or User Local |
| columns.requests.paymentSource | hr_paymentsource | Actual choice-column logical name |
| choices.approvalStatus.Pending | 123140000 | Integer value of Pending in the live column |
| choices.erpSyncStatus.Not Synced | 123140000 | Integer value of Not Synced in the live column |

Verify the other choice integers and Submitted By, Assigned Manager, and Parent
Request navigation properties too. Update both JavaScript copies together. The
tests assert that the embedded HTML script and standalone script match.

For an administrator using the authenticated **Dataverse** API, the following
read-only metadata requests identify the mappings. Use your environment's
Dataverse organization URL, not the Power Pages portal URL:

```text
GET <Dataverse organization URL>/api/data/v9.2/EntityDefinitions(LogicalName='hr_pettycashrequest')/Attributes?$select=LogicalName,SchemaName,AttributeType,IsValidForCreate,IsValidForRead

GET <Dataverse organization URL>/api/data/v9.2/EntityDefinitions(LogicalName='hr_pettycashlineitem')/Attributes?$select=LogicalName,SchemaName,AttributeType,IsValidForCreate,IsValidForRead

GET <Dataverse organization URL>/api/data/v9.2/EntityDefinitions(LogicalName='hr_pettycashrequest')/ManyToOneRelationships?$select=ReferencingAttribute,ReferencedEntity,ReferencingEntityNavigationPropertyName

GET <Dataverse organization URL>/api/data/v9.2/EntityDefinitions(LogicalName='hr_departments')?$select=LogicalName,EntitySetName,PrimaryIdAttribute
```

These require a properly authenticated administrator API session. They do not
work through the portal's `/_api/EntityDefinitions` route. Other Category exists
on the Line Item table with the confirmed logical name `hr_othercategory`;
verify its field exposure there. Do not create a duplicate column on the request
table.

The referenced table's confirmed logical name is `hr_departments`; its entity
set is `hr_departmentses`. The request's lookup column is `hr_department`.
The confirmed `hr_departmentname` column is text, not a GUID primary key.
Department checks select that name column and address the existing record using
the GUID read from the employee's Contact lookup. The primary-key column name
is no longer required by this client.

## Update Web API field settings

The original screenshot used `*`; the user later confirmed the corrected
submission works live. The supplied column screenshots
confirm Department is a lookup to Departments and Other Category is simple
text on the Line Item table. The user subsequently confirmed the logical names and
the Department entity set, table logical name, and name column. The exact
lookup navigation property still needs live verification if the binding fails.
Prepared field lists and remaining checks are in `WEBAPI_SITE_SETTINGS.md`.
Remove `hr_othercategory` from `Webapi/hr_pettycashrequest/fields` and include
it in `Webapi/hr_pettycashlineitem/fields`. These instructions correct the
previous assumption that the column belonged to the request header.

Microsoft removed support for `Webapi/<table>/fields = *` for all sites on
September 14, 2026. The old configuration document must not be used as the
current field-setting instructions.

After confirming the mappings, load the updated page while signed in and run
this read-only command in the browser developer console:

```javascript
console.table(pettyCashDiagnostics.siteSettings);
```

It prints explicit `enabled` and `fields` settings for the four tables. Copy
these values into the selected website's Site Settings in Portal Management.
Review other pages before replacing their existing field lists: preserve any
additional validated fields those pages actually require. Generating these
values does not change the live settings.

The lists include ordinary logical names, `_<logical-name>_value` for lookup
reads, and the exact navigation properties used before `@odata.bind` for
lookup writes. Line Item fields now include `hr_totalprice`, confirmed to be a
Simple currency column. The lists never include a wildcard.

For the concealed HTTP 500 details during administrator testing, temporarily
set `Webapi/error/innererror = true` on the selected website. Capture the error,
then turn the setting off after diagnosis. Publish schema changes and refresh
the portal's configuration/cache through its supported administration tools
before testing again.

## Check permissions

Use the employee's actual web role. Do not add anonymous access as a workaround.

| Table | Operations required by this script |
| --- | --- |
| Petty Cash Request | Read, Create, Write for receipt; Append To for its Contact/Department lookup binds; Append as Parent Request lookup target of lines |
| Petty Cash Line Item | Read, Create, Append To for Parent Request lookup; preserve existing Append during staged testing |
| Contact | Self Read of current profile; Global Append-only binding permission for manager target (no Global Read or separate manager GET) |
| Department | Read the current department; Append as lookup target; preserve existing Append To during staged testing |

Table permission scope and column permissions must permit the exact records
and fields involved. The current employee must have a populated Department
and Reports To Manager on their Contact record. Table permissions must also
prevent a caller from submitting requests as another employee; a hidden Liquid
input is not a security boundary.

Read checks cannot prove that Create, Write, or Append privileges are valid.
The earlier Contact Append-To-only guidance was corrected after a live 403.
Microsoft's Power Pages audit guidance checks Append on lookup targets and
Append To on source tables setting the lookup. Keep Contact - Lookup Self-scoped;
Contact - Manager Binding is Global Append only, with Read/Write/Create/Delete/
Append To off. Verify its website and authenticated-user role, sync and retest.
Do not restore broad Contact reads to fix association errors.
Those require a controlled live submission with the intended employee role.

## Test without creating requests first

On the updated page, run:

```javascript
await pettyCashDiagnostics.checkSetup();
```

It reads the employee profile, checks request/product columns, and reads the
Department target. It does not create, modify, or delete records. If a combined
column query fails, it tests individual columns to name the failing fields.
If every column fails, first check the table's enabled/fields settings and
permissions. Successful read checks do not confirm lookup write navigation
properties or server-side business rules.

For an existing request belonging to the signed-in employee:

```javascript
await pettyCashDiagnostics.inspectRequest("paste-request-guid-here");
```

The result includes lookup navigation annotations when supplied by the portal.
It does not modify configuration. An empty Department lookup may have no
annotation; use the Dataverse relationship metadata in that case. A request
whose Submitted By is missing requires an administrator to inspect it directly
in Dataverse.

## Controlled live submissions

Receipts are now required by the client and marked required in the HTML.
Submission without a receipt stops before any API calls or record creation.
Receipt-upload failure must still be handled as a partial request, not success.
This does not make the Dataverse file column business-required or prevent other
clients from creating records without a receipt; enforce completeness on the
server before approval or accounting processing.

The user confirmed that `hr_totalprice` is a Simple currency column, not
Calculated. The client now sends each line's Quantity multiplied by Unit Price
and verifies it on read-back. Add `hr_totalprice` to
`Webapi/hr_pettycashlineitem/fields` before deploying this version. Line totals
use two decimal places, consistent with the PKR UI; the grand total is their
sum. Existing saved lines with empty totals are not automatically repaired.
If the column is changed to Calculated later, remove client writes and configure
the calculation in Dataverse instead.

1. Submit a standard-category request and inspect its header, Department,
   Submitted By, Assigned Manager, date, source/method, statuses, products,
   and receipt in Dataverse.
2. Submit an Others request with distinctive text and confirm the actual
   Other Category column on every saved Line Item contains exactly that text.
3. If a request fails, capture the alert and the diagnostic information:

```javascript
pettyCashDiagnostics.lastFailure;
pettyCashDiagnostics.pendingRequest;
```

Confirmed partial saves resume on the same open page when the form is unchanged.
An interrupted/ambiguous POST does not automatically retry. Keep its reference
and have an administrator inspect Dataverse before creating another request.
Retry memory does not survive page refresh. Previously reduced requests are
not repaired by deploying this code.

Before connecting approvals, implement and enforce submission completeness on
the server. A header-create trigger can run before all products or the receipt
exist. Validate employee identity, totals, and payment details on the server
before any balance change or Business Central posting.

## New balance and portal modules

User identity and the cosmetic Accounts-role indicator are now rendered by the
`Petty Cash User Context` Web Template using the matching local HTML Source.
Remove old page-inline user inputs; load that template before the shared script.
The user's template probe returned a real GUID while the editable page inputs
returned literal attribute names. The exact rewriting mechanism is unconfirmed.
Do not hardcode a Contact GUID or treat browser context as authorization.
The shared `pettycash-modules.js` is pasted inside script tags in the Web Template
`Petty Cash Modules`; all three local pages use its Liquid include rather than a
Web File. It supports the request-form balance widget, My Petty Cash Requests
page, and Accounts Cash Management page. The
Cash Transaction logical name `hr_cashtransaction`, entity set
`hr_cashtransactions`, and types 123140000/123140001/123140002 are confirmed.
Use the explicit field lists in WEBAPI_SITE_SETTINGS.md, scoped roles/table
permissions, and the backend contract in BALANCE_MODULE_SETUP.md before deployment.
The accounts form is disabled until a role-protected flow is configured and
reviewed. No new balance table is needed; the user confirmed Cash Transaction
Posting Key `crec6_postingkey` (schema `crec6_PostingKey`) and its Active alternate
key on 2026-10-13. IMPLEMENTATION_LOG.md records new artifacts and pending
tenant work. These modules must never grant employees direct balance writes.

## Microsoft references

- [Power Pages Web API overview](https://learn.microsoft.com/en-us/power-pages/configure/web-api-overview)
- [Write and associate records](https://learn.microsoft.com/en-us/power-pages/configure/write-update-delete-operations)
- [Navigation property metadata](https://learn.microsoft.com/en-us/power-apps/developer/data-platform/webapi/web-api-navigation-properties)
- [Wildcard removal and migration](https://learn.microsoft.com/en-us/troubleshoot/power-platform/power-pages/migrate-web-api-wildcard)
- [Microsoft's exact field allow-list guidance](https://github.com/microsoft/power-platform-skills/blob/main/plugins/power-pages/references/webapi-field-allowlist.md)
- [Power Pages cloud flow integration](https://learn.microsoft.com/en-us/power-pages/configure/cloud-flow-integration)
