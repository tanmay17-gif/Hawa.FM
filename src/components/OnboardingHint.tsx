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
      title: '1. Turn the Station Dial',
      desc: 'Rotate the left knob or sweep the frequency dial to pick a Mumbai monitoring station (91.1 to 104.8 FM).',
      icon: Radio,
    },
    {
      title: '2. Scrub Through Time',
      desc: 'Turn the right knob backwards in time to watch the painted skyline react to historical pollution events.',
      icon: Clock,
    },
    {
      title: '3. Press the Listen Button',
      desc: 'Hear a natural spoken radio bulletin in English, Hindi, or Marathi based strictly on verified sensor readings.',
      icon: Volume2,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 font-body">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm rounded-2xl border-2 border-[#CBBCA3] bg-[#FAF6EE] p-5 shadow-2xl text-[#2B2A33]"
      >
        {/* Step Indicator Badges */}
        <div className="flex items-center justify-between mb-3 border-b border-[#E2D5BE] pb-2">
          <span className="font-wordmark text-xs font-bold text-[#C8553D] tracking-wide">
            Hawa.fm Quick Guide
          </span>
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i === step ? 'bg-[#C8553D] w-4' : 'bg-[#D5C7B0] w-2'
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
            <div className="w-10 h-10 rounded-xl bg-[#FFF2ED] border border-[#FFCCBC] flex items-center justify-center text-[#C8553D]">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-wordmark text-base font-bold text-[#2B2A33]">
                {currentStep.title}
              </h3>
              <p className="text-xs text-[#5A5766] mt-1 leading-relaxed">
                {currentStep.desc}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-[#E2D5BE] mt-2">
          <button
            onClick={onDismiss}
            className="text-xs text-[#7A7885] hover:text-[#2B2A33] font-medium"
          >
            Skip guide
          </button>
          <button
            onClick={handleNext}
            className="px-4 py-1.5 rounded-xl bg-[#C8553D] hover:bg-[#B3452E] text-white font-bold text-xs flex items-center gap-1 shadow-xs"
          >
            <span>{step === steps.length - 1 ? 'Start Tuning' : 'Next'}</span>
            {step === steps.length - 1 ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
