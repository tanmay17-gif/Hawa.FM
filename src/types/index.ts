export interface Station {
  id: string;
  name: string;
  fullName: string;
  agency: string;
  area: string;
  description: string;
  frequency: number;
  freqLabel: string;
  lat: number | null;
  lon: number | null;
  sensor_id?: string;
}

export interface TimelineData {
  start: string;
  end: string;
  total_hours: number;
  timestamps: string[];
}

export interface DiurnalHour {
  hour: number;
  median: number;
  q25: number;
  q75: number;
  iqr: number;
  mad: number;
  mean: number;
}

export interface StationBaseline {
  diurnal: DiurnalHour[];
}

export interface AnomalyEpisode {
  startIndex: number;
  endIndex: number;
  startTime: string;
  endTime: string;
  peakTime: string;
  peakIndex: number;
  durationHours: number;
  peakPm25: number;
  peakRobustZ: number;
  scope: 'isolated' | 'widespread';
  concurrentElevatedStations: number;
}

export interface MajorEvent {
  id: string;
  title: string;
  tag: string;
  startIndex: number;
  endIndex: number;
  startTime: string;
  endTime: string;
  peakIndex: number;
  peakTime: string;
  peakPm25: number;
  durationHours: number;
  recoveryHours: number;
  affectedStations: string[];
}

export interface AmiData {
  formula: {
    description: string;
    two_sentence_summary: string;
    weights: {
      intensity: number;
      duration: number;
      stations: number;
      spatial_spread: number;
    };
  };
  events: Array<{
    eventId: string;
    title: string;
    peakDate: string;
    peakPm25: number;
    durationHours: number;
    recoveryHours: number;
    ingredients: {
      intensity_normalized: number;
      duration_normalized: number;
      stations_normalized: number;
      spread_normalized: number;
    };
    ami: number;
    sensitivity: {
      intensity_heavy: number;
      duration_heavy: number;
      equal_weights: number;
    };
  }>;
  sensitivity_check: {
    alternative_models: Array<{
      name: string;
      weights: Record<string, number>;
    }>;
    ranking_stability: string;
  };
}

export interface PresetMoment {
  id: string;
  label: string;
  fullTitle: string;
  timestamp: string;
  stationId: string;
  description: string;
}

export type AirCategory = 'fresh' | 'okay' | 'hazy' | 'heavy' | 'severe';
export type Language = 'en' | 'hi' | 'mr';
export type ModeBadge = 'MEASURED' | 'REPLAY';
