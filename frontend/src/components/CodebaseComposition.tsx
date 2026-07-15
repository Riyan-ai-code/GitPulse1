import React, { useState, useMemo, useEffect } from 'react';
import { 
  Folder, 
  File, 
  ChevronRight, 
  ArrowLeft, 
  HardDrive, 
  LayoutGrid, 
  List, 
  Info,
  Layers,
  Network
} from 'lucide-react';
import { ReactFlow, Controls, Background, Node, Edge, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface TreeNode {
  name: string;
  type: 'file' | 'directory';
  size: number;
  children?: TreeNode[];
}

interface Props {
  compositionData: TreeNode | null;
  dependencyGraph: {
    nodes: Array<{ id: string; label: string; type: 'directory' | 'file'; role?: string }>;
    links: Array<{ source: string; target: string }>;
  } | null;
  loading: boolean;
}

// Premium custom node component for React Flow with Left/Right handles
const CustomNode = ({ data }: any) => {
  const colBg = 
    data.col === 0 ? 'bg-sky-50 dark:bg-sky-950/20 border-sky-300 dark:border-sky-800' : 
    data.col === 1 ? 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-850' : 
    'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-850';
  const colText = 
    data.col === 0 ? 'text-sky-700 dark:text-sky-400' : 
    data.col === 1 ? 'text-indigo-700 dark:text-indigo-400' : 
    'text-emerald-700 dark:text-emerald-400';

  return (
    <div className={`px-3 py-2 border rounded-lg font-bold text-[11px] text-center w-[150px] shadow-sm relative ${colBg} ${colText}`}>
      <Handle 
        type="target" 
        position={Position.Left} 
        style={{ background: 'currentColor', width: 6, height: 6, borderRadius: '50%' }} 
      />
      <div className="truncate">{data.label}</div>
      <Handle 
        type="source" 
        position={Position.Right} 
        style={{ background: 'currentColor', width: 6, height: 6, borderRadius: '50%' }} 
      />
    </div>
  );
};

export const CodebaseComposition: React.FC<Props> = ({ compositionData, dependencyGraph, loading }) => {
  const [subTab, setSubTab] = useState<'composition' | 'architecture'>('composition');
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedArchNode, setSelectedArchNode] = useState<string | null>(null);

  // Register custom React Flow node types
  const nodeTypes = useMemo(() => ({
    custom: CustomNode
  }), []);

  // Format bytes to KB, MB, etc.
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Find the node corresponding to currentPath
  const currentNode = useMemo(() => {
    if (!compositionData) return null;
    let node = compositionData;
    for (const step of currentPath) {
      if (node.children) {
        const found = node.children.find(c => c.name === step);
        if (found) {
          node = found;
        } else {
          break;
        }
      }
    }
    return node;
  }, [compositionData, currentPath]);

  // Handle drilling down into a directory
  const handleNodeClick = (child: TreeNode) => {
    if (child.type === 'directory') {
      setCurrentPath(prev => [...prev, child.name]);
    }
  };

  // Handle navigating back in breadcrumbs
  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      setCurrentPath([]);
    } else {
      setCurrentPath(prev => prev.slice(0, index + 1));
    }
  };

  // Go up one level
  const handleGoUp = () => {
    setCurrentPath(prev => prev.slice(0, -1));
  };

  // Process nodes into columns for Architecture Graph
  const nodesWithColumns = useMemo(() => {
    if (!dependencyGraph) return [];
    const { nodes: graphNodes, links: graphLinks } = dependencyGraph;
    
    const incoming = new Map<string, number>();
    const outgoing = new Map<string, number>();
    graphNodes.forEach(n => {
      incoming.set(n.id, 0);
      outgoing.set(n.id, 0);
    });
    graphLinks.forEach(l => {
      outgoing.set(l.source, (outgoing.get(l.source) || 0) + 1);
      incoming.set(l.target, (incoming.get(l.target) || 0) + 1);
    });

    return graphNodes.map(node => {
      const outCount = outgoing.get(node.id) || 0;
      const inCount = incoming.get(node.id) || 0;
      
      let col = 1; // Middle
      if (inCount === 0 && outCount > 0) {
        col = 0; // Source / Left
      } else if (outCount === 0 && inCount > 0) {
        col = 2; // Sink / Right
      }
      return { ...node, col };
    });
  }, [dependencyGraph]);

  const maxNodesInCol = useMemo(() => {
    if (nodesWithColumns.length === 0) return 0;
    const colCounts = [0, 0, 0];
    nodesWithColumns.forEach(node => {
      colCounts[node.col]++;
    });
    return Math.max(...colCounts);
  }, [nodesWithColumns]);

  // Map to React Flow Nodes & Edges
  const flowData = useMemo(() => {
    if (!dependencyGraph || nodesWithColumns.length === 0) return { nodes: [], edges: [] };
    const { links: graphLinks } = dependencyGraph;

    // Count nodes in each column to space them vertically
    const colCounts = [0, 0, 0];
    const colIndices = new Map<string, number>();
    
    nodesWithColumns.forEach(node => {
      colIndices.set(node.id, colCounts[node.col]);
      colCounts[node.col]++;
    });

    const height = Math.max(450, maxNodesInCol * 70);

    const flowNodes: Node[] = nodesWithColumns.map(node => {
      const colIndex = colIndices.get(node.id) || 0;
      const totalInCol = colCounts[node.col];
      
      const ySpacing = totalInCol > 1 ? (height - 80) / (totalInCol - 1) : 0;
      const yStart = totalInCol > 1 ? 40 : height / 2 - 25;
      
      const x = node.col * 240 + 30;
      const y = ySpacing > 0 ? colIndex * ySpacing + yStart : yStart;

      return {
        id: node.id,
        type: 'custom',
        position: { x, y },
        data: { label: node.label, col: node.col }
      };
    });

    const flowEdges: Edge[] = graphLinks.map((link, idx) => ({
      id: `e-${idx}`,
      source: link.source,
      target: link.target,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#818cf8', strokeWidth: 2 },
    }));

    return { nodes: flowNodes, edges: flowEdges };
  }, [dependencyGraph, nodesWithColumns, maxNodesInCol]);

  // Set default selected node
  useEffect(() => {
    if (nodesWithColumns.length > 0 && !selectedArchNode) {
      setSelectedArchNode(nodesWithColumns[0].id);
    }
  }, [nodesWithColumns, selectedArchNode]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-6 shadow-soft animate-pulse flex flex-col justify-between h-[450px]">
        <div className="space-y-4">
          <div className="h-6 bg-slate-100 dark:bg-bg-secondary w-1/3 rounded" />
          <div className="h-4 bg-slate-100 dark:bg-bg-secondary w-2/3 rounded" />
        </div>
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
          <div className="bg-slate-100 dark:bg-bg-secondary/40 rounded-xl h-full" />
          <div className="bg-slate-100 dark:bg-bg-secondary/40 rounded-xl h-full" />
          <div className="bg-slate-100 dark:bg-bg-secondary/40 rounded-xl h-full" />
          <div className="bg-slate-100 dark:bg-bg-secondary/40 rounded-xl h-full" />
        </div>
        <div className="h-8 bg-slate-100 dark:bg-bg-secondary w-1/4 rounded self-end" />
      </div>
    );
  }

  if (!currentNode) {
    return (
      <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-8 text-center text-text-secondary">
        <Layers className="w-8 h-8 text-text-muted mx-auto mb-2" />
        <h3 className="text-[14px] font-bold text-text-heading">Codebase Map Unavailable</h3>
        <p className="text-[12px] text-text-muted mt-1">Unable to scan codebase structures for this repository.</p>
      </div>
    );
  }

  const children = currentNode.children || [];
  const parentSize = currentNode.size || 1;

  const getIntensityClass = (percentage: number) => {
    if (percentage >= 50) return 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary dark:bg-brand-primary/20';
    if (percentage >= 20) return 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200/50 dark:border-indigo-900/20 text-indigo-600 dark:text-indigo-400';
    if (percentage >= 5) return 'bg-slate-50 dark:bg-bg-secondary/40 border-slate-200 dark:border-border-card text-text-primary';
    return 'bg-slate-50/50 dark:bg-bg-secondary/20 border-slate-100 dark:border-border-card/30 text-text-secondary';
  };

  return (
    <div className="bg-white dark:bg-bg-card border border-border-card rounded-[12px] p-6 shadow-soft flex flex-col justify-between min-h-[480px]">
      
      {/* Header with Title & Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-divider pb-4 mb-4">
        <div className="space-y-1 text-left">
          <h3 className="text-[16px] font-bold text-text-heading flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-primary" />
            Codebase Explorer Map
          </h3>
          <p className="text-[12px] text-text-secondary">
            {subTab === 'composition' 
              ? 'Groups directories dynamically by size and traces tree compositions.' 
              : 'Traces file dependencies and logical module architectures using React Flow.'}
          </p>
        </div>

        {/* View Selection & Mode Toggles */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Sub-tab switcher */}
          <div className="flex bg-slate-100 dark:bg-bg-secondary p-0.5 rounded-lg border border-border-divider/50">
            <button
              onClick={() => setSubTab('composition')}
              className={`px-3 py-1.5 rounded-md text-[11.5px] font-bold cursor-pointer transition-colors ${
                subTab === 'composition' 
                  ? 'bg-white dark:bg-bg-card text-brand-primary shadow-soft' 
                  : 'text-text-secondary hover:text-text-heading'
              }`}
            >
              📂 File Treemap
            </button>
            <button
              onClick={() => setSubTab('architecture')}
              className={`px-3 py-1.5 rounded-md text-[11.5px] font-bold cursor-pointer transition-colors ${
                subTab === 'architecture' 
                  ? 'bg-white dark:bg-bg-card text-brand-primary shadow-soft' 
                  : 'text-text-secondary hover:text-text-heading'
              }`}
            >
              📐 Architecture Graph
            </button>
          </div>

          {/* Grid/List Toggle (Only for composition sub-tab) */}
          {subTab === 'composition' && (
            <div className="flex bg-slate-100 dark:bg-bg-secondary p-0.5 rounded-lg border border-border-divider/50">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-white dark:bg-bg-card text-brand-primary shadow-soft' 
                    : 'text-text-secondary hover:text-text-heading'
                }`}
                title="Grid Treemap View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md cursor-pointer transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white dark:bg-bg-card text-brand-primary shadow-soft' 
                    : 'text-text-secondary hover:text-text-heading'
                }`}
                title="List Details View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Composition Tab View */}
      {subTab === 'composition' && (
        <div className="flex-grow flex flex-col justify-between">
          {/* Path Breadcrumbs bar */}
          <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 bg-slate-50 dark:bg-bg-secondary/40 border border-border-card rounded-lg mb-4 text-[12.5px] font-bold text-text-secondary overflow-hidden">
            <HardDrive className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
            
            <span 
              onClick={() => handleBreadcrumbClick(-1)}
              className="hover:text-brand-primary transition-colors cursor-pointer"
            >
              {compositionData?.name}
            </span>

            {currentPath.map((step, idx) => (
              <React.Fragment key={idx}>
                <ChevronRight className="w-3 h-3 text-text-muted" />
                <span
                  onClick={() => handleBreadcrumbClick(idx)}
                  className={`hover:text-brand-primary transition-colors cursor-pointer ${
                    idx === currentPath.length - 1 ? 'text-brand-primary font-extrabold' : ''
                  }`}
                >
                  {step}
                </span>
              </React.Fragment>
            ))}

            {currentPath.length > 0 && (
              <button
                onClick={handleGoUp}
                className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-bg-secondary dark:hover:bg-bg-secondary/80 text-[11px] font-bold text-text-primary transition-all cursor-pointer border border-border-divider/30"
              >
                <ArrowLeft className="w-2.5 h-2.5" />
                Up One Level
              </button>
            )}
          </div>

          {/* Main Composition Explorer View */}
          {children.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
              <Folder className="w-10 h-10 text-text-muted mb-2" />
              <h4 className="text-[13px] font-bold text-text-heading">This directory is empty</h4>
              <p className="text-[11px] text-text-muted mt-0.5">No files or folders found inside.</p>
            </div>
          ) : viewMode === 'grid' ? (
            /* Treemap Grid View */
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 mb-4 content-start text-left">
              {children.map((child) => {
                const percentage = parentSize > 0 ? parseFloat(((child.size / parentSize) * 100).toFixed(1)) : 0;
                const intensityClass = getIntensityClass(percentage);
                
                return (
                  <div
                    key={child.name}
                    onClick={() => handleNodeClick(child)}
                    className={`border rounded-xl p-4 flex flex-col justify-between h-28 shadow-soft transition-all duration-200 group ${intensityClass} ${
                      child.type === 'directory' ? 'cursor-pointer hover:shadow-hover-card hover:scale-[1.01]' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <div className="flex items-center gap-2 overflow-hidden w-full">
                        {child.type === 'directory' ? (
                          <Folder className="w-4 h-4 text-indigo-500 fill-indigo-500/10 flex-shrink-0 group-hover:scale-110 transition-transform" />
                        ) : (
                          <File className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        )}
                        <span className="text-[13px] font-extrabold truncate w-full" title={child.name}>
                          {child.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-black px-1 py-0.5 rounded bg-black/5 dark:bg-white/10 flex-shrink-0 ml-1">
                        {percentage}%
                      </span>
                    </div>

                    <div className="space-y-1">
                      <p className="text-[11.5px] font-semibold text-text-secondary leading-none">
                        {formatSize(child.size)}
                      </p>
                      {child.type === 'directory' && child.children && (
                        <p className="text-[9.5px] text-text-muted leading-none">
                          {child.children.length} items inside
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Details List View */
            <div className="flex-1 overflow-x-auto mb-4 border border-border-card rounded-xl">
              <table className="min-w-full text-left">
                <thead>
                  <tr className="border-b border-border-divider bg-slate-50/50 dark:bg-bg-secondary/20 text-[11px] font-bold text-text-secondary uppercase tracking-wider">
                    <th className="py-2.5 px-4">Name</th>
                    <th className="py-2.5 px-4 text-center">Type</th>
                    <th className="py-2.5 px-4 text-left">Size</th>
                    <th className="py-2.5 px-4 w-32"></th>
                    <th className="py-2.5 px-4 text-right">% Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-divider text-[13px]">
                  {children.map((child) => {
                    const percentage = parentSize > 0 ? parseFloat(((child.size / parentSize) * 100).toFixed(1)) : 0;
                    
                    return (
                      <tr 
                        key={child.name}
                        onClick={() => handleNodeClick(child)}
                        className={`hover:bg-bg-hover/40 transition-colors ${
                          child.type === 'directory' ? 'cursor-pointer' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-bold text-text-primary whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {child.type === 'directory' ? (
                              <Folder className="w-4 h-4 text-indigo-500 fill-indigo-500/10 flex-shrink-0" />
                            ) : (
                              <File className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            )}
                            <span>{child.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            child.type === 'directory' 
                              ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' 
                              : 'bg-slate-100 dark:bg-bg-secondary text-text-secondary border border-border-card/30'
                          }`}>
                            {child.type}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-text-primary whitespace-nowrap">
                          {formatSize(child.size)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="w-full bg-slate-100 dark:bg-bg-secondary/40 rounded-full h-1.5 overflow-hidden border border-border-divider/10">
                            <div 
                              className="bg-brand-primary h-full rounded-full" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-text-primary whitespace-nowrap">
                          {percentage}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer Info stats card */}
          <div className="bg-slate-50 dark:bg-bg-secondary/40 border border-border-divider/50 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-[12.5px] text-text-secondary text-left">
            <div className="flex items-center gap-2 font-bold text-text-primary">
              <Info className="w-4 h-4 text-brand-primary" />
              <span>Active Directory Size: {formatSize(currentNode.size)}</span>
            </div>
            <p className="text-[11.5px] text-text-muted italic">
              {currentNode.children ? `Holds ${currentNode.children.length} subfolders & files in scope` : 'File leaf node'}
            </p>
          </div>
        </div>
      )}

      {/* Architecture Tab View (React Flow) */}
      {subTab === 'architecture' && (
        <div className="flex-grow flex flex-col justify-between">
          {!dependencyGraph || dependencyGraph.nodes.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center text-text-secondary w-full">
              <Network className="w-9 h-9 text-text-muted mb-3 animate-pulse" />
              <h4 className="text-[13.5px] font-bold text-text-heading">Architecture Graph Loading</h4>
              <p className="text-[11.5px] text-text-muted mt-1 max-w-xs mx-auto leading-relaxed">
                Analyzing codebase layout to generate module dependencies graph...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left items-stretch">
              {/* React Flow Container */}
              <div className="lg:col-span-2 bg-slate-50/50 dark:bg-bg-secondary/20 border border-border-card rounded-xl overflow-y-auto max-h-[500px] relative no-print">
                <div style={{ height: `${Math.max(450, maxNodesInCol * 70)}px` }} className="w-full relative">
                  <ReactFlow
                    nodes={flowData.nodes}
                    edges={flowData.edges}
                    nodeTypes={nodeTypes}
                    onNodeClick={(_, node) => setSelectedArchNode(node.id)}
                    zoomOnScroll={false}
                    panOnDrag={true}
                    fitView
                  >
                    <Background color="#cbd5e1" gap={16} size={1} />
                    <Controls />
                  </ReactFlow>
                </div>
              </div>

              {/* Right Sidebar specs */}
              <div className="bg-slate-50/30 dark:bg-bg-card border border-border-card rounded-xl p-5 flex flex-col justify-between shadow-soft">
                {selectedArchNode ? (
                  (() => {
                    const node = nodesWithColumns.find(n => n.id === selectedArchNode);
                    if (!node) return null;

                    const incomingLinks = dependencyGraph.links.filter(l => l.target === node.id);
                    const outgoingLinks = dependencyGraph.links.filter(l => l.source === node.id);

                    return (
                      <div className="space-y-4">
                        <div className="space-y-1.5 border-b border-border-divider pb-3">
                          <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded ${
                            node.col === 0 ? 'bg-sky-100 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400' :
                            node.col === 1 ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400' :
                            'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                          }`}>
                            {node.col === 0 ? 'Entrypoint' : node.col === 1 ? 'Core logic' : 'Dependency'}
                          </span>
                          <h4 className="text-[14px] font-black text-text-heading leading-tight truncate mt-2.5" title={node.label}>
                            {node.label}
                          </h4>
                          <p className="text-[10px] font-mono text-text-muted truncate mt-0.5" title={node.id}>
                            {node.id}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <span className="text-[11px] font-bold text-text-heading">Architectural Role:</span>
                          <p className="text-[12px] text-text-secondary leading-relaxed font-semibold">
                            {node.role || 'Heuristic directory node found in scanned codebase.'}
                          </p>
                        </div>

                        {/* Connection lists removed to prevent layout clutter */}
                      </div>
                    );
                  })()
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-text-muted py-20">
                    <Layers className="w-8 h-8 text-text-muted/60 mb-2 animate-pulse" />
                    <p className="text-[12px] font-bold">Select a node from the map to display architecture specs.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default CodebaseComposition;
