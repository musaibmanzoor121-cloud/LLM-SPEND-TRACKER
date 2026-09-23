/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  KeyRound, 
  Sliders, 
  LogOut, 
  User as UserIcon, 
  HelpCircle, 
  Bot, 
  ShieldAlert,
  ChevronDown,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  Zap,
  Activity
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import Dashboard from './components/Dashboard';
import Keys from './components/Keys';
import Budgets from './components/Budgets';
import Auth from './components/Auth';
import AccountSettings from './components/AccountSettings';
import Onboarding from './components/Onboarding';
import Help from './components/Help';
import GeminiChatbot from './components/GeminiChatbot';
import { AuthProvider, useAuth } from './context/AuthContext';

function Navbar({ onLogout }: { onLogout: () => void }) {
  const location = useLocation();
  const { user } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { path: '/', label: 'Overview', icon: <LayoutDashboard size={15} /> },
    { path: '/chat', label: 'AI Copilot Studio', icon: <Bot size={15} /> },
    { path: '/keys', label: 'API Key Vault', icon: <KeyRound size={15} /> },
    { path: '/budgets', label: 'Budget Caps', icon: <Sliders size={15} /> },
    { path: '/settings', label: 'Preferences', icon: <UserIcon size={15} /> },
  ];

  const userEmail = user?.email || 'musaibmanzoor121@gmail.com';
  const userInitial = userEmail.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Left Zone: Distinctive Watchdog FinOps Crest */}
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 flex items-center justify-center text-white shadow-[0_3px_10px_rgba(79,70,229,0.35),inset_0_1px_1px_rgba(255,255,255,0.4)] group-hover:scale-105 transition-all duration-200 border border-indigo-500/30">
              <ShieldCheck size={18} className="stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-bold text-lg text-slate-900 tracking-tight leading-none group-hover:text-indigo-600 transition-colors">
                  Watchdog
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                  FinOps
                </span>
              </div>
              <span className="text-[9px] font-semibold tracking-wider text-slate-500 uppercase mt-0.5">
                INTELLIGENT API CAPITAL
              </span>
            </div>
          </Link>
        </div>

        {/* Center Zone: Clean Horizontal Nav Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-1.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-200 ${
                  isActive
                    ? 'bg-slate-100 text-indigo-700 shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)] border border-slate-200/80'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/80'
                }`}
              >
                <span className={isActive ? 'text-indigo-600' : 'text-slate-400'}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Zone: Telemetry Heartbeat + User Administrator Pill */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Live Telemetry Radar */}
          <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] font-medium text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,1)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Surveillance SLA 99.98%</span>
          </div>

          <Link
            to="/help"
            className="hidden sm:flex items-center text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            title="Help & Documentation"
          >
            <HelpCircle size={18} />
          </Link>

          {/* User Profile Pill */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 p-1.5 pl-2 pr-2.5 rounded-xl border border-slate-200/90 bg-slate-50/90 hover:bg-white hover:border-slate-300 transition-all duration-200 shadow-[0_1px_2px_rgba(15,23,42,0.04)] text-left cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center text-xs font-bold shadow-[0_2px_5px_rgba(79,70,229,0.25)]">
                {userInitial}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-[11px] font-semibold text-slate-800 leading-tight truncate max-w-[140px]">
                  {userEmail}
                </span>
                <span className="text-[9px] text-slate-400 font-medium leading-none mt-0.5">
                  Workspace Administrator
                </span>
              </div>
              <ChevronDown size={14} className="text-slate-400 ml-0.5" />
            </button>

            {/* Dropdown Menu */}
            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200/90 shadow-[0_12px_32px_rgba(15,23,42,0.12),0_2px_6px_rgba(15,23,42,0.04)] p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-2 border-b border-slate-100 mb-1">
                  <div className="text-xs font-semibold text-slate-900 truncate">{userEmail}</div>
                  <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                    <ShieldCheck size={12} />
                    <span>Google Verified Admin</span>
                  </div>
                </div>

                <Link
                  to="/settings"
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <UserIcon size={15} className="text-slate-400" />
                  <span>Account & API Settings</span>
                </Link>

                <Link
                  to="/help"
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <HelpCircle size={15} className="text-slate-400" />
                  <span>Documentation & Guide</span>
                </Link>

                <div className="border-t border-slate-100 my-1" />

                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200/80 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span className={isActive ? 'text-indigo-600' : 'text-slate-400'}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLogout();
              }}
              className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

function MainApp() {
  const { token, loginWithToken, logout } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  useEffect(() => {
    if (token && !localStorage.getItem('watchdog_onboarded')) {
      setShowOnboarding(true);
    }
  }, [token]);

  const handleCompleteOnboarding = () => {
    localStorage.setItem('watchdog_onboarded', 'true');
    setShowOnboarding(false);
  };

  if (!token) {
    return <Auth onLogin={loginWithToken} />;
  }

  return (
    <Router>
      {/* Light Gray Architectural Textured Canvas Container */}
      <div className="min-h-screen textured-canvas flex flex-col font-sans text-slate-800 selection:bg-indigo-500 selection:text-white">
        {showOnboarding && <Onboarding onComplete={handleCompleteOnboarding} />}
        <Navbar onLogout={logout} />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chat" element={<GeminiChatbot />} />
            <Route path="/keys" element={<Keys />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/help" element={<Help />} />
            <Route path="/settings" element={<AccountSettings onLogout={logout} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
