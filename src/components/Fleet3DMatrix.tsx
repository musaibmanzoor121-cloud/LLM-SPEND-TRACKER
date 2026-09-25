/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Cpu, 
  Layers, 
  ArrowUpRight, 
  Zap, 
  Activity, 
  ShieldCheck, 
  AlertTriangle,
  Rotate3d,
  Sliders,
  Sparkles
} from 'lucide-react';
import Card3D from './Card3D';

interface ProviderNode {
  id: string;
  name: string;
  models: string[];
  spend: number;
  tokens: string;
  percent: number;
  latencyMs: number;
  color: string;
  glowColor: string;
  status: 'nominal' | 'warning' | 'critical';
  isoX: number; // Isometric X coordinate (0 - 100)
  isoY: number; // Isometric Y coordinate (0 - 100)
  pillarHeight: number; // 3D pillar extrusion px
}

const DEFAULT_FLEET: ProviderNode[] = [
  {
    id: 'openai',
    name: 'OpenAI Fleet',
    models: ['GPT-4o', 'o3-mini', 'text-embedding-3-large'],
    spend: 14440.00,
    tokens: '62.4M',
    percent: 38,
    latencyMs: 24,
    color: '#4F46E5',
    glowColor: 'rgba(79, 70, 229, 0.4)',
    status: 'nominal',
    isoX: 20,
    isoY: 30,
    pillarHeight: 52
  },
  {
    id: 'anthropic',
    name: 'Anthropic Cluster',
    models: ['Claude 3.5 Sonnet', 'Claude 3.5 Haiku'],
    spend: 11020.00,
    tokens: '48.1M',
    percent: 29,
    latencyMs: 36,
    color: '#8B5CF6',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    status: 'nominal',
    isoX: 80,
    isoY: 28,
    pillarHeight: 44
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    models: ['Gemini 2.5 Flash', 'Gemini 1.5 Pro'],
    spend: 6840.00,
    tokens: '32.6M',
    percent: 18,
    latencyMs: 18,
    color: '#059669',
    glowColor: 'rgba(5, 150, 105, 0.4)',
    status: 'nominal',
    isoX: 18,
    isoY: 72,
    pillarHeight: 32
  },
  {
    id: 'deepseek',
    name: 'DeepSeek AI',
    models: ['DeepSeek-V3', 'DeepSeek-R1 (Distill)'],
    spend: 6120.00,
    tokens: '28.9M',
    percent: 15,
    latencyMs: 42,
    color: '#D97706',
    glowColor: 'rgba(217, 119, 6, 0.4)',
    status: 'nominal',
    isoX: 82,
    isoY: 70,
    pillarHeight: 28
  }
];

