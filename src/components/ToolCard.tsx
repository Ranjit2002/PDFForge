'use client';

import React from 'react';
import Link from 'next/link';

export interface ToolItem {
  id: string;
  title: string;
  description: string;
  href: string;
  category: 'management' | 'conversion' | 'editing' | 'ai' | 'workflow';
  isNew?: boolean;
  iconBgColor?: string;
  iconTextColor?: string;
  renderIcon: () => React.ReactNode;
}

export function ToolCard({ tool }: { tool: ToolItem }) {
  return (
    <Link
      href={tool.href}
      className="group relative flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xl hover:shadow-slate-500/5 hover:-translate-y-0.5 transition-all duration-200"
    >
      <div>
        {/* Top Header: Icon & optional 'New!' badge */}
        <div className="flex items-start justify-between mb-4">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105 shadow-sm ${
              tool.iconBgColor || 'bg-slate-100 dark:bg-slate-800'
            } ${tool.iconTextColor || 'text-slate-700 dark:text-slate-300'}`}
          >
            {tool.renderIcon()}
          </div>

          {tool.isNew && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/50">
              New!
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-[15px] font-bold text-slate-800 dark:text-slate-100 mb-1.5 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          {tool.title}
        </h3>

        {/* Subtitle / Description */}
        <p className="text-[12px] text-slate-500 dark:text-slate-400 leading-relaxed">
          {tool.description}
        </p>
      </div>
    </Link>
  );
}

export function WorkflowCard() {
  return (
    <Link
      href="/workflow"
      className="group relative flex flex-col justify-between p-5 sm:p-6 rounded-2xl bg-[#FDF0ED] dark:bg-[#261816] border border-[#F8CEC4] dark:border-rose-900/40 hover:shadow-xl hover:shadow-rose-500/10 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
    >
      {/* Decorative dashed background elements matching screenshot */}
      <div className="absolute top-2 right-2 w-28 h-28 border border-dashed border-[#F4ADA0]/50 dark:border-rose-800/40 rounded-full pointer-events-none -mr-8 -mt-8" />
      <div className="absolute bottom-3 right-3 w-20 h-10 border border-dashed border-[#F4ADA0]/50 dark:border-rose-800/40 rounded-full pointer-events-none" />

      <div>
        <h3 className="text-[16px] font-bold text-slate-900 dark:text-white mb-2 leading-snug">
          Create a workflow
        </h3>

        <p className="text-[12px] text-slate-600 dark:text-rose-200/70 leading-relaxed mb-6 max-w-[210px]">
          Create custom workflows with your favorite tools, automate tasks, and reuse them anytime.
        </p>
      </div>

      <div className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
        <span>Create workflow</span>
        <span className="text-sm font-bold group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">↗</span>
      </div>
    </Link>
  );
}
