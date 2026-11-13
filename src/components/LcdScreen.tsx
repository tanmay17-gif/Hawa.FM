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

  // Color theme based on category (Gouache postcard palette)
  const categoryPills: Record<AirCategory, { text: string; bg: string; border: string }> = {
    fresh: { text: '#1E6347', bg: 'rgba(235, 248, 241, 0.92)', border: '#8BA888' },
    okay: { text: '#3E6627', bg: 'rgba(242, 248, 230, 0.92)', border: '#A6C58B' },
    hazy: { text: '#8C5A14', bg: 'rgba(255, 247, 230, 0.92)', border: '#E9A23B' },
    heavy: { text: '#9E3C25', bg: 'rgba(255, 238, 232, 0.92)', border: '#C8553D' },
    severe: { text: '#781A2D', bg: 'rgba(253, 230, 235, 0.92)', border: '#B82845' }
  };

  const currentTheme = categoryPills[airCategory] || categoryPills.okay;

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden border-4 border-[#CBBCA3] shadow-[inset_0_2px_8px_rgba(43,42,51,0.15),0_6px_18px_rgba(43,42,51,0.08)] bg-[#F6EFE2]"
    >
      {/* Outer Window Frame showing Painted Mumbai Skyline */}
      <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden">
        {/* HERO: The Living Skyline (Gouache Mumbai Postcard) */}
        <LivingSkyline
          pm25={pm25}
          timestamp={currentTimestamp}
          isAnomaly={isAnomaly}
          stationName={currentStation.name}
        />

        {/* Subtle glass reflection & paper edge */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/10 to-white/20" />
        <div className="absolute inset-0 pointer-events-none border border-black/5 rounded-lg" />

        {/* TOP OVERLAY: Station Name, Subtitle, Permanent Mode Badge, and Anomaly Banner */}
        <div className="absolute top-2.5 inset-x-3 z-20 pointer-events-none flex flex-col gap-1.5">
          <div className="flex items-start justify-between">
            {/* Station Header */}
            <div className="flex flex-col max-w-[62%] sm:max-w-[68%]">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-body text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F6EFE2]/95 text-[#2B2A33] border border-[#CBBCA3] shadow-xs backdrop-blur-xs flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5 text-[#C8553D]" />
                  {currentStation.freqLabel}
                </span>
                <span className="font-wordmark text-xs sm:text-sm font-bold text-[#2B2A33] drop-shadow-[0_1px_2px_rgba(255,255,255,0.9)] tracking-wide">
                  {currentStation.name}
                </span>
              </div>
              <span className="text-[10px] font-body text-[#3B3A44] font-medium drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] ml-0.5 mt-0.5 truncate">
                {currentStation.area} • {currentStation.agency}
              </span>
            </div>

            {/* PERMANENT BADGE: MEASURED / REPLAY (Strict Rule 3 compliant) */}
            <div className="flex flex-col items-end shrink-0">
              <span
                className={`font-body text-[9px] sm:text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-md border shadow-xs backdrop-blur-xs uppercase ${
                  modeBadge === 'MEASURED'
                    ? 'bg-[#EBF8F1]/95 text-[#1E6347] border-[#8BA888]'
                    : 'bg-[#FFF7E6]/95 text-[#8C5A14] border-[#E9A23B]'
                }`}
              >
                ● {modeBadge}
              </span>
              <span className="text-[9px] font-body text-[#3B3A44] font-semibold drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)] mt-0.5">
                {formattedTime}
              </span>
            </div>
          </div>

          {/* SUSTAINED ANOMALY ALERT BADGE: Clean row below subtitle, zero overlap */}
          {isAnomaly && pm25 !== null && (
            <div className="self-start pointer-events-auto">
              <button
                onClick={onOpenDetective}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#C8553D] hover:bg-[#B3452E] text-white font-body font-bold text-[10px] shadow-sm animate-pulse transition-transform"
                title="Click to view The Case Board investigation"
              >
                <AlertCircle className="w-3.5 h-3.5 text-white shrink-0" />
                <span>UNUSUAL RISE DETECTED</span>
                {anomalyScope && (
                  <span className="text-[9px] bg-black/20 px-1.5 py-0.2 rounded font-medium">
                    {anomalyScope === 'widespread' ? 'Many stations rose together' : 'Only here'}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* BOTTOM OVERLAY: Big Friendly Air Quality Word & Monospace PM2.5 */}
        <div className="absolute bottom-2.5 inset-x-3 flex items-end justify-between z-20 pointer-events-none">
          {/* Friendly Air Category */}
          <div className="flex flex-col">
            <span className="text-[9px] font-body font-bold uppercase tracking-wider text-[#4A4854] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
              Air Quality
            </span>
            <div
              className="text-lg sm:text-2xl font-wordmark font-bold px-2.5 py-0.5 rounded-lg border shadow-sm backdrop-blur-xs"
              style={{
                color: currentTheme.text,
                backgroundColor: currentTheme.bg,
                borderColor: currentTheme.border
              }}
            >
              {categoryLabels[airCategory]}
            </div>
          </div>

          {/* PM2.5 Reading in Small Monospace Segment Type */}
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-body font-bold uppercase tracking-wider text-[#4A4854] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
              PM 2.5
            </span>
            <div className="flex items-baseline gap-1 bg-[#F6EFE2]/95 px-2.5 py-0.5 rounded-lg border border-[#CBBCA3] backdrop-blur-xs shadow-xs">
              <span className="font-segment text-lg sm:text-2xl font-bold text-[#C8553D] tracking-tight">
                {pm25 !== null ? pm25.toFixed(1) : '--.-'}
              </span>
              <span className="font-body text-[10px] text-[#5A5766] font-medium">
                µg/m³
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
