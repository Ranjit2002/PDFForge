import JSZip from 'jszip';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/**
 * Converts a PowerPoint presentation (.pptx) into a PDF slideshow
 */
export async function convertPptxToPdf(buffer: ArrayBuffer): Promise<Uint8Array> {
  const zip = await JSZip.loadAsync(buffer);
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Landscape 16:9 slide dimensions
  const slideWidth = 960;
  const slideHeight = 540;

  // Find slide XML files (e.g. ppt/slides/slide1.xml, ppt/slides/slide2.xml)
  const slideFileNames = Object.keys(zip.files)
    .filter(name => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)![0], 10);
      const numB = parseInt(b.match(/\d+/)![0], 10);
      return numA - numB;
    });

  if (slideFileNames.length === 0) {
    // If no slide XML found, create a fallback slide
    const slide = pdfDoc.addPage([slideWidth, slideHeight]);
    slide.drawText('PowerPoint Presentation', {
      x: 80,
      y: slideHeight / 2,
      size: 28,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });
    return await pdfDoc.save();
  }

  for (let sIdx = 0; sIdx < slideFileNames.length; sIdx++) {
    const fileName = slideFileNames[sIdx];
    const xmlContent = await zip.files[fileName].async('text');

    // Extract text content from <a:t> tags
    const textMatches = Array.from(xmlContent.matchAll(/<a:t(?:\s[^>]*)?>([^<]*)<\/a:t>/gi)).map(m => m[1]);

    const slide = pdfDoc.addPage([slideWidth, slideHeight]);

    // Slide background & border decoration
    slide.drawRectangle({
      x: 0,
      y: 0,
      width: slideWidth,
      height: slideHeight,
      color: rgb(0.98, 0.98, 0.99),
    });

    slide.drawRectangle({
      x: 0,
      y: slideHeight - 8,
      width: slideWidth,
      height: 8,
      color: rgb(0.93, 0.35, 0.15), // PPT Orange theme header
    });

    // Draw Slide Number Footer
    slide.drawText(`Slide ${sIdx + 1} of ${slideFileNames.length}`, {
      x: slideWidth - 120,
      y: 25,
      size: 11,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.5),
    });

    let currentY = slideHeight - 80;
    let isTitle = true;

    for (const text of textMatches) {
      const clean = text.trim();
      if (!clean) continue;

      if (isTitle) {
        slide.drawText(clean, {
          x: 60,
          y: currentY,
          size: 26,
          font: fontBold,
          color: rgb(0.1, 0.15, 0.3),
        });
        currentY -= 45;
        isTitle = false;
      } else {
        if (currentY < 60) break; // Avoid bottom overflow
        slide.drawText(`•  ${clean}`, {
          x: 80,
          y: currentY,
          size: 16,
          font: fontRegular,
          color: rgb(0.2, 0.2, 0.2),
        });
        currentY -= 28;
      }
    }
  }

  return await pdfDoc.save();
}
