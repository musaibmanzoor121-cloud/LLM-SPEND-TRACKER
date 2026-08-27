/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, KeyRound, Settings, LogOut, User, HelpCircle } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import Keys from './components/Keys';
import Budgets from './components/Budgets';
import Auth from './components/Auth';
import AccountSettings from './components/AccountSettings';
import Onboarding from './components/Onboarding';
import Help from './components/Help';

function Sidebar({ onLogout }: { onLogout: () => void }) {
  const location = useLocation();
  const navItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/keys', label: 'API Keys', icon: <KeyRound size={20} /> },
    { path: '/budgets', label: 'Budgets', icon: <Settings size={20} /> },
    { path: '/help', label: 'Help', icon: <HelpCircle size={20} /> },
    { path: '/settings', label: 'Account', icon: <User size={20} /> },
  ];

  return (
    <div className="w-72 bg-[#05080f] border-r border-white/5 h-screen p-6 flex flex-col text-[#E8EAED] shadow-[4px_0_24px_rgba(0,0,0,0.5)] z-10 relative">
      <div className="flex items-center gap-3 mb-10 px-2 text-[#3DDC97]">
        <div className="w-10 h-10 bg-gradient-to-br from-[#3DDC97] to-[#25A16E] rounded-xl flex items-center justify-center text-[#0B1220] shadow-[0_0_15px_rgba(61,220,151,0.3)]">
          <ActivityIcon />
        </div>
        <span className="font-heading font-semibold text-2xl tracking-tight text-white">Watchdog</span>
      </div>
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 text-sm font-medium ${
              location.pathname === item.path
                ? 'bg-[#3DDC97]/10 text-[#3DDC97] border border-[#3DDC97]/20 shadow-[0_0_20px_rgba(61,220,151,0.05)]'
                : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/5'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      
      <div className="mt-auto pt-6 border-t border-white/5">
        <button 
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3.5 w-full rounded-xl transition-all duration-300 text-sm font-medium text-white/50 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}

function ActivityIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('watchdog_token'));
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  useEffect(() => {
    if (token && !localStorage.getItem('watchdog_onboarded')) {
      setShowOnboarding(true);
    }
  }, [token]);

  const handleLogin = (newToken: string) => {
    localStorage.setItem('watchdog_token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('watchdog_token');
    setToken(null);
  };

  const handleCompleteOnboarding = () => {
    localStorage.setItem('watchdog_onboarded', 'true');
    setShowOnboarding(false);
  };

  if (!token) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="flex h-screen bg-[#060913] font-sans overflow-hidden text-[#E8EAED]">
        {showOnboarding && <Onboarding onComplete={handleCompleteOnboarding} />}
        <Sidebar onLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto p-10">
          <div className="max-w-6xl mx-auto flex flex-col min-h-full">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/keys" element={<Keys />} />
              <Route path="/budgets" element={<Budgets />} />
              <Route path="/help" element={<Help />} />
              <Route path="/settings" element={<AccountSettings onLogout={handleLogout} />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}
