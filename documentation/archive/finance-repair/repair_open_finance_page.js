/* One-time console repair for an OPEN Finance page with an unconfirmed movement.
 * Paste this whole file in that page's DevTools Console. It sends no request.
 * Then use the existing Retry same cash movement button; do not reload first.
 * Publish pettycash-modules.js for the permanent fix after resolving this item.
 */
(() => {
  if (window.pcFinanceTransportFixed) return;
  if (!window.PettyCashModules?.pendingPostingKey) throw new Error("No pending Finance movement was found. Use the updated shared template instead.");
  const id = window.PC_MODULE_CONFIG?.financeFlowId;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || "")) throw new Error("The page's Finance flow ID is missing.");
  const endpoint = "/_api/cloudflow/v1.0/trigger/" + id.toLowerCase();
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (url, options = {}) => {
    if (url !== endpoint) return originalFetch(url, options);
    const headers = new Headers(options.headers);
    headers.set("X-Requested-With", "XMLHttpRequest");
    const response = await originalFetch(url, { ...options, headers });
    let body;
    try { body = await response.clone().json(); } catch (_) { return response; }
    if (!response.ok || !body || typeof body !== "object" || Array.isArray(body)) return response;
    for (const key of ["postingKey", "employeeId", "transactionId"]) {
      if (body[key] === undefined && Object.hasOwn(body, key.toLowerCase())) body[key] = body[key.toLowerCase()];
    }
    return new Response(JSON.stringify(body), { status: response.status, statusText: response.statusText,
      headers: { "Content-Type": "application/json" } });
  };
  window.pcFinanceTransportFixed = true;
})();
