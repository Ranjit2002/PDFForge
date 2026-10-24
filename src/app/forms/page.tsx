'use client';

import React, { useState } from 'react';
import { FormInput, Plus, Check, Save, ArrowRight } from 'lucide-react';
import { ToolLayout } from '@/components/ToolLayout';
import { Dropzone } from '@/components/Dropzone';
import { readFileAsArrayBuffer, downloadBlob, openBlobInNewTab, formatBytes } from '@/lib/pdf/pdfUtils';
import { getPdfFormFields, fillPdfForm, addNewFormFields, DetectedFormField } from '@/lib/pdf/formsEngine';

export default function FormsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [detectedFields, setDetectedFields] = useState<DetectedFormField[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, string | boolean>>({});

  const [activeTab, setActiveTab] = useState<'fill' | 'add'>('fill');
  const [newFieldName, setNewFieldName] = useState('full_name');
  const [newFieldType, setNewFieldType] = useState<'text' | 'checkbox'>('text');

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

      const fields = await getPdfFormFields(arrayBuf);
      setDetectedFields(fields);

      const initialValues: Record<string, string | boolean> = {};
      fields.forEach((f) => {
        initialValues[f.name] = f.value;
      });
      setFieldValues(initialValues);
    } catch (err: any) {
      setError(`Failed to read PDF forms: ${err.message}`);
    }
  };

  const handleFillForm = async () => {
    if (!buffer) return;
    setIsProcessing(true);
    setError(null);

    try {
      const filled = await fillPdfForm(buffer, fieldValues);
      setOutputBytes(filled);
    } catch (err: any) {
      setError(`Failed to fill form: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddNewField = async () => {
    if (!buffer) return;
    setIsProcessing(true);
    setError(null);

    try {
      const updated = await addNewFormFields(buffer, [
        {
          type: newFieldType,
          name: newFieldName || `field_${Date.now()}`,
          pageIndex: 0,
          x: 50,
          y: 700,
          width: newFieldType === 'checkbox' ? 20 : 200,
          height: newFieldType === 'checkbox' ? 20 : 25,
        },
      ]);
      setOutputBytes(updated);
    } catch (err: any) {
      setError(`Failed to add interactive field: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const outFilename = file ? `forms_${file.name}` : 'form_document.pdf';

  return (
    <ToolLayout
      title="PDF Forms"
      description="Detect form fields automatically, create interactive fillable PDFs, or fill form fields directly in your browser."
      badge="New!"
      icon={<FormInput size={28} />}
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
                setDetectedFields([]);
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
            title="Drop your PDF here for form handling"
            subtitle="Fill interactive form inputs or inject new interactive fields"
          />
        </div>
      ) : (
        <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          {/* Tabs */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('fill')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'fill'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Fill Detected Fields ({detectedFields.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('add')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'add'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Add New Fillable Field
            </button>
          </div>

          {activeTab === 'fill' ? (
            <div className="space-y-4">
              {detectedFields.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No existing AcroForm interactive fields found in this document. Use the &quot;Add New Fillable Field&quot; tab to inject interactive fields!
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {detectedFields.map((f) => (
                    <div key={f.name} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{f.name}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">{f.type}</span>
                      </div>

                      {f.type === 'checkbox' ? (
                        <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(fieldValues[f.name])}
                            onChange={(e) =>
                              setFieldValues({ ...fieldValues, [f.name]: e.target.checked })
                            }
                            className="rounded accent-purple-600"
                          />
                          <span>Checked</span>
                        </label>
                      ) : (
                        <input
                          type="text"
                          value={String(fieldValues[f.name] || '')}
                          onChange={(e) =>
                            setFieldValues({ ...fieldValues, [f.name]: e.target.value })
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleFillForm}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-500/25 transition-all cursor-pointer"
              >
                <Save size={18} />
                <span>Save Filled Form & Download</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Field Variable Name
                </label>
                <input
                  type="text"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  placeholder="e.g. customer_name, signature_date"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Field Input Type
                </label>
                <select
                  value={newFieldType}
                  onChange={(e: any) => setNewFieldType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold"
                >
                  <option value="text">Interactive Text Field</option>
                  <option value="checkbox">Interactive Checkbox</option>
                </select>
              </div>

              <button
                onClick={handleAddNewField}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-500/25 transition-all cursor-pointer"
              >
                <Plus size={18} />
                <span>Inject Field into PDF</span>
              </button>
            </div>
          )}
        </div>
      )}
    </ToolLayout>
  );
}
