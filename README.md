# Hawa.fm — Tune in to Mumbai's air

> **Google Mumbai Data Challenge Submission**  
> *Category: Most Creative Submission (Impact, Novelty, Functionality)*

---

## 1. Product Overview

**Hawa.fm** is an FM-radio-style environmental web product designed to make ambient air quality intuitive, tactile, and emotionally resonant for ordinary citizens in Mumbai. Rather than confronting users with clinical dashboards, data tables, or raw AQI numbers, Hawa.fm turns the air into an interactive broadcast.

A central amber/green phosphor LCD screen features an animated **Living Mumbai Skyline** whose atmospheric haze thickens and whose iconic landmarks fade as PM2.5 rises. The user turns tactile rotary knobs to pick a monitoring station across the city, scrubs backwards in time to replay historical pollution episodes, and hears short spoken bulletins in English, Hindi, or Marathi. It detects sustained statistical anomalies and rates regional pollution surges using the **Air Magnitude Index (AMI)**.

---

## 2. Hard Honesty Rules (Strict Competition Compliance)

1. **Honesty:** Every number on screen, every baseline curve, and every spoken word originates strictly from the official competition datasets (`Stations.csv` and `Train.csv`) or deterministic calculations on them. No readings or stations are ever invented.
2. **No Source Attribution:** Statistical spikes are phrased strictly as *"unusual rise, worth investigating"*, never *"caused by vehicular traffic"* or *"caused by industry"*.
3. **Strict Badge State:** A permanent badge on the LCD indicates data provenance: `MEASURED` for latest readings and `REPLAY` for historical exploration. Per challenge rules, because no model prediction file was present, **`FORECAST` mode was deliberately omitted rather than fabricated**.
4. **Transparent Missing Data:** Missing station hours are depicted as analog radio static and a flickering `"NO SIGNAL"` state with a degraded signal meter—never silently interpolated or filled with zeros.
5. **Zero Paid APIs or Runtime LLMs:** 100% open-source stack (React, Vite, TypeScript, Framer Motion, HTML5 Canvas, Web Audio API, Web Speech API). Zero paid APIs, no API keys, and no runtime LLM invocations.
6. **No Jargon in Main UI:** Air quality is presented in friendly vernacular terms (*Fresh*, *Okay*, *Hazy*, *Heavy*, *Severe*). Technical formulas and z-scores are tucked cleanly inside a *"How is this calculated?"* bottom sheet and the *Air Detective* memo.
7. **Deterministic Voice Bulletins:** All spoken and captioned bulletins use fixed sentence templates filled with calculated values.
8. **Mobile-First Responsive Design:** Optimized for 360px phone screens with generous 44px+ tactile touch targets, scaling up seamlessly to a dual-panel desktop observatory.

---

## 3. Data Pipeline & Architecture

The raw competition dataset contains **48,400 hourly observations** across 4 official continuous OpenAQ/CPCB stations from **February 19, 2025 to November 10, 2026 IST** (~15,103 hours).

### Precomputed Offline Artifacts (`scripts/build_data.py`)
Run offline to compile the raw files into ultra-compact, client-ready JSON files in `public/data/` (total uncompressed footprint: **0.78 MB**, under **120 KB gzipped**):

- `stations.json`: Official station metadata (IITM & BMC), coordinates, area labels, and FM tuning frequencies (91.1 to 104.8 FM).
- `timeline.json`: Aligned hourly timestamp sequence spanning the entire monitoring window.
- `hourly.json`: Columnar arrays of PM2.5 concentrations for each station (missing records marked as `null`).
- `baselines.json`: Hourly diurnal baselines (median, 25th percentile, 75th percentile, interquartile range, and Median Absolute Deviation [MAD]) for each station.
- `anomalies.json`: Sustained anomaly episodes computed using a robust z-score:
  $$\text{Robust } Z = \frac{\text{PM}_{2.5} - \text{Median}_{\text{hour}}}{1.4826 \times \text{MAD}_{\text{hour}}}$$
  Episodes are flagged only when $Z \ge 2.5$ and $\text{PM}_{2.5} \ge 60\ \mu\text{g/m}^3$ for at least 2 consecutive hours (ensuring regular nighttime atmospheric boundary layer shallowing is *not* misclassified as an anomaly). Concurrency with neighboring stations classifies each episode as either **isolated** or **widespread**.
