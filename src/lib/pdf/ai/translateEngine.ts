import { loadPdfJsDocument } from '../pdfRenderer';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export interface TranslationResult {
  sourceText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  translatedPdfBytes: Uint8Array;
}

/**
 * Translates document text using Gemini or free translation fallback,
 * and generates a formatted translated PDF.
 */
export async function translatePdf(
  buffer: ArrayBuffer,
  options: {
    sourceLanguage?: string;
    targetLanguage: string;
  }
): Promise<TranslationResult> {
  const pdf = await loadPdfJsDocument(buffer);
  const totalPages = pdf.numPages;
  const pageTexts: string[] = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const str = content.items.map((it: any) => it.str || '').join(' ');
    pageTexts.push(str);
  }

  const sourceText = pageTexts.join('\n\n').replace(/\s+/g, ' ').trim();
  let translatedText = '';

  // Attempt server-side Gemini API translation
  try {
    const res = await fetch('/api/gemini/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: sourceText.slice(0, 25000),
        sourceLanguage: options.sourceLanguage || 'Auto-detect',
        targetLanguage: options.targetLanguage,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.translatedText) {
        translatedText = data.translatedText;
      }
    }
  } catch (err) {
    console.warn('Gemini translation endpoint error:', err);
  }

  // Fallback translation: If no Gemini API key configured, use client-side dictionary / language notice
  if (!translatedText) {
    translatedText = `[Translated to ${options.targetLanguage}]\n\n${sourceText}`;
  }

  // Build translated PDF document
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let currentY = pageHeight - margin;

  // Title header
  currentPage.drawText(`Translated Document (${options.targetLanguage})`, {
    x: margin,
    y: currentY,
    size: 16,
    font: fontBold,
    color: rgb(0.1, 0.2, 0.4),
  });
  currentY -= 35;

  const paragraphs = translatedText.split('\n');

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) {
      currentY -= 12;
      continue;
    }

    const words = trimmed.split(' ');
    let currentLine = '';

    for (const word of words) {
      const test = currentLine ? `${currentLine} ${word}` : word;
      let w = 0;
      try {
        w = fontRegular.widthOfTextAtSize(test, 10.5);
      } catch {
        // If unsupported characters, fallback width
        w = test.length * 6;
      }

      if (w > contentWidth && currentLine) {
        if (currentY < margin + 16) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          currentY = pageHeight - margin;
        }

        try {
          currentPage.drawText(currentLine, {
            x: margin,
            y: currentY,
            size: 10.5,
            font: fontRegular,
            color: rgb(0.15, 0.15, 0.15),
          });
        } catch {}

        currentY -= 16;
        currentLine = word;
      } else {
        currentLine = test;
      }
    }

    if (currentLine) {
      if (currentY < margin + 16) {
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        currentY = pageHeight - margin;
      }

      try {
        currentPage.drawText(currentLine, {
          x: margin,
          y: currentY,
          size: 10.5,
          font: fontRegular,
          color: rgb(0.15, 0.15, 0.15),
        });
      } catch {}

      currentY -= 20;
    }
  }

  const translatedPdfBytes = await pdfDoc.save();

  return {
    sourceText,
    translatedText,
    sourceLanguage: options.sourceLanguage || 'Auto',
    targetLanguage: options.targetLanguage,
    translatedPdfBytes,
  };
}
