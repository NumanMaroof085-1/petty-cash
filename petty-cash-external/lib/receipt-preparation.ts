const MiB = 1024 * 1024;
const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];
const jpegFrames = [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf];

async function checkImage(file: File) {
  if (file.size > 15 * MiB) throw new Error('Each receipt image must be 15 MB or smaller.');
  const header = new Uint8Array(await file.slice(0, 256 * 1024).arrayBuffer());
  const view = new DataView(header.buffer);
  let width = 0, height = 0;
  if (header.length >= 24 && pngSignature.every((byte, index) => header[index] === byte) &&
      view.getUint32(12) === 0x49484452) {
    width = view.getUint32(16);
    height = view.getUint32(20);
  } else if (header[0] === 0xff && header[1] === 0xd8) {
    for (let pos = 2; pos + 9 < header.length;) {
      if (header[pos++] !== 0xff) break;
      while (header[pos] === 0xff) pos++;
      const marker = header[pos++];
      if (marker === 0xda || marker === 0xd9 || pos + 2 > header.length) break;
      const length = view.getUint16(pos);
      if (length < 2 || pos + length > header.length) break;
      if (jpegFrames.includes(marker) && length >= 7) {
        height = view.getUint16(pos + 3);
        width = view.getUint16(pos + 5);
        break;
      }
      pos += length;
    }
  }
  if (!width || !height) throw new Error('Choose valid JPG or PNG images, or one PDF.');
  if (width > 12000 || height > 12000 || width * height > 32_000_000) throw new Error('A receipt image is too large to prepare safely.');
}

export function validateReceiptSelection(files: File[]) {
  if (!files.length) throw new Error('Attach a receipt.');
  if (files.some(file => file.size === 0)) throw new Error('Remove empty receipt files.');
  if (files.length === 1 && /\.pdf$/i.test(files[0].name)) {
    if (files[0].size > 10 * MiB) throw new Error('The PDF must be 10 MB or smaller.');
    return 'pdf';
  }
  if (files.length > 10 || files.some(file => !/\.(jpe?g|png)$/i.test(file.name))) {
    throw new Error('Choose one PDF or up to ten JPG/PNG images.');
  }
  if (files.reduce((sum, file) => sum + file.size, 0) > 40 * MiB) throw new Error('The combined images must be 40 MB or smaller.');
  return 'images';
}

export async function prepareReceipt(files: File[]): Promise<File> {
  if (validateReceiptSelection(files) === 'pdf') {
    if (await files[0].slice(0, 5).text() !== '%PDF-') throw new Error('The receipt must be a valid PDF.');
    return files[0];
  }
  for (const file of files) await checkImage(file);
  const { jsPDF } = await import('jspdf');
  let pdf: InstanceType<typeof jsPDF> | undefined;
  for (const file of files) {
    const image = await createImageBitmap(file);
    try {
      const scale = Math.min(1, 2000 / image.width, 8000 / image.height, Math.sqrt(8_000_000 / (image.width * image.height)));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('This browser could not prepare the receipt image.');
      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const orientation = canvas.width > canvas.height ? 'landscape' : 'portrait';
      const format = canvas.height / canvas.width > 2.2 ? [210, Math.min(1200, 190 * canvas.height / canvas.width + 20)] : 'a4';
      if (!pdf) pdf = new jsPDF({ unit: 'mm', format, orientation, compress: true });
      else pdf.addPage(format, orientation);
      const page = pdf.internal.pageSize;
      const fit = Math.min((page.getWidth() - 20) / canvas.width, (page.getHeight() - 20) / canvas.height);
      const width = canvas.width * fit, height = canvas.height * fit;
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.86), 'JPEG',
        (page.getWidth() - width) / 2, (page.getHeight() - height) / 2, width, height);
    } finally { image.close(); }
  }
  const blob = pdf!.output('blob');
  if (blob.size > 10 * MiB) throw new Error('The combined PDF exceeds 10 MB. Use smaller images or fewer pages.');
  return new File([blob], 'receipt.pdf', { type: 'application/pdf' });
}
