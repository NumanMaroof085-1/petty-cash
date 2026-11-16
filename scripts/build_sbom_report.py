"""Rebuild the dated production SBOM and licensing assessment from reviewed inputs.

Local report generation only. Does not purchase licenses, change the app or connect
to Dataverse. USD reference prices were researched on 2026-11-16; rerunning this
script does not refresh those prices. Native solution exports remain outstanding.
"""
from pathlib import Path
from datetime import datetime, timezone
import csv
import hashlib
import json
import math
import re
import uuid

from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'documentation' / 'sbom'
DATE = '2026-11-16'
TITLE = 'Petty Cash Production Software and Licensing'
SOURCES = [
 ('S01', 'Power Pages pricing', 'https://www.microsoft.com/en-us/power-platform/products/power-pages/pricing'),
 ('S02', 'Power Automate pricing', 'https://www.microsoft.com/en-us/power-platform/products/power-automate/pricing'),
 ('S03', 'Power Apps pricing', 'https://www.microsoft.com/en-us/power-platform/products/power-apps/pricing'),
 ('S04', 'Power Platform licensing guidance and capacity prices', 'https://www.microsoft.com/licensing/guidance/Power-Platform'),
 ('S05', 'Pay as you go meters', 'https://learn.microsoft.com/en-us/power-platform/admin/pay-as-you-go-meters'),
 ('S06', 'Power Pages and existing license entitlements', 'https://learn.microsoft.com/en-us/power-platform/admin/powerapps-flow-licensing-faq'),
 ('S07', 'Power Pages cloud flow integration prerequisites', 'https://learn.microsoft.com/en-us/power-pages/configure/cloud-flow-integration'),
 ('S08', 'Share Process capacity with flow groups', 'https://learn.microsoft.com/en-us/power-automate/flow-groups'),
 ('S09', 'Create flow groups and rollout availability', 'https://learn.microsoft.com/en-us/power-automate/create-flow-group'),
 ('S10', 'Power Automate licensing and approval responders', 'https://learn.microsoft.com/en-us/power-platform/admin/power-automate-licensing/faqs'),
 ('S11', 'Dataverse connector classification', 'https://learn.microsoft.com/en-us/connectors/commondataserviceforapps/'),
 ('S12', 'Approvals connector classification', 'https://learn.microsoft.com/en-us/connectors/approvals/'),
 ('S13', 'Office 365 Outlook connector classification', 'https://learn.microsoft.com/en-us/connectors/office365/'),
 ('S14', 'Exchange Online pricing', 'https://www.microsoft.com/en-us/microsoft-365/exchange/exchange-online-business-plans-and-pricing'),
 ('S15', 'Microsoft 365 Business Basic pricing', 'https://www.microsoft.com/en-us/microsoft-365/business/microsoft-365-business-basic'),
 ('S16', 'Microsoft Entra ID Free', 'https://learn.microsoft.com/en-us/azure/cost-management-billing/manage/microsoft-entra-id-free'),
 ('S17', 'Microsoft Entra pricing', 'https://www.microsoft.com/en-us/security/microsoft-entra-pricing'),
 ('S18', 'Custom domains and managed certificates', 'https://learn.microsoft.com/en-us/power-pages/admin/add-custom-domain'),
 ('S19', 'Environment creation and database capacity', 'https://learn.microsoft.com/en-us/power-platform/admin/create-environment'),
 ('S20', 'Power Pages lifecycle', 'https://learn.microsoft.com/en-us/power-pages/admin/lifecycle'),
 ('S21', 'Power Apps per app CSP availability March announcement', 'https://learn.microsoft.com/en-us/partner-center/announcements/2026-march#power-apps-per-app-sku-returning-to-csp-price-list-in-early-april'),
 ('S22', 'Business Central pricing', 'https://www.microsoft.com/en-us/dynamics-365/products/business-central/pricing'),
 ('S23', 'Business Central indirect access and external users', 'https://learn.microsoft.com/en-us/dynamics365/business-central/dev-itpro/developer/power-pages-on-virtual-tables-overview'),
 ('S24', 'Portal Management prerequisites', 'https://learn.microsoft.com/en-us/power-pages/configure/portal-management-app'),
 ('S25', 'Approval responder prerequisites', 'https://learn.microsoft.com/en-us/power-automate/get-started-approvals'),
 ('S26', 'Managed Environment licensing', 'https://learn.microsoft.com/en-us/power-platform/admin/managed-environment-licensing'),
 ('S27', 'Portal Web API licensing', 'https://learn.microsoft.com/en-us/power-pages/configure/web-api-overview'),
 ('S28', 'Power Automate capacity license types', 'https://learn.microsoft.com/en-us/power-platform/admin/power-automate-licensing/types'),
 ('S29', 'jsPDF pinned package manifest', 'https://registry.npmjs.org/jspdf/4.2.1'),
 ('S30', 'jsPDF license', 'https://github.com/parallax/jsPDF/blob/v4.2.1/LICENSE'),
 ('S31', 'External ID billing', 'https://learn.microsoft.com/en-us/entra/external-id/external-identities-pricing'),
]

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def dump(path, data):
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

def money(value):
    return f'${value:,.0f}' if value == int(value) else f'${value:,.2f}'

