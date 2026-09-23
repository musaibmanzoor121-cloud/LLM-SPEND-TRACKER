import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Trash2, 
  PlusCircle, 
  Cpu, 
  ShieldAlert, 
  Zap, 
  Settings2, 
  Copy, 
  Check, 
  User, 
  MessageSquare,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  createChatSession, 
  subscribeToChatSessions, 
  deleteChatSession, 
  addChatMessage, 
  subscribeToChatMessages,
  ChatSession,
  ChatMessage 
} from '../lib/firestoreChat';

interface RolePreset {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  systemInstruction: string;
  recommendedModel: 'gemini-3.5-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite';
}

const ROLE_PRESETS: RolePreset[] = [
  {
    id: 'finops-architect',
    name: 'FinOps AI Architect',
    description: 'Expert on LLM model routing, batch processing, prompt caching, and cost elimination.',
    icon: <Cpu size={16} className="text-[#3DDC97]" />,
    recommendedModel: 'gemini-3.5-flash',
    systemInstruction: `You are an elite AI FinOps Architect embedded inside Watchdog, an enterprise API cost intelligence platform.
Your objective: Provide crisp, practical, and mathematically backed advice on optimizing AI spend.
- Guide users on model migration (e.g., GPT-4o vs Claude 3.5 Sonnet vs Gemini Flash).
- Explain prompt caching, token reduction strategies, batching APIs, and quantization.
- Deliver code snippets, benchmark comparisons, and token calculations.
- Maintain a professional, executive-ready engineering tone.`
  },
  {
    id: 'complex-reasoning',
    name: 'Complex Architecture Analyst',
    description: 'Deep mathematical analysis of multi-agent token burn, fallback routing, and SLA tradeoffs.',
    icon: <Sparkles size={16} className="text-amber-400" />,
    recommendedModel: 'gemini-3.1-pro-preview',
    systemInstruction: `You are an Advanced AI Systems Engineer specializing in complex architectural tradeoffs and token economics.
Use deep reasoning to evaluate complex multi-agent architectures, recursive loops, streaming token latency, and global enterprise budget guardrails. Provide thorough formulas and structural diagrams when applicable.`
  },
  {
    id: 'fast-assistant',
    name: 'Fast Token Copilot',
    description: 'Ultra-low latency assistant for rapid token calculations, unit conversions, and regex.',
    icon: <Zap size={16} className="text-blue-400" />,
    recommendedModel: 'gemini-3.1-flash-lite',
    systemInstruction: `You are a high-speed AI engineering copilot. Provide instant, razor-sharp calculations, token estimations, regex patterns, and API payload structures with zero fluff. Keep responses succinct and to the point.`
  },
  {
    id: 'anomaly-guardian',
    name: 'Spend & Anomaly Guardian',
    description: 'Detects rogue loops, runaway spend patterns, key leaks, and circuit breaker policies.',
    icon: <ShieldAlert size={16} className="text-red-400" />,
    recommendedModel: 'gemini-3.5-flash',
    systemInstruction: `You are a 24/7 Security & Spend Anomaly Guardian. Analyze API key risks, infinite retry loops, and webhook alert triggers. Recommend defensive coding patterns, circuit breakers, and rate limiters to prevent surprise bills.`
  }
];

const SUGGESTIONS = [
  "How can we reduce GPT-4o spend by 50% using prompt caching?",
  "Compare Gemini 1.5 Flash vs Claude 3.5 Haiku pricing & latency.",
  "Design a circuit breaker pattern for agentic retry loops.",
  "What alert thresholds should we configure for an early-stage startup?"
];

