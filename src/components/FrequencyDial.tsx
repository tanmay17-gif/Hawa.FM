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
    <div className="w-full select-none font-sans">
      {/* Outer Dial Plate: Vintage Cream with Brass Inset */}
      <div
        ref={dialRef}
        onClick={handleDialClick}
        className="relative h-14 w-full rounded-md cursor-pointer border border-[#8c7438] shadow-[inset_0_2px_4px_rgba(0,0,0,0.6),0_1px_1px_rgba(255,255,255,0.1)] overflow-hidden"
        style={{
          background: 'linear-gradient(to bottom, #ded4ba 0%, #f4eddc 40%, #e2d7be 100%)'
        }}
        role="group"
        aria-label="Tuning Frequency Dial"
      >
        {/* Subtle glass reflection gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-black/10 pointer-events-none" />

        {/* Vintage Dial Frequency Markings & Ticks */}
        <div className="absolute inset-x-2 top-1 flex justify-between pointer-events-none text-[9px] font-mono font-bold text-zinc-700">
          <span>89</span>
          <span>92</span>
          <span>95</span>
          <span>98</span>
          <span>101</span>
          <span>104</span>
          <span>107</span>
        </div>

        {/* Major & Minor Frequency Tick marks */}
        <div className="absolute inset-x-3 top-5 h-2.5 flex justify-between items-end pointer-events-none opacity-70">
          {Array.from({ length: 37 }).map((_, i) => {
            const isMajor = i % 6 === 0;
            const isMid = i % 3 === 0;
            return (
              <div
                key={i}
                className="w-0.5"
                style={{
                  height: isMajor ? '10px' : isMid ? '6px' : '3.5px',
                  backgroundColor: isMajor ? '#78350f' : '#92400e'
                }}
              />
            );
          })}
        </div>

        {/* Station Markers along the Dial Face */}
        <div className="absolute inset-x-4 bottom-1 h-5 pointer-events-none">
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
                  className={`text-[8px] font-mono uppercase font-bold tracking-tight px-1 py-0.5 rounded transition-colors ${
                    isSelected
                      ? 'bg-amber-800 text-amber-100 shadow-sm'
                      : 'text-zinc-600'
                  }`}
                >
                  {st.name.split(' ')[0]}
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
            background: 'radial-gradient(ellipse at center, rgba(245,158,11,0.3) 0%, transparent 70%)'
          }}
        />

        {/* Moving Vintage Orange Brass Tuning Needle */}
        <div
          className="absolute top-0 bottom-0 w-1 -translate-x-1/2 pointer-events-none transition-all duration-300 ease-out z-10"
          style={{ left: `${needlePct}%` }}
        >
          <div className="w-full h-full bg-red-600 shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
          <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2.5 h-1.5 bg-[#d4af37] rounded-xs" />
          <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-2.5 h-1.5 bg-[#d4af37] rounded-xs" />
        </div>
      </div>
    </div>
  );
};
