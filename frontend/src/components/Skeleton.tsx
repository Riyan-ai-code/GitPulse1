import React from 'react';

interface Props {
  className?: string;
}

export const Skeleton: React.FC<Props> = ({ className = 'h-32' }) => {
  return (
    <div className={`animate-pulse bg-slate-100 dark:bg-bg-secondary rounded-[12px] border border-border-card ${className}`} />
  );
};

export default Skeleton;
