import { PDFDocument } from 'pdf-lib';

export interface CropMargins {
  topPercent: number;    // 0 to 50
  bottomPercent: number; // 0 to 50
  leftPercent: number;   // 0 to 50
  rightPercent: number;  // 0 to 50
}

/**
 * Crops margins of PDF pages or selected pages
 */
export async function cropPdf(
  buffer: ArrayBuffer,
  margins: CropMargins,
  targetPages?: number[] // 0-based page indices, or undefined for all pages
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(buffer.slice(0), { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  pages.forEach((page, index) => {
    if (targetPages && !targetPages.includes(index)) {
      return;
    }

    const { width, height } = page.getSize();

    const cropLeft = (width * Math.max(0, margins.leftPercent)) / 100;
    const cropRight = (width * Math.max(0, margins.rightPercent)) / 100;
    const cropTop = (height * Math.max(0, margins.topPercent)) / 100;
    const cropBottom = (height * Math.max(0, margins.bottomPercent)) / 100;

    const newX = cropLeft;
    const newY = cropBottom;
    const newWidth = Math.max(10, width - cropLeft - cropRight);
    const newHeight = Math.max(10, height - cropTop - cropBottom);

    page.setCropBox(newX, newY, newWidth, newHeight);
  });

  return await pdfDoc.save();
}
