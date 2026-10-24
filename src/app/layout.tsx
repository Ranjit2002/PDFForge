import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0e17',
};

export const metadata: Metadata = {
  title: 'PDFForge | High-Speed PDF Tools: Merge, Split & Compress PDF Online',
  description:
    'Free, ultra-fast, and 100% private in-browser PDF suite. Merge multiple documents, split or extract pages, and compress bloated PDF files without uploading your sensitive data to any server.',
  keywords: [
    'merge pdf',
    'combine pdf',
    'split pdf',
    'extract pdf pages',
    'compress pdf',
    'reduce pdf size',
    'pdf tools online',
    'private pdf editor',
  ],
  authors: [{ name: 'PDFForge Team' }],
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icon.svg' },
    ],
  },
  openGraph: {
    title: 'PDFForge - 100% Private In-Browser PDF Suite',
    description:
      'Merge, split, and compress PDFs instantly in your browser with zero server uploads.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" data-theme="dark">
      <body className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen flex flex-col antialiased transition-colors duration-200 relative">
        <div className="ambient-glow-1" />
        <div className="ambient-glow-2" />
        <div className="ambient-glow-3" />
        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
