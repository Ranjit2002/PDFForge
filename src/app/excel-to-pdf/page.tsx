'use client';

import React, { useState } from 'react';
import { Table, ArrowRight, Download, CheckCircle2 } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { Dropzone } from '@/components/Dropzone';
import { readFileAsArrayBuffer, downloadBlob, openBlobInNewTab, formatBytes } from '@/lib/pdf/pdfUtils';
import { convertExcelToPdf } from '@/lib/pdf/converters/excelToPdf';

export default function ExcelToPdfPage() {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
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
    } catch (err: any) {
      setError(`Failed to read Excel workbook: ${err.message}`);
    }
  };

  const handleConvert = async () => {
    if (!buffer) return;
    setIsProcessing(true);
    setError(null);

    try {
      const pdfBytes = await convertExcelToPdf(buffer);
      setOutputBytes(pdfBytes);
    } catch (err: any) {
      setError(`Excel to PDF failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const outFilename = file ? `${file.name.replace(/\.(xlsx|xls|csv)$/i, '')}.pdf` : 'spreadsheet.pdf';

  return (
    <ToolLayout
      title="Excel to PDF"
      description="Make EXCEL spreadsheets easy to read and distribute by converting rows and columns into clean tabular PDF pages."
      icon={<Table size={28} />}
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
            accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            maxFiles={1}
            title="Drop your Excel (.xlsx, .csv) file here"
            subtitle="Converts sheet tables and headers into structured landscape PDF"
          />
        </div>
      ) : (
        <div className="max-w-md mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-green-100 dark:bg-green-950/80 text-green-600 flex items-center justify-center mx-auto shadow-sm">
            <Table size={30} />
          </div>

          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">
              Spreadsheet Loaded
            </h3>
            <p className="text-xs text-slate-500">
              {file.name} ({formatBytes(file.size)})
            </p>
          </div>

          <button
            onClick={handleConvert}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold text-sm shadow-lg shadow-green-500/25 transition-all cursor-pointer"
          >
            <span>Convert to Tabular PDF</span>
            <ArrowRight size={18} />
          </button>
        </div>
      )}
    </ToolLayout>
  );
}
