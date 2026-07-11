import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Calendar,
  GitBranch,
  Users,
  MessageSquare,
  Trophy,
  AlertTriangle,
  FileCheck2
} from 'lucide-react';
import { RepositoryAnalysis, RecentCommit } from '../types';

interface Props {
  data: RepositoryAnalysis;
  commits?: RecentCommit[];
}

export const HealthScore: React.FC<Props> = ({ data, commits = [] }) => {
  const totalCommitsCount = commits.length;

  // Get Commit Quality Score from backend or fallback to local calculation
  let score = 78;
  let conventionalPercent = 72;
  let goodLengthPercent = 82;
  let imperativePercent = 80;
  let activityPercent = 75;
  let recencyPercent = 80;

  if (data.commitQuality) {
    score = data.commitQuality.score;
    conventionalPercent = data.commitQuality.conventionalPercent;
    goodLengthPercent = data.commitQuality.goodLengthPercent;
    imperativePercent = data.commitQuality.imperativePercent;
    activityPercent = data.commitQuality.activityPercent;
    recencyPercent = data.commitQuality.recencyPercent;
  } else {
    // Fallback to local calculation
    if (totalCommitsCount > 0) {
      const conventionalCount = commits.filter((c) =>
        /^(feat|fix|chore|docs|style|refactor|perf|test|build|ci)(\([a-z0-9_-]+\))?:/i.test(c.message.trim())
      ).length;
      conventionalPercent = Math.round((conventionalCount / totalCommitsCount) * 100);

      const goodLengthCount = commits.filter(
        (c) => c.message.length >= 8 && c.message.length <= 74
      ).length;
      goodLengthPercent = Math.round((goodLengthCount / totalCommitsCount) * 100);

      const imperativeCount = commits.filter((c) =>
        /^(feat|fix|chore|docs|style|refactor|perf|test|build|ci)?(\([a-z0-9_-]+\))?:?\s*(add|fix|handle|update|remove|delete|change|implement|make|refactor|set|get|create|run|setup|test|build|ci|docs|improve|cleanup)/i.test(c.message.trim())
      ).length;
      imperativePercent = Math.round((imperativeCount / totalCommitsCount) * 100);
    }

    const activityItem = data.healthBreakdown?.find(item => item.metric === 'Recent Activity (30 Days)');
    const recencyItem = data.healthBreakdown?.find(item => item.metric === 'Commit Recency');
    
    activityPercent = activityItem ? Math.round((activityItem.score / activityItem.maxScore) * 100) : 0;
    recencyPercent = recencyItem ? Math.round((recencyItem.score / recencyItem.maxScore) * 100) : 0;
    score = Math.round((conventionalPercent + goodLengthPercent + imperativePercent + activityPercent + recencyPercent) / 5);
  }

  // Determine colors based on thresholds
  let ringColor = 'stroke-brand-emerald';
  let badgeColorClass = 'text-brand-emerald';
  let badgeText = 'Good';

  if (score >= 80) {
    ringColor = 'stroke-brand-emerald';
    badgeColorClass = 'text-brand-emerald';
    badgeText = 'Excellent';
  } else if (score >= 50) {
    ringColor = 'stroke-brand-amber';
    badgeColorClass = 'text-brand-amber';
    badgeText = 'Good';
  } else {
    ringColor = 'stroke-brand-red';
    badgeColorClass = 'text-brand-red';
    badgeText = 'Improve';
  }

  // Circular gauge config
  const radius = 26;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Audit commits logic
  const getLintedCommits = () => {
    return commits.map(c => {
      const subject = c.message.split('\n')[0].trim();
      const warnings: string[] = [];

      // Check 1: Conventional commit prefix
      const isConventional = /^(feat|fix|chore|docs|style|refactor|perf|test|build|ci)(\([a-z0-9_-]+\))?:/i.test(subject);
      if (!isConventional) {
        warnings.push('Non-Conventional');
      }

      // Check 2: Length boundary
      if (subject.length > 72) {
        warnings.push('Too Long (>72 chars)');
      } else if (subject.length < 8) {
        warnings.push('Too Short (<8 chars)');
      }

      // Check 3: Lazy/Generic commits
      const isGeneric = /^(wip|temp|test|update|fix|commit|changes|cleanup|add|refactor|done|ok|\.)$/i.test(subject);
      if (isGeneric) {
        warnings.push('Generic Message');
      }

      return {
        ...c,
        subject,
        warnings
      };
    }).filter(c => c.warnings.length > 0);
  };

  const lintedCommits = getLintedCommits();
  const totalWarningsCount = lintedCommits.reduce((acc, curr) => acc + curr.warnings.length, 0);

  // Verdict content based on global health score
  const getVerdictInfo = () => {
    const globalScore = data.healthScore;
    if (globalScore >= 80) {
      return {
        text: 'This repository looks professional and resume worthy! ✅',
        cardBg: 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/20',
        textClass: 'text-brand-emerald'
      };
    } else if (globalScore >= 60) {
      return {
        text: 'This repository is healthy but could benefit from minor hygiene updates. 👍',
        cardBg: 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/20',
        textClass: 'text-brand-amber'
      };
    } else {
      return {
        text: 'This repository has documentation or commit consistency issues. ⚠️',
        cardBg: 'bg-red-50/50 dark:bg-red-950/10 border-red-100 dark:border-red-900/20',
        textClass: 'text-brand-red'
      };
    }
  };

  const verdict = getVerdictInfo();

  return (
    <div className="space-y-6">
      
      {/* Panel 1: Commit Quality & Insights Summary */}
      <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-6 shadow-soft hover:shadow-hover-card transition-shadow duration-200">
        
        {/* 3-Column Grid Block */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Column 1: Commit Quality Progress & Checklist (5/12 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <h4 className="text-[12px] font-bold text-text-secondary uppercase tracking-wider">Commit Quality</h4>
            
            <div className="flex flex-col sm:flex-row items-center gap-6">
              
              {/* Score ring */}
              <div className="relative w-20 h-20 flex items-center justify-center flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    className="stroke-slate-100 dark:stroke-slate-800 fill-none"
                    strokeWidth={strokeWidth}
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    className={`fill-none transition-all duration-1000 ease-out ${ringColor}`}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute text-center flex flex-col items-center">
                  <div className="flex items-baseline leading-none">
                    <span className="text-[20px] font-extrabold text-text-heading">{score}</span>
                    <span className="text-[10px] text-text-secondary">/100</span>
                  </div>
                  <span className={`text-[10px] font-bold mt-0.5 uppercase tracking-wide ${badgeColorClass}`}>
                    {badgeText}
                  </span>
                </div>
              </div>

              {/* Checklist */}
              <div className="space-y-1.5 flex-1 w-full text-left">
                {/* Message length */}
                <div className="flex items-center gap-2 text-[12px]">
                  {goodLengthPercent >= 60 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-emerald flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-brand-amber flex-shrink-0" />
                  )}
                  <span className="text-text-primary font-medium">
                    {goodLengthPercent >= 60 ? 'Most commits have good message length' : 'Some commits are too short or long'}
                  </span>
                </div>

                {/* Conventional formatting percentage */}
                <div className="flex items-center gap-2 text-[12px]">
                  {conventionalPercent >= 50 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-emerald flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-brand-amber flex-shrink-0" />
                  )}
                  <span className="text-text-primary font-medium">
                    {conventionalPercent}% of commits follow conventional format
                  </span>
                </div>

                {/* Imperative mood */}
                <div className="flex items-center gap-2 text-[12px]">
                  {imperativePercent >= 60 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-emerald flex-shrink-0" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-brand-amber flex-shrink-0" />
                  )}
                  <span className="text-text-primary font-medium">
                    {imperativePercent >= 60 ? 'Good use of imperative mood' : 'Imperative mood can be improved'}
                  </span>
                </div>

                {/* Description completeness */}
                <div className="flex items-center gap-2 text-[12px]">
                  {score >= 80 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-emerald flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-brand-amber flex-shrink-0" />
                  )}
                  <span className="text-text-primary font-medium">
                    {score >= 80 ? 'Descriptive messages across the board' : 'Some commits can be more descriptive'}
                  </span>
                </div>
              </div>

            </div>
          </div>

          {/* Column 2: Insights Grid (4/12 cols) */}
          <div className="lg:col-span-4 space-y-4 border-t lg:border-t-0 lg:border-l border-border-divider pt-4 lg:pt-0 lg:pl-6">
            <h4 className="text-[12px] font-bold text-text-secondary uppercase tracking-wider">Insights</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
              {/* Activity */}
              <div className="flex items-center gap-2 text-[12px]">
                <div className="p-1 rounded bg-emerald-500/10 text-brand-emerald flex-shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="font-semibold text-text-primary leading-tight">Consistent commit activity</span>
              </div>

              {/* Development */}
              <div className="flex items-center gap-2 text-[12px]">
                <div className="p-1 rounded bg-emerald-500/10 text-brand-emerald flex-shrink-0">
                  <GitBranch className="w-4 h-4" />
                </div>
                <span className="font-semibold text-text-primary leading-tight">Healthy development</span>
              </div>

              {/* Contributors */}
              <div className="flex items-center gap-2 text-[12px]">
                <div className="p-1 rounded bg-emerald-500/10 text-brand-emerald flex-shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <span className="font-semibold text-text-primary leading-tight">Active contributors</span>
              </div>

              {/* Message quality */}
              <div className="flex items-center gap-2 text-[12px]">
                <div className="p-1 rounded bg-emerald-500/10 text-brand-emerald flex-shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span className="font-semibold text-text-primary leading-tight">Good commit messages</span>
              </div>
            </div>
          </div>

          {/* Column 3: Verdict Callout Container (3/12 cols) */}
          <div className="lg:col-span-3 border-t lg:border-t-0 lg:border-l border-border-divider pt-4 lg:pt-0 lg:pl-6 h-full flex flex-col justify-center">
            <div className={`p-4 rounded-[12px] border ${verdict.cardBg} flex flex-col gap-2`}>
              <div className="flex items-center gap-1.5">
                <Trophy className={`w-4 h-4 ${verdict.textClass}`} />
                <span className={`text-[12px] font-extrabold uppercase tracking-wider ${verdict.textClass}`}>Verdict</span>
              </div>
              <p className="text-[12px] font-bold text-text-heading leading-snug">
                {verdict.text}
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Panel 2: Commit Message Quality Audit Reports Table */}
      <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-6 shadow-soft hover:shadow-hover-card transition-shadow duration-200">
        
        {/* Audit Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border-divider pb-4 mb-4 gap-2">
          <div>
            <h3 className="text-[14px] font-bold text-text-heading">Commit Message Quality Audit</h3>
            <p className="text-[12px] text-text-secondary mt-0.5">Automated quality check of format compliance and description depth</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-slate-100 dark:bg-bg-secondary text-text-secondary rounded-full">
              Audited: {totalCommitsCount}
            </span>
            {totalWarningsCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-amber-50 dark:bg-amber-950/20 text-brand-amber rounded-full">
                Warnings: {totalWarningsCount}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/20 text-brand-emerald rounded-full">
                100% Passed
              </span>
            )}
          </div>
        </div>

        {/* Audit Summary KPIs */}
        {totalCommitsCount > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <div className="bg-slate-50/50 dark:bg-bg-secondary/40 border border-border-card rounded-lg p-3 text-center">
              <span className="text-[11px] font-semibold text-text-secondary uppercase">Compliance Rate</span>
              <p className="text-[20px] font-extrabold text-text-heading mt-1">{conventionalPercent}%</p>
            </div>
            <div className="bg-slate-50/50 dark:bg-bg-secondary/40 border border-border-card rounded-lg p-3 text-center">
              <span className="text-[11px] font-semibold text-text-secondary uppercase">Generic Messages</span>
              <p className="text-[20px] font-extrabold text-text-heading mt-1">
                {commits.filter(c => /^(wip|temp|test|update|fix|commit|changes|cleanup|add|refactor|done|ok|\.)$/i.test(c.message.split('\n')[0].trim())).length}
              </p>
            </div>
            <div className="bg-slate-50/50 dark:bg-bg-secondary/40 border border-border-card rounded-lg p-3 text-center">
              <span className="text-[11px] font-semibold text-text-secondary uppercase">Length Warnings</span>
              <p className="text-[20px] font-extrabold text-text-heading mt-1">
                {commits.filter(c => c.message.split('\n')[0].trim().length > 72 || c.message.split('\n')[0].trim().length < 8).length}
              </p>
            </div>
          </div>
        )}

        {/* Audit Table List */}
        {lintedCommits.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center text-center bg-emerald-50/20 dark:bg-emerald-950/5 rounded-lg border border-dashed border-emerald-200 dark:border-emerald-900/30">
            <FileCheck2 className="w-10 h-10 text-brand-emerald mb-2.5 animate-pulse" />
            <h4 className="text-[14px] font-bold text-brand-emerald">All Commits Passed Guidelines</h4>
            <p className="text-[12px] text-text-secondary mt-1 max-w-xs leading-relaxed">
              No format syntax issues, short subject lengths, or vague descriptions detected in recent logs!
            </p>
          </div>
        ) : (
          <div className="overflow-y-auto max-h-64 border border-border-divider rounded-lg">
            <table className="min-w-full text-left divide-y divide-border-divider">
              <thead className="bg-bg-hover/20 text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                <tr>
                  <th className="py-2 px-4">Author</th>
                  <th className="py-2 px-4">Subject</th>
                  <th className="py-2 px-4">Check Warnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-divider bg-white dark:bg-bg-card">
                {lintedCommits.map((c, index) => (
                  <tr key={`${c.sha}-${index}`} className="hover:bg-bg-hover/30 text-[12.5px] transition-colors">
                    
                    {/* Author */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {c.author?.avatar_url ? (
                          <img src={c.author.avatar_url} alt="" className="w-4.5 h-4.5 rounded-full object-cover border border-border-divider" />
                        ) : (
                          <div className="w-4.5 h-4.5 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-500">
                            {c.author?.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                        <span className="font-semibold text-text-primary max-w-[110px] truncate" title={c.author?.login || c.author?.name || 'Unknown'}>
                          {c.author?.login || c.author?.name || 'Unknown'}
                        </span>
                      </div>
                    </td>

                    {/* Commit Subject message */}
                    <td className="py-2.5 px-4 font-medium text-text-heading max-w-xs md:max-w-md truncate" title={c.message}>
                      {c.subject}
                    </td>

                    {/* Check Warnings Badges */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {c.warnings.map(w => (
                          <span
                            key={w}
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                              w === 'Generic Message'
                                ? 'bg-red-50 dark:bg-red-950/20 text-brand-red border border-red-100 dark:border-red-900/30'
                                : 'bg-amber-50 dark:bg-amber-950/20 text-brand-amber border border-amber-100 dark:border-amber-900/30'
                            }`}
                          >
                            {w}
                          </span>
                        ))}
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};

export default HealthScore;
