import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AIService, AIProvider } from '../services/aiService';
import {
  Upload,
  FileCode,
  Archive,
  Play,
  Download,
  Copy,
  Check,
  Loader2,
  AlertTriangle,
  Terminal,
  Eraser,
  Wand2,
  Trash2,
  XCircle,
  Code2,
  Key,
  Zap,
  ChevronRight,
  ShieldCheck,
  FileText,
  Settings,
  Eye,
  Minimize2,
  AlertOctagon,
  RefreshCw,
  Megaphone,
  LogOut,
  ChevronDown,
  User as UserIcon,
  History,
  Info,
  Cpu
} from 'lucide-react';
import JSZip from 'jszip';
import AdUnit from '../components/AdUnit';
import { useSiteProtection } from '../hooks/useSiteProtection';
import { useAdBlockDetector } from '../hooks/useAdBlockDetector';
import AdBlockModal from '../components/AdBlockModal';
import ApiKeyModal from '../components/ApiKeyModal';
import VisitorCounter from '../components/VisitorCounter';
import PrivacyPolicyModal from '../components/PrivacyPolicyModal';
import TermsOfServiceModal from '../components/TermsOfServiceModal';
import RatingModal from '../components/RatingModal';
import PerformanceReport from '../components/PerformanceReport';
import HistoryModal, { HistoryItem } from '../components/HistoryModal';
import { analyzeCode, AnalysisResult } from '../utils/performanceAnalyzer';
import { trackEvent } from '../utils/analytics';
import { ProcessMode, Status, LogEntry, ProcessedFile } from '../types';
import { useConfig } from '../context/ConfigContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirmation } from '../context/ConfirmationContext';
import { Link } from 'react-router-dom';

// --- AI Service ---
// Replaced by AIService class usage inside component

// Helper to detect quota errors reliably
const isQuotaError = (error: unknown): boolean => {
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();
  return lower.includes("quota") || lower.includes("429") || lower.includes("exhausted");
};

// PROVIDER_MODELS removed, using config instead

// --- UI Components ---

