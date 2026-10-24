'use client';

import React, { useState } from 'react';
import { Presentation, ArrowRight, Download, CheckCircle2 } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { Dropzone } from '@/components/Dropzone';
import { readFileAsArrayBuffer, downloadBlob, openBlobInNewTab, formatBytes } from '@/lib/pdf/pdfUtils';
import { convertPptxToPdf } from '@/lib/pdf/converters/pptxToPdf';

export default function PowerPointToPdfPage() {
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
      setError(`Failed to read PowerPoint file: ${err.message}`);
    }
  };

  const handleConvert = async () => {
    if (!buffer) return;
    setIsProcessing(true);
    setError(null);

    try {
      const pdfBytes = await convertPptxToPdf(buffer);
      setOutputBytes(pdfBytes);
    } catch (err: any) {
      setError(`PowerPoint to PDF failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const outFilename = file ? `${file.name.replace(/\.(pptx|ppt)$/i, '')}.pdf` : 'presentation.pdf';

  return (
    <ToolLayout
      title="PowerPoint to PDF"
      description="Make PPT and PPTX slideshows easy to view on any device by converting them into PDF slides."
      icon={<Presentation size={28} />}
      iconBgColor="bg-orange-50 dark:bg-orange-950/60"
      iconTextColor="text-orange-500"
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
            accept=".pptx,.ppt,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            maxFiles={1}
            title="Drop your PowerPoint (.pptx) file here"
            subtitle="Converts slide layouts and bullets into 16:9 PDF slides"
          />
        </div>
      ) : (
        <div className="max-w-md mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-950/80 text-orange-500 flex items-center justify-center mx-auto shadow-sm">
            <Presentation size={30} />
          </div>

          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">
              PowerPoint Presentation Loaded
            </h3>
            <p className="text-xs text-slate-500">
              {file.name} ({formatBytes(file.size)})
            </p>
          </div>

          <button
            onClick={handleConvert}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
          >
            <span>Convert to PDF Slides</span>
            <ArrowRight size={18} />
          </button>
        </div>
      )}
    </ToolLayout>
  );
}
