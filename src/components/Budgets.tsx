/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  Sliders, 
  ShieldCheck, 
  DollarSign, 
  Bell, 
  AlertTriangle, 
  AlertCircle, 
  X, 
  CheckCircle2, 
  TrendingUp, 
  Sparkles, 
  ArrowRight, 
  Play, 
  ShieldAlert,
  Flame,
  Zap,
  Info
} from 'lucide-react';
import AlertThresholdsConfig from './AlertThresholdsConfig';

interface Budget {
  provider_id: string;
  monthly_limit_usd: number;
  alert_at_percent?: number;
  alert_thresholds?: number[];
  email_alerts_enabled?: boolean;
  dashboard_alerts_enabled?: boolean;
}

interface SpendData {
  provider_id: string;
  total_spend: number;
}

interface ToastNotification {
  id: string;
  providerId: string;
  providerName: string;
  currentSpend: number;
  limit: number;
  thresholdPercent: number;
  currentPercent: number;
  severity: 'warning' | 'critical';
  timestamp: Date;
}

const PROVIDER_NAMES: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Google Gemini',
  mistral: 'Mistral AI',
  cohere: 'Cohere',
  groq: 'Groq',
  deepseek: 'DeepSeek',
  perplexity: 'Perplexity',
  together: 'Together AI',
  openrouter: 'OpenRouter'
};

