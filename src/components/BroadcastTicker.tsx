import React, { useState } from 'react';
import { Volume2, VolumeX, Mic, MicOff } from 'lucide-react';
import { radioAudio } from '../utils/audio';
import { Language } from '../types';

interface BroadcastTickerProps {
  bulletinText: string;
  language: Language;
  isMuted: boolean;
  onToggleMute: () => void;
  autoAnnounce: boolean;
  onToggleAutoAnnounce: () => void;
}

export const BroadcastTicker: React.FC<BroadcastTickerProps> = ({
  bulletinText,
  language,
  isMuted,
  onToggleMute,
  autoAnnounce,
  onToggleAutoAnnounce
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeakClick = () => {
    if (isSpeaking) {
      radioAudio.stopSpeaking();
      setIsSpeaking(false);
    } else {
      radioAudio.playChime();
      setTimeout(() => {
        setIsSpeaking(true);
        radioAudio.speakBulletin(bulletinText, language, () => {
          setIsSpeaking(false);
        });
      }, 400);
    }
  };

  return (
    <div className="w-full select-none font-sans">
      {/* Radio Broadcast Ticker Panel */}
      <div className="relative rounded-md border border-[#443822] bg-[#121415] p-2 shadow-inner flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          {/* Ticker Header & Live On-Air Pill */}
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[9px] font-mono uppercase font-bold tracking-widest text-[#d4af37]">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
              ON-AIR BULLETIN
            </span>
            <span className="text-[9px] font-mono text-zinc-500 uppercase">
              • {language === 'en' ? 'ENGLISH' : language === 'hi' ? 'HINDI' : 'MARATHI'}
            </span>
          </div>

          {/* Interactive Audio Controls */}
          <div className="flex items-center gap-1.5">
            {/* Auto Announce Toggle */}
            <button
              onClick={onToggleAutoAnnounce}
              className={`px-1.5 py-0.5 rounded text-[9px] font-mono border transition-colors flex items-center gap-1 ${
                autoAnnounce
                  ? 'bg-amber-950/70 text-amber-300 border-amber-500/50'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
              }`}
              title="Toggle automatic speech bulletin on station tune"
              aria-label="Toggle auto announce"
            >
              {autoAnnounce ? <Mic className="w-2.5 h-2.5" /> : <MicOff className="w-2.5 h-2.5" />}
              <span>Auto</span>
            </button>

            {/* Master Mute Button */}
            <button
              onClick={onToggleMute}
              className={`p-1 rounded text-zinc-300 hover:text-white border border-zinc-700/60 transition-colors ${
                isMuted ? 'bg-red-950/60 text-red-400 border-red-800/50' : 'bg-zinc-800'
              }`}
              title={isMuted ? 'Unmute master radio audio' : 'Mute master radio audio'}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            {/* Spoken Voice Bulletin Trigger Button */}
            <button
              onClick={handleSpeakClick}
              disabled={isMuted}
              className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border transition-all flex items-center gap-1 ${
                isSpeaking
                  ? 'bg-amber-400 text-black border-amber-300 shadow-[0_0_8px_#ffb703]'
                  : 'bg-[#d4af37]/20 hover:bg-[#d4af37]/30 text-[#d4af37] border-[#d4af37]/40'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              aria-label="Read bulletin aloud"
            >
              <span>{isSpeaking ? 'Playing...' : 'Broadcast Voice'}</span>
            </button>
          </div>
        </div>

        {/* Scrolling / Animated Caption Marquee Ticker */}
        <div className="relative overflow-hidden rounded bg-black/60 border border-zinc-800/80 px-2.5 py-1.5">
          <div className="font-mono text-[11px] leading-relaxed text-zinc-300 select-text">
            {bulletinText}
          </div>
        </div>
      </div>
    </div>
  );
};
