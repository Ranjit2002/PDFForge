'use client';

import React, { useState } from 'react';
import { Code2, Copy, Download, Check, ArrowRight } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { Dropzone } from '@/components/Dropzone';
import { readFileAsArrayBuffer, downloadBlob, formatBytes } from '@/lib/pdf/pdfUtils';
import { convertPdfToMarkdown } from '@/lib/pdf/converters/pdfToMarkdown';

export default function PdfToMarkdownPage() {
  const [file, setFile] = useState<File | null>(null);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setError(null);
    setMarkdown(null);
    setIsProcessing(true);

    try {
      const arrayBuf = await readFileAsArrayBuffer(selected);
      setFile(selected);

      const mdText = await convertPdfToMarkdown(arrayBuf);
      setMarkdown(mdText);
    } catch (err: any) {
      setError(`Failed to extract markdown: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    if (!markdown) return;
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!markdown) return;
    const filename = file ? `${file.name.replace(/\.pdf$/i, '')}.md` : 'document.md';
    downloadBlob(markdown, filename);
  };

  return (
    <ToolLayout
      title="PDF to Markdown"
      description="Easily turn PDFs into Markdown files. Perfect for notes, docs, and LLMs. Headings, tables, lists, and links preserved automatically."
      badge="New!"
      icon={<Code2 size={28} />}
      iconBgColor="bg-indigo-50 dark:bg-indigo-950/60"
      iconTextColor="text-indigo-600 dark:text-indigo-400"
      isProcessing={isProcessing}
      error={error}
    >
      {!markdown ? (
        <div className="max-w-2xl mx-auto">
          <Dropzone
            onFilesSelected={handleFilesSelected}
            accept=".pdf,application/pdf"
            maxFiles={1}
            title="Drop your PDF here to convert to Markdown"
            subtitle="Converts headings, bullets, and tables into clean GitHub Flavored Markdown"
          />
        </div>
      ) : (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Header Action Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">{file?.name}</h3>
              <p className="text-xs text-slate-500">{markdown.split(/\s+/).length} words extracted</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={copyToClipboard}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                <span>{copied ? 'Copied!' : 'Copy Markdown'}</span>
              </button>

              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/25 transition-all cursor-pointer"
              >
                <Download size={14} />
                <span>Download .md</span>
              </button>

              <button
                onClick={() => {
                  setFile(null);
                  setMarkdown(null);
                }}
                className="text-xs text-slate-400 hover:text-slate-600 px-2 cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Markdown Content Viewer */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
            <textarea
              readOnly
              value={markdown}
              rows={20}
              className="w-full font-mono text-xs sm:text-sm leading-relaxed bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 focus:outline-none text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
