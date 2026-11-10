# Product units — 2 November 2026

**Live confirmation, 3 November 2026:** the user reports a successful submitted
request with its unit saved in Dataverse. Their setup screenshot shows request
columns, product columns and department target all passing. Basic publication
and unit saving are user-confirmed; the specific fractional example below and
approval-email display have not been separately confirmed live.

Each product line now requires a Unit dropdown selection. Quantity and unit
price still determine the line total; choosing a unit does not convert quantities
or change prices. For example, 1.5 Liter at PKR 280 per liter totals PKR 420.

## Dataverse and website setup

1. On **Petty Cash Line Item** (`hr_pettycashlineitem`), use the user-confirmed
   column **`hr_unit`**: Single line of text, maximum length 30. Keep the native
   column optional so historical rows remain valid. The new request UI requires
   it for every submitted item. This implementation expects text, not a Choice.
2. Append **`hr_unit`** to the existing site setting
   **`Webapi/hr_pettycashlineitem/fields`**, preserving its other fields. The full
   combined list is in [WEBAPI_SITE_SETTINGS.md](../../documentation/platform/WEBAPI_SITE_SETTINGS.md).
   If restrictive line-item column permission profiles are configured, include
   Unit in their existing Create/Read access. No new table permission or role is
   needed; retain the existing parent-request scope.
3. Publish the complete updated **pages/new-request/New Petty Cash Request.html** to the existing
   request page, replacing its content. The JavaScript is already embedded.
   Do not upload `pages/new-request/pettycash-api.js` as a second script. No shared Modules,
   Receipts, Admin, Finance, Header, Footer or Home update is needed for units.
4. Sync/refresh the site after resolving any open partial submissions. Run
   `await pettyCashDiagnostics.checkSetup()` on the signed-in request page.
   Confirm every check passes before creating a controlled test request.

The user supplied the column name. Its native type, API field publication and
deployment of this new page have not been independently verified. Configure the
column/API fields before publishing the page; missing Unit exposure deliberately
blocks submission before creating a request.

## Dropdown and behavior

The 23 stored text values are Piece, Liter, Milliliter, Kilogram, Gram, Dozen,
Pack, Box, Bag, Bottle, Can, Carton, Pair, Set, Roll, Sheet, Meter, Centimeter,
Square meter, Hour, Day, Trip and Service. Labels show common symbols where
helpful; Dataverse stores the full value, such as `Kilogram`, not `kg`.
Edit `DATAVERSE_CONFIG.units` in the canonical script to maintain this list.

- Initial, added and reset rows start with an empty required selection.
- Suggestions enter names only. They preserve selected units, including a
  draft row with only its unit selected, and never guess a unit from a name.
- The existing quantity column is Decimal Number in the supplied schema.
  Controls accept positive fractions; no schema type or precision is changed.
- Submission validates the unit, saves it with each line and verifies it on
  read-back. Retry matching includes the unit and prevents changed-form resumes.
- Historical rows are not backfilled. No catalog, automatic conversion, balance
  adjustment or approval decision logic is added.

Existing flows continue using the same totals and relationships. To show units
in a manually built approval email/item table, include `hr_unit` in that flow's
line-item Select columns (if explicit) and display it beside quantity. The native
flow is maintained separately; that email display edit was not performed here.

## Source and verification

Canonical logic: `pages/new-request/pettycash-api.js`; generated inline script: request HTML.
Canonical styles: `shared/styles/pettycash-ui.css`; responsive product cards apply below
720 px, with full-width fields on the narrowest screens.

```powershell
node scripts/build_request_page.cjs
node scripts/build_ui_styles.cjs
node scripts/build_home_template.cjs
node scripts/verify_handover.cjs --date 2026-11-02
```

The Home builder keeps its embedded shared CSS in sync locally. Home publication
is unnecessary for this product-table change.

Local coverage includes distinct units, fractional totals, missing/invalid units
before writes, missing API exposure, saved-unit mismatch, unit changes on retries,
suggestion preservation, success reset, responsive layout and existing PDF uploads.
APIs are simulated; these checks do not verify tenant permissions or native flows.

After publication, test Petrol 1.5 Liter at 280 and Chicken 0.5 Kilogram at 600:
line totals should be 420 and 300, request total 720. Confirm both `hr_unit`
values and the receipt in Dataverse. Confirm a blank unit blocks saving, new
rows have the dropdown, and suggestions preserve manually selected units.
