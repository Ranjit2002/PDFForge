import * as XLSX from 'xlsx';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/**
 * Converts an Excel spreadsheet (.xlsx, .xls, .csv) into a styled tabular PDF
 */
export async function convertExcelToPdf(buffer: ArrayBuffer): Promise<Uint8Array> {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Landscape A4 for wide tables
  const pageWidth = 841.89; // pt
  const pageHeight = 595.28; // pt
  const margin = 40;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    if (data.length === 0) continue;

    let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    let currentY = pageHeight - margin;

    // Draw Sheet Title
    currentPage.drawText(`Sheet: ${sheetName}`, {
      x: margin,
      y: currentY,
      size: 16,
      font: fontBold,
      color: rgb(0.1, 0.2, 0.4),
    });
    currentY -= 30;

    // Determine max columns
    const maxCols = Math.min(10, Math.max(...data.map(row => row.length)));
    const colWidth = (pageWidth - margin * 2) / Math.max(1, maxCols);
    const rowHeight = 22;

    for (let r = 0; r < data.length; r++) {
      const row = data[r];
      const isHeader = r === 0;

      if (currentY < margin + rowHeight) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        currentY = pageHeight - margin;
      }

      // Draw row background for header or alternate rows
      if (isHeader) {
        currentPage.drawRectangle({
          x: margin,
          y: currentY - 5,
          width: pageWidth - margin * 2,
          height: rowHeight,
          color: rgb(0.9, 0.93, 0.98),
        });
      } else if (r % 2 === 1) {
        currentPage.drawRectangle({
          x: margin,
          y: currentY - 5,
          width: pageWidth - margin * 2,
          height: rowHeight,
          color: rgb(0.98, 0.98, 0.98),
        });
      }

      // Draw cells
      for (let c = 0; c < maxCols; c++) {
        const val = row[c] !== undefined && row[c] !== null ? String(row[c]) : '';
        const cellX = margin + c * colWidth;
        const font = isHeader ? fontBold : fontRegular;
        const fontSize = isHeader ? 9.5 : 8.5;

        // Truncate cell text if it overflows column width
        let displayText = val;
        while (displayText.length > 0 && font.widthOfTextAtSize(displayText, fontSize) > colWidth - 8) {
          displayText = displayText.slice(0, -1);
        }

        currentPage.drawText(displayText, {
          x: cellX + 4,
          y: currentY + 2,
          size: fontSize,
          font,
          color: isHeader ? rgb(0.1, 0.2, 0.4) : rgb(0.2, 0.2, 0.2),
        });
      }

      currentY -= rowHeight;
    }
  }

  // Fallback if workbook had no sheets
  if (pdfDoc.getPageCount() === 0) {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    page.drawText('Empty workbook', { x: margin, y: pageHeight - margin, size: 14, font: fontRegular });
  }

  return await pdfDoc.save();
}
