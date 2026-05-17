import { useState } from 'react';
import axios from 'axios';
import { motion } from 'motion/react';
import { Shield, Lock, User } from 'lucide-react';

export default function Login({ onLogin }: { onLogin: (user: any) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/auth/login', { username, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      onLogin(res.data.user);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl relative overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-teal-500/10 blur-[80px] rounded-full" />
        
        <div className="flex items-center justify-center mb-10 space-x-3">
          <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Shield className="w-6 h-6 text-black" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Pterodactyl<span className="text-teal-400 font-black">.</span></h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 ml-1">Access Identity</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 focus:border-teal-500/50 outline-none transition-all font-mono text-sm placeholder:text-slate-700"
                placeholder="administrator"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 ml-1">Security Key</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-teal-400 transition-colors" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-12 pr-4 focus:border-teal-500/50 outline-none transition-all font-mono text-sm placeholder:text-slate-700"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && <p className="text-rose-400 text-xs font-mono bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">{error}</p>}

          <button 
            type="submit"
            className="w-full bg-teal-500 hover:bg-teal-400 text-black font-bold py-4 rounded-2xl transition-all uppercase tracking-widest text-xs shadow-lg shadow-teal-500/20 active:scale-[0.98]"
          >
            Authenticate
          </button>
        </form>

        <p className="mt-8 text-center text-[10px] text-slate-600 font-medium uppercase tracking-[0.2em]">
          Secure Infrastructure Access Layer
        </p>
      </motion.div>
    </div>
  );
}
