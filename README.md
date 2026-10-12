# Petty Cash Request System

Power Pages saves employee expense requests, products, and receipts through its
session-authenticated Dataverse Web API. Power Automate should handle manager
approval and accounting integration after a complete submission is available.

## Files

- `New Petty Cash Request.html`: the Power Pages page fragment, including its script and Liquid user inputs.
- `pettycash-api.js`: the same client script, kept separately for development.
- `tests/pettycash-api.test.cjs`: local regression tests using simulated portal and Dataverse responses.
- `DATAVERSE_SETUP.md`: required mappings, site settings, permissions, and live verification steps.
- `WEBAPI_SITE_SETTINGS.md`: prepared explicit field lists and the remaining live mapping checks.
- The Word files describe the original requirements and configuration. Their wildcard field settings are now outdated; follow `DATAVERSE_SETUP.md` for the current API configuration.

## Current implementation

The client waits for the signed-in Contact profile and requires its Department
and Reports To Manager lookups. It checks that the requested columns are readable
before saving, sends one complete header payload, and reads the saved fields back.
It then saves and verifies each product before uploading the receipt. Calculated
product totals are left to Dataverse.

Errors never cause selected fields, lookups, or categories to be removed from a
payload. Success is shown only after these operations succeed. Confirmed partial
saves can resume on the same open page, without recreating already saved rows.
Ambiguous create results stop further attempts and display a reference for an
administrator to check.

The user confirmed that `hr_othercategory` (schema name `hr_OtherCategory`)
belongs to the **Petty Cash Line Item** table, not the request table. Both
scripts now save and verify its text on every line when the form category is
Others. Standard categories omit it. Header payloads, read checks, and field
settings no longer include it. The form has one category for the whole request,
so every product receives the same category and Other Category description.

The request's `hr_department` column (schema name `hr_Department`) and the
Department entity set `hr_departmentses` are confirmed. Both scripts use that
entity set for reads and lookup bindings.

The user also confirmed the Department table logical name `hr_departments` and
its text/name column `hr_departmentname`. Site settings now use the correct
table name, and Department read checks select that known name column. The
client does not need to guess the Department GUID-key column name.

The Department lookup's exact navigation property and other configuration
values still need live verification if the binding fails. A lookup column's
schema name does not prove its navigation property. The configured Pending and
Not Synced choice integers also require confirmation; they are sent explicitly
instead of depending on table defaults.

## Run local checks

With Node.js 22 or later:

```powershell
node --check pettycash-api.js
node --test --test-isolation=none tests/pettycash-api.test.cjs
```

These tests make no network requests. They verify field preservation, read-back
checks, sign-in requirements, duplicate-click handling, partial-save retries,
receipt failures, mapping overrides, and synchronization of the two scripts.

## Deployment

Confirm the mappings and portal configuration in `DATAVERSE_SETUP.md`, then
replace the custom code of the New Petty Cash Request page with the HTML file.
That file already contains the script. Do not additionally load the standalone
JavaScript on the same page.

Deployment and an authenticated live submission have not been performed from
this workspace. Local tests do not verify your tenant's actual metadata,
permissions, file-column behavior, or Power Automate flows.

## Submission and approval boundaries

The header, products, and receipt are separate operations, not a database
transaction. Retry state is kept in memory on the current page only; reloading
or closing the page loses it. Inspect partial requests before attempting a new
submission. Existing incomplete requests are not automatically repaired.

Do not trigger financial processing merely because the header was created. The
approval workflow must wait for a server-validated complete submission. A next
step is a completion flag or submission state checked on the server, or an atomic
header-and-products deep insert after verifying the collection relationship.
Neither a browser verification nor a sequence of Power Automate Add a new row
actions alone provides an atomic transaction or trusted financial validation.
