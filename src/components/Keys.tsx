import React, { useEffect, useState } from 'react';
import { KeyRound, Plus, Trash2 } from 'lucide-react';

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
    if (!confirm('Are you sure you want to delete this key?')) return;
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
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/10">
        <div>
          <h1 className="text-xl font-bold tracking-tight uppercase text-white">API Credentials</h1>
        </div>
        <div className="text-xs font-mono uppercase tracking-widest text-white/40">
          Encrypted at Rest
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
        <h2 className="text-xs text-white/40 uppercase tracking-widest mb-6 font-medium flex items-center gap-2">
          <Plus size={14} /> Add New Key
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-white/40 uppercase tracking-widest font-medium">Provider</label>
              <select 
                value={providerId} 
                onChange={(e) => setProviderId(e.target.value)}
                className="w-full bg-[#0B1220] border border-white/10 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[#3DDC97] text-sm transition-colors"
              >
                <option value="openai">OpenAI (Admin Key)</option>
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
            <div className="space-y-2">
              <label className="text-xs text-white/40 uppercase tracking-widest font-medium">Label (Optional)</label>
              <input 
                type="text" 
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. Production Org"
                className="w-full bg-[#0B1220] border border-white/10 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[#3DDC97] text-sm transition-colors"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-white/40 uppercase tracking-widest font-medium">API Key</label>
            <input 
              type="password" 
              value={keyValue}
              onChange={(e) => setKeyValue(e.target.value)}
              required
              placeholder="sk-..."
              className="w-full bg-[#0B1220] border border-white/10 rounded-lg px-3 py-2.5 text-white font-mono focus:outline-none focus:border-[#3DDC97] text-sm transition-colors"
            />
          </div>
          <button 
            type="submit" 
            disabled={submitting || !keyValue}
            className="mt-2 bg-[#3DDC97] text-[#0B1220] font-medium px-5 py-2.5 rounded-lg hover:bg-[#3DDC97]/90 transition-colors disabled:opacity-50 text-sm"
          >
            {submitting ? 'Saving...' : 'Save Encrypted Key'}
          </button>
        </form>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden flex-grow">
        <table className="w-full text-left">
          <thead className="border-b border-white/10">
            <tr>
              <th className="px-6 py-4 text-xs text-white/40 uppercase tracking-widest font-medium">Provider</th>
              <th className="px-6 py-4 text-xs text-white/40 uppercase tracking-widest font-medium">Label</th>
              <th className="px-6 py-4 text-xs text-white/40 uppercase tracking-widest font-medium">Status</th>
              <th className="px-6 py-4 text-xs text-white/40 uppercase tracking-widest font-medium">Added</th>
              <th className="px-6 py-4 text-xs text-white/40 uppercase tracking-widest font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-white/30 text-sm">Loading keys...</td></tr>
            ) : keys.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-white/30 text-sm">No API keys stored.</td></tr>
            ) : (
              keys.map((key) => (
                <tr key={key.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 capitalize font-medium text-sm">{key.provider_id}</td>
                  <td className="px-6 py-4 text-white/70 text-sm">{key.label || '-'}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium bg-[#3DDC97]/10 text-[#3DDC97] uppercase tracking-widest">
                      <span className="w-1 h-1 rounded-full bg-[#3DDC97]"></span>
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white/50 text-sm font-mono">
                    {new Date(key.created_at).toISOString().split('T')[0]}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(key.id)}
                      className="text-white/40 hover:text-red-400 transition-colors"
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
  );
}
