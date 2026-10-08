/**
 * Petty Cash Application - Dataverse Web API Integration
 * Power Pages / Power Apps Portals Client Script
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
        "Pending": null, // Set to null to let Dataverse automatically apply its default 'Pending' value
        "Approved": 123140001,
        "Rejected": 123140002
      },
      erpSyncStatus: {
        "Not Synced": null, // Set to null to let Dataverse automatically apply its default 'Not Synced' value
        "Synced": 123140001,
        "Failed": 123140002
      }
    },
    entitySets: {
      requests: "hr_pettycashrequests",
      lineItems: "hr_pettycashlineitems",
      contacts: "contacts",
      departments: "hr_departments"
    },
    navigationProperties: {
      submittedBy: "hr_SubmittedBy",
      department: "hr_Department",
      assignedManager: "hr_AssignedManager",
      parentRequest: "hr_ParentRequest"
    },
    settings: {
      isReceiptMandatory: false, // Set to true if receipt is strictly required
      autoSetTodayDate: true
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
    if (typeof shell !== "undefined" && typeof shell.getTokenDeferred === "function") {
      try {
        const token = await shell.getTokenDeferred();
        if (token) return token;
      } catch (e) {
        console.warn("shell.getTokenDeferred:", e);
      }
    }
    if (typeof window.parent !== "undefined" && typeof window.parent.shell !== "undefined" && typeof window.parent.shell.getTokenDeferred === "function") {
      try {
        const token = await window.parent.shell.getTokenDeferred();
        if (token) return token;
      } catch (e) {
        console.warn("parent.shell.getTokenDeferred:", e);
      }
    }
    const tokenInput = document.querySelector('input[name="__RequestVerificationToken"]');
    if (tokenInput && tokenInput.value) return tokenInput.value;
    if (window.ajaxToken) return window.ajaxToken;
    return "";
  }

  async function callWebAPI(options) {
    const token = await getVerificationToken();

    return new Promise((resolve, reject) => {
      const headers = options.headers || {};
      if (token) headers["__RequestVerificationToken"] = token;
      if (!headers["Accept"]) headers["Accept"] = "application/json";

      const ajaxSettings = {
        type: options.method || "GET",
        url: options.url,
        headers: headers,
        success: function (data, textStatus, xhr) {
          resolve({ data, textStatus, xhr });
        },
        error: function (xhr, textStatus, errorThrown) {
          console.error("Dataverse Web API Error Response:", {
            status: xhr.status,
            statusText: xhr.statusText,
            responseJSON: xhr.responseJSON,
            responseText: xhr.responseText
          });

          let errorMessage = "An unexpected error occurred.";
          let cdsCode = "";
          let errObj = (xhr.responseJSON && xhr.responseJSON.error) ? xhr.responseJSON.error : null;

          if (!errObj && xhr.responseText) {
            try {
              const parsed = JSON.parse(xhr.responseText);
              if (parsed && parsed.error) errObj = parsed.error;
            } catch { }
          }

          if (errObj) {
            errorMessage = errObj.message || errorMessage;
            cdsCode = errObj.cdscode || (errObj.innererror && errObj.innererror.code) || "";
            if (errObj.innererror && errObj.innererror.message) {
              errorMessage += ` - Details: ${errObj.innererror.message}`;
            } else if (errObj.cdserrordetails && errObj.cdserrordetails.Message) {
              errorMessage += ` - Details: ${errObj.cdserrordetails.Message}`;
            }
          } else if (xhr.responseText) {
            errorMessage = xhr.responseText;
          } else if (errorThrown) {
            errorMessage = errorThrown;
          }

          const fullMsg = cdsCode ? `${errorMessage} (${cdsCode})` : errorMessage;
          const errorInstance = new Error(fullMsg);
          errorInstance.cdscode = cdsCode;
          errorInstance.status = xhr.status;
          reject(errorInstance);
        }
      };

      if (options.data !== undefined) ajaxSettings.data = options.data;
      if (options.contentType !== undefined) ajaxSettings.contentType = options.contentType;
      if (options.processData !== undefined) ajaxSettings.processData = options.processData;

      if (typeof $ !== "undefined" && $.ajax) {
        $.ajax(ajaxSettings);
      } else {
        const fetchHeaders = new Headers(headers);
        if (options.contentType) fetchHeaders.set("Content-Type", options.contentType);
        fetch(options.url, {
          method: options.method || "GET",
          headers: fetchHeaders,
          body: options.data
        })
          .then(async response => {
            if (!response.ok) {
              let errText = await response.text();
              let cdsCode = "";
              try {
                const parsed = JSON.parse(errText);
                if (parsed.error) {
                  if (parsed.error.message) errText = parsed.error.message;
                  if (parsed.error.cdscode) cdsCode = parsed.error.cdscode;
                }
              } catch { }
              const errInst = new Error(cdsCode ? `${errText} (${cdsCode})` : (errText || response.statusText));
              errInst.cdscode = cdsCode;
              errInst.status = response.status;
              throw errInst;
            }
            const ct = response.headers.get("content-type");
            if (ct && ct.includes("application/json")) {
              return response.json().then(data => ({ data, xhr: response }));
            }
            return { data: null, xhr: response };
          })
          .then(resolve)
          .catch(reject);
      }
    });
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

  async function loadCurrentUserContext() {
    const user = getPortalUserContext();
    userContext.contactId = user.id;

    // 1. Read department and manager directly from Liquid hidden inputs if rendered
    const deptInput = document.getElementById("portalUserDepartmentId");
    const mgrInput = document.getElementById("portalUserManagerId");

    if (deptInput && deptInput.value) {
      const match = deptInput.value.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
      if (match) userContext.departmentId = match[0];
    }
    if (mgrInput && mgrInput.value) {
      const match = mgrInput.value.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
      if (match) userContext.managerId = match[0];
    }

    if (!userContext.contactId) {
      console.info("Notice: No Contact GUID found. If in studio preview or unauthenticated, the request will submit without linking a contact unless DATAVERSE_CONFIG.testContactId is set.");
      return;
    }

    // 2. Fallback: Query Web API if department or manager were not available via Liquid
    if (!userContext.departmentId || !userContext.managerId) {
      try {
        const contactUrl = `/_api/${DATAVERSE_CONFIG.entitySets.contacts}(${userContext.contactId})?$select=_hr_department_value,_hr_reportstomanager_value`;
        const res = await callWebAPI({ method: "GET", url: contactUrl });
        if (res && res.data) {
          if (!userContext.departmentId) userContext.departmentId = res.data._hr_department_value || null;
          if (!userContext.managerId) userContext.managerId = res.data._hr_reportstomanager_value || null;
        }
      } catch (err) {
        // Silently handle if contact endpoint is restricted by portal table permissions
        console.info("Note: Contact lookup fields not queryable via Web API. Submitting with user context:", userContext);
      }
    }
    console.log("Active Contact Profile:", userContext);
  }

  async function discoverLookupNavigationProperties() {
    try {
      const res = await callWebAPI({
        method: "GET",
        url: `/_api/${DATAVERSE_CONFIG.entitySets.requests}?$top=1`,
        headers: {
          "Prefer": 'odata.include-annotations="*"'
        }
      });
      if (res && res.data && res.data.value && res.data.value.length > 0) {
        const record = res.data.value[0];
        console.log("Dataverse Sample Record (Discovered Annotations):", record);
        for (const key in record) {
          if (key.includes("@Microsoft.Dynamics.CRM.associatednavigationproperty")) {
            const fieldMatch = key.match(/_([a-zA-Z0-9_]+)_value@/);
            if (fieldMatch && fieldMatch[1]) {
              const fieldName = fieldMatch[1].toLowerCase();
              const navProp = record[key];
              console.log(`[Auto-Discovered Navigation Property] Column "_${fieldName}_value" -> Navigation Property "${navProp}"`);
              if (fieldName === "hr_department") {
                DATAVERSE_CONFIG.navigationProperties.department = navProp;
              } else if (fieldName === "hr_assignedmanager") {
                DATAVERSE_CONFIG.navigationProperties.assignedManager = navProp;
              } else if (fieldName === "hr_submittedby") {
                DATAVERSE_CONFIG.navigationProperties.submittedBy = navProp;
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn("Lookup metadata auto-discovery skipped:", e.message);
    }
  }

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

  async function createHeaderWithFallback(basePayload, lookups) {
    function buildPayload(navProps, includeChoices = true) {
      const p = { ...basePayload };
      if (!includeChoices) {
        delete p["hr_paymentmethod"];
        delete p["hr_paymentsource"];
        delete p["hr_approvalstatus"];
        delete p["hr_erpsyncstatus"];
      }
      if (lookups.contactId) {
        p[`${navProps.submittedBy}@odata.bind`] = `/${DATAVERSE_CONFIG.entitySets.contacts}(${lookups.contactId})`;
      }
      if (lookups.departmentId) {
        p[`${navProps.department}@odata.bind`] = `/${DATAVERSE_CONFIG.entitySets.departments}(${lookups.departmentId})`;
      }
      if (lookups.managerId) {
        p[`${navProps.assignedManager}@odata.bind`] = `/${DATAVERSE_CONFIG.entitySets.contacts}(${lookups.managerId})`;
      }
      return p;
    }

    function isPicklistError(err) {
      if (!err) return false;
      return err.cdscode === "0x8004431a" ||
        (typeof err.message === "string" && (
          err.message.includes("0x8004431a") ||
          err.message.includes("Picklist") ||
          err.message.includes("picklist") ||
          err.message.includes("range")
        ));
    }

    const schemaNavProps = {
      submittedBy: "hr_SubmittedBy",
      department: "hr_Department",
      assignedManager: "hr_AssignedManager"
    };

    const logicalNavProps = {
      submittedBy: "hr_submittedby",
      department: "hr_department",
      assignedManager: "hr_assignedmanager"
    };

    // Attempt 1: Schema Name navigation properties (hr_SubmittedBy, hr_Department, hr_AssignedManager)
    try {
      const payload1 = buildPayload(schemaNavProps, true);
      console.log("Submitting Header (Attempt 1 - Schema Name):", payload1);
      return await callWebAPI({
        method: "POST",
        url: `/_api/${DATAVERSE_CONFIG.entitySets.requests}`,
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(payload1)
      });
    } catch (err1) {
      console.warn("Header creation failed with Schema Name navigation properties. Trying lowercase logical names...", err1.message);

      // If picklist range error occurred on Attempt 1, retry Attempt 1 without choices to preserve lookups
      if (isPicklistError(err1)) {
        try {
          console.warn("Choice integer error detected in Attempt 1. Retrying with lookups but without choice fields to preserve lookups...", err1.message);
          const p1NoChoices = buildPayload(schemaNavProps, false);
          return await callWebAPI({
            method: "POST",
            url: `/_api/${DATAVERSE_CONFIG.entitySets.requests}`,
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify(p1NoChoices)
          });
        } catch (err1b) {
          // Fall through to Attempt 2
        }
      }

      // Attempt 2: Logical Name navigation properties (hr_submittedby, hr_department, hr_assignedmanager)
      try {
        const payload2 = buildPayload(logicalNavProps, true);
        console.log("Submitting Header (Attempt 2 - Logical Name):", payload2);
        return await callWebAPI({
          method: "POST",
          url: `/_api/${DATAVERSE_CONFIG.entitySets.requests}`,
          contentType: "application/json; charset=utf-8",
          data: JSON.stringify(payload2)
        });
      } catch (err2) {
        if (isPicklistError(err2)) {
          try {
            console.warn("Choice integer error detected in Attempt 2. Retrying with logical lookups but without choice fields...", err2.message);
            const p2NoChoices = buildPayload(logicalNavProps, false);
            return await callWebAPI({
              method: "POST",
              url: `/_api/${DATAVERSE_CONFIG.entitySets.requests}`,
              contentType: "application/json; charset=utf-8",
              data: JSON.stringify(p2NoChoices)
            });
          } catch (err2b) {
            // Fall through
          }
        }

        // Attempt 3: Try with only submittedBy if department/manager caused the failure
        if (lookups.contactId && (lookups.departmentId || lookups.managerId)) {
          console.warn("Attempting header creation with only submittedBy lookup...", err2.message);
          try {
            const payload3 = {
              ...basePayload,
              "hr_SubmittedBy@odata.bind": `/${DATAVERSE_CONFIG.entitySets.contacts}(${lookups.contactId})`
            };
            return await callWebAPI({
              method: "POST",
              url: `/_api/${DATAVERSE_CONFIG.entitySets.requests}`,
              contentType: "application/json; charset=utf-8",
              data: JSON.stringify(payload3)
            });
          } catch (err3) {
            if (isPicklistError(err3)) {
              try {
                const p3NoChoices = { ...payload3 };
                delete p3NoChoices["hr_paymentmethod"];
                delete p3NoChoices["hr_paymentsource"];
                delete p3NoChoices["hr_approvalstatus"];
                delete p3NoChoices["hr_erpsyncstatus"];
                return await callWebAPI({
                  method: "POST",
                  url: `/_api/${DATAVERSE_CONFIG.entitySets.requests}`,
                  contentType: "application/json; charset=utf-8",
                  data: JSON.stringify(p3NoChoices)
                });
              } catch (err3b) { }
            }
          }
        }

        // Attempt 4: Safe submission without lookups
        try {
          console.warn("Submitting Header without lookups to prevent blocking user submission...", err2.message);
          return await callWebAPI({
            method: "POST",
            url: `/_api/${DATAVERSE_CONFIG.entitySets.requests}`,
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify(basePayload)
          });
        } catch (err4) {
          // Attempt 5: Final fallback without choices and without lookups
          if (isPicklistError(err4)) {
            console.warn("Picklist value error (0x8004431a). Retrying header submission without optional choice fields in case choice integer is out of range...", err4.message);
            const strippedPayload = { ...basePayload };
            delete strippedPayload["hr_approvalstatus"];
            delete strippedPayload["hr_erpsyncstatus"];
            delete strippedPayload["hr_paymentsource"];
            delete strippedPayload["hr_paymentmethod"];
            return await callWebAPI({
              method: "POST",
              url: `/_api/${DATAVERSE_CONFIG.entitySets.requests}`,
              contentType: "application/json; charset=utf-8",
              data: JSON.stringify(strippedPayload)
            });
          }
          throw err4;
        }
      }
    }
  }

  async function linkLookupViaPatch(recordId, lookupName, candidateNavProps, candidateEntitySets, targetId) {
    if (!recordId || !targetId) return false;
    for (const navProp of candidateNavProps) {
      if (!navProp) continue;
      for (const entitySet of candidateEntitySets) {
        if (!entitySet) continue;
        try {
          const patchPayload = {
            [`${navProp}@odata.bind`]: `/${entitySet}(${targetId})`
          };
          console.log(`[Linking ${lookupName}] Trying PATCH with "${navProp}@odata.bind": "/${entitySet}(${targetId})"...`);
          await callWebAPI({
            method: "PATCH",
            url: `/_api/${DATAVERSE_CONFIG.entitySets.requests}(${recordId})`,
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify(patchPayload)
          });
          console.log(`[Lookup Linked Successfully] ${lookupName} was linked to request ${recordId} using "${navProp}" on "/${entitySet}"!`);
          if (lookupName === "Department") {
            DATAVERSE_CONFIG.navigationProperties.department = navProp;
            DATAVERSE_CONFIG.entitySets.departments = entitySet;
          } else if (lookupName === "Assigned Manager") {
            DATAVERSE_CONFIG.navigationProperties.assignedManager = navProp;
          }
          return true;
        } catch (err) {
          console.warn(`[Lookup Link Attempt Failed] ${lookupName} ("${navProp}" -> "/${entitySet}"):`, err.message);
        }
      }
    }
    return false;
  }

  async function ensureLookupsLinked(recordId, userContext) {
    let currentDept = null;
    let currentMgr = null;
    try {
      const checkRes = await callWebAPI({
        method: "GET",
        url: `/_api/${DATAVERSE_CONFIG.entitySets.requests}(${recordId})?$select=_hr_department_value,_hr_assignedmanager_value`,
        headers: {
          "Prefer": 'odata.include-annotations="*"'
        }
      });
      if (checkRes && checkRes.data) {
        currentDept = checkRes.data._hr_department_value;
        currentMgr = checkRes.data._hr_assignedmanager_value;

        for (const key in checkRes.data) {
          if (key.includes("@Microsoft.Dynamics.CRM.associatednavigationproperty")) {
            const m = key.match(/_([a-zA-Z0-9_]+)_value@/);
            if (m && m[1]) {
              const col = m[1].toLowerCase();
              if (col === "hr_department") DATAVERSE_CONFIG.navigationProperties.department = checkRes.data[key];
              if (col === "hr_assignedmanager") DATAVERSE_CONFIG.navigationProperties.assignedManager = checkRes.data[key];
            }
          }
        }
      }
    } catch (checkErr) {
      console.warn("Lookup check query skipped:", checkErr.message);
    }

    if (!currentDept && userContext.departmentId) {
      const deptCandidates = [
        DATAVERSE_CONFIG.navigationProperties.department,
        "hr_Department",
        "hr_department",
        "hr_DepartmentId",
        "hr_departmentid",
        "hr_Department_hr_pettycashrequest",
        "hr_hr_department_hr_pettycashrequest",
        "hr_pettycashrequest_department",
        "hr_pettycashrequest_Department_hr_department"
      ].filter(Boolean);
      const uniqueDeptProps = [...new Set(deptCandidates)];
      await linkLookupViaPatch(recordId, "Department", uniqueDeptProps, [DATAVERSE_CONFIG.entitySets.departments, "hr_departments", "hr_department"], userContext.departmentId);
    }

    if (!currentMgr && userContext.managerId) {
      const mgrCandidates = [
        DATAVERSE_CONFIG.navigationProperties.assignedManager,
        "hr_AssignedManager",
        "hr_assignedmanager",
        "hr_AssignedManagerId",
        "hr_assignedmanagerid",
        "hr_AssignedManager_contact",
        "hr_assignedmanager_contact",
        "hr_pettycashrequest_AssignedManager_contact",
        "hr_pettycashrequest_assignedmanager_contact"
      ].filter(Boolean);
      const uniqueMgrProps = [...new Set(mgrCandidates)];
      await linkLookupViaPatch(recordId, "Assigned Manager", uniqueMgrProps, [DATAVERSE_CONFIG.entitySets.contacts, "contacts"], userContext.managerId);
    }
  }

  async function createLineItemWithFallback(item, newRequestId, categoryChoice) {
    const totalPrice = parseFloat((item.quantity * item.unitPrice).toFixed(2));
    const basePayload = {
      "hr_itemname": item.name,
      "hr_quantity": item.quantity,
      "hr_unitprice": item.unitPrice,
      "hr_totalprice": totalPrice
    };

    const currentNavProp = "hr_ParentRequest";
    const altNavProp = "hr_parentrequest";

    // Attempt 1: Using current navigation property and category choice
    const payload1 = {
      ...basePayload,
      [`${currentNavProp}@odata.bind`]: `/${DATAVERSE_CONFIG.entitySets.requests}(${newRequestId})`
    };
    if (categoryChoice !== undefined) {
      payload1["hr_category"] = categoryChoice;
    }

    try {
      return await callWebAPI({
        method: "POST",
        url: `/_api/${DATAVERSE_CONFIG.entitySets.lineItems}`,
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify(payload1)
      });
    } catch (err1) {
      console.warn(`Line item POST failed with '${currentNavProp}'. Trying alternate casing '${altNavProp}'...`, err1.message);

      // Attempt 2: Using alternative lookup casing (e.g. hr_ParentRequest vs hr_parentrequest)
      const payload2 = {
        ...basePayload,
        [`${altNavProp}@odata.bind`]: `/${DATAVERSE_CONFIG.entitySets.requests}(${newRequestId})`
      };
      if (categoryChoice !== undefined) {
        payload2["hr_category"] = categoryChoice;
      }

      try {
        const res2 = await callWebAPI({
          method: "POST",
          url: `/_api/${DATAVERSE_CONFIG.entitySets.lineItems}`,
          contentType: "application/json; charset=utf-8",
          data: JSON.stringify(payload2)
        });
        DATAVERSE_CONFIG.navigationProperties.parentRequest = altNavProp;
        console.log(`Successfully mapped parent lookup to '${altNavProp}'`);
        return res2;
      } catch (err2) {
        // Attempt 3: If categoryChoice was provided, test if the choice value was rejected
        if (categoryChoice !== undefined) {
          console.warn("Attempting line item creation without hr_category in case choice integer is out of range...", err2.message);
          const payload3 = {
            ...basePayload,
            [`${currentNavProp}@odata.bind`]: `/${DATAVERSE_CONFIG.entitySets.requests}(${newRequestId})`
          };
          try {
            const res3 = await callWebAPI({
              method: "POST",
              url: `/_api/${DATAVERSE_CONFIG.entitySets.lineItems}`,
              contentType: "application/json; charset=utf-8",
              data: JSON.stringify(payload3)
            });
            console.warn("Notice: Line item saved successfully, but hr_category was omitted because the choice integer in DATAVERSE_CONFIG.choices.category was rejected by Dataverse. Please update your category integers.");
            return res3;
          } catch (err3) {
            const payload4 = {
              ...basePayload,
              [`${altNavProp}@odata.bind`]: `/${DATAVERSE_CONFIG.entitySets.requests}(${newRequestId})`
            };
            const res4 = await callWebAPI({
              method: "POST",
              url: `/_api/${DATAVERSE_CONFIG.entitySets.lineItems}`,
              contentType: "application/json; charset=utf-8",
              data: JSON.stringify(payload4)
            });
            DATAVERSE_CONFIG.navigationProperties.parentRequest = altNavProp;
            console.warn("Notice: Line item saved successfully with alternate lookup casing, but hr_category was omitted because the choice integer was rejected.");
            return res4;
          }
        }
        throw err2;
      }
    }
  }

  async function submitPettyCashRequest() {
    const btnSubmit = document.getElementById("btnSubmit");
    const originalBtnText = btnSubmit.innerHTML;

    try {
      const formData = getFormData();
      validateForm(formData);

      setLoadingState(true, "Creating petty cash request...");

      const paymentMethodChoice = DATAVERSE_CONFIG.choices.paymentMethod[formData.paymentMethod];
      const paymentSourceChoice = DATAVERSE_CONFIG.choices.paymentSource[formData.paymentSource];
      const categoryChoice = DATAVERSE_CONFIG.choices.category[formData.category];
      const approvalStatusChoice = DATAVERSE_CONFIG.choices.approvalStatus["Pending"];
      const erpSyncStatusChoice = DATAVERSE_CONFIG.choices.erpSyncStatus["Not Synced"];

      const requestTitle = generateRequestTitle();

      const headerPayload = {
        "hr_requesttitle": requestTitle,
        "hr_totalamount": parseFloat(formData.grandTotal.toFixed(2)),
        "hr_purpose": formData.justification
      };

      if (formData.date) {
        headerPayload["hr_transactiondate"] = new Date(formData.date + "T00:00:00Z").toISOString();
      }

      if (paymentMethodChoice !== undefined && paymentMethodChoice !== null) {
        headerPayload["hr_paymentmethod"] = paymentMethodChoice;
      }
      if (paymentSourceChoice !== undefined && paymentSourceChoice !== null) {
        headerPayload["hr_paymentsource"] = paymentSourceChoice;
      }
      if (approvalStatusChoice !== undefined && approvalStatusChoice !== null) {
        headerPayload["hr_approvalstatus"] = approvalStatusChoice;
      }
      if (erpSyncStatusChoice !== undefined && erpSyncStatusChoice !== null) {
        headerPayload["hr_erpsyncstatus"] = erpSyncStatusChoice;
      }

      if (formData.category === "Others" && formData.otherCategory) {
        headerPayload["hr_othercategory"] = formData.otherCategory;
      }

      // 1. Create header record using intelligent lookup fallback
      const headerRes = await createHeaderWithFallback(headerPayload, userContext);

      const newRequestId = extractEntityId(headerRes.xhr);
      if (!newRequestId) {
        throw new Error("Request record was created, but unable to retrieve its reference ID from server headers.");
      }
      console.log("Created Header GUID:", newRequestId);

      // 1b. Ensure Department and Assigned Manager are linked
      if (userContext.departmentId || userContext.managerId) {
        setLoadingState(true, "Associating department and manager lookups...");
        await ensureLookupsLinked(newRequestId, userContext);
      }

      // 2. Upload Receipt Image if attached
      if (formData.receiptFile) {
        setLoadingState(true, "Uploading receipt image...");
        try {
          await uploadReceiptImage(newRequestId, formData.receiptFile);
          console.log("Receipt image uploaded.");
        } catch (uploadErr) {
          console.error("Receipt upload failed:", uploadErr);
          showMessage("Request was created, but receipt failed to upload: " + uploadErr.message, "warning");
        }
      }

      // 3. Create Child Line Items
      setLoadingState(true, "Saving product line items...");
      const lineItemPromises = formData.lineItems.map(item => {
        return createLineItemWithFallback(item, newRequestId, categoryChoice);
      });

      await Promise.all(lineItemPromises);
      console.log("All line items created.");

      // 4. Finished
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
      const today = new Date().toISOString().split("T")[0];
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
          filePreview.innerHTML = `📄 <strong>${file.name}</strong> (${sizeKb} KB)`;
        }
      };
    }

    loadCurrentUserContext();
    discoverLookupNavigationProperties();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializePettyCashApp);
  } else {
    initializePettyCashApp();
  }