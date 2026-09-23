/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Bell, Mail, LayoutDashboard } from 'lucide-react';

interface AlertConfigProps {
  thresholdsStr: string;
  setThresholdsStr: (val: string) => void;
  emailAlerts: boolean;
  setEmailAlerts: (val: boolean) => void;
  dashboardAlerts: boolean;
  setDashboardAlerts: (val: boolean) => void;
}

export default function AlertThresholdsConfig({
  thresholdsStr,
  setThresholdsStr,
  emailAlerts,
  setEmailAlerts,
  dashboardAlerts,
  setDashboardAlerts
}: AlertConfigProps) {
  return (
    <div className="space-y-4 border border-slate-200/80 rounded-xl p-4 bg-slate-50/70 mt-4">
      <div className="flex items-center gap-2 mb-2">
        <Bell size={16} className="text-indigo-600" />
        <h3 className="text-sm font-bold text-slate-900">Alert Preferences & Delivery Channels</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-600">Alert Thresholds (%)</label>
          <input 
            type="text" 
            value={thresholdsStr}
            onChange={(e) => setThresholdsStr(e.target.value)}
            placeholder="50, 80, 100"
            className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-slate-900 font-mono focus:outline-none focus:border-indigo-500 text-xs transition-colors shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
          />
          <p className="text-[11px] text-slate-400">Comma-separated percentages (e.g. 50, 80, 100)</p>
        </div>

        <div className="space-y-2.5">
          <label className="text-xs font-semibold text-slate-600">Notification Delivery</label>
          
          <div className="flex flex-col gap-2.5">
            <label className="flex items-center gap-2.5 cursor-pointer group">
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${emailAlerts ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300'}`}>
                {emailAlerts && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
              <input type="checkbox" className="hidden" checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} />
              <div className="flex items-center gap-2">
                <Mail size={14} className={emailAlerts ? 'text-indigo-600' : 'text-slate-400'} />
                <span className={`text-xs font-medium ${emailAlerts ? 'text-slate-900' : 'text-slate-500'}`}>Email Alerts (Resend)</span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer group">
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${dashboardAlerts ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-300'}`}>
                {dashboardAlerts && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
              <input type="checkbox" className="hidden" checked={dashboardAlerts} onChange={(e) => setDashboardAlerts(e.target.checked)} />
              <div className="flex items-center gap-2">
                <LayoutDashboard size={14} className={dashboardAlerts ? 'text-indigo-600' : 'text-slate-400'} />
                <span className={`text-xs font-medium ${dashboardAlerts ? 'text-slate-900' : 'text-slate-500'}`}>In-App Banner Warnings</span>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
