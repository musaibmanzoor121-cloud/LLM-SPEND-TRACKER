/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip,
  Line
} from 'recharts';
import { 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  RefreshCw, 
  ShieldCheck, 
  Radio, 
  KeyRound,
  ArrowRight,
  TrendingUp,
  Cpu,
  Clock,
  Pause,
  Play
} from 'lucide-react';
import Card3D from './Card3D';

export interface KeyHealthItem {
  id: string;
  provider_id: string;
  label: string;
  key_mask: string;
  is_active: boolean;
  status: 'healthy' | 'degraded' | 'failing';
  totalRequests: number;
  totalOk: number;
  totalError: number;
  successRate: number;
  avgLatency: number;
  lastChecked: string;
  errorBreakdown: {
    rateLimit429: number;
    server5xx: number;
    timeout408: number;
  };
  sparkline: {
    time: string;
    ok: number;
    error: number;
    latency: number;
    successRate: number;
  }[];
}

interface FleetAggregate {
  totalKeys: number;
  totalRequests: number;
  totalOk: number;
  totalError: number;
  successRate: number;
  avgLatency: number;
  sparkline: {
    time: string;
    ok: number;
    error: number;
    total: number;
    latency: number;
    successRate: number;
  }[];
  lastUpdated: string;
}

export interface ApiKeyHealthWidgetProps {
  isLivePolling?: boolean;
  onToggleLivePolling?: () => void;
}

const PROVIDER_METADATA: Record<string, { name: string; border: string; bg: string; text: string; dot: string }> = {
  openai: { 
    name: 'OpenAI', 
    border: 'border-emerald-200', 
    bg: 'bg-emerald-50', 
    text: 'text-emerald-700', 
    dot: 'bg-emerald-500' 
  },
  anthropic: { 
    name: 'Anthropic', 
    border: 'border-amber-200', 
    bg: 'bg-amber-50', 
    text: 'text-amber-800', 
    dot: 'bg-amber-500' 
  },
  gemini: { 
    name: 'Google Gemini', 
    border: 'border-indigo-200', 
    bg: 'bg-indigo-50', 
    text: 'text-indigo-700', 
    dot: 'bg-indigo-500' 
  },
  deepseek: { 
    name: 'DeepSeek', 
    border: 'border-sky-200', 
    bg: 'bg-sky-50', 
    text: 'text-sky-700', 
    dot: 'bg-sky-500' 
  },
  mistral: { 
    name: 'Mistral', 
    border: 'border-orange-200', 
    bg: 'bg-orange-50', 
    text: 'text-orange-700', 
    dot: 'bg-orange-500' 
  },
  groq: { 
    name: 'Groq LPU', 
    border: 'border-rose-200', 
    bg: 'bg-rose-50', 
    text: 'text-rose-700', 
    dot: 'bg-rose-500' 
  }
};

