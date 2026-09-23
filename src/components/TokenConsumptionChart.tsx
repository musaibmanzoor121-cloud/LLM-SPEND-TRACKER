import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { format } from 'date-fns';
import { Cpu, Layers, Zap, Activity, Info, BarChart3 } from 'lucide-react';

export interface DailyTokenRecord {
  snapshot_date: string;
  provider_id?: string;
  model?: string;
  input_tokens?: number | string;
  output_tokens?: number | string;
  total_tokens?: number | string;
  [key: string]: any;
}

interface TokenConsumptionChartProps {
  data: DailyTokenRecord[];
  isLoading?: boolean;
}

function formatTokens(val: number): string {
  if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(2)}B`;
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(1)}k`;
  return val.toLocaleString();
}

const PROVIDER_COLORS: Record<string, string> = {
  openai: '#3DDC97',
  anthropic: '#F5A623',
  gemini: '#4285F4',
  mistral: '#E91E63',
  groq: '#F55036',
  deepseek: '#4D6BFE',
  perplexity: '#22B8CD',
  cohere: '#9C27B0',
  together: '#0F6FFF',
  openrouter: '#9B6DF7'
};

const PROVIDER_NAMES: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  gemini: 'Google Gemini',
  mistral: 'Mistral AI',
  groq: 'Groq',
  deepseek: 'DeepSeek',
  perplexity: 'Perplexity',
  cohere: 'Cohere',
  together: 'Together AI',
  openrouter: 'OpenRouter'
};

