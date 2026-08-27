import React, { useState } from 'react';
import { Activity } from 'lucide-react';

interface AuthProps {
  onLogin: (token: string) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        onLogin(data.token);
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1220] flex flex-col justify-center items-center font-sans p-4">
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8 text-[#3DDC97]">
          <div className="w-12 h-12 bg-[#3DDC97] rounded-xl flex items-center justify-center text-[#0B1220] mb-4">
            <Activity size={24} />
          </div>
          <h1 className="text-2xl font-bold text-white uppercase tracking-widest">Watchdog</h1>
          <p className="text-white/40 text-sm mt-2 tracking-wide">API Spend Intelligence</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-1">
            <label className="text-[10px] text-white/40 uppercase tracking-widest font-medium pl-1">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#0B1220] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#3DDC97] text-sm transition-colors"
              placeholder="you@company.com"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] text-white/40 uppercase tracking-widest font-medium pl-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#0B1220] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#3DDC97] text-sm transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || !email || !password}
            className="w-full bg-[#3DDC97] text-[#0B1220] font-medium py-3 rounded-lg hover:bg-[#3DDC97]/90 transition-colors disabled:opacity-50 text-sm uppercase tracking-wider mt-4"
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-white/40 hover:text-white text-xs transition-colors"
          >
            {isLogin ? "Don't have an account? Register" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}
