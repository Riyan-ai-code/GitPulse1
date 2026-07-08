import React from 'react';
import { AlertCircle, CheckCircle, Info, Sparkles } from 'lucide-react';
import { Insight } from '../types';

interface Props {
  insights: Insight[];
}

export const InsightsPanel: React.FC<Props> = ({ insights }) => {
  const getInsightStyles = (type: Insight['type']) => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle className="w-5 h-5 text-brand-emerald flex-shrink-0 mt-0.5" />,
          containerClass: 'bg-[#DCFCE7]/40 border-l-4 border-brand-emerald text-text-primary'
        };
      case 'warning':
        return {
          icon: <AlertCircle className="w-5 h-5 text-brand-amber flex-shrink-0 mt-0.5" />,
          containerClass: 'bg-[#FEF3C7]/40 border-l-4 border-brand-amber text-text-primary'
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />,
          containerClass: 'bg-[#DBEAFE]/40 border-l-4 border-brand-primary text-text-primary'
        };
    }
  };

  return (
    <div className="bg-white border border-border-card rounded-[12px] p-6 shadow-soft hover:shadow-hover-card transition-shadow duration-200">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-border-divider">
        <div>
          <h3 className="text-[16px] font-semibold text-text-heading">GitPulse Insights</h3>
          <p className="text-[12px] text-text-secondary">Automated observations about repository trends</p>
        </div>
        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
      </div>

      {insights.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-[14px] text-text-secondary">No automated insights computed for this repository.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {insights.map((insight, index) => {
            const styles = getInsightStyles(insight.type);
            return (
              <div
                key={index}
                className={`flex gap-3 p-4 rounded-r-[8px] rounded-l-[4px] border border-border-card/60 transition-transform duration-150 hover:translate-x-1 ${styles.containerClass}`}
              >
                {styles.icon}
                <span className="text-[14px] font-medium leading-relaxed">
                  {insight.text}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default InsightsPanel;
