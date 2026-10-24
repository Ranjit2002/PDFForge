import { loadPdfJsDocument } from './pdfRenderer';

export interface PageDiff {
  pageNumber: number;
  doc1Text: string;
  doc2Text: string;
  addedLines: string[];
  removedLines: string[];
  unchangedLines: string[];
  similarityPercentage: number;
}

export interface DocumentComparisonResult {
  doc1Pages: number;
  doc2Pages: number;
  overallSimilarity: number;
  pageDiffs: PageDiff[];
  summary: {
    totalAddedLines: number;
    totalRemovedLines: number;
    identicalPagesCount: number;
    differentPagesCount: number;
  };
}

/**
 * Extracts plain text line-by-line for each page of a PDF using pdfjs
 */
async function extractPageTexts(buffer: ArrayBuffer): Promise<string[]> {
  const pdf = await loadPdfJsDocument(buffer);
  const pagesCount = pdf.numPages;
  const pageTexts: string[] = [];

  for (let i = 1; i <= pagesCount; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item: any) => item.str || '');
    pageTexts.push(strings.join(' ').replace(/\s+/g, ' ').trim());
  }

  return pageTexts;
}

/**
 * Compares two PDF documents textually and structurally
 */
export async function comparePdfs(
  doc1Buffer: ArrayBuffer,
  doc2Buffer: ArrayBuffer
): Promise<DocumentComparisonResult> {
  const [doc1Texts, doc2Texts] = await Promise.all([
    extractPageTexts(doc1Buffer),
    extractPageTexts(doc2Buffer),
  ]);

  const maxPages = Math.max(doc1Texts.length, doc2Texts.length);
  const pageDiffs: PageDiff[] = [];

  let totalAdded = 0;
  let totalRemoved = 0;
  let totalSimilarity = 0;
  let identicalCount = 0;

  for (let i = 0; i < maxPages; i++) {
    const text1 = doc1Texts[i] || '';
    const text2 = doc2Texts[i] || '';

    const lines1 = text1.split('. ').map(s => s.trim()).filter(Boolean);
    const lines2 = text2.split('. ').map(s => s.trim()).filter(Boolean);

    const set1 = new Set(lines1);
    const set2 = new Set(lines2);

    const addedLines = lines2.filter(line => !set1.has(line));
    const removedLines = lines1.filter(line => !set2.has(line));
    const unchangedLines = lines1.filter(line => set2.has(line));

    totalAdded += addedLines.length;
    totalRemoved += removedLines.length;

    // Jaccard similarity
    const intersection = unchangedLines.length;
    const union = lines1.length + lines2.length - intersection;
    const similarity = union === 0 ? 100 : Math.round((intersection / union) * 100);

    totalSimilarity += similarity;
    if (similarity === 100) identicalCount++;

    pageDiffs.push({
      pageNumber: i + 1,
      doc1Text: text1,
      doc2Text: text2,
      addedLines,
      removedLines,
      unchangedLines,
      similarityPercentage: similarity,
    });
  }

  const overallSimilarity = maxPages === 0 ? 100 : Math.round(totalSimilarity / maxPages);

  return {
    doc1Pages: doc1Texts.length,
    doc2Pages: doc2Texts.length,
    overallSimilarity,
    pageDiffs,
    summary: {
      totalAddedLines: totalAdded,
      totalRemovedLines: totalRemoved,
      identicalPagesCount: identicalCount,
      differentPagesCount: maxPages - identicalCount,
    },
  };
}
