import { PDFDocument } from 'pdf-lib';
import { loadPdfJsDocument, renderPageToJpegBlob } from './pdfRenderer';

export type CompressionPreset = 'recommended' | 'extreme' | 'high' | 'custom';

export interface CompressConfig {
  scale: number; // 0.6 to 1.5
  quality: number; // 0.3 to 0.9
}

export const COMPRESSION_PRESETS: Record<Exclude<CompressionPreset, 'custom'>, CompressConfig & { label: string; description: string; expectedSavings: string }> = {
  recommended: {
    label: 'Recommended Compression',
    description: 'Optimal balance of crisp visual quality and substantial size reduction',
    expectedSavings: '~50% - 70% reduction',
    scale: 0.95,
    quality: 0.68,
  },
  extreme: {
    label: 'Extreme Compression',
    description: 'Maximum compression for strict email & portal upload limits',
    expectedSavings: '~70% - 90% reduction',
    scale: 0.75,
    quality: 0.45,
  },
  high: {
    label: 'High Quality (Mild)',
    description: 'Gentle compression retaining sharp text and detailed photos',
    expectedSavings: '~25% - 40% reduction',
    scale: 1.2,
    quality: 0.82,
  },
};

export interface CompressProgress {
  currentPage: number;
  totalPages: number;
  phase: 'analyzing' | 'compressing' | 'assembling' | 'finalizing';
  message: string;
}

export interface CompressResult {
  data: Uint8Array;
  originalSize: number;
  compressedSize: number;
  savedBytes: number;
  percentSaved: number;
}

/**
 * Compresses a PDF document using configurable raster optimization & object stream compression
 */
export async function compressPdf(
  buffer: ArrayBuffer,
  config: CompressConfig,
  onProgress?: (progress: CompressProgress) => void
): Promise<CompressResult> {
  const originalSize = buffer.byteLength;

  onProgress?.({
    currentPage: 0,
    totalPages: 1,
    phase: 'analyzing',
    message: 'Analyzing PDF structure and pages...',
  });

  // Load via pdfjs for rendering
  const pdfJsDoc = await loadPdfJsDocument(buffer);
  const totalPages = pdfJsDoc.numPages;

  // Create new PDF document
  const newPdf = await PDFDocument.create();

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    onProgress?.({
      currentPage: pageNum,
      totalPages,
      phase: 'compressing',
      message: `Compressing page ${pageNum} of ${totalPages}...`,
    });

    const page = await pdfJsDoc.getPage(pageNum);
    const { blob, width, height } = await renderPageToJpegBlob(
      page,
      config.scale,
      config.quality
    );

    const jpegBytes = new Uint8Array(await blob.arrayBuffer());
    const embeddedJpg = await newPdf.embedJpg(jpegBytes);

    // Maintain original unscaled aspect ratio points
    const unscaledViewport = page.getViewport({ scale: 1.0 });
    const newPage = newPdf.addPage([unscaledViewport.width, unscaledViewport.height]);

    newPage.drawImage(embeddedJpg, {
      x: 0,
      y: 0,
      width: unscaledViewport.width,
      height: unscaledViewport.height,
    });
  }

  onProgress?.({
    currentPage: totalPages,
    totalPages,
    phase: 'assembling',
    message: 'Applying object stream compression...',
  });

  const compressedData = await newPdf.save({
    useObjectStreams: true,
  });

  const compressedSize = compressedData.byteLength;
  const savedBytes = Math.max(0, originalSize - compressedSize);
  const percentSaved = Math.round((savedBytes / originalSize) * 100);

  onProgress?.({
    currentPage: totalPages,
    totalPages,
    phase: 'finalizing',
    message: 'Done!',
  });

  return {
    data: compressedData,
    originalSize,
    compressedSize,
    savedBytes,
    percentSaved,
  };
}
