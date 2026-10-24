'use client';

import React, { useState } from 'react';
import { Crop as CropIcon, ArrowRight, Check } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { Dropzone } from '@/components/Dropzone';
import { readFileAsArrayBuffer, downloadBlob, openBlobInNewTab, formatBytes } from '@/lib/pdf/pdfUtils';
import { cropPdf, CropMargins } from '@/lib/pdf/cropEngine';
import { renderPageThumbnail } from '@/lib/pdf/pdfRenderer';

export default function CropPage() {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [margins, setMargins] = useState<CropMargins>({
    topPercent: 10,
    bottomPercent: 10,
    leftPercent: 10,
    rightPercent: 10,
  });
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

      const thumb = await renderPageThumbnail(arrayBuf, 1, 360);
      setThumbnailUrl(thumb);
    } catch (err: any) {
      setError(`Failed to read file: ${err.message}`);
    }
  };

  const handleCrop = async () => {
    if (!buffer) return;
    setIsProcessing(true);
    setError(null);

    try {
      const cropped = await cropPdf(buffer, margins);
      setOutputBytes(cropped);
    } catch (err: any) {
      setError(`Crop failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const outFilename = file ? `cropped_${file.name}` : 'cropped_document.pdf';

  return (
    <ToolLayout
      title="Crop PDF"
      description="Crop margins of PDF documents or select specific margins to apply across all pages."
      icon={<CropIcon size={28} />}
      iconBgColor="bg-fuchsia-50 dark:bg-fuchsia-950/60"
      iconTextColor="text-fuchsia-600 dark:text-fuchsia-400"
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
            accept=".pdf,application/pdf"
            maxFiles={1}
            title="Drop your PDF here to crop"
            subtitle="Trim margins and white space with visual guides"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Controls Panel */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Margin Crop Settings (% from edges)
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Top Margin</span>
                  <span className="text-fuchsia-600 font-bold">{margins.topPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={margins.topPercent}
                  onChange={(e) => setMargins({ ...margins, topPercent: Number(e.target.value) })}
                  className="w-full accent-fuchsia-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Bottom Margin</span>
                  <span className="text-fuchsia-600 font-bold">{margins.bottomPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={margins.bottomPercent}
                  onChange={(e) => setMargins({ ...margins, bottomPercent: Number(e.target.value) })}
                  className="w-full accent-fuchsia-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Left Margin</span>
                  <span className="text-fuchsia-600 font-bold">{margins.leftPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={margins.leftPercent}
                  onChange={(e) => setMargins({ ...margins, leftPercent: Number(e.target.value) })}
                  className="w-full accent-fuchsia-600"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Right Margin</span>
                  <span className="text-fuchsia-600 font-bold">{margins.rightPercent}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={margins.rightPercent}
                  onChange={(e) => setMargins({ ...margins, rightPercent: Number(e.target.value) })}
                  className="w-full accent-fuchsia-600"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMargins({ topPercent: 5, bottomPercent: 5, leftPercent: 5, rightPercent: 5 })}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Preset: 5% Trim
              </button>
              <button
                type="button"
                onClick={() => setMargins({ topPercent: 10, bottomPercent: 10, leftPercent: 10, rightPercent: 10 })}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Preset: 10% Trim
              </button>
              <button
                type="button"
                onClick={() => setMargins({ topPercent: 0, bottomPercent: 0, leftPercent: 0, rightPercent: 0 })}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Reset
              </button>
            </div>

            <button
              onClick={handleCrop}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-fuchsia-600 hover:from-fuchsia-500 hover:to-pink-500 text-white font-bold text-sm shadow-lg shadow-fuchsia-500/25 transition-all cursor-pointer"
            >
              <CropIcon size={18} />
              <span>Crop PDF Document</span>
            </button>
          </div>

          {/* Live Preview Box */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Live Crop Boundary Preview
            </h4>

            {thumbnailUrl && (
              <div className="relative inline-block border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden max-w-[280px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumbnailUrl} alt="Page preview" className="w-full h-auto block" />

                {/* Shaded margin overlays */}
                <div
                  className="absolute top-0 left-0 right-0 bg-fuchsia-500/30 border-b border-fuchsia-500 border-dashed pointer-events-none"
                  style={{ height: `${margins.topPercent}%` }}
                />
                <div
                  className="absolute bottom-0 left-0 right-0 bg-fuchsia-500/30 border-t border-fuchsia-500 border-dashed pointer-events-none"
                  style={{ height: `${margins.bottomPercent}%` }}
                />
                <div
                  className="absolute top-0 bottom-0 left-0 bg-fuchsia-500/30 border-r border-fuchsia-500 border-dashed pointer-events-none"
                  style={{ width: `${margins.leftPercent}%` }}
                />
                <div
                  className="absolute top-0 bottom-0 right-0 bg-fuchsia-500/30 border-l border-fuchsia-500 border-dashed pointer-events-none"
                  style={{ width: `${margins.rightPercent}%` }}
                />
              </div>
            )}
            <p className="text-[11px] text-slate-400 mt-4 text-center">
              The highlighted shaded area will be cropped away from all pages.
            </p>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
