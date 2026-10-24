'use client';

import React, { useState, useRef } from 'react';
import { Scan, Camera, Upload, Trash2, ArrowRight, Check } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { downloadBlob, openBlobInNewTab, formatBytes } from '@/lib/pdf/pdfUtils';
import { PDFDocument } from 'pdf-lib';

export default function ScanToPdfPage() {
  const [scannedImages, setScannedImages] = useState<string[]>([]);
  const [filterMode, setFilterMode] = useState<'bw' | 'grayscale' | 'color'>('bw');
  const [isCameraActive, setIsCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputBytes, setOutputBytes] = useState<Uint8Array | null>(null);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err: any) {
      setError(`Camera access error: ${err.message || 'Permission denied or no camera device found'}`);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Apply document scanner filter
    if (filterMode === 'grayscale' || filterMode === 'bw') {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        if (filterMode === 'bw') {
          const v = avg > 128 ? 255 : 0;
          data[i] = v;
          data[i + 1] = v;
          data[i + 2] = v;
        } else {
          data[i] = avg;
          data[i + 1] = avg;
          data[i + 2] = avg;
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setScannedImages([...scannedImages, dataUrl]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    Array.from(e.target.files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setScannedImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleGeneratePdf = async () => {
    if (scannedImages.length === 0) return;
    setIsProcessing(true);
    setError(null);

    try {
      const pdfDoc = await PDFDocument.create();

      for (const dataUrl of scannedImages) {
        const res = await fetch(dataUrl);
        const imgBytes = await res.arrayBuffer();
        const img = await pdfDoc.embedJpg(imgBytes);

        const page = pdfDoc.addPage([img.width, img.height]);
        page.drawImage(img, {
          x: 0,
          y: 0,
          width: img.width,
          height: img.height,
        });
      }

      const pdfBytes = await pdfDoc.save();
      setOutputBytes(pdfBytes);
      stopCamera();
    } catch (err: any) {
      setError(`Failed to create scan PDF: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolLayout
      title="Scan to PDF"
      description="Capture document scans directly from your mobile or laptop camera, apply document filters, and compile into a PDF."
      icon={<Scan size={28} />}
      iconBgColor="bg-orange-50 dark:bg-orange-950/60"
      iconTextColor="text-orange-500"
      isProcessing={isProcessing}
      error={error}
      successResult={
        outputBytes
          ? {
              filename: 'scanned_document.pdf',
              filesize: formatBytes(outputBytes.byteLength),
              onDownload: () => downloadBlob(outputBytes, 'scanned_document.pdf'),
              onOpenInNewTab: () => openBlobInNewTab(outputBytes, 'scanned_document.pdf'),
              onReset: () => {
                setScannedImages([]);
                setOutputBytes(null);
              },
            }
          : null
      }
    >
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Camera and Capture Controls */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {!isCameraActive ? (
                <button
                  type="button"
                  onClick={startCamera}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md cursor-pointer"
                >
                  <Camera size={16} />
                  <span>Open Device Camera</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  <span>Close Camera</span>
                </button>
              )}

              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 cursor-pointer">
                <Upload size={14} />
                <span>Upload Photos</span>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFilterMode('bw')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterMode === 'bw' ? 'bg-white dark:bg-slate-900 shadow text-orange-600' : 'text-slate-500'
                }`}
              >
                B&W Doc
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('grayscale')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterMode === 'grayscale' ? 'bg-white dark:bg-slate-900 shadow text-orange-600' : 'text-slate-500'
                }`}
              >
                Grayscale
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('color')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterMode === 'color' ? 'bg-white dark:bg-slate-900 shadow text-orange-600' : 'text-slate-500'
                }`}
              >
                Color
              </button>
            </div>
          </div>

          {/* Active Video Stream */}
          {isCameraActive && (
            <div className="relative rounded-2xl overflow-hidden bg-black max-w-lg mx-auto aspect-video flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={capturePhoto}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-white border-4 border-orange-500 shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title="Capture Page"
              >
                <div className="w-8 h-8 rounded-full bg-orange-500" />
              </button>
            </div>
          )}
        </div>

        {/* Captured Scans Gallery */}
        {scannedImages.length > 0 && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                Captured Pages ({scannedImages.length})
              </h3>
              <button
                type="button"
                onClick={handleGeneratePdf}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                <span>Compile into PDF</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {scannedImages.map((img, i) => (
                <div key={i} className="relative rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`Scan ${i + 1}`} className="w-full h-32 object-cover" />
                  <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-bold">
                    {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => setScannedImages(scannedImages.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 p-1 rounded bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  );
}
