import React, { useEffect, useRef, useMemo } from 'react';

interface LivingSkylineProps {
  pm25: number | null;
  timestamp: string; // ISO format e.g. "2025-10-21T02:00"
  isAnomaly: boolean;
  stationName: string;
}

export const LivingSkyline: React.FC<LivingSkylineProps> = ({
  pm25,
  timestamp,
  isAnomaly
}) => {
  const particleCanvasRef = useRef<HTMLCanvasElement | null>(null);

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
    if (pm25 === null) return 0.2;
    return Math.min(1.0, Math.max(0.0, pm25 / 300.0));
  }, [pm25]);

  // Landmark visibility thresholds (Gouache fading strictly following real air quality)
  // 1. Far Landmark: Bandra-Worli Sea Link across the bay (starts fading > 40, vanished by 160)
  const seaLinkOpacity = useMemo(() => {
    if (pm25 === null) return 0.2;
    if (pm25 < 40) return 0.95;
    if (pm25 > 160) return 0.05;
    return Math.max(0.05, 1.0 - (pm25 - 40) / 120.0);
  }, [pm25]);

  // 2. Mid Landmark: Distinctive Mumbai High-Rises (Imperial Towers & Worli Skyline) (fading > 70)
  const highriseOpacity = useMemo(() => {
    if (pm25 === null) return 0.3;
    if (pm25 < 60) return 0.95;
    if (pm25 > 260) return 0.12;
    return Math.max(0.12, 1.0 - (pm25 - 60) / 200.0 * 0.85);
  }, [pm25]);

  // 3. Near Landmarks: Gateway of India & Taj Mahal Palace Hotel (starts fading in severe smog > 150)
  const gatewayOpacity = useMemo(() => {
    if (pm25 === null) return 0.5;
    if (pm25 < 150) return 1.0;
    return Math.max(0.45, 1.0 - (pm25 - 150) / 350.0 * 0.55);
  }, [pm25]);

  // Bird count responding to air quality (clean air = more birds, severe smog = birds retreat)
  const birdCount = useMemo(() => {
    if (pm25 === null || isNight) return 0;
    if (pm25 < 35) return 6;
    if (pm25 < 70) return 4;
    if (pm25 < 130) return 2;
    return 0; // Smog: birds disappear
  }, [pm25, isNight]);

  // Sky Palette based on time and haze
  const skyBackground = useMemo(() => {
    if (isNight) {
      if (hazeDensity > 0.6) {
        return 'linear-gradient(to bottom, #1D1E24 0%, #382B28 65%, #252220 100%)';
      }
      return 'linear-gradient(to bottom, #101726 0%, #1A273D 60%, #243750 100%)';
    } else if (isDusk) {
      if (hazeDensity > 0.6) {
        return 'linear-gradient(to bottom, #543A32 0%, #7A4E3B 50%, #634337 100%)';
      }
      return 'linear-gradient(to bottom, #392847 0%, #B84A39 40%, #E27B3B 75%, #F5B358 100%)';
    } else {
      // Daytime: Cerulean sky transitioning to dusty terracotta/grey as PM2.5 rises
      if (hazeDensity > 0.7) {
        return 'linear-gradient(to bottom, #8C7F72 0%, #B2A292 50%, #CFC0AF 100%)';
      }
      if (hazeDensity > 0.35) {
        return 'linear-gradient(to bottom, #6B8B9E 0%, #B8B09F 50%, #E3D1BA 100%)';
      }
      return 'linear-gradient(to bottom, #4A8EB5 0%, #7CB3D4 55%, #BDE0F5 100%)';
    }
  }, [isNight, isDusk, hazeDensity]);

  // Atmospheric haze fog style
  const hazeFogStyle = useMemo(() => {
    const opacity = Math.min(0.88, hazeDensity * (isAnomaly ? 1.05 : 0.92));
    let color = isAnomaly ? 'rgba(215, 140, 110, ' : 'rgba(235, 215, 185, '; // warm gouache dusty peach / anomaly tint
    if (hazeDensity > 0.6) color = isAnomaly ? 'rgba(165, 115, 95, ' : 'rgba(150, 130, 112, '; // smoky brown-grey
    if (isNight) color = isAnomaly ? 'rgba(58, 36, 32, ' : 'rgba(48, 42, 40, ';
    return {
      background: `linear-gradient(to top, ${color}${opacity}) 0%, ${color}${opacity * 0.6}) 45%, ${color}0) 100%)`
    };
  }, [hazeDensity, isNight, isAnomaly]);

  // Ambient dust particle drift simulation
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

    const count = Math.min(80, Math.max(6, Math.floor((pm25 || 20) / 6)));
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * (hazeDensity > 0.5 ? 2.2 : 1.3) + 0.6,
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

        ctx.fillStyle = hazeDensity > 0.5
          ? `rgba(165, 142, 120, ${p.alpha})`
          : `rgba(244, 237, 223, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener('visibilitychange', handleVis);
    };
  }, [pm25, hazeDensity]);

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      style={{ background: skyBackground }}
    >
      {/* ─── CELESTIAL BODY: Sun / Moon ───────────────────────────────────── */}
      <div
        className="absolute transition-all duration-700"
        style={{
          top: isNight ? '14%' : isDusk ? '22%' : '10%',
          right: isNight ? '18%' : '26%'
        }}
      >
        {isNight ? (
          <div className="relative w-8 h-8 rounded-full bg-[#FAF6EE] shadow-[0_0_12px_rgba(250,246,238,0.7)]">
            <div className="absolute inset-0 rounded-full bg-[#101726] translate-x-2 -translate-y-0.5" />
          </div>
        ) : (
          <div
            className="w-10 h-10 rounded-full transition-colors duration-700"
            style={{
              backgroundColor: hazeDensity > 0.6 ? '#B66C4D' : isDusk ? '#E27B3B' : '#E9A23B',
              boxShadow: hazeDensity > 0.6
                ? '0 0 10px rgba(182, 108, 77, 0.4)'
                : '0 0 24px rgba(233, 162, 59, 0.65)'
            }}
          />
        )}
      </div>

      {/* ─── SEAGULLS CIRCLING OVER ARABIAN SEA (fewer in smog) ─────────── */}
      {birdCount > 0 && (
        <div className="absolute inset-x-0 top-6 h-12 pointer-events-none opacity-70">
          {Array.from({ length: birdCount }).map((_, i) => (
            <svg
              key={i}
              className="absolute animate-pulse"
              style={{
                left: `${18 + i * 14}%`,
                top: `${(i % 3) * 10}px`,
                animationDelay: `${i * 0.4}s`
              }}
              width="14"
              height="8"
              viewBox="0 0 20 10"
              fill="none"
              stroke={isNight ? '#FAF6EE' : '#2D3B34'}
              strokeWidth="1.6"
            >
              <path d="M 0 6 Q 5 0 10 5 Q 15 0 20 6" />
            </svg>
          ))}
        </div>
      )}

      {/* ─── LAYER 1: BANDRA-WORLI SEA LINK (Disappears as PM2.5 rises) ──── */}
      <div
        className="absolute inset-x-0 bottom-12 h-28 pointer-events-none transition-opacity duration-700"
        style={{
          opacity: seaLinkOpacity,
          filter: `blur(${hazeDensity * 1.5}px)`
        }}
      >
        <svg className="w-full h-full" viewBox="0 0 800 130" preserveAspectRatio="none" fill="none">
          {/* Twin Diamond Pylons */}
          <path d="M 120 130 L 165 24 L 170 24 L 215 130 Z" fill={isNight ? '#162335' : '#4E687C'} />
          <path d="M 270 130 L 315 24 L 320 24 L 365 130 Z" fill={isNight ? '#162335' : '#4E687C'} />
          
          {/* Suspension Cable Arrays */}
          <path
            d="M 167 28 L 90 130 M 167 38 L 110 130 M 167 48 L 130 130 M 167 28 L 245 130 M 167 38 L 225 130 M 167 48 L 205 130"
            stroke={isNight ? '#2A3C59' : '#85A2B0'}
            strokeWidth="1.2"
            opacity="0.85"
          />
          <path
            d="M 317 28 L 240 130 M 317 38 L 260 130 M 317 48 L 280 130 M 317 28 L 395 130 M 317 38 L 375 130 M 317 48 L 355 130"
            stroke={isNight ? '#2A3C59' : '#85A2B0'}
            strokeWidth="1.2"
            opacity="0.85"
          />
          {/* Bridge Roadway Deck */}
          <line x1="0" y1="126" x2="800" y2="126" stroke={isNight ? '#1E2C42' : '#394E61'} strokeWidth="5" />
          {/* Tiny roadway lampposts */}
          <g stroke="#FBE698" strokeWidth="1" opacity={isNight ? 0.9 : 0.4}>
            <line x1="100" y1="124" x2="100" y2="121" />
            <line x1="150" y1="124" x2="150" y2="121" />
            <line x1="200" y1="124" x2="200" y2="121" />
            <line x1="250" y1="124" x2="250" y2="121" />
            <line x1="300" y1="124" x2="300" y2="121" />
            <line x1="350" y1="124" x2="350" y2="121" />
          </g>
        </svg>
      </div>

      {/* ─── LAYER 2: DISTINCTIVE MUMBAI HIGH-RISES (Imperial Towers & Worli) ── */}
      <div
        className="absolute inset-x-0 bottom-10 h-36 pointer-events-none transition-opacity duration-700"
        style={{
          opacity: highriseOpacity,
          filter: `blur(${hazeDensity * 1.2}px)`
        }}
      >
        <svg className="w-full h-full" viewBox="0 0 900 170" preserveAspectRatio="none" fill="none">
          {/* IMPERIAL TOWERS (Tardeo Twin Stepped Art-Deco Skyscrapers) */}
          {/* Tower 1 */}
          <g transform="translate(450, 0)">
            <rect x="0" y="45" width="38" height="125" fill={isNight ? '#162133' : '#3C5266'} />
            <rect x="4" y="28" width="30" height="17" fill={isNight ? '#1A273D' : '#455E75'} />
            <rect x="9" y="16" width="20" height="12" fill={isNight ? '#1E2E47' : '#526F8A'} />
            <rect x="15" y="6" width="8" height="10" fill={isNight ? '#223552' : '#5F7F9E'} />
            <line x1="19" y1="0" x2="19" y2="6" stroke="#5F7F9E" strokeWidth="2" />
          </g>
          {/* Tower 2 */}
          <g transform="translate(496, 0)">
            <rect x="0" y="45" width="38" height="125" fill={isNight ? '#162133' : '#3C5266'} />
            <rect x="4" y="28" width="30" height="17" fill={isNight ? '#1A273D' : '#455E75'} />
            <rect x="9" y="16" width="20" height="12" fill={isNight ? '#1E2E47' : '#526F8A'} />
            <rect x="15" y="6" width="8" height="10" fill={isNight ? '#223552' : '#5F7F9E'} />
            <line x1="19" y1="0" x2="19" y2="6" stroke="#5F7F9E" strokeWidth="2" />
          </g>

          {/* WORLI & PRABHADEVI COASTAL RESIDENTIAL TOWERS (Tiered & articulated crowns) */}
          {/* Worli Tower A */}
          <g transform="translate(548, 15)">
            <rect x="0" y="40" width="34" height="115" fill={isNight ? '#141E2E' : '#354859'} />
            <polygon points="0,40 17,20 34,40" fill={isNight ? '#182538' : '#40576B'} />
            <circle cx="17" cy="18" r="2.5" fill="#C8902A" />
          </g>
          {/* Worli Tower B with modern curved facade */}
          <g transform="translate(592, 30)">
            <path d="M 0 140 L 0 35 Q 20 20 40 35 L 40 140 Z" fill={isNight ? '#1B273B' : '#475E73'} />
            <rect x="6" y="22" width="28" height="13" fill={isNight ? '#1E2E47' : '#546F87'} />
          </g>
          {/* Lower Parel High-Rise C */}
          <g transform="translate(642, 20)">
            <rect x="0" y="45" width="32" height="105" fill={isNight ? '#131C29' : '#324454'} />
            <rect x="5" y="30" width="22" height="15" fill={isNight ? '#162133' : '#3C5266'} />
            <rect x="11" y="18" width="10" height="12" fill={isNight ? '#1B273B' : '#475E73'} />
          </g>
          {/* Marine Drive Art-Deco Block D */}
          <g transform="translate(684, 45)">
            <rect x="0" y="30" width="45" height="95" fill={isNight ? '#182436' : '#42586E'} />
            <circle cx="22" cy="18" r="8" fill={isNight ? '#182436' : '#42586E'} />
          </g>
          {/* High-Rise E */}
          <g transform="translate(738, 35)">
            <rect x="0" y="35" width="36" height="100" fill={isNight ? '#141E2E' : '#354859'} />
            <polygon points="0,35 18,15 36,35" fill={isNight ? '#182538' : '#40576B'} />
          </g>

          {/* RAJABAI CLOCK TOWER GOTHIC SPIRE SILHOUETTE */}
          <g transform="translate(405, 55)">
            <rect x="4" y="35" width="14" height="80" fill={isNight ? '#121A26' : '#2D3D4D'} />
            <polygon points="2,35 11,5 20,35" fill={isNight ? '#121A26' : '#2D3D4D'} />
            <circle cx="11" cy="48" r="3.5" fill="#FAF6EE" opacity={isNight ? 0.9 : 0.6} />
          </g>

          {/* Warm night window illuminations */}
          {isNight && (
            <g fill="#FBE698" opacity={Math.max(0.12, 0.8 - hazeDensity * 0.5)}>
              <rect x="458" y="55" width="4" height="4" />
              <rect x="472" y="75" width="4" height="4" />
              <rect x="504" y="60" width="4" height="4" />
              <rect x="520" y="85" width="4" height="4" />
              <rect x="556" y="68" width="4" height="4" />
              <rect x="604" y="62" width="4" height="5" />
              <rect x="652" y="70" width="4" height="4" />
              <rect x="696" y="80" width="4" height="4" />
            </g>
          )}
        </svg>
      </div>

      {/* ─── LAYER 3: FOREGROUND ICONIC MUMBAI (Gateway of India & Taj Mahal Palace) ── */}
      <div
        className="absolute inset-x-0 bottom-3 h-32 pointer-events-none transition-opacity duration-500"
        style={{
          opacity: gatewayOpacity,
          filter: `blur(${hazeDensity * 0.5}px)`
        }}
      >
        <svg className="w-full h-full" viewBox="0 0 850 120" preserveAspectRatio="none" fill="none">
          
          {/* 1. TAJ MAHAL PALACE HOTEL (Adjacent to Gateway on the water) */}
          <g transform="translate(30, 20)">
            {/* Main Palace Body with Venetian Gothic windows & Rust-Red Tiled Roof */}
            <rect x="0" y="32" width="95" height="68" fill={isNight ? '#161C24' : '#6A4A3C'} />
            {/* Wing roofs */}
            <polygon points="0,32 15,18 40,18 40,32" fill={isNight ? '#20181A' : '#8A3E2F'} />
            <polygon points="55,32 55,18 80,18 95,32" fill={isNight ? '#20181A' : '#8A3E2F'} />
            {/* FAMOUS CENTRAL FLORENTINE DOME (Red-Terracotta Iconic Dome) */}
            <path
              d="M 36 32 C 36 10, 48 -2, 48 -2 C 48 -2, 60 10, 60 32 Z"
              fill={isNight ? '#35181C' : '#B83A2E'}
            />
            {/* Dome Turret Finial */}
            <circle cx="48" cy="-5" r="2.5" fill="#C8902A" />
            <line x1="48" y1="-8" x2="48" y2="-3" stroke="#C8902A" strokeWidth="1.5" />
            
            {/* Corner Cupolas */}
            <ellipse cx="6" cy="18" rx="4" ry="5" fill={isNight ? '#2D1418' : '#A03428'} />
            <ellipse cx="89" cy="18" rx="4" ry="5" fill={isNight ? '#2D1418' : '#A03428'} />
            
            {/* Arched Balconies */}
            <g fill={isNight ? '#FCE394' : '#E8DDC9'} opacity={isNight ? 0.8 : 0.6}>
              <rect x="8" y="42" width="6" height="8" rx="2" />
              <rect x="22" y="42" width="6" height="8" rx="2" />
              <rect x="66" y="42" width="6" height="8" rx="2" />
              <rect x="80" y="42" width="6" height="8" rx="2" />
              <rect x="44" y="38" width="8" height="12" rx="3" />
            </g>
          </g>

          {/* 2. GATEWAY OF INDIA (Grand Basalt Stone Indo-Saracenic Monument) */}
          <g transform="translate(140, 16)">
            {/* Outer Basalt Gateway Frame */}
            <path
              d="M 10 84 L 10 26 L 22 26 L 22 18 L 86 18 L 86 26 L 98 26 L 98 84 Z"
              fill={isNight ? '#111720' : '#4A4036'}
            />
            {/* Central Grand Horseshoe Arch */}
            <path
              d="M 36 84 L 36 44 C 36 30, 72 30, 72 44 L 72 84 Z"
              fill={isNight ? '#080C12' : '#26201B'}
            />
            {/* Side Window Arches */}
            <path d="M 18 84 L 18 56 C 18 48, 30 48, 30 56 L 30 84 Z" fill={isNight ? '#080C12' : '#26201B'} />
            <path d="M 78 84 L 78 56 C 78 48, 90 48, 90 56 L 90 84 Z" fill={isNight ? '#080C12' : '#26201B'} />
            
            {/* Indo-Saracenic Central Dome & Corner Turrets with Fluted Domes */}
            <ellipse cx="54" cy="16" rx="14" ry="7" fill={isNight ? '#161F2B' : '#574C40'} />
            <circle cx="16" cy="18" r="4.5" fill={isNight ? '#161F2B' : '#574C40'} />
            <circle cx="92" cy="18" r="4.5" fill={isNight ? '#161F2B' : '#574C40'} />
            
            {/* Jharokha Intricate Jaali Band */}
            <line x1="22" y1="28" x2="86" y2="28" stroke="#7A6C5D" strokeWidth="2" strokeDasharray="3,2" />
          </g>

          {/* 3. COASTAL PROMENADE WITH PALM TREES & TETRAPODS */}
          <g transform="translate(255, 25)">
            {/* Swaying Queen's Necklace Palm */}
            <path d="M 12 75 Q 8 42 22 8" stroke={isNight ? '#0B131E' : '#233226'} strokeWidth="2.8" fill="none" />
            <path d="M 22 8 Q 36 4 44 14" stroke={isNight ? '#0E1926' : '#2E4733'} strokeWidth="2" fill="none" />
            <path d="M 22 8 Q 32 -3 34 -12" stroke={isNight ? '#0E1926' : '#2E4733'} strokeWidth="2" fill="none" />
            <path d="M 22 8 Q 12 0 2 -4" stroke={isNight ? '#0E1926' : '#2E4733'} strokeWidth="2" fill="none" />
            <path d="M 22 8 Q 8 14 0 22" stroke={isNight ? '#0E1926' : '#2E4733'} strokeWidth="2" fill="none" />
          </g>

          {/* Marine Drive Sea Wall & Classic Concrete Tetrapods along Coastline */}
          <path d="M 0 98 L 850 98 L 850 120 L 0 120 Z" fill={isNight ? '#0D141C' : '#283329'} />
          {/* Tetrapods */}
          <g fill={isNight ? '#16212E' : '#3E4D40'} stroke={isNight ? '#090E14' : '#1D261E'} strokeWidth="0.8">
            <polygon points="110,98 116,91 122,98 116,104" />
            <polygon points="124,99 130,92 136,99 130,105" />
            <polygon points="242,98 248,90 254,98 248,104" />
            <polygon points="256,99 262,91 268,99 262,105" />
            <polygon points="360,98 366,91 372,98 366,104" />
            <polygon points="374,99 380,92 386,99 380,105" />
          </g>
        </svg>
      </div>

      {/* ─── LAYER 4: ARABIAN SEA WITH WOODEN GATEWAY FERRY BOATS ───────── */}
      <div className="absolute inset-x-0 bottom-0 h-7 bg-gradient-to-t from-[#1A3832] via-[#2F5950] to-[#355C53] pointer-events-none">
        
        {/* Bobbing Wooden Gateway Ferry Boats (Iconic Mumbai coastal character) */}
        <div className="absolute left-40 bottom-1 flex items-center gap-10">
          {/* Ferry Boat 1 */}
          <div className="animate-bounce" style={{ animationDuration: '3.2s' }}>
            <svg width="34" height="18" viewBox="0 0 34 18" fill="none">
              {/* Wooden Hull */}
              <path d="M 2 12 Q 17 18 32 12 L 28 6 L 6 6 Z" fill={isNight ? '#10151C' : '#5C382A'} />
              {/* Passenger Canopy with striped awning */}
              <rect x="9" y="3" width="16" height="4" fill="#FAF6EE" />
              <rect x="12" y="3" width="4" height="4" fill="#B66C4D" />
              <rect x="20" y="3" width="4" height="4" fill="#B66C4D" />
              {/* Mast flag */}
              <line x1="17" y1="0" x2="17" y2="4" stroke="#FAF6EE" strokeWidth="1" />
            </svg>
          </div>

          {/* Ferry Boat 2 */}
          <div className="animate-bounce" style={{ animationDuration: '4.1s', animationDelay: '1.2s' }}>
            <svg width="26" height="15" viewBox="0 0 26 15" fill="none">
              <path d="M 2 10 Q 13 15 24 10 L 21 5 L 5 5 Z" fill={isNight ? '#0C1017' : '#4E3024'} />
              <rect x="7" y="2" width="12" height="3" fill="#FAF6EE" />
              <rect x="10" y="2" width="3" height="3" fill="#2F7F86" />
            </svg>
          </div>
        </div>

        {/* Gentle Arabian Sea wave crests */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#E8DDC9]/30 to-transparent" />
      </div>

      {/* ─── LAYER 5: AMBIENT AIR POLLUTION HAZE FOG OVERLAY ─────────────── */}
      <div className="absolute inset-0 pointer-events-none transition-all duration-700" style={hazeFogStyle} />

      {/* ─── LAYER 6: FLOATING AIR DUST PARTICLES (CANVAS) ────────────────── */}
      <canvas ref={particleCanvasRef} className="absolute inset-0 pointer-events-none" />

      {/* Subtle paper grain & vintage glass gloss */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/5 to-white/15" />
    </div>
  );
};
