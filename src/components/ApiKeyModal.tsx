import React, { useState, useEffect } from 'react';
import { Key, X, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave }) => {
  const [key, setKey] = useState('');
  const [provider, setProvider] = useState<'gemini' | 'anthropic'>('gemini');
  const [error, setError] = useState('');

  const { updateApiKey, user } = useAuth();

  useEffect(() => {
    if (isOpen && user?.apiKeys) {
      setKey(user.apiKeys[provider] || '');
    }
  }, [isOpen, provider, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) {
      setError('API Key cannot be empty');
      return;
    }
    
    if (provider === 'gemini' && !key.startsWith('AIza')) {
      setError('Invalid Gemini API Key format (should start with AIza)');
      return;
    }

    if (provider === 'anthropic' && !key.startsWith('sk-ant')) {
      setError('Invalid Anthropic API Key format (should start with sk-ant)');
      return;
    }
    
    try {
      await updateApiKey(key.trim(), provider);
      onSave(key.trim()); 
      onClose();
    } catch (err) {
      setError('Failed to save API key');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-surfaceHighlight/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">API Configuration</h3>
              <p className="text-xs text-zinc-500">Manage your AI Provider Keys</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex gap-2 mb-6 bg-black/20 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setProvider('gemini')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                provider === 'gemini' 
                  ? 'bg-primary text-white shadow-lg' 
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Google Gemini
            </button>
            <button
              type="button"
              onClick={() => setProvider('anthropic')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                provider === 'anthropic' 
                  ? 'bg-primary text-white shadow-lg' 
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Anthropic Claude
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-zinc-400 mb-2">
              {provider === 'gemini' ? 'Google Gemini API Key' : 'Anthropic API Key'}
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => {
                setKey(e.target.value);
                setError('');
              }}
              placeholder={provider === 'gemini' ? "AIzaSy..." : "sk-ant-..."}
              className="w-full bg-black/20 border border-border rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
            {error && (
              <div className="flex items-center gap-2 mt-2 text-red-400 text-xs">
                <AlertCircle className="w-3 h-3" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-6">
            <p className="text-xs text-blue-300 leading-relaxed">
              Your API key is used only for this session and is not stored. 
              {provider === 'gemini' ? (
                <> You can get a free key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">Google AI Studio</a>.</>
              ) : (
                <> You can get a key from <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-white">Anthropic Console</a>.</>
              )}
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="bg-primary hover:bg-primaryHover text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
            >
              <Check className="w-4 h-4" />
              Save Key
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApiKeyModal;
