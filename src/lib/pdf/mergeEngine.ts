import { PDFDocument, degrees } from 'pdf-lib';

export interface MergeItem {
  id: string;
  name: string;
  buffer: ArrayBuffer;
  rotation: number; // 0, 90, 180, 270
  pageCount?: number;
}

export interface MergeOptions {
  onProgress?: (current: number, total: number, status: string) => void;
}

/**
 * Merges multiple PDF ArrayBuffers into a single PDF document
 */
export async function mergePdfs(
  items: MergeItem[],
  options?: MergeOptions
): Promise<Uint8Array> {
  if (!items || items.length === 0) {
    throw new Error('No PDF files provided to merge');
  }

  const mergedPdf = await PDFDocument.create();
  const total = items.length;

  for (let i = 0; i < total; i++) {
    const item = items[i];
    options?.onProgress?.(
      i + 1,
      total,
      `Processing "${item.name}" (${i + 1}/${total})...`
    );

    // Ensure buffer is an intact slice
    const bufferSlice = item.buffer.slice(0);
    const sourcePdf = await PDFDocument.load(bufferSlice, {
      ignoreEncryption: true,
    });

    const pageIndices = sourcePdf.getPageIndices();
    const copiedPages = await mergedPdf.copyPages(sourcePdf, pageIndices);

    for (const page of copiedPages) {
      if (item.rotation) {
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees((currentRotation + item.rotation) % 360));
      }
      mergedPdf.addPage(page);
    }
  }

  options?.onProgress?.(total, total, 'Optimizing and generating merged PDF...');
  
  // Save with compressed object streams
  const mergedBytes = await mergedPdf.save({
    useObjectStreams: true,
  });

  return mergedBytes;
}
