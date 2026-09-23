/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, KeyRound, ExternalLink, HelpCircle, ShieldCheck, Sparkles } from 'lucide-react';

export default function Help() {
  return (
    <div className="flex flex-col space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-slate-900 tracking-tight">
            Documentation & Guide
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl font-normal">
            Comprehensive manual to configuring API vault credentials, budget guardrails, and automated cost tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-semibold">
          <BookOpen size={14} className="text-indigo-600" />
          <span>v2.4 FinOps Standard</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Manual */}
        <div className="xl:col-span-1 space-y-6">
          <div className="card-3d bg-white rounded-2xl p-6">
            <h2 className="text-base font-heading font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-600" /> Quick Start Guide
            </h2>
            
            <div className="space-y-5">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
                <h3 className="text-xs font-bold text-slate-900 mb-1">1. Add Your API Vault Keys</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Navigate to <strong>API Key Vault</strong>. Select your AI provider and paste your secret key. 
                  All credentials are encrypted with AES-256 before storage.
                </p>
              </div>
              
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
                <h3 className="text-xs font-bold text-slate-900 mb-1">2. Set Budget Thresholds</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Go to <strong>Budget Caps</strong>. Set maximum monthly spend for each provider, 
                  along with percentage threshold warnings (e.g., 50%, 80%, 100%).
                </p>
              </div>
              
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
                <h3 className="text-xs font-bold text-slate-900 mb-1">3. Automated Sync & Alerts</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  The system polls token telemetry continuously. If any threshold is breached, 
                  instant email alerts are dispatched via Resend.
                </p>
              </div>
            </div>
          </div>
          
          <div className="card-3d bg-white rounded-2xl p-6">
            <h2 className="text-base font-heading font-bold text-slate-900 mb-4 flex items-center gap-2">
              <HelpCircle size={16} className="text-indigo-600" /> Frequently Asked Questions
            </h2>
            
            <div className="space-y-4 text-xs">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 mb-1">Is credential storage secure?</h3>
                <p className="text-slate-500 leading-relaxed text-[11px]">
                  Yes. All API secrets are encrypted at rest with AES-256-GCM. Passwords use bcrypt hashing and tokens use signed JWTs.
                </p>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-1">Why is my usage $0 initially?</h3>
                <p className="text-slate-500 leading-relaxed text-[11px]">
                  Providers require active API token invocations. Once requests are executed through your keys, cost data updates automatically.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: API Keys Guide */}
        <div className="xl:col-span-2">
          <div className="card-3d bg-white rounded-2xl p-6 sm:p-8">
            <h2 className="text-base font-heading font-bold text-slate-900 mb-6 flex items-center gap-2">
              <KeyRound size={16} className="text-indigo-600" /> How to Obtain Provider API Keys
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ProviderCard 
                name="OpenAI" 
                link="https://platform.openai.com/api-keys" 
                color="bg-indigo-600"
                steps={['Log in to OpenAI Platform', 'Go to API Keys in the left menu', 'Click "Create new secret key"']}
              />
              
              <ProviderCard 
                name="Anthropic" 
                link="https://console.anthropic.com/settings/keys" 
                color="bg-violet-600"
                steps={['Log in to Anthropic Console', 'Navigate to Settings > API Keys', 'Click "Create Key"']}
              />
              
              <ProviderCard 
                name="Google Gemini" 
                link="https://aistudio.google.com/app/apikey" 
                color="bg-emerald-600"
                steps={['Open Google AI Studio', 'Click "Get API key" in the sidebar', 'Click "Create API key"']}
              />
              
              <ProviderCard 
                name="Mistral AI" 
                link="https://console.mistral.ai/api-keys/" 
                color="bg-pink-600"
                steps={['Log in to Mistral Console', 'Go to API Keys', 'Click "Create new key"']}
              />
              
              <ProviderCard 
                name="Cohere" 
                link="https://dashboard.cohere.com/api-keys" 
                color="bg-purple-600"
                steps={['Open Cohere Dashboard', 'Scroll to API Keys section', 'Click "Create Trial/Production Key"']}
              />
              
              <ProviderCard 
                name="Groq" 
                link="https://console.groq.com/keys" 
                color="bg-orange-600"
                steps={['Log in to Groq Cloud', 'Navigate to API Keys', 'Click "Create API Key"']}
              />
              
              <ProviderCard 
                name="DeepSeek" 
                link="https://platform.deepseek.com/api_keys" 
                color="bg-blue-600"
                steps={['Open DeepSeek Platform', 'Go to API Keys', 'Generate a new key']}
              />
              
              <ProviderCard 
                name="OpenRouter" 
                link="https://openrouter.ai/keys" 
                color="bg-indigo-500"
                steps={['Open OpenRouter settings', 'Go to Keys section', 'Click "Create Key"']}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProviderCard({ name, link, steps, color }: { name: string, link: string, steps: string[], color: string }) {
  return (
    <div className="bg-slate-50/80 border border-slate-200/70 rounded-xl p-4 hover:bg-white hover:border-slate-300 transition-all shadow-sm">
      <div className="flex justify-between items-start mb-2.5">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${color}`} />
          <h3 className="font-bold text-xs text-slate-900">{name}</h3>
        </div>
        <a 
          href={link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-slate-400 hover:text-indigo-600 transition-colors"
          title={`Get ${name} Key`}
        >
          <ExternalLink size={13} />
        </a>
      </div>
      <ol className="list-decimal list-inside space-y-1">
        {steps.map((step, idx) => (
          <li key={idx} className="text-[11px] text-slate-500">{step}</li>
        ))}
      </ol>
    </div>
  );
}
