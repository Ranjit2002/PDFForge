'use client';

import React, { useState } from 'react';
import { ScanLine, Download, Copy, Check, ArrowRight } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { Dropzone } from '@/components/Dropzone';
import { readFileAsArrayBuffer, downloadBlob, openBlobInNewTab, formatBytes } from '@/lib/pdf/pdfUtils';
import { performPdfOcr, OcrResult, OcrProgress } from '@/lib/pdf/ai/ocrEngine';

export default function OcrPage() {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [language, setLanguage] = useState('eng');

  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [copied, setCopied] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setError(null);
    try {
      const arrayBuf = await readFileAsArrayBuffer(selected);
      setFile(selected);
      setBuffer(arrayBuf);
      setOcrResult(null);
    } catch (err: any) {
      setError(`Failed to read file: ${err.message}`);
    }
  };

  const handleStartOcr = async () => {
    if (!buffer) return;
    setIsProcessing(true);
    setError(null);

    try {
      const result = await performPdfOcr(buffer, language, (p: OcrProgress) => {
        setProgressPercent(p.percent);
        setProgressStatus(p.status);
      });
      setOcrResult(result);
    } catch (err: any) {
      setError(`OCR failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyText = () => {
    if (!ocrResult) return;
    navigator.clipboard.writeText(ocrResult.fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const outFilename = file ? `${file.name.replace(/\.pdf$/i, '')}_searchable.pdf` : 'searchable_ocr.pdf';

  return (
    <ToolLayout
      title="OCR PDF"
      description="Easily convert scanned PDFs into searchable, selectable documents using client-side optical character recognition."
      icon={<ScanLine size={28} />}
      iconBgColor="bg-emerald-50 dark:bg-emerald-950/60"
      iconTextColor="text-emerald-600 dark:text-emerald-400"
      isProcessing={isProcessing}
      progressPercent={progressPercent}
      progressStatus={progressStatus}
      error={error}
      successResult={
        ocrResult
          ? {
              filename: outFilename,
              filesize: formatBytes(ocrResult.searchablePdfBytes.byteLength),
              onDownload: () => downloadBlob(ocrResult.searchablePdfBytes, outFilename),
              onOpenInNewTab: () => openBlobInNewTab(ocrResult.searchablePdfBytes, outFilename),
              onReset: () => {
                setFile(null);
                setBuffer(null);
                setOcrResult(null);
              },
            }
          : null
      }
    >
      {!file ? (
        <div className="max-w-2xl mx-auto">
          <Dropzone
            onFilesSelected={handleFilesSelected}
            accept=".pdf,application/pdf"
            maxFiles={1}
            title="Drop your scanned PDF here to run OCR"
            subtitle="Client-side OCR recognizes text in English, Spanish, French, German and more"
          />
        </div>
      ) : (
        <div className="max-w-xl mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <ScanLine size={22} />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
              Configure OCR Recognition
            </h3>
            <p className="text-xs text-slate-500">
              {file.name} ({formatBytes(file.size)})
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Document Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold"
            >
              <option value="eng">English</option>
              <option value="spa">Spanish (Español)</option>
              <option value="fra">French (Français)</option>
              <option value="deu">German (Deutsch)</option>
              <option value="ita">Italian (Italiano)</option>
              <option value="por">Portuguese (Português)</option>
            </select>
          </div>

          <button
            onClick={handleStartOcr}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
          >
            <ScanLine size={18} />
            <span>Start Optical Character Recognition</span>
          </button>
        </div>
      )}
    </ToolLayout>
  );
}
