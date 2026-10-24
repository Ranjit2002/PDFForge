'use client';

import React, { useState } from 'react';
import { Hash, ArrowRight, Check } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { Dropzone } from '@/components/Dropzone';
import { readFileAsArrayBuffer, downloadBlob, openBlobInNewTab, formatBytes } from '@/lib/pdf/pdfUtils';
import { addPageNumbers, PageNumberPosition } from '@/lib/pdf/pageNumberEngine';
import { renderPageThumbnail } from '@/lib/pdf/pdfRenderer';

export default function PageNumbersPage() {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  const [position, setPosition] = useState<PageNumberPosition>('bottom-right');
  const [format, setFormat] = useState<'Page {n} of {total}' | '{n} / {total}' | 'Page {n}' | '{n}'>('Page {n} of {total}');
  const [startPage, setStartPage] = useState(1);
  const [startNumber, setStartNumber] = useState(1);
  const [fontSize, setFontSize] = useState(10);
  const [colorHex, setColorHex] = useState('#334155');

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

  const handleAddPageNumbers = async () => {
    if (!buffer) return;
    setIsProcessing(true);
    setError(null);

    try {
      const result = await addPageNumbers(buffer, {
        position,
        format,
        startPage,
        startNumber,
        fontSize,
        colorHex,
      });
      setOutputBytes(result);
    } catch (err: any) {
      setError(`Adding page numbers failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const outFilename = file ? `numbered_${file.name}` : 'numbered_document.pdf';

  const positionsList: { id: PageNumberPosition; label: string }[] = [
    { id: 'top-left', label: 'Top Left' },
    { id: 'top-center', label: 'Top Center' },
    { id: 'top-right', label: 'Top Right' },
    { id: 'bottom-left', label: 'Bottom Left' },
    { id: 'bottom-center', label: 'Bottom Center' },
    { id: 'bottom-right', label: 'Bottom Right' },
  ];

  return (
    <ToolLayout
      title="Page Numbers"
      description="Add customizable page numbers into PDFs with ease. Choose positions, formats, and typography."
      icon={<Hash size={28} />}
      iconBgColor="bg-purple-50 dark:bg-purple-950/60"
      iconTextColor="text-purple-600 dark:text-purple-400"
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
            title="Drop your PDF here to add page numbers"
            subtitle="Automated pagination with flexible placement"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Controls */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Placement & Format Settings
            </h3>

            {/* Position Grid Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Position on Page
              </label>
              <div className="grid grid-cols-3 gap-2">
                {positionsList.map((pos) => (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => setPosition(pos.id)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      position === pos.id
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Format Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Numbering Style
              </label>
              <select
                value={format}
                onChange={(e: any) => setFormat(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold"
              >
                <option value="Page {n} of {total}">Page 1 of 10</option>
                <option value="{n} / {total}">1 / 10</option>
                <option value="Page {n}">Page 1</option>
                <option value="{n}">1 (Simple)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">First Page to Number</label>
                <input
                  type="number"
                  min="1"
                  value={startPage}
                  onChange={(e) => setStartPage(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold"
                />
                <span className="text-[10px] text-slate-400">Set to 2 to skip cover</span>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Starting Number</label>
                <input
                  type="number"
                  min="1"
                  value={startNumber}
                  onChange={(e) => setStartNumber(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold"
                />
              </div>
            </div>

            <button
              onClick={handleAddPageNumbers}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-500/25 transition-all cursor-pointer"
            >
              <Hash size={18} />
              <span>Apply Page Numbers</span>
            </button>
          </div>

          {/* Sample Preview */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Position Sample
            </h4>

            {thumbnailUrl && (
              <div className="relative inline-block border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden max-w-[280px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumbnailUrl} alt="Page preview" className="w-full h-auto block" />

                <div
                  className={`absolute px-2 py-0.5 rounded text-[11px] font-bold bg-purple-600 text-white shadow-md ${
                    position === 'top-left'
                      ? 'top-2 left-2'
                      : position === 'top-center'
                      ? 'top-2 left-1/2 -translate-x-1/2'
                      : position === 'top-right'
                      ? 'top-2 right-2'
                      : position === 'bottom-left'
                      ? 'bottom-2 left-2'
                      : position === 'bottom-center'
                      ? 'bottom-2 left-1/2 -translate-x-1/2'
                      : 'bottom-2 right-2'
                  }`}
                >
                  {format.replace('{n}', '1').replace('{total}', '10')}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
