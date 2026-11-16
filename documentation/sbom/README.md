# Production SBOM and licensing assessment

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
