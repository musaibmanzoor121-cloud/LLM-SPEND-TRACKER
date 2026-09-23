/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, KeyRound, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function AccountSettings({ onLogout }: { onLogout: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    
    try {
      const res = await fetch('/api/account/password', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('watchdog_token')}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      
      const data = await res.json();
      if (res.ok) {
        setMessage('Password updated successfully');
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setError(data.error || 'Failed to update password');
      }
    } catch (e) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('WARNING: This will permanently delete your account, API keys, budgets, and all usage history. Are you absolutely sure?')) {
      return;
    }
    
    try {
      const res = await fetch('/api/account', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('watchdog_token')}` }
      });
      
      if (res.ok) {
        onLogout();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete account');
      }
    } catch (e) {
      setError('Network error');
    }
  };

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-slate-900 tracking-tight">
            Account Preferences
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl font-normal">
            Configure security, authentication credentials, and platform administration settings.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-semibold">
          <ShieldCheck size={14} className="text-indigo-600" />
          <span>Google Workspace SSO Linked</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {/* Change Password Card */}
        <div className="card-3d bg-white rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <KeyRound size={16} />
            </div>
            <h2 className="text-base font-heading font-bold text-slate-900 tracking-tight">
              Update Password
            </h2>
          </div>
          
          {message && (
            <div className="bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-xs p-3 rounded-xl mb-4 font-medium">
              {message}
            </div>
          )}
          {error && (
            <div className="bg-rose-50 text-rose-700 border border-rose-200/70 text-xs p-3 rounded-xl mb-4 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Current Password</label>
              <input 
                type="password" 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-500 text-xs transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">New Password</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-500 text-xs transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading || !currentPassword || !newPassword}
              className="btn-3d-primary w-full py-2.5 rounded-xl font-semibold text-xs transition-all disabled:opacity-50 cursor-pointer shadow-[0_4px_14px_rgba(99,102,241,0.35)] mt-2"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="card-3d bg-white rounded-2xl p-6 sm:p-8 border-rose-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-4 pb-4 border-b border-rose-100">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle size={16} />
              </div>
              <h2 className="text-base font-heading font-bold text-rose-700 tracking-tight">
                Danger Zone
              </h2>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed mb-6 font-normal">
              Deleting your account is irreversible. All encrypted API keys, budgets, token logs, and historical usage snapshots will be permanently purged.
            </p>
          </div>

          <button 
            type="button" 
            onClick={handleDeleteAccount}
            className="w-full border border-rose-200 bg-rose-50 text-rose-700 font-semibold px-4 py-2.5 rounded-xl hover:bg-rose-100 transition-colors text-xs cursor-pointer shadow-sm"
          >
            Delete Account Permanently
          </button>
        </div>
      </div>
    </div>
  );
}
