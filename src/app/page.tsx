'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Search, 
  SlidersHorizontal,
  Lock, 
  Zap,
  Sparkles,
  Workflow
} from 'lucide-react';
import { ALL_TOOLS } from '@/lib/toolsCatalog';
import { ToolCard, WorkflowCard } from '@/components/ToolCard';

type CategoryFilter = 'all' | 'management' | 'conversion' | 'editing' | 'ai' | 'workflow';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');

  const filteredTools = useMemo(() => {
    return ALL_TOOLS.filter((tool) => {
      const matchesSearch =
        tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        activeCategory === 'all' || tool.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  const showWorkflowCard = useMemo(() => {
    if (activeCategory === 'all' && !searchQuery) return true;
    if (activeCategory === 'workflow') return true;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return 'create a workflow automate pipeline batch chain'.includes(q);
    }
    return false;
  }, [activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Hero Section */}
      <section className="relative pt-12 pb-8 sm:pt-16 sm:pb-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-semibold mb-6 shadow-sm">
          <ShieldCheck size={16} />
          <span>100% Client-Side • Zero Server Uploads • Maximum Privacy</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15] mb-5">
          Every PDF Tool You Need,{' '}
          <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Directly in Your Browser
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed mb-8">
          Merge, split, convert, edit, sign, and automate your documents locally. No wait queues, zero data leaks, and enterprise-grade performance.
        </p>

        {/* Search & Filter Controls */}
        <div className="max-w-2xl mx-auto space-y-4">
          {/* 1. Search Bar on Top */}
          <div className="relative w-full max-w-xl mx-auto">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 31+ PDF converters, editors, AI tools..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm placeholder:text-slate-400 transition-all text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* 2. Category Tabs Below Search Bar */}
          <div className="w-full max-w-2xl mx-auto">
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap sm:items-center sm:justify-center gap-2 sm:gap-2.5">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-3.5 py-2.5 sm:py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer text-center flex items-center justify-center ${
                  activeCategory === 'all'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                All ({ALL_TOOLS.length})
              </button>
              <button
                onClick={() => setActiveCategory('management')}
                className={`px-3.5 py-2.5 sm:py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer text-center flex items-center justify-center ${
                  activeCategory === 'management'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Management
              </button>
              <button
                onClick={() => setActiveCategory('conversion')}
                className={`px-3.5 py-2.5 sm:py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer text-center flex items-center justify-center ${
                  activeCategory === 'conversion'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Conversion
              </button>
              <button
                onClick={() => setActiveCategory('editing')}
                className={`px-3.5 py-2.5 sm:py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer text-center flex items-center justify-center ${
                  activeCategory === 'editing'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Edit & Security
              </button>
              <button
                onClick={() => setActiveCategory('ai')}
                className={`px-3.5 py-2.5 sm:py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer text-center flex items-center justify-center ${
                  activeCategory === 'ai'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                AI Tools
              </button>
              <button
                onClick={() => setActiveCategory('workflow')}
                className={`px-3.5 py-2.5 sm:py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer text-center flex items-center justify-center ${
                  activeCategory === 'workflow'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/70'
                }`}
              >
                Workflows ↗
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Tools Grid */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {filteredTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}

          {/* Workflow card is shown when 'all' or 'workflow' is active or search matches */}
          {showWorkflowCard && (
            <WorkflowCard />
          )}
        </div>

        {filteredTools.length === 0 && !showWorkflowCard && (
          <div className="text-center py-16">
            <p className="text-base font-semibold text-slate-600 dark:text-slate-400">
              No tools found matching &quot;{searchQuery}&quot;
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
              className="mt-3 text-sm text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      {/* Security & Architecture Highlights */}
      <section className="border-t border-slate-200 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/40 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3">
              Client-Side Processing Guarantee
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
              Unlike cloud services that upload your personal documents to external storage, PDFForge runs in-memory directly on your device.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Lock size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Zero Remote Uploads</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Your tax returns, contracts, and identity documents stay 100% confidential and never leave your web browser.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
                <Zap size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Hardware-Accelerated Speed</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                No slow internet uploads or waiting behind other users in a server queue. Execution runs instantly using native browser memory.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                <Workflow size={20} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Reusable Pipelines</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Chain compress, watermark, page numbers, and security tools into single-click automated workflows with instant batch execution.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
