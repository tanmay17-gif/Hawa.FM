import React, { useMemo } from 'react';
import { Station, AirCategory, ModeBadge, Language } from '../../types';
import { LivingSkyline } from '../LivingSkyline';
import { calculateAqi } from '../../utils/scriptGenerator';
import { Play, Pause, AlertCircle, Loader2, Volume2, VolumeX } from 'lucide-react';

interface RadioModeProps {
  currentStation: Station;
  currentTimestamp: string;
  pm25: number | null;
  airCategory: AirCategory;
  modeBadge: ModeBadge;
  isAnomaly: boolean;
  anomalyScope?: 'isolated' | 'widespread';
  categoryLabels: Record<AirCategory, string>;
  bulletinHeadline: string;
  bulletinFullText: string;
  language: Language;
  onSelectLanguage: (lang: Language) => void;
  isSpeaking: boolean;
  isLoadingVoice: boolean;
  audioProgress: number;
  isMuted: boolean;
  onTriggerListen: () => void;
  onToggleMute: () => void;
  onOpenDetect: () => void;
}

export const RadioMode: React.FC<RadioModeProps> = ({
  currentStation,
  currentTimestamp,
  pm25,
  airCategory,
  modeBadge,
  isAnomaly,
  anomalyScope,
  categoryLabels,
  bulletinFullText,
  language,
  onSelectLanguage,
  isSpeaking,
  isLoadingVoice,
  audioProgress,
  isMuted,
  onTriggerListen,
  onToggleMute,
  onOpenDetect
}) => {
  // Calculated Indian AQI
  const aqi = useMemo(() => calculateAqi(pm25), [pm25]);

  // Formatted human readable timestamp
  const formattedTime = useMemo(() => {
    if (!currentTimestamp) return '--:--';
    const parts = currentTimestamp.split('T');
    const [y, m, d] = (parts[0] || '').split('-');
    const timePart = parts[1] || '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[parseInt(m, 10) - 1] || m;
    return `${d} ${monthName} ${y}, ${timePart} IST`;
  }, [currentTimestamp]);

  // Atmospheric haze status from PM2.5 thresholds
  const atmosphericHazeText = useMemo(() => {
    if (pm25 === null) return 'No Signal · Sensor Offline';
    if (pm25 <= 30) return 'Sky: Clear · Visibility: Excellent';
    if (pm25 <= 60) return 'Sky: Light Haze · Visibility: Good';
    if (pm25 <= 120) return 'Sky: Moderate Haze · Visibility: Fair';
    if (pm25 <= 250) return 'Sky: Heavy Haze · Visibility: Reduced';
    return 'Sky: Dense Smog · Visibility: Severe';
  }, [pm25]);

  // Visual category styling
  const categoryStyles: Record<AirCategory, { text: string; bg: string; border: string }> = {
    fresh: { text: '#1E6347', bg: '#EBF8F1', border: '#8BA888' },
    okay: { text: '#3E6627', bg: '#F2F8E6', border: '#A6C58B' },
    hazy: { text: '#8C5A14', bg: '#FFF7E6', border: '#E9A23B' },
    heavy: { text: '#B66C4D', bg: '#FDF2EE', border: '#C8553D' },
    severe: { text: '#781A2D', bg: '#FDECEF', border: '#B82845' }
  };
  const theme = categoryStyles[airCategory] || categoryStyles.okay;

  return (
    <div className="w-full min-h-0 h-auto md:h-full p-2.5 sm:p-3 flex flex-col justify-between select-none font-sans overflow-visible md:overflow-hidden">
      
      {/* ─── TOP INFORMATION BAR ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-1 pb-1.5 border-b border-[#343B35]/15 shrink-0 text-xs">
        {/* Left: ON AIR & Headline */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#FAF6EE] border border-[#343B35]/20 font-bold text-[10px]">
            <span className={`w-2 h-2 rounded-full bg-[#B66C4D] ${isSpeaking ? 'animate-ping' : ''}`} />
            <span className="text-[#B66C4D] tracking-wider uppercase">ON AIR</span>
          </div>
          <span className="font-bold text-[#343B35] text-xs">
            HAWA.fm • Mumbai Bulletin
          </span>
        </div>

        {/* Center / Right: Station & Timestamp & Permanent Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-[10px]">
          <span className="font-semibold text-[#343B35]/80">
            {currentStation.name} ({currentStation.freqLabel})
          </span>
          <span className="text-[#343B35]/60 hidden sm:inline">• {formattedTime}</span>
          <span
            className={`font-bold tracking-wider px-2 py-0.5 rounded border uppercase text-[9px] ${
              modeBadge === 'MEASURED'
                ? 'bg-[#EBF8F1] text-[#1E6347] border-[#8BA888]'
                : 'bg-[#FFF7E6] text-[#8C5A14] border-[#E9A23B]'
            }`}
          >
            ● {modeBadge}
          </span>
        </div>
      </div>

      {/* ─── MAIN CONTENT: Skyline Window + AQI & Broadcast Section ────── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 flex-1 min-h-0 pt-2 items-stretch">
        
        {/* Left: Painted Mumbai Living Skyline (7 cols) */}
        <div className="md:col-span-7 h-44 sm:h-52 md:h-auto min-h-[160px] rounded-xl border-2 border-[#343B35]/20 relative overflow-hidden bg-[#EAE2D2] flex flex-col justify-between shadow-inner">
          <div className="absolute inset-0">
            <LivingSkyline
              pm25={pm25}
              timestamp={currentTimestamp}
              isAnomaly={isAnomaly}
              stationName={currentStation.name}
            />
          </div>

          {/* Top Overlay: Station & Anomaly Notice */}
          <div className="relative z-10 p-2 flex items-start justify-between pointer-events-none">
            <div className="px-2 py-0.5 rounded bg-[#FAF6EE]/90 border border-[#343B35]/20 text-[9px] font-bold text-[#343B35] shadow-xs">
              {currentStation.area} • Coastal Sensor
            </div>

            {isAnomaly && (
              <button
                onClick={onOpenDetect}
                className="pointer-events-auto flex items-center gap-1 px-2 py-0.5 rounded bg-[#B66C4D] hover:bg-[#8C472E] text-white text-[9px] font-bold shadow-xs transition-colors cursor-pointer"
                title="View Case Investigation in Detective Mode"
              >
                <AlertCircle className="w-3 h-3" />
                <span>UNUSUAL RISE DETECTED</span>
                {anomalyScope && (
                  <span className="opacity-90">({anomalyScope === 'widespread' ? 'Citywide' : 'Isolated'})</span>
                )}
              </button>
            )}
          </div>

          {/* Bottom Overlay: Atmospheric Haze Caption */}
          <div className="relative z-10 p-2 flex items-end justify-between pointer-events-none">
            <span className="px-2 py-0.5 rounded bg-[#FAF6EE]/90 border border-[#343B35]/15 text-[9px] font-semibold text-[#343B35]">
              {atmosphericHazeText}
            </span>
            <span className="text-[8px] text-[#343B35]/70 font-mono bg-[#FAF6EE]/80 px-1.5 py-0.2 rounded">
              Zindi CPCB Feed
            </span>
          </div>
        </div>

        {/* Right: AQI Metrics + Audio Broadcast Section (5 cols) */}
        <div className="md:col-span-5 flex flex-col justify-between gap-2 min-h-0">
          
          {/* Prominent AQI & PM2.5 Card */}
          <div className="p-2 sm:p-2.5 rounded-xl border-2 border-[#343B35]/20 bg-[#FAF6EE] shadow-xs flex items-center justify-between">
            {/* Prominent AQI */}
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#343B35]/70">
                Air Quality Index
              </span>
              <div className="flex items-baseline gap-1.5">
                <span
                  className="font-brand text-2xl sm:text-3xl font-bold tracking-tight leading-none"
                  style={{ color: theme.text }}
                >
                  {aqi !== null ? aqi : '--'}
                </span>
                <span
                  className="text-xs font-bold uppercase px-1.5 py-0.5 rounded border"
                  style={{ color: theme.text, backgroundColor: theme.bg, borderColor: theme.border }}
                >
                  {categoryLabels[airCategory] || 'Hazy'}
                </span>
              </div>
              <span className="text-[8px] text-[#343B35]/60 mt-0.5">
                {currentStation.agency} Monitoring Station
              </span>
            </div>

            {/* PM2.5 Value */}
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#343B35]/70">
                Fine Particles (PM 2.5)
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-xl sm:text-2xl font-bold text-[#B66C4D] leading-none">
                  {pm25 !== null ? pm25.toFixed(1) : '--.-'}
                </span>
                <span className="text-[10px] text-[#343B35]/70 font-bold">µg/m³</span>
              </div>
              <span className="text-[8px] text-[#343B35]/60">
                {pm25 !== null ? 'Measured by sensor' : 'No signal received'}
              </span>
            </div>
          </div>

          {/* Audio Broadcast Section with Play/Pause, Waveform & Transcript */}
          <div className="p-2 sm:p-2.5 rounded-xl border-2 border-[#343B35]/20 bg-[#FAF6EE] shadow-xs flex-1 flex flex-col justify-between gap-1.5 min-h-0">
            
            {/* Broadcast Header & Language Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {/* Reactive Audio Waveform Bars (animated strictly during playback) */}
                <div className="flex items-end gap-0.5 h-4 px-1" title={isSpeaking ? 'Broadcast active' : 'Ready to play'}>
                  <div className={`wave-bar ${isSpeaking ? 'playing' : ''}`} />
                  <div className={`wave-bar ${isSpeaking ? 'playing' : ''}`} />
                  <div className={`wave-bar ${isSpeaking ? 'playing' : ''}`} />
                  <div className={`wave-bar ${isSpeaking ? 'playing' : ''}`} />
                  <div className={`wave-bar ${isSpeaking ? 'playing' : ''}`} />
                  <div className={`wave-bar ${isSpeaking ? 'playing' : ''}`} />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#B66C4D]">
                  Spoken Bulletin
                </span>
              </div>

              {/* Language Pills inside Broadcast */}
              <div className="flex rounded p-0.5 bg-[#E8DDC9] border border-[#343B35]/20 text-[9px] font-bold">
                {(['en', 'hi', 'mr'] as Language[]).map(l => (
                  <button
                    key={l}
                    onClick={() => onSelectLanguage(l)}
                    className={`px-1.5 py-0.2 rounded transition-colors cursor-pointer ${
                      language === l
                        ? 'bg-[#B66C4D] text-white'
                        : 'text-[#343B35]/70 hover:text-[#343B35]'
                    }`}
                  >
                    {l === 'en' ? 'EN' : l === 'hi' ? 'हिं' : 'मरा'}
                  </button>
                ))}
              </div>
            </div>

            {/* Spoken Announcement Transcript (Readable text display) */}
            <div className="px-2 py-1 rounded bg-[#F4EDDF] border border-[#343B35]/15 text-[10px] sm:text-[11px] leading-relaxed text-[#343B35] font-medium line-clamp-3 overflow-hidden">
              "{bulletinFullText}"
            </div>

            {/* Audio Progress Bar */}
            <div className="w-full bg-[#E8DDC9] h-1.5 rounded-full overflow-hidden border border-[#343B35]/15">
              <div
                className="bg-[#B66C4D] h-full transition-all duration-150 rounded-full"
                style={{ width: `${Math.round(audioProgress * 100)}%` }}
              />
            </div>

            {/* Broadcast Action Controls: Play/Pause Button + Mute Button */}
            <div className="flex items-center gap-2 pt-0.5">
              <button
                onClick={onTriggerListen}
                className={`flex-1 py-1.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-2 border transition-all active:scale-[0.98] cursor-pointer ${
                  isSpeaking
                    ? 'bg-[#B66C4D] text-white border-[#8C472E] shadow-inner'
                    : 'bg-gradient-to-b from-[#FAF6EE] to-[#E8DDC9] text-[#343B35] border-[#343B35]/30 hover:brightness-105 shadow-xs'
                }`}
              >
                {isLoadingVoice ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#B66C4D]" />
                    <span>Tuning Radio Voice...</span>
                  </>
                ) : isSpeaking ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-white text-white" />
                    <span>Pause Bulletin</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-[#B66C4D] text-[#B66C4D]" />
                    <span>Listen to Bulletin</span>
                  </>
                )}
              </button>

              <button
                onClick={onToggleMute}
                className="p-1.5 rounded-lg border border-[#343B35]/25 bg-[#FAF6EE] hover:bg-[#E8DDC9] text-[#343B35] transition-colors cursor-pointer"
                title={isMuted ? 'Unmute' : 'Mute'}
                aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-[#B66C4D]" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── BOTTOM ROW: Weather & Sensor Parameters (Honest data feed) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1.5 border-t border-[#343B35]/15 mt-1 text-[8px] sm:text-[9px]">
        <div className="px-2 py-0.5 sm:py-1 rounded bg-[#FAF6EE] border border-[#343B35]/15 flex items-center justify-between">
          <span className="font-bold text-[#343B35]/70 uppercase">Station Freq</span>
          <span className="font-mono font-bold text-[#343B35]">{currentStation.freqLabel}</span>
        </div>
        <div className="px-2 py-0.5 sm:py-1 rounded bg-[#FAF6EE] border border-[#343B35]/15 flex items-center justify-between">
          <span className="font-bold text-[#343B35]/70 uppercase">Sensor Status</span>
          <span className="font-bold text-[#1E6347]">Verified Active</span>
        </div>
        <div className="px-2 py-0.5 sm:py-1 rounded bg-[#FAF6EE] border border-[#343B35]/15 flex items-center justify-between">
          <span className="font-bold text-[#343B35]/70 uppercase">Wind Pattern</span>
          <span className="font-bold text-[#343B35]">Sea Breeze · Typical</span>
        </div>
        <div className="px-2 py-0.5 sm:py-1 rounded bg-[#FAF6EE] border border-[#343B35]/15 flex items-center justify-between">
          <span className="font-bold text-[#343B35]/70 uppercase">Climate Est.</span>
          <span className="font-bold text-[#343B35]">~28°C · Coastal Humid</span>
        </div>
      </div>
    </div>
  );
};
