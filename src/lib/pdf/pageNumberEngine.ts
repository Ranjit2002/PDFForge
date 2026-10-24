import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export type PageNumberPosition =
  | 'bottom-right'
  | 'bottom-center'
  | 'bottom-left'
  | 'top-right'
  | 'top-center'
  | 'top-left';

export interface PageNumberOptions {
  position: PageNumberPosition;
  format: 'Page {n} of {total}' | '{n} / {total}' | 'Page {n}' | '{n}';
  startPage?: number;   // 1-based page to begin numbering on (e.g. 2 to skip cover)
  startNumber?: number; // Starting number (e.g. 1)
  fontSize?: number;
  colorHex?: string;
  margin?: number;      // Points from edge (default 30)
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 0.2, g: 0.2, b: 0.2 };
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255,
  };
}

/**
 * Inserts formatted page numbers into PDF pages
 */
export async function addPageNumbers(
  buffer: ArrayBuffer,
  options: PageNumberOptions
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(buffer.slice(0), { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const pages = pdfDoc.getPages();
  const totalPages = pages.length;

  const startPage = options.startPage || 1;
  const startNumber = options.startNumber || 1;
  const fontSize = options.fontSize || 10;
  const margin = options.margin || 30;
  const rgbColor = hexToRgb(options.colorHex || '#475569');

  pages.forEach((page, index) => {
    const pageNum1Based = index + 1;
    if (pageNum1Based < startPage) {
      return; // Skip pages before startPage (e.g. cover page)
    }

    const currentNumber = startNumber + (pageNum1Based - startPage);
    let text = options.format
      .replace('{n}', currentNumber.toString())
      .replace('{total}', totalPages.toString());

    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const { width, height } = page.getSize();

    let x = width - margin - textWidth; // default bottom-right
    let y = margin;

    switch (options.position) {
      case 'bottom-left':
        x = margin;
        y = margin;
        break;
      case 'bottom-center':
        x = (width - textWidth) / 2;
        y = margin;
        break;
      case 'bottom-right':
        x = width - margin - textWidth;
        y = margin;
        break;
      case 'top-left':
        x = margin;
        y = height - margin - fontSize;
        break;
      case 'top-center':
        x = (width - textWidth) / 2;
        y = height - margin - fontSize;
        break;
      case 'top-right':
        x = width - margin - textWidth;
        y = height - margin - fontSize;
        break;
    }

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(rgbColor.r, rgbColor.g, rgbColor.b),
    });
  });

  return await pdfDoc.save();
}
