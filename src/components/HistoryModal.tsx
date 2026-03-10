import React from 'react';
import { X, Clock, FileCode, ArrowRight, RotateCcw, Trash2 } from 'lucide-react';

export interface HistoryItem {
  id: string;
  timestamp: string;
  mode: 'file' | 'zip';
  fileName?: string; // For single file mode, maybe just "Snippet" or first line
  originalCode?: string;
  cleanedCode?: string;
  originalSize?: number;
  newSize?: number;
}

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onRestore: (item: HistoryItem) => void;
  onClear: () => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, history, onRestore, onClear }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh]">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-surfaceHighlight/30">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-white">Cleaning History</h3>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-12 text-zinc-500">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No history available yet.</p>
              <p className="text-xs mt-1">Clean some code to see it here.</p>
            </div>
          ) : (
            history.map((item) => (
              <div key={item.id} className="bg-surfaceHighlight/30 border border-white/5 rounded-lg p-4 hover:border-primary/30 transition-colors group">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.mode === 'file' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                      {item.mode === 'file' ? 'Single File' : 'Project ZIP'}
                    </span>
                    <span className="text-xs text-zinc-500">{new Date(item.timestamp).toLocaleString()}</span>
                  </div>
                  {item.mode === 'file' && (
                    <button 
                      onClick={() => onRestore(item)}
                      className="text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" /> Restore
                    </button>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-zinc-300">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-zinc-500" />
                    <span className="truncate max-w-[200px]">{item.fileName || 'Untitled Snippet'}</span>
                  </div>
                  
                  {item.originalSize && item.newSize && (
                    <div className="flex items-center gap-2 text-xs text-zinc-500 ml-auto">
                      <span>{(item.originalSize / 1024).toFixed(2)} KB</span>
                      <ArrowRight className="w-3 h-3" />
                      <span className="text-emerald-400">{(item.newSize / 1024).toFixed(2)} KB</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-6 py-4 border-t border-border bg-surfaceHighlight/30 flex justify-between items-center">
          <button 
            onClick={onClear}
            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-red-500/10 transition-colors"
            disabled={history.length === 0}
          >
            <Trash2 className="w-3 h-3" /> Clear History
          </button>
          <button 
            onClick={onClose}
            className="bg-white text-black hover:bg-zinc-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
