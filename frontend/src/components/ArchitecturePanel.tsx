import React, { useState, useMemo } from 'react';
import { 
  Network, 
  ArrowRight, 
  FileText, 
  Zap,
  BookOpen
} from 'lucide-react';
import { ReactFlow, Controls, Background, Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface NodeSpec {
  id: string;
  label: string;
  category: 'frontend' | 'backend' | 'storage' | 'external';
  description: string;
  files: string[];
  connections: string[];
  role: string;
}

interface Flow {
  id: string;
  name: string;
  description: string;
  activeNodes: string[];
}

export const ArchitecturePanel: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<string | null>('analysis-module');
  const [activeFlow, setActiveFlow] = useState<string | null>(null);

  const nodes: NodeSpec[] = [
    {
      id: 'frontend-ui',
      label: 'Frontend Dashboard',
      category: 'frontend',
      role: 'User interface & State orchestrator',
      description: 'The Next.js single page dashboard layout. Manages active tabs, themes, and handles repository searches, repository comparisons, and authentication status checks.',
      files: ['frontend/src/app/page.tsx', 'frontend/src/components/Dashboard.tsx', 'frontend/src/lib/api.ts'],
      connections: ['backend-router']
    },
    {
      id: 'backend-router',
      label: 'Express Entry & CLS',
      category: 'backend',
      role: 'Request routing & OAuth context binding',
      description: 'The HTTP server entry point. Configures CORS, global error handling, and runs request-scoped Continuation Local Storage (AsyncLocalStorage) to securely bind the active user\'s GitHub access token.',
      files: ['backend/src/app.js', 'backend/src/server.js', 'backend/src/shared/context/authContext.js'],
      connections: ['auth-module', 'analysis-module', 'repo-module', 'commits-module', 'supabase-cache']
    },
    {
      id: 'auth-module',
      label: 'OAuth Auth Module',
      category: 'backend',
      role: 'GitHub OAuth Lifecycle Coordinator',
      description: 'Coordinates GitHub OAuth redirects, exchanges temporary authorization codes for developer tokens, sets the HTTP-Only cookie, and clears user sessions upon logout.',
      files: ['backend/src/modules/auth/auth.routes.js', 'backend/src/modules/auth/auth.controller.js', 'backend/src/modules/auth/auth.service.js'],
      connections: ['github-api']
    },
    {
      id: 'analysis-module',
      label: 'Analysis Engine',
      category: 'backend',
      role: 'Scoring calculator & AI orchestrator',
      description: 'Calculates the Repository Health Score (0-100) and Commit Quality. Compiles the metrics payload and feeds it to the Google Gemini AI engine to generate contribution readiness insights.',
      files: [
        'backend/src/modules/analysis/analysis.routes.js',
        'backend/src/modules/analysis/analysis.controller.js',
        'backend/src/modules/analysis/analysis.service.js',
        'backend/src/modules/analysis/rules/healthScore.js'
      ],
      connections: ['repo-module', 'commits-module', 'contributors-module', 'gemini-ai', 'supabase-history']
    },
    {
      id: 'repo-module',
      label: 'Repository Module',
      category: 'backend',
      role: 'Repository info & codebase composition',
      description: 'Queries basic metadata (stars, forks, license) and retrieves the recursive git tree to construct and prune the hierarchical codebase composition map.',
      files: [
        'backend/src/modules/repository/repository.routes.js',
        'backend/src/modules/repository/repository.controller.js',
        'backend/src/modules/repository/repository.service.js'
      ],
      connections: ['github-api']
    },
    {
      id: 'commits-module',
      label: 'Commits Module',
      category: 'backend',
      role: 'Commit stats & velocity metrics',
      description: 'Fetches raw commit histories, processes commit activity frequencies, and structures chronological timeline metrics (hour-of-day/day-of-week).',
      files: [
        'backend/src/modules/commits/commits.routes.js',
        'backend/src/modules/commits/commits.controller.js',
        'backend/src/modules/commits/commits.service.js'
      ],
      connections: ['github-api']
    },
    {
      id: 'contributors-module',
      label: 'Contributors Module',
      category: 'backend',
      role: 'Contributor profile builder',
      description: 'Extracts the list of active contributors, calculates individual commit contribution percentages, and constructs engagement ratios.',
      files: [
        'backend/src/modules/contributors/contributors.routes.js',
        'backend/src/modules/contributors/contributors.controller.js',
        'backend/src/modules/contributors/contributors.service.js'
      ],
      connections: ['github-api']
    },
    {
      id: 'supabase-cache',
      label: 'Supabase Cache Table',
      category: 'storage',
      role: 'High-speed API payload cache',
      description: 'Caches heavy external GitHub API responses (GSOC data index, repository trees) to prevent rate limits. Automatically checks expiration times on read.',
      files: ['backend/src/shared/db/fileDb.js (cache table)'],
      connections: []
    },
    {
      id: 'supabase-history',
      label: 'Supabase History Table',
      category: 'storage',
      role: 'Audit history logging Ledger',
      description: 'Stores analysis logs (repository path, health score, language, version, analyzed timestamp). Feeds the global Recent Audits leaderboards.',
      files: ['backend/src/shared/db/fileDb.js (history table)'],
      connections: []
    },
    {
      id: 'gemini-ai',
      label: 'Google Gemini AI',
      category: 'external',
      role: 'Repository evaluation provider (gemini-flash)',
      description: 'Analyses computed repository statistics to draft professional, context-aware suggestions and contribution strategies for developers.',
      files: ['backend/src/modules/analysis/ai.service.js'],
      connections: []
    },
    {
      id: 'github-api',
      label: 'GitHub REST & GraphQL API',
      category: 'external',
      role: 'Primary repository database provider',
      description: 'The source of truth for public and private codebases. Queried securely using user OAuth tokens injected by Axios request interceptors.',
      files: ['backend/src/shared/client/github.js'],
      connections: []
    }
  ];

  const flows: Flow[] = [
    {
      id: 'flow-auth',
      name: 'GitHub OAuth Login Lifecycle',
      description: 'Interactive sequence from client redirection to token swap and cookie validation.',
      activeNodes: ['frontend-ui', 'backend-router', 'auth-module', 'github-api']
    },
    {
      id: 'flow-analysis',
      name: 'Repository Analysis Flow',
      description: 'Shows how a search triggers caching checks, scoring, and AI processing.',
      activeNodes: ['frontend-ui', 'backend-router', 'supabase-cache', 'analysis-module', 'repo-module', 'commits-module', 'contributors-module', 'github-api', 'gemini-ai', 'supabase-history']
    }
  ];

  const activeNode = nodes.find(n => n.id === selectedNode);

  const isNodeActiveInFlow = (nodeId: string) => {
    if (!activeFlow) return true;
    const flow = flows.find(f => f.id === activeFlow);
    return flow ? flow.activeNodes.includes(nodeId) : true;
  };

  // React Flow Nodes
  const flowNodes = useMemo(() => {
    return nodes.map(node => {
      let x = 220;
      let y = 120;
      if (node.id === 'frontend-ui') { x = 240; y = 15; }
      else if (node.id === 'backend-router') { x = 240; y = 110; }
      else if (node.id === 'auth-module') { x = 20; y = 205; }
      else if (node.id === 'analysis-module') { x = 240; y = 205; }
      else if (node.id === 'repo-module') { x = 460; y = 205; }
      else if (node.id === 'commits-module') { x = 120; y = 300; }
      else if (node.id === 'contributors-module') { x = 360; y = 300; }
      else if (node.id === 'supabase-cache') { x = 20; y = 395; }
      else if (node.id === 'supabase-history') { x = 180; y = 395; }
      else if (node.id === 'gemini-ai') { x = 340; y = 395; }
      else if (node.id === 'github-api') { x = 500; y = 395; }

      const isNodeActive = isNodeActiveInFlow(node.id);
      
      const colBg = 
        node.category === 'frontend' ? '#f0f9ff' :
        node.category === 'backend' ? '#e0e7ff' :
        node.category === 'storage' ? '#ecfdf5' : '#fffbeb';
      const colText = 
        node.category === 'frontend' ? '#0369a1' :
        node.category === 'backend' ? '#4338ca' :
        node.category === 'storage' ? '#047857' : '#b45309';

      return {
        id: node.id,
        position: { x, y },
        data: { label: node.label },
        style: {
          background: colBg,
          color: colText,
          border: `1px solid ${colText}`,
          borderRadius: '10px',
          fontWeight: 'bold',
          fontSize: '11px',
          padding: '8px 12px',
          width: '160px',
          textAlign: 'center' as const,
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          opacity: isNodeActive ? 1 : 0.25,
          transition: 'opacity 0.2s',
        }
      };
    });
  }, [activeFlow]);

  // React Flow Edges
  const flowEdges = useMemo(() => {
    const edgesList: Edge[] = [];
    nodes.forEach(node => {
      node.connections.forEach(connId => {
        const isEdgeActive = !activeFlow || (
          isNodeActiveInFlow(node.id) && isNodeActiveInFlow(connId)
        );
        
        edgesList.push({
          id: `e-${node.id}-${connId}`,
          source: node.id,
          target: connId,
          animated: isEdgeActive,
          style: { 
            stroke: node.category === 'frontend' ? '#38bdf8' : '#818cf8', 
            strokeWidth: 2.2,
            opacity: isEdgeActive ? 1 : 0.15,
            transition: 'opacity 0.2s',
          }
        });
      });
    });
    return edgesList;
  }, [activeFlow]);

  return (
    <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-6 shadow-soft space-y-6 min-h-[600px] animate-fadeIn">
      
      {/* Tab Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-divider pb-4">
        <div className="space-y-1 text-left">
          <h3 className="text-[16px] font-bold text-text-heading flex items-center gap-2">
            <Network className="w-5 h-5 text-brand-primary" />
            GitPulse Architecture & Dependencies
          </h3>
          <p className="text-[12px] text-text-secondary">
            Visual map of GitPulse's modular monolith layout, context boundaries, and internal dependencies using React Flow.
          </p>
        </div>

        {/* Flow Switchers */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveFlow(null)}
            className={`px-3 py-1 text-[11.5px] font-bold rounded-lg transition-colors cursor-pointer border ${
              !activeFlow 
                ? 'bg-brand-primary text-white border-brand-primary' 
                : 'bg-slate-50 dark:bg-bg-secondary hover:bg-bg-hover text-text-secondary border-border-card'
            }`}
          >
            All Connections
          </button>
          {flows.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFlow(f.id)}
              className={`px-3 py-1 text-[11.5px] font-bold rounded-lg transition-colors cursor-pointer border ${
                activeFlow === f.id
                  ? 'bg-brand-primary text-white border-brand-primary'
                  : 'bg-slate-50 dark:bg-bg-secondary hover:bg-bg-hover text-text-secondary border-border-card'
              }`}
            >
              {f.id === 'flow-auth' ? '🔑 OAuth Flow' : '⚙️ Analysis Flow'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        {/* Visual Map Area using React Flow */}
        <div className="lg:col-span-2 bg-slate-50/50 dark:bg-bg-secondary/20 border border-border-card rounded-xl overflow-hidden min-h-[420px] h-[450px] relative no-print">
          <ReactFlow
            nodes={flowNodes}
            edges={flowEdges}
            onNodeClick={(_, node) => setSelectedNode(node.id)}
            fitView
          >
            <Background color="#cbd5e1" gap={16} size={1} />
            <Controls />
          </ReactFlow>
        </div>

        {/* Sidebar Info Area */}
        <div className="bg-white dark:bg-bg-card border border-border-card rounded-xl p-5 space-y-4 text-left shadow-soft">
          {activeNode ? (
            <div className="space-y-4 h-full flex flex-col justify-between">
              
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded ${
                    activeNode.category === 'frontend' ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400' :
                    activeNode.category === 'backend' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400' :
                    activeNode.category === 'storage' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' :
                    'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                  }`}>
                    {activeNode.category} module
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-[15px] font-black text-text-heading leading-tight">{activeNode.label}</h4>
                  <p className="text-[11.5px] font-bold text-brand-primary leading-tight">{activeNode.role}</p>
                </div>

                <p className="text-[12.5px] text-text-secondary leading-relaxed font-medium">
                  {activeNode.description}
                </p>

                <div className="border-t border-border-divider/50 pt-3.5 space-y-2">
                  <span className="text-[11px] font-bold text-text-heading flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-text-muted" />
                    Key Files Involved
                  </span>
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {activeNode.files.map(file => (
                      <div 
                        key={file}
                        className="text-[11px] font-mono text-text-secondary bg-slate-50 dark:bg-bg-secondary border border-border-divider/30 px-2 py-1 rounded truncate"
                        title={file}
                      >
                        {file}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {activeNode.connections.length > 0 && (
                <div className="border-t border-border-divider/50 pt-3.5 mt-auto">
                  <span className="text-[11px] font-bold text-text-heading block mb-2">Depends On / Triggers:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeNode.connections.map(connId => {
                      const connNode = nodes.find(n => n.id === connId);
                      return (
                        <span 
                          key={connId} 
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-bg-secondary text-[11px] font-semibold text-text-primary border border-border-divider/30"
                        >
                          {connNode?.label || connId}
                          <ArrowRight className="w-2.5 h-2.5 text-text-muted" />
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-text-muted py-24">
              <BookOpen className="w-8 h-8 text-text-muted/65 mb-2" />
              <p className="text-[12px] font-bold">Select a component node to view its specifications and codebase references.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default ArchitecturePanel;
