# Four-page UI refresh — 2026-10-31

Implemented locally for New request, My Requests, Finance Cash Management and
Admin Users. The live Power Pages publication has not been performed here.
Login, header, footer and home page are outside this change.

## What changed

- A consistent teal and dark-ink palette, clear headings, lighter cards, larger
  form controls, keyboard focus indicators and responsive spacing.
- Less repeated instructional text. Receipt limits and Finance guidance are in
  expandable help. Errors, transaction references and retry instructions remain
  visible when needed.
- New request: balance summary, two-column details, existing category shortcuts,
  items that stack into labeled cards on phones, and a clearer receipt area.
  Every original selection value and handler remains intact. Visible category
  labels are simplified; their saved values and numeric choices are unchanged.
- My Requests: search, status filtering, total/pending/approved counts, status
  badges and empty states. Request/transaction rows become compact phone cards,
  keeping statuses and amounts visible without horizontal scrolling.
  Filters work on the already loaded employee records,
  make no API calls and retain their values on Refresh. Counts describe the
  complete loaded set; the result line describes the filtered set. Search covers
  reference, date, amount, payment source, status and manager comments. Unavailable
  request data shows an error and unavailable counts rather than zero records;
  filters are disabled until a successful Refresh.
- Finance: compact employee picker, current/change/projected balances, grouped
  cash fields and readable transaction history. The preview remains an estimate.
  Cash confirmation, own-account restriction, all write gates, the pending key,
  duplicate-safe retries and the authoritative ledger calculation are retained.
- Admin: seven profile fields, shorter onboarding instructions and a saving
  button state. Profile creation, duplicate/readback checks and uncertain-save
  behavior are unchanged. Password setup still uses Management → Change Password.
  Authorized forms now explicitly clear Studio's independent inline display:none;
  the role check runs before revealing them.
- Dynamically added/reset item inputs have accessible names, as does Remove item.
  Mobile controls use 16px text. Reduced-motion preference disables animations
  and transitions. Desktop/tablet tables retain keyboard-focusable regions;
  phone layouts show card rows instead of wide tables.

## Files and templates

| Local file | Publish destination |
|---|---|
| New Petty Cash Request.html | Existing New Petty Cash Request page Copy |
| My Petty Cash Requests.html | Existing **My Requests** page Copy; partial URL **My-Requests** |
| Finance Cash Management.html | Existing Finance page Copy; preserve live configuration below |
| Admin Users.html | Existing Admin Users page Copy |
| pettycash-modules.js | Existing **Petty Cash Modules** Web Template, inside its existing script tags |
| pettycash-admin.js | Existing **Petty Cash Admin** Web Template, inside its existing script tags |
| Petty Cash Receipts.html | Existing **Petty Cash Receipts** Web Template; complete generated file |

Modules version is **finance-posting-v5**; Admin version is **admin-profiles-v3**.
The receipt module version remains receipt-pdf-v1; only selection/ready messages
changed, and its generated template is synchronized. PDF generation, selection
limits, preparation and upload bytes are unchanged.

`pettycash-ui.css` is the local styling source. Each page already embeds it in a
generated style block. **Do not upload a CSS/JS Web File or create a new template.**
Rebuild embedded styles after editing the CSS:

```powershell
node scripts/build_ui_styles.cjs
node scripts/build_ui_styles.cjs --check
```

All CSS selectors are scoped to `.pc-app`; existing site header/footer controls
are not styled. Bootstrap `form-control` heights were included in the local
checks so they cannot collapse the purpose textarea. Page content should replace
the old content, not be appended to it; avoid duplicate forms/scripts/IDs.

`pettycash-api.js` remains the canonical request script, mirrored in the request
page's final inline script. Its edits are accessibility labels and suggestion
copy only. Publish the complete updated request page; do not load that JS twice.

## Publish

1. Finish or resolve any pending request/cash posting before replacing scripts
   or reloading that browser tab.
2. The Finance HTML now retains this site's previously confirmed settings:
   `financeFlowId: "0b0976ac-a6d3-f111-a05d-70a8a52176fd"` and Boolean
   `financeSecurityReviewed: true`. A live Console check showed blank/false after
   the UI update, so the local page was corrected to avoid republishing defaults.
   Publish that whole block **before** the Petty Cash Modules include. The reusable
   config example and shared-script defaults remain blank/false; don't copy them
   over this working page. For another site, configure and verify its own invocation
   ID and permissions. The setting reflects user-reported setup, not a tenant audit.
3. Replace the four page bodies and update the three existing Web Templates in
   the table. Preserve their Liquid context/module includes exactly once. The
   new My Requests shortcut uses the established `/New-Petty-Cash-Request/` route.
4. Sync/publish the site, then reopen the pages or hard-refresh after all pending
   operations have been resolved. Keep existing role and table permissions.

If Finance still shows read-only, inspect `window.PC_MODULE_CONFIG` and
`PettyCashModules.flowReady()` in the Finance browser Console. Expected: the GUID
above, Boolean true, and ready true. A blank/false object means the served page
still contains defaults or another assignment overwrote it. A correct object
with ready false can mean the shared script initialized before the configuration;
check include order/duplicate includes. Changing a global in Console after script
initialization does not update the script's captured configuration. Publish the
source correction and load a fresh page; do not send test cash just to check config.

No new Dataverse tables, columns, flows, site settings, permissions or web roles
are required. This does not change approval-flow setup. No passwords, signed flow
URLs, external fonts, runtime CDN assets or new external services were added.

## Verification

Local checks use synthetic data and intercepted APIs; they do not prove live
tenant authorization, flow behavior or cache freshness.

- 132 existing unit checks: request payloads/readback, receipts, retry/uncertain
  states, ledger arithmetic, self-posting, Admin checks and suggestion behavior.
- Browser suites: 13 Finance states; seven Admin states; four shared page states;
  item suggestion interactions and request save/retry paths; image-to-PDF upload,
  preview caching, byte-identical retry, original PDF pass-through and failure cases.
- `scripts/verify_ui_pages.cjs`: all four pages at 1440, 768, 390 and 320px;
  no page-level horizontal overflow, named controls, focus, reduced motion and
  host-style isolation. Phone request statuses and transaction amounts are checked
  inside the viewport without horizontal scrolling. My Requests additionally covers combined local filters,
  retained filters on Refresh, counts, literal untrusted comments, no-match/empty,
  unavailable data and recovery. Admin is checked with Studio inline hiding.
- Desktop and mobile screenshots for all four pages are in
  `documentation/qa/ui/` (local QA, ignored by Git).

```powershell
node --test --test-isolation=none tests/pettycash-api.test.cjs tests/pettycash-modules.test.cjs tests/pettycash-admin.test.cjs tests/pettycash-receipts.test.cjs tests/pettycash-suggestions.test.cjs
node scripts/verify_ui_pages.cjs
node scripts/verify_finance_page.cjs
node scripts/verify_admin_page.cjs
node scripts/verify_module_pages.cjs
node scripts/verify_item_suggestions.cjs
node scripts/verify_receipt_upload.cjs
```

After publication, check one existing employee's request list/balance, receipt
preparation, Finance's live flow configuration and own-account restriction, and
Admin's profile form. Header/footer/theme differences still need live visual
review; this work has only been run against the mocked local host.
