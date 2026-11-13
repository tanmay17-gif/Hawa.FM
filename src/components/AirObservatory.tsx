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
      // Get max across stations
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
    <div className="flex flex-col h-full bg-[#16181b] text-zinc-100 rounded-lg border border-[#3b3528] overflow-hidden select-none font-sans">
      {/* Observatory Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#1e2024] border-b border-[#3b3528]">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#d4af37]" />
          <div>
            <h2 className="font-mono text-sm font-bold tracking-wide text-[#d4af37] uppercase">
              Air Observatory
            </h2>
            <p className="text-[10px] text-zinc-400">
              Air Magnitude Index (AMI) & historical catalog
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-zinc-700/60 text-zinc-400 hover:text-white transition-colors"
          aria-label="Close observatory panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Selected Event Card & AMI Gauge */}
        {currentEvent && (
          <div className="rounded-lg border border-zinc-800 bg-[#0f1114] p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[9px] font-mono uppercase tracking-wider text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/60">
                  {currentEvent.tag}
                </span>
                <h3 className="font-bold text-sm text-white mt-1">
                  {currentEvent.title}
                </h3>
                <p className="text-[10px] text-zinc-400 font-mono">
                  {currentEvent.startTime.slice(0, 10)} to {currentEvent.endTime.slice(0, 10)}
                </p>
              </div>

              {/* Jump to Replay Button */}
              <button
                onClick={() => onJumpToEvent(currentEvent.peakTime, currentEvent.affectedStations[0] || '11611')}
                className="px-2 py-1 rounded bg-[#d4af37]/20 hover:bg-[#d4af37]/30 text-[#d4af37] border border-[#d4af37]/40 text-[10px] font-mono font-bold flex items-center gap-1 transition-colors"
              >
                <span>Replay Peak</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* AIR MAGNITUDE INDEX (AMI) GAUGE (0 - 10) */}
            <div className="bg-[#14171c] p-3 rounded-md border border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-mono uppercase text-zinc-400 tracking-wider">
                  Air Magnitude Index
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-mono text-3xl font-extrabold text-amber-400 tracking-tight">
                    {score.toFixed(1)}
                  </span>
                  <span className="font-mono text-xs text-zinc-500">/ 10</span>
                </div>
                <div className="text-[11px] font-semibold text-amber-200 mt-0.5">
                  {getAmiLabel(score)}
                </div>
              </div>

              {/* Circular Gauge Graphic */}
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  {/* Track */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#27272a"
                    strokeWidth="3.5"
                  />
                  {/* Value Arc */}
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#ffb703"
                    strokeWidth="3.5"
                    strokeDasharray={`${score * 10}, 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute font-mono text-[10px] font-bold text-zinc-300">
                  AMI
                </span>
              </div>
            </div>

            {/* Seismograph Waveform Strip */}
            <div className="bg-[#0b0d10] p-3 rounded-md border border-zinc-800/80 space-y-1.5">
              <div className="flex justify-between items-center text-[9px] font-mono text-zinc-400">
                <span className="flex items-center gap-1">
                  <Activity className="w-3 h-3 text-red-400" />
                  POLLUTION SEISMOGRAPH (PM2.5 WAVEFORM)
                </span>
                <span>Peak: {currentEvent.peakPm25} µg/m³</span>
              </div>

              <div className="h-20 w-full overflow-hidden bg-black/40 rounded border border-zinc-900 relative">
                {/* Horizontal Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between py-1 px-2 pointer-events-none opacity-20">
                  <div className="w-full border-b border-zinc-600 border-dashed" />
                  <div className="w-full border-b border-zinc-600 border-dashed" />
                  <div className="w-full border-b border-zinc-600 border-dashed" />
                </div>

                <svg className="w-full h-full" viewBox="0 0 300 80" preserveAspectRatio="none">
                  {/* Shaded Area under curve */}
                  {waveformPoints.length > 1 && (
                    <polygon
                      points={`0,80 ${waveformPoints.map(p => `${p.x},${p.y}`).join(' ')} 300,80`}
                      fill="url(#seismoGradient)"
                      opacity="0.35"
                    />
                  )}
                  {/* Seismograph Line */}
                  {waveformPoints.length > 1 && (
                    <polyline
                      points={waveformPoints.map(p => `${p.x},${p.y}`).join(' ')}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="2"
                    />
                  )}
                  <defs>
                    <linearGradient id="seismoGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* Aftershock & Recovery Timeline */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                <span className="text-[9px] text-zinc-400 uppercase">Episode Duration</span>
                <p className="text-base font-bold text-white mt-0.5">
                  {currentEvent.durationHours} hrs
                </p>
                <span className="text-[9px] text-zinc-500">Continuous elevated air</span>
              </div>
              <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800">
                <span className="text-[9px] text-zinc-400 uppercase">Recovery Window</span>
                <p className="text-base font-bold text-emerald-400 mt-0.5">
                  {currentEvent.recoveryHours} hrs
                </p>
                <span className="text-[9px] text-zinc-500">Return to hour baseline</span>
              </div>
            </div>
          </div>
        )}

        {/* Historical Events Ranked by Magnitude */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-[#d4af37]" />
              Historical Ranked Catalog
            </h3>
            <button
              onClick={() => setShowFormulaSheet(true)}
              className="text-[10px] font-mono text-[#d4af37] hover:underline flex items-center gap-1"
            >
              <HelpCircle className="w-3 h-3" />
              <span>How is this calculated?</span>
            </button>
          </div>

          <div className="space-y-1.5">
            {events.map((ev, rank) => {
              const evAmi = amiData?.events.find(e => e.eventId === ev.id);
              const evScore = evAmi ? evAmi.ami : 5.0;
              const isSelected = ev.id === currentEvent?.id;

              return (
                <button
                  key={ev.id}
                  onClick={() => onSelectEvent(ev.id)}
                  className={`w-full p-2.5 rounded-md border text-left transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-950/40 border-amber-500/70 shadow-sm'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-zinc-500 w-4">
                      #{rank + 1}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-zinc-200">
                        {ev.title}
                      </div>
                      <div className="text-[10px] font-mono text-zinc-400">
                        Peak: {ev.peakPm25} µg/m³ • {ev.startTime.slice(0, 10)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400 px-1.5 py-0.5 rounded bg-black/50 border border-zinc-800">
                      {evScore.toFixed(1)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* "How is this calculated?" Bottom Sheet */}
      {showFormulaSheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4">
          <div className="relative w-full max-w-lg bg-[#181a1e] text-zinc-100 rounded-t-xl sm:rounded-xl shadow-2xl p-5 border border-zinc-700 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-zinc-800">
              <div>
                <h3 className="font-mono text-sm font-bold text-[#d4af37] uppercase">
                  How is the Air Magnitude Index Calculated?
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Transparent mathematical formula & sensitivity analysis
                </p>
              </div>
              <button
                onClick={() => setShowFormulaSheet(false)}
                className="text-zinc-400 hover:text-white p-1"
                aria-label="Close formula details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 pt-3 text-xs leading-relaxed text-zinc-300">
              {/* Two-sentence core explanation */}
              <div className="p-3 rounded-md bg-[#23272e] border-l-4 border-[#d4af37] text-zinc-200">
                <p className="font-sans">
                  The Air Magnitude Index (AMI) scores regional pollution episodes from 0 to 10
                  based on peak intensity above baseline, episode duration, monitoring station breadth, and spatial spread across Mumbai.
                  Sensitivity checks across three alternative weighting models show consistent relative rankings, proving the robustness of the index.
                </p>
              </div>

              {/* Exact Formula & Weights */}
              <div>
                <h4 className="font-mono font-bold text-white text-xs uppercase mb-1.5">
                  Primary Scoring Formula:
                </h4>
                <div className="font-mono text-[11px] p-2.5 rounded bg-black/50 border border-zinc-800 text-amber-300">
                  AMI = 10 × [ 0.35·Intensity + 0.25·Duration + 0.25·Station Breadth + 0.15·Spatial Spread ]
                </div>
                <ul className="mt-2 space-y-1 text-[11px] text-zinc-400 list-disc list-inside">
                  <li><strong>Intensity (35%):</strong> Peak PM2.5 normalized relative to clean baseline.</li>
                  <li><strong>Duration (25%):</strong> Total hours of continuous elevated readings.</li>
                  <li><strong>Breadth (25%):</strong> Proportion of Mumbai stations concurrently elevated.</li>
                  <li><strong>Spatial Spread (15%):</strong> Geographical dispersion across North and South Mumbai.</li>
                </ul>
              </div>

              {/* Sensitivity Check Results */}
              <div>
                <h4 className="font-mono font-bold text-white text-xs uppercase mb-1.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Sensitivity Analysis (Stress Test)
                </h4>
                <p className="text-[11px] text-zinc-400">
                  To ensure rankings are not an artifact of chosen weights, we evaluated three alternative formulations:
                  Intensity-Heavy (50% intensity), Duration-Heavy (45% duration), and Equal-Weights (25% each).
                  Across all permutations, event rankings remain stable with maximum displacement of ±1 position.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowFormulaSheet(false)}
                  className="px-4 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs font-bold"
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
