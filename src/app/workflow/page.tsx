'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Workflow, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Play, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  RefreshCw, 
  Sliders, 
  FileCheck2,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { Dropzone } from '@/components/Dropzone';
import { ProgressBar } from '@/components/ProgressBar';
import { readFileAsArrayBuffer, downloadBlob, openBlobInNewTab, formatBytes } from '@/lib/pdf/pdfUtils';
import { 
  executeWorkflow, 
  WorkflowStep, 
  WorkflowDefinition, 
  WorkflowStepProgress 
} from '@/lib/pdf/workflowEngine';

const AVAILABLE_STEP_TYPES: {
  type: WorkflowStep['toolType'];
  title: string;
  defaultConfig: Record<string, any>;
  description: string;
}[] = [
  {
    type: 'compress',
    title: 'Compress PDF',
    defaultConfig: { preset: 'recommended' },
    description: 'Reduce file size while optimizing quality',
  },
  {
    type: 'watermark',
    title: 'Watermark',
    defaultConfig: { text: 'CONFIDENTIAL', opacity: 0.3, position: 'center' },
    description: 'Stamp custom watermark text across all pages',
  },
  {
    type: 'pageNumbers',
    title: 'Page Numbers',
    defaultConfig: { position: 'bottom-right', format: 'Page {n} of {total}' },
    description: 'Add pagination numbers to pages',
  },
  {
    type: 'rotate',
    title: 'Rotate PDF',
    defaultConfig: { angle: 90 },
    description: 'Rotate all pages by 90 degrees',
  },
  {
    type: 'crop',
    title: 'Crop Margins',
    defaultConfig: { margins: { topPercent: 5, bottomPercent: 5, leftPercent: 5, rightPercent: 5 } },
    description: 'Trim 5% margin white-space around pages',
  },
  {
    type: 'pdfa',
    title: 'PDF to PDF/A',
    defaultConfig: { standard: 'PDF/A-1b' },
    description: 'Standardize to ISO 19005 archival format',
  },
  {
    type: 'repair',
    title: 'Repair PDF',
    defaultConfig: {},
    description: 'Rebuild XREF tables and normalize stream headers',
  },
  {
    type: 'protect',
    title: 'Protect PDF',
    defaultConfig: { password: 'pass' },
    description: 'Encrypt with password security envelope',
  },
];

const PRESET_WORKFLOWS: WorkflowDefinition[] = [
  {
    id: 'preset-client-dist',
    name: 'Client Document Preparation',
    description: 'Compress file, stamp watermark, and add bottom-right page numbers',
    steps: [
      {
        id: 's1',
        toolType: 'compress',
        title: 'Compress PDF',
        config: { preset: 'recommended' },
      },
      {
        id: 's2',
        toolType: 'watermark',
        title: 'Watermark',
        config: { text: 'CONFIDENTIAL', opacity: 0.3, position: 'center' },
      },
      {
        id: 's3',
        toolType: 'pageNumbers',
        title: 'Page Numbers',
        config: { position: 'bottom-right', format: 'Page {n} of {total}' },
      },
    ],
  },
  {
    id: 'preset-archival',
    name: 'Long-term Archival Pipeline',
    description: 'Repair headers, compress, and convert to ISO PDF/A',
    steps: [
      {
        id: 's1',
        toolType: 'repair',
        title: 'Repair PDF',
        config: {},
      },
      {
        id: 's2',
        toolType: 'compress',
        title: 'Compress PDF',
        config: { preset: 'recommended' },
      },
      {
        id: 's3',
        toolType: 'pdfa',
        title: 'PDF to PDF/A',
        config: { standard: 'PDF/A-1b' },
      },
    ],
  },
];

