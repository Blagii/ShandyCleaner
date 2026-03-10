import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, ArrowLeft, Loader2 } from 'lucide-react';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (!email) {
      setError('Email is required');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (res.ok) {
        setIsVerifying(true);
      } else {
        const err = await res.json();
        setError(err.error || 'Failed to send verification code');
      }
    } catch (e) {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, code: verificationCode })
      });

      if (res.ok) {
        const data = await res.json();
        login(data.user, data.token);
        navigate('/');
      } else {
        const err = await res.json();
        setError(err.error || 'Registration failed');
      }
    } catch (e) {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-xl p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <UserPlus className="w-6 h-6" />
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-white text-center mb-2">Create Account</h2>
        <p className="text-zinc-500 text-center mb-6 text-sm">Join Shandy Cleaner to save your preferences.</p>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm mb-4 text-center">
            {error}
          </div>
        )}

        {!isVerifying ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-surfaceHighlight border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="Choose a username"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-surfaceHighlight border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="Enter your email"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surfaceHighlight border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="Create a password"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-surfaceHighlight border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors"
                placeholder="Confirm your password"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primaryHover text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="text-center mb-4">
              <p className="text-sm text-zinc-300">We sent a verification code to <span className="text-primary">{email}</span></p>
              <button 
                type="button" 
                onClick={() => setIsVerifying(false)} 
                className="text-xs text-zinc-500 hover:text-white mt-2 underline"
              >
                Change email
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Verification Code</label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full bg-surfaceHighlight border border-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors text-center tracking-widest text-lg"
                placeholder="123456"
                maxLength={6}
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Create Account'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center space-y-4">
          <p className="text-sm text-zinc-500">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline">Sign in</Link>
          </p>
          <div>
             <Link to="/" className="text-xs text-zinc-500 hover:text-white transition-colors inline-flex items-center gap-1">
               <ArrowLeft className="w-3 h-3" /> Return to Home
             </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
