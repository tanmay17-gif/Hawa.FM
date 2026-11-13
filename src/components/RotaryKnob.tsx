import React, { useRef, useState } from 'react';
import { radioAudio } from '../utils/audio';

interface RotaryKnobProps {
  label: string;
  sublabel?: string;
  value: number; // current value index or angle
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
  size = 80,
  ariaLabel
}) => {
  const knobRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startAngleRef = useRef<number>(0);
  const startValRef = useRef<number>(value);
  const lastClickValRef = useRef<number>(value);

  // Map value to angle (-135 deg to +135 deg, 270 deg sweep)
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
    <div className="flex flex-col items-center select-none font-sans">
      {/* Knob Dial Assembly */}
      <div className="relative p-2 flex items-center justify-center">
        {/* Outer Circular Bezel with brushed bronze finish */}
        <div
          className="relative rounded-full flex items-center justify-center shadow-lg"
          style={{
            width: size + 16,
            height: size + 16,
            background: 'radial-gradient(circle at 35% 30%, #4a453e 0%, #22201d 60%, #151412 100%)',
            boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), 0 4px 10px rgba(0,0,0,0.6)'
          }}
        >
          {/* Tick marks around perimeter */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: ticks }).map((_, i) => {
              const tickAngle = -135 + (i / (ticks - 1)) * 270;
              return (
                <div
                  key={i}
                  className="absolute w-0.5 h-1.5 bg-[#d4af37]/60 left-1/2 top-1 origin-[50%_44px]"
                  style={{
                    transform: `translateX(-50%) rotate(${tickAngle}deg)`
                  }}
                />
              );
            })}
          </div>

          {/* Interactive Rotating Knob Body */}
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
            className="relative rounded-full cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-[#d4af37] transition-shadow"
            style={{
              width: size,
              height: size,
              background: 'radial-gradient(circle at 40% 35%, #3e3f43 0%, #1d1e22 75%, #121316 100%)',
              boxShadow: isDragging
                ? '0 0 12px rgba(212,175,55,0.4), 0 2px 5px rgba(0,0,0,0.8)'
                : '0 4px 8px rgba(0,0,0,0.7), inset 0 2px 3px rgba(255,255,255,0.15)',
              transform: `rotate(${currentRotation}deg)`,
              transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0.9, 0.3, 1)'
            }}
          >
            {/* Ribbed Knurling Texture Effect */}
            <div className="absolute inset-1 rounded-full border border-zinc-700/50 pointer-events-none" />

            {/* Brushed Brass Center Cap */}
            <div
              className="absolute inset-3 rounded-full flex items-center justify-center shadow-inner"
              style={{
                background: 'conic-gradient(from 180deg at 50% 50%, #b89028 0deg, #f5d77f 90deg, #99741a 180deg, #fce08b 270deg, #b89028 360deg)'
              }}
            >
              <div className="w-4 h-4 rounded-full bg-[#1b1c1e] shadow-inner" />
            </div>

            {/* Indicator Marker Notch */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-3.5 bg-amber-400 rounded-full shadow-[0_0_4px_#ffb703]" />
          </div>
        </div>
      </div>

      {/* Tactile Brass Plate Label */}
      <div className="mt-1 text-center">
        <div className="text-[11px] font-bold tracking-widest text-[#d4af37] uppercase font-mono drop-shadow">
          {label}
        </div>
        {sublabel && (
          <div className="text-[9px] text-zinc-400 font-mono tracking-tight">
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
};
