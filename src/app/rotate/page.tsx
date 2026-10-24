'use client';

import React, { useState } from 'react';
import { RotateCw, RotateCcw, ArrowRight } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { Dropzone } from '@/components/Dropzone';
import { readFileAsArrayBuffer, downloadBlob, openBlobInNewTab, formatBytes } from '@/lib/pdf/pdfUtils';
import { rotatePdf } from '@/lib/pdf/rotateEngine';
import { renderPageThumbnail } from '@/lib/pdf/pdfRenderer';
import { PDFDocument } from 'pdf-lib';

interface RotatePageItem {
  pageNumber: number;
  rotation: number;
  thumbnailUrl: string;
}

export default function RotatePage() {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [pages, setPages] = useState<RotatePageItem[]>([]);
  const [loadingThumbnails, setLoadingThumbnails] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputBytes, setOutputBytes] = useState<Uint8Array | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setError(null);
    setLoadingThumbnails(true);

    try {
      const arrayBuf = await readFileAsArrayBuffer(selected);
      setFile(selected);
      setBuffer(arrayBuf);
      setOutputBytes(null);

      const pdfDoc = await PDFDocument.load(arrayBuf.slice(0), { ignoreEncryption: true });
      const count = pdfDoc.getPageCount();

      const items: RotatePageItem[] = [];
      for (let i = 0; i < count; i++) {
        const thumb = await renderPageThumbnail(arrayBuf, i + 1, 200);
        items.push({
          pageNumber: i + 1,
          rotation: 0,
          thumbnailUrl: thumb,
        });
      }
      setPages(items);
    } catch (err: any) {
      setError(`Failed to read file: ${err.message}`);
    } finally {
      setLoadingThumbnails(false);
    }
  };

  const handleRotateAll = (angle: number) => {
    setPages((prev) =>
      prev.map((p) => ({
        ...p,
        rotation: (p.rotation + angle + 360) % 360,
      }))
    );
  };

  const handlePageRotate = (pageNumber: number) => {
    setPages((prev) =>
      prev.map((p) =>
        p.pageNumber === pageNumber
          ? { ...p, rotation: (p.rotation + 90) % 360 }
          : p
      )
    );
  };

  const handleApplyRotation = async () => {
    if (!buffer || !file) return;
    setIsProcessing(true);
    setError(null);

    try {
      const pageRotations: Record<number, number> = {};
      pages.forEach((p, idx) => {
        if (p.rotation !== 0) {
          pageRotations[idx] = p.rotation;
        }
      });

      const rotated = await rotatePdf(buffer, { pageRotations });
      setOutputBytes(rotated);
    } catch (err: any) {
      setError(`Rotation failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const outFilename = file ? `rotated_${file.name}` : 'rotated_document.pdf';

  return (
    <ToolLayout
      title="Rotate PDF"
      description="Rotate individual pages or the entire document by 90°, 180°, or 270° degrees."
      icon={<RotateCw size={28} />}
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
                setPages([]);
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
            title="Drop your PDF here to rotate"
            subtitle="Rotate all pages together or customize page by page"
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Actions Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">{file.name}</h3>
              <p className="text-xs text-slate-500">{formatBytes(file.size)} • {pages.length} pages</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRotateAll(-90)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Rotate All Left</span>
              </button>

              <button
                onClick={() => handleRotateAll(90)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                <RotateCw size={14} />
                <span>Rotate All Right</span>
              </button>

              <button
                onClick={handleApplyRotation}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-500/25 transition-all cursor-pointer"
              >
                <span>Save & Rotate</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Interactive Thumbnails */}
          {loadingThumbnails ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500">Loading page thumbnails...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {pages.map((p) => (
                <div
                  key={p.pageNumber}
                  className="group relative flex flex-col rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 shadow-sm"
                >
                  <div className="relative aspect-[3/4] bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.thumbnailUrl}
                      alt={`Page ${p.pageNumber}`}
                      className="object-contain w-full h-full transition-transform"
                      style={{ transform: `rotate(${p.rotation}deg)` }}
                    />
                    <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-bold">
                      {p.pageNumber}
                    </span>
                    {p.rotation !== 0 && (
                      <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-purple-600 text-white text-[9px] font-bold">
                        {p.rotation}°
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handlePageRotate(p.pageNumber)}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-950/60 text-slate-700 dark:text-slate-300 hover:text-purple-600 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <RotateCw size={12} />
                    <span>Rotate 90°</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
