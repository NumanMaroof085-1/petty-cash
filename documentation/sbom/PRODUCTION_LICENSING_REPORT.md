# Petty Cash Production Software and Licensing

As of 16 November 2026. USD reference pricing; Pakistan quotation and taxes pending.

## Recommendation and scope

Prepared for Industrad Engineering on 16 November 2026. This report combines a software bill of materials with a production licensing and cost assessment for the existing petty cash website.

The company expects 25–30 employee users and seven managers/bosses; existing licenses are unknown. At this size, Power Pages pay as you go plus one shared Process flow group is the cost-saving candidate, subject to regional availability and actual storage. Prepaid Pages capacity offers predictable billing and more included file storage. Confirm all four flows are eligible group members. [S01 S07 S08 S09]

| Company access scenario | PAYG budget monthly | Prepaid budget monthly |
| --- | --- | --- |
| 25–30 employee logins; reviewers only answer email | $285–305 | $385 |
| 32–37 logins if all seven reviewers also visit the site | $313–333 | $385 |
| Annual equivalent across these usage cases | $3,420–3,996 | $4,620 |
| If one new notification sender mailbox is needed | Add $4/month | Add $4/month |

Both budgets include one Process group ($150/month) and $35 in support-seat allowances. PAYG adds $4 per billable site user; prepaid adds one $200 pack for up to 100. Add site users outside the stated population, such as a separate Finance/Admin visitor, if applicable. Extra storage and anonymous traffic are excluded. [S01 S02 S05]

The $35 allowance is $15 for a Power Automate Premium maintainer and $20 for a Power Apps Premium operator. It is a prudent procurement allowance, not a claim that pure platform administration or every Process-covered cloud-flow author always requires both. Remove seats already licensed; have the partner confirm the actual operator rights. [S02 S03 S24 S28]

### What is verified and what is assumed

Local code, guides, supplied flow fragments and the pinned jsPDF artifact were inspected. Headcount is user-supplied; actual license assignments, tenant capacity, regional quote and full production solution export remain unverified. Other sizes in the comparison tables are examples. No licenses were bought and no site or flow was changed.

Prices are US public USD reference rates checked on the report date, normally monthly equivalents under annual subscription terms. They exclude Pakistan taxes, exchange conversion, partner margin, migration and support. Obtain a Pakistan CSP quote before purchase. Pay as you go figures are consumption estimates, not annual commitments.

The report includes the current approval and clarification design. The deferred live-read/cache flow and Business Central synchronization are not counted as implemented production flows.

## Software and service inventory

| Component | Recorded version or status | Purpose and license position |
| --- | --- | --- |
| Custom website | HTML CSS JavaScript and Liquid | Five pages and shared templates; company source. No explicit project LICENSE found; confirm ownership in the handover contract. |
| Power Pages | Microsoft hosted SaaS | Site hosting, portal Web API, sessions, local login and site security. Runtime version managed by Microsoft; native version export absent. |
| Microsoft Dataverse | Microsoft hosted SaaS | Contact, Department, Request, Line Item, Cash Transaction and Request Clarification tables; receipt PDF file storage. |
| Power Automate | Four recorded production flows | Finance movement; manager and boss approval; clarification notification; submit clarification answer. Native full exports still needed. |
| Dataverse connector | Premium | Read and write operational tables in flows; connector access is covered by the selected automation entitlement. [S11] |
| Approvals connector | Standard | Manager and boss decisions with custom responses. Standard classification does not make the Dataverse flow free. [S12] |
| Office 365 Outlook | Standard connector plus mailbox | Clarification notification email; recorded in the flow guide, not a complete inspected native export. [S13] |
| Portal identity | Local Contact login in current project | Username and password provisioning through native Management Change Password. Entra sign-in is an alternative, not a deployed change. |
| jsPDF | 4.2.1 MIT | Pinned local UMD bundle for image-to-PDF conversion. Package matches upstream exactly; preserve vendor license and embedded notices. [S29 S30] |
| Bootstrap host features | Host supplied version unverified | Header uses native Bootstrap collapse/dropdown behavior. No independent Bootstrap package is installed by this repo. |
| Brand image | Company supplied PNG | Industrad logo; confirm company rights. No stock-image subscription introduced. |
| Development tools | Outside production runtime | Node.js, Python and Playwright help build/check files; Git and the editor are tooling. No Node/Python server or developer PC is required to host this app. |

