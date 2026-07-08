'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  AlertCircle,
  Activity,
  ArrowRight,
  LayoutDashboard,
  BookOpen,
  GitCommit,
  Users,
  Award,
  Sparkles,
  GitCompare,
  Settings,
  Info,
  Sun,
  Moon,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import {
  fetchRepositoryOverview,
  fetchCommitStats,
  fetchContributors,
  fetchAnalysis,
  parseGitHubUrl
} from '../lib/api';
import {
  RepositoryOverview as RepositoryOverviewType,
  CommitStats as CommitStatsType,
  ContributorsList as ContributorsListType,
  RepositoryAnalysis as RepositoryAnalysisType
} from '../types';

// Importing components
import RepositoryOverview from '../components/RepositoryOverview';
import CommitAnalysis from '../components/CommitAnalysis';
import ContributorsList from '../components/ContributorsList';
import LanguageChart from '../components/LanguageChart';
import HealthScore from '../components/HealthScore';
import RecentCommitsTable from '../components/RecentCommitsTable';
import InsightsPanel from '../components/InsightsPanel';

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    stroke="currentColor"
    strokeWidth="2.2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const GithubIconLarge = (props: React.SVGProps<SVGSVGElement>) => (
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

type TabType = 'dashboard' | 'overview' | 'commits' | 'contributors' | 'quality' | 'insights';