def make_model():
    rates = dict(pages_pack_100=200, pages_authenticated_payg=4,
                 pages_anonymous_pack_500=75, pages_anonymous_payg=.30,
                 automate_process=150, automate_premium_user=15,
                 power_apps_premium_user=20, power_apps_per_app_csp_reference=5,
                 exchange_online_plan1=4, business_basic_teams=7,
                 business_basic_no_teams=5.40, entra_p1=7, entra_p2=10,
                 database_gb_subscription=40, file_gb_subscription=2,
                 log_gb_subscription=10, database_gb_payg=48,
                 file_gb_payg=2.40, log_gb_payg=12,
                 automate_cloud_run_payg_preview=.60,
                 business_central_essentials=80, business_central_premium=110,
                 business_central_team_member=8)
    rows = []
    for users in [5, 10, 25, 30, 32, 37, 50, 75, 100, 101, 150, 250, 500]:
        pp = math.ceil(users / 100) * rates['pages_pack_100']
        pg = users * rates['pages_authenticated_payg']
        # One named maintainer and one direct-Contact operator are allowances.
        # The same person may hold both licenses. Do not double-buy existing seats.
        overhead = 15 + 20
        rows.append(dict(monthly_billable_site_users=users,
            pages_subscription_monthly=pp, pages_payg_monthly=pg,
            grouped_subscription_monthly=pp+150+overhead,
            grouped_subscription_annual=(pp+150+overhead)*12,
            grouped_payg_monthly=pg+150+overhead,
            grouped_payg_annual_at_constant_usage=(pg+150+overhead)*12,
            no_group_two_process_plus_owner_premium_subscription_monthly=pp+300+overhead,
            all_four_flows_separately_process_licensed_subscription_monthly=pp+600+overhead,
            per_user_automation_subscription_monthly=pp+15*(users+1)+20,
            per_user_automation_payg_monthly=pg+15*(users+1)+20))
    return dict(as_of=DATE, currency='USD', geography='US public commercial reference prices',
        commercial_basis='Subscription monthly equivalents generally require annual commitment; local CSP quote, taxes and exchange rate pending.',
        company_inputs={'employees_monthly': [25, 30], 'managers_and_boss': 7,
            'existing_licenses': 'Unknown', 'reviewers_website_usage': 'Unknown; show both approval-email-only and website-user cases.'},
        rates_monthly_usd=rates, sources=[dict(id=i,title=t,url=u,accessed=DATE) for i,t,u in SOURCES],
        assumptions=dict(production_sites=1, production_flows=4,
            monthly_billable_users='Include employees, Finance and Admin who actually log in; subtract only verified eligible license exemptions.',
            process_group_available='Conditional, not verified in tenant. All four solution-aware flows must explicitly join one group.',
            per_user_automation='Conservative alternative: all billable site users are covered for instant flows plus one separate maintainer; confirm Power Pages caller entitlement recognition with CSP.',
            named_maintainer_premium_allowance=1, direct_contact_operator_power_apps_premium_allowance=1,
            maintainer_and_operator_can_be_same_person=True,
            support_seat_allowances='Budget allowances, not a claim that all cloud-flow makers or pure platform admins require extra paid seats.',
            existing_mailboxes=True, anonymous_usage_billed=0, storage_overage_usd=0,
            microsoft365_additional_seats=0, pk_quotation_and_taxes_included=False,
            pk_conversion='Multiply total USD by the company procurement exchange rate, then apply applicable tax and CSP charges. No live FX rate assumed.'),
        rows=rows,
        completeness='Example recurring software budgets only; mailbox additions, storage, anonymous traffic, support, custom domains, tax, migration and ERP integration are separate.')

INVENTORY = [
 ('Custom website', 'HTML CSS JavaScript and Liquid', 'Five pages and shared templates; company source. No explicit project LICENSE found; confirm ownership in the handover contract.'),
 ('Power Pages', 'Microsoft hosted SaaS', 'Site hosting, portal Web API, sessions, local login and site security. Runtime version managed by Microsoft; native version export absent.'),
 ('Microsoft Dataverse', 'Microsoft hosted SaaS', 'Contact, Department, Request, Line Item, Cash Transaction and Request Clarification tables; receipt PDF file storage.'),
 ('Power Automate', 'Four recorded production flows', 'Finance movement; manager and boss approval; clarification notification; submit clarification answer. Native full exports still needed.'),
 ('Dataverse connector', 'Premium', 'Read and write operational tables in flows; connector access is covered by the selected automation entitlement. [S11]'),
 ('Approvals connector', 'Standard', 'Manager and boss decisions with custom responses. Standard classification does not make the Dataverse flow free. [S12]'),
 ('Office 365 Outlook', 'Standard connector plus mailbox', 'Clarification notification email; recorded in the flow guide, not a complete inspected native export. [S13]'),
 ('Portal identity', 'Local Contact login in current project', 'Username and password provisioning through native Management Change Password. Entra sign-in is an alternative, not a deployed change.'),
 ('jsPDF', '4.2.1 MIT', 'Pinned local UMD bundle for image-to-PDF conversion. Package matches upstream exactly; preserve vendor license and embedded notices. [S29 S30]'),
 ('Bootstrap host features', 'Host supplied version unverified', 'Header uses native Bootstrap collapse/dropdown behavior. No independent Bootstrap package is installed by this repo.'),
 ('Brand image', 'Company supplied PNG', 'Industrad logo; confirm company rights. No stock-image subscription introduced.'),
 ('Development tools', 'Outside production runtime', 'Node.js, Python and Playwright help build/check files; Git and the editor are tooling. No Node/Python server or developer PC is required to host this app.'),
]

