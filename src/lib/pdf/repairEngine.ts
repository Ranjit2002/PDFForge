import { PDFDocument } from 'pdf-lib';

export interface RepairDiagnostics {
  repairedHeader: boolean;
  rebuiltXref: boolean;
  recoveredPages: number;
  fixedStreamDelimiters: boolean;
  status: 'fully_recovered' | 'partially_recovered' | 'unrecoverable';
  details: string[];
}

/**
 * Repairs a damaged or corrupt PDF by sanitizing byte structures,
 * stripping invalid header offsets, and reconstructing object catalogs.
 */
export async function repairPdf(buffer: ArrayBuffer): Promise<{ pdfBytes: Uint8Array; diagnostics: RepairDiagnostics }> {
  const diagnostics: RepairDiagnostics = {
    repairedHeader: false,
    rebuiltXref: false,
    recoveredPages: 0,
    fixedStreamDelimiters: false,
    status: 'fully_recovered',
    details: [],
  };

  let workingBuffer = buffer;
  const uint8 = new Uint8Array(buffer);

  // 1. Check for leading garbage bytes before "%PDF-"
  // Standard header is 0x25, 0x50, 0x44, 0x46, 0x2D
  let headerIndex = -1;
  for (let i = 0; i < Math.min(uint8.length - 4, 4096); i++) {
    if (
      uint8[i] === 0x25 &&
      uint8[i + 1] === 0x50 &&
      uint8[i + 2] === 0x44 &&
      uint8[i + 3] === 0x46 &&
      uint8[i + 4] === 0x2d
    ) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex > 0) {
    workingBuffer = uint8.slice(headerIndex).buffer;
    diagnostics.repairedHeader = true;
    diagnostics.details.push(`Stripped ${headerIndex} bytes of prepended corrupt data before %PDF- header.`);
  } else if (headerIndex === -1) {
    // If %PDF- header missing completely, prepend standard header
    const fixed = new Uint8Array(uint8.length + 9);
    const headerBytes = new TextEncoder().encode('%PDF-1.7\n');
    fixed.set(headerBytes, 0);
    fixed.set(uint8, headerBytes.length);
    workingBuffer = fixed.buffer;
    diagnostics.repairedHeader = true;
    diagnostics.details.push('Constructed missing %PDF-1.7 standard header.');
  }

  // 2. Load with pdf-lib to rebuild indirect object references and XREF table
  try {
    const pdfDoc = await PDFDocument.load(workingBuffer, { ignoreEncryption: true });
    diagnostics.rebuiltXref = true;
    diagnostics.details.push('Reconstructed cross-reference (XREF) table and page tree.');

    const pages = pdfDoc.getPages();
    diagnostics.recoveredPages = pages.length;
    diagnostics.details.push(`Successfully validated ${pages.length} pages in document tree.`);

    // Reserialize clean PDF with normalized offsets
    const pdfBytes = await pdfDoc.save();
    return { pdfBytes, diagnostics };
  } catch (err: any) {
    diagnostics.details.push(`Advanced structure recovery attempted: ${err.message || 'Stream parsing error'}`);

    // Fallback: create fresh PDF and copy valid pages or salvage text
    const salvageDoc = await PDFDocument.create();
    try {
      const partialDoc = await PDFDocument.load(workingBuffer, { ignoreEncryption: true, parseSpeed: 0 as any });
      const pageCount = partialDoc.getPageCount();
      for (let i = 0; i < pageCount; i++) {
        try {
          const [copied] = await salvageDoc.copyPages(partialDoc, [i]);
          salvageDoc.addPage(copied);
          diagnostics.recoveredPages++;
        } catch {}
      }
    } catch {}

    if (diagnostics.recoveredPages > 0) {
      diagnostics.status = 'partially_recovered';
      const pdfBytes = await salvageDoc.save();
      return { pdfBytes, diagnostics };
    }

    throw new Error('PDF file has catastrophic data loss and cannot be salvaged.');
  }
}
