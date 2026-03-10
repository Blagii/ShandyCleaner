import React, { useState, useEffect } from 'react';
import { useConfig } from '../context/ConfigContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useConfirmation } from '../context/ConfirmationContext';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Settings,
  FileText,
  Save,
  ArrowLeft,
  Activity,
  Database,
  ShieldAlert,
  Lock,
  Users,
  Power,
  Megaphone,
  Trash2,
  AlertTriangle,
  Plus,
  X,
  Loader2,
  Menu,
  FileCode as FileCodeIcon // Avoid conflict if any
} from 'lucide-react';

interface User {
  id: string;
  username: string;
  email?: string;
  role: 'admin' | 'editor';
  createdAt: string;
}

const Admin = () => {
  const {
    systemInstruction,
    updateSystemInstruction,
    geminiModels,
    updateGeminiModels,
    anthropicModels,
    updateAnthropicModels,
    stats,
    resetStats,
    adSense,
    updateAdSense,
    maintenanceMode,
    toggleMaintenanceMode,
    announcement,
    updateAnnouncement,
    popupNotification,
    updatePopupNotification,
    privacyPolicy,
    updatePrivacyPolicy,
    termsOfService,
    updateTermsOfService,
    version,
    updateVersion,
    analyticsId,
    updateAnalyticsId
  } = useConfig();

  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  const { addToast } = useToast();
  const { confirm } = useConfirmation();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings' | 'system' | 'users' | 'legal' | 'email'>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'editor', email: '' });
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [emailTemplates, setEmailTemplates] = useState<any[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editUserForm, setEditUserForm] = useState({ username: '', email: '', password: '', role: 'editor' });

  const handleEditUserClick = (user: User) => {
    setEditingUser(user);
    setEditUserForm({
      username: user.username,
      email: user.email || '',
      password: '', // Don't pre-fill password
      role: user.role
    });
    setIsEditUserModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editUserForm)
      });

      if (res.ok) {
        addToast('User updated successfully', 'success');
        setIsEditUserModalOpen(false);
        setEditingUser(null);
        fetchUsers();
      } else {
        const err = await res.json();
        addToast(err.error || 'Failed to update user', 'error');
      }
    } catch (e) {
      addToast('Failed to update user', 'error');
    }
  };

  const fetchSystemStatus = async () => {
    // Already handled by ConfigContext and its useConfig hook
  };

  const [localInstruction, setLocalInstruction] = useState(systemInstruction || '');
  const [localGeminiModels, setLocalGeminiModels] = useState((geminiModels || []).join(', '));
  const [localAnthropicModels, setLocalAnthropicModels] = useState((anthropicModels || []).join(', '));
  const [localAdSense, setLocalAdSense] = useState(adSense || { clientId: '', slotTop: '', slotBottom: '' });
  const [localAnnouncement, setLocalAnnouncement] = useState(announcement || '');
  const [localPopupNotification, setLocalPopupNotification] = useState(popupNotification || { enabled: false, message: '', type: 'info' });
  const [localPrivacyPolicy, setLocalPrivacyPolicy] = useState(privacyPolicy || '');
  const [localTermsOfService, setLocalTermsOfService] = useState(termsOfService || '');
  const [localVersion, setLocalVersion] = useState(version || 'v1.0');
  const [localAnalyticsId, setLocalAnalyticsId] = useState(analyticsId || '');

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin' && activeTab === 'users') {
      fetchUsers();
    }
  }, [isAuthenticated, user, activeTab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user.role === 'admin') {
          login(data.user, data.token);
        } else {
          addToast('Access denied: Admins only', 'error');
        }
      } else {
        addToast('Invalid credentials', 'error');
      }
    } catch (e) {
      addToast('Login failed', 'error');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch('/api/users');
      if (res.status === 401) {
        logout();
        navigate('/');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error('Failed to fetch users', e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchEmailTemplates = async () => {
    console.log('Fetching email templates...');
    setIsLoadingTemplates(true);
    try {
      const res = await fetch('/api/system/email-templates');
      console.log('Fetch response status:', res.status);

      if (res.status === 401) {
        logout();
        navigate('/');
        return;
      }

      if (res.ok) {
        const data = await res.json();
        console.log('Fetched templates:', data);
        setEmailTemplates(data);
      } else {
        console.error('Failed to fetch templates:', await res.text());
      }
    } catch (e) {
      console.error('Failed to fetch templates', e);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const handleUpdateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;

    try {
      const res = await fetch(`/api/system/email-templates/${editingTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: editingTemplate.subject, html: editingTemplate.html })
      });

      if (res.ok) {
        addToast('Template updated successfully', 'success');
        setEditingTemplate(null);
        fetchEmailTemplates();
      } else {
        addToast('Failed to update template', 'error');
      }
    } catch (e) {
      addToast('Error updating template', 'error');
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      if (activeTab === 'users') fetchUsers();
      if (activeTab === 'email') fetchEmailTemplates();
    }
  }, [activeTab, isAuthenticated, user]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });

      if (res.ok) {
        setNewUser({ username: '', password: '', role: 'editor', email: '' });
        setIsAddingUser(false);
        fetchUsers();
        addToast('User created successfully', 'success');
      } else {
        const err = await res.json();
        addToast(err.error || 'Failed to create user', 'error');
      }
    } catch (e) {
      addToast('Failed to create user', 'error');
    }
  };

  const handleDeleteUser = async (id: string) => {
    confirm({
      title: 'Delete User',
      message: 'Are you sure you want to delete this user? This action cannot be undone.',
      confirmText: 'Delete',
      type: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
          if (res.ok) {
            fetchUsers();
            addToast('User deleted successfully', 'success');
          } else {
            const err = await res.json();
            addToast(err.error || 'Failed to delete user', 'error');
          }
        } catch (e) {
          addToast('Failed to delete user', 'error');
        }
      }
    });
  };

  const handleResetStats = async () => {
    confirm({
      title: 'Reset Statistics',
      message: 'Are you sure you want to reset all statistics? This cannot be undone.',
      confirmText: 'Reset',
      type: 'danger',
      onConfirm: async () => {
        try {
          await resetStats();
          addToast('Statistics have been reset successfully.', 'success');
        } catch (error) {
          addToast('Failed to reset statistics. Please try again.', 'error');
        }
      }
    });
  };

  const handleSendMaintenanceAlert = async () => {
    if (!maintenanceMessage.trim()) {
      addToast('Please enter a message.', 'warning');
      return;
    }

    confirm({
      title: 'Send Maintenance Alert',
      message: 'Are you sure you want to send this alert to ALL users via email?',
      confirmText: 'Send Alert',
      type: 'warning',
      onConfirm: async () => {
        setIsSendingAlert(true);
        try {
          const res = await fetch('/api/system/maintenance-alert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: maintenanceMessage })
          });

          const data = await res.json();
          if (res.ok) {
            addToast(data.message, 'success');
            setMaintenanceMessage('');
          } else {
            addToast(data.error || 'Failed to send alert', 'error');
          }
        } catch (e) {
          addToast('Failed to send alert', 'error');
        } finally {
          setIsSendingAlert(false);
        }
      }
    });
  };

  const handleSaveSettings = () => {
    updateSystemInstruction(localInstruction);
    updateGeminiModels(localGeminiModels.split(',').map(s => s.trim()).filter(Boolean));
    updateAnthropicModels(localAnthropicModels.split(',').map(s => s.trim()).filter(Boolean));
    updateAdSense(localAdSense);
    updateAnnouncement(localAnnouncement);
    updatePopupNotification({
      enabled: localPopupNotification.enabled,
      message: localPopupNotification.message,
      type: localPopupNotification.type as 'info' | 'warning' | 'error' | 'success'
    });
    updatePrivacyPolicy(localPrivacyPolicy);
    updateTermsOfService(localTermsOfService);
    updateVersion(localVersion);
    updateAnalyticsId(localAnalyticsId);
    addToast('Settings saved successfully!', 'success');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-surface border border-border rounded-xl p-8 w-full max-w-md shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Lock className="w-6 h-6" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-white text-center mb-2">Admin Access</h2>
          <p className="text-zinc-500 text-center mb-6 text-sm">Enter credentials to access configuration.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-surfaceHighlight border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors mb-3"
                placeholder="Username"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surfaceHighlight border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="Password"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-primary hover:bg-primaryHover text-white font-medium py-3 rounded-lg transition-colors"
            >
              Login
            </button>
            <div className="text-center">
              <Link to="/" className="text-xs text-zinc-500 hover:text-white transition-colors">Return to Home</Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background font-sans overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-surface border-b border-border flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-zinc-400 hover:text-white p-1"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <h1 className="text-lg font-semibold text-white">Admin Panel</h1>
        </div>
        <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-300">Logout</button>
      </div>

      {/* Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border flex flex-col transition-transform duration-300 ease-in-out
        md:static md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-16 flex items-center px-6 border-b border-border justify-between">
          <h1 className="text-lg font-semibold text-white">Admin Panel</h1>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-zinc-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
          <button onClick={handleLogout} className="hidden md:block text-xs text-red-400 hover:text-red-300">Logout</button>
        </div>

        <nav className="flex-grow p-4 space-y-2 overflow-y-auto">
          <button
            onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard'
              ? 'bg-primary/10 text-primary'
              : 'text-zinc-400 hover:text-white hover:bg-surfaceHighlight'
              }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={() => { setActiveTab('settings'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'settings'
              ? 'bg-primary/10 text-primary'
              : 'text-zinc-400 hover:text-white hover:bg-surfaceHighlight'
              }`}
          >
            <Settings className="w-4 h-4" />
            Configuration
          </button>
          <button
            onClick={() => { setActiveTab('system'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'system'
              ? 'bg-primary/10 text-primary'
              : 'text-zinc-400 hover:text-white hover:bg-surfaceHighlight'
              }`}
          >
            <Power className="w-4 h-4" />
            System Control
          </button>
          <button
            onClick={() => { setActiveTab('users'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users'
              ? 'bg-primary/10 text-primary'
              : 'text-zinc-400 hover:text-white hover:bg-surfaceHighlight'
              }`}
          >
            <Users className="w-4 h-4" />
            User Management
          </button>
          <button
            onClick={() => { setActiveTab('email'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'email'
              ? 'bg-primary/10 text-primary'
              : 'text-zinc-400 hover:text-white hover:bg-surfaceHighlight'
              }`}
          >
            <Megaphone className="w-4 h-4" />
            Email Templates
          </button>
          <button
            onClick={() => { setActiveTab('legal'); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'legal'
              ? 'bg-primary/10 text-primary'
              : 'text-zinc-400 hover:text-white hover:bg-surfaceHighlight'
              }`}
          >
            <FileText className="w-4 h-4" />
            Legal Documents
          </button>
        </nav>

        <div className="p-4 border-t border-border">
          <Link
            to="/"
            className="flex items-center gap-2 text-zinc-500 hover:text-white text-sm transition-colors px-4 py-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to App
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-8 overflow-y-auto pt-20 md:pt-8 w-full">
        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-white">Overview</h2>
              <button
                onClick={handleResetStats}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors border border-red-500/20"
              >
                <Trash2 className="w-4 h-4" /> Reset Stats
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-surface border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-zinc-400 text-sm font-medium">Files Processed</h3>
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <p className="text-3xl font-bold text-white">{stats?.totalFilesProcessed || 0}</p>
                <p className="text-xs text-zinc-500 mt-2">Total files cleaned locally</p>
              </div>

              <div className="bg-surface border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-zinc-400 text-sm font-medium">Data Saved</h3>
                  <Database className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-3xl font-bold text-white">{((stats?.totalBytesSaved || 0) / 1024).toFixed(2)} KB</p>
                <p className="text-xs text-zinc-500 mt-2">Total size reduction</p>
              </div>

              <div className="bg-surface border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-zinc-400 text-sm font-medium">Errors</h3>
                  <ShieldAlert className="w-5 h-5 text-red-400" />
                </div>
                <p className="text-3xl font-bold text-white">{stats?.totalErrors || 0}</p>
                <p className="text-xs text-zinc-500 mt-2">Failed processing attempts</p>
              </div>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> System Status
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-border/50">
                  <span className="text-zinc-400 text-sm">Last Activity</span>
                  <span className="text-white text-sm font-mono">{stats?.lastRun ? new Date(stats.lastRun).toLocaleString() : 'Never'}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-border/50">
                  <span className="text-zinc-400 text-sm">Active Models</span>
                  <span className="text-white text-sm font-mono">{(geminiModels?.length || 0) + (anthropicModels?.length || 0)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-border/50">
                  <span className="text-zinc-400 text-sm">AdSense Status</span>
                  <span className={`text-sm font-medium ${adSense.clientId ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    {adSense.clientId ? 'Configured' : 'Not Configured'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-border/50">
                  <span className="text-zinc-400 text-sm">Maintenance Mode</span>
                  <span className={`text-sm font-medium ${maintenanceMode ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {maintenanceMode ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-white">Configuration</h2>
              <button
                onClick={handleSaveSettings}
                className="bg-primary hover:bg-primaryHover text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>

            {/* AI Settings */}
            <div className="bg-surface border border-border rounded-xl p-6 space-y-6">
              <h3 className="text-lg font-medium text-white border-b border-border pb-2">AI Configuration</h3>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">System Instruction (Prompt)</label>
                <p className="text-xs text-zinc-500 mb-2">This prompt defines how the AI cleans and optimizes the code.</p>
                <textarea
                  value={localInstruction}
                  onChange={(e) => setLocalInstruction(e.target.value)}
                  className="w-full h-64 bg-surfaceHighlight border border-border rounded-lg p-4 text-sm font-mono text-zinc-300 focus:outline-none focus:border-primary custom-scrollbar"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Gemini Models (Fallback Chain)</label>
                <p className="text-xs text-zinc-500 mb-2">Comma-separated list of Gemini models to try in order.</p>
                <input
                  type="text"
                  value={localGeminiModels}
                  onChange={(e) => setLocalGeminiModels(e.target.value)}
                  className="w-full bg-surfaceHighlight border border-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Anthropic Models</label>
                <p className="text-xs text-zinc-500 mb-2">Comma-separated list of Anthropic models.</p>
                <input
                  type="text"
                  value={localAnthropicModels}
                  onChange={(e) => setLocalAnthropicModels(e.target.value)}
                  className="w-full bg-surfaceHighlight border border-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* AdSense Settings */}
            <div className="bg-surface border border-border rounded-xl p-6 space-y-6">
              <h3 className="text-lg font-medium text-white border-b border-border pb-2">AdSense Configuration</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Client ID (ca-pub-...)</label>
                  <input
                    type="text"
                    value={localAdSense.clientId}
                    onChange={(e) => setLocalAdSense({ ...localAdSense, clientId: e.target.value })}
                    className="w-full bg-surfaceHighlight border border-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Top Slot ID</label>
                  <input
                    type="text"
                    value={localAdSense.slotTop}
                    onChange={(e) => setLocalAdSense({ ...localAdSense, slotTop: e.target.value })}
                    className="w-full bg-surfaceHighlight border border-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-300">Bottom Slot ID</label>
                  <input
                    type="text"
                    value={localAdSense.slotBottom}
                    onChange={(e) => setLocalAdSense({ ...localAdSense, slotBottom: e.target.value })}
                    className="w-full bg-surfaceHighlight border border-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Google Analytics Settings */}
            <div className="bg-surface border border-border rounded-xl p-6 space-y-6">
              <h3 className="text-lg font-medium text-white border-b border-border pb-2">Google Analytics Configuration</h3>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Measurement ID (G-...)</label>
                <p className="text-xs text-zinc-500 mb-2">Enter your Google Analytics 4 Measurement ID to track user activity.</p>
                <input
                  type="text"
                  value={localAnalyticsId}
                  onChange={(e) => setLocalAnalyticsId(e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                  className="w-full bg-surfaceHighlight border border-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
            <h2 className="text-2xl font-semibold text-white">System Control</h2>

            {/* Maintenance Mode */}
            <div className="bg-surface border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium text-white flex items-center gap-2">
                    <Power className="w-5 h-5 text-amber-500" /> Maintenance Mode
                  </h3>
                  <p className="text-sm text-zinc-500 mt-1">
                    When active, users will see a maintenance screen instead of the app.
                  </p>
                </div>
                <button
                  onClick={() => toggleMaintenanceMode(!maintenanceMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface ${maintenanceMode ? 'bg-primary' : 'bg-zinc-700'
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${maintenanceMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>

              <div className="border-t border-border pt-6">
                <h4 className="text-sm font-medium text-white mb-2">Send Email Alert</h4>
                <p className="text-xs text-zinc-500 mb-4">Notify all registered users about upcoming maintenance.</p>
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={maintenanceMessage}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    placeholder="e.g., Scheduled maintenance in 1 hour..."
                    className="flex-grow bg-surfaceHighlight border border-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary"
                  />
                  <button
                    onClick={handleSendMaintenanceAlert}
                    disabled={isSendingAlert || !maintenanceMessage.trim()}
                    className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors border border-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSendingAlert ? <Loader2 className="w-4 h-4 animate-spin" /> : <Megaphone className="w-4 h-4" />}
                    Send Alert
                  </button>
                </div>
              </div>
            </div>

            {/* Announcements */}
            <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-blue-400" /> Global Announcement
                </h3>
                <button
                  onClick={handleSaveSettings}
                  className="text-xs bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-md transition-colors"
                >
                  Update Banner
                </button>
              </div>
              <p className="text-sm text-zinc-500">
                This message will appear as a banner at the top of the home page. Leave empty to disable.
              </p>
              <input
                type="text"
                value={localAnnouncement}
                onChange={(e) => setLocalAnnouncement(e.target.value)}
                placeholder="e.g., System maintenance scheduled for tonight..."
                className="w-full bg-surfaceHighlight border border-border rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-primary"
              />
            </div>

            {/* Popup Notification */}
            <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-emerald-400" /> Popup Notification
                </h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-400">Enabled</span>
                    <button
                      onClick={() => setLocalPopupNotification({ ...localPopupNotification, enabled: !localPopupNotification.enabled })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface ${localPopupNotification.enabled ? 'bg-primary' : 'bg-zinc-700'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localPopupNotification.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>
                  <button
                    onClick={handleSaveSettings}
                    className="text-xs bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-md transition-colors"
                  >
                    Update Popup
                  </button>
                </div>
              </div>
              <p className="text-sm text-zinc-500">
                This message will appear as a toast notification in the bottom right corner.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3">
                  <label className="text-xs font-medium text-zinc-400 mb-1 block">Message</label>
                  <input
                    type="text"
                    value={localPopupNotification.message}
                    onChange={(e) => setLocalPopupNotification({ ...localPopupNotification, message: e.target.value })}
                    placeholder="e.g., New features available!"
                    className="w-full bg-surfaceHighlight border border-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-400 mb-1 block">Type</label>
                  <select
                    value={localPopupNotification.type}
                    onChange={(e) => setLocalPopupNotification({ ...localPopupNotification, type: e.target.value as any })}
                    className="w-full bg-surfaceHighlight border border-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary"
                  >
                    <option value="info">Info (Blue)</option>
                    <option value="success">Success (Green)</option>
                    <option value="warning">Warning (Amber)</option>
                    <option value="error">Error (Red)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* System Version */}
            <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" /> System Version
                </h3>
                <button
                  onClick={handleSaveSettings}
                  className="text-xs bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-md transition-colors"
                >
                  Update Version
                </button>
              </div>
              <p className="text-sm text-zinc-500">
                Set the version number displayed in the footer (e.g., v1.0, v2.1-beta).
              </p>
              <input
                type="text"
                value={localVersion}
                onChange={(e) => setLocalVersion(e.target.value)}
                placeholder="e.g., v1.0"
                className="w-full bg-surfaceHighlight border border-border rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-primary"
              />
            </div>


          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-white">User Management</h2>
              <button
                onClick={() => setIsAddingUser(true)}
                className="bg-primary hover:bg-primaryHover text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add User
              </button>
            </div>

            {isAddingUser && (
              <div className="bg-surface border border-border rounded-xl p-6 mb-6 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-white">New User</h3>
                  <button onClick={() => setIsAddingUser(false)} className="text-zinc-500 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Username"
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                      className="bg-surfaceHighlight border border-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary"
                      required
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="bg-surfaceHighlight border border-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary"
                      required
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      className="bg-surfaceHighlight border border-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary"
                      required
                    />
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      className="bg-surfaceHighlight border border-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary"
                    >
                      <option value="editor">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="flex justify-end">
                    <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
                      Create User
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-surfaceHighlight text-zinc-400 font-medium">
                  <tr>
                    <th className="px-6 py-3">Username</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Created At</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-surfaceHighlight/50 transition-colors">
                      <td className="px-6 py-4 text-white font-medium">{user.username}</td>
                      <td className="px-6 py-4 text-zinc-400">{user.email || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'
                          }`}>
                          {user.role === 'editor' ? 'User' : user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEditUserClick(user)}
                            className="text-zinc-500 hover:text-primary transition-colors p-1"
                            title="Edit User"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && !isLoadingUsers && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'email' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-2xl font-semibold text-white mb-6">Email Templates</h2>

            {isLoadingTemplates ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Template List */}
                <div className="space-y-4">
                  {emailTemplates.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500 bg-surface border border-border rounded-xl">
                      <p>No templates found.</p>
                      <button
                        onClick={fetchEmailTemplates}
                        className="mt-2 text-primary hover:underline text-sm"
                      >
                        Retry
                      </button>
                    </div>
                  ) : (
                    emailTemplates.map((template) => (
                      <div
                        key={template.id}
                        onClick={() => setEditingTemplate(template)}
                        className={`bg-surface border rounded-xl p-4 cursor-pointer transition-all ${editingTemplate?.id === template.id
                          ? 'border-primary bg-surfaceHighlight'
                          : 'border-border hover:border-zinc-600'
                          }`}
                      >
                        <h3 className="text-lg font-medium text-white mb-1">{template.name}</h3>
                        <p className="text-sm text-zinc-500 mb-2">Subject: {template.subject}</p>
                        <div className="flex gap-2">
                          {template.variables.map((v: string) => (
                            <span key={v} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                              {`{{${v}}}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Editor */}
                <div className="bg-surface border border-border rounded-xl p-6 sticky top-8">
                  {editingTemplate ? (
                    <form onSubmit={handleUpdateTemplate} className="space-y-4">
                      <h3 className="text-lg font-medium text-white mb-4">Edit Template: {editingTemplate.name}</h3>

                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1.5">Subject Line</label>
                        <input
                          type="text"
                          value={editingTemplate.subject}
                          onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                          className="w-full bg-surfaceHighlight border border-border rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-1.5">HTML Content</label>
                        <textarea
                          value={editingTemplate.html}
                          onChange={(e) => setEditingTemplate({ ...editingTemplate, html: e.target.value })}
                          className="w-full h-96 bg-surfaceHighlight border border-border rounded-lg px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-primary resize-none"
                          required
                        />
                        <p className="text-xs text-zinc-500 mt-2">
                          Available variables: {editingTemplate.variables.map((v: string) => `{{${v}}}`).join(', ')}
                        </p>
                      </div>

                      <div className="flex justify-end gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => setEditingTemplate(null)}
                          className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="bg-primary hover:bg-primaryHover text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-500 py-12">
                      <FileText className="w-12 h-12 mb-4 opacity-20" />
                      <p>Select a template to edit</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'legal' && (
          <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-white">Legal Documents</h2>
              <button
                onClick={handleSaveSettings}
                className="bg-primary hover:bg-primaryHover text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6 space-y-6">
              <h3 className="text-lg font-medium text-white border-b border-border pb-2">Privacy Policy</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Content (Markdown Supported)</label>
                <p className="text-xs text-zinc-500 mb-2">Edit the privacy policy content. Use markdown for formatting.</p>
                <textarea
                  value={localPrivacyPolicy}
                  onChange={(e) => setLocalPrivacyPolicy(e.target.value)}
                  className="w-full h-96 bg-surfaceHighlight border border-border rounded-lg p-4 text-sm font-mono text-zinc-300 focus:outline-none focus:border-primary custom-scrollbar"
                />
              </div>
            </div>

            <div className="bg-surface border border-border rounded-xl p-6 space-y-6">
              <h3 className="text-lg font-medium text-white border-b border-border pb-2">Terms of Service</h3>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Content (Markdown Supported)</label>
                <p className="text-xs text-zinc-500 mb-2">Edit the terms of service content. Use markdown for formatting.</p>
                <textarea
                  value={localTermsOfService}
                  onChange={(e) => setLocalTermsOfService(e.target.value)}
                  className="w-full h-96 bg-surfaceHighlight border border-border rounded-lg p-4 text-sm font-mono text-zinc-300 focus:outline-none focus:border-primary custom-scrollbar"
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Edit User Modal */}
      {isEditUserModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-white">Edit User</h3>
              <button onClick={() => setIsEditUserModalOpen(false)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateUser}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Username</label>
                  <input
                    type="text"
                    value={editUserForm.username}
                    onChange={(e) => setEditUserForm({ ...editUserForm, username: e.target.value })}
                    className="w-full bg-surfaceHighlight border border-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={editUserForm.email}
                    onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                    className="w-full bg-surfaceHighlight border border-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">New Password (leave blank to keep current)</label>
                  <input
                    type="password"
                    value={editUserForm.password}
                    onChange={(e) => setEditUserForm({ ...editUserForm, password: e.target.value })}
                    className="w-full bg-surfaceHighlight border border-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Role</label>
                  <select
                    value={editUserForm.role}
                    onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value as any })}
                    className="w-full bg-surfaceHighlight border border-border rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-primary"
                  >
                    <option value="editor">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="bg-surfaceHighlight px-6 py-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditUserModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-primaryHover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
