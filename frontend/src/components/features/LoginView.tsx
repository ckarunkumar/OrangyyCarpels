import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

const STORAGE_KEY = 'oc_remember_credentials';

export default function LoginView() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.email) setEmail(parsed.email);
        if (parsed.password) setPassword(parsed.password);
        setRememberMe(true);
      }
    } catch {
      // Ignore storage read errors
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your studio email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    setLoading(true);
    setError(null);

    const result = await login(email.trim().toLowerCase(), password, rememberMe);
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Authentication failed.');
    } else {
      try {
        if (rememberMe) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ email: email.trim().toLowerCase(), password }));
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch {
        // Ignore storage write errors
      }
    }
  };

  return (
    <div className="min-h-screen bg-studio-bg flex flex-col justify-center items-center font-sans p-6">
      <div className="w-full max-w-[380px] space-y-5">
        {/* Logo and Intro */}
        <div className="text-center space-y-2">
          <img
            src="/logo.svg"
            alt="Orangyy Carpels"
            className="w-11 h-11 object-contain mx-auto transition-transform hover:scale-105"
          />
          <div>
            <h2 className="text-[19px] font-bold tracking-tight text-studio-text">Sign in to Orangyy Carpels</h2>
            <p className="text-[12px] text-studio-muted">Studio operations, timesheets & resource billing</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-studio-border rounded-lg p-6 space-y-4 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label htmlFor="email" className="text-[11px] font-bold text-studio-muted uppercase tracking-wider">
                Studio Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-studio-muted" />
                <input
                  id="email"
                  type="email"
                  placeholder="name@orangy.design"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-studio-border rounded bg-studio-bg/10 text-[13px] focus:outline-none focus:border-brand-orange focus:bg-white text-studio-text"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="text-[11px] font-bold text-studio-muted uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-studio-muted" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="•••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 border border-studio-border rounded bg-studio-bg/10 text-[13px] focus:outline-none focus:border-brand-orange focus:bg-white text-studio-text"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-studio-muted hover:text-studio-text cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-studio-border text-brand-orange focus:ring-brand-orange cursor-pointer"
                />
                <span className="text-[11.5px] text-studio-text font-medium">Save password & keep active (15 days)</span>
              </label>
            </div>

            {error && (
              <div className="p-2.5 border border-red-200 bg-red-50 text-red-700 rounded text-[11px] font-medium flex items-start gap-1.5 leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-orange text-white rounded py-2 text-[12px] font-semibold hover:bg-opacity-95 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-2xs mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

