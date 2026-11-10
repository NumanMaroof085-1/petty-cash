// Local documentation/source audit only. Never connects to the tenant or performs writes to it.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
function projectFiles(relative = '') {
  const result = [];
  for (const entry of fs.readdirSync(path.join(root, relative), { withFileTypes: true })) {
    const file = relative ? relative + '/' + entry.name : entry.name;
    if (['.git', 'tmp', 'documentation/qa', 'documentation/backups'].includes(file)) continue;
    assert.ok(!entry.isSymbolicLink(), 'Unexpected symlink in project inventory: ' + file);
    if (entry.isDirectory()) result.push(...projectFiles(file));
    else if (entry.isFile()) result.push(file);
  }
  return result;
}
const inventory = projectFiles();
const arg = process.argv.indexOf('--date');
const auditDate = arg >= 0 ? process.argv[arg + 1] : '';
if (!/^\d{4}-\d{2}-\d{2}$/.test(auditDate)) throw new Error('Use --date YYYY-MM-DD for the documentation audit date.');
function run(args) {
  const result = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) throw new Error(args.join(' ') + '\n' + (result.stdout || '') + (result.stderr || ''));
  return result.stdout;
}
const docs = inventory.filter(file => file.endsWith('.md'));
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
const configSource = read('pages/finance/Finance Cash Management.html').match(/<script>\s*([\s\S]*?)\s*<\/script>/)[1];
const scope = { window: {} }; vm.runInNewContext(configSource, scope);
assert.equal(scope.window.PC_MODULE_CONFIG.financeFlowId, '0b0976ac-a6d3-f111-a05d-70a8a52176fd');
assert.equal(scope.window.PC_MODULE_CONFIG.financeSecurityReviewed, true);
assert.ok(read('pages/finance/Finance Cash Management.html').indexOf('window.PC_MODULE_CONFIG') <
  read('pages/finance/Finance Cash Management.html').indexOf("{% include 'Petty Cash Modules' %}"));
assert.match(read('shared/modules/pettycash-modules.js'), /version: "finance-posting-v5"/);
assert.match(read('shared/modules/pettycash-modules.js'), /clarificationVersion: "clarification-replies-v1"/);
const replyScope = { window: {}, Object }; vm.runInNewContext(
  read('pages/my-requests/My Petty Cash Requests.html').match(/<script>\s*([\s\S]*?)\s*<\/script>/)[1], replyScope);
assert.equal(replyScope.window.PC_MODULE_CONFIG.clarificationsEnabled, true);
assert.equal(replyScope.window.PC_MODULE_CONFIG.clarificationFlowId, '0a9693f4-61d8-f111-84ea-70a8a52176fd');
assert.match(read('pages/admin/pettycash-admin.js'), /const version = "admin-profiles-v3"/);
assert.match(read('shared/identity/Petty Cash User Context.html'), /web-template-v2-finance/);
for (const name of ['crec6_postingkey', 'hr_cashtransactionid', 'hr_recordedby', 'hr_totalprice', 'hr_othercategory', 'hr_departmentses']) {
  assert.ok(read('documentation/handover/HANDOVER.md').includes(name), 'Missing current schema identifier: ' + name);
}
const fields = read('documentation/platform/WEBAPI_SITE_SETTINGS.md');
assert.match(read('documentation/handover/HANDOVER.md'), /\bhr_unit\b/);
assert.match(fields, /,hr_unit,/);
for (const name of ['adx_identity_username', 'adx_identity_logonenabled', 'hr_departmentsid,statecode', 'hr_managercomments']) {
  assert.ok(fields.includes(name), 'Missing combined public field: ' + name);
}
for (const script of ['build_request_page.cjs', 'build_ui_styles.cjs', 'build_home_template.cjs', 'build_shell_template.cjs']) run(['scripts/' + script, '--check']);
const tests = fs.readdirSync(path.join(root, 'tests')).filter(file => file.endsWith('.test.cjs')).sort().map(file => 'tests/' + file);
const testOutput = run(['--test', '--test-isolation=none', '--test-reporter=tap', ...tests]);
const count = label => Number(testOutput.match(new RegExp('^# ' + label + ' (\\d+)$', 'm'))?.[1] || 0);
assert.ok(count('tests') > 0 && count('tests') === count('pass') && count('fail') === 0, 'Unit suite did not pass');
const files = inventory.filter(file =>
  file !== 'documentation/handover/verification.json' &&
  (/\.(?:html|js|cjs|css|md|docx|pdf|json|txt|py|ps1)$/.test(file) || file === '.gitignore')
).sort();
const manifest = files.map(file => {
  const bytes = fs.readFileSync(path.join(root, file));
  return { file, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    classification: file.endsWith('.docx') ? 'historical_word_reference' : file === 'documentation/archive/retired-pages/Accounts Cash Management.html' ? 'retired_page' : 'source_or_documentation' };
});
const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', windowsHide: true });
const browserResultsFile = path.join(root, 'documentation', 'qa', 'organization', 'browser-results.json');
const organizationBrowserResults = fs.existsSync(browserResultsFile) ?
  JSON.parse(fs.readFileSync(browserResultsFile, 'utf8').replace(/^\uFEFF/, '')) : null;
