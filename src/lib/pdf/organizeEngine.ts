import { PDFDocument, degrees } from 'pdf-lib';

export interface PageOrganizeItem {
  id: string;
  sourcePageIndex: number; // 0-based index in original PDF
  rotation: number;        // 0, 90, 180, 270
}

/**
 * Reconstructs a PDF document with pages reordered, duplicated, deleted, and rotated
 */
export async function organizePdf(
  buffer: ArrayBuffer,
  pageItems: PageOrganizeItem[]
): Promise<Uint8Array> {
  if (pageItems.length === 0) {
    throw new Error('At least one page must remain in the document');
  }

  const srcDoc = await PDFDocument.load(buffer.slice(0), { ignoreEncryption: true });
  const outDoc = await PDFDocument.create();

  // Extract source page indices needed
  const indicesToCopy = pageItems.map(item => item.sourcePageIndex);
  const copiedPages = await outDoc.copyPages(srcDoc, indicesToCopy);

  copiedPages.forEach((copiedPage, i) => {
    const item = pageItems[i];
    const initialRotation = copiedPage.getRotation().angle;
    const finalRotation = ((initialRotation + item.rotation) % 360 + 360) % 360;
    copiedPage.setRotation(degrees(finalRotation));
    outDoc.addPage(copiedPage);
  });

  return await outDoc.save();
}