def build_bom():
    canonical = [
      ('new-request', 'New Request client', 'project snapshot', 'pages/new-request/pettycash-api.js'),
      ('modules', 'Ledger Finance and clarification client', 'finance-posting-v5', 'shared/modules/pettycash-modules.js'),
      ('admin', 'Admin profile client', 'admin-profiles-v3', 'pages/admin/pettycash-admin.js'),
      ('receipts', 'Receipt PDF client', 'receipt-pdf-v1', 'shared/receipts/pettycash-receipts.js'),
      ('home', 'Home client', 'project snapshot', 'pages/home/pettycash-home.js'),
      ('shell', 'Header navigation client', 'project snapshot', 'shared/shell/pettycash-shell.js'),
    ]
    components = []
    for ref,name,version,file in canonical:
        components.append({'type':'application','bom-ref':ref,'name':name,'version':version,
            'hashes':[{'alg':'SHA-256','content':sha(ROOT/file)}],
            'properties':[{'name':'industrad:source:path','value':file},
                          {'name':'industrad:license:status','value':'No explicit project license declared; company ownership must be confirmed.'}]})
    components.append({'type':'library','bom-ref':'jspdf','name':'jspdf','version':'4.2.1',
        'purl':'pkg:npm/jspdf@4.2.1','scope':'required','licenses':[{'license':{'id':'MIT'}}],
        'hashes':[{'alg':'SHA-256','content':sha(ROOT/'vendor/jspdf-4.2.1.umd.min.js')}],
        'externalReferences':[{'type':'distribution','url':'https://registry.npmjs.org/jspdf/-/jspdf-4.2.1.tgz'},
                              {'type':'license','url':dict((i,u) for i,_,u in SOURCES)['S30']}],
        'properties':[{'name':'industrad:source:path','value':'vendor/jspdf-4.2.1.umd.min.js'},
            {'name':'industrad:upstream:integrity','value':'sha512-YyAXyvnmjTbR4bHQRLzex3CuINCDlQnBqoSYyjJwTP2x9jDLuKDzy7aKUl0hgx3uhcl7xzg32agn5vlie6HIlQ=='},
            {'name':'industrad:upstream:required_dependency_ranges','value':'@babel/runtime ^7.28.6; fflate ^0.8.1; fast-png ^6.2.0'},
            {'name':'industrad:upstream:optional_dependency_ranges','value':'canvg ^3.0.11; core-js ^3.6.0; dompurify ^3.3.1; html2canvas ^1.0.0-rc.5'},
            {'name':'industrad:dependency:resolution','value':'Embedded dependency versions not fully recovered from minified bundle. No npm lockfile in project; ranges are declarations, not resolved component versions.'}]} )
    components.append({'type':'framework','bom-ref':'bootstrap-host','name':'Bootstrap host behavior',
        'description':'Supplied by the Power Pages host; exact version and host asset inventory unverified. Not separately vendored by this repository.',
        'properties':[{'name':'industrad:license:status','value':'Upstream Bootstrap is MIT; exact host artifact and notices require native inventory.'}]})
    services = [
      {'bom-ref':ref,'name':name,'provider':{'name':'Microsoft'},'description':desc,
       'properties':[{'name':'industrad:licensing:reference','value':src}]} for ref,name,desc,src in [
      ('power-pages','Microsoft Power Pages','Hosted site and portal Web API. Live service version not exported.','S01 S06 S07'),
      ('dataverse','Microsoft Dataverse','Six recorded app tables plus Power Pages and approval system tables; database file and log storage.','S04 S11'),
      ('power-automate','Microsoft Power Automate','Four recorded cloud flows. No current full native solution export.','S02 S08 S10'),
      ('approvals','Microsoft Standard approvals','Standard connector for manager and boss decisions.','S12 S25'),
      ('outlook','Microsoft Office 365 Outlook','Recorded notification connector and supporting Exchange mailbox; native connection export pending.','S13 S14'),
    ]]
    files=[]
    for folder in ['pages','shared','vendor']:
        for path in sorted((ROOT/folder).rglob('*')):
            if path.is_file() and path.suffix.lower() in ['.html','.js','.css','.png','.txt']:
                files.append({'path':path.relative_to(ROOT).as_posix(),'bytes':path.stat().st_size,'sha256':sha(path)})
    bom={'bomFormat':'CycloneDX','specVersion':'1.6','serialNumber':'urn:uuid:'+str(uuid.uuid4()),'version':1,
        'metadata':{'timestamp':DATE+'T00:00:00Z',
            'component':{'type':'application','bom-ref':'petty-cash','name':'Industrad Petty Cash','version':'source-snapshot-'+DATE},
            'properties':[{'name':'industrad:scope','value':'Repository-derived first-party/runtime library and SaaS inventory. Not a native tenant export, resolved transitive dependency inventory or vulnerability scan.'},
                {'name':'industrad:production:status','value':'Production licensing assessment only; no deployment or purchase performed.'}]},
        'components':components,'services':services,
        'dependencies':[{'ref':'petty-cash','dependsOn':[c['bom-ref'] for c in components]+[s['bom-ref'] for s in services]},
                        {'ref':'receipts','dependsOn':['jspdf']},
                        {'ref':'modules','dependsOn':['power-pages','dataverse','power-automate']},
                        {'ref':'admin','dependsOn':['power-pages','dataverse']},
                        {'ref':'power-automate','dependsOn':['dataverse','approvals','outlook']}],
        'compositions':[{'aggregate':'incomplete','assemblies':['petty-cash']}],
        'properties':[{'name':'industrad:upstream-license-notice','value':'Retain vendor/jspdf-LICENSE.txt and the minified bundle notice.'}]}
    dump(OUT/'petty-cash.cdx.json',bom)
    dump(OUT/'source-manifest.json',{'as_of':DATE,'scope':'Current local page shared and vendor runtime files; hashes do not assert live publication.','files':files})
    return bom,files

