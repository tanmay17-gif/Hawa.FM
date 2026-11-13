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

  const minFreq = 89.0;
  const maxFreq = 107.0;
  const freqRange = maxFreq - minFreq;

  const currentStation = stations.find(s => s.id === currentStationId) || stations[0];
  const targetFreq = currentStation ? currentStation.frequency : 95.0;
  const needlePct = Math.max(0, Math.min(100, ((targetFreq - minFreq) / freqRange) * 100));

  const handleDialClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dialRef.current || stations.length === 0) return;
    const rect = dialRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = Math.max(0, Math.min(1, clickX / rect.width));
    const clickedFreq = minFreq + clickRatio * freqRange;

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
      radioAudio.playStaticBurst(0.14, 0.06);
      radioAudio.playKnobClick();
      onSelectStation(closestStation.id);
    }
  };

  return (
    <div className="w-full select-none font-body">
      {/* Dial Strip Container */}
      <div
        ref={dialRef}
        onClick={handleDialClick}
        className="relative h-9 sm:h-10 w-full rounded-md cursor-pointer border border-[#2D3B34]/30 shadow-inner overflow-hidden bg-[#EDE5D4]"
        role="group"
        aria-label="Radio Frequency Dial Strip"
      >
        {/* Frequency Numbers */}
        <div className="absolute inset-x-2 top-0.5 flex justify-between pointer-events-none text-[8px] sm:text-[9px] font-bold text-[#5A6B60]">
          <span>89</span>
          <span>92</span>
          <span>95</span>
          <span>98</span>
          <span>101</span>
          <span>104</span>
          <span>107</span>
        </div>

        {/* Frequency Ticks */}
        <div className="absolute inset-x-2 top-3 h-2 flex justify-between items-end pointer-events-none opacity-60">
          {Array.from({ length: 37 }).map((_, i) => (
            <div
              key={i}
              className="w-0.5"
              style={{
                height: i % 6 === 0 ? '8px' : i % 3 === 0 ? '5px' : '3px',
                backgroundColor: i % 6 === 0 ? '#A85C44' : '#2D3B34'
              }}
            />
          ))}
        </div>

        {/* Station Markers along Dial */}
        <div className="absolute inset-x-3 bottom-0.5 h-4 pointer-events-none z-20 flex justify-between">
          {stations.map(st => {
            const pos = ((st.frequency - minFreq) / freqRange) * 100;
            const isSelected = st.id === currentStationId;
            return (
              <div
                key={st.id}
                className="absolute -translate-x-1/2 flex flex-col items-center"
                style={{ left: `${pos}%` }}
              >
                <span
                  className={`text-[8px] font-bold px-1 py-0.2 rounded-xs transition-all ${
                    isSelected
                      ? 'bg-[#A85C44] text-white shadow-xs font-extrabold'
                      : 'bg-[#F3EBDD]/90 text-[#2D3B34] border border-[#2D3B34]/20'
                  }`}
                >
                  {st.name.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Moving Needle */}
        <div
          className="absolute top-0 bottom-0 w-0.5 -translate-x-1/2 pointer-events-none transition-all duration-300 ease-out z-10 bg-[#A85C44]"
          style={{ left: `${needlePct}%` }}
        >
          <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2 h-1 bg-[#8A3E28] rounded-xs" />
        </div>
      </div>
    </div>
  );
};