The accompanying CycloneDX 1.6 JSON is deliberately marked incomplete. Microsoft service internals, exact hosted Bootstrap assets and resolved versions of libraries embedded in jsPDF are not available from this repository. source-manifest.json hashes the inspected runtime files.

## Cloud flows and runtime coverage

| Recorded production flow | Trigger and purpose | Licensing route |
| --- | --- | --- |
| Finance Cash Movement | Power Pages instant call; validates and posts employee cash movements. | Explicit member of the Process flow group; otherwise its own Process allocation or confirmed licensed callers. |
| Manager and Boss Approval | Dataverse Request added or modified; manager decision, boss decision over PKR 10,000, expense posting and clarification resumption. | Explicit group member. Without grouping, use its own Process allocation or valid automated-flow owner entitlement. |
| Clarification Notification | Dataverse Request enters a waiting-for-employee stage; sends the reviewer question and reply link. | Explicit group member; verify Outlook mailbox rights separately. |
| Submit Clarification Answer | Power Pages instant call; validates employee ownership, saves answer and queues review. | Explicit group member; otherwise its own Process allocation or confirmed licensed callers. |

These four flows are recorded in the project guides. A complete current native export is still required to confirm their final names, enabled state, connectors, owners and licensing allocation. Retired diagnostic/manual test flows are excluded and should not be left enabled in production.

### Preferred allocation

A flow group can contain up to 25 solution-aware flows and shares one 250,000-action daily pool in one environment. Add all four explicitly; a shared purpose, solution or owner alone does not allocate capacity. Parent and child flows count separately. A second environment needs its own allocation. Rollout began in July 2026; confirm the Flow groups option exists before ordering on this basis. [S08 S09]

### Alternatives when grouping is unavailable

A practical fallback is two Process licenses for the two instant flows ($300/month), with the two automated flows under a properly licensed Premium owner. Another simple but expensive option allocates four Process licenses ($600/month). Neither price includes the site. The per-user alternative must cover every applicable instant-flow caller; one shared owner license does not automatically cover everyone. [S02 S10]

Dataverse makes these flows premium even though Approvals and Outlook are Standard connectors. Pure approval responders do not need Power Automate Premium just to respond, but they still need a supported work identity and basic approval entitlement. If a reviewer also runs a website flow, apply that separate entitlement. [S11 S12 S13 S25]

## Reference prices for procurement

USD monthly equivalents checked 16 November 2026. Subscription prices below are generally paid yearly. Existing licenses should be credited before calculating incremental spend.

| Product or meter | Reference price | When it applies |
| --- | --- | --- |
| Power Pages authenticated subscription | $200 / 100 users / site | Predictable monthly active authenticated usage; includes 2 GB database and 16 GB file capacity per pack. [S01] |
| Power Pages authenticated PAYG | $4 / active user / site | Azure-billed actual monthly unique users. [S05] |
| Power Pages anonymous subscription | $75 / 500 users / site | Public Home or other unauthenticated content may create this usage. [S01] |
| Power Pages anonymous PAYG | $0.30 / anonymous user / site | If the anonymous meter is enabled. [S05] |
| Power Automate Process | $150 / allocation | One eligible flow group or direct flow allocation. [S02 S08] |
| Power Automate Premium | $15 / named user | Per-user automation route or maintainer allowance. [S02] |
| Power Apps Premium | $20 / named user | Direct operational Dataverse/model-driven app access or qualifying internal site access. [S03] |
| Power Apps per app via CSP | $5 / user / app reference | Conditional one-site internal alternative; obtain channel quote and entitlement confirmation. [S06 S21] |
| Exchange Online Plan 1 | $4 / mailbox user | New notification sender mailbox if existing email does not cover it. [S14] |
| Microsoft 365 Business Basic | $7 with Teams or $5.40 without Teams | Alternative email/productivity bundle; do not add on top of equivalent existing licenses. [S15] |
| Entra ID Free | $0 for basic identities | No mailbox, Power Pages or flow entitlement included. [S16] |
| Entra ID P1 or P2 | $7 or $10 / user | Optional security capabilities; not required merely to create basic identities. [S17] |
| Power Automate Hosted Process | $215 / allocation | Not needed: this project has no hosted desktop automation. [S02] |
| Power Automate cloud-run PAYG | $0.60 / premium run | Preview/availability check required; not the recommended production baseline. [S05] |

Do not purchase legacy per-flow plans based on older project or online examples. Flow licensing and website licensing are separate purchases unless an applicable existing entitlement is explicitly verified.

## Choosing the website subscription

