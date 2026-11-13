// Deterministic Radio Bulletin Script Generator with Natural Speech Normalization for HAWA.fm
// Follows official Indian National Air Quality Index (NAQI) and clean broadcast radio structure:
// 1. Greeting
// 2. Current Location & Station Frequency
// 3. Air Quality & Prominent AQI / PM2.5 readings
// 4. Important Pollution Change or Anomaly status
// 5. Relevant investigation or pattern note (strictly without claiming unsourced causes)
// 6. Public guidance / outdoor advisory
// 7. Closing station signoff

import { Station, AirCategory, Language } from '../types';

export interface SpokenScript {
  greeting: string;
  location: string;
  aqiSummary: string;
  changeNote: string;
  investigation: string;
  advisory: string;
  signoff: string;
  lines: string[];
  fullText: string;
  aqi: number | null;
}

/**
 * Standard Indian CPCB National Air Quality Index (NAQI) calculation for PM2.5
 */
export function calculateAqi(pm25: number | null): number | null {
  if (pm25 === null || isNaN(pm25)) return null;
  const p = Math.max(0, pm25);

  // CPCB Breakpoints: [Clow, Chigh, Ilow, Ihigh]
  if (p <= 30) return Math.round((50 / 30) * p);
  if (p <= 60) return Math.round(50 + ((100 - 50) / (60 - 30)) * (p - 30));
  if (p <= 90) return Math.round(100 + ((200 - 100) / (90 - 60)) * (p - 60));
  if (p <= 120) return Math.round(200 + ((300 - 200) / (120 - 90)) * (p - 90));
  if (p <= 250) return Math.round(300 + ((400 - 300) / (250 - 120)) * (p - 120));
  return Math.min(500, Math.round(400 + ((500 - 400) / (380 - 250)) * (p - 250)));
}

/**
 * Natural Marathi number words from 0 to 1000
 */
function marathiNumberWord(n: number): string {
  const rounded = Math.round(n);
  const ones = [
    'शून्य', 'एक', 'दोन', 'तीन', 'चार', 'पाच', 'सहा', 'सात', 'आठ', 'नऊ', 'दहा',
    'अकरा', 'बारा', 'तेरा', 'चौदा', 'पंधरा', 'सोळा', 'सतरा', 'अठरा', 'एकोणीस', 'वीस',
    'एकवीस', 'बावीस', 'तेवीस', 'चोवीस', 'पंचवीस', 'सव्वीस', 'सत्तावीस', 'अठ्ठावीस', 'एकोणतीस', 'तीस',
    'एकतीस', 'बत्तीस', 'तेहतीस', 'चौतीस', 'पस्तीस', 'छत्तीस', 'सदतीस', 'अडतीस', 'एकोणचाळीस', 'चाळीस',
    'एक्केचाळीस', 'बेचाळीस', 'त्रेचाळीस', 'चव्वेचाळीस', 'पंचेचाळीस', 'शेहेचाळीस', 'सत्तेचाळीस', 'अठ्ठेचाळीस', 'एकोणपन्नास', 'पन्नास',
    'एक्कावन्न', 'बावन्न', 'त्रेपन्न', 'चौपन्न', 'पंचावन्न', 'छप्पन्न', 'सत्तावन्न', 'अठ्ठावन्न', 'एकोणसाठ', 'साठ',
    'एकसष्ठ', 'बासष्ठ', 'त्रेसष्ठ', 'चौसष्ठ', 'पासष्ठ', 'सहासष्ठ', 'सदुसष्ठ', 'अडुसष्ठ', 'एकोणसत्तर', 'सत्तर',
    'एकाहत्तर', 'बाहत्तर', 'त्र्याहत्तर', 'चौर्‍याहत्तर', 'पंच्याहत्तर', 'शहात्तर', 'सत्त्याहत्तर', 'अठ्ठ्याहत्तर', 'एकोणऐंशी', 'ऐंशी',
    'एक्क्यांशी', 'ब्यांशी', 'त्र्यांशी', 'चौऱ्यांशी', 'पंच्यांशी', 'शहांशी', 'सत्त्यांशी', 'अठ्ठ्यांशी', 'एकोणनव्वद', 'नव्वद',
    'एक्क्याण्णव', 'ब्याण्णव', 'त्र्याण्णव', 'चौऱ्याण्णव', 'पंच्याण्णव', 'शहाण्णव', 'सत्त्याण्णव', 'अठ्ठ्याण्णव', 'नव्याण्णव', 'शंभर'
  ];

  if (rounded >= 0 && rounded <= 100) return ones[rounded];
  if (rounded < 1000) {
    const hundreds = Math.floor(rounded / 100);
    const rem = rounded % 100;
    const hundredPrefix = hundreds === 1 ? 'एकशे' : `${ones[hundreds]}शे`;
    return rem > 0 ? `${hundredPrefix} ${ones[rem]}` : hundredPrefix;
  }
  return rounded.toString();
}

