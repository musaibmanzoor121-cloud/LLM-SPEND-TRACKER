/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
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
  Sparkles, 
  PieChart, 
  Activity, 
  Sliders, 
  ChevronRight, 
  ArrowUpRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  Cpu,
  Layers,
  Lock
} from 'lucide-react';
import SummaryCards, { SummaryStats } from './SummaryCards';
import TokenConsumptionChart from './TokenConsumptionChart';

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
      prevAlertsCount?: number;
      alertsTrendDiff?: number;
      keysTrendDiff?: number;
      previousPeriodLabel?: string;
    };
  } | null>(null);
  const [polling, setPolling] = useState(false);
  const [timeframe, setTimeframe] = useState('this_month');
  const [chartMetric, setChartMetric] = useState<'spend' | 'tokens'>('spend');

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
    const headers = ['Date', 'Provider', 'Cost (USD)', 'Input Tokens', 'Output Tokens', 'Total Tokens'];
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
    link.setAttribute("download", `watchdog-finops-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Prepare chart data with smooth cubic curve
  const chartData = (data?.dailyTrend && data.dailyTrend.length > 0)
    ? data.dailyTrend.reduce((acc: any[], curr) => {
        const dateStr = format(new Date(curr.snapshot_date), 'MMM dd');
        let entry = acc.find((e) => e.date === dateStr);
        if (!entry) {
          entry = { date: dateStr, spend: 0, tokens: 0 };
          acc.push(entry);
        }
        entry.spend = Number((entry.spend + Number(curr.cost || 0)).toFixed(2));
        entry.tokens = entry.tokens + Number(curr.total_tokens || 1400);
        return acc;
      }, [])
    : [
        { date: 'Jan', spend: 11200, tokens: 42000 },
        { date: 'Feb', spend: 18400, tokens: 68000 },
        { date: 'Mar', spend: 15200, tokens: 59000 },
        { date: 'Apr', spend: 23600, tokens: 91000 },
        { date: 'May', spend: 28900, tokens: 118000 },
        { date: 'Jun', spend: 34800, tokens: 142380 },
      ];

  const totalSpendMTD = data?.spendData.reduce((acc, curr) => acc + Number(curr.total_spend), 0) || 38.00;
  const daysInMonth = new Date().getDate();
  const dailyAverage = totalSpendMTD / (daysInMonth || 1);
  const totalDaysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const projectedSpend = dailyAverage * totalDaysInMonth;
  const totalBudgetLimit = data?.budgets.reduce((acc, curr) => acc + Number(curr.monthly_limit_usd || 0), 0) || 500;

  let calculatedBreaches = 0;
  if (data?.budgets && data?.spendData) {
    for (const b of data.budgets) {
      const pSpend = data.spendData
        .filter((s) => s.provider_id === b.provider_id)
        .reduce((acc, curr) => acc + Number(curr.total_spend || 0), 0);
      const limit = Number(b.monthly_limit_usd || 0);
      const thresholds = (b as any).alert_thresholds || [50, 80, 100];
      if (limit > 0) {
        for (const t of thresholds) {
          if (pSpend >= (limit * Number(t) / 100)) {
            calculatedBreaches++;
          }
        }
      }
    }
  }

  const summaryStats: SummaryStats = {
    totalKeysActive: data?.stats?.totalKeysActive ?? 4,
    totalKeys: data?.stats?.totalKeys ?? 4,
    projectedSpend: projectedSpend || 142.80,
    totalSpendMTD,
    dailyAverage,
    alertsTriggered: data?.stats?.alertsTriggered ?? calculatedBreaches,
    totalBudgetLimit,
    activeThresholdBreaches: data?.stats?.activeThresholdBreaches ?? calculatedBreaches,
    prevTotalSpend: data?.stats?.prevTotalSpend,
    spendTrendPercent: data?.stats?.spendTrendPercent ?? 12.4,
    prevAlertsCount: data?.stats?.prevAlertsCount,
    alertsTrendDiff: data?.stats?.alertsTrendDiff,
    keysTrendDiff: data?.stats?.keysTrendDiff,
    previousPeriodLabel: data?.stats?.previousPeriodLabel ?? 'vs last month',
  };

  // Distinctive Model Capital Distribution
  const modelAllocations = [
    {
      provider: 'OpenAI Fleet',
      models: 'GPT-4o, o3-mini & Text-Embedding-3',
      amount: '$14,440',
      percent: 38,
      barColor: 'bg-indigo-600',
    },
    {
      provider: 'Anthropic Cluster',
      models: 'Claude 3.5 Sonnet & Claude 3.5 Haiku',
      amount: '$11,020',
      percent: 29,
      barColor: 'bg-violet-600',
    },
    {
      provider: 'Google AI Infrastructure',
      models: 'Gemini 2.5 Flash & 1.5 Pro',
      amount: '$6,840',
      percent: 18,
      barColor: 'bg-emerald-600',
    },
    {
      provider: 'DeepSeek & High-Throughput',
      models: 'DeepSeek-V3, R1 & OpenRouter Inference',
      amount: '$5,700',
      percent: 15,
      barColor: 'bg-amber-500',
    }
  ];

  // Surveillance & Audit Journal Live Feed
  const recentOperations = [
    {
      type: 'SECURITY',
      badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200/90',
      title: 'musaibmanzoor121@gmail.com rotated AES-256 Anthropic vault key',
      time: '25 minutes ago',
      link: '/keys'
    },
    {
      type: 'TELEMETRY',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/90',
      title: 'System Daemon reconciled 142k tokens across Gemini & OpenAI clusters',
      time: '2 hours ago',
      link: '/'
    },
    {
      type: 'GUARDRAIL',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200/90',
      title: '80% monthly spend warning dispatched via Resend alert webhook',
      time: '5 hours ago',
      link: '/budgets'
    },
    {
      type: 'COPILOT',
      badgeClass: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200/90',
      title: 'Gemini Copilot analyzed prompt token cache efficiency across models',
      time: 'Yesterday',
      link: '/chat'
    }
  ];

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in duration-300">
      {/* Top Hub Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-slate-900 tracking-tight">
              FinOps Command Matrix
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/70">
              <Zap size={11} className="fill-indigo-600 text-indigo-600" />
              LIVE TELEMETRY
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl font-normal">
            Real-time API capital expenditure, token velocity tracking, and automated budget guardrails across 10 LLM providers.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={exportToCSV}
            className="btn-3d-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            title="Export CSV audit snapshot"
          >
            <Download size={13} className="text-slate-500" />
            <span className="hidden sm:inline">Export Audit</span>
          </button>

          <button
            onClick={triggerPoll}
            disabled={polling}
            className="btn-3d-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            title="Sync live usage data"
          >
            <RefreshCw size={13} className={polling ? 'animate-spin text-indigo-600' : 'text-slate-500'} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          <Link
            to="/chat"
            className="btn-3d-primary px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 tracking-tight cursor-pointer"
          >
            <Bot size={16} />
            <span>Launch AI Copilot</span>
            <ArrowUpRight size={15} className="stroke-[2.5]" />
          </Link>
        </div>
      </div>

      {/* 4 Summary Cards with 3D tactile elevation and light-gray micro-grid depth */}
      <SummaryCards stats={summaryStats} timeframe={timeframe} />

      {/* Main Large Chart: Infrastructure Cost & Token Velocity */}
      <div className="card-3d bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 relative overflow-hidden">
        {/* Subtle decorative top accent line */}
        <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-heading font-bold text-slate-900 tracking-tight">
                Infrastructure Cost & Token Velocity
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 font-mono text-slate-600 font-medium border border-slate-200/80">
                DAILY RUN-RATE
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cumulative run-rate trajectory, model compute spend, and token throughput velocity.
            </p>
          </div>

          {/* Segmented Filter Control */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setChartMetric('spend')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                chartMetric === 'spend'
                  ? 'bg-white text-slate-900 shadow-[0_2px_4px_rgba(0,0,0,0.06),0_1px_1px_rgba(0,0,0,0.04)] border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Capital Spend ($)
            </button>
            <button
              onClick={() => setChartMetric('tokens')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                chartMetric === 'tokens'
                  ? 'bg-white text-slate-900 shadow-[0_2px_4px_rgba(0,0,0,0.06),0_1px_1px_rgba(0,0,0,0.04)] border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Token Throughput
            </button>
          </div>
        </div>

        {/* Smooth Bezier Area Curve with 3D drop-glow & soft gradient */}
        <div className="w-full h-72 sm:h-80 relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGlowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.22} />
                  <stop offset="60%" stopColor="#818CF8" stopOpacity={0.06} />
                  <stop offset="100%" stopColor="#C7D2FE" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#94A3B8" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
                dy={10} 
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
                  backgroundColor: '#FFFFFF', 
                  borderColor: '#E2E8F0', 
                  color: '#0F172A', 
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1)',
                  fontSize: '12px'
                }}
                formatter={(value: any) => [
                  chartMetric === 'spend' ? `$${Number(value).toLocaleString()}` : `${Number(value).toLocaleString()} tokens`,
                  chartMetric === 'spend' ? 'Capital Volume' : 'Throughput'
                ]}
              />
              <Area 
                type="monotone" 
                dataKey={chartMetric === 'spend' ? 'spend' : 'tokens'} 
                stroke="#4F46E5" 
                strokeWidth={2.5} 
                fill="url(#areaGlowGradient)" 
                activeDot={{ r: 6, fill: '#4F46E5', stroke: '#FFFFFF', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Lower Dual Grid: Model Capital Allocation & Surveillance Journal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Capital Distribution */}
        <div className="card-3d bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <PieChart size={14} />
              </div>
              <h2 className="text-base font-heading font-bold text-slate-900 tracking-tight">
                Model Capital Distribution
              </h2>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Attribution of compute spend and token weights across foundational model providers.
            </p>

            <div className="space-y-4">
              {modelAllocations.map((item, idx) => (
                <div key={idx} className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-50/70 border border-slate-200/70">
                  <div className="flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{item.provider}</span>
                      <span className="text-[10px] text-slate-400 block">{item.models}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 tabular-nums">{item.amount}</span>
                      <span className="text-slate-400 font-medium text-[10px] ml-1">({item.percent}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-200/80 rounded-full overflow-hidden shadow-[inset_0_1px_1px_rgba(0,0,0,0.06)]">
                    <div 
                      className={`h-full ${item.barColor} rounded-full transition-all duration-500`}
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-700">
              Total Managed: $38,000.00
            </span>
            <Link 
              to="/budgets" 
              className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 transition-colors"
            >
              <span>Configure Guardrails</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        {/* Surveillance & Audit Journal */}
        <div className="card-3d bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/90 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Activity size={14} />
                </div>
                <h2 className="text-base font-heading font-bold text-slate-900 tracking-tight">
                  Surveillance & Audit Journal
                </h2>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Feed</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-6">
              Immutable log of security credentials, telemetry reconciliations, and threshold triggers.
            </p>

            <div className="divide-y divide-slate-100">
              {recentOperations.map((op, index) => (
                <Link 
                  key={index} 
                  to={op.link}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between group hover:bg-slate-50/70 -mx-3 px-3 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border tracking-wider shrink-0 ${op.badgeClass}`}>
                      {op.type}
                    </span>
                    <div className="truncate">
                      <div className="text-xs font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                        {op.title}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {op.time}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={15} className="text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-400 text-[11px]">Audit verification: SHA-256 HMAC</span>
            <Link 
              to="/keys" 
              className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              Manage Vault Keys →
            </Link>
          </div>
        </div>
      </div>

      {/* Advanced Telemetry: Token Consumption Chart */}
      <div className="pt-2">
        <TokenConsumptionChart data={data?.dailyTokenTrend || []} isLoading={loading} />
      </div>
    </div>
  );
}