export default function Fleet3DMatrix() {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('openai');
  const [viewMode, setViewMode] = useState<'3d_isometric' | 'compact_fleet'>('3d_isometric');
  const [tiltAngle, setTiltAngle] = useState<{ x: number; y: number }>({ x: 22, y: -12 });
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);

  const selectedNode = DEFAULT_FLEET.find(n => n.id === selectedNodeId) || DEFAULT_FLEET[0];

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (viewMode !== '3d_isometric') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width - 0.5;
    const yRatio = (e.clientY - rect.top) / rect.height - 0.5;
    // Keep angle natural around isometric slant
    setTiltAngle({
      x: 20 + yRatio * 16,
      y: -12 + xRatio * 20
    });
  };

  const handleCanvasMouseLeave = () => {
    setTiltAngle({ x: 22, y: -12 });
  };

  return (
    <Card3D className="card-3d rounded-2xl p-5 md:p-6" maxTilt={4}>
      {/* Header with 3D Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80 layer-z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm">
            <Cpu size={17} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-heading font-bold text-slate-900 tracking-tight">
                Foundational Model Fleet · 3D Topology
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Live token streaming & cost allocation across foundational inference nodes
            </p>
          </div>
        </div>

        {/* Tactical View Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center p-0.5 bg-[#E2E6ED] rounded-lg border border-slate-300/80 shadow-[inset_0_1px_1px_rgba(0,0,0,0.06)]">
            <button
              onClick={() => setViewMode('3d_isometric')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                viewMode === '3d_isometric'
                  ? 'bg-[#F8F9FB] text-slate-900 shadow-sm border border-slate-300/70'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Rotate3d size={13} className={viewMode === '3d_isometric' ? 'text-indigo-600' : 'text-slate-400'} />
              <span>3D Spatial Grid</span>
            </button>
            <button
              onClick={() => setViewMode('compact_fleet')}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                viewMode === 'compact_fleet'
                  ? 'bg-[#F8F9FB] text-slate-900 shadow-sm border border-slate-300/70'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers size={13} className={viewMode === 'compact_fleet' ? 'text-indigo-600' : 'text-slate-400'} />
              <span>Matrix Cards</span>
            </button>
          </div>

          <button
            onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            className={`btn-3d-offwhite px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
              isLiveStreaming ? 'text-indigo-700' : 'text-slate-500'
            }`}
            title="Toggle live token packet animation"
          >
            <Zap size={13} className={isLiveStreaming ? 'text-amber-500 fill-amber-500' : 'text-slate-400'} />
            <span className="hidden md:inline">{isLiveStreaming ? 'Stream Active' : 'Stream Paused'}</span>
          </button>
        </div>
      </div>

      {viewMode === '3d_isometric' ? (
        /* 3D Isometric Spatial Grid Canvas */
        <div 
          className="relative mt-4 w-full h-[320px] rounded-xl plate-recessed overflow-hidden cursor-crosshair select-none flex items-center justify-center"
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={handleCanvasMouseLeave}
          style={{ perspective: '1100px' }}
        >
          {/* Subtle Isometric Micro Grid Pattern */}
          <div className="absolute inset-0 bg-microdot opacity-60 pointer-events-none" />

          {/* Interactive 3D Plane */}
          <div
            className="relative w-[92%] h-[85%] transition-transform duration-300 ease-out preserve-3d"
            style={{
              transform: `rotateX(${tiltAngle.x}deg) rotateY(${tiltAngle.y}deg) translateZ(10px)`
            }}
          >
            {/* SVG Connecting Buslines with Animated Packets */}
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="busGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#818CF8" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#C7D2FE" stopOpacity="0.2" />
                </linearGradient>
              </defs>

              {/* Central Router at (50, 50) connects to each provider node */}
              {DEFAULT_FLEET.map(node => (
                <g key={`conduit-${node.id}`}>
                  {/* Static Bus Path */}
                  <line
                    x1="50"
                    y1="50"
                    x2={node.isoX}
                    y2={node.isoY}
                    stroke="#CBD5E1"
                    strokeWidth="1.2"
                    strokeDasharray="2 2"
                  />
                  {/* Animated Live Token Flow */}
                  {isLiveStreaming && (
                    <line
                      x1="50"
                      y1="50"
                      x2={node.isoX}
                      y2={node.isoY}
                      stroke={node.color}
                      strokeWidth="1.8"
                      className="animate-packet-stream"
                      opacity="0.85"
                    />
                  )}
                </g>
              ))}
            </svg>

            {/* Central Watchdog FinOps Router Hub (Layer Z-20) */}
            <div 
              className="absolute z-20 pointer-events-auto"
              style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%) translateZ(28px)'
              }}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col items-center justify-center p-1.5 shadow-[0_12px_24px_rgba(15,23,42,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)] border border-indigo-400/40">
                <ShieldCheck size={18} className="text-indigo-400 stroke-[2.5]" />
                <span className="text-[8px] font-mono font-bold tracking-tight text-indigo-200 uppercase mt-0.5">
                  Router
                </span>
              </div>
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-mono font-semibold text-slate-600 bg-white/90 px-1 rounded shadow-xs">
                FinOps Gateway
              </div>
            </div>

            {/* Provider Pedestals & Hover Cards */}
            {DEFAULT_FLEET.map(node => {
              const isSelected = selectedNodeId === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  className="absolute z-20 cursor-pointer group"
                  style={{
                    left: `${node.isoX}%`,
                    top: `${node.isoY}%`,
                    transform: `translate(-50%, -50%) translateZ(${isSelected ? node.pillarHeight + 12 : node.pillarHeight}px)`,
                    transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  {/* Floating 3D Pedestal Top */}
                  <div 
                    className={`relative p-2.5 rounded-xl border transition-all duration-200 flex items-center gap-2 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.12),inset_0_1px_1px_rgba(255,255,255,1)] ${
                      isSelected
                        ? 'bg-[#FFFFFF] border-indigo-500 ring-2 ring-indigo-500/20 scale-105'
                        : 'bg-[#F8F9FB] border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <span 
                      className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: node.color }} 
                    />
                    <div className="flex flex-col text-left">
                      <span className="text-[11px] font-bold text-slate-900 tracking-tight leading-tight">
                        {node.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        ${node.spend.toLocaleString(undefined, { maximumFractionDigits: 0 })} · {node.percent}%
                      </span>
                    </div>
                  </div>

                  {/* 3D Extrusion Pillar Shadow Beneath the Pedestal */}
                  <div 
                    className="w-full mx-auto h-3 rounded-b-lg opacity-40 pointer-events-none -mt-1"
                    style={{ backgroundColor: node.color }}
                  />

                  {/* Active Latency Badge */}
                  <div className="absolute -top-3 -right-2 px-1.5 py-0.2 rounded-full bg-slate-900 text-white font-mono text-[9px] font-semibold shadow-xs">
                    {node.latencyMs}ms
                  </div>
                </div>
              );
            })}
          </div>

          {/* Perspective Navigation Hint */}
          <div className="absolute bottom-2.5 left-3 text-[10px] text-slate-500 font-medium flex items-center gap-1.5 pointer-events-none bg-white/80 px-2 py-0.5 rounded-md backdrop-blur-xs border border-slate-200">
            <Rotate3d size={12} className="text-indigo-600" />
            <span>Move cursor to tilt 3D perspective · Click node to inspect</span>
          </div>
        </div>
      ) : (
        /* Matrix Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4">
          {DEFAULT_FLEET.map(node => {
            const isSelected = selectedNodeId === node.id;
            return (
              <div
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-white border-indigo-500 shadow-md ring-1 ring-indigo-500' 
                    : 'bg-[#F8F9FB] border-slate-300 hover:border-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: node.color }} />
                    <span className="text-xs font-bold text-slate-900">{node.name}</span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                    {node.latencyMs}ms
                  </span>
                </div>
                <div className="text-base font-heading font-extrabold text-slate-900">
                  ${node.spend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                  <span>{node.tokens} tok</span>
                  <span className="font-semibold text-slate-700">{node.percent}% of fleet</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Provider Deep Dive Ribbon */}
      <div className="mt-4 pt-4 border-t border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs layer-z-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-900 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedNode.color }} />
            {selectedNode.name}:
          </span>
          <span className="text-slate-600">
            {selectedNode.models.join(' · ')}
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500 font-mono">
            Blend: ${(selectedNode.spend / (parseFloat(selectedNode.tokens) || 1)).toFixed(2)}/1M tok
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1 text-emerald-700 font-medium">
            <ShieldCheck size={14} />
            <span>Health 100% SLA</span>
          </div>
          <span className="text-slate-300">·</span>
          <a href="/budgets" className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-0.5">
            <span>Set Node Cap</span>
            <ArrowUpRight size={13} />
          </a>
        </div>
      </div>
    </Card3D>
  );
}
