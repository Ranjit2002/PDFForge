import { createWorker } from 'tesseract.js';
import { loadPdfJsDocument } from '../pdfRenderer';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export interface OcrProgress {
  currentPage: number;
  totalPages: number;
  percent: number;
  status: string;
}

export interface OcrResult {
  fullText: string;
  pageTexts: { pageNumber: number; text: string; confidence: number }[];
  searchablePdfBytes: Uint8Array;
}

/**
 * Performs client-side Optical Character Recognition on scanned PDF pages
 * and creates a searchable/selectable PDF document.
 */
export async function performPdfOcr(
  buffer: ArrayBuffer,
  language = 'eng',
  onProgress?: (progress: OcrProgress) => void
): Promise<OcrResult> {
  const pdf = await loadPdfJsDocument(buffer);
  const totalPages = pdf.numPages;

  const worker = await createWorker(language);

  const pageTexts: { pageNumber: number; text: string; confidence: number }[] = [];
  const allTexts: string[] = [];

  const outDoc = await PDFDocument.create();
  const font = await outDoc.embedFont(StandardFonts.Helvetica);

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    if (onProgress) {
      onProgress({
        currentPage: pageNum,
        totalPages,
        percent: Math.round(((pageNum - 1) / totalPages) * 100),
        status: `Recognizing text on page ${pageNum} of ${totalPages}...`,
      });
    }

    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('Could not get canvas context for OCR');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport }).promise;

    // Run Tesseract OCR on rendered canvas image
    const { data } = await worker.recognize(canvas);
    const text = data.text || '';
    const confidence = Math.round(data.confidence || 0);

    pageTexts.push({ pageNumber: pageNum, text, confidence });
    allTexts.push(`--- Page ${pageNum} ---\n${text}`);

    // Create searchable PDF page with background image + text
    const imgDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    const imgBytes = await (await fetch(imgDataUrl)).arrayBuffer();
    const embeddedImg = await outDoc.embedJpg(imgBytes);

    const pdfPage = outDoc.addPage([page.view[2], page.view[3]]);
    pdfPage.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width: page.view[2],
      height: page.view[3],
    });

    // Draw lines of recognized text (selectable overlay)
    const lines = text.split('\n');
    let lineY = page.view[3] - 40;
    for (const line of lines) {
      const clean = line.trim();
      if (!clean) continue;
      if (lineY < 30) break;

      pdfPage.drawText(clean.slice(0, 80), {
        x: 40,
        y: lineY,
        size: 9,
        font,
        color: rgb(0, 0, 0),
        opacity: 0.01, // Near invisible selectable text layer overlay
      });
      lineY -= 14;
    }

    canvas.width = 0;
    canvas.height = 0;
  }

  await worker.terminate();

  if (onProgress) {
    onProgress({
      currentPage: totalPages,
      totalPages,
      percent: 100,
      status: 'OCR processing complete!',
    });
  }

  const searchablePdfBytes = await outDoc.save();

  return {
    fullText: allTexts.join('\n\n'),
    pageTexts,
    searchablePdfBytes,
  };
}
