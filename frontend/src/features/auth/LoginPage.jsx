import React, { useState } from 'react';
import { LayoutDashboard, Lock, User, Loader2, Sparkles, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(username, password);
    } catch (err) {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-sky-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-sky-500/40 mb-6">
            <LayoutDashboard className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">MANTIS <span className="text-sky-500">AI</span></h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-2">Internal Workspace Access</p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] backdrop-blur-xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input 
                  type="text"
                  className="w-full bg-slate-950 border border-slate-800 pl-12 pr-4 py-4 rounded-2xl focus:border-sky-500 outline-none transition-all text-sm text-white"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input 
                  type={showPassword ? "text" : "password"}
                  className="w-full bg-slate-950 border border-slate-800 pl-12 pr-12 py-4 rounded-2xl focus:border-sky-500 outline-none transition-all text-sm text-white"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-sky-500 transition-colors z-10 p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-rose-500 text-xs font-bold text-center animate-shake">
                {error}
              </div>
            )}

            <button 
              disabled={loading}
              className="w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-sky-500/20 active:scale-[0.98]"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : (
                <>Enter Workspace <Sparkles size={16} /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
