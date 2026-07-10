import React, { useState } from 'react';
import { Search, AlertCircle, ArrowRight, RefreshCw, Flame, Star, GitFork, Clock, ShieldAlert } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import {
  fetchRepositoryOverview,
  fetchCommitStats,
  fetchAnalysis,
  parseGitHubUrl
} from '../lib/api';
import { RepositoryOverview, CommitStats, RepositoryAnalysis } from '../types';

interface ComparisonData {
  repo1: { overview: RepositoryOverview; commits: CommitStats; analysis: RepositoryAnalysis };
  repo2: { overview: RepositoryOverview; commits: CommitStats; analysis: RepositoryAnalysis };
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
      const [r1Overview, r1Commits, r1Analysis, r2Overview, r2Commits, r2Analysis] = await Promise.all([
        fetchRepositoryOverview(p1.owner, p1.repo),
        fetchCommitStats(p1.owner, p1.repo),
        fetchAnalysis(p1.owner, p1.repo),
        fetchRepositoryOverview(p2.owner, p2.repo),
        fetchCommitStats(p2.owner, p2.repo),
        fetchAnalysis(p2.owner, p2.repo),
      ]);

      setData({
        repo1: { overview: r1Overview, commits: r1Commits, analysis: r1Analysis },
        repo2: { overview: r2Overview, commits: r2Commits, analysis: r2Analysis },
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
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-border-divider hover:bg-bg-secondary text-[12.5px] font-bold text-text-secondary rounded-lg transition-colors cursor-pointer"
            >
              Reset Comparison
            </button>
          </div>

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
                  {/* Health Score */}
                  <tr className="hover:bg-bg-hover/30">
                    <td className="py-3 px-4 text-left font-bold">Health Score</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full font-extrabold ${getScoreColor(data.repo1.analysis.healthScore)}`}>
                        {data.repo1.analysis.healthScore} / 100
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full font-extrabold ${getScoreColor(data.repo2.analysis.healthScore)}`}>
                        {data.repo2.analysis.healthScore} / 100
                      </span>
                    </td>
                  </tr>

                  {/* Stars */}
                  <tr className="hover:bg-bg-hover/30">
                    <td className="py-3 px-4 text-left">GitHub Stars</td>
                    <td className="py-3 px-4">{data.repo1.overview.stars.toLocaleString()}</td>
                    <td className="py-3 px-4">{data.repo2.overview.stars.toLocaleString()}</td>
                  </tr>

                  {/* Forks */}
                  <tr className="hover:bg-bg-hover/30">
                    <td className="py-3 px-4 text-left">Forks</td>
                    <td className="py-3 px-4">{data.repo1.overview.forks.toLocaleString()}</td>
                    <td className="py-3 px-4">{data.repo2.overview.forks.toLocaleString()}</td>
                  </tr>

                  {/* Watchers */}
                  <tr className="hover:bg-bg-hover/30">
                    <td className="py-3 px-4 text-left">Watchers</td>
                    <td className="py-3 px-4">{data.repo1.overview.watchers.toLocaleString()}</td>
                    <td className="py-3 px-4">{data.repo2.overview.watchers.toLocaleString()}</td>
                  </tr>

                  {/* Codebase Size */}
                  <tr className="hover:bg-bg-hover/30">
                    <td className="py-3 px-4 text-left">Codebase Size</td>
                    <td className="py-3 px-4">{(data.repo1.overview.size / 1024).toFixed(1)} MB</td>
                    <td className="py-3 px-4">{(data.repo2.overview.size / 1024).toFixed(1)} MB</td>
                  </tr>

                  {/* Total Commits */}
                  <tr className="hover:bg-bg-hover/30">
                    <td className="py-3 px-4 text-left">Total Commits</td>
                    <td className="py-3 px-4">{data.repo1.commits.totalCommits.toLocaleString()}</td>
                    <td className="py-3 px-4">{data.repo2.commits.totalCommits.toLocaleString()}</td>
                  </tr>

                  {/* Commits (Last 30 Days) */}
                  <tr className="hover:bg-bg-hover/30">
                    <td className="py-3 px-4 text-left">Commits (Last 30 Days)</td>
                    <td className="py-3 px-4 text-brand-primary">{data.repo1.commits.commitsLast30Days.toLocaleString()}</td>
                    <td className="py-3 px-4 text-brand-primary">{data.repo2.commits.commitsLast30Days.toLocaleString()}</td>
                  </tr>

                  {/* Primary Language */}
                  <tr className="hover:bg-bg-hover/30">
                    <td className="py-3 px-4 text-left">Primary Language</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/20 text-brand-primary text-[12px] font-bold">
                        {data.repo1.overview.primaryLanguage}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/20 text-brand-primary text-[12px] font-bold">
                        {data.repo2.overview.primaryLanguage}
                      </span>
                    </td>
                  </tr>

                  {/* License */}
                  <tr className="hover:bg-bg-hover/30">
                    <td className="py-3 px-4 text-left">License</td>
                    <td className="py-3 px-4 text-text-secondary">{data.repo1.overview.license}</td>
                    <td className="py-3 px-4 text-text-secondary">{data.repo2.overview.license}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Overlapping Commit Activity Chart */}
          <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-6 shadow-soft">
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
