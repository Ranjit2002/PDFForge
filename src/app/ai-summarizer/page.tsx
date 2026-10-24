'use client';

import React, { useState } from 'react';
import { Sparkles, Copy, Download, Check, ArrowRight, BrainCircuit } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { Dropzone } from '@/components/Dropzone';
import { readFileAsArrayBuffer, downloadBlob, formatBytes } from '@/lib/pdf/pdfUtils';
import { summarizePdf, SummaryMode, SummarizeResult } from '@/lib/pdf/ai/summarizerEngine';

export default function AiSummarizerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [mode, setMode] = useState<SummaryMode>('Executive Summary');
  const [result, setResult] = useState<SummarizeResult | null>(null);
  const [copied, setCopied] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setError(null);
    try {
      const arrayBuf = await readFileAsArrayBuffer(selected);
      setFile(selected);
      setBuffer(arrayBuf);
      setResult(null);
    } catch (err: any) {
      setError(`Failed to read file: ${err.message}`);
    }
  };

  const handleSummarize = async () => {
    if (!buffer) return;
    setIsProcessing(true);
    setError(null);

    try {
      const res = await summarizePdf(buffer, mode);
      setResult(res);
    } catch (err: any) {
      setError(`Summarization failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const copySummary = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadSummary = () => {
    if (!result || !file) return;
    const filename = `${file.name.replace(/\.pdf$/i, '')}_summary.txt`;
    downloadBlob(result.summary, filename);
  };

  return (
    <ToolLayout
      title="AI Summarizer"
      description="Quickly generate concise summaries from articles, paragraphs, reports, and contracts, providing clear and precise key points in seconds."
      badge="New!"
      icon={<Sparkles size={28} />}
      iconBgColor="bg-indigo-50 dark:bg-indigo-950/60"
      iconTextColor="text-indigo-600 dark:text-indigo-400"
      isProcessing={isProcessing}
      error={error}
    >
      {!file ? (
        <div className="max-w-2xl mx-auto">
          <Dropzone
            onFilesSelected={handleFilesSelected}
            accept=".pdf,application/pdf"
            maxFiles={1}
            title="Drop your PDF here to generate an AI summary"
            subtitle="Analyzes key insights, executive abstracts, and action items"
          />
        </div>
      ) : (
        <div className="space-y-6 max-w-3xl mx-auto">
          {/* Controls Bar */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">{file.name}</h3>
                <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={mode}
                  onChange={(e: any) => setMode(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold"
                >
                  <option value="Executive Summary">Executive Summary</option>
                  <option value="Key Bullet Points">Key Bullet Points</option>
                  <option value="Action Items">Action Items</option>
                  <option value="Short Abstract">Short Abstract</option>
                </select>

                <button
                  onClick={handleSummarize}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-500/25 transition-all cursor-pointer"
                >
                  <Sparkles size={14} />
                  <span>Generate Summary</span>
                </button>
              </div>
            </div>
          </div>

          {/* Results Box */}
          {result && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 flex items-center gap-1">
                    <BrainCircuit size={13} />
                    <span>Engine: {result.source === 'gemini-ai' ? 'Gemini 2.5 Flash' : 'Local NLP Extractor'}</span>
                  </span>
                  <span className="text-xs text-slate-400">
                    {result.pageCount} pages • {result.wordCount} words analyzed
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={copySummary}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                  >
                    {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={downloadSummary}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Download TXT</span>
                  </button>
                </div>
              </div>

              <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans">
                {result.summary}
              </div>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
