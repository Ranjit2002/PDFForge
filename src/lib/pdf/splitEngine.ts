import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';

export interface SplitResult {
  type: 'pdf' | 'zip';
  data: Uint8Array | Blob;
  filename: string;
}

export interface SplitOptions {
  onProgress?: (current: number, total: number, status: string) => void;
}

/**
 * Extracts specified pages into a single PDF
 * @param buffer Source PDF ArrayBuffer
 * @param pageNumbers 1-based array of page numbers to include
 */
export async function extractPagesToSinglePdf(
  buffer: ArrayBuffer,
  pageNumbers: number[],
  baseFilename: string,
  options?: SplitOptions
): Promise<Uint8Array> {
  const sourcePdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const newPdf = await PDFDocument.create();
  const totalPages = pageNumbers.length;

  options?.onProgress?.(0, totalPages, 'Preparing page extraction...');

  // Convert 1-based page numbers to 0-based indices
  const validIndices = pageNumbers
    .map(p => p - 1)
    .filter(i => i >= 0 && i < sourcePdf.getPageCount());

  for (let i = 0; i < validIndices.length; i++) {
    const pageIndex = validIndices[i];
    options?.onProgress?.(
      i + 1,
      validIndices.length,
      `Extracting page ${pageIndex + 1} (${i + 1}/${validIndices.length})...`
    );

    const [copiedPage] = await newPdf.copyPages(sourcePdf, [pageIndex]);
    newPdf.addPage(copiedPage);
  }

  options?.onProgress?.(
    validIndices.length,
    validIndices.length,
    'Saving extracted PDF...'
  );

  return await newPdf.save({ useObjectStreams: true });
}

/**
 * Splits each specified page into its own standalone PDF file and bundles into a ZIP
 * @param buffer Source PDF ArrayBuffer
 * @param pageNumbers 1-based array of page numbers to extract
 * @param baseFilename Base name for output files
 */
export async function splitPagesToZip(
  buffer: ArrayBuffer,
  pageNumbers: number[],
  baseFilename: string,
  options?: SplitOptions
): Promise<Blob> {
  const sourcePdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const zip = new JSZip();
  const cleanBase = baseFilename.replace(/\.pdf$/i, '');
  const totalPages = pageNumbers.length;

  // Convert 1-based page numbers to 0-based indices
  const validIndices = pageNumbers
    .map(p => p - 1)
    .filter(i => i >= 0 && i < sourcePdf.getPageCount());

  for (let i = 0; i < validIndices.length; i++) {
    const pageIndex = validIndices[i];
    const pageNum = pageIndex + 1;

    options?.onProgress?.(
      i + 1,
      totalPages,
      `Splitting page ${pageNum} (${i + 1}/${totalPages})...`
    );

    const singlePdf = await PDFDocument.create();
    const [copiedPage] = await singlePdf.copyPages(sourcePdf, [pageIndex]);
    singlePdf.addPage(copiedPage);

    const pdfBytes = await singlePdf.save({ useObjectStreams: true });
    const singleFilename = `${cleanBase}_page_${String(pageNum).padStart(3, '0')}.pdf`;
    zip.file(singleFilename, pdfBytes);
  }

  options?.onProgress?.(totalPages, totalPages, 'Generating ZIP bundle...');
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  return zipBlob;
}