def content(model):
    r=model['rows']; at=lambda n:next(x for x in r if x['monthly_billable_site_users']==n)
    pages=[]
    def page(title,*blocks):pages.append((title,list(blocks)))
    def p(text):return ('p',text)
    def h(text):return ('h',text)
    def t(headers,rows,widths=None):return ('table',headers,rows,widths)
    def b(text):return ('bullet',text)
    page('Recommendation and scope',
      p('Prepared for Industrad Engineering on 16 November 2026. This report combines a software bill of materials with a production licensing and cost assessment for the existing petty cash website.'),
      p('The company expects 25–30 employee users and seven managers/bosses; existing licenses are unknown. At this size, Power Pages pay as you go plus one shared Process flow group is the cost-saving candidate, subject to regional availability and actual storage. Prepaid Pages capacity offers predictable billing and more included file storage. Confirm all four flows are eligible group members. [S01 S07 S08 S09]'),
      t(['Company access scenario','PAYG budget monthly','Prepaid budget monthly'],[
        ['25–30 employee logins; reviewers only answer email','$285–305','$385'],
        ['32–37 logins if all seven reviewers also visit the site','$313–333','$385'],
        ['Annual equivalent across these usage cases','$3,420–3,996','$4,620'],
        ['If one new notification sender mailbox is needed','Add $4/month','Add $4/month']],[3.4,1.7,1.7]),
      p('Both budgets include one Process group ($150/month) and $35 in support-seat allowances. PAYG adds $4 per billable site user; prepaid adds one $200 pack for up to 100. Add site users outside the stated population, such as a separate Finance/Admin visitor, if applicable. Extra storage and anonymous traffic are excluded. [S01 S02 S05]'),
      p('The $35 allowance is $15 for a Power Automate Premium maintainer and $20 for a Power Apps Premium operator. It is a prudent procurement allowance, not a claim that pure platform administration or every Process-covered cloud-flow author always requires both. Remove seats already licensed; have the partner confirm the actual operator rights. [S02 S03 S24 S28]'),
      h('What is verified and what is assumed'),
      p('Local code, guides, supplied flow fragments and the pinned jsPDF artifact were inspected. Headcount is user-supplied; actual license assignments, tenant capacity, regional quote and full production solution export remain unverified. Other sizes in the comparison tables are examples. No licenses were bought and no site or flow was changed.'),
      p('Prices are US public USD reference rates checked on the report date, normally monthly equivalents under annual subscription terms. They exclude Pakistan taxes, exchange conversion, partner margin, migration and support. Obtain a Pakistan CSP quote before purchase. Pay as you go figures are consumption estimates, not annual commitments.'),
      p('The report includes the current approval and clarification design. The deferred live-read/cache flow and Business Central synchronization are not counted as implemented production flows.'))
    page('Software and service inventory',
      t(['Component','Recorded version or status','Purpose and license position'],INVENTORY,[1.25,1.65,3.9]),
      p('The accompanying CycloneDX 1.6 JSON is deliberately marked incomplete. Microsoft service internals, exact hosted Bootstrap assets and resolved versions of libraries embedded in jsPDF are not available from this repository. source-manifest.json hashes the inspected runtime files.'))
    page('Cloud flows and runtime coverage',
      t(['Recorded production flow','Trigger and purpose','Licensing route'],[
       ['Finance Cash Movement','Power Pages instant call; validates and posts employee cash movements.','Explicit member of the Process flow group; otherwise its own Process allocation or confirmed licensed callers.'],
       ['Manager and Boss Approval','Dataverse Request added or modified; manager decision, boss decision over PKR 10,000, expense posting and clarification resumption.','Explicit group member. Without grouping, use its own Process allocation or valid automated-flow owner entitlement.'],
       ['Clarification Notification','Dataverse Request enters a waiting-for-employee stage; sends the reviewer question and reply link.','Explicit group member; verify Outlook mailbox rights separately.'],
       ['Submit Clarification Answer','Power Pages instant call; validates employee ownership, saves answer and queues review.','Explicit group member; otherwise its own Process allocation or confirmed licensed callers.']],[1.65,2.55,2.6]),
      p('These four flows are recorded in the project guides. A complete current native export is still required to confirm their final names, enabled state, connectors, owners and licensing allocation. Retired diagnostic/manual test flows are excluded and should not be left enabled in production.'),
      h('Preferred allocation'),
      p('A flow group can contain up to 25 solution-aware flows and shares one 250,000-action daily pool in one environment. Add all four explicitly; a shared purpose, solution or owner alone does not allocate capacity. Parent and child flows count separately. A second environment needs its own allocation. Rollout began in July 2026; confirm the Flow groups option exists before ordering on this basis. [S08 S09]'),
      h('Alternatives when grouping is unavailable'),
      p('A practical fallback is two Process licenses for the two instant flows ($300/month), with the two automated flows under a properly licensed Premium owner. Another simple but expensive option allocates four Process licenses ($600/month). Neither price includes the site. The per-user alternative must cover every applicable instant-flow caller; one shared owner license does not automatically cover everyone. [S02 S10]'),
      p('Dataverse makes these flows premium even though Approvals and Outlook are Standard connectors. Pure approval responders do not need Power Automate Premium just to respond, but they still need a supported work identity and basic approval entitlement. If a reviewer also runs a website flow, apply that separate entitlement. [S11 S12 S13 S25]'))
    page('Reference prices for procurement',
      p('USD monthly equivalents checked 16 November 2026. Subscription prices below are generally paid yearly. Existing licenses should be credited before calculating incremental spend.'),
      t(['Product or meter','Reference price','When it applies'],[
       ['Power Pages authenticated subscription','$200 / 100 users / site','Predictable monthly active authenticated usage; includes 2 GB database and 16 GB file capacity per pack. [S01]'],
       ['Power Pages authenticated PAYG','$4 / active user / site','Azure-billed actual monthly unique users. [S05]'],
       ['Power Pages anonymous subscription','$75 / 500 users / site','Public Home or other unauthenticated content may create this usage. [S01]'],
       ['Power Pages anonymous PAYG','$0.30 / anonymous user / site','If the anonymous meter is enabled. [S05]'],
       ['Power Automate Process','$150 / allocation','One eligible flow group or direct flow allocation. [S02 S08]'],
       ['Power Automate Premium','$15 / named user','Per-user automation route or maintainer allowance. [S02]'],
       ['Power Apps Premium','$20 / named user','Direct operational Dataverse/model-driven app access or qualifying internal site access. [S03]'],
       ['Power Apps per app via CSP','$5 / user / app reference','Conditional one-site internal alternative; obtain channel quote and entitlement confirmation. [S06 S21]'],
       ['Exchange Online Plan 1','$4 / mailbox user','New notification sender mailbox if existing email does not cover it. [S14]'],
       ['Microsoft 365 Business Basic','$7 with Teams or $5.40 without Teams','Alternative email/productivity bundle; do not add on top of equivalent existing licenses. [S15]'],
       ['Entra ID Free','$0 for basic identities','No mailbox, Power Pages or flow entitlement included. [S16]'],
       ['Entra ID P1 or P2','$7 or $10 / user','Optional security capabilities; not required merely to create basic identities. [S17]'],
       ['Power Automate Hosted Process','$215 / allocation','Not needed: this project has no hosted desktop automation. [S02]'],
       ['Power Automate cloud-run PAYG','$0.60 / premium run','Preview/availability check required; not the recommended production baseline. [S05]']],[2.1,1.7,3.0]),
      p('Do not purchase legacy per-flow plans based on older project or online examples. Flow licensing and website licensing are separate purchases unless an applicable existing entitlement is explicitly verified.'))
    page('Choosing the website subscription',
      p('Use U for billable monthly active authenticated users of one site, not the number of Contacts in Dataverse. Repeated logins to the same site during that month do not multiply U. Finance and Admin visitors are users too. [S05]'),
      t(['Example U','Subscription monthly','PAYG monthly','Lower website charge'],[
        [str(x['monthly_billable_site_users']),money(x['pages_subscription_monthly']),money(x['pages_payg_monthly']),
         'Tie' if x['pages_subscription_monthly']==x['pages_payg_monthly'] else 'PAYG before storage' if x['pages_payg_monthly']<x['pages_subscription_monthly'] else 'Subscription'] for x in r],[1,1.7,1.6,2.5]),
      p('For the first pack, the website-only break-even is 50 active users ($200 either way). For any pack count K, compare $200 × ceil(U/100) with $4 × U. Pack boundaries matter: at 101 users a second pack costs $400, compared with $404 PAYG. This is a calculation from the published rates, not a tenant quote.'),
      p('PAYG can be cheaper for very small or seasonal usage, but receipt storage, audit logs and anonymous traffic can reverse the result. The public meter documentation still labels the Pages meters preview; validate commercial availability and support for the target region. Do not buy prepaid Pages packs and assume they offset PAYG usage in the same enabled environment. [S05]'),
      h('Existing internal user licenses'),
      p('Eligible same-tenant Power Apps Premium users can access sites without consuming Pages authenticated capacity when using the supported Entra provider. Eligible Dynamics 365 enterprise rights require the relevant application context. The current local username/password login must not be assumed to recognize these exemptions. Business Central or Microsoft 365 ownership alone is not blanket site coverage. [S06]'),
      p('Power Apps per app remains a possible CSP channel option despite removal from the public price list in January 2026. Ask the partner to confirm $5 one-site coverage, minimums and availability. Its website-only cost beats a $200 pack below 40 consistently assigned users, but is usually above $4 PAYG per active user and does not automatically solve instant-flow licensing. [S06 S21]'))
    page('Combined cost scenarios',
      p('These examples assume one production site, all four flows in one Process group, no separately billable anonymous users, existing employee mailboxes and no extra storage. They include the $35 monthly support-seat allowances from page 1. All amounts are USD.'),
      t(['Monthly U','Grouped with Pages pack','Grouped with Pages PAYG','Pack annual equivalent'],[
        [str(x['monthly_billable_site_users']),money(x['grouped_subscription_monthly']),money(x['grouped_payg_monthly']),money(x['grouped_subscription_annual'])]
        for x in r if x['monthly_billable_site_users'] in [5,25,30,32,37,50,100,250,500]],[1,1.9,1.9,2.0]),
      h('Compare automation choices at 100 users'),
      t(['Automation choice','Total monthly with one Pages pack','Tradeoff'],[
       ['One Process flow group',money(at(100)['grouped_subscription_monthly']),'Best overall if available; explicit four-flow membership required.'],
       ['Two Process flows plus licensed automated-flow owner',money(at(100)['no_group_two_process_plus_owner_premium_subscription_monthly']),'Fallback when grouping unavailable; owner rights and flow type need confirmation.'],
       ['Four separate Process allocations',money(at(100)['all_four_flows_separately_process_licensed_subscription_monthly']),'Simple allocation but higher recurring spend.'],
       ['Premium for 100 callers plus separate maintainer',money(at(100)['per_user_automation_subscription_monthly']),'Conservative upper estimate if every visitor might submit a clarification; not a claim every visitor must buy Premium.']],[2.1,1.55,3.15]),
      p('For only five applicable callers plus one maintainer, the per-user automation route is $90/month versus $165 for grouped automation plus the maintainer allowance. With Pages PAYG and the Contact-operator allowance, that example is $130/month before mailbox/storage. Confirm that the actual Power Pages caller identities are validly covered before choosing it.'),
      p('Do not add manager or boss Premium seats just because they approve. For users already licensed through an existing contract, calculate incremental cost rather than rebuying full seats. Where all internal users already have recognized Power Apps Premium site rights, extra Pages authenticated capacity may be $0; still cover flows, storage and any public traffic.'),
      p('Formula: total = chosen website charge + automation coverage + new support seats + new mailboxes + storage + anonymous usage + optional services. Annual equivalents assume unchanged usage for all 12 months and exclude taxes.'))
    page('Dataverse storage and receipt growth',
      p('There is no separate SQL Server license or Azure SQL database to buy for this implementation. Dataverse storage is supplied through platform entitlements; additional database, file and log capacity is charged only when required. Capacity is pooled or allocated under the selected model, so inspect tenant usage instead of assuming all included space is free for this project. [S01 S04]'),
      t(['Capacity category','Subscription add-on per GB per month','PAYG reference per GB per month'],[
       ['Database',money(40),money(48)],['File including PDFs',money(2),money(2.4)],['Log including audit data',money(10),money(12)]],[2.1,2.35,2.35]),
      p('One authenticated Pages pack contributes 2 GB database and 16 GB file capacity. Do not repeatedly add tenant-default entitlements for every environment or pack. A new Production/Sandbox database needs at least 1 GB available database capacity. Additional environments consume the same finite tenant pool; there is not a flat per-environment hosting charge in this budget. [S01 S19]'),
      p('For Dataverse PAYG, the first 1 GB database and 1 GB file are included per enabled environment; allocation and enabled billing meters determine the actual excess. Audit log usage can be billable immediately when no log allocation covers it. Inspect the billing policy and allocation before adopting a 1 GB-only assumption. [S05]'),
      h('Receipt estimate with one pack'),
      t(['Illustrative retention workload','Annual file growth','Extra at year end using only 16 GB pack allowance'],[
       ['200 requests/month at average 2 MB PDF','4.8 GB','No receipt-only overage in year 1'],
       ['1,000 requests/month at average 2 MB PDF','24 GB','8 GB excess × $2 = $16/month'],
       ['1,000 requests/month at maximum 10 MB PDF','120 GB','104 GB excess × $2 = $208/month']],[3.1,1.2,2.5]),
      p('Estimates use decimal 1 GB = 1,000 MB and ignore other files, database rows, indexes and logs. They are year-end run rates, not flat full-year charges. Actual PDF sizes and retention policy determine the cost. Conversion happens locally in the browser, so there is no paid PDF-conversion service or per-image API charge.'),
      p('Budget database and log growth separately, review monthly capacity reports and retain audit data for the company-approved period. Native platform backup capability is not a substitute for a separately scoped archival or disaster-recovery requirement. No third-party backup subscription has been added to the baseline.'),
      p('Flow action capacity, portal Web API entitlement and Dataverse service-protection throttles are different limits. A Process group shares its action allowance; buying it does not remove every API or connector limit. Extra request capacity, if needed, requires a separate usage assessment and quote. Portal Web API access is covered by the applicable site entitlement, not an extra per-column license. [S10 S27]'))
    page('Identity email and administrator access',
      h('Website users and reviewers'),
      p('Current users sign in with local Contact usernames/passwords. This identity method does not itself add an Entra Premium fee, but it also does not remove Pages capacity charges. Creating basic Entra identities in the existing tenant is free; mailboxes, premium identity features and application access are separate. An Entra sign-in migration is optional and has not been implemented in this assessment. [S16]'),
      p('Managers and the boss need a work identity supported by Approvals and a basic Power Automate/Office 365/Dynamics entitlement for responding. Premium is not required solely to approve or request clarification. A local portal Contact/password alone is not the reviewer identity used by Microsoft Approvals. Existing Microsoft 365 accounts usually avoid new mailbox spend; verify actual assignments. [S10 S25]'),
      h('Notification email'),
      p('Approvals sends its own standard approval notifications. The separate clarification email uses the recorded Outlook connector, whose connection needs a valid Exchange mailbox. If the company already supplies this, incremental email cost is $0. Otherwise budget $4/month for a new Exchange Online Plan 1 mailbox. Do not assume Power Automate Premium includes Exchange. [S12 S13 S14]'),
      p('If a broader Microsoft 365 bundle is needed, Business Basic is a reference alternative at $7/user/month with Teams or $5.40 without Teams. Buy it only for people/services that need it; it does not replace the app’s Pages or premium Dataverse automation entitlement. Employee mailboxes already exist at industrad.com in the intended business process, but their licenses were not inspected. [S15]'),
      h('Native Contact administration'),
      p('The website Admin page creates profiles. Password provisioning still uses native Management Change Password. Portal Management is a model-driven app and requires appropriate Dataverse security roles. Budget $20/month for one direct operational Contact administrator if there is no qualifying existing entitlement; confirm whether the actual activity is covered by supplied management rights or an existing app license. Pure tenant administration alone is not a reason to license every administrator. [S03 S06 S24]'),
      h('Optional identity security'),
      p('Entra P1 ($7/user/month) or P2 ($10/user/month) may be needed for the company’s chosen advanced identity controls; these are not mandatory solely for this website. Existing Microsoft 365 security bundles may already cover them. External ID is an optional identity architecture with its own MAU rules; its free identity tier does not replace Power Pages capacity. [S17 S31]'))
    page('Optional subscriptions and future integration',
      t(['Item','Current requirement','Budget treatment'],[
       ['Azure subscription','Needed for selected PAYG meters; not a separate VM for the prepaid site.','Consumption only for enabled meters/services; Azure credit is not a free Power Pages license. [S05]'],
       ['Custom domain and DNS','Optional; Microsoft site address can be retained.','Use a subdomain of existing industrad.com where possible; domain/DNS quote only if new purchase needed.'],
       ['HTTPS certificate','Required transport, but separate paid certificate is not automatically needed.','Use platform-managed certificate where supported; custom/CDN/WAF configuration decides the path. [S18]'],
       ['CDN WAF and monitoring','Basic hosting/CDN is part of the platform offer; extra Azure services are optional.','Do not add standalone Front Door/Application Insights/Log Analytics charges unless explicitly deployed. [S01]'],
       ['Copilot AI Builder Power BI RPA','Not used by the current application.','No incremental subscription included. Hosted Process, Process Mining or paid PDF SaaS are unnecessary here.'],
       ['Managed Environments','Optional governance configuration, not needed to make the environment Production.','No separate baseline add-on; activating it requires checking every active usage entitlement. [S26]'],
       ['Maintenance migration and support','Required operational work, not a Microsoft SKU price.','Quote one-time migration/ALM, training, support response and backup/retention needs separately.'],
       ['Business Central','Future integration only; not implemented in this repository.','Essentials $80/user/month, Premium $110, Team Members $8 reference; integration scope requires partner quote. [S22]']],[1.5,2.55,2.75]),
      p('Business Central Premium is needed only for its additional manufacturing/service capability, not merely because this project uses Dataverse. Team Members is limited and must not be assumed sufficient for transaction posting. Confirm the API target, user rights, connector classification, service account/application permissions and indirect-access/multiplexing rules before adding the integration. A service principal or one integration user does not automatically eliminate underlying user licensing. [S22 S23]'),
      p('Do not assume Business Central Essentials/Premium automatically grants this independent custom portal unrestricted Dynamics 365 enterprise site rights. Keep future ERP spend out of the current baseline until the mapping and licensing review is complete.'))
    page('Production purchase and handover checklist',
      b('Count monthly active visitors by role and identify any public Home usage. Local Contacts are not a license inventory. Approval-only reviewers are a separate population.'),
      b('Export existing Microsoft 365, Power Apps, Power Automate and Dynamics license assignments. Credit valid existing seats and check Entra sign-in recognition before using site exemptions.'),
      b('Confirm a Production environment with sufficient Dataverse capacity and a production website lifecycle. Developer plans/trials are for build/test; production rights and conversion/migration must be arranged. [S19 S20]'),
      b('Inspect the Flow groups option. If available, put all four solution-aware production flows in the same eligible group and allocate its Process capacity. Otherwise price the fallback explicitly.'),
      b('Identify named maintainers and the operator of native Contact password administration. Confirm app/service rights and mailbox connection licensing without sharing administrator credentials.'),
      b('Obtain a Pakistan CSP quote showing SKU, quantity, currency, tax, annual or monthly commitment, renewal terms and environment allocation. Record any per-app channel availability in writing.'),
      b('Obtain full native solution/site/flow exports and rebind connections, site invocation identifiers, permissions and currency references after migration. Native runtime versions are not inferred from HTML.'),
      b('Verify Finance self-post restrictions, duplicate prevention, manager/boss clarification, rejected requests and a single final ledger posting. Existing local tests are not production acceptance.'),
      b('Confirm anonymous pages, receipt retention, actual storage allocation, action consumption, mailbox sending limits and company support ownership. The freshness upgrade remains deferred; no new live-read flow is budgeted.'),
      h('Scope of the machine readable SBOM'),
      p('petty-cash.cdx.json records the application modules, jsPDF, host Bootstrap dependency and Microsoft services. source-manifest.json records file hashes. Exact embedded jsPDF transitive versions are not reconstructed from dependency ranges; upstream required ranges are @babel/runtime ^7.28.6, fflate ^0.8.1 and fast-png ^6.2.0. Optional manifest dependencies are canvg, core-js, DOMPurify and html2canvas; the receipt feature does not call the HTML rendering feature. [S29]'),
      p('The jsPDF bundle exactly matched the SHA-512-verified upstream tarball on the inspection date. Preserve its MIT license and bundled notices. No explicit license was found for the company application source. This is a source-based inventory, not a complete Microsoft SaaS internals inventory, legal opinion or vulnerability clearance.'),
      p('Generated source files and the calculator are maintained in documentation/sbom and scripts/build_sbom_report.py. Re-running the builder uses this dated price snapshot; it does not re-research current prices.'))
    for start,end in [(0,16),(16,len(SOURCES))]:
        page('Sources and evidence' if start==0 else 'Additional sources and evidence',
             p('Official sources checked on 16 November 2026. References identify the applicable offer or rule; the commercial contract and Pakistan reseller quotation determine the final purchase.'),
             *[('source',i,title,url) for i,title,url in SOURCES[start:end]],
             *([p('Local evidence: pages and shared source; vendor/jsPDF license and pinned bundle; scripts/build_receipt_template.cjs; flows/finance guides; flows/approval supplied fragments; flows/clarifications/CLARIFICATION_SETUP.md; documentation/handover/verification.json. These are repository artifacts, not current native license assignments or full tenant exports.')] if start else []))
    return pages

