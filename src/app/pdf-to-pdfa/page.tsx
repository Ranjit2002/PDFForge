'use client';

import React, { useState } from 'react';
import { Archive, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { Dropzone } from '@/components/Dropzone';
import { readFileAsArrayBuffer, downloadBlob, openBlobInNewTab, formatBytes } from '@/lib/pdf/pdfUtils';
import { convertToPdfA, PdfaValidationReport } from '@/lib/pdf/pdfaEngine';

export default function PdfToPdfaPage() {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [standard, setStandard] = useState<'PDF/A-1b' | 'PDF/A-2b'>('PDF/A-1b');
  const [report, setReport] = useState<PdfaValidationReport | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputBytes, setOutputBytes] = useState<Uint8Array | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setError(null);
    try {
      const arrayBuf = await readFileAsArrayBuffer(selected);
      setFile(selected);
      setBuffer(arrayBuf);
      setOutputBytes(null);
      setReport(null);
    } catch (err: any) {
      setError(`Failed to read file: ${err.message}`);
    }
  };

  const handleConvert = async () => {
    if (!buffer) return;
    setIsProcessing(true);
    setError(null);

    try {
      const { pdfBytes, report: rep } = await convertToPdfA(buffer, { standard });
      setOutputBytes(pdfBytes);
      setReport(rep);
    } catch (err: any) {
      setError(`PDF/A conversion failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const outFilename = file ? `${file.name.replace(/\.pdf$/i, '')}_pdfa.pdf` : 'archival_document.pdf';

  return (
    <ToolLayout
      title="PDF to PDF/A"
      description="Transform your PDF to PDF/A, the ISO-standardized version of PDF for long-term archiving and legal preservation."
      icon={<Archive size={28} />}
      iconBgColor="bg-blue-50 dark:bg-blue-950/60"
      iconTextColor="text-blue-600 dark:text-blue-400"
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
                setFile(null);
                setBuffer(null);
                setReport(null);
                setOutputBytes(null);
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
            title="Drop your PDF here to convert to PDF/A"
            subtitle="Converts to ISO 19005 standard with embedded XMP schemas"
          />
        </div>
      ) : (
        <div className="max-w-xl mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <Archive size={22} />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
              Select Archival Standard
            </h3>
            <p className="text-xs text-slate-500">
              {file.name} ({formatBytes(file.size)})
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Conformance Level
            </label>
            <select
              value={standard}
              onChange={(e: any) => setStandard(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold"
            >
              <option value="PDF/A-1b">PDF/A-1b (ISO 19005-1 Visual Conformance)</option>
              <option value="PDF/A-2b">PDF/A-2b (ISO 19005-2 Modern Archival)</option>
            </select>
          </div>

          <button
            onClick={handleConvert}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
          >
            <ShieldCheck size={18} />
            <span>Convert & Verify ISO Compliance</span>
          </button>
        </div>
      )}
    </ToolLayout>
  );
}
