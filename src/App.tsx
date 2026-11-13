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
import { radioAudio } from './utils/audio';
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

  // User interactive state
  const [selectedStationId, setSelectedStationId] = useState<string>('11611'); // Malad West
  const [timeIndex, setTimeIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [language, setLanguage] = useState<Language>('en');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [autoAnnounce, setAutoAnnounce] = useState<boolean>(false);

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

        // Set initial time index to latest measured reading
        if (tlRes && tlRes.timestamps.length > 0) {
          setTimeIndex(tlRes.timestamps.length - 1);
        }

        // Onboarding check
        const visited = localStorage.getItem('hawafm_visited');
        if (!visited) {
          setShowOnboarding(true);
          localStorage.setItem('hawafm_visited', 'true');
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

  // Current timestamp
  const currentTimestamp = useMemo(() => {
    if (!timeline || !timeline.timestamps[timeIndex]) return '';
    return timeline.timestamps[timeIndex];
  }, [timeline, timeIndex]);

  // Current PM2.5
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

  // 24 hours of readings ending at current timeIndex for sparkline
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

  // Fixed template filled deterministically for spoken bulletin & marquee ticker (Rule 7 compliant)
  const bulletinText = useMemo(() => {
    if (!currentDict.bulletin_templates) return 'Broadcasting Hawa.fm...';

    if (currentPm25 === null) {
      return currentDict.bulletin_templates.no_signal;
    }

    const tpl = currentDict.bulletin_templates.standard;
    const catLabel = categoryLabels[airCategory] || 'Hazy';

    // Trend calculation vs 3 hours ago
    const prevPm = timeIndex >= 3 ? hourlyData[selectedStationId]?.[timeIndex - 3] : null;
    let trendText = currentDict.bulletin_templates.trend_steady;
    if (prevPm !== null && prevPm !== undefined) {
      if (currentPm25 - prevPm > 12) trendText = currentDict.bulletin_templates.trend_rising;
      else if (prevPm - currentPm25 > 12) trendText = currentDict.bulletin_templates.trend_falling;
    }

    // Comparison to hour-of-day baseline median
    const hourNum = parseInt(currentTimestamp.split('T')[1]?.split(':')[0] || '12', 10);
    const baseHour = baselines[selectedStationId]?.diurnal?.find(b => b.hour === hourNum);
    const med = baseHour?.median || 40;
    let baseText = currentDict.bulletin_templates.baseline_near;
    if (currentPm25 > med * 1.3) baseText = currentDict.bulletin_templates.baseline_above;
    else if (currentPm25 < med * 0.7) baseText = currentDict.bulletin_templates.baseline_below;

    // Fill template strictly with placeholders
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

  // Audio Auto-Announce trigger on tune
  const prevStationRef = useRef<string>(selectedStationId);
  useEffect(() => {
    if (prevStationRef.current !== selectedStationId) {
      prevStationRef.current = selectedStationId;
      if (autoAnnounce && !isMuted) {
        radioAudio.speakBulletin(bulletinText, language);
      }
    }
  }, [selectedStationId, autoAnnounce, isMuted, bulletinText, language]);

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
      setSelectedStationId(stations[newIdx].id);
      radioAudio.playStaticBurst(0.12, 0.06);
    }
  };

  // Preset button click handler
  const handlePresetClick = (preset: PresetMoment) => {
    if (!timeline) return;
    radioAudio.playKnobClick();
    radioAudio.playChime();

    // Find index of target timestamp
    const targetIdx = timeline.timestamps.findIndex(t => t.startsWith(preset.timestamp));
    if (targetIdx >= 0) {
      setTimeIndex(targetIdx);
    }
    setSelectedStationId(preset.stationId);
  };

  // Jump from Observatory directly into an event
  const handleJumpToEvent = (ts: string, stationId: string) => {
    if (!timeline) return;
    const targetIdx = timeline.timestamps.findIndex(t => t.startsWith(ts));
    if (targetIdx >= 0) {
      setTimeIndex(targetIdx);
    }
    setSelectedStationId(stationId);
    radioAudio.playChime();
  };

  if (isLoading || !timeline) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0d0e11] text-zinc-100 font-mono">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
          <div className="text-xs uppercase tracking-widest text-[#d4af37] flex items-center gap-1.5">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>Finding Signal... (Tuning in to Mumbai)</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main
      className="min-h-screen w-full bg-[#0d0e11] radio-grain text-zinc-100 flex flex-col items-center justify-center p-2 sm:p-4 md:p-6"
      role="main"
    >
      {/* Outer Retro Radio Enclosure (Deep charcoal with brass hardware & subtle bevel) */}
      <div className="relative w-full max-w-[480px] lg:max-w-[960px] flex flex-col lg:flex-row gap-5 items-stretch">
        {/* RADIO CHASSIS CONTAINER */}
        <section
          className="relative w-full max-w-[480px] mx-auto rounded-2xl bg-gradient-to-b from-[#24262b] via-[#1a1c20] to-[#121316] border-2 border-[#453e2f] shadow-[0_20px_50px_rgba(0,0,0,0.85),inset_0_2px_4px_rgba(255,255,255,0.12)] p-3.5 sm:p-5 flex flex-col gap-3.5"
          aria-label="Hawa.fm Radio Receiver Unit"
        >
          {/* TOP BAR: Wordmark, Signal Strength, and Language Switcher */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
            {/* Wordmark and Tagline */}
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <h1 className="font-wordmark text-2xl sm:text-3xl tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                  Hawa<span className="text-[#d4af37]">.fm</span>
                </h1>
                {/* Vintage Signal Strength Meter Bars */}
                <div
                  className="flex items-end gap-0.5 h-3 ml-1"
                  title={currentPm25 !== null ? 'Signal locked' : 'Weak signal'}
                >
                  <span
                    className={`w-1 rounded-xs ${
                      currentPm25 !== null ? 'h-1.5 bg-emerald-500' : 'h-1.5 bg-red-500 animate-pulse'
                    }`}
                  />
                  <span
                    className={`w-1 rounded-xs ${
                      currentPm25 !== null ? 'h-2 bg-emerald-500' : 'h-2 bg-zinc-700'
                    }`}
                  />
                  <span
                    className={`w-1 rounded-xs ${
                      currentPm25 !== null ? 'h-2.5 bg-emerald-500' : 'h-2.5 bg-zinc-700'
                    }`}
                  />
                  <span
                    className={`w-1 rounded-xs ${
                      currentPm25 !== null ? 'h-3 bg-emerald-400' : 'h-3 bg-zinc-700'
                    }`}
                  />
                </div>
              </div>
              <span className="text-[10px] font-mono tracking-wider text-[#d4af37] uppercase drop-shadow">
                {currentDict.tagline || "Tune in to Mumbai's air"}
              </span>
            </div>

            {/* Language Switcher & About Pill */}
            <div className="flex items-center gap-1.5">
              {/* Language Switcher */}
              <div
                className="flex rounded-md p-0.5 bg-black/60 border border-zinc-700/60 font-mono text-[10px]"
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
                    className={`px-2 py-0.5 rounded transition-all font-bold ${
                      language === l
                        ? 'bg-[#d4af37] text-black shadow-sm'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {l === 'en' ? 'EN' : l === 'hi' ? 'हिं' : 'मरा'}
                  </button>
                ))}
              </div>

              {/* About Button */}
              <button
                onClick={() => setShowAboutModal(true)}
                className="p-1 rounded-md text-zinc-400 hover:text-white bg-black/40 border border-zinc-800 transition-colors"
                title="About Hawa.fm"
                aria-label="Open About Information"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* CENTRE: THE BIG LCD SCREEN (With Living Skyline & Overlays) */}
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

          {/* FREQUENCY DIAL WITH MOVING NEEDLE */}
          <FrequencyDial
            stations={stations}
            currentStationId={selectedStationId}
            onSelectStation={id => setSelectedStationId(id)}
          />

          {/* BROADCAST VOICE & CAPTIONS TICKER */}
          <BroadcastTicker
            bulletinText={bulletinText}
            language={language}
            isMuted={isMuted}
            onToggleMute={() => {
              const next = !isMuted;
              setIsMuted(next);
              radioAudio.setMuted(next);
            }}
            autoAnnounce={autoAnnounce}
            onToggleAutoAnnounce={() => setAutoAnnounce(!autoAnnounce)}
          />

          {/* BOTTOM CONTROLS: TWO ROTARY KNOBS + CURATED PRESETS */}
          <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
            {/* LEFT ROTARY KNOB: TUNE (STATION) */}
            <RotaryKnob
              label={currentDict.ui?.tune_knob || 'Station Dial'}
              sublabel={currentStation.freqLabel}
              value={stationIndex}
              min={0}
              max={stations.length - 1}
              step={1}
              ticks={stations.length}
              size={68}
              onChange={handleTuneKnobChange}
              ariaLabel="Tune Radio Station"
            />

            {/* CENTRE PRESET BUTTONS & PLAY/PAUSE */}
            <div className="flex flex-col items-center gap-2">
              {/* Preset Moment Buttons */}
              <div className="flex gap-1" role="group" aria-label="Curated historical replay presets">
                {presets.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handlePresetClick(p)}
                    className="px-2 py-1 rounded bg-black/60 hover:bg-[#d4af37]/20 border border-zinc-700/80 hover:border-[#d4af37]/60 text-[9px] font-mono font-bold text-zinc-300 hover:text-white transition-all active:scale-95 shadow-sm"
                    title={p.fullTitle}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Play / Pause Replay & Jump to Live */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    radioAudio.playKnobClick();
                    setIsPlaying(!isPlaying);
                  }}
                  className={`px-3 py-1 rounded-full font-mono text-[10px] font-bold flex items-center gap-1 border shadow transition-all active:scale-95 ${
                    isPlaying
                      ? 'bg-amber-400 text-black border-amber-300 shadow-[0_0_8px_#ffb703]'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-600'
                  }`}
                  aria-label={isPlaying ? 'Pause replay' : 'Auto play event replay'}
                >
                  {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span>{isPlaying ? 'Pause' : 'Replay'}</span>
                </button>

                {/* Jump to Measured Live Reading */}
                <button
                  onClick={() => {
                    radioAudio.playKnobClick();
                    setTimeIndex(timeline.total_hours - 1);
                    setIsPlaying(false);
                  }}
                  className="px-2 py-1 rounded-full font-mono text-[9px] bg-black/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700 transition-colors flex items-center gap-1"
                  title="Jump to latest measured reading"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
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
              size={68}
              onChange={val => {
                setTimeIndex(val);
                if (isPlaying) setIsPlaying(false);
              }}
              ariaLabel="Scrub Time History"
            />
          </div>

          {/* LOWER ACTION PILLS: Air Detective, Air Observatory & Share Card */}
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-[10px] font-mono">
            <button
              onClick={() => {
                radioAudio.playKnobClick();
                setActivePanel(activePanel === 'detective' ? 'none' : 'detective');
              }}
              className={`px-2.5 py-1.5 rounded-md border flex items-center gap-1.5 transition-all ${
                activePanel === 'detective'
                  ? 'bg-amber-400 text-black border-amber-300 font-bold'
                  : 'bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 border-zinc-700'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{currentDict.ui?.detective_tab || 'Air Detective'}</span>
            </button>

            <button
              onClick={() => {
                radioAudio.playKnobClick();
                setActivePanel(activePanel === 'observatory' ? 'none' : 'observatory');
              }}
              className={`px-2.5 py-1.5 rounded-md border flex items-center gap-1.5 transition-all ${
                activePanel === 'observatory'
                  ? 'bg-amber-400 text-black border-amber-300 font-bold'
                  : 'bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 border-zinc-700'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{currentDict.ui?.observatory_tab || 'Air Observatory'}</span>
            </button>

            <button
              onClick={() => {
                radioAudio.playKnobClick();
                setShowShareModal(true);
              }}
              className="px-2.5 py-1.5 rounded-md bg-[#d4af37]/20 hover:bg-[#d4af37]/30 text-[#d4af37] border border-[#d4af37]/40 font-bold flex items-center gap-1.5 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{currentDict.ui?.share || 'Share'}</span>
            </button>
          </div>
        </section>

        {/* DESKTOP SIDE PANEL / SLIDE-IN DRAWER */}
        {activePanel !== 'none' && (
          <aside
            className="w-full lg:w-[460px] h-[580px] lg:h-auto rounded-2xl shadow-2xl overflow-hidden animate-fadeIn"
            aria-label="Auxiliary Air Inspection Panel"
          >
            {activePanel === 'detective' ? (
              <AirDetective
                stations={stations}
                currentStation={currentStation}
                onSelectStation={id => setSelectedStationId(id)}
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
