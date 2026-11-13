import React from 'react';
import { X, ShieldCheck, Database, Award, Sparkles, Heart } from 'lucide-react';

interface AboutModalProps {
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto font-body">
      <div className="relative w-full max-w-lg bg-[#FAF6EE] text-[#2B2A33] rounded-2xl shadow-2xl p-6 border-2 border-[#D5C7B0] max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#5A5766] hover:text-black hover:bg-[#EFE4CF]"
          aria-label="Close about modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="border-b-2 border-[#D5C7B0] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="font-wordmark text-2xl font-bold tracking-tight text-[#2B2A33]">
              Hawa.fm
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#EFE4CF] text-[#C8553D] border border-[#D5C7B0]">
              Google Mumbai Data Challenge
            </span>
          </div>
          <p className="text-xs text-[#8C7428] font-bold mt-0.5">
            Tune in to Mumbai&apos;s air
          </p>
        </div>

        <div className="space-y-4 text-xs leading-relaxed text-[#2B2A33]">
          <div>
            <h4 className="font-wordmark text-xs font-bold text-[#2B2A33] uppercase mb-1 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#C8553D]" />
              Concept &amp; Philosophy
            </h4>
            <p>
              Hawa.fm transforms raw environmental data into a tactile tabletop FM radio and painted Mumbai postcard.
              Citizens turn rotary knobs to tune between stations, travel backwards in time, watch an animated Mumbai skyline react continuously to PM2.5 levels, and hear natural radio bulletins in English, Hindi, and Marathi.
            </p>
          </div>

          <div>
            <h4 className="font-wordmark text-xs font-bold text-[#2B2A33] uppercase mb-1 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-[#2F7F86]" />
              Data Provenance &amp; Pipeline
            </h4>
            <p>
              Built strictly from the official <strong>Google Mumbai Data Challenge (Zindi)</strong> and ClimateVerse datasets.
              Data covers 4 continuous OpenAQ/CPCB stations (Borivali East, Malad West, Shivaji Nagar, Byculla)
              comprising 48,400 hourly observations from February 2025 to November 2026.
              All statistical baselines (usual hour-by-hour median, IQR, MAD), sustained anomaly episodes, and Air Magnitude Index scores
              are precomputed offline with Python.
            </p>
          </div>

          {/* Non-Negotiable Honesty Rules */}
          <div className="p-3.5 rounded-xl bg-[#FFF2ED] border-2 border-[#FFCCBC]">
            <h4 className="font-wordmark text-xs font-bold text-[#C8553D] uppercase mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#C8553D]" />
              Scientific Honesty Rules (Non-Negotiable)
            </h4>
            <ul className="space-y-1 list-disc list-inside text-[#2B2A33] text-[11px]">
              <li><strong>Zero Synthetic Readings:</strong> Every single number on screen originates directly from real sensor measurements.</li>
              <li><strong>No Source Attribution:</strong> Statistical spikes are described as &ldquo;unusual rise, worth investigating&rdquo;, never speculative causes.</li>
              <li><strong>Strict Signal Integrity:</strong> Missing sensor hours are shown as radio static and a &ldquo;NO SIGNAL&rdquo; state, never interpolated silently.</li>
              <li><strong>No Hallucinated Predictions:</strong> Only MEASURED and historical REPLAY modes exist; forecasting was not fabricated.</li>
            </ul>
          </div>

          {/* Voice & AI Disclosure (Phase 4 requirement) */}
          <div className="p-3 rounded-xl bg-[#EFE4CF] border border-[#D5C7B0]">
            <h4 className="font-wordmark text-xs font-bold text-[#2B2A33] uppercase mb-1 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#B38638]" />
              Voice Generation &amp; Language Transparency
            </h4>
            <p className="text-[11px] text-[#4A4854]">
              Voices are AI-generated or system-synthesised. The words are written from verified measurements by fixed sentence templates (no runtime LLM calls).
              Hindi and Marathi templates were drafted with Google Gemini and are marked as <em>needs native-speaker review</em>.
            </p>
          </div>

          <div>
            <h4 className="font-wordmark text-xs font-bold text-[#2B2A33] uppercase mb-1 flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-[#C8553D]" />
              Open Source &amp; Stack
            </h4>
            <p>
              React, Vite, TypeScript, Framer Motion, HTML5 Canvas, Web Audio API, Web Speech API, Lucide Icons.
              Zero paid APIs or tracking cookies. Deployable statically on Netlify, GitHub Pages, or Firebase.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-[#C8553D] hover:bg-[#B3452E] text-white font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