/**
 * Natural Hindi number words from 0 to 1000
 */
function hindiNumberWord(n: number): string {
  const rounded = Math.round(n);
  const ones = [
    'शून्य', 'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ', 'दस',
    'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पंद्रह', 'सोलह', 'सत्रह', 'अठारह', 'उन्नीस', 'बीस',
    'इक्कीस', 'बाईस', 'तेईस', 'चौबीस', 'पच्चीस', 'छब्बीस', 'सत्ताईस', 'अट्ठाईस', 'उनतीस', 'तीस',
    'इकत्तीस', 'बत्तीस', 'तैंतीस', 'चौंतीस', 'पैंतीस', 'छत्तीस', 'सैंतीस', 'अड़तीस', 'उनतालीस', 'चालीस',
    'इकतालीस', 'बयालीस', 'तैंतालीस', 'चवालीस', 'पैंतालीस', 'छियालीस', 'सैंतालीस', 'अड़तालीस', 'उनचास', 'पचास',
    'इक्यावन', 'बावन', 'तिरेपन', 'चौवन', 'पचपन', 'छप्पन', 'सत्तावन', 'अट्ठावन', 'उनसठ', 'साठ',
    'इकसठ', 'बासठ', 'तिरसठ', 'चौंसठ', 'पैंसठ', 'छियासठ', 'सरसठ', 'अड़सठ', 'उनहत्तर', 'सत्तर',
    'इकहत्तर', 'बहत्तर', 'तिहत्तर', 'चौहत्तर', 'पचहत्तर', 'छिहत्तर', 'सतहत्तर', 'अठहत्तर', 'उनासी', 'अस्सी',
    'इक्यासी', 'बयासी', 'तिरासी', 'चौरासी', 'पचासी', 'छियासी', 'सत्तासी', 'अट्ठासी', 'नवासी', 'नब्बे',
    'इक्यानवे', 'बानवे', 'तिरानवे', 'चौरानवे', 'पंचानवे', 'छियानवे', 'सत्तानवे', 'अट्ठानवे', 'निन्यानवे', 'एक सौ'
  ];

  if (rounded >= 0 && rounded <= 100) return ones[rounded];
  if (rounded < 1000) {
    const hundreds = Math.floor(rounded / 100);
    const rem = rounded % 100;
    const hundredPrefix = hundreds === 1 ? 'एक सौ' : `${ones[hundreds]} सौ`;
    return rem > 0 ? `${hundredPrefix} ${ones[rem]}` : hundredPrefix;
  }
  return rounded.toString();
}

/**
 * Natural English number words
 */
function englishNumberWord(n: number): string {
  const rounded = Math.round(n);
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
    'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  if (rounded === 0) return 'zero';
  if (rounded < 20) return ones[rounded];
  if (rounded < 100) {
    const rem = rounded % 10;
    return `${tens[Math.floor(rounded / 10)]}${rem ? `-${ones[rem]}` : ''}`;
  }
  if (rounded < 1000) {
    const hundredCount = Math.floor(rounded / 100);
    const rem = rounded % 100;
    let remStr = '';
    if (rem > 0) {
      remStr = rem < 20 ? ` and ${ones[rem]}` : ` and ${tens[Math.floor(rem / 10)]}${rem % 10 ? `-${ones[rem % 10]}` : ''}`;
    }
    return `${ones[hundredCount]} hundred${remStr}`;
  }
  return rounded.toString();
}

