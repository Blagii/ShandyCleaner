import ReactGA from 'react-ga4';

let isInitialized = false;
let currentAnalyticsId = import.meta.env.VITE_ANALYTICS_ID || '';

export const initAnalytics = (id?: string) => {
  const analyticsId = id || currentAnalyticsId;
  
  if (analyticsId && !isInitialized) {
    ReactGA.initialize(analyticsId);
    isInitialized = true;
    currentAnalyticsId = analyticsId;
    console.log('Analytics initialized with ID:', analyticsId);
  } else if (analyticsId && analyticsId !== currentAnalyticsId) {
    // Re-initialize if ID changes (though ReactGA might not support full reset, we can try init again)
    ReactGA.initialize(analyticsId);
    currentAnalyticsId = analyticsId;
    console.log('Analytics re-initialized with ID:', analyticsId);
  }
};

export const trackPageView = (path: string) => {
  if (isInitialized) {
    ReactGA.send({ hitType: 'pageview', page: path });
  }
};

export const trackEvent = (category: string, action: string, label?: string) => {
  if (isInitialized) {
    ReactGA.event({
      category,
      action,
      label,
    });
  }
};
