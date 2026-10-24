'use client';

import React, { useEffect, useState } from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  RotateCw, 
  Trash2, 
  FileText, 
  Loader2 
} from 'lucide-react';
import { formatBytes } from '@/lib/pdf/pdfUtils';
import { renderPageThumbnail } from '@/lib/pdf/pdfRenderer';

export interface FileCardItem {
  id: string;
  file: File;
  buffer: ArrayBuffer;
  pageCount: number;
  rotation: number;
  thumbnailUrl?: string;
}

interface FileCardProps {
  item: FileCardItem;
  index: number;
  total: number;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRotate: (index: number) => void;
  onRemove: (index: number) => void;
}

export function FileCard({
  item,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onRotate,
  onRemove,
}: FileCardProps) {
  const [thumbnail, setThumbnail] = useState<string | null>(item.thumbnailUrl || null);
  const [loadingThumbnail, setLoadingThumbnail] = useState(!item.thumbnailUrl);

  useEffect(() => {
    let isMounted = true;
    if (!thumbnail && item.buffer) {
      setLoadingThumbnail(true);
      // Pass a clone slice so thumbnail rendering never interferes with other tasks
      renderPageThumbnail(item.buffer.slice(0), 1, 220)
        .then((url) => {
          if (isMounted) {
            setThumbnail(url);
            setLoadingThumbnail(false);
          }
        })
        .catch(() => {
          if (isMounted) setLoadingThumbnail(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [item.buffer, thumbnail]);

  return (
    <div className="flex flex-col bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-4 transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg hover:-translate-y-0.5 relative group">
      {/* Header with index badge and action buttons */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
          #{index + 1}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            onClick={() => onMoveUp(index)}
            disabled={index === 0}
            title="Move Earlier"
            aria-label="Move earlier"
          >
            <ArrowUp size={15} />
          </button>
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            onClick={() => onMoveDown(index)}
            disabled={index === total - 1}
            title="Move Later"
            aria-label="Move later"
          >
            <ArrowDown size={15} />
          </button>
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            onClick={() => onRotate(index)}
            title="Rotate 90°"
            aria-label="Rotate 90 degrees"
          >
            <RotateCw size={15} />
          </button>
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            onClick={() => onRemove(index)}
            title="Remove file"
            aria-label="Remove file"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Thumbnail Viewport */}
      <div className="h-44 w-full bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-center mb-3.5 overflow-hidden relative">
        {loadingThumbnail ? (
          <div className="flex flex-col items-center gap-2 text-slate-400 text-xs">
            <Loader2 size={22} className="animate-spin text-indigo-500" />
            <span>Rendering preview...</span>
          </div>
        ) : thumbnail ? (
          <img
            src={thumbnail}
            alt={`Preview of ${item.file.name}`}
            className="max-w-full max-h-full object-contain shadow-sm transition-transform duration-300"
            style={{ transform: `rotate(${item.rotation}deg)` }}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-400 text-xs">
            <FileText size={28} />
            <span>PDF Preview</span>
          </div>
        )}
      </div>

      {/* File Details */}
      <div className="flex flex-col gap-1">
        <div className="text-sm font-semibold text-slate-900 dark:text-white truncate" title={item.file.name}>
          {item.file.name}
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{formatBytes(item.file.size)}</span>
          <span>{item.pageCount} {item.pageCount === 1 ? 'page' : 'pages'}</span>
          {item.rotation > 0 && (
            <span className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-0.5">
              <RotateCw size={11} /> {item.rotation}°
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
