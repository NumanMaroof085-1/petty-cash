/* Canonical Source for the Petty Cash Admin Web Template (wrap in script tags).
 * Native session/CSRF API. Role indicators prevent accidental UI exposure only;
 * server-side page and table permissions are the actual authorization boundary.
 * Creates Contact profiles only; password setup is a separate Management operation.
 * Never collects/submits passwords, assigns web roles, writes the ledger,
 * or changes an existing Contact/balance.
 */
(function (root) {
  "use strict";
  const config = Object.assign({ creationEnabled: false, securityReviewed: false,
    departmentIdColumn: "", contactDepartmentNavigation: "",
    contactManagerNavigation: "", roleValues: {} }, root.PC_ADMIN_CONFIG || {});
  const roles = ["Employee", "Manager", "Accounts", "Admin"];
  const version = "admin-profiles-v3";
  const contactColumns = "contactid,fullname,emailaddress1,adx_identity_username,hr_userrole,statecode";
  const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  let busy = false, pending = null;
  function element(id) { return root.document.getElementById(id); }
  function guid(value) {
    const clean = String(value || "").replace(/[{}]/g, "").trim().toLowerCase();
    if (!guidPattern.test(clean)) throw new Error("A valid Contact or Department ID is required.");
    return clean;
  }
  function requireAdmin() {
    const input = element("pcAdminAllowed"), user = element("portalUserId");
    if (!input || input.value !== "true") throw new Error("This page is available only to Petty Cash Admin users.");
    return guid(user && user.value);
  }
  function requireMappings() {
    for (const key of ["departmentIdColumn", "contactDepartmentNavigation", "contactManagerNavigation"]) {
      if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(config[key])) {
        throw new Error("Confirm the admin configuration mapping: " + key + ". Saving remains disabled.");
      }
    }
    if (config.contactDepartmentNavigation === config.contactManagerNavigation ||
        ![config.contactDepartmentNavigation, config.contactManagerNavigation].every(name => /^hr_/i.test(name))) {
      throw new Error("The two Contact lookup navigation properties must be distinct verified custom properties.");
    }
    const values = roles.map(role => config.roleValues && config.roleValues[role]);
    if (!values.every(Number.isInteger) || new Set(values).size !== roles.length) {
      throw new Error("Confirm all four distinct Contact business-role choice values. Saving remains disabled.");
    }
  }
  async function api(url, options = {}) {
    const address = new URL(url, root.location.origin);
    if (address.origin !== root.location.origin || !address.pathname.startsWith("/_api/")) {
      throw new Error("Unexpected API address; the operation was stopped.");
    }
    if (!root.shell || typeof root.shell.getTokenDeferred !== "function") {
      throw new Error("Refresh the page and sign in again to verify your session.");
    }
    const token = await root.shell.getTokenDeferred();
    if (!token) throw new Error("Your sign-in session could not be verified.");
    let response;
    try {
      response = await root.fetch(address.pathname + address.search, {
        method: options.method || "GET", credentials: "same-origin",
        headers: { Accept: "application/json", "OData-Version": "4.0", "OData-MaxVersion": "4.0",
          __RequestVerificationToken: token, ...(options.headers || {}) }, body: options.body
      });
    } catch (_) {
      // Do not propagate a transport exception that might echo a request body.
      throw new Error("The connection was interrupted. The save result is unknown; inspect Contacts before retrying.");
    }
    let raw;
    try { raw = await response.text(); }
    catch (_) { throw new Error("The server response was interrupted. Inspect Contacts before retrying the operation."); }
    let body;
    try { body = raw ? JSON.parse(raw) : null; }
    catch (_) { throw new Error("The server returned an unexpected response. Check the operation before retrying."); }
    if (!response.ok) {
      // A server validation exception can echo submitted values; redact POST errors.
      const error = new Error(options.method === "POST"
        ? "Contact creation was rejected (HTTP " + response.status + "). Check the API fields and admin permissions. No reduced profile was sent."
        : body && body.error && body.error.message || "The Contact operation failed.");
      error.status = response.status;
      throw error;
    }
    return { body: options.method === "POST" ? body && { contactid: body.contactid } : body, response };
  }
  async function collection(url, set) {
    const rows = [], visited = new Set();
    while (url) {
      const address = new URL(url, root.location.origin);
      if (address.origin !== root.location.origin || address.pathname !== "/_api/" + set || visited.has(address.href)) {
        throw new Error("Unexpected paging response; no partial list will be used.");
      }
      visited.add(address.href);
      if (visited.size > 100) throw new Error("Too many records. Ask an administrator to narrow the list.");
      const result = await api(address.pathname + address.search);
      if (!result.body || !Array.isArray(result.body.value)) throw new Error("The server did not return a complete record list.");
      rows.push(...result.body.value);
      url = result.body["@odata.nextLink"] || null;
    }
    return rows;
  }
  async function contacts() {
    // Include inactive records for duplicate-email checks; not all are manager options.
    const rows = await collection("/_api/contacts?$select=" + contactColumns +
      "&$orderby=fullname asc,contactid asc&$top=100", "contacts");
    for (const row of rows) {
      guid(row.contactid);
      if (![0, 1].includes(row.statecode) || !Object.prototype.hasOwnProperty.call(row, "emailaddress1") ||
          !Object.prototype.hasOwnProperty.call(row, "adx_identity_username")) {
        throw new Error("Contact state, email or username was not returned. Check the admin Contact field settings.");
      }
    }
    return rows;
  }
  async function departments() {
    const key = config.departmentIdColumn;
    const rows = await collection("/_api/hr_departmentses?$select=" + key + ",hr_departmentname,statecode" +
      "&$filter=statecode eq 0&$orderby=hr_departmentname asc," + key + " asc&$top=100", "hr_departmentses");
    for (const row of rows) {
      guid(row[key]);
      if (row.statecode !== 0) throw new Error("An inactive Department was returned. Check the table configuration.");
    }
    return rows;
  }
  async function loadOptions() {
    requireAdmin(); requireMappings();
    const [people, teams] = await Promise.all([contacts(), departments()]);
    return { contacts: people, departments: teams };
  }
  function validateInput(input) {
    requireMappings();
    if (!input || typeof input !== "object") throw new Error("Provide the Contact profile fields.");
    if (Object.keys(input).some(key => /password|securitystamp/i.test(key))) {
      throw new Error("This form creates profiles only. Set passwords separately using Portal Management Change Password.");
    }
    const value = { firstName: String(input.firstName || "").trim(), lastName: String(input.lastName || "").trim(),
      email: String(input.email || "").trim().toLowerCase(), username: String(input.username || "").trim(), role: String(input.role || ""),
      departmentId: guid(input.departmentId), managerId: guid(input.managerId) };
    if (!value.lastName || value.lastName.length > 50 || value.firstName.length > 50) {
      throw new Error("Last name is required; each name must be at most 50 characters.");
    }
    if (value.email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) throw new Error("Enter a valid email address of at most 100 characters.");
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{2,99}$/.test(value.username)) {
      throw new Error("Enter a username of 3–100 letters, digits, dots, underscores or hyphens, starting with a letter or digit.");
    }
    if (!roles.includes(value.role)) throw new Error("Choose a configured business role.");
    return value;
  }
  function buildPayload(value) {
    return { firstname: value.firstName, lastname: value.lastName, emailaddress1: value.email,
      hr_userrole: config.roleValues[value.role], hr_currentbalance: 0,
      adx_identity_username: value.username, adx_identity_logonenabled: true,
      [config.contactDepartmentNavigation + "@odata.bind"]: "/hr_departmentses(" + value.departmentId + ")",
      [config.contactManagerNavigation + "@odata.bind"]: "/contacts(" + value.managerId + ")" };
  }
  function entityId(result) {
    const headers = result.response.headers;
    const raw = headers && (headers.get("entityid") || headers.get("OData-EntityId"));
    const match = raw && raw.match(/\(([0-9a-f-]+)\)/i);
    try { return guid(match ? match[1] : raw || result.body && result.body.contactid); }
    catch (_) { return ""; }
  }
  async function verify(state) {
    const result = await api("/_api/contacts(" + state.id + ")?$select=" +
      "contactid,firstname,lastname,emailaddress1,adx_identity_username,adx_identity_logonenabled,hr_userrole,hr_currentbalance,_hr_department_value,_hr_reportstomanager_value");
    const actual = result.body || {}, value = state.value;
    const matches = guid(actual.contactid) === state.id && (actual.firstname || "") === value.firstName &&
      actual.lastname === value.lastName && String(actual.emailaddress1 || "").toLowerCase() === value.email &&
      actual.adx_identity_username === value.username && actual.adx_identity_logonenabled === true &&
      actual.hr_userrole === config.roleValues[value.role] && actual.hr_currentbalance === 0 &&
      guid(actual._hr_department_value) === value.departmentId &&
      guid(actual._hr_reportstomanager_value) === value.managerId;
    if (!matches) throw new Error("The saved Contact did not retain every submitted field. Inspect Contact " + state.id + ".");
  }
  async function createProfile(input) {
    requireAdmin(); requireMappings();
    if (config.creationEnabled !== true || config.securityReviewed !== true) {
      throw new Error("Contact creation is disabled until admin-only page and table permissions are reviewed.");
    }
    if (new URL(root.location.origin).protocol !== "https:") throw new Error("Contact creation requires HTTPS.");
    if (busy) throw new Error("A Contact operation is already running.");
    const value = validateInput(input), fingerprint = JSON.stringify(value);
    if (pending && pending.uncertain) throw new Error("The previous create result is uncertain. Check Contacts before creating another profile.");
    if (pending && pending.fingerprint !== fingerprint) throw new Error("A Contact is already saved. Keep the form unchanged and retry its verification.");
    busy = true;
    try {
      if (!pending) {
        const options = await loadOptions();
        if (options.contacts.some(row => String(row.emailaddress1 || "").trim().toLowerCase() === value.email)) {
          throw new Error("A Contact already uses this email address, including inactive Contacts. No profile was created.");
        }
        if (options.contacts.some(row => String(row.adx_identity_username || "").trim().toLowerCase() === value.username.toLowerCase())) {
          throw new Error("A Contact already uses this username, including inactive Contacts. No profile was created.");
        }
        if (!options.contacts.some(row => guid(row.contactid) === value.managerId && row.statecode === 0)) {
          throw new Error("Choose an existing active manager Contact.");
        }
        if (!options.departments.some(row => guid(row[config.departmentIdColumn]) === value.departmentId)) {
          throw new Error("Choose an existing active Department.");
        }
        pending = { value, fingerprint, id: null, uncertain: false };
        const payload = buildPayload(value);
        try {
          const result = await api("/_api/contacts", { method: "POST",
            headers: { "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify(payload) });
          pending.id = entityId(result);
          if (!pending.id) throw new Error("The Contact was saved but its ID was not returned.");
        } catch (error) {
          if ([400, 401, 403, 404, 405, 413, 422, 429].includes(error.status)) pending = null;
          else pending.uncertain = true;
          throw error;
        }
      }
      await verify(pending);
      const result = { id: pending.id, profileCreated: true, passwordSetupRequired: true, loginProvisioned: false };
      pending = null;
      return result;
    } finally { busy = false; }
  }
  async function inspectProfileRelationships() {
    const id = requireAdmin();
    const result = await api("/_api/contacts(" + id + ")?$select=_hr_department_value,_hr_reportstomanager_value",
      { headers: { Prefer: 'odata.include-annotations="Microsoft.Dynamics.CRM.associatednavigationproperty"' } });
    const data = result.body || {};
    return { department: data["_hr_department_value@Microsoft.Dynamics.CRM.associatednavigationproperty"] || null,
      manager: data["_hr_reportstomanager_value@Microsoft.Dynamics.CRM.associatednavigationproperty"] || null };
  }
  function message(text) { const target = element("pcAdminMessage"); if (target) target.textContent = text; }
  function options(target, rows) {
    target.replaceChildren();
    for (const row of rows) {
      const option = root.document.createElement("option");
      option.value = row.value; option.textContent = row.label; target.appendChild(option);
    }
  }
  function formValue() {
    return { firstName: element("pcAdminFirstName").value, lastName: element("pcAdminLastName").value,
      email: element("pcAdminEmail").value, username: element("pcAdminUsername").value,
      role: element("pcAdminBusinessRole").value,
      departmentId: element("pcAdminDepartment").value, managerId: element("pcAdminManager").value };
  }
  async function initialize() {
    const form = element("pcAdminForm"); if (!form) return;
    const fields = element("pcAdminFields"), button = element("pcAdminCreate");
    try {
      requireAdmin();
      if (element("pcAdminPassword") || element("pcAdminConfirmPassword")) {
        throw new Error("Old Admin page HTML detected. Publish Admin Users.html and the Petty Cash Admin template together; password fields are no longer supported.");
      }
      form.hidden = false;
      form.style.display = "block";
      const data = await loadOptions();
      options(element("pcAdminBusinessRole"), roles.map(role => ({ value: role, label: role })));
      options(element("pcAdminDepartment"), [{ value: "", label: "Choose a department" },
        ...data.departments.map(row => ({ value: guid(row[config.departmentIdColumn]), label: String(row.hr_departmentname || "Unnamed department") }))]);
      options(element("pcAdminManager"), [{ value: "", label: "Choose a manager" },
        ...data.contacts.filter(row => row.statecode === 0).map(row => ({ value: guid(row.contactid),
          label: String(row.fullname || "Unnamed Contact") + " — " + String(row.emailaddress1 || row.contactid) }))]);
      const enabled = config.creationEnabled === true && config.securityReviewed === true;
      fields.disabled = !enabled; button.disabled = !enabled;
      message(enabled ? "" : "Read-only mode. Verify admin permissions to enable profile creation.");
      form.addEventListener("submit", async event => {
        event.preventDefault(); if (button.disabled || !form.reportValidity()) return;
        const value = formValue(); fields.disabled = true; button.disabled = true;
        button.textContent = "Saving…";
        message("Checking and saving the Contact profile…");
        try {
          const result = await createProfile(value);
          message("Profile created. Contact ID: " + result.id + ". Set the password using Portal Management → Change Password, then assign website web roles and test sign-in.");
          form.reset();
        } catch (error) {
          message(error.message + (pending ? " Keep this page open. " + (pending.uncertain ? "Do not repeat the create until its result is checked." : "Contact ID: " + pending.id + ". Retry unchanged to verify, not recreate.") : ""));
        } finally {
          const verifyingOnly = Boolean(pending && pending.id && !pending.uncertain);
          button.textContent = verifyingOnly ? "Verify saved Contact" : "Create Contact profile";
          fields.disabled = false; button.disabled = Boolean(pending && pending.uncertain);
        }
      });
    } catch (error) { fields.disabled = true; button.disabled = true; message(error.message); }
  }
  root.PettyCashAdmin = { version, loadOptions, createProfile, inspectProfileRelationships,
    validateInput, buildPayload, async checkSetup() {
      const data = await loadOptions();
      return { version, contactsReadable: true, departmentsReadable: true, contactCount: data.contacts.length,
        departmentCount: data.departments.length, creationEnabled: config.creationEnabled === true && config.securityReviewed === true,
        profileOnly: true, writePermissionsVerified: false,
        passwordSetupRequired: true, loginProvisioned: false };
    }, get pendingOperation() { return pending ? { id: pending.id, uncertain: pending.uncertain } : null; } };
  if (root.document.readyState === "loading") root.document.addEventListener("DOMContentLoaded", initialize);
  else initialize();
})(window);
