/**
 * PDF Utilities and helper functions
 */

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Parses page range string e.g. "1-4, 6, 8-10" into sorted unique 1-based page numbers
 */
export function parsePageRange(rangeStr: string, maxPages: number): number[] {
  if (!rangeStr || !rangeStr.trim()) return [];
  const parts = rangeStr.split(',').map(s => s.trim()).filter(Boolean);
  const pagesSet = new Set<number>();

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map(s => s.trim());
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(maxPages, Math.max(start, end));
        for (let i = min; i <= max; i++) {
          pagesSet.add(i);
        }
      }
    } else {
      const page = parseInt(part, 10);
      if (!isNaN(page) && page >= 1 && page <= maxPages) {
        pagesSet.add(page);
      }
    }
  }

  return Array.from(pagesSet).sort((a, b) => a - b);
}

/**
 * Creates a clean, safe Blob from Uint8Array, ArrayBuffer, string, or existing Blob
 */
export function createSafeBlob(data: Blob | Uint8Array | ArrayBuffer | string, filename: string): Blob {
  if (data instanceof Blob) return data;
  const lower = filename.toLowerCase();
  let mimeType = 'application/pdf';

  if (lower.endsWith('.zip')) {
    mimeType = 'application/zip';
  } else if (lower.endsWith('.docx')) {
    mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  } else if (lower.endsWith('.xlsx')) {
    mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  } else if (lower.endsWith('.pptx')) {
    mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
  } else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
    mimeType = 'image/jpeg';
  } else if (lower.endsWith('.png')) {
    mimeType = 'image/png';
  } else if (lower.endsWith('.md')) {
    mimeType = 'text/markdown;charset=utf-8';
  } else if (lower.endsWith('.txt')) {
    mimeType = 'text/plain;charset=utf-8';
  } else if (lower.endsWith('.html')) {
    mimeType = 'text/html;charset=utf-8';
  } else if (lower.endsWith('.json')) {
    mimeType = 'application/json';
  }

  if (typeof data === 'string') {
    return new Blob([data], { type: mimeType });
  }
  if (data instanceof ArrayBuffer) {
    return new Blob([data], { type: mimeType });
  }
  const safeArray = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  return new Blob([safeArray as any], { type: mimeType });
}

/**
 * Triggers a native browser file download into the Downloads directory
 * and returns the active Object URL.
 */
export function downloadBlob(blob: Blob | Uint8Array | ArrayBuffer | string, filename: string): string {
  const finalBlob = createSafeBlob(blob, filename);
  const url = URL.createObjectURL(finalBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.target = '_self';
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
  }, 200);

  // Keep Object URL active for 10 minutes so clicking download links/notifications
  // in Chrome/Edge never attempts to read a revoked blob URL!
  setTimeout(() => {
    try {
      URL.revokeObjectURL(url);
    } catch {}
  }, 600000);

  return url;
}

/**
 * Opens a PDF Blob directly in a new browser tab for immediate viewing
 */
export function openBlobInNewTab(blob: Blob | Uint8Array | ArrayBuffer | string, filename: string): void {
  const finalBlob = createSafeBlob(blob, filename);
  const url = URL.createObjectURL(finalBlob);
  window.open(url, '_blank', 'noopener,noreferrer');

  setTimeout(() => {
    try {
      URL.revokeObjectURL(url);
    } catch {}
  }, 600000);
}

/**
 * Reads a File or Blob as ArrayBuffer
 */
export function readFileAsArrayBuffer(file: File | Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as ArrayBuffer'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Validates whether an ArrayBuffer contains a valid PDF header
 */
export function isValidPdf(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 5) return false;
  const header = new Uint8Array(buffer.slice(0, 5));
  // %PDF- (0x25, 0x50, 0x44, 0x46, 0x2D)
  return header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46;
}
