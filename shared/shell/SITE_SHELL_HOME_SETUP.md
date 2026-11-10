# Header, footer and home — 2026-11-01

**Publication update 2 November 2026:** the user confirms Header, Footer and Home
have been published. Instructions below remain the maintenance/republication
procedure. Native acceptance results have not been independently reviewed.

Implemented locally using the **shared/shell/Header.html** and **shared/shell/Footer.html** supplied by the
user. The existing four application pages, Finance configuration, shared modules,
receipt tools, data schema and native flows are unchanged. Login page UI is not
part of this revision. No tenant deployment or sign-in/out was performed by the
assistant; publication was performed and confirmed by the user.

## Publish these four items

| Local file | Power Pages destination | Action |
|---|---|---|
| **shared/shell/Header.html** | Existing **Header** Web Template → Source | Replace complete Source |
| **shared/shell/Footer.html** | Existing **Footer** Web Template → Source | Replace complete Source |
| **pages/home/Petty Cash Home.html** | New Web Template named exactly **Petty Cash Home** | Paste complete file into Source; select the same website |
| **pages/home/Home.html** | Existing **Home** page HTML/Copy | Replace its old content with the one include in this file |

pages/home/Home.html contains:

```liquid
{% include 'Petty Cash Home' %}
```

Use the existing Home page; do not create a second Home page or change its URL.
Replace old Home content blocks rather than appending this below the original
hero, so there is only one home section. Keep its existing template configured to
use the website header/footer. Do not paste the global Header/Footer into a page.

All three complete template files already contain their required style/script
tags. **Do not add another script wrapper or wrap the whole template in raw tags.**
The Home template's Liquid expressions need to execute on the server. The existing
Petty Cash User Context and Petty Cash Modules templates must remain installed.
Home includes them only for a signed-in user, once each; don't add them globally.

Publish Header and Footer together, since the footer styles are embedded in the
Header. Sync/publish the site, then open a fresh tab after resolving any pending
cash/request submission. No additional JS/CSS Web Files are required. There is no
need to republish the four application pages or the existing shared templates.

## Header

- White header, teal active state, shorter visible menu labels, account initial,
  compact dropdowns, mobile navigation, visible keyboard focus and skip link.
- Retains the supplied **Mobile Header** editable snippet for the existing logo
  and company name. Preview screenshots use a synthetic logo and “Company name”;
  those fixtures are not published branding. Edit the existing snippet in Studio
  or Management to change the actual company name/logo.
- Keeps `weblinks["Default"]`, managed link destinations, child links, Dashboard,
  Profile Navigation, native Search, language dropdown, and native sign-in/out
  URL substitutions. Visible labels shorten New Petty Cash Request → New request,
  Finance Cash Management → Finance, and Admin Users → Users. URLs stay intact.
- Adds explicit web-role visibility checks to the known Finance/Admin links:
  Petty Cash Finance and Petty Cash Admin respectively. This is navigation
  presentation; keep existing page/table/flow authorization in place.
- Dynamic navigation/identity is in a substitution block so those outputs are
  re-evaluated rather than reused with header output caching. Existing search/
  forum landing logic and native language include are retained. No cache site
  settings were changed. Native behavior still needs live verification.
- Keeps the existing Bootstrap 5 collapse/dropdown attributes; no replacement
  Bootstrap library is loaded. Escape closes the expanded mobile menu and returns
  focus to its toggle. Active links are marked by current same-origin URL.
- Uses an additive load listener, avoiding the supplied Header/Footer scripts
  overwriting each other's `window.onload`. Skip targets and menu height adapt
  without changing page submission handlers or registering API calls.

## Footer

- Compact, responsive footer matching the application colors.
- Preserves the editable **Footer** snippet and the supplied French/Italian
  accessibility links. Existing new-tab accessibility links now include
  noopener/noreferrer. The default-locale path safely handles a missing container.
- Adds Home and, when signed in, My Requests links. These use substitution for
  user-specific output. Keeps normal document flow; it does not cover content.
- Uses its own load listener, preserving any existing host load handler.

## Home

Signed-in employees see their greeting, signed ledger balance, pending count,
three recent requests with status badges, and New request/My Requests shortcuts.
Finance and Admin action cards appear only for the exact corresponding web roles.
Admin business-role choice is not treated as a Finance/Admin website permission.

The balance uses **PettyCashModules.readBalance** and the existing ledger checks;
it is not copied from Contact's summary. Requests use **myRequests**, including
its existing ownership check and most-recent-100 limit. The pending label says
“Pending in recent requests” for that loaded set, not an all-time count. The
visible history shows three of those records. Refresh re-reads both; native
portal caching can still delay updates, as on the existing pages.

