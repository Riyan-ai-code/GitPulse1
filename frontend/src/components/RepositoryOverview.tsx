import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { 
  Compass, 
  Award, 
  ShieldCheck, 
  Activity 
} from 'lucide-react';
import { RepositoryOverview as RepositoryOverviewType } from '../types';

interface Props {
  data: RepositoryOverviewType;
}

export const RepositoryOverview: React.FC<Props> = ({ data }) => {
  
  // Format sizes from KB to human-readable MB or KB
  const formatSize = (kb: number) => {
    if (kb < 1024) return `${kb} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  // Format date to "25 Oct 2016" style
  const formatDateString = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Abbreviated number formatting (e.g., 112000 -> 112k)
  const formatAbbreviated = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}m`.replace('.0', '');
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`.replace('.0', '');
    return num.toString();
  };

  // Language color lookup
  const getLanguageColor = (lang: string) => {
    switch (lang.toLowerCase()) {
      case 'typescript': return '#3178C6';
      case 'javascript': return '#F7DF1E';
      case 'css': return '#563D7C';
      case 'html': return '#E34C26';
      case 'python': return '#3572A5';
      case 'java': return '#B07219';
      case 'rust': return '#DEA584';
      case 'go': return '#00ADD8';
      case 'c++': return '#F34B7D';
      case 'c': return '#555555';
      case 'ruby': return '#701516';
      case 'php': return '#4F5D95';
      case 'shell': return '#89E051';
      default: return '#64748B'; // Default slate gray
    }
  };

  // Process top 3 languages and group others
  const topLanguages = [...data.languages].sort((a, b) => b.percentage - a.percentage);
  const displayedLanguages = topLanguages.slice(0, 3);
  const otherPercentage = topLanguages.slice(3).reduce((acc, curr) => acc + curr.percentage, 0);

  if (otherPercentage > 0) {
    displayedLanguages.push({
      language: 'Other',
      bytes: 0,
      percentage: parseFloat(otherPercentage.toFixed(1))
    });
  }

  // Fallback fallback if no languages returned
  const chartData = displayedLanguages.length > 0 ? displayedLanguages : [{ language: 'None', bytes: 0, percentage: 100 }];

  // Dynamic Open Source & GSoC Contribution readiness calculation
  const getContributionGrade = () => {
    let score = 0;
    
    // README / Documentation
    if (data.license && data.license !== 'No License') score += 20;
    
    // Community Size (Stars & Watchers)
    if (data.stars > 1000) score += 20;
    else if (data.stars > 100) score += 15;
    else if (data.stars > 10) score += 10;
    
    // Forks (Engagement & Pull Request potential)
    if (data.forks > 500) score += 25;
    else if (data.forks > 100) score += 20;
    else if (data.forks > 10) score += 15;
    else if (data.forks > 2) score += 10;

    // Issue activity (having open issues is good for new contributors to pick up!)
    if (data.openIssuesCount > 50) score += 20;
    else if (data.openIssuesCount > 10) score += 15;
    else if (data.openIssuesCount > 0) score += 10;

    // Last updated recency
    const lastUpdate = new Date(data.updatedAt);
    const diffDays = Math.floor((new Date().getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 7) score += 15;
    else if (diffDays <= 30) score += 10;
    else if (diffDays <= 90) score += 5;

    let grade = 'B';
    let statusText = 'Healthy / Open for Contributions';
    let gradeColor = 'text-brand-amber bg-amber-50 dark:bg-amber-950/20 border-amber-200/50';
    let descriptionText = 'This repository is open to contributions and has active issues, making it a good choice for picking up code experience.';

    if (score >= 85) {
      grade = 'A+';
      statusText = 'Excellent GSoC & Contributor Fit';
      gradeColor = 'text-brand-emerald bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/50';
      descriptionText = 'Highly active, collaborative community with excellent developer traction. Ideal for GSoC applicants and open-source contributions!';
    } else if (score >= 70) {
      grade = 'A';
      statusText = 'Great Onboarding & Active Maintenance';
      gradeColor = 'text-brand-primary bg-blue-50 dark:bg-blue-950/20 border-blue-200/50';
      descriptionText = 'Very solid maintenance with active feedback channels. Maintainers review code and forks are highly engaged.';
    } else if (score >= 40) {
      grade = 'B';
      statusText = 'Healthy / Open for Contributions';
      gradeColor = 'text-brand-amber bg-amber-50 dark:bg-amber-950/20 border-amber-200/50';
      descriptionText = 'Healthy project activity. Moderate review cycles. Great for developers starting out with open source contributions.';
    } else {
      grade = 'C';
      statusText = 'Maintenance Required / Stale';
      gradeColor = 'text-brand-red bg-red-50 dark:bg-red-950/20 border-red-200/50';
      descriptionText = 'Low activity or stale maintenance. Contribution feedback cycles may be slow.';
    }

    return { score, grade, statusText, gradeColor, descriptionText };
  };

  const contr = getContributionGrade();

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Left Column: Repository Details Card */}
      <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-6 shadow-soft flex flex-col justify-between">
        <div>
          <h3 className="text-[14px] font-bold text-text-heading mb-5">
            Repository Details
          </h3>
          <div className="divide-y divide-border-divider">
            <div className="flex items-center justify-between py-3">
              <span className="text-[13px] text-text-secondary font-medium">Created At</span>
              <span className="text-[13px] text-text-heading font-semibold">{formatDateString(data.createdAt)}</span>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-[13px] text-text-secondary font-medium">Last Updated</span>
              <span className="text-[13px] text-text-heading font-semibold">{formatDateString(data.updatedAt)}</span>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-[13px] text-text-secondary font-medium">Primary Language</span>
              <span className="text-[13px] text-text-heading font-semibold">{data.primaryLanguage}</span>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-[13px] text-text-secondary font-medium">Size</span>
              <span className="text-[13px] text-text-heading font-semibold">{formatSize(data.size)}</span>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-[13px] text-text-secondary font-medium">Stars</span>
              <span className="text-[13px] text-text-heading font-semibold">{formatAbbreviated(data.stars)}</span>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-[13px] text-text-secondary font-medium">Forks</span>
              <span className="text-[13px] text-text-heading font-semibold">{formatAbbreviated(data.forks)}</span>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-[13px] text-text-secondary font-medium">Open Issues</span>
              <span className="text-[13px] text-text-heading font-semibold">{formatAbbreviated(data.openIssuesCount)}</span>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-[13px] text-text-secondary font-medium">Watchers</span>
              <span className="text-[13px] text-text-heading font-semibold">{formatAbbreviated(data.watchers)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Languages & Topics stack */}
      <div className="space-y-6 flex flex-col">
        
        {/* Languages doughnut card */}
        <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-6 shadow-soft flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-[14px] font-bold text-text-heading mb-4">
              Languages
            </h3>
            <div className="flex items-center justify-between gap-6 py-4">
              
              {/* Recharts Doughnut Chart */}
              <div className="w-32 h-32 flex-shrink-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={38}
                      outerRadius={52}
                      paddingAngle={2}
                      dataKey="percentage"
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={getLanguageColor(entry.language)}
                          stroke="transparent"
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Languages Legend */}
              <div className="flex-1 space-y-2.5">
                {chartData.map((lang) => (
                  <div key={lang.language} className="flex items-center justify-between text-[13px]">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getLanguageColor(lang.language) }}
                      />
                      <span className="font-semibold text-text-primary">{lang.language}</span>
                    </div>
                    <span className="text-text-secondary font-medium">{lang.percentage}%</span>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>

        {/* Topics Card */}
        <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-6 shadow-soft">
          <h3 className="text-[14px] font-bold text-text-heading mb-4">
            Topics
          </h3>
          {data.topics && data.topics.length > 0 ? (
            <div className="flex flex-wrap gap-2.5">
              {data.topics.map((topic) => (
                <span
                  key={topic}
                  className="px-3 py-1 rounded-[8px] border border-border-divider bg-[#EFF6FF]/60 dark:bg-[#1E293B] text-[12px] font-bold text-[#2563EB] dark:text-slate-300"
                >
                  {topic}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-text-muted">No topics associated with this repository.</p>
          )}
        </div>

      </div>

      </div>

      {/* Full-width Row: Open Source & GSoC Contribution Readiness */}
      <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-6 shadow-soft hover:shadow-hover-card transition-shadow duration-200 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border-divider pb-3 gap-2">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-brand-primary" />
            <h3 className="text-[14px] font-bold text-text-heading">Open Source & GSoC Contribution Assessment</h3>
          </div>
          <span className={`px-2.5 py-0.5 border rounded-md text-[11px] font-bold uppercase tracking-wider ${contr.gradeColor}`}>
            Grade: {contr.grade} — {contr.statusText}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          <div className="md:col-span-2 space-y-3.5">
            <p className="text-[13px] text-text-primary leading-relaxed font-semibold">
              {contr.descriptionText}
            </p>
            <p className="text-[12.5px] text-text-secondary leading-relaxed">
              For GSoC (Google Summer of Code) and general open-source contributors, a project's onboarding friendliness is key. This rating evaluates file structures (README, License), community size (Stars, Watchers), repository forks (indicating PR collaboration velocity), and active issue counts.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-bg-secondary/40 border border-border-card/65 rounded-xl p-4.5 space-y-3.5 text-[12.5px]">
            <h4 className="text-[12px] font-bold text-text-heading uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-brand-amber" />
              Contributor Gains
            </h4>
            <div className="space-y-2.5 text-text-secondary font-medium">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-emerald flex-shrink-0 mt-0.5" />
                <span><strong>Active Maintainer Base:</strong> Review times are fast due to high repository forks engagement.</span>
              </div>
              <div className="flex items-start gap-2">
                <Activity className="w-4 h-4 text-brand-primary flex-shrink-0 mt-0.5" />
                <span><strong>Easy Setup & Onboarding:</strong> Clear license guidelines and setup documentations detected.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default RepositoryOverview;
