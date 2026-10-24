'use client';

import React, { useState } from 'react';
import { Wrench, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { Dropzone } from '@/components/Dropzone';
import { readFileAsArrayBuffer, downloadBlob, openBlobInNewTab, formatBytes } from '@/lib/pdf/pdfUtils';
import { repairPdf, RepairDiagnostics } from '@/lib/pdf/repairEngine';

export default function RepairPage() {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [diagnostics, setDiagnostics] = useState<RepairDiagnostics | null>(null);

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
      setDiagnostics(null);
    } catch (err: any) {
      setError(`Failed to read file: ${err.message}`);
    }
  };

  const handleRepair = async () => {
    if (!buffer) return;
    setIsProcessing(true);
    setError(null);

    try {
      const { pdfBytes, diagnostics: diag } = await repairPdf(buffer);
      setOutputBytes(pdfBytes);
      setDiagnostics(diag);
    } catch (err: any) {
      setError(`Repair failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const outFilename = file ? `repaired_${file.name}` : 'repaired_document.pdf';

  return (
    <ToolLayout
      title="Repair PDF"
      description="Repair a damaged PDF and recover data from corrupt files. Fix broken headers, cross-reference tables, and object streams."
      icon={<Wrench size={28} />}
      iconBgColor="bg-green-50 dark:bg-green-950/60"
      iconTextColor="text-green-600 dark:text-green-400"
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
                setDiagnostics(null);
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
            title="Drop your damaged PDF here to repair"
            subtitle="Analyzes and reconstructs corrupted PDF byte structures"
          />
        </div>
      ) : (
        <div className="max-w-xl mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div className="text-center">
            <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-950/60 text-green-600 flex items-center justify-center mx-auto mb-3">
              <Wrench size={22} />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
              File Ready for Analysis & Repair
            </h3>
            <p className="text-xs text-slate-500">
              {file.name} ({formatBytes(file.size)})
            </p>
          </div>

          <button
            onClick={handleRepair}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm shadow-lg shadow-green-500/25 transition-all cursor-pointer"
          >
            <Wrench size={18} />
            <span>Analyze & Reconstruct PDF</span>
          </button>
        </div>
      )}
    </ToolLayout>
  );
}