export default function TokenConsumptionChart({ data, isLoading }: TokenConsumptionChartProps) {
  const [viewMode, setViewMode] = useState<'type' | 'provider'>('type');

  // Process data for the last 30 days
  const { chartData, providers, totalTokens, totalInput, totalOutput, avgDaily, peakDay } = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        chartData: [],
        providers: [],
        totalTokens: 0,
        totalInput: 0,
        totalOutput: 0,
        avgDaily: 0,
        peakDay: null
      };
    }

    const map = new Map<string, any>();
    const providerSet = new Set<string>();

    let sumTotal = 0;
    let sumInput = 0;
    let sumOutput = 0;

    data.forEach((item) => {
      if (!item.snapshot_date) return;
      const rawDate = item.snapshot_date.substring(0, 10);
      const dateKey = rawDate;

      if (!map.has(dateKey)) {
        map.set(dateKey, {
          dateKey,
          displayDate: format(new Date(rawDate + 'T00:00:00'), 'MMM dd'),
          totalTokens: 0,
          inputTokens: 0,
          outputTokens: 0
        });
      }

      const entry = map.get(dateKey);
      const inp = Number(item.input_tokens || 0);
      const out = Number(item.output_tokens || 0);
      const tot = Number(item.total_tokens || inp + out);

      entry.inputTokens += inp;
      entry.outputTokens += out;
      entry.totalTokens += tot;

      sumTotal += tot;
      sumInput += inp;
      sumOutput += out;

      if (item.provider_id) {
        providerSet.add(item.provider_id);
        entry[item.provider_id] = (entry[item.provider_id] || 0) + tot;
      }
    });

    const sorted = Array.from(map.values()).sort(
      (a, b) => new Date(a.dateKey).getTime() - new Date(b.dateKey).getTime()
    );

    // Limit to the last 30 days if more
    const last30 = sorted.slice(-30);

    let peak = null;
    let max = -1;
    last30.forEach((d) => {
      if (d.totalTokens > max) {
        max = d.totalTokens;
        peak = d;
      }
    });

    const avg = last30.length > 0 ? Math.round(sumTotal / last30.length) : 0;

    return {
      chartData: last30,
      providers: Array.from(providerSet),
      totalTokens: sumTotal,
      totalInput: sumInput,
      totalOutput: sumOutput,
      avgDaily: avg,
      peakDay: peak
    };
  }, [data]);

  const inputPercent = totalTokens > 0 ? Math.round((totalInput / totalTokens) * 100) : 70;
  const outputPercent = totalTokens > 0 ? 100 - inputPercent : 30;

  return (
    <div id="token-consumption-card" className="bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 rounded-2xl border border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.3)] mb-8 flex flex-col relative overflow-hidden group">
      {/* Top subtle highlight line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#3DDC97] via-[#60A5FA] to-[#C084FC] opacity-60 group-hover:opacity-100 transition-opacity" />

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3DDC97]/20 to-[#60A5FA]/20 border border-[#3DDC97]/30 flex items-center justify-center text-[#3DDC97] shadow-[0_0_15px_rgba(61,220,151,0.2)]">
            <Cpu size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-heading font-semibold text-white tracking-tight">Daily API Token Consumption</h2>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#3DDC97]/10 text-[#3DDC97] border border-[#3DDC97]/20 font-semibold tracking-wider">
                Last 30 Days
              </span>
            </div>
            <p className="text-xs text-white/50 mt-0.5">
              Comprehensive telemetry for input prompt tokens, output completion tokens, and model velocity.
            </p>
          </div>
        </div>

        {/* Toggle controls */}
        <div className="flex items-center gap-2 bg-[#0B1220] p-1 rounded-xl border border-white/10 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('type')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'type'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers size={14} />
            <span>By Token Type</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('provider')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'provider'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 size={14} />
            <span>By Provider</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Pill Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-[#0B1220]/70 border border-white/5 p-3.5 rounded-xl flex flex-col">
          <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono font-medium">30-Day Volume</span>
          <span className="text-2xl font-heading font-semibold text-white mt-1">{formatTokens(totalTokens)}</span>
          <span className="text-[11px] text-white/50 font-mono mt-0.5">total tokens consumed</span>
        </div>

        <div className="bg-[#0B1220]/70 border border-white/5 p-3.5 rounded-xl flex flex-col">
          <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono font-medium">Daily Burn Rate</span>
          <span className="text-2xl font-heading font-semibold text-[#60A5FA] mt-1">{formatTokens(avgDaily)}</span>
          <span className="text-[11px] text-white/50 font-mono mt-0.5">tokens / day average</span>
        </div>

        <div className="bg-[#0B1220]/70 border border-white/5 p-3.5 rounded-xl flex flex-col">
          <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono font-medium">Type Distribution</span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-semibold text-[#60A5FA] font-mono">{inputPercent}% In</span>
            <span className="text-white/30 text-xs">•</span>
            <span className="text-sm font-semibold text-[#C084FC] font-mono">{outputPercent}% Out</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mt-1.5 flex">
            <div className="bg-[#60A5FA] h-full" style={{ width: `${inputPercent}%` }} />
            <div className="bg-[#C084FC] h-full" style={{ width: `${outputPercent}%` }} />
          </div>
        </div>

        <div className="bg-[#0B1220]/70 border border-white/5 p-3.5 rounded-xl flex flex-col">
          <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono font-medium">Peak Day</span>
          <span className="text-2xl font-heading font-semibold text-[#3DDC97] mt-1">
            {peakDay ? formatTokens(peakDay.totalTokens) : '0'}
          </span>
          <span className="text-[11px] text-white/50 font-mono mt-0.5">
            {peakDay ? peakDay.displayDate : 'N/A'}
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[320px] w-full relative">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 15, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff12" vertical={false} />
              <XAxis
                dataKey="displayDate"
                stroke="#ffffff60"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dy={8}
              />
              <YAxis
                stroke="#ffffff60"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => formatTokens(val)}
                dx={-4}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0B1220',
                  borderColor: 'rgba(255,255,255,0.12)',
                  color: '#fff',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  padding: '12px 16px'
                }}
                itemStyle={{ fontFamily: 'monospace', fontSize: '12px', padding: '2px 0' }}
                labelStyle={{
                  color: '#ffffff90',
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '8px',
                  fontWeight: 600
                }}
                formatter={(val: any, name: string) => {
                  const num = Number(val || 0);
                  const label = PROVIDER_NAMES[name] || name;
                  return [`${num.toLocaleString()} tokens`, label];
                }}
              />
              <Legend
                wrapperStyle={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  opacity: 0.85,
                  paddingTop: '12px'
                }}
              />

              {viewMode === 'type' ? (
                <>
                  <Line
                    type="monotone"
                    dataKey="totalTokens"
                    name="Total Tokens"
                    stroke="#3DDC97"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#0B1220', stroke: '#3DDC97', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#3DDC97', stroke: '#fff', strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="inputTokens"
                    name="Input (Prompt) Tokens"
                    stroke="#60A5FA"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 2.5, fill: '#0B1220', stroke: '#60A5FA', strokeWidth: 1.5 }}
                    activeDot={{ r: 5, fill: '#60A5FA' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="outputTokens"
                    name="Output (Completion) Tokens"
                    stroke="#C084FC"
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: '#0B1220', stroke: '#C084FC', strokeWidth: 1.5 }}
                    activeDot={{ r: 5, fill: '#C084FC' }}
                  />
                </>
              ) : (
                providers.map((provider) => {
                  const color = PROVIDER_COLORS[provider] || '#9B6DF7';
                  const name = PROVIDER_NAMES[provider] || provider;
                  return (
                    <Line
                      key={provider}
                      type="monotone"
                      dataKey={provider}
                      name={name}
                      stroke={color}
                      strokeWidth={2}
                      dot={{ r: 3, fill: '#0B1220', stroke: color, strokeWidth: 1.5 }}
                      activeDot={{ r: 5, fill: color }}
                    />
                  );
                })
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/30 mb-3">
              <Activity size={22} />
            </div>
            <p className="text-sm text-white/60 font-medium">No 30-Day Token Consumption Recorded</p>
            <p className="text-xs text-white/40 mt-1 max-w-sm">
              Connect API keys or click "Sync Data" above to poll token telemetry from your LLM providers.
            </p>
          </div>
        )}
      </div>

      {/* Footer detail */}
      <div className="mt-4 pt-3 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center text-[10px] text-white/40 font-mono gap-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3DDC97] animate-pulse" />
          <span>Real-time token aggregations calibrated across prompt & completion tiers</span>
        </div>
        <div>
          <span>Audited Model Snapshots: {chartData.length} days captured</span>
        </div>
      </div>
    </div>
  );
}
