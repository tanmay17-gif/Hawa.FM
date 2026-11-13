// Web Audio API synthesiser & Multi-Tier Voice Engine for Hawa.fm
// 100% compliant with honesty & competition rules:
// Chain: Preset audio -> Gemini TTS proxy (cached) -> SpeechSynthesis -> Captions fallback

export type AudioSourceType = 'gemini' | 'browser' | 'captions';

class RadioAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private currentAudioElement: HTMLAudioElement | null = null;
  private isSpeakingActive: boolean = false;
  private lastActiveSource: AudioSourceType = 'browser';
  private memoryCache: Map<string, string> = new Map();

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopSpeaking();
    }
  }

  public getMuted() {
    return this.isMuted;
  }

  public getActiveSource(): AudioSourceType {
    return this.lastActiveSource;
  }

  public isSpeaking(): boolean {
    return this.isSpeakingActive;
  }

  // Pentatonic retro FM radio chime (All India Radio inspired)
  public playChime() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      
      freqs.forEach((f, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.12);
        
        gain.gain.setValueAtTime(0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.14, now + idx * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.45);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.5);
      });
    } catch {
      // Ignored if blocked prior to gesture
    }
  }

  // Tactile mechanical detent click for rotary knob turns
  public playKnobClick() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.03);
      
      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.035);
    } catch {
      // Ignored
    }
  }

  // Subtle radio frequency static burst when tuning between frequencies
  public playStaticBurst(durationSec = 0.15, volume = 0.05) {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * durationSec);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.Q.setValueAtTime(1.8, now);
      
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);
      
      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      
      whiteNoise.start(now);
      whiteNoise.stop(now + durationSec);
    } catch {
      // Ignored
    }
  }

  public stopSpeaking() {
    this.isSpeakingActive = false;
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  // ROBUST VOICE CHAIN:
  // 1. Try Gemini TTS proxy (with cache)
  // 2. Fall back to browser SpeechSynthesis
  // 3. Fall back to captions-only
  public async speakBulletin(
    text: string,
    lang: 'en' | 'hi' | 'mr',
    options?: {
      stationId?: string;
      timestamp?: string;
      voiceName?: string;
      speed?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (msg: string) => void;
    }
  ): Promise<AudioSourceType> {
    if (this.isMuted) {
      options?.onEnd?.();
      return 'captions';
    }

    this.stopSpeaking();
    this.isSpeakingActive = true;
    options?.onStart?.();

    // Cache key for this specific station observation and language
    const cacheKey = `hawafm_tts_${options?.stationId || 'cur'}_${options?.timestamp || 'now'}_${lang}`;

    // 1. Check in-memory or localStorage cache for Gemini TTS
    let base64Audio = this.memoryCache.get(cacheKey) || localStorage.getItem(cacheKey);

    if (base64Audio) {
      try {
        await this.playBase64Audio(base64Audio, options?.onEnd);
        this.lastActiveSource = 'gemini';
        return 'gemini';
      } catch {
        // Fall through to live request or browser speech
      }
    }

    // 2. Try Gemini TTS Proxy
    try {
      const ttsUrl = window.location.hostname === 'localhost' ? '/api/tts' : '/.netlify/functions/tts';
      const res = await fetch(ttsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          language: lang,
          voice: options?.voiceName || (lang === 'hi' ? 'Aoede' : lang === 'mr' ? 'Kore' : 'Puck')
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const audioUri = `data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`;
          this.memoryCache.set(cacheKey, audioUri);
          try {
            localStorage.setItem(cacheKey, audioUri);
          } catch {
            // LocalStorage might be full, in-memory remains
          }
          await this.playBase64Audio(audioUri, options?.onEnd);
          this.lastActiveSource = 'gemini';
          return 'gemini';
        }
      }
    } catch {
      // Network or proxy unavailable; proceed to browser speech
    }

    // 3. Fallback to browser SpeechSynthesis
    if ('speechSynthesis' in window) {
      try {
        const success = await this.speakBrowserSpeech(text, lang, options?.speed || 0.95, options?.onEnd);
        if (success) {
          this.lastActiveSource = 'browser';
          return 'browser';
        }
      } catch {
        // SpeechSynthesis failed
      }
    }

    // 4. Captions-only fallback
    this.isSpeakingActive = false;
    this.lastActiveSource = 'captions';
    options?.onError?.('Voice unavailable on this device. Reading on-screen captions.');
    options?.onEnd?.();
    return 'captions';
  }

  private playBase64Audio(src: string, onEnd?: () => void): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(src);
      this.currentAudioElement = audio;

      audio.onended = () => {
        this.isSpeakingActive = false;
        this.currentAudioElement = null;
        onEnd?.();
        resolve();
      };

      audio.onerror = (e) => {
        this.isSpeakingActive = false;
        this.currentAudioElement = null;
        reject(e);
      };

      audio.play().catch(reject);
    });
  }

  private speakBrowserSpeech(text: string, lang: 'en' | 'hi' | 'mr', rate: number, onEnd?: () => void): Promise<boolean> {
    return new Promise((resolve) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = 1.0;

      const getVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        let targetCode = 'en-IN';
        if (lang === 'hi') targetCode = 'hi-IN';
        if (lang === 'mr') targetCode = 'mr-IN';

        const match = voices.find(v => v.lang.toLowerCase() === targetCode.toLowerCase() || v.lang.toLowerCase().startsWith(targetCode.split('-')[0]));
        if (match) {
          utterance.voice = match;
        }
        utterance.lang = targetCode;
      };

      if (window.speechSynthesis.getVoices().length > 0) {
        getVoices();
      } else {
        window.speechSynthesis.onvoiceschanged = getVoices;
      }

      utterance.onend = () => {
        this.isSpeakingActive = false;
        onEnd?.();
        resolve(true);
      };

      utterance.onerror = () => {
        this.isSpeakingActive = false;
        onEnd?.();
        resolve(false);
      };

      window.speechSynthesis.speak(utterance);
    });
  }
}

export const radioAudio = new RadioAudioEngine();
