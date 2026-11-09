/* Shared, session-authenticated Power Pages helpers for the balance modules.
 * Configure PC_MODULE_CONFIG before this file. Never put secrets or signed HTTP
 * trigger URLs in page source. Cash writes go through a role-protected flow.
 */
(function (root) {
  "use strict";
  // Repeated template includes must not reset an in-flight movement or bind twice.
  if (root.PettyCashModules && root.PettyCashModules.version === "finance-posting-v5") return;
  const config = Object.assign({ financeFlowId: "", financeSecurityReviewed: false,
    clarificationsEnabled: false, clarificationFlowId: "",
    clarificationInputNames: { clarificationId: "clarificationId", answer: "answer" },
    requestStatus: { Pending: 123140000, Approved: 123140001, Rejected: 123140002 }
  }, root.PC_MODULE_CONFIG || {});
  const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const selfPostingMessage = "Another Finance user must record cash movements for your account. You can still view your balance and history.";
  function guid(value) {
    const clean = String(value || "").replace(/[{}]/g, "").trim().toLowerCase();
    if (!guidPattern.test(clean)) throw new Error("A valid employee or record ID is required.");
    return clean;
  }
  function requireFinance() {
    const allowed = root.document.getElementById("pcFinanceAllowed");
    const user = root.document.getElementById("pcModuleUserId");
    if (!allowed || allowed.value !== "true") throw new Error("This page is available only to the Petty Cash Finance web role.");
    return guid(user && user.value);
  }
  async function token() {
    if (root.shell && typeof root.shell.getTokenDeferred === "function") {
      const value = await root.shell.getTokenDeferred();
      if (value) return value;
    }
    throw new Error("Your sign-in session could not be verified. Refresh and sign in again.");
  }
  async function api(url, options = {}) {
    const parsed = new URL(url, root.location.origin);
    if (parsed.origin !== root.location.origin || !parsed.pathname.startsWith("/_api/")) {
      throw new Error("Unexpected API address; the operation was stopped.");
    }
    const response = await root.fetch(parsed.pathname + parsed.search, {
      method: options.method || "GET", credentials: "same-origin",
      headers: { Accept: "application/json", "OData-Version": "4.0",
        "OData-MaxVersion": "4.0", __RequestVerificationToken: await token(),
        ...(options.headers || {}) }, body: options.body
    });
    const text = await response.text();
    let body;
    try { body = text ? JSON.parse(text) : null; }
    catch (_) {
      const error = new Error("The server returned a non-JSON response (HTTP " + response.status + ")." +
        (parsed.pathname.startsWith("/_api/cloudflow/") ? " Check the flow run history before retrying." : " Check the API response."));
      error.status = response.status;
      throw error;
    }
    if (!response.ok) {
      const error = new Error(body && body.error && body.error.message || "The API request failed (HTTP " + response.status + ").");
      error.status = response.status;
      throw error;
    }
    return { body, status: response.status };
  }
  async function collection(url, entitySet) {
    const rows = [], visited = new Set();
    while (url) {
      const parsed = new URL(url, root.location.origin);
      if (parsed.origin !== root.location.origin || parsed.pathname !== "/_api/" + entitySet || visited.has(parsed.href)) {
        throw new Error("Unexpected paging response; no partial result will be displayed.");
      }
      visited.add(parsed.href);
      if (visited.size > 100) throw new Error("Too many results. Ask an administrator to narrow this list.");
      const result = await api(parsed.pathname + parsed.search);
      if (!result.body || !Array.isArray(result.body.value)) throw new Error("The server did not return a record list.");
      rows.push(...result.body.value);
      url = result.body["@odata.nextLink"] || null;
    }
    return rows;
  }
  function balance(record) {
    if (!Object.prototype.hasOwnProperty.call(record, "hr_currentbalance")) {
      throw new Error("Current Balance was not returned. Check the Contact field list and permissions.");
    }
    const value = record.hr_currentbalance === null ? 0 : Number(record.hr_currentbalance);
    if (!Number.isFinite(value)) throw new Error("The saved balance is invalid. Ask accounts to check it.");
    return value;
  }
  function money(value) { return new Intl.NumberFormat("en-PK", { style: "currency", currency: "PKR",
    minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value); }
  function balanceMeaning(value) {
    return value > 0 ? "Company cash held by you" : value < 0 ? "Company owes you " + money(Math.abs(value)) : "No company cash held or reimbursement outstanding";
  }
  async function readBalance(employeeId) {
    return sumTransactions(await cashTransactions(employeeId));
  }
  async function readSavedBalance(employeeId) {
    const id = guid(employeeId);
    const result = await api("/_api/contacts(" + id + ")?$select=contactid,hr_currentbalance");
    if (!result.body || guid(result.body.contactid) !== id) throw new Error("The returned employee does not match.");
    return balance(result.body);
  }
  async function cashTransactions(employeeId) {
    const id = guid(employeeId);
    const rows = await collection("/_api/hr_cashtransactions?$select=" +
      "hr_transactionreference,hr_transactiontype,hr_amount,hr_notespurpose,_hr_employee_value,_hr_linkedrequest_value,createdon" +
      "&$filter=" + encodeURIComponent("_hr_employee_value eq " + id) +
      "&$orderby=createdon asc,hr_transactionreference asc", "hr_cashtransactions");
    if (rows.some(row => guid(row._hr_employee_value) !== id)) throw new Error("Another employee's cash transaction was returned. Check table permissions.");
    return rows;
  }
  function sumTransactions(rows) {
    let cents = 0;
    const expenses = new Set();
    for (const row of rows) {
      const amount = Number(row.hr_amount), rounded = Math.round(amount * 100);
      if (!Number.isFinite(amount) || amount <= 0 || !Number.isSafeInteger(rounded) || Math.abs(amount * 100 - rounded) > 0.000001) {
        throw new Error("A cash transaction has an invalid amount. Ask accounts to check the ledger.");
      }
      const sign = ({ 123140000: 1, 123140001: -1, 123140002: -1 })[row.hr_transactiontype];
      if (!sign) throw new Error("An unknown transaction type was found. Balance cannot be calculated safely.");
      if (row.hr_transactiontype === 123140001) {
        const requestId = guid(row._hr_linkedrequest_value);
        if (expenses.has(requestId)) throw new Error("An expense appears twice in the ledger. Ask accounts to check it.");
        expenses.add(requestId);
      }
      cents += sign * rounded;
      if (!Number.isSafeInteger(cents)) throw new Error("The balance is outside the supported numeric range.");
    }
    return cents / 100;
  }
  async function myRequests(employeeId) {
    const id = guid(employeeId);
    const rows = await collection("/_api/hr_pettycashrequests?$select=" +
      "hr_pettycashrequestid,hr_requesttitle,hr_transactiondate,hr_totalamount,hr_paymentsource,hr_approvalstatus,hr_managercomments,_hr_submittedby_value" +
      "&$filter=" + encodeURIComponent("_hr_submittedby_value eq " + id) +
      "&$orderby=hr_transactiondate desc,hr_pettycashrequestid desc&$top=100", "hr_pettycashrequests");
    if (rows.some(row => guid(row._hr_submittedby_value) !== id)) {
      throw new Error("Another employee's request was returned. Check server-side table permissions.");
    }
    return rows;
  }
  const clarificationStatuses = Object.freeze({
    123140000: "Awaiting your answer", 123140001: "Answer received",
    123140002: "Returned for review", 123140003: "Closed"
  });
  let pendingAnswer = null, answering = false;
  function clarificationReady() {
    const names = config.clarificationInputNames || {};
    return config.clarificationsEnabled === true && guidPattern.test(config.clarificationFlowId) &&
      [names.clarificationId, names.answer].every(name => typeof name === "string" && /^[a-zA-Z_][a-zA-Z0-9_]{0,99}$/.test(name)) &&
      names.clarificationId !== names.answer;
  }
  async function myClarifications(employeeId) {
    if (config.clarificationsEnabled !== true) throw new Error("Clarifications are not enabled.");
    const id = guid(employeeId);
    if (id !== signedInId()) throw new Error("Only your own clarification questions can be loaded.");
    const rows = await collection("/_api/hr_requestclarifications?$select=" +
      "hr_requestclarificationid,hr_clarificationreference,hr_question,hr_answer,hr_answeredon,hr_approvalstage,hr_clarificationstatus,hr_reviewround,createdon,_hr_employee_value,_hr_request_value" +
      "&$filter=" + encodeURIComponent("_hr_employee_value eq " + id) +
      "&$orderby=createdon desc,hr_requestclarificationid desc", "hr_requestclarifications");
    const seen = new Set();
    for (const row of rows) {
      if (guid(row._hr_employee_value) !== id) throw new Error("Another employee's clarification was returned. Check table permissions.");
      const rowId = guid(row.hr_requestclarificationid);
      guid(row._hr_request_value);
      if (seen.has(rowId)) throw new Error("A clarification was returned more than once. Refresh the questions.");
      seen.add(rowId);
      if (!Object.prototype.hasOwnProperty.call(clarificationStatuses, row.hr_clarificationstatus) ||
          ![123140000, 123140001].includes(row.hr_approvalstage) ||
          typeof row.hr_question !== "string" || !row.hr_question.trim() || row.hr_question.length > 4000 ||
          (row.hr_answer != null && (typeof row.hr_answer !== "string" || row.hr_answer.length > 4000))) {
        throw new Error("A clarification has incomplete or unsupported fields. Contact your administrator.");
      }
    }
    return rows;
  }
  async function submitClarificationAnswer(value) {
    if (!clarificationReady()) throw new Error("Replying is temporarily unavailable. Contact your administrator.");
    const caller = signedInId(), clarificationId = guid(value.clarificationId);
    if (new URL(root.location.origin).protocol !== "https:") throw new Error("Submitting an answer requires HTTPS.");
    if (typeof value.answer !== "string" || !value.answer.trim() || value.answer.trim().length > 4000) {
      throw new Error("Enter an answer of 1 to 4,000 characters.");
    }
    if (answering) throw new Error("An answer is already being submitted.");
    const answer = value.answer.trim(), fingerprint = JSON.stringify({ caller, clarificationId, answer });
    if (pendingAnswer && pendingAnswer.fingerprint !== fingerprint) {
      throw new Error("The previous answer is unconfirmed. Keep this page open and retry that same answer first.");
    }
    if (!pendingAnswer) pendingAnswer = { clarificationId, answer, fingerprint };
    answering = true;
    try {
      const names = config.clarificationInputNames;
      // Caller identity comes from the Power Pages trigger, never this payload.
      const result = await api("/_api/cloudflow/v1.0/trigger/" + guid(config.clarificationFlowId), {
        method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest" },
        body: new URLSearchParams({ eventData: JSON.stringify({
          [names.clarificationId]: clarificationId, [names.answer]: answer
        }) }).toString()
      });
      const body = result.body;
      if (result.status !== 200 || !body || Array.isArray(body) ||
          guid(body.clarificationid ?? body.clarificationId) !== clarificationId ||
          !["answered", "rejected", "unconfirmed"].includes(body.status)) {
        throw new Error("The flow did not confirm this answer.");
      }
      if (body.status === "rejected") {
        pendingAnswer = null;
        throw new Error(typeof body.message === "string" && body.message || "This question is no longer accepting an answer. Refresh the questions.");
      }
      if (body.status !== "answered") throw new Error("The answer could not be confirmed.");
      pendingAnswer = null;
      return { status: "answered", clarificationId,
        message: typeof body.message === "string" && body.message || "Answer submitted. Your request will return for review." };
    } catch (error) {
      if (pendingAnswer) error.message += " Keep this page open and retry the same answer. Reference: " + clarificationId + ".";
      throw error;
    } finally { answering = false; }
  }
  async function employees() {
    requireFinance();
    const rows = await collection("/_api/contacts?$select=contactid,fullname,adx_identity_username,statecode&$filter=statecode eq 0&$orderby=fullname asc,contactid asc&$top=100", "contacts");
    for (const row of rows) {
      guid(row.contactid);
      if (row.statecode !== 0 || !Object.prototype.hasOwnProperty.call(row, "adx_identity_username")) {
        throw new Error("An active employee profile/username was not returned. Check Finance Contact read permissions and fields.");
      }
    }
    return rows;
  }
  function cashAmount(value) {
    const raw = String(value == null ? "" : value).trim(), amount = Number(raw);
    if (!/^(?:\d+|\d*\.\d{1,2})$/.test(raw) || !Number.isFinite(amount) || amount <= 0 || !Number.isSafeInteger(Math.round(amount * 100))) {
      throw new Error("Enter a positive amount with no more than two decimal places, without separators or exponent notation.");
    }
    return amount;
  }
  function isMoney(value) { return typeof value === "number" && Number.isFinite(value) &&
    Number.isSafeInteger(Math.round(value * 100)) && Number(value.toFixed(2)) === value; }
  function projectedBalance(balance, movement, amount) {
    if (!isMoney(balance)) throw new Error("Load a valid employee ledger balance first.");
    if (!["cash_given", "cash_returned"].includes(movement)) throw new Error("Choose cash given or cash returned.");
    const signedCents = Math.round(cashAmount(amount) * 100) * (movement === "cash_given" ? 1 : -1);
    const total = Math.round(balance * 100) + signedCents;
    if (!Number.isSafeInteger(total)) throw new Error("The projected balance is outside the supported numeric range.");
    return { change: signedCents / 100, balance: total / 100 };
  }
  function validateMovement(value) {
    const employeeId = guid(value.employeeId);
    if (!["cash_given", "cash_returned"].includes(value.movement)) throw new Error("Choose cash given or cash returned.");
    const amount = cashAmount(value.amount);
    const notes = String(value.notes || "").trim();
    if (!notes || notes.length > 100) throw new Error("Enter a reason of 1 to 100 characters.");
    return { employeeId, movement: value.movement, amount, notes };
  }
  let pendingMovement = null, posting = false;
  function flowReady() { return config.financeSecurityReviewed === true && guidPattern.test(config.financeFlowId); }
  async function postMovement(value) {
    if (!flowReady()) throw new Error("Cash posting is disabled until the secured Finance flow is configured and reviewed.");
    const actorId = requireFinance();
    if (new URL(root.location.origin).protocol !== "https:") throw new Error("Finance posting requires HTTPS.");
    if (posting) throw new Error("A cash movement is already being submitted.");
    const input = validateMovement(value), fingerprint = JSON.stringify(input);
    if (input.employeeId === actorId) throw new Error(selfPostingMessage);
    if (pendingMovement && pendingMovement.fingerprint !== fingerprint) {
      throw new Error("The previous cash movement has an unconfirmed result. Keep its details unchanged and check its posting key before starting another.");
    }
    if (!pendingMovement) {
      if (!root.crypto || typeof root.crypto.randomUUID !== "function") throw new Error("Secure operation IDs are unavailable in this browser.");
      pendingMovement = { fingerprint, postingKey: root.crypto.randomUUID() };
    }
    const postingKey = pendingMovement.postingKey;
    posting = true;
    try {
      // Power Pages' documented trigger transport uses form-encoded eventData.
      const result = await api("/_api/cloudflow/v1.0/trigger/" + guid(config.financeFlowId), {
        method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest" },
        body: new URLSearchParams({ eventData: JSON.stringify({ ...input, postingKey }) }).toString()
      });
      const body = result.body;
      // Power Pages may lowercase the response output names on the wire.
      const field = name => body && (body[name] ?? body[name.toLowerCase()]);
      if (result.status !== 200 || !body || field("status") !== "posted" || field("postingKey") !== postingKey ||
          guid(field("employeeId")) !== input.employeeId || !guidPattern.test(field("transactionId"))) {
        throw new Error("The flow did not confirm a completed posting. Check posting key " + postingKey + ".");
      }
      pendingMovement = null;
      // Balance is read separately. Ignore legacy/placeholder response balances.
      return { status: "posted", postingKey, employeeId: input.employeeId, transactionId: guid(field("transactionId")) };
    } catch (error) {
      // Keep the same key after EVERY failure. A retry must be idempotent on the server.
      error.message += " Keep this page open. Posting key: " + postingKey + ".";
      throw error;
    } finally { posting = false; }
  }
  function node(tag, text, className) {
    const element = root.document.createElement(tag);
    if (text !== undefined) element.textContent = String(text);
    if (className) element.className = className;
    return element;
  }
  function signedInId() { return guid(root.document.getElementById("pcModuleUserId").value); }
  function statusLabel(value) {
    return Object.keys(config.requestStatus).find(label => config.requestStatus[label] === value) || "Unknown status (" + value + ")";
  }
  function mountClarifications() {
    const document = root.document, get = id => document.getElementById(id);
    const section = get("pcClarifications");
    if (config.clarificationsEnabled !== true || !section || section.dataset.pcMounted) return;
    section.dataset.pcMounted = "true"; section.hidden = false; section.style.display = "block";
    const message = get("pcClarificationMessage"), list = get("pcClarificationList"), history = get("pcClarificationHistory");
    const historyList = get("pcClarificationHistoryList"), refresh = get("pcClarificationRefresh");
    const drafts = new Map(), confirmed = new Map();
    let rows = [], loaded = false, loading = false, saving = false, linkId = "", linkFocused = false;
    let linkMessage = "";
    const link = new URL(root.location.href || root.location.origin).searchParams.get("clarificationId");
    if (link) {
      try { linkId = guid(link); } catch (_) { linkMessage = "This clarification link is invalid. Your questions are listed below."; }
    }
    function controls() {
      refresh.disabled = loading || saving || Boolean(pendingAnswer);
      for (const form of list.querySelectorAll("form")) {
        const area = form.querySelector("textarea"), button = form.querySelector("button");
        const isPending = pendingAnswer && pendingAnswer.clarificationId === form.dataset.clarificationId;
        area.disabled = loading || saving || Boolean(pendingAnswer);
        button.disabled = !loaded || loading || saving || !clarificationReady() ||
          (pendingAnswer ? !isPending : !area.value.trim() || area.value.trim().length > 4000);
        button.textContent = saving && isPending ? "Sending…" : isPending ? "Retry same answer" : "Send answer";
      }
      section.setAttribute("aria-busy", String(loading || saving));
    }
    function render() {
      list.replaceChildren(); historyList.replaceChildren();
      let open = 0;
      for (const record of rows) {
        const id = guid(record.hr_requestclarificationid);
        const reply = pendingAnswer && pendingAnswer.clarificationId === id;
        const status = record.hr_clarificationstatus === 123140000 && confirmed.has(id) ? 123140001 : record.hr_clarificationstatus;
        const editable = status === 123140000 || reply;
        const card = node("article", undefined, "pc-clarification"); card.id = "pcClarification-" + id;
        const head = node("div", undefined, "pc-card-head");
        head.appendChild(node("h3", record.hr_clarificationreference || "Clarification"));
        head.appendChild(node("span", clarificationStatuses[status], "pc-status" + (status === 123140000 ? " pc-status-pending" : "")));
        card.appendChild(head);
        const request = dashboardRows.find(row => String(row.hr_pettycashrequestid).toLowerCase() === guid(record._hr_request_value));
        card.appendChild(node("p", (record.hr_approvalstage === 123140000 ? "Manager" : "Boss") + " · " +
          (request && request.hr_requesttitle || "Request " + guid(record._hr_request_value).slice(0, 8)), "pc-muted"));
        card.appendChild(node("p", record.hr_question, "pc-clarification-text"));
        if (editable) {
          open++;
          const form = node("form"); form.dataset.clarificationId = id; form.style.display = "block";
          const label = node("label", "Your answer"), area = node("textarea");
          area.id = "pcClarificationAnswer-" + id; label.htmlFor = area.id;
          area.required = true; area.maxLength = 4000; area.rows = 3;
          area.value = reply ? pendingAnswer.answer : drafts.get(id) || "";
          const hint = node("p", "", "pc-hint"), button = node("button", "Send answer"); button.type = "submit";
          hint.id = area.id + "-hint"; area.setAttribute("aria-describedby", hint.id);
          const count = () => { hint.textContent = area.value.length + " / 4,000 characters"; };
          area.oninput = () => { drafts.set(id, area.value); count(); controls(); }; count();
          form.append(label, area, hint, button);
          form.onsubmit = async event => {
            event.preventDefault(); if (button.disabled) return;
            const input = { clarificationId: id, answer: area.value };
            drafts.set(id, area.value); saving = true; controls(); message.textContent = "Sending your answer…";
            try {
              const operation = submitClarificationAnswer(input); controls();
              const result = await operation;
              confirmed.set(id, input.answer.trim()); drafts.delete(id);
              message.textContent = result.message; render();
            } catch (error) { message.textContent = error.message; }
            finally { saving = false; controls(); }
          };
          card.appendChild(form); list.appendChild(card);
        } else {
          const answer = confirmed.get(id) || record.hr_answer;
          if (answer) {
            card.appendChild(node("p", "Your answer", "pc-clarification-answer-label"));
            card.appendChild(node("p", answer, "pc-clarification-text"));
          }
          historyList.appendChild(card);
        }
      }
      if (!open) list.appendChild(node("p", "No questions need your answer.", "pc-muted"));
      history.hidden = !historyList.children.length;
      if (linkId && !linkFocused) {
        const linked = rows.find(row => guid(row.hr_requestclarificationid) === linkId);
        if (linked) {
          if (linked.hr_clarificationstatus !== 123140000) history.open = true;
          const card = get("pcClarification-" + linkId);
          card.classList.add("pc-clarification-linked"); card.tabIndex = -1;
          card.scrollIntoView({ block: "nearest" }); card.focus({ preventScroll: true }); linkFocused = true;
        } else linkMessage = "This question is not available for this account. Check your sign-in or refresh the questions.";
      }
      controls();
    }
    async function load() {
      if (loading || saving || pendingAnswer) return;
      loading = true; controls(); message.textContent = "Loading questions…";
      try {
        const next = await myClarifications(signedInId());
        rows = next; loaded = true; render();
        message.textContent = linkMessage || (clarificationReady() ? "" : "Replying is temporarily unavailable. Contact your administrator.");
      } catch (error) { loaded = false; message.textContent = error.message; }
      finally { loading = false; controls(); }
    }
    refresh.onclick = load;
    load();
  }
  let dashboardRows = [];
  function renderDashboardRequests() {
    const get = id => root.document.getElementById(id), table = get("pcRequestsBody");
    const query = String(get("pcRequestSearch")?.value || "").trim().toLocaleLowerCase();
    const status = get("pcRequestStatus")?.value || "";
    const rows = dashboardRows.filter(row => (!status || statusLabel(row.hr_approvalstatus) === status) &&
      [row.hr_requesttitle, row.hr_transactiondate, row.hr_managercomments, money(Number(row.hr_totalamount)),
        statusLabel(row.hr_approvalstatus), row["hr_paymentsource@OData.Community.Display.V1.FormattedValue"] ||
          ({ 123140000: "Company Cash", 123140001: "Own Pocket" }[row.hr_paymentsource] || "Unknown")]
        .join(" ").toLocaleLowerCase().includes(query));
    table.replaceChildren();
    for (const row of rows) {
      const tr = node("tr");
      const source = row["hr_paymentsource@OData.Community.Display.V1.FormattedValue"] ||
        ({ 123140000: "Company Cash", 123140001: "Own Pocket" }[row.hr_paymentsource] || "Unknown");
      const label = statusLabel(row.hr_approvalstatus);
      const values = [row.hr_requesttitle, String(row.hr_transactiondate || "").slice(0, 10),
        money(Number(row.hr_totalamount)), source, label, row.hr_managercomments || "—"];
      values.forEach((text, index) => {
        const cell = node("td", index === 4 ? undefined : text, index === 2 ? "pc-numeric" :
          index === 5 && !row.hr_managercomments ? "pc-no-comment" : "");
        if (index === 4) {
          const known = ["Pending", "Approved", "Rejected"].includes(label);
          cell.appendChild(node("span", label, "pc-status" + (known ? " pc-status-" + label.toLowerCase() : "")));
        }
        tr.appendChild(cell);
      });
      table.appendChild(tr);
    }
    if (!rows.length) {
      const row = node("tr"), cell = node("td", dashboardRows.length ? "No requests match your search." : "No requests yet. Create your first request to get started.", "pc-empty");
      cell.colSpan = 6; row.appendChild(cell); table.appendChild(row);
    }
    for (const [id, count] of [["pcRequestCount", dashboardRows.length],
      ["pcPendingCount", dashboardRows.filter(row => row.hr_approvalstatus === config.requestStatus.Pending).length],
      ["pcApprovedCount", dashboardRows.filter(row => row.hr_approvalstatus === config.requestStatus.Approved).length]]) {
      if (get(id)) get(id).textContent = String(count);
    }
    if (get("pcRequestResults")) get("pcRequestResults").textContent = rows.length + " of " + dashboardRows.length + " requests";
  }
  async function showDashboard() {
    const message = root.document.getElementById("pcModuleMessage");
    const button = root.document.getElementById("pcRefresh");
    const table = root.document.getElementById("pcRequestsBody");
    let requestsLoaded = false;
    button.disabled = true;
    for (const id of ["pcRequestSearch", "pcRequestStatus"]) {
      const control = root.document.getElementById(id); if (control) control.disabled = true;
    }
    message.textContent = "Loading your balance and requests…";
    table.replaceChildren();
    try {
      const id = signedInId();
      const results = await Promise.allSettled([readBalance(id), myRequests(id)]);
      if (results[0].status === "fulfilled") {
        root.document.getElementById("pcBalance").textContent = money(results[0].value);
        root.document.getElementById("pcBalanceMeaning").textContent = balanceMeaning(results[0].value);
      } else {
        root.document.getElementById("pcBalance").textContent = "Unavailable";
        root.document.getElementById("pcBalanceMeaning").textContent = results[0].reason.message;
      }
      if (results[1].status === "rejected") throw results[1].reason;
      dashboardRows = results[1].value;
      requestsLoaded = true;
      renderDashboardRequests();
      message.textContent = "";
    } catch (error) {
      dashboardRows = []; table.replaceChildren(); message.textContent = error.message;
      for (const id of ["pcRequestCount", "pcPendingCount", "pcApprovedCount"]) {
        const count = root.document.getElementById(id); if (count) count.textContent = "—";
      }
      const summary = root.document.getElementById("pcRequestResults"); if (summary) summary.textContent = "";
    }
    finally {
      button.disabled = false;
      for (const id of ["pcRequestSearch", "pcRequestStatus"]) {
        const control = root.document.getElementById(id); if (control) control.disabled = !requestsLoaded;
      }
    }
  }
  async function showFinance() {
    const document = root.document, get = id => document.getElementById(id);
    const message = get("pcModuleMessage"), form = get("pcFinanceForm"), select = get("pcEmployee");
    const submit = get("pcPostCash"), fields = get("pcFinanceFields"), refresh = get("pcRefreshEmployee");
    const amount = get("pcCashAmount"), movement = get("pcMovement"), notes = get("pcCashReason"), confirm = get("pcConfirmCash");
    let people = [], currentBalance = null, loadedId = "", loading = false, saving = false, generation = 0;
    let actorId = "", selfNotice = get("pcFinanceSelfPostingNotice");
    let lastSavedMovement = null;
    function savedMessage(suffix) {
      message.textContent = "Cash movement recorded. Transaction ID: " + lastSavedMovement.transactionId + ". " + suffix;
    }
    function value() { return { employeeId: select.value, movement: movement.value, amount: amount.value, notes: notes.value }; }
    function meaning(balance) {
      return balance > 0 ? "This employee holds company cash." : balance < 0 ? "The company owes this employee " + money(Math.abs(balance)) + "." : "No company cash held or reimbursement outstanding for this employee.";
    }
    function historyMessage(text) {
      const row = node("tr"), cell = node("td", text, "pc-empty"); cell.colSpan = 5; row.appendChild(cell);
      get("pcFinanceHistoryBody").replaceChildren(row);
    }
    function update() {
      const pending = Boolean(pendingMovement), ready = flowReady();
      const selfSelected = Boolean(actorId) && select.value === actorId;
      const known = loadedId === select.value && currentBalance !== null && people.some(person => guid(person.contactid) === select.value);
      fields.disabled = !ready || !known || loading || saving || pending || selfSelected;
      if (selfNotice) selfNotice.hidden = !selfSelected;
      select.disabled = saving || pending;
      refresh.disabled = !select.value || loading || saving;
      let valid = false;
      try { validateMovement(value()); valid = true; } catch (_) { /* Incomplete draft, not a posting error. */ }
      submit.disabled = !ready || saving || loading || !known || selfSelected || (!pending && (!valid || !confirm.checked));
      submit.textContent = saving ? "Recording…" : pending ? "Retry same cash movement" : "Record cash movement";
      get("pcFinancePostingReference").hidden = !pending;
      get("pcFinancePostingKey").textContent = pending ? pendingMovement.postingKey : "";
      get("pcMovementImpact").textContent = "—"; get("pcProjectedBalance").textContent = "—";
      if (known && !pending && !selfSelected) {
        try {
          const projected = projectedBalance(currentBalance, movement.value, amount.value);
          get("pcMovementImpact").textContent = (projected.change > 0 ? "+" : "−") + money(Math.abs(projected.change));
          get("pcProjectedBalance").textContent = money(projected.balance);
        } catch (_) { /* No estimate until a valid positive amount is entered. */ }
      }
    }
    async function loadLedger() {
      const requestedId = select.value, requestGeneration = ++generation;
      currentBalance = null; loadedId = ""; loading = Boolean(requestedId);
      if (!pendingMovement) confirm.checked = false;
      get("pcEmployeeBalance").textContent = requestedId ? "Loading…" : "—";
      get("pcFinanceBalanceMeaning").textContent = "Choose an employee to view their cash ledger.";
      historyMessage(requestedId ? "Loading ledger…" : "Choose an employee."); update();
      if (!requestedId) return;
      if (!pendingMovement && lastSavedMovement && lastSavedMovement.employeeId === requestedId) savedMessage("Refreshing balance and history…");
      try {
        const rows = await cashTransactions(requestedId), balance = sumTransactions(rows);
        if (requestGeneration !== generation || select.value !== requestedId) return;
        currentBalance = balance; loadedId = requestedId;
        get("pcEmployeeBalance").textContent = money(balance); get("pcFinanceBalanceMeaning").textContent = meaning(balance);
        const body = get("pcFinanceHistoryBody"); body.replaceChildren();
        for (const record of rows.slice(-10).reverse()) {
          const row = node("tr"), type = record.hr_transactiontype;
          const sign = type === 123140000 ? "+" : "−";
          [String(record.createdon || "").slice(0, 10), record.hr_transactionreference || "—",
            ({ 123140000: "Cash given", 123140001: "Approved expense", 123140002: "Cash returned" })[type],
            sign + money(Number(record.hr_amount)), record.hr_notespurpose || "—"].forEach((text, index) =>
              row.appendChild(node("td", text, index === 3 ? "pc-numeric" : "")));
          body.appendChild(row);
        }
        if (!rows.length) historyMessage("No cash transactions: balance starts at zero.");
        if (!pendingMovement && lastSavedMovement && lastSavedMovement.employeeId === requestedId) savedMessage("Balance and history refreshed.");
      } catch (error) {
        if (requestGeneration !== generation || select.value !== requestedId) return;
        get("pcEmployeeBalance").textContent = "Unavailable"; get("pcFinanceBalanceMeaning").textContent = error.message;
        historyMessage("The ledger could not be loaded. No partial balance is displayed.");
        if (!pendingMovement && lastSavedMovement && lastSavedMovement.employeeId === requestedId) {
          savedMessage("Balance unavailable. Use Refresh employee balance; this movement is already saved.");
        }
      } finally { if (requestGeneration === generation) { loading = false; update(); } }
    }
    try {
      actorId = requireFinance();
      if (!form) throw new Error("Publish the updated Finance Cash Management page HTML.");
      // Existing published Finance HTML can use the new rule without resetting its configuration.
      if (!selfNotice) {
        selfNotice = node("p", selfPostingMessage, "pc-finance-note");
        selfNotice.id = "pcFinanceSelfPostingNotice";
        selfNotice.setAttribute("role", "status");
        selfNotice.hidden = true;
        form.insertBefore(selfNotice, fields);
      }
      // Studio may retain inline display:none independently of the hidden attribute.
      // Reveal only these two containers, after the Finance role check above.
      for (const container of [form, get("pcFinanceHistory")]) {
        container.hidden = false;
        container.style.display = "block";
      }
      people = await employees();
      for (const record of people) {
        const id = guid(record.contactid);
        const option = node("option", (record.fullname || "Unnamed employee") + " · " + (record.adx_identity_username || "No username") + " · " + id.slice(0, 8));
        option.value = id; select.appendChild(option);
      }
      select.onchange = loadLedger; refresh.onclick = loadLedger;
      for (const input of [amount, notes]) input.oninput = () => { confirm.checked = false; update(); };
      movement.onchange = () => { confirm.checked = false; update(); };
      confirm.onchange = update;
      historyMessage("Choose an employee."); update();
      message.textContent = flowReady() ? "" :
        "Read-only mode. Connect and verify the Finance flow to enable posting.";
      form.onsubmit = async event => {
        event.preventDefault(); if (submit.disabled) return;
        saving = true; update();
        message.textContent = "Submitting cash movement. Keep this page open…";
        try {
          const operation = postMovement(value()); update();
          const result = await operation;
          lastSavedMovement = result;
          amount.value = ""; notes.value = ""; confirm.checked = false;
          await loadLedger();
        } catch (error) { message.textContent = error.message; }
        finally { saving = false; update(); }
      };
    } catch (error) {
      message.textContent = error.message;
      if (submit) submit.disabled = true;
      if (fields) fields.disabled = true;
      if (select) select.disabled = true;
    }
  }
  root.PettyCashModules = Object.freeze({ readBalance, readSavedBalance, cashTransactions, sumTransactions, myRequests, employees, balanceMeaning, money,
    version: "finance-posting-v5", clarificationVersion: "clarification-replies-v1",
    myClarifications, clarificationReady, submitClarificationAnswer, mountClarifications,
    get pendingClarificationId() { return pendingAnswer && pendingAnswer.clarificationId; },
    validateMovement, projectedBalance, postMovement, flowReady,
    get pendingPostingKey() { return pendingMovement && pendingMovement.postingKey; } });
  function initialize() {
    const page = root.document.querySelector("[data-pc-page]");
    if (!page) return;
    if (page.dataset.pcPage === "requests") {
      root.document.getElementById("pcRefresh").onclick = showDashboard;
      const search = root.document.getElementById("pcRequestSearch"), status = root.document.getElementById("pcRequestStatus");
      if (search) search.oninput = renderDashboardRequests;
      if (status) status.onchange = renderDashboardRequests;
      showDashboard();
      mountClarifications();
    } else if (page.dataset.pcPage === "finance") showFinance();
    else if (page.dataset.pcPage === "accounts") {
      const button = root.document.getElementById("pcPostCash"); if (button) button.disabled = true;
      root.document.getElementById("pcModuleMessage").textContent = "This Accounts draft is retired. Publish Finance Cash Management and restrict it to Petty Cash Finance.";
    }
  }
  if (root.document.readyState === "loading") root.document.addEventListener("DOMContentLoaded", initialize);
  else initialize();
})(window);
