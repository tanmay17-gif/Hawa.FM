import React from 'react';
import { Station, AirCategory, ModeBadge } from '../types';
import { LivingSkyline } from './LivingSkyline';
import { AlertCircle, Radio } from 'lucide-react';

interface LcdScreenProps {
  currentStation: Station;
  currentTimestamp: string;
  pm25: number | null;
  airCategory: AirCategory;
  modeBadge: ModeBadge;
  isAnomaly: boolean;
  anomalyZ?: number;
  anomalyScope?: 'isolated' | 'widespread';
  language: 'en' | 'hi' | 'mr';
  categoryLabels: Record<AirCategory, string>;
  onOpenDetective?: () => void;
}

export const LcdScreen: React.FC<LcdScreenProps> = ({
  currentStation,
  currentTimestamp,
  pm25,
  airCategory,
  modeBadge,
  isAnomaly,
  anomalyScope,
  categoryLabels,
  onOpenDetective
}) => {
  // Format readable time e.g. "21 Oct 2025, 02:00 IST"
  const formattedTime = React.useMemo(() => {
    if (!currentTimestamp) return '--:--';
    const [datePart, timePart] = currentTimestamp.split('T');
    const [y, m, d] = datePart.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[parseInt(m, 10) - 1] || m;
    return `${d} ${monthName} ${y}, ${timePart} IST`;
  }, [currentTimestamp]);

  // Color theme based on category
  const categoryColors = {
    fresh: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40',
    okay: 'text-lime-300 border-lime-500/40 bg-lime-950/40',
    hazy: 'text-amber-300 border-amber-500/40 bg-amber-950/40',
    heavy: 'text-orange-400 border-orange-500/40 bg-orange-950/40',
    severe: 'text-rose-400 border-rose-500/40 bg-rose-950/40'
  };

  return (
    <div
      className="relative w-full rounded-lg overflow-hidden border-4 border-[#2b251a] shadow-[inset_0_4px_12px_rgba(0,0,0,0.9),0_6px_16px_rgba(0,0,0,0.7)]"
      style={{
        background: '#090d0b'
      }}
    >
      {/* Outer LCD Phosphor Frame with Brass Inlay Ring */}
      <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden">
        {/* HERO: The Living Skyline */}
        <LivingSkyline
          pm25={pm25}
          timestamp={currentTimestamp}
          isAnomaly={isAnomaly}
          stationName={currentStation.name}
        />

        {/* Vintage Glass Scanlines and Glare */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-35 mix-blend-overlay" />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-white/10" />

        {/* TOP OVERLAY: Station Name, Frequency, and Permanent Mode Badge */}
        <div className="absolute top-2.5 inset-x-3 flex items-start justify-between z-20 pointer-events-none">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-[#d4af37] border border-[#d4af37]/40 shadow-sm backdrop-blur-xs flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 text-[#d4af37]" />
                {currentStation.freqLabel}
              </span>
              <span className="font-mono text-[11px] sm:text-xs font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] uppercase tracking-wider">
                {currentStation.name}
              </span>
            </div>
            <span className="text-[9px] font-mono text-zinc-300 drop-shadow ml-0.5 mt-0.5">
              {currentStation.area} • {currentStation.agency}
            </span>
          </div>

          {/* PERMANENT BADGE: MEASURED / REPLAY (Strict Rule 3 compliant) */}
          <div className="flex flex-col items-end">
            <span
              className={`font-mono text-[9px] sm:text-[10px] font-bold tracking-widest px-2 py-0.5 rounded border shadow-sm backdrop-blur-xs uppercase ${
                modeBadge === 'MEASURED'
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                  : 'bg-amber-950/80 text-amber-300 border-amber-500/50'
              }`}
            >
              ● {modeBadge}
            </span>
            <span className="text-[9px] font-mono text-zinc-300 drop-shadow mt-1">
              {formattedTime}
            </span>
          </div>
        </div>

        {/* SUSTAINED ANOMALY ALERT BADGE (Only when mathematically detected) */}
        {isAnomaly && pm25 !== null && (
          <div className="absolute top-12 left-3 z-20">
            <button
              onClick={onOpenDetective}
              className="pointer-events-auto flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/90 hover:bg-amber-400 text-black font-mono font-bold text-[10px] shadow-lg animate-bounce transition-transform"
              title="Click to view Air Detective investigation"
            >
              <AlertCircle className="w-3.5 h-3.5 fill-black stroke-amber-400" />
              <span>UNUSUAL RISE DETECTED</span>
              {anomalyScope && (
                <span className="text-[8px] bg-black/20 px-1 rounded uppercase">
                  {anomalyScope}
                </span>
              )}
            </button>
          </div>
        )}

        {/* BOTTOM OVERLAY: Big Friendly Air Quality Word & Monospace PM2.5 */}
        <div className="absolute bottom-2.5 inset-x-3 flex items-end justify-between z-20 pointer-events-none">
          {/* Friendly Air Category */}
          <div className="flex flex-col">
            <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 drop-shadow">
              AIR QUALITY
            </span>
            <div
              className={`text-xl sm:text-2xl font-bold font-sans tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] px-2 py-0.5 rounded border inline-block backdrop-blur-xs ${
                categoryColors[airCategory]
              }`}
            >
              {categoryLabels[airCategory]}
            </div>
          </div>

          {/* PM2.5 Monospace Segment Type Reading */}
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-400 drop-shadow">
              PM 2.5
            </span>
            <div className="flex items-baseline gap-1 bg-black/60 px-2 py-0.5 rounded border border-zinc-700/60 backdrop-blur-xs shadow-inner">
              <span className="font-mono text-lg sm:text-2xl font-bold text-amber-400 tracking-tight">
                {pm25 !== null ? pm25.toFixed(1) : '--.-'}
              </span>
              <span className="font-mono text-[9px] text-zinc-400">
                µg/m³
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
