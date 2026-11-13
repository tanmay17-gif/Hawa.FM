import React, { useRef, useState } from 'react';
import { radioAudio } from '../utils/audio';

interface RotaryKnobProps {
  label: string;
  sublabel?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (newValue: number) => void;
  ticks?: number;
  size?: number;
  ariaLabel: string;
}

export const RotaryKnob: React.FC<RotaryKnobProps> = ({
  label,
  sublabel,
  value,
  min,
  max,
  step = 1,
  onChange,
  ticks = 12,
  size = 72,
  ariaLabel
}) => {
  const knobRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startAngleRef = useRef<number>(0);
  const startValRef = useRef<number>(value);
  const lastClickValRef = useRef<number>(value);

  // Map value to angle (-135 deg to +135 deg)
  const range = max - min || 1;
  const normalized = Math.max(0, Math.min(1, (value - min) / range));
  const currentRotation = -135 + normalized * 270;

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    if (knobRef.current) {
      const rect = knobRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const angle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
      startAngleRef.current = angle;
      startValRef.current = value;
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !knobRef.current) return;
    const rect = knobRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const currentAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);

    let deltaAngle = currentAngle - startAngleRef.current;
    if (deltaAngle > 180) deltaAngle -= 360;
    if (deltaAngle < -180) deltaAngle += 360;

    const deltaVal = (deltaAngle / 270) * range;
    let nextVal = Math.round((startValRef.current + deltaVal) / step) * step;
    nextVal = Math.max(min, Math.min(max, nextVal));

    if (nextVal !== value) {
      if (Math.abs(nextVal - lastClickValRef.current) >= step) {
        radioAudio.playKnobClick();
        lastClickValRef.current = nextVal;
      }
      onChange(nextVal);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    let nextVal = value;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault();
      nextVal = Math.min(max, value + step);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault();
      nextVal = Math.max(min, value - step);
    } else if (e.key === 'PageUp') {
      e.preventDefault();
      nextVal = Math.min(max, value + step * 5);
    } else if (e.key === 'PageDown') {
      e.preventDefault();
      nextVal = Math.max(min, value - step * 5);
    }

    if (nextVal !== value) {
      radioAudio.playKnobClick();
      onChange(nextVal);
    }
  };

  return (
    <div className="flex flex-col items-center select-none font-body">
      {/* Knob Dial Assembly */}
      <div className="relative p-1.5 flex items-center justify-center">
        {/* Outer Bezel with warm sandalwood & cream finish */}
        <div
          className="relative rounded-full flex items-center justify-center shadow-md border border-[#CBBCA3]"
          style={{
            width: size + 16,
            height: size + 16,
            background: 'radial-gradient(circle at 40% 30%, #F6EFE2 0%, #E7D8BF 75%, #D4C3A7 100%)',
            boxShadow: '0 3px 6px rgba(43,42,51,0.08), inset 0 1px 2px rgba(255,255,255,0.8)'
          }}
        >
          {/* Tick marks around perimeter */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: ticks }).map((_, i) => {
              const tickAngle = -135 + (i / (ticks - 1)) * 270;
              return (
                <div
                  key={i}
                  className="absolute w-0.5 h-1.5 bg-[#8C7428]/60 left-1/2 top-1 origin-[50%_40px]"
                  style={{
                    transform: `translateX(-50%) rotate(${tickAngle}deg)`
                  }}
                />
              );
            })}
          </div>

          {/* Interactive Rotating Chunky Knob Body */}
          <div
            ref={knobRef}
            tabIndex={0}
            role="slider"
            aria-label={ariaLabel}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={value}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onKeyDown={handleKeyDown}
            className="relative rounded-full cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-[#C8553D] transition-shadow border border-[#B8A88E]"
            style={{
              width: size,
              height: size,
              background: 'radial-gradient(circle at 35% 30%, #FFFFFF 0%, #EFE4CF 60%, #DFCDB0 100%)',
              boxShadow: isDragging
                ? '0 0 10px rgba(200,85,61,0.3), inset 0 1px 2px rgba(255,255,255,0.9)'
                : '0 3px 6px rgba(43,42,51,0.12), inset 0 2px 2px rgba(255,255,255,0.9)',
              transform: `rotate(${currentRotation}deg)`,
              transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0.9, 0.3, 1)'
            }}
          >
            {/* Ribbed knurling rim */}
            <div className="absolute inset-1 rounded-full border border-[#D5C7B0]/60 pointer-events-none" />

            {/* Brushed Brass Center Medallion */}
            <div
              className="absolute inset-3 rounded-full flex items-center justify-center border border-[#99741a]/30 shadow-inner"
              style={{
                background: 'conic-gradient(from 180deg at 50% 50%, #B89028 0deg, #F5D77F 90deg, #99741A 180deg, #FCE08B 270deg, #B89028 360deg)'
              }}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-[#EFE4CF] shadow-xs" />
            </div>

            {/* Tactile Terracotta Indicator Marker */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-3 bg-[#C8553D] rounded-full shadow-xs" />
          </div>
        </div>
      </div>

      {/* Hand-lettered Style Label */}
      <div className="mt-1 text-center">
        <div className="text-[12px] font-bold tracking-wide text-[#2B2A33] font-body">
          {label}
        </div>
        {sublabel && (
          <div className="text-[10px] text-[#5A5766] font-body">
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
};
