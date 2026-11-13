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

  // Atmospheric haze density (0.0 to 1.0)
  const hazeDensity = useMemo(() => {
    if (pm25 === null) return 0;
    return Math.min(1.0, Math.max(0.0, pm25 / 320.0));
  }, [pm25]);

  // Landmark visibility thresholds (Gouache flat-paper fading)
  // 1. Far Landmark: Bandra-Worli Sea Link vanishes first (starts fading > 45, gone by 180)
  const seaLinkOpacity = useMemo(() => {
    if (pm25 === null) return 0;
    if (pm25 < 45) return 0.95;
    if (pm25 > 190) return 0.04;
    return Math.max(0.04, 1.0 - (pm25 - 45) / 145.0);
  }, [pm25]);

  // 2. Mid Landmark: Worli / Lower Parel towers (starts fading > 85, faint by 300)
  const highriseOpacity = useMemo(() => {
    if (pm25 === null) return 0;
    if (pm25 < 75) return 1.0;
    if (pm25 > 320) return 0.16;
    return Math.max(0.16, 1.0 - (pm25 - 75) / 245.0 * 0.84);
  }, [pm25]);

  // 3. Foreground: Gateway of India & Promenade palms
  const gatewayOpacity = useMemo(() => {
    if (pm25 === null) return 0;
    if (pm25 < 180) return 1.0;
    return Math.max(0.55, 1.0 - (pm25 - 180) / 380.0 * 0.45);
  }, [pm25]);

  // Bird count driven strictly by PM2.5: fewer birds as air quality deteriorates!
  const birdCount = useMemo(() => {
    if (pm25 === null || isNight) return 0;
    if (pm25 < 30) return 7; // Clean air: flock of 7 birds
    if (pm25 < 60) return 5;
    if (pm25 < 120) return 3;
    if (pm25 < 200) return 1;
    return 0; // Heavy smog: birds retreat
  }, [pm25, isNight]);

  // Artistic Gouache Sky Palettes
  const skyBackground = useMemo(() => {
    if (isNight) {
      if (hazeDensity > 0.6) {
        // Murky night smog
        return 'linear-gradient(to bottom, #1D1E24 0%, #352B28 65%, #252220 100%)';
      }
      // Pristine coastal night
      return 'linear-gradient(to bottom, #131926 0%, #1A263B 60%, #24354D 100%)';
    } else if (isDusk) {
      if (hazeDensity > 0.6) {
        // Sepia dusty dusk
        return 'linear-gradient(to bottom, #543932 0%, #794D3B 50%, #614237 100%)';
      }
      // Vibrant Mumbai sunset
      return 'linear-gradient(to bottom, #392847 0%, #B84A39 40%, #E07A3B 75%, #F4B258 100%)';
    } else {
      // Daytime: Gouache cerulean shifting to dusty peach to smoky brown
      if (hazeDensity > 0.7) {
        return 'linear-gradient(to bottom, #8C7F72 0%, #B2A292 50%, #CFC0AF 100%)';
      }
      if (hazeDensity > 0.35) {
        return 'linear-gradient(to bottom, #6B8B9E 0%, #B8B09F 50%, #E3D1BA 100%)';
      }
      return 'linear-gradient(to bottom, #4A8EB5 0%, #7CB3D4 55%, #BDE0F5 100%)';
    }
  }, [isNight, isDusk, hazeDensity]);

  // Gouache Haze Fog Overlay
  const hazeFogStyle = useMemo(() => {
    const opacity = Math.min(0.86, hazeDensity * 0.9);
    let color = 'rgba(235, 215, 185, '; // warm gouache dusty peach
    if (hazeDensity > 0.6) color = 'rgba(145, 128, 110, '; // smoky brown-grey
    if (isNight) color = 'rgba(48, 42, 40, ';
    return {
      background: `linear-gradient(to top, ${color}${opacity}) 0%, ${color}${opacity * 0.6}) 40%, ${color}0) 100%)`
    };
  }, [hazeDensity, isNight]);

  // Particle simulation loop on canvas (ambient dust drift)
  useEffect(() => {
    if (pm25 === null) return;
    const canvas = particleCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let isVisible = true;
    const handleVis = () => { isVisible = !document.hidden; };
    document.addEventListener('visibilitychange', handleVis);

    const width = (canvas.width = canvas.parentElement?.clientWidth || 400);
    const height = (canvas.height = canvas.parentElement?.clientHeight || 220);

    const count = Math.min(90, Math.max(8, Math.floor((pm25 || 20) / 5)));
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * (hazeDensity > 0.5 ? 2.2 : 1.4) + 0.6,
      vx: (Math.random() - 0.25) * 0.35,
      vy: (Math.random() - 0.5) * 0.2,
      alpha: Math.random() * 0.35 + 0.1
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
        const pColor = isNight ? '225, 215, 200' : '120, 95, 75';
        ctx.fillStyle = `rgba(${pColor}, ${p.alpha * Math.min(0.9, hazeDensity + 0.25)})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener('visibilitychange', handleVis);
    };
  }, [pm25, hazeDensity, isNight]);

  // Missing data TV/radio static canvas loop
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
        const val = Math.random() > 0.5 ? 210 + Math.random() * 45 : Math.random() * 70;
        data[i] = val;     // R
        data[i + 1] = val; // G
        data[i + 2] = val; // B
        data[i + 3] = 240; // A
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
      className="relative w-full h-full overflow-hidden select-none font-sans rounded-md"
      style={{ background: skyBackground, transition: 'background 1.2s ease-in-out' }}
      aria-label={`Painted Mumbai skyline showing ambient air for ${stationName}`}
    >
      {/* Missing Signal Static State */}
      {pm25 === null ? (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#1B1917]/90">
          <canvas
            ref={staticCanvasRef}
            className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-screen"
          />
          <div className="relative z-10 text-center px-4 py-3 bg-[#EFE4CF] text-[#2B2A33] border-2 border-[#C8553D] rounded-lg shadow-xl">
            <div className="font-wordmark text-xs uppercase tracking-wider text-[#C8553D] font-bold mb-1 flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#C8553D] animate-ping inline-block" />
              NO SIGNAL — STATIC
            </div>
            <div className="text-[11px] font-body text-[#5A5766]">
              Observation unavailable at this station hour.
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Anomaly Glitch Pulse (Gentle paper tear / interference pulse) */}
          <AnimatePresence>
            {isAnomaly && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.45, 0.1, 0.6, 0], x: [0, -2, 2, 0] }}
                transition={{ duration: 0.7, repeat: 1 }}
                className="absolute inset-0 z-20 pointer-events-none mix-blend-color-burn bg-[#E9A23B]/30"
              />
            )}
          </AnimatePresence>

          {/* CELESTIAL BODIES: Sun / Moon & Birds (Positioned top-left, zero overlap with right badges) */}
          <div className="absolute inset-0 pointer-events-none">
            {isNight ? (
              <>
                {/* Night Stars */}
                <svg
                  className="absolute inset-0 w-full h-full"
                  style={{ opacity: Math.max(0.05, 1.0 - hazeDensity * 1.5) }}
                >
                  <circle cx="12%" cy="16%" r="1" fill="#FFF8E7" opacity="0.8" />
                  <circle cx="28%" cy="10%" r="1.2" fill="#FFF8E7" opacity="0.7" />
                  <circle cx="42%" cy="20%" r="0.8" fill="#FFF8E7" opacity="0.6" />
                  <circle cx="58%" cy="12%" r="1.1" fill="#FFF8E7" opacity="0.8" />
                  <circle cx="75%" cy="22%" r="0.9" fill="#FFF8E7" opacity="0.7" />
                </svg>
                {/* Gouache Paper Moon */}
                <div
                  className="absolute left-[20%] top-6 w-8 h-8 rounded-full bg-[#FFF5DC] shadow-[0_0_16px_rgba(255,245,220,0.5)] border border-[#E8DCC0]/40"
                  style={{
                    opacity: Math.max(0.35, 1.0 - hazeDensity * 0.65),
                    filter: `blur(${hazeDensity * 1.2}px)`
                  }}
                />
              </>
            ) : (
              <>
                {/* Drifting Gouache Clouds */}
                <motion.div
                  className="absolute top-4 left-0 w-24 h-6 rounded-full bg-white/40 blur-[1px]"
                  animate={{ x: ['-80px', '450px'] }}
                  transition={{ duration: 42, repeat: Infinity, ease: 'linear' }}
                  style={{ opacity: Math.max(0.15, 0.6 - hazeDensity * 0.4) }}
                />
                <motion.div
                  className="absolute top-10 left-0 w-32 h-7 rounded-full bg-white/30 blur-[1px]"
                  animate={{ x: ['-120px', '450px'] }}
                  transition={{ duration: 55, repeat: Infinity, ease: 'linear', delay: 15 }}
                  style={{ opacity: Math.max(0.15, 0.5 - hazeDensity * 0.4) }}
                />

                {/* Sun (Gouache Sun: warm gold shifting to burnt terracotta in smog) */}
                <div
                  className="absolute top-6 left-[20%] w-10 h-10 rounded-full"
                  style={{
                    background:
                      hazeDensity > 0.5
                        ? 'radial-gradient(circle, #C8553D 35%, #A83E28 85%)'
                        : isDusk
                        ? 'radial-gradient(circle, #E07A3B 40%, #B84A39 90%)'
                        : 'radial-gradient(circle, #FCE282 30%, #E9A23B 85%)',
                    boxShadow:
                      hazeDensity > 0.5
                        ? '0 0 10px rgba(200, 85, 61, 0.35)'
                        : '0 0 24px rgba(233, 162, 59, 0.55)',
                    opacity: Math.max(0.4, 1.0 - hazeDensity * 0.5)
                  }}
                />

                {/* Flying Coastal Birds (Count scales with PM2.5: fewer birds when air is worse!) */}
                {Array.from({ length: birdCount }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute pointer-events-none"
                    initial={{
                      x: -20 - i * 35,
                      y: 22 + (i % 3) * 12
                    }}
                    animate={{
                      x: ['-40px', '420px'],
                      y: [22 + (i % 3) * 12, 18 + (i % 3) * 12, 22 + (i % 3) * 12]
                    }}
                    transition={{
                      duration: 16 + i * 2,
                      repeat: Infinity,
                      ease: 'linear',
                      delay: i * 2.2
                    }}
                  >
                    <svg width="14" height="8" viewBox="0 0 14 8" fill="none">
                      <path
                        d="M0 4 Q3 0 7 4 Q11 0 14 4"
                        stroke={isNight ? '#3A4252' : '#2B2A33'}
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        opacity={Math.max(0.3, 0.8 - hazeDensity * 0.5)}
                      />
                    </svg>
                  </motion.div>
                ))}
              </>
            )}
          </div>

          {/* LAYER 1: Distant Bandra-Worli Sea Link (Flat-Paper Silhouette, Vanishes First) */}
          <div
            className="absolute inset-x-0 bottom-11 h-26 pointer-events-none transition-opacity duration-1000"
            style={{
              opacity: seaLinkOpacity,
              filter: `blur(${hazeDensity * 2.2}px)`
            }}
          >
            <svg
              className="w-full h-full"
              viewBox="0 0 800 130"
              preserveAspectRatio="none"
              fill="none"
            >
              {/* Twin Pylon Towers */}
              <path
                d="M 125 130 L 170 28 L 174 28 L 220 130 Z"
                fill={isNight ? '#162235' : '#4E687C'}
              />
              <path
                d="M 275 130 L 320 28 L 324 28 L 370 130 Z"
                fill={isNight ? '#162235' : '#4E687C'}
              />
              {/* Cable Fan Arrays */}
              <path
                d="M 172 32 L 95 130 M 172 42 L 115 130 M 172 52 L 135 130 M 172 32 L 250 130 M 172 42 L 230 130 M 172 52 L 210 130"
                stroke={isNight ? '#2A3C59' : '#738F9C'}
                strokeWidth="1.2"
                opacity="0.8"
              />
              <path
                d="M 322 32 L 245 130 M 322 42 L 265 130 M 322 52 L 285 130 M 322 32 L 400 130 M 322 42 L 380 130 M 322 52 L 360 130"
                stroke={isNight ? '#2A3C59' : '#738F9C'}
                strokeWidth="1.2"
                opacity="0.8"
              />
              {/* Deck Girder */}
              <line
                x1="0"
                y1="126"
                x2="800"
                y2="126"
                stroke={isNight ? '#1E2C42' : '#394E61'}
                strokeWidth="5"
              />
            </svg>
          </div>

          {/* LAYER 2: Worli / Lower Parel High-Rise Towers (Gouache Architectural Blocks) */}
          <div
            className="absolute inset-x-0 bottom-9 h-34 pointer-events-none transition-opacity duration-700"
            style={{
              opacity: highriseOpacity,
              filter: `blur(${hazeDensity * 1.4}px)`
            }}
          >
            <svg
              className="w-full h-full"
              viewBox="0 0 900 170"
              preserveAspectRatio="none"
              fill="none"
            >
              {/* Gouache Skyline Silhouettes */}
              <rect x="430" y="24" width="34" height="146" fill={isNight ? '#152033' : '#3B5266'} />
              <polygon points="430,24 447,8 464,24" fill={isNight ? '#152033' : '#3B5266'} />
              <rect x="478" y="46" width="42" height="124" fill={isNight ? '#1B2A42' : '#4C657A'} />
              <rect x="535" y="32" width="48" height="138" fill={isNight ? '#131D2E' : '#34495C'} />
              <rect x="602" y="56" width="36" height="114" fill={isNight ? '#19263B' : '#465E73'} />
              <rect x="652" y="38" width="44" height="132" fill={isNight ? '#121A29' : '#304354'} />
              <rect x="712" y="68" width="34" height="102" fill={isNight ? '#162133' : '#3E5569'} />
              <rect x="760" y="48" width="40" height="122" fill={isNight ? '#1B2A42' : '#4A6277'} />

              {/* Night Lit Windows */}
              {isNight && (
                <g fill="#FBE698" opacity={Math.max(0.15, 0.75 - hazeDensity * 0.5)}>
                  <rect x="438" y="38" width="3.5" height="4" />
                  <rect x="452" y="54" width="3.5" height="4" />
                  <rect x="488" y="62" width="4" height="4" />
                  <rect x="550" y="48" width="4" height="5" />
                  <rect x="566" y="75" width="4" height="5" />
                  <rect x="664" y="58" width="4" height="4" />
                  <rect x="772" y="66" width="3.5" height="4" />
                </g>
              )}
            </svg>
          </div>

          {/* LAYER 3: Historic Gateway of India & Swaying Coastal Palms */}
          <div
            className="absolute inset-x-0 bottom-4 h-26 pointer-events-none transition-opacity duration-500"
            style={{
              opacity: gatewayOpacity,
              filter: `blur(${hazeDensity * 0.6}px)`
            }}
          >
            <svg
              className="w-full h-full"
              viewBox="0 0 800 110"
              preserveAspectRatio="none"
              fill="none"
            >
              {/* Gateway of India Arch (Sandstone gouache) */}
              <g transform="translate(36, 18)">
                <path
                  d="M 12 92 L 12 30 Q 35 15 58 30 L 58 92 Z"
                  fill={isNight ? '#0E1724' : '#2A3C4D'}
                />
                <path
                  d="M 23 92 L 23 45 Q 35 30 47 45 L 47 92 Z"
                  fill={isNight ? '#070C14' : '#1A2733'}
                />
                <ellipse cx="35" cy="18" rx="14" ry="10" fill={isNight ? '#0E1724' : '#2A3C4D'} />
                <rect x="4" y="25" width="10" height="67" fill={isNight ? '#0E1724' : '#2A3C4D'} />
                <rect x="56" y="25" width="10" height="67" fill={isNight ? '#0E1724' : '#2A3C4D'} />
                <circle cx="9" cy="22" r="4.5" fill={isNight ? '#0E1724' : '#2A3C4D'} />
                <circle cx="61" cy="22" r="4.5" fill={isNight ? '#0E1724' : '#2A3C4D'} />
              </g>

              {/* Coastal Palm Trees (Swaying gracefully) */}
              <g transform="translate(130, 25)">
                <path d="M 10 75 Q 8 40 18 10" stroke={isNight ? '#0B131F' : '#1C2936'} strokeWidth="2.5" fill="none" />
                {/* Fronds */}
                <path d="M 18 10 Q 30 8 36 16" stroke={isNight ? '#0E1826' : '#2A4032'} strokeWidth="2" fill="none" />
                <path d="M 18 10 Q 26 2 28 -6" stroke={isNight ? '#0E1826' : '#2A4032'} strokeWidth="2" fill="none" />
                <path d="M 18 10 Q 8 2 0 -2" stroke={isNight ? '#0E1826' : '#2A4032'} strokeWidth="2" fill="none" />
                <path d="M 18 10 Q 6 12 -2 20" stroke={isNight ? '#0E1826' : '#2A4032'} strokeWidth="2" fill="none" />
              </g>

              {/* Promenade Sea Wall */}
              <path
                d="M 0 94 Q 180 90 400 92 T 800 94 L 800 110 L 0 110 Z"
                fill={isNight ? '#0A121C' : '#202E3B'}
              />
            </svg>
          </div>

          {/* LAYER 4: Sea Teal Arabian Sea with Bobbing Wooden Fishing Boats */}
          <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[#143B40] to-[#2F7F86] pointer-events-none">
            {/* Shimmer highlights */}
            <motion.div
              className="w-full h-full opacity-35 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-100/40 via-transparent to-transparent"
              animate={{ opacity: [0.2, 0.45, 0.2] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Bobbing Mumbai Koli Fishing Boat 1 */}
            <motion.div
              className="absolute bottom-2 left-[28%]"
              animate={{ y: [0, -2, 0], rotate: [-1, 1.5, -1] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ opacity: Math.max(0.3, 0.9 - hazeDensity * 0.5) }}
            >
              <svg width="22" height="14" viewBox="0 0 22 14" fill="none">
                <path d="M 2 8 L 20 8 L 17 13 L 5 13 Z" fill={isNight ? '#0D171C' : '#C8553D'} />
                <line x1="11" y1="2" x2="11" y2="8" stroke={isNight ? '#1F2C33' : '#EFE4CF'} strokeWidth="1" />
                <polygon points="11,2 18,5 11,8" fill={isNight ? '#1E2C33' : '#F6EFE2'} opacity="0.85" />
              </svg>
            </motion.div>

            {/* Bobbing Boat 2 (further in the bay) */}
            <motion.div
              className="absolute bottom-3 left-[62%]"
              animate={{ y: [0, -1.5, 0], rotate: [1, -1.2, 1] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              style={{ opacity: Math.max(0.15, 0.7 - hazeDensity * 0.6) }}
            >
              <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                <path d="M 1 6 L 15 6 L 13 10 L 3 10 Z" fill={isNight ? '#0D171C' : '#E9A23B'} />
                <line x1="8" y1="1" x2="8" y2="6" stroke={isNight ? '#1F2C33' : '#EFE4CF'} strokeWidth="0.8" />
                <polygon points="8,1 13,3.5 8,6" fill={isNight ? '#1E2C33' : '#F6EFE2'} opacity="0.8" />
              </svg>
            </motion.div>
          </div>

          {/* LAYER 5: Mumbai Local Train (Yellow/Maroon Western Railway Livery) */}
          <div className="absolute inset-x-0 bottom-4 h-6 pointer-events-none overflow-hidden">
            <motion.div
              className="absolute bottom-1 flex items-center space-x-1"
              animate={{ x: ['-220px', '950px'] }}
              transition={{ duration: 19, repeat: Infinity, ease: 'linear' }}
            >
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="w-13 h-3.5 rounded-xs flex items-center justify-between px-1 border border-black/40 shadow-xs"
                  style={{
                    backgroundColor: i === 0 || i === 5 ? '#E9A23B' : '#8B263E'
                  }}
                >
                  <div className="w-1.5 h-1 bg-[#F6EFE2]/90 rounded-xs" />
                  <div className="w-1.5 h-1 bg-[#F6EFE2]/90 rounded-xs" />
                  <div className="w-1.5 h-1 bg-[#F6EFE2]/90 rounded-xs" />
                </div>
              ))}
            </motion.div>
          </div>

          {/* ATMOSPHERIC HAZE SHROUD (Smooth Gouache Gradient) */}
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
