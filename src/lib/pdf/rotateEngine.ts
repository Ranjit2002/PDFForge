import { PDFDocument, degrees } from 'pdf-lib';

export interface PageRotationSetting {
  pageIndex: number; // 0-based
  rotation: number;  // 0, 90, 180, 270
}

/**
 * Rotates pages in a PDF document
 */
export async function rotatePdf(
  buffer: ArrayBuffer,
  options: {
    globalRotation?: number; // Added to all pages (0, 90, 180, 270)
    pageRotations?: Record<number, number>; // pageIndex -> rotation angle
  }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(buffer.slice(0), { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  pages.forEach((page, index) => {
    let currentRotation = page.getRotation().angle;
    let addedRotation = 0;

    if (options.globalRotation) {
      addedRotation += options.globalRotation;
    }

    if (options.pageRotations && options.pageRotations[index] !== undefined) {
      addedRotation += options.pageRotations[index];
    }

    const finalAngle = (currentRotation + addedRotation) % 360;
    // Normalize to positive angle in [0, 90, 180, 270]
    const normalized = ((finalAngle % 360) + 360) % 360;
    page.setRotation(degrees(normalized));
  });

  return await pdfDoc.save();
}