- `events.json`: Catalogs major multi-station pollution surges with duration, peak timing, and recovery windows (hours until stations return to within 25% of their diurnal baseline).
- `ami.json`: Air Magnitude Index calculations and sensitivity test results.
- `presets.json`: Curated historical timestamps for one-touch navigation.
- `public/i18n/{en,hi,mr}.json`: Multi-lingual bulletin templates.

---

## 4. The Air Magnitude Index (AMI)

The **Air Magnitude Index (AMI)** provides a transparent 0 to 10 scale to measure the regional severity of major air pollution events across Mumbai, analogous to how the Richter scale measures earthquakes.

### Two-Sentence Summary
> *The Air Magnitude Index (AMI) scores regional pollution events from 0 to 10 based on peak intensity above baseline, episode duration, station breadth, and spatial spread across Mumbai. Sensitivity checks across three alternative weighting models confirm consistent relative rankings, proving the robustness of the classification.*

### Mathematical Formula
$$\text{AMI} = 10 \times \left( 0.35 \cdot I + 0.25 \cdot D + 0.25 \cdot N + 0.15 \cdot S \right)$$

Where each component is normalized between 0.0 and 1.0:
1. **Intensity ($I$):** Peak PM2.5 above clean baseline: $\min\left(1.0, \max\left(0, \frac{\text{Peak} - 25}{475}\right)\right)$.
2. **Duration ($D$):** Hours of continuous elevated readings: $\min\left(1.0, \frac{\text{Duration}}{72}\right)$.
3. **Station Breadth ($N$):** Fraction of Mumbai monitoring stations elevated: $\frac{\text{Affected Stations}}{4}$.
4. **Spatial Spread ($S$):** Geographical extent across Suburban North and South Mumbai (1.0 for multi-zone span, 0.5 for localized zone).

### Sensitivity Analysis (Stress Test)
To verify that rankings are mathematically stable rather than an artifact of chosen weights, three alternative formulations were tested:

| Event ID | Event Description | Peak Date | Primary AMI (Baseline) | Model A (Intensity 50%) | Model B (Duration 45%) | Model C (Equal 25%) | Ranking Stability |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `event_1` | October 2025 Festival Week (Diwali) | 2025-10-21 | **8.6** | 8.8 | 8.4 | 8.5 | **Rank #1** (Stable) |
| `event_2` | November 2026 Late Autumn Spike | 2026-11-08 | **8.4** | 8.7 | 8.1 | 8.3 | **Rank #2** (Stable) |
| `event_3` | December 2025 Winter Stagnation | 2025-12-17 | **7.5** | 7.1 | 7.9 | 7.6 | **Rank #3** (Stable) |
| `event_4` | January 2026 Winter Inversion | 2026-01-22 | **7.2** | 6.8 | 7.6 | 7.3 | **Rank #4** (Stable) |
| `event_monsoon` | July 2025 Monsoon Clean Baseline | 2025-07-28 | **1.2** | 0.9 | 1.4 | 1.1 | **Cleanest** (Stable) |

*Result:* Primary rankings are 100% concordant across models; maximum rank displacement across any permutation is $\le 1$ position.

---

## 5. Google Tools & Attribution

- **Language Drafting:** Hindi and Marathi radio broadcast bulletins were drafted offline using **Google Gemini** to establish natural regional cadence (modeled after classic All India Radio / Aakashvani broadcasts), and subsequently verified for grammar and tone.
- **Zero Runtime AI Calls:** All translations and bulletin sentences run purely client-side from static JSON dictionaries with string substitution.

---

## 6. 60-Second Demo Script for Judges

Follow this sequence to experience the full impact of Hawa.fm in one minute:

1. **The First 5 Seconds (Power On & Tactile Radio):**
   - Open Hawa.fm. Notice the retro FM radio chassis, glowing LCD, and brass frequency dial.
   - Tap anywhere or click the **Language Switcher** (`EN` / `हिं` / `मरा`). A warm synthesised pentatonic chime plays and the tactile knob clicks.
2. **The Hero Feature: The Living Skyline (Seconds 5–20):**
   - Look inside the central LCD screen. Notice the 5-layer animated Mumbai skyline (Bandra-Worli Sea Link, Gateway of India, Worli towers with blinking night lights, moving local train, and sparkling Arabian Sea).
   - Turn the **TUNE Knob** (or click across the Frequency Dial from `91.1` to `104.8 FM`). Notice the radio needle sweep and the brief static hiss between stations.
