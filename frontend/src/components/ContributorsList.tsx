import React from 'react';
import { Moon, Calendar, BookOpen, GitBranch } from 'lucide-react';
import { ContributorsList as ContributorsListType, RecentCommit } from '../types';

interface Props {
  data: ContributorsListType;
  commits?: RecentCommit[];
}

export const ContributorsList: React.FC<Props> = ({ data, commits = [] }) => {
  const contributors = data.contributors || [];

  // Calculate commit sums
  const totalCommitsSum = contributors.reduce((acc, curr) => acc + curr.commits, 0);
  
  // Slice top 6 contributors
  const topContributors = contributors.slice(0, 6);
  const topCommitsSum = topContributors.reduce((acc, curr) => acc + curr.commits, 0);

  // Group remaining contributors into "others"
  const otherCommitsSum = totalCommitsSum - topCommitsSum;
  const otherPercentage = totalCommitsSum > 0 
    ? parseFloat(((otherCommitsSum / totalCommitsSum) * 100).toFixed(1))
    : 0;

  // Calculate badges for a contributor
  const getContributorBadges = (login: string, index: number) => {
    const contributorCommits = commits.filter(c => 
      c.author?.login === login || 
      c.author?.name?.toLowerCase() === login.toLowerCase()
    );

    const isCoreBuilder = index < 3;
    let isNightOwl = false;
    let isWeekendWarrior = false;
    let isDocChampion = false;

    if (contributorCommits.length > 0) {
      // Night Owl: > 20% commits between 8 PM (20) and 4 AM (4)
      const lateCommits = contributorCommits.filter(c => {
        const d = new Date(c.date);
        const hour = d.getHours();
        return hour >= 20 || hour < 4;
      }).length;
      isNightOwl = (lateCommits / contributorCommits.length) >= 0.20;

      // Weekend Warrior: > 20% commits on Sat (6) and Sun (0)
      const weekendCommits = contributorCommits.filter(c => {
        const d = new Date(c.date);
        const day = d.getDay();
        return day === 0 || day === 6;
      }).length;
      isWeekendWarrior = (weekendCommits / contributorCommits.length) >= 0.20;

      // Doc Champion: any commit message matching docs/readme
      isDocChampion = contributorCommits.some(c => 
        /docs|readme|changelog|markdown/i.test(c.message)
      );
    }

    return { isCoreBuilder, isNightOwl, isWeekendWarrior, isDocChampion };
  };

  return (
    <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-6 shadow-soft hover:shadow-hover-card transition-shadow duration-200 flex flex-col justify-between min-h-[400px]">
      
      {/* Card Header */}
      <div className="mb-4 border-b border-border-divider pb-3">
        <h3 className="text-[14px] font-bold text-text-heading">Contributors</h3>
      </div>

      {contributors.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
          <p className="text-[13px] text-text-secondary font-medium">No contributor data found</p>
          <p className="text-[11px] text-text-muted mt-1">This repository might be empty.</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between">
          
          {/* Contributors Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-border-divider text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                  <th scope="col" className="py-2.5">Contributor</th>
                  <th scope="col" className="py-2.5 px-4 text-left">Commits</th>
                  <th scope="col" className="py-2.5 w-24 sm:w-32"></th>
                  <th scope="col" className="py-2.5 text-right">%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-divider">
                {/* Render Top 6 */}
                {topContributors.map((c, idx) => {
                  const badges = getContributorBadges(c.login, idx);
                  
                  return (
                    <tr key={c.login} className="hover:bg-bg-hover/40 transition-colors">
                      {/* Contributor Login + Avatar */}
                      <td className="py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {c.avatar_url ? (
                            <img
                              src={c.avatar_url}
                              alt={c.login}
                              className="w-5 h-5 rounded-full border border-border-divider object-cover"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-500">
                              {c.login.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="text-[13px] font-bold text-text-primary">
                            {c.login}
                          </span>

                          {/* Habit Badges */}
                          <div className="flex items-center gap-1 ml-1.5">
                            {badges.isCoreBuilder && (
                              <span className="p-0.5 rounded bg-blue-500/10 text-brand-primary" title="Core Builder: Top 3 contributor">
                                <GitBranch className="w-3 h-3" />
                              </span>
                            )}
                            {badges.isNightOwl && (
                              <span className="p-0.5 rounded bg-indigo-500/10 text-indigo-500" title="Night Owl: >20% commits late at night (8 PM - 4 AM)">
                                <Moon className="w-3 h-3" />
                              </span>
                            )}
                            {badges.isWeekendWarrior && (
                              <span className="p-0.5 rounded bg-amber-500/10 text-brand-amber" title="Weekend Warrior: >20% commits on weekends">
                                <Calendar className="w-3 h-3" />
                              </span>
                            )}
                            {badges.isDocChampion && (
                              <span className="p-0.5 rounded bg-emerald-500/10 text-brand-emerald" title="Documentation Champion: Commited documentation edits">
                                <BookOpen className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Commits count */}
                      <td className="py-3 px-4 text-left whitespace-nowrap text-[13px] text-text-primary font-bold">
                        {c.commits.toLocaleString()}
                      </td>

                      {/* Visual Progress Bar */}
                      <td className="py-3 whitespace-nowrap">
                        <div className="w-24 sm:w-32 bg-slate-100 dark:bg-bg-secondary rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-brand-primary dark:bg-[#8B5CF6] h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(c.percentage, 0.5)}%` }}
                          />
                        </div>
                      </td>

                      {/* Percentage text */}
                      <td className="py-3 text-right whitespace-nowrap text-[13px] text-text-secondary font-bold">
                        {c.percentage}%
                      </td>
                    </tr>
                  );
                })}

                {/* Render "others (various)" if there are remaining contributors */}
                {otherCommitsSum > 0 && (
                  <tr className="hover:bg-bg-hover/40 transition-colors">
                    {/* Others label */}
                    <td className="py-3 whitespace-nowrap">
                      <div className="flex flex-col pl-7">
                        <span className="text-[12px] font-bold text-text-secondary">others</span>
                        <span className="text-[10px] text-text-muted -mt-0.5">(various)</span>
                      </div>
                    </td>

                    {/* Commits sum */}
                    <td className="py-3 px-4 text-left whitespace-nowrap text-[13px] text-text-primary font-bold">
                      {otherCommitsSum.toLocaleString()}
                    </td>

                    {/* Visual Progress Bar */}
                    <td className="py-3 whitespace-nowrap">
                      <div className="w-24 sm:w-32 bg-slate-100 dark:bg-bg-secondary rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-brand-primary dark:bg-[#8B5CF6] h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(otherPercentage, 0.5)}%` }}
                        />
                      </div>
                    </td>

                    {/* Percentage share */}
                    <td className="py-3 text-right whitespace-nowrap text-[13px] text-text-secondary font-bold">
                      {otherPercentage}%
                    </td>
                  </tr>
                )}

                {/* Render Total Summary Row */}
                <tr className="border-t-2 border-text-heading font-extrabold">
                  <td className="py-4 whitespace-nowrap text-[13px] text-text-heading font-extrabold">
                    Total
                  </td>
                  
                  <td className="py-4 px-4 text-left whitespace-nowrap text-[13px] text-text-heading font-extrabold">
                    {totalCommitsSum.toLocaleString()}
                  </td>

                  {/* Empty cell for spacing */}
                  <td className="py-4"></td>

                  <td className="py-4 text-right whitespace-nowrap text-[13px] text-text-heading font-extrabold">
                    100%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      )}
    </div>
  );
};

export default ContributorsList;
