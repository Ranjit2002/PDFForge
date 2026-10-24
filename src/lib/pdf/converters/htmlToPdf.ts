import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/**
 * Converts raw HTML string into a formatted PDF document
 */
export async function convertHtmlStringToPdf(htmlString: string, title = 'Webpage Document'): Promise<Uint8Array> {
  // Parse HTML into text and basic block structures in browser
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');

  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 45;
  const contentWidth = pageWidth - margin * 2;

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let currentY = pageHeight - margin;

  // Header banner
  currentPage.drawText(title, {
    x: margin,
    y: currentY,
    size: 20,
    font: fontBold,
    color: rgb(0.1, 0.2, 0.4),
  });
  currentY -= 35;

  // Walk elements (headings, paragraphs, list items)
  const elements = doc.querySelectorAll('h1, h2, h3, h4, p, li, blockquote');

  if (elements.length === 0) {
    const bodyText = doc.body?.innerText || 'No readable text found in HTML.';
    currentPage.drawText(bodyText.slice(0, 500), {
      x: margin,
      y: currentY,
      size: 11,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
    });
  }

  elements.forEach((el) => {
    const tag = el.tagName.toLowerCase();
    const text = (el.textContent || '').trim();
    if (!text) return;

    let fontSize = 11;
    let font = fontRegular;
    let lineHeight = 16;
    let color = rgb(0.2, 0.2, 0.2);

    if (tag === 'h1') {
      fontSize = 17;
      font = fontBold;
      lineHeight = 24;
      color = rgb(0.1, 0.15, 0.3);
      currentY -= 10;
    } else if (tag === 'h2') {
      fontSize = 14;
      font = fontBold;
      lineHeight = 20;
      color = rgb(0.15, 0.2, 0.35);
      currentY -= 8;
    } else if (tag === 'h3') {
      fontSize = 12;
      font = fontBold;
      lineHeight = 18;
      currentY -= 6;
    } else if (tag === 'li') {
      lineHeight = 16;
    }

    // Wrap words
    const words = (tag === 'li' ? `•  ${text}` : text).split(' ');
    let currentLine = '';

    for (const word of words) {
      const test = currentLine ? `${currentLine} ${word}` : word;
      const w = font.widthOfTextAtSize(test, fontSize);

      if (w > contentWidth && currentLine) {
        if (currentY < margin + lineHeight) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          currentY = pageHeight - margin;
        }

        currentPage.drawText(currentLine, {
          x: margin,
          y: currentY,
          size: fontSize,
          font,
          color,
        });
        currentY -= lineHeight;
        currentLine = word;
      } else {
        currentLine = test;
      }
    }

    if (currentLine) {
      if (currentY < margin + lineHeight) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        currentY = pageHeight - margin;
      }

      currentPage.drawText(currentLine, {
        x: margin,
        y: currentY,
        size: fontSize,
        font,
        color,
      });
      currentY -= lineHeight + 4;
    }
  });

  return await pdfDoc.save();
}
