'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, AlertCircle, Activity, ArrowRight } from 'lucide-react';
import { parseGitHubUrl } from '../lib/api';

const Github = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

export default function LandingPage() {
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = parseGitHubUrl(inputValue);
    if (!parsed) {
      setError('Please enter a valid GitHub URL (e.g., https://github.com/facebook/react) or a raw "owner/repo" path.');
      return;
    }

    router.push(`/dashboard/${parsed.owner}/${parsed.repo}`);
  };

  const handleExampleSelect = (owner: string, repo: string) => {
    router.push(`/dashboard/${owner}/${repo}`);
  };

  const exampleRepos = [
    { name: 'facebook/react', owner: 'facebook', repo: 'react', desc: 'A declarative, efficient, and flexible JavaScript library for building user interfaces.' },
    { name: 'vercel/next.js', owner: 'vercel', repo: 'next.js', desc: 'The React Framework for the Web. Used by some of the world\'s largest companies.' },
    { name: 'microsoft/vscode', owner: 'microsoft', repo: 'vscode', desc: 'Visual Studio Code - Professional, developer-focused code editor.' }
  ];

  return (
    <div className="flex-1 flex flex-col justify-center bg-[#0B0F19] py-20 px-4 sm:px-6 lg:px-8 text-white min-h-screen">
      <div className="max-w-3xl mx-auto w-full space-y-8 animate-fadeIn">
        
        {/* Logo/Icon & Title Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3.5 rounded-full bg-[#1E3A8A]/40 text-[#3B82F6] border border-[#3B82F6]/20">
            <Activity className="w-7 h-7" />
          </div>
          <h1 className="text-[32px] sm:text-[38px] font-extrabold text-white tracking-tight leading-none">
            Developer-focused repository analytics
          </h1>
          <p className="text-[14px] text-[#9CA3AF] max-w-xl mx-auto leading-relaxed">
            Analyze any public GitHub repository instantly. Retrieve stars, forks, detailed commit history graphs, language distributions, contributor lists, and an overall repository health score.
          </p>
        </div>

        {/* Search Box Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 shadow-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="repo-url" className="sr-only">GitHub Repository URL</label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-5 w-5 text-blue-400" aria-hidden="true" />
                </div>
                <input
                  type="text"
                  name="repo-url"
                  id="repo-url"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    if (error) setError(null);
                  }}
                  className="block w-full rounded-[8px] border border-[#3B82F6] py-3 pl-10 pr-3 text-[14px] bg-[#EFF6FF]/60 text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  placeholder="Paste GitHub Repository URL or type 'owner/repo'..."
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-red-600 text-[13px] bg-red-50 p-3 rounded-lg border border-red-100">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 text-[14px] font-bold rounded-[8px] text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-colors shadow-sm cursor-pointer"
            >
              Analyze Repo
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Examples Section */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2.5 text-[#E5E7EB]">
            <Github className="text-[#9CA3AF]" />
            <h2 className="text-[14px] font-semibold">Try these example repositories</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {exampleRepos.map((repo) => (
              <div
                key={repo.name}
                className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 shadow-sm text-left flex flex-col justify-between h-44"
              >
                <div>
                  <h3 className="text-[14px] font-bold text-slate-400">
                    {repo.name}
                  </h3>
                  <p className="text-[12px] text-slate-500 mt-2 line-clamp-4 font-normal leading-relaxed">
                    {repo.desc}
                  </p>
                </div>
                <button
                  onClick={() => handleExampleSelect(repo.owner, repo.repo)}
                  className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  Analyze Repo
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