export default function LandingPage() {
  const [analyzedRepo, setAnalyzedRepo] = useState<{ owner: string; repo: string } | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Dashboard states
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Progressive loading states
  const [overview, setOverview] = useState<RepositoryOverviewType | null>(null);
  const [commits, setCommits] = useState<CommitStatsType | null>(null);
  const [contributors, setContributors] = useState<ContributorsListType | null>(null);
  const [analysis, setAnalysis] = useState<RepositoryAnalysisType | null>(null);

  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingCommits, setLoadingCommits] = useState(true);
  const [loadingContributors, setLoadingContributors] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(true);

  // Sync theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Fetch dashboard data
  const loadData = async (owner: string, repo: string) => {
    setError(null);
    setLoadingOverview(true);
    setLoadingCommits(true);
    setLoadingContributors(true);
    setLoadingAnalysis(true);

    try {
      const overviewRes = await fetchRepositoryOverview(owner, repo);
      setOverview(overviewRes);
      setLoadingOverview(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load repository overview metadata.');
      setLoadingOverview(false);
      setLoadingCommits(false);
      setLoadingContributors(false);
      setLoadingAnalysis(false);
      return;
    }

    fetchCommitStats(owner, repo)
      .then((res) => {
        setCommits(res);
        setLoadingCommits(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingCommits(false);
      });

    fetchContributors(owner, repo)
      .then((res) => {
        setContributors(res);
        setLoadingContributors(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingContributors(false);
      });

    fetchAnalysis(owner, repo)
      .then((res) => {
        setAnalysis(res);
        setLoadingAnalysis(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingAnalysis(false);
      });
  };

  useEffect(() => {
    if (analyzedRepo) {
      loadData(analyzedRepo.owner, analyzedRepo.repo);
    }
  }, [analyzedRepo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = parseGitHubUrl(inputValue);
    if (!parsed) {
      setError('Please enter a valid GitHub URL (e.g., https://github.com/facebook/react) or a raw "owner/repo" path.');
      return;
    }

    setAnalyzedRepo(parsed);
  };

  const handleExampleSelect = (owner: string, repo: string) => {
    setAnalyzedRepo({ owner, repo });
  };

  const resetSearch = () => {
    setAnalyzedRepo(null);
    setInputValue('');
    setError(null);
    setOverview(null);
    setCommits(null);
    setContributors(null);
    setAnalysis(null);
    setActiveTab('dashboard');
    // Keep document theme, but reset styling back to landing page
  };

  const Skeleton = ({ className = 'h-32' }) => (
    <div className={`animate-pulse bg-slate-100 dark:bg-bg-secondary rounded-[12px] border border-border-card ${className}`} />
  );

  const getHealthBadgeStyles = (score: number) => {
    if (score >= 90) return 'text-brand-emerald bg-emerald-50 dark:bg-emerald-950/20';
    if (score >= 70) return 'text-brand-amber bg-amber-50 dark:bg-amber-950/20';
    return 'text-brand-red bg-red-50 dark:bg-red-950/20';
  };

  const getHealthText = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    return 'Stale';
  };

  const analysisDate = new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const exampleRepos = [
    { name: 'facebook/react', owner: 'facebook', repo: 'react', desc: 'A declarative, efficient, and flexible JavaScript library for building user interfaces.' },
    { name: 'vercel/next.js', owner: 'vercel', repo: 'next.js', desc: 'The React Framework for the Web. Used by some of the world\'s largest companies.' },
    { name: 'microsoft/vscode', owner: 'microsoft', repo: 'vscode', desc: 'Visual Studio Code - Professional, developer-focused code editor.' }
  ];

  // 1. Render Search Landing Page (When no repo is analyzed)
  if (!analyzedRepo) {
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
              <GithubIconLarge className="text-[#9CA3AF]" />
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

  // 2. Render SPA Dashboard (When a repo is analyzed)
  return (
    <div className="flex-1 flex min-h-screen bg-bg-main">
      
      {/* Left Sidebar Menu */}
      <aside className="w-64 border-r border-border-card bg-bg-sidebar hidden md:flex flex-col justify-between py-6 flex-shrink-0">
        <div className="space-y-6">
          {/* Logo / Title */}
          <div className="px-6 flex items-center gap-2">
            <div className="p-1.5 rounded bg-brand-primary-light dark:bg-brand-primary-light/10 text-brand-primary">
              <Activity className="w-5 h-5" />
            </div>
            <span className="font-bold text-[16px] text-text-heading">GitPulse Menu</span>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[14px] font-semibold transition-colors cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-brand-primary-light text-brand-primary dark:bg-brand-primary/10'
                  : 'text-text-secondary hover:bg-bg-secondary hover:text-text-heading'
              }`}
            >
              <LayoutDashboard className="w-[18px] h-[18px]" />
              Dashboard
            </button>

            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[14px] font-semibold transition-colors cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-brand-primary-light text-brand-primary dark:bg-brand-primary/10'
                  : 'text-text-secondary hover:bg-bg-secondary hover:text-text-heading'
              }`}
            >
              <BookOpen className="w-[18px] h-[18px]" />
              Overview
            </button>

            <button
              onClick={() => setActiveTab('commits')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[14px] font-semibold transition-colors cursor-pointer ${
                activeTab === 'commits'
                  ? 'bg-brand-primary-light text-brand-primary dark:bg-brand-primary/10'
                  : 'text-text-secondary hover:bg-bg-secondary hover:text-text-heading'
              }`}
            >
              <GitCommit className="w-[18px] h-[18px]" />
              Commits
            </button>

            <button
              onClick={() => setActiveTab('contributors')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[14px] font-semibold transition-colors cursor-pointer ${
                activeTab === 'contributors'
                  ? 'bg-brand-primary-light text-brand-primary dark:bg-brand-primary/10'
                  : 'text-text-secondary hover:bg-bg-secondary hover:text-text-heading'
              }`}
            >
              <Users className="w-[18px] h-[18px]" />
              Contributors
            </button>

            <button
              onClick={() => setActiveTab('quality')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[14px] font-semibold transition-colors cursor-pointer ${
                activeTab === 'quality'
                  ? 'bg-brand-primary-light text-brand-primary dark:bg-brand-primary/10'
                  : 'text-text-secondary hover:bg-bg-secondary hover:text-text-heading'
              }`}
            >
              <Award className="w-[18px] h-[18px]" />
              Commit Quality
            </button>

            <button
              onClick={() => setActiveTab('insights')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[14px] font-semibold transition-colors cursor-pointer ${
                activeTab === 'insights'
                  ? 'bg-brand-primary-light text-brand-primary dark:bg-brand-primary/10'
                  : 'text-text-secondary hover:bg-bg-secondary hover:text-text-heading'
              }`}
            >
              <Sparkles className="w-[18px] h-[18px]" />
              Insights
            </button>

            <div className="pt-2 border-t border-border-card mt-2">
              <span className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-[14px] font-semibold text-text-muted cursor-not-allowed">
                <GitCompare className="w-[18px] h-[18px]" />
                Compare (Soon)
              </span>
            </div>
          </nav>
        </div>

        {/* Bottom Menu */}
        <div className="px-3 space-y-1">
          <span className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-[13px] font-semibold text-text-secondary hover:bg-bg-secondary hover:text-text-heading cursor-pointer">
            <Settings className="w-4 h-4" />
            Settings
          </span>
          <span className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-[13px] font-semibold text-text-secondary hover:bg-bg-secondary hover:text-text-heading cursor-pointer">
            <Info className="w-4 h-4" />
            About
          </span>
        </div>
      </aside>

      {/* Main Dashboard Window */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Topbar inside Dashboard */}
        <header className="h-14 border-b border-border-card bg-bg-card px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={resetSearch}
              className="p-1 rounded-md text-text-secondary hover:bg-bg-secondary hover:text-text-heading transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="text-[14px] font-bold text-text-heading capitalize">
              {activeTab}
            </span>
          </div>

          <div className="flex items-center gap-3.5">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="inline-flex items-center gap-1.5 px-3 py-1 border border-border-divider rounded-lg bg-bg-main text-[13px] font-bold text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="w-3.5 h-3.5" />
                  Dark
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5" />
                  Light
                </>
              )}
            </button>

            {overview && (
              <a
                href={overview.owner.html_url}
                target="_blank"
                rel="noreferrer"
                className="text-text-secondary hover:text-text-heading transition-colors"
              >
                <GithubIcon />
              </a>
            )}
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {error ? (
            <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-8 shadow-soft flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-4">
              <div className="p-3 rounded-full bg-red-50 text-brand-red">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h2 className="text-[18px] font-bold text-text-heading">Analysis Error</h2>
                <p className="text-[14px] text-text-secondary max-w-md">{error}</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => loadData(analyzedRepo.owner, analyzedRepo.repo)}
                  className="px-4 py-2 bg-brand-primary text-white text-[14px] font-bold rounded-lg hover:bg-brand-primary-hover shadow-soft cursor-pointer"
                >
                  Retry
                </button>
                <button
                  onClick={resetSearch}
                  className="px-4 py-2 border border-border-divider bg-bg-card text-text-primary text-[14px] font-bold rounded-lg hover:bg-bg-secondary shadow-soft cursor-pointer"
                >
                  Back to Search
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Repository info header card */}
              {loadingOverview || !overview ? (
                <Skeleton className="h-32" />
              ) : (
                <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-6 shadow-soft hover:shadow-hover-card transition-all duration-200">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider">Repository</p>
                      <h2 className="text-[24px] font-extrabold text-brand-primary tracking-tight leading-none">
                        {overview.owner.login}/{overview.name}
                      </h2>
                      <p className="text-[14px] text-text-secondary">{overview.description}</p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/20 text-brand-emerald">
                          ● Public
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/20 text-brand-primary">
                          ● {overview.primaryLanguage}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/20 text-brand-purple">
                          ● {overview.license}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col md:items-end justify-between gap-3 text-left md:text-right">
                      <div>
                        <p className="text-[11px] font-semibold text-text-secondary">Analyzed on</p>
                        <p className="text-[13px] font-bold text-text-heading">{analysisDate}</p>
                      </div>
                      <button
                        onClick={() => loadData(analyzedRepo.owner, analyzedRepo.repo)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-[13px] font-bold rounded-lg text-white bg-brand-primary hover:bg-brand-primary-hover shadow-soft cursor-pointer transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Re-analyze
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic tabs render */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Row 1: KPI scores */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Resume Readiness Score */}
                    {loadingAnalysis || !analysis ? (
                      <Skeleton className="h-28" />
                    ) : (
                      <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-5 shadow-soft hover:shadow-hover-card transition-all duration-200 flex flex-col justify-between">
                        <div>
                          <p className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider">Health Score</p>
                          <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-[32px] font-extrabold text-text-heading">{analysis.healthScore}</span>
                            <span className="text-[14px] text-text-secondary">/100</span>
                            <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full ml-auto ${getHealthBadgeStyles(analysis.healthScore)}`}>
                              {getHealthText(analysis.healthScore)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 bg-slate-100 dark:bg-bg-secondary rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              analysis.healthScore >= 90
                                ? 'bg-brand-emerald'
                                : analysis.healthScore >= 70
                                ? 'bg-brand-amber'
                                : 'bg-brand-red'
                            }`}
                            style={{ width: `${analysis.healthScore}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Total Commits */}
                    {loadingCommits || !commits ? (
                      <Skeleton className="h-28" />
                    ) : (
                      <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-5 shadow-soft hover:shadow-hover-card transition-all duration-200 flex flex-col justify-between">
                        <div>
                          <p className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider">Total Commits</p>
                          <div className="text-[32px] font-extrabold text-text-heading mt-2">
                            {commits.totalCommits.toLocaleString()}
                          </div>
                        </div>
                        <p className="text-[11px] text-text-secondary mt-2">All commits recorded</p>
                      </div>
                    )}

                    {/* Contributors */}
                    {loadingContributors || !contributors ? (
                      <Skeleton className="h-28" />
                    ) : (
                      <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-5 shadow-soft hover:shadow-hover-card transition-all duration-200 flex flex-col justify-between">
                        <div>
                          <p className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider">Contributors</p>
                          <div className="text-[32px] font-extrabold text-text-heading mt-2">
                            {contributors.contributors.length.toLocaleString()}
                          </div>
                        </div>
                        <p className="text-[11px] text-text-secondary mt-2">Top contributors active</p>
                      </div>
                    )}

                    {/* Commits Last 30 Days */}
                    {loadingCommits || !commits ? (
                      <Skeleton className="h-28" />
                    ) : (
                      <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-5 shadow-soft hover:shadow-hover-card transition-all duration-200 flex flex-col justify-between">
                        <div>
                          <p className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider">Commits (Last 30 Days)</p>
                          <div className="text-[32px] font-extrabold text-text-heading mt-2">
                            {commits.commitsLast30Days.toLocaleString()}
                          </div>
                        </div>
                        <p className="text-[11px] text-text-secondary mt-2">Active month velocity</p>
                      </div>
                    )}
                  </div>

                  {/* Row 2: Commit Activity (Line Chart & Day of Week Bar Chart) */}
                  <div>
                    {loadingCommits || !commits ? (
                      <Skeleton className="h-[340px]" />
                    ) : (
                      <CommitAnalysis data={commits} />
                    )}
                  </div>

                  {/* Row 3: Commits Table & Contributors List */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      {loadingCommits || !commits ? (
                        <Skeleton className="h-[350px]" />
                      ) : (
                        <RecentCommitsTable commits={commits.recentCommits} />
                      )}
                    </div>
                    <div className="lg:col-span-1">
                      {loadingContributors || !contributors ? (
                        <Skeleton className="h-[350px]" />
                      ) : (
                        <ContributorsList data={contributors} />
                      )}
                    </div>
                  </div>

                  {/* Row 4: Language Chart & Insights Panel */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                      {loadingOverview || !overview ? (
                        <Skeleton className="h-[280px]" />
                      ) : (
                        <LanguageChart languages={overview.languages} />
                      )}
                    </div>
                    <div className="lg:col-span-2">
                      {loadingAnalysis || !analysis ? (
                        <Skeleton className="h-[280px]" />
                      ) : (
                        <InsightsPanel insights={analysis.insights} />
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
                  <div className="lg:col-span-2">
                    {loadingOverview || !overview ? (
                      <Skeleton className="h-[400px]" />
                    ) : (
                      <RepositoryOverview data={overview} />
                    )}
                  </div>
                  <div className="lg:col-span-1">
                    {loadingOverview || !overview ? (
                      <Skeleton className="h-[300px]" />
                    ) : (
                      <LanguageChart languages={overview.languages} />
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'commits' && (
                <div className="space-y-6 animate-fadeIn">
                  {loadingCommits || !commits ? (
                    <Skeleton className="h-[400px]" />
                  ) : (
                    <>
                      <CommitAnalysis data={commits} />
                      <RecentCommitsTable commits={commits.recentCommits} />
                    </>
                  )}
                </div>
              )}

              {activeTab === 'contributors' && (
                <div className="max-w-2xl mx-auto animate-fadeIn">
                  {loadingContributors || !contributors ? (
                    <Skeleton className="h-[400px]" />
                  ) : (
                    <ContributorsList data={contributors} />
                  )}
                </div>
              )}

              {activeTab === 'quality' && (
                <div className="max-w-2xl mx-auto animate-fadeIn">
                  {loadingAnalysis || !analysis ? (
                    <Skeleton className="h-[500px]" />
                  ) : (
                    <HealthScore data={analysis} />
                  )}
                </div>
              )}

              {activeTab === 'insights' && (
                <div className="max-w-3xl mx-auto animate-fadeIn">
                  {loadingAnalysis || !analysis ? (
                    <Skeleton className="h-[400px]" />
                  ) : (
                    <InsightsPanel insights={analysis.insights} />
                  )}
                </div>
              )}

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
