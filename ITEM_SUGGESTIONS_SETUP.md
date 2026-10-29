# Category-specific product suggestions

Implemented locally on 2026-10-29; live publication/testing of this addition is
pending. User approved the non-destructive behavior discussed on 2026-10-28.
This is a frontend name-entry shortcut, not an enforced product catalog.

## Behavior

A Quick item suggestions card sits between General Info and Itemized Details.
Changing category refreshes the card without deleting or editing product rows.
Clicking an item:

1. Focuses quantity in the first existing matching row if its name matches after
   trimming, collapsing whitespace and case-folding. No quantity, price or
   existing name spelling is changed and no duplicate row is automatically added.
2. Otherwise fills the first untouched blank row: empty trimmed name, quantity
   exactly 1, blank price, and no recorded manual input. It does not overwrite
   a blank-name row containing a custom quantity, explicit zero price, or prior
   manual edits (including a name the employee typed and then cleared).
3. If no such row exists, uses the existing addNewItemRow helper to append a row.
   The helper now returns that row; its existing manual Add Item behavior stays.
4. Sets only the product name, keeps quantity 1 and price blank, recalculates
   totals with existing logic and focuses quantity. Name, quantity and price
   remain editable. Existing validation still requires incomplete rows to be
   completed or removed before submission.

Names are compared against current visible input values, not hidden product IDs.
Renaming Chicken to Chicken breast preserves it; clicking Chicken again can add
a distinct Chicken row. Manual duplicate rows are still allowed. Clicking an
item with an existing match focuses the first match, not all matching rows.

New buttons have type=button, accessible labels, keyboard activation and a live
status message. Labels/category names are rendered as text, never injected HTML.
The card wraps at mobile widths. Delegated row input tracking covers both the
initial row and dynamically added rows, without replacing total-calculation
handlers. Reset removes old row state with the existing row reset.

## Initial lists and maintenance

The user supplied examples for these two categories only:

| Exact category value | Initial suggestions |
| --- | --- |
| Travel | Petrol, Hotel, Food |
| Kitchen/Food | Chicken, Naan, Eggs |
| IT Equipments | None yet |
| Finance Things | None yet |
| Technical Equipments | None yet |
| Others | None yet |

Other categories display a manual-entry message; their regular items were not
invented. All categories retain manual Add Item/name entry. Others retains the
existing Specify Other Category requirement. The selected category still applies
to ALL request lines, including lines entered under an earlier category; this
feature does not add per-line categories or silently reclassify/delete rows.

Edit DATAVERSE_CONFIG.itemSuggestions near the beginning of pettycash-api.js
and the identical inline script in New Petty Cash Request.html. Keys must match
the category dropdown exactly; values are arrays of product-name strings. Lists
are trimmed/deduplicated for display; blank/non-string entries are ignored.
Do not change choice values/column mappings or add prices to this map. The unit
suite verifies that the canonical and inline scripts remain identical.

No catalog API, backend table or Admin list editor is introduced. Maintaining
these lists requires updating/publishing the page; an administrator-editable
catalog would be a separate future feature.

## Submission and recovery safeguards

Suggestion buttons disable as soon as submission starts, remain disabled during
a partial or uncertain save, and stay disabled if category changes while a save
is pending. addSuggestedItem also checks those states programmatically, so a
stale click cannot alter rows. A definite rejected header create releases the
lock, while a successfully saved header awaiting lines/receipt keeps it.
Successful completion resets the category/rows/card and unlocks the buttons.
Existing manual controls and form-fingerprint retry validation are preserved.

No request or line-item payload shape, category/quantity/price validation, PKR
rounding, receipt conversion/cache/upload, employee context or cash balance
logic changes. Suggestions cause no API calls or writes until ordinary Submit.
Business names remain user-editable and are not server-validated catalog IDs.
This is not a server authorization or security rule.

## Deployment and verification

Replace only the existing request page HTML with complete updated **New Petty
Cash Request.html**, save/sync/Preview and reload. Its matching standalone
pettycash-api.js is for development; do not separately load a second copy.
The already working Petty Cash Receipts, User Context and Modules templates
are unchanged. No new Web Template/library/page/table/column/role, Dataverse
permission, Web API field setting, Power Automate flow or financial change.

Verify Travel and Kitchen/Food buttons, first-row fill, subsequent new rows,
repeated-click focus, manual name edits and quantities/prices, category switch
without data loss, manual-only categories and Others detail. Complete a normal
request with a receipt and inspect saved line names/totals. Retry/error testing
against the tenant requires controlled test data; do not intentionally interrupt
production requests or recreate a partly saved request. UI lock tests are not
proof of server permissions.

119 unit tests pass, including 13 focused suggestion cases plus prior receipt,
request, balance and Admin checks. scripts/verify_item_suggestions.cjs mocks all
network requests and verifies keyboard/mobile UI, literal labels, unchanged
line-item payload/category/totals, successful reset, partial-upload retry with
no duplicate records, uncertain-create blocking and definite-error unlock.
Desktop/mobile card screenshots were visually reviewed. Existing module-page
browser checks also pass; no live tenant state changed by the assistant.

The user independently reported the image-to-PDF feature working perfectly on
2026-10-29. This is a live user report, not a full device/permissions/malware
audit; this frontend addition does not require republishing that receipt bundle.
