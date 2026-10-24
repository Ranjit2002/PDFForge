import mammoth from 'mammoth';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/**
 * Converts a Word document (.docx) into a PDF document
 */
export async function convertWordToPdf(buffer: ArrayBuffer): Promise<Uint8Array> {
  // Extract text and structure using mammoth
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  const rawText = result.value || 'Empty document';

  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28; // Standard A4 width in pt
  const pageHeight = 841.89; // Standard A4 height in pt
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2;

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let currentY = pageHeight - margin;

  const lines = rawText.split('\n');

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      currentY -= 14; // Blank line spacing
      if (currentY < margin + 20) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        currentY = pageHeight - margin;
      }
      continue;
    }

    // Check if line looks like a heading
    const isHeading = trimmed.length < 60 && !trimmed.endsWith('.') && (trimmed === trimmed.toUpperCase() || lines.indexOf(rawLine) === 0);
    const fontSize = isHeading ? 16 : 11;
    const font = isHeading ? fontBold : fontRegular;
    const lineHeight = isHeading ? 22 : 15;

    // Wrap words within contentWidth
    const words = trimmed.split(' ');
    let currentLineText = '';

    for (const word of words) {
      const testLine = currentLineText ? `${currentLineText} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (testWidth > contentWidth && currentLineText) {
        if (currentY < margin + lineHeight) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          currentY = pageHeight - margin;
        }

        currentPage.drawText(currentLineText, {
          x: margin,
          y: currentY,
          size: fontSize,
          font,
          color: rgb(0.1, 0.1, 0.1),
        });
        currentY -= lineHeight;
        currentLineText = word;
      } else {
        currentLineText = testLine;
      }
    }

    if (currentLineText) {
      if (currentY < margin + lineHeight) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        currentY = pageHeight - margin;
      }

      currentPage.drawText(currentLineText, {
        x: margin,
        y: currentY,
        size: fontSize,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
      currentY -= lineHeight;
    }
  }

  return await pdfDoc.save();
}
