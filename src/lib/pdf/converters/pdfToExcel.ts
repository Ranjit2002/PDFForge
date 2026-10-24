import * as XLSX from 'xlsx';
import { loadPdfJsDocument } from '../pdfRenderer';

/**
 * Converts a PDF document into an Excel spreadsheet (.xlsx)
 * extracting tables and tabular data
 */
export async function convertPdfToExcel(buffer: ArrayBuffer): Promise<Uint8Array> {
  const pdf = await loadPdfJsDocument(buffer);
  const totalPages = pdf.numPages;
  const workbook = XLSX.utils.book_new();

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const items = textContent.items as any[];

    if (items.length === 0) continue;

    // Group items into rows by Y coordinate (within 8pt threshold)
    const sorted = [...items].sort((a, b) => b.transform[5] - a.transform[5]);
    const rowBuckets: { y: number; items: any[] }[] = [];

    for (const item of sorted) {
      const y = item.transform[5];
      let foundBucket = rowBuckets.find(b => Math.abs(b.y - y) <= 6);
      if (!foundBucket) {
        foundBucket = { y, items: [] };
        rowBuckets.push(foundBucket);
      }
      foundBucket.items.push(item);
    }

    // Sort rows top-down, and within each row sort columns left-right
    rowBuckets.sort((a, b) => b.y - a.y);
    const sheetData: string[][] = [];

    for (const bucket of rowBuckets) {
      bucket.items.sort((a, b) => a.transform[4] - b.transform[4]);
      
      // Cluster items into columns based on horizontal gap
      const rowCells: string[] = [];
      let currentCellText = '';
      let prevX = -999;
      let prevWidth = 0;

      for (const item of bucket.items) {
        const x = item.transform[4];
        const gap = x - (prevX + prevWidth);

        if (prevX !== -999 && gap > 20) {
          // Significant gap => new column cell
          rowCells.push(currentCellText.trim());
          currentCellText = item.str;
        } else {
          currentCellText += (currentCellText ? ' ' : '') + item.str;
        }

        prevX = x;
        prevWidth = item.width || 10;
      }

      if (currentCellText.trim()) {
        rowCells.push(currentCellText.trim());
      }

      if (rowCells.length > 0) {
        sheetData.push(rowCells);
      }
    }

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    const sheetName = `Page ${pageNum}`;
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  }

  // If no sheets were added (empty PDF), add an empty default sheet
  if (workbook.SheetNames.length === 0) {
    const emptySheet = XLSX.utils.aoa_to_sheet([['No data extracted']]);
    XLSX.utils.book_append_sheet(workbook, emptySheet, 'Sheet1');
  }

  const excelBytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(excelBytes);
}
