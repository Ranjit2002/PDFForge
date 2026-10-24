/**
 * Client-side PDF rendering utility using pdfjs-dist
 * Only executed in browser environment
 */

let pdfjsLibInstance: any = null;

export async function getPdfJs(): Promise<any> {
  if (typeof window === 'undefined') {
    throw new Error('PDF rendering is only supported in browser environment');
  }

  if (!pdfjsLibInstance) {
    const pdfjs = await import('pdfjs-dist');
    // Set worker source to CDN matching the exact version
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
    pdfjsLibInstance = pdfjs;
  }
  return pdfjsLibInstance;
}

/**
 * Loads a PDF document from ArrayBuffer
 */
export async function loadPdfJsDocument(buffer: ArrayBuffer): Promise<any> {
  const pdfjs = await getPdfJs();
  // Clone buffer slice so pdfjs worker transfer never detaches the source buffer
  const bufferCopy = buffer.slice(0);
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(bufferCopy),
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
    cMapPacked: true,
  });
  return await loadingTask.promise;
}

/**
 * Renders a specific page of a PDF document to a data URL thumbnail
 */
export async function renderPageThumbnail(
  pdfBuffer: ArrayBuffer,
  pageNumber: number,
  targetWidth = 260
): Promise<string> {
  const pdf = await loadPdfJsDocument(pdfBuffer);
  const page = await pdf.getPage(pageNumber);

  const initialViewport = page.getViewport({ scale: 1.0 });
  const scale = targetWidth / initialViewport.width;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: false });
  if (!context) {
    throw new Error('Could not get 2D canvas context');
  }

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  // Fill white background (PDFs with transparent backgrounds should be white)
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };

  await page.render(renderContext).promise;
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

  // Free resources
  canvas.width = 0;
  canvas.height = 0;
  return dataUrl;
}

/**
 * Renders a page to high-quality JPEG blob at a specified scale and JPEG compression quality
 */
export async function renderPageToJpegBlob(
  page: any,
  scale: number,
  quality: number
): Promise<{ blob: Blob; width: number; height: number }> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not get 2D canvas context');

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: context,
    viewport: viewport,
  }).promise;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to convert canvas to JPEG blob'));
          return;
        }
        const width = canvas.width;
        const height = canvas.height;
        canvas.width = 0;
        canvas.height = 0;
        resolve({ blob, width, height });
      },
      'image/jpeg',
      quality
    );
  });
}
