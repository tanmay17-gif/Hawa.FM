import React, { useMemo } from 'react';
import { Station, PresetMoment, TimelineData, AirCategory } from '../../types';
import { LivingSkyline } from '../LivingSkyline';
import { calculateAqi } from '../../utils/scriptGenerator';
import { Play, Pause, ChevronLeft, ChevronRight, Radio, Sparkles, RotateCcw } from 'lucide-react';

interface ReplayModeProps {
  currentStation: Station;
  currentTimestamp: string;
  pm25: number | null;
  airCategory: AirCategory;
  categoryLabels: Record<AirCategory, string>;
  timeline: TimelineData;
  timeIndex: number;
  isPlaying: boolean;
  presets: PresetMoment[];
  onTogglePlay: () => void;
  onTimeChange: (newIndex: number) => void;
  onSelectPreset: (preset: PresetMoment) => void;
  onJumpToLatest: () => void;
  onReturnToRadio: () => void;
}

export const ReplayMode: React.FC<ReplayModeProps> = ({
  currentStation,
  currentTimestamp,
  pm25,
  airCategory,
  categoryLabels,
  timeline,
  timeIndex,
  isPlaying,
  presets,
  onTogglePlay,
  onTimeChange,
  onSelectPreset,
  onJumpToLatest,
  onReturnToRadio
}) => {
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

  const maxIndex = timeline.total_hours - 1;

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
      
      {/* ─── TOP SECTION: Header & Return to Radio Button ───────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 pb-1.5 border-b border-[#343B35]/15 shrink-0 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#FAF6EE] border border-[#343B35]/20 font-bold text-[10px]">
            <span className="w-2 h-2 rounded-full bg-[#B66C4D]" />
            <span className="text-[#343B35] uppercase">EVENT REPLAY EXPLORER</span>
          </div>
          <span className="text-[10px] text-[#343B35]/80 font-medium hidden sm:inline">
            Chronological Atmospheric Time Machine
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onJumpToLatest}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#FAF6EE] hover:bg-[#E8DDC9] border border-[#343B35]/25 text-[#343B35] text-[10px] font-bold transition-colors cursor-pointer"
            title="Jump to latest measured observation"
          >
            <RotateCcw className="w-3 h-3 text-[#B66C4D]" />
            <span>Latest Feed</span>
          </button>

          <button
            onClick={onReturnToRadio}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#B66C4D] hover:bg-[#8C472E] text-white text-[10px] font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Radio className="w-3 h-3" />
            <span>Return to Radio</span>
          </button>
        </div>
      </div>

      {/* ─── MAIN CONTENT: Full Skyline + Real-Time Sync Overlays ───────── */}
      <div className="relative flex-1 min-h-[160px] sm:min-h-[180px] rounded-xl border-2 border-[#343B35]/20 my-2 overflow-hidden bg-[#EAE2D2] shadow-inner">
        <LivingSkyline
          pm25={pm25}
          timestamp={currentTimestamp}
          isAnomaly={false}
          stationName={currentStation.name}
        />

        {/* Real-time Atmospheric Replay Overlay */}
        <div className="absolute top-2.5 inset-x-3 flex items-start justify-between pointer-events-none z-10">
          <div className="px-2.5 py-1 rounded-lg bg-[#FAF6EE]/92 border border-[#343B35]/20 shadow-xs backdrop-blur-xs flex flex-col">
            <span className="text-[9px] uppercase font-bold text-[#343B35]/70">
              {currentStation.name} • {currentStation.freqLabel}
            </span>
            <span className="font-brand text-xs sm:text-sm font-bold text-[#343B35]">
              {formattedTime}
            </span>
          </div>

          <div className="px-3 py-1 rounded-lg bg-[#FAF6EE]/92 border border-[#343B35]/20 shadow-xs backdrop-blur-xs flex items-baseline gap-2">
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-bold uppercase text-[#343B35]/70">AQI</span>
              <span className="font-brand text-lg font-bold" style={{ color: theme.text }}>
                {aqi !== null ? aqi : '--'}
              </span>
            </div>
            <div className="h-6 w-px bg-[#343B35]/20 mx-1" />
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-bold uppercase text-[#343B35]/70">PM 2.5</span>
              <div className="flex items-baseline gap-0.5">
                <span className="font-mono text-base font-bold text-[#B66C4D]">
                  {pm25 !== null ? pm25.toFixed(1) : 'NO SIGNAL'}
                </span>
                {pm25 !== null && <span className="text-[8px] text-[#343B35]/70 font-bold">µg/m³</span>}
              </div>
            </div>
            <span
              className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ml-1"
              style={{ color: theme.text, backgroundColor: theme.bg, borderColor: theme.border }}
            >
              {categoryLabels[airCategory] || 'Hazy'}
            </span>
          </div>
        </div>

        {/* Bottom Skyline Mode Marker */}
        <div className="absolute bottom-2 inset-x-3 flex items-center justify-between pointer-events-none z-10 text-[9px]">
          <span className="px-2 py-0.5 rounded bg-[#FAF6EE]/90 border border-[#343B35]/15 font-bold text-[#8C5A14]">
            ● REPLAY MODE • Historical Observation
          </span>
          <span className="px-2 py-0.5 rounded bg-[#FAF6EE]/90 border border-[#343B35]/15 text-[#343B35]">
            Hour Index: {timeIndex + 1} of {timeline.total_hours}
          </span>
        </div>
      </div>

      {/* ─── BOTTOM CONTROLS: Interactive Timeline, Step Buttons & Presets ─ */}
      <div className="flex flex-col gap-2 pt-1 border-t border-[#343B35]/15 shrink-0">
        
        {/* Scrubber Controls with Step Buttons */}
        <div className="flex items-center gap-2">
          {/* Play / Pause Button */}
          <button
            onClick={onTogglePlay}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 border transition-all cursor-pointer ${
              isPlaying
                ? 'bg-[#B66C4D] text-white border-[#8C472E] shadow-inner'
                : 'bg-[#FAF6EE] text-[#343B35] border-[#343B35]/25 hover:bg-[#E8DDC9]'
            }`}
            aria-label={isPlaying ? 'Pause replay' : 'Play timeline replay'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white text-white" /> : <Play className="w-3.5 h-3.5 fill-[#B66C4D] text-[#B66C4D]" />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          {/* Step Backward (-1h) */}
          <button
            onClick={() => onTimeChange(Math.max(0, timeIndex - 1))}
            className="p-1.5 rounded-lg bg-[#FAF6EE] hover:bg-[#E8DDC9] border border-[#343B35]/25 text-[#343B35] transition-colors cursor-pointer"
            title="Step back 1 hour"
            aria-label="Previous hour"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Interactive Timeline Scrubber Slider */}
          <input
            type="range"
            min={0}
            max={maxIndex}
            value={timeIndex}
            onChange={(e) => onTimeChange(parseInt(e.target.value, 10))}
            className="flex-1 accent-[#B66C4D] cursor-pointer h-2 bg-[#E8DDC9] rounded-lg border border-[#343B35]/20"
            aria-label="Scrub through historical timeline"
          />

          {/* Step Forward (+1h) */}
          <button
            onClick={() => onTimeChange(Math.min(maxIndex, timeIndex + 1))}
            className="p-1.5 rounded-lg bg-[#FAF6EE] hover:bg-[#E8DDC9] border border-[#343B35]/25 text-[#343B35] transition-colors cursor-pointer"
            title="Step forward 1 hour"
            aria-label="Next hour"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <span className="text-[10px] font-mono text-[#343B35]/80 font-bold shrink-0">
            {currentTimestamp.slice(0, 10)}
          </span>
        </div>

        {/* Historical Preset Chips */}
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-bold text-[#343B35]/70 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#C8902A]" />
            Historical Moments:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {presets.map(p => (
              <button
                key={p.id}
                onClick={() => onSelectPreset(p)}
                className="px-2.5 py-0.5 rounded-md bg-[#FAF6EE] hover:bg-[#E8DDC9] border border-[#343B35]/20 text-[#343B35] font-bold text-[9px] transition-colors whitespace-nowrap cursor-pointer"
                title={p.fullTitle}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
