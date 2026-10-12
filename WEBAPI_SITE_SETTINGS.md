# Power Pages Web API field settings

The live field setting is confirmed to be `*`. Microsoft removed wildcard
support on September 14, 2026. Replace it with explicit fields on the selected
website, preserving any additional validated fields used by other pages.

These lists are generated from the current client configuration. The user has
confirmed that `hr_othercategory` belongs to the Line Item table, not the request
table. The request lookup is `hr_department`, the Department entity set is
`hr_departmentses`, its table logical name is `hr_departments`, and its text/name
column is `hr_departmentname`. Both scripts use these values. The exact
Department lookup navigation property still needs
live verification if binding fails; a schema name alone does not prove it.

The supplied screenshots confirm that Department is a lookup to the table
labelled Departments and Other Category is a simple text column. They do not
show the Department navigation property. The separately supplied Department
schema and logical names identify the request's lookup, not the referenced
table itself.

All corresponding `Webapi/<table>/enabled` settings must be `true`.

## Webapi/hr_pettycashrequest/fields

Replace the value with this single comma-separated line after verifying the
names against the live table:

```text
_hr_assignedmanager_value,_hr_department_value,_hr_submittedby_value,hr_AssignedManager,hr_Department,hr_SubmittedBy,hr_approvalstatus,hr_erpsyncstatus,hr_paymentmethod,hr_paymentsource,hr_pettycashrequestid,hr_purpose,hr_receiptimage,hr_requesttitle,hr_totalamount,hr_transactiondate
```

## Webapi/hr_pettycashlineitem/fields

Replace the value with this single comma-separated line after verifying the
names against the live table:

```text
_hr_parentrequest_value,hr_ParentRequest,hr_category,hr_itemname,hr_othercategory,hr_pettycashlineitemid,hr_quantity,hr_totalprice,hr_unitprice
```

`hr_totalprice` is confirmed to be a Simple currency column, not Calculated.
The client now writes Quantity multiplied by Unit Price and verifies the saved
value. Include this field before deploying the updated page. No extra table
operation permissions are needed just for adding it to the create payload.

## Webapi/contact/fields

Replace the value with this single comma-separated line after verifying the
names against the live table:

```text
_hr_department_value,_hr_reportstomanager_value,contactid
```

## Webapi/hr_departments/fields

Set `Webapi/hr_departments/enabled` to `true`. The Department table logical
name is `hr_departments`; do not use the request lookup's `hr_department` in
this setting name. Its entity set `hr_departmentses` belongs in the API URL.

The client selects the confirmed text/name column. It addresses each existing
record by the GUID read from the Contact lookup, so no primary-key column name
is needed in this list:

```text
hr_departmentname
```

## Confirmed names and the remaining binding check

1. Other Category belongs to the Line Item table. Retain `hr_othercategory` in
   `columns.lineItems.otherCategory`, not in request columns or request fields.
   The request's confirmed Department lookup remains `hr_department`.
2. The referenced Department entity set is `hr_departmentses`, its table logical
   name is `hr_departments`, and its text/name column is `hr_departmentname`.
   These are all confirmed; the client no longer needs a guessed GUID-key name.
3. For the Department lookup, the write name is the relationship's exact
   ReferencingEntityNavigationPropertyName. A schema name alone does not prove
   that value. The authenticated Dataverse metadata query in DATAVERSE_SETUP.md
   identifies it. Enable Webapi/error/innererror temporarily during diagnosis
   if the portal still conceals the failing relationship.

Both scripts and these lists have been updated with the confirmed names.
If the Department binding still fails, inspect the actual inner error and
relationship metadata, then update the exact navigation property. Do not
resume the old behavior of omitting Department to make a request succeed.

## Check the updated page without creating records

Apply the explicit field lists, then deploy the updated HTML page. The HTML contains
its own JavaScript; do not also load pettycash-api.js on that page. Run:

```javascript
const setupReport = await pettyCashDiagnostics.checkSetup();
console.log(JSON.stringify(setupReport, null, 2));
```

Capture any failing column checks before a live submission. The command reads
only; it cannot verify write permissions or automatically change site settings.

The previous read checks failed because they requested `hr_othercategory` from
the request table; the user found the column on the Line Item table. Use the
updated HTML and field lists above, refresh the configuration using Design
Studio Preview or the administrator's Clear config option at `/_services/about`,
then reload and rerun the check. Restore `Webapi/error/innererror` to `false`
after troubleshooting. The report preserves each failing column's complete
error details. Do not submit until these read checks pass; passing them still
does not prove that write permissions or relationship mappings are correct.

## Sources

- [Microsoft wildcard migration guidance](https://learn.microsoft.com/en-us/troubleshoot/power-platform/power-pages/migrate-web-api-wildcard)
- [Microsoft field allow-list contract](https://github.com/microsoft/power-platform-skills/blob/main/plugins/power-pages/references/webapi-field-allowlist.md)
- [Microsoft Web API settings](https://learn.microsoft.com/en-us/power-pages/configure/web-api-overview)
- [Microsoft configuration cache guidance](https://learn.microsoft.com/en-us/power-pages/admin/clear-server-side-cache)

