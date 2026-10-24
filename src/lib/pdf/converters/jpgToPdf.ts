import { PDFDocument } from 'pdf-lib';

export interface ImageToPdfItem {
  buffer: ArrayBuffer;
  format: 'jpg' | 'png';
  name: string;
}

export interface JpgToPdfOptions {
  orientation?: 'auto' | 'portrait' | 'landscape';
  margins?: 'none' | 'small' | 'big';
  pageSize?: 'fit' | 'a4';
}

/**
 * Converts a list of JPG/PNG images into a cohesive PDF document
 */
export async function convertJpgToPdf(
  images: ImageToPdfItem[],
  options?: JpgToPdfOptions
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  const marginMap = {
    none: 0,
    small: 20,
    big: 40,
  };
  const margin = marginMap[options?.margins || 'none'];
  const isA4 = options?.pageSize === 'a4';

  for (const item of images) {
    let embeddedImg: any;
    if (item.format === 'png') {
      embeddedImg = await pdfDoc.embedPng(item.buffer);
    } else {
      embeddedImg = await pdfDoc.embedJpg(item.buffer);
    }

    const imgWidth = embeddedImg.width;
    const imgHeight = embeddedImg.height;

    let targetPageWidth = imgWidth + margin * 2;
    let targetPageHeight = imgHeight + margin * 2;

    if (isA4) {
      const a4Short = 595.28;
      const a4Long = 841.89;

      let isLandscape = false;
      if (options?.orientation === 'landscape') {
        isLandscape = true;
      } else if (options?.orientation === 'portrait') {
        isLandscape = false;
      } else {
        isLandscape = imgWidth > imgHeight;
      }

      targetPageWidth = isLandscape ? a4Long : a4Short;
      targetPageHeight = isLandscape ? a4Short : a4Long;

      const availWidth = targetPageWidth - margin * 2;
      const availHeight = targetPageHeight - margin * 2;

      const scale = Math.min(availWidth / imgWidth, availHeight / imgHeight);
      const drawWidth = imgWidth * scale;
      const drawHeight = imgHeight * scale;

      const drawX = margin + (availWidth - drawWidth) / 2;
      const drawY = margin + (availHeight - drawHeight) / 2;

      const page = pdfDoc.addPage([targetPageWidth, targetPageHeight]);
      page.drawImage(embeddedImg, {
        x: drawX,
        y: drawY,
        width: drawWidth,
        height: drawHeight,
      });
    } else {
      const page = pdfDoc.addPage([targetPageWidth, targetPageHeight]);
      page.drawImage(embeddedImg, {
        x: margin,
        y: margin,
        width: imgWidth,
        height: imgHeight,
      });
    }
  }

  return await pdfDoc.save();
}
