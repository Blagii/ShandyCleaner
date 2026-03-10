import React, { useEffect, useState } from 'react';
import { X, Info, AlertTriangle, CheckCircle, AlertOctagon } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';

const PopupNotification = () => {
  const { popupNotification } = useConfig();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (popupNotification.enabled && popupNotification.message) {
      // Check if this specific message has been dismissed in this session
      const dismissed = sessionStorage.getItem(`shandy_popup_dismissed_${popupNotification.message}`);
      if (!dismissed) {
        setIsVisible(true);
      }
    } else {
      setIsVisible(false);
    }
  }, [popupNotification]);

  const handleClose = () => {
    setIsVisible(false);
    // Remember dismissal for this session
    sessionStorage.setItem(`shandy_popup_dismissed_${popupNotification.message}`, 'true');
  };

  if (!isVisible) return null;

  const getIcon = () => {
    switch (popupNotification.type) {
      case 'warning': return <AlertTriangle className="w-6 h-6 text-amber-500" />;
      case 'error': return <AlertOctagon className="w-6 h-6 text-red-500" />;
      case 'success': return <CheckCircle className="w-6 h-6 text-emerald-500" />;
      default: return <Info className="w-6 h-6 text-blue-500" />;
    }
  };

  const getBorderColor = () => {
    return 'border-white/10';
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-bottom-4 duration-300 max-w-sm w-full">
      <div className={`bg-zinc-900 border ${getBorderColor()} rounded-xl shadow-2xl p-4 flex gap-4 relative overflow-hidden`}>
        <div className="flex-shrink-0 pt-1">
          {getIcon()}
        </div>
        <div className="flex-grow pr-6">
          <p className="text-sm text-zinc-200 leading-relaxed">
            {popupNotification.message}
          </p>
        </div>
        <button 
          onClick={handleClose}
          className="absolute top-2 right-2 text-zinc-500 hover:text-white transition-colors p-1 rounded-md hover:bg-white/5"
        >
          <X className="w-4 h-4" />
        </button>
        
        {/* Progress bar for auto-dismiss could go here if desired */}
      </div>
    </div>
  );
};

export default PopupNotification;
