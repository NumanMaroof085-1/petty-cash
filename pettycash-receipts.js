/* Canonical receipt picker/PDF preparation. Bundled into Petty Cash Receipts.html.
 * Local files only. No fetch, storage, telemetry or remote conversion calls.
 */
(function (root) {
  'use strict';
  const limits = Object.freeze({ maxImages: 10, maxImageBytes: 15 * 1024 * 1024,
    maxSourceBytes: 40 * 1024 * 1024, maxOutputBytes: 10 * 1024 * 1024,
    maxPixels: 32000000, maxDimension: 12000, maxCanvasWidth: 2000,
    maxCanvasHeight: 8000, maxCanvasPixels: 8000000, jpegQuality: 0.88 });
  function kind(file) {
    const type = String(file.type || '').toLowerCase();
    if (type === 'application/pdf' || (!type && /\.pdf$/i.test(file.name))) return 'pdf';
    if (type === 'image/jpeg' || (!type && /\.jpe?g$/i.test(file.name))) return 'jpeg';
    if (type === 'image/png' || (!type && /\.png$/i.test(file.name))) return 'png';
    throw new Error('Choose one PDF or JPG/PNG images only. HEIC, GIF, WebP and other formats are not supported.');
  }
  function validateSelection(files, maxOutputBytes = limits.maxOutputBytes) {
    if (!files.length) throw new Error('Please attach a receipt PDF or at least one JPG/PNG image.');
    const kinds = files.map(kind);
    if (kinds.includes('pdf') && files.length !== 1) throw new Error('Choose one PDF OR images, not multiple PDFs or a mixture. Clear the list to switch.');
    if (!kinds.includes('pdf') && files.length > limits.maxImages) throw new Error('You can attach up to 10 images. No files were added.');
    for (const file of files) {
      if (!Number.isSafeInteger(file.size) || file.size <= 0) throw new Error('An empty or invalid receipt file was selected.');
      const maximum = kind(file) === 'pdf' ? maxOutputBytes : limits.maxImageBytes;
      if (file.size > maximum) throw new Error(kind(file) === 'pdf' ? 'The PDF must be 10 MB or smaller.' : 'Each image must be 15 MB or smaller.');
    }
    if (!kinds.includes('pdf') && files.reduce((total, file) => total + file.size, 0) > limits.maxSourceBytes) {
      throw new Error('Selected images exceed the 40 MB combined input limit. No files were added.');
    }
    return kinds[0] === 'pdf' ? 'pdf' : 'images';
  }
  function dimensions(bytes, format) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (format === 'png' && bytes.length >= 24 &&
        [137,80,78,71,13,10,26,10].every((value, i) => bytes[i] === value) &&
        String.fromCharCode(...bytes.subarray(12, 16)) === 'IHDR') {
      return { width: view.getUint32(16), height: view.getUint32(20) };
    }
    if (format === 'jpeg' && bytes[0] === 255 && bytes[1] === 216) {
      for (let offset = 2; offset + 4 <= bytes.length;) {
        if (bytes[offset++] !== 255) break;
        while (bytes[offset] === 255) offset++;
        const marker = bytes[offset++];
        if (marker === 217 || marker === 218) break;
        if (marker === 1 || (marker >= 208 && marker <= 215)) continue;
        if (offset + 2 > bytes.length) break;
        const length = view.getUint16(offset);
        if (length < 2 || offset + length > bytes.length) break;
        if ([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker) && length >= 7) {
          return { width: view.getUint16(offset + 5), height: view.getUint16(offset + 3) };
        }
        offset += length;
      }
    }
    throw new Error('An image is corrupt, mislabeled or has an unsupported header. Choose another JPG/PNG.');
  }
  function checkDimensions(size) {
    if (!Number.isSafeInteger(size.width) || !Number.isSafeInteger(size.height) ||
        size.width <= 0 || size.height <= 0 || Math.max(size.width, size.height) > limits.maxDimension ||
        size.width * size.height > limits.maxPixels) {
      throw new Error('An image exceeds 32 megapixels or 12,000 pixels per side. Resize it before attaching.');
    }
    return size;
  }
  async function inspect(file) {
    const format = kind(file);
    const bytes = new Uint8Array(await file.slice(0, 512 * 1024).arrayBuffer());
    if (format === 'pdf') {
      if (String.fromCharCode(...bytes.subarray(0, 5)) !== '%PDF-') throw new Error('The selected file is not a valid PDF file.');
      return { format };
    }
    return { format, ...checkDimensions(dimensions(bytes, format)) };
  }
  async function decode(file) {
    if (typeof root.createImageBitmap === 'function') {
      try { return await root.createImageBitmap(file, { imageOrientation: 'from-image' }); }
      catch (_) { /* Try the browser image element decoder before rejecting. */ }
    }
    const url = root.URL.createObjectURL(file);
    try {
      return await new Promise((resolve, reject) => {
        const image = new root.Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('The browser could not decode a receipt image. Choose a different JPG/PNG.'));
        image.src = url;
      });
    } finally { root.URL.revokeObjectURL(url); }
  }
  async function imagePdf(files, progress = () => {}) {
    if (!root.jspdf || typeof root.jspdf.jsPDF !== 'function') throw new Error('The receipt PDF library is missing. Ask the administrator to update Petty Cash Receipts.');
    let pdf;
    for (let i = 0; i < files.length; i++) {
      progress('Preparing receipt image ' + (i + 1) + ' of ' + files.length + '…');
      await inspect(files[i]); // Bound dimensions before decoding/allocating pixels.
      const image = await decode(files[i]);
      const canvas = root.document.createElement('canvas');
      try {
        const size = checkDimensions({ width: image.width || image.naturalWidth, height: image.height || image.naturalHeight });
        const scale = Math.min(1, limits.maxCanvasWidth / size.width, limits.maxCanvasHeight / size.height,
          Math.sqrt(limits.maxCanvasPixels / (size.width * size.height)));
        canvas.width = Math.max(1, Math.round(size.width * scale));
        canvas.height = Math.max(1, Math.round(size.height * scale));
        const context = canvas.getContext('2d');
        if (!context) throw new Error('This browser cannot prepare receipt images. Use an existing PDF instead.');
        context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const jpeg = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', limits.jpegQuality));
        if (!jpeg || jpeg.type !== 'image/jpeg') throw new Error('Image conversion failed. Use another JPG/PNG or an existing PDF.');
        const orientation = canvas.width > canvas.height ? 'landscape' : 'portrait';
        // Tall receipts get a longer page rather than being squeezed into A4 height.
        const format = canvas.height / canvas.width > 2.2 ? [210, Math.min(1200, 190 * canvas.height / canvas.width + 20)] : 'a4';
        if (!pdf) pdf = new root.jspdf.jsPDF({ orientation, unit: 'mm', format, compress: true, putOnlyUsedFonts: true });
        else pdf.addPage(format, orientation);
        const pageWidth = pdf.internal.pageSize.getWidth(), pageHeight = pdf.internal.pageSize.getHeight();
        const fit = Math.min((pageWidth - 20) / canvas.width, (pageHeight - 20) / canvas.height);
        const width = canvas.width * fit, height = canvas.height * fit;
        pdf.addImage(new Uint8Array(await jpeg.arrayBuffer()), 'JPEG', (pageWidth - width) / 2,
          (pageHeight - height) / 2, width, height, 'receipt-' + i, 'FAST');
      } finally {
        canvas.width = 0; canvas.height = 0;
        if (typeof image.close === 'function') image.close();
      }
    }
    const blob = pdf.output('blob');
    return new root.File([blob], 'receipts.pdf', { type: 'application/pdf', lastModified: 0 });
  }
  function createController(document) {
    const input = document.getElementById('fileReceipt');
    const list = document.getElementById('pcReceiptList');
    const status = document.getElementById('pcReceiptStatus');
    const prepareButton = document.getElementById('pcPrepareReceipt');
    const clearButton = document.getElementById('pcClearReceipts');
    const preview = document.getElementById('pcReceiptPreview');
    const download = document.getElementById('pcReceiptDownload');
    let files = [], ids = new WeakMap(), nextId = 0, locked = false, busy = false;
    let cached = null, inflight = null, previewUrl = null, renderGeneration = 0;
    const thumbnails = new Map();
    function say(message) { if (status) status.textContent = message; }
    function key() { return files.map(file => { if (!ids.has(file)) ids.set(file, ++nextId); return ids.get(file); }).join(','); }
    function discardPreview() {
      if (previewUrl) root.URL.revokeObjectURL(previewUrl);
      previewUrl = null; cached = null;
      for (const link of [preview, download]) if (link) { link.hidden = true; link.removeAttribute('href'); }
    }
    function controls() {
      const disabled = busy || locked;
      input.disabled = disabled; input.required = files.length === 0;
      if (prepareButton) prepareButton.disabled = disabled || !files.length;
      if (clearButton) clearButton.disabled = disabled || !files.length;
      if (list) for (const button of list.querySelectorAll('button')) button.disabled = disabled || button.dataset.unavailable === 'true';
      const area = document.getElementById('pcReceiptArea');
      if (area) area.setAttribute('aria-busy', String(busy));
    }
    function ensureEditable() { if (busy || locked) throw new Error('Receipt selection is locked while preparing or resuming this request.'); }
    function render() {
      const generation = ++renderGeneration;
      if (list) {
        list.replaceChildren();
        files.forEach((file, index) => {
          const row = document.createElement('li'); row.className = 'pc-receipt-row';
          if (kind(file) !== 'pdf') {
            const image = document.createElement('img'); image.alt = 'Receipt image ' + (index + 1);
            image.loading = 'lazy'; image.decoding = 'async';
            image.width = 64; image.height = 64; row.appendChild(image);
            // Inspect dimensions before letting even the thumbnail decode untrusted pixels.
            inspect(file).then(() => {
              if (generation !== renderGeneration || !files.includes(file)) return;
              if (!thumbnails.has(file)) thumbnails.set(file, root.URL.createObjectURL(file));
              image.src = thumbnails.get(file);
            }).catch(error => { if (generation === renderGeneration) { image.alt = 'Image preview unavailable'; say(error.message); } });
          }
          const label = document.createElement('span'); label.textContent = (index + 1) + '. ' + file.name + ' (' + (file.size / 1024).toFixed(1) + ' KB)'; row.appendChild(label);
          const actions = document.createElement('div'); actions.className = 'pc-receipt-actions';
          function button(text, label, action, unavailable = false) {
            const node = document.createElement('button'); node.type = 'button'; node.textContent = text;
            node.setAttribute('aria-label', label); node.dataset.unavailable = String(unavailable);
            node.onclick = () => { try { action(); } catch (error) { say(error.message); } };
            actions.appendChild(node);
          }
          if (kind(file) !== 'pdf') {
            button('↑', 'Move image ' + (index + 1) + ' up', () => move(index, -1), index === 0);
            button('↓', 'Move image ' + (index + 1) + ' down', () => move(index, 1), index === files.length - 1);
          }
          button('Remove', 'Remove receipt ' + (index + 1), () => remove(index));
          row.appendChild(actions); list.appendChild(row);
        });
      }
      controls();
    }
    function changed() { discardPreview(); say(files.length ? files.length + ' receipt file(s) selected. Prepare and preview the PDF to check readability and order.' : 'Choose one PDF or up to 10 JPG/PNG images.'); render(); }
    function append(added) {
      ensureEditable(); if (!added.length) return;
      const next = files.concat(Array.from(added)); validateSelection(next);
      files = next; changed();
    }
    function move(index, direction) {
      ensureEditable(); const target = index + direction;
      if (target < 0 || target >= files.length) return;
      [files[index], files[target]] = [files[target], files[index]]; changed();
    }
    function remove(index) {
      ensureEditable(); const removed = files.splice(index, 1)[0];
      if (thumbnails.has(removed) && !files.includes(removed)) { root.URL.revokeObjectURL(thumbnails.get(removed)); thumbnails.delete(removed); }
      changed();
    }
    function reset() {
      for (const url of thumbnails.values()) root.URL.revokeObjectURL(url);
      thumbnails.clear(); files = []; locked = false; input.value = ''; changed();
    }
    function snapshot() { return Object.freeze({ key: key(), files: Object.freeze(files.slice()) }); }
    async function prepare(selection, options = {}) {
      const maxOutputBytes = Math.min(options.maxOutputBytes || limits.maxOutputBytes, limits.maxOutputBytes);
      if (selection.key !== key()) throw new Error('Receipt selection changed. Prepare the selected files again.');
      validateSelection(selection.files, maxOutputBytes);
      if (cached && cached.key === selection.key) {
        if (cached.file.size > maxOutputBytes) throw new Error('The prepared PDF exceeds the upload limit.');
        return cached.file;
      }
      if (inflight) return inflight;
      busy = true; controls();
      const progress = text => { say(text); if (options.onProgress) options.onProgress(text); };
      inflight = (async () => {
        let file;
        if (kind(selection.files[0]) === 'pdf') {
          await inspect(selection.files[0]); file = selection.files[0];
          if (file.type !== 'application/pdf') file = new root.File([file], file.name, { type: 'application/pdf', lastModified: file.lastModified });
        }
        else file = await imagePdf(selection.files, progress);
        if (file.size > maxOutputBytes) throw new Error('The prepared PDF exceeds 10 MB. Remove images or choose smaller ones; no images were omitted.');
        if (selection.key !== key()) throw new Error('Receipt selection changed during preparation. Prepare it again.');
        cached = { key: selection.key, file };
        previewUrl = root.URL.createObjectURL(file);
        if (preview) { preview.href = previewUrl; preview.hidden = false; }
        if (download) { download.href = previewUrl; download.download = file.name; download.hidden = false; }
        say('PDF ready: ' + (file.size / 1024 / 1024).toFixed(2) + ' MB. ' +
          (kind(selection.files[0]) === 'pdf' ? 'Existing PDF kept unchanged.' : selection.files.length + ' image(s), one per page. Original images are not uploaded.') +
          ' Preview it to check readability before submitting.');
        return file;
      })();
      try { return await inflight; }
      catch (error) { say(error.message); throw error; }
      finally { busy = false; inflight = null; controls(); }
    }
    input.onchange = () => { try { append(Array.from(input.files || [])); } catch (error) { say(error.message); } finally { input.value = ''; } };
    if (prepareButton) prepareButton.onclick = () => { prepare(snapshot()).catch(() => {}); };
    if (clearButton) clearButton.onclick = () => { try { ensureEditable(); reset(); } catch (error) { say(error.message); } };
    render();
    return Object.freeze({ snapshot, prepare, append, move, remove, reset,
      setLocked(value) { locked = Boolean(value); controls(); },
      dispose() { renderGeneration++; for (const url of thumbnails.values()) root.URL.revokeObjectURL(url); thumbnails.clear(); discardPreview(); } });
  }
  const api = { version: 'receipt-pdf-v1', limits, validateSelection, inspect, dimensions, checkDimensions, imagePdf, createController,
    current: null, mount() {
      if (!api.current && root.document.getElementById('fileReceipt')) api.current = createController(root.document);
      return api.current;
    } };
  root.PettyCashReceipts = api;
  if (root.addEventListener) root.addEventListener('pagehide', event => { if (!event.persisted && api.current) api.current.dispose(); });
})(window);
