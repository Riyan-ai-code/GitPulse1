import React from 'react';
import { CheckCircle2, XCircle, Award } from 'lucide-react';
import { RepositoryAnalysis } from '../types';

interface Props {
  data: RepositoryAnalysis;
}

export const HealthScore: React.FC<Props> = ({ data }) => {
  const score = data.healthScore;

  // Determine colors based on thresholds
  let scoreColorClass = '';
  let ringColor = '';
  let badgeText = '';

  if (score >= 90) {
    scoreColorClass = 'bg-[#DCFCE7] text-[#166534]'; // Excellent
    ringColor = 'stroke-brand-emerald';
    badgeText = 'Excellent';
  } else if (score >= 70) {
    scoreColorClass = 'bg-[#FEF3C7] text-[#92400E]'; // Good
    ringColor = 'stroke-brand-amber';
    badgeText = 'Good';
  } else {
    scoreColorClass = 'bg-[#FEE2E2] text-[#991B1B]'; // Needs Improvement
    ringColor = 'stroke-brand-red';
    badgeText = 'Needs Improvement';
  }

  // SVG dimensions for gauge
  const radius = 36;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white border border-border-card rounded-[12px] p-6 shadow-soft hover:shadow-hover-card transition-shadow duration-200 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-2 border-b border-border-divider">
        <div>
          <h3 className="text-[16px] font-semibold text-text-heading">Health & Insights</h3>
          <p className="text-[12px] text-text-secondary">Hygiene and activity scoring card</p>
        </div>
        <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
          <Award className="w-5 h-5" />
        </div>
      </div>

      {/* Main Score Visuals */}
      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 mb-6">
        {/* SVG Circular Progress Gauge */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="56"
              cy="56"
              r={radius}
              className="stroke-slate-100 fill-none"
              strokeWidth={strokeWidth}
            />
            {/* Score progress circle */}
            <circle
              cx="56"
              cy="56"
              r={radius}
              className={`fill-none transition-all duration-1000 ease-out ${ringColor}`}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          {/* Centered Score */}
          <div className="absolute text-center">
            <span className="text-[28px] font-extrabold text-text-heading">{score}</span>
            <span className="text-[12px] text-text-secondary block -mt-1">/ 100</span>
          </div>
        </div>

        {/* Rating description */}
        <div className="text-center sm:text-left space-y-2">
          <p className="text-[13px] font-medium text-text-secondary uppercase tracking-wider">Health Status</p>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[13px] font-bold ${scoreColorClass}`}>
            {badgeText}
          </span>
          <p className="text-[12px] text-text-secondary max-w-[200px]">
            Based on recent activity, documentation, license setup, and contributor diversity.
          </p>
        </div>
      </div>

      {/* Health Checklist Breakdown */}
      <div className="flex-1 space-y-3.5">
        <h4 className="text-[13px] font-semibold text-text-secondary uppercase tracking-wider">Checklist</h4>
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
          {data.healthBreakdown.map((item) => (
            <div key={item.metric} className="flex items-start gap-2.5">
              {item.passed ? (
                <CheckCircle2 className="w-4 h-4 text-brand-emerald mt-0.5 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-brand-red mt-0.5 flex-shrink-0" />
              )}
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold text-text-primary leading-none">
                    {item.metric}
                  </span>
                  <span className="text-[11px] font-bold text-text-secondary">
                    +{item.score}/{item.maxScore}
                  </span>
                </div>
                <p className="text-[11px] text-text-secondary mt-0.5 leading-tight">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default HealthScore;
