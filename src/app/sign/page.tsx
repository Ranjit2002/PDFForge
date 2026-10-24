'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PenTool, Check, Eraser, Type, Upload, ArrowRight } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { Dropzone } from '@/components/Dropzone';
import { readFileAsArrayBuffer, downloadBlob, openBlobInNewTab, formatBytes } from '@/lib/pdf/pdfUtils';
import { renderPageThumbnail } from '@/lib/pdf/pdfRenderer';
import { PDFDocument } from 'pdf-lib';

export default function SignPage() {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  const [signMode, setSignMode] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState('John Doe');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  const [sigPosition, setSigPosition] = useState<{ x: number; y: number }>({ x: 25, y: 15 });

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputBytes, setOutputBytes] = useState<Uint8Array | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

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

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureDataUrl(canvas.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setSignatureDataUrl(null);
    }
  };

  // Render typed signature to canvas
  const generateTypedSignature = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.font = 'italic bold 42px "Brush Script MT", "Caveat", "Segoe Script", cursive';
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(typedName, 200, 80);
      setSignatureDataUrl(canvas.toDataURL('image/png'));
    }
  };

  useEffect(() => {
    if (signMode === 'type') {
      generateTypedSignature();
    }
  }, [typedName, signMode]);

  const handleApplySignature = async () => {
    if (!buffer) return;
    if (!signatureDataUrl) {
      setError('Please draw or create your signature first.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const pdfDoc = await PDFDocument.load(buffer.slice(0), { ignoreEncryption: true });
      const page = pdfDoc.getPages()[0];
      const { width, height } = page.getSize();

      const imgBytes = await (await fetch(signatureDataUrl)).arrayBuffer();
      const embeddedSig = await pdfDoc.embedPng(imgBytes);

      const sigWidth = 140;
      const sigHeight = (sigWidth / embeddedSig.width) * embeddedSig.height;

      page.drawImage(embeddedSig, {
        x: (sigPosition.x / 100) * width,
        y: (sigPosition.y / 100) * height,
        width: sigWidth,
        height: sigHeight,
      });

      const signedBytes = await pdfDoc.save();
      setOutputBytes(signedBytes);
    } catch (err: any) {
      setError(`Failed to sign document: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const outFilename = file ? `signed_${file.name}` : 'signed_document.pdf';

  return (
    <ToolLayout
      title="Sign PDF"
      description="Sign yourself or place an electronic signature directly onto contracts and agreements."
      icon={<PenTool size={28} />}
      iconBgColor="bg-indigo-50 dark:bg-indigo-950/60"
      iconTextColor="text-indigo-600 dark:text-indigo-400"
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
                setSignatureDataUrl(null);
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
            title="Drop your PDF here to sign"
            subtitle="Draw, type, or stamp an authentic digital signature"
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
                onClick={() => setSignMode('draw')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  signMode === 'draw'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <PenTool size={14} />
                <span>Draw Signature</span>
              </button>
              <button
                type="button"
                onClick={() => setSignMode('type')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  signMode === 'type'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Type size={14} />
                <span>Type Signature</span>
              </button>
            </div>

            {signMode === 'draw' ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                  <span>Draw your signature below:</span>
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="inline-flex items-center gap-1 text-red-500 hover:text-red-700 cursor-pointer"
                  >
                    <Eraser size={13} />
                    <span>Clear</span>
                  </button>
                </div>
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={160}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-40 cursor-crosshair touch-none"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Your Full Name
                  </label>
                  <input
                    type="text"
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center">
                  <span className="text-3xl italic font-bold font-serif text-slate-800 dark:text-slate-200">
                    {typedName}
                  </span>
                </div>
              </div>
            )}

            {/* Position Controls */}
            <div>
              <span className="text-xs font-bold text-slate-500 block mb-2">Signature Position (% on page)</span>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] text-slate-400">Horizontal: {sigPosition.x}%</span>
                  <input
                    type="range"
                    min="5"
                    max="80"
                    value={sigPosition.x}
                    onChange={(e) => setSigPosition({ ...sigPosition, x: Number(e.target.value) })}
                    className="w-full accent-indigo-600"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-400">Vertical: {sigPosition.y}%</span>
                  <input
                    type="range"
                    min="5"
                    max="85"
                    value={sigPosition.y}
                    onChange={(e) => setSigPosition({ ...sigPosition, y: Number(e.target.value) })}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleApplySignature}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
            >
              <Check size={18} />
              <span>Stamp Signature & Download</span>
            </button>
          </div>

          {/* Preview Canvas */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Page 1 Signature Stamp Preview
            </h4>

            {thumbnailUrl && (
              <div className="relative inline-block border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden max-w-[320px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumbnailUrl} alt="Page preview" className="w-full h-auto block" />

                {signatureDataUrl && (
                  <div
                    className="absolute pointer-events-none select-none"
                    style={{
                      left: `${sigPosition.x}%`,
                      bottom: `${sigPosition.y}%`,
                      width: '35%',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={signatureDataUrl} alt="Signature" className="w-full h-auto drop-shadow-sm" />
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