const Header = ({ onConnectKey, onOpenHistory }: { onConnectKey: () => void, onOpenHistory: () => void }) => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center shadow-lg shadow-white/10">
            <Wand2 className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-white leading-none">
              Shandy<span className="text-zinc-500 font-normal">Cleaner</span>
            </h1>
            <span className="text-[10px] font-medium bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              Powered by Gemini AI
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isAuthenticated && (
            <>
              <button
                onClick={onOpenHistory}
                className="text-xs font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-surfaceHighlight"
                title="View History"
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">History</span>
              </button>
              <button
                onClick={onConnectKey}
                className="text-xs font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-surfaceHighlight"
              >
                <Key className="w-3 h-3" />
                <span className="hidden sm:inline">API Config</span>
              </button>
            </>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-3 pl-3 border-l border-border">
              <div className="flex items-center gap-2 text-sm text-zinc-300">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <UserIcon className="w-3 h-3" />
                </div>
                <span className="hidden sm:inline">{user?.username}</span>
              </div>
              <button
                onClick={logout}
                className="text-zinc-400 hover:text-red-400 transition-colors p-1.5 hover:bg-surfaceHighlight rounded-md"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-3 border-l border-border">
              <Link to="/login" className="text-xs font-medium text-zinc-400 hover:text-white transition-colors px-3 py-1.5 rounded-md hover:bg-surfaceHighlight">
                Login
              </Link>
              <Link to="/register" className="text-xs font-medium bg-primary hover:bg-primaryHover text-white px-3 py-1.5 rounded-md transition-colors">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

const FilePreviewModal = ({
  file,
  onClose
}: {
  file: ProcessedFile | null,
  onClose: () => void
}) => {
  if (!file) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-surfaceHighlight/30">
          <div className="flex items-center gap-3">
            <FileCode className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-semibold text-white text-sm">{file.name}</h3>
              <div className="text-xs text-zinc-500 flex gap-2">
                <span>Original: {(file.originalSize / 1024).toFixed(2)} KB</span>
                <span className="text-zinc-600">→</span>
                <span className="text-emerald-400">Cleaned: {(file.newSize / 1024).toFixed(2)} KB</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-grow bg-[#0c0c0e] overflow-auto custom-scrollbar p-6">
          <pre className="text-sm font-mono text-zinc-300 leading-relaxed whitespace-pre-wrap">{file.content || "No content available."}</pre>
        </div>

        <div className="px-6 py-4 bg-surfaceHighlight/30 border-t border-border flex justify-end gap-3">
          <button
            onClick={() => {
              navigator.clipboard.writeText(file.content || "");
            }}
            className="text-zinc-300 hover:text-white text-sm font-medium px-4 py-2 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2"
          >
            <Copy className="w-4 h-4" /> Copy Code
          </button>
          <button
            onClick={onClose}
            className="bg-white text-black hover:bg-zinc-200 px-6 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const FileUploader = ({
  onFileSelect,
  accept,
  label,
  subLabel,
  icon: Icon
}: {
  onFileSelect: (file: File) => void,
  accept: string,
  label: string,
  subLabel: string,
  icon: any
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      className={`relative border border-dashed rounded-xl transition-all duration-200 cursor-pointer overflow-hidden h-48 flex flex-col items-center justify-center bg-surface
        ${isDragging
          ? 'border-primary bg-primary/5'
          : 'border-zinc-700 hover:border-zinc-500 hover:bg-surfaceHighlight'
        }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={accept}
        onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
      />
      <div className={`p-3 rounded-lg mb-3 ${isDragging ? 'bg-primary/20 text-primary' : 'bg-surfaceHighlight text-zinc-400'}`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-semibold text-zinc-200 mb-1">{label}</h3>
      <p className="text-xs text-zinc-500 text-center max-w-[200px]">{subLabel}</p>
    </div>
  );
};

const ResultsList = ({ files, onViewFile }: { files: ProcessedFile[], onViewFile: (f: ProcessedFile) => void }) => {
  if (files.length === 0) return null;

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden flex flex-col h-[400px]">
      <div className="bg-surfaceHighlight px-4 py-3 border-b border-border flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-300">Processed Files ({files.length})</span>
      </div>
      <div className="flex-grow overflow-y-auto custom-scrollbar">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-950/50 text-zinc-500 font-medium text-xs sticky top-0 backdrop-blur-sm">
            <tr>
              <th className="px-4 py-2">File Name</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Size Change</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {files.map((file, i) => {
              const reduction = file.originalSize > 0
                ? ((file.originalSize - file.newSize) / file.originalSize * 100).toFixed(1)
                : '0';

              return (
                <tr key={i} className="hover:bg-surfaceHighlight/50 transition-colors group">
                  <td className="px-4 py-3 text-zinc-300 font-mono text-xs truncate max-w-[200px]">
                    {file.name}
                  </td>
                  <td className="px-4 py-3">
                    {file.status === 'success' && <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs bg-emerald-400/10 px-2 py-0.5 rounded-full"><Check className="w-3 h-3" /> Cleaned</span>}
                    {file.status === 'skipped' && <span className="inline-flex items-center gap-1.5 text-zinc-500 text-xs bg-zinc-500/10 px-2 py-0.5 rounded-full"><Minimize2 className="w-3 h-3" /> Skipped</span>}
                    {file.status === 'error' && <span className="inline-flex items-center gap-1.5 text-red-400 text-xs bg-red-400/10 px-2 py-0.5 rounded-full"><AlertTriangle className="w-3 h-3" /> Failed</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400">
                    {file.status === 'success' ? (
                      <div className="flex items-center gap-2">
                        <span className="line-through opacity-50">{(file.originalSize / 1024).toFixed(1)}kb</span>
                        <span className="text-zinc-200">{(file.newSize / 1024).toFixed(1)}kb</span>
                        <span className="text-emerald-500 font-medium">(-{reduction}%)</span>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {file.status === 'success' && (
                      <button
                        onClick={() => onViewFile(file)}
                        className="text-zinc-500 hover:text-primary transition-colors p-1"
                        title="View Code"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ConsoleLog = ({ logs }: { logs: LogEntry[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="bg-surface border border-border rounded-xl flex flex-col overflow-hidden h-32">
      <div className="bg-surfaceHighlight px-4 py-2 border-b border-border flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400">System Log</span>
      </div>
      <div className="flex-grow overflow-y-auto p-4 custom-scrollbar space-y-1.5" ref={scrollRef}>
        {logs.length === 0 && <div className="flex items-center justify-center h-full text-zinc-600 text-xs italic">Waiting for process to start...</div>}
        {logs.map((log, i) => (
          <div key={i} className="flex gap-3 text-[11px]">
            <span className="text-zinc-600 font-mono flex-shrink-0">{log.timestamp}</span>
            <span className={`${log.type === 'error' ? 'text-red-400' :
              log.type === 'success' ? 'text-emerald-400' :
                log.type === 'warning' ? 'text-amber-400' : 'text-zinc-400'
              }`}>
              {log.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main App ---

const Home = () => {
  useSiteProtection();
  const isAdBlockEnabled = useAdBlockDetector();
  const { systemInstruction, incrementStats, adSense, maintenanceMode, announcement, stats, version, geminiModels, anthropicModels } = useConfig();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { addToast } = useToast();
  const { confirm } = useConfirmation();

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const [mode, setMode] = useState<ProcessMode>('file');
  const [status, setStatus] = useState<Status>('idle');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Single File State
  const [inputCode, setInputCode] = useState('');
  const [outputCode, setOutputCode] = useState('');

  // Zip State
  const [currentZipFile, setCurrentZipFile] = useState<File | null>(null);
  const [processedZipBlob, setProcessedZipBlob] = useState<Blob | null>(null);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [progress, setProgress] = useState(0);
  const [previewFile, setPreviewFile] = useState<ProcessedFile | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isTosOpen, setIsTosOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  // AI Provider State
  const [selectedProvider, setSelectedProvider] = useState<AIProvider>('gemini');
  const [selectedModel, setSelectedModel] = useState<string>((geminiModels || [])[0] || '');

  const providerModels = {
    gemini: geminiModels || [],
    anthropic: anthropicModels || []
  };

  // Update selected model when provider changes or models update
  useEffect(() => {
    const models = providerModels[selectedProvider] || [];
    if (models.length > 0 && !models.includes(selectedModel)) {
      setSelectedModel(models[0]);
    }
  }, [selectedProvider, geminiModels, anthropicModels]);

  // Analysis State
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [showAnalysis, setShowAnalysis] = useState(false);

  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Load History
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch('/api/history');
        if (res.ok) {
          const data = await res.json();
          setHistory(data);
        }
      } catch (e) {
        console.error("Failed to fetch history", e);
      }
    };

    if (isAuthenticated) {
      fetchHistory();
    }
  }, [isAuthenticated]);

  const addToHistory = async (item: HistoryItem) => {
    try {
      const res = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: item.mode,
          originalCode: item.originalCode,
          cleanedCode: item.cleanedCode,
          fileName: item.fileName
        })
      });

      if (res.ok) {
        await res.json();
        // Map backend response to frontend HistoryItem if needed, or just use local item with ID
        setHistory(prev => [item, ...prev].slice(0, 10));
      }
    } catch (e) {
      console.error("Failed to save history", e);
    }
  };

  const handleRestore = (item: HistoryItem) => {
    if (item.mode === 'file' && item.originalCode && item.cleanedCode) {
      setInputCode(item.originalCode);
      setOutputCode(item.cleanedCode);
      setMode('file');
      setStatus('success'); // Or 'idle' if you want them to run it again, but 'success' shows the result
      setShowAnalysis(false); // Analysis might be stale, so hide it or re-run it
      setIsHistoryOpen(false);
      addLog(`Restored history item: ${item.fileName || 'Snippet'}`, 'info');
    }
  };

  const handleClearHistory = () => {
    confirm({
      title: 'Clear History',
      message: 'Are you sure you want to clear your cleaning history?',
      confirmText: 'Clear',
      type: 'danger',
      onConfirm: async () => {
        try {
          await fetch('/api/history', { method: 'DELETE' });
          setHistory([]);
          addToast('History cleared', 'success');
        } catch (e) {
          addToast('Failed to clear history', 'error');
        }
      }
    });
  };

  // --- AdSense Script Injection ---
  useEffect(() => {
    const clientId = adSense.clientId;
    if (clientId && !document.querySelector('script[src*="adsbygoogle"]')) {
      const script = document.createElement('script');
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
      script.async = true;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    }
  }, [adSense.clientId]);

  const handleSelectKey = async () => {
    if ((window as any).aistudio && (window as any).aistudio.openSelectKey) {
      try {
        await (window as any).aistudio.openSelectKey();
      } catch (e) {
        console.error("Key selection failed", e);
      }
    } else {
      // Fallback for deployed environments
      setIsApiKeyModalOpen(true);
    }
  };

  const handleSaveApiKey = () => {
    // localStorage.setItem('gemini_api_key', key); // Removed per user request
    // Force re-render or just let the next call pick it up
    addLog('API Key saved successfully', 'success');
  };

  const addLog = useCallback((message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs(prev => [...prev, { message, type, timestamp }]);
  }, []);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setStatus('stopped');
      addLog('Operation cancelled by user', 'warning');
    }
  };

  const getAIService = () => {
    const apiKey = user?.apiKeys?.[selectedProvider] || (selectedProvider === 'gemini' ? user?.apiKey || (import.meta.env.VITE_GEMINI_API_KEY || "") : undefined);

    if (!apiKey) {
      throw new Error(`API Key for ${selectedProvider} is missing. Please configure it.`);
    }

    return new AIService({
      provider: selectedProvider,
      apiKey,
      model: selectedModel
    });
  };

  const generateWithFallback = async (client: AIService, content: string) => {
    try {
      return await client.generateContent(content, systemInstruction);
    } catch (e: any) {
      // Immediate check for quota during retry loop to avoid unnecessary retries
      if (isQuotaError(e)) {
        throw e;
      }
      console.warn(`Model ${selectedModel} failed:`, e.message);
      throw e;
    }
  };

  const handleCleanCode = async () => {
    if (!inputCode.trim()) return;

    // Reset UI state
    setShowAnalysis(false);
    setStatus('processing');
    setOutputCode('');
    setQuotaExceeded(false);

    // Run analysis on input code
    const results = analyzeCode(inputCode);
    setAnalysisResults(results);

    try {
      const client = getAIService();
      const cleaned = await generateWithFallback(client, inputCode);
      const finalCode = cleaned.replace(/^```(lua|javascript|js)?\n/g, '').replace(/```$/g, '');
      setOutputCode(finalCode);

      // Show results and analysis only after success
      setStatus('success');
      setShowAnalysis(true);

      const originalSize = new Blob([inputCode]).size;
      const newSize = new Blob([finalCode]).size;
      incrementStats(1, originalSize - newSize, 0);
      trackEvent('Code', 'Clean', 'Snippet');

      // Add to History
      addToHistory({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        mode: 'file',
        fileName: 'Code Snippet',
        originalCode: inputCode,
        cleanedCode: finalCode,
        originalSize,
        newSize
      });

    } catch (e: any) {
      console.error(e);
      setStatus('error');
      incrementStats(0, 0, 1);

      if (isQuotaError(e)) {
        const msg = "Failed to call the Gemini API: user has exceeded quota. Please try again later.";
        addLog(`🚨 ${msg}`, 'error');
        setQuotaExceeded(true);
        addToast(msg, 'error');
      } else {
        addLog(`Error: ${e.message || String(e)}`, 'error');
      }
    }
  };

  const handleAIAction = async (action: 'explain' | 'docs') => {
    if (!inputCode.trim()) return;

    // Reset UI state
    setShowAnalysis(false);
    setStatus('processing');
    setOutputCode('');
    setQuotaExceeded(false);

    let prompt = "";
    let logMsg = "";

    switch (action) {
      case 'explain':
        prompt = "Explain the following code in detail. Describe what it does, its logic flow, and any potential issues or improvements. Output in Markdown format.";
        logMsg = "Generating explanation...";
        break;
      case 'docs':
        prompt = "Add comprehensive JSDoc/LuaDoc comments to the following code. Document all functions, parameters, and return values. Do not change the logic, just add comments. Return the full code with comments.";
        logMsg = "Generating documentation...";
        break;
    }

    addLog(logMsg, 'info');

    try {
      const client = getAIService();
      const fullPrompt = `${prompt}\n\nCode:\n\`\`\`\n${inputCode}\n\`\`\``;

      const result = await generateWithFallback(client, fullPrompt);

      let finalOutput = result;
      // For docs, we want clean code output. For explain, we keep the markdown structure.
      if (action === 'docs') {
        finalOutput = result.replace(/^```(lua|javascript|js|ts)?\n/g, '').replace(/```$/g, '');
      }

      setOutputCode(finalOutput);
      setStatus('success');
      addLog(`${action.charAt(0).toUpperCase() + action.slice(1)} complete`, 'success');
      trackEvent('Code', action, 'Snippet');

      if (action === 'docs') {
        const results = analyzeCode(finalOutput);
        setAnalysisResults(results);
        setShowAnalysis(true);
      }

      // Add to History
      addToHistory({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        mode: 'file',
        fileName: `${action.charAt(0).toUpperCase() + action.slice(1)} Result`,
        originalCode: inputCode,
        cleanedCode: finalOutput,
        originalSize: new Blob([inputCode]).size,
        newSize: new Blob([finalOutput]).size
      });

    } catch (e: any) {
      console.error(e);
      setStatus('error');
      incrementStats(0, 0, 1);

      if (isQuotaError(e)) {
        const msg = "Failed to call the Gemini API: user has exceeded quota. Please try again later.";
        addLog(`🚨 ${msg}`, 'error');
        setQuotaExceeded(true);
      } else {
        addLog(`Error: ${e.message || String(e)}`, 'error');
      }
    }
  };

  const updateProcessedFile = (name: string, data: Partial<ProcessedFile>) => {
    setProcessedFiles(prev => {
      const index = prev.findIndex(p => p.name === name);
      if (index >= 0) {
        const newArr = [...prev];
        newArr[index] = { ...newArr[index], ...data };
        return newArr;
      }
      return [...prev, { name, ...data } as ProcessedFile];
    });
  };

  const processZip = async (file: File, isResume: boolean) => {
    setStatus('processing');
    setQuotaExceeded(false);

    if (!isResume) {
      setLogs([]);
      setProcessedFiles([]);
      setProcessedZipBlob(null);
      setProgress(0);
      setCurrentZipFile(file);
    }

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      addLog(isResume ? `Resuming processing: ${file.name}` : `Started processing: ${file.name}`);
      const zip = new JSZip();

      let loadedZip;
      try {
        loadedZip = await zip.loadAsync(file);
      } catch (err) {
        throw new Error("Invalid ZIP file");
      }

      const newZip = new JSZip();
      const filesToProcess: string[] = [];

      // Iterate existing zip to rebuild structure and identify code files
      loadedZip.forEach((relativePath: string, zipEntry: any) => {
        if (zipEntry.dir) {
          newZip.folder(relativePath);
          return;
        }

        const lower = relativePath.toLowerCase();
        if (lower.endsWith('.lua') || lower.endsWith('.js') || lower.endsWith('.json') || lower.endsWith('.cfg')) {
          filesToProcess.push(relativePath);
        } else {
          newZip.file(relativePath, zipEntry.async('blob'));
        }
      });

      if (!isResume) {
        addLog(`Identified ${filesToProcess.length} script files`, 'info');
      }

      const client = getAIService();
      let processedCount = 0;
      let totalSaved = 0;
      let errors = 0;

      // Map for O(1) lookup of previous results if resuming
      const previousResults = new Map<string, ProcessedFile>();
      if (isResume) {
        processedFiles.forEach(f => previousResults.set(f.name, f));
      }

      for (const filePath of filesToProcess) {
        if (signal.aborted) throw new Error("Stopped");

        const prev = previousResults.get(filePath);

        // Resume: If already success, use cached content
        if (isResume && prev && prev.status === 'success' && prev.content) {
          newZip.file(filePath, prev.content);
          processedCount++;
          setProgress(Math.round((processedCount / filesToProcess.length) * 100));
          continue;
        }

        // Resume: If already skipped (valid skip), use original content
        if (isResume && prev && prev.status === 'skipped') {
          const original = await loadedZip.file(filePath)!.async('string');
          newZip.file(filePath, original);
          processedCount++;
          setProgress(Math.round((processedCount / filesToProcess.length) * 100));
          continue;
        }

        // Otherwise (New, Error, or stopped before reaching), process it
        const originalContent = await loadedZip.file(filePath)!.async('string');
        const originalSize = new Blob([originalContent]).size;

        // Log only if we are actually doing work
        if (isResume && prev?.status === 'error') {
          addLog(`Retrying: ${filePath}`, 'warning');
        } else {
          addLog(`Cleaning: ${filePath}`, 'info');
        }

        try {
          if (originalContent.length > 50000000) { // 50MB limit
            addLog(`Skipped ${filePath} (File too large)`, 'warning');
            newZip.file(filePath, originalContent);
            updateProcessedFile(filePath, { status: 'skipped', originalSize, newSize: originalSize, errorMsg: "File too large" });
          } else if (originalContent.trim().length === 0) {
            newZip.file(filePath, originalContent);
            updateProcessedFile(filePath, { status: 'skipped', originalSize, newSize: originalSize, errorMsg: "Empty file" });
          } else {
            const cleaned = await generateWithFallback(client, originalContent);
            const finalCleaned = cleaned.replace(/^```(lua|javascript|js)?\n/g, '').replace(/```$/g, '');
            const newSize = new Blob([finalCleaned]).size;

            newZip.file(filePath, finalCleaned);

            updateProcessedFile(filePath, {
              status: 'success',
              originalSize,
              newSize,
              content: finalCleaned
            });

            totalSaved += (originalSize - newSize);
            addLog(`Success: ${filePath}`, 'success');
          }
        } catch (err: any) {
          // If quota exceeded, we stop entirely
          if (isQuotaError(err)) {
            throw new Error("QUOTA_EXCEEDED");
          }

          addLog(`Failed: ${filePath} - ${err.message}`, 'error');
          newZip.file(filePath, originalContent); // Keep original on error
          updateProcessedFile(filePath, {
            status: 'error',
            originalSize,
            newSize: originalSize,
            errorMsg: err.message
          });
          errors++;
        }

        processedCount++;
        setProgress(Math.round((processedCount / filesToProcess.length) * 100));
        await new Promise(r => setTimeout(r, 100));
      }

      if (signal.aborted) return;

      addLog('Compressing final archive...', 'info');
      const blob = await newZip.generateAsync({ type: 'blob' });
      setProcessedZipBlob(blob);
      setStatus('success');
      addLog('Process complete', 'success');
      trackEvent('File', 'Clean Zip', file.name);
      incrementStats(processedCount, totalSaved, errors);

      // Add to History (Metadata only for ZIPs)
      addToHistory({
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        mode: 'zip',
        fileName: file.name,
        originalSize: file.size,
        newSize: blob.size
      });

    } catch (e: any) {
      if (e.message === "Stopped") return;

      if (e.message === "QUOTA_EXCEEDED" || isQuotaError(e)) {
        setStatus('error');
        const msg = "Quota exceeded. Please change your API key and click Resume.";
        addLog(`🚨 ${msg}`, 'error');
        setQuotaExceeded(true);
        // Do not alert() here to avoid blocking UI, the banner and log is enough
        return;
      }

      console.error(e);
      setStatus('error');
      addLog(`Fatal Error: ${e.message}`, 'error');
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleCleanZip = (file: File) => processZip(file, false);
  const handleResume = () => {
    if (currentZipFile) processZip(currentZipFile, true);
  };

  const performDownload = () => {
    if (!processedZipBlob) return;
    const url = URL.createObjectURL(processedZipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shandy_clean_${new Date().getTime()}.zip`;
    document.body.appendChild(a);
    a.click();
    trackEvent('File', 'Download', 'Zip');
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadClick = () => {
    setIsRatingModalOpen(true);
  };

  const handleRatingSubmit = (rating: number) => {
    // Here you would typically send the rating to a backend
    console.log(`User rated: ${rating} stars`);
    addLog(`Thank you for rating us ${rating} stars!`, 'success');
    setIsRatingModalOpen(false);
    performDownload();
  };

  const handleRatingClose = () => {
    setIsRatingModalOpen(false);
    performDownload();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(outputCode);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (maintenanceMode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-white p-4">
        <div className="bg-surface border border-border rounded-xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertOctagon className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-white">System Maintenance</h1>
          <p className="text-zinc-400 mb-6 text-sm leading-relaxed">
            Shandy Cleaner is currently undergoing scheduled maintenance to improve performance. Please check back later.
          </p>
          <div className="text-xs text-zinc-600 pt-4 border-t border-border">
            <Link to="/admin" className="hover:text-zinc-400 transition-colors">Admin Login</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans relative bg-background text-white">
      <AdBlockModal isOpen={isAdBlockEnabled} />
      <Header onConnectKey={handleSelectKey} onOpenHistory={() => setIsHistoryOpen(true)} />

      {/* Announcement Banner */}
      {announcement && (
        <div className="bg-blue-500/10 border-b border-blue-500/20 backdrop-blur-md sticky top-16 z-40 animate-in slide-in-from-top-2">
          <div className="container mx-auto px-6 py-2 flex items-center justify-center text-center">
            <p className="text-blue-400 text-sm font-medium flex items-center gap-2">
              <Megaphone className="w-4 h-4" />
              {announcement}
            </p>
          </div>
        </div>
      )}

      {/* Quota Exceeded Banner */}
      {quotaExceeded && (
        <div className="bg-red-500/10 border-b border-red-500/20 backdrop-blur-md sticky top-16 z-40 animate-in slide-in-from-top-2">
          <div className="container mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3 text-red-400">
              <AlertOctagon className="w-5 h-5" />
              <span className="font-medium text-sm">Failed to call the Gemini API: user has exceeded quota. Please try again later.</span>
            </div>
            <button onClick={() => setQuotaExceeded(false)} className="text-red-400 hover:text-red-300 transition-colors">
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSave={handleSaveApiKey}
      />

      <PrivacyPolicyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />

      <TermsOfServiceModal
        isOpen={isTosOpen}
        onClose={() => setIsTosOpen(false)}
      />

      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={handleRatingClose}
        onRate={handleRatingSubmit}
      />

      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onRestore={handleRestore}
        onClear={handleClearHistory}
      />

      <main className="container mx-auto px-4 sm:px-6 py-6 max-w-6xl flex-grow">

        {!isAuthenticated ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-8 shadow-2xl shadow-primary/20">
              <Wand2 className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
              Optimize Your Code with <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">AI Precision</span>
            </h1>
            <p className="text-lg text-zinc-400 max-w-2xl mb-10 leading-relaxed">
              Shandy Cleaner uses advanced Gemini AI models to clean, format, and de-obfuscate your Lua and JS scripts.
              Join thousands of developers optimizing their projects today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 bg-primary hover:bg-primaryHover text-white font-medium py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
              >
                Get Started <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-2 sm:gap-8 text-center">
              <div>
                <p className="text-2xl font-bold text-white">{stats.totalFilesProcessed}</p>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Files Cleaned</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{formatBytes(stats.totalBytesSaved)}</p>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Space Saved</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">99.9%</p>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mt-1">Uptime</p>
              </div>
            </div>

            {/* Features Section */}
            <div className="mt-24 w-full max-w-5xl">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-12">Why Choose Shandy Cleaner?</h2>
              <div className="grid md:grid-cols-3 gap-8 text-left">
                <div className="bg-surface border border-border p-6 rounded-xl hover:border-primary/50 transition-colors group">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                    <Zap className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">AI-Powered Optimization</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Leveraging Google&apos;s advanced Gemini models to intelligently analyze, refactor, and optimize your code structure.
                  </p>
                </div>
                <div className="bg-surface border border-border p-6 rounded-xl hover:border-purple-500/50 transition-colors group">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-500/20 transition-colors">
                    <ShieldCheck className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Secure & Private</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Your code is processed securely. We don&apos;t store your scripts after processing, ensuring complete privacy for your intellectual property.
                  </p>
                </div>
                <div className="bg-surface border border-border p-6 rounded-xl hover:border-emerald-500/50 transition-colors group">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition-colors">
                    <Code2 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Multi-Language Support</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Specialized support for Lua and JavaScript, perfect for FiveM developers and web applications alike.
                  </p>
                </div>
              </div>
            </div>

            {/* How It Works Section */}
            <div className="mt-24 w-full max-w-4xl mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-12">How It Works</h2>
              <div className="relative">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-zinc-800 -z-10 hidden md:block transform -translate-y-1/2"></div>

                <div className="grid md:grid-cols-3 gap-8">
                  <div className="bg-background border border-border p-6 rounded-xl relative">
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-surface border border-border rounded-full flex items-center justify-center text-sm font-bold text-white">1</div>
                    <h3 className="text-lg font-semibold text-white mb-2 mt-2">Upload</h3>
                    <p className="text-zinc-400 text-sm">Upload your .zip archive or paste your code directly into the editor.</p>
                  </div>
                  <div className="bg-background border border-border p-6 rounded-xl relative">
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-surface border border-border rounded-full flex items-center justify-center text-sm font-bold text-white">2</div>
                    <h3 className="text-lg font-semibold text-white mb-2 mt-2">Process</h3>
                    <p className="text-zinc-400 text-sm">Our AI analyzes and cleans your code, removing junk and optimizing logic.</p>
                  </div>
                  <div className="bg-background border border-border p-6 rounded-xl relative">
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-surface border border-border rounded-full flex items-center justify-center text-sm font-bold text-white">3</div>
                    <h3 className="text-lg font-semibold text-white mb-2 mt-2">Download</h3>
                    <p className="text-zinc-400 text-sm">Get your optimized files instantly, ready for deployment.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Supported Technologies */}
            <div className="mt-24 w-full max-w-5xl">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-12">Supported Technologies</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-surface border border-border p-6 rounded-xl flex flex-col items-center justify-center hover:border-blue-500/50 transition-colors group">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <span className="text-blue-400 font-bold">Lua</span>
                  </div>
                  <span className="text-zinc-300 font-medium">Lua 5.4</span>
                  <span className="text-xs text-zinc-500 mt-1">FiveM / RedM</span>
                </div>
                <div className="bg-surface border border-border p-6 rounded-xl flex flex-col items-center justify-center hover:border-yellow-500/50 transition-colors group">
                  <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <span className="text-yellow-400 font-bold">JS</span>
                  </div>
                  <span className="text-zinc-300 font-medium">JavaScript</span>
                  <span className="text-xs text-zinc-500 mt-1">ES6+ / Node.js</span>
                </div>
                <div className="bg-surface border border-border p-6 rounded-xl flex flex-col items-center justify-center hover:border-blue-400/50 transition-colors group">
                  <div className="w-12 h-12 bg-blue-400/10 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <span className="text-blue-400 font-bold">TS</span>
                  </div>
                  <span className="text-zinc-300 font-medium">TypeScript</span>
                  <span className="text-xs text-zinc-500 mt-1">Strict Typing</span>
                </div>
                <div className="bg-surface border border-border p-6 rounded-xl flex flex-col items-center justify-center hover:border-green-500/50 transition-colors group">
                  <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <span className="text-green-400 font-bold">JSON</span>
                  </div>
                  <span className="text-zinc-300 font-medium">JSON</span>
                  <span className="text-xs text-zinc-500 mt-1">Data Configs</span>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="mt-24 w-full max-w-3xl mb-24">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-12 text-center">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {[
                  {
                    question: "How does Shandy Cleaner optimize my code?",
                    answer: "It uses Google's advanced Gemini AI models to analyze your code structure, remove redundancy, format syntax, and improve readability without altering the core logic."
                  },
                  {
                    question: "Is my code stored on your servers?",
                    answer: "No. We operate with a privacy-first approach. Your code is processed in real-time and is never saved to our databases. Once the processing is complete, the data is discarded."
                  },
                  {
                    question: "What languages are supported?",
                    answer: "We currently specialize in Lua (FiveM/RedM scripts) and JavaScript/TypeScript (Node.js/Web). We also support JSON configuration files."
                  },
                  {
                    question: "Can I process multiple files at once?",
                    answer: "Yes! You can upload a .zip archive containing your entire project. We will process each supported file individually and provide a cleaned .zip file for download."
                  },
                  {
                    question: "What if the AI breaks my code?",
                    answer: "While our AI is highly accurate, we always recommend backing up your original files before using any automated tool. We provide a 'History' feature to restore previous versions if needed."
                  },
                  {
                    question: "Is there a file size limit?",
                    answer: "Yes, to ensure performance, individual files are limited to 50MB. Larger files will be skipped during the batch process."
                  }
                ].map((faq, index) => (
                  <div key={index} className="bg-surface border border-border rounded-xl overflow-hidden transition-all duration-200 hover:border-primary/30">
                    <button
                      onClick={() => {
                        const el = document.getElementById(`faq-answer-${index}`);
                        const icon = document.getElementById(`faq-icon-${index}`);
                        if (el && icon) {
                          el.classList.toggle('hidden');
                          icon.classList.toggle('rotate-180');
                        }
                      }}
                      className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none group"
                    >
                      <span className="text-lg font-medium text-white group-hover:text-primary transition-colors">{faq.question}</span>
                      <ChevronDown id={`faq-icon-${index}`} className="w-5 h-5 text-zinc-500 transition-transform duration-200" />
                    </button>
                    <div id={`faq-answer-${index}`} className="hidden px-6 pb-4 text-zinc-400 text-sm leading-relaxed border-t border-border/50 pt-4 animate-in slide-in-from-top-1">
                      {faq.answer}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Top Ad Unit */}
            <AdUnit
              slotId={adSense.slotTop}
              className="mb-6 min-h-[90px] bg-surfaceHighlight/10 rounded-lg border border-white/5"
              label="Top Banner Ad"
            />

            {/* Modern Segmented Control */}
            <div className="flex justify-center mb-6">
              <div className="bg-surface p-1 rounded-xl border border-border inline-flex shadow-sm">
                <button
                  onClick={() => { setMode('file'); setStatus('idle'); setQuotaExceeded(false); }}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'file'
                    ? 'bg-surfaceHighlight text-white shadow-sm ring-1 ring-white/5'
                    : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                >
                  <FileCode className="w-4 h-4" />
                  Single File
                </button>
                <button
                  onClick={() => { setMode('zip'); setStatus('idle'); setQuotaExceeded(false); }}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'zip'
                    ? 'bg-surfaceHighlight text-white shadow-sm ring-1 ring-white/5'
                    : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                >
                  <Archive className="w-4 h-4" />
                  Project Archive
                </button>
              </div>
            </div>

            {/* AI Provider & Model Selection */}
            <div className="flex flex-col sm:flex-row justify-center items-center mb-6 gap-4">
              {/* Provider Selector */}
              <div className="bg-surface p-1 rounded-xl border border-border inline-flex shadow-sm">
                <button
                  onClick={() => {
                    setSelectedProvider('gemini');
                    setSelectedModel(providerModels.gemini[0]);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${selectedProvider === 'gemini'
                    ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50'
                    : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  Gemini
                </button>
                <button
                  onClick={() => {
                    setSelectedProvider('anthropic');
                    setSelectedModel(providerModels.anthropic[0]);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${selectedProvider === 'anthropic'
                    ? 'bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/50'
                    : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  Claude
                </button>
              </div>

              {/* Model Selector */}
              <div className="relative">
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="appearance-none bg-surface border border-border rounded-xl px-4 py-2 pr-10 text-xs font-medium text-zinc-300 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary min-w-[180px] cursor-pointer hover:bg-surfaceHighlight/50 transition-colors"
                >
                  {(providerModels[selectedProvider] || []).map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 pointer-events-none" />
              </div>
            </div>

            {/* Content Area */}
            <div className="animate-fade-in">
              {mode === 'file' ? (
                <>
                  <div className="grid lg:grid-cols-2 gap-6 h-auto lg:h-[550px]">
                    {/* Input Panel */}
                    <div className="flex flex-col h-[500px] lg:h-full bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
                      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-surfaceHighlight/30">
                        <div className="flex items-center gap-2 text-sm text-zinc-300 font-medium">
                          <div className="w-2 h-2 rounded-full bg-zinc-500"></div> Input
                        </div>
                        <button onClick={() => setInputCode('')} className="text-xs text-zinc-500 hover:text-red-400 transition-colors">
                          Clear
                        </button>
                      </div>

                      <textarea
                        className="flex-grow bg-transparent p-5 font-mono text-sm text-zinc-300 resize-none focus:outline-none custom-scrollbar leading-relaxed"
                        placeholder="Paste your Lua or JS code here..."
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value)}
                        spellCheck={false}
                      />

                      <div className="p-4 border-t border-border bg-surfaceHighlight/10 grid grid-cols-2 gap-3">
                        <button
                          onClick={handleCleanCode}
                          disabled={status === 'processing' || !inputCode.trim()}
                          className={`col-span-2 w-full py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-all
                          ${status === 'processing'
                              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                              : 'bg-primary hover:bg-primaryHover text-white shadow-lg shadow-blue-500/20'}`}
                        >
                          {status === 'processing' ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                          ) : (
                            <><Play className="w-4 h-4 fill-current" /> Clean & Optimize</>
                          )}
                        </button>

                        <button
                          onClick={() => handleAIAction('explain')}
                          disabled={status === 'processing' || !inputCode.trim()}
                          className="py-2 rounded-lg font-medium text-xs flex items-center justify-center gap-2 bg-surfaceHighlight hover:bg-zinc-700 text-zinc-300 transition-colors border border-white/5"
                        >
                          <Info className="w-3 h-3" /> Explain Code
                        </button>

                        <button
                          onClick={() => handleAIAction('docs')}
                          disabled={status === 'processing' || !inputCode.trim()}
                          className="py-2 rounded-lg font-medium text-xs flex items-center justify-center gap-2 bg-surfaceHighlight hover:bg-zinc-700 text-zinc-300 transition-colors border border-white/5"
                        >
                          <FileText className="w-3 h-3" /> Add Docs
                        </button>


                      </div>
                    </div>

                    {/* Output Panel */}
                    <div className="flex flex-col h-[500px] lg:h-full bg-surface border border-border rounded-xl overflow-hidden shadow-sm relative">
                      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-surfaceHighlight/30">
                        <div className="flex items-center gap-2 text-sm text-zinc-300 font-medium">
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Output
                        </div>
                        {outputCode && (
                          <button onClick={copyToClipboard} className="text-xs text-zinc-500 hover:text-white transition-colors flex items-center gap-1">
                            <Copy className="w-3 h-3" /> Copy
                          </button>
                        )}
                      </div>

                      <div className="flex-grow bg-[#0c0c0e] p-5 overflow-auto custom-scrollbar relative">
                        {outputCode ? (
                          <pre className="text-sm text-zinc-300 leading-relaxed font-mono whitespace-pre-wrap">{outputCode}</pre>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600">
                            <div className="w-12 h-12 rounded-xl bg-surfaceHighlight flex items-center justify-center mb-3">
                              <Code2 className="w-6 h-6 opacity-40" />
                            </div>
                            <span className="text-sm font-medium">Output will appear here</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <PerformanceReport results={analysisResults} isVisible={showAnalysis} />
                </>
              ) : (
                /* ZIP MODE */
                <div className="max-w-4xl mx-auto flex flex-col gap-4">

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <FileUploader
                        label="Upload Project ZIP"
                        subLabel="Drag & Drop .zip file here"
                        accept=".zip"
                        icon={Upload}
                        onFileSelect={handleCleanZip}
                      />
                    </div>
                    {/* Capabilities Box */}
                    <div className="bg-surface border border-border rounded-xl p-6 flex flex-col justify-center h-48">
                      <h3 className="text-zinc-200 font-semibold mb-3 text-sm flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4" /> Capabilities
                      </h3>
                      <ul className="text-sm text-zinc-500 space-y-2">
                        <li className="flex gap-2.5 items-center"><Check className="w-4 h-4 text-primary" /> Syntax Correction</li>
                        <li className="flex gap-2.5 items-center"><Check className="w-4 h-4 text-primary" /> Code Formatting</li>
                        <li className="flex gap-2.5 items-center"><Check className="w-4 h-4 text-primary" /> De-obfuscation</li>
                        <li className="flex gap-2.5 items-center"><Check className="w-4 h-4 text-primary" /> Binary Safe</li>
                      </ul>
                    </div>
                  </div>

                  {(status !== 'idle' || logs.length > 0) && (
                    <div className="bg-surface border border-border rounded-xl p-1 shadow-lg animate-in slide-in-from-bottom-2 duration-300">
                      <div className="p-4 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {status === 'processing' && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                          {status === 'success' && <Check className="w-4 h-4 text-emerald-500" />}
                          {status === 'error' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                          {status === 'stopped' && <XCircle className="w-4 h-4 text-amber-500" />}
                          <span className="text-sm font-medium text-zinc-200">
                            {status === 'processing' ? `Processing... ${progress}%` :
                              status === 'success' ? 'Project Cleaning Complete' :
                                status === 'error' ? 'Task Failed' :
                                  status === 'stopped' ? 'Stopped' : 'Ready'}
                          </span>
                        </div>

                        {/* Action Buttons for Task Status */}
                        <div className="flex items-center gap-3">
                          {status === 'processing' && (
                            <button onClick={handleStop} className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors">
                              Cancel
                            </button>
                          )}

                          {/* Resume Button - Visible on Error or Stopped */}
                          {(status === 'error' || status === 'stopped') && currentZipFile && (
                            <button
                              onClick={handleResume}
                              className="text-xs font-bold text-primary hover:text-primaryHover transition-colors flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-md border border-primary/20 hover:bg-primary/20"
                            >
                              <Play className="w-3 h-3 fill-current" /> Resume
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="h-0.5 w-full bg-surfaceHighlight">
                        <div
                          className={`h-full transition-all duration-300 ${status === 'error' ? 'bg-red-500' : 'bg-primary'}`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>

                      <div className="p-4 grid gap-6">
                        {/* Results List */}
                        {processedFiles.length > 0 && (
                          <ResultsList files={processedFiles} onViewFile={setPreviewFile} />
                        )}

                        {/* Minimized Console Log */}
                        <ConsoleLog logs={logs} />

                        {status === 'success' && processedZipBlob && (
                          <button
                            onClick={handleDownloadClick}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-900/20"
                          >
                            <Download className="w-4 h-4" />
                            Download Cleaned Zip
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Ad Unit */}
            <AdUnit
              slotId={adSense.slotBottom}
              className="mt-8 min-h-[90px] bg-surfaceHighlight/10 rounded-lg border border-white/5"
              label="Bottom Banner Ad"
            />
          </>
        )}
      </main>

      <footer className="border-t border-border bg-surface/50 backdrop-blur-sm py-6 mt-auto">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4 text-xs text-zinc-500">
              <span>&copy; {new Date().getFullYear()} Shandy Cleaner</span>
              <span className="hidden md:inline text-zinc-700">•</span>
              <span className="text-zinc-600">Not affiliated with Rockstar Games or Cfx.re.</span>
            </div>
            <VisitorCounter />
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs border-t border-white/5 pt-4">
            <div className="flex gap-4 text-zinc-500">
              <button onClick={() => setIsPrivacyOpen(true)} className="hover:text-zinc-400 transition-colors cursor-pointer">Privacy Policy</button>
              <button onClick={() => setIsTosOpen(true)} className="hover:text-zinc-400 transition-colors cursor-pointer">Terms of Service</button>
              {user?.role === 'admin' && (
                <Link to="/admin" className="hover:text-zinc-400 transition-colors cursor-pointer">Admin</Link>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-zinc-400">
                <Zap className="w-3 h-3 text-yellow-500" /> Powered by <span className="text-zinc-300 font-medium">Google Gemini AI</span>
              </span>
              <span className="font-medium bg-surfaceHighlight/50 px-2 py-1 rounded text-zinc-400">{version}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
