import React from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Flame, Clock, Calendar } from 'lucide-react';
import { CommitStats } from '../types';

interface Props {
  data: CommitStats;
}

export const CommitAnalysis: React.FC<Props> = ({ data }) => {
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatChartDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Group commits by Day of the Week based on the last 30 calendar days
  const getDayOfWeekData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const counts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    data.recentCommits.forEach(c => {
      if (c.date) {
        const d = new Date(c.date);
        if (d >= thirtyDaysAgo) {
          const dayName = days[d.getDay()] as keyof typeof counts;
          if (counts[dayName] !== undefined) {
            counts[dayName]++;
          }
        }
      }
    });

    return [
      { name: 'Mon', commits: counts.Mon },
      { name: 'Tue', commits: counts.Tue },
      { name: 'Wed', commits: counts.Wed },
      { name: 'Thu', commits: counts.Thu },
      { name: 'Fri', commits: counts.Fri },
      { name: 'Sat', commits: counts.Sat },
      { name: 'Sun', commits: counts.Sun },
    ];
  };

  const dayOfWeekData = getDayOfWeekData();

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Commits */}
        <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-5 shadow-soft hover:shadow-hover-card transition-all duration-200 flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider">Total Commits</span>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-brand-primary">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[32px] font-extrabold text-text-heading leading-none">
              {data.totalCommits.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Commits Last 30 Days */}
        <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-5 shadow-soft hover:shadow-hover-card transition-all duration-200 flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider">Last 30 Days</span>
            <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-brand-cyan">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[32px] font-extrabold text-text-heading leading-none">
              {data.commitsLast30Days.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Last Commit Date */}
        <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-5 shadow-soft hover:shadow-hover-card transition-all duration-200 flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider">Last Commit</span>
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-brand-purple">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[14px] font-bold text-text-heading line-clamp-2 leading-tight">
              {formatDate(data.lastCommitDate)}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid: Activity (Line) and Day of Week (Bar) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Commit Activity Area Chart */}
        <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-6 shadow-soft hover:shadow-hover-card transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[16px] font-semibold text-text-heading">Commit Activity</h3>
              <p className="text-[12px] text-text-secondary">Commit volume history of the last 30 active days</p>
            </div>
            <div className="text-[11px] font-bold px-2 py-1 bg-slate-100 dark:bg-bg-secondary rounded text-text-secondary">
              Active Timeline
            </div>
          </div>

          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.activityGraph} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="commitColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-card)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatChartDate}
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
                  labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                  formatter={(value: any) => [`${value} commits`, 'Activity']}
                />
                <Area
                  type="monotone"
                  dataKey="commits"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#commitColor)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Commits by Day of Week Bar Chart */}
        <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-6 shadow-soft hover:shadow-hover-card transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[16px] font-semibold text-text-heading">Commits by Day of Week</h3>
              <p className="text-[12px] text-text-secondary">Day-wise distribution of recent commit activity</p>
            </div>
            <div className="text-[11px] font-bold px-2 py-1 bg-slate-100 dark:bg-bg-secondary rounded text-text-secondary">
              Recent History
            </div>
          </div>

          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeekData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-card)" />
                <XAxis
                  dataKey="name"
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
                  formatter={(value: any) => [`${value} commits`, 'Commits']}
                />
                <Bar
                  dataKey="commits"
                  fill="#8B5CF6"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CommitAnalysis;
