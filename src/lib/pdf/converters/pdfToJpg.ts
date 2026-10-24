import JSZip from 'jszip';
import { loadPdfJsDocument, renderPageToJpegBlob } from '../pdfRenderer';

export interface PageJpegResult {
  pageNumber: number;
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Converts PDF pages into JPG images and packages them into a ZIP archive
 */
export async function convertPdfToJpg(
  buffer: ArrayBuffer,
  options?: {
    quality?: number; // 0.5 to 1.0, default 0.92
    scale?: number;   // 1.0 to 3.0, default 1.75
    onProgress?: (current: number, total: number) => void;
  }
): Promise<{ pages: PageJpegResult[]; zipBlob: Blob }> {
  const pdf = await loadPdfJsDocument(buffer);
  const totalPages = pdf.numPages;
  const quality = options?.quality || 0.92;
  const scale = options?.scale || 1.75;

  const pages: PageJpegResult[] = [];
  const zip = new JSZip();

  for (let i = 1; i <= totalPages; i++) {
    if (options?.onProgress) {
      options.onProgress(i, totalPages);
    }

    const page = await pdf.getPage(i);
    const { blob, width, height } = await renderPageToJpegBlob(page, scale, quality);
    const dataUrl = URL.createObjectURL(blob);

    pages.push({
      pageNumber: i,
      blob,
      dataUrl,
      width,
      height,
    });

    const filename = `page_${String(i).padStart(3, '0')}.jpg`;
    zip.file(filename, blob);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return { pages, zipBlob };
}