def hyperlink(p,text,url):
    rel=p.part.relate_to(url,'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink',is_external=True)
    link=OxmlElement('w:hyperlink');link.set(qn('r:id'),rel)
    run=OxmlElement('w:r');props=OxmlElement('w:rPr');color=OxmlElement('w:color');color.set(qn('w:val'),'17665F');props.append(color)
    run.append(props);node=OxmlElement('w:t');node.text=text;run.append(node);link.append(run);p._p.append(link)

def document(pages):
    doc=Document();sec=doc.sections[0]
    sec.page_width=Inches(8.27);sec.page_height=Inches(11.69)
    sec.top_margin=sec.bottom_margin=Inches(.62)
    sec.left_margin=sec.right_margin=Inches(.68)
    sec.header_distance=sec.footer_distance=Inches(.25)
    normal=doc.styles['Normal'];normal.font.name='Calibri';normal.font.size=Pt(10.5)
    normal.paragraph_format.space_after=Pt(6);normal.paragraph_format.line_spacing=1.08
    for name,size in [('Title',25),('Heading 1',18),('Heading 2',12)]:
        st=doc.styles[name];st.font.name='Calibri';st.font.size=Pt(size);st.font.bold=True
        st.font.color.rgb=RGBColor.from_string('000000' if name=='Title' else '172B35')
        st.paragraph_format.space_before=Pt(9 if name!='Title' else 0);st.paragraph_format.space_after=Pt(7)
        if st.element.pPr is not None:
            for elem in list(st.element.pPr):
                if elem.tag==qn('w:pBdr'):st.element.pPr.remove(elem)
    doc.core_properties.title=TITLE;doc.core_properties.subject='Software inventory and production licensing assessment'
    doc.core_properties.author='Industrad Engineering';doc.core_properties.keywords='SBOM Power Pages Dataverse Power Automate licensing'
    hp=sec.header.paragraphs[0];hp.text='INDUSTRAD ENGINEERING  |  PETTY CASH'
    hp.runs[0].font.size=Pt(8);hp.runs[0].font.color.rgb=RGBColor.from_string('60717A')
    fp=sec.footer.paragraphs[0];fp.text='Licensing review 16 November 2026                                        Page '
    fp.runs[0].font.size=Pt(8)
    fld=OxmlElement('w:fldSimple');fld.set(qn('w:instr'),'PAGE');fp._p.append(fld)
    md=['# '+TITLE,'','As of 16 November 2026. USD reference pricing; Pakistan quotation and taxes pending.','']
    for index,(heading,blocks) in enumerate(pages):
        if index:doc.add_page_break()
        if index==0:
            doc.add_paragraph(TITLE,'Title')
            doc.add_paragraph('Software bill of materials and production cost assessment','Subtitle')
        doc.add_paragraph(heading,'Heading 1');md+=['## '+heading,'']
        for block in blocks:
            typ=block[0]
            if typ in ('p','bullet','h'):
                style='Heading 2' if typ=='h' else 'List Bullet' if typ=='bullet' else None
                doc.add_paragraph(block[1],style);md += [('### ' if typ=='h' else '- ' if typ=='bullet' else '')+block[1],'']
            elif typ=='source':
                _,ident,title,url=block
                para=doc.add_paragraph();para.paragraph_format.space_after=Pt(8)
                run=para.add_run(ident+'  ');run.bold=True
                hyperlink(para,title,url)
                run=para.add_run('\n'+url);run.font.size=Pt(8)
                md += [f'- [{ident} {title}]({url})','']
            elif typ=='table':
                _,headers,rows,widths=block
                tab=doc.add_table(rows=1,cols=len(headers));tab.autofit=False
                if widths is None:widths=[6.8/len(headers)]*len(headers)
                for col,w in zip(tab.columns,widths):col.width=Inches(w)
                for cell,head,w in zip(tab.rows[0].cells,headers,widths):
                    cell.width=Inches(w);cell.text=head
                    props=cell._tc.get_or_add_tcPr();shade=OxmlElement('w:shd');shade.set(qn('w:fill'),'E7F0EE');props.append(shade)
                    cell.paragraphs[0].runs[0].bold=True
                hdr=OxmlElement('w:tblHeader');tab.rows[0]._tr.get_or_add_trPr().append(hdr)
                for row in rows:
                    cells=tab.add_row().cells
                    for cell,value,w in zip(cells,row,widths):cell.width=Inches(w);cell.text=str(value)
                for row in tab.rows:
                    trpr=row._tr.get_or_add_trPr();no=OxmlElement('w:cantSplit');trpr.append(no)
                    for cell in row.cells:
                        for para in cell.paragraphs:
                            para.paragraph_format.space_after=Pt(5);para.paragraph_format.space_before=Pt(4);para.paragraph_format.line_spacing=1.03
                            for run in para.runs:run.font.size=Pt(9)
                        pr=cell._tc.get_or_add_tcPr();marg=OxmlElement('w:tcMar')
                        for side in ['left','right']:
                            el=OxmlElement('w:'+side);el.set(qn('w:w'),'80');el.set(qn('w:type'),'dxa');marg.append(el)
                        pr.append(marg)
                doc.add_paragraph().paragraph_format.space_after=Pt(1)
                md += ['| '+' | '.join(headers)+' |','| '+' | '.join(['---']*len(headers))+' |']
                md += ['| '+' | '.join(str(v).replace('|','/') for v in row)+' |' for row in rows]+['']
    doc.save(OUT/'Petty Cash Production SBOM and Licensing.docx')
    (OUT/'PRODUCTION_LICENSING_REPORT.md').write_text('\n'.join(md),encoding='utf-8')

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    model=make_model();dump(OUT/'cost-model.json',model)
    with (OUT/'cost-scenarios.csv').open('w',newline='',encoding='utf-8-sig') as f:
        writer=csv.DictWriter(f,fieldnames=list(model['rows'][0]));writer.writeheader();writer.writerows(model['rows'])
    bom,manifest=build_bom();pages=content(model);document(pages)
    (OUT/'README.md').write_text('''# Production SBOM and licensing assessment

Prepared 16 November 2026. This is a researched procurement assessment, not a
tenant license audit, invoice, production deployment or vulnerability clearance.

- [Word report](<Petty Cash Production SBOM and Licensing.docx>): software inventory,
  subscriptions, scenarios, recommendations and official source links.
- [Readable report](PRODUCTION_LICENSING_REPORT.md): the same report in Markdown.
- [CycloneDX SBOM](petty-cash.cdx.json): incomplete source-derived inventory, version 1.6.
- [Cost model](cost-model.json): dated USD rates, assumptions and example totals.
- [Scenario table](cost-scenarios.csv): recurring example budgets for 5 to 500 users.
- [Source manifest](source-manifest.json): inspected runtime artifact SHA-256 hashes.

For the stated team size, Pages PAYG plus one Process flow group is the lower
initial-cost candidate; prepaid Pages capacity offers predictable billing and
more included file storage. Confirm target-environment availability. Do not
assume free Developer rights cover production or one Premium owner
covers all instant-flow users. Existing paid entitlements can reduce new spend.

Company inputs are 25–30 employee users and seven reviewers. Both email-only
reviewer and reviewer-website-access cases are priced. Existing licenses remain
unknown. Pakistan CSP pricing, taxes, foreign exchange, support, migration and
future Business Central integration are not silently included in example totals.

Rebuild with `python scripts/build_sbom_report.py` from the project root using the
document-generation runtime. This uses the stored 16 November price snapshot;
it does not refresh online prices. Re-render and visually review Word output
after editing. No application/page/flow changes or purchases are performed.
''',encoding='utf-8')
    print(f'Created report with {len(pages)} planned pages; {len(bom["components"])} components, {len(bom["services"])} services, {len(manifest)} runtime file hashes and {len(model["rows"])} scenarios.')

if __name__=='__main__':main()
