'use client';

import React, { useState, useRef } from 'react';
import { EyeOff, ArrowRight, ShieldAlert, Plus, Trash2 } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { Dropzone } from '@/components/Dropzone';
import { readFileAsArrayBuffer, downloadBlob, openBlobInNewTab, formatBytes } from '@/lib/pdf/pdfUtils';
import { redactPdf, RedactionBox } from '@/lib/pdf/redactEngine';
import { renderPageThumbnail } from '@/lib/pdf/pdfRenderer';

export default function RedactPage() {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [boxes, setBoxes] = useState<RedactionBox[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputBytes, setOutputBytes] = useState<Uint8Array | null>(null);

  const previewRef = useRef<HTMLDivElement>(null);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setError(null);
    try {
      const arrayBuf = await readFileAsArrayBuffer(selected);
      setFile(selected);
      setBuffer(arrayBuf);
      setOutputBytes(null);

      const thumb = await renderPageThumbnail(arrayBuf, 1, 400);
      setThumbnailUrl(thumb);
    } catch (err: any) {
      setError(`Failed to read file: ${err.message}`);
    }
  };

  const addPresetBox = (label: string) => {
    // Add sample redaction box on page 0
    const newBox: RedactionBox = {
      pageIndex: 0,
      x: 10 + boxes.length * 5,
      y: 70 - boxes.length * 10,
      width: 45,
      height: 6,
    };
    setBoxes([...boxes, newBox]);
  };

  const handleApplyRedaction = async () => {
    if (!buffer) return;
    if (boxes.length === 0) {
      setError('Please add at least one redaction box before applying.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const redacted = await redactPdf(buffer, boxes);
      setOutputBytes(redacted);
    } catch (err: any) {
      setError(`Redaction failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const outFilename = file ? `redacted_${file.name}` : 'redacted_document.pdf';

  return (
    <ToolLayout
      title="Redact PDF"
      description="Permanently remove sensitive information, personal data, or graphics from PDF documents."
      icon={<EyeOff size={28} />}
      iconBgColor="bg-slate-100 dark:bg-slate-800"
      iconTextColor="text-slate-800 dark:text-slate-200"
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
                setBoxes([]);
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
            title="Drop your PDF here to redact"
            subtitle="Black out confidential text and scrub document metadata"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Controls */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-2 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs">
              <ShieldAlert size={18} className="flex-shrink-0" />
              <span>
                Redaction permanently destroys the covered vector and raster data. This action is irreversible.
              </span>
            </div>

            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Active Redaction Boxes ({boxes.length})
              </h3>
              <button
                type="button"
                onClick={() => addPresetBox('Redact Line')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow cursor-pointer"
              >
                <Plus size={14} />
                <span>Add Redaction Box</span>
              </button>
            </div>

            {boxes.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                No redaction boxes added yet. Click &quot;Add Redaction Box&quot; to place a blackout strip.
              </p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {boxes.map((b, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold">Box #{i + 1}</span>
                      <span className="text-slate-400 ml-2">
                        X: {Math.round(b.x)}%, Y: {Math.round(b.y)}%, W: {Math.round(b.width)}%
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBoxes(boxes.filter((_, idx) => idx !== i))}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleApplyRedaction}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-sm shadow-lg transition-all cursor-pointer"
            >
              <EyeOff size={18} />
              <span>Burn Redactions Permanently</span>
            </button>
          </div>

          {/* Preview Canvas */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Page 1 Redaction Preview
            </h4>

            {thumbnailUrl && (
              <div
                ref={previewRef}
                className="relative inline-block border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden max-w-[320px] select-none"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumbnailUrl} alt="Page preview" className="w-full h-auto block" />

                {boxes.map((box, i) => (
                  <div
                    key={i}
                    className="absolute bg-black border border-white/50 cursor-move flex items-center justify-center"
                    style={{
                      left: `${box.x}%`,
                      bottom: `${box.y}%`,
                      width: `${box.width}%`,
                      height: `${box.height}%`,
                    }}
                  >
                    <span className="text-[9px] text-white/70 font-mono tracking-widest uppercase">
                      REDACTED
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
