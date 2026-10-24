'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { 
  FileStack, 
  Plus, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  ArrowLeft, 
  Trash2,
  FileCheck2,
  AlertTriangle,
  FolderDown,
  ExternalLink
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { Dropzone } from '@/components/Dropzone';
import { FileCard, FileCardItem } from '@/components/FileCard';
import { ProgressBar } from '@/components/ProgressBar';
import { mergePdfs } from '@/lib/pdf/mergeEngine';
import { 
  readFileAsArrayBuffer, 
  downloadBlob, 
  openBlobInNewTab,
  formatBytes 
} from '@/lib/pdf/pdfUtils';

export default function MergePage() {
  const [files, setFiles] = useState<FileCardItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, status: '' });
  const [outputFilename, setOutputFilename] = useState('merged_document.pdf');
  const [mergedBlob, setMergedBlob] = useState<Uint8Array | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addFilesInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = async (newFiles: File[]) => {
    setError(null);
    const newItems: FileCardItem[] = [];

    for (const file of newFiles) {
      try {
        const buffer = await readFileAsArrayBuffer(file);
        const pdfDoc = await PDFDocument.load(buffer.slice(0), { ignoreEncryption: true });
        const pageCount = pdfDoc.getPageCount();

        newItems.push({
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          file,
          buffer,
          pageCount,
          rotation: 0,
        });
      } catch (err: any) {
        console.error('Error loading PDF file:', err);
        setError(`Failed to read "${file.name}". Ensure the file is not password-protected or corrupt.`);
      }
    }

    setFiles((prev) => [...prev, ...newItems]);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setFiles((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === files.length - 1) return;
    setFiles((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const handleRotate = (index: number) => {
    setFiles((prev) => {
      const next = [...prev];
      const current = next[index].rotation;
      next[index] = { ...next[index], rotation: (current + 90) % 360 };
      return next;
    });
  };

  const handleRemove = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    setFiles([]);
    setMergedBlob(null);
    setError(null);
  };

  const getResolvedFilename = () => {
    return outputFilename.trim().endsWith('.pdf')
      ? outputFilename.trim()
      : `${outputFilename.trim() || 'merged_document'}.pdf`;
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setError('Please add at least 2 PDF files to merge.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Re-read fresh ArrayBuffers directly from File objects
      const itemsToMerge = await Promise.all(
        files.map(async (f) => {
          const freshBuffer = await f.file.arrayBuffer();
          return {
            id: f.id,
            name: f.file.name,
            buffer: freshBuffer,
            rotation: f.rotation,
          };
        })
      );

      const resultBytes = await mergePdfs(itemsToMerge, {
        onProgress: (current, total, status) => {
          setProgress({ current, total, status });
        },
      });

      setMergedBlob(resultBytes);

      // Automatically trigger download directly to user's Downloads folder
      const finalName = getResolvedFilename();
      downloadBlob(resultBytes, finalName);
    } catch (err: any) {
      console.error('Merge error:', err);
      setError(err.message || 'An error occurred while merging your PDF files.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!mergedBlob) return;
    const finalName = getResolvedFilename();
    downloadBlob(mergedBlob, finalName);
  };

  const handlePreview = () => {
    if (!mergedBlob) return;
    const finalName = getResolvedFilename();
    openBlobInNewTab(mergedBlob, finalName);
  };

  const handleReset = () => {
    setMergedBlob(null);
    setFiles([]);
    setError(null);
  };

  const totalPages = files.reduce((acc, f) => acc + f.pageCount, 0);
  const totalBytes = files.reduce((acc, f) => acc + f.file.size, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-5xl mx-auto">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Tools</span>
          </Link>
        </div>

        {/* Page Header */}
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-3">
            <FileStack size={14} />
            <span>Merge Tool</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
            Merge <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">PDF Files</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Combine multiple PDF documents into one seamless file. Reorder, rotate pages, and customize your export with complete privacy.
          </p>
        </header>

        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2.5 shadow-sm">
            <AlertTriangle size={18} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success View */}
        {mergedBlob ? (
          <div className="bg-white/80 dark:bg-slate-900/80 border border-emerald-200 dark:border-emerald-800/60 rounded-3xl p-8 sm:p-14 text-center flex flex-col items-center gap-6 backdrop-blur-xl shadow-xl shadow-emerald-500/10">
            <div className="w-18 h-18 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-500">
              <CheckCircle size={40} />
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
                PDFs Successfully Merged!
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-md mx-auto">
                Your {files.length} documents with a combined {totalPages} pages have been compiled and sent to your{' '}
                <strong className="text-slate-900 dark:text-white">Downloads</strong> folder.
              </p>
            </div>

            {/* Downloads Path Indicator */}
            <div className="flex items-center gap-3.5 px-5 py-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 text-left max-w-lg w-full">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                <FolderDown size={22} />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Saved to Downloads Folder
                </span>
                <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate" title={getResolvedFilename()}>
                  Downloads/{getResolvedFilename()}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.99] transition-all"
                onClick={handleDownload}
              >
                <Download size={18} />
                <span>Download Again</span>
              </button>

              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-bold text-sm sm:text-base shadow-md transition-all hover:scale-[1.02] active:scale-[0.99]"
                onClick={handlePreview}
              >
                <ExternalLink size={18} />
                <span>Open / View PDF</span>
              </button>

              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-all"
                onClick={handleReset}
              >
                <RefreshCw size={16} />
                <span>Merge More Files</span>
              </button>
            </div>
          </div>
        ) : (
          /* Workspace View */
          <div className="flex flex-col gap-6">
            {files.length === 0 ? (
              <Dropzone
                multiple={true}
                title="Select or Drop PDF Files to Merge"
                subtitle="Choose 2 or more PDF documents. You can reorder and rotate them before merging."
                onFilesSelected={handleFilesSelected}
              />
            ) : (
              <>
                {/* Active Files Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 backdrop-blur-md">
                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                    <span>
                      <strong className="text-slate-900 dark:text-white">{files.length}</strong> {files.length === 1 ? 'file' : 'files'}
                    </span>
                    <span>•</span>
                    <span>
                      <strong className="text-slate-900 dark:text-white">{totalPages}</strong> total pages
                    </span>
                    <span>•</span>
                    <span>
                      <strong className="text-slate-900 dark:text-white">{formatBytes(totalBytes)}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      ref={addFilesInputRef}
                      type="file"
                      accept="application/pdf,.pdf"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files) handleFilesSelected(Array.from(e.target.files));
                        e.target.value = '';
                      }}
                    />
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm transition-colors"
                      onClick={() => addFilesInputRef.current?.click()}
                    >
                      <Plus size={16} />
                      <span>Add More Files</span>
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 font-semibold text-xs sm:text-sm transition-colors"
                      onClick={handleClearAll}
                      title="Clear all uploaded files"
                    >
                      <Trash2 size={16} />
                      <span>Clear All</span>
                    </button>
                  </div>
                </div>

                {/* File Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {files.map((item, index) => (
                    <FileCard
                      key={item.id}
                      item={item}
                      index={index}
                      total={files.length}
                      onMoveUp={handleMoveUp}
                      onMoveDown={handleMoveDown}
                      onRotate={handleRotate}
                      onRemove={handleRemove}
                    />
                  ))}
                </div>

                {/* Progress Bar */}
                {isProcessing && (
                  <ProgressBar
                    progress={(progress.current / Math.max(1, progress.total)) * 100}
                    message={progress.status}
                  />
                )}

                {/* Output Configuration Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 backdrop-blur-xl shadow-md">
                  <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                    <label
                      htmlFor="outputName"
                      className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap"
                    >
                      Output Filename:
                    </label>
                    <input
                      id="outputName"
                      type="text"
                      className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      value={outputFilename}
                      onChange={(e) => setOutputFilename(e.target.value)}
                      placeholder="merged_document.pdf"
                      disabled={isProcessing}
                    />
                  </div>

                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 hover:scale-[1.02] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all min-w-[170px]"
                    onClick={handleMerge}
                    disabled={files.length < 2 || isProcessing}
                  >
                    <FileCheck2 size={18} />
                    <span>{isProcessing ? 'Merging...' : 'Merge to Downloads'}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
