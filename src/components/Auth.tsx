/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

interface AuthProps {
  onLogin: (token: string) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const firebaseUser = await signInWithGoogle();
      if (firebaseUser) {
        const res = await fetch('/api/auth/firebase-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: firebaseUser.email,
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0]
          })
        });
        const data = await res.json();
        if (res.ok) {
          onLogin(data.token);
        } else {
          setError(data.error || 'Failed to authenticate via Firebase');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google sign-in was cancelled or failed');
    } finally {
      setGoogleLoading(false);
    }
  };

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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center font-sans p-4">
      <div className="w-full max-w-md card-3d bg-white rounded-3xl p-8 sm:p-10 shadow-[0_20px_50px_rgba(15,23,42,0.08)] border border-slate-200/80">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-indigo-500 flex items-center justify-center text-white mb-4 shadow-[0_6px_20px_rgba(99,102,241,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)]">
            <Sparkles size={24} className="animate-pulse" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-slate-900 tracking-tight">Watchdog</h1>
          <span className="text-[10px] font-bold tracking-widest text-violet-600 uppercase mt-0.5">
            WORKSPACE SUITE
          </span>
          <p className="text-slate-500 text-xs mt-1.5 font-normal text-center">
            Sign in to access your FinOps intelligence and model vault
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200/70 text-rose-700 text-xs p-3 rounded-xl text-center mb-5 font-medium">
            {error}
          </div>
        )}

        {/* Google Sign-in with Firebase Auth */}
        <button
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="btn-3d-white w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl text-xs font-semibold mb-5 cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google Workspace'}</span>
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">or with email</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-500 text-xs transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
              placeholder="you@company.com"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-500 text-xs transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading || googleLoading}
            className="btn-3d-primary w-full py-2.5 rounded-xl font-semibold text-xs transition-all disabled:opacity-50 cursor-pointer shadow-[0_4px_14px_rgba(99,102,241,0.35)] mt-2"
          >
            {loading ? 'Authenticating...' : isLogin ? 'Sign In to Workspace' : 'Create Workspace Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          <button 
            type="button" 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
}
