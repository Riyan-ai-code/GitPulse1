import React from 'react';
import { Star, GitFork, Eye, Scale, Database, Calendar, Clock, BookOpen, Award } from 'lucide-react';
import { RepositoryOverview as RepositoryOverviewType } from '../types';

interface Props {
  data: RepositoryOverviewType;
}

export const RepositoryOverview: React.FC<Props> = ({ data }) => {
  const formatSize = (kb: number) => {
    if (kb < 1024) return `${kb} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Repo Main Info Header */}
      <div className="bg-white border border-border-card rounded-[12px] p-6 shadow-soft hover:shadow-hover-card transition-shadow duration-200">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <img
            src={data.owner.avatar_url}
            alt={data.owner.login}
            className="w-16 h-16 rounded-[12px] border border-border-card object-cover"
          />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[22px] font-semibold text-text-heading leading-tight">
                <a
                  href={data.owner.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:underline text-brand-primary"
                >
                  {data.owner.login}
                </a>
                <span className="text-text-muted px-1">/</span>
                <span className="text-text-heading">{data.name}</span>
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#DCFCE7] text-[#166534]">
                Public
              </span>
            </div>
            <p className="text-[14px] text-text-secondary font-normal line-clamp-2 max-w-3xl">
              {data.description}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stars */}
        <div className="bg-white border border-border-card rounded-[12px] p-5 shadow-soft hover:shadow-hover-card transition-shadow duration-200 flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-text-secondary uppercase tracking-wider">Stars</span>
            <div className="p-2 rounded-lg bg-blue-50 text-brand-primary">
              <Star className="w-5 h-5 fill-current" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[28px] font-bold text-text-heading leading-none">
              {data.stars.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Forks */}
        <div className="bg-white border border-border-card rounded-[12px] p-5 shadow-soft hover:shadow-hover-card transition-shadow duration-200 flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-text-secondary uppercase tracking-wider">Forks</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-brand-emerald">
              <GitFork className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[28px] font-bold text-text-heading leading-none">
              {data.forks.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Watchers */}
        <div className="bg-white border border-border-card rounded-[12px] p-5 shadow-soft hover:shadow-hover-card transition-shadow duration-200 flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-text-secondary uppercase tracking-wider">Watchers</span>
            <div className="p-2 rounded-lg bg-cyan-50 text-brand-cyan">
              <Eye className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[28px] font-bold text-text-heading leading-none">
              {data.watchers.toLocaleString()}
            </div>
          </div>
        </div>

        {/* License */}
        <div className="bg-white border border-border-card rounded-[12px] p-5 shadow-soft hover:shadow-hover-card transition-shadow duration-200 flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-text-secondary uppercase tracking-wider">License</span>
            <div className="p-2 rounded-lg bg-amber-50 text-brand-amber">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[18px] font-bold text-text-heading truncate leading-none" title={data.license}>
              {data.license}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Details Section */}
      <div className="bg-white border border-border-card rounded-[12px] p-6 shadow-soft hover:shadow-hover-card transition-shadow duration-200">
        <h3 className="text-[16px] font-semibold text-text-heading mb-4 border-b border-border-divider pb-2">
          Repository Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-slate-50 text-text-secondary">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[12px] text-text-secondary font-medium">Repository Size</p>
              <p className="text-[15px] font-semibold text-text-heading mt-0.5">{formatSize(data.size)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-slate-50 text-text-secondary">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[12px] text-text-secondary font-medium">Created Date</p>
              <p className="text-[15px] font-semibold text-text-heading mt-0.5">{formatDate(data.createdAt)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-slate-50 text-text-secondary">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[12px] text-text-secondary font-medium">Last Updated</p>
              <p className="text-[15px] font-semibold text-text-heading mt-0.5">{formatDate(data.updatedAt)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default RepositoryOverview;
