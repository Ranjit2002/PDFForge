'use client';

import React, { useState } from 'react';
import { GitCompare, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { Dropzone } from '@/components/Dropzone';
import { readFileAsArrayBuffer, formatBytes } from '@/lib/pdf/pdfUtils';
import { comparePdfs, DocumentComparisonResult } from '@/lib/pdf/compareEngine';

export default function ComparePage() {
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [result, setResult] = useState<DocumentComparisonResult | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectDoc1 = async (files: File[]) => {
    if (files.length === 0) return;
    setFile1(files[0]);
    setResult(null);
  };

  const handleSelectDoc2 = async (files: File[]) => {
    if (files.length === 0) return;
    setFile2(files[0]);
    setResult(null);
  };

  const handleCompare = async () => {
    if (!file1 || !file2) {
      setError('Please select both Document A and Document B to compare.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const [buf1, buf2] = await Promise.all([
        readFileAsArrayBuffer(file1),
        readFileAsArrayBuffer(file2),
      ]);

      const diffResult = await comparePdfs(buf1, buf2);
      setResult(diffResult);
    } catch (err: any) {
      setError(`Comparison failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolLayout
      title="Compare PDF"
      description="Show a side-by-side document comparison and easily spot text, structural, and line differences between two versions."
      icon={<GitCompare size={28} />}
      iconBgColor="bg-blue-50 dark:bg-blue-950/60"
      iconTextColor="text-blue-600 dark:text-blue-400"
      isProcessing={isProcessing}
      error={error}
    >
      <div className="space-y-8">
        {/* Upload Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 text-xs flex items-center justify-center font-bold">A</span>
              <span>First Document (Original)</span>
            </h3>
            {file1 ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-xs text-slate-900 dark:text-white truncate max-w-[220px]">{file1.name}</p>
                  <p className="text-[11px] text-slate-400">{formatBytes(file1.size)}</p>
                </div>
                <button
                  onClick={() => setFile1(null)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <Dropzone onFilesSelected={handleSelectDoc1} accept=".pdf" maxFiles={1} title="Select Document A" />
            )}
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 text-xs flex items-center justify-center font-bold">B</span>
              <span>Second Document (Modified)</span>
            </h3>
            {file2 ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-xs text-slate-900 dark:text-white truncate max-w-[220px]">{file2.name}</p>
                  <p className="text-[11px] text-slate-400">{formatBytes(file2.size)}</p>
                </div>
                <button
                  onClick={() => setFile2(null)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <Dropzone onFilesSelected={handleSelectDoc2} accept=".pdf" maxFiles={1} title="Select Document B" />
            )}
          </div>
        </div>

        {/* Action Button */}
        {file1 && file2 && !result && (
          <div className="text-center">
            <button
              onClick={handleCompare}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
            >
              <GitCompare size={18} />
              <span>Run Side-by-Side Comparison</span>
            </button>
          </div>
        )}

        {/* Results View */}
        {result && (
          <div className="space-y-6">
            {/* Summary Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-2xl font-black text-blue-600">{result.overallSimilarity}%</span>
                <p className="text-[11px] font-semibold text-slate-400 uppercase mt-1">Similarity</p>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-2xl font-black text-emerald-500">+{result.summary.totalAddedLines}</span>
                <p className="text-[11px] font-semibold text-slate-400 uppercase mt-1">Added Points</p>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-2xl font-black text-rose-500">-{result.summary.totalRemovedLines}</span>
                <p className="text-[11px] font-semibold text-slate-400 uppercase mt-1">Removed Points</p>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-2xl font-black text-purple-600">{result.summary.identicalPagesCount}</span>
                <p className="text-[11px] font-semibold text-slate-400 uppercase mt-1">Identical Pages</p>
              </div>
            </div>

            {/* Page Diffs */}
            <div className="space-y-4">
              {result.pageDiffs.map((diff) => (
                <div
                  key={diff.pageNumber}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      Page {diff.pageNumber}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {diff.similarityPercentage}% Match
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                      <span className="font-bold block text-slate-400 mb-2">Original (Doc A):</span>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {diff.doc1Text || '(Blank page)'}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                      <span className="font-bold block text-slate-400 mb-2">Modified (Doc B):</span>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {diff.doc2Text || '(Blank page)'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
