import React from 'react';
import { Volume2, VolumeX, SlidersHorizontal, AlertCircle, RefreshCw } from 'lucide-react';
import { Language } from '../types';
import { AudioSourceType } from '../utils/audio';

interface BroadcastTickerProps {
  bulletinText: string;
  language: Language;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenVoiceSettings: () => void;
  isSpeaking: boolean;
  isLoadingVoice: boolean;
  voiceError: string | null;
  onTriggerListen: () => void;
  activeSource: AudioSourceType;
}

export const BroadcastTicker: React.FC<BroadcastTickerProps> = ({
  bulletinText,
  language,
  isMuted,
  onToggleMute,
  onOpenVoiceSettings,
  isSpeaking,
  isLoadingVoice,
  voiceError,
  onTriggerListen
}) => {
  return (
    <div className="w-full select-none font-body">
      {/* Radio Broadcast Ticker Panel in Warm Cream Paper & Sandalwood Styling */}
      <div className="relative rounded-xl border border-[#CBBCA3] bg-[#FCF9F3] p-3 shadow-xs flex flex-col gap-2">
        <div className="flex items-center justify-between">
          {/* On-Air Pill */}
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-[#C8553D]">
              <span className={`w-2 h-2 rounded-full bg-[#C8553D] inline-block ${isSpeaking ? 'animate-ping' : ''}`} />
              AIR BULLETIN
            </span>
            <span className="text-[10px] text-[#7A7885] font-medium uppercase">
              • {language === 'en' ? 'ENGLISH' : language === 'hi' ? 'HINDI' : 'MARATHI'}
            </span>
          </div>

          {/* Quick Settings & Mute Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenVoiceSettings}
              className="p-1.5 rounded-lg text-[#5A5766] hover:text-[#2B2A33] hover:bg-[#EFE4CF] transition-colors"
              title="Voice & Language Settings"
              aria-label="Voice Settings"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onToggleMute}
              className={`p-1.5 rounded-lg border transition-colors ${
                isMuted
                  ? 'bg-[#FBE9E7] text-[#C8553D] border-[#FFCCBC]'
                  : 'bg-[#EFE4CF] text-[#2B2A33] border-[#D5C7B0] hover:bg-[#E6D9C0]'
              }`}
              title={isMuted ? 'Unmute radio audio' : 'Mute radio audio'}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* ONE LARGE OBVIOUS PHYSICAL "LISTEN" PUSH BUTTON */}
        <div className="flex items-center gap-3">
          <button
            onClick={onTriggerListen}
            disabled={isLoadingVoice}
            className={`flex-1 py-2.5 px-4 rounded-xl font-wordmark text-sm font-bold flex items-center justify-center gap-2.5 shadow-sm transition-all active:scale-[0.98] ${
              isSpeaking
                ? 'bg-[#C8553D] text-white shadow-md ring-2 ring-[#C8553D]/40'
                : isLoadingVoice
                ? 'bg-[#EFE4CF] text-[#7A7885] cursor-wait'
                : 'bg-gradient-to-b from-[#FFFBF5] to-[#EFE4CF] text-[#2B2A33] border border-[#CBBCA3] hover:from-white hover:to-[#F4EBD7]'
            }`}
            aria-label="Listen to spoken radio broadcast"
          >
            {isLoadingVoice ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#C8553D]" />
                <span>Tuning the announcer...</span>
              </>
            ) : isSpeaking ? (
              <>
                {/* Animated Sound Wave Bars */}
                <div className="flex items-center gap-0.5 h-4">
                  <span className="w-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="w-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
                </div>
                <span>Broadcasting Live...</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-[#C8553D]" />
                <span>Listen to Broadcast</span>
              </>
            )}
          </button>
        </div>

        {/* Friendly Error Banner with Retry */}
        {voiceError && (
          <div className="flex items-center justify-between p-2 rounded-lg bg-[#FFF2ED] border border-[#FFCCBC] text-[#9E3C25] text-[11px]">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{voiceError}</span>
            </div>
            <button
              onClick={onTriggerListen}
              className="px-2 py-0.5 rounded bg-[#C8553D] text-white font-bold text-[10px] hover:bg-[#B3452E]"
            >
              Retry
            </button>
          </div>
        )}

        {/* Letterpress Paper Caption Marquee Ticker (ALWAYS visible) */}
        <div className="relative overflow-hidden rounded-lg bg-[#EFE4CF]/80 border border-[#D5C7B0] p-2.5 shadow-inner">
          <p className="font-body text-xs leading-relaxed text-[#2B2A33] select-text">
            {bulletinText}
          </p>
        </div>
      </div>
    </div>
  );
};
