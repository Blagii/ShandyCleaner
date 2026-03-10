import React, { useState } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface AdBlockModalProps {
  isOpen: boolean;
}

const AdBlockModal: React.FC<AdBlockModalProps> = ({ isOpen }) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (!isOpen || isDismissed) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-surface border border-red-500/30 rounded-2xl shadow-2xl w-full max-w-md p-8 text-center relative overflow-hidden">
        {/* Background decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-red-500/20 blur-[50px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-red-500/20">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-3">AdBlock Detected</h2>
          
          <p className="text-zinc-400 mb-8 leading-relaxed">
            We rely on advertisements to keep <span className="text-white font-medium">Shandy Cleaner</span> free and running. 
            Please disable your ad blocker or add us to your allowlist to continue using the tool.
          </p>

          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-white text-black hover:bg-zinc-200 font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            I've Disabled It - Refresh
          </button>
          
          <button 
            onClick={() => setIsDismissed(true)}
            className="mt-3 text-xs text-zinc-500 hover:text-zinc-300 underline"
          >
            Continue without disabling (I promise I don't have one)
          </button>
          
          <p className="mt-4 text-xs text-zinc-600">
            Extensions like AdBlock, uBlock Origin, or Privacy Badger may cause this.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdBlockModal;