Use U for billable monthly active authenticated users of one site, not the number of Contacts in Dataverse. Repeated logins to the same site during that month do not multiply U. Finance and Admin visitors are users too. [S05]

| Example U | Subscription monthly | PAYG monthly | Lower website charge |
| --- | --- | --- | --- |
| 5 | $200 | $20 | PAYG before storage |
| 10 | $200 | $40 | PAYG before storage |
| 25 | $200 | $100 | PAYG before storage |
| 30 | $200 | $120 | PAYG before storage |
| 32 | $200 | $128 | PAYG before storage |
| 37 | $200 | $148 | PAYG before storage |
| 50 | $200 | $200 | Tie |
| 75 | $200 | $300 | Subscription |
| 100 | $200 | $400 | Subscription |
| 101 | $400 | $404 | Subscription |
| 150 | $400 | $600 | Subscription |
| 250 | $600 | $1,000 | Subscription |
| 500 | $1,000 | $2,000 | Subscription |

For the first pack, the website-only break-even is 50 active users ($200 either way). For any pack count K, compare $200 × ceil(U/100) with $4 × U. Pack boundaries matter: at 101 users a second pack costs $400, compared with $404 PAYG. This is a calculation from the published rates, not a tenant quote.

PAYG can be cheaper for very small or seasonal usage, but receipt storage, audit logs and anonymous traffic can reverse the result. The public meter documentation still labels the Pages meters preview; validate commercial availability and support for the target region. Do not buy prepaid Pages packs and assume they offset PAYG usage in the same enabled environment. [S05]

### Existing internal user licenses

Eligible same-tenant Power Apps Premium users can access sites without consuming Pages authenticated capacity when using the supported Entra provider. Eligible Dynamics 365 enterprise rights require the relevant application context. The current local username/password login must not be assumed to recognize these exemptions. Business Central or Microsoft 365 ownership alone is not blanket site coverage. [S06]

Power Apps per app remains a possible CSP channel option despite removal from the public price list in January 2026. Ask the partner to confirm $5 one-site coverage, minimums and availability. Its website-only cost beats a $200 pack below 40 consistently assigned users, but is usually above $4 PAYG per active user and does not automatically solve instant-flow licensing. [S06 S21]

## Combined cost scenarios

These examples assume one production site, all four flows in one Process group, no separately billable anonymous users, existing employee mailboxes and no extra storage. They include the $35 monthly support-seat allowances from page 1. All amounts are USD.

| Monthly U | Grouped with Pages pack | Grouped with Pages PAYG | Pack annual equivalent |
| --- | --- | --- | --- |
| 5 | $385 | $205 | $4,620 |
| 25 | $385 | $285 | $4,620 |
| 30 | $385 | $305 | $4,620 |
| 32 | $385 | $313 | $4,620 |
| 37 | $385 | $333 | $4,620 |
| 50 | $385 | $385 | $4,620 |
| 100 | $385 | $585 | $4,620 |
| 250 | $785 | $1,185 | $9,420 |
| 500 | $1,185 | $2,185 | $14,220 |

### Compare automation choices at 100 users

| Automation choice | Total monthly with one Pages pack | Tradeoff |
| --- | --- | --- |
| One Process flow group | $385 | Best overall if available; explicit four-flow membership required. |
| Two Process flows plus licensed automated-flow owner | $535 | Fallback when grouping unavailable; owner rights and flow type need confirmation. |
| Four separate Process allocations | $835 | Simple allocation but higher recurring spend. |
| Premium for 100 callers plus separate maintainer | $1,735 | Conservative upper estimate if every visitor might submit a clarification; not a claim every visitor must buy Premium. |

For only five applicable callers plus one maintainer, the per-user automation route is $90/month versus $165 for grouped automation plus the maintainer allowance. With Pages PAYG and the Contact-operator allowance, that example is $130/month before mailbox/storage. Confirm that the actual Power Pages caller identities are validly covered before choosing it.

Do not add manager or boss Premium seats just because they approve. For users already licensed through an existing contract, calculate incremental cost rather than rebuying full seats. Where all internal users already have recognized Power Apps Premium site rights, extra Pages authenticated capacity may be $0; still cover flows, storage and any public traffic.

Formula: total = chosen website charge + automation coverage + new support seats + new mailboxes + storage + anonymous usage + optional services. Annual equivalents assume unchanged usage for all 12 months and exclude taxes.

## Dataverse storage and receipt growth

