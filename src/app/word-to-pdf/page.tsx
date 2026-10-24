'use client';

import React, { useState } from 'react';
import { FileText, ArrowRight, Download, CheckCircle2 } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { Dropzone } from '@/components/Dropzone';
import { readFileAsArrayBuffer, downloadBlob, openBlobInNewTab, formatBytes } from '@/lib/pdf/pdfUtils';
import { convertWordToPdf } from '@/lib/pdf/converters/wordToPdf';

export default function WordToPdfPage() {
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
      setError(`Failed to read Word document: ${err.message}`);
    }
  };

  const handleConvert = async () => {
    if (!buffer) return;
    setIsProcessing(true);
    setError(null);

    try {
      const pdfBytes = await convertWordToPdf(buffer);
      setOutputBytes(pdfBytes);
    } catch (err: any) {
      setError(`Conversion to PDF failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const outFilename = file ? `${file.name.replace(/\.(docx|doc)$/i, '')}.pdf` : 'converted_document.pdf';

  return (
    <ToolLayout
      title="Word to PDF"
      description="Make DOC and DOCX files easy to read and share by converting them directly into standard PDF documents."
      icon={<FileText size={28} />}
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
            accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
            maxFiles={1}
            title="Drop your Word (.docx) file here to convert to PDF"
            subtitle="Formats headings, paragraphs, and styling into print-ready PDF"
          />
        </div>
      ) : (
        <div className="max-w-md mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 flex items-center justify-center mx-auto shadow-sm">
            <FileText size={30} />
          </div>

          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">
              Word Document Loaded
            </h3>
            <p className="text-xs text-slate-500">
              {file.name} ({formatBytes(file.size)})
            </p>
          </div>

          <button
            onClick={handleConvert}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
          >
            <span>Convert to PDF</span>
            <ArrowRight size={18} />
          </button>
        </div>
      )}
    </ToolLayout>
  );
}
