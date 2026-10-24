import { Document, Paragraph, TextRun, HeadingLevel, Packer } from 'docx';
import { loadPdfJsDocument } from '../pdfRenderer';

/**
 * Converts a PDF document into an editable Microsoft Word (.docx) document
 */
export async function convertPdfToWord(buffer: ArrayBuffer): Promise<Blob> {
  const pdf = await loadPdfJsDocument(buffer);
  const totalPages = pdf.numPages;
  const docxParagraphs: Paragraph[] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const items = textContent.items as any[];

    if (pageNum > 1) {
      // Add page break before subsequent pages
      docxParagraphs.push(
        new Paragraph({
          children: [new TextRun({ text: `--- Page ${pageNum} ---`, italics: true, color: '888888' })],
          pageBreakBefore: true,
        })
      );
    }

    if (items.length === 0) continue;

    // Sort items by vertical position (Y descending, then X ascending)
    const sortedItems = [...items].sort((a, b) => {
      const yDiff = b.transform[5] - a.transform[5];
      if (Math.abs(yDiff) > 4) return yDiff;
      return a.transform[4] - b.transform[4];
    });

    // Group items into lines
    let currentY = sortedItems[0]?.transform[5] ?? 0;
    let currentLine: any[] = [];
    const lines: any[][] = [];

    for (const item of sortedItems) {
      if (Math.abs(item.transform[5] - currentY) > 6) {
        if (currentLine.length > 0) lines.push(currentLine);
        currentLine = [item];
        currentY = item.transform[5];
      } else {
        currentLine.push(item);
      }
    }
    if (currentLine.length > 0) lines.push(currentLine);

    // Build Word paragraphs
    for (const line of lines) {
      const lineText = line.map(it => it.str).join(' ').trim();
      if (!lineText) continue;

      // Detect if heading based on height/font size
      const maxFontHeight = Math.max(...line.map(it => it.height || 10));

      if (maxFontHeight > 20) {
        docxParagraphs.push(
          new Paragraph({
            text: lineText,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 },
          })
        );
      } else if (maxFontHeight > 14) {
        docxParagraphs.push(
          new Paragraph({
            text: lineText,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 180, after: 80 },
          })
        );
      } else {
        docxParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: lineText,
                size: Math.round(Math.max(18, maxFontHeight * 2)), // docx font size is in half-points
              }),
            ],
            spacing: { after: 100 },
          })
        );
      }
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docxParagraphs.length > 0
          ? docxParagraphs
          : [new Paragraph({ text: 'No text extracted from document.' })],
      },
    ],
  });

  return await Packer.toBlob(doc);
}
