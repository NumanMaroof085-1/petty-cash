# Multi-image receipt PDF upload

Date: 2026-10-28. Version **receipt-pdf-v1**. The user reported on 2026-10-29 that
the image-to-PDF feature works perfectly after live testing. This confirms their
reported workflow, not every phone, file limit, permission or malware behavior.
The current project folder is Desktop/petty-cash, not the former
petty cash docs path. Testing used only synthetic receipts and intercepted APIs.

## Behavior and limits

Choose one existing PDF OR 1–10 JPG/PNG images. Choose again to append images;
use up/down/remove buttons to set page order, or Clear list to switch modes.
Mixed PDF/image batches, multiple PDFs, HEIC/GIF/WebP/SVG and over-limit batches
are rejected without losing the valid existing selection. One image also becomes
a PDF. Names are rendered as text, not HTML. No selected image is silently omitted.

Prepare PDF creates local preview/download links without writing to Dataverse.
Submit prepares it automatically if necessary. Check the preview for readable
small text and page order. No OCR is performed; converted images need not be
searchable text. Originals are not separately stored in Dataverse.

Existing PDFs pass through with unchanged bytes and filename (missing MIME is
normalized after checking the header). Header/size checks are not full document,
encryption or malware validation. Images produce receipts.pdf, one image/page,
with proportions preserved and browser EXIF orientation applied. White canvas
background flattens transparency; JPEG quality is 0.88. Normal pages use A4
portrait/landscape. Long receipts use custom-height pages up to 1,200 mm to avoid
squeezing text into A4 height; printing may need the viewer's fit-to-page setting.

- Maximum 10 images, 15 MiB each and 40 MiB combined source bytes.
- Maximum source dimensions: 32 million pixels and 12,000 pixels per side.
  PNG/JPEG header dimensions are checked before even thumbnail decoding.
- Conversion processes images sequentially; output canvases are bounded to
  2,000 x 8,000 and 8 million pixels, then released. Thumbnails decode lazily.
- Final PDF maximum 10 MiB (shown as 10 MB), also respecting a lower
  DATAVERSE_CONFIG.settings.maxReceiptBytes. Check the live column's own limit;
  it was not inspected or changed by the assistant. Oversized output fails
  instead of silently discarding pages or degrading quality further.
- Object URLs are revoked on removal, invalidation/reset and page exit (except
  bfcache preservation). No remote converter, runtime CDN, telemetry or browser
  storage calls. The browser itself may cache local Blob/File data; this is not
  a guarantee of physical memory erasure.

## Submission and retry behavior

The canonical pettycash-api.js and matching inline script capture the ordered
selection, validate the form, then prepare/check the PDF before any request POST.
Missing tools, corrupt files and conversion errors cannot create a header/line.
Expense edits during preparation are detected before submission proceeds.

The selection fingerprint uses monotonic per-page File identities and order,
not a newly generated PDF timestamp. Preparation is cached for unchanged sources
and concurrent calls reuse one promise. Selection changes invalidate the preview.
Controls lock during preparation/submission and remain locked for partial or
uncertain saves. The pending state retains the exact File; retries reuse its
bytes and existing request/line IDs. Ambiguous POSTs are still not repeated.
Keep the page open: refresh loses in-memory retry state, requiring inspection
of saved records before any further attempt. Success clears files/previews.

One existing session/CSRF PUT still writes one PDF to hr_receiptimage on
hr_pettycashrequest / hr_pettycashrequests. No schema, table, column, key, role,
permission, Web API field setting, total/balance logic or flow is added/changed.
The mandatory receipt and existing file-column Write/API access remain required.
Approval/accounting must still wait for all lines AND receipt upload, not just
header creation. This feature adds no server completion flag or transaction.

## Files and dependency

- pettycash-receipts.js: canonical local picker, validation, conversion/cache.
- vendor/jspdf-4.2.1.umd.min.js and jspdf-LICENSE.txt: pinned MIT dependency.
- scripts/build_receipt_template.cjs: generates Petty Cash Receipts.html from the
  library and canonical module, removing source-map fetches and isolating host
  AMD/CommonJS globals so the browser export is reliable. --fetch obtains only
  the exact npm tarball, verifies SHA-512 integrity and copies named files;
  arbitrary archive paths are never extracted.
- Petty Cash Receipts.html: complete generated Web Template Source (~427 KiB),
  already wrapped in script tags and Liquid raw guards. No user-specific Liquid.
- New Petty Cash Request.html and pettycash-api.js: synchronized integration.
- tests/pettycash-receipts.test.cjs and extended API tests; scripts/
  verify_receipt_upload.cjs for browser/parser/render QA. Synthetic intermediate
  outputs are under tmp/pdfs/, ignored by git. Existing module-page QA renders
  the receipt include for the request page.

After changing the canonical module, run `node scripts/build_receipt_template.cjs`
and publish the regenerated HTML. Only dependency setup/upgrade needs --fetch.
Review new versions, integrity and advisories before changing version/hash and
rerun tests. Preserve the library's notices and license.

## Deploy both artifacts

1. Create ONE Web Template named exactly **Petty Cash Receipts** on this site.
   Paste the COMPLETE **Petty Cash Receipts.html** into Source, including its
   raw guards and existing script tags. Do not wrap it again or paste only the
   canonical JS (that would omit the library). No Web File/JS upload, new Web
   Page or Page Template is needed. This avoids the earlier JS upload problem.
2. Replace the existing request page HTML with complete updated **New Petty Cash
   Request.html**. It includes User Context, Petty Cash Modules, then Petty Cash
   Receipts before its inline script. Do not separately load pettycash-api.js or
   duplicate the receipt template in a global header/footer.
3. Save/sync/Preview and reload. Existing inline-script policy is used; do not
   weaken CSP or allow external CDN hosts. If this tenant rejects template size
   or policy, stop and review supported static hosting rather than stripping
   library/validation code. Tenant template limits were not inspected.
4. Check window.PettyCashReceipts.version is receipt-pdf-v1 and
   window.jspdf.jsPDF.version is 4.2.1. Missing generator explicitly blocks image
   conversion; existing PDF-only preparation needs only the receipt controller.

## Verification and live checklist

106 code tests passed at receipt implementation (the full suite now has 119
after the separate suggestion-card addition). Chrome
mock-browser tests cover ordered portrait/landscape/long/EXIF images, preview
before writes, cached preparation, byte-identical upload retry, one header/line,
unchanged existing-PDF upload, corrupt/HEIC/mixed/count/encoding failures and a
390px mobile layout. An independent parser confirmed 4 pages; PDF.js rendered
all pages and their PNGs were visually inspected per the PDF skill. Existing
Requests/Accounts/missing-profile mock browser checks also pass.

After publication test a real phone JPG/PNG batch, add/remove/reorder, preview,
one existing PDF and an error case. Download the Dataverse PDF and inspect every
page, filename, size and readable text. Confirm saved totals/lines and employee
isolation. Mobile viewport tests are not actual Safari/iOS/Android or low-memory
device tests; real-device behavior, permissions, malware scanning and tenant
limits remain unverified. Future OCR/integrations need image-only/custom-height
PDF testing. No live site configuration, data or financial flow was changed.

## Sources

- [Microsoft file columns](https://learn.microsoft.com/en-us/power-pages/configure/file-column)
- [jsPDF project/security guidance](https://github.com/parallax/jsPDF)
- [jsPDF image API](https://parallax.github.io/jsPDF/docs/module-addImage.html)
- [Browser canvas conversion](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)
