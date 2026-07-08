import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { Activity } from 'lucide-react';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'GitPulse Light — GitHub Repository Insights Dashboard',
  description: 'Analyze public GitHub repositories, calculate health scores, view commit analytics, and generate detailed developer insights.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-bg-main text-text-primary">
        {/* Navigation Header */}
        <header className="bg-white border-b border-border-card sticky top-0 z-50 shadow-soft">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="p-2 rounded-lg bg-brand-primary-light text-brand-primary group-hover:scale-105 transition-transform">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[18px] font-bold text-text-heading tracking-tight">GitPulse</span>
                <span className="text-[12px] font-bold bg-[#DCFCE7] text-[#166534] ml-2 px-2 py-0.5 rounded-full">
                  Light MVP
                </span>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-[14px] font-medium text-text-secondary hover:text-brand-primary transition-colors"
              >
                Analyze New Repo
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-border-card py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <p className="text-[13px] text-text-muted">
              GitPulse Light MVP (Version 1) • Dev Portfolio Project
            </p>
            <p className="text-[12px] text-text-muted">
              Powered by Next.js, Express & GitHub REST API
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
