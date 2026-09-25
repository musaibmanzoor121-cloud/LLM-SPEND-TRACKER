/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, Sparkles, Zap } from 'lucide-react';

interface HolographicSentinelGaugeProps {
  burnRatePercent: number; // e.g. 7.68 or 85.4
  thresholdPercent?: number; // e.g. 80
  totalSpend: number;
  totalLimit: number;
  size?: number; // default 210
  showDetails?: boolean;
}

export default function HolographicSentinelGauge({
  burnRatePercent,
  thresholdPercent = 80,
  totalSpend,
  totalLimit,
  size = 200,
  showDetails = true
}: HolographicSentinelGaugeProps) {
  const [tilt, setTilt] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const radius = 70;
  const strokeWidth = 10;
  const center = 100;
  const circumference = 2 * Math.PI * radius; // ~439.82

  const clampedBurn = Math.min(Math.max(burnRatePercent, 0), 120);
  const strokeDashoffset = circumference - (clampedBurn / 100) * circumference;

  // Determine state & colors
  const isBreached = burnRatePercent >= 100;
  const isNearThreshold = burnRatePercent >= thresholdPercent;

  const statusColor = isBreached 
    ? {
        stroke: '#EF4444',
        glow: 'rgba(239, 68, 68, 0.45)',
        text: 'text-rose-600',
        bg: 'bg-rose-50',
        border: 'border-rose-300',
        label: 'Cap Breached',
        gradientStart: '#F87171',
        gradientEnd: '#DC2626'
      }
    : isNearThreshold
    ? {
        stroke: '#F59E0B',
        glow: 'rgba(245, 158, 11, 0.45)',
        text: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-300',
        label: 'Threshold Alert',
        gradientStart: '#FBBF24',
        gradientEnd: '#D97706'
      }
    : {
        stroke: '#4F46E5',
        glow: 'rgba(79, 70, 229, 0.35)',
        text: 'text-indigo-600',
        bg: 'bg-indigo-50',
        border: 'border-indigo-200',
        label: 'Nominal Safe',
        gradientStart: '#818CF8',
        gradientEnd: '#4338CA'
      };

  // Threshold notch calculation (in degrees from top / -90deg)
  const thresholdAngle = ((thresholdPercent / 100) * 360 - 90) * (Math.PI / 180);
  const notchX = center + (radius + 2) * Math.cos(thresholdAngle);
  const notchY = center + (radius + 2) * Math.sin(thresholdAngle);

  // Parallax mouse tilt handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20; // -10 to +10 deg
    const y = -((e.clientY - rect.top) / rect.height - 0.5) * 20;
    setTilt({ x: y, y: x });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  const headroom = Math.max(0, totalLimit - totalSpend);

  return (
    <div 
      className="relative flex flex-col items-center select-none"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: '800px' }}
    >
      {/* 3D Gauge Container with Dynamic Tilt */}
      <div 
        className="relative transition-transform duration-200 ease-out preserve-3d"
        style={{
          transform: `rotateX(${tilt.x.toFixed(2)}deg) rotateY(${tilt.y.toFixed(2)}deg) translateZ(12px)`,
          width: size,
          height: size
        }}
      >
        {/* Recessed Ambient Depth Shadow */}
        <div 
          className="absolute inset-2 rounded-full plate-recessed shadow-[inset_0_4px_12px_rgba(15,23,42,0.12),0_12px_28px_-6px_rgba(15,23,42,0.08)] pointer-events-none" 
        />

        {/* Outer Laser-Etched Concentric Ring */}
        <div className="absolute inset-5 rounded-full border border-slate-300/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.08)] pointer-events-none" />

        {/* SVG Holographic Ring Layers */}
        <svg 
          viewBox="0 0 200 200" 
          className="w-full h-full relative z-10 -rotate-90 overflow-visible"
        >
          <defs>
            {/* Holographic Arc Gradient */}
            <linearGradient id="holoArcGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={statusColor.gradientStart} />
              <stop offset="100%" stopColor={statusColor.gradientEnd} />
            </linearGradient>

            {/* Glowing filter */}
            <filter id="holoGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={statusColor.stroke} floodOpacity="0.45" />
            </filter>
          </defs>

          {/* Background CNC Inset Track with Bevel */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#DFE4EC"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray="4 2"
            opacity="0.8"
          />

          {/* Dynamic Spend Utilization Arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="url(#holoArcGradient)"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            filter="url(#holoGlow)"
            className="transition-all duration-700 ease-out"
          />

          {/* Pulse Particle Streamer on Arc Head */}
          {clampedBurn > 1 && (
            <circle
              cx={center + radius * Math.cos(((clampedBurn / 100) * 360 * Math.PI) / 180)}
              cy={center + radius * Math.sin(((clampedBurn / 100) * 360 * Math.PI) / 180)}
              r="4.5"
              fill="#FFFFFF"
              stroke={statusColor.stroke}
              strokeWidth="2"
              className="animate-ping opacity-75 origin-center"
            />
          )}

          {/* Laser-Etched Hash Marks around Chassis */}
          {[0, 25, 50, 75, 100].map((pct) => {
            const angle = ((pct / 100) * 360) * (Math.PI / 180);
            const x1 = center + (radius - 10) * Math.cos(angle);
            const y1 = center + (radius - 10) * Math.sin(angle);
            const x2 = center + (radius - 5) * Math.cos(angle);
            const y2 = center + (radius - 5) * Math.sin(angle);
            return (
              <line
                key={pct}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#94A3B8"
                strokeWidth={pct === 100 ? 2 : 1}
                opacity={pct <= clampedBurn ? 0.9 : 0.4}
              />
            );
          })}
        </svg>

        {/* 3D Threshold Notch Pin (Layer Z-30) */}
        <div
          className="absolute z-20 pointer-events-none transition-transform duration-300"
          style={{
            left: `${notchX}px`,
            top: `${notchY}px`,
            transform: 'translate(-50%, -50%) translateZ(24px)'
          }}
          title={`Alert Threshold: ${thresholdPercent}%`}
        >
          <div className="relative flex items-center justify-center">
            <span className="w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-white shadow-[0_2px_6px_rgba(245,158,11,0.6)] animate-pulse" />
            <span className="absolute -top-5 px-1.5 py-0.5 rounded bg-slate-900/90 text-white font-mono text-[9px] font-bold shadow-md whitespace-nowrap">
              {thresholdPercent}%
            </span>
          </div>
        </div>

        {/* Center Floating Hub Plate (Layer Z-20) */}
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          style={{ transform: 'translateZ(26px)' }}
        >
          <div className="w-24 h-24 rounded-full bg-[#F8F9FB] border border-slate-300/80 shadow-[0_6px_16px_rgba(15,23,42,0.1),inset_0_1px_1px_rgba(255,255,255,0.9)] flex flex-col items-center justify-center p-2 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Burn Rate
            </span>
            <span className={`text-2xl font-heading font-extrabold tracking-tight ${statusColor.text}`}>
              {burnRatePercent.toFixed(1)}%
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isBreached ? 'bg-rose-500' : isNearThreshold ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <span className="text-[9px] font-semibold text-slate-600 truncate max-w-[70px]">
                {statusColor.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Accompanying Live Headroom / Spend Footprint */}
      {showDetails && (
        <div className="mt-4 w-full text-center space-y-1">
          <div className="text-xs text-slate-600">
            Committed <strong className="text-slate-900 font-mono">${totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> of <strong className="text-slate-900 font-mono">${totalLimit.toLocaleString()}</strong>
          </div>
          <div className="flex items-center justify-center gap-1 text-[11px] font-medium text-slate-500">
            {isBreached ? (
              <span className="text-rose-600 font-bold flex items-center gap-1">
                <ShieldAlert size={13} />
                <span>Over budget by ${(totalSpend - totalLimit).toLocaleString()}</span>
              </span>
            ) : (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <ShieldCheck size={13} />
                <span>Safe Margin: ${headroom.toLocaleString(undefined, { maximumFractionDigits: 0 })} headroom</span>
              </span>
            )}
            <span className="text-slate-300">·</span>
            <span>Alert gate at {thresholdPercent}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
