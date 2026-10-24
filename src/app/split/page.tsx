'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Split, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  ArrowLeft, 
  FileText, 
  AlertTriangle,
  FolderArchive,
  FolderDown,
  ExternalLink
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { Dropzone } from '@/components/Dropzone';
import { PageGrid } from '@/components/PageGrid';
import { ProgressBar } from '@/components/ProgressBar';
import { extractPagesToSinglePdf, splitPagesToZip } from '@/lib/pdf/splitEngine';
import { 
  readFileAsArrayBuffer, 
  downloadBlob, 
  openBlobInNewTab,
  formatBytes 
} from '@/lib/pdf/pdfUtils';

type SplitMode = 'extract_single' | 'split_all_zip';

export default function SplitPage() {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [splitMode, setSplitMode] = useState<SplitMode>('extract_single');

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, status: '' });
  const [outputFilename, setOutputFilename] = useState('');
  const [outputResult, setOutputResult] = useState<{
    data: Uint8Array | Blob;
    type: 'pdf' | 'zip';
    filename: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setError(null);
    try {
      const arrayBuf = await readFileAsArrayBuffer(selected);
      const pdfDoc = await PDFDocument.load(arrayBuf.slice(0), { ignoreEncryption: true });
      const count = pdfDoc.getPageCount();

      setFile(selected);
      setBuffer(arrayBuf);
      setTotalPages(count);
      setSelectedPages(Array.from({ length: count }, (_, i) => i + 1));
      const baseClean = selected.name.replace(/\.pdf$/i, '');
      setOutputFilename(`${baseClean}_extracted.pdf`);
    } catch (err: any) {
      console.error('Error loading PDF:', err);
      setError(`Failed to read "${selected.name}". Please ensure it is a valid, unencrypted PDF.`);
    }
  };

  const handleModeChange = (mode: SplitMode) => {
    setSplitMode(mode);
    if (!file) return;
    const baseClean = file.name.replace(/\.pdf$/i, '');
    if (mode === 'extract_single') {
      setOutputFilename(`${baseClean}_extracted.pdf`);
    } else {
      setOutputFilename(`${baseClean}_pages.zip`);
    }
  };

  const getResolvedFilename = () => {
    if (splitMode === 'extract_single') {
      return outputFilename.trim().endsWith('.pdf')
        ? outputFilename.trim()
        : `${outputFilename.trim() || 'extracted'}.pdf`;
    } else {
      return outputFilename.trim().endsWith('.zip')
        ? outputFilename.trim()
        : `${outputFilename.trim() || 'split_pages'}.zip`;
    }
  };

  const handleSplit = async () => {
    if (!file) return;
    if (selectedPages.length === 0) {
      setError('Please select at least one page to extract or split.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const freshBuffer = await file.arrayBuffer();
      const finalName = getResolvedFilename();

      if (splitMode === 'extract_single') {
        const finalPdfBytes = await extractPagesToSinglePdf(
          freshBuffer,
          selectedPages,
          file.name,
          {
            onProgress: (current, total, status) => {
              setProgress({ current, total, status });
            },
          }
        );

        setOutputResult({
          data: finalPdfBytes,
          type: 'pdf',
          filename: finalName,
        });

        // Auto-download to Downloads folder
        downloadBlob(finalPdfBytes, finalName);
      } else {
        const zipBlob = await splitPagesToZip(
          freshBuffer,
          selectedPages,
          file.name,
          {
            onProgress: (current, total, status) => {
              setProgress({ current, total, status });
            },
          }
        );

        setOutputResult({
          data: zipBlob,
          type: 'zip',
          filename: finalName,
        });

        // Auto-download to Downloads folder
        downloadBlob(zipBlob, finalName);
      }
    } catch (err: any) {
      console.error('Split error:', err);
      setError(err.message || 'An error occurred while splitting the PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!outputResult) return;
    downloadBlob(outputResult.data, outputResult.filename);
  };

  const handlePreview = () => {
    if (!outputResult || outputResult.type !== 'pdf') return;
    openBlobInNewTab(outputResult.data, outputResult.filename);
  };

  const handleReset = () => {
    setFile(null);
    setBuffer(null);
    setTotalPages(0);
    setSelectedPages([]);
    setOutputResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-5xl mx-auto">
        {/* Back link */}
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/60 text-sky-600 dark:text-sky-400 text-xs font-semibold mb-3">
            <Split size={14} />
            <span>Split Tool</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
            Split <span className="bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent">PDF Pages</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Extract custom page ranges or split each page into an independent document. Visual thumbnail selection gives you full control.
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
        {outputResult ? (
          <div className="bg-white/80 dark:bg-slate-900/80 border border-emerald-200 dark:border-emerald-800/60 rounded-3xl p-8 sm:p-14 text-center flex flex-col items-center gap-6 backdrop-blur-xl shadow-xl shadow-emerald-500/10">
            <div className="w-18 h-18 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-500">
              <CheckCircle size={40} />
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
                {outputResult.type === 'zip' ? 'Pages Split into ZIP!' : 'Pages Extracted Successfully!'}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-md mx-auto">
                {outputResult.type === 'zip'
                  ? `Extracted ${selectedPages.length} individual pages into a ZIP bundle and sent to your Downloads folder.`
                  : `Created a new PDF with ${selectedPages.length} pages and sent directly to your Downloads folder.`}
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
                <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate" title={outputResult.filename}>
                  Downloads/{outputResult.filename}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-sky-500/30 hover:scale-[1.02] active:scale-[0.99] transition-all"
                onClick={handleDownload}
              >
                <Download size={18} />
                <span>Download Again</span>
              </button>

              {outputResult.type === 'pdf' && (
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 font-bold text-sm sm:text-base shadow-md transition-all hover:scale-[1.02] active:scale-[0.99]"
                  onClick={handlePreview}
                >
                  <ExternalLink size={18} />
                  <span>Open / View PDF</span>
                </button>
              )}

              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-all"
                onClick={handleReset}
              >
                <RefreshCw size={16} />
                <span>Split Another Document</span>
              </button>
            </div>
          </div>
        ) : (
          /* Workspace View */
          <div className="flex flex-col gap-6">
            {!file || !buffer ? (
              <Dropzone
                multiple={false}
                title="Select or Drop a PDF File to Split"
                subtitle="Upload your document to visually preview pages and choose your split settings."
                onFilesSelected={handleFileSelected}
              />
            ) : (
              <>
                {/* Document Banner */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 backdrop-blur-md">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/60 flex items-center justify-center text-sky-600 dark:text-sky-400">
                      <FileText size={22} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white truncate max-w-sm">
                        {file.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatBytes(file.size)} • {totalPages} total pages
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm transition-colors"
                    onClick={handleReset}
                  >
                    Choose Different File
                  </button>
                </div>

                {/* Mode Selector Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    className={`p-5 rounded-2xl cursor-pointer transition-all duration-150 flex items-start gap-3.5 border-2 ${
                      splitMode === 'extract_single'
                        ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/20 shadow-md shadow-sky-500/15'
                        : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                    onClick={() => handleModeChange('extract_single')}
                    role="radio"
                    aria-checked={splitMode === 'extract_single'}
                  >
                    <input
                      type="radio"
                      name="splitMode"
                      className="mt-1 accent-sky-500"
                      checked={splitMode === 'extract_single'}
                      onChange={() => handleModeChange('extract_single')}
                    />
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                        Extract to Single PDF
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        Combines all selected pages into one unified new PDF document.
                      </p>
                    </div>
                  </div>

                  <div
                    className={`p-5 rounded-2xl cursor-pointer transition-all duration-150 flex items-start gap-3.5 border-2 ${
                      splitMode === 'split_all_zip'
                        ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/20 shadow-md shadow-sky-500/15'
                        : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                    onClick={() => handleModeChange('split_all_zip')}
                    role="radio"
                    aria-checked={splitMode === 'split_all_zip'}
                  >
                    <input
                      type="radio"
                      name="splitMode"
                      className="mt-1 accent-sky-500"
                      checked={splitMode === 'split_all_zip'}
                      onChange={() => handleModeChange('split_all_zip')}
                    />
                    <div>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                        Split into Individual Files (ZIP)
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        Creates a standalone PDF for each selected page, bundled in a ZIP archive.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Page Grid Selector */}
                <PageGrid
                  pdfBuffer={buffer}
                  totalPages={totalPages}
                  selectedPages={selectedPages}
                  onChangeSelectedPages={setSelectedPages}
                />

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
                      className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                      value={outputFilename}
                      onChange={(e) => setOutputFilename(e.target.value)}
                      placeholder={splitMode === 'extract_single' ? 'extracted.pdf' : 'pages.zip'}
                      disabled={isProcessing}
                    />
                  </div>

                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-sky-500/25 hover:scale-[1.02] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all min-w-[190px]"
                    onClick={handleSplit}
                    disabled={selectedPages.length === 0 || isProcessing}
                  >
                    {splitMode === 'extract_single' ? <FileText size={18} /> : <FolderArchive size={18} />}
                    <span>{isProcessing ? 'Processing...' : splitMode === 'extract_single' ? 'Extract to Downloads' : 'Split & Download ZIP'}</span>
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
