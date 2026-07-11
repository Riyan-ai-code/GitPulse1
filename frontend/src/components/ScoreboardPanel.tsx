import React from 'react';
import { 
  Award, 
  ShieldCheck, 
  Activity, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { RepositoryOverview, CommitStats, RepositoryAnalysis } from '../types';

interface Props {
  data: RepositoryAnalysis;
  overview: RepositoryOverview;
  commits: CommitStats;
}

export const ScoreboardPanel: React.FC<Props> = ({ data, overview, commits }) => {
  // 1. Get Commit Quality Score from backend or fallback to local calculation
  let commitScore = 78;
  let conventionalPercent = 72;
  let goodLengthPercent = 82;
  let imperativePercent = 80;
  let activityPercent = 75;
  let recencyPercent = 80;

  if (data.commitQuality) {
    commitScore = data.commitQuality.score;
    conventionalPercent = data.commitQuality.conventionalPercent;
    goodLengthPercent = data.commitQuality.goodLengthPercent;
    imperativePercent = data.commitQuality.imperativePercent;
    activityPercent = data.commitQuality.activityPercent;
    recencyPercent = data.commitQuality.recencyPercent;
  } else {
    // Fallback to local calculation
    const totalCommitsCount = commits.recentCommits?.length || 0;
    if (totalCommitsCount > 0) {
      const conventionalCount = commits.recentCommits.filter((c) =>
        /^(feat|fix|chore|docs|style|refactor|perf|test|build|ci)(\([a-z0-9_-]+\))?:/i.test(c.message.trim())
      ).length;
      conventionalPercent = Math.round((conventionalCount / totalCommitsCount) * 100);

      const goodLengthCount = commits.recentCommits.filter(
        (c) => c.message.length >= 8 && c.message.length <= 74
      ).length;
      goodLengthPercent = Math.round((goodLengthCount / totalCommitsCount) * 100);

      const imperativeCount = commits.recentCommits.filter((c) =>
        /^(feat|fix|chore|docs|style|refactor|perf|test|build|ci)?(\([a-z0-9_-]+\))?:?\s*(add|fix|handle|update|remove|delete|change|implement|make|refactor|set|get|create|run|setup|test|build|ci|docs|improve|cleanup)/i.test(c.message.trim())
      ).length;
      imperativePercent = Math.round((imperativeCount / totalCommitsCount) * 100);
    }

    const activityItem = data.healthBreakdown?.find(item => item.metric === 'Recent Activity (30 Days)');
    const recencyItem = data.healthBreakdown?.find(item => item.metric === 'Commit Recency');
    
    activityPercent = activityItem ? Math.round((activityItem.score / activityItem.maxScore) * 100) : 0;
    recencyPercent = recencyItem ? Math.round((recencyItem.score / recencyItem.maxScore) * 100) : 0;
    commitScore = Math.round((conventionalPercent + goodLengthPercent + imperativePercent + activityPercent + recencyPercent) / 5);
  }

  const healthScore = data.healthScore;

  // Circular gauge setup
  const radius = 36;
  const strokeWidth = 7;
  const circumference = 2 * Math.PI * radius;

  const getGaugeProps = (score: number) => {
    let strokeColor = 'stroke-brand-emerald';
    let textColor = 'text-brand-emerald';
    let textBadge = 'Excellent';

    if (score >= 80) {
      strokeColor = 'stroke-brand-emerald';
      textColor = 'text-brand-emerald';
      textBadge = 'Excellent';
    } else if (score >= 50) {
      strokeColor = 'stroke-brand-amber';
      textColor = 'text-brand-amber';
      textBadge = 'Good';
    } else {
      strokeColor = 'stroke-brand-red';
      textColor = 'text-brand-red';
      textBadge = 'Improve';
    }

    const offset = circumference - (score / 100) * circumference;
    return { strokeColor, textColor, textBadge, offset };
  };

  const healthGauge = getGaugeProps(healthScore);
  const commitGauge = getGaugeProps(commitScore);

  return (
    <div className="space-y-6">
      
      {/* Side-by-side Score cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Repository Health Score */}
        <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-6 shadow-soft hover:shadow-hover-card transition-shadow duration-200 flex flex-col sm:flex-row items-center gap-6 text-left">
          <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="56" cy="56" r={radius} className="stroke-slate-100 dark:stroke-slate-800 fill-none" strokeWidth={strokeWidth} />
              <circle 
                cx="56" 
                cy="56" 
                r={radius} 
                className={`fill-none transition-all duration-1000 ease-out ${healthGauge.strokeColor}`} 
                strokeWidth={strokeWidth} 
                strokeDasharray={circumference} 
                strokeDashoffset={healthGauge.offset} 
                strokeLinecap="round" 
              />
            </svg>
            <div className="absolute text-center flex flex-col items-center">
              <span className="text-[24px] font-black text-text-heading leading-none">{healthScore}</span>
              <span className={`text-[9.5px] font-bold mt-1 uppercase tracking-wider ${healthGauge.textColor}`}>{healthGauge.textBadge}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-[15px] font-extrabold text-text-heading">Repository Health Score</h4>
            <p className="text-[12px] text-text-secondary leading-relaxed">
              Evaluates overall repository hygiene, documentation (README, open-source license), active issue pipeline, contributor count, and commit recency.
            </p>
            <div className="text-[10px] bg-slate-50 dark:bg-bg-secondary px-2.5 py-1 rounded-md border border-border-divider/55 font-mono text-text-primary inline-block">
              Max weight: 100 points
            </div>
          </div>
        </div>

        {/* Card 2: Commit Quality Score */}
        <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-6 shadow-soft hover:shadow-hover-card transition-shadow duration-200 flex flex-col sm:flex-row items-center gap-6 text-left">
          <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="56" cy="56" r={radius} className="stroke-slate-100 dark:stroke-slate-800 fill-none" strokeWidth={strokeWidth} />
              <circle 
                cx="56" 
                cy="56" 
                r={radius} 
                className={`fill-none transition-all duration-1000 ease-out ${commitGauge.strokeColor}`} 
                strokeWidth={strokeWidth} 
                strokeDasharray={circumference} 
                strokeDashoffset={commitGauge.offset} 
                strokeLinecap="round" 
              />
            </svg>
            <div className="absolute text-center flex flex-col items-center">
              <span className="text-[24px] font-black text-text-heading leading-none">{commitScore}</span>
              <span className={`text-[9.5px] font-bold mt-1 uppercase tracking-wider ${commitGauge.textColor}`}>{commitGauge.textBadge}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-[15px] font-extrabold text-text-heading">Commit Message Quality</h4>
            <p className="text-[12px] text-text-secondary leading-relaxed">
              Evaluates version control hygiene: conventional commit prefixes, message length boundaries (8-72 chars), active/imperative mood verbs, and daily push frequency.
            </p>
            <div className="text-[10px] bg-slate-50 dark:bg-bg-secondary px-2.5 py-1 rounded-md border border-border-divider/55 font-mono text-text-primary inline-block">
              Max weight: 100 points
            </div>
          </div>
        </div>

      </div>

      {/* Explanations Scoreboard Tab */}
      <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-6 shadow-soft text-left space-y-6">
        <div className="flex items-center gap-2 border-b border-border-divider pb-3">
          <Award className="w-5 h-5 text-brand-primary" />
          <h3 className="text-[14px] font-bold text-text-heading">Scoring Formula & Calculations Guide</h3>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Health Score formula details */}
          <div className="space-y-4">
            <h4 className="text-[13px] font-extrabold text-[#2563EB] uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-brand-primary" />
              Health Score Metrics (Total: 100pts)
            </h4>
            <div className="divide-y divide-border-divider text-[12.5px] text-text-secondary font-medium">
              <div className="flex justify-between py-2">
                <span>README File Documentation</span>
                <span className="font-bold text-text-primary">15 pts</span>
              </div>
              <div className="flex justify-between py-2">
                <span>Open Source License File</span>
                <span className="font-bold text-text-primary">5 pts</span>
              </div>
              <div className="flex justify-between py-2">
                <span>GitHub Issues Pipeline Enabled</span>
                <span className="font-bold text-text-primary">10 pts</span>
              </div>
              <div className="flex justify-between py-2">
                <span>Contributor Base Size (up to 10 devs)</span>
                <span className="font-bold text-text-primary">20 pts</span>
              </div>
              <div className="flex justify-between py-2">
                <span>Recent Activity Frequency (last 30 days)</span>
                <span className="font-bold text-text-primary">25 pts</span>
              </div>
              <div className="flex justify-between py-2">
                <span>Commit Recency (days since last push)</span>
                <span className="font-bold text-text-primary">25 pts</span>
              </div>
            </div>
          </div>

          {/* Commit Quality formula details */}
          <div className="space-y-4">
            <h4 className="text-[13px] font-extrabold text-[#8B5CF6] uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-brand-primary" />
              Commit Quality Metrics (Equal weights)
            </h4>
            <div className="divide-y divide-border-divider text-[12.5px] text-text-secondary font-medium">
              <div className="flex justify-between py-2">
                <span>Conventional Commits Format Compliance</span>
                <span className="font-bold text-text-primary">20% weight</span>
              </div>
              <div className="flex justify-between py-2">
                <span>Optimal Message Length Boundaries (8-72 chars)</span>
                <span className="font-bold text-text-primary">20% weight</span>
              </div>
              <div className="flex justify-between py-2">
                <span>Imperative Verb Commencing Mood</span>
                <span className="font-bold text-text-primary">20% weight</span>
              </div>
              <div className="flex justify-between py-2">
                <span>Recent Commit Density (last 30 days score)</span>
                <span className="font-bold text-text-primary">20% weight</span>
              </div>
              <div className="flex justify-between py-2">
                <span>Last Commit push recency score</span>
                <span className="font-bold text-text-primary">20% weight</span>
              </div>
              <div className="flex justify-between py-2.5 font-bold text-brand-primary bg-blue-50/20 dark:bg-blue-950/10 px-2 rounded mt-1.5">
                <span>Score Formula</span>
                <span>Average of above 5 values</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ScoreboardPanel;
