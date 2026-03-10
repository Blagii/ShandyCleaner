import React from 'react';
import { X, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useConfig } from '../context/ConfigContext';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsOfServiceModal: React.FC<ModalProps> = ({ isOpen, onClose }) => {
  const { termsOfService } = useConfig();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-surfaceHighlight/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Terms of Service</h3>
              <p className="text-xs text-zinc-500">Last updated: February 2026</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto p-6 custom-scrollbar text-zinc-300 text-sm leading-relaxed">
          <div className="markdown-body space-y-4">
            <ReactMarkdown
              components={{
                h1: ({node, ...props}) => <h1 className="text-xl font-bold text-white mb-4" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-lg font-bold text-white mb-3" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-base font-bold text-white mb-2 mt-4" {...props} />,
                p: ({node, ...props}) => <p className="mb-4" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc list-inside mb-4" {...props} />,
                li: ({node, ...props}) => <li className="mb-1" {...props} />,
                a: ({node, ...props}) => <a className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                strong: ({node, ...props}) => <strong className="text-white font-semibold" {...props} />,
              }}
            >
              {termsOfService}
            </ReactMarkdown>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border bg-surfaceHighlight/10 flex justify-end">
          <button 
            onClick={onClose}
            className="bg-white text-black hover:bg-zinc-200 px-6 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            I Agree
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServiceModal;
