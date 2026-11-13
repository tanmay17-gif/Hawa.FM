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

  // Generate Card on Canvas (Vintage Mumbai Postcard Style)
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = (canvas.width = 600);
    const h = (canvas.height = 420);

    // Warm cream gouache paper background
    ctx.fillStyle = '#F6EFE2';
    ctx.fillRect(0, 0, w, h);

    // Outer warm border
    ctx.strokeStyle = '#C8553D';
    ctx.lineWidth = 4;
    ctx.strokeRect(16, 16, w - 32, h - 32);

    ctx.strokeStyle = '#D5C7B0';
    ctx.lineWidth = 1;
    ctx.strokeRect(22, 22, w - 44, h - 44);

    // Header Wordmark
    ctx.fillStyle = '#2B2A33';
    ctx.font = 'bold 30px "Fraunces", serif';
    ctx.fillText('Hawa.fm', 40, 64);

    ctx.fillStyle = '#C8553D';
    ctx.font = 'bold 12px "DM Sans", sans-serif';
    ctx.fillText(tagline.toUpperCase(), 40, 84);

    // Frequency Stamp Badge
    ctx.fillStyle = '#EFE4CF';
    ctx.fillRect(w - 160, 42, 120, 32);
    ctx.strokeStyle = '#CBBCA3';
    ctx.lineWidth = 1;
    ctx.strokeRect(w - 160, 42, 120, 32);

    ctx.fillStyle = '#2B2A33';
    ctx.font = 'bold 13px "DM Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(station.freqLabel, w - 100, 63);
    ctx.textAlign = 'left';

    // Painted Skyline Box
    const skyY = 105;
    const skyH = 160;
    const skyGrad = ctx.createLinearGradient(40, skyY, 40, skyY + skyH);
    skyGrad.addColorStop(0, '#7CB3D4');
    skyGrad.addColorStop(1, '#BDE0F5');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(40, skyY, w - 80, skyH);

    // Sea Link silhouette
    ctx.fillStyle = '#4E687C';
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

    // Worli high-rise blocks
    ctx.fillStyle = '#3B5266';
    ctx.fillRect(280, skyY + 30, 30, skyH - 30);
    ctx.fillRect(320, skyY + 50, 40, skyH - 50);
    ctx.fillRect(370, skyY + 20, 35, skyH - 20);
    ctx.fillRect(420, skyY + 60, 45, skyH - 60);

    // Sea
    ctx.fillStyle = '#2F7F86';
    ctx.fillRect(40, skyY + skyH - 20, w - 80, 20);

    // Smog tint based on PM2.5
    const hazeAlpha = Math.min(0.75, ((pm25 || 30) / 300) * 0.75);
    ctx.fillStyle = `rgba(200, 160, 120, ${hazeAlpha})`;
    ctx.fillRect(40, skyY, w - 80, skyH);

    // Station & Air Quality Details
    ctx.fillStyle = '#2B2A33';
    ctx.font = 'bold 20px "Fraunces", serif';
    ctx.fillText(station.name, 40, 305);

    ctx.fillStyle = '#5A5766';
    ctx.font = '12px "DM Sans", sans-serif';
    ctx.fillText(`${station.area} • ${timestamp} IST`, 40, 325);

    // Air Status Word
    ctx.fillStyle = '#C8553D';
    ctx.font = 'bold 26px "Fraunces", serif';
    ctx.fillText(airCategoryLabel, 40, 365);

    // PM2.5 value
    ctx.textAlign = 'right';
    ctx.fillStyle = '#2B2A33';
    ctx.font = 'bold 36px "DM Sans", sans-serif';
    ctx.fillText(pm25 !== null ? pm25.toFixed(1) : '--.-', w - 40, 345);

    ctx.fillStyle = '#5A5766';
    ctx.font = '12px "DM Sans", sans-serif';
    ctx.fillText('PM2.5 (µg/m³)', w - 40, 365);

    // Integrity Footnote
    ctx.textAlign = 'center';
    ctx.fillStyle = '#7A7885';
    ctx.font = '11px "DM Sans", sans-serif';
    ctx.fillText('Verified OpenAQ / Zindi Monitoring Data • Hawa.fm Mumbai', w / 2, 395);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto font-body">
      <div className="relative w-full max-w-lg bg-[#FAF6EE] text-[#2B2A33] rounded-2xl shadow-2xl p-5 border-2 border-[#D5C7B0]">
        <div className="flex items-center justify-between pb-3 border-b border-[#D5C7B0]">
          <div>
            <h3 className="font-wordmark text-base font-bold text-[#2B2A33]">
              Broadcast Postcard Card
            </h3>
            <p className="text-[11px] text-[#5A5766]">
              Shareable snapshot of Mumbai&apos;s current air
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#5A5766] hover:text-black hover:bg-[#EFE4CF]" aria-label="Close share card">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-4 flex justify-center overflow-hidden rounded-xl shadow-md border border-[#D5C7B0]">
          <canvas ref={canvasRef} className="w-full max-w-[500px] h-auto object-contain" />
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <button
            onClick={handleDownload}
            className="px-3.5 py-2 rounded-xl bg-[#EFE4CF] hover:bg-[#E5D7BF] text-[#2B2A33] border border-[#CBBCA3] font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download PNG</span>
          </button>
          <button
            onClick={handleShare}
            className="px-4 py-2 rounded-xl bg-[#C8553D] hover:bg-[#B3452E] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all"
          >
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'Saved!' : 'Share Postcard'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
