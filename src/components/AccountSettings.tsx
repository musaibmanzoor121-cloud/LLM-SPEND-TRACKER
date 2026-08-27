import React, { useState } from 'react';
import { User, KeyRound, AlertTriangle } from 'lucide-react';

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
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/10">
        <div>
          <h1 className="text-xl font-bold tracking-tight uppercase text-white">Account Settings</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-xs text-white/40 uppercase tracking-widest mb-6 font-medium flex items-center gap-2">
            <KeyRound size={14} /> Change Password
          </h2>
          
          {message && <div className="bg-green-500/10 text-green-400 text-sm p-3 rounded-lg mb-4">{message}</div>}
          {error && <div className="bg-red-500/10 text-red-400 text-sm p-3 rounded-lg mb-4">{error}</div>}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs text-white/40 uppercase tracking-widest font-medium">Current Password</label>
              <input 
                type="password" 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full bg-[#0B1220] border border-white/10 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[#3DDC97] text-sm transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-white/40 uppercase tracking-widest font-medium">New Password</label>
              <input 
                type="password" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full bg-[#0B1220] border border-white/10 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[#3DDC97] text-sm transition-colors"
              />
            </div>
            <button 
              type="submit" 
              disabled={loading || !currentPassword || !newPassword}
              className="bg-white/10 text-white font-medium px-5 py-2.5 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 text-sm w-full mt-2"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-6 flex flex-col items-start justify-between">
          <div>
            <h2 className="text-xs text-red-400 uppercase tracking-widest mb-4 font-medium flex items-center gap-2">
              <AlertTriangle size={14} /> Danger Zone
            </h2>
            <p className="text-white/50 text-sm leading-relaxed mb-6">
              Deleting your account is permanent. All encrypted API keys, budgets, and historical usage snapshots will be immediately erased.
            </p>
          </div>
          <button 
            onClick={handleDeleteAccount}
            className="bg-red-500/10 text-red-400 border border-red-500/20 font-medium px-5 py-2.5 rounded-lg hover:bg-red-500/20 transition-colors text-sm w-full uppercase tracking-wider"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
