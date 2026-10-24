'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Files, ShieldCheck, Sun, Moon } from 'lucide-react';

export function Navbar() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800/80 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
            <Files size={20} />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
            PDF<span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">Forge</span>
          </span>
        </Link>

        {/* Right Controls: Workflow link, Privacy Indicator & Theme Toggle */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/workflow"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 transition-colors"
          >
            <span>Workflow Builder</span>
            <span className="text-[10px]">↗</span>
          </Link>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>100% Local & Private</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            type="button"
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center transition-all duration-200 shadow-sm"
            aria-label="Toggle dark and light theme"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun size={18} className="text-amber-400 hover:rotate-45 transition-transform duration-200" />
            ) : (
              <Moon size={18} className="text-indigo-600 hover:-rotate-12 transition-transform duration-200" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
