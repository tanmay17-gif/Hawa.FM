import React, { useState, useEffect } from 'react';
import {
  Station,
  AirCategory,
  ModeBadge,
  Language,
  StationBaseline,
  AnomalyEpisode,
  MajorEvent,
  AmiData,
  TimelineData,
  PresetMoment
} from '../types';
import { RadioMode } from './modes/RadioMode';
import { DetectMode } from './modes/DetectMode';
import { SeismoMode } from './modes/SeismoMode';
import { ReplayMode } from './modes/ReplayMode';

export type LcdMode = 'radio' | 'detect' | 'seismo' | 'replay';

interface LcdScreenProps {
  activeMode: LcdMode;
  currentStation: Station;
  currentTimestamp: string;
  pm25: number | null;
  airCategory: AirCategory;
  modeBadge: ModeBadge;
  isAnomaly: boolean;
  anomalyScope?: 'isolated' | 'widespread';
  language: Language;
  onSelectLanguage: (lang: Language) => void;
  categoryLabels: Record<AirCategory, string>;
  bulletinHeadline: string;
  bulletinFullText: string;
  isSpeaking: boolean;
  isLoadingVoice: boolean;
  audioProgress: number;
  isMuted: boolean;
  onTriggerListen: () => void;
  onToggleMute: () => void;
  onOpenDetect: () => void;

  // Detect Mode props
  stations: Station[];
  onSelectStation: (id: string) => void;
  baselines: Record<string, StationBaseline>;
  anomalies: Record<string, AnomalyEpisode[]>;
  allStationCurrentValues: Record<string, number | null>;
  today24Hours: { hour: number; val: number | null }[];
  onOpenPrintModal: () => void;
  onJumpToReplay?: (timestamp: string, stationId: string) => void;

  // Seismo Mode props
  events: MajorEvent[];
  amiData: AmiData | null;
  selectedEventId: string;
  onSelectEvent: (id: string) => void;
  allHourlyValues: Record<string, (number | null)[]>;
  onJumpToEvent: (ts: string, stationId: string) => void;

  // Replay Mode props
  timeline: TimelineData;
  timeIndex: number;
  isPlaying: boolean;
  presets: PresetMoment[];
  onTogglePlay: () => void;
  onTimeChange: (newIdx: number) => void;
  onSelectPreset: (preset: PresetMoment) => void;
  onJumpToLatest: () => void;
  onReturnToRadio: () => void;
}

export const LcdScreen: React.FC<LcdScreenProps> = (props) => {
  const { activeMode } = props;
  const [staticBurstKey, setStaticBurstKey] = useState<number>(0);

  // Trigger tuning static burst whenever mode switches
  useEffect(() => {
    setStaticBurstKey(prev => prev + 1);
  }, [activeMode]);

  return (
    <div className="lcd-container w-full min-h-0 h-auto md:h-full relative flex flex-col justify-between overflow-visible md:overflow-hidden">
      {/* Tuning static burst cross-fade overlay */}
      <div key={staticBurstKey} className="lcd-static-overlay" />

      {/* Dedicated Mode Content */}
      <div className="w-full flex-1 min-h-0 flex flex-col">
        {activeMode === 'radio' && (
          <RadioMode
            currentStation={props.currentStation}
            currentTimestamp={props.currentTimestamp}
            pm25={props.pm25}
            airCategory={props.airCategory}
            modeBadge={props.modeBadge}
            isAnomaly={props.isAnomaly}
            anomalyScope={props.anomalyScope}
            categoryLabels={props.categoryLabels}
            bulletinHeadline={props.bulletinHeadline}
            bulletinFullText={props.bulletinFullText}
            language={props.language}
            onSelectLanguage={props.onSelectLanguage}
            isSpeaking={props.isSpeaking}
            isLoadingVoice={props.isLoadingVoice}
            audioProgress={props.audioProgress}
            isMuted={props.isMuted}
            onTriggerListen={props.onTriggerListen}
            onToggleMute={props.onToggleMute}
            onOpenDetect={props.onOpenDetect}
          />
        )}

        {activeMode === 'detect' && (
          <DetectMode
            stations={props.stations}
            currentStation={props.currentStation}
            onSelectStation={props.onSelectStation}
            currentTimestamp={props.currentTimestamp}
            currentPm25={props.pm25}
            baselines={props.baselines}
            anomalies={props.anomalies}
            allStationCurrentValues={props.allStationCurrentValues}
            today24Hours={props.today24Hours}
            events={props.events}
            onOpenPrintModal={props.onOpenPrintModal}
            onJumpToReplay={props.onJumpToReplay}
          />
        )}

        {activeMode === 'seismo' && (
          <SeismoMode
            events={props.events}
            amiData={props.amiData}
            selectedEventId={props.selectedEventId}
            onSelectEvent={props.onSelectEvent}
            stations={props.stations}
            allHourlyValues={props.allHourlyValues}
            onJumpToEvent={props.onJumpToEvent}
            currentStation={props.currentStation}
            currentTimestamp={props.currentTimestamp}
            pm25={props.pm25}
            baselines={props.baselines}
            today24Hours={props.today24Hours}
            onSelectStation={props.onSelectStation}
          />
        )}

        {activeMode === 'replay' && (
          <ReplayMode
            currentStation={props.currentStation}
            currentTimestamp={props.currentTimestamp}
            pm25={props.pm25}
            airCategory={props.airCategory}
            categoryLabels={props.categoryLabels}
            timeline={props.timeline}
            timeIndex={props.timeIndex}
            isPlaying={props.isPlaying}
            presets={props.presets}
            onTogglePlay={props.onTogglePlay}
            onTimeChange={props.onTimeChange}
            onSelectPreset={props.onSelectPreset}
            onJumpToLatest={props.onJumpToLatest}
            onReturnToRadio={props.onReturnToRadio}
          />
        )}
      </div>
    </div>
  );
};
