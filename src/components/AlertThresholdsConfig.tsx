/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Bell, Mail, LayoutDashboard, AlertTriangle, ShieldAlert } from 'lucide-react';

interface AlertConfigProps {
  thresholdPercent: number;
  setThresholdPercent: (val: number) => void;
  thresholdsStr: string;
  setThresholdsStr: (val: string) => void;
  emailAlerts: boolean;
  setEmailAlerts: (val: boolean) => void;
  dashboardAlerts: boolean;
  setDashboardAlerts: (val: boolean) => void;
  monthlyLimit?: number;
}

export default function AlertThresholdsConfig({
  thresholdPercent,
  setThresholdPercent,
  thresholdsStr,
  setThresholdsStr,
  emailAlerts,
  setEmailAlerts,
  dashboardAlerts,
  setDashboardAlerts,
  monthlyLimit = 0
}: AlertConfigProps) {
  const presets = [
    { label: '50% Early Advisory', value: 50, tone: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    { label: '75% Caution', value: 75, tone: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
    { label: '80% Recommended', value: 80, tone: 'text-amber-700 bg-amber-50 border-amber-200' },
    { label: '90% Urgent Warning', value: 90, tone: 'text-orange-700 bg-orange-50 border-orange-200' },
    { label: '100% Hard Cap', value: 100, tone: 'text-rose-700 bg-rose-50 border-rose-200' },
  ];

  const triggerDollarAmount = monthlyLimit > 0 ? (monthlyLimit * thresholdPercent) / 100 : 0;

  const handlePresetClick = (pct: number) => {
    setThresholdPercent(pct);
    // Also sync the thresholds string if it includes this
    const existing = thresholdsStr.split(',').map(s => s.trim()).filter(Boolean);
    if (!existing.includes(String(pct))) {
      setThresholdsStr([...existing, String(pct)].sort((a, b) => Number(a) - Number(b)).join(', '));
    }
  };

  return (
    <div className="space-y-4 border border-slate-300/80 rounded-2xl p-5 well-gray mt-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-300/70">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-300/50 flex items-center justify-center text-amber-700">
            <Bell size={16} />
          </div>
          <div>
            <h3 className="text-xs font-heading font-bold text-slate-900 uppercase tracking-wider">
              Spend Threshold & Notification Trigger
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Set the percentage threshold where Watchdog triggers immediate visual toasts and alerts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F8F9FB] border border-slate-300/80 shadow-sm text-xs font-mono font-bold text-slate-900">
          <span className="text-[10px] text-slate-400 font-sans font-normal uppercase">Trigger at</span>
          <span className="text-amber-600 font-extrabold">{thresholdPercent}%</span>
        </div>
      </div>

      {/* Main Interactive Threshold Slider & Preset Chips */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between text-xs">
          <label className="font-semibold text-slate-700 flex items-center gap-1.5">
            <AlertTriangle size={13} className="text-amber-600" />
            <span>Visual Alert Threshold (% of Monthly Cap)</span>
          </label>
          <span className="text-xs font-mono font-bold text-indigo-700">
            {thresholdPercent}% of budget cap
          </span>
        </div>

        {/* Range Slider */}
        <div className="space-y-1">
          <div className="relative flex items-center">
            <input
              type="range"
              min="10"
              max="150"
              step="5"
              value={thresholdPercent}
              onChange={(e) => setThresholdPercent(Number(e.target.value))}
              className="w-full h-2 bg-slate-300/80 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>10% (Early)</span>
            <span>50%</span>
            <span className="text-slate-600 font-bold">80% (Default)</span>
            <span>100% (Cap)</span>
            <span>150% (Overage)</span>
          </div>
        </div>

        {/* Quick Preset Selector Buttons */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {presets.map((p) => {
            const isSelected = thresholdPercent === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => handlePresetClick(p.value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  isSelected
                    ? `${p.tone} font-bold shadow-sm ring-1 ring-offset-1 ring-slate-400`
                    : 'bg-[#F8F9FB] border-slate-300/80 text-slate-600 hover:text-slate-900 hover:border-slate-400'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Real-time Dollar Projection Banner */}
        <div className="p-3 rounded-xl bg-[#F8F9FB] border border-slate-300/70 shadow-[inset_0_1px_1px_rgba(0,0,0,0.02)] flex items-start gap-2.5">
          <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-semibold text-slate-800">Trigger Projection: </span>
            {monthlyLimit > 0 ? (
              <span className="text-slate-600">
                Visual toast and alert banner will fire when spend exceeds{' '}
                <strong className="text-slate-900 font-mono">${triggerDollarAmount.toFixed(2)}</strong>{' '}
                ({thresholdPercent}% of your ${monthlyLimit.toFixed(2)} monthly limit).
              </span>
            ) : (
              <span className="text-slate-500">
                Enter a monthly limit above to see the exact dollar amount that will trigger the notification toast.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Multi-Tier Milestones & Channels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-300/70">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">
            Escalation Milestones (%)
          </label>
          <input
            type="text"
            value={thresholdsStr}
            onChange={(e) => setThresholdsStr(e.target.value)}
            placeholder="50, 80, 100"
            className="w-full bg-[#F8F9FB] border border-slate-300/80 rounded-xl px-3.5 py-2 text-slate-900 font-mono focus:outline-none focus:border-indigo-500 text-xs transition-colors shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
          />
          <p className="text-[11px] text-slate-500">
            Tiered alerts (e.g. 50, 80, 100) recorded in the FinOps audit log.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700">Notification Delivery</label>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  dashboardAlerts
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-[#F8F9FB] border-slate-300'
                }`}
              >
                {dashboardAlerts && (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <input
                type="checkbox"
                className="hidden"
                checked={dashboardAlerts}
                onChange={(e) => setDashboardAlerts(e.target.checked)}
              />
              <div className="flex items-center gap-2">
                <LayoutDashboard size={14} className={dashboardAlerts ? 'text-indigo-600' : 'text-slate-400'} />
                <span className={`text-xs font-medium ${dashboardAlerts ? 'text-slate-900' : 'text-slate-500'}`}>
                  In-App Toast & Visual Banner (Immediate)
                </span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer group">
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  emailAlerts
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'bg-[#F8F9FB] border-slate-300'
                }`}
              >
                {emailAlerts && (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <input
                type="checkbox"
                className="hidden"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
              />
              <div className="flex items-center gap-2">
                <Mail size={14} className={emailAlerts ? 'text-indigo-600' : 'text-slate-400'} />
                <span className={`text-xs font-medium ${emailAlerts ? 'text-slate-900' : 'text-slate-500'}`}>
                  Email Notification Dispatch (Resend Daemon)
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
