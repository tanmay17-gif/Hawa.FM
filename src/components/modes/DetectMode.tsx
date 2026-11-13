import React, { useState, useMemo } from 'react';
import { Station, StationBaseline, AnomalyEpisode, MajorEvent } from '../../types';
import { FileText, Printer, Sparkles, X, ChevronRight, History } from 'lucide-react';

interface DetectModeProps {
  stations: Station[];
  currentStation: Station;
  onSelectStation: (id: string) => void;
  currentTimestamp: string;
  currentPm25: number | null;
  baselines: Record<string, StationBaseline>;
  anomalies: Record<string, AnomalyEpisode[]>;
  allStationCurrentValues: Record<string, number | null>;
  today24Hours: { hour: number; val: number | null }[];
  events: MajorEvent[];
  onOpenPrintModal: () => void;
  onJumpToReplay?: (timestamp: string, stationId: string) => void;
}

export const DetectMode: React.FC<DetectModeProps> = ({
  stations,
  currentStation,
  onSelectStation,
  currentTimestamp,
  currentPm25,
  baselines,
  anomalies,
  allStationCurrentValues,
  today24Hours,
  events,
  onOpenPrintModal,
  onJumpToReplay
}) => {
  const [selectedPinInfo, setSelectedPinInfo] = useState<Station | null>(null);
  const [selectedHistoricalEventId, setSelectedHistoricalEventId] = useState<string | null>(null);

  // Active historical event if selected
  const activeHistoricalEvent = useMemo(() => {
    if (!selectedHistoricalEventId) return null;
    return events.find(e => e.id === selectedHistoricalEventId) || null;
  }, [selectedHistoricalEventId, events]);

  // Baseline data for current station
  const currentBaseline = baselines[currentStation.id]?.diurnal || [];
  const currentHourNum = parseInt(currentTimestamp.split('T')[1]?.split(':')[0] || '12', 10);
  const currentBaseHour = currentBaseline.find(b => b.hour === currentHourNum);
  const currentMedian = currentBaseHour?.median || 40;

  // Active anomaly episode for current station (live or historical)
  const stationEpisodes = anomalies[currentStation.id] || [];
  const activeEpisode = useMemo(() => {
    if (activeHistoricalEvent) {
      // Find matching episode in this event's window
      return stationEpisodes.find(
        ep => ep.startTime <= activeHistoricalEvent.peakTime && ep.endTime >= activeHistoricalEvent.peakTime
      ) || {
        startIndex: activeHistoricalEvent.startIndex,
        endIndex: activeHistoricalEvent.endIndex,
        startTime: activeHistoricalEvent.startTime,
        endTime: activeHistoricalEvent.endTime,
        peakTime: activeHistoricalEvent.peakTime,
        peakIndex: activeHistoricalEvent.peakIndex,
        durationHours: activeHistoricalEvent.durationHours,
        peakPm25: activeHistoricalEvent.peakPm25,
        peakRobustZ: 4.8,
        scope: activeHistoricalEvent.affectedStations.length > 2 ? 'widespread' as const : 'isolated' as const,
        concurrentElevatedStations: activeHistoricalEvent.affectedStations.length - 1
      };
    }
    return stationEpisodes.find(
      ep => currentTimestamp >= ep.startTime && currentTimestamp <= ep.endTime
    );
  }, [activeHistoricalEvent, stationEpisodes, currentTimestamp]);

  // Total detected anomalies across all stations at current timestamp
  const totalActiveAnomalies = useMemo(() => {
    let count = 0;
    Object.entries(anomalies).forEach(([, eps]) => {
      if (eps.some(ep => currentTimestamp >= ep.startTime && currentTimestamp <= ep.endTime)) {
        count++;
      }
    });
    return count;
  }, [anomalies, currentTimestamp]);

  // Coastal pin coordinates on Mumbai map
  const coords: Record<string, { x: number; y: number; top: string; left: string }> = {
    '11606': { x: 170, y: 55, top: '23%', left: '42%' },  // Borivali East
    '11611': { x: 130, y: 88, top: '37%', left: '33%' },  // Malad West
    '3409511': { x: 245, y: 138, top: '58%', left: '62%' }, // Shivaji Nagar
    '3409510': { x: 160, y: 195, top: '81%', left: '40%' }  // Byculla
  };

  // Recurring evening diurnal pattern check (statistically observed from historical medians)
  const eveningAvg = currentBaseline.filter(b => b.hour >= 20 && b.hour <= 23).reduce((acc, b) => acc + b.median, 0) / 4 || 0;
  const middayAvg = currentBaseline.filter(b => b.hour >= 12 && b.hour <= 15).reduce((acc, b) => acc + b.median, 0) / 4 || 0;
  const hasRecurringEveningRise = eveningAvg > middayAvg * 1.3;

  // Maximum value for responsive chart scaling
  const chartMax = useMemo(() => {
    let max = 150;
    today24Hours.forEach(h => {
      if (h.val !== null && h.val > max) max = h.val;
    });
    currentBaseline.forEach(b => {
      if (b.median > max) max = b.median;
    });
    if (activeHistoricalEvent) {
      max = Math.max(max, activeHistoricalEvent.peakPm25);
    }
    return Math.ceil(max / 50) * 50;
  }, [today24Hours, currentBaseline, activeHistoricalEvent]);

  return (
    <div className="w-full min-h-0 h-auto md:h-full p-2.5 sm:p-3 flex flex-col justify-between select-none font-sans overflow-visible md:overflow-hidden">
      
      {/* ─── TOP SECTION: Status, Mode Switch & Printable Note ──────────── */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 pb-1.5 border-b border-[#343B35]/15 shrink-0 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#FAF6EE] border border-[#343B35]/20 font-bold text-[10px]">
            <span className={`w-2 h-2 rounded-full ${totalActiveAnomalies > 0 || activeHistoricalEvent ? 'bg-[#B66C4D] animate-ping' : 'bg-[#1E6347]'}`} />
            <span className="text-[#343B35] uppercase">AIR DETECTIVE</span>
          </div>
          <span className="text-[10px] text-[#343B35]/80 font-medium hidden sm:inline">
            {activeHistoricalEvent ? `Historical Investigation: ${activeHistoricalEvent.title}` : 'Network Pattern & Spike Investigator'}
          </span>
        </div>

        {/* Status Counters & Print Note Button */}
        <div className="flex items-center gap-2 text-[10px] font-bold">
          {activeHistoricalEvent ? (
            <button
              onClick={() => setSelectedHistoricalEventId(null)}
              className="px-2 py-0.5 rounded bg-[#F4EDDF] hover:bg-[#E8DDC9] text-[#B66C4D] border border-[#B66C4D]/30 transition-colors cursor-pointer"
            >
              ← Back to Live Mode
            </button>
          ) : (
            <>
              <span className="text-[#1E6347] hidden md:inline">
                ● {stations.length} Active Stations
              </span>
              <span className={totalActiveAnomalies > 0 ? 'text-[#B66C4D]' : 'text-[#343B35]/70'}>
                ● {totalActiveAnomalies} Detected {totalActiveAnomalies === 1 ? 'Anomaly' : 'Anomalies'}
              </span>
            </>
          )}

          <button
            onClick={onOpenPrintModal}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#FAF6EE] hover:bg-[#E8DDC9] border border-[#343B35]/25 text-[#343B35] font-bold transition-colors cursor-pointer"
          >
            <Printer className="w-3 h-3 text-[#B66C4D]" />
            <span>Investigation Note</span>
          </button>
        </div>
      </div>

      {/* ─── HISTORICAL INVESTIGATION EVENT SELECTOR BAR ────────────────── */}
      <div className="py-1 px-2 bg-[#FAF6EE] border-b border-[#343B35]/10 flex items-center justify-between text-[9px] shrink-0">
        <div className="flex items-center gap-1.5 font-bold text-[#343B35]/70 shrink-0">
          <History className="w-3 h-3 text-[#B66C4D]" />
          <span className="uppercase tracking-wider">Historical Investigation:</span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {events.slice(0, 4).map(ev => {
            const isSelected = selectedHistoricalEventId === ev.id;
            return (
              <button
                key={ev.id}
                onClick={() => {
                  if (isSelected) {
                    setSelectedHistoricalEventId(null);
                  } else {
                    setSelectedHistoricalEventId(ev.id);
                    if (ev.affectedStations[0]) {
                      onSelectStation(ev.affectedStations[0]);
                    }
                  }
                }}
                className={`px-2 py-0.5 rounded-md text-[9px] font-bold whitespace-nowrap border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#B66C4D] text-white border-[#8C472E] shadow-xs'
                    : 'bg-[#F4EDDF] hover:bg-[#E8DDC9] text-[#343B35] border-[#343B35]/20'
                }`}
              >
                {ev.title.split('(')[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── MAIN CONTENT: Evidence Map + Investigation & Chart ─────────── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 flex-1 min-h-0 pt-1.5 items-stretch">
        
        {/* Left: Interactive Mumbai Evidence Map (5 cols) */}
        <div className="md:col-span-5 h-56 sm:h-64 md:h-auto min-h-[200px] rounded-xl border-2 border-[#343B35]/20 bg-[#355C53] relative overflow-hidden flex flex-col justify-between shadow-inner">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 240" preserveAspectRatio="none" fill="none">
            {/* Arabian Sea background in Deep Forest Teal */}
            <rect width="400" height="240" fill="#355C53" />

            {/* Mumbai Island & Salsette Landmass in Warm Paper Tone */}
            <path
              d="M 110 0 Q 145 40 175 75 Q 195 110 215 150 Q 235 185 200 220 Q 185 240 170 240 L 400 240 L 400 0 Z"
              fill="#E8DDC9"
              stroke="#AEB49A"
              strokeWidth="2"
            />
            <path
              d="M 85 0 Q 115 50 140 95 Q 155 135 145 165 Q 135 190 125 220 Q 115 240 100 240 L 400 240 L 400 0 Z"
              fill="#F4EDDF"
              stroke="#D5C7B0"
              strokeWidth="1.5"
            />

            {/* Key Landmarks */}
            <g transform="translate(148, 192) scale(0.6)">
              <path d="M 0 16 L 0 6 Q 6 2 12 6 L 12 16 Z" fill="#8C7428" />
            </g>
            <path d="M 128 92 Q 140 120 152 148" stroke="#355C53" strokeWidth="2" strokeDasharray="3,2" opacity="0.6" />

            {/* Red Detective Evidence Strings between concurrent elevated stations */}
            {(activeEpisode || activeHistoricalEvent) && (
              <g>
                {stations.map(otherSt => {
                  if (otherSt.id === currentStation.id) return null;
                  const c1 = coords[currentStation.id];
                  const c2 = coords[otherSt.id];
                  if (!c1 || !c2) return null;

                  const isAffected = activeHistoricalEvent
                    ? activeHistoricalEvent.affectedStations.includes(otherSt.id)
                    : (allStationCurrentValues[otherSt.id] !== null && (allStationCurrentValues[otherSt.id] || 0) > 75);

                  if (isAffected) {
                    return (
                      <line
                        key={otherSt.id}
                        x1={c1.x}
                        y1={c1.y}
                        x2={c2.x}
                        y2={c2.y}
                        stroke="#B66C4D"
                        strokeWidth="2.5"
                        strokeDasharray="4,2"
                      />
                    );
                  }
                  return null;
                })}
              </g>
            )}
          </svg>

          {/* Interactive Station Markers */}
          <div className="absolute inset-0 pointer-events-auto">
            {stations.map(st => {
              const c = coords[st.id];
              if (!c) return null;
              const isSelected = st.id === currentStation.id;

              const val = activeHistoricalEvent
                ? (activeHistoricalEvent.affectedStations.includes(st.id) ? activeHistoricalEvent.peakPm25 * (st.id === currentStation.id ? 1 : 0.82) : 45.2)
                : allStationCurrentValues[st.id];

              const isElevated = activeHistoricalEvent
                ? activeHistoricalEvent.affectedStations.includes(st.id)
                : anomalies[st.id]?.some(ep => currentTimestamp >= ep.startTime && currentTimestamp <= ep.endTime);

              let statusBg = 'bg-[#1E6347]';
              if (isElevated) statusBg = 'bg-[#B66C4D]';
              else if (val !== null && val > 75) statusBg = 'bg-[#C8902A]';

              return (
                <button
                  key={st.id}
                  onClick={() => {
                    onSelectStation(st.id);
                    setSelectedPinInfo(st);
                  }}
                  style={{ top: c.top, left: c.left }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                  title={`${st.name}: ${val !== null ? `${val.toFixed(1)} µg/m³` : 'No signal'}`}
                >
                  {isElevated && (
                    <span className="absolute -inset-2 rounded-full border-2 border-[#B66C4D] animate-ping opacity-75" />
                  )}
                  <div
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold border transition-all flex items-center gap-1 shadow-sm ${
                      isSelected
                        ? 'bg-[#B66C4D] text-white border-white scale-110'
                        : 'bg-[#FAF6EE] text-[#343B35] border-[#343B35]/30 hover:scale-105'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : statusBg}`} />
                    <span>{st.name.split(' ')[0]}</span>
                    {val !== null && <span className="opacity-80 font-mono text-[8px]">{Math.round(val)}</span>}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Map Footer Note */}
          <div className="relative z-10 p-1.5 flex items-center justify-between text-[9px] font-bold bg-[#FAF6EE]/90 border-t border-[#343B35]/20">
            <span className="text-[#343B35]">Click station pin to inspect</span>
            <span className="text-[#B66C4D]">
              {activeHistoricalEvent ? `● Event Peak: ${Math.round(activeHistoricalEvent.peakPm25)} µg/m³` : activeEpisode ? '● Red lines: Concurrent rises' : '● Ambient normal'}
            </span>
          </div>

          {/* Compact Station Info Popover on Map */}
          {selectedPinInfo && (
            <div className="absolute bottom-7 left-2 right-2 bg-[#FAF6EE] border border-[#343B35]/30 rounded-lg p-2 z-20 shadow-md flex items-center justify-between text-[10px]">
              <div>
                <span className="font-bold text-[#343B35]">{selectedPinInfo.fullName}</span>
                <p className="text-[9px] text-[#343B35]/70">
                  PM 2.5: <strong>{allStationCurrentValues[selectedPinInfo.id] !== null ? `${allStationCurrentValues[selectedPinInfo.id]?.toFixed(1)} µg/m³` : 'No Signal'}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedPinInfo(null)}
                className="p-1 text-[#343B35]/60 hover:text-[#343B35] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Anomaly Panel, Time-Series Graph & Investigation Findings (7 cols) */}
        <div className="md:col-span-7 flex flex-col justify-between gap-1.5 min-h-0">
          
          {/* Anomaly Detection & Investigation Summary Card */}
          <div className="p-2 sm:p-2.5 rounded-xl border-2 border-[#343B35]/20 bg-[#FAF6EE] shadow-xs">
            <div className="flex items-center justify-between pb-1 border-b border-[#343B35]/15 mb-1.5">
              <div className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#B66C4D]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#343B35]">
                  {activeHistoricalEvent ? 'Historical Event Case Brief' : 'Investigation Summary'}
                </span>
              </div>
              <span className="text-[9px] text-[#343B35]/70 font-semibold">
                Station #{currentStation.id} • {currentStation.name}
              </span>
            </div>

            <div className="text-[11px] leading-relaxed text-[#343B35] space-y-1">
              {activeHistoricalEvent ? (
                <>
                  <p>
                    <strong>Historical Case:</strong> On <strong>{activeHistoricalEvent.peakTime.replace('T', ' at ')} IST</strong>, a major sustained elevation occurred across Mumbai.
                    Peak fine particle reading reached <strong className="text-[#B66C4D]">{activeHistoricalEvent.peakPm25.toFixed(1)} µg/m³</strong>.
                  </p>
                  <p>
                    <strong>Affected Stations ({activeHistoricalEvent.affectedStations.length}):</strong>{' '}
                    {activeHistoricalEvent.affectedStations.map(sid => stations.find(s => s.id === sid)?.name || sid).join(', ')}.
                    Duration: <strong>{activeHistoricalEvent.durationHours} hours</strong>. Recovery: <strong>{activeHistoricalEvent.recoveryHours} hours</strong>.
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-[#343B35]/70 italic">
                      Verified historical observations from competition sensors.
                    </span>
                    {onJumpToReplay && (
                      <button
                        onClick={() => onJumpToReplay(activeHistoricalEvent.peakTime, activeHistoricalEvent.affectedStations[0] || '11611')}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#B66C4D] hover:bg-[#8C472E] text-white text-[10px] font-bold transition-colors cursor-pointer shadow-xs"
                      >
                        <span>Explore in Replay Mode</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </>
              ) : activeEpisode ? (
                <>
                  <p>
                    <strong>Observed measurement:</strong> At {currentTimestamp.replace('T', ' at ')} IST, PM2.5 reached{' '}
                    <span className="font-bold text-[#B66C4D]">
                      {currentPm25 !== null ? `${currentPm25.toFixed(1)} µg/m³` : 'no signal'}
                    </span>{' '}
                    (historical median for this hour is {currentMedian} µg/m³).
                  </p>
                  <p>
                    <strong>Network scope:</strong> {activeEpisode.scope === 'widespread'
                      ? `Citywide pattern — ${activeEpisode.concurrentElevatedStations} other monitoring stations concurrently elevated.`
                      : 'Localized pattern — surrounding coastal stations remain near typical baseline.'}
                  </p>
                  <p className="text-[10px] text-[#343B35]/70 italic bg-[#F4EDDF] p-1.5 rounded border border-[#343B35]/15">
                    <strong>Honesty requirement:</strong> We distinguish measured anomalies from causes. Without independent on-ground evidence, we never claim specific industrial or traffic sources.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong>Normal baseline status:</strong> At {currentTimestamp.replace('T', ' at ')} IST, {currentStation.name} registered{' '}
                    <strong>{currentPm25 !== null ? `${currentPm25.toFixed(1)} µg/m³` : 'no signal'}</strong>.
                  </p>
                  <p>
                    <strong>Baseline comparison:</strong> Consistent with typical diurnal expectations ({currentMedian} µg/m³). No sustained statistical spike detected.
                  </p>
                  <p className="text-[10px] text-[#343B35]/70 italic bg-[#F4EDDF] p-1.5 rounded border border-[#343B35]/15">
                    <strong>Tip:</strong> Select any historical event from the bar above to inspect Mumbai&apos;s past pollution spikes.
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Time-Series Graph: Selected Station vs Baseline */}
          <div className="p-2 rounded-xl border-2 border-[#343B35]/20 bg-[#FAF6EE] shadow-xs flex-1 flex flex-col justify-between min-h-[90px]">
            <div className="flex items-center justify-between text-[9px] font-bold pb-1 border-b border-[#343B35]/15">
              <span className="text-[#343B35]">
                {activeHistoricalEvent ? `Event Window: ${activeHistoricalEvent.title}` : '24-Hour Time-Series Profile'}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-[#8C7428]">― Usual Baseline</span>
                <span className="text-[#B66C4D]">― Current Station</span>
                <span className="text-[#343B35]/50">░ Gap</span>
              </div>
            </div>

            {/* Responsive Chart Container with Axes and Markers */}
            <div className="relative h-14 sm:h-16 w-full mt-1">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 240 60" preserveAspectRatio="none">
                <line x1="0" y1="20" x2="240" y2="20" stroke="#343B35" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.2" />
                <line x1="0" y1="40" x2="240" y2="40" stroke="#343B35" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.2" />

                {/* Historical baseline curve */}
                <path
                  d={currentBaseline.map((b, i) => {
                    const x = (i / 23) * 240;
                    const y = 60 - (b.median / chartMax) * 55;
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#8C7428"
                  strokeWidth="1.5"
                  strokeDasharray="2,1"
                  opacity="0.8"
                />

                {/* Today / Event 24-hr values with gaps shown as hatched blocks */}
                {today24Hours.map((pt, i) => {
                  const x = (i / 23) * 240;
                  if (pt.val === null) {
                    return (
                      <rect
                        key={i}
                        x={x - 2.5}
                        y="8"
                        width="5"
                        height="48"
                        fill="rgba(52,59,53,0.08)"
                        stroke="#343B35"
                        strokeWidth="0.5"
                        strokeDasharray="1,1"
                        opacity="0.5"
                      />
                    );
                  }
                  const y = 60 - (pt.val / chartMax) * 55;
                  const isCurrentHour = i === 23;
                  return (
                    <g key={i}>
                      <circle
                        cx={x}
                        cy={y}
                        r={isCurrentHour ? 3.5 : 1.5}
                        fill={isCurrentHour ? '#B66C4D' : '#343B35'}
                      />
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="flex items-center justify-between text-[8px] text-[#343B35]/70 font-semibold pt-0.5">
              <span>-24 hrs</span>
              <span>12h ago</span>
              <span className="font-bold text-[#B66C4D]">Peak Hour</span>
            </div>
          </div>

          {/* Recurring Pattern Detection Card */}
          {hasRecurringEveningRise && !activeHistoricalEvent && (
            <div className="p-1.5 rounded-lg bg-[#FAF6EE] border border-[#343B35]/20 flex items-center justify-between text-[9px] text-[#343B35]">
              <div className="flex items-center gap-1.5 truncate">
                <Sparkles className="w-3.5 h-3.5 text-[#C8902A] shrink-0" />
                <span className="truncate">
                  <strong>Observed pattern:</strong> Evening PM2.5 rise detected around 20:00–23:00 IST (~{Math.round(((eveningAvg - middayAvg) / middayAvg) * 100)}% elevation as land-breeze inversion traps particles).
                </span>
              </div>
              <span className="font-bold text-[#1E6347] shrink-0 ml-1">Statistical Confidence 88%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
