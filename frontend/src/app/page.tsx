'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, AlertCircle, Activity, ArrowRight } from 'lucide-react';
import { parseGitHubUrl } from '../lib/api';

const Github = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
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

    // Navigate to the dynamic dashboard route
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
    <div className="flex-1 flex flex-col justify-center bg-bg-main py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto w-full space-y-10">
        
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-brand-primary-light text-brand-primary mb-2">
            <Activity className="w-8 h-8" />
          </div>
          <h1 className="text-[32px] sm:text-[40px] font-extrabold text-text-heading tracking-tight leading-none">
            Developer-focused repository analytics
          </h1>
          <p className="text-[16px] text-text-secondary max-w-xl mx-auto">
            Analyze any public GitHub repository instantly. Retrieve stars, forks, detailed commit history graphs, language distributions, contributor lists, and an overall repository health score.
          </p>
        </div>

        {/* Search / Input Form */}
        <div className="bg-white border border-border-card rounded-[12px] p-6 shadow-soft hover:shadow-hover-card transition-shadow duration-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="repo-url" className="sr-only">GitHub Repository URL</label>
              <div className="relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-5 w-5 text-text-muted" aria-hidden="true" />
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
                  className="block w-full rounded-lg border border-border-divider py-3 pl-10 pr-3 text-[15px] placeholder-text-muted focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary bg-bg-main/50"
                  placeholder="Paste GitHub Repository URL or type 'owner/repo'..."
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-brand-red text-[13px] bg-red-50/50 p-3 rounded-lg border border-red-100">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-transparent text-[15px] font-bold rounded-lg text-white bg-brand-primary hover:bg-brand-primary-hover shadow-soft hover:shadow-md transition-all cursor-pointer"
            >
              Analyze Repository
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Example Repositories Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Github className="w-5 h-5 text-text-secondary" />
            <h2 className="text-[16px] font-semibold text-text-heading">Try these example repositories</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {exampleRepos.map((repo) => (
              <button
                key={repo.name}
                onClick={() => handleExampleSelect(repo.owner, repo.repo)}
                className="bg-white border border-border-card rounded-[12px] p-5 shadow-soft hover:shadow-hover-card hover:border-brand-primary text-left transition-all duration-200 group flex flex-col justify-between h-44 cursor-pointer"
              >
                <div>
                  <h3 className="text-[14px] font-bold text-text-heading group-hover:text-brand-primary transition-colors truncate">
                    {repo.name}
                  </h3>
                  <p className="text-[12px] text-text-secondary mt-1.5 line-clamp-4 font-normal leading-normal">
                    {repo.desc}
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-[12px] font-bold text-brand-primary group-hover:gap-1.5 transition-all">
                  Analyze Repo
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