export default function GeminiChatbot() {
  const { user, token } = useAuth();
  
  // Model state
  const [model, setModel] = useState<'gemini-3.5-flash' | 'gemini-3.1-pro-preview' | 'gemini-3.1-flash-lite'>('gemini-3.5-flash');
  
  // Role & system instruction state
  const [selectedRole, setSelectedRole] = useState<string>('finops-architect');
  const [customInstruction, setCustomInstruction] = useState<string>('');
  const [showCustomConfig, setShowCustomConfig] = useState<boolean>(false);

  // Sessions and messages
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // Local fallback messages if user is not yet logged in or offline
  const [localMessages, setLocalMessages] = useState<{ role: 'user' | 'model'; content: string; createdAt: string }[]>([
    {
      role: 'model',
      content: "Hello! I am your Watchdog Gemini AI Assistant. I can help you analyze token consumption, audit provider costs, optimize prompts, and architect high-efficiency LLM pipelines. How can I assist you today?",
      createdAt: new Date().toISOString()
    }
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, localMessages, loading]);

  // Subscribe to user chat sessions in Firestore
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToChatSessions(user.uid, (loadedSessions) => {
      setSessions(loadedSessions);
      if (loadedSessions.length > 0 && !currentSessionId) {
        setCurrentSessionId(loadedSessions[0].id);
      }
    });
    return () => unsubscribe();
  }, [user]);

  // Subscribe to messages of current session in Firestore
  useEffect(() => {
    if (!user || !currentSessionId) return;
    const unsubscribe = subscribeToChatMessages(user.uid, currentSessionId, (loadedMessages) => {
      setMessages(loadedMessages);
    });
    return () => unsubscribe();
  }, [user, currentSessionId]);

  // Switch role helper
  const handleSelectRole = (roleId: string) => {
    setSelectedRole(roleId);
    const preset = ROLE_PRESETS.find(r => r.id === roleId);
    if (preset) {
      setModel(preset.recommendedModel);
    }
  };

  // Create new session
  const handleNewSession = async () => {
    const preset = ROLE_PRESETS.find(r => r.id === selectedRole);
    const sysInstruction = customInstruction || preset?.systemInstruction || '';
    
    if (user) {
      try {
        const newId = await createChatSession(
          user.uid,
          'New Chat ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          model,
          selectedRole,
          sysInstruction
        );
        setCurrentSessionId(newId);
        // Seed welcome message
        await addChatMessage(
          user.uid, 
          newId, 
          'model', 
          `Session initialized with **${preset?.name || 'Gemini Assistant'}** using **${model}**.\n\nAsk me anything about API cost optimization, model benchmarks, or token reduction.`
        );
      } catch (e) {
        console.error('Failed to create new Firestore session:', e);
      }
    } else {
      setLocalMessages([
        {
          role: 'model',
          content: `New session started with **${preset?.name}** (${model}). Ask anything about AI spend or LLM architectures.`,
          createdAt: new Date().toISOString()
        }
      ]);
    }
  };

  // Delete session
  const handleDeleteSession = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await deleteChatSession(user.uid, chatId);
      if (currentSessionId === chatId) {
        const remaining = sessions.filter(s => s.id !== chatId);
        setCurrentSessionId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  // Send message
  const handleSend = async (textToSend?: string) => {
    const promptText = (textToSend || input).trim();
    if (!promptText || loading) return;

    setInput('');
    setLoading(true);

    const preset = ROLE_PRESETS.find(r => r.id === selectedRole);
    const activeInstruction = customInstruction || preset?.systemInstruction || '';

    // If logged into Firebase
    if (user) {
      let activeChatId = currentSessionId;
      if (!activeChatId) {
        activeChatId = await createChatSession(
          user.uid,
          promptText.slice(0, 40) + '...',
          model,
          selectedRole,
          activeInstruction
        );
        setCurrentSessionId(activeChatId);
      }

      // Add user message to Firestore
      await addChatMessage(user.uid, activeChatId, 'user', promptText);

      // Build conversation history for multi-turn request
      const historyPayload = [
        ...messages.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: promptText }
      ];

      try {
        const res = await fetch('/api/gemini/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token || localStorage.getItem('watchdog_token')}`
          },
          body: JSON.stringify({
            messages: historyPayload,
            model,
            role: selectedRole,
            systemInstruction: activeInstruction
          })
        });

        const data = await res.json();
        if (res.ok) {
          await addChatMessage(user.uid, activeChatId, 'model', data.text);
        } else {
          await addChatMessage(user.uid, activeChatId, 'model', `⚠️ Error: ${data.error || 'Failed to generate response'}`);
        }
      } catch (err: any) {
        await addChatMessage(user.uid, activeChatId, 'model', `⚠️ Network error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    } else {
      // Local fallback mode
      const newLocal = [
        ...localMessages,
        { role: 'user' as const, content: promptText, createdAt: new Date().toISOString() }
      ];
      setLocalMessages(newLocal);

      try {
        const res = await fetch('/api/gemini/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token || localStorage.getItem('watchdog_token')}`
          },
          body: JSON.stringify({
            messages: newLocal,
            model,
            role: selectedRole,
            systemInstruction: activeInstruction
          })
        });

        const data = await res.json();
        if (res.ok) {
          setLocalMessages([
            ...newLocal,
            { role: 'model' as const, content: data.text, createdAt: new Date().toISOString() }
          ]);
        } else {
          setLocalMessages([
            ...newLocal,
            { role: 'model' as const, content: `⚠️ Error: ${data.error || 'Failed to call Gemini API'}`, createdAt: new Date().toISOString() }
          ]);
        }
      } catch (err: any) {
        setLocalMessages([
          ...newLocal,
          { role: 'model' as const, content: `⚠️ Error: ${err.message}`, createdAt: new Date().toISOString() }
        ]);
      } finally {
        setLoading(false);
      }
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Determine current active messages list
  const activeMessageList = user && currentSessionId && messages.length > 0 ? messages : localMessages;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-9rem)] card-3d bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
      {/* Left Sidebar: Saved Sessions & Role Presets */}
      <div className="w-full lg:w-80 bg-slate-50/70 border-r border-slate-200/80 flex flex-col p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Bot size={18} className="text-indigo-600" />
            <span>AI Copilot Studio</span>
          </div>
          <button
            onClick={handleNewSession}
            className="btn-3d-white flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer"
          >
            <PlusCircle size={14} className="text-indigo-600" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Model Selection */}
        <div className="mb-4">
          <label className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-1.5 block">
            Gemini Model
          </label>
          <div className="grid grid-cols-3 gap-1 bg-slate-200/60 p-1 rounded-xl">
            <button
              onClick={() => setModel('gemini-3.5-flash')}
              className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                model === 'gemini-3.5-flash'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="General tasks - Balanced intelligence & speed"
            >
              Flash 3.5
            </button>
            <button
              onClick={() => setModel('gemini-3.1-pro-preview')}
              className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                model === 'gemini-3.1-pro-preview'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Complex tasks - Deep reasoning & architecture"
            >
              Pro 3.1
            </button>
            <button
              onClick={() => setModel('gemini-3.1-flash-lite')}
              className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                model === 'gemini-3.1-flash-lite'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Fast tasks - Low-latency quick queries"
            >
              Lite 3.1
            </button>
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            {model === 'gemini-3.5-flash' && '⚡ Recommended for general FinOps advice & questions'}
            {model === 'gemini-3.1-pro-preview' && '🧠 High-precision reasoning for complex architectures'}
            {model === 'gemini-3.1-flash-lite' && '🚀 Ultra-fast streaming & instant calculations'}
          </div>
        </div>

        {/* Roles Preset Selector */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
              Assistant Role
            </label>
            <button
              onClick={() => setShowCustomConfig(!showCustomConfig)}
              className="text-[10px] text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
            >
              <Settings2 size={11} />
              {showCustomConfig ? 'Hide Custom' : 'Custom Prompt'}
            </button>
          </div>

          <div className="space-y-1.5">
            {ROLE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSelectRole(preset.id)}
                className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 cursor-pointer ${
                  selectedRole === preset.id
                    ? 'bg-white border-indigo-200 text-indigo-900 shadow-sm'
                    : 'bg-white/50 border-slate-200/60 text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                <div className="mt-0.5 text-indigo-600">{preset.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate">{preset.name}</div>
                  <div className="text-[10px] text-slate-400 line-clamp-1">{preset.description}</div>
                </div>
              </button>
            ))}
          </div>

          {showCustomConfig && (
            <div className="mt-2.5 p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm">
              <label className="text-[10px] text-slate-500 font-semibold block mb-1">Custom System Persona:</label>
              <textarea
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                placeholder="Give your Gemini assistant a custom persona..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}
        </div>

        {/* Saved Sessions Thread List */}
        <div className="flex-1 overflow-y-auto mt-2 pr-1 border-t border-slate-200/70 pt-3">
          <div className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-2">
            Conversation History {user ? '(Firestore)' : '(Local)'}
          </div>

          {user && sessions.length === 0 && (
            <div className="text-xs text-slate-400 text-center py-4">
              No saved chats yet. Start a conversation!
            </div>
          )}

          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => setCurrentSessionId(s.id)}
              className={`group flex items-center justify-between p-2 rounded-xl text-xs mb-1 cursor-pointer transition-colors ${
                currentSessionId === s.id
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/60 font-medium'
                  : 'text-slate-600 hover:bg-white hover:text-slate-900 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <MessageSquare size={13} className="shrink-0 text-slate-400" />
                <span className="truncate">{s.title || 'Conversation'}</span>
              </div>
              <button
                onClick={(e) => handleDeleteSession(s.id, e)}
                className="opacity-0 group-hover:opacity-100 hover:text-rose-600 p-1 transition-opacity"
                title="Delete chat"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_2px_4px_rgba(99,102,241,0.1)]">
              <Bot size={20} />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>{ROLE_PRESETS.find(r => r.id === selectedRole)?.name || 'Gemini Assistant'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80 font-mono">
                  {model}
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Multi-turn conversation thread • Powered by Google GenAI SDK
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200/60 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Firestore Synced
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/60">
                Local Session
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Messages Thread */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
          {activeMessageList.map((msg, index) => {
            const isModel = msg.role === 'model';
            return (
              <div
                key={index}
                className={`flex gap-3 max-w-3xl ${isModel ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-semibold ${
                    isModel
                      ? 'bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm'
                      : 'bg-indigo-600 text-white shadow-sm'
                  }`}
                >
                  {isModel ? <Bot size={16} /> : <User size={16} />}
                </div>

                <div className="group relative">
                  <div
                    className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words border ${
                      isModel
                        ? 'bg-white text-slate-800 border-slate-200/80 rounded-tl-none shadow-[0_2px_8px_rgba(15,23,42,0.04)]'
                        : 'bg-indigo-600 text-white border-indigo-600 rounded-tr-none font-medium shadow-sm'
                    }`}
                  >
                    {msg.content}
                  </div>

                  {isModel && (
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400 px-1">
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <button
                        onClick={() => copyToClipboard(msg.content, index)}
                        className="hover:text-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Copy text"
                      >
                        {copiedIndex === index ? (
                          <>
                            <Check size={11} className="text-emerald-600" />
                            <span className="text-emerald-600 font-semibold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={11} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 max-w-3xl mr-auto">
              <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Bot size={16} className="animate-spin" />
              </div>
              <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-none p-4 flex items-center gap-2 text-xs text-slate-500 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                <span>Gemini is generating response...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        {activeMessageList.length <= 2 && (
          <div className="px-6 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar border-t border-slate-100 bg-white">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 shrink-0 font-semibold">
              Suggestions:
            </span>
            {SUGGESTIONS.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(suggestion)}
                className="shrink-0 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 border border-slate-200/60 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 rounded-2xl p-2 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={`Ask ${ROLE_PRESETS.find(r => r.id === selectedRole)?.name || 'Gemini'} about API costs, models, or tokens... (Shift+Enter for newline)`}
              rows={1}
              className="flex-1 bg-transparent px-3 py-1.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none resize-none max-h-32"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-3d-primary p-2.5 rounded-xl font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0 cursor-pointer"
              title="Send message"
            >
              <Send size={16} />
            </button>
          </form>
          <div className="mt-2 text-center text-[10px] text-slate-400">
            Gemini provides architectural FinOps guidance. All conversation history is safely persisted in your personal Firestore vault.
          </div>
        </div>
      </div>
    </div>
  );
}
