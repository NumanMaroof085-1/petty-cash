// Synthetic, reduced Liquid context for local QA. Not a native portal authorization test.
const fs = require('node:fs');
const path = require('node:path');
const { render } = require('./liquid_fixture.cjs');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const employee = '11111111-1111-4111-8111-111111111111';
function context({ signedIn = true, finance = false, admin = false, fullname = 'Ayesha Khan', language = 'en', children = false } = {}) {
  const link = (name, url, extra = {}) => ({ name, url, weblinks: [], ...extra });
  return {
    user: signedIn ? { id: employee, firstname: fullname.split(' ')[0], fullname, emailaddress1: 'ayesha@example.test',
      roles: ['Authenticated Users', ...(finance ? ['Petty Cash Finance'] : []), ...(admin ? ['Petty Cash Admin'] : [])] } : null,
    settings: {}, snippets: { 'Mobile Header': '<a href="/" aria-label="Petty cash home"><svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="10" fill="#087f72"/><path d="M10 10h9a4 4 0 0 1 0 8h-9V10m0 8v5" fill="none" stroke="white" stroke-width="2"/></svg><span>Company name</span></a>',
      Footer: '<p>© 2026 Company name. All rights reserved.</p>', 'Header/Toggle Navigation': 'Open navigation',
      'Header/Search/ToolTip': 'Search', 'links/login': 'Sign in', 'links/logout': 'Sign out', 'Profile Link Text': 'Profile' },
    website: { adx_partialurl: null, languages: language === 'en' ? ['English'] : ['English', 'Français'],
      selected_language: { name: language === 'fr' ? 'Français' : 'English' },
      sign_in_url_substitution: '/SignIn?returnUrl=%2F', sign_out_url_substitution: '/Account/Login/LogOff?returnUrl=%2F' },
    resx: { Skip_To_Content: 'Skip to main content', Main_Navigation: 'Main navigation', Toggle_Navigation: 'Open navigation',
      Sign_Out: 'Sign out', Sign_In: 'Sign in', Default_Profile_name: 'My account' },
    page: { id: 'home' }, sitemarkers: { Home: { url: '/' }, Profile: { url: '/profile/' }, Search: { id: 'search-page' }, Forums: { id: 'forum-page' } }, sitemap: {},
    weblinks: {
      Default: { editable: false, weblinks: [link('Home', '/'), ...(signedIn ? [link('Dashboard', '/Dashboard/'),
        link('New Petty Cash Request', '/New-Petty-Cash-Request/'), link('My Requests', '/My-Requests/', children ? { weblinks: [link('Request history', '/My-Requests/')] } : {})] : []),
        // Deliberately include privileged links in fixture input to exercise added role guards.
        link('Finance Cash Management', '/Finance-Cash-Management/'), link('Admin Users', '/Admin-Users/')] },
      'Profile Navigation': { weblinks: [link('Profile', '/profile/')] }
    }
  };
}
function includes() {
  return { 'Petty Cash User Context': read('Petty Cash User Context.html'), 'Petty Cash Modules': '<script>' + read('pettycash-modules.js') + '</script>',
    'Petty Cash Home': read('Petty Cash Home.html'),
    Search: '<form action="/search/" role="search"><label for="q">Search the site</label><input id="q" name="q" type="search"><button type="submit">Search</button></form>',
    'Languages Dropdown': '<ul class="dropdown-menu"><li><a class="dropdown-item" href="/fr/">Français</a></li><li><a class="dropdown-item" href="/">English</a></li></ul>' };
}
function fragments(options = {}, page = 'Home.html') {
  const scope = context(options), partials = includes();
  return { header: render(read('Header.html'), scope, partials), footer: render(read('Footer.html'), scope, partials),
    page: render(read(page), scope, partials) };
}
module.exports = { context, includes, fragments, read, employee };
