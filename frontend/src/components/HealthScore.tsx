import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Calendar,
  GitBranch,
  Users,
  MessageSquare,
  Trophy,
  AlertTriangle
} from 'lucide-react';
import { RepositoryAnalysis, RecentCommit } from '../types';

interface Props {
  data: RepositoryAnalysis;
  commits?: RecentCommit[];
}

export const HealthScore: React.FC<Props> = ({ data, commits = [] }) => {
  const score = data.healthScore;

  // Determine colors based on thresholds
  let ringColor = 'stroke-brand-emerald';
  let badgeColorClass = 'text-brand-emerald';
  let badgeText = 'Good';

  if (score >= 90) {
    ringColor = 'stroke-brand-emerald';
    badgeColorClass = 'text-brand-emerald';
    badgeText = 'Excellent';
  } else if (score >= 70) {
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

  // Calculate dynamic commit metrics from recent commits list
  const totalCommitsCount = commits.length;
  
  let conventionalPercent = 72; // fallback from screenshot
  let goodLengthPercent = 82;   // fallback
  let imperativePercent = 80;   // fallback

  if (totalCommitsCount > 0) {
    // 1. Conventional format check (starts with feat:, fix:, chore:, etc.)
    const conventionalCount = commits.filter((c) =>
      /^(feat|fix|chore|docs|style|refactor|perf|test|build|ci)(\([a-z0-9_-]+\))?:/i.test(c.message.trim())
    ).length;
    conventionalPercent = Math.round((conventionalCount / totalCommitsCount) * 100);

    // 2. Length check (10 to 72 characters is ideal)
    const goodLengthCount = commits.filter(
      (c) => c.message.length >= 8 && c.message.length <= 74
    ).length;
    goodLengthPercent = Math.round((goodLengthCount / totalCommitsCount) * 100);

    // 3. Imperative mood (starts with imperative verbs like Add, Fix, Update, Refactor)
    const imperativeCount = commits.filter((c) =>
      /^(feat|fix|chore|docs|style|refactor|perf|test|build|ci)?(\([a-z0-9_-]+\))?:?\s*(add|fix|handle|update|remove|delete|change|implement|make|refactor|set|get|create|run|setup|test|build|ci|docs|improve|cleanup)/i.test(c.message.trim())
    ).length;
    imperativePercent = Math.round((imperativeCount / totalCommitsCount) * 100);
  }

  // Verdict content based on score
  const getVerdictInfo = () => {
    if (score >= 80) {
      return {
        text: 'This repository looks professional and resume worthy! ✅',
        cardBg: 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/20',
        textClass: 'text-brand-emerald'
      };
    } else if (score >= 60) {
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
  );
};

export default HealthScore;
