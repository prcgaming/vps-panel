import React, { useState, useEffect } from 'react';
import { Server, Lock, Mail, User as UserIcon, ArrowRight, ShieldCheck, Sparkles, Orbit } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { currentTheme } = useTheme();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [panelName, setPanelName] = useState('Lunar VPS Panel');
  const [allowRegistration, setAllowRegistration] = useState(true);

  useEffect(() => {
    // Fetch public panel settings for branding & registration status
    api.getSettings()
      .then((res: any) => {
        if (res.settings) {
          if (res.settings.panel_name) setPanelName(res.settings.panel_name);
          if (res.settings.allow_registration !== undefined) {
            setAllowRegistration(res.settings.allow_registration === '1' || res.settings.allow_registration === 'true');
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        const res = await api.register({ name, email, password });
        login(res.token, res.user);
      } else {
        const res = await api.login(email, password);
        login(res.token, res.user);
      }
    } catch (err: any) {
      setError(err.message || (isRegister ? 'Registration failed' : 'Invalid email or password'));
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (demoEmail: string, demoPass: string) => {
    setIsRegister(false);
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-[#070a12] flex items-center justify-center p-6 relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Dynamic Background Neon Gradients & Glows based on Theme */}
      <div 
        className="absolute top-1/4 -left-20 w-96 h-96 rounded-full blur-[130px] pointer-events-none opacity-40 transition-colors duration-700"
        style={{ backgroundColor: currentTheme.primaryColor }}
      />
      <div 
        className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full blur-[130px] pointer-events-none opacity-30 transition-colors duration-700"
        style={{ backgroundColor: currentTheme.secondaryColor }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div 
            className={`inline-flex relative items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr ${currentTheme.previewGradient} shadow-2xl text-white mb-4 p-0.5`}
            style={{ boxShadow: `0 12px 30px -4px ${currentTheme.glowColor}` }}
          >
            <div className="w-full h-full bg-[#070a12]/80 backdrop-blur-md rounded-2xl flex items-center justify-center">
              <Orbit className={`w-8 h-8 ${currentTheme.textAccent} animate-[spin_12s_linear_infinite]`} />
            </div>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            {panelName}
            <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full ${currentTheme.bgBadge} font-bold`}>
              Cloud
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Multi-Node Virtualization & Cloud Control Center</p>
        </div>

        {/* Card */}
        <div className="bg-[#0e1424]/90 border border-slate-800/90 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">
          
          {/* Tab Switcher: Sign In vs Sign Up */}
          <div className="flex bg-slate-900/90 p-1 rounded-xl mb-6 border border-slate-800/80">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
                !isRegister 
                  ? `${currentTheme.btnPrimary}` 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                if (!allowRegistration) {
                  setError('Public registration is currently disabled by the administrator.');
                  return;
                }
                setIsRegister(true);
                setError('');
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
                isRegister 
                  ? `${currentTheme.btnPrimary}` 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-xl text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field (Sign Up Only) */}
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none ${currentTheme.ringFocus} transition`}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none ${currentTheme.ringFocus} transition`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none ${currentTheme.ringFocus} transition`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-2 py-3 ${currentTheme.btnPrimary} font-semibold rounded-xl transition flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer`}
            >
              <span>{loading ? (isRegister ? 'Creating Account...' : 'Authenticating...') : (isRegister ? 'Register & Get Started' : 'Sign In to Panel')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Access (Sign In only) */}
          {!isRegister && (
            <div className="mt-6 pt-5 border-t border-slate-800">
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 text-center">
                Quick Demo Access
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => quickLogin('admin@vpspanel.local', 'admin123')}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-slate-300 font-medium text-center transition"
                >
                  Super Admin
                </button>
                <button
                  type="button"
                  onClick={() => quickLogin('user@vpspanel.local', 'user123')}
                  className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-slate-300 font-medium text-center transition"
                >
                  Client User
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Encrypted JWT Sessions & Multi-Node Cluster Isolation</span>
        </div>

      </div>
    </div>
  );
};