There is no separate SQL Server license or Azure SQL database to buy for this implementation. Dataverse storage is supplied through platform entitlements; additional database, file and log capacity is charged only when required. Capacity is pooled or allocated under the selected model, so inspect tenant usage instead of assuming all included space is free for this project. [S01 S04]

| Capacity category | Subscription add-on per GB per month | PAYG reference per GB per month |
| --- | --- | --- |
| Database | $40 | $48 |
| File including PDFs | $2 | $2.40 |
| Log including audit data | $10 | $12 |

One authenticated Pages pack contributes 2 GB database and 16 GB file capacity. Do not repeatedly add tenant-default entitlements for every environment or pack. A new Production/Sandbox database needs at least 1 GB available database capacity. Additional environments consume the same finite tenant pool; there is not a flat per-environment hosting charge in this budget. [S01 S19]

For Dataverse PAYG, the first 1 GB database and 1 GB file are included per enabled environment; allocation and enabled billing meters determine the actual excess. Audit log usage can be billable immediately when no log allocation covers it. Inspect the billing policy and allocation before adopting a 1 GB-only assumption. [S05]

### Receipt estimate with one pack

| Illustrative retention workload | Annual file growth | Extra at year end using only 16 GB pack allowance |
| --- | --- | --- |
| 200 requests/month at average 2 MB PDF | 4.8 GB | No receipt-only overage in year 1 |
| 1,000 requests/month at average 2 MB PDF | 24 GB | 8 GB excess × $2 = $16/month |
| 1,000 requests/month at maximum 10 MB PDF | 120 GB | 104 GB excess × $2 = $208/month |

Estimates use decimal 1 GB = 1,000 MB and ignore other files, database rows, indexes and logs. They are year-end run rates, not flat full-year charges. Actual PDF sizes and retention policy determine the cost. Conversion happens locally in the browser, so there is no paid PDF-conversion service or per-image API charge.

Budget database and log growth separately, review monthly capacity reports and retain audit data for the company-approved period. Native platform backup capability is not a substitute for a separately scoped archival or disaster-recovery requirement. No third-party backup subscription has been added to the baseline.

Flow action capacity, portal Web API entitlement and Dataverse service-protection throttles are different limits. A Process group shares its action allowance; buying it does not remove every API or connector limit. Extra request capacity, if needed, requires a separate usage assessment and quote. Portal Web API access is covered by the applicable site entitlement, not an extra per-column license. [S10 S27]

## Identity email and administrator access

### Website users and reviewers

Current users sign in with local Contact usernames/passwords. This identity method does not itself add an Entra Premium fee, but it also does not remove Pages capacity charges. Creating basic Entra identities in the existing tenant is free; mailboxes, premium identity features and application access are separate. An Entra sign-in migration is optional and has not been implemented in this assessment. [S16]

Managers and the boss need a work identity supported by Approvals and a basic Power Automate/Office 365/Dynamics entitlement for responding. Premium is not required solely to approve or request clarification. A local portal Contact/password alone is not the reviewer identity used by Microsoft Approvals. Existing Microsoft 365 accounts usually avoid new mailbox spend; verify actual assignments. [S10 S25]

### Notification email

Approvals sends its own standard approval notifications. The separate clarification email uses the recorded Outlook connector, whose connection needs a valid Exchange mailbox. If the company already supplies this, incremental email cost is $0. Otherwise budget $4/month for a new Exchange Online Plan 1 mailbox. Do not assume Power Automate Premium includes Exchange. [S12 S13 S14]

If a broader Microsoft 365 bundle is needed, Business Basic is a reference alternative at $7/user/month with Teams or $5.40 without Teams. Buy it only for people/services that need it; it does not replace the app’s Pages or premium Dataverse automation entitlement. Employee mailboxes already exist at industrad.com in the intended business process, but their licenses were not inspected. [S15]

### Native Contact administration

The website Admin page creates profiles. Password provisioning still uses native Management Change Password. Portal Management is a model-driven app and requires appropriate Dataverse security roles. Budget $20/month for one direct operational Contact administrator if there is no qualifying existing entitlement; confirm whether the actual activity is covered by supplied management rights or an existing app license. Pure tenant administration alone is not a reason to license every administrator. [S03 S06 S24]

### Optional identity security

Entra P1 ($7/user/month) or P2 ($10/user/month) may be needed for the company’s chosen advanced identity controls; these are not mandatory solely for this website. Existing Microsoft 365 security bundles may already cover them. External ID is an optional identity architecture with its own MAU rules; its free identity tier does not replace Power Pages capacity. [S17 S31]

## Optional subscriptions and future integration

