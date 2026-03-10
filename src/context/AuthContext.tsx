import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  email?: string;
  role: 'admin' | 'editor';
  apiKey?: string; // Legacy/Default (Gemini)
  apiKeys?: {
    gemini?: string;
    anthropic?: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateApiKey: (key: string, provider?: 'gemini' | 'anthropic') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        
        // Fetch API keys separately
        try {
          const keyRes = await fetch('/api/users/me/api-keys');
          if (keyRes.ok) {
            const { apiKeys } = await keyRes.json();
            data.user.apiKeys = apiKeys;
            data.user.apiKey = apiKeys.gemini; // Default for backward compat
          }
        } catch (e) {
          console.error('Failed to fetch API keys', e);
        }

        setUser(data.user);
      } else {
        setUser(null);
        setToken(null);
      }
    } catch (e) {
      console.error('Auth check failed', e);
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (userData: User, authToken: string) => {
    // Fetch API keys on login
    try {
      const keyRes = await fetch('/api/users/me/api-keys', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (keyRes.ok) {
        const { apiKeys } = await keyRes.json();
        userData.apiKeys = apiKeys;
        userData.apiKey = apiKeys.gemini;
      }
    } catch (e) {
      console.error('Failed to fetch API keys on login', e);
    }

    setUser(userData);
    setToken(authToken);
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setToken(null);
    } catch (e) {
      console.error('Logout failed', e);
    }
  };

  const updateApiKey = async (key: string, provider: 'gemini' | 'anthropic' = 'gemini') => {
    try {
      const res = await fetch('/api/users/me/api-key', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key, provider })
      });
      
      if (res.ok) {
        setUser(prev => {
          if (!prev) return null;
          const newApiKeys = { ...prev.apiKeys, [provider]: key };
          return { 
            ...prev, 
            apiKeys: newApiKeys,
            apiKey: provider === 'gemini' ? key : prev.apiKey 
          };
        });
      } else {
        throw new Error('Failed to update API key');
      }
    } catch (e) {
      console.error('Update API key failed', e);
      throw e;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      checkAuth,
      updateApiKey
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
