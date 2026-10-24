'use client';

import React, { useState, useEffect } from 'react';
import { Layers, ArrowLeft, ArrowRight, Trash2, Copy, RotateCw, Save } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { Dropzone } from '@/components/Dropzone';
import { readFileAsArrayBuffer, downloadBlob, openBlobInNewTab, formatBytes } from '@/lib/pdf/pdfUtils';
import { organizePdf, PageOrganizeItem } from '@/lib/pdf/organizeEngine';
import { renderPageThumbnail } from '@/lib/pdf/pdfRenderer';
import { PDFDocument } from 'pdf-lib';

interface ThumbnailCardItem extends PageOrganizeItem {
  thumbnailUrl: string;
}

export default function OrganizePage() {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [pages, setPages] = useState<ThumbnailCardItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingThumbnails, setLoadingThumbnails] = useState(false);
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

      const items: ThumbnailCardItem[] = [];
      for (let i = 0; i < count; i++) {
        const thumb = await renderPageThumbnail(arrayBuf, i + 1, 200);
        items.push({
          id: `page-${i}-${Math.random().toString(36).substring(2, 6)}`,
          sourcePageIndex: i,
          rotation: 0,
          thumbnailUrl: thumb,
        });
      }
      setPages(items);
    } catch (err: any) {
      setError(`Failed to read PDF: ${err.message}`);
    } finally {
      setLoadingThumbnails(false);
    }
  };

  const movePage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= pages.length) return;

    setPages((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const deletePage = (index: number) => {
    if (pages.length <= 1) {
      setError('A document must have at least one page remaining.');
      return;
    }
    setPages((prev) => prev.filter((_, i) => i !== index));
  };

  const duplicatePage = (index: number) => {
    setPages((prev) => {
      const target = prev[index];
      const copy = [...prev];
      copy.splice(index + 1, 0, {
        ...target,
        id: `page-${target.sourcePageIndex}-${Math.random().toString(36).substring(2, 6)}`,
      });
      return copy;
    });
  };

  const rotatePage = (index: number) => {
    setPages((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        rotation: (copy[index].rotation + 90) % 360,
      };
      return copy;
    });
  };

  const handleSave = async () => {
    if (!buffer || pages.length === 0) return;
    setIsProcessing(true);
    setError(null);

    try {
      const organizedBytes = await organizePdf(buffer, pages);
      setOutputBytes(organizedBytes);
    } catch (err: any) {
      setError(`Failed to organize PDF: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const outFilename = file ? `organized_${file.name}` : 'organized_document.pdf';

  return (
    <ToolLayout
      title="Organize PDF"
      description="Sort pages of your PDF file however you like. Delete pages, reorder them, or duplicate at your convenience."
      icon={<Layers size={28} />}
      iconBgColor="bg-red-50 dark:bg-red-950/60"
      iconTextColor="text-red-500"
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
            title="Drop your PDF here to organize"
            subtitle="Reorder, delete, and duplicate pages interactively"
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">{file.name}</h3>
              <p className="text-xs text-slate-500">{pages.length} pages in document</p>
            </div>

            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-500/25 transition-all cursor-pointer"
            >
              <Save size={14} />
              <span>Save & Export PDF</span>
            </button>
          </div>

          {loadingThumbnails ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500">Loading page previews...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {pages.map((p, idx) => (
                <div
                  key={p.id}
                  className="group relative flex flex-col rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="relative aspect-[3/4] bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.thumbnailUrl}
                      alt={`Page ${idx + 1}`}
                      className="object-contain w-full h-full transition-transform"
                      style={{ transform: `rotate(${p.rotation}deg)` }}
                    />
                    <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-bold">
                      {idx + 1}
                    </span>
                  </div>

                  {/* Page Controls */}
                  <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => movePage(idx, 'left')}
                      disabled={idx === 0}
                      title="Move Left"
                      className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                    >
                      <ArrowLeft size={13} />
                    </button>
                    <button
                      onClick={() => rotatePage(idx)}
                      title="Rotate 90°"
                      className="p-1 rounded text-slate-500 hover:text-purple-600 cursor-pointer"
                    >
                      <RotateCw size={13} />
                    </button>
                    <button
                      onClick={() => duplicatePage(idx)}
                      title="Duplicate Page"
                      className="p-1 rounded text-slate-500 hover:text-blue-600 cursor-pointer"
                    >
                      <Copy size={13} />
                    </button>
                    <button
                      onClick={() => deletePage(idx)}
                      title="Delete Page"
                      className="p-1 rounded text-slate-500 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                    <button
                      onClick={() => movePage(idx, 'right')}
                      disabled={idx === pages.length - 1}
                      title="Move Right"
                      className="p-1 rounded text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                    >
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
