import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Lock, Zap, Files } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white">
                <Files size={16} />
              </div>
              <span>PDF<span className="bg-gradient-to-r from-indigo-500 to-pink-500 bg-clip-text text-transparent">Forge</span></span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm">
              Industry-grade PDF engineering right in your browser. Merge, split, and compress PDFs with extreme privacy and zero server overhead.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck size={16} />
              <span>100% Client-Side: Documents never leave your device.</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-4">
              PDF Platform
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  All 31 PDF Converters & Tools
                </Link>
              </li>
              <li>
                <Link href="/workflow" className="text-slate-600 dark:text-slate-400 hover:text-rose-500 transition-colors font-semibold">
                  Create a Workflow Pipeline ↗
                </Link>
              </li>
              <li>
                <Link href="/edit" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Edit & Annotate PDF
                </Link>
              </li>
              <li>
                <Link href="/sign" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Electronic Signatures
                </Link>
              </li>
              <li>
                <Link href="/ocr" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  Optical Character Recognition (OCR)
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-200 mb-4">
              Security Standards
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Lock size={14} className="text-emerald-500" />
                <span>Zero Cloud Storage & Transfer</span>
              </li>
              <li className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <Zap size={14} className="text-amber-500" />
                <span>Instant In-Memory Operations</span>
              </li>
              <li className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <ShieldCheck size={14} className="text-sky-500" />
                <span>GDPR & HIPAA Compliant</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-500 gap-4 text-center">
          <p>© {new Date().getFullYear()} PDFForge. High Performance PDF Utilities.</p>
          <p>Engineered with Next.js, WebAssembly & Canvas</p>
        </div>
      </div>
    </footer>
  );
}
