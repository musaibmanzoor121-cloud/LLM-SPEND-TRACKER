import React, { useEffect, useState } from 'react';
import { Settings } from 'lucide-react';

interface Budget {
  provider_id: string;
  monthly_limit_usd: number;
}

export default function Budgets() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [providerId, setProviderId] = useState('openai');
  const [limit, setLimit] = useState('');
  const [thresholdsStr, setThresholdsStr] = useState('50, 80, 100');
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
    
    // Parse thresholds
    const thresholds = thresholdsStr.split(',').map(t => parseInt(t.trim())).filter(t => !isNaN(t));

    setSubmitting(true);
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('watchdog_token')}`
        },
        body: JSON.stringify({ provider_id: providerId, limit: Number(limit), thresholds })
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
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/10">
        <div>
          <h1 className="text-xl font-bold tracking-tight uppercase text-white">Budgets</h1>
        </div>
        <div className="text-xs font-mono uppercase tracking-widest text-white/40">
          Monthly Spend Limits
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8 max-w-2xl">
        <h2 className="text-xs text-white/40 uppercase tracking-widest mb-6 font-medium flex items-center gap-2">
          <Settings size={14} /> Configure Budget
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-white/40 uppercase tracking-widest font-medium">Provider</label>
              <select 
                value={providerId} 
                onChange={(e) => setProviderId(e.target.value)}
                className="w-full bg-[#0B1220] border border-white/10 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[#3DDC97] text-sm transition-colors"
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
            <div className="space-y-2">
              <label className="text-xs text-white/40 uppercase tracking-widest font-medium">Monthly Limit ($)</label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                required
                placeholder="100.00"
                className="w-full bg-[#0B1220] border border-white/10 rounded-lg px-3 py-2.5 text-white font-mono focus:outline-none focus:border-[#3DDC97] text-sm transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-white/40 uppercase tracking-widest font-medium">Alert Thresholds (%)</label>
              <input 
                type="text" 
                value={thresholdsStr}
                onChange={(e) => setThresholdsStr(e.target.value)}
                placeholder="50, 80, 100"
                className="w-full bg-[#0B1220] border border-white/10 rounded-lg px-3 py-2.5 text-white font-mono focus:outline-none focus:border-[#3DDC97] text-sm transition-colors"
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={submitting || !limit}
            className="mt-2 bg-[#3DDC97] text-[#0B1220] font-medium px-5 py-2.5 rounded-lg hover:bg-[#3DDC97]/90 transition-colors disabled:opacity-50 text-sm"
          >
            {submitting ? 'Saving...' : 'Save Budget'}
          </button>
        </form>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden max-w-2xl flex-grow">
        <table className="w-full text-left">
          <thead className="border-b border-white/10">
            <tr>
              <th className="px-6 py-4 text-xs text-white/40 uppercase tracking-widest font-medium">Provider</th>
              <th className="px-6 py-4 text-xs text-white/40 uppercase tracking-widest font-medium">Monthly Limit</th>
              <th className="px-6 py-4 text-xs text-white/40 uppercase tracking-widest font-medium">Alerts At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={3} className="px-6 py-8 text-center text-white/30 text-sm">Loading budgets...</td></tr>
            ) : budgets.length === 0 ? (
              <tr><td colSpan={3} className="px-6 py-8 text-center text-white/30 text-sm">No budgets configured.</td></tr>
            ) : (
              budgets.map((budget) => (
                <tr key={budget.provider_id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 capitalize font-medium text-sm">{budget.provider_id}</td>
                  <td className="px-6 py-4 font-mono text-[#3DDC97] text-sm">${Number(budget.monthly_limit_usd).toFixed(2)}</td>
                  <td className="px-6 py-4 text-white/60 text-sm font-mono">
                    {budget.alert_thresholds ? budget.alert_thresholds.join('%, ') + '%' : '50%, 80%, 100%'}
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
