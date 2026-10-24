import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ProgressBarProps {
  progress: number; // 0 - 100
  message?: string;
  statusText?: string;
  totalSteps?: number;
  currentStep?: number;
}

export function ProgressBar({ progress, message, statusText }: ProgressBarProps) {
  const displayText = statusText || message || 'Processing document...';
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <div
      className="w-full bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 my-6 flex flex-col gap-3 backdrop-blur-xl shadow-lg shadow-indigo-500/5"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
          <Loader2 size={16} className="animate-spin text-indigo-600 dark:text-indigo-400" />
          <span>{displayText}</span>
        </div>
        <span className="font-bold text-indigo-600 dark:text-indigo-400">
          {Math.round(clamped)}%
        </span>
      </div>

      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300 relative shadow-sm"
          style={{ width: `${clamped}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
