import { useState, useEffect } from 'react';

export const useAdBlockDetector = () => {
  const [isAdBlockEnabled, setIsAdBlockEnabled] = useState(false);

  useEffect(() => {
    // Method 1: Create a bait element
    const bait = document.createElement('div');
    bait.className = 'adsbox pub_300x250 ads-business-ad';
    bait.style.position = 'absolute';
    bait.style.left = '-10000px';
    bait.style.top = '-1000px';
    bait.style.width = '1px';
    bait.style.height = '1px';
    bait.innerHTML = '&nbsp;'; // Ensure it has content
    document.body.appendChild(bait);

    // Method 2: Check if Google Ads script loaded (optional, but good for AdSense)
    const checkAds = async () => {
      let detected = false;

      // 1. DOM Check (Bait Element)
      const baitStyle = window.getComputedStyle(bait);
      if (
        baitStyle.display === 'none' ||
        baitStyle.visibility === 'hidden' ||
        bait.offsetParent === null
      ) {
        detected = true;
      }

      // 2. Network Check (Try to fetch the AdSense script)
      // REMOVED: This causes false positives if the user has network issues or DNS blocking (Pi-hole)
      // which they might not consider an "extension".
      /*
      if (!detected) {
        try {
          const request = new Request(
            'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
            { method: 'HEAD', mode: 'no-cors' }
          );
          await fetch(request);
        } catch (e) {
          // If the request fails (e.g., blocked by extension), it throws an error
          detected = true;
        }
      }
      */

      if (detected) {
        setIsAdBlockEnabled(true);
      }
      
      // Cleanup
      try {
        document.body.removeChild(bait);
      } catch (e) {
        // Ignore
      }
    };

    // Delay check to allow extensions to run
    const timer = setTimeout(checkAds, 2000);

    return () => clearTimeout(timer);
  }, []);

  return isAdBlockEnabled;
};
