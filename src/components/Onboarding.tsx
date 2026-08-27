import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Key, Bell, LineChart, ChevronRight, X, BookOpen } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

const slides = [
  {
    id: 'welcome',
    title: 'Watchdog Intelligence',
    description: 'A completely secure, multi-tenant vault for tracking and managing your AI API expenditure.',
    icon: <Shield size={48} className="text-[#3DDC97]" />,
    bgNode: (
      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
        <div className="w-64 h-64 border border-[#3DDC97] rounded-full animate-[ping_3s_ease-in-out_infinite]" />
        <div className="w-48 h-48 border border-[#3DDC97] rounded-full absolute" />
      </div>
    )
  },
  {
    id: 'keys',
    title: 'Zero-Knowledge Vault',
    description: 'Your API keys are encrypted immediately with AES-256-GCM. We never store them in plain text.',
    icon: <Key size={48} className="text-white" />,
    bgNode: (
      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(16)].map((_, i) => (
            <div key={i} className="w-8 h-8 border border-white rounded animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      </div>
    )
  },
  {
    id: 'alerts',
    title: 'Automated Intercepts',
    description: 'Set custom percentage thresholds and let Watchdog dispatch immediate email alerts before you overspend.',
    icon: <Bell size={48} className="text-[#3DDC97]" />,
    bgNode: (
      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none flex-col gap-8">
        <div className="w-full max-w-sm h-px bg-white relative"><div className="absolute left-1/4 w-2 h-2 bg-[#3DDC97] rounded-full -top-1" /></div>
        <div className="w-full max-w-sm h-px bg-white relative"><div className="absolute left-1/2 w-2 h-2 bg-[#3DDC97] rounded-full -top-1" /></div>
        <div className="w-full max-w-sm h-px bg-[#3DDC97] relative"><div className="absolute left-3/4 w-2 h-2 bg-white rounded-full -top-1 shadow-[0_0_10px_#3DDC97]" /></div>
      </div>
    )
  },
  {
    id: 'analyze',
    title: 'Model-Level Analytics',
    description: 'Break down your expenses by provider, environment tag, and specific AI model to see exactly where your budget goes.',
    icon: <LineChart size={48} className="text-white" />,
    bgNode: (
      <div className="absolute inset-0 flex items-end justify-center opacity-10 pointer-events-none pb-12 gap-2">
        {[40, 70, 45, 90, 60, 110, 80].map((h, i) => (
          <div key={i} className="w-8 bg-gradient-to-t from-transparent to-white rounded-t-sm" style={{ height: `${h}px` }} />
        ))}
      </div>
    )
  },
  {
    id: 'manual',
    title: 'Comprehensive User Manual',
    description: 'Need help finding API keys for our 10 supported providers? Our built-in Help & Manual section has you covered with step-by-step guides.',
    icon: <BookOpen size={48} className="text-[#3DDC97]" />,
    bgNode: (
      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none gap-4">
        <div className="w-24 h-32 border-2 border-[#3DDC97] rounded-lg -rotate-12" />
        <div className="w-24 h-32 border-2 border-white rounded-lg z-10 bg-[#0B1220]" />
        <div className="w-24 h-32 border-2 border-[#3DDC97] rounded-lg rotate-12" />
      </div>
    )
  }
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide === slides.length - 1) {
      onComplete();
    } else {
      setCurrentSlide(s => s + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050914]/90 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl bg-[#0B1220] border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative min-h-[480px] flex flex-col">
        
        <button 
          onClick={onComplete}
          className="absolute top-4 right-4 z-20 text-white/40 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex-grow relative overflow-hidden flex items-center justify-center p-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="w-full flex flex-col items-center text-center relative z-10"
            >
              <div className="mb-8 p-6 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm">
                {slides[currentSlide].icon}
              </div>
              <h2 className="text-3xl font-heading font-medium text-white mb-4 tracking-tight">
                {slides[currentSlide].title}
              </h2>
              <p className="text-white/60 text-lg leading-relaxed max-w-md">
                {slides[currentSlide].description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Background Abstract Visuals */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide + '-bg'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              {slides[currentSlide].bgNode}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="border-t border-white/5 p-6 bg-[#080d17] flex justify-between items-center relative z-10">
          <div className="flex gap-2">
            {slides.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-8 bg-[#3DDC97]' : 'w-2 bg-white/20'}`}
              />
            ))}
          </div>
          <button 
            onClick={nextSlide}
            className="flex items-center gap-2 bg-white text-[#0B1220] px-6 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors text-sm"
          >
            {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
