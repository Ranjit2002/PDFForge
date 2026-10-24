import { PDFDocument, rgb } from 'pdf-lib';

export interface RedactionBox {
  pageIndex: number; // 0-based
  x: number;         // percentage of page width (0 - 100)
  y: number;         // percentage of page height from bottom (0 - 100)
  width: number;     // percentage of page width (0 - 100)
  height: number;    // percentage of page height (0 - 100)
}

/**
 * Permanently stamps opaque redaction rectangles onto PDF pages
 * and cleans sensitive metadata fields.
 */
export async function redactPdf(
  buffer: ArrayBuffer,
  redactions: RedactionBox[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(buffer.slice(0), { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  redactions.forEach(box => {
    if (box.pageIndex < 0 || box.pageIndex >= pages.length) return;
    const page = pages[box.pageIndex];
    const { width, height } = page.getSize();

    const rectX = (box.x / 100) * width;
    const rectY = (box.y / 100) * height;
    const rectW = (box.width / 100) * width;
    const rectH = (box.height / 100) * height;

    // Draw solid black redaction box
    page.drawRectangle({
      x: rectX,
      y: rectY,
      width: rectW,
      height: rectH,
      color: rgb(0, 0, 0),
      opacity: 1.0,
      borderWidth: 0,
    });
  });

  // Sanitize document metadata that could leak sensitive author or subject info
  pdfDoc.setTitle('Redacted Document');
  pdfDoc.setAuthor('PDFForge Redaction Engine');
  pdfDoc.setSubject('');
  pdfDoc.setKeywords([]);

  return await pdfDoc.save();
}
