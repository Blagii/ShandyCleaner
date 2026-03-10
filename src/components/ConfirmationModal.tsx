import React from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'danger' | 'success';
  onConfirm: () => void;
  onCancel?: () => void;
}

interface ConfirmationModalProps {
  isOpen: boolean;
  options: ConfirmationOptions | null;
  onClose: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, options, onClose }) => {
  if (!isOpen || !options) return null;

  const getIcon = () => {
    switch (options.type) {
      case 'danger': return <XCircle className="w-6 h-6 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-6 h-6 text-amber-500" />;
      case 'success': return <CheckCircle className="w-6 h-6 text-emerald-500" />;
      default: return <Info className="w-6 h-6 text-blue-500" />;
    }
  };

  const getConfirmButtonClass = () => {
    switch (options.type) {
      case 'danger': return 'bg-red-500 hover:bg-red-600';
      case 'warning': return 'bg-amber-500 hover:bg-amber-600';
      case 'success': return 'bg-emerald-500 hover:bg-emerald-600';
      default: return 'bg-primary hover:bg-primaryHover';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-zinc-900 border border-white/10 rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 pt-1">
                  {getIcon()}
                </div>
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold text-white mb-2">{options.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{options.message}</p>
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={() => {
                    if (options.onCancel) options.onCancel();
                    onClose();
                  }}
                  className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                >
                  {options.cancelText || 'Cancel'}
                </button>
                <button
                  onClick={() => {
                    options.onConfirm();
                    onClose();
                  }}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-lg ${getConfirmButtonClass()}`}
                >
                  {options.confirmText || 'Confirm'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;
