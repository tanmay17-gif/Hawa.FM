import React, { useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LivingSkylineProps {
  pm25: number | null;
  timestamp: string; // ISO format e.g. "2025-10-21T02:00"
  isAnomaly: boolean;
  stationName: string;
}

export const LivingSkyline: React.FC<LivingSkylineProps> = ({
  pm25,
  timestamp,
  isAnomaly,
  stationName
}) => {
  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const staticCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Extract hour of day (0-23)
  const hour = useMemo(() => {
    if (!timestamp) return 12;
    const parts = timestamp.split('T');
    if (parts.length > 1) {
      return parseInt(parts[1].split(':')[0], 10) || 12;
    }
    return 12;
  }, [timestamp]);

  const isNight = hour >= 20 || hour < 5;
  const isDusk = (hour >= 17 && hour < 20) || (hour >= 5 && hour < 7);

  // Atmospheric haze calculations based on PM2.5
  const hazeDensity = useMemo(() => {
    if (pm25 === null) return 0;
    // Normalized 0 to 1
    return Math.min(1.0, Math.max(0.0, pm25 / 350.0));
  }, [pm25]);

  // Visibility opacities for landmarks fading with PM2.5
  // Far landmark: Bandra-Worli Sea Link fades first (starting at 50, gone by 180)
  const seaLinkOpacity = useMemo(() => {
    if (pm25 === null) return 0;
    if (pm25 < 45) return 0.95;
    if (pm25 > 200) return 0.05;
    return Math.max(0.05, 1.0 - (pm25 - 45) / 155.0);
  }, [pm25]);

  // Mid-distant landmark: Worli high-rises fade next (starting at 100, faint by 300)
  const highriseOpacity = useMemo(() => {
    if (pm25 === null) return 0;
    if (pm25 < 80) return 1.0;
    if (pm25 > 350) return 0.15;
    return Math.max(0.15, 1.0 - (pm25 - 80) / 270.0 * 0.85);
  }, [pm25]);

  // Foreground landmarks: Gateway of India & Coastal Promenade
  const gatewayOpacity = useMemo(() => {
    if (pm25 === null) return 0;
    if (pm25 < 200) return 1.0;
    return Math.max(0.45, 1.0 - (pm25 - 200) / 400.0 * 0.55);
  }, [pm25]);

  // Color tones for sky & haze
  const skyBackground = useMemo(() => {
    if (isNight) {
      // Night: deep indigo-black, murky brownish-navy when polluted
      if (hazeDensity > 0.6) return 'linear-gradient(to bottom, #11141b 0%, #201a18 60%, #151111 100%)';
      return 'linear-gradient(to bottom, #070b14 0%, #0d1527 65%, #131c31 100%)';
    } else if (isDusk) {
      // Dusk: fiery amber/crimson shifting to dirty brick-dust haze
      if (hazeDensity > 0.6) return 'linear-gradient(to bottom, #4a2820 0%, #68361e 50%, #422619 100%)';
      return 'linear-gradient(to bottom, #2b1d3d 0%, #873d32 45%, #d96b27 75%, #ffb347 100%)';
    } else {
      // Daytime: clear cyan/cerulean shifting to murky golden-brown smog
      if (hazeDensity > 0.7) return 'linear-gradient(to bottom, #6e675b 0%, #8d7f6b 55%, #a69880 100%)';
      if (hazeDensity > 0.3) return 'linear-gradient(to bottom, #4f728c 0%, #9fa89e 50%, #d8caaf 100%)';
      return 'linear-gradient(to bottom, #1e5799 0%, #2989d8 50%, #7db9e8 100%)';
    }
  }, [isNight, isDusk, hazeDensity]);

  // Haze fog overlay gradient
  const hazeFogStyle = useMemo(() => {
    const opacity = Math.min(0.88, hazeDensity * 0.92);
    let color = 'rgba(215, 195, 160, '; // pale gold particulate
    if (hazeDensity > 0.6) color = 'rgba(120, 100, 80, '; // brownish grey smog
    if (isNight) color = 'rgba(40, 35, 35, ';
    return {
      background: `linear-gradient(to top, ${color}${opacity}) 0%, ${color}${opacity * 0.6}) 45%, ${color}0) 100%)`,
      backdropFilter: `blur(${hazeDensity * 4.5}px)`
    };
  }, [hazeDensity, isNight]);

  // Particle simulation loop on canvas
  useEffect(() => {
    if (pm25 === null) return;
    const canvas = particleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let isVisible = true;

    const handleVisibility = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const width = (canvas.width = canvas.parentElement?.clientWidth || 360);
    const height = (canvas.height = canvas.parentElement?.clientHeight || 220);

    // Number of floating smog particles scales with PM2.5 (from 15 to 120 particles)
    const count = Math.min(120, Math.max(12, Math.floor((pm25 || 20) / 4)));
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * (hazeDensity > 0.5 ? 2.5 : 1.5) + 0.8,
      vx: (Math.random() - 0.3) * 0.4, // gentle westerly drift
      vy: (Math.random() - 0.6) * 0.25,
      alpha: Math.random() * 0.4 + 0.1
    }));

    const render = () => {
      if (!isVisible) {
        animId = requestAnimationFrame(render);
        return;
      }
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x > width) p.x = 0;
        if (p.x < 0) p.x = width;
        if (p.y > height) p.y = 0;
        if (p.y < 0) p.y = height;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        const pColor = isNight ? '210, 200, 180' : '90, 75, 60';
        ctx.fillStyle = `rgba(${pColor}, ${p.alpha * Math.min(1.0, hazeDensity + 0.2)})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [pm25, hazeDensity, isNight]);

  // Missing data TV static canvas loop
  useEffect(() => {
    if (pm25 !== null) return;
    const canvas = staticCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let isVisible = true;
    const handleVis = () => { isVisible = !document.hidden; };
    document.addEventListener('visibilitychange', handleVis);

    const w = (canvas.width = 160);
    const h = (canvas.height = 100);
    const imgData = ctx.createImageData(w, h);
    const data = imgData.data;

    const renderStatic = () => {
      if (!isVisible) {
        animId = requestAnimationFrame(renderStatic);
        return;
      }
      for (let i = 0; i < data.length; i += 4) {
        const val = Math.random() > 0.5 ? 200 + Math.random() * 55 : Math.random() * 60;
        data[i] = val;     // R
        data[i + 1] = val; // G
        data[i + 2] = val; // B
        data[i + 3] = 255; // A
      }
      ctx.putImageData(imgData, 0, 0);
      animId = requestAnimationFrame(renderStatic);
    };

    renderStatic();

    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener('visibilitychange', handleVis);
    };
  }, [pm25]);

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none font-sans"
      style={{ background: skyBackground, transition: 'background 1.2s ease-in-out' }}
      aria-label={`Visual Mumbai skyline showing ambient air for ${stationName}`}
    >
      {/* Missing Signal Static State */}
      {pm25 === null ? (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80">
          <canvas
            ref={staticCanvasRef}
            className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen"
          />
          <div className="relative z-10 text-center px-4 py-3 bg-black/75 border border-red-500/60 rounded-md backdrop-blur-sm animate-pulse">
            <div className="font-mono text-xs uppercase tracking-widest text-red-400 font-bold mb-1 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
              NO SIGNAL — TUNING LOST
            </div>
            <div className="text-[11px] text-zinc-400 font-mono">
              Missing station observation at this hour.
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Anomaly Glitch Filter Overlay */}
          <AnimatePresence>
            {isAnomaly && (
              <motion.div
                initial={{ opacity: 0, scale: 1 }}
                animate={{ opacity: [0, 0.7, 0.2, 0.8, 0], x: [0, -3, 3, -1, 0] }}
                transition={{ duration: 0.8, repeat: 1 }}
                className="absolute inset-0 z-20 pointer-events-none mix-blend-exclusion bg-amber-500/20 border-2 border-amber-400/40"
              />
            )}
          </AnimatePresence>

          {/* CELESTIAL BODIES: Sun / Moon / Stars */}
          <div className="absolute inset-0 pointer-events-none">
            {isNight ? (
              <>
                {/* Night Stars (fade when haze increases) */}
                <svg
                  className="absolute inset-0 w-full h-full"
                  style={{ opacity: Math.max(0.05, 1.0 - hazeDensity * 1.5) }}
                >
                  <circle cx="15%" cy="18%" r="1" fill="#fff" opacity="0.8" />
                  <circle cx="28%" cy="12%" r="1.2" fill="#fff" opacity="0.6" />
                  <circle cx="45%" cy="22%" r="0.8" fill="#fff" opacity="0.7" />
                  <circle cx="65%" cy="15%" r="1.3" fill="#fff" opacity="0.9" />
                  <circle cx="80%" cy="25%" r="1" fill="#fff" opacity="0.7" />
                  <circle cx="92%" cy="14%" r="1.1" fill="#fff" opacity="0.8" />
                </svg>
                {/* Glowing Moon */}
                <div
                  className="absolute right-12 top-6 w-9 h-9 rounded-full bg-amber-100 shadow-[0_0_18px_rgba(255,245,210,0.6)]"
                  style={{
                    opacity: Math.max(0.3, 1.0 - hazeDensity * 0.7),
                    filter: `blur(${hazeDensity * 1.5}px)`,
                    transform: `scale(${1 - hazeDensity * 0.1})`
                  }}
                />
              </>
            ) : (
              /* Sun (dimmer and shifting orange in heavy smog) */
              <div
                className="absolute top-8 left-16 w-12 h-12 rounded-full"
                style={{
                  background:
                    hazeDensity > 0.5
                      ? 'radial-gradient(circle, #ff6b35 30%, #f77f00 70%, transparent 100%)'
                      : isDusk
                      ? 'radial-gradient(circle, #ff5e36 40%, #d62828 80%, transparent 100%)'
                      : 'radial-gradient(circle, #fff9a6 30%, #ffb703 70%, transparent 100%)',
                  boxShadow:
                    hazeDensity > 0.5
                      ? '0 0 15px rgba(247, 127, 0, 0.4)'
                      : '0 0 35px rgba(255, 183, 3, 0.7)',
                  filter: `blur(${hazeDensity * 2.2}px)`,
                  opacity: Math.max(0.35, 1.0 - hazeDensity * 0.5)
                }}
              />
            )}
          </div>

          {/* LAYER 1: Distant Sea Link (Deep Parallax, Fades First) */}
          <div
            className="absolute inset-x-0 bottom-12 h-28 pointer-events-none transition-opacity duration-1000"
            style={{
              opacity: seaLinkOpacity,
              filter: `blur(${hazeDensity * 3.0}px)`
            }}
          >
            <svg
              className="w-full h-full"
              viewBox="0 0 800 140"
              preserveAspectRatio="none"
              fill="none"
            >
              {/* Sea Link Cable-Stayed Pylons & Suspension cables */}
              <path
                d="M 120 140 L 170 30 L 175 30 L 225 140 Z"
                fill={isNight ? '#0a101f' : '#334155'}
              />
              <path
                d="M 270 140 L 320 30 L 325 30 L 375 140 Z"
                fill={isNight ? '#0a101f' : '#334155'}
              />
              {/* Stay cables */}
              <path
                d="M 172 35 L 90 140 M 172 45 L 110 140 M 172 55 L 130 140 M 173 35 L 255 140 M 173 45 L 235 140 M 173 55 L 215 140"
                stroke={isNight ? '#1e293b' : '#64748b'}
                strokeWidth="1.2"
                opacity="0.8"
              />
              <path
                d="M 322 35 L 240 140 M 322 45 L 260 140 M 322 55 L 280 140 M 323 35 L 405 140 M 323 45 L 385 140 M 323 55 L 365 140"
                stroke={isNight ? '#1e293b' : '#64748b'}
                strokeWidth="1.2"
                opacity="0.8"
              />
              {/* Bridge deck across bay */}
              <line
                x1="0"
                y1="134"
                x2="800"
                y2="134"
                stroke={isNight ? '#0f172a' : '#475569'}
                strokeWidth="6"
              />
              {/* Night warning beacon on pylon tips */}
              {isNight && (
                <>
                  <circle cx="172" cy="30" r="2.5" fill="#ef4444" className="animate-ping" />
                  <circle cx="322" cy="30" r="2.5" fill="#ef4444" className="animate-ping" />
                </>
              )}
            </svg>
          </div>

          {/* LAYER 2: Worli / Lower Parel High-Rise Silhouettes & Towers */}
          <div
            className="absolute inset-x-0 bottom-10 h-36 pointer-events-none transition-opacity duration-700"
            style={{
              opacity: highriseOpacity,
              filter: `blur(${hazeDensity * 1.8}px)`
            }}
          >
            <svg
              className="w-full h-full"
              viewBox="0 0 900 180"
              preserveAspectRatio="none"
              fill="none"
            >
              {/* Skyline Tower Blocks (Palais Royale, World One, Namaste Tower inspired forms) */}
              <rect x="420" y="20" width="36" height="160" fill={isNight ? '#0b1325' : '#1e293b'} />
              <polygon points="420,20 438,4 456,20" fill={isNight ? '#0b1325' : '#1e293b'} />
              <rect x="470" y="45" width="44" height="135" fill={isNight ? '#0f1a30' : '#283548'} />
              <rect x="530" y="30" width="50" height="150" fill={isNight ? '#0c1527' : '#1e293b'} />
              <rect x="600" y="55" width="38" height="125" fill={isNight ? '#0e182c' : '#2c3a4e'} />
              <rect x="650" y="35" width="45" height="145" fill={isNight ? '#091122' : '#1b2434'} />
              <rect x="710" y="70" width="35" height="110" fill={isNight ? '#0c162a' : '#232f41'} />
              <rect x="760" y="50" width="42" height="130" fill={isNight ? '#0f1a30' : '#283548'} />

              {/* Night illuminated windows */}
              {isNight && (
                <g fill="#fef08a" opacity={Math.max(0.15, 0.7 - hazeDensity * 0.5)}>
                  <rect x="428" y="35" width="3" height="4" />
                  <rect x="444" y="50" width="3" height="4" />
                  <rect x="428" y="75" width="3" height="4" />
                  <rect x="480" y="60" width="4" height="4" />
                  <rect x="495" y="80" width="4" height="4" />
                  <rect x="545" y="45" width="3" height="5" />
                  <rect x="560" y="70" width="3" height="5" />
                  <rect x="660" y="55" width="4" height="4" />
                  <rect x="675" y="90" width="4" height="4" />
                  <rect x="770" y="65" width="3" height="4" />
                </g>
              )}
            </svg>
          </div>

          {/* LAYER 3: Historic Gateway of India Silhouette & Marine Drive Sea Wall */}
          <div
            className="absolute inset-x-0 bottom-4 h-28 pointer-events-none transition-opacity duration-500"
            style={{
              opacity: gatewayOpacity,
              filter: `blur(${hazeDensity * 0.8}px)`
            }}
          >
            <svg
              className="w-full h-full"
              viewBox="0 0 800 120"
              preserveAspectRatio="none"
              fill="none"
            >
              {/* Gateway of India Arch & Domes (South Mumbai icon) */}
              <g transform="translate(40, 20)">
                {/* Central Arch */}
                <path
                  d="M 10 95 L 10 30 Q 35 15 60 30 L 60 95 Z"
                  fill={isNight ? '#060a12' : '#0f172a'}
                />
                <path
                  d="M 22 95 L 22 45 Q 35 30 48 45 L 48 95 Z"
                  fill={isNight ? '#03060a' : '#020617'}
                />
                {/* Flanking Turrets & Central Dome */}
                <ellipse cx="35" cy="18" rx="14" ry="10" fill={isNight ? '#060a12' : '#0f172a'} />
                <rect x="2" y="25" width="10" height="70" fill={isNight ? '#060a12' : '#0f172a'} />
                <rect x="58" y="25" width="10" height="70" fill={isNight ? '#060a12' : '#0f172a'} />
                <circle cx="7" cy="22" r="5" fill={isNight ? '#060a12' : '#0f172a'} />
                <circle cx="63" cy="22" r="5" fill={isNight ? '#060a12' : '#0f172a'} />
              </g>

              {/* Coastal Sea Wall / Promenade Tetrapods */}
              <path
                d="M 0 100 Q 150 95 350 98 T 800 100 L 800 120 L 0 120 Z"
                fill={isNight ? '#04070d' : '#090e17'}
              />
            </svg>
          </div>

          {/* LAYER 4: Western Railway Mumbai Local Train Track Crossing */}
          <div className="absolute inset-x-0 bottom-3 h-7 pointer-events-none overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 800 30" preserveAspectRatio="none">
              <line x1="0" y1="24" x2="800" y2="24" stroke="#334155" strokeWidth="2" />
            </svg>
            {/* The Mumbai Local Train (slow rhythmic commuter train passing across screen) */}
            <motion.div
              className="absolute bottom-2 flex items-center space-x-1"
              animate={{ x: ['-200px', '950px'] }}
              transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            >
              {/* Train Cars (Yellow & Maroon WR Livery) */}
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="w-14 h-4 rounded-sm flex items-center justify-between px-1 border border-black/40 shadow-sm"
                  style={{
                    backgroundColor: i === 0 || i === 5 ? '#f59e0b' : '#831843'
                  }}
                >
                  <div className="w-2 h-1.5 bg-sky-200/80 rounded-xs" />
                  <div className="w-2 h-1.5 bg-sky-200/80 rounded-xs" />
                  <div className="w-2 h-1.5 bg-sky-200/80 rounded-xs" />
                </div>
              ))}
            </motion.div>
          </div>

          {/* LAYER 5: Arabian Sea with Shimmer Reflections */}
          <div className="absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-[#051322] to-[#0d2a45]/80 pointer-events-none">
            <motion.div
              className="w-full h-full opacity-40 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-200/30 via-transparent to-transparent"
              animate={{ opacity: [0.2, 0.45, 0.2] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          {/* ATMOSPHERIC HAZE SHROUD (Continuous CSS Gradient & Blur) */}
          <div
            className="absolute inset-0 pointer-events-none transition-all duration-1000"
            style={hazeFogStyle}
          />

          {/* Canvas Floating Particulate Dust */}
          <canvas
            ref={particleCanvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none mix-blend-screen"
          />
        </>
      )}
    </div>
  );
};
