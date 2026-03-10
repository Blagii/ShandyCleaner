import React, { createContext, useContext, useState, useEffect } from 'react';

interface Stats {
  totalFilesProcessed: number;
  totalBytesSaved: number;
  totalErrors: number;
  totalVisits: number;
  lastRun: string | null;
}

interface AdSenseConfig {
  clientId: string;
  slotTop: string;
  slotBottom: string;
}

interface PopupNotification {
  enabled: boolean;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

interface AppConfig {
  systemInstruction: string;
  models: string[]; // Deprecated, kept for backward compatibility if needed, or mapped to geminiModels
  geminiModels: string[];
  anthropicModels: string[];
  stats: Stats;
  adSense: AdSenseConfig;
  maintenanceMode: boolean;
  announcement: string;
  popupNotification: PopupNotification;
  privacyPolicy: string;
  termsOfService: string;
  version: string;
  analyticsId: string;
  updateSystemInstruction: (instruction: string) => void;
  updateModels: (models: string[]) => void;
  updateGeminiModels: (models: string[]) => void;
  updateAnthropicModels: (models: string[]) => void;
  updateAdSense: (config: AdSenseConfig) => void;
  incrementStats: (files: number, bytesSaved: number, errors: number) => void;
  resetStats: () => Promise<void>;
  toggleMaintenanceMode: (enabled: boolean) => void;
  updateAnnouncement: (message: string) => void;
  updatePopupNotification: (config: PopupNotification) => void;
  updatePrivacyPolicy: (text: string) => void;
  updateTermsOfService: (text: string) => void;
  updateVersion: (version: string) => void;
  updateAnalyticsId: (id: string) => void;
}

const DEFAULT_SYSTEM_INSTRUCTION = `
Act as a specific code cleaner tool for FiveM (GTA V) Lua/JS scripts.
Your instruction is: "Clean up the code here, leaving nothing behind and keeping all the functionality with all the lines of code."

GUIDELINES:
1. INTEGRITY: Do NOT remove any logic, conditional checks, or event handlers. The code must function exactly as before.
2. FORMATTING: Re-indent code (standard 4 spaces or tab), fix bracket alignment, and remove excessive vertical whitespace.
3. DE-OBFUSCATION: If variables are named like '_0x2A...' or illogically, attempt to rename them to readable English based on context (e.g., 'playerPed', 'vehicle').
4. SYNTAX: Ensure valid Lua 5.4 or JavaScript syntax. Fix missing semicolons in JS or 'then/end' closures in Lua.
5. COMMENTS: Keep existing helpful comments. Remove commented-out code ONLY if it is clearly garbage/obfuscation junk.

OUTPUT:
Return ONLY the raw cleaned code. Do NOT wrap in markdown blocks.
`;

const DEFAULT_PRIVACY_POLICY = `
### 1. Data Collection & Security
Shandy Cleaner operates primarily as a client-side application. Your code snippets and files are processed locally in your browser before being sent to the Google Gemini API for cleaning. We do not store, save, or share your code on our own servers.

### 2. API Usage
This application uses the Google Gemini API to process your code. By using this tool, you acknowledge that your input data is sent to Google's servers for processing. Please refer to Google's Privacy Policy for information on how they handle data.

### 3. Cookies & Local Storage
We use local storage to save your preferences (such as your API key) on your own device. We also use third-party cookies for Google AdSense to serve relevant advertisements. You can manage your cookie preferences through your browser settings.

### 4. Third-Party Services
We use Google AdSense to display ads. Google may use cookies to serve ads based on your prior visits to this website or other websites. You may opt out of personalized advertising by visiting Google Ads Settings.
`;

const DEFAULT_TERMS_OF_SERVICE = `
### 1. Acceptance of Terms
By accessing and using Shandy Cleaner, you accept and agree to be bound by the terms and provision of this agreement.

### 2. Disclaimer of Warranty
This tool is provided "as is" without warranty of any kind. While we strive for accuracy, the AI-generated code cleaning may occasionally produce errors or unexpected results. **Always backup your code before using this tool.** We are not responsible for any data loss or damage to your scripts.

### 3. Intellectual Property
Shandy Cleaner is an independent tool and is not affiliated with, endorsed by, or connected to Rockstar Games, Take-Two Interactive, or Cfx.re (FiveM). All trademarks are property of their respective owners.

### 4. Prohibited Use
You agree not to use this service for any unlawful purpose or to process malicious code. We reserve the right to restrict access to users who violate these terms.
`;

const DEFAULT_MODELS = ['gemini-3-flash-preview', 'gemini-2.5-flash'];
const DEFAULT_GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash'];
const DEFAULT_ANTHROPIC_MODELS = ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'];

const DEFAULT_ADSENSE: AdSenseConfig = {
  clientId: import.meta.env.VITE_GOOGLE_ADSENSE_CLIENT_ID || '',
  slotTop: import.meta.env.VITE_ADSENSE_SLOT_TOP || '',
  slotBottom: '',
};

const DEFAULT_STATS: Stats = {
  totalFilesProcessed: 0,
  totalBytesSaved: 0,
  totalErrors: 0,
  totalVisits: 0,
  lastRun: null,
};

const ConfigContext = createContext<AppConfig | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize state with defaults
  const [systemInstruction, setSystemInstruction] = useState<string>(DEFAULT_SYSTEM_INSTRUCTION);
  const [models, setModels] = useState<string[]>(DEFAULT_MODELS);
  const [geminiModels, setGeminiModels] = useState<string[]>(DEFAULT_GEMINI_MODELS);
  const [anthropicModels, setAnthropicModels] = useState<string[]>(DEFAULT_ANTHROPIC_MODELS);
  const [adSense, setAdSense] = useState<AdSenseConfig>(DEFAULT_ADSENSE);
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [announcement, setAnnouncement] = useState<string>('');
  const [popupNotification, setPopupNotification] = useState<PopupNotification>({ enabled: false, message: '', type: 'info' });
  const [privacyPolicy, setPrivacyPolicy] = useState<string>(DEFAULT_PRIVACY_POLICY);
  const [termsOfService, setTermsOfService] = useState<string>(DEFAULT_TERMS_OF_SERVICE);
  const [version, setVersion] = useState<string>('v1.0');
  const [analyticsId, setAnalyticsId] = useState<string>(import.meta.env.VITE_ANALYTICS_ID || '');

