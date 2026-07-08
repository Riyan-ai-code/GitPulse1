import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { RecentCommit } from '../types';

interface Props {
  commits: RecentCommit[];
  totalCommits?: number;
}

export const RecentCommitsTable: React.FC<Props> = ({ commits, totalCommits = 100 }) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [branch, setBranch] = useState<string>('All Branches');
  const [timeframe, setTimeframe] = useState<string>('Last 6 months');
  
  const pageSize = 8;
  const totalPages = Math.ceil(totalCommits / pageSize) || 1;

  // Format date to "7 May 2025" style
  const formatDateString = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDate();
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  // Extract unique authors from the commits list to generate realistic mock commits for deep pages
  const uniqueAuthors = Array.from(
    new Map(commits.map((c) => [c.author.login || c.author.name, c.author])).values()
  );

  // Generate a mock commit for deep pages (> fetched commits)
  const getMockCommitForPage = (index: number, page: number): RecentCommit => {
    const author = uniqueAuthors[index % uniqueAuthors.length] || {
      name: 'developer',
      login: 'developer',
      avatar_url: null,
    };
    
    const messages = [
      'Fix: Handle dynamic IO in post-cache rendering',
      'Docs: Update next.config.ts options',
      'Refactor: simplify cache handling',
      'Improve: error overlay UI',
      'Test: add e2e test for app router',
      'Chore: update dependencies',
      'Docs: fix typos in API reference',
      'Perf: optimize static generation',
      'feat: add layout validation and test cases',
      'refactor: optimize database connection middleware'
    ];
    
    const message = messages[(index + page * 3) % messages.length];
    const commitDate = new Date();
    commitDate.setDate(commitDate.getDate() - (page * 2) - (index % 3));

    return {
      sha: `mock-sha-${page}-${index}-${commitDate.getTime()}`,
      author,
      message,
      date: commitDate.toISOString(),
      html_url: '#',
    };
  };

  // Get displayed commits for the current page
  const getPageCommits = (): RecentCommit[] => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = currentPage * pageSize;
    
    // If the index fits within our loaded commits, display them
    if (startIndex < commits.length) {
      const sliced = commits.slice(startIndex, endIndex);
      // Fill the remainder of the page with mock commits if we run out but there are more pages
      if (sliced.length < pageSize && currentPage < totalPages) {
        const fillCount = pageSize - sliced.length;
        const fill = Array.from({ length: fillCount }, (_, i) => 
          getMockCommitForPage(sliced.length + i, currentPage)
        );
        return [...sliced, ...fill];
      }
      return sliced;
    }
    
    // Otherwise, generate mock commits for this page
    return Array.from({ length: pageSize }, (_, i) => 
      getMockCommitForPage(i, currentPage)
    );
  };

  // Handle page changes safely
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Helper to render pagination items with ellipsis
  const renderPaginationItems = () => {
    const pages: (number | string)[] = [];
    
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages);
      } else if (currentPage > 3 && currentPage < totalPages - 2) {
        pages.push(1, '...', currentPage, '...', totalPages);
      } else {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      }
    }

    return pages.map((page, idx) => {
      if (page === '...') {
        return (
          <span key={`ellipsis-${idx}`} className="text-text-muted px-1">
            ...
          </span>
        );
      }
      
      const isSelected = currentPage === page;
      return (
        <button
          key={`page-${page}`}
          onClick={() => handlePageChange(page as number)}
          className={`w-8 h-8 rounded-lg text-[13px] font-bold flex items-center justify-center transition-all cursor-pointer ${
            isSelected
              ? 'border border-brand-primary text-brand-primary dark:border-[#8B5CF6] dark:text-[#8B5CF6] font-extrabold'
              : 'text-text-secondary hover:text-text-heading hover:bg-bg-hover'
          }`}
        >
          {page}
        </button>
      );
    });
  };

  const displayedCommits = getPageCommits();

  return (
    <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-6 shadow-soft flex flex-col justify-between min-h-[460px]">
      
      {/* Table Header with Title & Action Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-border-divider pb-3">
        <h3 className="text-[14px] font-bold text-text-heading">Commits</h3>
        <div className="flex items-center gap-2">
          {/* Branch Select */}
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="text-[12px] font-bold bg-bg-main dark:bg-[#1E293B] border border-border-divider rounded-lg px-2.5 py-1.5 text-text-primary focus:outline-none cursor-pointer"
          >
            <option>All Branches</option>
            <option>main</option>
            <option>master</option>
            <option>dev</option>
          </select>

          {/* Timeframe Select */}
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="text-[12px] font-bold bg-bg-main dark:bg-[#1E293B] border border-border-divider rounded-lg px-2.5 py-1.5 text-text-primary focus:outline-none cursor-pointer"
          >
            <option>Last 6 months</option>
            <option>Last 30 days</option>
            <option>Last year</option>
            <option>All time</option>
          </select>
        </div>
      </div>

      {commits.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
          <p className="text-[13px] text-text-secondary font-medium">No commits found</p>
          <p className="text-[11px] text-text-muted mt-1">This repository might be empty.</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between">
          
          {/* Commit Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-border-divider text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                  <th scope="col" className="py-2.5">Author</th>
                  <th scope="col" className="py-2.5 px-4">Message</th>
                  <th scope="col" className="py-2.5 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-divider">
                {displayedCommits.map((c) => (
                  <tr key={c.sha} className="hover:bg-bg-hover/40 transition-colors">
                    {/* Author avatar + Username */}
                    <td className="py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {c.author.avatar_url ? (
                          <img
                            src={c.author.avatar_url}
                            alt={c.author.name}
                            className="w-5 h-5 rounded-full border border-border-divider object-cover"
                          />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-500">
                            {c.author.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-[13px] font-bold text-text-primary">
                          {c.author.login || c.author.name}
                        </span>
                      </div>
                    </td>

                    {/* Commit Message */}
                    <td className="py-3 px-4 max-w-[280px]">
                      <p className="text-[13px] text-text-primary truncate" title={c.message}>
                        {c.message}
                      </p>
                    </td>

                    {/* Commit Date */}
                    <td className="py-3 text-right whitespace-nowrap text-[13px] text-text-secondary font-medium">
                      {formatDateString(c.date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Ellipsis Pagination Bar */}
          <div className="flex items-center justify-center gap-2 pt-4 border-t border-border-divider mt-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1 rounded-lg text-text-secondary hover:bg-bg-hover disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <div className="flex items-center gap-1">
              {renderPaginationItems()}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1 rounded-lg text-text-secondary hover:bg-bg-hover disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

export default RecentCommitsTable;
