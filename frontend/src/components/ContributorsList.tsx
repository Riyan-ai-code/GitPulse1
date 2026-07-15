import React from 'react';
import { Moon, Calendar, BookOpen, GitBranch, Trophy, Users, Award, Flame } from 'lucide-react';
import { ContributorsList as ContributorsListType, RecentCommit } from '../types';

interface Props {
  data: ContributorsListType;
  commits?: RecentCommit[];
}

export const ContributorsList: React.FC<Props> = ({ data, commits = [] }) => {
  const contributors = data.contributors || [];
  const totalContributors = data.totalContributors || contributors.length;

  // Calculate statistics
  const totalCommits = data.totalCommits !== undefined ? data.totalCommits : contributors.reduce((acc, curr) => acc + curr.commits, 0);
  const totalCommitsSum = contributors.reduce((acc, curr) => acc + curr.commits, 0);
  const avgCommits = contributors.length > 0 ? Math.round(totalCommitsSum / contributors.length) : 0;
  
  // Slice top contributors
  const topContributors = contributors.slice(0, 6);
  const top1 = contributors[0];

  // Colors for visualization / Donut Chart
  const segmentColors = [
    '#3B82F6', // Blue (Top 1)
    '#10B981', // Emerald (Top 2)
    '#8B5CF6', // Purple (Top 3)
    '#F59E0B', // Amber (Top 4)
    '#EC4899', // Pink (Top 5)
    '#06B6D4', // Cyan (Top 6)
  ];
  const othersColor = '#64748B'; // Slate (Others)

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

  // Donut chart math
  const radius = 50;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate segments for top contributors + others
  let accumulatedPercentage = 0;
  const segments = topContributors.map((c, i) => {
    const percentage = c.percentage;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const rotation = (accumulatedPercentage / 100) * 360 - 90; // offset by 90deg to start from top
    accumulatedPercentage += percentage;

    return {
      login: c.login,
      percentage,
      strokeDashoffset,
      rotation,
      color: segmentColors[i % segmentColors.length]
    };
  });

  // Remaining segment for "Others"
  const othersPercentage = 100 - accumulatedPercentage;
  const othersStrokeDashoffset = circumference - (Math.max(othersPercentage, 0) / 100) * circumference;
  const othersRotation = (accumulatedPercentage / 100) * 360 - 90;

  return (
    <div className="space-y-6">
      {/* 1. Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-4 shadow-soft">
          <div className="flex items-center gap-2 text-text-secondary mb-1">
            <Users className="w-4 h-4 text-brand-primary" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Contributors</span>
          </div>
          <p className="text-[22px] font-extrabold text-text-heading leading-none mt-1">
            {totalContributors}
          </p>
          <span className="text-[10px] text-text-secondary block mt-1">Active codebase authors</span>
        </div>

        <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-4 shadow-soft">
          <div className="flex items-center gap-2 text-text-secondary mb-1">
            <Award className="w-4 h-4 text-emerald-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Commits</span>
          </div>
          <p className="text-[22px] font-extrabold text-text-heading leading-none mt-1">
            {totalCommits.toLocaleString()}
          </p>
          <span className="text-[10px] text-text-secondary block mt-1">Total repository commits</span>
        </div>

        <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-4 shadow-soft">
          <div className="flex items-center gap-2 text-text-secondary mb-1">
            <Flame className="w-4 h-4 text-amber-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Commits / Auth</span>
          </div>
          <p className="text-[22px] font-extrabold text-text-heading leading-none mt-1">
            {avgCommits}
          </p>
          <span className="text-[10px] text-text-secondary block mt-1">Average contribution volume</span>
        </div>

        <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-4 shadow-soft">
          <div className="flex items-center gap-2 text-text-secondary mb-1">
            <Trophy className="w-4 h-4 text-purple-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Top Contributor</span>
          </div>
          <p className="text-[18px] font-extrabold text-text-heading truncate leading-none mt-1" title={top1?.login || 'N/A'}>
            {top1 ? top1.login : 'N/A'}
          </p>
          <span className="text-[10px] text-text-secondary block mt-1">
            {top1 ? `${top1.percentage}% of codebase` : 'No commits'}
          </span>
        </div>
      </div>

      {/* 2. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Contributors Table */}
        <div className="lg:col-span-2 bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-5 shadow-soft">
          <div className="mb-4 border-b border-border-divider pb-3 flex justify-between items-center">
            <h3 className="text-[14px] font-bold text-text-heading">Contribution Breakdown</h3>
            <span className="text-[11px] text-text-muted">Sorted by commits</span>
          </div>

          {contributors.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
              <p className="text-[13px] text-text-secondary font-medium">No contributor data found</p>
              <p className="text-[11px] text-text-muted mt-1">This repository might be empty.</p>
            </div>
          ) : (
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
                  {topContributors.map((c, idx) => {
                    const badges = getContributorBadges(c.login, idx);
                    const color = segmentColors[idx % segmentColors.length];
                    
                    return (
                      <tr key={c.login} className="hover:bg-bg-hover/40 transition-colors">
                        {/* Contributor Login + Avatar */}
                        <td className="py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {/* Color Legend indicator */}
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                            
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
                            <a 
                              href={c.html_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[13px] font-bold text-text-primary hover:text-brand-primary transition-colors cursor-pointer"
                            >
                              {c.login}
                            </a>

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
                                <span className="p-0.5 rounded bg-emerald-500/10 text-brand-emerald" title="Documentation Champion: Committed documentation edits">
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
                              className="h-1.5 rounded-full transition-all duration-500"
                              style={{ width: `${Math.max(c.percentage, 0.5)}%`, backgroundColor: color }}
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
                  {totalContributors > topContributors.length && (
                    <tr className="hover:bg-bg-hover/40 transition-colors">
                      {/* Others label */}
                      <td className="py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: othersColor }} />
                          <div className="flex flex-col pl-1">
                            <span className="text-[12px] font-bold text-text-secondary">others</span>
                            <span className="text-[10px] text-text-muted -mt-0.5">(various)</span>
                          </div>
                        </div>
                      </td>

                      {/* Commits sum */}
                      <td className="py-3 px-4 text-left whitespace-nowrap text-[13px] text-text-primary font-bold">
                        {Math.max(totalCommitsSum - topContributors.reduce((acc, curr) => acc + curr.commits, 0), 0).toLocaleString()}
                      </td>

                      {/* Visual Progress Bar */}
                      <td className="py-3 whitespace-nowrap">
                        <div className="w-24 sm:w-32 bg-slate-100 dark:bg-bg-secondary rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(othersPercentage, 0.5)}%`, backgroundColor: othersColor }}
                          />
                        </div>
                      </td>

                      {/* Percentage share */}
                      <td className="py-3 text-right whitespace-nowrap text-[13px] text-text-secondary font-bold">
                        {parseFloat(Math.max(othersPercentage, 0).toFixed(1))}%
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Side: Charts & Spotlight */}
        <div className="space-y-6">
          {/* Spotlight Card */}
          {top1 && (
            <div className="bg-gradient-to-br from-indigo-50/50 to-brand-primary-light/30 dark:from-indigo-950/20 dark:to-brand-primary/10 border border-brand-primary/20 rounded-[12px] p-5 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-primary/10 text-brand-primary uppercase tracking-wider flex items-center gap-1">
                  <Trophy className="w-3 h-3" />
                  Code MVP
                </span>
                <span className="text-[11px] font-bold text-text-secondary">#1 Contributor</span>
              </div>
              <div className="flex items-center gap-3.5">
                {top1.avatar_url ? (
                  <img
                    src={top1.avatar_url}
                    alt={top1.login}
                    className="w-14 h-14 rounded-full border-2 border-brand-primary shadow-soft object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-brand-primary text-white flex items-center justify-center text-xl font-bold shadow-soft">
                    {top1.login.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="space-y-0.5">
                  <a 
                    href={top1.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[16px] font-bold text-text-heading hover:text-brand-primary transition-colors cursor-pointer"
                  >
                    {top1.login}
                  </a>
                  <p className="text-[12px] text-text-secondary">
                    {top1.commits.toLocaleString()} commits contributed
                  </p>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-border-divider/50 flex justify-between text-center">
                <div>
                  <p className="text-[10px] font-bold text-text-secondary uppercase">Code Share</p>
                  <p className="text-[16px] font-extrabold text-brand-primary mt-0.5">{top1.percentage}%</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-text-secondary uppercase">Contribution</p>
                  <p className="text-[16px] font-extrabold text-emerald-500 mt-0.5">Primary</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-text-secondary uppercase">Badges</p>
                  <div className="flex items-center gap-1 mt-1 justify-center">
                    <span className="p-0.5 rounded bg-blue-500/10 text-brand-primary" title="Core Builder">
                      <GitBranch className="w-3 h-3" />
                    </span>
                    <span className="p-0.5 rounded bg-amber-500/10 text-brand-amber" title="Active">
                      <Flame className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Share Distribution Chart */}
          {contributors.length > 0 && (
            <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-5 shadow-soft flex flex-col items-center">
              <h4 className="text-[13px] font-bold text-text-heading self-start mb-4">Contribution Distribution</h4>
              
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                  {/* Base / Background Circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="transparent"
                    stroke="#E2E8F0"
                    className="dark:stroke-bg-secondary"
                    strokeWidth={strokeWidth}
                  />

                  {/* Render active segments */}
                  {segments.map((seg, idx) => (
                    <circle
                      key={seg.login}
                      cx="60"
                      cy="60"
                      r={radius}
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={circumference}
                      strokeDashoffset={seg.strokeDashoffset}
                      style={{
                        transformOrigin: '60px 60px',
                        transform: `rotate(${seg.rotation}deg)`,
                        transition: 'stroke-dashoffset 0.8s ease'
                      }}
                    />
                  ))}

                  {/* Others Segment */}
                  {othersPercentage > 0 && (
                    <circle
                      cx="60"
                      cy="60"
                      r={radius}
                      fill="transparent"
                      stroke={othersColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={circumference}
                      strokeDashoffset={othersStrokeDashoffset}
                      style={{
                        transformOrigin: '60px 60px',
                        transform: `rotate(${othersRotation}deg)`,
                        transition: 'stroke-dashoffset 0.8s ease'
                      }}
                    />
                  )}
                </svg>

                {/* Center text info */}
                <div className="absolute text-center">
                  <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Top Share</span>
                  <p className="text-[20px] font-black text-text-heading leading-none mt-0.5">
                    {top1 ? `${top1.percentage}%` : '0%'}
                  </p>
                </div>
              </div>

              {/* Simple legend */}
              <div className="w-full mt-4 space-y-1.5 text-[11.5px]">
                {topContributors.map((c, i) => (
                  <div key={c.login} className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5 truncate max-w-[70%]">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: segmentColors[i % segmentColors.length] }} />
                      <span className="font-bold text-text-primary truncate">{c.login}</span>
                    </div>
                    <span className="font-bold text-text-secondary">{c.percentage}%</span>
                  </div>
                ))}
                {othersPercentage > 0 && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: othersColor }} />
                      <span className="font-bold text-text-secondary">Others</span>
                    </div>
                    <span className="font-bold text-text-secondary">{parseFloat(othersPercentage.toFixed(1))}%</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ContributorsList;