| Item | Current requirement | Budget treatment |
| --- | --- | --- |
| Azure subscription | Needed for selected PAYG meters; not a separate VM for the prepaid site. | Consumption only for enabled meters/services; Azure credit is not a free Power Pages license. [S05] |
| Custom domain and DNS | Optional; Microsoft site address can be retained. | Use a subdomain of existing industrad.com where possible; domain/DNS quote only if new purchase needed. |
| HTTPS certificate | Required transport, but separate paid certificate is not automatically needed. | Use platform-managed certificate where supported; custom/CDN/WAF configuration decides the path. [S18] |
| CDN WAF and monitoring | Basic hosting/CDN is part of the platform offer; extra Azure services are optional. | Do not add standalone Front Door/Application Insights/Log Analytics charges unless explicitly deployed. [S01] |
| Copilot AI Builder Power BI RPA | Not used by the current application. | No incremental subscription included. Hosted Process, Process Mining or paid PDF SaaS are unnecessary here. |
| Managed Environments | Optional governance configuration, not needed to make the environment Production. | No separate baseline add-on; activating it requires checking every active usage entitlement. [S26] |
| Maintenance migration and support | Required operational work, not a Microsoft SKU price. | Quote one-time migration/ALM, training, support response and backup/retention needs separately. |
| Business Central | Future integration only; not implemented in this repository. | Essentials $80/user/month, Premium $110, Team Members $8 reference; integration scope requires partner quote. [S22] |

Business Central Premium is needed only for its additional manufacturing/service capability, not merely because this project uses Dataverse. Team Members is limited and must not be assumed sufficient for transaction posting. Confirm the API target, user rights, connector classification, service account/application permissions and indirect-access/multiplexing rules before adding the integration. A service principal or one integration user does not automatically eliminate underlying user licensing. [S22 S23]

Do not assume Business Central Essentials/Premium automatically grants this independent custom portal unrestricted Dynamics 365 enterprise site rights. Keep future ERP spend out of the current baseline until the mapping and licensing review is complete.

## Production purchase and handover checklist

- Count monthly active visitors by role and identify any public Home usage. Local Contacts are not a license inventory. Approval-only reviewers are a separate population.

- Export existing Microsoft 365, Power Apps, Power Automate and Dynamics license assignments. Credit valid existing seats and check Entra sign-in recognition before using site exemptions.

- Confirm a Production environment with sufficient Dataverse capacity and a production website lifecycle. Developer plans/trials are for build/test; production rights and conversion/migration must be arranged. [S19 S20]

- Inspect the Flow groups option. If available, put all four solution-aware production flows in the same eligible group and allocate its Process capacity. Otherwise price the fallback explicitly.

- Identify named maintainers and the operator of native Contact password administration. Confirm app/service rights and mailbox connection licensing without sharing administrator credentials.

- Obtain a Pakistan CSP quote showing SKU, quantity, currency, tax, annual or monthly commitment, renewal terms and environment allocation. Record any per-app channel availability in writing.

- Obtain full native solution/site/flow exports and rebind connections, site invocation identifiers, permissions and currency references after migration. Native runtime versions are not inferred from HTML.

- Verify Finance self-post restrictions, duplicate prevention, manager/boss clarification, rejected requests and a single final ledger posting. Existing local tests are not production acceptance.

- Confirm anonymous pages, receipt retention, actual storage allocation, action consumption, mailbox sending limits and company support ownership. The freshness upgrade remains deferred; no new live-read flow is budgeted.

### Scope of the machine readable SBOM

petty-cash.cdx.json records the application modules, jsPDF, host Bootstrap dependency and Microsoft services. source-manifest.json records file hashes. Exact embedded jsPDF transitive versions are not reconstructed from dependency ranges; upstream required ranges are @babel/runtime ^7.28.6, fflate ^0.8.1 and fast-png ^6.2.0. Optional manifest dependencies are canvg, core-js, DOMPurify and html2canvas; the receipt feature does not call the HTML rendering feature. [S29]

The jsPDF bundle exactly matched the SHA-512-verified upstream tarball on the inspection date. Preserve its MIT license and bundled notices. No explicit license was found for the company application source. This is a source-based inventory, not a complete Microsoft SaaS internals inventory, legal opinion or vulnerability clearance.

Generated source files and the calculator are maintained in documentation/sbom and scripts/build_sbom_report.py. Re-running the builder uses this dated price snapshot; it does not re-research current prices.

## Sources and evidence

