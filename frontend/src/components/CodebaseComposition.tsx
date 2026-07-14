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
  Network,
  ArrowRight
} from 'lucide-react';

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

export const CodebaseComposition: React.FC<Props> = ({ compositionData, dependencyGraph, loading }) => {
  const [subTab, setSubTab] = useState<'composition' | 'architecture'>('composition');
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedArchNode, setSelectedArchNode] = useState<string | null>(null);

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
    const { nodes, links } = dependencyGraph;
    
    const incoming = new Map<string, number>();
    const outgoing = new Map<string, number>();
    nodes.forEach(n => {
      incoming.set(n.id, 0);
      outgoing.set(n.id, 0);
    });
    links.forEach(l => {
      outgoing.set(l.source, (outgoing.get(l.source) || 0) + 1);
      incoming.set(l.target, (incoming.get(l.target) || 0) + 1);
    });

    return nodes.map(node => {
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

  // Set default selected architecture node
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
              : 'Traces file dependencies and logical module architectures.'}
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

      {/* Architecture Tab View */}
      {subTab === 'architecture' && (
        <div className="flex-grow flex flex-col justify-between">
          {!dependencyGraph || dependencyGraph.nodes.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center text-text-secondary w-full">
              <Network className="w-9 h-9 text-text-muted mb-3 animate-pulse" />
              <h4 className="text-[13.5px] font-bold text-text-heading">Architecture Graph Loading</h4>
              <p className="text-[11.5px] text-text-muted mt-1 max-w-xs mx-auto leading-relaxed">
                Analyzing file hierarchies to reconstruct the module map... (Please verify if you are logged in to unlock complete repository graph analysis).
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left items-stretch">
              {/* Left visual node map */}
              <div className="lg:col-span-2 bg-slate-50/50 dark:bg-bg-secondary/20 border border-border-card rounded-xl p-4 flex flex-col justify-between min-h-[420px]">
                <div className="text-[10px] font-bold text-text-muted mb-4 uppercase tracking-wider">
                  💡 Click on any module node to inspect its roles, triggers, and dependencies.
                </div>

                <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4 items-center justify-center py-4">
                  
                  {/* Column 1: Sources */}
                  <div className="space-y-3.5 flex flex-col items-center justify-center">
                    <span className="text-[9.5px] font-black uppercase text-text-muted tracking-wider mb-1 block">Entrypoints</span>
                    {nodesWithColumns.filter(n => n.col === 0).length === 0 ? (
                      <span className="text-[11px] text-text-muted italic">None detected</span>
                    ) : (
                      nodesWithColumns.filter(n => n.col === 0).map(node => (
                        <div
                          key={node.id}
                          onClick={() => setSelectedArchNode(node.id)}
                          className={`px-4 py-3 border rounded-xl font-bold text-[12px] text-center cursor-pointer transition-all duration-200 w-full flex flex-col items-center justify-center gap-1 ${
                            selectedArchNode === node.id
                              ? 'bg-sky-500 text-white border-sky-400 ring-4 ring-sky-500/20'
                              : 'bg-sky-50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-850 text-sky-600 dark:text-sky-400 hover:border-sky-400 hover:scale-[1.01]'
                          }`}
                        >
                          <span className="truncate max-w-[150px] font-extrabold">{node.label}</span>
                          <span className="text-[9px] opacity-75 font-mono truncate max-w-[150px] font-normal">{node.id}</span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Column 2: Core modules */}
                  <div className="space-y-3.5 flex flex-col items-center justify-center border-y md:border-y-0 md:border-x border-border-divider/50 py-4 md:py-0 md:px-4">
                    <span className="text-[9.5px] font-black uppercase text-text-muted tracking-wider mb-1 block">Core Modules</span>
                    {nodesWithColumns.filter(n => n.col === 1).length === 0 ? (
                      <span className="text-[11px] text-text-muted italic">None detected</span>
                    ) : (
                      nodesWithColumns.filter(n => n.col === 1).map(node => (
                        <div
                          key={node.id}
                          onClick={() => setSelectedArchNode(node.id)}
                          className={`px-4 py-3 border rounded-xl font-bold text-[12px] text-center cursor-pointer transition-all duration-200 w-full flex flex-col items-center justify-center gap-1 ${
                            selectedArchNode === node.id
                              ? 'bg-indigo-500 text-white border-indigo-400 ring-4 ring-indigo-500/20'
                              : 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-850 text-indigo-600 dark:text-indigo-400 hover:border-indigo-400 hover:scale-[1.01]'
                          }`}
                        >
                          <span className="truncate max-w-[150px] font-extrabold">{node.label}</span>
                          <span className="text-[9px] opacity-75 font-mono truncate max-w-[150px] font-normal">{node.id}</span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Column 3: Sinks */}
                  <div className="space-y-3.5 flex flex-col items-center justify-center">
                    <span className="text-[9.5px] font-black uppercase text-text-muted tracking-wider mb-1 block">Dependencies</span>
                    {nodesWithColumns.filter(n => n.col === 2).length === 0 ? (
                      <span className="text-[11px] text-text-muted italic">None detected</span>
                    ) : (
                      nodesWithColumns.filter(n => n.col === 2).map(node => (
                        <div
                          key={node.id}
                          onClick={() => setSelectedArchNode(node.id)}
                          className={`px-4 py-3 border rounded-xl font-bold text-[12px] text-center cursor-pointer transition-all duration-200 w-full flex flex-col items-center justify-center gap-1 ${
                            selectedArchNode === node.id
                              ? 'bg-emerald-500 text-white border-emerald-400 ring-4 ring-emerald-500/20'
                              : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-850 text-emerald-600 dark:text-emerald-400 hover:border-emerald-400 hover:scale-[1.01]'
                          }`}
                        >
                          <span className="truncate max-w-[150px] font-extrabold">{node.label}</span>
                          <span className="text-[9px] opacity-75 font-mono truncate max-w-[150px] font-normal">{node.id}</span>
                        </div>
                      ))
                    )}
                  </div>

                </div>

                {/* Legend */}
                <div className="flex gap-4 text-[10.5px] font-bold text-text-secondary justify-center border-t border-border-divider/50 pt-2.5 mt-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded bg-sky-500/15 border border-sky-400/30" />
                    <span>Entrypoint / Client</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded bg-indigo-500/15 border border-indigo-400/30" />
                    <span>Business Logic</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded bg-emerald-500/15 border border-emerald-400/30" />
                    <span>Utils / DB / Sink</span>
                  </div>
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
                          <span className="text-[9px] font-black uppercase bg-brand-primary-light text-brand-primary dark:bg-brand-primary/10 px-2.5 py-0.5 rounded">
                            {node.type} node
                          </span>
                          <h4 className="text-[14.5px] font-black text-text-heading leading-tight truncate mt-2.5" title={node.label}>
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

                        {incomingLinks.length > 0 && (
                          <div className="border-t border-border-divider/50 pt-3">
                            <span className="text-[11px] font-bold text-text-heading block mb-1.5">Imported By / Parent:</span>
                            <div className="flex flex-wrap gap-1">
                              {incomingLinks.map(link => {
                                const sourceNode = nodesWithColumns.find(n => n.id === link.source);
                                return (
                                  <span key={link.source} className="text-[10px] bg-slate-100 dark:bg-bg-secondary px-2 py-0.5 rounded border border-border-divider/30 text-text-secondary font-semibold">
                                    {sourceNode?.label || link.source}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {outgoingLinks.length > 0 && (
                          <div className="border-t border-border-divider/50 pt-3">
                            <span className="text-[11px] font-bold text-text-heading block mb-1.5">Depends On / Subfolders:</span>
                            <div className="flex flex-wrap gap-1">
                              {outgoingLinks.map(link => {
                                const targetNode = nodesWithColumns.find(n => n.id === link.target);
                                return (
                                  <span key={link.target} className="text-[10px] bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-900/10 font-semibold">
                                    {targetNode?.label || link.target}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
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
