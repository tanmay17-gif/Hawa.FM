import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Clock, Volume2, ArrowRight, Check } from 'lucide-react';

interface OnboardingHintProps {
  onDismiss: () => void;
}

export const OnboardingHint: React.FC<OnboardingHintProps> = ({ onDismiss }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: '1. Turn TUNE Knob',
      desc: 'Rotate the left knob or sweep the frequency dial to pick a Mumbai monitoring station (91.1 to 104.8 FM).',
      icon: Radio,
      highlight: 'Left Knob / Frequency Dial'
    },
    {
      title: '2. Turn TIME Knob',
      desc: 'Scrub backwards in time across 1.7 years of history to watch the skyline smog react to real historical events.',
      icon: Clock,
      highlight: 'Right Knob / History Scrub'
    },
    {
      title: '3. Press Broadcast Voice',
      desc: 'Listen to spoken radio bulletins in English, Hindi, or Marathi generated deterministically from real measurements.',
      icon: Volume2,
      highlight: 'Voice Bulletin & Audio Chimes'
    }
  ];

  const currentStep = steps[step];
  const Icon = currentStep.icon;

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onDismiss();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm rounded-xl border border-[#d4af37]/60 bg-[#18191c] p-5 shadow-2xl text-zinc-100 font-sans"
      >
        {/* Step Indicator Badges */}
        <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
          <span className="font-mono text-[10px] font-bold text-[#d4af37] tracking-widest uppercase">
            Hawa.fm Quick Guide
          </span>
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === step ? 'bg-[#d4af37] w-4' : i < step ? 'bg-zinc-600' : 'bg-zinc-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-3 py-2"
          >
            <div className="w-10 h-10 rounded-lg bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono text-base font-bold text-white">
                {currentStep.title}
              </h3>
              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                {currentStep.desc}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800 mt-2">
          <button
            onClick={onDismiss}
            className="text-xs text-zinc-400 hover:text-white font-mono"
          >
            Skip hint
          </button>
          <button
            onClick={handleNext}
            className="px-4 py-1.5 rounded bg-[#d4af37] hover:bg-[#c49f2b] text-black font-mono text-xs font-bold flex items-center gap-1 shadow"
          >
            <span>{step === steps.length - 1 ? 'Start Tuning' : 'Next'}</span>
            {step === steps.length - 1 ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