Official sources checked on 16 November 2026. References identify the applicable offer or rule; the commercial contract and Pakistan reseller quotation determine the final purchase.

- [S01 Power Pages pricing](https://www.microsoft.com/en-us/power-platform/products/power-pages/pricing)

- [S02 Power Automate pricing](https://www.microsoft.com/en-us/power-platform/products/power-automate/pricing)

- [S03 Power Apps pricing](https://www.microsoft.com/en-us/power-platform/products/power-apps/pricing)

- [S04 Power Platform licensing guidance and capacity prices](https://www.microsoft.com/licensing/guidance/Power-Platform)

- [S05 Pay as you go meters](https://learn.microsoft.com/en-us/power-platform/admin/pay-as-you-go-meters)

- [S06 Power Pages and existing license entitlements](https://learn.microsoft.com/en-us/power-platform/admin/powerapps-flow-licensing-faq)

- [S07 Power Pages cloud flow integration prerequisites](https://learn.microsoft.com/en-us/power-pages/configure/cloud-flow-integration)

- [S08 Share Process capacity with flow groups](https://learn.microsoft.com/en-us/power-automate/flow-groups)

- [S09 Create flow groups and rollout availability](https://learn.microsoft.com/en-us/power-automate/create-flow-group)

- [S10 Power Automate licensing and approval responders](https://learn.microsoft.com/en-us/power-platform/admin/power-automate-licensing/faqs)

- [S11 Dataverse connector classification](https://learn.microsoft.com/en-us/connectors/commondataserviceforapps/)

- [S12 Approvals connector classification](https://learn.microsoft.com/en-us/connectors/approvals/)

- [S13 Office 365 Outlook connector classification](https://learn.microsoft.com/en-us/connectors/office365/)

- [S14 Exchange Online pricing](https://www.microsoft.com/en-us/microsoft-365/exchange/exchange-online-business-plans-and-pricing)

- [S15 Microsoft 365 Business Basic pricing](https://www.microsoft.com/en-us/microsoft-365/business/microsoft-365-business-basic)

- [S16 Microsoft Entra ID Free](https://learn.microsoft.com/en-us/azure/cost-management-billing/manage/microsoft-entra-id-free)

## Additional sources and evidence

Official sources checked on 16 November 2026. References identify the applicable offer or rule; the commercial contract and Pakistan reseller quotation determine the final purchase.

- [S17 Microsoft Entra pricing](https://www.microsoft.com/en-us/security/microsoft-entra-pricing)

- [S18 Custom domains and managed certificates](https://learn.microsoft.com/en-us/power-pages/admin/add-custom-domain)

- [S19 Environment creation and database capacity](https://learn.microsoft.com/en-us/power-platform/admin/create-environment)

- [S20 Power Pages lifecycle](https://learn.microsoft.com/en-us/power-pages/admin/lifecycle)

- [S21 Power Apps per app CSP availability March announcement](https://learn.microsoft.com/en-us/partner-center/announcements/2026-march#power-apps-per-app-sku-returning-to-csp-price-list-in-early-april)

- [S22 Business Central pricing](https://www.microsoft.com/en-us/dynamics-365/products/business-central/pricing)

- [S23 Business Central indirect access and external users](https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/power-pages-on-virtual-tables-overview)

- [S24 Portal Management prerequisites](https://learn.microsoft.com/en-us/power-pages/configure/portal-management-app)

- [S25 Approval responder prerequisites](https://learn.microsoft.com/en-us/power-automate/get-started-approvals)

- [S26 Managed Environment licensing](https://learn.microsoft.com/en-us/power-platform/admin/managed-environment-licensing)

- [S27 Portal Web API licensing](https://learn.microsoft.com/en-us/power-pages/configure/web-api-overview)

- [S28 Power Automate capacity license types](https://learn.microsoft.com/en-us/power-platform/admin/power-automate-licensing/types)

- [S29 jsPDF pinned package manifest](https://registry.npmjs.org/jspdf/4.2.1)

- [S30 jsPDF license](https://github.com/parallax/jsPDF/blob/v4.2.1/LICENSE)

- [S31 External ID billing](https://learn.microsoft.com/en-us/entra/external-id/external-identities-pricing)

Local evidence: pages and shared source; vendor/jsPDF license and pinned bundle; scripts/build_receipt_template.cjs; flows/finance guides; flows/approval supplied fragments; flows/clarifications/CLARIFICATION_SETUP.md; documentation/handover/verification.json. These are repository artifacts, not current native license assignments or full tenant exports.
