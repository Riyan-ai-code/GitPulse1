import React from 'react';
import { GitCommit, ExternalLink } from 'lucide-react';
import { RecentCommit } from '../types';

interface Props {
  commits: RecentCommit[];
}

const getRelativeTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMins = Math.floor(diffTime / (1000 * 60));
      return diffMins <= 1 ? 'Just now' : `${diffMins} minutes ago`;
    }
    return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const RecentCommitsTable: React.FC<Props> = ({ commits }) => {
  return (
    <div className="bg-white border border-border-card rounded-[12px] p-6 shadow-soft hover:shadow-hover-card transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-border-divider">
        <div>
          <h3 className="text-[16px] font-semibold text-text-heading">Recent Commits</h3>
          <p className="text-[12px] text-text-secondary">Chronological history of repository changes</p>
        </div>
        <div className="p-2 rounded-lg bg-blue-50 text-brand-primary">
          <GitCommit className="w-5 h-5" />
        </div>
      </div>

      {commits.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-[14px] text-text-secondary font-medium">No commits found</p>
          <p className="text-[12px] text-text-muted mt-1">This repository might be empty.</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-6">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden border-t border-border-card max-h-[350px] overflow-y-auto relative">
              <table className="min-w-full divide-y divide-border-card text-left">
                <thead className="bg-slate-50 sticky top-0 z-10">
                  <tr>
                    <th scope="col" className="py-3 px-6 text-[12px] font-semibold text-text-secondary uppercase tracking-wider">
                      Author
                    </th>
                    <th scope="col" className="py-3 px-6 text-[12px] font-semibold text-text-secondary uppercase tracking-wider">
                      Message
                    </th>
                    <th scope="col" className="py-3 px-6 text-[12px] font-semibold text-text-secondary uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="py-3 px-6 text-[12px] font-semibold text-text-secondary uppercase tracking-wider text-right">
                      Link
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-card bg-white">
                  {commits.map((c) => (
                    <tr key={c.sha} className="hover:bg-bg-hover transition-colors">
                      {/* Author */}
                      <td className="whitespace-nowrap py-3 px-6">
                        <div className="flex items-center gap-2">
                          {c.author.avatar_url ? (
                            <img
                              src={c.author.avatar_url}
                              alt={c.author.name}
                              className="w-6 h-6 rounded-full border border-border-card"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-100 border border-border-card flex items-center justify-center text-[10px] font-bold text-text-secondary">
                              {c.author.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-[13px] font-medium text-text-primary truncate max-w-[120px]" title={c.author.name}>
                            {c.author.login || c.author.name}
                          </span>
                        </div>
                      </td>

                      {/* Message */}
                      <td className="py-3 px-6 max-w-[320px]">
                        <p className="text-[13px] text-text-primary truncate" title={c.message}>
                          {c.message}
                        </p>
                      </td>

                      {/* Date */}
                      <td className="whitespace-nowrap py-3 px-6 text-[13px] text-text-secondary">
                        {getRelativeTime(c.date)}
                      </td>

                      {/* External Link */}
                      <td className="whitespace-nowrap py-3 px-6 text-right text-[13px]">
                        <a
                          href={c.html_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-brand-primary hover:text-brand-primary-hover hover:underline"
                        >
                          <span className="sr-only">View Commit</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default RecentCommitsTable;