Balance and request failures are independent: a failed ledger shows Unavailable
instead of zero, while readable requests remain visible; a failed request read
shows an unavailable count/history while a valid balance remains visible. An
empty valid ledger starts at zero. Refresh is disabled during a load; duplicate
script initialization does not cause duplicate reads. Untrusted fields use text
nodes or escaped Liquid output.

Signed-out visitors see a concise welcome and native sign-in link. No user IDs,
cash/request readers or private dashboard are rendered for that view. No API
calls are made by the anonymous Home script. There is no registration/password
form, new cash operation, approval action or Finance configuration on Home.

Preserved root page routes:

- `/New-Petty-Cash-Request/`
- `/My-Requests/`
- `/Finance-Cash-Management/`
- `/Admin-Users/`

These are the project's existing/proposed routes from the setup documents;
check the live Admin/Finance URLs before publishing if they were renamed. Header
links still come from managed navigation. Home quick actions use these paths.

## Local source and rebuilds

| File | Purpose |
|---|---|
| shared/shell/pettycash-shell.css / shared/shell/pettycash-shell.js | Canonical header/footer styles and navigation decoration |
| scripts/build_shell_template.cjs | Embeds both into shared/shell/Header.html |
| pages/home/pettycash-home.css / pages/home/pettycash-home.js | Home-specific styling and read-only dashboard |
| scripts/build_home_template.cjs | Embeds existing shared/styles/pettycash-ui.css, Home CSS and Home JS into pages/home/Petty Cash Home.html |
| scripts/liquid_fixture.cjs / shell_fixtures.cjs | Limited synthetic template/context renderer for local QA only |
| tests/pettycash-shell-home.test.cjs | Source, template branch, role, native-link and generated-template checks |
| scripts/verify_shell_home.cjs | Browser scenarios, screenshots and integration around the four working pages |

```powershell
node scripts/build_shell_template.cjs
node scripts/build_home_template.cjs
node scripts/build_shell_template.cjs --check
node scripts/build_home_template.cjs --check
node --test --test-isolation=none tests/pettycash-api.test.cjs tests/pettycash-modules.test.cjs tests/pettycash-admin.test.cjs tests/pettycash-receipts.test.cjs tests/pettycash-suggestions.test.cjs tests/pettycash-shell-home.test.cjs
node scripts/verify_shell_home.cjs
```

Original supplied templates are preserved in
`documentation/backups/2026-11-01-shell/Header.original.html` and
`Footer.original.html` (ignored local backups). This revision does not modify
existing content snippets, managed navigation records, page permissions, web
roles, tables, columns, Web API fields, site settings or native flows. The only
new website configuration is the **Petty Cash Home** Web Template and its include
on the existing Home page.

## Verification and practical limits

- **141 unit checks** pass: 132 existing checks plus nine shell/home checks.
- **12 browser scenarios** pass: employee, Finance, Admin, both roles, anonymous,
  empty, ledger error, request error, cross-user request rejection, hostile/long
  user name, French and Italian. All are checked at 1440, 1200, 1199, 768, 390 and
  320px, with no horizontal page overflow.
- Also checked mobile menu/aria/Escape/focus, active Home link, skip target,
  native account URL retention, independent load listeners/accessibility links,
  duplicate initialization/refresh, role-specific shortcuts and zero anonymous
  API calls. All data operations in these scenarios are intercepted GETs.
- The same shell was checked around New request, My Requests, Finance and Admin
  at desktop/phone widths. No existing page source or Finance config was changed.
- Reviewed desktop/phone screenshots in `documentation/qa/shell/` (ignored local
  QA output). They use synthetic names, branding and money.

The fixtures implement only a subset of Liquid and the expected Bootstrap show/
hide contract. These checks **do not** execute Power Pages' native Liquid engine,
output cache, actual authentication, Bootstrap bundle or tenant permissions.
After publication, check sign-in/sign-out, managed navigation/child dropdowns,
search, language menu, brand snippet, Home balances, role visibility and mobile
toggle with your real site. Existing server permissions remain the authority.

The first local integration run correctly left Admin disabled when its synthetic
Contact record omitted email; the fixture was corrected to provide the actual
required field. No production validation was weakened to make that check pass.

## Platform references

The native URL substitutions and cache behavior follow Microsoft's
[header/footer output-caching guidance](https://learn.microsoft.com/en-us/power-pages/configure/enable-header-footer-output-caching)
and [substitution tag documentation](https://learn.microsoft.com/en-us/power-pages/configure/liquid/template-tags#substitution).
Managed navigation remains based on the supplied Default web link set, consistent
with [web link guidance](https://learn.microsoft.com/en-us/power-pages/configure/manage-web-links).
Escaping and supported objects/filters were checked against
[Liquid objects](https://learn.microsoft.com/en-us/power-pages/configure/liquid/liquid-objects)
and [Liquid filters](https://learn.microsoft.com/en-us/power-pages/configure/liquid/liquid-filters).
