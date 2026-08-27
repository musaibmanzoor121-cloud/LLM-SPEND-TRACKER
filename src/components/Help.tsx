import React from 'react';
import { BookOpen, KeyRound, ExternalLink, HelpCircle } from 'lucide-react';

export default function Help() {
  return (
    <div className="flex flex-col h-full overflow-y-auto pr-4">
      <div className="flex justify-between items-end mb-10 pb-6 border-b border-white/5">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-heading font-semibold tracking-tight text-white">Help & User Manual</h1>
          <p className="text-sm text-white/40">Complete guide to using Watchdog and configuring AI providers.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Manual */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-heading font-medium text-white mb-4 flex items-center gap-2">
              <BookOpen size={18} className="text-[#3DDC97]" /> Quick Start Guide
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-white mb-2">1. Add Your API Keys</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Navigate to the <strong>API Keys</strong> tab. Select your AI provider and paste your secret key. 
                  All keys are instantly encrypted using AES-256-GCM before ever touching the database.
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-white mb-2">2. Set Budget Thresholds</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Go to the <strong>Budgets</strong> tab. Set your maximum monthly spend for each provider, 
                  along with a list of percentage thresholds (e.g., 50, 80, 100).
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-white mb-2">3. Sync & Monitor</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  The dashboard background worker will sync usage daily, but you can always click <strong>Sync Data</strong> 
                  on the Dashboard for real-time updates. When your spend crosses a threshold, you will receive an automated email alert.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-heading font-medium text-white mb-4 flex items-center gap-2">
              <HelpCircle size={18} className="text-blue-400" /> FAQ
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-medium text-white mb-1">Is my data secure?</h3>
                <p className="text-xs text-white/50">Yes. Keys are encrypted at rest. Passwords use bcrypt hashing. Sessions use signed JWTs.</p>
              </div>
              <div>
                <h3 className="text-xs font-medium text-white mb-1">Why is my usage $0?</h3>
                <p className="text-xs text-white/50">Some providers (like Google Gemini and Mistral) do not currently expose standardized billing APIs for API keys. They will track models but show $0 until they release billing endpoints.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: API Keys Guide */}
        <div className="xl:col-span-2">
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-heading font-medium text-white mb-6 flex items-center gap-2">
              <KeyRound size={18} className="text-[#F5A623]" /> How to get API Keys
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <ProviderCard 
                name="OpenAI" 
                link="https://platform.openai.com/api-keys" 
                color="bg-[#3DDC97]"
                steps={['Log in to OpenAI Platform', 'Go to API Keys in the left menu', 'Click "Create new secret key"']}
              />
              
              <ProviderCard 
                name="Anthropic" 
                link="https://console.anthropic.com/settings/keys" 
                color="bg-[#F5A623]"
                steps={['Log in to Anthropic Console', 'Navigate to Settings > API Keys', 'Click "Create Key"']}
              />
              
              <ProviderCard 
                name="Google Gemini" 
                link="https://aistudio.google.com/app/apikey" 
                color="bg-[#4285F4]"
                steps={['Open Google AI Studio', 'Click "Get API key" in the sidebar', 'Click "Create API key"']}
              />
              
              <ProviderCard 
                name="Mistral AI" 
                link="https://console.mistral.ai/api-keys/" 
                color="bg-[#E91E63]"
                steps={['Log in to Mistral Console', 'Go to API Keys', 'Click "Create new key"']}
              />
              
              <ProviderCard 
                name="Cohere" 
                link="https://dashboard.cohere.com/api-keys" 
                color="bg-[#9C27B0]"
                steps={['Open Cohere Dashboard', 'Scroll to API Keys section', 'Click "Create Trial/Production Key"']}
              />
              
              <ProviderCard 
                name="Groq" 
                link="https://console.groq.com/keys" 
                color="bg-[#F55036]"
                steps={['Log in to Groq Cloud', 'Navigate to API Keys', 'Click "Create API Key"']}
              />
              
              <ProviderCard 
                name="DeepSeek" 
                link="https://platform.deepseek.com/api_keys" 
                color="bg-[#4D6BFE]"
                steps={['Open DeepSeek Platform', 'Go to API Keys', 'Generate a new key']}
              />
              
              <ProviderCard 
                name="Perplexity" 
                link="https://www.perplexity.ai/settings/api" 
                color="bg-[#22B8CD]"
                steps={['Go to Perplexity Settings', 'Switch to the API tab', 'Generate a new API key']}
              />
              
              <ProviderCard 
                name="Together AI" 
                link="https://api.together.ai/settings/api-keys" 
                color="bg-[#0F6FFF]"
                steps={['Log in to Together AI', 'Navigate to Settings > API Keys', 'Copy your existing key or create one']}
              />
              
              <ProviderCard 
                name="OpenRouter" 
                link="https://openrouter.ai/keys" 
                color="bg-[#9B6DF7]"
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
    <div className="bg-[#0B1220] border border-white/5 rounded-lg p-4 hover:border-white/10 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${color}`} />
          <h3 className="font-medium text-sm text-white">{name}</h3>
        </div>
        <a 
          href={link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-white/40 hover:text-white transition-colors"
          title={`Get ${name} Key`}
        >
          <ExternalLink size={14} />
        </a>
      </div>
      <ol className="list-decimal list-inside space-y-1">
        {steps.map((step, idx) => (
          <li key={idx} className="text-[11px] text-white/50">{step}</li>
        ))}
      </ol>
    </div>
  );
}
