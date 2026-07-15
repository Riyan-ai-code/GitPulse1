import React, { useState, useEffect } from 'react';
import { GitPullRequest, AlertCircle, Clock, ShieldAlert, ExternalLink } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchPrsAndIssues } from '../lib/api';
import { Skeleton } from './Skeleton';

interface Props {
  owner: string;
  repo: string;
}

export const PrsIssuesPanel: React.FC<Props> = ({ owner, repo }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchPrsAndIssues(owner, repo);
        setData(result);
      } catch (err: any) {
        console.error('[PrsIssuesPanel] Error loading stats:', err);
        setError(err.message || 'Failed to retrieve Pull Request and Issue statistics.');
      } finally {
        setLoading(false);
      }
    };

    if (owner && repo) {
      loadStats();
    }
  }, [owner, repo]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-8 text-center max-w-md mx-auto space-y-4">
        <div className="p-3 rounded-full bg-red-50 dark:bg-red-950/20 text-brand-red w-fit mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-[16px] font-bold text-text-heading">Data Unavailable</h3>
          <p className="text-[13px] text-text-secondary mt-1">{error || 'Could not fetch repository history.'}</p>
        </div>
      </div>
    );
  }

  const { prs, issues } = data;

  // Pie chart data
  const prPieData = [
    { name: 'Open PRs', value: prs.open, color: '#3B82F6' },
    { name: 'Merged/Closed', value: prs.closed, color: '#10B981' }
  ].filter(d => d.value > 0);

  const issuePieData = [
    { name: 'Open Issues', value: issues.open, color: '#F59E0B' },
    { name: 'Closed Issues', value: issues.closed, color: '#10B981' }
  ].filter(d => d.value > 0);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* PR Merge Speed */}
        <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-5 shadow-soft hover:shadow-hover-card transition-shadow duration-200 flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider">PR Merge Velocity</span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-brand-primary">
              <GitPullRequest className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[28px] font-extrabold text-text-heading leading-none">
              {prs.avgMergeTimeHours !== null ? `${prs.avgMergeTimeHours} hrs` : 'N/A'}
            </div>
            <p className="text-[11px] text-text-secondary mt-1">Average time to merge (last 100 closed)</p>
          </div>
        </div>

        {/* Issue Close Speed */}
        <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-5 shadow-soft hover:shadow-hover-card transition-shadow duration-200 flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider">Issue Resolution Time</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-brand-emerald">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[28px] font-extrabold text-text-heading leading-none">
              {issues.avgResolutionTimeHours !== null ? `${issues.avgResolutionTimeHours} hrs` : 'N/A'}
            </div>
            <p className="text-[11px] text-text-secondary mt-1">Average time to resolve (last 100 closed)</p>
          </div>
        </div>

        {/* Stale Issues Count */}
        <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-5 shadow-soft hover:shadow-hover-card transition-shadow duration-200 flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider">Stale Open Issues</span>
            <div className={`p-2 rounded-lg ${issues.staleCount > 0 ? 'bg-amber-50 dark:bg-amber-950/40 text-brand-amber' : 'bg-emerald-50 dark:bg-emerald-950/40 text-brand-emerald'}`}>
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[28px] font-extrabold text-text-heading leading-none">
              {issues.staleCount}
            </div>
            <p className="text-[11px] text-text-secondary mt-1">No activity &gt; 60 days (oldest 50 check)</p>
          </div>
        </div>

      </div>

      {/* Recharts Pie Ratios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* PR Distribution */}
        <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-6 shadow-soft">
          <h4 className="text-[13px] font-bold text-text-secondary uppercase tracking-wider mb-4">Pull Request Composition</h4>
          {prPieData.length === 0 ? (
            <div className="h-[180px] flex items-center justify-center text-[12.5px] text-text-secondary">No pull requests found.</div>
          ) : (
            <div className="h-[180px] w-full flex items-center">
              <ResponsiveContainer width="50%" height="100%">
                <PieChart>
                  <Pie
                    data={prPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {prPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'var(--color-bg-card)',
                      border: '1px solid var(--color-border-card)',
                      borderRadius: '8px',
                      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
                      color: 'var(--color-text-primary)'
                    }}
                    labelStyle={{ color: 'var(--text-heading)' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                    formatter={(value) => `${value} PRs`} 
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-1/2 space-y-2 pl-4">
                {prPieData.map(entry => (
                  <div key={entry.name} className="flex items-center gap-2 text-[12.5px] font-semibold text-text-primary">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                    <span>{entry.name}: {entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Issues Distribution */}
        <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-6 shadow-soft">
          <h4 className="text-[13px] font-bold text-text-secondary uppercase tracking-wider mb-4">Issue Resolution Ratio</h4>
          {issuePieData.length === 0 ? (
            <div className="h-[180px] flex items-center justify-center text-[12.5px] text-text-secondary">No tickets found.</div>
          ) : (
            <div className="h-[180px] w-full flex items-center">
              <ResponsiveContainer width="50%" height="100%">
                <PieChart>
                  <Pie
                    data={issuePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {issuePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'var(--color-bg-card)',
                      border: '1px solid var(--color-border-card)',
                      borderRadius: '8px',
                      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
                      color: 'var(--color-text-primary)'
                    }}
                    labelStyle={{ color: 'var(--text-heading)' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                    formatter={(value) => `${value} tickets`} 
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-1/2 space-y-2 pl-4">
                {issuePieData.map(entry => (
                  <div key={entry.name} className="flex items-center gap-2 text-[12.5px] font-semibold text-text-primary">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                    <span>{entry.name}: {entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Stale Issues Alerts Panel */}
      {issues.staleList && issues.staleList.length > 0 && (
        <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-6 shadow-soft">
          <div className="flex items-center gap-2 border-b border-border-divider pb-3 mb-4 text-brand-amber">
            <ShieldAlert className="w-5 h-5" />
            <h4 className="text-[14px] font-bold text-text-heading">Stale Open Tickets (Needs Attention)</h4>
          </div>
          
          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {issues.staleList.map((item: any) => (
              <div
                key={item.number}
                className="flex items-center justify-between p-3 rounded-lg border border-border-card bg-slate-50/50 dark:bg-bg-secondary/20 hover:bg-bg-secondary/40 transition-colors"
              >
                <div className="flex flex-col gap-0.5 text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-text-secondary">#{item.number}</span>
                    <a
                      href={item.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[13px] font-bold text-text-heading hover:text-brand-primary hover:underline flex items-center gap-1"
                    >
                      {item.title}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <span className="text-[11px] text-text-muted">Last activity: {formatDate(item.updatedAt)}</span>
                </div>
                <div className="text-[11.5px] font-bold px-2.5 py-0.5 rounded bg-amber-500/10 text-brand-amber border border-amber-500/20">
                  {item.comments} comments
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent PRs & Issues Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Pull Requests */}
        <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-6 shadow-soft">
          <h4 className="text-[14px] font-bold text-text-heading border-b border-border-divider pb-3 mb-4">Recent Pull Requests</h4>
          {prs.recent.length === 0 ? (
            <div className="text-center py-6 text-[12.5px] text-text-secondary">No pull requests found.</div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {prs.recent.map((pr: any) => (
                <div
                  key={pr.number}
                  className="flex items-center justify-between p-3 rounded-lg border border-border-card hover:bg-bg-secondary/30 transition-colors"
                >
                  <div className="flex flex-col gap-0.5 text-left">
                    <a
                      href={pr.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[12.5px] font-bold text-text-heading hover:text-brand-primary hover:underline line-clamp-1"
                    >
                      #{pr.number} {pr.title}
                    </a>
                    <span className="text-[10px] text-text-muted">
                      by {pr.user.login} • opened {formatDate(pr.createdAt)}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    pr.state === 'open' 
                      ? 'bg-blue-50 dark:bg-blue-950/20 text-brand-primary' 
                      : 'bg-emerald-50 dark:bg-emerald-950/20 text-brand-emerald'
                  }`}>
                    {pr.state}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Issues */}
        <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-6 shadow-soft">
          <h4 className="text-[14px] font-bold text-text-heading border-b border-border-divider pb-3 mb-4">Recent Issues</h4>
          {issues.recent.length === 0 ? (
            <div className="text-center py-6 text-[12.5px] text-text-secondary">No issues found.</div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {issues.recent.map((issue: any) => (
                <div
                  key={issue.number}
                  className="flex items-center justify-between p-3 rounded-lg border border-border-card hover:bg-bg-secondary/30 transition-colors"
                >
                  <div className="flex flex-col gap-0.5 text-left">
                    <a
                      href={issue.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[12.5px] font-bold text-text-heading hover:text-brand-primary hover:underline line-clamp-1"
                    >
                      #{issue.number} {issue.title}
                    </a>
                    <span className="text-[10px] text-text-muted">
                      by {issue.user.login} • opened {formatDate(issue.createdAt)}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    issue.state === 'open' 
                      ? 'bg-amber-50 dark:bg-amber-950/20 text-brand-amber' 
                      : 'bg-emerald-50 dark:bg-emerald-950/20 text-brand-emerald'
                  }`}>
                    {issue.state}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default PrsIssuesPanel;
