import { useState, useEffect, useMemo, useRef } from 'react';
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
import { LcdScreen } from './components/LcdScreen';
import { FrequencyDial } from './components/FrequencyDial';
import { RotaryKnob } from './components/RotaryKnob';
import { BroadcastTicker } from './components/BroadcastTicker';
import { AirDetective } from './components/AirDetective';
import { AirObservatory } from './components/AirObservatory';
import { ShareCardModal } from './components/ShareCardModal';
import { AboutModal } from './components/AboutModal';
import { OnboardingHint } from './components/OnboardingHint';
import { VoiceSettingsSheet } from './components/VoiceSettingsSheet';
import { radioAudio, AudioSourceType } from './utils/audio';
import {
  Play,
  Pause,
  RotateCcw,
  Compass,
  Activity,
  Share2,
  Info,
  Radio
} from 'lucide-react';

export default function App() {
  // Data state loaded from precomputed static JSON
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

  // User interactive state (Single Source of Truth)
  const [selectedStationId, setSelectedStationId] = useState<string>('11611'); // Malad West default
  const [timeIndex, setTimeIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [language, setLanguage] = useState<Language>('en');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [autoAnnounce, setAutoAnnounce] = useState<boolean>(false);

  // Voice engine states
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isLoadingVoice, setIsLoadingVoice] = useState<boolean>(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceSpeed, setVoiceSpeed] = useState<number>(0.95);
  const [activeAudioSource, setActiveAudioSource] = useState<AudioSourceType>('browser');
  const [showVoiceSettings, setShowVoiceSettings] = useState<boolean>(false);

  // UI Panels & Modals
  const [activePanel, setActivePanel] = useState<'none' | 'detective' | 'observatory'>('none');
  const [selectedEventId, setSelectedEventId] = useState<string>('event_1');
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
          mrRes
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
          fetch('/i18n/mr.json').then(r => r.json())
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

        if (tlRes && tlRes.timestamps.length > 0) {
          setTimeIndex(tlRes.timestamps.length - 1);
        }

        const visited = localStorage.getItem('hawafm_visited_v2');
        if (!visited) {
          setShowOnboarding(true);
          localStorage.setItem('hawafm_visited_v2', 'true');
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error loading Hawa.fm data pipeline artifacts:', err);
      }
    }
    loadData();
  }, []);

  // Currently selected station
  const currentStation = useMemo(() => {
    return stations.find(s => s.id === selectedStationId) || stations[0];
  }, [stations, selectedStationId]);

  // Current timestamp (Unified Single Source of Truth)
  const currentTimestamp = useMemo(() => {
    if (!timeline || !timeline.timestamps[timeIndex]) return '';
    return timeline.timestamps[timeIndex];
  }, [timeline, timeIndex]);

  // Current PM2.5 (Unified Single Source of Truth)
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

  // Determine Air Category word
  const airCategory: AirCategory = useMemo(() => {
    if (currentPm25 === null) return 'okay';
    if (currentPm25 <= 30) return 'fresh';
    if (currentPm25 <= 60) return 'okay';
    if (currentPm25 <= 120) return 'hazy';
    if (currentPm25 <= 250) return 'heavy';
    return 'severe';
  }, [currentPm25]);

  // Permanent Badge: MEASURED or REPLAY (Strict Rule 3 compliant)
  const modeBadge: ModeBadge = useMemo(() => {
    if (!timeline) return 'MEASURED';
    return timeIndex >= timeline.total_hours - 24 ? 'MEASURED' : 'REPLAY';
  }, [timeline, timeIndex]);

  // Check if current hour falls in an anomaly episode
  const activeAnomaly = useMemo(() => {
    const eps = anomalies[selectedStationId] || [];
    return eps.find(
      ep => currentTimestamp >= ep.startTime && currentTimestamp <= ep.endTime
    );
  }, [anomalies, selectedStationId, currentTimestamp]);

  const isAnomaly = !!activeAnomaly;

  // Active i18n dictionary
  const currentDict = useMemo(() => {
    return i18nDict[language] || i18nDict['en'] || {};
  }, [i18nDict, language]);

  // Category labels in active language
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

  // 24 hours of readings ending at current timeIndex for ribbon chart (gaps preserved as null)
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

  // Deterministic Voice Bulletin Template (Rule 7 compliant, zero contradiction during anomaly)
  const bulletinText = useMemo(() => {
    if (!currentDict.bulletin_templates) return 'Broadcasting Hawa.fm...';

    if (currentPm25 === null) {
      return currentDict.bulletin_templates.no_signal;
    }

    const tpl = currentDict.bulletin_templates.standard;
    const catLabel = categoryLabels[airCategory] || 'Hazy';

    // Trend calculation vs 3 hours ago (guarded against contradiction when anomaly is active)
    const prevPm = timeIndex >= 3 ? hourlyData[selectedStationId]?.[timeIndex - 3] : null;
    let trendText = currentDict.bulletin_templates.trend_steady;

    if (isAnomaly) {
      if (prevPm !== null && prevPm !== undefined) {
        if (currentPm25 - prevPm > 10) {
          trendText = currentDict.bulletin_templates.trend_rising_anomaly || 'surging sharply';
        } else if (prevPm - currentPm25 > 10) {
          trendText = currentDict.bulletin_templates.trend_easing_anomaly || 'easing slightly from its peak but remaining unusually high';
        } else {
          trendText = currentDict.bulletin_templates.trend_steady_anomaly || 'staying persistently elevated';
        }
      } else {
        trendText = currentDict.bulletin_templates.trend_steady_anomaly || 'staying persistently elevated';
      }
    } else {
      if (prevPm !== null && prevPm !== undefined) {
        if (currentPm25 - prevPm > 12) trendText = currentDict.bulletin_templates.trend_rising;
        else if (prevPm - currentPm25 > 12) trendText = currentDict.bulletin_templates.trend_falling;
      }
    }

    // Comparison to hour baseline (Usual for this hour)
    const hourNum = parseInt(currentTimestamp.split('T')[1]?.split(':')[0] || '12', 10);
    const baseHour = baselines[selectedStationId]?.diurnal?.find(b => b.hour === hourNum);
    const med = baseHour?.median || 40;
    let baseText = currentDict.bulletin_templates.baseline_near;
    if (currentPm25 > med * 1.3) baseText = currentDict.bulletin_templates.baseline_above;
    else if (currentPm25 < med * 0.7) baseText = currentDict.bulletin_templates.baseline_below;

    let filled = tpl
      .replace('{station_name}', currentStation ? currentStation.name : 'Mumbai')
      .replace('{time_str}', currentTimestamp.replace('T', ' at ') + ' IST')
      .replace('{air_category}', catLabel)
      .replace('{pm25}', currentPm25.toFixed(1))
      .replace('{trend_text}', trendText)
      .replace('{baseline_text}', baseText);

    if (isAnomaly) {
      filled += currentDict.bulletin_templates.anomaly_suffix;
    }

    return filled;
  }, [
    currentDict,
    currentPm25,
    airCategory,
    categoryLabels,
    currentStation,
    currentTimestamp,
    timeIndex,
    hourlyData,
    selectedStationId,
    baselines,
    isAnomaly
  ]);

  // Stop speech immediately when station or time scrubs
  const handleStationChange = (newStationId: string) => {
    radioAudio.stopSpeaking();
    setIsSpeaking(false);
    setSelectedStationId(newStationId);
  };

  const handleTimeChange = (newTimeIndex: number) => {
    radioAudio.stopSpeaking();
    setIsSpeaking(false);
    setTimeIndex(newTimeIndex);
    if (isPlaying) setIsPlaying(false);
  };

  // Audio Auto-Announce trigger on tune
  const prevStationRef = useRef<string>(selectedStationId);
  useEffect(() => {
    if (prevStationRef.current !== selectedStationId) {
      prevStationRef.current = selectedStationId;
      if (autoAnnounce && !isMuted) {
        handleTriggerListen();
      }
    }
  }, [selectedStationId, autoAnnounce, isMuted]);

  // Auto-play loop for Event Replay
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isPlaying && timeline) {
      timer = setInterval(() => {
        setTimeIndex(prev => {
          if (prev >= timeline.total_hours - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 750);
    }
    return () => clearInterval(timer);
  }, [isPlaying, timeline]);

  // Station index mapping for Left TUNE RotaryKnob
  const stationIndex = useMemo(() => {
    const idx = stations.findIndex(s => s.id === selectedStationId);
    return idx >= 0 ? idx : 0;
  }, [stations, selectedStationId]);

  const handleTuneKnobChange = (newIdx: number) => {
    if (stations[newIdx] && stations[newIdx].id !== selectedStationId) {
      handleStationChange(stations[newIdx].id);
      radioAudio.playStaticBurst(0.12, 0.06);
    }
  };

  // Trigger Listen Button Action (Physical push button)
  const handleTriggerListen = async () => {
    if (isSpeaking) {
      radioAudio.stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    setVoiceError(null);
    setIsLoadingVoice(true);
    radioAudio.playChime();

    try {
      const sourceUsed = await radioAudio.speakBulletin(bulletinText, language, {
        stationId: selectedStationId,
        timestamp: currentTimestamp,
        speed: voiceSpeed,
        onStart: () => {
          setIsLoadingVoice(false);
          setIsSpeaking(true);
        },
        onEnd: () => {
          setIsSpeaking(false);
          setIsLoadingVoice(false);
        },
        onError: (errMsg) => {
          setVoiceError(errMsg);
        }
      });
      setActiveAudioSource(sourceUsed);
    } catch (err: any) {
      setIsSpeaking(false);
      setIsLoadingVoice(false);
      setVoiceError('Voice engine unavailable; please read on-screen bulletin.');
    }
  };

  // Preset button click handler
  const handlePresetClick = (preset: PresetMoment) => {
    if (!timeline) return;
    radioAudio.playKnobClick();
    radioAudio.playChime();
    radioAudio.stopSpeaking();
    setIsSpeaking(false);

    const targetIdx = timeline.timestamps.findIndex(t => t.startsWith(preset.timestamp));
    if (targetIdx >= 0) {
      setTimeIndex(targetIdx);
    }
    setSelectedStationId(preset.stationId);
  };

  // Jump from Observatory directly into an event
  const handleJumpToEvent = (ts: string, stationId: string) => {
    if (!timeline) return;
    radioAudio.stopSpeaking();
    setIsSpeaking(false);

    const targetIdx = timeline.timestamps.findIndex(t => t.startsWith(ts));
    if (targetIdx >= 0) {
      setTimeIndex(targetIdx);
    }
    setSelectedStationId(stationId);
    radioAudio.playChime();
  };

  if (isLoading || !timeline) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#EFE6D6] text-[#2B2A33] font-body">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#C8553D] border-t-transparent rounded-full animate-spin" />
          <div className="text-xs uppercase tracking-wider text-[#C8553D] font-bold flex items-center gap-1.5">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>Finding Signal... (Tuning in to Mumbai)</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main
      className="min-h-screen w-full bg-[#EFE6D6] paper-texture text-[#2B2A33] flex flex-col items-center justify-center p-2.5 sm:p-5 md:p-8"
      role="main"
    >
      {/* Outer Wide Sandalwood/Cream Radio Cabinet (Landscape layout on desktop, stacked on mobile) */}
      <div className="relative w-full max-w-[520px] lg:max-w-[1080px] flex flex-col lg:flex-row gap-6 items-stretch">
        {/* PHYSICAL TABLETOP RADIO CABINET */}
        <section
          className="relative w-full flex-1 rounded-3xl bg-gradient-to-b from-[#F9F4EB] via-[#F6EFE2] to-[#EBDCC5] border-3 border-[#CBBCA3] shadow-[0_20px_45px_rgba(43,42,51,0.12),inset_0_2px_4px_rgba(255,255,255,0.9)] p-4 sm:p-6 flex flex-col gap-4"
          aria-label="Hawa.fm Vintage Tabletop Radio"
        >
          {/* CABINET TOP BAR: Wordmark, Indian Brass Badge & Quick Controls */}
          <div className="flex items-center justify-between border-b border-[#D5C7B0] pb-3">
            {/* Wordmark and Tagline */}
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <h1 className="font-wordmark text-2xl sm:text-3xl tracking-tight text-[#2B2A33]">
                  Hawa<span className="text-[#C8553D]">.fm</span>
                </h1>
                {/* Brass Signal Quality Indicators */}
                <div
                  className="flex items-end gap-1 h-3.5 ml-1.5"
                  title={currentPm25 !== null ? 'Radio signal locked' : 'Signal weak'}
                >
                  <span className={`w-1 rounded-xs ${currentPm25 !== null ? 'h-1.5 bg-[#2F7F86]' : 'h-1.5 bg-[#C8553D] animate-ping'}`} />
                  <span className={`w-1 rounded-xs ${currentPm25 !== null ? 'h-2.5 bg-[#2F7F86]' : 'h-2.5 bg-[#D5C7B0]'}`} />
                  <span className={`w-1 rounded-xs ${currentPm25 !== null ? 'h-3 bg-[#2F7F86]' : 'h-3 bg-[#D5C7B0]'}`} />
                  <span className={`w-1 rounded-xs ${currentPm25 !== null ? 'h-3.5 bg-[#2F7F86]' : 'h-3.5 bg-[#D5C7B0]'}`} />
                </div>
              </div>
              <span className="text-[11px] font-body text-[#8C7428] font-bold tracking-wide">
                {currentDict.tagline || "Tune in to Mumbai's air"}
              </span>
            </div>

            {/* Language Selection & About Button */}
            <div className="flex items-center gap-2">
              <div
                className="flex rounded-lg p-0.5 bg-[#EFE4CF] border border-[#D5C7B0] font-body text-[11px]"
                role="group"
                aria-label="Language selection"
              >
                {(['en', 'hi', 'mr'] as Language[]).map(l => (
                  <button
                    key={l}
                    onClick={() => {
                      setLanguage(l);
                      radioAudio.playKnobClick();
                    }}
                    className={`px-2.5 py-0.5 rounded-md transition-all font-bold ${
                      language === l
                        ? 'bg-[#C8553D] text-white shadow-xs'
                        : 'text-[#5A5766] hover:text-[#2B2A33]'
                    }`}
                  >
                    {l === 'en' ? 'EN' : l === 'hi' ? 'हिं' : 'मरा'}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowAboutModal(true)}
                className="p-1.5 rounded-lg text-[#5A5766] hover:text-[#2B2A33] bg-[#EFE4CF] border border-[#D5C7B0] transition-colors"
                title="About Hawa.fm"
                aria-label="Open About Information"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* RADIO BODY: Woven Speaker Grille + Window on Desktop */}
          <div className="flex flex-col sm:flex-row gap-4 items-stretch">
            {/* Woven Fabric Speaker Grille (Vibrates gently when voice broadcasts) */}
            <div
              className={`hidden sm:flex w-24 sm:w-28 rounded-xl speaker-grille p-2 border-2 border-[#CBBCA3] flex-col items-center justify-between shrink-0 shadow-inner ${
                isSpeaking ? 'speaker-speaking' : ''
              }`}
              title="Woven radio speaker grille"
            >
              <div className="text-[9px] font-wordmark text-[#5A5766] tracking-wider uppercase">Speaker</div>
              <div className="w-10 h-10 rounded-full border-2 border-[#CBBCA3]/60 bg-black/10 flex items-center justify-center">
                <div className={`w-4 h-4 rounded-full bg-[#C8553D]/30 ${isSpeaking ? 'animate-ping' : ''}`} />
              </div>
              <div className="text-[8px] font-body text-[#7A7885] text-center">8Ω Dynamic</div>
            </div>

            {/* LARGE GLASS WINDOW (Houses the painted Mumbai living skyline & overlays) */}
            <div className="flex-1">
              <LcdScreen
                currentStation={currentStation}
                currentTimestamp={currentTimestamp}
                pm25={currentPm25}
                airCategory={airCategory}
                modeBadge={modeBadge}
                isAnomaly={isAnomaly}
                anomalyZ={activeAnomaly?.peakRobustZ}
                anomalyScope={activeAnomaly?.scope}
                language={language}
                categoryLabels={categoryLabels}
                onOpenDetective={() => setActivePanel('detective')}
              />
            </div>
          </div>

          {/* LONG ANALOG FREQUENCY DIAL STRIP WITH SWINGING NEEDLE */}
          <FrequencyDial
            stations={stations}
            currentStationId={selectedStationId}
            onSelectStation={id => handleStationChange(id)}
          />

          {/* BROADCAST VOICE TICKER WITH LARGE PHYSICAL "LISTEN" PUSH BUTTON */}
          <BroadcastTicker
            bulletinText={bulletinText}
            language={language}
            isMuted={isMuted}
            onToggleMute={() => {
              const next = !isMuted;
              setIsMuted(next);
              radioAudio.setMuted(next);
            }}
            onOpenVoiceSettings={() => setShowVoiceSettings(true)}
            isSpeaking={isSpeaking}
            isLoadingVoice={isLoadingVoice}
            voiceError={voiceError}
            onTriggerListen={handleTriggerListen}
            activeSource={activeAudioSource}
          />

          {/* BOTTOM CONTROLS: TWO CHUNKY ROTARY KNOBS + PUSH BUTTONS */}
          <div className="flex items-center justify-between pt-1 border-t border-[#D5C7B0]">
            {/* LEFT ROTARY KNOB: TUNE (STATION) */}
            <RotaryKnob
              label={currentDict.ui?.tune_knob || 'Station Dial'}
              sublabel={currentStation.freqLabel}
              value={stationIndex}
              min={0}
              max={stations.length - 1}
              step={1}
              ticks={stations.length}
              size={64}
              onChange={handleTuneKnobChange}
              ariaLabel="Tune Radio Station"
            />

            {/* CENTRE PRESET MOMENT PUSH BUTTONS & REPLAY PLAY/PAUSE */}
            <div className="flex flex-col items-center gap-2">
              {/* Preset Buttons */}
              <div className="flex gap-1.5" role="group" aria-label="Historical presets">
                {presets.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handlePresetClick(p)}
                    className="px-2.5 py-1 rounded-lg bg-[#EFE4CF] hover:bg-[#E5D7BF] border border-[#D5C7B0] text-[10px] font-bold text-[#2B2A33] transition-all active:scale-95 shadow-xs"
                    title={p.fullTitle}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Play / Replay Scrubber Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    radioAudio.playKnobClick();
                    setIsPlaying(!isPlaying);
                  }}
                  className={`px-3.5 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95 ${
                    isPlaying
                      ? 'bg-[#C8553D] text-white shadow-sm'
                      : 'bg-[#EFE4CF] hover:bg-[#E5D7BF] text-[#2B2A33] border border-[#D5C7B0]'
                  }`}
                  aria-label={isPlaying ? 'Pause replay' : 'Auto play event replay'}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-[#C8553D]" />}
                  <span>{isPlaying ? 'Pause' : 'Replay'}</span>
                </button>

                <button
                  onClick={() => {
                    radioAudio.playKnobClick();
                    handleTimeChange(timeline.total_hours - 1);
                  }}
                  className="px-2.5 py-1.5 rounded-full text-[10px] font-bold bg-[#EFE4CF] hover:bg-[#E5D7BF] text-[#5A5766] hover:text-[#2B2A33] border border-[#D5C7B0] transition-colors flex items-center gap-1"
                  title="Jump to latest measured observation"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Latest</span>
                </button>
              </div>
            </div>

            {/* RIGHT ROTARY KNOB: TIME (SCRUB HISTORY) */}
            <RotaryKnob
              label={currentDict.ui?.time_knob || 'Time Travel'}
              sublabel={currentTimestamp.slice(0, 10)}
              value={timeIndex}
              min={0}
              max={timeline.total_hours - 1}
              step={1}
              ticks={16}
              size={64}
              onChange={handleTimeChange}
              ariaLabel="Scrub Time History"
            />
          </div>

          {/* LOWER ACTION STRIP: The Case Board, Air Observatory & Share Postcard */}
          <div className="flex items-center justify-between pt-2 border-t border-[#D5C7B0] text-xs font-bold">
            <button
              onClick={() => {
                radioAudio.playKnobClick();
                setActivePanel(activePanel === 'detective' ? 'none' : 'detective');
              }}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all ${
                activePanel === 'detective'
                  ? 'bg-[#C8553D] text-white border-[#B3452E] shadow-xs'
                  : 'bg-[#EFE4CF] hover:bg-[#E5D7BF] text-[#2B2A33] border-[#D5C7B0]'
              }`}
            >
              <Compass className="w-4 h-4 text-[#C8553D]" />
              <span>{currentDict.ui?.detective_tab || 'The Case Board'}</span>
            </button>

            <button
              onClick={() => {
                radioAudio.playKnobClick();
                setActivePanel(activePanel === 'observatory' ? 'none' : 'observatory');
              }}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all ${
                activePanel === 'observatory'
                  ? 'bg-[#C8553D] text-white border-[#B3452E] shadow-xs'
                  : 'bg-[#EFE4CF] hover:bg-[#E5D7BF] text-[#2B2A33] border-[#D5C7B0]'
              }`}
            >
              <Activity className="w-4 h-4 text-[#E9A23B]" />
              <span>{currentDict.ui?.observatory_tab || 'Air Observatory'}</span>
            </button>

            <button
              onClick={() => {
                radioAudio.playKnobClick();
                setShowShareModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-[#EFE4CF] hover:bg-[#E5D7BF] text-[#2B2A33] border border-[#D5C7B0] flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Share2 className="w-4 h-4 text-[#2F7F86]" />
              <span>{currentDict.ui?.share || 'Share'}</span>
            </button>
          </div>
        </section>

        {/* SIDE INVESTIGATION / OBSERVATORY PANEL (Slides beside on desktop; full bottom sheet on mobile) */}
        {activePanel !== 'none' && (
          <aside
            className="w-full lg:w-[480px] h-[600px] lg:h-auto rounded-3xl shadow-2xl overflow-hidden animate-fadeIn"
            aria-label="Auxiliary Case & Observation Panel"
          >
            {activePanel === 'detective' ? (
              <AirDetective
                stations={stations}
                currentStation={currentStation}
                onSelectStation={id => handleStationChange(id)}
                currentTimestamp={currentTimestamp}
                currentPm25={currentPm25}
                baselines={baselines}
                anomalies={anomalies}
                allStationCurrentValues={allStationCurrentValues}
                today24Hours={today24Hours}
                onClose={() => setActivePanel('none')}
              />
            ) : (
              <AirObservatory
                events={events}
                amiData={amiData}
                selectedEventId={selectedEventId}
                onSelectEvent={id => setSelectedEventId(id)}
                stations={stations}
                allHourlyValues={hourlyData}
                onClose={() => setActivePanel('none')}
                onJumpToEvent={handleJumpToEvent}
              />
            )}
          </aside>
        )}
      </div>

      {/* VOICE & BROADCAST SETTINGS SHEET */}
      {showVoiceSettings && (
        <VoiceSettingsSheet
          language={language}
          onSelectLanguage={setLanguage}
          speed={voiceSpeed}
          onSelectSpeed={setVoiceSpeed}
          autoAnnounce={autoAnnounce}
          onToggleAutoAnnounce={() => setAutoAnnounce(!autoAnnounce)}
          activeSource={activeAudioSource}
          onClose={() => setShowVoiceSettings(false)}
        />
      )}

      {/* SHARE CARD MODAL */}
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

      {/* ABOUT SHEET MODAL */}
      {showAboutModal && <AboutModal onClose={() => setShowAboutModal(false)} />}

      {/* ONBOARDING QUICK HINT */}
      {showOnboarding && <OnboardingHint onDismiss={() => setShowOnboarding(false)} />}
    </main>
  );
}
