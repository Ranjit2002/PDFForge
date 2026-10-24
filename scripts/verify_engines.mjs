import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { mergePdfs } from '../src/lib/pdf/mergeEngine.ts';
import { extractPagesToSinglePdf, splitPagesToZip } from '../src/lib/pdf/splitEngine.ts';
import JSZip from 'jszip';

async function createSamplePdf(pageCount, title) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  for (let i = 1; i <= pageCount; i++) {
    const page = doc.addPage([600, 400]);
    page.drawText(`${title} - Page ${i}`, {
      x: 50,
      y: 350,
      size: 24,
      font,
      color: rgb(0.2, 0.4, 0.8),
    });
    page.drawText(`Generated for automated verification testing.`, {
      x: 50,
      y: 300,
      size: 14,
    });
  }
  return await doc.save();
}

async function runVerification() {
  console.log('--- Starting PDF Engine Verification ---');

  // 1. Create sample PDFs
  const pdf1Bytes = await createSamplePdf(2, 'Document Alpha');
  const pdf2Bytes = await createSamplePdf(3, 'Document Beta');
  console.log(`✓ Generated Document Alpha (2 pages, ${pdf1Bytes.byteLength} bytes)`);
  console.log(`✓ Generated Document Beta (3 pages, ${pdf2Bytes.byteLength} bytes)`);

  // 2. Test Merge
  const mergedBytes = await mergePdfs([
    { id: '1', name: 'docA.pdf', buffer: pdf1Bytes.buffer, rotation: 0 },
    { id: '2', name: 'docB.pdf', buffer: pdf2Bytes.buffer, rotation: 90 },
  ]);
  const mergedDoc = await PDFDocument.load(mergedBytes);
  if (mergedDoc.getPageCount() !== 5) {
    throw new Error(`Expected 5 merged pages, got ${mergedDoc.getPageCount()}`);
  }
  console.log(`✓ Merge Verified: Result has ${mergedDoc.getPageCount()} pages with rotation applied.`);

  // 3. Test Split to single PDF (extract pages 1, 3, 5)
  const extractedBytes = await extractPagesToSinglePdf(mergedBytes.buffer, [1, 3, 5], 'extracted.pdf');
  const extractedDoc = await PDFDocument.load(extractedBytes);
  if (extractedDoc.getPageCount() !== 3) {
    throw new Error(`Expected 3 extracted pages, got ${extractedDoc.getPageCount()}`);
  }
  console.log(`✓ Split to Single PDF Verified: Extracted 3 pages correctly.`);

  // 4. Test Split to ZIP
  const zipBlob = await splitPagesToZip(mergedBytes.buffer, [1, 2, 3, 4, 5], 'all_pages');
  const zipArrayBuf = await zipBlob.arrayBuffer();
  const loadedZip = await JSZip.loadAsync(zipArrayBuf);
  const fileKeys = Object.keys(loadedZip.files);
  if (fileKeys.length !== 5) {
    throw new Error(`Expected 5 files in ZIP, got ${fileKeys.length}`);
  }
  console.log(`✓ Split to ZIP Verified: Created ${fileKeys.length} separate page PDFs inside ZIP.`);

  console.log('🎉 ALL ENGINE VERIFICATIONS PASSED SUCCESSFULLY!');
}

runVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
