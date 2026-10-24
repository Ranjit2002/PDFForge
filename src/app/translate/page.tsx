'use client';

import React, { useState } from 'react';
import { Languages, Download, Copy, Check, ArrowRight, ExternalLink } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { Dropzone } from '@/components/Dropzone';
import { readFileAsArrayBuffer, downloadBlob, openBlobInNewTab, formatBytes } from '@/lib/pdf/pdfUtils';
import { translatePdf, TranslationResult } from '@/lib/pdf/ai/translateEngine';

export default function TranslatePage() {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);

  const [sourceLang, setSourceLang] = useState('Auto-detect');
  const [targetLang, setTargetLang] = useState('Spanish');

  const [result, setResult] = useState<TranslationResult | null>(null);
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

  const handleTranslate = async () => {
    if (!buffer) return;
    setIsProcessing(true);
    setError(null);

    try {
      const transResult = await translatePdf(buffer, {
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
      });
      setResult(transResult);
    } catch (err: any) {
      setError(`Translation failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const outFilename = file ? `${file.name.replace(/\.pdf$/i, '')}_translated.pdf` : 'translated_document.pdf';

  return (
    <ToolLayout
      title="Translate PDF"
      description="Easily translate PDF files powered by AI. Convert documents into your desired language while preserving layout."
      badge="New!"
      icon={<Languages size={28} />}
      iconBgColor="bg-purple-50 dark:bg-purple-950/60"
      iconTextColor="text-purple-600 dark:text-purple-400"
      isProcessing={isProcessing}
      error={error}
      successResult={
        result
          ? {
              filename: outFilename,
              filesize: formatBytes(result.translatedPdfBytes.byteLength),
              onDownload: () => downloadBlob(result.translatedPdfBytes, outFilename),
              onOpenInNewTab: () => openBlobInNewTab(result.translatedPdfBytes, outFilename),
              onReset: () => {
                setFile(null);
                setBuffer(null);
                setResult(null);
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
            title="Drop your PDF here to translate"
            subtitle="Translates documents while preserving structure and generating translated PDF"
          />
        </div>
      ) : (
        <div className="max-w-xl mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center mx-auto mb-3">
              <Languages size={22} />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
              Select Translation Languages
            </h3>
            <p className="text-xs text-slate-500">
              {file.name} ({formatBytes(file.size)})
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                From Language
              </label>
              <select
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold"
              >
                <option value="Auto-detect">Auto-detect</option>
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Italian">Italian</option>
                <option value="Portuguese">Portuguese</option>
                <option value="Chinese">Chinese</option>
                <option value="Japanese">Japanese</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                To Language
              </label>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold"
              >
                <option value="Spanish">Spanish (Español)</option>
                <option value="English">English</option>
                <option value="French">French (Français)</option>
                <option value="German">German (Deutsch)</option>
                <option value="Italian">Italian (Italiano)</option>
                <option value="Portuguese">Portuguese (Português)</option>
                <option value="Japanese">Japanese (日本語)</option>
                <option value="Chinese">Chinese (中文)</option>
                <option value="Hindi">Hindi (हिन्दी)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleTranslate}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-500/25 transition-all cursor-pointer"
          >
            <Languages size={18} />
            <span>Translate & Generate PDF</span>
          </button>
        </div>
      )}
    </ToolLayout>
  );
}
