/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Sliders, ShieldCheck, DollarSign, Bell } from 'lucide-react';
import AlertThresholdsConfig from './AlertThresholdsConfig';

interface Budget {
  provider_id: string;
  monthly_limit_usd: number;
  alert_thresholds?: number[];
  email_alerts_enabled?: boolean;
  dashboard_alerts_enabled?: boolean;
}

export default function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [providerId, setProviderId] = useState('openai');
  const [limit, setLimit] = useState('');
  const [thresholdsStr, setThresholdsStr] = useState('50, 80, 100');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [dashboardAlerts, setDashboardAlerts] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchBudgets = async () => {
    try {
      const res = await fetch('/api/dashboard', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('watchdog_token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBudgets(data.budgets || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!limit || isNaN(Number(limit))) return;
    
    const thresholds = thresholdsStr.split(',').map(t => parseInt(t.trim())).filter(t => !isNaN(t));

    setSubmitting(true);
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
          thresholds, 
          email_alerts: emailAlerts, 
          dashboard_alerts: dashboardAlerts 
        })
      });
      if (res.ok) {
        setLimit('');
        fetchBudgets();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-slate-900 tracking-tight">
            Budget Guardrails
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl font-normal">
            Enforce monthly spend caps and automated breach dispatch across OpenAI, Anthropic, Gemini, and open-source models.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <ShieldCheck size={14} />
          <span>Automated Daemon Surveillance Active</span>
        </div>
      </div>

      {/* Configure Budget Form (White 3D Card) */}
      <div className="card-3d bg-white rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sliders size={16} />
          </div>
          <h2 className="text-base font-heading font-bold text-slate-900 tracking-tight">
            Configure Provider Budget Cap
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-3xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">LLM Provider</label>
              <select 
                value={providerId} 
                onChange={(e) => setProviderId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-500 text-xs font-medium transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="gemini">Google Gemini</option>
                <option value="mistral">Mistral AI</option>
                <option value="cohere">Cohere</option>
                <option value="groq">Groq</option>
                <option value="deepseek">DeepSeek</option>
                <option value="perplexity">Perplexity</option>
                <option value="together">Together AI</option>
                <option value="openrouter">OpenRouter</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Monthly Spending Limit (USD)</label>
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
                  placeholder="100.00"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3.5 py-2.5 text-slate-900 font-mono focus:outline-none focus:border-indigo-500 text-xs transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
                />
              </div>
            </div>
          </div>

          <AlertThresholdsConfig 
            thresholdsStr={thresholdsStr}
            setThresholdsStr={setThresholdsStr}
            emailAlerts={emailAlerts}
            setEmailAlerts={setEmailAlerts}
            dashboardAlerts={dashboardAlerts}
            setDashboardAlerts={setDashboardAlerts}
          />

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={submitting || !limit}
              className="btn-3d-primary px-5 py-2.5 rounded-xl font-semibold text-xs transition-all disabled:opacity-50 cursor-pointer shadow-[0_4px_14px_rgba(99,102,241,0.35)]"
            >
              {submitting ? 'Saving...' : 'Save Budget Guardrail'}
            </button>
          </div>
        </form>
      </div>

      {/* Active Budgets Table (White 3D Card) */}
      <div className="card-3d bg-white rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-indigo-600" />
            <h2 className="text-base font-heading font-bold text-slate-900 tracking-tight">
              Active Provider Budgets & Alert Rules
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {budgets.length} Guardrails Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Provider</th>
                <th className="px-6 py-3.5">Monthly Cap</th>
                <th className="px-6 py-3.5">Threshold Alerts</th>
                <th className="px-6 py-3.5">Channels</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400 font-medium">Loading budgets...</td></tr>
              ) : budgets.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400 font-medium">No budgets configured yet. Create one above to prevent runaway API spend.</td></tr>
              ) : (
                budgets.map((budget) => (
                  <tr key={budget.provider_id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 capitalize font-semibold text-slate-900">{budget.provider_id}</td>
                    <td className="px-6 py-4 font-mono font-bold text-indigo-600">
                      ${Number(budget.monthly_limit_usd).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-mono">
                      {budget.alert_thresholds ? budget.alert_thresholds.join('%, ') + '%' : '50%, 80%, 100%'}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${budget.email_alerts_enabled !== false ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60' : 'bg-slate-100 text-slate-400'}`}>
                          Email
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${budget.dashboard_alerts_enabled !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-slate-100 text-slate-400'}`}>
                          Banner
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
