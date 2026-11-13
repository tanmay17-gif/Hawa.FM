import React, { useRef } from 'react';
import { Station } from '../types';
import { radioAudio } from '../utils/audio';

interface FrequencyDialProps {
  stations: Station[];
  currentStationId: string;
  onSelectStation: (stationId: string) => void;
}

export const FrequencyDial: React.FC<FrequencyDialProps> = ({
  stations,
  currentStationId,
  onSelectStation
}) => {
  const dialRef = useRef<HTMLDivElement | null>(null);

  // Dial frequency bounds
  const minFreq = 89.0;
  const maxFreq = 107.0;
  const freqRange = maxFreq - minFreq;

  const currentStation = stations.find(s => s.id === currentStationId) || stations[0];
  const targetFreq = currentStation ? currentStation.frequency : 95.0;

  // Percentage position of needle
  const needlePct = Math.max(0, Math.min(100, ((targetFreq - minFreq) / freqRange) * 100));

  const handleDialClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dialRef.current || stations.length === 0) return;
    const rect = dialRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = Math.max(0, Math.min(1, clickX / rect.width));
    const clickedFreq = minFreq + clickRatio * freqRange;

    // Find closest station
    let closestStation = stations[0];
    let closestDist = Math.abs(stations[0].frequency - clickedFreq);

    for (let i = 1; i < stations.length; i++) {
      const dist = Math.abs(stations[i].frequency - clickedFreq);
      if (dist < closestDist) {
        closestDist = dist;
        closestStation = stations[i];
      }
    }

    if (closestStation.id !== currentStationId) {
      radioAudio.playStaticBurst(0.16, 0.08);
      radioAudio.playKnobClick();
      onSelectStation(closestStation.id);
    }
  };

  return (
    <div className="w-full select-none font-body">
      {/* Outer Dial Plate: Vintage Warm Sandpaper Inset */}
      <div
        ref={dialRef}
        onClick={handleDialClick}
        className="relative h-15 w-full rounded-lg cursor-pointer border border-[#CBBCA3] shadow-[inset_0_2px_4px_rgba(43,42,51,0.08),0_1px_2px_rgba(255,255,255,0.7)] overflow-hidden"
        style={{
          background: 'linear-gradient(to bottom, #EFE4CF 0%, #F6EFE2 50%, #E8DCC3 100%)'
        }}
        role="group"
        aria-label="Tuning Frequency Dial"
      >
        {/* Subtle glass reflection */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/5 pointer-events-none" />

        {/* Vintage Dial Frequency Numbers */}
        <div className="absolute inset-x-3 top-1 flex justify-between pointer-events-none text-[10px] font-bold text-[#4A4854] font-body">
          <span>89</span>
          <span>92</span>
          <span>95</span>
          <span>98</span>
          <span>101</span>
          <span>104</span>
          <span>107</span>
        </div>

        {/* Major & Minor Frequency Tick marks */}
        <div className="absolute inset-x-3 top-5 h-2.5 flex justify-between items-end pointer-events-none opacity-80">
          {Array.from({ length: 37 }).map((_, i) => {
            const isMajor = i % 6 === 0;
            const isMid = i % 3 === 0;
            return (
              <div
                key={i}
                className="w-0.5 rounded-xs"
                style={{
                  height: isMajor ? '11px' : isMid ? '7px' : '4px',
                  backgroundColor: isMajor ? '#C8553D' : '#8C7428'
                }}
              />
            );
          })}
        </div>

        {/* Station Markers along the Dial Face (z-20 in front of needle, letterpress badges) */}
        <div className="absolute inset-x-4 bottom-1 h-5 pointer-events-none z-20 flex justify-between">
          {stations.map(st => {
            const pos = ((st.frequency - minFreq) / freqRange) * 100;
            const isSelected = st.id === currentStationId;
            return (
              <div
                key={st.id}
                className="absolute -translate-x-1/2 flex flex-col items-center"
                style={{ left: `${pos}%` }}
              >
                <div
                  className={`text-[9px] font-bold tracking-tight px-1.5 py-0.5 rounded-sm transition-all shadow-xs ${
                    isSelected
                      ? 'bg-[#C8553D] text-[#F6EFE2] font-extrabold shadow-sm scale-105'
                      : 'bg-[#E5D7BF] text-[#2B2A33] border border-[#CBBCA3]'
                  }`}
                >
                  {st.name.replace(', Mumbai', '').split(' ')[0]}
                </div>
              </div>
            );
          })}
        </div>

        {/* Backlit Glow behind active needle */}
        <div
          className="absolute top-0 bottom-0 w-8 -translate-x-1/2 pointer-events-none transition-all duration-300 ease-out"
          style={{
            left: `${needlePct}%`,
            background: 'radial-gradient(ellipse at center, rgba(233,162,59,0.35) 0%, transparent 70%)'
          }}
        />

        {/* Moving Vintage Terracotta Tuning Needle (z-10, travels behind badges) */}
        <div
          className="absolute top-0 bottom-6 w-1 -translate-x-1/2 pointer-events-none transition-all duration-300 ease-out z-10"
          style={{ left: `${needlePct}%` }}
        >
          <div className="w-full h-full bg-[#C8553D] shadow-[0_0_4px_rgba(200,85,61,0.6)]" />
          <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2.5 h-1.5 bg-[#B38638] rounded-xs shadow-xs" />
        </div>
      </div>
    </div>
  );
};