/**
 * Convert numbers into natural spoken words for text-to-speech engines
 */
export function numberToSpokenWords(n: number, lang: Language = 'en'): string {
  if (lang === 'mr') return marathiNumberWord(n);
  if (lang === 'hi') return hindiNumberWord(n);
  return englishNumberWord(n);
}

/**
 * Natural spoken time formatting (e.g. "सकाळी नऊ वाजता" / "सुबह नौ बजे" / "nine in the morning")
 */
export function formatSpokenTime(isoStr: string, lang: Language = 'en'): string {
  if (!isoStr) return lang === 'hi' ? 'इस समय' : lang === 'mr' ? 'या वेळी' : 'at this hour';
  const parts = isoStr.split('T');
  const timePart = parts[1] || '12:00';
  const hour = parseInt(timePart.split(':')[0], 10);
  const min = parseInt(timePart.split(':')[1], 10) || 0;

  if (lang === 'mr') {
    const period = hour < 4 ? 'मध्यरात्री' : hour < 12 ? 'सकाळी' : hour < 16 ? 'दुपारी' : hour < 20 ? 'संध्याकाळी' : 'रात्री';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    const hourWord = marathiNumberWord(displayHour);
    if (min === 0) return `${period} ${hourWord} वाजता`;
    if (min === 30) return `${period} साडे${hourWord} वाजता`;
    return `${period} ${hourWord} वाजून ${marathiNumberWord(min)} मिनिटांनी`;
  }

  if (lang === 'hi') {
    const period = hour < 4 ? 'रात' : hour < 12 ? 'सुबह' : hour < 16 ? 'दोपहर' : hour < 20 ? 'शाम' : 'रात';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    const hourWord = hindiNumberWord(displayHour);
    if (min === 0) return `${period} ${hourWord} बजे`;
    if (min === 30) return `${period} साढ़े ${hourWord} बजे`;
    return `${period} ${hourWord} बजकर ${hindiNumberWord(min)} मिनट पर`;
  }

  // English
  const hourWords = ['twelve', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven'];
  const displayWord = hourWords[hour % 12];
  let period = 'in the morning';
  if (hour >= 12 && hour < 17) period = 'in the afternoon';
  else if (hour >= 17 && hour < 21) period = 'in the evening';
  else if (hour >= 21 || hour < 4) period = 'at night';

  if (min === 0) {
    if (hour === 0) return 'midnight';
    if (hour === 12) return 'noon';
    return `${displayWord} ${period}`;
  }
  if (min === 30) return `half past ${displayWord} ${period}`;
  return `${displayWord} ${min < 10 ? `oh-${min}` : min} ${period}`;
}

/**
 * Natural spoken date formatting
 * Example: "१७ डिसेंबर २०२६ रोजी" (MR), "१७ दिसंबर २०२६ को" (HI), "on the seventeenth of December, twenty twenty-six" (EN)
 */
export function formatSpokenDate(isoStr: string, isReplay: boolean, lang: Language = 'en'): string {
  if (!isoStr) return '';
  if (!isReplay) return lang === 'hi' ? 'आज' : lang === 'mr' ? 'आज' : 'today';

  const parts = isoStr.split('T')[0].split('-');
  const y = parts[0] || '2026';
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);

  const monthsMr = ['', 'जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'];
  const monthsHi = ['', 'जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
  const monthsEn = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const ordinalsEn = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth',
    'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth', 'twentieth',
    'twenty-first', 'twenty-second', 'twenty-third', 'twenty-fourth', 'twenty-fifth', 'twenty-sixth', 'twenty-seventh', 'twenty-eighth', 'twenty-ninth', 'thirtieth', 'thirty-first'];

  if (lang === 'mr') {
    const dWord = marathiNumberWord(d);
    return `${dWord} ${monthsMr[m]} रोजी`;
  }

  if (lang === 'hi') {
    const dWord = hindiNumberWord(d);
    return `${dWord} ${monthsHi[m]} को`;
  }

  return `on the ${ordinalsEn[d] || d} of ${monthsEn[m]}, ${y}`;
}

