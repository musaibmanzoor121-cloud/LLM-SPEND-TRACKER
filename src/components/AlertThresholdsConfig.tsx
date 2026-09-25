/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Bell, Mail, LayoutDashboard, AlertTriangle, ShieldAlert, Sparkles, Sliders } from 'lucide-react';

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
  const [isDragging, setIsDragging] = useState(false);

  const presets = [
    { label: '50% Advisory', value: 50, color: 'text-emerald-700 bg-emerald-50 border-emerald-300' },
    { label: '75% Caution', value: 75, color: 'text-indigo-700 bg-indigo-50 border-indigo-300' },
    { label: '80% Default', value: 80, color: 'text-amber-700 bg-amber-50 border-amber-300' },
    { label: '90% Urgent', value: 90, color: 'text-orange-700 bg-orange-50 border-orange-300' },
    { label: '100% Hard Cap', value: 100, color: 'text-rose-700 bg-rose-50 border-rose-300' },
  ];

  const triggerDollarAmount = monthlyLimit > 0 ? (monthlyLimit * thresholdPercent) / 100 : 0;

  // Compute position percentage for floating 3D readout thumb bubble (10% to 150%)
  const minPercent = 10;
  const maxPercent = 150;
  const thumbPositionPct = Math.min(
    Math.max(((thresholdPercent - minPercent) / (maxPercent - minPercent)) * 100, 4),
    96
  );

  const handlePresetClick = (pct: number) => {
    setThresholdPercent(pct);
    const existing = thresholdsStr.split(',').map(s => s.trim()).filter(Boolean);
    if (!existing.includes(String(pct))) {
      setThresholdsStr([...existing, String(pct)].sort((a, b) => Number(a) - Number(b)).join(', '));
    }
  };

  return (
    <div className="space-y-5 border border-slate-300/80 rounded-2xl p-5 md:p-6 well-gray mt-4 preserve-3d shadow-[0_8px_20px_-4px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.8)]">
      {/* Header with 3D Embossed Badge */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-300/70">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-400/50 flex items-center justify-center text-amber-700 shadow-[0_2px_6px_rgba(245,158,11,0.2)]">
            <Bell size={17} />
          </div>
          <div>
            <h3 className="text-xs font-heading font-bold text-slate-900 uppercase tracking-wider">
              Tactile Spend Threshold & Notification Trigger
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Calibrate the exact overage trigger point with immediate in-app toast & Resend dispatch
            </p>
          </div>
        </div>

        {/* 3D Embossed Physical Readout Plate */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-300/80 shadow-[0_2px_6px_rgba(15,23,42,0.06),inset_0_1px_1px_rgba(255,255,255,1)]">
          <span className="text-[10px] text-slate-400 uppercase font-semibold">Armed at</span>
          <span className="text-sm font-mono font-extrabold text-amber-600">
            {thresholdPercent}%
          </span>
        </div>
      </div>

      {/* Main Interactive Tactile 3D Physical Slider */}
      <div className="space-y-4 pt-1">
        <div className="flex items-center justify-between text-xs">
          <label className="font-semibold text-slate-800 flex items-center gap-1.5">
            <Sliders size={14} className="text-indigo-600" />
            <span>Rotary / Physical Threshold Slider (10% - 150%)</span>
          </label>
          <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
            ${triggerDollarAmount.toFixed(2)} Trigger Target
          </span>
        </div>

        {/* Indented CNC Track Container with Floating 3D Bubble */}
        <div className="relative pt-6 pb-2">
          {/* Floating 3D Readout Tag that follows the thumb */}
          <div
            className="absolute top-0 transition-all pointer-events-none -translate-x-1/2 z-20"
            style={{ 
              left: `${thumbPositionPct}%`,
              transform: `translateX(-50%) translateZ(24px) scale(${isDragging ? 1.08 : 1})`,
              transition: isDragging ? 'none' : 'left 0.15s ease'
            }}
          >
            <div className="px-2 py-0.8 rounded-lg bg-slate-900 text-white font-mono text-[10px] font-bold shadow-[0_6px_14px_rgba(15,23,42,0.25)] flex items-center gap-1 border border-slate-700 whitespace-nowrap">
              <span>{thresholdPercent}%</span>
              {monthlyLimit > 0 && (
                <span className="text-amber-400 font-normal">(${triggerDollarAmount.toFixed(0)})</span>
              )}
            </div>
            {/* Pointer arrow */}
            <div className="w-1.5 h-1.5 bg-slate-900 rotate-45 mx-auto -mt-0.5 border-r border-b border-slate-700" />
          </div>

          {/* Precision Laser-Etched Mechanical Slider */}
          <div className="relative flex items-center h-8">
            <input
              type="range"
              min="10"
              max="150"
              step="5"
              value={thresholdPercent}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onTouchStart={() => setIsDragging(true)}
              onTouchEnd={() => setIsDragging(false)}
              onChange={(e) => setThresholdPercent(Number(e.target.value))}
              className="slider-3d w-full z-10"
            />
          </div>

          {/* Laser-Etched Hash Marks with Ticks */}
          <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-1 px-1 select-none">
            <div className="flex flex-col items-center">
              <span className="w-px h-1.5 bg-slate-400 mb-0.5" />
              <span>10%</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="w-px h-1.5 bg-slate-400 mb-0.5" />
              <span>50%</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="w-px h-2.5 bg-amber-500 mb-0.5" />
              <span className="font-bold text-amber-700">80% Rec</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="w-px h-2.5 bg-rose-500 mb-0.5" />
              <span className="font-bold text-rose-700">100% Cap</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="w-px h-1.5 bg-slate-400 mb-0.5" />
              <span>150%</span>
            </div>
          </div>
        </div>

        {/* 3D Tactile Push-Buttons for Quick Presets */}
        <div className="pt-2">
          <div className="text-[11px] font-semibold text-slate-500 mb-2">
            Tactile Quick Set (Physically Depresses on Press):
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {presets.map((p) => {
              const isSelected = thresholdPercent === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => handlePresetClick(p.value)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                    isSelected
                      ? 'btn-tactile-3d-active ring-2 ring-indigo-400/40'
                      : 'btn-tactile-3d text-slate-700'
                  }`}
                >
                  <div className="leading-tight">{p.label}</div>
                  <div className="text-[10px] opacity-75 font-mono mt-0.5">{p.value}%</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Real-time Dynamic Projection Plate */}
        <div className="p-3.5 rounded-xl bg-[#F8F9FB] border border-slate-300/80 shadow-[0_2px_8px_rgba(15,23,42,0.04),inset_0_1px_1px_rgba(255,255,255,1)] flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldAlert size={15} />
          </div>
          <div className="text-xs">
            <span className="font-semibold text-slate-900">Sentinel Action Protocol: </span>
            {monthlyLimit > 0 ? (
              <span className="text-slate-600">
                Visual toasts and warning banners trigger the instant expenditure hits{' '}
                <strong className="text-slate-900 font-mono font-bold">${triggerDollarAmount.toFixed(2)}</strong>{' '}
                ({thresholdPercent}% of your ${monthlyLimit.toFixed(2)} monthly ceiling).
              </span>
            ) : (
              <span className="text-slate-500">
                Configure your monthly budget amount above to see live financial trigger calculations.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Multi-Tier Milestones & Channels in Tactile Wells */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-300/70">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">
            Escalation Milestones (% comma-separated)
          </label>
          <input
            type="text"
            value={thresholdsStr}
            onChange={(e) => setThresholdsStr(e.target.value)}
            placeholder="50, 80, 100"
            className="w-full bg-[#FFFFFF] border border-slate-300/80 rounded-xl px-3.5 py-2 text-slate-900 font-mono focus:outline-none focus:border-indigo-500 text-xs transition-colors shadow-[inset_0_1px_3px_rgba(0,0,0,0.04)]"
          />
          <p className="text-[11px] text-slate-500">
            Tiered thresholds logged in the immutable FinOps audit chain.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700">Notification Delivery Channels</label>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                  dashboardAlerts
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                    : 'bg-white border-slate-300'
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
                  In-App 3D Toast & Visual Breach Banner (Immediate)
                </span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer group">
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                  emailAlerts
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                    : 'bg-white border-slate-300'
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
