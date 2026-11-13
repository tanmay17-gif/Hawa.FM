import React, { useState } from 'react';
import { Station, StationBaseline, AnomalyEpisode } from '../types';
import { Compass, Printer, X, Sparkles, MapPin, AlertCircle, FileText } from 'lucide-react';

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

  // Active anomaly for current station
  const stationEpisodes = anomalies[currentStation.id] || [];
  const activeEpisode = stationEpisodes.find(
    ep => currentTimestamp >= ep.startTime && currentTimestamp <= ep.endTime
  );

  // Check recurring evening rhythm
  const eveningAvg = currentBaseline.filter(b => b.hour >= 20 && b.hour <= 23).reduce((acc, b) => acc + b.median, 0) / 4 || 0;
  const middayAvg = currentBaseline.filter(b => b.hour >= 12 && b.hour <= 15).reduce((acc, b) => acc + b.median, 0) / 4 || 0;
  const hasEveningRise = eveningAvg > middayAvg * 1.35;

  // Pin coordinates on hand-drawn paper map
  const coords: Record<string, { x: number; y: number; top: string; left: string }> = {
    '11606': { x: 170, y: 55, top: '23%', left: '42%' },  // Borivali East (North)
    '11611': { x: 130, y: 88, top: '37%', left: '33%' },  // Malad West (North-West coast)
    '3409511': { x: 245, y: 138, top: '58%', left: '62%' }, // Shivaji Nagar (East)
    '3409510': { x: 160, y: 195, top: '81%', left: '40%' }  // Byculla (South)
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-full bg-[#F6EFE2] text-[#2B2A33] rounded-2xl border-2 border-[#CBBCA3] shadow-2xl overflow-hidden select-none font-body">
      {/* Mobile Drag Handle */}
      <div className="w-full flex justify-center pt-2 pb-1 lg:hidden">
        <div className="w-10 h-1.5 rounded-full bg-[#CBBCA3]" />
      </div>

      {/* Case Board Header */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-[#EFE4CF] border-b border-[#CBBCA3]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#C8553D]/15 border border-[#C8553D]/30 flex items-center justify-center text-[#C8553D]">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-wordmark text-base font-bold text-[#2B2A33] tracking-wide">
              The Case Board
            </h2>
            <p className="text-[11px] text-[#5A5766]">
              Neighbouring stations &amp; pattern investigator
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-[#E5D7BF] text-[#5A5766] hover:text-black transition-colors"
          aria-label="Close Case Board"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* HAND-DRAWN PAPER MAP OF MUMBAI (Teal Sea, Paper Land, Red String Evidence Lines) */}
        <div className="rounded-xl border border-[#CBBCA3] bg-[#FCF9F3] p-3 shadow-xs">
          <div className="text-[11px] font-bold tracking-wide text-[#5A5766] mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#2F7F86] inline-block" />
              Mumbai Coastal Evidence Map
            </span>
            <span className="text-[10px] text-[#C8553D] font-medium">Tap pin to inspect</span>
          </div>

          <div className="relative aspect-[16/10] w-full rounded-lg bg-[#2F7F86] border border-[#CBBCA3] overflow-hidden flex items-center justify-center shadow-inner">
            {/* SVG Hand-Drawn Paper Coastline */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 400 240"
              preserveAspectRatio="none"
              fill="none"
            >
              {/* Sea Background Texture: Arabian Sea in rich teal */}
              <rect width="400" height="240" fill="#2F7F86" />

              {/* Mumbai Island & Salsette Landmass in Warm Paper Tone */}
              <path
                d="M 110 0 Q 145 40 175 75 Q 195 110 215 150 Q 235 185 200 220 Q 185 240 170 240 L 400 240 L 400 0 Z"
                fill="#EFE4CF"
                stroke="#CBBCA3"
                strokeWidth="2"
              />
              {/* South Mumbai Peninsula Contour */}
              <path
                d="M 85 0 Q 115 50 140 95 Q 155 135 145 165 Q 135 190 125 220 Q 115 240 100 240 L 400 240 L 400 0 Z"
                fill="#F6EFE2"
                stroke="#D5C7B0"
                strokeWidth="1.5"
              />

              {/* Tiny Illustrated Landmarks on Map */}
              {/* Gateway Arch at South Tip */}
              <g transform="translate(148, 192) scale(0.6)">
                <path d="M 0 16 L 0 6 Q 6 2 12 6 L 12 16 Z" fill="#8C7428" />
              </g>
              {/* Sea Link Across Bay */}
              <path
                d="M 128 92 Q 140 120 152 148"
                stroke="#4E687C"
                strokeWidth="2"
                strokeDasharray="2,2"
              />

              {/* RED DETECTIVE EVIDENCE STRINGS (When an unusual rise is active) */}
              {activeEpisode && (
                <g>
                  {stations.map(otherSt => {
                    if (otherSt.id === currentStation.id) return null;
                    const c1 = coords[currentStation.id];
                    const c2 = coords[otherSt.id];
                    if (!c1 || !c2) return null;

                    // If other station also elevated, draw bold red string
                    const otherVal = allStationCurrentValues[otherSt.id];
                    const otherIsElevated = otherVal !== null && otherVal > 80;

                    if (otherIsElevated && activeEpisode.scope === 'widespread') {
                      return (
                        <g key={otherSt.id}>
                          {/* Shadow string */}
                          <line
                            x1={c1.x}
                            y1={c1.y}
                            x2={c2.x}
                            y2={c2.y}
                            stroke="#000"
                            strokeWidth="3"
                            opacity="0.15"
                          />
                          {/* Red wool string */}
                          <line
                            x1={c1.x}
                            y1={c1.y}
                            x2={c2.x}
                            y2={c2.y}
                            stroke="#C8553D"
                            strokeWidth="2"
                            strokeDasharray="4,2"
                          />
                        </g>
                      );
                    }
                    return null;
                  })}
                </g>
              )}
            </svg>

            {/* Station Pins on the Map */}
            {stations.map(st => {
              const val = allStationCurrentValues[st.id];
              const isSelected = st.id === currentStation.id;
              const pos = coords[st.id] || { top: '50%', left: '50%' };

              // Pin colors by air quality
              let pinColor = '#2F7F86'; // fresh
              if (val !== null) {
                if (val > 250) pinColor = '#781A2D'; // severe
                else if (val > 120) pinColor = '#C8553D'; // heavy
                else if (val > 60) pinColor = '#E9A23B'; // hazy
                else if (val > 30) pinColor = '#8BA888'; // okay
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
                    {/* Ripple animation when active anomaly */}
                    {activeEpisode && isSelected && (
                      <div
                        className="absolute -inset-2.5 rounded-full animate-ping opacity-60"
                        style={{ backgroundColor: '#C8553D' }}
                      />
                    )}
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shadow-md transition-all ${
                        isSelected ? 'border-white scale-125 ring-2 ring-[#C8553D]' : 'border-[#2B2A33]/40'
                      }`}
                      style={{ backgroundColor: pinColor }}
                    >
                      <MapPin className="w-3 h-3 text-white" />
                    </div>
                  </div>

                  <div
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap shadow-xs backdrop-blur-xs transition-colors ${
                      isSelected
                        ? 'bg-[#C8553D] text-white shadow-sm'
                        : 'bg-[#F6EFE2] text-[#2B2A33] border border-[#CBBCA3]'
                    }`}
                  >
                    {st.name.replace(', Mumbai', '').split(' ')[0]} {val !== null ? `${Math.round(val)}` : '—'}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Map Scope Badge Indicator */}
          {activeEpisode && (
            <div className="mt-2.5 flex items-center justify-between text-[11px] p-2 rounded-lg bg-[#FFF2ED] border border-[#FFCCBC] text-[#9E3C25]">
              <span className="font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {activeEpisode.scope === 'widespread' ? 'Many stations rose together' : 'Only here'}
              </span>
              <span className="text-[10px]">
                {activeEpisode.concurrentElevatedStations} other stations elevated
              </span>
            </div>
          )}
        </div>

        {/* CASE NOTE CARD (Plain Sentences & Mandatory Honest Caveat) */}
        <div className="rounded-xl border border-[#CBBCA3] bg-[#FCF9F3] p-4 space-y-2.5 shadow-xs">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#C8553D]" />
            <h3 className="font-wordmark text-sm font-bold text-[#2B2A33]">
              Case Note
            </h3>
          </div>

          <div className="text-xs leading-relaxed text-[#2B2A33]">
            {activeEpisode ? (
              <div className="space-y-2">
                <p>
                  <strong>What looks unusual:</strong> At <strong>{currentTimestamp.replace('T', ' at ')} IST</strong>, monitoring equipment at {currentStation.name} registered{' '}
                  <strong className="text-[#C8553D]">{currentPm25 !== null ? `${currentPm25.toFixed(1)} µg/m³` : 'no signal'}</strong>.
                  This reading is significantly higher than the usual level for this hour ({currentMedian} µg/m³).
                </p>
                <p>
                  <strong>When it started:</strong> This rise began on {activeEpisode.startTime.replace('T', ' at ')} IST, reaching a peak of{' '}
                  <strong className="text-[#C8553D]">{activeEpisode.peakPm25.toFixed(1)} µg/m³</strong> at {activeEpisode.peakTime.replace('T', ' at ')} IST.
                </p>
                <p>
                  <strong>Citywide breadth:</strong> {activeEpisode.scope === 'widespread'
                    ? `Many stations rose together across Mumbai (${activeEpisode.concurrentElevatedStations} other monitoring stations elevated concurrently).`
                    : 'This rise occurred only here, with nearby stations remaining closer to their typical baseline.'}
                </p>
              </div>
            ) : currentPm25 !== null ? (
              <p>
                At {currentTimestamp.replace('T', ' at ')} IST, air at {currentStation.name} measures <strong>{currentPm25.toFixed(1)} µg/m³</strong>.
                This reading is {currentPm25 > currentMedian * 1.25 ? 'slightly higher than' : currentPm25 < currentMedian * 0.75 ? 'cleaner than' : 'consistent with'} what is usual for this hour ({currentMedian} µg/m³). No sustained anomaly is detected.
              </p>
            ) : (
              <p className="text-[#7A7885] italic">
                Sensor observation is currently unavailable at this station hour. Static mode active.
              </p>
            )}

            {/* MANDATORY RULE 2 HONESTY LINE */}
            <div className="mt-3 p-2.5 rounded-lg bg-[#EFE4CF] border-l-4 border-[#C8553D] text-[11px] text-[#4A4854]">
              <strong>Honesty note:</strong> We can&apos;t tell the cause from this data. These readings identify unusual statistical rises worth investigating, without claiming a source.
            </div>
          </div>

          {/* Genuine Recurring Pattern (Only if data supports it) */}
          {hasEveningRise && (
            <div className="mt-2 text-[11px] bg-[#EFE4CF] p-2.5 rounded-lg border border-[#D5C7B0] text-[#2B2A33] flex items-start gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#E9A23B] shrink-0 mt-0.5" />
              <span>
                <strong>Observed local pattern:</strong> Baseline values at {currentStation.name} typically rise by ~{Math.round(((eveningAvg - middayAvg) / middayAvg) * 100)}% between 20:00 and 23:00 IST as cooler nighttime air traps ambient particles near the ground.
              </span>
            </div>
          )}
        </div>

        {/* 24-HOUR PROFILE: USUAL DAY VS THIS DAY (Ribbon chart with visible gaps) */}
        <div className="rounded-xl border border-[#CBBCA3] bg-[#FCF9F3] p-4 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="font-wordmark text-sm font-bold text-[#2B2A33]">
              Usual Day vs. This Day
            </h3>
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="flex items-center gap-1 text-[#5A5766]">
                <span className="w-3 h-0.5 bg-[#8C7428] inline-block" /> Usual for this hour
              </span>
              <span className="flex items-center gap-1 text-[#C8553D]">
                <span className="w-3 h-0.5 bg-[#C8553D] inline-block" /> Today
              </span>
            </div>
          </div>

          {/* Band Legend */}
          <div className="flex items-center justify-between text-[9px] font-body text-[#7A7885] border-b border-[#E2D5BE] pb-1">
            <span className="text-[#1E6347] font-bold">Fresh (&lt;30)</span>
            <span className="text-[#8C5A14] font-bold">Hazy (60–120)</span>
            <span className="text-[#9E3C25] font-bold">Heavy (120–250)</span>
            <span className="text-[#781A2D] font-bold">Severe (&gt;250)</span>
          </div>

          {/* SVG Chart with Y-Axis and Visible Gaps */}
          <div className="h-32 w-full relative flex">
            {/* Plain Numbers Y-Axis */}
            <div className="w-7 h-full flex flex-col justify-between text-[8px] font-bold text-[#5A5766] py-1 text-right pr-1 select-none">
              <span>250</span>
              <span>120</span>
              <span>60</span>
              <span>0</span>
            </div>

            <div className="flex-1 h-full relative">
              <svg className="w-full h-full" viewBox="0 0 240 100" preserveAspectRatio="none">
                <defs>
                  <pattern id="caseGapHatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="4" stroke="#CBBCA3" strokeWidth="1" />
                  </pattern>
                </defs>

                {/* Horizontal Reference Lines */}
                <line x1="0" y1="76" x2="240" y2="76" stroke="#E2D5BE" strokeWidth="0.8" strokeDasharray="3,3" />
                <line x1="0" y1="52" x2="240" y2="52" stroke="#E2D5BE" strokeWidth="0.8" strokeDasharray="3,3" />
                <line x1="0" y1="0" x2="240" y2="0" stroke="#E2D5BE" strokeWidth="0.8" strokeDasharray="3,3" />

                {/* Usual Range Ribbon (IQR Band) */}
                {currentBaseline.length > 0 && (
                  <polygon
                    points={
                      currentBaseline
                        .map((b, idx) => `${idx * 10},${100 - Math.min(98, b.q75 * 0.38)}`)
                        .join(' ') +
                      ' ' +
                      currentBaseline
                        .slice()
                        .reverse()
                        .map((b, idx) => `${(23 - idx) * 10},${100 - Math.min(98, b.q25 * 0.38)}`)
                        .join(' ')
                    }
                    fill="#E9A23B"
                    opacity="0.18"
                  />
                )}

                {/* Usual Baseline Median Line */}
                {currentBaseline.length > 0 && (
                  <polyline
                    points={currentBaseline
                      .map((b, idx) => `${idx * 10},${100 - Math.min(98, b.median * 0.38)}`)
                      .join(' ')}
                    fill="none"
                    stroke="#8C7428"
                    strokeWidth="1.5"
                    strokeDasharray="2,2"
                  />
                )}

                {/* Visible Gaps for Missing Data (Hatched, never zero!) */}
                {today24Hours.map((item, idx) => {
                  if (item.val === null) {
                    return (
                      <g key={idx}>
                        <rect
                          x={idx * 10 - 4}
                          y="4"
                          width="8"
                          height="92"
                          fill="url(#caseGapHatch)"
                        />
                        <line
                          x1={idx * 10}
                          y1="4"
                          x2={idx * 10}
                          y2="96"
                          stroke="#C8553D"
                          strokeWidth="1"
                          strokeDasharray="2,2"
                          opacity="0.6"
                        />
                      </g>
                    );
                  }
                  return null;
                })}

                {/* Today's Reading Line (Contiguous Valid Segments) */}
                {(() => {
                  const segments: { x: number; y: number }[][] = [];
                  let currentSegment: { x: number; y: number }[] = [];

                  today24Hours.forEach((item, idx) => {
                    if (item.val !== null) {
                      currentSegment.push({
                        x: idx * 10,
                        y: 100 - Math.min(98, item.val * 0.38)
                      });
                    } else {
                      if (currentSegment.length > 0) {
                        segments.push(currentSegment);
                        currentSegment = [];
                      }
                    }
                  });
                  if (currentSegment.length > 0) {
                    segments.push(currentSegment);
                  }

                  return segments.map((seg, sIdx) => (
                    <polyline
                      key={sIdx}
                      points={seg.map(p => `${p.x},${p.y}`).join(' ')}
                      fill="none"
                      stroke="#C8553D"
                      strokeWidth="2.2"
                    />
                  ));
                })()}

                {/* Selected Hour Pin Marker (Position 23) */}
                {currentPm25 !== null && (
                  <g transform={`translate(230, ${100 - Math.min(98, currentPm25 * 0.38)})`}>
                    <circle r="4.5" fill="#C8553D" stroke="#FFF" strokeWidth="1.5" />
                    <circle r="8" fill="none" stroke="#C8553D" strokeWidth="1" opacity="0.6" className="animate-ping" />
                  </g>
                )}
              </svg>
            </div>
          </div>

          <div className="flex justify-between text-[8px] font-bold text-[#7A7885] pl-7">
            <span>24h ago</span>
            <span>18h ago</span>
            <span>12h ago</span>
            <span>6h ago</span>
            <span className="text-[#C8553D] font-extrabold">Selected Hour</span>
          </div>
        </div>

        {/* CREATE INVESTIGATION NOTE BUTTON (Case File Style) */}
        <div className="pt-1">
          <button
            onClick={() => setShowPrintModal(true)}
            className="w-full py-3 px-4 rounded-xl bg-[#EFE4CF] hover:bg-[#E5D7BF] text-[#2B2A33] border-2 border-[#CBBCA3] font-wordmark text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.99]"
          >
            <Printer className="w-4 h-4 text-[#C8553D]" />
            <span>Create Investigation Note</span>
          </button>
        </div>
      </div>

      {/* PRINTABLE ONE-PAGE CASE FILE MODAL */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-[#FAF6EE] text-[#2B2A33] rounded-xl shadow-2xl p-6 border-2 border-[#D5C7B0] print:border-none print:shadow-none">
            <button
              onClick={() => setShowPrintModal(false)}
              className="absolute top-4 right-4 text-[#7A7885] hover:text-black p-1 print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Case File Header */}
            <div className="border-b-2 border-[#2B2A33] pb-3 mb-4">
              <div className="flex justify-between items-baseline">
                <h1 className="text-xl font-bold font-wordmark tracking-tight text-[#2B2A33]">
                  HAWA.FM CASE FILE: AIR INVESTIGATION BRIEF
                </h1>
                <span className="font-bold text-xs text-[#C8553D] border border-[#C8553D] px-1.5 py-0.5 rounded uppercase">
                  Case Note
                </span>
              </div>
              <p className="text-xs text-[#5A5766] mt-0.5">
                Deterministic Ambient Air Quality Assessment Memo
              </p>
            </div>

            {/* Station Summary Details */}
            <div className="grid grid-cols-2 gap-2.5 text-xs font-body mb-4 bg-[#EFE4CF] p-3.5 rounded-lg border border-[#D5C7B0]">
              <div>
                <span className="text-[#5A5766] text-[10px] uppercase font-bold">Target Station</span>
                <p className="font-bold text-sm text-[#2B2A33]">{currentStation.fullName}</p>
              </div>
              <div>
                <span className="text-[#5A5766] text-[10px] uppercase font-bold">Observation Time</span>
                <p className="font-bold text-sm text-[#2B2A33]">{currentTimestamp.replace('T', ' ')} IST</p>
              </div>
              <div>
                <span className="text-[#5A5766] text-[10px] uppercase font-bold">Measured PM2.5</span>
                <p className="font-bold text-sm text-[#C8553D]">
                  {currentPm25 !== null ? `${currentPm25.toFixed(1)} µg/m³` : 'No Signal'}
                </p>
              </div>
              <div>
                <span className="text-[#5A5766] text-[10px] uppercase font-bold">Usual for this hour</span>
                <p className="font-bold text-sm text-[#2B2A33]">{currentMedian} µg/m³</p>
              </div>
            </div>

            {/* Plain Findings */}
            <div className="space-y-3 text-xs leading-relaxed text-[#2B2A33] mb-5">
              <h4 className="font-wordmark font-bold uppercase text-[#2B2A33] text-xs border-b border-[#D5C7B0] pb-1">
                Investigation Assessment
              </h4>
              <p>
                At {currentTimestamp.replace('T', ' ')} IST, monitoring equipment at {currentStation.name} recorded{' '}
                {currentPm25 !== null ? `${currentPm25.toFixed(1)} µg/m³` : 'no signal'}. This reading represents an elevation
                above what is usual for this hour.
              </p>
              <p>
                <strong>Concurrent Station Readings Across Mumbai:</strong>
                <br />
                {Object.entries(allStationCurrentValues)
                  .map(([sid, v]) => {
                    const st = stations.find(s => s.id === sid);
                    return `${st?.name || sid}: ${v !== null ? `${v.toFixed(1)} µg/m³` : 'No Signal'}`;
                  })
                  .join(' • ')}
              </p>

              {/* Mandatory Caveat */}
              <div className="bg-[#FFF2ED] border-l-4 border-[#C8553D] p-3 text-[11px] text-[#9E3C25] rounded-r-lg">
                <strong>Mandatory Regulatory Caveat (Honesty Rule):</strong>
                <br />
                We can&apos;t tell the cause from this data. These measurements identify unusual statistical rises worth physical on-ground inspection, without attributing causation to any specific industrial, vehicular, or weather source.
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 border-t border-[#D5C7B0] pt-3 print:hidden">
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg border border-[#CBBCA3] hover:bg-[#EFE4CF]"
              >
                Close
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-[#C8553D] text-white hover:bg-[#B3452E] flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Case File</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
