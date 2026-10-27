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
  const [panelName, setPanelName] = useState('Lunar Client Cloud');
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [loginBgImage, setLoginBgImage] = useState('');
  const [loginBgOpacity, setLoginBgOpacity] = useState('0.80');

  useEffect(() => {
    // Fetch public panel settings for branding, custom wallpaper & registration status
    api.getSettings()
      .then((res: any) => {
        if (res.settings) {
          if (res.settings.panel_name) setPanelName(res.settings.panel_name);
          if (res.settings.allow_registration !== undefined) {
            setAllowRegistration(res.settings.allow_registration === '1' || res.settings.allow_registration === 'true');
          }
          if (res.settings.login_bg_image) setLoginBgImage(res.settings.login_bg_image);
          if (res.settings.login_bg_overlay_opacity) setLoginBgOpacity(res.settings.login_bg_overlay_opacity);
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

  return (
    <div 
      className="min-h-screen bg-[#070a12] flex items-center justify-center p-6 relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]"
      style={loginBgImage ? {
        backgroundImage: `linear-gradient(rgba(7, 10, 18, ${loginBgOpacity}), rgba(7, 10, 18, ${loginBgOpacity})), url('${loginBgImage}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      } : {}}
    >
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
            className={`inline-flex relative items-center justify-center w-18 h-18 rounded-3xl bg-gradient-to-tr ${currentTheme.previewGradient} shadow-2xl text-white mb-4 p-0.5 group`}
            style={{ boxShadow: `0 16px 36px -4px ${currentTheme.glowColor}` }}
          >
            <div className="w-16 h-16 bg-[#070a14]/90 backdrop-blur-xl rounded-[22px] flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
              <Orbit className={`w-8 h-8 ${currentTheme.textAccent} animate-[spin_12s_linear_infinite] drop-shadow-[0_0_12px_rgba(6,182,212,0.6)]`} />
            </div>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            <span className="shimmer-text">{panelName}</span>
            <span className={`text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full ${currentTheme.bgBadge} font-extrabold shadow-sm`}>
              Client Console
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1.5 font-medium">Next-Generation High-Performance Virtualization & Compute Portal</p>
        </div>

        {/* Card */}
        <div className="glass-card-rich rounded-3xl p-8 backdrop-blur-3xl ring-1 ring-white/[0.08] relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          
          {/* Tab Switcher: Sign In vs Sign Up */}
          <div className="flex bg-slate-950/80 p-1 rounded-2xl mb-6 border border-white/[0.08] shadow-inner relative z-10">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setError(''); }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition duration-200 ${
                !isRegister 
                  ? `${currentTheme.btnPrimary} shadow-md` 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Client Login
            </button>
            <button
              type="button"
              onClick={() => {
                if (!allowRegistration) {
                  setError('New client registration is currently restricted by the administrator.');
                  return;
                }
                setIsRegister(true);
                setError('');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition duration-200 ${
                isRegister 
                  ? `${currentTheme.btnPrimary} shadow-md` 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-medium flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            {/* Name Field (Sign Up Only) */}
            {isRegister && (
              <div>
                <label className="block text-[10px] font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
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
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-slate-100 text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition shadow-inner`}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
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
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-slate-100 text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition shadow-inner`}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
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
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-800 rounded-xl text-slate-100 text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition shadow-inner`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full mt-2 py-3 ${currentTheme.btnPrimary} font-bold rounded-xl transition duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer shadow-xl hover:shadow-cyan-500/30 hover:scale-[1.01]`}
            >
              <span>{loading ? (isRegister ? 'Creating Client Account...' : 'Authenticating...') : (isRegister ? 'Create Client Account' : 'Sign In to Client Console')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
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
