/**
 * Petty Cash Application - Dataverse Web API Integration
 * Power Pages / Power Apps Portals Client Script
 * 
 * Tables:
 * - hr_pettycashrequest (Header)
 * - hr_pettycashlineitem (Product Line Items)
 * - contact (Authenticated Users)
 * - hr_department (Departments)
 */

// =========================================================================
// 1. CONFIGURATION & CHOICE VALUES MAPPING
// Update these integer values with your exact Dataverse Choice options.
// =========================================================================
const DATAVERSE_CONFIG = {
  // Choice field integer mappings
  choices: {
    paymentMethod: {
      "Cash": 100000000,
      "Card / Online": 100000001,
      "Borrow": 100000002
    },
    paymentSource: {
      "Company Cash": 100000000,
      "Own Pocket": 100000001
    },
    category: {
      "Travel": 100000000,
      "Kitchen/Food": 100000001,
      "IT Equipments": 100000002,
      "Finance Things": 100000003,
      "Technical Equipments": 100000004,
      "Others": 100000005
    },
    approvalStatus: {
      "Pending": 100000000,
      "Approved": 100000001,
      "Rejected": 100000002
    },
    erpSyncStatus: {
      "Not Synced": 100000000,
      "Synced": 100000001,
      "Failed": 100000002
    }
  },

  // Pluralized Entity Set names used in Dataverse Web API endpoints
  entitySets: {
    requests: "hr_pettycashrequests",
    lineItems: "hr_pettycashlineitems",
    contacts: "contacts",
    departments: "hr_departments"
  },

  // Lookup Single-Valued Navigation Property names for @odata.bind
  navigationProperties: {
    submittedBy: "hr_submittedby",
    department: "hr_department",
    assignedManager: "hr_assignedmanager",
    parentRequest: "hr_parentrequest"
  },

  // Options
  testContactId: "", // Optional: Paste a Contact GUID here if testing in studio preview
  settings: {
    isReceiptMandatory: false, // Set to true if a receipt is required to submit
    autoSetTodayDate: true     // Automatically fills today's date if empty
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

  // Check if it's a valid GUID pattern
  const guidMatch = id.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
  id = guidMatch ? guidMatch[0] : "";

  // Fallback to testContactId from config if provided
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
// 3. POWER PAGES WEB API & SECURITY HELPERS
// =========================================================================

/**
 * Retrieves the Power Pages anti-forgery verification token.
 */
async function getVerificationToken() {
  // 1. Try standard Power Pages shell function
  if (typeof shell !== "undefined" && typeof shell.getTokenDeferred === "function") {
    try {
      const token = await shell.getTokenDeferred();
      if (token) return token;
    } catch (e) {
      console.warn("shell.getTokenDeferred warning:", e);
    }
  }

  // 2. Try parent window shell function (if inside iframe or component)
  if (typeof window.parent !== "undefined" && typeof window.parent.shell !== "undefined" && typeof window.parent.shell.getTokenDeferred === "function") {
    try {
      const token = await window.parent.shell.getTokenDeferred();
      if (token) return token;
    } catch (e) {
      console.warn("parent.shell.getTokenDeferred warning:", e);
    }
  }

  // 3. Try hidden input rendered on Power Pages
  const tokenInput = document.querySelector('input[name="__RequestVerificationToken"]');
  if (tokenInput && tokenInput.value) {
    return tokenInput.value;
  }

  // 4. Try global ajaxToken
  if (window.ajaxToken) {
    return window.ajaxToken;
  }

  return "";
}

/**
 * Standard AJAX wrapper for Power Pages Dataverse Web API.
 */
async function callWebAPI(options) {
  const token = await getVerificationToken();

  return new Promise((resolve, reject) => {
    const headers = options.headers || {};
    if (token) {
      headers["__RequestVerificationToken"] = token;
    }
    if (!headers["Accept"]) {
      headers["Accept"] = "application/json";
    }

    const ajaxSettings = {
      type: options.method || "GET",
      url: options.url,
      headers: headers,
      success: function (data, textStatus, xhr) {
        resolve({ data, textStatus, xhr });
      },
      error: function (xhr, textStatus, errorThrown) {
        let errorMessage = "An unexpected error occurred.";
        if (xhr.responseJSON && xhr.responseJSON.error && xhr.responseJSON.error.message) {
          errorMessage = xhr.responseJSON.error.message;
        } else if (xhr.responseText) {
          try {
            const parsed = JSON.parse(xhr.responseText);
            if (parsed.error && parsed.error.message) {
              errorMessage = parsed.error.message;
            } else {
              errorMessage = xhr.responseText;
            }
          } catch {
            errorMessage = xhr.responseText;
          }
        } else if (errorThrown) {
          errorMessage = errorThrown;
        }
        reject(new Error(errorMessage));
      }
    };

    if (options.data !== undefined) {
      ajaxSettings.data = options.data;
    }
    if (options.contentType !== undefined) {
      ajaxSettings.contentType = options.contentType;
    }
    if (options.processData !== undefined) {
      ajaxSettings.processData = options.processData;
    }

    // Execute via jQuery $.ajax (included by default in Power Pages)
    if (typeof $ !== "undefined" && $.ajax) {
      $.ajax(ajaxSettings);
    } else {
      // Vanilla fetch fallback
      const fetchHeaders = new Headers(headers);
      if (options.contentType) {
        fetchHeaders.set("Content-Type", options.contentType);
      }
      fetch(options.url, {
        method: options.method || "GET",
        headers: fetchHeaders,
        body: options.data
      })
        .then(async response => {
          if (!response.ok) {
            let errText = await response.text();
            try {
              const parsed = JSON.parse(errText);
              if (parsed.error && parsed.error.message) errText = parsed.error.message;
            } catch {}
            throw new Error(errText || response.statusText);
          }
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            return response.json().then(data => ({ data, xhr: response }));
          }
          return { data: null, xhr: response };
        })
        .then(resolve)
        .catch(reject);
    }
  });
}

/**
 * Extracts the record GUID from the response headers (OData-EntityId or entityid).
 */
function extractEntityId(xhr) {
  if (!xhr) return null;

  // Power Pages Web API provides 'entityid' in response headers
  let entityId = null;
  if (typeof xhr.getResponseHeader === "function") {
    entityId = xhr.getResponseHeader("entityid");
    if (!entityId) {
      const odataId = xhr.getResponseHeader("OData-EntityId");
      if (odataId) {
        const match = odataId.match(/\(([0-9a-fA-F\-]+)\)/);
        if (match && match[1]) entityId = match[1];
      }
    }
  } else if (xhr.headers && typeof xhr.headers.get === "function") {
    entityId = xhr.headers.get("entityid");
    if (!entityId) {
      const odataId = xhr.headers.get("OData-EntityId");
      if (odataId) {
        const match = odataId.match(/\(([0-9a-fA-F\-]+)\)/);
        if (match && match[1]) entityId = match[1];
      }
    }
  }

  return entityId ? entityId.replace(/[{}]/g, "").trim() : null;
}

// =========================================================================
// 4. USER CONTEXT & DEPARTMENT/MANAGER RESOLVER
// =========================================================================

/**
 * Loads the current contact's department and reporting manager lookups.
 */
async function loadCurrentUserContext() {
  if (!userContext.contactId) {
    console.info("Running in preview/unauthenticated mode or outside Power Pages. Current contact ID is not set.");
    return;
  }

  try {
    const contactUrl = `/_api/${DATAVERSE_CONFIG.entitySets.contacts}(${userContext.contactId})?$select=_hr_department_value,_hr_reportstomanager_value`;
    const res = await callWebAPI({ method: "GET", url: contactUrl });
    if (res && res.data) {
      userContext.departmentId = res.data._hr_department_value || null;
      userContext.managerId = res.data._hr_reportstomanager_value || null;
      console.log("Loaded Contact Profile:", {
        contact: userContext.contactId,
        department: userContext.departmentId,
        manager: userContext.managerId
      });
    }
  } catch (err) {
    console.warn("Could not query contact relationship fields (permissions or empty values):", err.message);
  }
}

// =========================================================================
// 5. RECEIPT UPLOAD (RAW BINARY PUT)
// =========================================================================

/**
 * Uploads a file to the Dataverse File/Image column 'hr_receiptimage'.
 */
async function uploadReceiptImage(recordId, file) {
  if (!file) return;

  const arrayBuffer = await file.arrayBuffer();
  const uploadUrl = `/_api/${DATAVERSE_CONFIG.entitySets.requests}(${recordId})/hr_receiptimage?x-ms-file-name=${encodeURIComponent(file.name)}`;

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

// =========================================================================
// 6. FORM SUBMISSION LOGIC
// =========================================================================

/**
 * Generates a unique, professional Request Title (e.g. PCR-20260910-4821).
 */
function generateRequestTitle() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `PCR-${yyyy}${mm}${dd}-${randomSuffix}`;
}

/**
 * Gathers and validates all data from the frontend inputs.
 */
function getFormData() {
  const txtDate = document.getElementById("txtDate").value;
  const selPaymentSource = document.getElementById("selPaymentSource").value;
  const selPaymentMethod = document.getElementById("selPaymentMethod").value;
  const selCategory = document.getElementById("selCategory").value;
  const txtOtherCategory = document.getElementById("txtOtherCategory") ? document.getElementById("txtOtherCategory").value.trim() : "";
  const txtJustification = document.getElementById("txtJustification").value.trim();
  const fileInput = document.getElementById("fileReceipt");
  const receiptFile = fileInput && fileInput.files && fileInput.files.length > 0 ? fileInput.files[0] : null;

  // Line items
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

/**
 * Validates form before sending requests.
 */
function validateForm(formData) {
  if (!formData.date) {
    throw new Error("Please select a valid Transaction Date.");
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
    if (isNaN(item.quantity) || item.quantity <= 0) {
      throw new Error(`Item "${item.name}" must have a valid quantity greater than 0.`);
    }
    if (isNaN(item.unitPrice) || item.unitPrice < 0) {
      throw new Error(`Item "${item.name}" must have a valid price.`);
    }
  }

  if (formData.grandTotal <= 0) {
    throw new Error("Grand total must be greater than 0.");
  }

  if (DATAVERSE_CONFIG.settings.isReceiptMandatory && !formData.receiptFile) {
    throw new Error("Please attach a receipt file before submitting.");
  }

  if (!formData.justification) {
    throw new Error("Please enter a Business Justification for this expense.");
  }
}

/**
 * Main submit function triggered on button click.
 */
async function submitPettyCashRequest() {
  const btnSubmit = document.getElementById("btnSubmit");
  const originalBtnText = btnSubmit.innerHTML;

  try {
    const formData = getFormData();
    validateForm(formData);

    // Update UI status to busy
    setLoadingState(true, "Creating petty cash request...");

    // 1. Map Choice integer values
    const paymentMethodChoice = DATAVERSE_CONFIG.choices.paymentMethod[formData.paymentMethod];
    const paymentSourceChoice = DATAVERSE_CONFIG.choices.paymentSource[formData.paymentSource];
    const categoryChoice = DATAVERSE_CONFIG.choices.category[formData.category];
    const approvalStatusChoice = DATAVERSE_CONFIG.choices.approvalStatus["Pending"];
    const erpSyncStatusChoice = DATAVERSE_CONFIG.choices.erpSyncStatus["Not Synced"];

    const requestTitle = generateRequestTitle();

    // 2. Build header record payload
    const headerPayload = {
      "hr_requesttitle": requestTitle,
      "hr_totalamount": parseFloat(formData.grandTotal.toFixed(2)),
      "hr_purpose": formData.justification
    };

    // Format ISO string for Date and Time field (hr_transactiondate)
    if (formData.date) {
      headerPayload["hr_transactiondate"] = new Date(formData.date + "T00:00:00Z").toISOString();
    }

    // Set Choice values if defined
    if (paymentMethodChoice !== undefined) {
      headerPayload["hr_paymentmethod"] = paymentMethodChoice;
    }
    if (paymentSourceChoice !== undefined) {
      headerPayload["hr_paymentsource"] = paymentSourceChoice;
    }
    if (approvalStatusChoice !== undefined) {
      headerPayload["hr_approvalstatus"] = approvalStatusChoice;
    }
    if (erpSyncStatusChoice !== undefined) {
      headerPayload["hr_erpsyncstatus"] = erpSyncStatusChoice;
    }

    // Other Category single-line text
    if (formData.category === "Others" && formData.otherCategory) {
      headerPayload["hr_othercategory"] = formData.otherCategory;
    }

    // Lookups navigation binding (@odata.bind)
    if (userContext.contactId) {
      headerPayload[`${DATAVERSE_CONFIG.navigationProperties.submittedBy}@odata.bind`] = 
        `/${DATAVERSE_CONFIG.entitySets.contacts}(${userContext.contactId})`;
    }
    if (userContext.departmentId) {
      headerPayload[`${DATAVERSE_CONFIG.navigationProperties.department}@odata.bind`] = 
        `/${DATAVERSE_CONFIG.entitySets.departments}(${userContext.departmentId})`;
    }
    if (userContext.managerId) {
      headerPayload[`${DATAVERSE_CONFIG.navigationProperties.assignedManager}@odata.bind`] = 
        `/${DATAVERSE_CONFIG.entitySets.contacts}(${userContext.managerId})`;
    }

    console.log("Submitting Header Payload:", headerPayload);

    // 3. POST header record to Dataverse
    const headerRes = await callWebAPI({
      method: "POST",
      url: `/_api/${DATAVERSE_CONFIG.entitySets.requests}`,
      contentType: "application/json; charset=utf-8",
      data: JSON.stringify(headerPayload)
    });

    const newRequestId = extractEntityId(headerRes.xhr);
    if (!newRequestId) {
      throw new Error("Request record was created, but unable to retrieve its reference ID from the server response.");
    }
    console.log("Created Petty Cash Request GUID:", newRequestId);

    // 4. Upload Receipt Image if provided
    if (formData.receiptFile) {
      setLoadingState(true, "Uploading receipt attachment...");
      try {
        await uploadReceiptImage(newRequestId, formData.receiptFile);
        console.log("Receipt image uploaded successfully.");
      } catch (uploadErr) {
        console.error("Receipt upload failed:", uploadErr);
        showMessage("Request created, but the receipt failed to upload: " + uploadErr.message, "warning");
      }
    }

    // 5. Create Child Line Items
    setLoadingState(true, "Saving line items...");
    const lineItemPromises = formData.lineItems.map(item => {
      const lineItemPayload = {
        "hr_itemname": item.name,
        "hr_quantity": item.quantity,
        "hr_unitprice": item.unitPrice,
        [`${DATAVERSE_CONFIG.navigationProperties.parentRequest}@odata.bind`]: 
          `/${DATAVERSE_CONFIG.entitySets.requests}(${newRequestId})`
      };

      if (categoryChoice !== undefined) {
        lineItemPayload["hr_category"] = categoryChoice;
      }

      return callWebAPI({
        method: "POST",
        url: `/_api/${DATAVERSE_CONFIG.entitySets.lineItems}`,
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(lineItemPayload)
      });
    });

    await Promise.all(lineItemPromises);
    console.log("All line items successfully created.");

    // 6. Done! Display success banner & reset form
    setLoadingState(false);
    showMessage(`Success! Petty Cash Request "${requestTitle}" has been submitted for approval.`, "success");
    resetForm();

  } catch (err) {
    console.error("Submission Error:", err);
    setLoadingState(false);
    showMessage(err.message, "error");
  } finally {
    btnSubmit.innerHTML = originalBtnText;
  }
}

// =========================================================================
// 7. UI HELPERS (ALERTS, SPINNER, FORM RESET)
// =========================================================================

function setLoadingState(isLoading, message) {
  const btnSubmit = document.getElementById("btnSubmit");
  const spinnerOverlay = document.getElementById("pcLoadingOverlay");
  const loadingText = document.getElementById("pcLoadingText");

  if (btnSubmit) {
    btnSubmit.disabled = isLoading;
    if (isLoading) {
      btnSubmit.style.opacity = "0.7";
      btnSubmit.style.cursor = "not-allowed";
    } else {
      btnSubmit.style.opacity = "1";
      btnSubmit.style.cursor = "pointer";
    }
  }

  if (spinnerOverlay) {
    spinnerOverlay.style.display = isLoading ? "flex" : "none";
  }
  if (loadingText && message) {
    loadingText.innerText = message;
  }
}

function showMessage(msg, type) {
  let alertBox = document.getElementById("pcAlertBox");
  if (!alertBox) {
    alertBox = document.createElement("div");
    alertBox.id = "pcAlertBox";
    alertBox.style.padding = "15px 20px";
    alertBox.style.marginBottom = "20px";
    alertBox.style.borderRadius = "8px";
    alertBox.style.fontSize = "0.95rem";
    alertBox.style.fontWeight = "500";
    alertBox.style.transition = "all 0.3s ease";

    const container = document.querySelector(".petty-cash-container");
    if (container) {
      container.insertBefore(alertBox, container.firstChild);
    }
  }

  if (type === "success") {
    alertBox.style.backgroundColor = "#def7ec";
    alertBox.style.color = "#03543f";
    alertBox.style.border = "1px solid #84e1bc";
    alertBox.innerHTML = `<strong>Success!</strong> ${msg}`;
  } else if (type === "warning") {
    alertBox.style.backgroundColor = "#fdf6b2";
    alertBox.style.color = "#723b13";
    alertBox.style.border = "1px solid #faca15";
    alertBox.innerHTML = `<strong>Notice:</strong> ${msg}`;
  } else {
    alertBox.style.backgroundColor = "#fde8e8";
    alertBox.style.color = "#9b1c1c";
    alertBox.style.border = "1px solid #f8b4b4";
    alertBox.innerHTML = `<strong>Error:</strong> ${msg}`;
  }

  alertBox.style.display = "block";
  alertBox.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetForm() {
  document.getElementById("txtJustification").value = "";
  document.getElementById("fileReceipt").value = "";
  const filePreview = document.getElementById("filePreview");
  if (filePreview) filePreview.innerHTML = "";

  // Reset category
  const selCat = document.getElementById("selCategory");
  if (selCat) selCat.selectedIndex = 0;
  if (typeof toggleOtherCategory === "function") toggleOtherCategory();

  // Reset Table to 1 blank row
  const tbody = document.getElementById("tableBody");
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td valign="top" style="padding: 10px; vertical-align: top;"><input type="text" placeholder="Enter product name" class="form-control name-input" style="width: 100%; padding: 10px; border: 1px solid rgb(203, 213, 224); border-radius: 6px; box-sizing: border-box;" /></td>
        <td valign="top" style="padding: 10px; vertical-align: top;"><input type="number" value="1" min="1" oninput="calculateTotals()" class="form-control qty-input" style="width: 100%; padding: 10px; border: 1px solid rgb(203, 213, 224); border-radius: 6px; box-sizing: border-box;" /></td>
        <td valign="top" style="padding: 10px; vertical-align: top;"><input type="number" placeholder="0" oninput="calculateTotals()" class="form-control price-input" style="width: 100%; padding: 10px; border: 1px solid rgb(203, 213, 224); border-radius: 6px; box-sizing: border-box;" /></td>
        <td valign="top" style="padding: 18px 10px 10px; vertical-align: top; font-weight: bold;"><span class="row-total">0.00</span></td>
      </tr>
    `;
  }
  calculateTotals();
}

// =========================================================================
// 8. INITIALIZATION ON PAGE LOAD
// =========================================================================
document.addEventListener("DOMContentLoaded", function () {
  // Set default date to today if empty
  const txtDate = document.getElementById("txtDate");
  if (txtDate && !txtDate.value && DATAVERSE_CONFIG.settings.autoSetTodayDate) {
    const today = new Date().toISOString().split("T")[0];
    txtDate.value = today;
  }

  // Hook submit button
  const btnSubmit = document.getElementById("btnSubmit");
  if (btnSubmit) {
    btnSubmit.addEventListener("click", function (e) {
      e.preventDefault();
      submitPettyCashRequest();
    });
  }

  // File input preview listener
  const fileReceipt = document.getElementById("fileReceipt");
  if (fileReceipt) {
    fileReceipt.addEventListener("change", function () {
      const filePreview = document.getElementById("filePreview");
      if (filePreview && this.files.length > 0) {
        const file = this.files[0];
        const sizeKb = (file.size / 1024).toFixed(1);
        filePreview.innerHTML = `<strong>Selected file:</strong> ${file.name} (${sizeKb} KB)`;
      }
    });
  }

  // Load user context (department & manager)
  loadCurrentUserContext();
});
