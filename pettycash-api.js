/**
 * Petty Cash - Dataverse Web API Integration
 */

// =========================================================================
  // 1. CONFIGURATION & CHOICE VALUES MAPPING
  // Customize choice integer values to match your Dataverse columns.
  // =========================================================================
  const DATAVERSE_CONFIG = {
    testContactId: "", // Optional: Paste a Contact GUID here if testing in studio preview
    choices: {
      paymentMethod: {
        "Cash": 123140000,
        "Card / Online": 123140001,
        "Borrow": 123140002
      },
      paymentSource: {
        "Company Cash": 123140000,
        "Own Pocket": 123140001
      },
      category: {
        "Travel": 123140000,
        "Kitchen/Food": 123140001,
        "IT Equipments": 123140002,
        "Finance Things": 123140003,
        "Technical Equipments": 123140004,
        "Others": 123140005
      },
      approvalStatus: {
        "Pending": 123140000, // Verify every choice value against your environment.
        "Approved": 123140001,
        "Rejected": 123140002
      },
      erpSyncStatus: {
        "Not Synced": 123140000,
        "Synced": 123140001,
        "Failed": 123140002
      }
    },
    tableLogicalNames: {
      requests: "hr_pettycashrequest",
      lineItems: "hr_pettycashlineitem",
      contacts: "contact",
      departments: "hr_departments" // Table logical name; distinct from the entity set.
    },
    entitySets: {
      requests: "hr_pettycashrequests",
      lineItems: "hr_pettycashlineitems",
      contacts: "contacts",
      departments: "hr_departmentses" // Confirmed via Power Apps Copy set name.
    },
    // Column logical names and lookup navigation properties are different.
    // Confirm these against the live table; never strip a field to make a POST work.
    columns: {
      requests: {
        id: "hr_pettycashrequestid",
        title: "hr_requesttitle",
        total: "hr_totalamount",
        purpose: "hr_purpose",
        date: "hr_transactiondate",
        paymentSource: "hr_paymentsource",
        paymentMethod: "hr_paymentmethod",
        approvalStatus: "hr_approvalstatus",
        erpSyncStatus: "hr_erpsyncstatus",
        submittedBy: "hr_submittedby",
        department: "hr_department",
        assignedManager: "hr_assignedmanager",
        receipt: "hr_receiptimage"
      },
      lineItems: {
        id: "hr_pettycashlineitemid",
        name: "hr_itemname",
        quantity: "hr_quantity",
        unitPrice: "hr_unitprice",
        category: "hr_category",
        otherCategory: "hr_othercategory", // Text belongs to each line item, not the request header.
        parentRequest: "hr_parentrequest"
      },
      contacts: {
        id: "contactid",
        department: "hr_department",
        manager: "hr_reportstomanager"
      },
      departments: { name: "hr_departmentname" } // Confirmed text/name column; not the GUID key.
    },
    navigationProperties: {
      submittedBy: "hr_SubmittedBy",
      department: "hr_Department",
      assignedManager: "hr_AssignedManager",
      parentRequest: "hr_ParentRequest"
    },
    settings: {
      isReceiptMandatory: false, // Set to true if receipt is strictly required
      autoSetTodayDate: true,
      maxReceiptBytes: 10 * 1024 * 1024 // Application limit; also respect the Dataverse file-column limit.
    }
  };

  // =========================================================================
  // 2. USER CONTEXT RESOLVER
  // Reads logged-in Contact GUID from hidden HTML inputs rendered by Power Pages
  // =========================================================================
  function getPortalUserContext() {
    let id = "";
    let name = "";
    let email = "";

    const idInput = document.getElementById("portalUserId");
    const nameInput = document.getElementById("portalUserName");
    const emailInput = document.getElementById("portalUserEmail");

    if (idInput && idInput.value) {
      id = idInput.value.replace(/[{}]/g, "").trim();
    }
    if (nameInput && nameInput.value) {
      name = nameInput.value.trim();
    }
    if (emailInput && emailInput.value) {
      email = emailInput.value.trim();
    }

    const guidMatch = id.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
    id = guidMatch ? guidMatch[0] : "";

    if (!id && DATAVERSE_CONFIG.testContactId) {
      id = DATAVERSE_CONFIG.testContactId.replace(/[{}]/g, "").trim();
    }

    return { id, name, email };
  }

  let userContext = {
    contactId: "",
    departmentId: null,
    managerId: null
  };

  // =========================================================================
  // 3. UI INTERACTION HELPERS
  // =========================================================================

  function toggleOtherCategory() {
    const category = document.getElementById("selCategory").value;
    const otherGroup = document.getElementById("otherCategoryGroup");
    if (category === "Others") {
      otherGroup.style.display = "block";
    } else {
      otherGroup.style.display = "none";
    }
  }

  function calculateTotals() {
    let grandTotal = 0;
    const rows = document.querySelectorAll("#tableBody tr");

    rows.forEach(row => {
      const qtyInput = row.querySelector(".qty-input");
      const priceInput = row.querySelector(".price-input");
      const totalSpan = row.querySelector(".row-total");

      const qty = parseFloat(qtyInput ? qtyInput.value : 0) || 0;
      const price = parseFloat(priceInput ? priceInput.value : 0) || 0;
      const total = qty * price;

      if (totalSpan) totalSpan.innerText = total.toFixed(2);
      grandTotal += total;
    });

    const lblGrandTotal = document.getElementById("lblGrandTotal");
    if (lblGrandTotal) lblGrandTotal.innerText = grandTotal.toFixed(2);
  }

  function addNewItemRow() {
    const tbody = document.getElementById("tableBody");
    const newRow = document.createElement("tr");

    newRow.innerHTML = `
      <td valign="top" style="padding: 10px; vertical-align: top;"><input type="text" class="form-control name-input" placeholder="Enter product name" style="width: 100%; padding: 10px; border: 1px solid #cbd5e0; border-radius: 6px; box-sizing: border-box;"></td>
      <td valign="top" style="padding: 10px; vertical-align: top;"><input type="number" class="form-control qty-input" value="1" min="1" oninput="calculateTotals()" style="width: 100%; padding: 10px; border: 1px solid #cbd5e0; border-radius: 6px; box-sizing: border-box;"></td>
      <td valign="top" style="padding: 10px; vertical-align: top;"><input type="number" class="form-control price-input" placeholder="0" min="0" step="any" oninput="calculateTotals()" style="width: 100%; padding: 10px; border: 1px solid #cbd5e0; border-radius: 6px; box-sizing: border-box;"></td>
      <td valign="top" style="padding: 18px 10px 10px; vertical-align: top; font-weight: bold;">
        <span class="row-total">0.00</span>
        <button type="button" class="btn-outline" style="color: #e53e3e; border: 1px solid #feb2b2; background: #fff5f5; border-radius: 4px; padding: 2px 8px; margin-left: 10px; cursor: pointer;" onclick="deleteRow(this)">✕</button>
      </td>
    `;
    tbody.appendChild(newRow);
  }

  function deleteRow(button) {
    const row = button.closest("tr");
    if (row) {
      row.remove();
      calculateTotals();
    }
  }

  function setLoadingState(isLoading, message) {
    const btnSubmit = document.getElementById("btnSubmit");
    const spinnerOverlay = document.getElementById("pcLoadingOverlay");
    const loadingText = document.getElementById("pcLoadingText");

    if (btnSubmit) {
      btnSubmit.disabled = isLoading;
      btnSubmit.style.opacity = isLoading ? "0.6" : "1";
      btnSubmit.style.cursor = isLoading ? "not-allowed" : "pointer";
    }

    if (spinnerOverlay) {
      spinnerOverlay.style.display = isLoading ? "flex" : "none";
    }
    if (loadingText && message) {
      loadingText.innerText = message;
    }
  }

  function showMessage(msg, type) {
    const alertBox = document.getElementById("pcAlertBox");
    if (!alertBox) return;
    const styles = {
      success: ["#def7ec", "#03543f", "#84e1bc", "Success!"],
      warning: ["#fdf6b2", "#723b13", "#faca15", "Notice:"],
      error: ["#fde8e8", "#9b1c1c", "#f8b4b4", "Error:"]
    };
    const [background, color, border, label] = styles[type] || styles.error;
    alertBox.style.backgroundColor = background;
    alertBox.style.color = color;
    alertBox.style.border = "1px solid " + border;
    const heading = document.createElement("strong");
    heading.textContent = label + " ";
    alertBox.replaceChildren(heading, document.createTextNode(String(msg)));
    alertBox.style.display = "block";
    alertBox.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetForm() {
    document.getElementById("txtJustification").value = "";
    document.getElementById("fileReceipt").value = "";
    const preview = document.getElementById("filePreview");
    if (preview) preview.innerHTML = "";

    const selCategory = document.getElementById("selCategory");
    if (selCategory) {
      selCategory.selectedIndex = 0;
      toggleOtherCategory();
    }
    const txtOtherCategory = document.getElementById("txtOtherCategory");
    if (txtOtherCategory) txtOtherCategory.value = "";

    const tbody = document.getElementById("tableBody");
    tbody.innerHTML = `
      <tr>
        <td valign="top" style="padding: 10px; vertical-align: top;"><input type="text" placeholder="Enter product name" class="form-control name-input" style="width: 100%; padding: 10px; border: 1px solid rgb(203, 213, 224); border-radius: 6px; box-sizing: border-box;" /></td>
        <td valign="top" style="padding: 10px; vertical-align: top;"><input type="number" value="1" min="1" oninput="calculateTotals()" class="form-control qty-input" style="width: 100%; padding: 10px; border: 1px solid rgb(203, 213, 224); border-radius: 6px; box-sizing: border-box;" /></td>
        <td valign="top" style="padding: 10px; vertical-align: top;"><input type="number" placeholder="0" min="0" step="any" oninput="calculateTotals()" class="form-control price-input" style="width: 100%; padding: 10px; border: 1px solid rgb(203, 213, 224); border-radius: 6px; box-sizing: border-box;" /></td>
        <td valign="top" style="padding: 18px 10px 10px; vertical-align: top; font-weight: bold;"><span class="row-total">0.00</span></td>
      </tr>
    `;
    calculateTotals();
  }

  // =========================================================================
  // 4. POWER PAGES WEB API & SECURITY HELPERS
  // =========================================================================

  async function getVerificationToken() {
    const providers = [];
    if (typeof shell !== "undefined") providers.push(shell);
    try {
      if (window.parent && window.parent !== window && window.parent.shell) {
        providers.push(window.parent.shell);
      }
    } catch (_) { /* A studio iframe may have a different origin. */ }
    for (const provider of providers) {
      if (typeof provider.getTokenDeferred !== "function") continue;
      try {
        const token = await provider.getTokenDeferred();
        if (token) return token;
      } catch (_) { /* Try the other documented token locations. */ }
    }
    const input = document.querySelector('input[name="__RequestVerificationToken"]');
    const token = (input && input.value) || window.ajaxToken;
    if (token) return token;
    throw new Error("Your sign-in session could not be verified. Refresh the page and sign in again.");
  }

  let lastApiFailure = null;
  let lastSetupReport = null;

  function parseApiError(body, status, statusText) {
    const root = body && typeof body === "object" ? (body.error || body) : {};
    const messages = [];
    let dataverseCode = root.cdscode || "";
    let nestedCode = "";
    function collect(node, depth) {
      if (!node || typeof node !== "object" || depth > 5) return;
      for (const message of [node.message, node.Message, node.message && node.message.value]) {
        if (typeof message === "string" && !messages.includes(message)) messages.push(message);
      }
      if (node.cdscode) dataverseCode = node.cdscode;
      if (depth > 0 && node.code) nestedCode = node.code;
      for (const key of ["innererror", "internalexception", "innerexception", "cdserrordetails"]) {
        collect(node[key], depth + 1);
      }
    }
    collect(root, 0);
    const err = new Error(messages.join(" — ") || statusText || "The request could not be completed.");
    err.status = status;
    err.cdscode = dataverseCode || nestedCode || root.code || "";
    err.details = root;
    return err;
  }

  async function callWebAPI(options) {
    const token = await getVerificationToken();
    const headers = {
      Accept: "application/json",
      "OData-Version": "4.0",
      "OData-MaxVersion": "4.0",
      ...options.headers,
      __RequestVerificationToken: token
    };
    if (options.contentType) headers["Content-Type"] = options.contentType;
    let response;
    try {
      response = await fetch(options.url, {
        method: options.method || "GET",
        credentials: "same-origin",
        headers,
        body: options.data
      });
    } catch (cause) {
      const err = new Error("The connection was interrupted. The result of this operation is unknown.");
      err.status = 0;
      err.cause = cause;
      recordApiFailure(err, options);
      throw err;
    }
    const raw = await response.text();
    let body = null;
    if (raw) {
      try { body = JSON.parse(raw); } catch (_) { /* Do not render HTML error pages. */ }
    }
    if (!response.ok) {
      const err = parseApiError(body, response.status, response.statusText);
      recordApiFailure(err, options);
      throw err;
    }
    if (raw && !body && options.method !== "PUT") {
      const err = new Error("The server returned an unexpected response. Refresh your sign-in session.");
      err.status = 0;
      recordApiFailure(err, options);
      throw err;
    }
    return { data: body, xhr: response };
  }

  function recordApiFailure(err, options) {
    lastApiFailure = {
      method: options.method || "GET",
      url: options.url,
      status: err.status,
      code: err.cdscode || "",
      message: err.message,
      details: err.details || null
    };
    console.error("Petty Cash Web API failure", lastApiFailure);
  }

  function extractEntityId(xhr) {
    if (!xhr) return null;
    let entityId = null;
    if (typeof xhr.getResponseHeader === "function") {
      entityId = xhr.getResponseHeader("entityid");
      if (!entityId) {
        const odataId = xhr.getResponseHeader("OData-EntityId");
        if (odataId) {
          const m = odataId.match(/\(([0-9a-fA-F\-]+)\)/);
          if (m && m[1]) entityId = m[1];
        }
      }
    } else if (xhr.headers && typeof xhr.headers.get === "function") {
      entityId = xhr.headers.get("entityid");
      if (!entityId) {
        const odataId = xhr.headers.get("OData-EntityId");
        if (odataId) {
          const m = odataId.match(/\(([0-9a-fA-F\-]+)\)/);
          if (m && m[1]) entityId = m[1];
        }
      }
    }
    return entityId ? entityId.replace(/[{}]/g, "").trim() : null;
  }

  let userContextReady = null;
  let submissionInProgress = false;
  let pendingSubmission = null;

  function normalizeGuid(value) {
    const match = String(value || "").match(/^[{]?([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})[}]?$/i);
    return match ? match[1].toLowerCase() : "";
  }

  function lookupValue(column) {
    return "_" + column + "_value";
  }

  async function loadCurrentUserContext() {
    const contactId = normalizeGuid(getPortalUserContext().id);
    if (!contactId) throw new Error("Please sign in before submitting a petty cash request.");
    const c = DATAVERSE_CONFIG.columns.contacts;
    const res = await callWebAPI({
      method: "GET",
      url: "/_api/" + DATAVERSE_CONFIG.entitySets.contacts + "(" + contactId + ")" +
        "?$select=" + [lookupValue(c.department), lookupValue(c.manager)].join(",")
    });
    const profile = res.data || {};
    const departmentId = normalizeGuid(profile[lookupValue(c.department)]);
    const managerId = normalizeGuid(profile[lookupValue(c.manager)]);
    if (!departmentId) {
      throw new Error("Your employee profile has no department. Ask your administrator to update it before submitting.");
    }
    if (!managerId) {
      throw new Error("Your employee profile has no assigned manager. Ask your administrator to update it before submitting.");
    }
    userContext = { contactId, departmentId, managerId };
    return userContext;
  }

  function ensureCurrentUserContext() {
    if (!userContextReady) {
      userContextReady = loadCurrentUserContext().catch(err => {
        userContextReady = null;
        throw err;
      });
    }
    return userContextReady;
  }

  async function uploadReceiptImage(recordId, file) {
    if (!file) return;
    const arrayBuffer = await file.arrayBuffer();
    const uploadUrl = `/_api/${DATAVERSE_CONFIG.entitySets.requests}(${recordId})/${DATAVERSE_CONFIG.columns.requests.receipt}?x-ms-file-name=${encodeURIComponent(file.name)}`;

    await callWebAPI({
      method: "PUT",
      url: uploadUrl,
      contentType: "application/octet-stream",
      processData: false,
      data: arrayBuffer,
      headers: {
        "x-ms-file-name": file.name
      }
    });
  }

  function generateRequestTitle() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `PCR-${yyyy}${mm}${dd}-${randomSuffix}`;
  }

  function getFormData() {
    const txtDate = document.getElementById("txtDate").value;
    const selPaymentSource = document.getElementById("selPaymentSource").value;
    const selPaymentMethod = document.getElementById("selPaymentMethod").value;
    const selCategory = document.getElementById("selCategory").value;
    const txtOtherCategory = document.getElementById("txtOtherCategory") ? document.getElementById("txtOtherCategory").value.trim() : "";
    const txtJustification = document.getElementById("txtJustification").value.trim();
    const fileInput = document.getElementById("fileReceipt");
    const receiptFile = fileInput && fileInput.files && fileInput.files.length > 0 ? fileInput.files[0] : null;

    const lineItems = [];
    const rows = document.querySelectorAll("#tableBody tr");
    let grandTotal = 0;

    rows.forEach((row, index) => {
      const nameInput = row.querySelector(".name-input");
      const qtyInput = row.querySelector(".qty-input");
      const priceInput = row.querySelector(".price-input");

      const itemName = nameInput ? nameInput.value.trim() : "";
      const qty = qtyInput ? parseFloat(qtyInput.value) : 0;
      const price = priceInput ? parseFloat(priceInput.value) : 0;
      const total = qty * price;

      if (itemName || qty > 0 || price > 0) {
        lineItems.push({
          index: index + 1,
          name: itemName,
          quantity: qty,
          unitPrice: price,
          total: total
        });
        grandTotal += total;
      }
    });

    return {
      date: txtDate,
      paymentSource: selPaymentSource,
      paymentMethod: selPaymentMethod,
      category: selCategory,
      otherCategory: txtOtherCategory,
      justification: txtJustification,
      receiptFile: receiptFile,
      lineItems: lineItems,
      grandTotal: grandTotal
    };
  }

  function validateForm(formData) {
    if (!formData.date) {
      throw new Error("Please select a Transaction Date.");
    }
    if (formData.category === "Others" && !formData.otherCategory) {
      throw new Error("Please specify the details for 'Other Category'.");
    }
    if (formData.lineItems.length === 0) {
      throw new Error("Please add at least one item to the Itemized Details table.");
    }
    for (const item of formData.lineItems) {
      if (!item.name) {
        throw new Error(`Item row #${item.index} requires a Product Name.`);
      }
      if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
        throw new Error(`Item "${item.name}" must have a valid quantity greater than 0.`);
      }
      if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
        throw new Error(`Item "${item.name}" must have a valid price.`);
      }
    }
    if (!Number.isFinite(formData.grandTotal) || formData.grandTotal <= 0) {
      throw new Error("Grand total must be greater than 0.");
    }
    if (DATAVERSE_CONFIG.settings.isReceiptMandatory && !formData.receiptFile) {
      throw new Error("Please attach a receipt file before submitting.");
    }
    if (formData.receiptFile) {
      if (formData.receiptFile.size > DATAVERSE_CONFIG.settings.maxReceiptBytes) {
        throw new Error("The receipt is too large. Choose a file smaller than " +
          (DATAVERSE_CONFIG.settings.maxReceiptBytes / 1024 / 1024) + " MB.");
      }
      if (!/^(image\/(jpeg|png|gif|webp|bmp)|application\/pdf)$/i.test(formData.receiptFile.type)) {
        throw new Error("Please choose a receipt in PDF or a supported image format.");
      }
    }
    if (!formData.justification) {
      throw new Error("Please enter a Business Justification for this expense.");
    }
  }

  function mappedChoice(group, value) {
    const result = DATAVERSE_CONFIG.choices[group][value];
    if (!Number.isInteger(result)) {
      throw new Error("The " + group + " option '" + value + "' is not configured. Ask your administrator to correct its mapping.");
    }
    return result;
  }

  function buildHeaderPayload(formData, title, context) {
    const c = DATAVERSE_CONFIG.columns.requests;
    const n = DATAVERSE_CONFIG.navigationProperties;
    const sets = DATAVERSE_CONFIG.entitySets;
    const payload = {
      [c.title]: title,
      [c.total]: Number(formData.grandTotal.toFixed(2)),
      [c.purpose]: formData.justification,
      [c.date]: new Date(formData.date + "T00:00:00Z").toISOString(),
      [c.paymentSource]: mappedChoice("paymentSource", formData.paymentSource),
      [c.paymentMethod]: mappedChoice("paymentMethod", formData.paymentMethod),
      [c.approvalStatus]: mappedChoice("approvalStatus", "Pending"),
      [c.erpSyncStatus]: mappedChoice("erpSyncStatus", "Not Synced"),
      [n.submittedBy + "@odata.bind"]: "/" + sets.contacts + "(" + context.contactId + ")",
      [n.department + "@odata.bind"]: "/" + sets.departments + "(" + context.departmentId + ")",
      [n.assignedManager + "@odata.bind"]: "/" + sets.contacts + "(" + context.managerId + ")"
    };
    return payload;
  }

  function buildLineItemPayload(item, requestId, category, otherCategory) {
    const c = DATAVERSE_CONFIG.columns.lineItems;
    const payload = {
      [c.name]: item.name,
      [c.quantity]: item.quantity,
      [c.unitPrice]: item.unitPrice,
      [c.category]: category,
      [DATAVERSE_CONFIG.navigationProperties.parentRequest + "@odata.bind"]:
        "/" + DATAVERSE_CONFIG.entitySets.requests + "(" + requestId + ")"
    };
    if (otherCategory !== undefined) payload[c.otherCategory] = otherCategory;
    return payload;
    // hr_totalprice is calculated by Dataverse; do not write a calculated column.
  }

  function lineItemReadColumns(includeOtherCategory) {
    const c = DATAVERSE_CONFIG.columns.lineItems;
    return [c.name, c.quantity, c.unitPrice, c.category, lookupValue(c.parentRequest)]
      .concat(includeOtherCategory ? [c.otherCategory] : []);
  }

  function headerReadColumns(payload) {
    const c = DATAVERSE_CONFIG.columns.requests;
    return [...new Set([
      ...Object.keys(payload).filter(key => !key.endsWith("@odata.bind")),
      lookupValue(c.submittedBy), lookupValue(c.department), lookupValue(c.assignedManager)
    ])];
  }

  async function probeColumns(entitySet, primaryKey, columns) {
    // Read no rows. Ask the server to validate the column selection.
    const prefix = "/_api/" + entitySet + "?$filter=" + primaryKey +
      " eq 00000000-0000-0000-0000-000000000000&$top=1&$select=";
    try {
      await callWebAPI({ method: "GET", url: prefix + columns.join(",") });
    } catch (original) {
      if ([401, 403, 404].includes(original.status)) throw original;
      const failures = [];
      for (const column of columns) {
        try { await callWebAPI({ method: "GET", url: prefix + column }); }
        catch (err) {
          failures.push({ column, status: err.status, code: err.cdscode || "",
            message: err.message, details: err.details });
        }
      }
      if (failures.length) {
        const err = new Error("Check the columns and Web API field settings for " + entitySet +
          ": " + failures.map(f => f.column).join(", ") + ". No request was created.");
        err.columnFailures = failures;
        console.error("Petty Cash column checks", failures);
        throw err;
      }
      throw original;
    }
  }

  async function preflight(payload, context, includeOtherCategory) {
    const c = DATAVERSE_CONFIG.columns;
    const sets = DATAVERSE_CONFIG.entitySets;
    await probeColumns(sets.requests, c.requests.id, headerReadColumns(payload));
    await probeColumns(sets.lineItems, c.lineItems.id, lineItemReadColumns(includeOtherCategory));
    // Distinguish an unreadable/incorrect Department target from a header relationship error.
    await callWebAPI({
      method: "GET",
      url: "/_api/" + sets.departments + "(" + context.departmentId + ")?$select=" + c.departments.name
    });
    await callWebAPI({
      method: "GET",
      url: "/_api/" + sets.contacts + "(" + context.managerId + ")?$select=" + c.contacts.id
    });
  }

  function sameValue(column, actual, expected) {
    const c = DATAVERSE_CONFIG.columns.requests;
    if (column === c.date) {
      return typeof actual === "string" && actual.slice(0, 10) === expected.slice(0, 10);
    }
    if (typeof expected === "number") {
      return actual !== null && actual !== undefined &&
        Number.isFinite(Number(actual)) && Math.abs(Number(actual) - expected) < 0.000001;
    }
    return actual === expected;
  }

  async function verifyHeader(state) {
    const res = await callWebAPI({
      method: "GET",
      url: "/_api/" + DATAVERSE_CONFIG.entitySets.requests + "(" + state.id + ")" +
        "?$select=" + headerReadColumns(state.payload).join(",")
    });
    const actual = res.data || {};
    const mismatches = Object.entries(state.payload)
      .filter(([key]) => !key.endsWith("@odata.bind"))
      .filter(([key, value]) => !sameValue(key, actual[key], value))
      .map(([key]) => key);
    const c = DATAVERSE_CONFIG.columns.requests;
    for (const [column, expected] of [
      [c.submittedBy, state.context.contactId],
      [c.department, state.context.departmentId],
      [c.assignedManager, state.context.managerId]
    ]) {
      if (normalizeGuid(actual[lookupValue(column)]) !== expected) mismatches.push(column);
    }
    if (mismatches.length) {
      throw new Error("Saved request " + state.title + " did not retain these fields: " +
        mismatches.join(", ") + ". Ask your administrator to inspect this request.");
    }
  }

  async function verifyLineItem(id, item, requestId, category, otherCategory) {
    const c = DATAVERSE_CONFIG.columns.lineItems;
    const res = await callWebAPI({
      method: "GET",
      url: "/_api/" + DATAVERSE_CONFIG.entitySets.lineItems + "(" + id + ")" +
        "?$select=" + lineItemReadColumns(otherCategory !== undefined).join(",")
    });
    const actual = res.data || {};
    const expected = { [c.name]: item.name, [c.quantity]: item.quantity,
      [c.unitPrice]: item.unitPrice, [c.category]: category };
    if (otherCategory !== undefined) expected[c.otherCategory] = otherCategory;
    const mismatches = Object.entries(expected).filter(([key, value]) =>
      !sameValue(key, actual[key], value)).map(([key]) => key);
    if (normalizeGuid(actual[lookupValue(c.parentRequest)]) !== requestId) mismatches.push(c.parentRequest);
    if (mismatches.length) throw new Error("Product row " + item.index + " did not retain these fields: " + mismatches.join(", ") + ".");
  }

  function formFingerprint(data) {
    return JSON.stringify({
      date: data.date, source: data.paymentSource, method: data.paymentMethod,
      category: data.category, other: data.otherCategory, purpose: data.justification,
      items: data.lineItems,
      receipt: data.receiptFile ? [data.receiptFile.name, data.receiptFile.size, data.receiptFile.lastModified] : null
    });
  }

  function definiteRejection(err) {
    return [400, 401, 403, 404, 405, 413, 422, 429].includes(err.status);
  }

  async function createRecord(entitySet, payload) {
    // One POST only. Never retry by dropping fields or changing relationship names.
    return await callWebAPI({
      method: "POST",
      url: "/_api/" + entitySet,
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(payload)
    });
  }

  async function submitPettyCashRequest() {
    if (submissionInProgress) return;
    submissionInProgress = true;
    let stage = "validating the form";
    try {
      const formData = getFormData();
      validateForm(formData);
      const fingerprint = formFingerprint(formData);
      if (pendingSubmission && pendingSubmission.uncertain) {
        throw new Error("The previous save needs to be checked by an administrator before another submission. Reference: " + pendingSubmission.title + ".");
      }
      if (pendingSubmission && pendingSubmission.fingerprint !== fingerprint) {
        throw new Error("Request " + pendingSubmission.title + " is already partly saved. Restore its original form values and click Submit to finish it.");
      }
      setLoadingState(true, "Checking your employee profile...");
      stage = "loading your employee profile";
      const context = await ensureCurrentUserContext();
      mappedChoice("category", formData.category);
      if (!pendingSubmission) {
        const title = generateRequestTitle();
        const payload = buildHeaderPayload(formData, title, context);
        stage = "checking table configuration";
        setLoadingState(true, "Checking request configuration...");
        await preflight(payload, context, formData.category === "Others");
        const state = {
          title, payload, context: { ...context }, fingerprint,
          id: null, lines: [], receiptUploaded: false, uncertain: false
        };
        pendingSubmission = state;
        stage = "creating the request";
        setLoadingState(true, "Saving your request...");
        try {
          const res = await createRecord(DATAVERSE_CONFIG.entitySets.requests, payload);
          state.id = normalizeGuid(extractEntityId(res.xhr)) ||
            normalizeGuid(res.data && res.data[DATAVERSE_CONFIG.columns.requests.id]);
          if (!state.id) {
            state.uncertain = true;
            throw new Error("The request was saved but its reference ID was not returned.");
          }
        } catch (err) {
          if (!state.id && definiteRejection(err)) pendingSubmission = null;
          else state.uncertain = true;
          throw err;
        }
      }

      const state = pendingSubmission;
      stage = "checking saved request details";
      await verifyHeader(state);
      const category = mappedChoice("category", formData.category);
      // The form's category applies to all items, so copy its details to every item.
      const otherCategory = formData.category === "Others" ? formData.otherCategory : undefined;
      // Sequential saves allow retries to skip confirmed records. An ambiguous POST is never repeated.
      for (let i = 0; i < formData.lineItems.length; i++) {
        const item = formData.lineItems[i];
        stage = "saving product row " + item.index;
        setLoadingState(true, "Saving product " + (i + 1) + " of " + formData.lineItems.length + "...");
        if (!state.lines[i]) {
          try {
            const res = await createRecord(DATAVERSE_CONFIG.entitySets.lineItems,
              buildLineItemPayload(item, state.id, category, otherCategory));
            const id = normalizeGuid(extractEntityId(res.xhr)) ||
              normalizeGuid(res.data && res.data[DATAVERSE_CONFIG.columns.lineItems.id]);
            if (!id) {
              state.uncertain = true;
              throw new Error("Product row " + item.index + " was saved but its reference ID was not returned.");
            }
            state.lines[i] = id;
          } catch (err) {
            if (!definiteRejection(err)) state.uncertain = true;
            throw err;
          }
        }
        stage = "checking product row " + item.index;
        await verifyLineItem(state.lines[i], item, state.id, category, otherCategory);
      }

      if (formData.receiptFile && !state.receiptUploaded) {
        stage = "uploading the receipt";
        setLoadingState(true, "Uploading your receipt...");
        await uploadReceiptImage(state.id, formData.receiptFile);
        state.receiptUploaded = true;
      }
      showMessage("Request " + state.title + " and all its products" +
        (formData.receiptFile ? ", including the receipt," : "") + " have been saved for manager review.", "success");
      pendingSubmission = null;
      resetForm();
    } catch (err) {
      console.error("Petty Cash submission stopped", { stage, error: err,
        requestId: pendingSubmission && pendingSubmission.id });
      let message = "Could not finish " + stage + ": " + err.message;
      if (pendingSubmission) {
        message += " Reference: " + pendingSubmission.title + ".";
        message += pendingSubmission.uncertain
          ? " The save result is uncertain; ask an administrator to check it before submitting again."
          : " Keep this page open and the form unchanged. Submit again to resume this request.";
      } else if (stage === "creating the request") {
        message += " All submitted fields were kept; no reduced request was sent.";
      }
      showMessage(message, "error");
    } finally {
      submissionInProgress = false;
      setLoadingState(false);
    }
  }

  async function inspectRequest(recordId) {
    const id = normalizeGuid(recordId);
    if (!id) throw new Error("Provide the request GUID from Dataverse.");
    const context = await ensureCurrentUserContext();
    const res = await callWebAPI({
      method: "GET",
      url: "/_api/" + DATAVERSE_CONFIG.entitySets.requests + "(" + id + ")" +
        "?$select=" + [DATAVERSE_CONFIG.columns.requests.title,
          lookupValue(DATAVERSE_CONFIG.columns.requests.submittedBy),
          lookupValue(DATAVERSE_CONFIG.columns.requests.department),
          lookupValue(DATAVERSE_CONFIG.columns.requests.assignedManager)].join(","),
      headers: { Prefer: 'odata.include-annotations="*"' }
    });
    const data = res.data || {};
    if (normalizeGuid(data[lookupValue(DATAVERSE_CONFIG.columns.requests.submittedBy)]) !== context.contactId) {
      throw new Error("Inspect a request submitted by the current signed-in employee.");
    }
    const relationships = Object.entries(data).filter(([key]) =>
      key.includes("@Microsoft.Dynamics.CRM.associatednavigationproperty"));
    return { id, title: data[DATAVERSE_CONFIG.columns.requests.title],
      lookupRelationships: Object.fromEntries(relationships), record: data };
  }

  function requiredSiteSettings() {
    const c = DATAVERSE_CONFIG.columns;
    const n = DATAVERSE_CONFIG.navigationProperties;
    const fields = {
      requests: Object.values(c.requests).filter(column =>
        ![c.requests.submittedBy, c.requests.department, c.requests.assignedManager].includes(column))
        .concat([n.submittedBy, n.department, n.assignedManager,
          lookupValue(c.requests.submittedBy), lookupValue(c.requests.department), lookupValue(c.requests.assignedManager)]),
      lineItems: Object.values(c.lineItems).filter(column => column !== c.lineItems.parentRequest)
        .concat([n.parentRequest, lookupValue(c.lineItems.parentRequest)]),
      contacts: [c.contacts.id, lookupValue(c.contacts.department), lookupValue(c.contacts.manager)],
      departments: [c.departments.name]
    };
    return Object.entries(fields).flatMap(([key, columns]) => [
      { name: "Webapi/" + DATAVERSE_CONFIG.tableLogicalNames[key] + "/enabled", value: "true" },
      { name: "Webapi/" + DATAVERSE_CONFIG.tableLogicalNames[key] + "/fields",
        value: [...new Set(columns)].sort().join(",") }
    ]);
  }

  window.pettyCashDiagnostics = {
    get siteSettings() { return requiredSiteSettings(); },
    get lastFailure() { return lastApiFailure; },
    get lastSetupReport() { return lastSetupReport; },
    get pendingRequest() {
      if (!pendingSubmission) return null;
      return { id: pendingSubmission.id, title: pendingSubmission.title,
        savedProductIds: [...pendingSubmission.lines], uncertain: pendingSubmission.uncertain };
    },
    inspectRequest,
    async checkSetup() {
      const context = await ensureCurrentUserContext();
      const c = DATAVERSE_CONFIG.columns;
      const report = { profile: { ...context }, checks: [] };
      const checks = [
        ["request columns", () => probeColumns(DATAVERSE_CONFIG.entitySets.requests, c.requests.id,
          Object.values(c.requests).filter(column => ![c.requests.receipt, c.requests.submittedBy,
            c.requests.department, c.requests.assignedManager].includes(column)).concat(
              [lookupValue(c.requests.submittedBy), lookupValue(c.requests.department), lookupValue(c.requests.assignedManager)]))],
        ["product columns", () => probeColumns(DATAVERSE_CONFIG.entitySets.lineItems, c.lineItems.id,
          lineItemReadColumns(true))],
        ["department target", () => callWebAPI({ method: "GET",
          url: "/_api/" + DATAVERSE_CONFIG.entitySets.departments + "(" + context.departmentId + ")?$select=" + c.departments.name })]
      ];
      for (const [name, check] of checks) {
        try { await check(); report.checks.push({ name, ok: true }); }
        catch (err) { report.checks.push({ name, ok: false, message: err.message,
          columns: err.columnFailures || [], api: lastApiFailure }); }
      }
      lastSetupReport = report;
      console.log("Petty Cash setup diagnostics (read-only)\n" + JSON.stringify(report, null, 2));
      return report;
    }
  };

  // =========================================================================
  // 5. EXPOSE GLOBALLY & INITIALIZE
  // =========================================================================
  window.calculateTotals = calculateTotals;
  window.toggleOtherCategory = toggleOtherCategory;
  window.deleteRow = deleteRow;
  window.addNewItemRow = addNewItemRow;
  window.submitPettyCashRequest = submitPettyCashRequest;

  function initializePettyCashApp() {
    const txtDate = document.getElementById("txtDate");
    if (txtDate && !txtDate.value && DATAVERSE_CONFIG.settings.autoSetTodayDate) {
      const now = new Date();
      const today = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
      txtDate.value = today;
    }

    const btnSubmit = document.getElementById("btnSubmit");
    if (btnSubmit) {
      btnSubmit.onclick = function (e) {
        e.preventDefault();
        submitPettyCashRequest();
      };
    }

    const btnAddItem = document.getElementById("btnAddItem");
    if (btnAddItem) {
      btnAddItem.onclick = function (e) {
        e.preventDefault();
        addNewItemRow();
      };
    }

    const fileReceipt = document.getElementById("fileReceipt");
    if (fileReceipt) {
      fileReceipt.onchange = function () {
        const filePreview = document.getElementById("filePreview");
        if (filePreview && this.files.length > 0) {
          const file = this.files[0];
          const sizeKb = (file.size / 1024).toFixed(1);
          filePreview.textContent = `${file.name} (${sizeKb} KB)`;
        }
      };
    }

    ensureCurrentUserContext().catch(err => console.warn("Petty Cash profile is not ready:", err.message));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializePettyCashApp);
  } else {
    initializePettyCashApp();
  }
