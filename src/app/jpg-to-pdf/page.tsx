'use client';

import React, { useState } from 'react';
import { Image as ImageIcon, ArrowRight, Download, CheckCircle2, Trash2 } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { Dropzone } from '@/components/Dropzone';
import { readFileAsArrayBuffer, downloadBlob, openBlobInNewTab, formatBytes } from '@/lib/pdf/pdfUtils';
import { convertJpgToPdf, ImageToPdfItem } from '@/lib/pdf/converters/jpgToPdf';

export default function JpgToPdfPage() {
  const [images, setImages] = useState<ImageToPdfItem[]>([]);
  const [orientation, setOrientation] = useState<'auto' | 'portrait' | 'landscape'>('auto');
  const [pageSize, setPageSize] = useState<'fit' | 'a4'>('fit');
  const [margins, setMargins] = useState<'none' | 'small' | 'big'>('none');

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputBytes, setOutputBytes] = useState<Uint8Array | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    setError(null);
    try {
      const items: ImageToPdfItem[] = [];
      for (const file of files) {
        const buffer = await readFileAsArrayBuffer(file);
        const format = file.type.includes('png') ? 'png' : 'jpg';
        items.push({ buffer, format, name: file.name });
      }
      setImages((prev) => [...prev, ...items]);
      setOutputBytes(null);
    } catch (err: any) {
      setError(`Failed to read images: ${err.message}`);
    }
  };

  const handleConvert = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    setError(null);

    try {
      const pdfBytes = await convertJpgToPdf(images, {
        orientation,
        pageSize,
        margins,
      });
      setOutputBytes(pdfBytes);
    } catch (err: any) {
      setError(`Conversion failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const outFilename = images.length > 0 ? `${images[0].name.replace(/\.(jpe?g|png)$/i, '')}_images.pdf` : 'images.pdf';

  return (
    <ToolLayout
      title="JPG to PDF"
      description="Convert JPG and PNG images to PDF in seconds. Easily adjust orientation, margins, and page sizing."
      icon={<ImageIcon size={28} />}
      iconBgColor="bg-amber-50 dark:bg-amber-950/60"
      iconTextColor="text-amber-500"
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
                setImages([]);
                setOutputBytes(null);
              },
            }
          : null
      }
    >
      {images.length === 0 ? (
        <div className="max-w-2xl mx-auto">
          <Dropzone
            onFilesSelected={handleFilesSelected}
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            maxFiles={50}
            title="Drop JPG or PNG images here"
            subtitle="Combine multiple images into a single cohesive PDF"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Controls */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              PDF Formatting Settings
            </h3>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Page Orientation
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['auto', 'portrait', 'landscape'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setOrientation(opt)}
                    className={`py-2 rounded-xl text-xs font-bold capitalize border cursor-pointer transition-colors ${
                      orientation === opt
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/50 text-amber-600'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Page Size
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPageSize('fit')}
                  className={`py-2 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
                    pageSize === 'fit'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/50 text-amber-600'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Fit Image Size
                </button>
                <button
                  type="button"
                  onClick={() => setPageSize('a4')}
                  className={`py-2 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
                    pageSize === 'a4'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/50 text-amber-600'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Standard A4 Page
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Page Margins
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['none', 'small', 'big'] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setMargins(opt)}
                    className={`py-2 rounded-xl text-xs font-bold capitalize border cursor-pointer transition-colors ${
                      margins === opt
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/50 text-amber-600'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleConvert}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-bold text-sm shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
            >
              <span>Convert {images.length} Images to PDF</span>
              <ArrowRight size={18} />
            </button>
          </div>

          {/* Selected Images List */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Uploaded Images ({images.length})
              </h4>
              <button
                type="button"
                onClick={() => setImages([])}
                className="text-xs text-red-500 hover:underline cursor-pointer"
              >
                Clear all
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {images.map((img, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                >
                  <span className="font-semibold truncate max-w-[220px]">{img.name}</span>
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                    className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
