import { loadPdfJsDocument } from '../pdfRenderer';

/**
 * Converts a PDF document into GitHub Flavored Markdown
 * preserving headings, lists, tables, and paragraphs
 */
export async function convertPdfToMarkdown(buffer: ArrayBuffer): Promise<string> {
  const pdf = await loadPdfJsDocument(buffer);
  const totalPages = pdf.numPages;
  const markdownBlocks: string[] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const items = textContent.items as any[];

    if (items.length === 0) continue;

    if (totalPages > 1) {
      markdownBlocks.push(`\n---\n*Page ${pageNum}*\n`);
    }

    // Sort items vertically (top to bottom), then horizontally (left to right)
    const sorted = [...items].sort((a, b) => {
      const yDiff = b.transform[5] - a.transform[5];
      if (Math.abs(yDiff) > 5) return yDiff;
      return a.transform[4] - b.transform[4];
    });

    // Group items into lines
    let currentY = sorted[0]?.transform[5] ?? 0;
    let currentLine: any[] = [];
    const lines: any[][] = [];

    for (const item of sorted) {
      if (Math.abs(item.transform[5] - currentY) > 6) {
        if (currentLine.length > 0) lines.push(currentLine);
        currentLine = [item];
        currentY = item.transform[5];
      } else {
        currentLine.push(item);
      }
    }
    if (currentLine.length > 0) lines.push(currentLine);

    // Process lines into Markdown blocks
    for (const line of lines) {
      const lineText = line.map(it => it.str).join(' ').trim();
      if (!lineText) continue;

      const maxFontHeight = Math.max(...line.map(it => it.height || 10));

      // Level 1 Heading
      if (maxFontHeight >= 20) {
        markdownBlocks.push(`\n# ${lineText}\n`);
      }
      // Level 2 Heading
      else if (maxFontHeight >= 15) {
        markdownBlocks.push(`\n## ${lineText}\n`);
      }
      // Level 3 Heading
      else if (maxFontHeight >= 13) {
        markdownBlocks.push(`\n### ${lineText}\n`);
      }
      // List items
      else if (/^([•\-\*]|\d+\.)\s+/.test(lineText)) {
        markdownBlocks.push(lineText);
      }
      // Standard paragraph line
      else {
        markdownBlocks.push(lineText);
      }
    }
  }

  return markdownBlocks.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
}
