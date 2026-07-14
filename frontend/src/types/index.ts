export interface Language {
  language: string;
  bytes: number;
  percentage: number;
}

export interface Owner {
  login: string;
  avatar_url: string;
  html_url: string;
}

export interface RepositoryOverview {
  name: string;
  owner: Owner;
  description: string;
  stars: number;
  forks: number;
  watchers: number;
  primaryLanguage: string;
  license: string;
  size: number;
  openIssuesCount: number;
  hasIssues: boolean;
  createdAt: string;
  updatedAt: string;
  languages: Language[];
  topics: string[];
  version: string | null;
}

export interface RecentCommitAuthor {
  name: string;
  login: string | null;
  avatar_url: string | null;
}

export interface RecentCommit {
  sha: string;
  author: RecentCommitAuthor;
  message: string;
  date: string;
  html_url: string;
}

export interface CommitActivityPoint {
  date: string;
  commits: number;
}

export interface CommitStats {
  totalCommits: number;
  lastCommitDate: string | null;
  commitsLast30Days: number;
  commits30to60DaysAgo: number;
  recentCommits: RecentCommit[];
  activityGraph: CommitActivityPoint[];
}

export interface Contributor {
  login: string;
  avatar_url: string;
  html_url: string;
  commits: number;
  percentage: number;
}

export interface ContributorsList {
  totalContributors: number;
  contributors: Contributor[];
}

export interface HealthBreakdownItem {
  metric: string;
  passed: boolean;
  score: number;
  maxScore: number;
  description: string;
}

export interface Insight {
  text: string;
  type: 'success' | 'warning' | 'info';
}

export interface CommitQualityDetails {
  score: number;
  conventionalPercent: number;
  goodLengthPercent: number;
  imperativePercent: number;
  activityPercent: number;
  recencyPercent: number;
}

export interface RepositoryAnalysis {
  healthScore: number;
  healthBreakdown: HealthBreakdownItem[];
  commitQuality?: CommitQualityDetails;
  insights: any[];
  aiActive?: boolean;
  dependencyGraph?: any;
}

export interface GSoCProject {
  title: string;
  short_description: string;
  description: string;
  student_name: string;
  code_url: string;
  project_url: string;
}

export interface GSoCYearInfo {
  projects_url: string;
  num_projects: number;
  projects?: GSoCProject[];
}

export interface GSoCOrganization {
  name: string;
  url: string;
  image_url: string;
  image_background_color: string;
  description: string;
  category: string;
  topics: string[];
  technologies: string[];
  years: {
    [year: string]: GSoCYearInfo;
  };
}
