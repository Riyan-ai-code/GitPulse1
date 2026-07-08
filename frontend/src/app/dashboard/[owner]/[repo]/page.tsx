'use client';

import React, { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import {
  fetchRepositoryOverview,
  fetchCommitStats,
  fetchContributors,
  fetchAnalysis
} from '../../../../lib/api';
import {
  RepositoryOverview as RepositoryOverviewType,
  CommitStats as CommitStatsType,
  ContributorsList as ContributorsListType,
  RepositoryAnalysis as RepositoryAnalysisType
} from '../../../../types';

// Importing components
import RepositoryOverview from '../../../../components/RepositoryOverview';
import CommitAnalysis from '../../../../components/CommitAnalysis';
import ContributorsList from '../../../../components/ContributorsList';
import LanguageChart from '../../../../components/LanguageChart';
import HealthScore from '../../../../components/HealthScore';
import RecentCommitsTable from '../../../../components/RecentCommitsTable';
import InsightsPanel from '../../../../components/InsightsPanel';

interface PageProps {
  params: Promise<{ owner: string; repo: string }>;
}

export default function Dashboard({ params }: PageProps) {
  const { owner, repo } = use(params);

  // Separate states for progressive loading
  const [overview, setOverview] = useState<RepositoryOverviewType | null>(null);
  const [commits, setCommits] = useState<CommitStatsType | null>(null);
  const [contributors, setContributors] = useState<ContributorsListType | null>(null);
  const [analysis, setAnalysis] = useState<RepositoryAnalysisType | null>(null);

  // Error states
  const [error, setError] = useState<string | null>(null);

  // Progressive loading states
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingCommits, setLoadingCommits] = useState(true);
  const [loadingContributors, setLoadingContributors] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(true);

  const loadData = async () => {
    setError(null);
    setLoadingOverview(true);
    setLoadingCommits(true);
    setLoadingContributors(true);
    setLoadingAnalysis(true);

    // 1. Fetch Repository Overview (First Priority)
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
      return; // Stop if overview fails (likely repository doesn't exist)
    }

    // 2. Fetch Commits Stats
    fetchCommitStats(owner, repo)
      .then((res) => {
        setCommits(res);
        setLoadingCommits(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingCommits(false);
      });

    // 3. Fetch Contributors
    fetchContributors(owner, repo)
      .then((res) => {
        setContributors(res);
        setLoadingContributors(false);
      })
      .catch((err) => {
        console.error(err);
        setLoadingContributors(false);
      });

    // 4. Fetch Analysis (Health & Insights)
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
    loadData();
  }, [owner, repo]);

  // Loading skeleton block helper
  const Skeleton = ({ className = 'h-32' }) => (
    <div className={`animate-pulse bg-slate-100 rounded-[12px] border border-border-card ${className}`} />
  );

  return (
    <div className="flex-1 bg-bg-main py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Navigation Breadcrumb & Actions */}
        <div className="flex items-center justify-between pb-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[14px] font-bold text-text-secondary hover:text-brand-primary transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Search
          </Link>
          {!error && (
            <button
              onClick={loadData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border-divider rounded-lg bg-white text-[13px] font-semibold text-text-primary hover:bg-bg-hover shadow-soft transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh Data
            </button>
          )}
        </div>

        {/* Global Error Banner */}
        {error ? (
          <div className="bg-white border border-border-card rounded-[12px] p-8 shadow-soft flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-4">
            <div className="p-3 rounded-full bg-red-50 text-brand-red">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-[18px] font-bold text-text-heading">Analysis Error</h2>
              <p className="text-[14px] text-text-secondary max-w-md">{error}</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={loadData}
                className="px-4 py-2 bg-brand-primary text-white text-[14px] font-bold rounded-lg hover:bg-brand-primary-hover shadow-soft cursor-pointer"
              >
                Retry
              </button>
              <Link
                href="/"
                className="px-4 py-2 border border-border-divider bg-white text-text-primary text-[14px] font-bold rounded-lg hover:bg-bg-hover shadow-soft"
              >
                Search Another Repository
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Dashboard Title */}
            <div className="flex items-center justify-between border-b border-border-divider pb-4">
              <div>
                <h2 className="text-[28px] font-extrabold text-text-heading tracking-tight leading-none">
                  Repository Analytics
                </h2>
                <p className="text-[13px] text-text-secondary mt-1">
                  Real-time analytics dashboard for {owner}/{repo}
                </p>
              </div>
            </div>

            {/* Row 1: Overview (2/3) & Health Score (1/3) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                {loadingOverview || !overview ? (
                  <div className="space-y-4">
                    <Skeleton className="h-28" />
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <Skeleton className="h-24" />
                      <Skeleton className="h-24" />
                      <Skeleton className="h-24" />
                      <Skeleton className="h-24" />
                    </div>
                    <Skeleton className="h-32" />
                  </div>
                ) : (
                  <RepositoryOverview data={overview} />
                )}
              </div>

              <div className="lg:col-span-1">
                {loadingAnalysis || !analysis ? (
                  <Skeleton className="h-[380px]" />
                ) : (
                  <HealthScore data={analysis} />
                )}
              </div>
            </div>

            {/* Row 2: Commit Analysis (2/3) & Language Breakdown (1/3) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                {loadingCommits || !commits ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Skeleton className="h-24" />
                      <Skeleton className="h-24" />
                      <Skeleton className="h-24" />
                    </div>
                    <Skeleton className="h-[340px]" />
                  </div>
                ) : (
                  <CommitAnalysis data={commits} />
                )}
              </div>

              <div className="lg:col-span-1">
                {loadingOverview || !overview ? (
                  <Skeleton className="h-[380px]" />
                ) : (
                  <LanguageChart languages={overview.languages} />
                )}
              </div>
            </div>

            {/* Row 3: Recent Commits Table (2/3) & Contributors List (1/3) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                {loadingCommits || !commits ? (
                  <Skeleton className="h-[400px]" />
                ) : (
                  <RecentCommitsTable commits={commits.recentCommits} />
                )}
              </div>

              <div className="lg:col-span-1">
                {loadingContributors || !contributors ? (
                  <Skeleton className="h-[400px]" />
                ) : (
                  <ContributorsList data={contributors} />
                )}
              </div>
            </div>

            {/* Row 4: Automated Insights (Full Width) */}
            <div>
              {loadingAnalysis || !analysis ? (
                <Skeleton className="h-64" />
              ) : (
                <InsightsPanel insights={analysis.insights} />
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
