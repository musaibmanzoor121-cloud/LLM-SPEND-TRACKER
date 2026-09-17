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
    <div className="space-y-4 border border-white/10 rounded-lg p-4 bg-[#0B1220]/50 mt-4">
      <div className="flex items-center gap-2 mb-2">
        <Bell size={16} className="text-[#3DDC97]" />
        <h3 className="text-sm font-semibold text-white">Alert Preferences</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs text-white/40 uppercase tracking-widest font-medium">Alert Thresholds (%)</label>
          <input 
            type="text" 
            value={thresholdsStr}
            onChange={(e) => setThresholdsStr(e.target.value)}
            placeholder="50, 80, 100"
            className="w-full bg-[#0B1220] border border-white/10 rounded-lg px-3 py-2.5 text-white font-mono focus:outline-none focus:border-[#3DDC97] text-sm transition-colors"
          />
          <p className="text-xs text-white/40 mt-1">Comma-separated percentages</p>
        </div>

        <div className="space-y-3">
          <label className="text-xs text-white/40 uppercase tracking-widest font-medium">Notification Channels</label>
          
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${emailAlerts ? 'bg-[#3DDC97] border-[#3DDC97]' : 'border-white/20 group-hover:border-white/40'}`}>
                {emailAlerts && <svg className="w-3.5 h-3.5 text-[#0B1220]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
              <input type="checkbox" className="hidden" checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} />
              <div className="flex items-center gap-2">
                <Mail size={14} className={emailAlerts ? 'text-white' : 'text-white/40'} />
                <span className={`text-sm ${emailAlerts ? 'text-white' : 'text-white/60'}`}>Email Alerts</span>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${dashboardAlerts ? 'bg-[#3DDC97] border-[#3DDC97]' : 'border-white/20 group-hover:border-white/40'}`}>
                {dashboardAlerts && <svg className="w-3.5 h-3.5 text-[#0B1220]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
              <input type="checkbox" className="hidden" checked={dashboardAlerts} onChange={(e) => setDashboardAlerts(e.target.checked)} />
              <div className="flex items-center gap-2">
                <LayoutDashboard size={14} className={dashboardAlerts ? 'text-white' : 'text-white/40'} />
                <span className={`text-sm ${dashboardAlerts ? 'text-white' : 'text-white/60'}`}>Dashboard Notifications</span>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