3. **Event Replay & Curated Presets (Seconds 20–35):**
   - Click the **`Diwali`** preset button (Oct 21, 2025 02:00 IST).
   - Watch the skyline transform: the Bandra-Worli Sea Link completely disappears into dense sepia smog, the moon dims, and particulate dust fills the air as PM2.5 spikes past 718 µg/m³.
   - Click the **`Monsoon Low`** preset button (July 28, 2025 14:00 IST). Notice the skyline instantly clear up, the Sea Link reappear, the sea turn deep blue, and the air word switch to `Fresh` (11.2 µg/m³).
4. **Air Detective & Investigation Note (Seconds 35–48):**
   - Click the **`Air Detective`** button in the lower bar.
   - Inspect the stylised Mumbai coastline map with glowing station nodes.
   - Point to the 24-hour *"Usual Baseline vs. Today"* curve showing how today's spike diverges from the diurnal baseline.
   - Click **`Create Investigation Note`** to view the clean, printable one-page diagnostic brief (with strict honesty caveats).
5. **Air Observatory & Audio Bulletin (Seconds 48–60):**
   - Switch to the **`Air Observatory`** tab.
   - Show the **Air Magnitude Index (AMI: 8.6 / 10)** gauge, the red pollution seismograph waveform, and the recovery timeline (36 hours).
   - Click **`Broadcast Voice`** in the ticker to hear the speech bulletin read aloud.
   - Click **`Share`** to generate and download the retro broadcast card PNG.

---

## 7. Local Development & Build

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+ (for offline data pipeline)

### Setup & Run
```bash
# 1. Clone repository
git clone https://github.com/your-username/hawa-fm.git
cd hawa-fm

# 2. Run Python data build pipeline (precomputes data into public/data/)
python3 scripts/build_data.py

# 3. Install frontend dependencies
npm install

# 4. Start Vite development server
npm run dev

# 5. Build optimized static production bundle
npm run build
```

---

## 8. Deployment to Free Static Hosts

Hawa.fm is a 100% static client-side web application that requires no runtime servers or databases.

### Deploy to Netlify (Recommended)
1. Fork or push this repository to GitHub.
2. Sign in to [Netlify](https://app.netlify.com).
3. Click **"Add new site"** → **"Import an existing project"** → select your GitHub repository.
4. Netlify will automatically detect `netlify.toml` with:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Click **Deploy**. Your site will be live on a custom `.netlify.app` domain with free SSL.

### Deploy to GitHub Pages
1. Push this repository to GitHub.
2. In your repository settings, go to **Settings** → **Pages** → under **Build and deployment**, select **Source: GitHub Actions**.
3. Push any commit to `main`; the included `.github/workflows/deploy.yml` workflow will automatically build and publish to your `<user>.github.io/<repo>` URL.

### Deploy to Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting # Select 'dist' as the public directory
npm run build
firebase deploy --only hosting
```

---

## 9. Limitations & Future Roadmap

### Current Limitations
- **Station Coverage:** Uses the 4 official continuous benchmark stations from the Zindi challenge. Intermediate suburban microclimates rely on the nearest monitor.
- **Weather / Meteorological Variables:** Neither rainfall nor wind vector columns were present in the competition dataset; hence meteorological correlations were omitted to maintain strict scientific honesty.
- **Forecast Display:** Because no validated prediction submission file was supplied, forecasting mode was excluded per challenge Rule 3.

### Roadmap
- [ ] **Live CPCB Stream:** Webhook ingestion of real-time CPCB 15-minute sensor feeds as they publish.
- [ ] **Model Forecast Mode:** Seamless integration with trained ML forecasting models (LightGBM/MLP) to toggle the `FORECAST` badge on the LCD.
- [ ] **Arabian Sea Wind Vectors:** Incorporation of Open-Meteo marine wind data to animate directional drift vectors across the Mumbai bay.
- [ ] **Citizen Audio Reports:** Allowing community ambient sound snippets (rain showers, local train chimes) mapped to stations.

---

## License
MIT License. Open-source submission for the Google Mumbai Data Challenge.
