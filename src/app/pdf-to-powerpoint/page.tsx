'use client';

import React, { useState } from 'react';
import { Presentation, ArrowRight, Download, CheckCircle2 } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { Dropzone } from '@/components/Dropzone';
import { readFileAsArrayBuffer, downloadBlob, formatBytes } from '@/lib/pdf/pdfUtils';
import { convertPdfToPptx } from '@/lib/pdf/converters/pdfToPptx';

export default function PdfToPowerPointPage() {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setError(null);
    try {
      const arrayBuf = await readFileAsArrayBuffer(selected);
      setFile(selected);
      setBuffer(arrayBuf);
      setOutputBlob(null);
    } catch (err: any) {
      setError(`Failed to read file: ${err.message}`);
    }
  };

  const handleConvert = async () => {
    if (!buffer) return;
    setIsProcessing(true);
    setError(null);

    try {
      const pptxBlob = await convertPdfToPptx(buffer);
      setOutputBlob(pptxBlob);
    } catch (err: any) {
      setError(`PowerPoint conversion failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const outFilename = file ? `${file.name.replace(/\.pdf$/i, '')}.pptx` : 'presentation.pptx';

  return (
    <ToolLayout
      title="PDF to PowerPoint"
      description="Turn your PDF files into easy to edit PPT and PPTX slideshows formatted for widescreen presentations."
      icon={<Presentation size={28} />}
      iconBgColor="bg-orange-50 dark:bg-orange-950/60"
      iconTextColor="text-orange-500"
      isProcessing={isProcessing}
      error={error}
      successResult={
        outputBlob
          ? {
              filename: outFilename,
              filesize: formatBytes(outputBlob.size),
              onDownload: () => downloadBlob(outputBlob, outFilename),
              onReset: () => {
                setFile(null);
                setBuffer(null);
                setOutputBlob(null);
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
            title="Drop your PDF here to convert to PowerPoint"
            subtitle="Transforms pages into presentation slides in PPTX format"
          />
        </div>
      ) : (
        <div className="max-w-md mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-950/80 text-orange-500 flex items-center justify-center mx-auto shadow-sm">
            <Presentation size={30} />
          </div>

          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">
              Ready for PowerPoint Conversion
            </h3>
            <p className="text-xs text-slate-500">
              {file.name} ({formatBytes(file.size)})
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 text-left space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span>Standard 16:9 widescreen layout</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span>Genuine .pptx format supported by PowerPoint & Google Slides</span>
            </div>
          </div>

          <button
            onClick={handleConvert}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition-all cursor-pointer"
          >
            <span>Convert to PPTX Slides</span>
            <ArrowRight size={18} />
          </button>
        </div>
      )}
    </ToolLayout>
  );
}