export default function WorkflowPage() {
  const [file, setFile] = useState<File | null>(null);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);

  const [steps, setSteps] = useState<WorkflowStep[]>(PRESET_WORKFLOWS[0].steps);
  const [workflowName, setWorkflowName] = useState(PRESET_WORKFLOWS[0].name);

  const [savedWorkflows, setSavedWorkflows] = useState<WorkflowDefinition[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stepProgress, setStepProgress] = useState<Record<number, WorkflowStepProgress['status']>>({});
  const [error, setError] = useState<string | null>(null);
  const [outputBytes, setOutputBytes] = useState<Uint8Array | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('pdf_workflows');
      if (stored) {
        setSavedWorkflows(JSON.parse(stored));
      } else {
        setSavedWorkflows(PRESET_WORKFLOWS);
      }
    } catch {}
  }, []);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selected = files[0];
    setError(null);
    try {
      const arrayBuf = await readFileAsArrayBuffer(selected);
      setFile(selected);
      setBuffer(arrayBuf);
      setOutputBytes(null);
    } catch (err: any) {
      setError(`Failed to read file: ${err.message}`);
    }
  };

  const addStep = (toolType: WorkflowStep['toolType']) => {
    const template = AVAILABLE_STEP_TYPES.find((t) => t.type === toolType);
    if (!template) return;

    const newStep: WorkflowStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      toolType: template.type,
      title: template.title,
      config: { ...template.defaultConfig },
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= steps.length) return;
    const copy = [...steps];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;
    setSteps(copy);
  };

  const saveWorkflowToStorage = () => {
    const newWorkflow: WorkflowDefinition = {
      id: `wf-${Date.now()}`,
      name: workflowName || 'Custom Workflow',
      description: `${steps.length} steps automated pipeline`,
      steps,
    };
    const updated = [newWorkflow, ...savedWorkflows.filter((w) => w.id !== newWorkflow.id)];
    setSavedWorkflows(updated);
    localStorage.setItem('pdf_workflows', JSON.stringify(updated));
    alert('Workflow saved successfully! You can reuse it anytime.');
  };

  const loadWorkflow = (wf: WorkflowDefinition) => {
    setWorkflowName(wf.name);
    setSteps(wf.steps);
  };

  const handleRunWorkflow = async () => {
    if (!buffer) return;
    if (steps.length === 0) {
      setError('Please add at least one tool step to the workflow pipeline.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setStepProgress({});

    try {
      const finalBytes = await executeWorkflow(buffer, steps, (prog) => {
        setStepProgress((prev) => ({
          ...prev,
          [prog.stepIndex]: prog.status,
        }));
      });
      setOutputBytes(finalBytes);
    } catch (err: any) {
      setError(err.message || 'Workflow execution encountered an error.');
    } finally {
      setIsProcessing(false);
    }
  };

  const outFilename = file ? `workflow_${file.name}` : 'workflow_processed.pdf';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Navbar */}
      <div className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/60 backdrop-blur-md sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            <span>All Tools</span>
          </Link>

          <div className="flex items-center gap-2 text-xs font-semibold text-rose-500">
            <Workflow size={15} />
            <span>Automated Sequential Pipeline</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-500 mb-4 shadow-sm">
            <Workflow size={28} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
            Create a Workflow
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Chain multiple PDF tools into an automated sequential pipeline and process documents in a single click.
          </p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mb-8 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 flex items-start gap-3 shadow-sm">
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5 text-rose-500" />
            <div className="text-xs sm:text-sm">
              <span className="font-bold">Error: </span>
              {error}
            </div>
          </div>
        )}

        {/* Success Download Screen */}
        {outputBytes && !isProcessing ? (
          <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 shadow-xl text-center max-w-2xl mx-auto animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-sm">
              <CheckCircle2 size={36} />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Workflow Complete!
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-6">
              All {steps.length} automated steps succeeded sequentially.
            </p>

            <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 mb-8 max-w-full truncate">
              <FileCheck2 size={18} className="text-emerald-500 flex-shrink-0" />
              <span className="truncate">{outFilename}</span>
              <span className="text-slate-400 text-xs">({formatBytes(outputBytes.byteLength)})</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <button
                onClick={() => downloadBlob(outputBytes, outFilename)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 cursor-pointer"
              >
                <Download size={18} />
                <span>Download Processed PDF</span>
              </button>

              <button
                onClick={() => openBlobInNewTab(outputBytes, outFilename)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-sm cursor-pointer"
              >
                <span>Preview Tab</span>
              </button>

              <button
                onClick={() => {
                  setOutputBytes(null);
                  setFile(null);
                  setBuffer(null);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-sm cursor-pointer"
              >
                <RefreshCw size={16} />
                <span>Process Another</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Columns: Pipeline Builder */}
            <div className="lg:col-span-2 space-y-6">
              {/* Workflow Name & Actions */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Workflow Title
                  </label>
                  <input
                    type="text"
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    className="w-full font-bold text-base bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 focus:outline-none focus:border-rose-500 pb-1"
                  />
                </div>

                <button
                  type="button"
                  onClick={saveWorkflowToStorage}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  <Save size={14} />
                  <span>Save Workflow</span>
                </button>
              </div>

              {/* Sequential Steps List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Execution Steps ({steps.length})
                  </span>
                </div>

                {steps.map((step, idx) => (
                  <div
                    key={step.id}
                    className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm flex items-center justify-between gap-4 transition-all ${
                      stepProgress[idx] === 'running'
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                        : stepProgress[idx] === 'completed'
                        ? 'border-emerald-500'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                          stepProgress[idx] === 'completed'
                            ? 'bg-emerald-500 text-white'
                            : stepProgress[idx] === 'running'
                            ? 'bg-indigo-600 text-white animate-pulse'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}
                      >
                        {stepProgress[idx] === 'completed' ? <CheckCircle2 size={16} /> : idx + 1}
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {step.title}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          {step.toolType === 'compress' && `Preset: ${step.config.preset || 'recommended'}`}
                          {step.toolType === 'watermark' && `Text: "${step.config.text || 'CONFIDENTIAL'}"`}
                          {step.toolType === 'pageNumbers' && `Format: ${step.config.format || 'Page {n}'}`}
                          {step.toolType === 'rotate' && `Angle: ${step.config.angle || 90}°`}
                          {step.toolType === 'crop' && 'Margins: 5% crop'}
                          {step.toolType === 'pdfa' && 'ISO PDF/A-1b archival conformance'}
                          {step.toolType === 'repair' && 'Byte reconstruction & XREF rebuild'}
                          {step.toolType === 'protect' && 'Password encryption envelope'}
                        </p>
                      </div>
                    </div>

                    {/* Step Management Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveStep(idx, 'up')}
                        disabled={idx === 0 || isProcessing}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStep(idx, 'down')}
                        disabled={idx === steps.length - 1 || isProcessing}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeStep(idx)}
                        disabled={isProcessing}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                        title="Delete Step"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Step Tool Picker */}
              <div className="p-5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40">
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  + Add Next Processing Step
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {AVAILABLE_STEP_TYPES.map((t) => (
                    <button
                      key={t.type}
                      type="button"
                      onClick={() => addStep(t.type)}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-left hover:border-rose-400 hover:shadow-sm transition-all cursor-pointer group"
                    >
                      <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-rose-500">
                        {t.title}
                      </span>
                      <span className="block text-[10px] text-slate-400 truncate">
                        {t.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: File Input & Execution */}
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Target Document
                </h3>

                {!file ? (
                  <Dropzone
                    onFilesSelected={handleFilesSelected}
                    accept=".pdf,application/pdf"
                    maxFiles={1}
                    title="Select PDF to run workflow"
                  />
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                        {file.name}
                      </p>
                      <p className="text-[11px] text-slate-400">{formatBytes(file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setBuffer(null);
                      }}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Change
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  disabled={!file || steps.length === 0 || isProcessing}
                  onClick={handleRunWorkflow}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-bold text-sm shadow-lg shadow-rose-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <Play size={18} />
                  <span>{isProcessing ? 'Executing Workflow...' : 'Run Automated Pipeline'}</span>
                </button>
              </div>

              {/* Saved & Preset Workflows */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                  Pre-configured & Saved Workflows
                </h3>

                <div className="space-y-2">
                  {savedWorkflows.map((wf) => (
                    <button
                      key={wf.id}
                      type="button"
                      onClick={() => loadWorkflow(wf)}
                      className="w-full p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-left hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer"
                    >
                      <span className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                        {wf.name}
                      </span>
                      <span className="block text-[11px] text-slate-500 truncate">
                        {wf.description || `${wf.steps.length} sequential steps`}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