if (organizationBrowserResults) {
  assert.ok(Array.isArray(organizationBrowserResults) && organizationBrowserResults.length === 8 &&
    organizationBrowserResults.every(result => result.exit_code === 0 && result.mocked_network === true),
    'Organization browser validation contains a failed/incomplete suite');
}
const report = {
  audit_date: auditDate,
  scope: 'Local source and documentation. No native tenant, export, authentication or permission audit.',
  source_commit_before_documentation_changes: head.status === 0 ? head.stdout.trim() : null,
  node_version: process.version,
  local_checks: { documentation_links_checked: checkedLinks, generated_templates_consistent: true,
    configured_finance_page_matches_recorded_invocation: true, unit_tests: count('tests'), passed: count('pass'), failed: count('fail') },
  browser_evidence: organizationBrowserResults ?
    '9 November organization validation: all eight existing browser suites rerun against moved files; intercepted/mock data only, no tenant acceptance.' :
    'Prior mocked suites documented in setup guides. Not represented as native acceptance by this documentation audit.',
  organization: { guide: 'documentation/PROJECT_STRUCTURE.md', report: 'documentation/handover/file-organization.json',
    browser_results: organizationBrowserResults, application_changes: 'Local relocation only; publishing artifacts preserved.' },
  word_documents: 'Original DOCX files are older references; not reissued or freshly rendered for company handover.',
  native_exports_reviewed: false,
  approval_fragment_review: {
    reviewed_on: '2026-11-07',
    evidence: 'flows/approval/snapshots/approval-current-review.2026-11-07.json',
    scope: 'Supplied outer outcome Switch and main trigger only; not a full flow export or runtime audit.',
    native_corrections_confirmed: false,
    user_reported_corrections: {
      confirmed_on: '2026-11-07', boss_waiting_stage_corrected: true,
      intended_boss_recipient_corrected: true,
      evidence: 'User confirms both guided corrections; received JSON remains an older snapshot, updated native code/run not inspected.'
    },
    runtime_acceptance_verified: false
  },
  user_reported_completion: { confirmed_on: '2026-11-02', manager_approval_duplicate_protection: true,
    header_footer_home_published: true, evidence: 'User reply to the two handover status questions; not a native export/run review.' },
  native_tenant_operations_performed: false,
  clarification_reply_ui: {
    implemented_locally_on: '2026-11-08', source_feature_version: 'clarification-replies-v1',
    enabled_in_page: true, native_deployment_verified: false, native_answer_invocation_verified: false,
    publication_state: 'User reports question card visible and expected clarification feature version/ready true; not independently inspected.',
    publication_user_reported: { confirmed_on: '2026-11-08', question_card_visible: true, expected_version_and_ready: true },
    next_native_test: '9 November: user defers live-read flow unless manager requests it; current cache limitation retained. Remaining acceptance: boss clarification resumes boss only, final approval one expense/one correct deduction, rejection no expense; confirm diagnostic cleanup, access/password recovery and native handover exports/owners. No further freshness implementation planned.',
    user_reported_native_progress: {
      reported_on: '2026-11-09', initial_manager_approval_and_question_visible: true,
      answer_submitted_and_flow_succeeded: true, new_manager_run_after_answer: true,
      initial_answer_restart_failed_user_reported: true,
      answer_return_status_inspected: true, answer_response_status: 'answered',
      answer_response_evidence: 'flows/clarifications/snapshots/clarification-answer-response.received-2026-11-09.json',
      queue_action_status_user_reported: 'Succeeded', queued_row_values_inspected: true,
      queued_workflow_stage: 123140003, queued_approval_status: 123140000,
      current_main_trigger_inspected: true, declared_main_trigger_message: 4,
      trigger_refresh_user_reported: true, fresh_event_recovery_result_verified: false,
      fresh_event_recovery_user_reported: 'No main flow run after native stage edits.',
      main_flow_health_user_reported: { status: 'On', flow_checker: 'No warnings/errors', all_runs: 'Only initial successful run' },
      queue_input_parameters_inspected: true,
      queue_input_evidence: 'flows/clarifications/snapshots/clarification-queue-input.received-2026-11-09.json',
      queue_request_id: 'b73e9530-92db-f111-84ea-70a8a52176fd',
      connection_status_user_reported: { Dataverse: 'Green tick', Approvals: 'Green tick' },
      callback_registration_read_verified: true,
      callback_registration_evidence: 'flows/diagnostics/snapshots/callback-registrations.received-2026-11-09.json',
      callback_registration_configuration_matches: true,
      callback_delivery_verified: false,
      controlled_event_delivery_user_reported: true,
      controlled_event_main_review_email_with_question_and_answer_user_reported: true,
      automatic_answer_restart_retest_pending: false,
      automatic_answer_restart_user_reported: true,
      final_approval_test_error_user_reported: { action: 'Condition_-_10k', error: 'greater() received Boolean instead of numeric operand', native_condition_fix_verified: false },
      subsequent_workflow_progress_user_reported: 'Flows running smoothly; boss approval / Approved shown in logs. Exact corrected condition and ledger results not supplied.',
      website_freshness_issue_user_reported: true,
      live_read_freshness_upgrade_implemented: false,
      live_read_freshness_upgrade_deferred_by_user: true,
      live_read_freshness_upgrade_resume_condition: 'Only if manager requests it and user resumes work',
      temporary_diagnostic_cleanup_user_confirmed: false,
      trigger_evidence: 'flows/approval/snapshots/approval-trigger.resumption.received-2026-11-09.json',
      queue_values_evidence: 'flows/clarifications/snapshots/clarification-queue-output.received-2026-11-09.json',
      clarification_notification_delivery_reported: false
    },
    main_trigger_modified_user_reported: true,
    site_invocation_user_confirmed: '0a9693f4-61d8-f111-84ea-70a8a52176fd',
    trigger_snapshot: 'flows/clarifications/snapshots/clarification-answer-trigger.with-inputs.received-2026-11-08.json',
    native_trigger_inputs_declared: true,
    trigger_internal_properties: { clarificationId: 'text', answer: 'text_1' },
    page_payload_names: ['clarificationId', 'answer'],
    native_integration_pending: 'Automatic manager resumption and smooth boss approval user-reported. Live-read upgrade explicitly deferred by user; cache lag retained as documented limitation. Final ledger/single deduction, boss clarification/rejection, cleanup, password recovery and independent permission/handover acceptance remain pending.',
    browser_checks: '2026-11-08 intercepted mock reply, denied-read and foreign-link cases passed on desktop/mobile; screenshots inspected, not native acceptance.'
  },
  anonymous_authentication_challenge: {
    checked_on: '2026-11-07',
    endpoint: 'https://orgc513a088.api.crm15.dynamics.com/api/data/v9.2/WhoAmI',
    status: 401,
    advertised_resource_uri: 'https://orgc513a088.api.crm15.dynamics.com/',
    credentials_sent: false, identity_or_business_records_returned: false,
    authenticated_connector_or_tenant_access_verified: false
  },
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
