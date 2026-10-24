import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';

export interface TextWatermarkOptions {
  type: 'text';
  text: string;
  fontSize?: number;
  colorHex?: string;      // e.g. '#999999' or '#EF4444'
  opacity?: number;       // 0.1 to 1.0
  rotationDegrees?: number; // default 45
  position?: 'center' | 'top' | 'bottom' | 'diagonal';
  targetPages?: number[]; // 0-based page indices, or empty for all
}

export interface ImageWatermarkOptions {
  type: 'image';
  imageBuffer: ArrayBuffer;
  imageFormat: 'png' | 'jpg';
  scale?: number;         // 0.1 to 1.0
  opacity?: number;
  position?: 'center' | 'top-right' | 'bottom-right';
  targetPages?: number[];
}

export type WatermarkOptions = TextWatermarkOptions | ImageWatermarkOptions;

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 0.5, g: 0.5, b: 0.5 };
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255,
  };
}

/**
 * Applies text or image watermark to PDF pages
 */
export async function applyWatermark(
  buffer: ArrayBuffer,
  options: WatermarkOptions
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(buffer.slice(0), { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  let embeddedImage: any = null;
  if (options.type === 'image') {
    if (options.imageFormat === 'png') {
      embeddedImage = await pdfDoc.embedPng(options.imageBuffer);
    } else {
      embeddedImage = await pdfDoc.embedJpg(options.imageBuffer);
    }
  }

  pages.forEach((page, index) => {
    if (options.targetPages && options.targetPages.length > 0 && !options.targetPages.includes(index)) {
      return;
    }

    const { width, height } = page.getSize();

    if (options.type === 'text') {
      const text = options.text || 'CONFIDENTIAL';
      const fontSize = options.fontSize || 48;
      const opacity = options.opacity !== undefined ? options.opacity : 0.3;
      const rotation = options.rotationDegrees !== undefined ? options.rotationDegrees : 45;
      const rgbColor = hexToRgb(options.colorHex || '#64748b');

      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const textHeight = font.heightAtSize(fontSize);

      let x = (width - textWidth) / 2;
      let y = (height - textHeight) / 2;

      if (options.position === 'top') {
        y = height - textHeight - 40;
      } else if (options.position === 'bottom') {
        y = 40;
      }

      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(rgbColor.r, rgbColor.g, rgbColor.b),
        opacity,
        rotate: degrees(rotation),
      });
    } else if (options.type === 'image' && embeddedImage) {
      const scale = options.scale || 0.4;
      const imgWidth = embeddedImage.width * scale;
      const imgHeight = embeddedImage.height * scale;
      const opacity = options.opacity !== undefined ? options.opacity : 0.4;

      let x = (width - imgWidth) / 2;
      let y = (height - imgHeight) / 2;

      if (options.position === 'top-right') {
        x = width - imgWidth - 30;
        y = height - imgHeight - 30;
      } else if (options.position === 'bottom-right') {
        x = width - imgWidth - 30;
        y = 30;
      }

      page.drawImage(embeddedImage, {
        x,
        y,
        width: imgWidth,
        height: imgHeight,
        opacity,
      });
    }
  });

  return await pdfDoc.save();
}