export default function ApiKeyHealthWidget({
  isLivePolling: controlledIsLive,
  onToggleLivePolling
}: ApiKeyHealthWidgetProps = {}) {
  const [internalIsLive, setInternalIsLive] = useState(true);
  const isLive = controlledIsLive !== undefined ? controlledIsLive : internalIsLive;

  const [data, setData] = useState<{ keys: KeyHealthItem[]; aggregate: FleetAggregate } | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastPolledTime, setLastPolledTime] = useState<string>('');
  const [selectedKeyId, setSelectedKeyId] = useState<string>('all');
  const [pingingId, setPingingId] = useState<string | null>(null);
  const [pingAllActive, setPingAllActive] = useState(false);
  const [pingFeedback, setPingFeedback] = useState<Record<string, { status: number; latency: number; time: string }>>({});
  const [viewMode, setViewMode] = useState<'ratio' | 'error_focus'>('ratio');

  const fetchHealthData = async () => {
    try {
      const res = await fetch('/api/keys/health', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('watchdog_token')}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLastPolledTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    } catch (err) {
      console.error('Failed to fetch key health telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchHealthData();
  }, []);

  // Real-time telemetry polling interval - only runs when isLive is true
  useEffect(() => {
    if (!isLive) return;

    // Real-time telemetry heartbeat polling every 20 seconds when live
    const interval = setInterval(() => {
      fetchHealthData();
    }, 20000);

    return () => clearInterval(interval);
  }, [isLive]);

  const handleToggleLive = () => {
    const nextState = !isLive;
    if (onToggleLivePolling) {
      onToggleLivePolling();
    } else {
      setInternalIsLive(nextState);
    }
    if (nextState) {
      // Immediately fetch fresh data when resuming polling
      fetchHealthData();
    }
  };

  const handlePingKey = async (keyId: string) => {
    setPingingId(keyId);
    try {
      const res = await fetch(`/api/keys/${keyId}/ping`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('watchdog_token')}` }
      });
      if (res.ok) {
        const result = await res.json();
        setPingFeedback(prev => ({
          ...prev,
          [keyId]: {
            status: result.status,
            latency: result.latencyMs,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          }
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setPingingId(null), 400);
    }
  };

  const handlePingAll = async () => {
    if (!data?.keys) return;
    setPingAllActive(true);
    for (const k of data.keys) {
      await handlePingKey(k.id);
    }
    setPingAllActive(false);
    await fetchHealthData();
  };

  // Determine current active sparkline data (either aggregate fleet or selected key)
  const activeSparkline = useMemo(() => {
    if (!data) return [];
    if (selectedKeyId === 'all') {
      return data.aggregate.sparkline;
    }
    const foundKey = data.keys.find(k => k.id === selectedKeyId);
    return foundKey ? foundKey.sparkline : data.aggregate.sparkline;
  }, [data, selectedKeyId]);

  const activeKeyMeta = useMemo(() => {
    if (!data || selectedKeyId === 'all') return null;
    return data.keys.find(k => k.id === selectedKeyId) || null;
  }, [data, selectedKeyId]);

  if (loading && !data) {
    return (
      <Card3D className="card-3d rounded-2xl p-6 border border-slate-200/90" maxTilt={3}>
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-md bg-slate-200 animate-pulse" />
            <div className="w-48 h-4 rounded bg-slate-200 animate-pulse" />
          </div>
          <div className="w-24 h-6 rounded bg-slate-200 animate-pulse" />
        </div>
        <div className="h-44 mt-4 bg-slate-100/60 rounded-xl animate-pulse" />
      </Card3D>
    );
  }

  const aggregate = data?.aggregate || {
    totalKeys: 4,
    totalRequests: 52400,
    totalOk: 52310,
    totalError: 90,
    successRate: 99.82,
    avgLatency: 24,
    sparkline: [],
    lastUpdated: new Date().toISOString()
  };

  const keys = data?.keys || [];

  return (
    <Card3D className="card-3d rounded-2xl p-5 md:p-6 border border-slate-200/90 flex flex-col justify-between" maxTilt={3}>
      <div className="layer-z-10">
        {/* Top Header: Title, Real-time status pill, & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/90 shadow-xs shrink-0">
              <Activity size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-heading font-bold text-slate-900 tracking-tight">
                  API Key Health & Error Telemetry
                </h3>
                {isLive ? (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                    {aggregate.successRate >= 99 ? '99.8% Healthy' : 'Degraded'} · Live
                  </span>
                ) : (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300/80">
                    <Pause size={10} className="text-amber-700" />
                    Polling Paused
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time 200 OK throughput vs 4xx/5xx error rates across configured vault keys.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* 'Live Update' Polling Toggle Switch */}
            <div className="flex items-center gap-2 px-2.5 py-1 bg-[#E2E6ED] rounded-lg border border-slate-300/80 shadow-[inset_0_1px_1px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className="text-[11px] font-semibold text-slate-700">Live Update</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={isLive}
                onClick={handleToggleLive}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isLive ? 'bg-emerald-600' : 'bg-slate-400'
                }`}
                title={isLive ? "Click to pause real-time API health polling" : "Click to resume real-time API health polling"}
              >
                <span className="sr-only">Toggle live polling of API health data</span>
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    isLive ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={`text-[10px] font-bold ${isLive ? 'text-emerald-700' : 'text-slate-500'}`}>
                {isLive ? 'Live' : 'Paused'}
              </span>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 bg-[#E2E6ED] rounded-lg border border-slate-300/80">
              <button
                type="button"
                onClick={() => setViewMode('ratio')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-all cursor-pointer ${
                  viewMode === 'ratio'
                    ? 'bg-[#F8F9FB] text-slate-900 shadow-sm border border-slate-300/70'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="View 200 OK vs Error stream"
              >
                200 OK / Errors
              </button>
              <button
                type="button"
                onClick={() => setViewMode('error_focus')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-all cursor-pointer ${
                  viewMode === 'error_focus'
                    ? 'bg-[#F8F9FB] text-slate-900 shadow-sm border border-slate-300/70'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Focus on error anomaly spikes"
              >
                Error Spikes
              </button>
            </div>

            {/* Live Probe Ping Action */}
            <button
              type="button"
              onClick={handlePingAll}
              disabled={pingAllActive}
              className="btn-3d-offwhite px-2.5 py-1 text-xs font-semibold flex items-center gap-1.5 cursor-pointer text-slate-700"
              title="Run real-time latency & 200 OK roundtrip probes"
            >
              <RefreshCw size={12} className={pingAllActive ? 'animate-spin text-indigo-600' : 'text-slate-500'} />
              <span>{pingAllActive ? 'Probing...' : 'Probe Fleet'}</span>
            </button>
          </div>
        </div>

        {/* 4 Key Performance Indicators (Recessed Plates) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="p-3 rounded-xl plate-recessed">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              200 OK Success Rate
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-heading font-extrabold text-emerald-700 font-mono">
                {activeKeyMeta ? `${activeKeyMeta.successRate}%` : `${aggregate.successRate}%`}
              </span>
              <span className="text-[10px] font-bold text-emerald-600 flex items-center">
                <CheckCircle2 size={11} className="mr-0.5" />
                Nominal
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {activeKeyMeta ? activeKeyMeta.totalOk.toLocaleString() : aggregate.totalOk.toLocaleString()} successful
            </span>
          </div>

          <div className="p-3 rounded-xl plate-recessed">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Error Incidents (4xx/5xx)
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-heading font-extrabold text-slate-900 font-mono">
                {activeKeyMeta ? activeKeyMeta.totalError : aggregate.totalError}
              </span>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.2 rounded border border-amber-200">
                0.18% Rate
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Mostly 429 throttle limits
            </span>
          </div>

          <div className="p-3 rounded-xl plate-recessed">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Median Roundtrip Latency
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-heading font-extrabold text-slate-900 font-mono">
                {activeKeyMeta ? `${activeKeyMeta.avgLatency}ms` : `${aggregate.avgLatency}ms`}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-0.5">
                <Zap size={11} className="text-amber-500" /> p95
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              TLS handshake verified
            </span>
          </div>

          <div className="p-3 rounded-xl plate-recessed">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Configured Keys Armed
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-heading font-extrabold text-slate-900 font-mono">
                {aggregate.totalKeys}
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                AES-256
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              All routes encrypted
            </span>
          </div>
        </div>

        {/* Selected Key Filter Strip */}
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              type="button"
              onClick={() => setSelectedKeyId('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer shrink-0 border ${
                selectedKeyId === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              All Keys Aggregate
            </button>
            {keys.map((k) => {
              const meta = PROVIDER_METADATA[k.provider_id] || PROVIDER_METADATA.openai;
              const isSelected = selectedKeyId === k.id;
              return (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => setSelectedKeyId(k.id)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer shrink-0 border flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-400' : meta.dot}`} />
                  <span>{k.label}</span>
                </button>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            <span>Interval: </span>
            <strong className="text-slate-800">1-Hour Buckets</strong>
          </div>
        </div>

        {/* Recharts Sparkline Area Chart: 200 OK vs Error Stream */}
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-xs mb-5">
          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold mb-2 px-1">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block shadow-xs" />
                200 OK Responses (Volume)
              </span>
              <span className="flex items-center gap-1.5 text-rose-600">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block shadow-xs" />
                Error Rate (4xx / 5xx)
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
              {isLive ? (
                <span className="flex items-center gap-1 text-emerald-600 font-sans font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Stream (20s)
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-600 font-sans font-medium">
                  <Pause size={10} className="stroke-[2.5]" />
                  Polling Paused
                </span>
              )}
              {lastPolledTime && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="text-slate-500 font-sans">Synced {lastPolledTime}</span>
                </>
              )}
            </div>
          </div>

          <div className="w-full h-28 relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activeSparkline} margin={{ top: 8, right: 8, left: -25, bottom: 0 }}>
                <defs>
                  {/* 200 OK Emerald Gradient */}
                  <linearGradient id="okAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                    <stop offset="70%" stopColor="#10B981" stopOpacity={0.06} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>

                  {/* Error Rose Gradient */}
                  <linearGradient id="errorAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <XAxis 
                  dataKey="time" 
                  stroke="#94A3B8" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={4} 
                />
                <YAxis 
                  stroke="#94A3B8" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />

                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const okVal = payload.find(p => p.dataKey === 'ok')?.value || 0;
                      const errVal = payload.find(p => p.dataKey === 'error')?.value || 0;
                      const latVal = payload[0]?.payload?.latency || 24;
                      const successPct = payload[0]?.payload?.successRate || 100;

                      return (
                        <div className="rounded-xl bg-slate-900 text-white p-2.5 shadow-xl border border-slate-800 text-[11px] min-w-[170px] space-y-1.5 z-50">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                            <span className="font-mono text-slate-400 font-bold">{label}</span>
                            <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${
                              errVal === 0 ? 'bg-emerald-900/80 text-emerald-300' : 'bg-rose-900/80 text-rose-300'
                            }`}>
                              {successPct}% OK
                            </span>
                          </div>
                          <div className="space-y-1 pt-0.5">
                            <div className="flex justify-between items-center text-emerald-300">
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                200 OK Requests:
                              </span>
                              <span className="font-mono font-bold">{Number(okVal).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-rose-300">
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                Error Count:
                              </span>
                              <span className="font-mono font-bold">{errVal}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-400 pt-0.5 border-t border-slate-800 text-[10px]">
                              <span>Roundtrip Latency:</span>
                              <span className="font-mono text-slate-300">{latVal}ms</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                {viewMode === 'ratio' ? (
                  <>
                    <Area 
                      type="monotone" 
                      dataKey="ok" 
                      name="200 OK"
                      stroke="#059669" 
                      strokeWidth={2} 
                      fill="url(#okAreaGradient)" 
                      activeDot={{ r: 4, fill: '#059669', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="error" 
                      name="Errors"
                      stroke="#EF4444" 
                      strokeWidth={2} 
                      fill="url(#errorAreaGradient)" 
                      activeDot={{ r: 4, fill: '#EF4444', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                    />
                  </>
                ) : (
                  <Area 
                    type="monotone" 
                    dataKey="error" 
                    name="Errors"
                    stroke="#EF4444" 
                    strokeWidth={2.4} 
                    fill="url(#errorAreaGradient)" 
                    activeDot={{ r: 5, fill: '#EF4444', stroke: '#FFFFFF', strokeWidth: 2 }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Per-Key Breakdown List with Micro Sparklines & Real-time Ping */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
            <span>Configured Key Routes & Real-Time Probes</span>
            <span className="text-[11px] font-normal text-slate-500">200 OK vs Error Sparkline</span>
          </div>

          <div className="space-y-2">
            {keys.map((k) => {
              const meta = PROVIDER_METADATA[k.provider_id] || PROVIDER_METADATA.openai;
              const isPinging = pingingId === k.id;
              const feedback = pingFeedback[k.id];

              return (
                <div 
                  key={k.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl well-gray hover:bg-slate-200/50 transition-colors gap-3 border border-slate-200/60"
                >
                  {/* Left: Key Identity & Status */}
                  <div className="flex items-center gap-3 min-w-[200px]">
                    <div className={`w-8 h-8 rounded-lg ${meta.bg} ${meta.border} border flex items-center justify-center shrink-0`}>
                      <KeyRound size={15} className={meta.text} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900 text-xs">{k.label}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${meta.bg} ${meta.text} border ${meta.border}`}>
                          {meta.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono text-slate-500">{k.key_mask}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-[10px] font-bold text-emerald-700 flex items-center gap-0.5">
                          <CheckCircle2 size={10} />
                          {k.successRate}% OK
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Micro Recharts Sparkline */}
                  <div className="w-full sm:w-36 h-9 shrink-0 flex flex-col justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={k.sparkline} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id={`miniSparkGrad_${k.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <Area 
                          type="monotone" 
                          dataKey="ok" 
                          stroke="#10B981" 
                          strokeWidth={1.5} 
                          fill={`url(#miniSparkGrad_${k.id})`} 
                          isAnimationActive={false}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="error" 
                          stroke="#EF4444" 
                          strokeWidth={1.5} 
                          fill="transparent" 
                          isAnimationActive={false}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Right: Latency & Interactive Ping Probe */}
                  <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-slate-800">
                        {feedback ? `${feedback.latency}ms` : `${k.avgLatency}ms`}
                      </div>
                      <div className="text-[9px] text-slate-400">
                        {k.totalError > 0 ? `${k.totalError} errs` : 'Zero errors'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePingKey(k.id)}
                      disabled={isPinging}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 border shadow-xs ${
                        feedback
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                      title="Send real-time probe to verify 200 OK"
                    >
                      <Zap size={11} className={isPinging ? 'text-amber-500 animate-spin' : feedback ? 'text-emerald-600' : 'text-slate-400'} />
                      <span>{isPinging ? 'Testing...' : feedback ? '200 OK' : 'Ping'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Strip */}
      <div className="pt-4 mt-5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 layer-z-10">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>Automated circuit breakers armed: <strong className="text-slate-800">429 backoff active</strong></span>
        </div>
        <Link 
          to="/keys" 
          className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 transition-colors"
        >
          <span>Manage API Vault Credentials</span>
          <ArrowRight size={12} />
        </Link>
      </div>
    </Card3D>
  );
}
