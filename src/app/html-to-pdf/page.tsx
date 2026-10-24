'use client';

import React, { useState } from 'react';
import { Globe, FileCode, ArrowRight, Download, CheckCircle2 } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { Dropzone } from '@/components/Dropzone';
import { downloadBlob, openBlobInNewTab, formatBytes } from '@/lib/pdf/pdfUtils';
import { convertHtmlStringToPdf } from '@/lib/pdf/converters/htmlToPdf';

export default function HtmlToPdfPage() {
  const [mode, setMode] = useState<'url' | 'code'>('url');
  const [url, setUrl] = useState('https://en.wikipedia.org/wiki/Portable_Document_Format');
  const [htmlCode, setHtmlCode] = useState(
    '<h1>Weekly Executive Report</h1>\n<p>This document was rendered directly from HTML into PDF.</p>\n<ul>\n  <li>100% Client-side validation</li>\n  <li>Custom styling and typography</li>\n</ul>'
  );

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputBytes, setOutputBytes] = useState<Uint8Array | null>(null);

  const handleConvert = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      let finalHtml = '';
      let title = 'webpage_document.pdf';

      if (mode === 'url') {
        if (!url || !url.startsWith('http')) {
          throw new Error('Please enter a valid URL starting with http:// or https://');
        }

        const res = await fetch('/api/html-to-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch webpage content');
        }

        finalHtml = data.html;
        title = `${data.title || 'webpage'}.pdf`;
      } else {
        finalHtml = htmlCode;
        title = 'html_document.pdf';
      }

      const pdfBytes = await convertHtmlStringToPdf(finalHtml, title);
      setOutputBytes(pdfBytes);
    } catch (err: any) {
      setError(`HTML to PDF conversion failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const outFilename = mode === 'url' ? 'webpage_render.pdf' : 'html_render.pdf';

  return (
    <ToolLayout
      title="HTML to PDF"
      description="Convert webpages in HTML to PDF. Copy and paste the URL of the page you want or enter HTML markup directly."
      icon={<Globe size={28} />}
      iconBgColor="bg-yellow-50 dark:bg-yellow-950/60"
      iconTextColor="text-amber-500"
      isProcessing={isProcessing}
      error={error}
      successResult={
        outputBytes
          ? {
              filename: outFilename,
              filesize: formatBytes(outputBytes.byteLength),
              onDownload: () => downloadBlob(outputBytes, outFilename),
              onOpenInNewTab: () => openBlobInNewTab(outputBytes, outFilename),
              onReset: () => {
                setOutputBytes(null);
              },
            }
          : null
      }
    >
      <div className="max-w-xl mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
        {/* Mode Selector */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              mode === 'url'
                ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Globe size={14} />
            <span>Webpage URL</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('code')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              mode === 'code'
                ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <FileCode size={14} />
            <span>HTML Markup / Paste</span>
          </button>
        </div>

        {mode === 'url' ? (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Target Webpage URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              Secure SSRF protected against private and internal networks.
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Raw HTML Code
            </label>
            <textarea
              rows={7}
              value={htmlCode}
              onChange={(e) => setHtmlCode(e.target.value)}
              className="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        )}

        <button
          onClick={handleConvert}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-sm shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
        >
          <span>Convert to PDF</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </ToolLayout>
  );
}
