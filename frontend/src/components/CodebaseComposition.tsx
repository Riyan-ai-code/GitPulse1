import React, { useState, useMemo } from 'react';
import { 
  Folder, 
  File, 
  ChevronRight, 
  ArrowLeft, 
  HardDrive, 
  LayoutGrid, 
  List, 
  Info,
  Layers
} from 'lucide-react';

interface TreeNode {
  name: string;
  type: 'file' | 'directory';
  size: number;
  children?: TreeNode[];
}

interface Props {
  compositionData: TreeNode | null;
  loading: boolean;
}

export const CodebaseComposition: React.FC<Props> = ({ compositionData, loading }) => {
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

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
      
      {/* Header with Title & Mode Toggles */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-divider pb-4 mb-4">
        <div className="space-y-1 text-left">
          <h3 className="text-[16px] font-bold text-text-heading flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-primary" />
            Codebase Composition Map
          </h3>
          <p className="text-[12px] text-text-secondary">
            Scans codebase trees and groups directories dynamically by size.
          </p>
        </div>

        {/* Grid/List Toggle */}
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
      </div>

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

    </div>
  );
};

export default CodebaseComposition;
