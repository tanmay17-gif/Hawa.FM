import React from 'react';
import { Station } from '../types';
import { X, Printer, FileText } from 'lucide-react';

interface InvestigationNoteModalProps {
  currentStation: Station;
  currentTimestamp: string;
  currentPm25: number | null;
  currentMedian: number;
  stations: Station[];
  allStationCurrentValues: Record<string, number | null>;
  onClose: () => void;
}

export const InvestigationNoteModal: React.FC<InvestigationNoteModalProps> = ({
  currentStation,
  currentTimestamp,
  currentPm25,
  currentMedian,
  stations,
  allStationCurrentValues,
  onClose
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#FAF6EE] text-[#2D3B34] rounded-xl shadow-2xl p-6 border-2 border-[#D5C7B0] print:border-none print:shadow-none font-body">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#5A6B60] hover:text-[#2D3B34] p-1 print:hidden cursor-pointer"
          aria-label="Close Case File"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Case File Header */}
        <div className="border-b-2 border-[#2D3B34] pb-3 mb-4">
          <div className="flex justify-between items-baseline">
            <h1 className="text-xl font-bold font-serif tracking-tight text-[#2D3B34] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#A85C44]" />
              HAWA.FM CASE FILE: AIR INVESTIGATION
            </h1>
            <span className="font-bold text-xs text-[#A85C44] border border-[#A85C44] px-1.5 py-0.5 rounded uppercase">
              Case Note
            </span>
          </div>
          <p className="text-xs text-[#5A6B60] mt-0.5">
            Deterministic Ambient Air Quality Assessment Memo • Station #{currentStation.id}
          </p>
        </div>

        {/* Station Summary Details */}
        <div className="grid grid-cols-2 gap-2.5 text-xs font-body mb-4 bg-[#EFE4CF] p-3.5 rounded-lg border border-[#D5C7B0]">
          <div>
            <span className="text-[#5A6B60] text-[10px] uppercase font-bold">Target Station</span>
            <p className="font-bold text-sm text-[#2D3B34]">{currentStation.fullName}</p>
          </div>
          <div>
            <span className="text-[#5A6B60] text-[10px] uppercase font-bold">Observation Time</span>
            <p className="font-bold text-sm text-[#2D3B34]">{currentTimestamp.replace('T', ' ')} IST</p>
          </div>
          <div>
            <span className="text-[#5A6B60] text-[10px] uppercase font-bold">Measured PM2.5</span>
            <p className="font-bold text-sm text-[#A85C44]">
              {currentPm25 !== null ? `${currentPm25.toFixed(1)} µg/m³` : 'No Signal'}
            </p>
          </div>
          <div>
            <span className="text-[#5A6B60] text-[10px] uppercase font-bold">Usual for this hour</span>
            <p className="font-bold text-sm text-[#2D3B34]">{currentMedian} µg/m³</p>
          </div>
        </div>

        {/* Plain Findings */}
        <div className="space-y-3 text-xs leading-relaxed text-[#2D3B34] mb-5">
          <h4 className="font-bold uppercase text-[#2D3B34] text-xs border-b border-[#D5C7B0] pb-1">
            Investigation Assessment
          </h4>
          <p>
            At {currentTimestamp.replace('T', ' ')} IST, monitoring equipment at {currentStation.name} recorded{' '}
            {currentPm25 !== null ? `${currentPm25.toFixed(1)} µg/m³` : 'no signal'}.
            {currentPm25 !== null && currentPm25 > currentMedian * 1.3
              ? ` This reading represents a significant elevation above typical historical baseline.`
              : ` This reading is in line with baseline levels.`}
          </p>
          <div>
            <strong>Concurrent Network Status Across Mumbai:</strong>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {Object.entries(allStationCurrentValues).map(([sid, v]) => {
                const st = stations.find(s => s.id === sid);
                return (
                  <span key={sid} className="px-2 py-0.5 rounded bg-[#EFE4CF] border border-[#D5C7B0] text-[11px]">
                    {st?.name || sid}: <strong>{v !== null ? `${v.toFixed(1)} µg/m³` : 'No Signal'}</strong>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Mandatory Honesty Rule */}
          <div className="bg-[#FDF2EE] border-l-4 border-[#A85C44] p-3 text-[11px] text-[#8A3E28] rounded-r-lg">
            <strong>Mandatory Honesty Rule:</strong>
            <br />
            We can't tell the cause from this data. These measurements identify unusual statistical rises worth physical on-ground inspection, without attributing causation to any specific industrial, vehicular, or weather source.
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-2 border-t border-[#D5C7B0] pt-3 print:hidden">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-bold rounded-lg border border-[#CBBCA3] hover:bg-[#EFE4CF] cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-1.5 text-xs font-bold rounded-lg bg-[#A85C44] text-white hover:bg-[#8A3E28] flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Case File</span>
          </button>
        </div>
      </div>
    </div>
  );
};

