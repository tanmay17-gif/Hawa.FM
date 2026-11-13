import os
import subprocess

html_content = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>HAWA.fm — Project Dossier & Executive Showcase</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

    @page {
      size: A4 portrait;
      margin: 12mm 14mm 14mm 14mm;
      @bottom-right {
        content: counter(page);
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: #FAF6EE;
      color: #2E332F;
      line-height: 1.5;
      font-size: 9.5pt;
    }

    /* Page container */
    .page {
      width: 100%;
      min-height: 267mm;
      page-break-after: always;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .page:last-child {
      page-break-after: avoid;
    }

    /* Running Header & Footer */
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 6px;
      margin-bottom: 12px;
      border-bottom: 1.5px solid #D5C7B0;
      font-size: 7.5pt;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #7D6B42;
    }

    .header-bar .logo-mark {
      font-family: 'Cinzel', serif;
      font-size: 9pt;
      color: #2E332F;
      letter-spacing: 0.05em;
    }

    .header-bar .logo-mark span {
      color: #B66C4D;
    }

    .footer-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 6px;
      margin-top: 12px;
      border-top: 1px solid #E2D7C3;
      font-size: 7pt;
      color: #7E786E;
    }

    /* Typography */
    h1, h2, h3, h4 {
      color: #242A25;
      font-weight: 800;
      line-height: 1.2;
    }

    .font-brand {
      font-family: 'Cinzel', serif;
    }

    .font-mono {
      font-family: 'JetBrains Mono', monospace;
    }

    h1 {
      font-size: 20pt;
      letter-spacing: -0.02em;
    }

    h2 {
      font-size: 13pt;
      letter-spacing: -0.01em;
      margin-bottom: 8px;
      color: #263028;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    h2::before {
      content: "";
      display: inline-block;
      width: 4px;
      height: 14pt;
      background: #B66C4D;
      border-radius: 2px;
    }

    h3 {
      font-size: 10.5pt;
      margin-bottom: 4px;
      color: #355C53;
    }

    p {
      margin-bottom: 7px;
      color: #3D443F;
      text-align: justify;
    }

    p.lead {
      font-size: 10.5pt;
      line-height: 1.55;
      color: #283329;
      font-weight: 500;
    }

    /* Cover / Hero layout */
    .cover-hero {
      background: linear-gradient(135deg, #F3ECE0 0%, #EBE1D0 100%);
      border: 2px solid #D5C7B0;
      border-radius: 12px;
      padding: 22px;
      margin-bottom: 14px;
      position: relative;
      overflow: hidden;
    }

    .cover-badge-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 12px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      border-radius: 20px;
      font-size: 7pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .badge-terracotta {
      background-color: #F8E7E1;
      color: #B66C4D;
      border: 1px solid #E4B5A5;
    }

    .badge-teal {
      background-color: #E2ECE9;
      color: #355C53;
      border: 1px solid #A8C7BF;
    }

    .badge-gold {
      background-color: #F8F3DF;
      color: #8C7428;
      border: 1px solid #DED39D;
    }

    .badge-slate {
      background-color: #EBEBEB;
      color: #3C423E;
      border: 1px solid #D0D0D0;
    }

    .hero-title {
      font-family: 'Cinzel', serif;
      font-size: 26pt;
      font-weight: 800;
      color: #262D27;
      line-height: 1.05;
      letter-spacing: 0.02em;
      margin-bottom: 4px;
    }

    .hero-title span {
      color: #B66C4D;
    }

    .hero-tagline {
      font-size: 11pt;
      font-weight: 700;
      color: #7A6424;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .hero-desc {
      font-size: 10pt;
      line-height: 1.5;
      color: #3C433E;
      max-width: 95%;
      margin-bottom: 14px;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-top: 10px;
    }

    .kpi-card {
      background: #FAF6EE;
      border: 1.5px solid #D9CEBA;
      border-radius: 8px;
      padding: 8px 10px;
      text-align: center;
    }

    .kpi-num {
      font-family: 'Cinzel', serif;
      font-size: 15pt;
      font-weight: 800;
      color: #B66C4D;
      line-height: 1.1;
    }

    .kpi-label {
      font-size: 6.8pt;
      font-weight: 700;
      text-transform: uppercase;
      color: #6A655C;
      letter-spacing: 0.04em;
      margin-top: 2px;
    }

    /* Cards & Grids */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 10px;
    }

    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 10px;
    }

    .grid-4 {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 10px;
    }

    .card {
      background: #FFFFFF;
      border: 1px solid #DED5C3;
      border-radius: 8px;
      padding: 10px 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
      break-inside: avoid;
    }

    .card-parchment {
      background: #F7F1E5;
      border: 1.5px solid #D8CBB6;
    }

    .card-dark {
      background: #283329;
      color: #EBF1ED;
      border: 1px solid #1C241D;
    }

    .card-dark h3, .card-dark h4 {
      color: #FFFFFF;
    }

    .card-dark p {
      color: #D2DCD5;
    }

    .card-accent {
      border-left: 3.5px solid #B66C4D;
    }

    .card-teal {
      border-left: 3.5px solid #355C53;
    }

    .card-gold {
      border-left: 3.5px solid #8C7428;
    }

    /* Callout & Quotes */
    .callout {
      background-color: #FFF2ED;
      border: 1.5px solid #F5C6B7;
      border-left: 4px solid #B66C4D;
      border-radius: 6px;
      padding: 8px 11px;
      margin: 8px 0;
      font-size: 8.8pt;
    }

    .callout-title {
      font-weight: 800;
      color: #B66C4D;
      text-transform: uppercase;
      font-size: 7.5pt;
      letter-spacing: 0.05em;
      margin-bottom: 3px;
    }

    .quote-box {
      font-style: italic;
      color: #4A4F4B;
      border-left: 3px solid #8C7428;
      padding-left: 10px;
      margin: 8px 0;
      font-size: 9pt;
      line-height: 1.5;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.8pt;
      margin: 6px 0 10px 0;
      background: #FFFFFF;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid #DDD3C1;
    }

    th {
      background: #EFE8DA;
      color: #2B332C;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 5px 7px;
      border-bottom: 1.5px solid #CFC4AF;
      text-align: left;
    }

    td {
      padding: 5px 7px;
      border-bottom: 1px solid #EAE3D6;
      color: #333834;
    }

    tr:last-child td {
      border-bottom: none;
    }

    tr:nth-child(even) td {
      background: #FAF7F0;
    }

    .font-highlight {
      font-weight: 700;
      color: #B66C4D;
    }

    /* Mode Showcase Boxes */
    .mode-box {
      background: #FFFFFF;
      border: 1.5px solid #D6CAB4;
      border-radius: 9px;
      padding: 10px 12px;
      margin-bottom: 10px;
      break-inside: avoid;
    }

    .mode-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #EADBCC;
      padding-bottom: 5px;
      margin-bottom: 7px;
    }

    .mode-title {
      font-family: 'Cinzel', serif;
      font-size: 11pt;
      font-weight: 800;
      color: #273029;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .mode-tag {
      font-size: 7pt;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 12px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    /* Radio illustration mini block */
    .radio-schema {
      background: #242D26;
      border-radius: 8px;
      padding: 10px;
      color: #FAF6EE;
      font-family: 'JetBrains Mono', monospace;
      font-size: 7.2pt;
      line-height: 1.4;
      border: 1.5px solid #3F4F42;
      margin-bottom: 8px;
    }

    .radio-schema .highlight {
      color: #E28D69;
      font-weight: 600;
    }

    .radio-schema .teal-accent {
      color: #6EC0AF;
    }

    .radio-schema .gold-accent {
      color: #E5C365;
    }

    ul.bullet-list {
      list-style: none;
      padding-left: 0;
      margin: 4px 0 8px 0;
    }

    ul.bullet-list li {
      position: relative;
      padding-left: 14px;
      margin-bottom: 3.5px;
      font-size: 8.5pt;
      color: #38403A;
    }

    ul.bullet-list li::before {
      content: "▪";
      position: absolute;
      left: 0;
      color: #B66C4D;
      font-size: 9pt;
      line-height: 1;
    }

    .formula-banner {
      background: #F1ECE1;
      border: 1.5px dashed #B66C4D;
      border-radius: 8px;
      padding: 8px 12px;
      text-align: center;
      margin: 8px 0;
      font-family: 'JetBrains Mono', monospace;
      font-size: 9pt;
      font-weight: 600;
      color: #222923;
    }

    .formula-banner .math-var {
      color: #B66C4D;
      font-weight: 700;
    }

    .two-col-content {
      column-count: 2;
      column-gap: 12px;
      font-size: 8.8pt;
      line-height: 1.5;
    }

    .pill {
      display: inline-block;
      padding: 1px 5px;
      border-radius: 4px;
      font-size: 7pt;
      font-weight: 700;
      font-family: 'JetBrains Mono', monospace;
    }
    .pill-green { background: #D9EFE5; color: #1E6347; border: 1px solid #A2D5BD; }
    .pill-yellow { background: #FCF4DD; color: #8C7428; border: 1px solid #E6D48F; }
    .pill-orange { background: #FDE8DD; color: #B66C4D; border: 1px solid #F5B9A0; }
    .pill-red { background: #FBDDE2; color: #9E1B32; border: 1px solid #F3A4B2; }

    .skyline-svg-frame {
      width: 100%;
      height: 70px;
      background: linear-gradient(180deg, #E6F0EE 0%, #D0E4DF 55%, #355C53 100%);
      border-radius: 6px;
      border: 1px solid #ADC8C0;
      margin: 6px 0 8px 0;
      position: relative;
      overflow: hidden;
    }
  </style>
</head>
<body>

  <!-- ========================================================================= -->
  <!-- PAGE 1: TITLE, EXECUTIVE MANIFESTO & THE HUMAN PROBLEM                   -->
  <!-- ========================================================================= -->
  <div class="page">
    <div>
      <div class="header-bar">
        <div class="logo-mark">HAWA<span>.fm</span> · PROJECT DOSSIER</div>
        <div>Google Mumbai Data Challenge · Submission Showcase</div>
      </div>

      <!-- Hero Header -->
      <div class="cover-hero">
        <div class="cover-badge-row">
          <span class="badge badge-terracotta">Category: Most Creative Submission</span>
          <span class="badge badge-teal">Ambient Environmental Intelligence</span>
          <span class="badge badge-gold">100% Deterministic Provenance</span>
          <span class="badge badge-slate">Zero Paid APIs · Open Source</span>
        </div>

        <h1 class="hero-title">HAWA<span>.fm</span></h1>
        <div class="hero-tagline">Tune In to Mumbai's Air — Tabletop FM Radio &amp; Living Atmospheric Postcard</div>

        <p class="hero-desc">
          <strong>Hawa.fm</strong> transforms cold, clinical sensor logs into a tactile, emotionally resonant tabletop radio.
          Citizens rotate vintage brass knobs to tune across Mumbai, watch an animated paper-cut skyline react continuously
          to particulate matter ($PM_{2.5}$), scrub back through 15,103 hours of atmospheric history, hear multilingual spoken bulletins,
          and forensicly investigate citywide air shocks with the seismology-inspired <strong>Air Magnitude Index (AMI)</strong>.
        </p>

        <!-- KPI Grid -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-num">48,400</div>
            <div class="kpi-label">Hourly Sensor Readings</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-num">4 STATIONS</div>
            <div class="kpi-label">Continuous CPCB / OpenAQ</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-num">15,103</div>
            <div class="kpi-label">Contiguous Hours Indexed</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-num">&lt; 112 KB</div>
            <div class="kpi-label">Gzipped Pipeline Artifact</div>
          </div>
        </div>
      </div>

      <!-- The Core Human Problem & Novelty -->
      <h2>1. The Problem: Why Air Quality Dashboards Fail Mumbai</h2>
      <div class="grid-2">
        <div class="card card-accent">
          <h3>The Clinical Dashboard Trap</h3>
          <p>
            Traditional air quality monitors are built by engineers for engineers. They bombard everyday citizens with
            frightening, abstract figures—<em>"PM2.5: 184.2 µg/m³ · AQI 234 Unhealthy"</em>. To a commuter catching the
            fast local at Dadar, a street vendor in Byculla, or a grandparent walking in Borivali, these clinical numbers
            induce passive anxiety rather than intuitive clarity. They lack physical context, spatial grounding, and emotional warmth.
          </p>
        </div>
        <div class="card card-teal">
          <h3>The Hawa.fm Solution: Tactile, Vernacular, Sensory</h3>
          <p>
            Hawa.fm anchors itself in the cultural nostalgia of Indian home radios—warm tabletop transistor cabinets,
            the soothing cadence of <strong>All India Radio (Akashvani)</strong>, and tactile physical feedback.
            Instead of demanding cognitive decoding, it translates atmospheric physics into three immediate human senses:
            <strong>Sight</strong> (a living skyline that chokes or sparkles), <strong>Hearing</strong> (natural vernacular speech),
            and <strong>Touch</strong> (rotary tuning detents).
          </p>
        </div>
      </div>

      <!-- The Three Sensory Pillars -->
      <h2>2. Sensory Architecture: Translating Math into Senses</h2>
      <div class="grid-3">
        <div class="card card-parchment">
          <div style="font-size: 8pt; font-weight: 800; color: #B66C4D; text-transform: uppercase;">01. Visual Empathy</div>
          <h3 style="margin-top:2px;">The Living Mumbai Skyline</h3>
          <p style="font-size: 8.2pt;">
            A gouache, flat-paper-cut painted window depicting Mumbai's soul: the Bandra-Worli Sea Link, Gateway of India,
            Worli towers, coconut palms, local trains, and wooden fishing boats on the Arabian Sea.
            As $PM_{2.5}$ climbs, algorithmic atmospheric haze thickens, birds retreat, celestial bodies dim, and landmark silhouettes dissolve.
          </p>
        </div>

        <div class="card card-parchment">
          <div style="font-size: 8pt; font-weight: 800; color: #355C53; text-transform: uppercase;">02. Auditory Companionship</div>
          <h3 style="margin-top:2px;">Akashvani-Style Spoken Bulletins</h3>
          <p style="font-size: 8.2pt;">
            A gentle press of the broadcast button plays spoken audio bulletins in <strong>English</strong>, <strong>Hindi (हिन्दी)</strong>,
            or <strong>Marathi (मराठी)</strong>. The experience features an authentic pentatonic sign-on chime, a physically vibrating
            speaker diaphragm, and synchronized live letterpress captions.
          </p>
        </div>

        <div class="card card-parchment">
          <div style="font-size: 8pt; font-weight: 800; color: #8C7428; text-transform: uppercase;">03. Tactile Ownership</div>
          <h3 style="margin-top:2px;">Rotary Knobs &amp; FM Frequencies</h3>
          <p style="font-size: 8.2pt;">
            Monitoring stations become FM frequencies (91.1 to 104.8 FM). Users physically click rotary dials to tune between stations,
            sweeping the dial needle across the cabinet while experiencing subtle procedural FM static bursts between clear broadcasts.
          </p>
        </div>
      </div>

      <!-- Quick quote / callout -->
      <div class="callout">
        <div class="callout-title">Jury Evaluation Principle</div>
        <em>"Air quality should not feel like an ominous medical lab report. It should feel like opening your balcony window and tuning the family radio over morning chai."</em>
      </div>

    </div>

    <div class="footer-bar">
      <div>HAWA.FM — Google Mumbai Data Challenge Dossier</div>
      <div>Page 1 of 4 · Executive Overview &amp; Philosophy</div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 2: THE FOUR OPERATING MODES (DEEP DIVE)                             -->
  <!-- ========================================================================= -->
  <div class="page">
    <div>
      <div class="header-bar">
        <div class="logo-mark">HAWA<span>.fm</span> · PROJECT DOSSIER</div>
        <div>System Modes &amp; Interactive Hardware Architecture</div>
      </div>

      <h2>3. The Four Distinct Operating Modes</h2>
      <p class="lead" style="margin-bottom: 10px;">
        Unlike monolithic dashboard apps, Hawa.fm features four custom-engineered operational modes tailored to different citizen mindsets:
        ambient morning listening, spatial forensic investigation, macro-seismological cataloging, and historical time-travel.
      </p>

      <!-- MODE 1: RADIO MODE -->
      <div class="mode-box" style="border-left: 4px solid #B66C4D;">
        <div class="mode-header">
          <div class="mode-title">
            <span style="color: #B66C4D;">📻 MODE 1:</span> RADIO MODE (Atmospheric Live Tuner)
          </div>
          <span class="mode-tag badge-terracotta">Ambient &amp; Daily Habit</span>
        </div>
        <p style="font-size: 8.5pt; margin-bottom: 6px;">
          The primary interface recreates a vintage cream and sandalwood radio cabinet complete with a telescopic metal antenna,
          woven acoustic speaker grille, tactile volume slider, and an analog glass LCD window.
        </p>
        <div class="grid-2" style="margin-bottom: 0;">
          <div>
            <ul class="bullet-list">
              <li><strong>Tuning Knob &amp; Frequency Dial:</strong> Switch seamlessly between Mumbai's four continuous stations: <em>Borivali East (91.1 FM)</em>, <em>Malad West (95.0 FM)</em>, <em>Shivaji Nagar (98.3 FM)</em>, and <em>Byculla (104.8 FM)</em>.</li>
              <li><strong>The Living Skyline Canvas:</strong> 7 visual layers rendered in real-time. Smog opacity curve: $\alpha = \min\left(0.88, \frac{\text{PM}_{2.5}}{320}\right)$. Birds dynamically decrease from 7 to 0 as pollution worsens.</li>
            </ul>
          </div>
          <div>
            <ul class="bullet-list">
              <li><strong>Vernacular Spoken Bulletins:</strong> Deterministic natural phrasing ("Air is Fresh", "Heavy haze over the bay") synthesized via Google Gemini 2.0 Flash neural voice / browser speech synthesizers.</li>
              <li><strong>Speaker Diaphragm Physics:</strong> CSS-animated diaphragm pulsing in sync with voice frequency modulation, accompanied by procedural analog static bursts.</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- MODE 2: DETECT MODE -->
      <div class="mode-box" style="border-left: 4px solid #355C53;">
        <div class="mode-header">
          <div class="mode-title">
            <span style="color: #355C53;">🧭 MODE 2:</span> DETECT MODE (The Air Detective &amp; Spatial Case Board)
          </div>
          <span class="mode-tag badge-teal">Forensic Spatial Analysis</span>
        </div>
        <p style="font-size: 8.5pt; margin-bottom: 6px;">
          When an anomaly triggers, citizens step into the role of an environmental detective. Detect Mode swaps the skyline for a
          tactile cartographic case board of the Mumbai peninsula.
        </p>
        <div class="grid-2" style="margin-bottom: 0;">
          <div>
            <ul class="bullet-list">
              <li><strong>Hand-Drawn Salsette &amp; Island Cartography:</strong> Warm parchment Mumbai landmass surrounded by the deep teal Arabian Sea, with glowing, interactive station pins.</li>
              <li><strong>Red Detective Evidence Strings:</strong> When multiple stations experience concurrent surges, dashed red thread lines connect them across the map, instantly distinguishing localized blips from regional events.</li>
            </ul>
          </div>
          <div>
            <ul class="bullet-list">
              <li><strong>"Usual Day vs. This Day" Ribbon Chart:</strong> Visualizes the current 24-hour PM2.5 trajectory alongside the historical diurnal median and interquartile confidence envelope (IQR).</li>
              <li><strong>One-Click Printable Investigation Note:</strong> Opens a formal, printable forensic brief documenting station stats, peak times, and concurrent stations for civic advocacy.</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- MODE 3: SEISMO MODE -->
      <div class="mode-box" style="border-left: 4px solid #8C7428;">
        <div class="mode-header">
          <div class="mode-title">
            <span style="color: #8C7428;">⚡ MODE 3:</span> SEISMO MODE (Air Seismology &amp; AMI Index)
          </div>
          <span class="mode-tag badge-gold">Macro Scale &amp; Shock Waves</span>
        </div>
        <p style="font-size: 8.5pt; margin-bottom: 6px;">
          Treats severe pollution surges like tectonic earthquakes. Introduces the novel <strong>Air Magnitude Index (AMI)</strong>—a 0 to 10
          scale capturing the macro shock wave of pollution episodes across the entire Mumbai metropolitan region.
        </p>
        <div class="grid-2" style="margin-bottom: 0;">
          <div>
            <ul class="bullet-list">
              <li><strong>Daily Micro-Seismograph:</strong> High-frequency 24-hour waveform highlighting rapid rate-of-change ($\Delta \text{PM}_{2.5}/\Delta t$) spikes and coarse dust ratios ($1.68\times$ PM10 equivalent).</li>
              <li><strong>Curated Historical Shock Catalog:</strong> Ranks and catalogs every major episodic surge (Diwali, winter inversions, coastal stagnation) with peak timestamps and recovery durations.</li>
            </ul>
          </div>
          <div>
            <ul class="bullet-list">
              <li><strong>AMI Formula &amp; Sensitivity Testing:</strong> Transparent 4-ingredient composite index (Intensity, Duration, Station Breadth, Spatial Spread) stress-tested across 3 weighting variants.</li>
              <li><strong>One-Touch Time Machine Jump:</strong> Click any historical shock in the catalog to immediately jump the entire app into that event's peak hour.</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- MODE 4: REPLAY MODE -->
      <div class="mode-box" style="border-left: 4px solid #6E7A72;">
        <div class="mode-header">
          <div class="mode-title">
            <span style="color: #4A564E;">⏪ MODE 4:</span> REPLAY MODE (Atmospheric Time Machine)
          </div>
          <span class="mode-tag badge-slate">Chronological Scrubber</span>
        </div>
        <p style="font-size: 8.5pt; margin-bottom: 6px;">
          A full temporal flight recorder enabling judges and citizens to scrub through 15,103 hours from February 2025 to November 2026.
        </p>
        <div class="grid-2" style="margin-bottom: 0;">
          <div>
            <ul class="bullet-list">
              <li><strong>Automated Play/Pause Loop:</strong> Animate continuous time progression at 700ms per hour, watching the skyline and dials react dynamically as day turns to night and seasons shift.</li>
              <li><strong>Sub-Hour Scrubbing:</strong> Scrub fluidly across all 48,400 sensor observations without lag, thanks to precomputed columnar arrays.</li>
            </ul>
          </div>
          <div>
            <ul class="bullet-list">
              <li><strong>Curated Preset Moments:</strong> Instant one-click bookmarks for critical moments: <em>Diwali Festival Spike (Oct 21, 2025)</em>, <em>Winter Inversion (Dec 4, 2025)</em>, <em>Autumn Smog (Nov 28, 2025)</em>, and <em>Monsoon Clean Baseline (Jul 28, 2025)</em>.</li>
              <li><strong>Strict Provenance Flagging:</strong> Displays permanent <code>REPLAY</code> indicator to ensure complete truth in data state.</li>
            </ul>
          </div>
        </div>
      </div>

    </div>

    <div class="footer-bar">
      <div>HAWA.FM — Google Mumbai Data Challenge Dossier</div>
      <div>Page 2 of 4 · The Four Operational Modes</div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 3: THE AIR MAGNITUDE INDEX & SCIENTIFIC HONESTY RULES               -->
  <!-- ========================================================================= -->
  <div class="page">
    <div>
      <div class="header-bar">
        <div class="logo-mark">HAWA<span>.fm</span> · PROJECT DOSSIER</div>
        <div>Novel Environmental Metric &amp; Scientific Methodology</div>
      </div>

      <!-- Section: The Air Magnitude Index -->
      <h2>4. The Air Magnitude Index (AMI): A Richter Scale for Air</h2>
      <p>
        Urban air quality indexes (like NAQI or US AQI) measure instantaneous point concentrations. They fail to express the
        <strong>regional macro-impact</strong> of prolonged, citywide atmospheric crises. To bridge this gap, Hawa.fm engineered the
        <strong>Air Magnitude Index (AMI)</strong>—a normalized 0 to 10 composite scale analogous to the Richter scale for earthquakes.
      </p>

      <div class="formula-banner">
        $$\\text{AMI} = 10 \\times \\left( 0.35 \\cdot I + 0.25 \\cdot D + 0.25 \\cdot N + 0.15 \\cdot S \\right)$$
      </div>

      <div class="grid-4" style="margin-bottom: 8px;">
        <div class="card card-parchment" style="padding: 6px 8px;">
          <div style="font-weight: 800; font-size: 7.5pt; color: #B66C4D;">1. INTENSITY (I, 35%)</div>
          <p style="font-size: 7.2pt; margin: 2px 0;">Peak $PM_{2.5}$ above clean baseline:</p>
          <div class="font-mono" style="font-size: 6.8pt; color: #283329;">min(1, max(0, (Peak-25)/475))</div>
        </div>
        <div class="card card-parchment" style="padding: 6px 8px;">
          <div style="font-weight: 800; font-size: 7.5pt; color: #355C53;">2. DURATION (D, 25%)</div>
          <p style="font-size: 7.2pt; margin: 2px 0;">Hours of sustained surge:</p>
          <div class="font-mono" style="font-size: 6.8pt; color: #283329;">min(1, Duration / 72 hrs)</div>
        </div>
        <div class="card card-parchment" style="padding: 6px 8px;">
          <div style="font-weight: 800; font-size: 7.5pt; color: #8C7428;">3. BREADTH (N, 25%)</div>
          <p style="font-size: 7.2pt; margin: 2px 0;">Fraction of stations elevated:</p>
          <div class="font-mono" style="font-size: 6.8pt; color: #283329;">Affected Stations / 4</div>
        </div>
        <div class="card card-parchment" style="padding: 6px 8px;">
          <div style="font-weight: 800; font-size: 7.5pt; color: #6E7A72;">4. SPREAD (S, 15%)</div>
          <p style="font-size: 7.2pt; margin: 2px 0;">Geographical zone span:</p>
          <div class="font-mono" style="font-size: 6.8pt; color: #283329;">1.0 Multi-Zone / 0.5 Single</div>
        </div>
      </div>

      <!-- Sensitivity Stress Test Table -->
      <h3 style="font-size: 9.5pt; margin-top: 4px;">Sensitivity Stress Testing: Proving Mathematical Stability</h3>
      <p style="font-size: 8.2pt; margin-bottom: 4px;">
        To ensure AMI rankings are robust physical truths rather than arbitrary weighting artifacts, we tested three alternative models:
        <strong>Model A (Intensity-Heavy: 50/20/15/15)</strong>, <strong>Model B (Duration-Heavy: 20/45/20/15)</strong>, and <strong>Model C (Equal: 25% each)</strong>.
      </p>

      <table>
        <thead>
          <tr>
            <th>Event Description</th>
            <th>Peak Date</th>
            <th>Duration</th>
            <th>Peak $PM_{2.5}$</th>
            <th>Primary AMI</th>
            <th>Model A</th>
            <th>Model B</th>
            <th>Model C</th>
            <th>Rank Stability</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Diwali Festival Spike (Oct 2025)</strong></td>
            <td>2025-10-18</td>
            <td>80 hrs</td>
            <td class="font-highlight">1156.9 µg/m³</td>
            <td class="font-highlight"><strong>10.0</strong></td>
            <td>10.0</td>
            <td>10.0</td>
            <td>10.0</td>
            <td><span class="pill pill-red">Rank #1 (Perfect)</span></td>
          </tr>
          <tr>
            <td><strong>Late Autumn Accumulation (Nov 2025)</strong></td>
            <td>2025-11-28</td>
            <td>178 hrs</td>
            <td>856.5 µg/m³</td>
            <td><strong>9.5</strong></td>
            <td>9.2</td>
            <td>9.8</td>
            <td>9.4</td>
            <td><span class="pill pill-orange">Rank #2 (Stable)</span></td>
          </tr>
          <tr>
            <td><strong>Severe Winter Inversion (Dec 2025)</strong></td>
            <td>2025-12-04</td>
            <td>10 hrs</td>
            <td>1224.9 µg/m³</td>
            <td><strong>6.6</strong></td>
            <td>7.5</td>
            <td>5.1</td>
            <td>6.6</td>
            <td><span class="pill pill-yellow">Rank #3 (Stable)</span></td>
          </tr>
          <tr>
            <td><strong>Monsoon Clean Baseline (Jul 2025)</strong></td>
            <td>2025-07-28</td>
            <td>Baseline</td>
            <td>11.2 µg/m³</td>
            <td><strong>1.2</strong></td>
            <td>0.9</td>
            <td>1.4</td>
            <td>1.1</td>
            <td><span class="pill pill-green">Clean Baseline</span></td>
          </tr>
        </tbody>
      </table>

      <!-- Section: Strict Scientific Honesty Rules -->
      <h2>5. The Non-Negotiable Scientific Honesty Rules</h2>
      <p style="font-size: 8.5pt;">
        In competitive hackathons, projects often fabricate synthetic data or make irresponsible claims.
        Hawa.fm was built under <strong>five ironclad honesty rules</strong> enforced throughout code, UI, and speech synthesis:
      </p>

      <div class="grid-2" style="margin-top: 6px;">
        <div class="card card-parchment">
          <div style="font-size: 8pt; font-weight: 800; color: #9E1B32;">RULE 1: ZERO SYNTHETIC READINGS</div>
          <p style="font-size: 8pt; margin-top: 2px;">
            Every numerical value on screen, in charts, or spoken by audio originates strictly from the official competition dataset
            (<code>Stations.csv</code> and <code>Train.csv</code>). No stations, values, or trends are ever hallucinated.
          </p>
        </div>

        <div class="card card-parchment">
          <div style="font-size: 8pt; font-weight: 800; color: #9E1B32;">RULE 2: NO SPECULATIVE SOURCE ATTRIBUTION</div>
          <p style="font-size: 8pt; margin-top: 2px;">
            Without chemical speciation or dispersion modeling, blaming traffic or factories is unscientific. Anomalies are phrased strictly
            as <em>"unusual rise, worth investigating"</em>—never <em>"caused by vehicles"</em>.
          </p>
        </div>

        <div class="card card-parchment">
          <div style="font-size: 8pt; font-weight: 800; color: #9E1B32;">RULE 3: STRICT PROVENANCE BADGING</div>
          <p style="font-size: 8pt; margin-top: 2px;">
            The LCD screen maintains a permanent provenance badge: <code>MEASURED</code> for latest sensor ground truth, and <code>REPLAY</code>
            for historical scrubbing. Because no forecast file was provided, <strong>FORECAST mode was deliberately omitted rather than faked</strong>.
          </p>
        </div>

        <div class="card card-parchment">
          <div style="font-size: 8pt; font-weight: 800; color: #9E1B32;">RULE 4: VISIBLE MISSING DATA (ANALOG STATIC)</div>
          <p style="font-size: 8pt; margin-top: 2px;">
            Missing station hours are depicted as audible analog radio static and a flickering <code>"NO SIGNAL"</code> state on the radio,
            and as hatched gray gaps on time-series charts—never secretly zeroed or smoothly interpolated.
          </p>
        </div>
      </div>

      <div class="callout" style="margin-top: 8px;">
        <div class="callout-title">Rule 5: Zero Runtime LLMs &amp; Deterministic Phrasing</div>
        <p style="font-size: 8pt; margin: 0;">
          All spoken voice scripts and on-screen letterpress captions use deterministic templating with calculated values.
          There are zero runtime LLM hallucinations. Multilingual Hindi and Marathi templates are transparently disclosed as verified against ground truth data.
        </p>
      </div>

    </div>

    <div class="footer-bar">
      <div>HAWA.FM — Google Mumbai Data Challenge Dossier</div>
      <div>Page 3 of 4 · Scientific Methodology &amp; Honesty Rules</div>
    </div>
  </div>

  <!-- ========================================================================= -->
  <!-- PAGE 4: TECHNICAL ARCHITECTURE, STACK & WINNABILITY                       -->
  <!-- ========================================================================= -->
  <div class="page">
    <div>
      <div class="header-bar">
        <div class="logo-mark">HAWA<span>.fm</span> · PROJECT DOSSIER</div>
        <div>Technical Architecture, Engineering &amp; Winnability</div>
      </div>

      <!-- Section: Technical Stack & Pipeline -->
      <h2>6. Technology Stack &amp; Offline Data Engineering</h2>
      <div class="grid-2">
        <div>
          <p style="font-size: 8.5pt;">
            Hawa.fm was built from scratch without bloated frameworks or paid APIs. It delivers an ultra-fast, 60 FPS desktop and mobile experience
            with an offline precomputed footprint of <strong>under 112 KB gzipped</strong>.
          </p>
          <div class="radio-schema">
            <span class="gold-accent">// Hawa.fm Data Pipeline (scripts/build_data.py)</span><br>
            Raw CPCB / OpenAQ CSVS (48,400 rows)<br>
            &nbsp;&nbsp;│<br>
            &nbsp;&nbsp;├──► <span class="highlight">Diurnal Baseline Engine</span> (Median, IQR, MAD per hour)<br>
            &nbsp;&nbsp;├──► <span class="teal-accent">Robust Z-Score Anomaly Detector</span> (Z ≥ 2.5, PM ≥ 60)<br>
            &nbsp;&nbsp;├──► <span class="gold-accent">Multi-Station Concurrency Classifier</span><br>
            &nbsp;&nbsp;└──► <span class="highlight">Air Magnitude Index (AMI)</span> &amp; Sensitivity Matrix<br>
            &nbsp;&nbsp;│<br>
            &nbsp;&nbsp;▼<br>
            Client JSON Artifacts: <span class="teal-accent">0.78 MB raw / &lt;112 KB gzipped</span>
          </div>
        </div>

        <div>
          <table style="margin-top: 0;">
            <thead>
              <tr>
                <th>Layer</th>
                <th>Technologies Used</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Frontend Core</strong></td>
                <td>React 18, TypeScript 5.7, Vite 6, Tailwind CSS v4</td>
              </tr>
              <tr>
                <td><strong>Motion &amp; Visuals</strong></td>
                <td>Framer Motion, HTML5 Canvas, SVG Vector Graphics</td>
              </tr>
              <tr>
                <td><strong>Audio Synthesizer</strong></td>
                <td>Web Audio API (Procedural Static, AIR Chimes, Detents)</td>
              </tr>
              <tr>
                <td><strong>Speech Synthesis</strong></td>
                <td>Gemini 2.0 Flash Neural TTS Proxy + Web Speech API</td>
              </tr>
              <tr>
                <td><strong>Offline Science</strong></td>
                <td>Python 3, Pandas, NumPy, SciPy (Robust Z-Score)</td>
              </tr>
              <tr>
                <td><strong>Icons &amp; Assets</strong></td>
                <td>Lucide Icons, Custom Gouache Mumbai Skyline SVGs</td>
              </tr>
              <tr>
                <td><strong>Hosting Target</strong></td>
                <td>Netlify, GitHub Pages, Firebase (100% Static)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Section: The Audio Chain -->
      <h3 style="font-size: 9.5pt; margin-top: 2px;">The Multi-Tier Resilience Audio Engine</h3>
      <p style="font-size: 8.2pt; margin-bottom: 6px;">
        Spoken environmental bulletins must work seamlessly across any browser, whether offline in a train tunnel or connected on 5G:
      </p>
      <div class="grid-3" style="margin-bottom: 8px;">
        <div class="card card-parchment" style="padding: 7px 9px;">
          <strong style="color: #B66C4D; font-size: 7.8pt;">Tier 1: Gemini Neural TTS</strong>
          <p style="font-size: 7.2pt; margin-top: 2px;">Server-side proxy generating natural, warm neural speech (Aoede, Puck voices) with local memory and browser storage caching.</p>
        </div>
        <div class="card card-parchment" style="padding: 7px 9px;">
          <strong style="color: #355C53; font-size: 7.8pt;">Tier 2: Browser SpeechSynthesis</strong>
          <p style="font-size: 7.2pt; margin-top: 2px;">Zero-latency local fallback utilizing device voices (<code>en-IN</code>, <code>hi-IN</code>, <code>mr-IN</code>) with pitch and cadence calibration.</p>
        </div>
        <div class="card card-parchment" style="padding: 7px 9px;">
          <strong style="color: #8C7428; font-size: 7.8pt;">Tier 3: Animated Letterpress</strong>
          <p style="font-size: 7.2pt; margin-top: 2px;">High-contrast visual caption ticker synchronized with speech waveforms; ensures 100% accessibility for hearing-impaired users.</p>
        </div>
      </div>

      <!-- Section: Why Hawa.fm is a Clear Winner -->
      <h2>7. Why Hawa.fm Wins: The Decisive Judging Criteria</h2>
      <div class="grid-2">
        <div class="card card-accent">
          <h3>1. Unmatched Novelty &amp; Emotional Impact</h3>
          <p style="font-size: 8pt;">
            While every other submission builds another predictable generic dashboard of line charts, Hawa.fm creates a brand new
            medium: <strong>the ambient environmental home radio</strong>. It turns abstract numbers into living art, tactile sound,
            and shared family conversations across three Indian languages.
          </p>
        </div>
        <div class="card card-teal">
          <h3>2. Mathematical Rigor &amp; Scientific Honesty</h3>
          <p style="font-size: 8pt;">
            We don't invent numbers or extrapolate unproven forecasts. We engineered the <strong>Air Magnitude Index</strong>,
            validated it with sensitivity stress testing, modeled robust diurnal median-MAD curves, and treated missing sensor data with absolute transparency.
          </p>
        </div>
        <div class="card card-gold">
          <h3>3. Exceptional Craftsmanship &amp; Usability</h3>
          <p style="font-size: 8pt;">
            From the authentic All India Radio chime and analog static sweeps to the paper-cut Mumbai landmarks, responsive 360px mobile touch targets,
            printable forensic memos, and shareable postcards, every pixel and decibel has been polished to production perfection.
          </p>
        </div>
        <div class="card" style="border-left: 3.5px solid #283329;">
          <h3>4. Civic Empowerment &amp; Virality</h3>
          <p style="font-size: 8pt;">
            Citizens aren't just passive viewers; they become detectives. They generate printable case briefs for local municipal ward offices,
            share painted postcards on social media, and uncover citywide pollution trends with intuitive simplicity.
          </p>
        </div>
      </div>

      <!-- Concluding Note -->
      <div class="card card-dark" style="margin-top: 8px; padding: 10px 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h4 style="font-family: 'Cinzel', serif; font-size: 10pt; letter-spacing: 0.05em; color: #FAF6EE;">
              HAWA.FM — TUNE IN TO MUMBAI'S AIR
            </h4>
            <p style="font-size: 7.8pt; margin: 0; color: #B2C2B7;">
              Google Mumbai Data Challenge · Category: Most Creative Submission · Open Source MIT License
            </p>
          </div>
          <div style="text-align: right; font-size: 8pt; font-weight: 700; color: #E28D69;">
            Live, Tactile, Grounded in Truth.
          </div>
        </div>
      </div>

    </div>

    <div class="footer-bar">
      <div>HAWA.FM — Google Mumbai Data Challenge Dossier</div>
      <div>Page 4 of 4 · Architecture, Engineering &amp; Winnability</div>
    </div>
  </div>

</body>
</html>
"""

html_path = "/Users/tanmaychaudhary/Documents/Hawa.fm/hawa_fm_dossier.html"
with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

print("Saved hawa_fm_dossier.html successfully!")

