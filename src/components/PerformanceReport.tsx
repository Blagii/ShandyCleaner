import React from 'react';
import { AlertTriangle, Info, XCircle, CheckCircle, Activity } from 'lucide-react';
import { AnalysisResult } from '../utils/performanceAnalyzer';

interface PerformanceReportProps {
  results: AnalysisResult[];
  isVisible: boolean;
}

const PerformanceReport: React.FC<PerformanceReportProps> = ({ results, isVisible }) => {
  if (!isVisible) return null;

  const criticalCount = results.filter(r => r.severity === 'critical').length;
  const warningCount = results.filter(r => r.severity === 'warning').length;
  const infoCount = results.filter(r => r.severity === 'info').length;

  if (results.length === 0) {
    return (
      <div className="mt-6 bg-surface border border-border rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
        <div className="flex items-center gap-3 text-emerald-400">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium text-sm">Performance Analysis: No issues found! Code looks optimized.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 bg-surface border border-border rounded-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
      <div className="bg-surfaceHighlight/30 px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium text-zinc-200">Performance Report</h3>
        </div>
        <div className="flex gap-3 text-xs">
          {criticalCount > 0 && <span className="text-red-400 flex items-center gap-1"><XCircle className="w-3 h-3" /> {criticalCount} Critical</span>}
          {warningCount > 0 && <span className="text-amber-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {warningCount} Warnings</span>}
          {infoCount > 0 && <span className="text-blue-400 flex items-center gap-1"><Info className="w-3 h-3" /> {infoCount} Info</span>}
        </div>
      </div>
      
      <div className="max-h-60 overflow-y-auto custom-scrollbar p-2">
        {results.map((result, i) => (
          <div key={i} className="flex gap-3 p-3 hover:bg-white/5 rounded-lg transition-colors group">
            <div className="mt-0.5 flex-shrink-0">
              {result.severity === 'critical' && <XCircle className="w-4 h-4 text-red-400" />}
              {result.severity === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
              {result.severity === 'info' && <Info className="w-4 h-4 text-blue-400" />}
            </div>
            <div className="flex-grow">
              <div className="flex justify-between items-start">
                <p className={`text-sm font-medium ${
                  result.severity === 'critical' ? 'text-red-300' : 
                  result.severity === 'warning' ? 'text-amber-300' : 'text-blue-300'
                }`}>
                  {result.message}
                </p>
                {result.line && (
                  <span className="text-xs font-mono text-zinc-600 bg-black/20 px-1.5 py-0.5 rounded">
                    Line {result.line}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-1 group-hover:text-zinc-400 transition-colors">
                Suggestion: {result.suggestion}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PerformanceReport;
