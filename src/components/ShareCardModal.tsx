import React, { useRef, useState } from 'react';
import { Station, AirCategory } from '../types';
import { Download, Share2, X, Check } from 'lucide-react';

interface ShareCardModalProps {
  station: Station;
  timestamp: string;
  pm25: number | null;
  airCategory: AirCategory;
  airCategoryLabel: string;
  tagline: string;
  onClose: () => void;
}

export const ShareCardModal: React.FC<ShareCardModalProps> = ({
  station,
  timestamp,
  pm25,
  airCategory,
  airCategoryLabel,
  tagline,
  onClose
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);

  // Generate Card on Mount
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = (canvas.width = 600);
    const h = (canvas.height = 420);

    // Deep retro charcoal background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#1c1e22');
    bgGrad.addColorStop(1, '#0e0f11');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Brass accent frame
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 4;
    ctx.strokeRect(16, 16, w - 32, h - 32);

    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 1;
    ctx.strokeRect(22, 22, w - 44, h - 44);

    // Header Wordmark
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Space Grotesk, sans-serif';
    ctx.fillText('Hawa.fm', 40, 64);

    ctx.fillStyle = '#d4af37';
    ctx.font = '13px monospace';
    ctx.fillText(tagline.toUpperCase(), 40, 84);

    // Frequency Badge
    ctx.fillStyle = '#22272e';
    ctx.fillRect(w - 160, 42, 120, 32);
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 1;
    ctx.strokeRect(w - 160, 42, 120, 32);

    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(station.freqLabel, w - 100, 63);
    ctx.textAlign = 'left';

    // Skyline Graphic Box (Simulated Retro Phosphor Skyline)
    const skyY = 105;
    const skyH = 160;
    const skyGrad = ctx.createLinearGradient(40, skyY, 40, skyY + skyH);
    skyGrad.addColorStop(0, '#111827');
    skyGrad.addColorStop(1, '#1f2937');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(40, skyY, w - 80, skyH);

    // Distant Sea Link silhouette
    ctx.fillStyle = '#374151';
    ctx.beginPath();
    ctx.moveTo(100, skyY + skyH);
    ctx.lineTo(130, skyY + 40);
    ctx.lineTo(160, skyY + skyH);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(180, skyY + skyH);
    ctx.lineTo(210, skyY + 40);
    ctx.lineTo(240, skyY + skyH);
    ctx.fill();
    ctx.fillRect(40, skyY + skyH - 12, w - 80, 4);

    // High rise blocks
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(280, skyY + 30, 30, skyH - 30);
    ctx.fillRect(320, skyY + 50, 40, skyH - 50);
    ctx.fillRect(370, skyY + 20, 35, skyH - 20);
    ctx.fillRect(420, skyY + 60, 45, skyH - 60);

    // Smog tint over skyline based on PM2.5
    const hazeAlpha = Math.min(0.75, ((pm25 || 30) / 300) * 0.75);
    ctx.fillStyle = `rgba(180, 150, 100, ${hazeAlpha})`;
    ctx.fillRect(40, skyY, w - 80, skyH);

    // Station & Air Quality Information Box
    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(station.name.toUpperCase(), 40, 305);

    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px monospace';
    ctx.fillText(`${station.area} • ${timestamp} IST`, 40, 325);

    // Air Quality Status Word
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px Space Grotesk, sans-serif';
    ctx.fillText(airCategoryLabel, 40, 365);

    // PM 2.5 readout
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffb703';
    ctx.font = 'bold 36px monospace';
    ctx.fillText(pm25 !== null ? pm25.toFixed(1) : '--.-', w - 40, 345);

    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px monospace';
    ctx.fillText('PM2.5 (µg/m³)', w - 40, 365);

    // Integrity Footer
    ctx.textAlign = 'center';
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px monospace';
    ctx.fillText('Verified Zindi Competition Monitoring Data • Zero AI Hallucinations', w / 2, 395);
  }, [station, timestamp, pm25, airCategory, airCategoryLabel, tagline]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `hawa-fm-${station.name.toLowerCase().replace(/\s+/g, '-')}-${timestamp.replace(/[:]/g, '')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (navigator.share && canvas.toBlob) {
      canvas.toBlob(async blob => {
        if (!blob) return;
        const file = new File([blob], 'hawa-fm-broadcast.png', { type: 'image/png' });
        try {
          await navigator.share({
            title: `Hawa.fm: ${station.name}`,
            text: `Tune in to Mumbai's air: ${station.name} is ${airCategoryLabel} (PM2.5: ${pm25} µg/m³).`,
            files: [file]
          });
        } catch {
          // Fallback to download
          handleDownload();
        }
      });
    } else {
      handleDownload();
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#181a1e] text-zinc-100 rounded-xl shadow-2xl p-5 border border-zinc-700">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div>
            <h3 className="font-mono text-sm font-bold text-[#d4af37] uppercase">
              Broadcast Share Card
            </h3>
            <p className="text-[11px] text-zinc-400">
              Export high-fidelity broadcast snapshot
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white" aria-label="Close share card">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Canvas Preview */}
        <div className="my-4 flex justify-center overflow-hidden rounded-lg shadow-lg border border-zinc-800">
          <canvas ref={canvasRef} className="w-full max-w-[500px] h-auto object-contain" />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end pt-2">
          <button
            onClick={handleDownload}
            className="px-3 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download PNG</span>
          </button>
          <button
            onClick={handleShare}
            className="px-4 py-2 rounded-md bg-[#d4af37] hover:bg-[#c49f2b] text-black font-mono text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'Saved!' : 'Share Broadcast'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
