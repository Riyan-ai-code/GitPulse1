'use client';

import React, { useState, useEffect } from 'react';
import {
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
  ArrowLeft,
  FileText,
  PieChart,
  GitFork,
  AlertCircle,
  Search,
  GitPullRequest,
  LogOut
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
import ComparisonPanel from '../components/ComparisonPanel';
import RecentCommitsTable from '../components/RecentCommitsTable';
import InsightsPanel from '../components/InsightsPanel';
import PrsIssuesPanel from '../components/PrsIssuesPanel';
import Skeleton from '../components/Skeleton';

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

type TabType = 'dashboard' | 'overview' | 'commits' | 'contributors' | 'quality' | 'insights' | 'compare' | 'prs-issues';

export default function LandingPage() {
  const [analyzedRepo, setAnalyzedRepo] = useState<{ owner: string; repo: string } | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<{ login: string; avatar_url: string; html_url: string } | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Load audit history
  const loadHistoryList = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/repository/history', {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data);
      }
    } catch (err) {
      console.error('[Landing] Failed to load history:', err);
    }
  };

  const checkAuthStatus = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/user', {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setCurrentUser(data.user);
        } else {
          setCurrentUser(null);
        }
      }
    } catch (err) {
      console.error('[Auth] Failed to load user session:', err);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      if (res.ok) {
        setCurrentUser(null);
        alert('Logged out successfully.');
      }
    } catch (err) {
      console.error('[Auth] Logout failed:', err);
    }
  };

  // Dashboard states
  const [activeTab, setActiveTab] = useState<TabType>('overview');
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
      if (analyzedRepo.owner && analyzedRepo.repo) {
        loadData(analyzedRepo.owner, analyzedRepo.repo);
      } else {
        setError(null);
        setOverview(null);
        setCommits(null);
        setContributors(null);
        setAnalysis(null);
        setLoadingOverview(false);
        setLoadingCommits(false);
        setLoadingContributors(false);
        setLoadingAnalysis(false);
      }
    } else {
      loadHistoryList();
    }
  }, [analyzedRepo]);

  const handleExampleSelect = (owner: string, repo: string) => {
    setAnalyzedRepo({ owner, repo });
  };

  const resetSearch = () => {
    setAnalyzedRepo(null);
    setError(null);
    setOverview(null);
    setCommits(null);
    setContributors(null);
    setAnalysis(null);
    setActiveTab('overview');
    setInputValue('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = parseGitHubUrl(inputValue);
    if (!parsed) {
      setError('Please enter a valid GitHub URL or "owner/repo" path.');
      return;
    }

    setAnalyzedRepo(parsed);
  };

  const EmptyStateWorkspace = () => (
    <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-12 text-center text-text-secondary border-dashed animate-fadeIn">
      <Activity className="w-10 h-10 text-brand-primary mx-auto mb-2.5 animate-pulse" />
      <h3 className="text-[15px] font-bold text-text-heading">No Repository Analyzed Yet</h3>
      <p className="text-[12px] text-text-muted mt-1 max-w-xs mx-auto">
        Go back to the Overview tab and enter a GitHub repository path to inspect its analytics.
      </p>
    </div>
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
      <div className="flex-1 flex flex-col justify-center bg-[#0B0F19] py-16 px-4 sm:px-6 lg:px-8 text-white min-h-screen relative">
        {/* Standalone Landing Header */}
        <header className="absolute top-4 left-4 right-4 md:top-6 md:left-8 md:right-8 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-brand-primary-light dark:bg-brand-primary/10 text-brand-primary">
              <Activity className="w-5 h-5" />
            </div>
            <span className="font-bold text-[16px] text-white tracking-tight">GitPulse</span>
          </div>
          <button
            onClick={() => handleExampleSelect('', '')}
            className="inline-flex items-center gap-1.5 px-4.5 py-2 border border-slate-800 hover:border-slate-600 rounded-lg bg-slate-900/60 hover:bg-slate-950 text-[13px] font-bold text-white transition-all cursor-pointer shadow-sm"
          >
            Go Check It Out
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </header>

        <div className="max-w-4xl mx-auto w-full space-y-12 animate-fadeIn pt-10">
          
          {/* Logo/Icon & Title Section */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center p-3.5 rounded-full bg-[#1E3A8A]/40 text-[#3B82F6] border border-[#3B82F6]/20">
              <Activity className="w-7 h-7" />
            </div>
            <h1 className="text-[32px] sm:text-[40px] font-extrabold text-white tracking-tight leading-none">
              Developer-focused repository analytics
            </h1>
            <p className="text-[14px] text-[#9CA3AF] max-w-xl mx-auto leading-relaxed">
              Retrieve real-time metrics, commit graphs, language shares, and health checks for public projects. Learn how GitPulse analyzes codebases at a glance.
            </p>
          </div>

          {/* How It Works Section */}
          <div className="space-y-4">
            <h2 className="text-[14px] font-bold uppercase tracking-wider text-[#9CA3AF] text-center md:text-left">
              How it works & features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-slate-900/50 border border-slate-800 rounded-[12px] p-5 space-y-2.5">
                <div className="p-2 w-fit rounded bg-blue-500/10 text-[#3B82F6]">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-[14px] font-bold text-white">Repository Overview</h3>
                <p className="text-[12px] text-[#9CA3AF] leading-normal">
                  Extracts metadata including stars, forks, license, watches, and size metrics from raw GitHub endpoints.
                </p>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-[12px] p-5 space-y-2.5">
                <div className="p-2 w-fit rounded bg-purple-500/10 text-brand-purple">
                  <GitCommit className="w-5 h-5" />
                </div>
                <h3 className="text-[14px] font-bold text-white">Commit Analytics</h3>
                <p className="text-[12px] text-[#9CA3AF] leading-normal">
                  Maps daily commit volume over the last 30 days and day-of-week active hours in interactive graphs.
                </p>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-[12px] p-5 space-y-2.5">
                <div className="p-2 w-fit rounded bg-emerald-500/10 text-brand-emerald">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="text-[14px] font-bold text-white">Top Contributors</h3>
                <p className="text-[12px] text-[#9CA3AF] leading-normal">
                  Compiles avatars, rank, total contributions, and true percentage share of commits across the project.
                </p>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-[12px] p-5 space-y-2.5">
                <div className="p-2 w-fit rounded bg-cyan-500/10 text-brand-cyan">
                  <PieChart className="w-5 h-5" />
                </div>
                <h3 className="text-[14px] font-bold text-white">Languages Distribution</h3>
                <p className="text-[12px] text-[#9CA3AF] leading-normal">
                  Inspects byte counts of files in the project to calculate precise, custom-colored language percentage shares.
                </p>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-[12px] p-5 space-y-2.5">
                <div className="p-2 w-fit rounded bg-orange-500/10 text-orange-400">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="text-[14px] font-bold text-white">Hygiene Score</h3>
                <p className="text-[12px] text-[#9CA3AF] leading-normal">
                  Calculates a repository health score out of 100 based on docs, issues, licensing, and commit consistency.
                </p>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-[12px] p-5 space-y-2.5">
                <div className="p-2 w-fit rounded bg-indigo-500/10 text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-[14px] font-bold text-white">Automated Insights</h3>
                <p className="text-[12px] text-[#9CA3AF] leading-normal">
                  Computes qualitative observations, comparing commit velocity changes month-over-month.
                </p>
              </div>
            </div>
          </div>

          {/* Examples Section */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2.5 text-[#E5E7EB] justify-center md:justify-start">
              <GithubIconLarge className="text-[#9CA3AF]" />
              <h2 className="text-[14px] font-bold">Or test with one of these example repositories</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {exampleRepos.map((repo) => (
                <div
                  key={repo.name}
                  className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 shadow-sm text-left flex flex-col justify-between h-44"
                >
                  <div>
                    <h3 className="text-[14px] font-bold text-slate-800">
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

          {/* Recently Audited Feed */}
          {historyList.length > 0 && (
            <div className="space-y-4 pt-6">
              <div className="flex items-center gap-2.5 text-[#E5E7EB] justify-center md:justify-start">
                <h2 className="text-[14px] font-bold">Recently Audited Repositories</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
                {historyList.slice(0, 6).map((repo) => (
                  <div
                    key={`${repo.owner}/${repo.repo}`}
                    className="bg-white border border-[#E2E8F0] rounded-[12px] p-5 shadow-sm text-left flex flex-col justify-between h-44"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-1">
                        <h3 className="text-[14px] font-bold text-slate-800 truncate" title={`${repo.owner}/${repo.repo}`}>
                          {repo.owner}/{repo.repo}
                        </h3>
                        <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                          repo.score >= 90 ? 'bg-emerald-100 text-brand-emerald' : repo.score >= 70 ? 'bg-amber-100 text-brand-amber' : 'bg-red-100 text-brand-red'
                        }`}>
                          {repo.score}/100
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Analyzed {new Date(repo.analyzedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </p>
                      <div className="flex gap-2 items-center text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-100">
                        <span>★ {repo.stars.toLocaleString()}</span>
                        <span>•</span>
                        <span>{repo.primaryLanguage}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleExampleSelect(repo.owner, repo.repo)}
                      className="mt-3 inline-flex items-center gap-1 text-[12px] font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      View Report
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
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

            <div className="pt-2 border-t border-border-card mt-2 no-print flex flex-col gap-1">
              <button
                onClick={() => setActiveTab('compare')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[14px] font-semibold transition-colors cursor-pointer ${
                  activeTab === 'compare'
                    ? 'bg-brand-primary-light text-brand-primary dark:bg-brand-primary/10'
                    : 'text-text-secondary hover:bg-bg-secondary hover:text-text-heading'
                }`}
              >
                <GitCompare className="w-[18px] h-[18px]" />
                Compare Repos
              </button>

              <button
                onClick={() => setActiveTab('prs-issues')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-[14px] font-semibold transition-colors cursor-pointer ${
                  activeTab === 'prs-issues'
                    ? 'bg-brand-primary-light text-brand-primary dark:bg-brand-primary/10'
                    : 'text-text-secondary hover:bg-bg-secondary hover:text-text-heading'
                }`}
              >
                <GitPullRequest className="w-[18px] h-[18px]" />
                PRs & Issues
              </button>
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

        {/* Auth status block */}
        <div className="px-3 py-3 border-t border-border-card mt-3 no-print">
          {loadingUser ? (
            <Skeleton className="h-9 w-full" />
          ) : currentUser ? (
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-bg-secondary/40 rounded-lg">
              <div className="flex items-center gap-2 overflow-hidden">
                <img src={currentUser.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                <span className="text-[12.5px] font-bold text-text-primary truncate">{currentUser.login}</span>
              </div>
              <button onClick={handleLogout} className="text-text-muted hover:text-brand-red cursor-pointer">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <a
              href="http://localhost:5000/api/auth/github"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[12.5px] font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all cursor-pointer shadow-soft"
            >
              <GithubIcon className="w-4 h-4 text-white" />
              Sign in with GitHub
            </a>
          )}
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
              <div className="relative no-print">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 border border-border-divider rounded-lg bg-bg-main text-[13px] font-bold text-text-primary hover:bg-bg-secondary transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Export
                </button>
                {showExportMenu && (
                  <div className="absolute right-0 mt-1.5 w-40 rounded-lg border border-border-divider bg-bg-card shadow-soft z-20 py-1.5 no-print">
                    <button
                      onClick={() => {
                        setShowExportMenu(false);
                        window.print();
                      }}
                      className="w-full text-left px-3.5 py-1.5 text-[12.5px] font-semibold text-text-primary hover:bg-bg-secondary cursor-pointer"
                    >
                      Export PDF
                    </button>
                    <button
                      onClick={() => {
                        setShowExportMenu(false);
                        setShowBadgeModal(true);
                      }}
                      className="w-full text-left px-3.5 py-1.5 text-[12.5px] font-semibold text-text-primary hover:bg-bg-secondary cursor-pointer"
                    >
                      Markdown Badge
                    </button>
                  </div>
                )}
              </div>
            )}

            {overview && (
              <a
                href={overview.owner.html_url}
                target="_blank"
                rel="noreferrer"
                className="text-text-secondary hover:text-text-heading transition-colors no-print"
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
              {activeTab !== 'compare' && (
                <>
                  {loadingOverview && (
                    <Skeleton className="h-28" />
                  )}
              
              {!loadingOverview && overview && (
                <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-6 shadow-soft">
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
                        {overview.version && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400">
                            ● Version: {overview.version}
                          </span>
                        )}
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

              {!loadingOverview && !overview && (
                <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-6 shadow-soft">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <p className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider">Workspace</p>
                      <h2 className="text-[24px] font-extrabold text-brand-primary tracking-tight leading-none">
                        GitPulse Analytics
                      </h2>
                      <p className="text-[14px] text-text-secondary">
                        Enter a public GitHub repository link in the Overview tab to begin your analysis.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}


          {/* Dynamic tabs render */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {overview ? (
                    <>
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

                      {/* Row 2: Commit Activity */}
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
                            <ContributorsList data={contributors} commits={commits?.recentCommits || []} />
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
                    </>
                  ) : (
                    <EmptyStateWorkspace />
                  )}
                </div>
              )}

              {activeTab === 'overview' && (
                <div className="animate-fadeIn space-y-6">
                  {/* Dashboard Repository Switcher Search Card */}
                  <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-5 shadow-soft">
                    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row items-center gap-3">
                      <div className="flex items-center gap-2 text-text-heading min-w-[200px] flex-shrink-0">
                        <Search className="w-4.5 h-4.5 text-brand-primary" />
                        <span className="text-[13px] font-extrabold uppercase tracking-wide">Analyze Main Repository</span>
                      </div>
                      
                      <div className="relative w-full flex-1">
                        <input
                          type="text"
                          value={inputValue}
                          onChange={(e) => {
                            setInputValue(e.target.value);
                            if (error) setError(null);
                          }}
                          className="block w-full rounded-[8px] border border-border-card dark:border-slate-800 bg-bg-main dark:bg-[#1E293B] py-2 pl-3 text-[13px] text-text-heading placeholder-text-muted focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                          placeholder="Paste GitHub Repository URL or type 'owner/repo'..."
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full md:w-auto px-5 py-2 text-[13px] font-bold rounded-[8px] text-white bg-brand-primary hover:bg-brand-primary-hover transition-colors shadow-soft cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        Analyze
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </form>

                    {error && (
                      <div className="flex items-start gap-2 text-red-600 text-[12px] bg-red-50 dark:bg-red-950/10 p-2.5 rounded-lg border border-red-100 dark:border-red-900/20 mt-3">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    )}
                  </div>

                  {loadingOverview ? (
                    <Skeleton className="h-[450px]" />
                  ) : overview ? (
                    <RepositoryOverview data={overview} />
                  ) : (
                    <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-10 text-center text-text-secondary border-dashed">
                      <Activity className="w-12 h-12 text-brand-primary mx-auto mb-3 animate-pulse" />
                      <h3 className="text-[16px] font-bold text-text-heading">Ready for Analysis</h3>
                      <p className="text-[13px] text-text-muted mt-1 max-w-sm mx-auto">
                        Copy-paste a GitHub repository URL or type an owner/repository path in the input box above to fetch insights.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'commits' && (
                <div className="space-y-6 animate-fadeIn">
                  {loadingCommits ? (
                    <Skeleton className="h-[400px]" />
                  ) : commits ? (
                    <>
                      <CommitAnalysis data={commits} />
                      <RecentCommitsTable commits={commits.recentCommits} />
                    </>
                  ) : (
                    <EmptyStateWorkspace />
                  )}
                </div>
              )}

              {activeTab === 'contributors' && (
                <div className="max-w-2xl mx-auto animate-fadeIn">
                  {loadingContributors ? (
                    <Skeleton className="h-[400px]" />
                  ) : contributors ? (
                    <ContributorsList data={contributors} commits={commits?.recentCommits || []} />
                  ) : (
                    <EmptyStateWorkspace />
                  )}
                </div>
              )}

              {activeTab === 'quality' && (
                <div className="animate-fadeIn">
                  {loadingAnalysis || loadingCommits ? (
                    <Skeleton className="h-[260px]" />
                  ) : analysis && commits ? (
                    <HealthScore data={analysis} commits={commits.recentCommits} />
                  ) : (
                    <EmptyStateWorkspace />
                  )}
                </div>
              )}

              {activeTab === 'insights' && (
                <div className="max-w-3xl mx-auto animate-fadeIn">
                  {loadingAnalysis ? (
                    <Skeleton className="h-[400px]" />
                  ) : analysis ? (
                    <InsightsPanel insights={analysis.insights} />
                  ) : (
                    <EmptyStateWorkspace />
                  )}
                </div>
              )}

              {activeTab === 'compare' && (
                <div className="animate-fadeIn">
                  <ComparisonPanel />
                </div>
              )}

              {activeTab === 'prs-issues' && (
                <div className="max-w-4xl mx-auto animate-fadeIn">
                  {overview ? (
                    <PrsIssuesPanel owner={overview.owner.login} repo={overview.name} />
                  ) : (
                    <EmptyStateWorkspace />
                  )}
                </div>
              )}
  
            </div>
          )}
        </div>

      </div>

      {/* Markdown Badge Modal */}
      {showBadgeModal && overview && (
        <div className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print animate-fadeIn">
          <div className="bg-bg-card border border-border-card rounded-[12px] p-6 max-w-md w-full shadow-soft space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-border-divider pb-2.5">
              <h3 className="text-[14px] font-bold text-text-heading">README Markdown Badge</h3>
              <button
                onClick={() => setShowBadgeModal(false)}
                className="text-text-muted hover:text-text-secondary cursor-pointer text-[14px]"
              >
                ✕
              </button>
            </div>
            
            <p className="text-[12px] text-text-secondary leading-normal">
              Copy and paste the markdown code below into your project's `README.md` to showcase your repository health score on GitHub!
            </p>

            {/* Badge Preview */}
            <div className="p-4 bg-slate-50 dark:bg-bg-secondary/40 border border-border-divider rounded-lg flex flex-col items-center justify-center gap-2">
              <span className="text-[10px] font-bold text-text-muted uppercase">Badge Preview</span>
              <img
                src={`https://img.shields.io/badge/GitPulse%20Health-${analysis?.healthScore || 80}%2F100-${analysis?.healthScore && analysis.healthScore >= 90 ? 'emerald' : analysis?.healthScore && analysis.healthScore >= 70 ? 'amber' : 'red'}`}
                alt="GitPulse Health Badge"
              />
            </div>

            {/* Markdown Code */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-text-secondary uppercase">Markdown Code</label>
              <div className="relative">
                <textarea
                  readOnly
                  rows={2}
                  value={`[![GitPulse Health Score](https://img.shields.io/badge/GitPulse%20Health-${analysis?.healthScore || 80}%2F100-${analysis?.healthScore && analysis.healthScore >= 90 ? 'emerald' : analysis?.healthScore && analysis.healthScore >= 70 ? 'amber' : 'red'})](http://localhost:3000)`}
                  className="block w-full rounded-md border border-border-divider bg-bg-main dark:bg-[#1E293B] p-2.5 text-[11.5px] font-mono text-text-heading focus:outline-none resize-none"
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border-divider">
              <button
                onClick={() => {
                  const mdText = `[![GitPulse Health Score](https://img.shields.io/badge/GitPulse%20Health-${analysis?.healthScore || 80}%2F100-${analysis?.healthScore && analysis.healthScore >= 90 ? 'emerald' : analysis?.healthScore && analysis.healthScore >= 70 ? 'amber' : 'red'})](http://localhost:3000)`;
                  navigator.clipboard.writeText(mdText);
                  alert('Markdown badge code copied to clipboard!');
                }}
                className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-hover text-[12.5px] font-bold text-white rounded-lg cursor-pointer transition-colors shadow-soft"
              >
                Copy Markdown
              </button>
              <button
                onClick={() => setShowBadgeModal(false)}
                className="px-4 py-2 border border-border-divider text-[12.5px] font-bold text-text-secondary hover:bg-bg-secondary rounded-lg cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
