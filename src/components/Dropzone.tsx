'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { UploadCloud, FileText, ShieldCheck, AlertCircle } from 'lucide-react';

export interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  accept?: string;
  title?: string;
  subtitle?: string;
  acceptText?: string;
}

export function Dropzone({
  onFilesSelected,
  multiple = false,
  maxFiles = 1,
  accept = '.pdf,application/pdf',
  title = 'Select PDF files',
  subtitle = 'Drag and drop your PDF files here, paste from clipboard, or click to browse',
  acceptText,
}: DropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isMultiple = multiple || maxFiles > 1;

  const processFiles = useCallback(
    (rawFiles: FileList | File[]) => {
      setErrorMessage(null);
      const validFiles: File[] = [];
      const fileArray = Array.isArray(rawFiles) ? rawFiles : Array.from(rawFiles);

      const acceptedTokens = accept
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

      for (const file of fileArray) {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        const mime = file.type.toLowerCase();

        let isMatch = false;
        if (acceptedTokens.length === 0) {
          isMatch = true;
        } else {
          isMatch = acceptedTokens.some((tok) => {
            if (tok.startsWith('.')) {
              return ext === tok || file.name.toLowerCase().endsWith(tok);
            }
            return mime.includes(tok) || tok.includes(mime);
          });
        }

        if (isMatch) {
          validFiles.push(file);
        }
      }

      if (validFiles.length === 0) {
        setErrorMessage(`Please select valid files matching: ${accept}`);
        return;
      }

      if (!isMultiple && validFiles.length > 1) {
        onFilesSelected([validFiles[0]]);
      } else {
        onFilesSelected(validFiles.slice(0, maxFiles || validFiles.length));
      }
    },
    [isMultiple, maxFiles, accept, onFilesSelected]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = e.clipboardData.items;
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        processFiles(files);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [processFiles]);

  return (
    <div className="w-full my-6">
      <div
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-14 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 backdrop-blur-xl ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[1.01] shadow-2xl shadow-indigo-500/20'
            : 'border-slate-300 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50/80 dark:hover:bg-slate-900/80 hover:-translate-y-0.5 hover:shadow-xl'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            fileInputRef.current?.click();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={isMultiple}
          className="hidden"
          onChange={handleInputChange}
        />

        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-500/20 dark:via-purple-500/20 dark:to-pink-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-5 group-hover:scale-110 transition-transform">
          <UploadCloud size={36} />
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
          {title}
        </h3>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-6 max-w-lg leading-relaxed">
          {subtitle}
        </p>

        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] active:scale-[0.99] transition-all duration-150 mb-4"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          <FileText size={18} />
          <span>{multiple ? 'Choose PDF Files' : 'Choose PDF File'}</span>
        </button>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-xs text-slate-500 dark:text-slate-400 mt-2">
          <span>{acceptText}</span>
          <span>•</span>
          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
            <ShieldCheck size={14} />
            <span>Processed locally in browser</span>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
