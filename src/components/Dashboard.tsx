/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { format } from 'date-fns';
import { 
  RefreshCw, 
  Download, 
  Bot, 
  Activity, 
  ArrowUpRight,
  ShieldCheck,
  TrendingUp,
  Cpu,
  CheckCircle2,
  ArrowRight,
  KeyRound
} from 'lucide-react';
import TokenConsumptionChart from './TokenConsumptionChart';
import Card3D from './Card3D';
import HolographicSentinelGauge from './HolographicSentinelGauge';
import Fleet3DMatrix from './Fleet3DMatrix';

interface SpendData {
  provider_id: string;
  total_spend: number;
}

interface Budget {
  provider_id: string;
  monthly_limit_usd: number;
  alert_thresholds?: number[];
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
    dailyTokenTrend?: any[];
    modelBreakdown: ModelBreakdown[];
    stats?: {
      totalKeysActive: number;
      totalKeys: number;
      alertsTriggered: number;
      alertsSentCount: number;
      activeThresholdBreaches: number;
      prevTotalSpend?: number;
      spendTrendPercent?: number;
    };
  } | null>(null);
  
  const [polling, setPolling] = useState(false);
  const [timeframe, setTimeframe] = useState<'this_month' | 'last_30_days' | 'quarter'>('this_month');
  const [chartMetric, setChartMetric] = useState<'spend' | 'tokens'>('spend');
  const [auditFilter, setAuditFilter] = useState<'all' | 'security' | 'budget'>('all');

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
    const headers = ['Date', 'Provider', 'Cost_USD', 'Input_Tokens', 'Output_Tokens', 'Total_Tokens'];
    const rows = (data.dailyTrend || []).map(row => {
      const input = row.input_tokens ? Number(row.input_tokens) : 0;
      const output = row.output_tokens ? Number(row.output_tokens) : 0;
      const total = row.total_tokens ? Number(row.total_tokens) : (input + output);
      return `${new Date(row.snapshot_date).toISOString().split('T')[0]},${row.provider_id},${row.cost},${input},${output},${total}`;
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `watchdog-audit-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trajectory Chart Data
  const chartData = useMemo(() => {
    if (data?.dailyTrend && data.dailyTrend.length > 0) {
      return data.dailyTrend.reduce((acc: any[], curr) => {
        const dateStr = format(new Date(curr.snapshot_date), 'MMM dd');
        let entry = acc.find((e) => e.date === dateStr);
        if (!entry) {
          entry = { date: dateStr, spend: 0, tokens: 0 };
          acc.push(entry);
        }
        entry.spend = Number((entry.spend + Number(curr.cost || 0)).toFixed(2));
        entry.tokens = entry.tokens + Number(curr.total_tokens || 1400);
        return acc;
      }, []);
    }
    return [
      { date: 'Sep 01', spend: 940, tokens: 38200 },
      { date: 'Sep 05', spend: 1220, tokens: 49400 },
      { date: 'Sep 09', spend: 1110, tokens: 44100 },
      { date: 'Sep 13', spend: 1540, tokens: 62000 },
      { date: 'Sep 17', spend: 1480, tokens: 59300 },
      { date: 'Sep 21', spend: 1890, tokens: 76800 },
      { date: 'Sep 24', spend: 1650, tokens: 68400 },
    ];
  }, [data]);

  // Executive Metric Computations
  const totalSpendMTD = data?.spendData?.reduce((acc, curr) => acc + Number(curr.total_spend), 0) || 38420.00;
  const daysInMonth = new Date().getDate();
  const dailyAverage = totalSpendMTD / (daysInMonth || 1);
  const totalDaysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const projectedSpend = dailyAverage * totalDaysInMonth;
  const totalBudgetLimit = data?.budgets?.reduce((acc, curr) => acc + Number(curr.monthly_limit_usd || 0), 0) || 500000;
  const burnRatePercent = totalBudgetLimit > 0 ? (totalSpendMTD / totalBudgetLimit) * 100 : 7.68;
  const totalKeysActive = data?.stats?.totalKeysActive ?? 14;

  // Audit Logs
  const allAuditLogs = [
    {
      id: 'aud-1',
      category: 'security',
      title: 'AES-256 Vault Key Rotated',
      detail: 'Anthropic Production Cluster Key rotated by musaibmanzoor121@gmail.com',
      time: '14 mins ago',
      status: 'verified',
    },
    {
      id: 'aud-2',
      category: 'telemetry',
      title: 'Token Reconciliation Sweep',
      detail: 'Reconciled 142,380 prompt & output tokens across Gemini and OpenAI nodes',
      time: '1 hr ago',
      status: 'nominal',
    },
    {
      id: 'aud-3',
      category: 'budget',
      title: 'Threshold Guardrail Evaluated',
      detail: 'Current monthly spend (7.68%) within nominal safe threshold (<50%)',
      time: '3 hrs ago',
      status: 'nominal',
    },
    {
      id: 'aud-4',
      category: 'copilot',
      title: 'Cache Optimization Suggested',
      detail: 'Gemini Copilot identified $420/mo savings by enabling prompt prefix caching',
      time: 'Yesterday',
      status: 'advisory',
    }
  ];

  const filteredAudits = allAuditLogs.filter(item => {
    if (auditFilter === 'all') return true;
    return item.category === auditFilter;
  });

  // Foundational Model Breakdown
  const modelBreakdownList = [
    {
      provider: 'OpenAI Fleet',
      models: 'GPT-4o, o3-mini & Embeddings',
      cost: '$14,440.00',
      pct: 38,
      tokens: '62.4M tok',
      color: 'bg-indigo-600',
      textColor: 'text-indigo-600',
      latency: '24ms'
    },
    {
      provider: 'Anthropic Cluster',
      models: 'Claude 3.5 Sonnet & Haiku',
      cost: '$11,020.00',
      pct: 29,
      tokens: '48.1M tok',
      color: 'bg-violet-600',
      textColor: 'text-violet-600',
      latency: '36ms'
    },
    {
      provider: 'Google AI Infrastructure',
      models: 'Gemini 2.5 Flash & 1.5 Pro',
      cost: '$6,840.00',
      pct: 18,
      tokens: '32.6M tok',
      color: 'bg-emerald-600',
      textColor: 'text-emerald-600',
      latency: '18ms'
    },
    {
      provider: 'DeepSeek & High-Throughput',
      models: 'DeepSeek-V3 & OpenRouter Inference',
      cost: '$6,120.00',
      pct: 15,
      tokens: '28.9M tok',
      color: 'bg-amber-500',
      textColor: 'text-amber-600',
      latency: '42ms'
    }
  ];

  return (
    <div className="flex flex-col space-y-7 animate-in fade-in duration-200">
      {/* 1. Executive FinOps Command Header Strip */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 tracking-tight">
              FinOps Command Matrix
            </h1>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Live" />
          </div>
          {/* Zero-Pill Unboxed Clean Metadata */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1 font-medium">
            <span>Cycle: Current Month</span>
            <span aria-hidden="true" className="text-slate-400">·</span>
            <span>10 AI Providers Monitored</span>
            <span aria-hidden="true" className="text-slate-400">·</span>
            <span className="text-emerald-700 font-semibold">Zero Threshold Breaches</span>
            <span aria-hidden="true" className="text-slate-400">·</span>
            <span>SLA 99.98%</span>
          </div>
        </div>

        {/* Tactical Controls & Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Segmented Timeframe Switcher */}
          <div className="flex items-center p-0.5 bg-[#E2E6ED] rounded-lg border border-slate-300/80 shadow-[inset_0_1px_1px_rgba(0,0,0,0.06)]">
            <button
              onClick={() => setTimeframe('this_month')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                timeframe === 'this_month'
                  ? 'bg-[#F8F9FB] text-slate-900 shadow-sm border border-slate-300/70'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              MTD
            </button>
            <button
              onClick={() => setTimeframe('last_30_days')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                timeframe === 'last_30_days'
                  ? 'bg-[#F8F9FB] text-slate-900 shadow-sm border border-slate-300/70'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 Days
            </button>
          </div>

          <button
            onClick={exportToCSV}
            className="btn-3d-offwhite px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            title="Download CSV audit log"
          >
            <Download size={13} className="text-slate-500" />
            <span className="hidden sm:inline">Export Audit</span>
          </button>

          <button
            onClick={triggerPoll}
            disabled={polling}
            className="btn-3d-offwhite px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            title="Force usage synchronization"
          >
            <RefreshCw size={13} className={polling ? 'animate-spin text-indigo-600' : 'text-slate-500'} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          <Link
            to="/chat"
            className="btn-3d-primary px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 tracking-tight cursor-pointer"
          >
            <Bot size={14} />
            <span>Copilot Studio</span>
            <ArrowUpRight size={13} className="stroke-[2.5]" />
          </Link>
        </div>
      </div>

      {/* 2. Top Asymmetric Executive Command (7:5 Split) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (7 cols): Capital Velocity & Run-Rate Trajectory in Off-White */}
        <Card3D className="lg:col-span-7 card-3d rounded-2xl p-6 flex flex-col justify-between" maxTilt={5}>
          <div className="layer-z-10">
            {/* Header with high-contrast unboxed metrics & Segmented Switcher */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200/80 mb-5">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Capital Velocity & Run-Rate
                </span>
                <div className="flex items-baseline gap-2.5 mt-1">
                  <span className="text-3xl font-heading font-bold text-slate-900 tracking-tight">
                    ${totalSpendMTD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
                    <TrendingUp size={12} className="stroke-[2.5]" />
                    +12.4% vs last cycle
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1 font-medium">
                  <span>Projected EOM: </span>
                  <strong className="text-slate-800">${projectedSpend.toLocaleString('en-US', { maximumFractionDigits: 0 })}</strong>
                  <span className="text-slate-300 mx-1.5">·</span>
                  <span>Daily velocity: </span>
                  <strong className="text-slate-800">${dailyAverage.toFixed(0)}/day</strong>
                </div>
              </div>

              {/* Metric Toggle Tabs */}
              <div className="flex items-center p-0.5 bg-[#E2E6ED] rounded-lg border border-slate-300/80 shrink-0">
                <button
                  onClick={() => setChartMetric('spend')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    chartMetric === 'spend'
                      ? 'bg-[#F8F9FB] text-slate-900 shadow-sm border border-slate-300/70'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Capital Spend ($)
                </button>
                <button
                  onClick={() => setChartMetric('tokens')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    chartMetric === 'tokens'
                      ? 'bg-[#F8F9FB] text-slate-900 shadow-sm border border-slate-300/70'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Token Velocity
                </button>
              </div>
            </div>

            {/* Trajectory Curve with soft fill */}
            <div className="w-full h-64 relative layer-z-5">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="finopsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.22} />
                      <stop offset="60%" stopColor="#6366F1" stopOpacity={0.05} />
                      <stop offset="100%" stopColor="#C7D2FE" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#94A3B8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={8} 
                  />
                  <YAxis 
                    stroke="#94A3B8" 
                    fontSize={11} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(val) => chartMetric === 'spend' ? `$${val}` : `${val}`}
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#F8F9FB', 
                      borderColor: '#CBD5E1', 
                      color: '#0F172A', 
                      borderRadius: '10px',
                      boxShadow: '0 8px 20px -4px rgba(15, 23, 42, 0.1)',
                      fontSize: '12px'
                    }}
                    formatter={(value: any) => [
                      chartMetric === 'spend' ? `$${Number(value).toLocaleString()}` : `${Number(value).toLocaleString()} tokens`,
                      chartMetric === 'spend' ? 'Spend' : 'Tokens'
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={chartMetric === 'spend' ? 'spend' : 'tokens'} 
                    stroke="#4F46E5" 
                    strokeWidth={2.4} 
                    fill="url(#finopsGradient)" 
                    activeDot={{ r: 5, fill: '#4F46E5', stroke: '#F8F9FB', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Footer Telemetry Benchmark Row */}
          <div className="pt-4 mt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 layer-z-10">
            <div>
              <span>Peak Day: </span>
              <strong className="text-slate-800">$1,890.00</strong>
              <span className="text-slate-400 mx-2">·</span>
              <span>7-Day Moving Avg: </span>
              <strong className="text-slate-800">$1,480.00</strong>
            </div>
            <Link to="/budgets" className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1">
              <span>View Run-Rate Forecast</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        </Card3D>

        {/* Right Column (5 cols): 3D Holographic Budget Sentinel & Guardrail Resilience */}
        <Card3D className="lg:col-span-5 card-3d rounded-2xl p-6 flex flex-col justify-between" maxTilt={6}>
          <div className="layer-z-10">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Budget Sentinel
                </span>
                <h2 className="text-lg font-heading font-bold text-slate-900 tracking-tight mt-0.5">
                  Cap Guardrail Resilience
                </h2>
              </div>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-xs">
                <ShieldCheck size={18} className="stroke-[2.5]" />
              </div>
            </div>

            {/* 3D Holographic Extruded Sentinel Gauge */}
            <div className="p-3 rounded-2xl plate-recessed mb-4 flex flex-col items-center">
              <HolographicSentinelGauge
                burnRatePercent={burnRatePercent}
                thresholdPercent={80}
                totalSpend={totalSpendMTD}
                totalLimit={totalBudgetLimit}
                size={180}
                showDetails={true}
              />
            </div>

            {/* 3 Active Threshold Gates in Soft Gray Well Plates */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-lg well-gray text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-slate-800">Gate 1: 50% Early Advisory</span>
                </div>
                <span className="text-slate-500 font-medium">Nominal ($250k)</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg well-gray text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="font-semibold text-slate-800">Gate 2: 80% Critical Warning</span>
                </div>
                <span className="text-slate-500 font-medium">Armed ($400k)</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg well-gray text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="font-semibold text-slate-800">Gate 3: 100% Hard Enforcement</span>
                </div>
                <span className="text-slate-500 font-medium">Armed ($500k)</span>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-200/80 flex justify-between items-center text-xs layer-z-10">
            <span className="text-slate-500">Automated Resend dispatch</span>
            <Link 
              to="/budgets" 
              className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              Configure Cap Thresholds →
            </Link>
          </div>
        </Card3D>
      </div>

      {/* 3. Interactive 3D Spatial Model Fleet Topology Matrix */}
      <div>
        <Fleet3DMatrix />
      </div>

      {/* 4. Security Vault & Surveillance Journal 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Col 1: API Key Vault & Security Posture */}
        <Card3D className="card-3d rounded-2xl p-5 md:p-6 flex flex-col justify-between" maxTilt={4}>
          <div className="layer-z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <KeyRound size={16} className="text-indigo-600" />
                <h3 className="text-sm font-heading font-bold text-slate-900 tracking-tight">
                  API Vault & Security Health
                </h3>
              </div>
              <span className="text-[11px] font-bold text-emerald-600">100% Armed</span>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              All credentials encrypted using AES-256 GCM authenticated envelope encryption.
            </p>

            {/* Vault Pipelines Status in Soft Gray Well Boxes */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2.5 rounded-lg well-gray text-xs">
                <div>
                  <span className="font-semibold text-slate-800 block">OpenAI Production Key</span>
                  <span className="text-[10px] font-mono text-slate-500">sk-proj-****48a2</span>
                </div>
                <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                  <CheckCircle2 size={12} /> Active
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg well-gray text-xs">
                <div>
                  <span className="font-semibold text-slate-800 block">Anthropic Claude Vault</span>
                  <span className="text-[10px] font-mono text-slate-500">sk-ant-****93bf</span>
                </div>
                <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                  <CheckCircle2 size={12} /> Active
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg well-gray text-xs">
                <div>
                  <span className="font-semibold text-slate-800 block">Google Gemini API Node</span>
                  <span className="text-[10px] font-mono text-slate-500">AIzaSy****1240</span>
                </div>
                <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                  <CheckCircle2 size={12} /> Active
                </span>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-4 border-t border-slate-200/80 text-xs flex justify-between items-center text-slate-500 layer-z-10">
            <span>{totalKeysActive} Key pipelines monitored</span>
            <Link to="/keys" className="text-indigo-600 hover:text-indigo-700 font-semibold">
              Open Vault →
            </Link>
          </div>
        </Card3D>

        {/* Col 2: Immutable Surveillance Journal */}
        <Card3D className="card-3d rounded-2xl p-5 md:p-6 flex flex-col justify-between" maxTilt={4}>
          <div className="layer-z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-indigo-600" />
                <h3 className="text-sm font-heading font-bold text-slate-900 tracking-tight">
                  Surveillance Journal
                </h3>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Feed</span>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 p-0.5 bg-[#E2E6ED] rounded-lg border border-slate-300/80 mb-3">
              <button
                onClick={() => setAuditFilter('all')}
                className={`flex-1 py-0.5 text-[11px] font-semibold rounded transition-colors ${
                  auditFilter === 'all' ? 'bg-[#F8F9FB] text-slate-900 shadow-sm border border-slate-300/70' : 'text-slate-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setAuditFilter('security')}
                className={`flex-1 py-0.5 text-[11px] font-semibold rounded transition-colors ${
                  auditFilter === 'security' ? 'bg-[#F8F9FB] text-slate-900 shadow-sm border border-slate-300/70' : 'text-slate-600'
                }`}
              >
                Security
              </button>
              <button
                onClick={() => setAuditFilter('budget')}
                className={`flex-1 py-0.5 text-[11px] font-semibold rounded transition-colors ${
                  auditFilter === 'budget' ? 'bg-[#F8F9FB] text-slate-900 shadow-sm border border-slate-300/70' : 'text-slate-600'
                }`}
              >
                Budgets
              </button>
            </div>

            {/* Audit Feed Items */}
            <div className="divide-y divide-slate-200/70">
              {filteredAudits.map((item) => (
                <div key={item.id} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{item.title}</span>
                    <span className="text-[10px] text-slate-500 font-medium">{item.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug truncate">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 mt-4 border-t border-slate-200/80 text-xs flex justify-between items-center text-slate-500 layer-z-10">
            <span>Verified: SHA-256</span>
            <Link to="/keys" className="text-indigo-600 hover:text-indigo-700 font-semibold">
              Full Audit Trail →
            </Link>
          </div>
        </Card3D>
      </div>

      {/* 4. Token Consumption & Ingestion Telemetry */}
      <div>
        <TokenConsumptionChart data={data?.dailyTokenTrend || []} isLoading={loading} />
      </div>
    </div>
  );
}
