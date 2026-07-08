import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
      
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
  );
};

export default RepositoryOverview;