/**
 * Generate full broadcast script following the 7-step radio structure
 */
export function generateScript(params: {
  station: Station;
  timestamp: string;
  pm25: number | null;
  airCategory: AirCategory;
  categoryLabel: string;
  isAnomaly: boolean;
  anomalyScope?: 'isolated' | 'widespread';
  concurrentStations?: number;
  baselineMedian: number;
  isReplay: boolean;
  language: Language;
}): SpokenScript {
  const {
    station,
    timestamp,
    pm25,
    airCategory,
    categoryLabel,
    isAnomaly,
    anomalyScope,
    concurrentStations = 0,
    baselineMedian,
    isReplay,
    language
  } = params;

  const aqi = calculateAqi(pm25);

  // Missing data state (Strict Rule: never fake values)
  if (pm25 === null) {
    if (language === 'mr') {
      const text = `नमस्कार मुंबई! तुम्ही ऐकत आहात हवा डॉट एफएम. ${station.name} केंद्रावरून या वेळी सेन्सॉर सिग्नल मिळत नाहीये. कृपया इतर केंद्रावर ट्यून करा.`;
      return {
        greeting: 'नमस्कार मुंबई!',
        location: `${station.name} केंद्र`,
        aqiSummary: 'सिग्नल उपलब्ध नाही',
        changeNote: '',
        investigation: '',
        advisory: 'कृपया इतर केंद्रावर ट्यून करा.',
        signoff: 'ऐकत राहा हवा डॉट एफएम.',
        lines: [text],
        fullText: text,
        aqi: null
      };
    }
    if (language === 'hi') {
      const text = `नमस्कार मुंबई! आप सुन रहे हैं हवा डॉट एफएम। ${station.name} निगरानी केंद्र से इस समय सिग्नल उपलब्ध नहीं है। कृपया दूसरे स्टेशन पर ट्यून करें।`;
      return {
        greeting: 'नमस्कार मुंबई!',
        location: `${station.name} केंद्र`,
        aqiSummary: 'सिग्नल उपलब्ध नहीं है',
        changeNote: '',
        investigation: '',
        advisory: 'कृपया अन्य निगरानी केंद्र पर ट्यून करें।',
        signoff: 'हवा डॉट एफएम सुनते रहिए।',
        lines: [text],
        fullText: text,
        aqi: null
      };
    }
    const text = `Hello Mumbai, you are listening to Hawa.fm. We currently have no signal received from the monitoring sensor at ${station.name}. Please tune to an adjacent frequency.`;
    return {
      greeting: 'Hello Mumbai, you are listening to Hawa.fm.',
      location: `Station at ${station.name}`,
      aqiSummary: 'No signal received.',
      changeNote: '',
      investigation: '',
      advisory: 'Please tune to an adjacent frequency.',
      signoff: 'Stay tuned to Hawa.fm.',
      lines: [text],
      fullText: text,
      aqi: null
    };
  }

  const timeSpoken = formatSpokenTime(timestamp, language);
  const dateSpoken = formatSpokenDate(timestamp, isReplay, language);
  const pm25Rounded = Math.round(pm25);
  const pm25Words = numberToSpokenWords(pm25Rounded, language);
  const aqiWords = aqi !== null ? numberToSpokenWords(aqi, language) : '';
  const baseRounded = Math.round(baselineMedian);
  const baseWords = numberToSpokenWords(baseRounded, language);

  // ─── MARATHI BROADCAST SCRIPT (Authentic Conversational Marathi) ───────
  if (language === 'mr') {
    const greeting = 'नमस्कार मुंबई! तुम्ही ऐकत आहात हवा डॉट एफएम.';
    const location = `${dateSpoken} ${timeSpoken}, ${station.name} केंद्रावरून थेट वातावरणीय बुलेटिन.`;
    const aqiSummary = `येथे हवेचा गुणवत्ता निर्देशांक ${aqiWords} असून हवा ${categoryLabel} श्रेणीत नोंदवली गेली आहे. सूक्ष्म कण, म्हणजेच PM दोन पॉइंट पाचची पातळी ${pm25Words} मायक्रोग्रॅम प्रति घनमीटर आहे.`;

    let changeNote = '';
    let investigation = '';
    if (isAnomaly) {
      changeNote = `निरीक्षण केंद्रावर PM दोन पॉइंट पाचच्या पातळीत अनपेक्षित वाढ दिसून आली आहे, जी नेहमीच्या ${baseWords} मायक्रोग्रॅम सरासरीपेक्षा जास्त आहे.`;
      investigation = anomalyScope === 'widespread'
        ? `या बदलावर आमची एअर डिटेक्टिव्ह टीम लक्ष ठेवून आहे; मुंबईतील इतर ${marathiNumberWord(concurrentStations)} केंद्रांवरही एकाच वेळी वाढ नोंदवली गेली आहे.`
        : 'या बदलावर आमची एअर डिटेक्टिव्ह टीम लक्ष ठेवून आहे. इतर जवळची केंद्रे नेहमीच्या पातळीवर आहेत. सेन्सॉर डेटावरून निश्चित कारणाचा अंदाज बांधता येत नाही, पण ही नोंद तपासण्याजोगी आहे.';
    } else {
      changeNote = `या वेळेची नेहमीची सरासरी सुमारे ${baseWords} मायक्रोग्रॅम असते, आणि सध्याची नोंद या सरासरीशी सुसंगत आहे.`;
      investigation = 'वातावरणात कोणताही असामान्य बदल आढळलेला नाही.';
    }

    const advisory = airCategory === 'fresh' || airCategory === 'okay'
      ? 'सध्या बाहेर फिरण्यासाठी आणि मोकळ्या हवेचा आनंद घेण्यासाठी उत्तम वेळ आहे.'
      : 'हवेत धूर व धुरके जास्त असल्याने ज्येष्ठ नागरिक व संवेदनशील व्यक्तींनी काळजी घ्यावी.';

    const signoff = 'अधिक माहितीसाठी हवा डॉट एफएम ऐकत राहा. सुरक्षित राहा, मुंबई!';

    const lines = [greeting, location, aqiSummary, changeNote, investigation, advisory, signoff];
    return {
      greeting,
      location,
      aqiSummary,
      changeNote,
      investigation,
      advisory,
      signoff,
      lines,
      fullText: lines.join(' '),
      aqi
    };
  }

  // ─── HINDI BROADCAST SCRIPT ────────────────────────────────────────────
  if (language === 'hi') {
    const greeting = 'नमस्कार मुंबई! आप सुन रहे हैं हवा डॉट एफएम।';
    const location = `${dateSpoken} ${timeSpoken}, ${station.name} केंद्र से मुंबई की हवा का लाइव बुलेटिन।`;
    const aqiSummary = `यहाँ वायु गुणवत्ता सूचकांक ${aqiWords} है, और हवा ${categoryLabel} श्रेणी में दर्ज की गई है। सूक्ष्म कण, यानी पीएम दो पॉइंट पांच का स्तर ${pm25Words} माइक्रोग्राम प्रति क्यूबिक मीटर है।`;

    let changeNote = '';
    let investigation = '';
    if (isAnomaly) {
      changeNote = `इस केंद्र पर पीएम दो पॉइंट पांच के स्तर में अचानक असामान्य उछाल देखा गया है, जो इस घंटे के सामान्य स्तर ${baseWords} माइक्रोग्राम से काफी अधिक है।`;
      investigation = anomalyScope === 'widespread'
        ? `इस बदलाव पर हमारी एयर डिटेक्टिव टीम नजर बनाए हुए है; मुंबई के अन्य ${hindiNumberWord(concurrentStations)} केंद्रों पर भी एक साथ बढ़ोतरी दर्ज हुई है।`
        : 'इस बदलाव पर हमारी एयर डिटेक्टिव टीम नजर बनाए हुए है। सेंसर डेटा के आधार पर किसी निश्चित स्रोत का दावा नहीं किया जा सकता, लेकिन यह बदलाव जांच योग्य है।';
    } else {
      changeNote = `इस समय का सामान्य स्तर लगभग ${baseWords} माइक्रोग्राम रहता है, और वर्तमान रीडिंग इसके अनुकूल है।`;
      investigation = 'वातावरण में कोई असामान्य उतार-चढ़ाव नहीं पाया गया है।';
    }

    const advisory = airCategory === 'fresh' || airCategory === 'okay'
      ? 'बाहर टहलने और ताज़ा हवा का आनंद लेने के लिए यह अनुकूल समय है।'
      : 'हवा में धुंध अधिक है, इसलिए संवेदनशील लोग और बच्चे सावधानी बरतें।';

    const signoff = 'मुंबई की हवा पर ताज़ा जानकारी के लिए सुनते रहिए हवा डॉट एफएम। सुरक्षित रहिए!';

    const lines = [greeting, location, aqiSummary, changeNote, investigation, advisory, signoff];
    return {
      greeting,
      location,
      aqiSummary,
      changeNote,
      investigation,
      advisory,
      signoff,
      lines,
      fullText: lines.join(' '),
      aqi
    };
  }

  // ─── ENGLISH BROADCAST SCRIPT ──────────────────────────────────────────
  const greeting = 'Hello Mumbai, you are listening to Hawa.fm.';
  const location = `Broadcasting live for ${station.name} at ${station.freqLabel}, ${dateSpoken} at ${timeSpoken}.`;
  const aqiSummary = `The Air Quality Index is ${aqiWords}, placing current air in the ${categoryLabel.toLowerCase()} category. Fine particles, PM two point five, are measuring ${pm25Words} micrograms per cubic meter.`;

  let changeNote = '';
  let investigation = '';
  if (isAnomaly) {
    changeNote = `An unusual rise has been flagged at this sensor, where readings have surged well above the typical hourly baseline of ${baseWords} micrograms.`;
    investigation = anomalyScope === 'widespread'
      ? `Our air detective team is tracking this spike across the network, with ${concurrentStations} other monitoring stations concurrently elevated. We cannot identify the cause from sensor data alone, but it warrants investigation.`
      : `Our air detective team is tracking this localized rise, while neighbouring coastal stations remain near typical baseline. Sensor readings identify this unusual pattern without claiming an unsourced cause.`;
  } else {
    changeNote = `This measurement is consistent with the typical baseline of ${baseWords} micrograms expected for this hour.`;
    investigation = 'No sustained anomalous elevation is detected across the coastal network.';
  }

  const advisory = airCategory === 'fresh' || airCategory === 'okay'
    ? 'Conditions are great for a stroll along the promenade or letting fresh sea breeze into your home.'
    : airCategory === 'hazy'
    ? 'Moderate haze is present over the bay; sensitive individuals may prefer lighter outdoor exertion.'
    : 'Noticeable pollution is present; consider reducing prolonged heavy outdoor exertion and keeping windows closed.';

  const signoff = 'Stay tuned to Hawa.fm for continuous atmospheric updates across Mumbai. Keep breathing easy!';

  const lines = [greeting, location, aqiSummary, changeNote, investigation, advisory, signoff];
  return {
    greeting,
    location,
    aqiSummary,
    changeNote,
    investigation,
    advisory,
    signoff,
    lines,
    fullText: lines.join(' '),
    aqi
  };
}
