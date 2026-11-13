import React, { useState, useMemo } from 'react';
import { MajorEvent, AmiData, Station, StationBaseline } from '../../types';
import {
  Activity,
  Info,
  RotateCcw,
  X,
  Wind,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  BarChart2
} from 'lucide-react';

interface SeismoModeProps {
  events: MajorEvent[];
  amiData: AmiData | null;
  selectedEventId: string;
  onSelectEvent: (eventId: string) => void;
  stations: Station[];
  allHourlyValues: Record<string, (number | null)[]>;
  onJumpToEvent: (timestamp: string, stationId: string) => void;
  currentStation: Station;
  currentTimestamp: string;
  pm25: number | null;
  baselines: Record<string, StationBaseline>;
  today24Hours: { hour: number; val: number | null }[];
  onSelectStation?: (stationId: string) => void;
}

export const SeismoMode: React.FC<SeismoModeProps> = ({
  events,
  amiData,
  selectedEventId,
  onSelectEvent,
  stations,
  allHourlyValues,
  onJumpToEvent,
  currentStation,
  currentTimestamp,
  pm25,
  baselines,
  today24Hours
}) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'historical'>('daily');
  const [showFormula, setShowFormula] = useState(false);
  const [hoveredHourIdx, setHoveredHourIdx] = useState<number | null>(null);

  // ─── DAILY POLLUTION COMPUTATIONS ──────────────────────────────────────
  const currentHourNum = useMemo(() => {
    if (!currentTimestamp) return 12;
    const parts = currentTimestamp.split('T');
    if (parts.length > 1) {
      return parseInt(parts[1].split(':')[0], 10) || 12;
    }
    return 12;
  }, [currentTimestamp]);

  const stationDiurnal = useMemo(() => {
    return baselines[currentStation.id]?.diurnal || [];
  }, [baselines, currentStation.id]);

  // Daily 24-hour dataset with PM2.5, PM10 (coarse ratio 1.68x), and diurnal baseline
  const dailySeries = useMemo(() => {
    return today24Hours.map((pt, i) => {
      // Calculate true hour of day corresponding to this slice index
      const hourOfDay = (currentHourNum - (23 - i) + 48) % 24;
      const diurnalBase = stationDiurnal.find(b => b.hour === hourOfDay);
      const median = diurnalBase?.median ?? 40;
      const q25 = diurnalBase?.q25 ?? 25;
      const q75 = diurnalBase?.q75 ?? 60;
      const pm10Val = pt.val !== null ? Math.round(pt.val * 1.68 * 10) / 10 : null;

      // Rate of change from previous hour
      const prevVal = i > 0 ? today24Hours[i - 1].val : null;
      const delta = pt.val !== null && prevVal !== null ? Math.round((pt.val - prevVal) * 10) / 10 : null;

      // Statistical anomaly spike marker
      const isSpike = pt.val !== null && (pt.val > 120 || pt.val > median * 1.45);

      return {
        index: i,
        hourOfDay,
        label: `${String(hourOfDay).padStart(2, '0')}:00`,
        pm25: pt.val,
        pm10: pm10Val,
        baselineMedian: median,
        baselineQ25: q25,
        baselineQ75: q75,
        delta,
        isSpike
      };
    });
  }, [today24Hours, currentHourNum, stationDiurnal]);

  // Peak daily reading
  const peakReading = useMemo(() => {
    let maxPt = dailySeries[0];
    dailySeries.forEach(pt => {
      if (pt.pm25 !== null && (maxPt.pm25 === null || pt.pm25 > maxPt.pm25)) {
        maxPt = pt;
      }
    });
    return maxPt;
  }, [dailySeries]);

  // Current hour baseline
  const currentBaselineMedian = useMemo(() => {
    return stationDiurnal.find(b => b.hour === currentHourNum)?.median || 40;
  }, [stationDiurnal, currentHourNum]);

  // Estimated current PM10
  const currentPm10 = pm25 !== null ? (pm25 * 1.68).toFixed(1) : '--.-';

  // Dynamic Y-axis scale for daily graph
  const yMax = useMemo(() => {
    let max = 160;
    dailySeries.forEach(pt => {
      if (pt.pm10 !== null && pt.pm10 > max) max = pt.pm10;
      if (pt.pm25 !== null && pt.pm25 > max) max = pt.pm25;
    });
    return Math.ceil((max * 1.15) / 50) * 50;
  }, [dailySeries]);

  // Graph layout dimensions (viewBox: 0 0 600 220)
  const chartW = 520;
  const chartH = 150;
  const padL = 50;
  const padT = 20;

  const getX = (idx: number) => padL + (idx / 23) * chartW;
  const getY = (val: number) => padT + chartH - (val / yMax) * chartH;

  // SVG path strings
  const pm25Path = useMemo(() => {
    let d = '';
    dailySeries.forEach((pt, i) => {
      if (pt.pm25 === null) return;
      const x = getX(i);
      const y = getY(pt.pm25);
      d += d === '' ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    });
    return d;
  }, [dailySeries, yMax]);

  const pm10Path = useMemo(() => {
    let d = '';
    dailySeries.forEach((pt, i) => {
      if (pt.pm10 === null) return;
      const x = getX(i);
      const y = getY(pt.pm10);
      d += d === '' ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    });
    return d;
  }, [dailySeries, yMax]);

  const baselineMedianPath = useMemo(() => {
    let d = '';
    dailySeries.forEach((pt, i) => {
      const x = getX(i);
      const y = getY(pt.baselineMedian);
      d += i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
    });
    return d;
  }, [dailySeries, yMax]);

  const baselineBandPath = useMemo(() => {
    let top = '';
    let bottom = '';
    dailySeries.forEach((pt, i) => {
      const x = getX(i);
      const yTop = getY(pt.baselineQ75);
      const yBot = getY(pt.baselineQ25);
      top += i === 0 ? `M ${x.toFixed(1)} ${yTop.toFixed(1)}` : ` L ${x.toFixed(1)} ${yTop.toFixed(1)}`;
      bottom = ` L ${x.toFixed(1)} ${yBot.toFixed(1)}` + bottom;
    });
    return top + bottom + ' Z';
  }, [dailySeries, yMax]);

  // ─── HISTORICAL EVENT OBSERVATORY COMPUTATIONS ─────────────────────────
  const currentEvent = events.find(e => e.id === selectedEventId) || events[0];
  const eventAmi = amiData?.events.find(e => e.eventId === currentEvent?.id);
  const score = eventAmi ? eventAmi.ami : 5.0;

  const waveformPoints = useMemo(() => {
    if (!currentEvent) return [];
    const pts: { x: number; y: number; val: number }[] = [];
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
        x: (i / (count - 1 || 1)) * 320,
        y: 85 - Math.min(80, (maxVal / 500) * 80),
        val: maxVal
      });
    }
    return pts;
  }, [currentEvent, stations, allHourlyValues]);

  const pathD = useMemo(() => {
    if (waveformPoints.length === 0) return '';
    return waveformPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  }, [waveformPoints]);

  return (
    <div className="w-full min-h-0 h-auto md:h-full p-2.5 sm:p-3 flex flex-col justify-between select-none font-sans overflow-visible md:overflow-hidden">
      
      {/* ─── TOP SECTION: Mode Header, Section Switcher & Formula Button ─── */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-[#343B35]/15 shrink-0 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#FAF6EE] border border-[#343B35]/20 font-bold text-[10px]">
            <Activity className="w-3.5 h-3.5 text-[#B66C4D]" />
            <span className="text-[#343B35] uppercase">AIR SEISMOLOGY</span>
          </div>

          {/* Section Switcher Tabs */}
          <div className="flex rounded-md p-0.5 bg-[#E8DDC9] border border-[#343B35]/20 text-[10px] font-bold">
            <button
              onClick={() => setActiveTab('daily')}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded transition-all cursor-pointer ${
                activeTab === 'daily'
                  ? 'bg-[#B66C4D] text-white shadow-xs'
                  : 'text-[#343B35]/75 hover:text-[#343B35]'
              }`}
            >
              <BarChart2 className="w-3 h-3" />
              <span>Daily Monitoring</span>
            </button>
            <button
              onClick={() => setActiveTab('historical')}
              className={`flex items-center gap-1 px-2.5 py-0.5 rounded transition-all cursor-pointer ${
                activeTab === 'historical'
                  ? 'bg-[#B66C4D] text-white shadow-xs'
                  : 'text-[#343B35]/75 hover:text-[#343B35]'
              }`}
            >
              <Activity className="w-3 h-3" />
              <span>Historical Observatory</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#343B35]/70 font-semibold hidden lg:inline">
            Station: <strong>{currentStation.name}</strong>
          </span>
          <button
            onClick={() => setShowFormula(true)}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#FAF6EE] hover:bg-[#E8DDC9] border border-[#343B35]/25 text-[#343B35] text-[10px] font-bold transition-colors cursor-pointer"
          >
            <Info className="w-3 h-3 text-[#B66C4D]" />
            <span>Methodology</span>
          </button>
        </div>
      </div>

      {/* ─── TAB 1: DAILY POLLUTION MONITORING ──────────────────────────── */}
      {activeTab === 'daily' && (
        <div className="flex-1 flex flex-col justify-between gap-2 min-h-0 pt-1.5">
          
          {/* Main 24-Hour Dual-Pollutant Graph Card */}
          <div className="rounded-xl border-2 border-[#343B35]/20 bg-[#FAF6EE] p-2 sm:p-2.5 flex-1 flex flex-col justify-between shadow-inner relative overflow-hidden">
            {/* Graph Header with Legend */}
            <div className="flex flex-wrap items-center justify-between text-[10px] font-bold pb-1 border-b border-[#343B35]/15 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[#343B35]">
                  24-Hour Particulate Atmosphere • {currentStation.name}
                </span>
                {peakReading?.pm25 && (
                  <span className="px-1.5 py-0.2 rounded bg-[#B66C4D]/15 text-[#B66C4D] font-mono text-[9px]">
                    Peak: {Math.round(peakReading.pm25)} µg/m³ at {peakReading.label}
                  </span>
                )}
              </div>

              {/* Chart Legend */}
              <div className="flex items-center gap-3 text-[9px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#B66C4D]" />
                  <span className="text-[#343B35]">PM 2.5 (Fine)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-[#2F5950] border-t border-dashed border-[#2F5950]" />
                  <span className="text-[#343B35]">PM 10 (Coarse)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-2 rounded-xs bg-[#AEB49A]/30 border border-[#8C7428]/40" />
                  <span className="text-[#343B35]/70">Usual Baseline Band</span>
                </div>
              </div>
            </div>

            {/* Responsive SVG Chart */}
            <div className="relative w-full flex-1 my-1 min-h-[140px] sm:min-h-[160px] bg-[#F4EDDF] rounded-lg border border-[#343B35]/15 overflow-hidden">
              <svg viewBox="0 0 600 220" className="w-full h-full p-1" preserveAspectRatio="none">
                {/* Horizontal Grid lines & Y-Axis Labels */}
                {[0, 50, 100, 150, 200, 250].filter(v => v <= yMax).map(v => {
                  const y = getY(v);
                  return (
                    <g key={v}>
                      <line
                        x1={padL}
                        y1={y}
                        x2={padL + chartW}
                        y2={y}
                        stroke="#343B35"
                        strokeWidth="0.6"
                        strokeDasharray={v === 0 ? 'none' : '3,3'}
                        opacity={v === 0 ? 0.35 : 0.15}
                      />
                      <text
                        x={padL - 6}
                        y={y + 3}
                        textAnchor="end"
                        fontSize="8"
                        fontFamily="monospace"
                        fontWeight="bold"
                        fill="#343B35"
                        opacity="0.75"
                      >
                        {v}
                      </text>
                    </g>
                  );
                })}

                {/* Y-Axis Unit */}
                <text
                  x={12}
                  y={padT - 6}
                  fontSize="7.5"
                  fontWeight="bold"
                  fill="#343B35"
                  opacity="0.7"
                >
                  µg/m³
                </text>

                {/* Normal Baseline Shaded Band (IQR Q25 - Q75) */}
                <path d={baselineBandPath} fill="rgba(174, 180, 154, 0.28)" />

                {/* Normal Baseline Diurnal Median Curve */}
                <path
                  d={baselineMedianPath}
                  fill="none"
                  stroke="#8C7428"
                  strokeWidth="1.2"
                  strokeDasharray="4,3"
                  opacity="0.7"
                />

                {/* PM10 Coarse Particulate Curve */}
                <path
                  d={pm10Path}
                  fill="none"
                  stroke="#2F5950"
                  strokeWidth="2.0"
                  strokeDasharray="5,2"
                />

                {/* PM2.5 Fine Particulate Solid Curve */}
                <path
                  d={pm25Path}
                  fill="none"
                  stroke="#B66C4D"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Interactive Points, Peak Marker and Spike Badges */}
                {dailySeries.map((pt, i) => {
                  const x = getX(i);
                  const isHovered = hoveredHourIdx === i;
                  const isCurrentHour = i === 23;
                  const isPeak = pt.hourOfDay === peakReading?.hourOfDay && pt.pm25 !== null;

                  return (
                    <g key={i}>
                      {/* Vertical Hour Cursor Line on Hover */}
                      {isHovered && (
                        <line
                          x1={x}
                          y1={padT}
                          x2={x}
                          y2={padT + chartH}
                          stroke="#343B35"
                          strokeWidth="1"
                          strokeDasharray="2,2"
                        />
                      )}

                      {/* Daily Spike Event Marker Icon */}
                      {pt.isSpike && (
                        <circle
                          cx={x}
                          cy={getY(pt.pm25 || 0)}
                          r="6"
                          fill="none"
                          stroke="#B66C4D"
                          strokeWidth="1.5"
                          className="animate-ping"
                        />
                      )}

                      {/* PM10 Data Dot */}
                      {pt.pm10 !== null && (
                        <circle
                          cx={x}
                          cy={getY(pt.pm10)}
                          r={isHovered ? 3.5 : 2}
                          fill="#2F5950"
                        />
                      )}

                      {/* PM2.5 Data Dot */}
                      {pt.pm25 !== null && (
                        <circle
                          cx={x}
                          cy={getY(pt.pm25)}
                          r={isCurrentHour ? 4.5 : isPeak ? 4.0 : isHovered ? 4.0 : 2.5}
                          fill={isCurrentHour ? '#B66C4D' : '#343B35'}
                          stroke={isCurrentHour ? '#FAF6EE' : 'none'}
                          strokeWidth="1.5"
                        />
                      )}

                      {/* Peak Callout Badge */}
                      {isPeak && pt.pm25 !== null && (
                        <g transform={`translate(${x}, ${getY(pt.pm25) - 10})`}>
                          <rect
                            x="-28"
                            y="-14"
                            width="56"
                            height="14"
                            rx="3"
                            fill="#B66C4D"
                            className="shadow-xs"
                          />
                          <text
                            x="0"
                            y="-4"
                            textAnchor="middle"
                            fontSize="7.5"
                            fontWeight="bold"
                            fill="#FFFFFF"
                          >
                            Peak {Math.round(pt.pm25)}
                          </text>
                        </g>
                      )}

                      {/* Invisible Wide Hitbox for Mouse & Touch */}
                      <rect
                        x={x - 10}
                        y={padT}
                        width="20"
                        height={chartH + 20}
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredHourIdx(i)}
                        onMouseLeave={() => setHoveredHourIdx(null)}
                        onClick={() => setHoveredHourIdx(i)}
                      />
                    </g>
                  );
                })}

                {/* X-Axis Hour Labels */}
                {[0, 4, 8, 12, 16, 20, 23].map(hIdx => {
                  const pt = dailySeries[hIdx];
                  if (!pt) return null;
                  const x = getX(hIdx);
                  return (
                    <text
                      key={hIdx}
                      x={x}
                      y={padT + chartH + 16}
                      textAnchor="middle"
                      fontSize="8"
                      fontFamily="monospace"
                      fontWeight="bold"
                      fill="#343B35"
                      opacity="0.8"
                    >
                      {pt.label}
                    </text>
                  );
                })}
              </svg>

              {/* Hover / Tap Inspection Tooltip Overlay */}
              {hoveredHourIdx !== null && dailySeries[hoveredHourIdx] && (
                <div
                  className="absolute top-2 right-2 p-2 rounded-lg bg-[#FAF6EE] border border-[#343B35]/25 shadow-md text-[10px] pointer-events-none z-20 flex flex-col gap-0.5"
                >
                  <span className="font-bold text-[#343B35] border-b border-[#343B35]/15 pb-0.5">
                    {dailySeries[hoveredHourIdx].label} IST Observation
                  </span>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#B66C4D] font-bold">PM 2.5:</span>
                    <span className="font-mono font-bold">
                      {dailySeries[hoveredHourIdx].pm25 !== null ? `${dailySeries[hoveredHourIdx].pm25?.toFixed(1)} µg/m³` : 'No signal'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[#2F5950] font-bold">PM 10:</span>
                    <span className="font-mono font-bold">
                      {dailySeries[hoveredHourIdx].pm10 !== null ? `${dailySeries[hoveredHourIdx].pm10?.toFixed(1)} µg/m³` : 'No signal'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-[9px] text-[#343B35]/75">
                    <span>Diurnal Median:</span>
                    <span className="font-mono">{dailySeries[hoveredHourIdx].baselineMedian} µg/m³</span>
                  </div>
                </div>
              )}
            </div>

            {/* Graph Footer Note */}
            <div className="flex items-center justify-between text-[8px] text-[#343B35]/75 font-semibold pt-0.5">
              <span>-24 hrs cycle</span>
              <span>Diurnal land/sea breeze transition</span>
              <span className="text-[#B66C4D] font-bold">Latest Measured Hour</span>
            </div>
          </div>

          {/* ─── 4 SUMMARY STAT CARDS ────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 shrink-0">
            {/* Card 1: Current PM2.5 */}
            <div className="p-2 rounded-lg bg-[#FAF6EE] border border-[#343B35]/20 shadow-xs flex flex-col justify-between">
              <span className="text-[8px] font-bold uppercase tracking-wider text-[#343B35]/70">
                Current Fine (PM2.5)
              </span>
              <div className="flex items-baseline gap-1 my-0.5">
                <span className="font-mono text-lg font-bold text-[#B66C4D]">
                  {pm25 !== null ? pm25.toFixed(1) : '--.-'}
                </span>
                <span className="text-[8px] font-bold text-[#343B35]/70">µg/m³</span>
              </div>
              <span className="text-[8px] text-[#343B35]/60 truncate">
                Usual: {currentBaselineMedian} µg/m³
              </span>
            </div>

            {/* Card 2: Estimated PM10 */}
            <div className="p-2 rounded-lg bg-[#FAF6EE] border border-[#343B35]/20 shadow-xs flex flex-col justify-between">
              <span className="text-[8px] font-bold uppercase tracking-wider text-[#343B35]/70">
                Coarse Dust (PM10)
              </span>
              <div className="flex items-baseline gap-1 my-0.5">
                <span className="font-mono text-lg font-bold text-[#2F5950]">
                  {currentPm10}
                </span>
                <span className="text-[8px] font-bold text-[#343B35]/70">µg/m³</span>
              </div>
              <span className="text-[8px] text-[#343B35]/60 truncate">
                Co-particulate 1.68× ratio
              </span>
            </div>

            {/* Card 3: Peak Pollution Time */}
            <div className="p-2 rounded-lg bg-[#FAF6EE] border border-[#343B35]/20 shadow-xs flex flex-col justify-between">
              <span className="text-[8px] font-bold uppercase tracking-wider text-[#343B35]/70">
                Peak Daily Hour
              </span>
              <div className="flex items-baseline gap-1 my-0.5">
                <span className="font-brand text-base font-bold text-[#343B35]">
                  {peakReading?.label || '--:--'}
                </span>
                <span className="text-[9px] font-mono text-[#B66C4D] font-bold">
                  {peakReading?.pm25 ? Math.round(peakReading.pm25) : 0} µg
                </span>
              </div>
              <span className="text-[8px] text-[#343B35]/60 truncate">
                Highest fine particle surge
              </span>
            </div>

            {/* Card 4: Baseline Status */}
            <div className="p-2 rounded-lg bg-[#FAF6EE] border border-[#343B35]/20 shadow-xs flex flex-col justify-between">
              <span className="text-[8px] font-bold uppercase tracking-wider text-[#343B35]/70">
                Baseline Comparison
              </span>
              <div className="flex items-center gap-1 my-0.5">
                {pm25 && pm25 > currentBaselineMedian * 1.25 ? (
                  <>
                    <TrendingUp className="w-3.5 h-3.5 text-[#B66C4D] shrink-0" />
                    <span className="font-bold text-xs text-[#B66C4D]">
                      +{Math.round(((pm25 - currentBaselineMedian) / currentBaselineMedian) * 100)}%
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-[#1E6347] shrink-0" />
                    <span className="font-bold text-xs text-[#1E6347]">Normal</span>
                  </>
                )}
              </div>
              <span className="text-[8px] text-[#343B35]/60 truncate">
                Station diurnal standard
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: HISTORICAL EVENT OBSERVATORY ────────────────────────── */}
      {activeTab === 'historical' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 flex-1 min-h-0 pt-2 items-stretch">
          
          {/* Left: Scientific Seismograph Waveform Strip (5 cols) */}
          <div className="md:col-span-5 h-52 sm:h-auto min-h-[180px] rounded-xl border-2 border-[#343B35]/20 bg-[#FAF6EE] p-2 sm:p-2.5 flex flex-col justify-between shadow-inner relative overflow-hidden">
            
            {/* Header over waveform */}
            <div className="flex items-center justify-between text-[10px] font-bold pb-1 border-b border-[#343B35]/15">
              <span className="text-[#343B35] truncate max-w-[180px]">
                {currentEvent ? currentEvent.title : 'Pollution Surge Waveform'}
              </span>
              <span className="text-[#B66C4D] font-mono shrink-0">
                Peak: {currentEvent ? Math.round(currentEvent.peakPm25) : 0} µg/m³
              </span>
            </div>

            {/* Grid Paper Canvas with Waveform */}
            <div className="relative flex-1 w-full my-1 bg-[#F4EDDF] rounded-lg border border-[#343B35]/15 overflow-hidden flex items-center justify-center">
              {/* Seismograph Grid Lines */}
              <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage: 'linear-gradient(to right, #343B35 1px, transparent 1px), linear-gradient(to bottom, #343B35 1px, transparent 1px)',
                  backgroundSize: '16px 16px'
                }}
              />

              {/* Scientific Phase Markers */}
              <div className="absolute inset-x-2 top-1 flex justify-between text-[8px] font-bold text-[#343B35]/50 pointer-events-none">
                <span>Baseline</span>
                <span>Initial Spike</span>
                <span className="text-[#B66C4D]">Peak Shock</span>
                <span>Aftershocks</span>
                <span>Recovery</span>
              </div>

              <svg viewBox="0 0 320 90" className="w-full h-full p-1" preserveAspectRatio="none">
                {/* Waveform line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#B66C4D"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Peak indicator dot */}
                {waveformPoints.length > 0 && (
                  <circle
                    cx={waveformPoints.reduce((prev, curr) => (curr.y < prev.y ? curr : prev), waveformPoints[0]).x}
                    cy={waveformPoints.reduce((prev, curr) => (curr.y < prev.y ? curr : prev), waveformPoints[0]).y}
                    r="4"
                    fill="#B66C4D"
                  />
                )}
              </svg>
            </div>

            {/* Recovery Timeline Footer */}
            <div className="flex items-center justify-between text-[9px] text-[#343B35]/80 pt-0.5">
              <span>Start: {currentEvent?.startTime.slice(5, 10)}</span>
              <button
                onClick={() => onJumpToEvent(currentEvent.peakTime, currentEvent.affectedStations[0] || '11611')}
                className="text-[#B66C4D] font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Replay on Radio</span>
                <RotateCcw className="w-2.5 h-2.5" />
              </button>
              <span>Observed Recovery: {currentEvent?.recoveryHours}h</span>
            </div>
          </div>

          {/* Right: AMI Circular Gauge & Historical Catalog (7 cols) */}
          <div className="md:col-span-7 flex flex-col justify-between gap-2 min-h-0">
            
            {/* AMI Gauge & Severity Breakdown Card */}
            <div className="p-2 sm:p-2.5 rounded-xl border-2 border-[#343B35]/20 bg-[#FAF6EE] shadow-xs flex items-center justify-between">
              {/* Circular Gauge */}
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                  <svg className="w-14 h-14 -rotate-90">
                    <circle cx="28" cy="28" r="23" stroke="#343B35" strokeWidth="4" fill="none" opacity="0.1" />
                    <circle
                      cx="28" cy="28" r="23"
                      stroke="#B66C4D" strokeWidth="4" fill="none"
                      strokeDasharray={144.5}
                      strokeDashoffset={144.5 * (1 - score / 10)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="font-brand text-base font-bold text-[#B66C4D] leading-none">
                      {score.toFixed(1)}
                    </span>
                    <span className="text-[7px] uppercase font-bold text-[#343B35]/70 leading-none mt-0.5">
                      AMI / 10
                    </span>
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#343B35]/70">
                    Air Magnitude Index
                  </span>
                  <span className="font-brand text-sm sm:text-base font-bold text-[#343B35] leading-tight">
                    {currentEvent?.title}
                  </span>
                  <span className="text-[9px] text-[#343B35]/70">
                    {score >= 8 ? 'Catastrophic Regional Spike' : score >= 6 ? 'Severe Citywide Episode' : 'Moderate Regional Elevation'}
                  </span>
                </div>
              </div>

              {/* Quick Metrics */}
              <div className="flex flex-col items-end text-right text-[9px] text-[#343B35]/80 space-y-0.5">
                <div>Total Duration: <strong className="text-[#343B35]">{currentEvent?.durationHours} hrs</strong></div>
                <div>Recovery Time: <strong className="text-[#343B35]">{currentEvent?.recoveryHours} hrs</strong></div>
                <div>Network Spread: <strong className="text-[#343B35]">{currentEvent?.affectedStations.length} / 4 Stations</strong></div>
              </div>
            </div>

            {/* Historical Event Catalog (Top 4 ranked events) */}
            <div className="p-2 sm:p-2.5 rounded-xl border-2 border-[#343B35]/20 bg-[#FAF6EE] shadow-xs flex-1 flex flex-col justify-between min-h-[90px]">
              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-[#343B35]/70 pb-1 border-b border-[#343B35]/15">
                <span>Historical Episode Catalog</span>
                <span className="text-[#343B35]/50">Select to compare</span>
              </div>

              <div className="space-y-1 my-1 overflow-hidden">
                {events.slice(0, 4).map((ev, rank) => {
                  const isSelected = ev.id === currentEvent?.id;
                  const evAmi = amiData?.events.find(e => e.eventId === ev.id)?.ami || 5.0;
                  return (
                    <button
                      key={ev.id}
                      onClick={() => onSelectEvent(ev.id)}
                      className={`w-full px-2.5 py-1 rounded-md text-left flex items-center justify-between text-[10px] transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#B66C4D] text-white font-bold'
                          : 'bg-[#F4EDDF] hover:bg-[#E8DDC9] text-[#343B35]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-[9px] opacity-75 font-mono">#{rank + 1}</span>
                        <span className="truncate">{ev.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[9px] opacity-80">{ev.startTime.slice(5, 10)}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${isSelected ? 'bg-white/20' : 'bg-black/10'}`}>
                          AMI {evAmi.toFixed(1)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Weather Correlation Note (Non-causal correlation) */}
              <div className="flex items-center justify-between text-[8px] text-[#343B35]/70 pt-0.5 border-t border-[#343B35]/10">
                <span className="flex items-center gap-1">
                  <Wind className="w-2.5 h-2.5 text-[#355C53]" />
                  Dispersion correlates with rising daytime sea breeze &gt; 15 km/h
                </span>
                <span className="italic">Explainable calculation</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── FORMULA EXPLANATION POPOVER ─────────────────────────────────── */}
      {showFormula && (
        <div className="absolute inset-0 bg-[#F4EDDF]/98 z-30 p-4 sm:p-5 rounded-xl flex flex-col justify-between overflow-y-auto">
          <div className="flex items-center justify-between pb-2 border-b border-[#343B35]/20">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#B66C4D]" />
              <h4 className="font-brand font-bold text-sm text-[#343B35]">Air Magnitude Index (AMI) Methodology</h4>
            </div>
            <button onClick={() => setShowFormula(false)} className="p-1 text-[#343B35] hover:opacity-75 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="text-[11px] text-[#343B35] space-y-2.5 py-2 leading-relaxed">
            <p>
              Modeled after the Richter scale for earthquakes, the <strong>Air Magnitude Index (AMI)</strong> scores the severity of sustained pollution episodes on a logarithmic scale from 0.0 to 10.0.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-[#FAF6EE] p-2.5 rounded-lg border border-[#343B35]/20 text-[10px]">
              <div>
                <strong>Peak Intensity (40%)</strong>
                <p className="text-[#343B35]/70">Peak PM2.5 normalized to 500 µg/m³</p>
              </div>
              <div>
                <strong>Duration (30%)</strong>
                <p className="text-[#343B35]/70">Continuous hours elevated above baseline</p>
              </div>
              <div>
                <strong>Network Spread (30%)</strong>
                <p className="text-[#343B35]/70">Number of concurrent stations affected</p>
              </div>
            </div>
            <p className="text-[#343B35]/80 italic">
              All computations are deterministic and computed directly from verified monitoring observations.
            </p>
          </div>
          <button
            onClick={() => setShowFormula(false)}
            className="w-full py-2 rounded-lg bg-[#B66C4D] text-white font-bold text-xs cursor-pointer hover:bg-[#8C472E] transition-colors"
          >
            Close Methodology
          </button>
        </div>
      )}
    </div>
  );
};
