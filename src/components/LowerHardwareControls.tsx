import React, { useRef } from 'react';
import { Station } from '../types';
import { Volume2, VolumeX, Radio } from 'lucide-react';
import { radioAudio } from '../utils/audio';

interface LowerHardwareControlsProps {
  volume: number; // 0 to 100
  onVolumeChange: (vol: number) => void;
  stations: Station[];
  currentStationId: string;
  onSelectStation: (stationId: string) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const LowerHardwareControls: React.FC<LowerHardwareControlsProps> = ({
  volume,
  onVolumeChange,
  stations,
  currentStationId,
  onSelectStation,
  isMuted,
  onToggleMute
}) => {
  const tuningTrackRef = useRef<HTMLDivElement | null>(null);

  // Frequency range
  const minFreq = 89.0;
  const maxFreq = 107.0;
  const freqRange = maxFreq - minFreq;

  const currentStation = stations.find(s => s.id === currentStationId) || stations[0];
  const targetFreq = currentStation ? currentStation.frequency : 95.0;
  const needlePct = Math.max(0, Math.min(100, ((targetFreq - minFreq) / freqRange) * 100));

  // Tuning track click handler
  const handleTuningClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tuningTrackRef.current || stations.length === 0) return;
    const rect = tuningTrackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const clickedFreq = minFreq + ratio * freqRange;

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
      radioAudio.playStaticBurst(0.14, 0.06);
      radioAudio.playKnobClick();
      onSelectStation(closestStation.id);
    }
  };

  return (
    <div className="w-full pt-1.5 flex flex-col sm:flex-row items-center gap-3 justify-between select-none font-sans shrink-0">
      
      {/* ─── ELONGATED VOLUME CONTROL ───────────────────────────────────── */}
      <div className="w-full sm:w-56 flex flex-col gap-1 p-2 rounded-xl bg-[#FAF6EE] border-2 border-[#343B35]/20 shadow-xs">
        <div className="flex items-center justify-between text-[10px] font-bold text-[#343B35]">
          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleMute}
              className="hover:text-[#B66C4D] transition-colors cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
              aria-label={isMuted ? 'Unmute volume' : 'Mute volume'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-[#B66C4D]" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-[#343B35]" />
              )}
            </button>
            <span className="uppercase tracking-wider">VOLUME</span>
          </div>
          <span className="font-mono text-[9px] text-[#343B35]/70">
            {isMuted ? 'MUTED' : `${volume}%`}
          </span>
        </div>

        {/* Elongated Horizontal Slider */}
        <div className="relative flex items-center h-4">
          <input
            type="range"
            min="0"
            max="100"
            step="2"
            value={isMuted ? 0 : volume}
            onChange={(e) => onVolumeChange(parseInt(e.target.value, 10))}
            className="w-full accent-[#B66C4D] cursor-pointer h-2 bg-[#E8DDC9] rounded-full border border-[#343B35]/25"
            aria-label="Adjust radio audio volume"
          />
        </div>
      </div>

      {/* ─── ELONGATED TUNING CONTROL ──────────────────────────────────── */}
      <div className="w-full flex-1 flex flex-col gap-1 p-2 rounded-xl bg-[#FAF6EE] border-2 border-[#343B35]/20 shadow-xs">
        <div className="flex items-center justify-between text-[10px] font-bold text-[#343B35]">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-[#B66C4D]" />
            <span className="uppercase tracking-wider">TUNING</span>
            <span className="text-[9px] font-semibold text-[#343B35]/70">
              ({currentStation.name} • {currentStation.freqLabel})
            </span>
          </div>
          <span className="text-[9px] text-[#343B35]/60 hidden md:inline">
            Tap scale to switch station
          </span>
        </div>

        {/* Elongated Curved Frequency Track */}
        <div
          ref={tuningTrackRef}
          onClick={handleTuningClick}
          className="relative h-6 sm:h-7 w-full rounded-full cursor-pointer border border-[#343B35]/30 shadow-inner overflow-hidden bg-[#E8DDC9]"
          role="slider"
          aria-label="Tuning Frequency Scale"
          aria-valuemin={minFreq}
          aria-valuemax={maxFreq}
          aria-valuenow={targetFreq}
        >
          {/* Frequency Numbers */}
          <div className="absolute inset-x-3 top-0 flex justify-between pointer-events-none text-[8px] font-bold text-[#343B35]/70 font-mono">
            <span>89</span>
            <span>92</span>
            <span>95</span>
            <span>98</span>
            <span>101</span>
            <span>104</span>
            <span>107</span>
          </div>

          {/* Scale Ticks */}
          <div className="absolute inset-x-3 top-2.5 h-1.5 flex justify-between items-end pointer-events-none opacity-60">
            {Array.from({ length: 37 }).map((_, i) => (
              <div
                key={i}
                className="w-0.5 rounded-full"
                style={{
                  height: i % 6 === 0 ? '7px' : i % 3 === 0 ? '4px' : '2px',
                  backgroundColor: i % 6 === 0 ? '#B66C4D' : '#343B35'
                }}
              />
            ))}
          </div>

          {/* Station Labels along Dial */}
          <div className="absolute inset-x-4 bottom-0.5 h-3.5 pointer-events-none z-20 flex justify-between">
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
                    className={`text-[7px] font-bold px-1 py-0.2 rounded transition-all ${
                      isSelected
                        ? 'bg-[#B66C4D] text-white shadow-xs font-extrabold'
                        : 'bg-[#FAF6EE]/90 text-[#343B35] border border-[#343B35]/20'
                    }`}
                  >
                    {st.name.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Movable Tuning Indicator Needle */}
          <div
            className="absolute top-0 bottom-0 w-0.5 -translate-x-1/2 pointer-events-none transition-all duration-300 ease-out z-10 bg-[#B66C4D]"
            style={{ left: `${needlePct}%` }}
          >
            <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2 h-1 bg-[#8C472E] rounded-full shadow-xs" />
          </div>
        </div>
      </div>
    </div>
  );
};

