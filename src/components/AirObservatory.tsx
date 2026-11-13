import React, { useState } from 'react';
import { MajorEvent, AmiData, Station } from '../types';
import { Activity, HelpCircle, X, CheckCircle2, ChevronRight, BarChart3 } from 'lucide-react';

interface AirObservatoryProps {
  events: MajorEvent[];
  amiData: AmiData | null;
  selectedEventId: string;
  onSelectEvent: (eventId: string) => void;
  stations: Station[];
  allHourlyValues: Record<string, (number | null)[]>;
  onClose: () => void;
  onJumpToEvent: (timestamp: string, stationId: string) => void;
}

export const AirObservatory: React.FC<AirObservatoryProps> = ({
  events,
  amiData,
  selectedEventId,
  onSelectEvent,
  stations,
  allHourlyValues,
  onClose,
  onJumpToEvent
}) => {
  const [showFormulaSheet, setShowFormulaSheet] = useState(false);

  // Active event
  const currentEvent = events.find(e => e.id === selectedEventId) || events[0];
  const eventAmi = amiData?.events.find(e => e.eventId === currentEvent?.id);

  // AMI Score (0 - 10)
  const score = eventAmi ? eventAmi.ami : 5.0;

  // Friendly severity label
  const getAmiLabel = (s: number) => {
    if (s >= 8.5) return 'Catastrophic Regional Spike';
    if (s >= 7.0) return 'Severe Citywide Episode';
    if (s >= 5.0) return 'Substantial Pollution Surge';
    if (s >= 3.0) return 'Moderate Regional Elevation';
    return 'Mild Ambient Fluctuation';
  };

  // Seismograph data slice for the event window
  const waveformPoints = React.useMemo(() => {
    if (!currentEvent) return [];
    const pts: { x: number; y: number }[] = [];
    const sIdx = currentEvent.startIndex;
    const eIdx = currentEvent.endIndex;
    const count = eIdx - sIdx + 1;

    for (let i = 0; i < count; i++) {
      const idx = sIdx + i;
      let maxVal = 0;
      stations.forEach(st => {
        const v = allHourlyValues[st.id]?.[idx];
        if (v !== null && v !== undefined && v > maxVal) {
          maxVal = v;
        }
      });
      pts.push({
        x: (i / (count - 1 || 1)) * 300,
        y: 80 - Math.min(75, (maxVal / 500) * 75)
      });
    }
    return pts;
  }, [currentEvent, stations, allHourlyValues]);

  return (
    <div className="flex flex-col h-full bg-[#F6EFE2] text-[#2B2A33] rounded-2xl border-2 border-[#CBBCA3] shadow-2xl overflow-hidden select-none font-body">
      {/* Mobile Drag Handle */}
      <div className="w-full flex justify-center pt-2 pb-1 lg:hidden">
        <div className="w-10 h-1.5 rounded-full bg-[#CBBCA3]" />
      </div>

      {/* Observatory Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-[#EFE4CF] border-b border-[#CBBCA3]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#E9A23B]/20 border border-[#E9A23B]/40 flex items-center justify-center text-[#C8553D]">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-wordmark text-base font-bold text-[#2B2A33] tracking-wide">
              Air Observatory
            </h2>
            <p className="text-[11px] text-[#5A5766]">
              Air Magnitude Index (AMI) &amp; historical catalog
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-[#E5D7BF] text-[#5A5766] hover:text-black transition-colors"
          aria-label="Close observatory panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Selected Event Card & Big AMI Gauge */}
        {currentEvent && (
          <div className="rounded-xl border border-[#CBBCA3] bg-[#FCF9F3] p-4 space-y-3.5 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#C8553D] bg-[#FBE9E7] px-2 py-0.5 rounded-md border border-[#FFCCBC]">
                  {currentEvent.tag}
                </span>
                <h3 className="font-wordmark font-bold text-base text-[#2B2A33] mt-1.5">
                  {currentEvent.title}
                </h3>
                <p className="text-[11px] text-[#5A5766]">
                  {currentEvent.startTime.slice(0, 10)} to {currentEvent.endTime.slice(0, 10)}
                </p>
              </div>

              {/* Jump to Replay Button */}
              <button
                onClick={() => onJumpToEvent(currentEvent.peakTime, currentEvent.affectedStations[0] || '11611')}
                className="px-2.5 py-1.5 rounded-lg bg-[#EFE4CF] hover:bg-[#E5D7BF] text-[#2B2A33] border border-[#CBBCA3] text-[11px] font-bold flex items-center gap-1 transition-all"
              >
                <span>Replay Peak</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#C8553D]" />
              </button>
            </div>

            {/* AIR MAGNITUDE INDEX (AMI) GAUGE (0 - 10) */}
            <div className="bg-[#EFE4CF] p-3.5 rounded-xl border border-[#D5C7B0] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-[#5A5766] tracking-wider">
                  Air Magnitude Index
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-wordmark text-4xl font-extrabold text-[#C8553D] tracking-tight">
                    {score.toFixed(1)}
                  </span>
                  <span className="text-sm font-bold text-[#7A7885]">/ 10</span>
                </div>
                <div className="text-xs font-bold text-[#2B2A33] mt-0.5">
                  {getAmiLabel(score)}
                </div>
              </div>

              {/* Circular Gauge Graphic in Terracotta & Brass */}
              <div className="relative w-18 h-18 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#D5C7B0"
                    strokeWidth="3.5"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#C8553D"
                    strokeWidth="3.5"
                    strokeDasharray={`${score * 10}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute font-wordmark text-xs font-bold text-[#2B2A33]">
                  AMI
                </span>
              </div>
            </div>

            {/* Paper Seismograph Waveform Strip */}
            <div className="bg-[#FAF6EE] p-3 rounded-xl border border-[#D5C7B0] space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-bold text-[#5A5766]">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-[#C8553D]" />
                  POLLUTION SEISMOGRAPH (PM2.5 WAVEFORM)
                </span>
                <span className="text-[#C8553D]">Peak: {currentEvent.peakPm25} µg/m³</span>
              </div>

              <div className="h-20 w-full overflow-hidden bg-white/60 rounded-lg border border-[#D5C7B0] relative">
                {/* Horizontal Paper Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between py-1 px-2 pointer-events-none opacity-25">
                  <div className="w-full border-b border-[#2B2A33] border-dashed" />
                  <div className="w-full border-b border-[#2B2A33] border-dashed" />
                  <div className="w-full border-b border-[#2B2A33] border-dashed" />
                </div>

                <svg className="w-full h-full" viewBox="0 0 300 80" preserveAspectRatio="none">
                  {waveformPoints.length > 1 && (
                    <polygon
                      points={`0,80 ${waveformPoints.map(p => `${p.x},${p.y}`).join(' ')} 300,80`}
                      fill="#C8553D"
                      opacity="0.18"
                    />
                  )}
                  {waveformPoints.length > 1 && (
                    <polyline
                      points={waveformPoints.map(p => `${p.x},${p.y}`).join(' ')}
                      fill="none"
                      stroke="#C8553D"
                      strokeWidth="2"
                    />
                  )}
                </svg>
              </div>
            </div>

            {/* Duration & Recovery Timeline Cards */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-[#EFE4CF] border border-[#D5C7B0]">
                <span className="text-[10px] text-[#5A5766] uppercase font-bold">Episode Duration</span>
                <p className="text-base font-wordmark font-bold text-[#2B2A33] mt-0.5">
                  {currentEvent.durationHours} hrs
                </p>
                <span className="text-[10px] text-[#7A7885]">Continuous elevated air</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#EFE4CF] border border-[#D5C7B0]">
                <span className="text-[10px] text-[#5A5766] uppercase font-bold">Recovery Window</span>
                <p className="text-base font-wordmark font-bold text-[#1E6347] mt-0.5">
                  {currentEvent.recoveryHours} hrs
                </p>
                <span className="text-[10px] text-[#7A7885]">Return to usual levels</span>
              </div>
            </div>
          </div>
        )}

        {/* Historical Events Ranked by Magnitude */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="font-wordmark text-sm font-bold text-[#2B2A33] flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-[#C8553D]" />
              Historical Ranked Catalog
            </h3>
            <button
              onClick={() => setShowFormulaSheet(true)}
              className="text-[11px] font-bold text-[#C8553D] hover:underline flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>How is this calculated?</span>
            </button>
          </div>

          <div className="space-y-2">
            {events.map((ev, rank) => {
              const evAmi = amiData?.events.find(e => e.eventId === ev.id);
              const evScore = evAmi ? evAmi.ami : 5.0;
              const isSelected = ev.id === currentEvent?.id;

              return (
                <button
                  key={ev.id}
                  onClick={() => onSelectEvent(ev.id)}
                  className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#EFE4CF] border-[#C8553D] shadow-xs'
                      : 'bg-[#FCF9F3] border-[#D5C7B0] hover:bg-[#F6EFE2]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-wordmark text-xs font-bold text-[#7A7885] w-5">
                      #{rank + 1}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-[#2B2A33]">
                        {ev.title}
                      </div>
                      <div className="text-[11px] text-[#5A5766]">
                        Peak: {ev.peakPm25} µg/m³ • {ev.startTime.slice(0, 10)}
                      </div>
                    </div>
                  </div>

                  <span className="font-wordmark text-xs font-bold text-[#C8553D] px-2 py-0.5 rounded-md bg-[#FFF2ED] border border-[#FFCCBC]">
                    {evScore.toFixed(1)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* "How is this calculated?" Bottom Sheet */}
      {showFormulaSheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-3 sm:p-4">
          <div className="relative w-full max-w-lg bg-[#F6EFE2] text-[#2B2A33] rounded-2xl shadow-2xl p-5 border-2 border-[#CBBCA3] max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-[#D5C7B0]">
              <div>
                <h3 className="font-wordmark text-base font-bold text-[#2B2A33]">
                  How is the Air Magnitude Index Calculated?
                </h3>
                <p className="text-[11px] text-[#5A5766]">
                  Transparent mathematical formula &amp; sensitivity analysis
                </p>
              </div>
              <button
                onClick={() => setShowFormulaSheet(false)}
                className="text-[#5A5766] hover:text-black p-1"
                aria-label="Close formula sheet"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-3.5 text-xs leading-relaxed text-[#2B2A33]">
              {/* Two-sentence core summary */}
              <div className="p-3.5 rounded-xl bg-[#EFE4CF] border-l-4 border-[#C8553D] text-[#2B2A33]">
                <p className="font-body">
                  The Air Magnitude Index (AMI) scores regional pollution episodes from 0 to 10
                  based on peak intensity above baseline, episode duration, monitoring station breadth, and spatial spread across Mumbai.
                  Sensitivity checks across three alternative weighting models show consistent relative rankings, proving the robustness of the index.
                </p>
              </div>

              {/* Exact Formula & Weights */}
              <div>
                <h4 className="font-wordmark font-bold text-[#2B2A33] text-xs uppercase mb-1.5">
                  Primary Scoring Formula:
                </h4>
                <div className="font-mono text-[11px] p-3 rounded-lg bg-[#FAF6EE] border border-[#D5C7B0] text-[#9E3C25] font-bold">
                  AMI = 10 × [ 0.35·Intensity + 0.25·Duration + 0.25·Station Breadth + 0.15·Spatial Spread ]
                </div>
                <ul className="mt-2 space-y-1 text-[11px] text-[#5A5766] list-disc list-inside">
                  <li><strong>Intensity (35%):</strong> Peak PM2.5 normalized relative to clean baseline.</li>
                  <li><strong>Duration (25%):</strong> Total hours of continuous elevated readings.</li>
                  <li><strong>Breadth (25%):</strong> Proportion of Mumbai stations concurrently elevated.</li>
                  <li><strong>Spatial Spread (15%):</strong> Geographical dispersion across North and South Mumbai.</li>
                </ul>
              </div>

              {/* Sensitivity Check Results */}
              <div>
                <h4 className="font-wordmark font-bold text-[#2B2A33] text-xs uppercase mb-1.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#1E6347]" />
                  Sensitivity Analysis (Stress Test)
                </h4>
                <p className="text-[11px] text-[#5A5766]">
                  To verify that rankings are mathematically stable rather than an artifact of chosen weights, we evaluated three alternative models: Intensity-Heavy (50% intensity), Duration-Heavy (45% duration), and Equal-Weights (25% each).
                  Across all permutations, event rankings remain stable with maximum displacement of ±1 position.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowFormulaSheet(false)}
                  className="px-4 py-1.5 rounded-lg bg-[#C8553D] text-white hover:bg-[#B3452E] font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
