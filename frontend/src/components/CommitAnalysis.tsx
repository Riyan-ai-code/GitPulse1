import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
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

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Commits */}
        <div className="bg-white border border-border-card rounded-[12px] p-5 shadow-soft hover:shadow-hover-card transition-shadow duration-200 flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-text-secondary uppercase tracking-wider">Total Commits</span>
            <div className="p-2 rounded-lg bg-blue-50 text-brand-primary">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[32px] font-bold text-text-heading leading-none">
              {data.totalCommits.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Commits Last 30 Days */}
        <div className="bg-white border border-border-card rounded-[12px] p-5 shadow-soft hover:shadow-hover-card transition-shadow duration-200 flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-text-secondary uppercase tracking-wider">Last 30 Days</span>
            <div className="p-2 rounded-lg bg-cyan-50 text-brand-cyan">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[32px] font-bold text-text-heading leading-none">
              {data.commitsLast30Days.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Last Commit Date */}
        <div className="bg-white border border-border-card rounded-[12px] p-5 shadow-soft hover:shadow-hover-card transition-shadow duration-200 flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-text-secondary uppercase tracking-wider">Last Commit</span>
            <div className="p-2 rounded-lg bg-purple-50 text-brand-purple">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[14px] font-semibold text-text-heading line-clamp-2 leading-tight">
              {formatDate(data.lastCommitDate)}
            </div>
          </div>
        </div>
      </div>

      {/* Commit Activity Chart */}
      <div className="bg-white border border-border-card rounded-[12px] p-6 shadow-soft hover:shadow-hover-card transition-shadow duration-200">
        <div className="mb-4">
          <h3 className="text-[16px] font-semibold text-text-heading">Commit Activity</h3>
          <p className="text-[12px] text-text-secondary">Commit volume history over the last 30 days</p>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.activityGraph} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="commitColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis
                dataKey="date"
                tickFormatter={formatChartDate}
                tick={{ fill: '#64748B', fontSize: 11 }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748B', fontSize: 11 }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)'
                }}
                labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                formatter={(value: any) => [`${value} commits`, 'Activity']}
              />
              <Area
                type="monotone"
                dataKey="commits"
                stroke="#2563EB"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#commitColor)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
export default CommitAnalysis;
