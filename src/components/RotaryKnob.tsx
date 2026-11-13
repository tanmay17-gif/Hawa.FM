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
  ticks = 10,
  size = 52,
  ariaLabel
}) => {
  const knobRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startAngleRef = useRef<number>(0);
  const startValRef = useRef<number>(value);
  const lastClickValRef = useRef<number>(value);

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
    }

    if (nextVal !== value) {
      radioAudio.playKnobClick();
      onChange(nextVal);
    }
  };

  return (
    <div className="flex flex-col items-center select-none font-body">
      {/* Knob assembly with bezel */}
      <div className="relative flex items-center justify-center p-1">
        {/* Outer Bezel */}
        <div
          className="relative rounded-full flex items-center justify-center border border-[#2D3B34]/30 shadow-xs bg-[#EDE5D4]"
          style={{ width: size + 12, height: size + 12 }}
        >
          {/* Perimeter tick marks */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: ticks }).map((_, i) => {
              const tickAngle = -135 + (i / (ticks - 1)) * 270;
              return (
                <div
                  key={i}
                  className="absolute w-0.5 h-1 bg-[#2D3B34]/40 left-1/2 top-0.5"
                  style={{
                    transformOrigin: `50% ${(size + 12) / 2}px`,
                    transform: `translateX(-50%) rotate(${tickAngle}deg)`
                  }}
                />
              );
            })}
          </div>

          {/* Interactive Rotating Knob */}
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
            className="knob-cap rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing focus:outline-none focus:ring-1 focus:ring-[#A85C44]"
            style={{
              width: size,
              height: size,
              transform: `rotate(${currentRotation}deg)`
            }}
          >
            {/* Notch / indicator line */}
            <div className="absolute top-1 w-0.5 h-3 bg-[#A85C44] rounded-full shadow-xs" />
          </div>
        </div>
      </div>

      {/* Label & Sublabel */}
      <div className="text-center mt-0.5">
        <span className="block text-[9px] font-bold uppercase tracking-wider text-[#2D3B34] leading-tight">
          {label}
        </span>
        {sublabel && (
          <span className="block text-[8px] font-semibold text-[#5A6B60] leading-tight">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
};
