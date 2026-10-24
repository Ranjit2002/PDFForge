'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Minimize2, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  ArrowLeft, 
  FileText, 
  Sliders, 
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Flame,
  Award,
  FolderDown,
  ExternalLink
} from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { Dropzone } from '@/components/Dropzone';
import { ProgressBar } from '@/components/ProgressBar';
import { 
  compressPdf, 
  COMPRESSION_PRESETS, 
  CompressionPreset, 
  CompressConfig,
  CompressResult 
} from '@/lib/pdf/compressEngine';
import { 
  readFileAsArrayBuffer, 
  downloadBlob, 
  openBlobInNewTab,
  formatBytes 
} from '@/lib/pdf/pdfUtils';

export default function CompressPage() {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);

  const [selectedPreset, setSelectedPreset] = useState<CompressionPreset>('recommended');
  const [showCustom, setShowCustom] = useState(false);
  const [customScale, setCustomScale] = useState(0.9);
  const [customQuality, setCustomQuality] = useState(0.65);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ percent: 0, status: '' });
  const [result, setResult] = useState<CompressResult | null>(null);
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
      setResult(null);
    } catch (err: any) {
      console.error('Error loading PDF for compression:', err);
      setError(`Failed to read "${selected.name}". Please ensure it is a valid, unencrypted PDF.`);
    }
  };

  const getResolvedFilename = () => {
    if (!file) return 'compressed_document.pdf';
    const cleanName = file.name.replace(/\.pdf$/i, '');
    return `${cleanName}_compressed.pdf`;
  };

  const handleCompress = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    let config: CompressConfig;
    if (selectedPreset === 'custom') {
      config = { scale: customScale, quality: customQuality };
    } else {
      const presetData = COMPRESSION_PRESETS[selectedPreset];
      config = { scale: presetData.scale, quality: presetData.quality };
    }

    try {
      const freshBuffer = await file.arrayBuffer();

      const compressResult = await compressPdf(freshBuffer, config, (prog) => {
        const percent = (prog.currentPage / Math.max(1, prog.totalPages)) * 100;
        setProgress({ percent, status: prog.message });
      });

      setResult(compressResult);

      // Automatically trigger download directly to user's Downloads folder
      const finalName = getResolvedFilename();
      downloadBlob(compressResult.data, finalName);
    } catch (err: any) {
      console.error('Compression error:', err);
      setError(err.message || 'An error occurred during compression.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    const finalName = getResolvedFilename();
    downloadBlob(result.data, finalName);
  };

  const handlePreview = () => {
    if (!result || !file) return;
    const finalName = getResolvedFilename();
    openBlobInNewTab(result.data, finalName);
  };

  const handleReset = () => {
    setFile(null);
    setBuffer(null);
    setTotalPages(0);
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-10 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-4xl mx-auto">
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 dark:bg-pink-950/60 border border-pink-200 dark:border-pink-800/60 text-pink-600 dark:text-pink-400 text-xs font-semibold mb-3">
            <Minimize2 size={14} />
            <span>Compression Tool</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
            Compress <span className="bg-gradient-to-r from-pink-500 via-rose-500 to-amber-500 bg-clip-text text-transparent">PDF Document</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Shrink bloated PDF file sizes by up to 90% without losing visual clarity. Select recommended profiles or fine-tune quality with advanced controls.
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
        {result ? (
          <div className="bg-white/80 dark:bg-slate-900/80 border border-emerald-200 dark:border-emerald-800/60 rounded-3xl p-8 sm:p-12 text-center flex flex-col items-center gap-8 backdrop-blur-xl shadow-xl shadow-emerald-500/10">
            <div className="w-18 h-18 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-300 dark:border-emerald-700 flex items-center justify-center text-emerald-500">
              <CheckCircle size={40} />
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-2">
                Compression Complete!
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base max-w-md mx-auto">
                Your document has been optimized and automatically saved to your{' '}
                <strong className="text-slate-900 dark:text-white">Downloads</strong> folder.
              </p>
            </div>

            {/* Metrics Comparison Card */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 w-full max-w-lg">
              <div className="flex flex-col text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Original Size</span>
                <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-200">
                  {formatBytes(result.originalSize)}
                </span>
              </div>

              <div className="text-slate-400">
                <ArrowRight size={24} />
              </div>

              <div className="flex flex-col text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">New Size</span>
                <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {formatBytes(result.compressedSize)}
                </span>
              </div>

              <div className="px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 text-base font-extrabold">
                {result.percentSaved > 0 ? `-${result.percentSaved}% Saved` : 'Optimized'}
              </div>
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
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-pink-500/30 hover:scale-[1.02] active:scale-[0.99] transition-all"
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
                <span>Compress Another PDF</span>
              </button>
            </div>
          </div>
        ) : (
          /* Workspace View */
          <div className="flex flex-col gap-6">
            {!file || !buffer ? (
              <Dropzone
                multiple={false}
                title="Select or Drop a PDF File to Compress"
                subtitle="Upload your document to choose your compression profile and optimize its file size."
                onFilesSelected={handleFileSelected}
              />
            ) : (
              <>
                {/* Document Banner */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 backdrop-blur-md">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-pink-50 dark:bg-pink-950/60 border border-pink-200 dark:border-pink-800/60 flex items-center justify-center text-pink-600 dark:text-pink-400">
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

                {/* Compression Level Presets */}
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Select Compression Level
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Recommended */}
                    <div
                      className={`relative p-5 rounded-2xl cursor-pointer transition-all duration-150 flex flex-col justify-between border-2 ${
                        selectedPreset === 'recommended'
                          ? 'border-pink-500 bg-pink-50/50 dark:bg-pink-950/20 shadow-md shadow-pink-500/15'
                          : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                      onClick={() => {
                        setSelectedPreset('recommended');
                        setShowCustom(false);
                      }}
                      role="radio"
                      aria-checked={selectedPreset === 'recommended'}
                    >
                      <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-[10px] font-extrabold text-white uppercase tracking-wider">
                        Popular
                      </span>
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Zap size={20} className="text-pink-600 dark:text-pink-400" />
                          <h4 className="text-base font-bold text-slate-900 dark:text-white">Recommended</h4>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                          {COMPRESSION_PRESETS.recommended.description}
                        </p>
                      </div>
                      <span className="inline-block text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md self-start">
                        {COMPRESSION_PRESETS.recommended.expectedSavings}
                      </span>
                    </div>

                    {/* Extreme */}
                    <div
                      className={`relative p-5 rounded-2xl cursor-pointer transition-all duration-150 flex flex-col justify-between border-2 ${
                        selectedPreset === 'extreme'
                          ? 'border-pink-500 bg-pink-50/50 dark:bg-pink-950/20 shadow-md shadow-pink-500/15'
                          : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                      onClick={() => {
                        setSelectedPreset('extreme');
                        setShowCustom(false);
                      }}
                      role="radio"
                      aria-checked={selectedPreset === 'extreme'}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Flame size={20} className="text-amber-500" />
                          <h4 className="text-base font-bold text-slate-900 dark:text-white">Extreme</h4>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                          {COMPRESSION_PRESETS.extreme.description}
                        </p>
                      </div>
                      <span className="inline-block text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md self-start">
                        {COMPRESSION_PRESETS.extreme.expectedSavings}
                      </span>
                    </div>

                    {/* High Quality */}
                    <div
                      className={`relative p-5 rounded-2xl cursor-pointer transition-all duration-150 flex flex-col justify-between border-2 ${
                        selectedPreset === 'high'
                          ? 'border-pink-500 bg-pink-50/50 dark:bg-pink-950/20 shadow-md shadow-pink-500/15'
                          : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                      onClick={() => {
                        setSelectedPreset('high');
                        setShowCustom(false);
                      }}
                      role="radio"
                      aria-checked={selectedPreset === 'high'}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Award size={20} className="text-emerald-500" />
                          <h4 className="text-base font-bold text-slate-900 dark:text-white">High Quality</h4>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                          {COMPRESSION_PRESETS.high.description}
                        </p>
                      </div>
                      <span className="inline-block text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-md self-start">
                        {COMPRESSION_PRESETS.high.expectedSavings}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Advanced Sliders */}
                <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 backdrop-blur-md">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => {
                      const next = !showCustom;
                      setShowCustom(next);
                      if (next) setSelectedPreset('custom');
                      else setSelectedPreset('recommended');
                    }}
                  >
                    <div className="flex items-center gap-2 font-semibold text-sm text-slate-800 dark:text-slate-200">
                      <Sliders size={18} className="text-pink-600 dark:text-pink-400" />
                      <span>Advanced Custom Sliders</span>
                    </div>
                    <span className="text-xs font-semibold text-pink-600 dark:text-pink-400">
                      {showCustom ? 'Hide Custom Sliders' : 'Configure Custom Settings'}
                    </span>
                  </div>

                  {showCustom && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-5 mt-4 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                          <span>DPI Scale:</span>
                          <span className="text-pink-600 dark:text-pink-400 font-bold">
                            {Math.round(customScale * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.5"
                          max="1.3"
                          step="0.05"
                          value={customScale}
                          onChange={(e) => {
                            setCustomScale(parseFloat(e.target.value));
                            setSelectedPreset('custom');
                          }}
                          className="w-full accent-pink-600 cursor-pointer"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                          <span>JPEG Image Quality:</span>
                          <span className="text-pink-600 dark:text-pink-400 font-bold">
                            {Math.round(customQuality * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.3"
                          max="0.9"
                          step="0.05"
                          value={customQuality}
                          onChange={(e) => {
                            setCustomQuality(parseFloat(e.target.value));
                            setSelectedPreset('custom');
                          }}
                          className="w-full accent-pink-600 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                {isProcessing && (
                  <ProgressBar
                    progress={progress.percent}
                    message={progress.status}
                  />
                )}

                {/* Action Output Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 backdrop-blur-xl shadow-md">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    <ShieldCheck size={16} className="text-emerald-500" />
                    <span>Document processed securely inside your browser</span>
                  </div>

                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-sm shadow-lg shadow-pink-500/25 hover:scale-[1.02] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all min-w-[170px]"
                    onClick={handleCompress}
                    disabled={isProcessing}
                  >
                    <Minimize2 size={18} />
                    <span>{isProcessing ? 'Compressing...' : 'Compress to Downloads'}</span>
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
