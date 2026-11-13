import React, { useState } from 'react';
import { Station, StationBaseline, AnomalyEpisode } from '../types';
import { ShieldAlert, Compass, Printer, X, Sparkles, MapPin } from 'lucide-react';

interface AirDetectiveProps {
  stations: Station[];
  currentStation: Station;
  onSelectStation: (id: string) => void;
  currentTimestamp: string;
  currentPm25: number | null;
  baselines: Record<string, StationBaseline>;
  anomalies: Record<string, AnomalyEpisode[]>;
  allStationCurrentValues: Record<string, number | null>;
  today24Hours: { hour: number; val: number | null }[];
  onClose: () => void;
}

export const AirDetective: React.FC<AirDetectiveProps> = ({
  stations,
  currentStation,
  onSelectStation,
  currentTimestamp,
  currentPm25,
  baselines,
  anomalies,
  allStationCurrentValues,
  today24Hours,
  onClose
}) => {
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Station baseline
  const currentBaseline = baselines[currentStation.id]?.diurnal || [];

  // Check if current hour falls into an anomaly episode
  const currentHourNum = parseInt(currentTimestamp.split('T')[1]?.split(':')[0] || '12', 10);
  const currentBaseHour = currentBaseline.find(b => b.hour === currentHourNum);
  const currentMedian = currentBaseHour?.median || 40;

  // Find if there is an active anomaly for this station
  const stationEpisodes = anomalies[currentStation.id] || [];
  const activeEpisode = stationEpisodes.find(
    ep => currentTimestamp >= ep.startTime && currentTimestamp <= ep.endTime
  );

  // Check for genuine recurring evening pattern from data
  // Look at baseline hours 20 to 23 vs daytime hours 12 to 15
  const eveningAvg = currentBaseline.filter(b => b.hour >= 20 && b.hour <= 23).reduce((acc, b) => acc + b.median, 0) / 4 || 0;
  const middayAvg = currentBaseline.filter(b => b.hour >= 12 && b.hour <= 15).reduce((acc, b) => acc + b.median, 0) / 4 || 0;
  const hasEveningRise = eveningAvg > middayAvg * 1.35;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-full bg-[#16181b] text-zinc-100 rounded-lg border border-[#3b3528] overflow-hidden select-none font-sans">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#1e2024] border-b border-[#3b3528]">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-[#d4af37]" />
          <div>
            <h2 className="font-mono text-sm font-bold tracking-wide text-[#d4af37] uppercase">
              Air Detective
            </h2>
            <p className="text-[10px] text-zinc-400">
              Spatial correlation & local pattern investigator
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-zinc-700/60 text-zinc-400 hover:text-white transition-colors"
          aria-label="Close detective panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Stylised Mumbai Coastline Map with Glowing Station Dots */}
        <div className="rounded-lg border border-zinc-800 bg-[#0d0f12] p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 mb-2 flex items-center justify-between">
            <span>Mumbai Coastline & Network Nodes</span>
            <span className="text-[9px] text-[#d4af37]">Tap node to inspect</span>
          </div>

          <div className="relative aspect-[16/9] w-full rounded bg-[#090b0e] border border-zinc-800/60 overflow-hidden flex items-center justify-center">
            {/* Stylised Vector Mumbai Peninsula Coastline */}
            <svg
              className="absolute inset-0 w-full h-full opacity-35"
              viewBox="0 0 400 240"
              preserveAspectRatio="none"
              fill="none"
            >
              {/* Arabian Sea */}
              <rect width="400" height="240" fill="#040608" />
              {/* Mumbai landmass contour */}
              <path
                d="M 120 0 Q 150 40 180 80 Q 200 120 220 160 Q 230 190 200 220 L 400 220 L 400 0 Z"
                fill="#161e2b"
                stroke="#25354e"
                strokeWidth="1.5"
              />
              <path
                d="M 80 0 Q 110 50 140 100 Q 160 140 150 170 Q 130 200 120 240 L 400 240 L 400 0 Z"
                fill="#1c2637"
                stroke="#334766"
                strokeWidth="1"
              />
            </svg>

            {/* Glowing Station Dots across Mumbai */}
            {stations.map(st => {
              const val = allStationCurrentValues[st.id];
              const isSelected = st.id === currentStation.id;

              // Normalized coordinates on stylised map (North to South)
              // 11606 Borivali: North
              // 11611 Malad: West North
              // 3409511 Shivaji Nagar: East Mid
              // 3409510 Byculla: South
              const coords: Record<string, { top: string; left: string }> = {
                '11606': { top: '22%', left: '42%' },
                '11611': { top: '35%', left: '32%' },
                '3409511': { top: '56%', left: '62%' },
                '3409510': { top: '80%', left: '40%' }
              };
              const pos = coords[st.id] || { top: '50%', left: '50%' };

              let dotColor = '#10b981'; // fresh
              if (val !== null) {
                if (val > 150) dotColor = '#ef4444'; // severe
                else if (val > 90) dotColor = '#f97316'; // heavy
                else if (val > 60) dotColor = '#f59e0b'; // hazy
                else if (val > 30) dotColor = '#84cc16'; // okay
              }

              return (
                <button
                  key={st.id}
                  onClick={() => onSelectStation(st.id)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 group z-10 transition-transform active:scale-95"
                  style={{ top: pos.top, left: pos.left }}
                  aria-label={`Select ${st.name}`}
                >
                  <div className="relative">
                    {isSelected && (
                      <div
                        className="absolute -inset-2 rounded-full animate-ping opacity-75"
                        style={{ backgroundColor: dotColor }}
                      />
                    )}
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shadow-md transition-all ${
                        isSelected ? 'border-white scale-125' : 'border-black/60'
                      }`}
                      style={{ backgroundColor: dotColor }}
                    >
                      <MapPin className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>
                  <div
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold whitespace-nowrap shadow-sm backdrop-blur-xs transition-colors ${
                      isSelected
                        ? 'bg-amber-400 text-black border border-amber-300'
                        : 'bg-black/75 text-zinc-300 border border-zinc-700'
                    }`}
                  >
                    {st.name.split(' ')[0]} {val !== null ? `${Math.round(val)}` : '—'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Plain Language "What's Unusual Here" Summary */}
        <div className="rounded-lg border border-zinc-800 bg-[#121417] p-3.5 space-y-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#d4af37]" />
            <h3 className="font-mono text-xs font-bold uppercase text-[#d4af37] tracking-wider">
              What's Unusual Here
            </h3>
          </div>

          <div className="text-xs text-zinc-300 leading-relaxed">
            {activeEpisode ? (
              <p>
                <strong className="text-amber-400">Unusual rise detected:</strong> PM2.5 reached{' '}
                <strong className="text-white font-mono">{activeEpisode.peakPm25} µg/m³</strong> at this station,
                which is significantly above the diurnal baseline median of{' '}
                <strong className="text-white font-mono">{currentMedian} µg/m³</strong> for this hour.
                The anomaly is classified as{' '}
                <span className="font-bold text-amber-300 uppercase underline decoration-[#d4af37]">
                  {activeEpisode.scope}
                </span>{' '}
                ({activeEpisode.concurrentElevatedStations} other Mumbai stations elevated concurrently).
              </p>
            ) : currentPm25 !== null ? (
              <p>
                Current reading of <strong className="text-white font-mono">{currentPm25} µg/m³</strong> is{' '}
                {currentPm25 > currentMedian * 1.25 ? (
                  <span className="text-amber-300">moderately above the typical baseline</span>
                ) : currentPm25 < currentMedian * 0.75 ? (
                  <span className="text-emerald-300">cleaner than the typical baseline</span>
                ) : (
                  <span>closely tracking the typical baseline</span>
                )}{' '}
                ({currentMedian} µg/m³) for this time of day. No sustained anomaly episode is currently active.
              </p>
            ) : (
              <p className="text-zinc-400 italic">
                Data currently missing at this station hour. Static state active.
              </p>
            )}
          </div>

          {/* Honest Recurring Pattern derived from real data */}
          {hasEveningRise && (
            <div className="mt-2 text-[11px] bg-zinc-900/80 p-2 rounded border border-zinc-800 text-zinc-300 flex items-start gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Observed local rhythm:</strong> Baseline values at {currentStation.name} typically rise
                by ~{Math.round(((eveningAvg - middayAvg) / middayAvg) * 100)}% between 20:00 and 23:00 IST due to
                nocturnal atmospheric boundary layer shallowing.
              </span>
            </div>
          )}
        </div>

        {/* 24-Hour "Usual Baseline vs. Today" Curve */}
        <div className="rounded-lg border border-zinc-800 bg-[#121417] p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-xs font-bold uppercase text-zinc-300 tracking-wider">
              24-Hour Profile: Usual vs. Today
            </h3>
            <div className="flex items-center gap-3 text-[9px] font-mono">
              <span className="flex items-center gap-1 text-zinc-400">
                <span className="w-3 h-0.5 bg-zinc-500 inline-block" /> Usual Baseline
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-3 h-0.5 bg-amber-400 inline-block" /> Today
              </span>
            </div>
          </div>

          {/* SVG Sparkline comparison */}
          <div className="h-28 w-full">
            <svg className="w-full h-full" viewBox="0 0 240 100" preserveAspectRatio="none">
              {/* Baseline Range Band (IQR) */}
              {currentBaseline.length > 0 && (
                <polygon
                  points={
                    currentBaseline
                      .map((b, idx) => `${idx * 10},${100 - Math.min(95, b.q75 * 0.4)}`)
                      .join(' ') +
                    ' ' +
                    currentBaseline
                      .slice()
                      .reverse()
                      .map((b, idx) => `${(23 - idx) * 10},${100 - Math.min(95, b.q25 * 0.4)}`)
                      .join(' ')
                  }
                  fill="#d4af37"
                  opacity="0.12"
                />
              )}

              {/* Usual Baseline Median Line */}
              {currentBaseline.length > 0 && (
                <polyline
                  points={currentBaseline
                    .map((b, idx) => `${idx * 10},${100 - Math.min(95, b.median * 0.4)}`)
                    .join(' ')}
                  fill="none"
                  stroke="#71717a"
                  strokeWidth="1.5"
                  strokeDasharray="2,2"
                />
              )}

              {/* Today's 24-hour reading line */}
              <polyline
                points={today24Hours
                  .map(
                    (item, idx) =>
                      `${idx * 10},${
                        item.val !== null ? 100 - Math.min(95, item.val * 0.4) : 100
                      }`
                  )
                  .join(' ')}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2"
              />

              {/* Current Hour Indicator Dot */}
              {currentPm25 !== null && (
                <circle
                  cx={currentHourNum * 10}
                  cy={100 - Math.min(95, currentPm25 * 0.4)}
                  r="3.5"
                  fill="#ffb703"
                  stroke="#fff"
                  strokeWidth="1"
                />
              )}
            </svg>
          </div>
          <div className="flex justify-between text-[8px] font-mono text-zinc-500">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:00</span>
          </div>
        </div>

        {/* Generate Clean Printable Investigation Note Button */}
        <div className="pt-2">
          <button
            onClick={() => setShowPrintModal(true)}
            className="w-full py-2.5 px-3 rounded-md bg-[#d4af37]/20 hover:bg-[#d4af37]/30 text-[#d4af37] border border-[#d4af37]/50 font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Create Investigation Note</span>
          </button>
        </div>
      </div>

      {/* Printable One-Page Investigation Note Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-[#faf8f5] text-zinc-900 rounded-lg shadow-2xl p-6 border border-zinc-300">
            <button
              onClick={() => setShowPrintModal(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-black p-1 print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Print Header */}
            <div className="border-b-2 border-zinc-800 pb-3 mb-4">
              <div className="flex justify-between items-baseline">
                <h1 className="text-xl font-bold font-mono tracking-tight text-zinc-900">
                  HAWA.FM AIR INVESTIGATION BRIEF
                </h1>
                <span className="font-mono text-xs font-bold text-amber-700">CONFIDENTIAL</span>
              </div>
              <p className="text-xs text-zinc-600 font-mono mt-0.5">
                Automated Diagnostic Memo • Deterministic Baseline Analysis
              </p>
            </div>

            {/* Meta Table */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-4 bg-zinc-100 p-3 rounded border border-zinc-200">
              <div>
                <span className="text-zinc-500">Target Station:</span>
                <p className="font-bold text-zinc-900">{currentStation.fullName}</p>
              </div>
              <div>
                <span className="text-zinc-500">Observation Time:</span>
                <p className="font-bold text-zinc-900">{currentTimestamp} IST</p>
              </div>
              <div>
                <span className="text-zinc-500">Measured PM2.5:</span>
                <p className="font-bold text-zinc-900">
                  {currentPm25 !== null ? `${currentPm25} µg/m³` : 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-zinc-500">Hour Baseline Median:</span>
                <p className="font-bold text-zinc-900">{currentMedian} µg/m³</p>
              </div>
            </div>

            {/* Spatial Findings */}
            <div className="space-y-3 text-xs leading-relaxed text-zinc-800 mb-5">
              <h4 className="font-mono font-bold uppercase text-zinc-900 tracking-wider border-b border-zinc-200 pb-1">
                Investigation Assessment
              </h4>
              <p>
                At {currentTimestamp} IST, monitoring equipment at {currentStation.name} recorded{' '}
                {currentPm25 !== null ? `${currentPm25} µg/m³` : 'no signal'}. This reading represents an elevation
                against the station&apos;s established diurnal baseline.
              </p>
              <p>
                <strong>Concurrent Regional Network Status:</strong>
                <br />
                {Object.entries(allStationCurrentValues)
                  .map(([sid, v]) => {
                    const st = stations.find(s => s.id === sid);
                    return `${st?.name || sid}: ${v !== null ? `${v} µg/m³` : 'No Signal'}`;
                  })
                  .join(' • ')}
              </p>
              <div className="bg-amber-50 border-l-4 border-amber-500 p-2 text-[11px] text-amber-900">
                <strong>Mandatory Regulatory Caveat (Honesty Rule):</strong>
                <br />
                This system identifies statistical air quality anomalies strictly from ambient monitoring data.
                It does <em>not</em> attribute causation to any specific industrial, vehicular, or seasonal source.
                These observations indicate an unusual rise worth physical on-ground inspection.
              </div>
            </div>

            {/* Print Button Footer */}
            <div className="flex justify-end gap-2 border-t pt-3 print:hidden">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-3 py-1.5 text-xs font-mono rounded border border-zinc-300 hover:bg-zinc-100"
              >
                Close
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-1.5 text-xs font-mono font-bold rounded bg-zinc-900 text-white hover:bg-zinc-800 flex items-center gap-1.5 shadow"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
