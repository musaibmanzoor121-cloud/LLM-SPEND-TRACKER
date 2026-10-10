/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { 
  X, 
  Globe, 
  ExternalLink, 
  RefreshCw, 
  Search, 
  ArrowUpRight, 
  Sparkles,
  Bot
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface MarketIntelData {
  summary: string;
  model: string;
  grounding: {
    sources: { title: string; uri: string }[];
    queries: string[];
    isGrounded: boolean;
  };
  updatedAt: string;
}

export default function LiveMarketIntelModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [data, setData] = useState<MarketIntelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIntel = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/gemini/market-intel', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('watchdog_token')}` }
      });
      if (res.ok) {
        setData(await res.json());
      } else {
        const errJson = await res.json().catch(() => ({}));
        setError(errJson.error || 'Failed to fetch live market intelligence');
      }
    } catch (err: any) {
      setError(err.message || 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !data) {
      fetchIntel();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shadow-xs">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-heading font-bold text-slate-900 tracking-tight">
                  Live AI Market Radar
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  Google Search Grounded
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                  gemini-3.5-flash
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Up-to-date token pricing, caching discounts, and live status advisories.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchIntel(true)}
              disabled={loading}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Refresh Google Search data"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin text-blue-600' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Close modal"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shadow-sm animate-bounce">
                <Globe size={20} />
              </div>
              <div className="text-sm font-semibold text-slate-800">
                Grounding with Google Search data...
              </div>
              <div className="text-xs text-slate-400">
                Querying live provider docs with gemini-3.5-flash
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {data && !loading && (
            <>
              {/* Summary text */}
              <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-200/70 whitespace-pre-wrap break-words font-sans text-xs leading-relaxed text-slate-800">
                {data.summary}
              </div>

              {/* Search Queries executed */}
              {data.grounding?.queries && data.grounding.queries.length > 0 && (
                <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-100 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-800 uppercase tracking-wider">
                    <Search size={11} />
                    <span>Google Search Queries Executed:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {data.grounding.queries.map((q, idx) => (
                      <span key={idx} className="bg-white text-slate-700 px-2 py-0.5 rounded-md text-[11px] font-mono border border-slate-200 shadow-2xs">
                        "{q}"
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Grounding Source Citations */}
              {data.grounding?.sources && data.grounding.sources.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <Globe size={11} className="text-blue-500" />
                    <span>Live Verification Sources:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {data.grounding.sources.map((src, idx) => (
                      <a
                        key={idx}
                        href={src.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-xl bg-white hover:bg-blue-50/60 border border-slate-200 hover:border-blue-200 transition-all flex items-center justify-between group shadow-2xs"
                      >
                        <div className="truncate pr-2">
                          <span className="font-semibold text-slate-900 text-xs block truncate group-hover:text-blue-700">
                            {src.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono block truncate">
                            {src.uri}
                          </span>
                        </div>
                        <ExternalLink size={13} className="text-slate-400 group-hover:text-blue-600 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs">
          <div className="text-slate-400 text-[11px]">
            {data?.updatedAt ? `Last grounded: ${new Date(data.updatedAt).toLocaleTimeString()}` : 'Live Web Data'}
          </div>
          <Link
            to="/chat"
            onClick={onClose}
            className="btn-3d-primary px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Bot size={13} />
            <span>Open in Copilot Studio</span>
            <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}
