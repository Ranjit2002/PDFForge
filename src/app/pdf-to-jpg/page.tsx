'use client';

import React, { useState } from 'react';
import { Image as ImageIcon, Download, FolderArchive, ArrowRight } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { Dropzone } from '@/components/Dropzone';
import { readFileAsArrayBuffer, downloadBlob, formatBytes } from '@/lib/pdf/pdfUtils';
import { convertPdfToJpg, PageJpegResult } from '@/lib/pdf/converters/pdfToJpg';

export default function PdfToJpgPage() {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [pages, setPages] = useState<PageJpegResult[]>([]);
  const [zipBlob, setZipBlob] = useState<Blob | null>(null);

  const [quality, setQuality] = useState(0.92);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setError(null);
    try {
      const arrayBuf = await readFileAsArrayBuffer(selected);
      setFile(selected);
      setBuffer(arrayBuf);
      setPages([]);
      setZipBlob(null);
    } catch (err: any) {
      setError(`Failed to read file: ${err.message}`);
    }
  };

  const handleConvert = async () => {
    if (!buffer) return;
    setIsProcessing(true);
    setError(null);

    try {
      const { pages: resPages, zipBlob: resZip } = await convertPdfToJpg(buffer, {
        quality,
        onProgress: (cur, tot) => {
          setProgressPercent(Math.round((cur / tot) * 100));
          setProgressStatus(`Rendering page ${cur} of ${tot} to JPEG...`);
        },
      });

      setPages(resPages);
      setZipBlob(resZip);
    } catch (err: any) {
      setError(`PDF to JPG conversion failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const outZipName = file ? `${file.name.replace(/\.pdf$/i, '')}_images.zip` : 'pdf_images.zip';

  return (
    <ToolLayout
      title="PDF to JPG"
      description="Convert each PDF page into a high-quality JPG image or download all pages packaged in a ZIP archive."
      icon={<ImageIcon size={28} />}
      iconBgColor="bg-amber-50 dark:bg-amber-950/60"
      iconTextColor="text-amber-500"
      isProcessing={isProcessing}
      progressPercent={progressPercent}
      progressStatus={progressStatus}
      error={error}
      successResult={
        zipBlob
          ? {
              filename: outZipName,
              filesize: formatBytes(zipBlob.size),
              onDownload: () => downloadBlob(zipBlob, outZipName),
              onReset: () => {
                setFile(null);
                setBuffer(null);
                setPages([]);
                setZipBlob(null);
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
            title="Drop your PDF here to convert to JPG"
            subtitle="Renders pages into crisp, high-resolution JPEG images"
          />
        </div>
      ) : (
        <div className="max-w-md mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-500 flex items-center justify-center mx-auto shadow-sm">
            <ImageIcon size={30} />
          </div>

          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">
              Ready for JPG Extraction
            </h3>
            <p className="text-xs text-slate-500">
              {file.name} ({formatBytes(file.size)})
            </p>
          </div>

          <div className="text-left space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span>JPEG Image Quality</span>
              <span className="font-bold text-amber-500">{Math.round(quality * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.6"
              max="1.0"
              step="0.05"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          <button
            onClick={handleConvert}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-sm shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
          >
            <span>Convert Pages to JPG Images</span>
            <ArrowRight size={18} />
          </button>
        </div>
      )}
    </ToolLayout>
  );
}
