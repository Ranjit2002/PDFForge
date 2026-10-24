import { loadPdfJsDocument } from '../pdfRenderer';

export type SummaryMode =
  | 'Executive Summary'
  | 'Key Bullet Points'
  | 'Action Items'
  | 'Short Abstract';

export interface SummarizeResult {
  summary: string;
  source: 'gemini-ai' | 'local-nlp';
  pageCount: number;
  wordCount: number;
}

/**
 * High-quality local NLP extractive summarizer algorithm
 */
function localExtractiveSummary(text: string, mode: SummaryMode): string {
  const sentences = text
    .split(/(?<=[.?!])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 25);

  if (sentences.length === 0) {
    return 'Document did not contain enough text for summarization.';
  }

  // Count word frequencies (excluding stop words)
  const stopWords = new Set([
    'the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'in', 'to', 'for', 'of', 'or', 'by', 'with',
    'this', 'that', 'from', 'it', 'as', 'are', 'be', 'was', 'have', 'has', 'not', 'we', 'you', 'they',
  ]);

  const words = text.toLowerCase().match(/[a-z]{3,}/g) || [];
  const freq: Record<string, number> = {};
  for (const w of words) {
    if (!stopWords.has(w)) {
      freq[w] = (freq[w] || 0) + 1;
    }
  }

  // Score sentences
  const scoredSentences = sentences.map((sentence, index) => {
    const sWords = sentence.toLowerCase().match(/[a-z]{3,}/g) || [];
    let score = 0;
    for (const sw of sWords) {
      score += freq[sw] || 0;
    }
    // Boost first sentence and early paragraphs
    if (index === 0) score *= 2.0;
    else if (index < 4) score *= 1.4;

    return { sentence, score: score / Math.max(1, sWords.length), index };
  });

  // Pick top sentences
  const sentenceCount = mode === 'Short Abstract' ? 3 : mode === 'Executive Summary' ? 5 : 7;
  const top = [...scoredSentences]
    .sort((a, b) => b.score - a.score)
    .slice(0, sentenceCount)
    .sort((a, b) => a.index - b.index);

  if (mode === 'Key Bullet Points' || mode === 'Action Items') {
    return top.map(item => `• ${item.sentence}`).join('\n\n');
  }

  return top.map(item => item.sentence).join(' ');
}

/**
 * Summarizes PDF text using Gemini API when available, or local semantic NLP
 */
export async function summarizePdf(
  buffer: ArrayBuffer,
  mode: SummaryMode = 'Executive Summary'
): Promise<SummarizeResult> {
  const pdf = await loadPdfJsDocument(buffer);
  const totalPages = pdf.numPages;
  const pageTexts: string[] = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const str = content.items.map((it: any) => it.str || '').join(' ');
    pageTexts.push(str);
  }

  const fullText = pageTexts.join('\n\n').replace(/\s+/g, ' ').trim();
  const wordCount = fullText.split(/\s+/).filter(Boolean).length;

  // Attempt server-side Gemini API summarization
  try {
    const res = await fetch('/api/gemini/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: fullText.slice(0, 30000), mode }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.summary) {
        return {
          summary: data.summary,
          source: 'gemini-ai',
          pageCount: totalPages,
          wordCount,
        };
      }
    }
  } catch (err) {
    console.warn('Gemini endpoint unreachable, falling back to local NLP engine:', err);
  }

  // Fallback to local NLP extractive summarizer
  const localSummary = localExtractiveSummary(fullText, mode);
  return {
    summary: localSummary,
    source: 'local-nlp',
    pageCount: totalPages,
    wordCount,
  };
}
