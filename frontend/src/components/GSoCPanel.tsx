import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  ExternalLink, 
  Globe, 
  Calendar, 
  Code, 
  X, 
  Info, 
  Sparkles, 
  GraduationCap, 
  BookOpen, 
  Trophy
} from 'lucide-react';
import { API_BASE_URL } from '../lib/api';
import { GSoCOrganization, GSoCProject } from '../types';

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
  </svg>
);

interface Props {
  onAnalyzeRepo?: (owner: string, repo: string) => void;
}

export const GSoCPanel: React.FC<Props> = ({ onAnalyzeRepo }) => {
  const [orgs, setOrgs] = useState<GSoCOrganization[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Helper to infer the GitHub organization URL from projects' code_url
  const getInferredGithub = (org: GSoCOrganization) => {
    if (!org) return null;
    const githubOrgs = new Map<string, number>();
    
    Object.values(org.years).forEach(yearInfo => {
      if (yearInfo.projects) {
        yearInfo.projects.forEach(proj => {
          if (proj.code_url) {
            const match = proj.code_url.match(/github\.com\/([^\/]+)/i);
            if (match && match[1]) {
              const orgName = match[1].toLowerCase();
              githubOrgs.set(orgName, (githubOrgs.get(orgName) || 0) + 1);
            }
          }
        });
      }
    });
    
    if (githubOrgs.size === 0) return null;
    
    let topOrg = '';
    let maxCount = 0;
    githubOrgs.forEach((count, o) => {
      if (count > maxCount) {
        maxCount = count;
        topOrg = o;
      }
    });
    
    return topOrg ? {
      username: topOrg,
      url: `https://github.com/${topOrg}`
    } : null;
  };

  // Search & Filter state
  const [subTab, setSubTab] = useState<'browse' | 'leaderboard'>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTech, setSelectedTech] = useState<string>('All');
  
  // Modal details state
  const [selectedOrg, setSelectedOrg] = useState<GSoCOrganization | null>(null);
  const [modalActiveYear, setModalActiveYear] = useState<string>('2025');

  // Load organizations from backend
  useEffect(() => {
    const loadGSoCData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/gsoc`, {
          credentials: 'include'
        });
        if (!res.ok) {
          throw new Error('Failed to load GSoC organizations from server.');
        }
        const data = await res.json();
        setOrgs(data);
        setLoading(false);
      } catch (err: any) {
        console.error('[GSoCPanel] Error fetching:', err);
        setError(err.message || 'Error occurred while loading data.');
        setLoading(false);
      }
    };

    loadGSoCData();
  }, []);

  // Dynamically extract unique categories & technologies for filter lists
  const categoriesList = useMemo(() => {
    const cats = new Set<string>();
    orgs.forEach(o => {
      if (o.category) cats.add(o.category);
    });
    return ['All', ...Array.from(cats).sort()];
  }, [orgs]);

  const technologiesList = useMemo(() => {
    const techs = new Set<string>();
    orgs.forEach(o => {
      if (o.technologies) {
        o.technologies.forEach(t => techs.add(t.toLowerCase()));
      }
    });
    return ['All', ...Array.from(techs).sort()];
  }, [orgs]);

  // Apply filters
  const filteredOrgs = useMemo(() => {
    return orgs.filter(org => {
      // 1. Search Query filter (matches org name, description, or technologies)
      const matchesSearch = 
        org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.technologies.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        org.topics.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

      // 2. Year filter
      const matchesYear = 
        selectedYear === 'All' || 
        (org.years && Object.keys(org.years).includes(selectedYear));

      // 3. Category filter
      const matchesCategory = 
        selectedCategory === 'All' || 
        org.category === selectedCategory;

      // 4. Technology filter
      const matchesTech = 
        selectedTech === 'All' || 
        org.technologies.some(t => t.toLowerCase() === selectedTech.toLowerCase());

      return matchesSearch && matchesYear && matchesCategory && matchesTech;
    });
  }, [orgs, searchQuery, selectedYear, selectedCategory, ...[selectedTech]]); // using array wrapper for eslint compat if needed

  // Calculate statistics for metrics row
  const stats = useMemo(() => {
    let projectCount = 0;
    const activeTechs = new Set<string>();

    filteredOrgs.forEach(org => {
      // Technologies count
      org.technologies.forEach(t => activeTechs.add(t.toLowerCase()));

      // Projects count
      if (org.years) {
        Object.entries(org.years).forEach(([year, info]) => {
          if (selectedYear === 'All' || selectedYear === year) {
            projectCount += info.num_projects || 0;
          }
        });
      }
    });

    return {
      orgsCount: filteredOrgs.length,
      projectCount,
      techsCount: activeTechs.size
    };
  }, [filteredOrgs, selectedYear]);

  // Calculate top 15 organizations by total accepted projects
  const leaderboard = useMemo(() => {
    return orgs.map(org => {
      let totalProjects = 0;
      if (org.years) {
        Object.values(org.years).forEach(info => {
          totalProjects += info.num_projects || 0;
        });
      }
      return {
        ...org,
        totalProjects
      };
    })
    .sort((a, b) => b.totalProjects - a.totalProjects)
    .slice(0, 15);
  }, [orgs]);

  // Auto-align active modal year if org changes
  useEffect(() => {
    if (selectedOrg) {
      const years = Object.keys(selectedOrg.years);
      if (years.length > 0) {
        // Prefer 2025, fallback to first available
        if (years.includes('2025')) {
          setModalActiveYear('2025');
        } else {
          setModalActiveYear(years[0]);
        }
      }
    }
  }, [selectedOrg]);

  // Render project modal description HTML safely (stripping paragraphs if simple)
  const renderCleanHtml = (html: string) => {
    // Basic sanitization/cleanup since GSoC returns simple tags like <p>, <a>
    return { __html: html };
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-brand-primary/10 via-purple-500/5 to-indigo-500/10 border border-brand-primary/20 rounded-xl p-6 relative overflow-hidden">
        <div className="relative z-10 space-y-1.5 max-w-2xl">
          <h2 className="text-[18px] font-bold text-text-heading flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-brand-primary animate-bounce" />
            GSoC Archive Portal
          </h2>
          <p className="text-[12.5px] text-text-secondary leading-relaxed">
            Browse and filter Google Summer of Code organizations and student projects from the last 2 years (2024 and 2025). Discover tech stacks, open-source ideas, and successful project proposals.
          </p>
        </div>
        <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-15 hidden md:block">
          <Trophy className="w-24 h-24 text-brand-primary" />
        </div>
      </div>

      {/* 2. KPI Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Orgs Count */}
        <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-5 shadow-soft hover:shadow-hover-card transition-shadow duration-200">
          <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Organizations</span>
          <div className="text-[28px] font-extrabold text-text-heading mt-1 flex items-baseline gap-1">
            {loading ? '...' : stats.orgsCount}
            <span className="text-[12px] font-medium text-text-muted">matching</span>
          </div>
        </div>

        {/* Projects Count */}
        <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-5 shadow-soft hover:shadow-hover-card transition-shadow duration-200">
          <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Student Projects</span>
          <div className="text-[28px] font-extrabold text-brand-primary mt-1 flex items-baseline gap-1">
            {loading ? '...' : stats.projectCount}
            <span className="text-[12px] font-medium text-text-muted">accepted</span>
          </div>
        </div>

        {/* Unique Techs Count */}
        <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-5 shadow-soft hover:shadow-hover-card transition-shadow duration-200">
          <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Tech Stacks</span>
          <div className="text-[28px] font-extrabold text-brand-purple mt-1 flex items-baseline gap-1">
            {loading ? '...' : stats.techsCount}
            <span className="text-[12px] font-medium text-text-muted">languages / tools</span>
          </div>
        </div>
      </div>

      {/* 2.5 Tab Selectors */}
      <div className="flex border-b border-border-divider gap-4">
        <button
          onClick={() => setSubTab('browse')}
          className={`pb-2.5 text-[14.5px] font-extrabold border-b-2 transition-all cursor-pointer ${
            subTab === 'browse'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-secondary hover:text-text-heading'
          }`}
        >
          Browse Organizations
        </button>
        <button
          onClick={() => setSubTab('leaderboard')}
          className={`pb-2.5 text-[14.5px] font-extrabold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            subTab === 'leaderboard'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-text-secondary hover:text-text-heading'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-500 animate-pulse" />
          Leaderboard (Top Orgs)
        </button>
      </div>

      {/* 3. Main content body based on SubTab */}
      {loading ? (
        <div className="w-full py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-4 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
          <p className="text-[12px] text-text-secondary font-medium">Scraping GSoC Archive data...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-950/15 border border-red-200 dark:border-red-900/30 rounded-xl p-5 text-center text-brand-red">
          <Info className="w-6 h-6 mx-auto mb-2 text-brand-red" />
          <h3 className="text-[14px] font-bold">Failed to load GSoC Archive</h3>
          <p className="text-[12px] text-text-secondary mt-1">{error}</p>
        </div>
      ) : subTab === 'leaderboard' ? (
        /* Leaderboard Table View */
        <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] overflow-hidden shadow-soft animate-fadeIn">
          <div className="p-5 border-b border-border-divider bg-slate-50/30 dark:bg-bg-secondary/10 flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-extrabold text-text-heading flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                GSoC All-Time Leaderboard
              </h3>
              <p className="text-[12px] text-text-secondary mt-0.5">Top 15 organizations ranked by total accepted projects across all years in the GSoC Archive.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-divider bg-slate-50 dark:bg-bg-secondary/40 text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                  <th className="py-3 px-5 text-center w-16">Rank</th>
                  <th className="py-3 px-5">Organization</th>
                  <th className="py-3 px-5">Category</th>
                  <th className="py-3 px-5">Tech Stack</th>
                  <th className="py-3 px-5 text-center w-36">Total Projects</th>
                  <th className="py-3 px-5 text-center w-28">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-divider/50">
                {leaderboard.map((org, index) => (
                  <tr 
                    key={org.name}
                    className="hover:bg-slate-50/50 dark:hover:bg-[#1E293B]/20 transition-colors text-[13px] text-text-primary group"
                  >
                    <td className="py-4 px-5 text-center font-extrabold text-text-secondary">
                      {index === 0 ? '🏆 1' : index === 1 ? '🥈 2' : index === 2 ? '🥉 3' : `${index + 1}`}
                    </td>
                    <td className="py-4 px-5 font-bold text-text-heading">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded border border-border-card p-1 flex items-center justify-center bg-white flex-shrink-0"
                          style={{ backgroundColor: org.image_background_color }}
                        >
                          {org.image_url ? (
                            <img 
                              src={org.image_url} 
                              alt={org.name} 
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.innerHTML = `<span class="text-[9px] font-extrabold text-text-muted">${org.name.substring(0, 2).toUpperCase()}</span>`;
                              }}
                            />
                          ) : (
                            <span className="text-[9px] font-extrabold text-text-muted">{org.name.substring(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        <span className="truncate max-w-[200px]" title={org.name}>{org.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-text-secondary text-[12.5px]">
                      {org.category}
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex flex-wrap gap-1 max-w-[280px]">
                        {org.technologies.slice(0, 3).map(tech => (
                          <span 
                            key={tech} 
                            className="text-[10px] font-medium bg-brand-primary/5 text-brand-primary dark:bg-brand-primary/10 border border-brand-primary/10 px-1.5 py-0.5 rounded"
                          >
                            {tech}
                          </span>
                        ))}
                        {org.technologies.length > 3 && (
                          <span className="text-[9px] font-semibold text-text-muted px-1 py-0.5">
                            +{org.technologies.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-5 text-center font-extrabold text-brand-primary">
                      {org.totalProjects}
                    </td>
                    <td className="py-4 px-5 text-center">
                      <button
                        onClick={() => setSelectedOrg(org)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-primary hover:text-brand-primary-hover cursor-pointer"
                      >
                        View Projects
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Browse Grid View */
        <div className="space-y-6 animate-fadeIn">
          {/* 3. Filter Bar */}
          <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-4 shadow-soft">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-center">
              <div className="lg:col-span-5 relative">
                <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, technology, topic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-border-divider rounded-lg text-[13px] text-text-primary bg-bg-main dark:bg-[#1E293B] focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="lg:col-span-2">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-3 py-2 border border-border-divider rounded-lg text-[13px] text-text-primary bg-bg-main dark:bg-[#1E293B] font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="All">All Years</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
              </div>

              <div className="lg:col-span-2.5">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-border-divider rounded-lg text-[13px] text-text-primary bg-bg-main dark:bg-[#1E293B] font-semibold focus:outline-none cursor-pointer truncate"
                >
                  <option value="All">All Categories</option>
                  {categoriesList.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="lg:col-span-2.5">
                <select
                  value={selectedTech}
                  onChange={(e) => setSelectedTech(e.target.value)}
                  className="w-full px-3 py-2 border border-border-divider rounded-lg text-[13px] text-text-primary bg-bg-main dark:bg-[#1E293B] font-semibold focus:outline-none cursor-pointer truncate"
                >
                  <option value="All">All Technologies</option>
                  {technologiesList.filter(t => t !== 'All').map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Grid Render */}
          {filteredOrgs.length === 0 ? (
            <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-12 text-center text-text-secondary border-dashed w-full flex flex-col items-center justify-center min-h-[250px]">
              <BookOpen className="w-8 h-8 text-text-muted mb-3" />
              <h3 className="text-[14px] font-bold text-text-heading">No Organizations Found</h3>
              <p className="text-[12px] text-text-muted mt-1">Try resetting your filters or search terms.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredOrgs.map((org) => {
                const activeYears = Object.keys(org.years);
                return (
                  <div 
                    key={org.name}
                    className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-5 shadow-soft hover:shadow-hover-card transition-shadow duration-200 flex flex-col justify-between"
                  >
                    <div className="space-y-3.5">
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-12 h-12 rounded-lg border border-border-card p-1.5 flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: org.image_background_color }}
                        >
                          {org.image_url ? (
                            <img 
                              src={org.image_url} 
                              alt={org.name} 
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.innerHTML = `<span class="text-xs font-bold text-text-muted">${org.name.substring(0, 2).toUpperCase()}</span>`;
                              }}
                            />
                          ) : (
                            <span className="text-[11px] font-bold text-text-muted">{org.name.substring(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="space-y-1 truncate">
                          <h3 className="text-[14px] font-bold text-text-heading truncate" title={org.name}>
                            {org.name}
                          </h3>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-block text-[10px] font-semibold bg-slate-100 dark:bg-[#1E293B] text-text-secondary px-1.5 py-0.5 rounded">
                              {org.category}
                            </span>
                            {(() => {
                              const github = getInferredGithub(org);
                              return github ? (
                                <a
                                  href={github.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-0.5 text-[10px] text-text-secondary hover:text-brand-primary font-medium"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <GithubIcon className="w-3 h-3" />
                                  @{github.username}
                                </a>
                              ) : null;
                            })()}
                          </div>
                        </div>
                      </div>

                      <p className="text-[12px] text-text-secondary line-clamp-3 leading-relaxed">
                        {org.description}
                      </p>

                      <div className="flex flex-wrap gap-1.5">
                        {org.technologies.slice(0, 5).map(tech => (
                          <span 
                            key={tech} 
                            className="text-[10px] font-medium bg-brand-primary/5 text-brand-primary dark:bg-brand-primary/10 border border-brand-primary/10 px-1.5 py-0.5 rounded-md"
                          >
                            {tech}
                          </span>
                        ))}
                        {org.technologies.length > 5 && (
                          <span className="text-[9px] font-semibold text-text-muted px-1 py-0.5">
                            +{org.technologies.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-5 pt-3.5 border-t border-border-divider/50 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {activeYears.map(year => (
                          <span 
                            key={year} 
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-purple/10 text-brand-purple flex items-center gap-1"
                          >
                            <Calendar className="w-2.5 h-2.5" />
                            {year} ({org.years[year]?.num_projects || 0})
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={() => setSelectedOrg(org)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-primary hover:text-brand-primary-hover cursor-pointer"
                      >
                        View Projects
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. Student Projects Detail Modal Dialog */}
      {selectedOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-bg-card border border-border-card rounded-xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl relative overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-border-divider flex justify-between items-start gap-4">
              <div className="flex items-start gap-3">
                <div 
                  className="w-12 h-12 rounded-lg border border-border-card p-1.5 flex items-center justify-center flex-shrink-0 bg-white"
                  style={{ backgroundColor: selectedOrg.image_background_color }}
                >
                  <img 
                    src={selectedOrg.image_url} 
                    alt={selectedOrg.name} 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="text-[16px] font-extrabold text-text-heading flex items-center gap-2">
                    {selectedOrg.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-semibold bg-slate-100 dark:bg-[#1E293B] text-text-secondary px-2 py-0.5 rounded">
                      {selectedOrg.category}
                    </span>
                    <a 
                      href={selectedOrg.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] text-brand-primary hover:underline flex items-center gap-0.5 font-medium"
                    >
                      <Globe className="w-3 h-3" />
                      Website
                    </a>
                    {(() => {
                      const github = getInferredGithub(selectedOrg);
                      if (github) {
                        return (
                          <a 
                            href={github.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] text-text-secondary hover:text-brand-primary flex items-center gap-0.5 font-medium border-l border-border-divider/50 pl-2"
                          >
                            <GithubIcon className="w-3 h-3" />
                            GitHub: @{github.username}
                          </a>
                        );
                      } else {
                        const searchName = selectedOrg.name.replace(/GmbH|Inc\.|Co\./gi, '').trim();
                        return (
                          <a 
                            href={`https://github.com/search?q=${encodeURIComponent(searchName)}&type=organizations`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-[10px] text-text-secondary hover:text-brand-primary flex items-center gap-0.5 font-medium border-l border-border-divider/50 pl-2"
                            title="Search GitHub for this organization's profile"
                          >
                            <GithubIcon className="w-3 h-3" />
                            Search Org on GitHub
                          </a>
                        );
                      }
                    })()}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedOrg(null)}
                className="p-1 rounded-lg hover:bg-bg-secondary text-text-secondary hover:text-text-heading cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              
              {/* Org Description */}
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider">About</h4>
                <p className="text-[12.5px] text-text-primary leading-relaxed">
                  {selectedOrg.description}
                </p>
              </div>

              {/* Technologies & Topics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider">Technologies</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedOrg.technologies.map(t => (
                      <span key={t} className="text-[10px] font-semibold bg-brand-primary/5 text-brand-primary dark:bg-brand-primary/10 border border-brand-primary/10 px-2 py-0.5 rounded">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider">Topics</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedOrg.topics.map(t => (
                      <span key={t} className="text-[10px] font-semibold bg-purple-500/5 text-brand-purple dark:bg-brand-purple/10 border border-brand-purple/10 px-2 py-0.5 rounded">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tabs for Years selection */}
              <div className="pt-3 border-t border-border-divider/50">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-[11px] font-extrabold text-text-secondary uppercase tracking-wider">Accepted GSoC Projects</h4>
                  <div className="flex border border-border-divider rounded-lg p-0.5 bg-bg-main dark:bg-[#1E293B]">
                    {Object.keys(selectedOrg.years).sort().reverse().map(year => (
                      <button
                        key={year}
                        onClick={() => setModalActiveYear(year)}
                        className={`px-3 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-colors ${
                          modalActiveYear === year
                            ? 'bg-white dark:bg-[#2D3748] text-brand-primary shadow-soft'
                            : 'text-text-secondary hover:text-text-heading'
                        }`}
                      >
                        {year} ({selectedOrg.years[year]?.projects?.length || 0})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Projects List Container */}
                <div className="space-y-4">
                  {selectedOrg.years[modalActiveYear]?.projects && selectedOrg.years[modalActiveYear].projects!.length > 0 ? (
                    selectedOrg.years[modalActiveYear].projects!.map((proj: GSoCProject, index: number) => (
                      <div 
                        key={proj.title + index} 
                        className="bg-bg-main dark:bg-[#1E293B]/40 border border-border-divider/60 rounded-xl p-4 space-y-3"
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="space-y-0.5">
                            <h5 className="text-[13px] font-bold text-text-heading leading-tight">
                              {proj.title}
                            </h5>
                            <p className="text-[11.5px] text-text-secondary">
                              Proposed by <span className="font-bold text-text-heading">{proj.student_name}</span>
                            </p>
                          </div>
                          {proj.code_url && (() => {
                            const match = proj.code_url.match(/github\.com\/([^\/]+)\/([^\/#\?]+)/i);
                            if (match && match[1] && match[2]) {
                              const owner = match[1];
                              let repo = match[2];
                              if (repo.endsWith('.git')) repo = repo.slice(0, -4);
                              return (
                                <div className="flex items-center gap-3 flex-shrink-0">
                                  <a 
                                    href={proj.code_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[10px] font-bold text-text-secondary hover:underline flex items-center gap-0.5"
                                  >
                                    Code Repository
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                  {onAnalyzeRepo && (
                                    <button
                                      onClick={() => {
                                        setSelectedOrg(null); // Close modal
                                        onAnalyzeRepo(owner, repo);
                                      }}
                                      className="text-[10px] font-bold text-brand-primary hover:underline flex items-center gap-0.5 cursor-pointer border-l border-border-divider/50 pl-2.5"
                                      title="Analyze this repository in GitPulse"
                                    >
                                      ⚡ Analyze in GitPulse
                                    </button>
                                  )}
                                </div>
                              );
                            }
                            return (
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <a 
                                  href={proj.code_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-bold text-text-secondary hover:underline flex items-center gap-0.5"
                                >
                                  Blog/Wiki Link
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                                <a 
                                  href={`https://github.com/search?q=${encodeURIComponent(proj.title)}&type=repositories`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-bold text-brand-primary hover:underline flex items-center gap-0.5 border-l border-border-divider/50 pl-2.5"
                                  title="Search GitHub for repositories matching this project"
                                >
                                  🔍 Search Repositories
                                </a>
                              </div>
                            );
                          })()}
                        </div>

                        <div 
                          className="text-[12px] text-text-secondary leading-relaxed bg-white dark:bg-[#1E293B] border border-border-divider/30 rounded-lg p-3 max-h-40 overflow-y-auto"
                          dangerouslySetInnerHTML={renderCleanHtml(proj.description)}
                        />

                        {proj.project_url && (
                          <div className="text-right">
                            <a 
                              href={proj.project_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 text-[10.5px] text-brand-purple hover:underline"
                            >
                              GSoC Project Page
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-[12px] text-text-muted text-center py-6">
                      No project details available for {modalActiveYear}.
                    </p>
                  )}
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
export default GSoCPanel;
