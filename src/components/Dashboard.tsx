import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { RefreshCw } from 'lucide-react';

interface SpendData {
  provider_id: string;
  total_spend: number;
}

interface Budget {
  provider_id: string;
  monthly_limit_usd: number;
}

interface ModelBreakdown {
  provider_id: string;
  model: string;
  total_cost: number;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    budgets: Budget[];
    spendData: SpendData[];
    dailyTrend: any[];
    modelBreakdown: ModelBreakdown[];
  } | null>(null);
  const [polling, setPolling] = useState(false);

  const [timeframe, setTimeframe] = useState('this_month');

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/dashboard?timeframe=${timeframe}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('watchdog_token')}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeframe]);

  const triggerPoll = async () => {
    setPolling(true);
    try {
      await fetch('/api/cron/poll-usage', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('watchdog_token')}` }
      });
      await fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setPolling(false);
    }
  };

  const exportToCSV = () => {
    if (!data) return;
    const headers = ['Date', 'Provider', 'Cost (USD)'];
    const rows = data.dailyTrend.map(row => 
      `${new Date(row.snapshot_date).toISOString().split('T')[0]},${row.provider_id},${row.cost}`
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `api-watchdog-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="text-white/40 text-sm">Loading dashboard...</div>;

  // Format trend data for Recharts (grouping by date)
  const chartData = data?.dailyTrend.reduce((acc: any[], curr) => {
    const dateStr = format(new Date(curr.snapshot_date), 'MMM dd');
    let entry = acc.find((e) => e.date === dateStr);
    if (!entry) {
      entry = { date: dateStr };
      acc.push(entry);
    }
    entry[curr.provider_id] = Number(curr.cost);
    return acc;
  }, []) || [];

  const totalSpendMTD = data?.spendData.reduce((acc, curr) => acc + Number(curr.total_spend), 0) || 0;
  const daysInMonth = new Date().getDate();
  const dailyAverage = totalSpendMTD / daysInMonth || 0;
  const estimatedEOM = dailyAverage * new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-end mb-10 pb-6 border-b border-white/5">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-heading font-semibold tracking-tight text-white">Spend Overview</h1>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3DDC97] shadow-[0_0_8px_rgba(61,220,151,0.8)] animate-pulse"></span>
            <span className="text-xs uppercase tracking-widest text-white/40 font-medium">All Systems Nominal</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={timeframe} 
            onChange={(e) => setTimeframe(e.target.value)}
            className="bg-[#0A0F1C] hover:bg-[#111827] border border-white/10 text-white/80 px-4 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:border-[#3DDC97] transition-all cursor-pointer shadow-[0_2px_10px_rgba(0,0,0,0.2)]"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
          </select>
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-[#0A0F1C] hover:bg-[#111827] border border-white/10 text-white/80 px-5 py-2.5 rounded-xl transition-all text-sm font-medium shadow-[0_2px_10px_rgba(0,0,0,0.2)]"
          >
            Export CSV
          </button>
          <button 
            onClick={triggerPoll}
            disabled={polling}
            className="flex items-center gap-2 bg-gradient-to-r from-[#3DDC97] to-[#25A16E] hover:opacity-90 text-[#0B1220] px-5 py-2.5 rounded-xl transition-all disabled:opacity-50 text-sm font-semibold shadow-[0_0_20px_rgba(61,220,151,0.25)]"
          >
            <RefreshCw size={16} className={polling ? 'animate-spin' : ''} />
            {polling ? 'Syncing...' : 'Sync Data'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-b from-white/[0.03] to-transparent p-8 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#3DDC97] to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <p className="text-[11px] text-white/40 uppercase tracking-widest mb-3 font-semibold">Total Spend</p>
          <p className="text-5xl font-heading font-light text-white tracking-tight">${totalSpendMTD.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-b from-white/[0.03] to-transparent p-8 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <p className="text-[11px] text-white/40 uppercase tracking-widest mb-3 font-semibold">Daily Average</p>
          <p className="text-5xl font-heading font-light text-white tracking-tight">${dailyAverage.toFixed(2)}</p>
        </div>
        <div className="bg-gradient-to-b from-white/[0.03] to-transparent p-8 rounded-2xl border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-transparent opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <p className="text-[11px] text-white/40 uppercase tracking-widest mb-3 font-semibold">Estimated EOM Bill</p>
          <p className="text-5xl font-heading font-light text-white tracking-tight">${estimatedEOM.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 flex-grow">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-white/5 p-6 rounded-xl border border-white/10 flex-grow">
            <h2 className="text-xs text-white/40 uppercase tracking-widest mb-6 font-medium">Provider Budgets</h2>
            
            {data?.budgets.map((budget) => {
              const spend = data.spendData.find(s => s.provider_id === budget.provider_id)?.total_spend || 0;
              const limit = Number(budget.monthly_limit_usd);
              const percent = Math.min((spend / limit) * 100, 100);
              
              let colorClass = 'bg-[#3DDC97]'; // Teal-green
              if (percent >= 100) colorClass = 'bg-red-500';
              else if (percent >= 80) colorClass = 'bg-[#F5A623]'; // Amber
              
              return (
                <div key={budget.provider_id} className="mb-8 last:mb-0">
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-lg font-medium text-white capitalize">{budget.provider_id}</span>
                    <span className="font-mono text-sm">
                      ${Number(spend).toFixed(2)} <span className="text-white/40">/ ${limit.toFixed(2)}</span>
                    </span>
                  </div>
                  
                  <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${colorClass}`} 
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[10px] uppercase text-white/30 tracking-tight">
                    {percent >= 100 ? 'Limit exceeded' : percent >= 80 ? 'Warning threshold reached' : 'Status: Normal'} ({percent.toFixed(1)}%)
                  </p>
                </div>
              );
            })}
            
            {(!data?.budgets || data.budgets.length === 0) && (
              <div className="py-10 text-center text-white/40 text-sm">
                No budgets configured yet.
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 bg-white/5 p-6 rounded-xl border border-white/10 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xs text-white/40 uppercase tracking-widest font-medium">Daily Trend</h2>
          </div>
          <div className="flex-grow min-h-[300px] w-full relative">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" vertical={false} />
                  <XAxis dataKey="date" stroke="#ffffff66" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#ffffff66" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0B1220', borderColor: '#ffffff1a', color: '#fff', borderRadius: '8px' }}
                    itemStyle={{ fontFamily: 'monospace', fontSize: '12px' }}
                    labelStyle={{ color: '#ffffff80', fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}
                    formatter={(value: number) => [`$${value.toFixed(4)}`, 'Cost']}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', opacity: 0.8 }} />
                  <Line type="monotone" dataKey="openai" stroke="#3DDC97" strokeWidth={2} dot={{ r: 3, fill: '#0B1220', strokeWidth: 2 }} activeDot={{ r: 5 }} name="OpenAI" />
                  <Line type="monotone" dataKey="anthropic" stroke="#F5A623" strokeWidth={2} dot={{ r: 3, fill: '#0B1220', strokeWidth: 2 }} activeDot={{ r: 5 }} name="Anthropic" />
                  <Line type="monotone" dataKey="gemini" stroke="#4285F4" strokeWidth={2} dot={{ r: 3, fill: '#0B1220', strokeWidth: 2 }} activeDot={{ r: 5 }} name="Google Gemini" />
                  <Line type="monotone" dataKey="mistral" stroke="#E91E63" strokeWidth={2} dot={{ r: 3, fill: '#0B1220', strokeWidth: 2 }} activeDot={{ r: 5 }} name="Mistral AI" />
                  <Line type="monotone" dataKey="cohere" stroke="#9C27B0" strokeWidth={2} dot={{ r: 3, fill: '#0B1220', strokeWidth: 2 }} activeDot={{ r: 5 }} name="Cohere" />
                  <Line type="monotone" dataKey="groq" stroke="#F55036" strokeWidth={2} dot={{ r: 3, fill: '#0B1220', strokeWidth: 2 }} activeDot={{ r: 5 }} name="Groq" />
                  <Line type="monotone" dataKey="deepseek" stroke="#4D6BFE" strokeWidth={2} dot={{ r: 3, fill: '#0B1220', strokeWidth: 2 }} activeDot={{ r: 5 }} name="DeepSeek" />
                  <Line type="monotone" dataKey="perplexity" stroke="#22B8CD" strokeWidth={2} dot={{ r: 3, fill: '#0B1220', strokeWidth: 2 }} activeDot={{ r: 5 }} name="Perplexity" />
                  <Line type="monotone" dataKey="together" stroke="#0F6FFF" strokeWidth={2} dot={{ r: 3, fill: '#0B1220', strokeWidth: 2 }} activeDot={{ r: 5 }} name="Together AI" />
                  <Line type="monotone" dataKey="openrouter" stroke="#9B6DF7" strokeWidth={2} dot={{ r: 3, fill: '#0B1220', strokeWidth: 2 }} activeDot={{ r: 5 }} name="OpenRouter" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-white/30 text-sm">
                No usage data collected yet this month.
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
          <h2 className="text-xs text-white/40 uppercase tracking-widest font-medium mb-6">Model Breakdown</h2>
          <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
            {(!data?.modelBreakdown || data.modelBreakdown.length === 0) ? (
               <div className="text-white/30 text-sm text-center py-4">No model usage recorded.</div>
            ) : (
              data.modelBreakdown.map((item, index) => {
                const totalSpend = data.spendData.reduce((acc, curr) => acc + Number(curr.total_spend), 0) || 1;
                const percent = Math.min((Number(item.total_cost) / totalSpend) * 100, 100);
                return (
                  <div key={index} className="flex flex-col">
                    <div className="flex justify-between items-center mb-1 text-sm">
                      <div className="flex items-center gap-2 text-white flex-wrap">
                        <span className="capitalize text-white/60 text-xs">[{item.provider_id}]</span>
                        <span className="font-medium">{item.model}</span>
                        {(item as any).project_tag && (item as any).project_tag !== 'default' && (
                          <span className="bg-white/10 text-white/70 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider">
                            {(item as any).project_tag}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[#3DDC97]">${Number(item.total_cost).toFixed(4)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-white/40" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        
        <div className="bg-white/5 p-6 rounded-xl border border-white/10 flex flex-col justify-center items-center text-center">
          <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4 text-white/40">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H18c2.2 0 4 1.8 4 4v8Z"/><polyline points="15,9 18,9 18,11"/><path d="M6.5 5C9 5 11 7 11 9.5V17a2 2 0 0 1-2 2v0"/></svg>
          </div>
          <h3 className="text-sm font-medium text-white mb-2">Automated Notifications</h3>
          <p className="text-xs text-white/50 max-w-sm mb-4">
            If your spending crosses 80% of your configured budget, Watchdog will immediately dispatch an alert via Resend to your registered email address.
          </p>
          <div className="px-3 py-1 bg-[#3DDC97]/10 text-[#3DDC97] text-[10px] uppercase tracking-widest rounded-full">
            Active
          </div>
        </div>
      </div>
      
      <footer className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center text-[10px] text-white/30 uppercase tracking-[0.2em]">
        <div>Last fetch: {new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC</div>
        <div>AES-256-GCM Encrypted Storage Active</div>
      </footer>
    </div>
  );
}
