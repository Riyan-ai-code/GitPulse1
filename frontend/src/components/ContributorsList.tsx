import React from 'react';
import { Users } from 'lucide-react';
import { ContributorsList as ContributorsListType } from '../types';

interface Props {
  data: ContributorsListType;
}

export const ContributorsList: React.FC<Props> = ({ data }) => {
  return (
    <div className="bg-white border border-border-card rounded-[12px] p-6 shadow-soft hover:shadow-hover-card transition-shadow duration-200 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-border-divider">
        <div>
          <h3 className="text-[16px] font-semibold text-text-heading">Top Contributors</h3>
          <p className="text-[12px] text-text-secondary">Most active developers in this repository</p>
        </div>
        <div className="p-2 rounded-lg bg-emerald-50 text-brand-emerald">
          <Users className="w-5 h-5" />
        </div>
      </div>

      {data.contributors.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
          <p className="text-[14px] text-text-secondary font-medium">No contributor data found</p>
          <p className="text-[12px] text-text-muted mt-1">This repository might be empty or has hidden details.</p>
        </div>
      ) : (
        <div className="space-y-4 flex-1 overflow-y-auto max-h-[360px] pr-1">
          {data.contributors.map((c, index) => (
            <div key={c.login} className="flex items-center gap-3">
              {/* Rank Badge */}
              <div className="text-[12px] font-bold text-text-muted w-4 text-center">
                {index + 1}
              </div>

              {/* Avatar */}
              <a href={c.html_url} target="_blank" rel="noreferrer" className="flex-shrink-0">
                <img
                  src={c.avatar_url}
                  alt={c.login}
                  className="w-9 h-9 rounded-full border border-border-card object-cover hover:opacity-85 transition-opacity"
                />
              </a>

              {/* Contributor Stats & Progress */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <a
                    href={c.html_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[14px] font-semibold text-text-heading hover:text-brand-primary hover:underline truncate"
                  >
                    {c.login}
                  </a>
                  <span className="text-[12px] font-medium text-text-secondary ml-2">
                    {c.commits} {c.commits === 1 ? 'commit' : 'commits'}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-brand-emerald h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(c.percentage, 1)}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-text-secondary w-8 text-right">
                    {c.percentage}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default ContributorsList;