  // Fetch config from server
  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data.systemInstruction) setSystemInstruction(data.systemInstruction);
        if (data.models) setModels(data.models);
        if (data.geminiModels) setGeminiModels(data.geminiModels);
        if (data.anthropicModels) setAnthropicModels(data.anthropicModels);
        if (data.adSense) setAdSense(data.adSense);
        if (data.maintenanceMode !== undefined) setMaintenanceMode(data.maintenanceMode);
        if (data.announcement !== undefined) setAnnouncement(data.announcement);
        if (data.popupNotification) setPopupNotification(data.popupNotification);
        if (data.privacyPolicy) setPrivacyPolicy(data.privacyPolicy);
        if (data.termsOfService) setTermsOfService(data.termsOfService);
        if (data.version) setVersion(data.version);
        if (data.analyticsId) setAnalyticsId(data.analyticsId);
      })
      .catch(err => console.error('Failed to fetch config:', err));

    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error('Failed to fetch stats:', err));
  }, []);

  // Real-time updates via SSE
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    const connectSSE = () => {
      eventSource = new EventSource('/api/config/stream');

      eventSource.onmessage = (event) => {
        try {
          const updates = JSON.parse(event.data);
          if (updates.systemInstruction) setSystemInstruction(updates.systemInstruction);
          if (updates.models) setModels(updates.models);
          if (updates.geminiModels) setGeminiModels(updates.geminiModels);
          if (updates.anthropicModels) setAnthropicModels(updates.anthropicModels);
          if (updates.adSense) setAdSense(updates.adSense);
          if (updates.maintenanceMode !== undefined) setMaintenanceMode(updates.maintenanceMode);
          if (updates.announcement !== undefined) setAnnouncement(updates.announcement);
          if (updates.popupNotification) setPopupNotification(updates.popupNotification);
          if (updates.privacyPolicy) setPrivacyPolicy(updates.privacyPolicy);
          if (updates.termsOfService) setTermsOfService(updates.termsOfService);
          if (updates.version) setVersion(updates.version);
          if (updates.analyticsId) setAnalyticsId(updates.analyticsId);
        } catch (e) {
          console.error('Failed to parse SSE update:', e);
        }
      };

      eventSource.onerror = (err) => {
        eventSource?.close();
        // Retry connection after 5 seconds
        reconnectTimeout = setTimeout(connectSSE, 5000);
      };
    };

    connectSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  const updateConfig = (key: string, value: any) => {
    fetch('/api/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value })
    }).catch(err => console.error(`Failed to update ${key}:`, err));
  };

  const updateSystemInstruction = (instruction: string) => {
    setSystemInstruction(instruction);
    updateConfig('systemInstruction', instruction);
  };

  const updateModels = (newModels: string[]) => {
    setModels(newModels);
    updateConfig('models', newModels);
  };

  const updateGeminiModels = (newModels: string[]) => {
    setGeminiModels(newModels);
    updateConfig('geminiModels', newModels);
  };

  const updateAnthropicModels = (newModels: string[]) => {
    setAnthropicModels(newModels);
    updateConfig('anthropicModels', newModels);
  };

  const updateAdSense = (config: AdSenseConfig) => {
    setAdSense(config);
    updateConfig('adSense', config);
  };

  const incrementStats = (files: number, bytesSaved: number, errors: number) => {
    fetch('/api/stats/increment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files, bytes: bytesSaved, errors })
    })
    .then(res => res.json())
    .then(newStats => setStats(newStats))
    .catch(err => console.error('Failed to increment stats:', err));
  };

  const resetStats = () => {
    return fetch('/api/stats/reset', { method: 'POST' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to reset stats');
        return res.json();
      })
      .then(newStats => setStats(newStats))
      .catch(err => {
        console.error('Failed to reset stats:', err);
        throw err;
      });
  };

  const toggleMaintenanceMode = (enabled: boolean) => {
    setMaintenanceMode(enabled);
    updateConfig('maintenanceMode', enabled);
  };

  const updateAnnouncement = (message: string) => {
    setAnnouncement(message);
    updateConfig('announcement', message);
  };

  const updatePopupNotification = (config: PopupNotification) => {
    setPopupNotification(config);
    updateConfig('popupNotification', config);
  };

  const updatePrivacyPolicy = (text: string) => {
    setPrivacyPolicy(text);
    updateConfig('privacyPolicy', text);
  };

  const updateTermsOfService = (text: string) => {
    setTermsOfService(text);
    updateConfig('termsOfService', text);
  };

  const updateVersion = (newVersion: string) => {
    setVersion(newVersion);
    updateConfig('version', newVersion);
  };

  const updateAnalyticsId = (id: string) => {
    setAnalyticsId(id);
    updateConfig('analyticsId', id);
  };

  return (
    <ConfigContext.Provider value={{
      systemInstruction,
      models,
      geminiModels,
      anthropicModels,
      stats,
      adSense,
      maintenanceMode,
      announcement,
      popupNotification,
      privacyPolicy,
      termsOfService,
      version,
      analyticsId,
      updateSystemInstruction,
      updateModels,
      updateGeminiModels,
      updateAnthropicModels,
      updateAdSense,
      incrementStats,
      resetStats,
      toggleMaintenanceMode,
      updateAnnouncement,
      updatePopupNotification,
      updatePrivacyPolicy,
      updateTermsOfService,
      updateVersion,
      updateAnalyticsId
    }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};
