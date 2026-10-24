'use client';

import React, { useState } from 'react';
import { Stamp, ArrowRight, Type, Image as ImageIcon } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { Dropzone } from '@/components/Dropzone';
import { readFileAsArrayBuffer, downloadBlob, openBlobInNewTab, formatBytes } from '@/lib/pdf/pdfUtils';
import { applyWatermark, WatermarkOptions } from '@/lib/pdf/watermarkEngine';
import { renderPageThumbnail } from '@/lib/pdf/pdfRenderer';

export default function WatermarkPage() {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  const [mode, setMode] = useState<'text' | 'image'>('text');
  const [text, setText] = useState('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState(48);
  const [colorHex, setColorHex] = useState('#94A3B8');
  const [opacity, setOpacity] = useState(0.35);
  const [rotationDegrees, setRotationDegrees] = useState(45);
  const [position, setPosition] = useState<'center' | 'top' | 'bottom'>('center');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBuffer, setImageBuffer] = useState<ArrayBuffer | null>(null);

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

      const thumb = await renderPageThumbnail(arrayBuf, 1, 360);
      setThumbnailUrl(thumb);
    } catch (err: any) {
      setError(`Failed to read file: ${err.message}`);
    }
  };

  const handleImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const img = e.target.files[0];
    setImageFile(img);
    const buf = await readFileAsArrayBuffer(img);
    setImageBuffer(buf);
  };

  const handleApplyWatermark = async () => {
    if (!buffer) return;
    setIsProcessing(true);
    setError(null);

    try {
      let options: WatermarkOptions;
      if (mode === 'text') {
        options = {
          type: 'text',
          text,
          fontSize,
          colorHex,
          opacity,
          rotationDegrees,
          position,
        };
      } else {
        if (!imageBuffer || !imageFile) {
          throw new Error('Please select an image file for the watermark');
        }
        options = {
          type: 'image',
          imageBuffer,
          imageFormat: imageFile.type.includes('png') ? 'png' : 'jpg',
          opacity,
          scale: 0.4,
          position: 'center',
        };
      }

      const watermarked = await applyWatermark(buffer, options);
      setOutputBytes(watermarked);
    } catch (err: any) {
      setError(`Watermark failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const outFilename = file ? `watermarked_${file.name}` : 'watermarked_document.pdf';

  return (
    <ToolLayout
      title="Watermark PDF"
      description="Stamp an image or text over your PDF in seconds. Choose typography, transparency, rotation, and position."
      icon={<Stamp size={28} />}
      iconBgColor="bg-fuchsia-50 dark:bg-fuchsia-950/60"
      iconTextColor="text-fuchsia-600 dark:text-fuchsia-400"
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
            title="Drop your PDF here to watermark"
            subtitle="Stamp custom text or images over every page"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Controls */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            {/* Mode Selector */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
              <button
                type="button"
                onClick={() => setMode('text')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  mode === 'text'
                    ? 'bg-white dark:bg-slate-900 text-fuchsia-600 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Type size={14} />
                <span>Text Watermark</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('image')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  mode === 'image'
                    ? 'bg-white dark:bg-slate-900 text-fuchsia-600 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <ImageIcon size={14} />
                <span>Image Watermark</span>
              </button>
            </div>

            {mode === 'text' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Watermark Text
                  </label>
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="e.g. CONFIDENTIAL, DRAFT, DO NOT COPY"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Font Size ({fontSize}pt)</label>
                    <input
                      type="range"
                      min="24"
                      max="80"
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-full accent-fuchsia-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Rotation ({rotationDegrees}°)</label>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      step="15"
                      value={rotationDegrees}
                      onChange={(e) => setRotationDegrees(Number(e.target.value))}
                      className="w-full accent-fuchsia-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Color</label>
                    <input
                      type="color"
                      value={colorHex}
                      onChange={(e) => setColorHex(e.target.value)}
                      className="w-full h-10 rounded-xl cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Position</label>
                    <select
                      value={position}
                      onChange={(e: any) => setPosition(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold"
                    >
                      <option value="center">Center Diagonal</option>
                      <option value="top">Top Header</option>
                      <option value="bottom">Bottom Footer</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Select Logo or Stamp Image (PNG / JPG)
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={handleImageSelected}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-fuchsia-50 file:text-fuchsia-700 hover:file:bg-fuchsia-100"
                />
              </div>
            )}

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span>Opacity</span>
                <span className="font-bold text-fuchsia-600">{Math.round(opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full accent-fuchsia-600"
              />
            </div>

            <button
              onClick={handleApplyWatermark}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-sm shadow-lg shadow-fuchsia-500/25 transition-all cursor-pointer"
            >
              <Stamp size={18} />
              <span>Apply Watermark & Download</span>
            </button>
          </div>

          {/* Live Preview */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Watermark Sample Preview
            </h4>

            {thumbnailUrl && (
              <div className="relative inline-block border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden max-w-[280px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumbnailUrl} alt="Page preview" className="w-full h-auto block" />

                {mode === 'text' && (
                  <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none select-none font-black text-center"
                    style={{
                      opacity,
                      color: colorHex,
                      transform: `rotate(${rotationDegrees}deg)`,
                      fontSize: `${fontSize * 0.4}px`,
                    }}
                  >
                    {text}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </ToolLayout>
  );
}
