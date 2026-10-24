'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Download, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  FileCheck2,
  Lock,
  Zap
} from 'lucide-react';
import { ProgressBar } from '@/components/ProgressBar';

export interface ToolLayoutProps {
  title: string;
  description: string;
  badge?: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  iconTextColor?: string;
  isProcessing?: boolean;
  progressPercent?: number;
  progressStatus?: string;
  error?: string | null;
  successResult?: {
    filename: string;
    filesize?: string;
    onDownload: () => void;
    onOpenInNewTab?: () => void;
    onReset: () => void;
  } | null;
  children: React.ReactNode;
}

export function ToolLayout({
  title,
  description,
  badge,
  icon,
  iconBgColor = 'bg-indigo-50 dark:bg-indigo-950/60',
  iconTextColor = 'text-indigo-600 dark:text-indigo-400',
  isProcessing = false,
  progressPercent = 0,
  progressStatus = 'Processing document...',
  error = null,
  successResult = null,
  children,
}: ToolLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Bar Navigation */}
      <div className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            <span>All Tools</span>
          </Link>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>100% In-Browser & Secure</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Tool Header */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <div className="inline-flex items-center justify-center mb-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md ${iconBgColor} ${iconTextColor}`}>
              {icon}
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 mb-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h1>
            {badge && (
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200/70 dark:border-sky-800/50">
                {badge}
              </span>
            )}
          </div>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-8 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 flex items-start gap-3 shadow-sm animate-in fade-in duration-200">
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5 text-rose-500" />
            <div className="text-xs sm:text-sm leading-relaxed">
              <span className="font-bold">Error: </span>
              {error}
            </div>
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="mb-8 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
            <ProgressBar
              progress={progressPercent}
              statusText={progressStatus}
              totalSteps={100}
              currentStep={progressPercent}
            />
          </div>
        )}

        {/* Success / Result Screen */}
        {successResult && !isProcessing ? (
          <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 shadow-xl text-center max-w-2xl mx-auto animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-5 shadow-sm">
              <CheckCircle2 size={36} />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Processing Complete!
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-6">
              Your document has been processed and is ready for download.
            </p>

            <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mb-8 max-w-full truncate">
              <FileCheck2 size={18} className="text-emerald-500 flex-shrink-0" />
              <span className="truncate">{successResult.filename}</span>
              {successResult.filesize && (
                <span className="text-slate-400 text-xs">({successResult.filesize})</span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <button
                onClick={successResult.onDownload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Download size={18} />
                <span>Download File</span>
              </button>

              {successResult.onOpenInNewTab && (
                <button
                  onClick={successResult.onOpenInNewTab}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-all cursor-pointer"
                >
                  <ExternalLink size={16} />
                  <span>Preview Tab</span>
                </button>
              )}

              <button
                onClick={successResult.onReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-sm transition-all cursor-pointer"
              >
                <RefreshCw size={16} />
                <span>Process Another</span>
              </button>
            </div>
          </div>
        ) : (
          /* Main tool interface */
          children
        )}
      </div>
    </div>
  );
}
