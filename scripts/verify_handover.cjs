// Local documentation/source audit only. Never connects to the tenant or performs writes to it.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const arg = process.argv.indexOf('--date');
const auditDate = arg >= 0 ? process.argv[arg + 1] : '';
if (!/^\d{4}-\d{2}-\d{2}$/.test(auditDate)) throw new Error('Use --date YYYY-MM-DD for the documentation audit date.');
function run(args) {
  const result = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) throw new Error(args.join(' ') + '\n' + (result.stdout || '') + (result.stderr || ''));
  return result.stdout;
}
const docs = ['HANDOVER.md', 'OPERATIONS_RUNBOOK.md', 'HANDOVER_CHECKLIST.md', 'DOCUMENTATION_AUDIT.md',
  'README.md', 'documentation/README.md', 'ADMIN_PROFILE_SETUP.md', 'FINANCE_SETUP.md',
  'WEBAPI_SITE_SETTINGS.md', 'UI_REFRESH_SETUP.md', 'SITE_SHELL_HOME_SETUP.md', 'RECEIPT_PDF_SETUP.md', 'ITEM_SUGGESTIONS_SETUP.md', 'PRODUCT_UNITS_SETUP.md'];
let checkedLinks = 0;
for (const file of docs) {
  const body = read(file).replace(/```[\s\S]*?```/g, '');
  for (const match of body.matchAll(/\[[^\]]+\]\((<[^>]+>|[^)]+)\)/g)) {
    let target = match[1].replace(/^<|>$/g, '').split('#')[0];
    if (!target || /^[a-z]+:/i.test(target)) continue;
    target = decodeURIComponent(target);
    const absolute = path.resolve(root, path.dirname(file), target);
    assert.ok(absolute.startsWith(root + path.sep), 'Link escapes repository: ' + file + ' → ' + target);
    assert.ok(fs.existsSync(absolute), 'Broken local link: ' + file + ' → ' + target);
    checkedLinks++;
  }
}
const configSource = read('Finance Cash Management.html').match(/<script>\s*([\s\S]*?)\s*<\/script>/)[1];
const scope = { window: {} }; vm.runInNewContext(configSource, scope);
assert.equal(scope.window.PC_MODULE_CONFIG.financeFlowId, '0b0976ac-a6d3-f111-a05d-70a8a52176fd');
assert.equal(scope.window.PC_MODULE_CONFIG.financeSecurityReviewed, true);
assert.ok(read('Finance Cash Management.html').indexOf('window.PC_MODULE_CONFIG') <
  read('Finance Cash Management.html').indexOf("{% include 'Petty Cash Modules' %}"));
assert.match(read('pettycash-modules.js'), /version: "finance-posting-v5"/);
assert.match(read('pettycash-admin.js'), /const version = "admin-profiles-v3"/);
assert.match(read('Petty Cash User Context.html'), /web-template-v2-finance/);
for (const name of ['crec6_postingkey', 'hr_cashtransactionid', 'hr_recordedby', 'hr_totalprice', 'hr_othercategory', 'hr_departmentses']) {
  assert.ok(read('HANDOVER.md').includes(name), 'Missing current schema identifier: ' + name);
}
const fields = read('WEBAPI_SITE_SETTINGS.md');
assert.match(read('HANDOVER.md'), /\bhr_unit\b/);
assert.match(fields, /,hr_unit,/);
for (const name of ['adx_identity_username', 'adx_identity_logonenabled', 'hr_departmentsid,statecode', 'hr_managercomments']) {
  assert.ok(fields.includes(name), 'Missing combined public field: ' + name);
}
for (const script of ['build_request_page.cjs', 'build_ui_styles.cjs', 'build_home_template.cjs', 'build_shell_template.cjs']) run(['scripts/' + script, '--check']);
const tests = fs.readdirSync(path.join(root, 'tests')).filter(file => file.endsWith('.test.cjs')).sort().map(file => 'tests/' + file);
const testOutput = run(['--test', '--test-isolation=none', '--test-reporter=tap', ...tests]);
const count = label => Number(testOutput.match(new RegExp('^# ' + label + ' (\\d+)$', 'm'))?.[1] || 0);
assert.ok(count('tests') > 0 && count('tests') === count('pass') && count('fail') === 0, 'Unit suite did not pass');
const files = [
  ...fs.readdirSync(root).filter(file => /\.(?:html|js|css|md|docx)$/.test(file)),
  ...fs.readdirSync(path.join(root, 'scripts')).filter(file => file.endsWith('.cjs')).map(file => 'scripts/' + file),
  ...tests, 'documentation/README.md', 'finance-cash-request.schema.json',
  'vendor/jspdf-4.2.1.umd.min.js', 'vendor/jspdf-LICENSE.txt'
].sort();
const manifest = files.map(file => {
  const bytes = fs.readFileSync(path.join(root, file));
  return { file, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    classification: file.endsWith('.docx') ? 'historical_word_reference' : file === 'Accounts Cash Management.html' ? 'retired_page' : 'source_or_documentation' };
});
const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', windowsHide: true });
const report = {
  audit_date: auditDate,
  scope: 'Local source and documentation. No native tenant, export, authentication or permission audit.',
  source_commit_before_documentation_changes: head.status === 0 ? head.stdout.trim() : null,
  node_version: process.version,
  local_checks: { documentation_links_checked: checkedLinks, generated_templates_consistent: true,
    configured_finance_page_matches_recorded_invocation: true, unit_tests: count('tests'), passed: count('pass'), failed: count('fail') },
  browser_evidence: 'Prior mocked suites documented in setup guides. Not rerun or represented as native acceptance by this documentation audit.',
  word_documents: 'Original DOCX files are older references; not reissued or freshly rendered for company handover.',
  native_exports_reviewed: false,
  user_reported_completion: { confirmed_on: '2026-11-02', manager_approval_duplicate_protection: true,
    header_footer_home_published: true, evidence: 'User reply to the two handover status questions; not a native export/run review.' },
  native_tenant_operations_performed: false,
  product_units_user_confirmation: { confirmed_on: '2026-11-03', saved_to_unit_column: true,
    setup_checks_passed: ['request columns', 'product columns', 'department target'],
    evidence: 'User report and diagnostic screenshot; specific fractional/email acceptance not inferred.' },
  company_acceptance: 'Pending native exports, ownership, approval-flow review and live acceptance checklist.',
  manifest
};
const output = path.join(root, 'documentation', 'handover'); fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(path.join(output, 'verification.json'), JSON.stringify(report, null, 2) + '\n');
console.log('Checked ' + checkedLinks + ' documentation links; ' + count('pass') + ' unit checks passed; generated templates match.');
console.log('Wrote documentation/handover/verification.json (' + manifest.length + ' source/document hashes).');
console.log('Local checks passed. Native exports and company acceptance remain unverified.');
