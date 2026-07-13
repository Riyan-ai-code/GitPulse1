import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Code2 } from 'lucide-react';
import { Language } from '../types';

interface Props {
  languages: Language[];
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178C6',
  JavaScript: '#F7DF1E',
  Python: '#3776AB',
  Java: '#EA4335',
  Go: '#00ADD8',
  Rust: '#DEA584',
  HTML: '#E34F26',
  CSS: '#1572B6',
  Ruby: '#CC342D',
  'C#': '#178600',
  'C++': '#F34B7D',
  C: '#555555',
  PHP: '#4F5D95',
  Shell: '#89e051',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Other: '#94A3B8'
};

const getLanguageColor = (langName: string): string => {
  return LANGUAGE_COLORS[langName] || LANGUAGE_COLORS.Other;
};

export const LanguageChart: React.FC<Props> = ({ languages }) => {
  // If there are more than 5 languages, group the smaller ones into "Other"
  const processData = (): Language[] => {
    if (languages.length <= 5) return languages;

    const topLangs = languages.slice(0, 5);
    const otherBytes = languages.slice(5).reduce((sum, item) => sum + item.bytes, 0);
    const otherPercentage = parseFloat(languages.slice(5).reduce((sum, item) => sum + item.percentage, 0).toFixed(1));

    if (otherBytes > 0) {
      topLangs.push({
        language: 'Other',
        bytes: otherBytes,
        percentage: otherPercentage
      });
    }

    return topLangs;
  };

  const chartData = processData();

  return (
    <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-6 shadow-soft hover:shadow-hover-card transition-shadow duration-200 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-border-divider">
        <div>
          <h3 className="text-[16px] font-semibold text-text-heading">Language Analysis</h3>
          <p className="text-[12px] text-text-secondary">Codebase distribution by language</p>
        </div>
        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-brand-primary">
          <Code2 className="w-5 h-5" />
        </div>
      </div>

      {languages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
          <p className="text-[14px] text-text-secondary font-medium">No language data found</p>
          <p className="text-[12px] text-text-muted mt-1">This repository might not contain any recognized code files.</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Pie Chart */}
          <div className="h-[180px] w-[180px] flex-shrink-0 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border-card)',
                    borderRadius: '8px',
                    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
                  }}
                  labelStyle={{ color: 'var(--text-heading)' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                  formatter={(value: any) => [`${value}%`, 'Percentage']}
                />
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="percentage"
                  nameKey="language"
                >
                  {chartData.map((entry) => (
                    <Cell key={`cell-${entry.language}`} fill={getLanguageColor(entry.language)} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Custom Legend */}
          <div className="flex-1 space-y-2.5 w-full">
            {chartData.map((entry) => (
              <div key={entry.language} className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-3.5 h-3.5 rounded-full flex-shrink-0 border border-slate-100"
                    style={{ backgroundColor: getLanguageColor(entry.language) }}
                  />
                  <span className="text-[14px] font-medium text-text-primary truncate">
                    {entry.language}
                  </span>
                </div>
                <span className="text-[13px] font-bold text-text-secondary">
                  {entry.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default LanguageChart;
