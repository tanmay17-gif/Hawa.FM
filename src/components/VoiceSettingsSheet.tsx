import React from 'react';
import { X, Volume2, Mic, Sparkles, Check } from 'lucide-react';
import { Language } from '../types';
import { AudioSourceType } from '../utils/audio';

interface VoiceSettingsSheetProps {
  language: Language;
  onSelectLanguage: (lang: Language) => void;
  speed: number;
  onSelectSpeed: (speed: number) => void;
  autoAnnounce: boolean;
  onToggleAutoAnnounce: () => void;
  activeSource: AudioSourceType;
  onClose: () => void;
}

export const VoiceSettingsSheet: React.FC<VoiceSettingsSheetProps> = ({
  language,
  onSelectLanguage,
  speed,
  onSelectSpeed,
  autoAnnounce,
  onToggleAutoAnnounce,
  activeSource,
  onClose
}) => {
  const sourceLabels: Record<AudioSourceType, { title: string; desc: string }> = {
    gemini: {
      title: 'Gemini Neural Audio (Active)',
      desc: 'High-fidelity natural broadcast voice proxy with offline caching.'
    },
    browser: {
      title: 'Device Speech Engine (Active)',
      desc: 'System speech synthesiser on this device.'
    },
    captions: {
      title: 'On-Screen Captions Only',
      desc: 'Device audio muted or voice synthesiser unavailable.'
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-3 font-body">
      <div className="relative w-full max-w-sm rounded-2xl bg-[#F6EFE2] text-[#2B2A33] border-2 border-[#CBBCA3] shadow-2xl p-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2D5BE]">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-[#C8553D]" />
            <h3 className="font-wordmark text-base font-bold text-[#2B2A33]">
              Voice & Broadcast Settings
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#5A5766] hover:text-black hover:bg-[#EAE0CD]"
            aria-label="Close voice settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 pt-3 text-xs">
          {/* Active Audio Source Status Line */}
          <div className="p-2.5 rounded-lg bg-[#EFE4CF] border border-[#D5C7B0] flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-[#B38638] shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-[#2B2A33]">
                {sourceLabels[activeSource].title}
              </div>
              <div className="text-[11px] text-[#5A5766] mt-0.5">
                {sourceLabels[activeSource].desc}
              </div>
            </div>
          </div>

          {/* Language Selection */}
          <div>
            <label className="block text-[11px] font-bold text-[#5A5766] uppercase mb-1.5">
              Broadcast Language
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'en', label: 'English' },
                { id: 'hi', label: 'हिन्दी' },
                { id: 'mr', label: 'मराठी' }
              ].map(item => (
                <button
                  key={item.id}
                  onClick={() => onSelectLanguage(item.id as Language)}
                  className={`py-1.5 px-2 rounded-lg border font-bold text-xs flex items-center justify-center gap-1 transition-all ${
                    language === item.id
                      ? 'bg-[#C8553D] text-white border-[#B3452E] shadow-xs'
                      : 'bg-[#FCF9F3] text-[#2B2A33] border-[#D5C7B0] hover:bg-[#EFE4CF]'
                  }`}
                >
                  {language === item.id && <Check className="w-3 h-3" />}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reading Speed */}
          <div>
            <div className="flex justify-between text-[11px] font-bold text-[#5A5766] mb-1">
              <span>Announcer Cadence</span>
              <span>{speed.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.2"
              step="0.05"
              value={speed}
              onChange={e => onSelectSpeed(parseFloat(e.target.value))}
              className="w-full accent-[#C8553D] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#7A7885] mt-0.5">
              <span>Warm &amp; Measured</span>
              <span>Brisk</span>
            </div>
          </div>

          {/* Auto-announce toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-[#E2D5BE]">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-[#C8553D]" />
              <div>
                <div className="font-bold text-[#2B2A33] text-xs">Auto-Announce on Tune</div>
                <div className="text-[10px] text-[#7A7885]">Read bulletin aloud when station changes</div>
              </div>
            </div>
            <button
              onClick={onToggleAutoAnnounce}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                autoAnnounce ? 'bg-[#C8553D]' : 'bg-[#D5C7B0]'
              }`}
              aria-label="Toggle auto announce"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                  autoAnnounce ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="text-[10px] text-[#7A7885] italic pt-1">
            * Voices are AI-generated or system-synthesised. Words are strictly compiled from verified sensor measurements using fixed templates.
          </div>
        </div>
      </div>
    </div>
  );
};

