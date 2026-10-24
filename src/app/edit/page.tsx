'use client';

import React, { useState, useRef } from 'react';
import { Edit3, Type, Square, Save, RotateCw, Plus, Trash2 } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { Dropzone } from '@/components/Dropzone';
import { readFileAsArrayBuffer, downloadBlob, openBlobInNewTab, formatBytes } from '@/lib/pdf/pdfUtils';
import { renderPageThumbnail } from '@/lib/pdf/pdfRenderer';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface TextAnnotation {
  id: string;
  text: string;
  xPercent: number;
  yPercent: number; // from bottom
  fontSize: number;
  colorHex: string;
}

export default function EditPage() {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  const [annotations, setAnnotations] = useState<TextAnnotation[]>([]);
  const [currentText, setCurrentText] = useState('Edited text annotation');
  const [fontSize, setFontSize] = useState(16);
  const [colorHex, setColorHex] = useState('#2563EB');

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputBytes, setOutputBytes] = useState<Uint8Array | null>(null);

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

  const addTextAnnotation = () => {
    const newAnn: TextAnnotation = {
      id: `ann-${Date.now()}`,
      text: currentText,
      xPercent: 20,
      yPercent: 70 - annotations.length * 10,
      fontSize,
      colorHex,
    };
    setAnnotations([...annotations, newAnn]);
  };

  const handleSaveAndExport = async () => {
    if (!buffer) return;
    setIsProcessing(true);
    setError(null);

    try {
      const pdfDoc = await PDFDocument.load(buffer.slice(0), { ignoreEncryption: true });
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const page = pdfDoc.getPages()[0];
      const { width, height } = page.getSize();

      for (const ann of annotations) {
        let cleanHex = ann.colorHex.replace('#', '');
        if (cleanHex.length === 3) cleanHex = cleanHex.split('').map(c => c + c).join('');
        const num = parseInt(cleanHex, 16) || 0;
        const r = ((num >> 16) & 255) / 255;
        const g = ((num >> 8) & 255) / 255;
        const b = (num & 255) / 255;

        page.drawText(ann.text, {
          x: (ann.xPercent / 100) * width,
          y: (ann.yPercent / 100) * height,
          size: ann.fontSize,
          font,
          color: rgb(r, g, b),
        });
      }

      const editedBytes = await pdfDoc.save();
      setOutputBytes(editedBytes);
    } catch (err: any) {
      setError(`Editing failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const outFilename = file ? `edited_${file.name}` : 'edited_document.pdf';

  return (
    <ToolLayout
      title="Edit PDF"
      description="Add text, annotations, shapes, and notes directly onto your PDF document."
      icon={<Edit3 size={28} />}
      iconBgColor="bg-purple-50 dark:bg-purple-950/60"
      iconTextColor="text-purple-600 dark:text-purple-400"
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
                setAnnotations([]);
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
            title="Drop your PDF here to edit"
            subtitle="Add custom text, titles, notes, and annotations"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Controls */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Add Text Annotation
            </h3>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Annotation Content
              </label>
              <input
                type="text"
                value={currentText}
                onChange={(e) => setCurrentText(e.target.value)}
                placeholder="Enter text to stamp on page..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Font Size ({fontSize}pt)</label>
                <input
                  type="range"
                  min="10"
                  max="48"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full accent-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Color</label>
                <input
                  type="color"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="w-full h-10 rounded-xl cursor-pointer"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={addTextAnnotation}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-bold text-xs hover:bg-purple-200 cursor-pointer transition-colors"
            >
              <Plus size={16} />
              <span>Add to Document</span>
            </button>

            {annotations.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500">Active Annotations:</span>
                {annotations.map((ann, i) => (
                  <div
                    key={ann.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 text-xs border border-slate-200 dark:border-slate-800"
                  >
                    <span className="font-semibold truncate max-w-[200px]" style={{ color: ann.colorHex }}>
                      {ann.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAnnotations(annotations.filter((a) => a.id !== ann.id))}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleSaveAndExport}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-500/25 transition-all cursor-pointer"
            >
              <Save size={18} />
              <span>Burn Edits & Export PDF</span>
            </button>
          </div>

          {/* Canvas Preview */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Page 1 Live Edit Preview
            </h4>

            {thumbnailUrl && (
              <div className="relative inline-block border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden max-w-[320px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumbnailUrl} alt="Page preview" className="w-full h-auto block" />

                {annotations.map((ann) => (
                  <div
                    key={ann.id}
                    className="absolute font-bold pointer-events-none select-none px-1.5 py-0.5 rounded bg-white/80 shadow-sm"
                    style={{
                      left: `${ann.xPercent}%`,
                      bottom: `${ann.yPercent}%`,
                      fontSize: `${ann.fontSize * 0.4}px`,
                      color: ann.colorHex,
                    }}
                  >
                    {ann.text}
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
