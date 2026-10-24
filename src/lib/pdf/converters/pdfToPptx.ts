import pptxgen from 'pptxgenjs';
import { loadPdfJsDocument } from '../pdfRenderer';

/**
 * Converts a PDF document into a PowerPoint (.pptx) presentation
 */
export async function convertPdfToPptx(buffer: ArrayBuffer): Promise<Blob> {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';

  const pdf = await loadPdfJsDocument(buffer);
  const totalPages = pdf.numPages;

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 2.0 });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: ctx, viewport }).promise;

      const dataUrl = canvas.toDataURL('image/png', 0.95);
      const slide = pptx.addSlide();

      // Fit slide dimensions nicely in 16x9 presentation (10 x 5.625 inches)
      slide.addImage({
        data: dataUrl,
        x: '5%',
        y: '5%',
        w: '90%',
        h: '90%',
        sizing: { type: 'contain', w: 9.0, h: 5.0 },
      });
    }

    // Clean up canvas
    canvas.width = 0;
    canvas.height = 0;
  }

  const out = await pptx.write({ outputType: 'blob' });
  return out as Blob;
}