export default function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [spendData, setSpendData] = useState<SpendData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [providerId, setProviderId] = useState('openai');
  const [limit, setLimit] = useState('');
  const [thresholdPercent, setThresholdPercent] = useState<number>(80);
  const [thresholdsStr, setThresholdsStr] = useState('50, 80, 100');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [dashboardAlerts, setDashboardAlerts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Active Toast Notifications
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  // Store dismissed notifications in this session so we don't repeatedly spam on each poll
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // Trigger a visual toast notification
  const triggerToast = useCallback((toastData: Omit<ToastNotification, 'id' | 'timestamp'>) => {
    const newToast: ToastNotification = {
      ...toastData,
      id: `${toastData.providerId}-${Date.now()}-${Math.random()}`,
      timestamp: new Date()
    };

    setToasts(prev => [newToast, ...prev.slice(0, 3)]); // Keep up to 4 toasts visible

    // Auto-dismiss after 8 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, 8000);
  }, []);

  const dismissToast = (id: string, providerKey?: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    if (providerKey) {
      setDismissedAlerts(prev => new Set(prev).add(providerKey));
    }
  };

  const fetchBudgetsAndSpend = async () => {
    try {
      const res = await fetch('/api/dashboard', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('watchdog_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        const loadedBudgets: Budget[] = data.budgets || [];
        const loadedSpend: SpendData[] = data.spendData || [];
        setBudgets(loadedBudgets);
        setSpendData(loadedSpend);

        // Check for any exceeded budgets and trigger toast if not already dismissed in this session
        loadedBudgets.forEach(b => {
          if (b.dashboard_alerts_enabled === false) return;
          const matchSpend = loadedSpend.find(s => s.provider_id === b.provider_id);
          const currentSpend = matchSpend ? Number(matchSpend.total_spend) : 0;
          const monthlyLimit = Number(b.monthly_limit_usd);
          const configuredPct = b.alert_at_percent ? Number(b.alert_at_percent) : (b.alert_thresholds?.[0] || 80);
          
          if (monthlyLimit > 0) {
            const currentPercent = (currentSpend / monthlyLimit) * 100;
            const thresholdAmount = (monthlyLimit * configuredPct) / 100;

            if (currentSpend >= thresholdAmount) {
              const alertKey = `${b.provider_id}-${configuredPct}`;
              if (!dismissedAlerts.has(alertKey)) {
                triggerToast({
                  providerId: b.provider_id,
                  providerName: PROVIDER_NAMES[b.provider_id] || b.provider_id,
                  currentSpend,
                  limit: monthlyLimit,
                  thresholdPercent: configuredPct,
                  currentPercent,
                  severity: currentPercent >= 100 ? 'critical' : 'warning'
                });
              }
            }
          }
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetsAndSpend();
  }, []);

  // Compute spend map for easy lookup
  const spendByProvider = useMemo(() => {
    const map = new Map<string, number>();
    spendData.forEach(s => {
      const existing = map.get(s.provider_id) || 0;
      map.set(s.provider_id, existing + Number(s.total_spend));
    });
    return map;
  }, [spendData]);

  // Breached budgets list for top visual alert callout
  const breachedBudgets = useMemo(() => {
    return budgets.filter(b => {
      const currentSpend = spendByProvider.get(b.provider_id) || 0;
      const monthlyLimit = Number(b.monthly_limit_usd);
      const configuredPct = b.alert_at_percent ? Number(b.alert_at_percent) : (b.alert_thresholds?.[0] || 80);
      if (monthlyLimit <= 0) return false;
      const thresholdAmount = (monthlyLimit * configuredPct) / 100;
      return currentSpend >= thresholdAmount;
    });
  }, [budgets, spendByProvider]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!limit || isNaN(Number(limit))) return;
    
    // Parse tiered thresholds and ensure primary threshold is included
    const rawThresholds = thresholdsStr
      .split(',')
      .map(t => parseInt(t.trim(), 10))
      .filter(t => !isNaN(t));
    
    const combinedThresholds = Array.from(new Set([thresholdPercent, ...rawThresholds])).sort((a, b) => a - b);

    setSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('watchdog_token')}`
        },
        body: JSON.stringify({ 
          provider_id: providerId, 
          limit: Number(limit), 
          alert_at_percent: thresholdPercent,
          thresholds: combinedThresholds, 
          email_alerts: emailAlerts, 
          dashboard_alerts: dashboardAlerts 
        })
      });

      if (res.ok) {
        setStatusMessage({ text: `Budget guardrail saved for ${PROVIDER_NAMES[providerId] || providerId} at ${thresholdPercent}% threshold.`, type: 'success' });
        
        // Check if the newly set threshold is already exceeded by current spend
        const currentSpend = spendByProvider.get(providerId) || 0;
        const newLimit = Number(limit);
        const thresholdAmount = (newLimit * thresholdPercent) / 100;
        
        if (currentSpend >= thresholdAmount && dashboardAlerts) {
          triggerToast({
            providerId,
            providerName: PROVIDER_NAMES[providerId] || providerId,
            currentSpend,
            limit: newLimit,
            thresholdPercent,
            currentPercent: (currentSpend / newLimit) * 100,
            severity: currentSpend >= newLimit ? 'critical' : 'warning'
          });
        }

        fetchBudgetsAndSpend();
      } else {
        setStatusMessage({ text: 'Failed to save budget guardrail. Please try again.', type: 'error' });
      }
    } catch (e) {
      console.error(e);
      setStatusMessage({ text: 'Network error saving budget.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Quick simulate / test trigger button for users to verify the toast notification anytime
  const handleSimulateToast = (targetBudget?: Budget) => {
    const provId = targetBudget ? targetBudget.provider_id : providerId;
    const provName = PROVIDER_NAMES[provId] || provId;
    const testLimit = targetBudget ? Number(targetBudget.monthly_limit_usd) : (Number(limit) || 500);
    const testPct = targetBudget?.alert_at_percent || thresholdPercent || 80;
    const simulatedSpend = Number((testLimit * (testPct / 100) * 1.08).toFixed(2)); // 8% above threshold

    triggerToast({
      providerId: provId,
      providerName: provName,
      currentSpend: simulatedSpend,
      limit: testLimit,
      thresholdPercent: testPct,
      currentPercent: (simulatedSpend / testLimit) * 100,
      severity: simulatedSpend >= testLimit ? 'critical' : 'warning'
    });
  };

  // Quick load budget into editor form
  const handleEditBudget = (budget: Budget) => {
    setProviderId(budget.provider_id);
    setLimit(String(budget.monthly_limit_usd));
    setThresholdPercent(budget.alert_at_percent ? Number(budget.alert_at_percent) : (budget.alert_thresholds?.[0] || 80));
    if (budget.alert_thresholds && budget.alert_thresholds.length > 0) {
      setThresholdsStr(budget.alert_thresholds.join(', '));
    }
    if (budget.email_alerts_enabled !== undefined) setEmailAlerts(budget.email_alerts_enabled);
    if (budget.dashboard_alerts_enabled !== undefined) setDashboardAlerts(budget.dashboard_alerts_enabled);

    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  return (
    <div className="flex flex-col space-y-7 animate-in fade-in duration-200 relative">
      {/* 0. Floating Visual Toast Notifications Container */}
      <div className="fixed top-20 right-4 sm:right-8 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
        {toasts.map((toast) => {
          const isCritical = toast.severity === 'critical';
          const thresholdDollar = ((toast.limit * toast.thresholdPercent) / 100).toFixed(2);
          const overageDollar = (toast.currentSpend - (toast.limit * toast.thresholdPercent) / 100).toFixed(2);

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto rounded-2xl p-4 shadow-[0_12px_36px_rgba(15,23,42,0.18),0_2px_8px_rgba(15,23,42,0.06)] border animate-in slide-in-from-top-4 fade-in duration-200 transition-all ${
                isCritical
                  ? 'bg-[#FFF8F8] border-rose-300 text-slate-900 ring-1 ring-rose-400/40'
                  : 'bg-[#FFFDF7] border-amber-300 text-slate-900 ring-1 ring-amber-400/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                      isCritical
                        ? 'bg-rose-600 text-white shadow-rose-200 animate-pulse'
                        : 'bg-amber-500 text-white shadow-amber-200'
                    }`}
                  >
                    {isCritical ? <Flame size={18} /> : <AlertTriangle size={18} />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-heading font-bold text-slate-900">
                        {isCritical ? '🚨 Critical Budget Cap Breached' : '⚠️ Spend Threshold Exceeded'}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                          isCritical ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {toast.currentPercent.toFixed(1)}%
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 mt-1 leading-snug">
                      <strong className="text-slate-900">{toast.providerName}</strong> spend has reached{' '}
                      <span className="font-mono font-bold text-slate-900">${toast.currentSpend.toFixed(2)}</span>,{' '}
                      surpassing your <strong className="text-amber-700">{toast.thresholdPercent}%</strong> threshold (${thresholdDollar}) by{' '}
                      <span className="font-mono font-bold text-rose-600">+${overageDollar}</span>.
                    </p>

                    <div className="flex items-center gap-2 mt-2.5">
                      <button
                        onClick={() => {
                          setProviderId(toast.providerId);
                          setLimit(String(toast.limit));
                          window.scrollTo({ top: 220, behavior: 'smooth' });
                          dismissToast(toast.id, `${toast.providerId}-${toast.thresholdPercent}`);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        Adjust Cap
                      </button>
                      <button
                        onClick={() => dismissToast(toast.id, `${toast.providerId}-${toast.thresholdPercent}`)}
                        className="px-2.5 py-1 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
                      >
                        Acknowledge
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => dismissToast(toast.id)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200/60 transition-colors shrink-0 cursor-pointer"
                  title="Close notification"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Progress countdown indicator */}
              <div className="w-full bg-slate-200/60 h-1 rounded-full overflow-hidden mt-3">
                <div
                  className={`h-full animate-[progress_8s_linear_forwards] ${
                    isCritical ? 'bg-rose-500' : 'bg-amber-500'
                  }`}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 1. Header with Live Status & Quick Test Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-300/70">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 tracking-tight">
              Budget Guardrails & Threshold Alerts
            </h1>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Sentinel Active" />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl font-normal">
            Enforce percentage spend thresholds and automated visual breach alerts across OpenAI, Anthropic, Gemini, and inference fleets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Simulation Trigger Button */}
          <button
            onClick={() => handleSimulateToast()}
            className="btn-3d-offwhite px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-slate-700 cursor-pointer hover:border-amber-400"
            title="Simulate a threshold breach and view the visual notification toast in real-time"
          >
            <Zap size={14} className="text-amber-600" />
            <span>Simulate Breach Toast</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl well-gray border border-slate-300/80 text-emerald-700 text-xs font-semibold shadow-sm">
            <ShieldCheck size={14} />
            <span className="hidden sm:inline">Daemon Active</span>
          </div>
        </div>
      </div>

      {/* 2. Visual Breach Alert Banner (Renders when any budget has exceeded threshold) */}
      {breachedBudgets.length > 0 && (
        <div className="rounded-2xl p-4 sm:p-5 bg-[#FFF9F5] border border-amber-300/90 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              <ShieldAlert size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-heading font-bold text-amber-950">
                  {breachedBudgets.length} Spend Threshold Alert{breachedBudgets.length > 1 ? 's' : ''} Triggered
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/70 text-amber-900 uppercase">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-amber-900/80 mt-1">
                The following providers have surpassed your configured percentage spending threshold. Watchdog has armed automated alerts:
              </p>
              
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {breachedBudgets.map(b => {
                  const spend = spendByProvider.get(b.provider_id) || 0;
                  const limitVal = Number(b.monthly_limit_usd);
                  const pct = ((spend / limitVal) * 100).toFixed(0);
                  const threshold = b.alert_at_percent || 80;
                  return (
                    <span 
                      key={b.provider_id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-amber-300/80 text-xs font-semibold text-slate-900 shadow-sm"
                    >
                      <strong className="capitalize">{b.provider_id}</strong>
                      <span className="text-amber-700 font-mono">{pct}%</span>
                      <span className="text-slate-400 text-[10px]">({threshold}% limit)</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={() => {
                if (breachedBudgets[0]) {
                  handleSimulateToast(breachedBudgets[0]);
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Bell size={13} />
              <span>Re-trigger Toast</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Configure Budget Form Card (Off-White #F8F9FB) */}
      <div className="card-3d bg-[#F8F9FB] rounded-2xl p-6 sm:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200/70 text-indigo-600 flex items-center justify-center shadow-sm">
              <Sliders size={16} />
            </div>
            <div>
              <h2 className="text-base font-heading font-bold text-slate-900 tracking-tight">
                Configure Spend Threshold & Monthly Cap
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Define the monthly cap and exact percentage threshold that triggers visual toasts.
              </p>
            </div>
          </div>

          {statusMessage && (
            <div className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {statusMessage.type === 'success' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
              <span>{statusMessage.text}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-3xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">LLM Provider</label>
              <select 
                value={providerId} 
                onChange={(e) => setProviderId(e.target.value)}
                className="w-full bg-[#ECEFF4] border border-slate-300/80 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-500 text-xs font-medium transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] cursor-pointer"
              >
                <option value="openai">OpenAI (GPT-4o, o3-mini)</option>
                <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
                <option value="gemini">Google Gemini (Gemini 2.5 Flash, 1.5 Pro)</option>
                <option value="mistral">Mistral AI (Large 2, Codestral)</option>
                <option value="cohere">Cohere (Command R+)</option>
                <option value="groq">Groq (Llama 3.3 Ultra-Fast)</option>
                <option value="deepseek">DeepSeek (DeepSeek-V3, R1)</option>
                <option value="perplexity">Perplexity (Sonar)</option>
                <option value="together">Together AI</option>
                <option value="openrouter">OpenRouter (Unified Fleet)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Monthly Spending Limit (USD)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <DollarSign size={14} />
                </div>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                  required
                  placeholder="500.00"
                  className="w-full bg-[#ECEFF4] border border-slate-300/80 rounded-xl pl-8 pr-3.5 py-2.5 text-slate-900 font-mono focus:outline-none focus:border-indigo-500 text-xs transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
                />
              </div>
            </div>
          </div>

          {/* Interactive Percentage Threshold Config with Slider & Preset Chips */}
          <AlertThresholdsConfig 
            thresholdPercent={thresholdPercent}
            setThresholdPercent={setThresholdPercent}
            thresholdsStr={thresholdsStr}
            setThresholdsStr={setThresholdsStr}
            emailAlerts={emailAlerts}
            setEmailAlerts={setEmailAlerts}
            dashboardAlerts={dashboardAlerts}
            setDashboardAlerts={setDashboardAlerts}
            monthlyLimit={Number(limit) || 0}
          />

          <div className="pt-2 flex items-center gap-3">
            <button 
              type="submit" 
              disabled={submitting || !limit}
              className="btn-3d-primary px-5 py-2.5 rounded-xl font-semibold text-xs transition-all disabled:opacity-50 cursor-pointer shadow-[0_4px_14px_rgba(99,102,241,0.35)] flex items-center gap-1.5"
            >
              <ShieldCheck size={14} />
              <span>{submitting ? 'Enforcing...' : 'Enforce Budget & Threshold'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSimulateToast()}
              className="btn-3d-offwhite px-4 py-2.5 rounded-xl font-semibold text-xs text-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Play size={13} className="text-amber-600" />
              <span>Test Toast Notification</span>
            </button>
          </div>
        </form>
      </div>

      {/* 4. Active Budgets Table (Off-White #F8F9FB Card with Visual Progress Bars & Threshold Markers) */}
      <div className="card-3d bg-[#F8F9FB] rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-indigo-600" />
            <h2 className="text-base font-heading font-bold text-slate-900 tracking-tight">
              Active Provider Budgets & Threshold Guardrails
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-500 font-mono">
            {budgets.length} Guardrails Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#ECEFF4] border-b border-slate-300/70 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Provider</th>
                <th className="px-6 py-3.5">Monthly Cap</th>
                <th className="px-6 py-3.5">Threshold Trigger</th>
                <th className="px-6 py-3.5 min-w-[200px]">Spend vs Threshold</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 font-medium">
                    Loading budget surveillance data...
                  </td>
                </tr>
              ) : budgets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 font-medium">
                    No budgets configured yet. Configure one above to enforce percentage limits and trigger visual toasts.
                  </td>
                </tr>
              ) : (
                budgets.map((budget) => {
                  const currentSpend = spendByProvider.get(budget.provider_id) || 0;
                  const monthlyLimit = Number(budget.monthly_limit_usd);
                  const configuredThreshold = budget.alert_at_percent ? Number(budget.alert_at_percent) : (budget.alert_thresholds?.[0] || 80);
                  const spendPercent = monthlyLimit > 0 ? (currentSpend / monthlyLimit) * 100 : 0;
                  const thresholdAmount = monthlyLimit > 0 ? (monthlyLimit * configuredThreshold) / 100 : 0;
                  const isExceeded = currentSpend >= thresholdAmount;
                  const isBreached = spendPercent >= 100;

                  return (
                    <tr key={budget.provider_id} className="hover:bg-[#ECEFF4]/60 transition-colors">
                      {/* Provider */}
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            isBreached ? 'bg-rose-500 animate-ping' : isExceeded ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                          }`} />
                          <span className="capitalize">{PROVIDER_NAMES[budget.provider_id] || budget.provider_id}</span>
                        </div>
                      </td>

                      {/* Monthly Cap */}
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">
                        ${monthlyLimit.toFixed(2)}
                      </td>

                      {/* Threshold Trigger */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80 text-[11px]">
                              {configuredThreshold}%
                            </span>
                            <span className="text-slate-500 text-[11px] font-mono">
                              (${thresholdAmount.toFixed(2)})
                            </span>
                          </div>
                          {budget.alert_thresholds && budget.alert_thresholds.length > 1 && (
                            <span className="text-[10px] text-slate-400 mt-0.5">
                              Tiers: {budget.alert_thresholds.join('%, ')}%
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Spend Progress Bar with Threshold Marker Pin */}
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[11px]">
                            <span className="font-mono font-semibold text-slate-800">
                              ${currentSpend.toFixed(2)}
                            </span>
                            <span className={`font-mono font-bold ${
                              isBreached ? 'text-rose-600' : isExceeded ? 'text-amber-600' : 'text-slate-500'
                            }`}>
                              {spendPercent.toFixed(1)}%
                            </span>
                          </div>

                          {/* Progress bar with threshold pin indicator */}
                          <div className="relative w-full h-2.5 bg-slate-300/70 rounded-full overflow-hidden shadow-[inset_0_1px_1px_rgba(0,0,0,0.06)]">
                            {/* Threshold Notch Line */}
                            <div 
                              className="absolute top-0 bottom-0 w-0.5 bg-slate-700 z-10" 
                              style={{ left: `${Math.min(configuredThreshold, 100)}%` }}
                              title={`Threshold: ${configuredThreshold}%`}
                            />

                            {/* Active Fill */}
                            <div 
                              className={`h-full transition-all duration-300 ${
                                isBreached 
                                  ? 'bg-rose-500' 
                                  : isExceeded 
                                    ? 'bg-amber-500' 
                                    : 'bg-emerald-500'
                              }`} 
                              style={{ width: `${Math.min(spendPercent, 100)}%` }} 
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-4">
                        {isBreached ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <Flame size={12} />
                            <span>Cap Breached (+{(spendPercent - 100).toFixed(0)}%)</span>
                          </span>
                        ) : isExceeded ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <AlertTriangle size={12} />
                            <span>Exceeded ({spendPercent.toFixed(0)}% / {configuredThreshold}%)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={12} />
                            <span>Nominal</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleSimulateToast(budget)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-200 transition-colors cursor-pointer"
                            title="Test toast notification for this budget"
                          >
                            <Bell size={14} />
                          </button>
                          <button
                            onClick={() => handleEditBudget(budget)}
                            className="px-2.5 py-1 rounded-lg bg-[#ECEFF4] hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
