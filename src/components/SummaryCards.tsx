import React from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, TrendingUp, AlertTriangle, CreditCard, ArrowUpRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export interface SummaryStats {
  totalKeysActive: number;
  totalKeys: number;
  projectedSpend: number;
  totalSpendMTD: number;
  dailyAverage: number;
  alertsTriggered: number;
  totalBudgetLimit: number;
  activeThresholdBreaches?: number;
}

interface SummaryCardsProps {
  stats: SummaryStats;
  timeframe?: string;
}

export default function SummaryCards({ stats, timeframe = 'this_month' }: SummaryCardsProps) {
  const {
    totalKeysActive,
    totalKeys,
    projectedSpend,
    totalSpendMTD,
    dailyAverage,
    alertsTriggered,
    totalBudgetLimit
  } = stats;

  const budgetUsagePercent = totalBudgetLimit > 0 
    ? Math.min((totalSpendMTD / totalBudgetLimit) * 100, 100) 
    : 0;

  const projectedVsBudgetPercent = totalBudgetLimit > 0
    ? (projectedSpend / totalBudgetLimit) * 100
    : 0;

  return (
    <div id="summary-cards-container" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      {/* Card 1: Total Keys Active */}
      <div 
        id="card-keys-active"
        className="bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 relative overflow-hidden group shadow-[0_4px_24px_rgba(0,0,0,0.3)] flex flex-col justify-between"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#3DDC97] via-[#25A16E] to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
        
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#3DDC97]/10 border border-[#3DDC97]/20 flex items-center justify-center text-[#3DDC97] shadow-[0_0_12px_rgba(61,220,151,0.15)]">
                <KeyRound size={20} />
              </div>
              <div>
                <span className="text-[11px] text-white/50 uppercase tracking-widest font-semibold block">Total Keys Active</span>
                <span className="text-[10px] text-white/30 tracking-wider font-mono">ENCRYPTED VAULT</span>
              </div>
            </div>
            <Link 
              id="link-manage-keys"
              to="/keys" 
              className="text-white/30 group-hover:text-[#3DDC97] transition-colors p-1 rounded-lg hover:bg-white/5" 
              title="Manage API Keys"
            >
              <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-heading font-light text-white tracking-tight">{totalKeysActive}</span>
            <span className="text-sm font-mono text-white/40">/ {totalKeys} total</span>
          </div>
        </div>

        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${totalKeysActive > 0 ? 'bg-[#3DDC97] animate-pulse shadow-[0_0_8px_rgba(61,220,151,0.8)]' : 'bg-white/20'}`} />
            <span className="text-white/60 font-medium">
              {totalKeysActive === totalKeys && totalKeys > 0 ? 'All Credentials Active' : totalKeysActive > 0 ? `${totalKeys - totalKeysActive} Inactive` : 'No Keys Connected'}
            </span>
          </div>
          <span className="text-[10px] text-white/30 uppercase font-mono tracking-wider">AES-256</span>
        </div>
      </div>

      {/* Card 2: Projected Spend This Month */}
      <div 
        id="card-projected-spend"
        className="bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 relative overflow-hidden group shadow-[0_4px_24px_rgba(0,0,0,0.3)] flex flex-col justify-between"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 via-purple-500 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
        
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.15)]">
                <TrendingUp size={20} />
              </div>
              <div>
                <span className="text-[11px] text-white/50 uppercase tracking-widest font-semibold block">Projected Spend</span>
                <span className="text-[10px] text-white/30 tracking-wider font-mono">EOM FORECAST</span>
              </div>
            </div>
            <Link 
              id="link-view-budgets-projection"
              to="/budgets" 
              className="text-white/30 group-hover:text-purple-400 transition-colors p-1 rounded-lg hover:bg-white/5"
              title="View Monthly Budgets"
            >
              <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-heading font-light text-white tracking-tight">${projectedSpend.toFixed(2)}</span>
            <span className="text-xs font-mono text-purple-300/60 uppercase">Est. EOM</span>
          </div>
        </div>

        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
          <span className="text-white/60 font-mono">
            ${dailyAverage.toFixed(2)}<span className="text-white/30">/day burn</span>
          </span>
          {totalBudgetLimit > 0 ? (
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded-md ${projectedVsBudgetPercent > 100 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-purple-500/10 text-purple-300 border border-purple-500/20'}`}>
              {projectedVsBudgetPercent.toFixed(0)}% of cap
            </span>
          ) : (
            <span className="text-[10px] text-white/30 uppercase font-mono">No Cap Set</span>
          )}
        </div>
      </div>

      {/* Card 3: Alerts Triggered */}
      <div 
        id="card-alerts-triggered"
        className="bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 relative overflow-hidden group shadow-[0_4px_24px_rgba(0,0,0,0.3)] flex flex-col justify-between"
      >
        <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${alertsTriggered > 0 ? 'from-[#F5A623] via-amber-500' : 'from-[#3DDC97] via-emerald-500'} to-transparent opacity-60 group-hover:opacity-100 transition-opacity`} />
        
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${alertsTriggered > 0 ? 'bg-[#F5A623]/10 border-[#F5A623]/20 text-[#F5A623] shadow-[0_0_12px_rgba(245,166,35,0.15)]' : 'bg-[#3DDC97]/10 border-[#3DDC97]/20 text-[#3DDC97] shadow-[0_0_12px_rgba(61,220,151,0.15)]'} border flex items-center justify-center`}>
                <AlertTriangle size={20} />
              </div>
              <div>
                <span className="text-[11px] text-white/50 uppercase tracking-widest font-semibold block">Alerts Triggered</span>
                <span className="text-[10px] text-white/30 tracking-wider font-mono">THRESHOLD STATUS</span>
              </div>
            </div>
            <Link 
              id="link-view-budget-alerts"
              to="/budgets" 
              className={`text-white/30 transition-colors p-1 rounded-lg hover:bg-white/5 ${alertsTriggered > 0 ? 'group-hover:text-[#F5A623]' : 'group-hover:text-[#3DDC97]'}`}
              title="Configure Alert Thresholds"
            >
              <ArrowUpRight size={16} />
            </Link>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className={`text-4xl font-heading font-light tracking-tight ${alertsTriggered > 0 ? 'text-[#F5A623]' : 'text-white'}`}>
              {alertsTriggered}
            </span>
            <span className="text-xs font-mono text-white/40 uppercase">This Period</span>
          </div>
        </div>

        <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
          {alertsTriggered > 0 ? (
            <div className="flex items-center gap-1.5 text-[#F5A623]">
              <span className="w-2 h-2 rounded-full bg-[#F5A623] animate-pulse" />
              <span className="font-medium text-[11px]">Threshold Warning</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[#3DDC97]">
              <CheckCircle2 size={13} />
              <span className="font-medium text-[11px]">All Limits Safe</span>
            </div>
          )}
          <span className="text-[10px] text-white/40 uppercase font-mono tracking-wider">
            {alertsTriggered > 0 ? 'Review Budgets' : 'Automated'}
          </span>
        </div>
      </div>

      {/* Card 4: Total Spend MTD */}
      <div 
        id="card-total-spend"
        className="bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 relative overflow-hidden group shadow-[0_4px_24px_rgba(0,0,0,0.3)] flex flex-col justify-between"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-cyan-500 to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
        
        <div>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.15)]">
                <CreditCard size={20} />
              </div>
              <div>
                <span className="text-[11px] text-white/50 uppercase tracking-widest font-semibold block">Total Spend (MTD)</span>
                <span className="text-[10px] text-white/30 tracking-wider font-mono capitalize">{timeframe.replace('_', ' ')}</span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-blue-300/70 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">
              LIVE
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-heading font-light text-white tracking-tight">${totalSpendMTD.toFixed(2)}</span>
            {totalBudgetLimit > 0 && (
              <span className="text-xs font-mono text-white/40">/ ${totalBudgetLimit.toFixed(0)} cap</span>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-white/5 flex flex-col gap-1.5">
          {totalBudgetLimit > 0 ? (
            <>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${budgetUsagePercent >= 100 ? 'bg-red-500' : budgetUsagePercent >= 80 ? 'bg-[#F5A623]' : 'bg-blue-400'}`}
                  style={{ width: `${budgetUsagePercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-white/40 font-mono">
                <span>{budgetUsagePercent.toFixed(1)}% Used</span>
                <span>${Math.max(0, totalBudgetLimit - totalSpendMTD).toFixed(2)} remaining</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between items-center text-xs text-white/40">
              <span>Tracking API Costs</span>
              <span className="text-[10px] font-mono text-white/30 uppercase">Real-time</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
