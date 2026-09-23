/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { KeyRound, Plus, Trash2, ShieldCheck, Lock } from 'lucide-react';

interface ApiKey {
  id: string;
  provider_id: string;
  label: string;
  is_active: boolean;
  created_at: string;
}

export default function Keys() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [providerId, setProviderId] = useState('openai');
  const [keyValue, setKeyValue] = useState('');
  const [label, setLabel] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchKeys = async () => {
    try {
      const res = await fetch('/api/keys', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('watchdog_token')}` }
      });
      if (res.ok) {
        setKeys(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyValue) return;
    
    setSubmitting(true);
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('watchdog_token')}`
        },
        body: JSON.stringify({ provider_id: providerId, key: keyValue, label })
      });
      if (res.ok) {
        setKeyValue('');
        setLabel('');
        fetchKeys();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to revoke and delete this API key?')) return;
    try {
      await fetch(`/api/keys/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('watchdog_token')}` }
      });
      fetchKeys();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-slate-900 tracking-tight">
            API Key Vault
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl font-normal">
            Manage your encrypted provider credentials for automated token spend ingestion and cost telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          <Lock size={14} />
          <span>AES-256 Vault Encryption Active</span>
        </div>
      </div>

      {/* Add New Key Form (White 3D Card) */}
      <div className="card-3d bg-white rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Plus size={16} />
          </div>
          <h2 className="text-base font-heading font-bold text-slate-900 tracking-tight">
            Add New API Credential
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
                <option value="openai">OpenAI (Admin / Read-Only Key)</option>
                <option value="anthropic">Anthropic (Admin Key)</option>
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
              <label className="text-xs font-semibold text-slate-600">Label (Optional)</label>
              <input 
                type="text" 
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Production Org or Staging"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-500 text-xs font-medium transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Secret API Key</label>
            <input 
              type="password" 
              value={keyValue}
              onChange={(e) => setKeyValue(e.target.value)}
              required
              placeholder="sk-..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono focus:outline-none focus:border-indigo-500 text-xs transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)]"
            />
          </div>
          <div className="pt-2">
            <button 
              type="submit" 
              disabled={submitting || !keyValue}
              className="btn-3d-primary px-5 py-2.5 rounded-xl font-semibold text-xs transition-all disabled:opacity-50 cursor-pointer shadow-[0_4px_14px_rgba(99,102,241,0.35)]"
            >
              {submitting ? 'Encrypting & Saving...' : 'Save Encrypted Key'}
            </button>
          </div>
        </form>
      </div>

      {/* Connected Keys Table (White 3D Card) */}
      <div className="card-3d bg-white rounded-2xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound size={16} className="text-indigo-600" />
            <h2 className="text-base font-heading font-bold text-slate-900 tracking-tight">
              Stored Provider Credentials
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {keys.length} Connected
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/70 border-b border-slate-100 text-slate-500 text-[11px] font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Provider</th>
                <th className="px-6 py-3.5">Label</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Created</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400 font-medium">Loading credentials...</td></tr>
              ) : keys.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400 font-medium">No API keys stored in vault yet. Add one above to start tracking.</td></tr>
              ) : (
                keys.map((key) => (
                  <tr key={key.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 capitalize font-semibold text-slate-900">{key.provider_id}</td>
                    <td className="px-6 py-4 text-slate-600">{key.label || 'Default Organization'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/70 uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-[11px]">
                      {new Date(key.created_at).toISOString().split('T')[0]}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(key.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Key"
                      >
                        <Trash2 size={16} />
                      </button>
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
