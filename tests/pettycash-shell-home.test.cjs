const { test } = require('node:test');
const assert = require('node:assert/strict');
const { fragments, read } = require('../scripts/shell_fixtures.cjs');

test('header keeps managed links, native account URLs, search, languages and editable branding', () => {
  const html = fragments({ finance: true, admin: true, language: 'fr', children: true });
  assert.match(html.header, /Company name/);
  assert.match(html.header, /href="\/Dashboard\/"/);
  assert.match(html.header, /href="\/Finance-Cash-Management\/"/);
  assert.match(html.header, /href="\/Admin-Users\/"/);
  assert.match(html.header, /Account\/Login\/LogOff\?returnUrl=/);
  assert.match(html.header, /action="\/search\/"/);
  assert.match(html.header, /href="\/fr\/"/);
  assert.match(html.header, /Request history/);
  assert.match(read('Header.html'), /editable snippets 'Mobile Header'/);
  assert.match(read('Header.html'), /weblinks\["Default"\]/);
  assert.match(read('Header.html'), /include 'Languages Dropdown'/);
  assert.doesNotMatch(html.header, /\{%|\{\{/);
});
for (const [role, flags, finance, admin] of [['employee', {}, false, false], ['finance', { finance: true }, true, false],
  ['admin', { admin: true }, false, true], ['both', { admin: true, finance: true }, true, true]]) {
  test(role + ' navigation and home shortcuts reflect exact web roles in the Liquid fixture', () => {
    const html = fragments(flags);
    for (const source of [html.header, html.page]) {
      assert.equal(source.includes('href="/Finance-Cash-Management/"'), finance);
      assert.equal(source.includes('href="/Admin-Users/"'), admin);
    }
    assert.match(html.page, /id="pcModuleUserId" value="11111111-1111-4111-8111-111111111111"/);
    assert.match(html.page, /My Requests/);
  });
}
test('anonymous home contains native sign-in and no private dashboard, identity or modules include', () => {
  const html = fragments({ signedIn: false });
  assert.match(html.header, /href="\/SignIn\?returnUrl=/);
  assert.match(html.page, /href="\/SignIn\?returnUrl=/);
  assert.doesNotMatch(html.page, /id="pcHomeBalance"|id="pcHomeRefresh"|id="pcModuleUserId"|session-authenticated Power Pages helpers/);
  assert.doesNotMatch(html.header + html.page, /href="\/Finance-Cash-Management\/"|href="\/Admin-Users\/"/);
});
test('user content is escaped and header role/identity evaluation is within substitution', () => {
  const html = fragments({ fullname: '<img src=x onerror=alert(1)> User' });
  assert.doesNotMatch(html.header + html.page, /<img src=x onerror=/);
  assert.match(html.header, /&lt;img src=x onerror=alert\(1\)&gt;/);
  const source = read('Header.html');
  assert.ok(source.indexOf('{% substitution %}') < source.indexOf('user.roles'));
  assert.ok(source.indexOf('user.roles') < source.indexOf('{% endsubstitution %}'));
});
test('new home remains read-only and shell assets do not load data or reset Finance config', () => {
  for (const file of ['pettycash-home.js', 'pettycash-shell.js']) {
    assert.doesNotMatch(read(file), /\bfetch\s*\(|localStorage|sessionStorage|PC_MODULE_CONFIG\s*=|\.postMovement\s*\(|\.createProfile\s*\(/);
  }
  assert.match(read('pettycash-home.js'), /api\.readBalance\(id\)/);
  assert.match(read('pettycash-home.js'), /api\.myRequests\(id\)/);
  assert.doesNotMatch(read('Header.html') + read('Footer.html'), /window\.onload\s*=/);
  assert.match(read('Footer.html'), /editable snippets 'Footer'/);
  assert.match(read('Footer.html'), /2163806/);
  assert.match(read('Footer.html'), /2208177/);
});
test('generated Home/Header templates contain the canonical assets and unique context includes', () => {
  assert.ok(read('Petty Cash Home.html').includes(read('pettycash-home.js').trim()));
  assert.ok(read('Petty Cash Home.html').includes(read('pettycash-home.css').trim()));
  assert.ok(read('Header.html').includes(read('pettycash-shell.js').trim()));
  assert.ok(read('Header.html').includes(read('pettycash-shell.css').trim()));
  for (const include of ['Petty Cash User Context', 'Petty Cash Modules']) {
    assert.equal(read('Petty Cash Home.html').split("{% include '" + include + "' %}").length - 1, 1);
    assert.doesNotMatch(read('Header.html') + read('Footer.html'), new RegExp("include '" + include + "'"));
  }
});
