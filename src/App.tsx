import { useState, useEffect, useMemo } from 'react';
import {
  Station,
  TimelineData,
  StationBaseline,
  AnomalyEpisode,
  MajorEvent,
  AmiData,
  PresetMoment,
  AirCategory,
  Language,
  ModeBadge
} from './types';
import { LcdScreen, LcdMode } from './components/LcdScreen';
import { LowerHardwareControls } from './components/LowerHardwareControls';
import { InvestigationNoteModal } from './components/InvestigationNoteModal';
import { ShareCardModal } from './components/ShareCardModal';
import { AboutModal } from './components/AboutModal';
import { OnboardingHint } from './components/OnboardingHint';
import { radioAudio, AudioSourceType } from './utils/audio';
import { generateScript } from './utils/scriptGenerator';
import {
  Radio as RadioIcon,
  Compass,
  Activity,
  RotateCcw,
  Info,
  Share2
} from 'lucide-react';

export default function App() {
  // Precomputed pipeline data state
  const [stations, setStations] = useState<Station[]>([]);
  const [timeline, setTimeline] = useState<TimelineData | null>(null);
  const [hourlyData, setHourlyData] = useState<Record<string, (number | null)[]>>({});
  const [baselines, setBaselines] = useState<Record<string, StationBaseline>>({});
  const [anomalies, setAnomalies] = useState<Record<string, AnomalyEpisode[]>>({});
  const [events, setEvents] = useState<MajorEvent[]>([]);
  const [amiData, setAmiData] = useState<AmiData | null>(null);
  const [presets, setPresets] = useState<PresetMoment[]>([]);
  const [i18nDict, setI18nDict] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Single Source of Truth state
  const [selectedStationId, setSelectedStationId] = useState<string>('11611'); // Malad West default
  const [timeIndex, setTimeIndex] = useState<number>(0);
  const [activeMode, setActiveMode] = useState<LcdMode>('radio');
  const [selectedEventId, setSelectedEventId] = useState<string>('event_1');
  const [isPlayingReplay, setIsPlayingReplay] = useState<boolean>(false);
  const [language, setLanguage] = useState<Language>('en');
  const [volumePercent, setVolumePercent] = useState<number>(80);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Voice engine state
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isLoadingVoice, setIsLoadingVoice] = useState<boolean>(false);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const [, setVoiceError] = useState<string | null>(null);
  const [, setActiveAudioSource] = useState<AudioSourceType>('browser');

  // Modals
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showAboutModal, setShowAboutModal] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  // Initial Data Fetch
  useEffect(() => {
    async function loadData() {
      try {
        const [
          stRes,
          tlRes,
          hrRes,
          blRes,
          anRes,
          evRes,
          amiRes,
          prRes,
          enRes,
          hiRes,
          mrRes,
          diRes
        ] = await Promise.all([
          fetch('/data/stations.json').then(r => r.json()),
          fetch('/data/timeline.json').then(r => r.json()),
          fetch('/data/hourly.json').then(r => r.json()),
          fetch('/data/baselines.json').then(r => r.json()),
          fetch('/data/anomalies.json').then(r => r.json()),
          fetch('/data/events.json').then(r => r.json()),
          fetch('/data/ami.json').then(r => r.json()),
          fetch('/data/presets.json').then(r => r.json()),
          fetch('/i18n/en.json').then(r => r.json()),
          fetch('/i18n/hi.json').then(r => r.json()),
          fetch('/i18n/mr.json').then(r => r.json()),
          fetch('/data/date_index.json').then(r => r.json())
        ]);

        setStations(stRes);
        setTimeline(tlRes);
        setHourlyData(hrRes);
        setBaselines(blRes);
        setAnomalies(anRes);
        setEvents(evRes);
        setAmiData(amiRes);
        setPresets(prRes);
        setI18nDict({ en: enRes, hi: hiRes, mr: mrRes });
        void diRes; // date_index loaded for future use

        if (tlRes && tlRes.timestamps.length > 0) {
          setTimeIndex(tlRes.timestamps.length - 1);
        }

        const visited = localStorage.getItem('hawafm_visited_v4');
        if (!visited) {
          setShowOnboarding(true);
          localStorage.setItem('hawafm_visited_v4', 'true');
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error loading Hawa.fm data pipeline artifacts:', err);
      }
    }
    loadData();
  }, []);

  // Currently selected station (Single Source of Truth)
  const currentStation = useMemo(() => {
    return stations.find(s => s.id === selectedStationId) || stations[0] || {
      id: '11611',
      name: 'Malad West',
      fullName: 'Malad West, Mumbai',
      agency: 'MPCB',
      area: 'Western Suburbs',
      description: 'Coastal suburban monitoring site',
      frequency: 95.2,
      freqLabel: 'FM 95.2',
      lat: 19.186,
      lon: 72.848
    };
  }, [stations, selectedStationId]);

  // Current timestamp (Single Source of Truth)
  const currentTimestamp = useMemo(() => {
    if (!timeline || !timeline.timestamps[timeIndex]) return '';
    return timeline.timestamps[timeIndex];
  }, [timeline, timeIndex]);

  // Current PM2.5 (Single Source of Truth)
  const currentPm25 = useMemo(() => {
    if (!hourlyData[selectedStationId]) return null;
    return hourlyData[selectedStationId][timeIndex] ?? null;
  }, [hourlyData, selectedStationId, timeIndex]);

  // All stations' values at current timestamp
  const allStationCurrentValues = useMemo(() => {
    const vals: Record<string, number | null> = {};
    stations.forEach(st => {
      vals[st.id] = hourlyData[st.id]?.[timeIndex] ?? null;
    });
    return vals;
  }, [stations, hourlyData, timeIndex]);

  // Air Category word (derived strictly from PM2.5 thresholds)
  const airCategory: AirCategory = useMemo(() => {
    if (currentPm25 === null) return 'okay';
    if (currentPm25 <= 30) return 'fresh';
    if (currentPm25 <= 60) return 'okay';
    if (currentPm25 <= 120) return 'hazy';
    if (currentPm25 <= 250) return 'heavy';
    return 'severe';
  }, [currentPm25]);

  // Mode badge: MEASURED or REPLAY (Strict Rule 3 compliant)
  const modeBadge: ModeBadge = useMemo(() => {
    if (!timeline) return 'MEASURED';
    return timeIndex >= timeline.total_hours - 24 ? 'MEASURED' : 'REPLAY';
  }, [timeline, timeIndex]);

  // Active anomaly for current station & hour
  const activeAnomaly = useMemo(() => {
    const eps = anomalies[selectedStationId] || [];
    return eps.find(
      ep => currentTimestamp >= ep.startTime && currentTimestamp <= ep.endTime
    );
  }, [anomalies, selectedStationId, currentTimestamp]);

  const isAnomaly = !!activeAnomaly;

  // Active dictionary
  const currentDict = useMemo(() => {
    return i18nDict[language] || i18nDict['en'] || {};
  }, [i18nDict, language]);

  // Category labels
  const categoryLabels = useMemo(() => {
    return (
      currentDict.air_categories || {
        fresh: 'Fresh',
        okay: 'Okay',
        hazy: 'Hazy',
        heavy: 'Heavy',
        severe: 'Severe'
      }
    );
  }, [currentDict]);

  // 24 hours of readings ending at current timeIndex for ribbon chart
  const today24Hours = useMemo(() => {
    const res: { hour: number; val: number | null }[] = [];
    const series = hourlyData[selectedStationId] || [];
    for (let i = 23; i >= 0; i--) {
      const idx = timeIndex - i;
      const val = idx >= 0 ? series[idx] : null;
      res.push({ hour: 23 - i, val: val ?? null });
    }
    return res;
  }, [hourlyData, selectedStationId, timeIndex]);

  // Baseline median for current hour
  const currentHourNum = parseInt(currentTimestamp.split('T')[1]?.split(':')[0] || '12', 10);
  const currentBaseline = baselines[selectedStationId]?.diurnal || [];
  const currentBaseHour = currentBaseline.find(b => b.hour === currentHourNum);
  const currentMedian = currentBaseHour?.median || 40;

  // Generate natural spoken script using the speech normalization layer
  const naturalScript = useMemo(() => {
    return generateScript({
      station: currentStation,
      timestamp: currentTimestamp,
      pm25: currentPm25,
      airCategory,
      categoryLabel: categoryLabels[airCategory] || 'Hazy',
      isAnomaly,
      anomalyScope: activeAnomaly?.scope,
      concurrentStations: activeAnomaly?.concurrentElevatedStations || 0,
      baselineMedian: currentMedian,
      isReplay: modeBadge === 'REPLAY',
      language
    });
  }, [
    currentStation,
    currentTimestamp,
    currentPm25,
    airCategory,
    categoryLabels,
    isAnomaly,
    activeAnomaly,
    currentMedian,
    modeBadge,
    language
  ]);

  // Station and Time Change Handlers
  const handleStationChange = (newStationId: string) => {
    radioAudio.stopSpeaking();
    setIsSpeaking(false);
    setAudioProgress(0);
    setSelectedStationId(newStationId);
  };

  const handleTimeChange = (newTimeIndex: number) => {
    radioAudio.stopSpeaking();
    setIsSpeaking(false);
    setAudioProgress(0);
    setTimeIndex(newTimeIndex);
    if (isPlayingReplay) setIsPlayingReplay(false);
  };

  // Replay play/pause loop
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isPlayingReplay && timeline) {
      timer = setInterval(() => {
        setTimeIndex(prev => {
          if (prev >= timeline.total_hours - 1) {
            setIsPlayingReplay(false);
            return prev;
          }
          return prev + 1;
        });
      }, 700);
    }
    return () => clearInterval(timer);
  }, [isPlayingReplay, timeline]);

  // Mode switch handler with tactile click and static burst
  const handleSwitchMode = (mode: LcdMode) => {
    if (mode === activeMode) return;
    radioAudio.playKnobClick();
    radioAudio.playStaticBurst(0.12, 0.05);
    setActiveMode(mode);
  };

  // Listen trigger handler
  const handleTriggerListen = async () => {
    if (isSpeaking) {
      radioAudio.stopSpeaking();
      setIsSpeaking(false);
      setAudioProgress(0);
      return;
    }

    setVoiceError(null);
    setIsLoadingVoice(true);
    setAudioProgress(0);
    radioAudio.playChime();

    try {
      const sourceUsed = await radioAudio.speakBulletin(naturalScript.fullText, language, {
        stationId: selectedStationId,
        timestamp: currentTimestamp,
        speed: 0.95,
        onStart: () => {
          setIsLoadingVoice(false);
          setIsSpeaking(true);
        },
        onProgress: (p) => {
          setAudioProgress(p);
        },
        onEnd: () => {
          setIsSpeaking(false);
          setIsLoadingVoice(false);
          setAudioProgress(0);
        },
        onError: (errMsg) => {
          setVoiceError(errMsg);
        }
      });
      setActiveAudioSource(sourceUsed);
    } catch {
      setIsSpeaking(false);
      setIsLoadingVoice(false);
      setAudioProgress(0);
      setVoiceError('Voice engine unavailable; please read on-screen bulletin.');
    }
  };

  // Preset click
  const handlePresetClick = (preset: PresetMoment) => {
    if (!timeline) return;
    radioAudio.playKnobClick();
    radioAudio.playChime();
    radioAudio.stopSpeaking();
    setIsSpeaking(false);
    setAudioProgress(0);

    const targetIdx = timeline.timestamps.findIndex(t => t.startsWith(preset.timestamp));
    if (targetIdx >= 0) {
      setTimeIndex(targetIdx);
    }
    setSelectedStationId(preset.stationId);
  };

  // Jump to event from seismo
  const handleJumpToEvent = (ts: string, stationId: string) => {
    if (!timeline) return;
    radioAudio.stopSpeaking();
    setIsSpeaking(false);
    setAudioProgress(0);
    const targetIdx = timeline.timestamps.findIndex(t => t.startsWith(ts));
    if (targetIdx >= 0) {
      setTimeIndex(targetIdx);
    }
    setSelectedStationId(stationId);
    setActiveMode('radio');
    radioAudio.playChime();
  };

  // Jump to historical event in Replay mode
  const handleJumpToReplay = (ts: string, stationId: string) => {
    if (!timeline) return;
    radioAudio.stopSpeaking();
    setIsSpeaking(false);
    setAudioProgress(0);
    const targetIdx = timeline.timestamps.findIndex(t => t.startsWith(ts.slice(0, 13)));
    if (targetIdx >= 0) {
      setTimeIndex(targetIdx);
    }
    setSelectedStationId(stationId);
    setActiveMode('replay');
    radioAudio.playChime();
  };

  // Volume slider handler
  const handleVolumeChange = (newVol: number) => {
    setVolumePercent(newVol);
    radioAudio.setVolume(newVol / 100);
    if (newVol === 0 && !isMuted) {
      setIsMuted(true);
      radioAudio.setMuted(true);
    } else if (newVol > 0 && isMuted) {
      setIsMuted(false);
      radioAudio.setMuted(false);
    }
  };

  if (isLoading || !timeline) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F4EDDF] text-[#343B35] font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#B66C4D] border-t-transparent rounded-full animate-spin" />
          <div className="text-xs uppercase tracking-wider text-[#B66C4D] font-bold flex items-center gap-1.5">
            <RadioIcon className="w-4 h-4 animate-pulse" />
            <span>Tuning in to Mumbai&apos;s Air...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main
      className={`w-full min-h-[100dvh] md:h-[100dvh] overflow-x-hidden overflow-y-auto md:overflow-hidden flex flex-col items-center justify-start md:justify-center pt-14 sm:pt-16 pb-6 md:pb-2 px-2 sm:px-3 md:px-4 select-none ${
        isSpeaking ? 'speaking' : ''
      }`}
      role="main"
    >
      {/* ─── PHYSICAL RADIO HARDWARE SHELL ───────────────────────────────────── */}
      <div className="radio-shell w-full max-w-[1060px] min-h-0 h-auto md:h-full md:max-h-[615px] p-2.5 sm:p-4 md:p-5 flex flex-col justify-between relative shadow-2xl overflow-visible">
        
        {/* ─── CENTRAL TELESCOPIC METAL RADIO ANTENNA ──────────────────────── */}
        <div
          className="absolute -top-16 sm:-top-20 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-30 drop-shadow-[0_4px_6px_rgba(40,51,41,0.35)]"
          title="Telescopic FM Radio Antenna"
        >
          {/* Telescopic Mast Assembly */}
          <div className="radio-antenna-mast flex flex-col items-center origin-bottom">
            {/* Top Tip Finial: Polished Chrome Bead */}
            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-b from-[#FFFFFF] via-[#D8DFDB] to-[#707E76] border border-[#283329]/50 shadow-xs flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-white/90" />
            </div>

            {/* Stage 3 (Top - Slimmest): ~2.5px */}
            <div className="w-[2.5px] h-6 bg-gradient-to-r from-[#8E9A92] via-[#FFFFFF] to-[#6E7A72] border-x border-[#283329]/30" />

            {/* Telescopic Ring Joint 2 */}
            <div className="w-1.5 h-1 rounded-xs bg-gradient-to-r from-[#5A665E] via-[#E4EBE6] to-[#4A554E] border border-[#283329]/50 shadow-2xs" />

            {/* Stage 2 (Middle): ~3.5px */}
            <div className="w-[3.5px] h-6 bg-gradient-to-r from-[#86948A] via-[#F4F8F5] to-[#627066] border-x border-[#283329]/40" />

            {/* Telescopic Ring Joint 1 */}
            <div className="w-2 h-1 rounded-xs bg-gradient-to-r from-[#4A564E] via-[#E4EBE6] to-[#3A453E] border border-[#283329]/60 shadow-2xs" />

            {/* Stage 1 (Base - Stoutest): ~5px */}
            <div className="w-[5px] h-7 bg-gradient-to-r from-[#708075] via-[#EBF2ED] to-[#506055] border-x border-[#283329]/50" />
          </div>

          {/* Antenna Base Swivel Mount Bracket (Firmly seated on cabinet top rim) */}
          <div className="w-6 h-2.5 rounded-t-md bg-gradient-to-b from-[#8C9890] via-[#5A6860] to-[#283329] border-t-2 border-x border-[#1E2620] shadow-sm flex items-center justify-center relative -mb-0.5">
            {/* Swivel Pivot Ball Collar */}
            <div className="w-3 h-2 rounded-t-full bg-gradient-to-r from-[#4A564E] via-[#E4EBE6] to-[#3A453E] border border-[#1E2620]/60" />
          </div>
        </div>

        {/* ─── CABINET TOP BAR: Branding, Antenna & Meta Controls ─────────────── */}
        <div className="flex items-center justify-between pb-2 border-b border-[#343B35]/20 shrink-0">
          
          {/* HAWA.fm Branding & Station Frequency (On the left, never overlaps LCD) */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <h1 className="font-brand text-2xl sm:text-3xl font-bold tracking-tight text-[#343B35] leading-none">
                HAWA<span className="text-[#B66C4D]">.fm</span>
              </h1>
              <span className="text-[10px] font-sans font-bold text-[#8C7428] tracking-wide mt-0.5">
                Mumbai&apos;s Atmospheric Intelligence Radio
              </span>
            </div>
          </div>

          {/* Quick Header Controls (Language, About, Share) */}
          <div className="flex items-center gap-2">
            {/* Multilingual Selector */}
            <div className="flex rounded-md p-0.5 bg-[#FAF6EE] border border-[#343B35]/25 text-[10px] font-bold">
              {(['en', 'hi', 'mr'] as Language[]).map(l => (
                <button
                  key={l}
                  onClick={() => {
                    setLanguage(l);
                    radioAudio.playKnobClick();
                  }}
                  className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                    language === l
                      ? 'bg-[#B66C4D] text-white shadow-xs'
                      : 'text-[#343B35]/70 hover:text-[#343B35]'
                  }`}
                >
                  {l === 'en' ? 'EN' : l === 'hi' ? 'हिं' : 'मरा'}
                </button>
              ))}
            </div>

            {/* About Modal Button */}
            <button
              onClick={() => setShowAboutModal(true)}
              className="p-1.5 rounded-md bg-[#FAF6EE] hover:bg-[#E8DDC9] border border-[#343B35]/25 text-[#343B35] transition-colors cursor-pointer"
              title="About HAWA.fm & Methodology"
              aria-label="About HAWA.fm"
            >
              <Info className="w-3.5 h-3.5" />
            </button>

            {/* Share Postcard Button */}
            <button
              onClick={() => setShowShareModal(true)}
              className="p-1.5 rounded-md bg-[#FAF6EE] hover:bg-[#E8DDC9] border border-[#343B35]/25 text-[#343B35] transition-colors cursor-pointer"
              title="Share Air Postcard"
              aria-label="Share Air Postcard"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ─── CABINET BODY: Speaker Grille + LCD Screen + 4 Mode Buttons ─────── */}
        <div className="flex-1 my-2 flex flex-col md:flex-row gap-2.5 min-h-0 items-stretch">
          
          {/* Left Column: Speaker Grille on Left (wavy lines) */}
          <div className="hidden md:flex w-22 speaker-grille-box p-2 flex-col justify-between items-center shrink-0">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[#343B35]/70">
              Speaker
            </span>

            {/* Hand-drawn speaker grille pattern with subtle pulsing during voice */}
            <div className="w-full h-36 speaker-waves rounded-lg border border-[#343B35]/20 flex items-center justify-center shadow-inner relative overflow-hidden">
              <svg className="w-full h-full opacity-35" viewBox="0 0 100 160" preserveAspectRatio="none">
                <path
                  d="M 10 20 Q 50 35 90 20 M 10 40 Q 50 55 90 40 M 10 60 Q 50 75 90 60 M 10 80 Q 50 95 90 80 M 10 100 Q 50 115 90 100 M 10 120 Q 50 135 90 120 M 10 140 Q 50 155 90 140"
                  fill="none"
                  stroke="#343B35"
                  strokeWidth="2.5"
                />
              </svg>
              {/* Center Diaphragm */}
              <div className="absolute w-7 h-7 rounded-full border-2 border-[#343B35]/40 bg-[#343B35]/10 flex items-center justify-center">
                <div className={`w-2.5 h-2.5 rounded-full bg-[#B66C4D]/40 ${isSpeaking ? 'animate-ping' : ''}`} />
              </div>
            </div>

            <div className="text-center">
              <span className="block text-[8px] font-bold text-[#8C7428]">8Ω Solid</span>
              <span className="block text-[7px] text-[#343B35]/60">FM 98.4</span>
            </div>
          </div>

          {/* Center Column: Dedicated Single LCD Screen */}
          <div className="flex-1 min-w-0 h-full min-h-0">
            <LcdScreen
              activeMode={activeMode}
              currentStation={currentStation}
              currentTimestamp={currentTimestamp}
              pm25={currentPm25}
              airCategory={airCategory}
              modeBadge={modeBadge}
              isAnomaly={isAnomaly}
              anomalyScope={activeAnomaly?.scope}
              language={language}
              onSelectLanguage={setLanguage}
              categoryLabels={categoryLabels}
              bulletinHeadline={naturalScript.aqiSummary}
              bulletinFullText={naturalScript.fullText}
              isSpeaking={isSpeaking}
              isLoadingVoice={isLoadingVoice}
              audioProgress={audioProgress}
              isMuted={isMuted}
              onTriggerListen={handleTriggerListen}
              onToggleMute={() => {
                const next = !isMuted;
                setIsMuted(next);
                radioAudio.setMuted(next);
              }}
              onOpenDetect={() => setActiveMode('detect')}
              stations={stations}
              onSelectStation={handleStationChange}
              baselines={baselines}
              anomalies={anomalies}
              allStationCurrentValues={allStationCurrentValues}
              today24Hours={today24Hours}
              onOpenPrintModal={() => setShowPrintModal(true)}
              onJumpToReplay={handleJumpToReplay}
              events={events}
              amiData={amiData}
              selectedEventId={selectedEventId}
              onSelectEvent={setSelectedEventId}
              allHourlyValues={hourlyData}
              onJumpToEvent={handleJumpToEvent}
              timeline={timeline}
              timeIndex={timeIndex}
              isPlaying={isPlayingReplay}
              presets={presets}
              onTogglePlay={() => setIsPlayingReplay(!isPlayingReplay)}
              onTimeChange={handleTimeChange}
              onSelectPreset={handlePresetClick}
              onJumpToLatest={() => handleTimeChange(timeline.total_hours - 1)}
              onReturnToRadio={() => setActiveMode('radio')}
            />
          </div>

          {/* Right Column: Four Elongated Rounded-Rectangle Mode Buttons (Aligned tightly with LCD) */}
          <div className="grid grid-cols-4 md:flex md:flex-col justify-between gap-1.5 md:gap-2 md:w-32 shrink-0 my-1 md:my-0">
            {/* 1. RADIO */}
            <button
              onClick={() => handleSwitchMode('radio')}
              className={`radio-mode-button justify-center md:justify-start px-1.5 sm:px-2 md:px-3 py-2 md:py-2.5 ${activeMode === 'radio' ? 'active' : ''}`}
              aria-label="Switch to Radio Mode"
            >
              <RadioIcon className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
              <span className="text-center md:text-left text-[9px] sm:text-[10px] md:text-xs font-bold truncate">RADIO</span>
              <span className="active-indicator-pill hidden md:inline-block ml-auto" />
            </button>

            {/* 2. DETECTIVE */}
            <button
              onClick={() => handleSwitchMode('detect')}
              className={`radio-mode-button justify-center md:justify-start px-1.5 sm:px-2 md:px-3 py-2 md:py-2.5 ${activeMode === 'detect' ? 'active' : ''}`}
              aria-label="Switch to Air Detective Mode"
            >
              <Compass className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
              <span className="text-center md:text-left text-[9px] sm:text-[10px] md:text-xs font-bold truncate">DETECT</span>
              <span className="active-indicator-pill hidden md:inline-block ml-auto" />
            </button>

            {/* 3. SEISMOLOGY */}
            <button
              onClick={() => handleSwitchMode('seismo')}
              className={`radio-mode-button justify-center md:justify-start px-1.5 sm:px-2 md:px-3 py-2 md:py-2.5 ${activeMode === 'seismo' ? 'active' : ''}`}
              aria-label="Switch to Air Seismology Mode"
            >
              <Activity className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
              <span className="text-center md:text-left text-[9px] sm:text-[10px] md:text-xs font-bold truncate">SEISMO</span>
              <span className="active-indicator-pill hidden md:inline-block ml-auto" />
            </button>

            {/* 4. REPLAY */}
            <button
              onClick={() => handleSwitchMode('replay')}
              className={`radio-mode-button justify-center md:justify-start px-1.5 sm:px-2 md:px-3 py-2 md:py-2.5 ${activeMode === 'replay' ? 'active' : ''}`}
              aria-label="Switch to Event Replay Mode"
            >
              <RotateCcw className="w-3.5 h-3.5 md:w-4 md:h-4 shrink-0" />
              <span className="text-center md:text-left text-[9px] sm:text-[10px] md:text-xs font-bold truncate">REPLAY</span>
              <span className="active-indicator-pill hidden md:inline-block ml-auto" />
            </button>
          </div>
        </div>

        {/* ─── CABINET BOTTOM: Elongated Volume & Tuning Controls ────────────── */}
        <LowerHardwareControls
          volume={volumePercent}
          onVolumeChange={handleVolumeChange}
          stations={stations}
          currentStationId={selectedStationId}
          onSelectStation={handleStationChange}
          isMuted={isMuted}
          onToggleMute={() => {
            const next = !isMuted;
            setIsMuted(next);
            radioAudio.setMuted(next);
          }}
        />
      </div>

      {/* ─── MODALS ──────────────────────────────────────────────────────────── */}
      {showPrintModal && (
        <InvestigationNoteModal
          currentStation={currentStation}
          currentTimestamp={currentTimestamp}
          currentPm25={currentPm25}
          currentMedian={currentMedian}
          stations={stations}
          allStationCurrentValues={allStationCurrentValues}
          onClose={() => setShowPrintModal(false)}
        />
      )}

      {showShareModal && (
        <ShareCardModal
          station={currentStation}
          timestamp={currentTimestamp}
          pm25={currentPm25}
          airCategory={airCategory}
          airCategoryLabel={categoryLabels[airCategory]}
          tagline={currentDict.tagline || "Tune in to Mumbai's air"}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {showAboutModal && <AboutModal onClose={() => setShowAboutModal(false)} />}
      {showOnboarding && <OnboardingHint onDismiss={() => setShowOnboarding(false)} />}
    </main>
  );
}
