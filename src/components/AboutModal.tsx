import React from 'react';
import { X, ShieldCheck, Database, Award, Heart } from 'lucide-react';

interface AboutModalProps {
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto font-sans">
      <div className="relative w-full max-w-lg bg-[#181a1e] text-zinc-100 rounded-xl shadow-2xl p-6 border border-zinc-700 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-white"
          aria-label="Close about modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="border-b border-zinc-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xl font-bold tracking-tight text-white">
              Hawa.fm
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#d4af37]/20 text-[#d4af37] border border-[#d4af37]/40">
              v1.0 • Google Mumbai Data Challenge
            </span>
          </div>
          <p className="text-xs text-[#d4af37] font-mono mt-0.5">
            Tune in to Mumbai&apos;s air
          </p>
        </div>

        <div className="space-y-4 text-xs leading-relaxed text-zinc-300">
          <div>
            <h4 className="font-mono text-xs font-bold text-white uppercase mb-1 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#d4af37]" />
              Concept & Philosophy
            </h4>
            <p>
              Hawa.fm transforms cold environmental data tables into a tactile, nostalgic FM radio.
              Instead of navigating overwhelming dashboards, citizens turn tactile frequency knobs to tune between stations,
              travel through time, watch an animated Mumbai skyline react continuously to PM2.5 levels, and hear short natural bulletins in
              English, Hindi, and Marathi.
            </p>
          </div>

          <div>
            <h4 className="font-mono text-xs font-bold text-white uppercase mb-1 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-400" />
              Data Provenance & Pipeline
            </h4>
            <p>
              Built strictly from the official <strong>Google Mumbai Data Challenge (Zindi)</strong> and ClimateVerse datasets.
              Data covers 4 primary continuous OpenAQ/CPCB stations (Borivali East, Malad West, Shivaji Nagar, Byculla)
              comprising over 48,000 hourly observations from February 2025 through November 2026.
              All statistical baselines (diurnal median, IQR, MAD), sustained anomaly episodes, and Air Magnitude Index scores
              are precomputed offline with Python.
            </p>
          </div>

          <div className="p-3 rounded-md bg-amber-950/30 border border-amber-800/60">
            <h4 className="font-mono text-xs font-bold text-amber-300 uppercase mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Scientific Honesty Rules (Non-Negotiable)
            </h4>
            <ul className="space-y-1 list-disc list-inside text-zinc-300 text-[11px]">
              <li><strong>Zero Synthetic Readings:</strong> Every single number on screen originates directly from sensor measurements.</li>
              <li><strong>No Source Attribution:</strong> Statistical spikes are flagged as &ldquo;unusual rise, worth investigating&rdquo;, never speculative causes.</li>
              <li><strong>Strict Signal Integrity:</strong> Missing sensor hours are shown as radio static and a &ldquo;NO SIGNAL&rdquo; state, never interpolated silently.</li>
              <li><strong>No Hallucinated Predictions:</strong> Only MEASURED and historical REPLAY modes exist; forecasting was not fabricated.</li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-xs font-bold text-white uppercase mb-1 flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-400" />
              Open Source & Stack
            </h4>
            <p>
              React, Vite, TypeScript, Framer Motion, HTML5 Canvas, Web Audio API, Web Speech API, Lucide Icons.
              Zero runtime paid APIs or LLMs. Deployable as a 100% static site on Netlify or GitHub Pages.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
