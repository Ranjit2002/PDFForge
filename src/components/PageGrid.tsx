'use client';

import React, { useState, useEffect } from 'react';
import { Check, Loader2, CheckSquare, Square, RefreshCcw } from 'lucide-react';
import { parsePageRange } from '@/lib/pdf/pdfUtils';
import { renderPageThumbnail } from '@/lib/pdf/pdfRenderer';

interface PageGridProps {
  pdfBuffer: ArrayBuffer;
  totalPages: number;
  selectedPages: number[];
  onChangeSelectedPages: (pages: number[]) => void;
}

export function PageGrid({
  pdfBuffer,
  totalPages,
  selectedPages,
  onChangeSelectedPages,
}: PageGridProps) {
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const [loadingThumbnails, setLoadingThumbnails] = useState(true);
  const [rangeInput, setRangeInput] = useState('');

  // Sync range input text when selected pages change externally
  useEffect(() => {
    if (selectedPages.length === 0) {
      setRangeInput('');
      return;
    }

    const sorted = [...selectedPages].sort((a, b) => a - b);
    const ranges: string[] = [];
    let start = sorted[0];
    let end = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === end + 1) {
        end = sorted[i];
      } else {
        ranges.push(start === end ? `${start}` : `${start}-${end}`);
        start = sorted[i];
        end = sorted[i];
      }
    }
    ranges.push(start === end ? `${start}` : `${start}-${end}`);
    setRangeInput(ranges.join(', '));
  }, [selectedPages]);

  // Render thumbnails incrementally
  useEffect(() => {
    let isCancelled = false;
    setLoadingThumbnails(true);

    async function loadAllThumbnails() {
      // Immediate load first 4
      const immediateCount = Math.min(totalPages, 4);
      for (let i = 1; i <= immediateCount; i++) {
        if (isCancelled) return;
        try {
          const url = await renderPageThumbnail(pdfBuffer.slice(0), i, 220);
          if (!isCancelled) {
            setThumbnails((prev) => ({ ...prev, [i]: url }));
          }
        } catch (e) {
          console.error(`Failed rendering thumbnail ${i}`, e);
        }
      }

      // Load remaining
      for (let i = immediateCount + 1; i <= totalPages; i++) {
        if (isCancelled) return;
        try {
          const url = await renderPageThumbnail(pdfBuffer.slice(0), i, 220);
          if (!isCancelled) {
            setThumbnails((prev) => ({ ...prev, [i]: url }));
          }
        } catch (e) {
          console.error(`Failed rendering thumbnail ${i}`, e);
        }
      }

      if (!isCancelled) setLoadingThumbnails(false);
    }

    loadAllThumbnails();

    return () => {
      isCancelled = true;
    };
  }, [pdfBuffer, totalPages]);

  const togglePage = (page: number) => {
    if (selectedPages.includes(page)) {
      onChangeSelectedPages(selectedPages.filter((p) => p !== page));
    } else {
      onChangeSelectedPages([...selectedPages, page].sort((a, b) => a - b));
    }
  };

  const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setRangeInput(val);
    const parsed = parsePageRange(val, totalPages);
    onChangeSelectedPages(parsed);
  };

  const selectAll = () => {
    const all = Array.from({ length: totalPages }, (_, i) => i + 1);
    onChangeSelectedPages(all);
  };

  const deselectAll = () => {
    onChangeSelectedPages([]);
  };

  const invertSelection = () => {
    const inverted = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
      (p) => !selectedPages.includes(p)
    );
    onChangeSelectedPages(inverted);
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
          <label
            htmlFor="pageRangeInput"
            className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap"
          >
            Page Range:
          </label>
          <input
            id="pageRangeInput"
            type="text"
            className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-sky-500 transition-all"
            placeholder="e.g. 1-3, 5, 8-10"
            value={rangeInput}
            onChange={handleRangeChange}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            onClick={selectAll}
            title="Select all pages"
          >
            <CheckSquare size={13} />
            <span>Select All</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            onClick={deselectAll}
            title="Clear selection"
          >
            <Square size={13} />
            <span>Clear</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            onClick={invertSelection}
            title="Invert selection"
          >
            <RefreshCcw size={13} />
            <span>Invert</span>
          </button>
        </div>
      </div>

      {/* Pages Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
          const isSelected = selectedPages.includes(pageNum);
          const thumbUrl = thumbnails[pageNum];

          return (
            <div
              key={pageNum}
              className={`relative rounded-2xl p-2.5 cursor-pointer transition-all duration-150 flex flex-col items-center overflow-hidden border-2 ${
                isSelected
                  ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/20 shadow-md shadow-sky-500/20 scale-[1.02]'
                  : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 hover:-translate-y-0.5'
              }`}
              onClick={() => togglePage(pageNum)}
              role="checkbox"
              aria-checked={isSelected}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  togglePage(pageNum);
                }
              }}
            >
              {/* Page Number Badge */}
              <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white text-[11px] font-bold px-2 py-0.5 rounded-md z-10">
                Page {pageNum}
              </span>

              {/* Checkbox Circle */}
              <div
                className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-white z-10 transition-colors ${
                  isSelected
                    ? 'bg-sky-500 shadow-sm'
                    : 'bg-slate-900/40 border border-white/40'
                }`}
              >
                {isSelected && <Check size={14} strokeWidth={3} />}
              </div>

              {/* Thumbnail Container */}
              <div className="w-full h-52 bg-white rounded-xl flex items-center justify-center overflow-hidden relative shadow-inner">
                {thumbUrl ? (
                  <img
                    src={thumbUrl}
                    alt={`Page ${pageNum}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400 text-xs">
                    <Loader2 size={20} className="animate-spin text-sky-500" />
                    <span>Loading...</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="flex flex-wrap items-center justify-between text-xs sm:text-sm text-slate-500 dark:text-slate-400 px-1">
        <span>
          Selected <strong className="text-slate-900 dark:text-white">{selectedPages.length}</strong> of{' '}
          <strong className="text-slate-900 dark:text-white">{totalPages}</strong> pages
        </span>
        {loadingThumbnails && (
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <Loader2 size={13} className="animate-spin text-sky-500" /> Rendering page previews...
          </span>
        )}
      </div>
    </div>
  );
}
