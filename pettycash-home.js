/* Read-only home dashboard. Existing session-authenticated helpers enforce row isolation.
 * Bundled into Petty Cash Home.html; never loads or changes Finance configuration.
 */
(function (root) {
  'use strict';
  const document = root.document;
  function get(id) { return document.getElementById(id); }
  function node(tag, text, className) {
    const element = document.createElement(tag);
    if (text !== undefined) element.textContent = String(text);
    if (className) element.className = className;
    return element;
  }
  function empty(message) {
    const row = node('tr'), cell = node('td', message, 'pc-empty');
    cell.colSpan = 4; row.appendChild(cell); get('pcHomeRequests').replaceChildren(row);
  }
  async function refresh() {
    const button = get('pcHomeRefresh'), api = root.PettyCashModules;
    if (!button || button.disabled) return;
    button.disabled = true;
    get('pcHomeMessage').textContent = 'Refreshing your workspace…';
    try {
      if (!api) throw new Error('The workspace tools could not load. Refresh the page or contact your administrator.');
      const id = get('pcModuleUserId')?.value;
      if (!id) throw new Error('Please sign in to view your workspace.');
      const results = await Promise.allSettled([api.readBalance(id), api.myRequests(id)]);
      if (results[0].status === 'fulfilled') {
        get('pcHomeBalance').textContent = api.money(results[0].value);
        get('pcHomeBalanceMeaning').textContent = api.balanceMeaning(results[0].value);
      } else {
        get('pcHomeBalance').textContent = 'Unavailable';
        get('pcHomeBalanceMeaning').textContent = results[0].reason.message;
      }
      const records = results[1];
      if (records.status === 'rejected') {
        get('pcHomePending').textContent = '—';
        empty('Request history is unavailable.');
        get('pcHomeMessage').textContent = records.reason.message;
        return;
      }
      get('pcHomePending').textContent = String(records.value.filter(row => row.hr_approvalstatus === 123140000).length);
      const body = get('pcHomeRequests'); body.replaceChildren();
      for (const record of records.value.slice(0, 3)) {
        const label = ({ 123140000: 'Pending', 123140001: 'Approved', 123140002: 'Rejected' })[record.hr_approvalstatus];
        const row = node('tr');
        row.appendChild(node('td', record.hr_requesttitle));
        row.appendChild(node('td', String(record.hr_transactiondate || '').slice(0, 10)));
        row.appendChild(node('td', api.money(Number(record.hr_totalamount)), 'pc-numeric'));
        const status = node('td');
        status.appendChild(node('span', label || 'Unknown status', 'pc-status' + (label ? ' pc-status-' + label.toLowerCase() : '')));
        row.appendChild(status); body.appendChild(row);
      }
      if (!records.value.length) empty('Your first request starts here.');
      get('pcHomeMessage').textContent = '';
    } catch (error) {
      get('pcHomeBalance').textContent = 'Unavailable';
      get('pcHomeBalanceMeaning').textContent = error.message;
      get('pcHomePending').textContent = '—';
      get('pcHomeMessage').textContent = error.message;
      empty('Your workspace could not be loaded.');
    } finally { button.disabled = false; }
  }
  function initialize() {
    const home = get('pcHome');
    if (!home || home.dataset.initialized === 'true') return;
    home.dataset.initialized = 'true';
    const button = get('pcHomeRefresh');
    // Anonymous home has no identity include, dashboard controls or API calls.
    if (button) { button.onclick = refresh; refresh(); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize);
  else initialize();
})(window);
