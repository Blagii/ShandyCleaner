import React, { useEffect, useRef } from 'react';

interface AdUnitProps {
  slotId?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  className?: string;
  style?: React.CSSProperties;
  label?: string; // For placeholder/debug mode
}

const AdUnit: React.FC<AdUnitProps> = ({ 
  slotId, 
  format = 'auto', 
  className, 
  style,
  label = "Advertisement"
}) => {
  const clientId = import.meta.env.VITE_GOOGLE_ADSENSE_CLIENT_ID;
  const adRef = useRef<HTMLModElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!clientId || !slotId || initialized.current || !adRef.current) return;

    const pushAd = () => {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        initialized.current = true;
      } catch (e) {
        console.error("AdSense push error:", e);
      }
    };

    // Only push if visible and has width
    if (adRef.current.offsetWidth > 0) {
      pushAd();
    } else {
      // Wait for layout
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect.width > 0 && !initialized.current) {
            pushAd();
            observer.disconnect();
          }
        }
      });
      
      observer.observe(adRef.current);
      return () => observer.disconnect();
    }
  }, [clientId, slotId]);

  // If no client ID is configured, we don't render anything (or could render a placeholder in dev)
  if (!clientId) return null;
  
  // If client ID exists but no slot, we can't render a specific unit
  if (!slotId) return null;

  return (
    <div className={`w-full flex justify-center my-4 overflow-hidden ${className || ''}`} style={{ minHeight: '90px', ...style }}>
       {/* AdSense Unit */}
       <ins ref={adRef}
            className="adsbygoogle"
            style={{ display: 'block', width: '100%', minHeight: '90px' }}
            data-ad-client={clientId}
            data-ad-slot={slotId}
            data-ad-format={format}
            data-full-width-responsive="true"></ins>
    </div>
  );
};

export default AdUnit;
