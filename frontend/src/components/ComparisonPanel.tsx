import React, { useState } from 'react';
import { 
  Search, 
  AlertCircle, 
  ArrowRight, 
  RefreshCw, 
  Flame, 
  Star, 
  GitFork, 
  Clock, 
  ShieldAlert,
  Printer,
  Users,
  Activity,
  Layers,
  FileText,
  Trophy,
  Compass
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import {
  fetchRepositoryOverview,
  fetchCommitStats,
  fetchAnalysis,
  fetchPrsAndIssues,
  parseGitHubUrl
} from '../lib/api';
import { RepositoryOverview, CommitStats, RepositoryAnalysis } from '../types';

interface ComparisonData {
  repo1: { 
    overview: RepositoryOverview; 
    commits: CommitStats; 
    analysis: RepositoryAnalysis;
    prsIssues: any;
  };
  repo2: { 
    overview: RepositoryOverview; 
    commits: CommitStats; 
    analysis: RepositoryAnalysis;
    prsIssues: any;
  };
}

export const ComparisonPanel: React.FC = () => {
  const [repo1Input, setRepo1Input] = useState('');
  const [repo2Input, setRepo2Input] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ComparisonData | null>(null);

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(false);
    setError(null);

    const p1 = parseGitHubUrl(repo1Input);
    const p2 = parseGitHubUrl(repo2Input);

    if (!p1 || !p2) {
      setError('Please provide a valid GitHub URL or "owner/repo" path for both repositories.');
      return;
    }

    if (p1.owner.toLowerCase() === p2.owner.toLowerCase() && p1.repo.toLowerCase() === p2.repo.toLowerCase()) {
      setError('Please select two different repositories to compare.');
      return;
    }

    setLoading(true);

    try {
      const [
        r1Overview, r1Commits, r1Analysis, r1PrsIssues,
        r2Overview, r2Commits, r2Analysis, r2PrsIssues
      ] = await Promise.all([
        fetchRepositoryOverview(p1.owner, p1.repo),
        fetchCommitStats(p1.owner, p1.repo),
        fetchAnalysis(p1.owner, p1.repo),
        fetchPrsAndIssues(p1.owner, p1.repo),
        fetchRepositoryOverview(p2.owner, p2.repo),
        fetchCommitStats(p2.owner, p2.repo),
        fetchAnalysis(p2.owner, p2.repo),
        fetchPrsAndIssues(p2.owner, p2.repo),
      ]);

      setData({
        repo1: { overview: r1Overview, commits: r1Commits, analysis: r1Analysis, prsIssues: r1PrsIssues },
        repo2: { overview: r2Overview, commits: r2Commits, analysis: r2Analysis, prsIssues: r2PrsIssues },
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to retrieve comparison statistics. Verify rate limits and spelling.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setData(null);
    setRepo1Input('');
    setRepo2Input('');
    setError(null);
  };

  // Format date to "25 Oct 2016" style
  const formatDateString = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Compile combined 30-day activity data for the Recharts line chart
  const getCombinedGraphData = () => {
    if (!data) return [];
    const g1 = data.repo1.commits.activityGraph || [];
    const g2 = data.repo2.commits.activityGraph || [];

    // Since both arrays represent 30 consecutive days, they map 1-to-1 by date index
    return g1.map((item, idx) => {
      const dateVal = new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const r1Count = item.commits || 0;
      const r2Count = g2[idx]?.commits || 0;
      return {
        date: dateVal,
        [data.repo1.overview.name]: r1Count,
        [data.repo2.overview.name]: r2Count
      };
    });
  };

  const combinedGraphData = getCombinedGraphData();

  // Dynamic GSoC Contribution Readiness Calculation
  const getGSoCScore = (repo: any) => {
    let score = 0;
    const overview = repo.overview;

    if (overview.license && overview.license !== 'No License') score += 20;
    if (overview.stars > 1000) score += 20;
    else if (overview.stars > 100) score += 15;
    else if (overview.stars > 10) score += 10;
    
    if (overview.forks > 500) score += 25;
    else if (overview.forks > 100) score += 20;
    else if (overview.forks > 10) score += 15;
    else if (overview.forks > 2) score += 10;

    if (overview.openIssuesCount > 50) score += 20;
    else if (overview.openIssuesCount > 10) score += 15;
    else if (overview.openIssuesCount > 0) score += 10;

    const lastUpdate = new Date(overview.updatedAt);
    const diffDays = Math.floor((new Date().getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) score += 15;
    else if (diffDays <= 30) score += 10;
    else if (diffDays <= 90) score += 5;

    let grade = 'B';
    if (score >= 85) grade = 'A+';
    else if (score >= 70) grade = 'A';
    else if (score >= 40) grade = 'B';
    else grade = 'C';

    return { score, grade };
  };

  // Compile comparison scorecard metrics
  const getScorecard = () => {
    if (!data) return null;

    const gsoc1 = getGSoCScore(data.repo1);
    const gsoc2 = getGSoCScore(data.repo2);

    const repo1Contributors = data.repo1.commits.recentCommits?.reduce((acc: string[], c) => c.author?.login && !acc.includes(c.author.login) ? [...acc, c.author.login] : acc, []).length || 0;
    const repo2Contributors = data.repo2.commits.recentCommits?.reduce((acc: string[], c) => c.author?.login && !acc.includes(c.author.login) ? [...acc, c.author.login] : acc, []).length || 0;

    const metrics = [
      { key: 'health', label: 'Health Score', v1: data.repo1.analysis.healthScore, v2: data.repo2.analysis.healthScore, comp: (a: number, b: number) => a - b },
      { key: 'stars', label: 'GitHub Stars', v1: data.repo1.overview.stars, v2: data.repo2.overview.stars, comp: (a: number, b: number) => a - b },
      { key: 'forks', label: 'Forks', v1: data.repo1.overview.forks, v2: data.repo2.overview.forks, comp: (a: number, b: number) => a - b },
      { key: 'watchers', label: 'Watchers', v1: data.repo1.overview.watchers, v2: data.repo2.overview.watchers, comp: (a: number, b: number) => a - b },
      { key: 'size', label: 'Codebase Size', v1: data.repo1.overview.size, v2: data.repo2.overview.size, comp: (a: number, b: number) => b - a }, // lower size wins
      { key: 'totalCommits', label: 'Total Commits', v1: data.repo1.commits.totalCommits, v2: data.repo2.commits.totalCommits, comp: (a: number, b: number) => a - b },
      { key: 'commits30d', label: 'Commits (30 Days)', v1: data.repo1.commits.commitsLast30Days, v2: data.repo2.commits.commitsLast30Days, comp: (a: number, b: number) => a - b },
      { key: 'contributors', label: 'Active Contributors', v1: repo1Contributors, v2: repo2Contributors, comp: (a: number, b: number) => a - b },
      { 
        key: 'lastCommit', 
        label: 'Last Commit Date', 
        v1: data.repo1.commits.lastCommitDate, 
        v2: data.repo2.commits.lastCommitDate, 
        comp: (a: string | null, b: string | null) => {
          if (!a && !b) return 0;
          if (!a) return -1;
          if (!b) return 1;
          return new Date(a).getTime() - new Date(b).getTime();
        } 
      },
      { key: 'prs', label: 'Open PRs', v1: data.repo1.prsIssues?.prs?.open ?? 0, v2: data.repo2.prsIssues?.prs?.open ?? 0, comp: (a: number, b: number) => a - b },
      { key: 'prVelocity', label: 'PR Merge Time', v1: data.repo1.prsIssues?.prs?.avgMergeTimeHours ?? 9999, v2: data.repo2.prsIssues?.prs?.avgMergeTimeHours ?? 9999, comp: (a: number, b: number) => b - a }, // lower time wins
      { key: 'staleIssues', label: 'Stale Open Issues', v1: data.repo1.prsIssues?.issues?.staleCount ?? 9999, v2: data.repo2.prsIssues?.issues?.staleCount ?? 9999, comp: (a: number, b: number) => b - a }, // lower stale count wins
      { key: 'gsoc', label: 'GSoC Contributor Grade', v1: gsoc1.score, v2: gsoc2.score, comp: (a: number, b: number) => a - b, meta1: gsoc1.grade, meta2: gsoc2.grade }
    ];

    let wins1 = 0;
    let wins2 = 0;

    metrics.forEach(m => {
      const c = (m.comp as (a: any, b: any) => number)(m.v1, m.v2);
      if (c > 0) wins1++;
      if (c < 0) wins2++;
    });

    const winnerRepo = wins1 > wins2 ? data.repo1 : wins2 > wins1 ? data.repo2 : null;
    const winnerName = winnerRepo ? winnerRepo.overview.name : 'Tie';
    const winsCount = Math.max(wins1, wins2);
    
    return { metrics, wins1, wins2, winnerName, winsCount, winnerRepo, gsoc1, gsoc2 };
  };

  const scorecard = getScorecard();

  // Score styling helpers
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-brand-emerald bg-emerald-50 dark:bg-emerald-950/20';
    if (score >= 70) return 'text-brand-amber bg-amber-50 dark:bg-amber-950/20';
    return 'text-brand-red bg-red-50 dark:bg-red-950/20';
  };

  return (
    <div className="space-y-6">
      
      {/* Search Input Section (Always hidden during print) */}
      {!data && (
        <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-6 shadow-soft max-w-2xl mx-auto no-print">
          <div className="text-center mb-6">
            <h3 className="text-[16px] font-bold text-text-heading">Compare Repositories</h3>
            <p className="text-[12px] text-text-secondary mt-1">Enter two public repositories to compare health, activity, and size side-by-side</p>
          </div>

          <form onSubmit={handleCompare} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Repo 1 */}
              <div>
                <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block mb-1.5">First Repository</label>
                <div className="relative rounded-md shadow-sm">
                  <input
                    type="text"
                    required
                    value={repo1Input}
                    onChange={(e) => setRepo1Input(e.target.value)}
                    placeholder="e.g. facebook/react"
                    className="block w-full rounded-[8px] border border-border-card dark:border-slate-800 bg-bg-main dark:bg-[#1E293B] py-2.5 px-3 text-[13px] text-text-heading placeholder-text-muted focus:border-brand-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Repo 2 */}
              <div>
                <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block mb-1.5">Second Repository</label>
                <div className="relative rounded-md shadow-sm">
                  <input
                    type="text"
                    required
                    value={repo2Input}
                    onChange={(e) => setRepo2Input(e.target.value)}
                    placeholder="e.g. vuejs/core"
                    className="block w-full rounded-[8px] border border-border-card dark:border-slate-800 bg-bg-main dark:bg-[#1E293B] py-2.5 px-3 text-[13px] text-text-heading placeholder-text-muted focus:border-brand-primary focus:outline-none"
                  />
                </div>
              </div>

            </div>

            {error && (
              <div className="flex items-start gap-2 text-red-600 text-[12.5px] bg-red-50 dark:bg-red-950/10 p-3 rounded-lg border border-red-100 dark:border-red-900/20">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-2.5 text-[13px] font-bold rounded-[8px] text-white bg-brand-primary hover:bg-brand-primary-hover disabled:bg-slate-300 dark:disabled:bg-slate-800 cursor-pointer shadow-soft transition-colors"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Fetching Metrics...
                </>
              ) : (
                <>
                  Compare Repositories
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Comparison Results Dashboard */}
      {data && (
        <div className="space-y-6 print-container">
          
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border-divider pb-4 gap-4 no-print">
            <div>
              <h3 className="text-[16px] font-bold text-text-heading">Codebase Comparison</h3>
              <p className="text-[12px] text-text-secondary mt-0.5">Comparing {data.repo1.overview.owner.login}/{data.repo1.overview.name} vs. {data.repo2.overview.owner.login}/{data.repo2.overview.name}</p>
            </div>
            
            <div className="flex items-center gap-2.5 ml-auto">
              <button
                onClick={handleReset}
                className="px-3 py-1.5 border border-border-card hover:bg-bg-secondary text-[12px] font-bold text-text-secondary rounded-lg transition-colors cursor-pointer"
              >
                Reset Comparison
              </button>
            </div>
          </div>

          {/* Print only header */}
          <div className="hidden print:block border-b border-slate-300 pb-3 mb-6">
            <h1 className="text-[20px] font-black text-slate-900">GitPulse Comparison Report</h1>
            <p className="text-[12px] text-slate-500 mt-1">
              Comparing <strong>{data.repo1.overview.owner.login}/{data.repo1.overview.name}</strong> vs. <strong>{data.repo2.overview.owner.login}/{data.repo2.overview.name}</strong>
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Generated on: {new Date().toLocaleDateString()}</p>
          </div>

          {/* Comparison Summary Card */}
          {scorecard && (
            <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-6 shadow-soft hover:shadow-hover-card transition-shadow duration-200 space-y-4 no-print">
              <div className="flex items-center gap-2 border-b border-border-divider pb-3">
                <Compass className="w-5 h-5 text-brand-primary" />
                <h4 className="text-[14px] font-bold text-text-heading">Codebase Comparison Verdict</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="md:col-span-2 space-y-2 text-left">
                  {scorecard.winnerRepo ? (
                    <p className="text-[13.5px] text-text-primary leading-relaxed">
                      🏆 <strong>{scorecard.winnerRepo.overview.name}</strong> is the recommended codebase. It won <strong>{scorecard.winsCount} out of {scorecard.metrics.length}</strong> comparison metrics, displaying superior community engagement, faster contribution review times, and healthier documentation hygiene.
                    </p>
                  ) : (
                    <p className="text-[13.5px] text-text-primary leading-relaxed">
                      🤝 <strong>It is a tie!</strong> Both codebases are exceptionally well-matched across health scores, star ratios, and developer velocity metrics.
                    </p>
                  )}
                  <p className="text-[12.5px] text-text-secondary leading-relaxed">
                    For developers aiming to contribute to GSoC or open source, {scorecard.winnerRepo ? scorecard.winnerRepo.overview.name : 'both repositories'} offer active collaboration lines. Compare the side-by-side metric weights below to choose the project that best fits your language stack.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-bg-secondary/40 border border-border-card/65 rounded-xl p-4 space-y-3 text-[12.5px] flex flex-col items-center text-center justify-center">
                  <span className="text-[12px] font-bold text-text-heading uppercase tracking-wider block">GSoC Readiness</span>
                  <div className="flex items-center gap-6 mt-1">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-text-secondary block truncate max-w-[80px]">{data.repo1.overview.name}</span>
                      <span className="text-[20px] font-black text-brand-primary block">{scorecard.gsoc1.grade}</span>
                    </div>
                    <div className="h-8 w-px bg-border-divider" />
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-text-secondary block truncate max-w-[80px]">{data.repo2.overview.name}</span>
                      <span className="text-[20px] font-black text-[#8B5CF6] block">{scorecard.gsoc2.grade}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Side-by-Side Comparison Table Card */}
          <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-6 shadow-soft">
            <h4 className="text-[13px] font-bold text-text-secondary uppercase tracking-wider mb-4">Metric Comparison</h4>
            
            <div className="overflow-x-auto">
              <table className="min-w-full text-center divide-y divide-border-divider">
                <thead>
                  <tr className="text-[11px] font-bold text-text-secondary uppercase tracking-wider bg-bg-hover/20">
                    <th scope="col" className="py-2.5 px-4 text-left">Metric</th>
                    <th scope="col" className="py-2.5 px-4">{data.repo1.overview.name}</th>
                    <th scope="col" className="py-2.5 px-4">{data.repo2.overview.name}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-divider text-[13px] font-semibold text-text-primary">
                  {scorecard && scorecard.metrics.map(metric => {
                    const compResult = (metric.comp as (a: any, b: any) => number)(metric.v1, metric.v2);
                    const win1 = compResult > 0;
                    const win2 = compResult < 0;

                    const formatVal = (v: any, key: string, isRepo2 = false) => {
                      if (key === 'health') {
                        return (
                          <span className={`px-2.5 py-1 rounded-full font-extrabold ${getScoreColor(v)}`}>
                            {v} / 100
                          </span>
                        );
                      }
                      if (key === 'size') {
                        return `${(v / 1024).toFixed(1)} MB`;
                      }
                      if (key === 'lastCommit') {
                        return formatDateString(v);
                      }
                      if (key === 'prVelocity') {
                        return v === 9999 ? 'N/A' : `${v} hrs`;
                      }
                      if (key === 'staleIssues') {
                        return v === 9999 ? 'N/A' : v.toLocaleString();
                      }
                      if (key === 'gsoc') {
                        const grade = isRepo2 ? metric.meta2 : metric.meta1;
                        return (
                          <span className="font-extrabold text-brand-primary">
                            {grade} ({v} pts)
                          </span>
                        );
                      }
                      return v.toLocaleString();
                    };

                    return (
                      <tr key={metric.key} className="hover:bg-bg-hover/30 transition-colors">
                        <td className="py-3 px-4 text-left font-semibold text-text-secondary">{metric.label}</td>
                        <td className={`py-3 px-4 text-center font-bold ${
                          win1 
                            ? 'text-brand-emerald bg-emerald-50/30 dark:bg-emerald-950/10' 
                            : ''
                        }`}>
                          <div className="flex items-center justify-center gap-2">
                            {formatVal(metric.v1, metric.key, false)}
                            {win1 && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-950 text-brand-emerald border border-emerald-200/50">
                                <Trophy className="w-2.5 h-2.5" />
                                Win
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={`py-3 px-4 text-center font-bold ${
                          win2 
                            ? 'text-brand-emerald bg-emerald-50/30 dark:bg-emerald-950/10' 
                            : ''
                        }`}>
                          <div className="flex items-center justify-center gap-2">
                            {formatVal(metric.v2, metric.key, true)}
                            {win2 && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-950 text-brand-emerald border border-emerald-200/50">
                                <Trophy className="w-2.5 h-2.5" />
                                Win
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Primary Language */}
                  <tr className="hover:bg-bg-hover/30">
                    <td className="py-3 px-4 text-left font-semibold text-text-secondary">Primary Language</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/20 text-brand-primary text-[12px] font-bold">
                        {data.repo1.overview.primaryLanguage}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/20 text-brand-primary text-[12px] font-bold">
                        {data.repo2.overview.primaryLanguage}
                      </span>
                    </td>
                  </tr>

                  {/* License */}
                  <tr className="hover:bg-bg-hover/30">
                    <td className="py-3 px-4 text-left font-semibold text-text-secondary">License</td>
                    <td className="py-3 px-4 text-center text-text-secondary">{data.repo1.overview.license}</td>
                    <td className="py-3 px-4 text-center text-text-secondary">{data.repo2.overview.license}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Overlapping Commit Activity Chart */}
          <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-6 shadow-soft page-break-before">
            <div className="mb-4">
              <h4 className="text-[13px] font-bold text-text-secondary uppercase tracking-wider">Commit Velocity Comparison</h4>
              <p className="text-[12px] text-text-secondary mt-0.5">Overlapping daily commits volume history (last 30 days)</p>
            </div>

            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={combinedGraphData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="compColor1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="compColor2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-card)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
                    axisLine={{ stroke: 'var(--color-border-card)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }}
                    axisLine={{ stroke: 'var(--color-border-card)' }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-bg-card)',
                      border: '1px solid var(--color-border-card)',
                      borderRadius: '8px',
                      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
                      color: 'var(--color-text-primary)'
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey={data.repo1.overview.name}
                    stroke="#2563EB"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#compColor1)"
                  />
                  <Area
                    type="monotone"
                    dataKey={data.repo2.overview.name}
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#compColor2)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default ComparisonPanel;
