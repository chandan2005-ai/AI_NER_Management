/**
 * LAST-MILE ALERT INTELLIGENCE
 *
 * Two distinct products from the same assessment:
 *  - a CITIZEN alert: short, plain language, action-first, translated;
 *  - a TECHNICAL bulletin: scores, factors, confidence, data quality.
 * Keeping them separate prevents technical detail from diluting the one line a
 * villager actually needs to act on.
 */

import type { Lang } from "./i18n";
import type { RiskZone } from "./demo-data";
import type { EvidenceFusion } from "./evidence-fusion";
import type { IsolationAssessment } from "./isolation-engine";

export interface CitizenAlert {
  heading: string;
  locationLabel: string;
  location: string;
  riskLabel: string;
  risk: string;
  reasonLabel: string;
  reason: string;
  impactLabel: string;
  impact: string;
  actionLabel: string;
  action: string;
  footer: string;
}

type Strings = {
  heading: string;
  location: string;
  risk: string;
  reason: string;
  impact: string;
  action: string;
  footer: string;
  levels: Record<string, string>;
  reasonText: (rain: number, soil: number) => string;
  impactRoad: string;
  impactIsolation: string;
  impactWatch: string;
  actionCritical: string;
  actionWarning: string;
  actionWatch: string;
};

const STRINGS: Record<Lang, Strings> = {
  en: {
    heading: "🚨 LANDSLIDE WARNING",
    location: "Location",
    risk: "Risk",
    reason: "Reason",
    impact: "Possible impact",
    action: "Recommended action",
    footer: "Issued by NER-SAFE decision support. Follow instructions from local authorities.",
    levels: {
      LOW: "LOW",
      MODERATE: "MODERATE",
      HIGH: "HIGH",
      "VERY HIGH": "VERY HIGH",
      CRITICAL: "CRITICAL",
    },
    reasonText: (rain, soil) =>
      `Heavy rainfall (${rain} mm in 24 hours) and wet, unstable slopes (soil moisture ${soil}%)`,
    impactRoad: "The main road may become blocked.",
    impactIsolation: "Your village may be cut off from road access and hospitals.",
    impactWatch: "Small slips are possible on hill slopes and cut sections.",
    actionCritical:
      "Move away from steep slopes and cut sections. Do not travel on the hill road. Keep documents and medicines ready and follow local authority instructions.",
    actionWarning:
      "Avoid the slope and the hill road where possible. Stay alert at night and report cracks or falling soil immediately.",
    actionWatch:
      "Stay alert, avoid unnecessary travel on the hill road and report any cracks you see.",
  },
  hi: {
    heading: "🚨 भूस्खलन चेतावनी",
    location: "स्थान",
    risk: "जोखिम",
    reason: "कारण",
    impact: "संभावित प्रभाव",
    action: "सुझाई गई कार्रवाई",
    footer:
      "NER-SAFE निर्णय-सहायता प्रणाली द्वारा जारी। स्थानीय प्रशासन के निर्देशों का पालन करें।",
    levels: {
      LOW: "कम",
      MODERATE: "मध्यम",
      HIGH: "अधिक",
      "VERY HIGH": "बहुत अधिक",
      CRITICAL: "अति गंभीर",
    },
    reasonText: (rain, soil) =>
      `भारी वर्षा (24 घंटे में ${rain} मिमी) और गीली, अस्थिर ढलानें (मृदा नमी ${soil}%)`,
    impactRoad: "मुख्य सड़क अवरुद्ध हो सकती है।",
    impactIsolation: "आपका गाँव सड़क एवं अस्पताल से कट सकता है।",
    impactWatch: "पहाड़ी ढलानों और कटाव वाले हिस्सों में छोटे भूस्खलन संभव हैं।",
    actionCritical:
      "तीव्र ढलानों और कटाव वाले हिस्सों से दूर रहें। पहाड़ी सड़क पर यात्रा न करें। दस्तावेज़ और दवाइयाँ तैयार रखें तथा प्रशासन के निर्देश मानें।",
    actionWarning:
      "ढलान और पहाड़ी सड़क से बचें। रात में सतर्क रहें और दरार या मिट्टी गिरने की सूचना तुरंत दें।",
    actionWatch: "सतर्क रहें, पहाड़ी सड़क पर अनावश्यक यात्रा न करें और किसी भी दरार की सूचना दें।",
  },
  as: {
    heading: "🚨 ভূমিস্খলন সতৰ্কবাণী",
    location: "স্থান",
    risk: "বিপদ",
    reason: "কাৰণ",
    impact: "সম্ভাৱ্য প্ৰভাৱ",
    action: "পৰামৰ্শিত কাৰ্য",
    footer: "NER-SAFE সিদ্ধান্ত সহায়ক প্ৰণালীৰ দ্বাৰা জাৰি। স্থানীয় প্ৰশাসনৰ নিৰ্দেশ মানি চলক।",
    levels: {
      LOW: "কম",
      MODERATE: "মধ্যম",
      HIGH: "উচ্চ",
      "VERY HIGH": "অতি উচ্চ",
      CRITICAL: "অতি সংকটজনক",
    },
    reasonText: (rain, soil) =>
      `প্ৰবল বৰষুণ (২৪ ঘণ্টাত ${rain} মিমি) আৰু তিতা, অস্থিৰ ঢাল (মাটিৰ আৰ্দ্ৰতা ${soil}%)`,
    impactRoad: "মূল পথ বন্ধ হ’ব পাৰে।",
    impactIsolation: "আপোনাৰ গাঁও পথ আৰু চিকিৎসালয়ৰ পৰা বিচ্ছিন্ন হ’ব পাৰে।",
    impactWatch: "পাহাৰীয়া ঢাল আৰু কাট অংশত সৰু স্খলন হ’ব পাৰে।",
    actionCritical:
      "খাৰাং ঢাল আৰু কাট অংশৰ পৰা দূৰত থাকক। পাহাৰীয়া পথত যাত্ৰা নকৰিব। নথি-পত্ৰ আৰু ঔষধ সাজু ৰাখক আৰু প্ৰশাসনৰ নিৰ্দেশ মানক।",
    actionWarning: "ঢাল আৰু পাহাৰীয়া পথ এৰি চলক। ৰাতি সতৰ্ক থাকক আৰু ফাট দেখিলে লগে লগে জনাওক।",
    actionWatch: "সতৰ্ক থাকক, অপ্ৰয়োজনীয় যাত্ৰা নকৰিব আৰু ফাট দেখিলে জনাওক।",
  },
  bn: {
    heading: "🚨 ভূমিধস সতর্কতা",
    location: "অবস্থান",
    risk: "ঝুঁকি",
    reason: "কারণ",
    impact: "সম্ভাব্য প্রভাব",
    action: "সুপারিশকৃত পদক্ষেপ",
    footer:
      "NER-SAFE সিদ্ধান্ত সহায়তা প্ল্যাটফর্ম দ্বারা জারি। স্থানীয় প্রশাসনের নির্দেশ মেনে চলুন।",
    levels: {
      LOW: "কম",
      MODERATE: "মাঝারি",
      HIGH: "উচ্চ",
      "VERY HIGH": "খুব উচ্চ",
      CRITICAL: "চরম সংকটজনক",
    },
    reasonText: (rain, soil) =>
      `ভারী বৃষ্টিপাত (২৪ ঘণ্টায় ${rain} মিমি) এবং স্যাঁতসেঁতে, অস্থির ঢাল (মাটির আর্দ্রতা ${soil}%)`,
    impactRoad: "প্রধান সড়ক অবরুদ্ধ হতে পারে।",
    impactIsolation: "আপনার গ্রাম প্রধান রাস্তা ও হাসপাতাল থেকে বিচ্ছিন্ন হতে পারে।",
    impactWatch: "পাহাড়ি ঢাল ও কাটা অংশে ছোটখাটো ধস হতে পারে।",
    actionCritical:
      "খাড়া ঢাল ও কাটা অংশ থেকে দূরে থাকুন। পাহাড়ি রাস্তায় ভ্রমণ করবেন না। প্রয়োজনীয় নথি ও ওষুধ সঙ্গে রাখুন।",
    actionWarning:
      "ঢাল ও পাহাড়ি রাস্তা এড়িয়ে চলুন। রাতে সতর্ক থাকুন এবং ফাটল দেখলে সাথে সাথে জানান।",
    actionWatch:
      "সতর্ক থাকুন, পাহাড়ি রাস্তায় অপ্রয়োজনীয় যাতায়াত এড়িয়ে চলুন এবং ফাটল দেখলে জানান।",
  },
  ne: {
    heading: "🚨 पहिरो चेतावनी",
    location: "स्थान",
    risk: "जोखिम",
    reason: "कारण",
    impact: "सम्भावित असर",
    action: "सुझाइएको कदम",
    footer: "NER-SAFE प्रणाली द्वारा जारी। स्थानीय प्रशासनको निर्देशन पालना गर्नुहोस्।",
    levels: {
      LOW: "कम",
      MODERATE: "मध्यम",
      HIGH: "उच्च",
      "VERY HIGH": "धेरै उच्च",
      CRITICAL: "अति गम्भीर",
    },
    reasonText: (rain, soil) =>
      `भारी वर्षा (२४ घण्टामा ${rain} मि.मी.) र गिलो, कमजोर भिरालो भूभाग (माटोको आर्द्रता ${soil}%)`,
    impactRoad: "मुख्य सडक अवरुद्ध हुन सक्छ।",
    impactIsolation: "तपाईंको गाउँ सडक तथा अस्पतालबाट विच्छेद हुन सक्छ।",
    impactWatch: "भिरालो जमिनमा साना पहिरोहरू खस्न सक्छन्।",
    actionCritical:
      "ठाडो भिरालो जमिनबाट टाढा रहनुहोस्। पहाडी सडकमा यात्रा नगर्नुहोस्। कागजात र औषधिहरू तयार राख्नुहोस्।",
    actionWarning:
      "भिरालो र पहाडी सडकबाट जोगिनुहोस्। राति सतर्क रहनुहोस् र धाँजा फाटेको देखेमा तुरुन्त खबर गर्नुहोस्।",
    actionWatch: "सतर्क रहनुहोस्, अनावश्यक यात्रा नगर्नुहोस् र जमिन फाटेको देखेमा खबर गर्नुहोस्।",
  },
  kha: {
    heading: "🚨 JINGMAHAM JINGTWA KA KHYNDEW",
    location: "Jingjngai / Shnong",
    risk: "Ka Jingma",
    reason: "Daw",
    impact: "Ka jingktah",
    action: "Ki lad jingiada",
    footer: "Pynmih da ka NER-SAFE. Bud ia ki jingbthah jong ki bor pyniaid shnong.",
    levels: {
      LOW: "Duna",
      MODERATE: "Pdeng",
      HIGH: "Jor",
      "VERY HIGH": "Khlain bha",
      CRITICAL: "Shyrkhei",
    },
    reasonText: (rain, soil) =>
      `Ka jingther slap jur (${rain} mm ha ka 24 kynta) bad ka jingktieh jong ka khyndew (${soil}%)`,
    impactRoad: "Ka surok bah ka lah ban sahkut ne shah tap.",
    impactIsolation: "Ka shnong ka lah ban sah kut khlem lad leit hospital.",
    impactWatch: "Khyndew ka lah ban twa malom ha ki thain lum.",
    actionCritical: "Kynrih noh na ki jaka ba ranap jur. Wat leit jingleit ha surok lum.",
    actionWarning:
      "Kieng ban rung sha ki jaka lum. Peitngor mynmiet bad pyntip lada don jingpait khyndew.",
    actionWatch: "Shong husiar bad wat leit jingleit pathar ha surok lum.",
  },
  miz: {
    heading: "🚨 CHHIATRUPNA HLAUHAWMNA",
    location: "Hmun",
    risk: "Hlauhawmna",
    reason: "A chhan",
    impact: "Nghawng theih",
    action: "Hmalak dan tur",
    footer: "NER-SAFE warning system atanga tihchhuah. Sawrkar thuchhuah zawm rawh le.",
    levels: {
      LOW: "Tlem",
      MODERATE: "Nawmlem",
      HIGH: "Sang",
      "VERY HIGH": "Sang tak",
      CRITICAL: "Hlauhawm zual",
    },
    reasonText: (rain, soil) =>
      `Ruah sur nasa (${rain} mm darkar 24 chhungin) leh lei hnawng lutuk (${soil}%)`,
    impactRoad: "Kawngpui a ping thei.",
    impactIsolation: "Khua a inping tang thei a, damdawi in pan a harsa thei.",
    impactWatch: "Tlangpang a tawlh rih zeuh zeuh thei.",
    actionCritical: "Hmun awih leh hlauhawm kalsan rawh. Tlang kawngah zinchhuak suh.",
    actionWarning: "Tlangpang awih pumpelh la, zan lamah fimkhur ang che.",
    actionWatch: "Fimkhur la, chhuah ngai loah chhuak suh.",
  },
  mni: {
    heading: "🚨 চীংমায় খোমখৎলকপগী চেকশিনৱা",
    location: "মফম",
    risk: "অকিবা",
    reason: "মরম",
    impact: "পীবা য়াবা অকায়বা",
    action: "পায়খৎকদবা খোঙথাং",
    footer: "NER-SAFE না ফোঙবা। লৈঙাক্কী য়াথং ইনবা।",
    levels: {
      LOW: "নেম্বা",
      MODERATE: "ময়ায় ওইবা",
      HIGH: "ৱাংবা",
      "VERY HIGH": "য়াম্না ৱাংবা",
      CRITICAL: "য়াম্না খুদোংথিবা",
    },
    reasonText: (rain, soil) =>
      `অকনবা নোং চুবা (পুং ২৪দা ${rain} মিমি) অমসুং লৈবাক চুরবা (${soil}%)`,
    impactRoad: "লম্বী থিংজিনবা য়াই।",
    impactIsolation: "খুঙ্গং অসি অতোপ্পা মফমগা শম্নদবা য়াই।",
    impactWatch: "চীংমায় খর খোমখৎপা য়াই।",
    actionCritical: "চীংমায় খনবদগী লাপ্না লৈয়ু। চীংগী লম্বীদা চৎকনু।",
    actionWarning: "চীংমায়গা লম্বীগা লাপ্না লৈয়ু। অহিংশিংদা চেকশিন্না লৈয়ু।",
    actionWatch: "চেকশিন্না লৈয়ু অমসুং লৈবাক থেক্লবদি পাউ পীয়ু।",
  },
};

export function citizenAlert(
  zone: RiskZone,
  isolation: IsolationAssessment,
  lang: Lang,
): CitizenAlert {
  const s = (STRINGS[lang]?.heading ? STRINGS[lang] : STRINGS.en) as Strings;
  const level = zone.assessment.level;
  const critical = level === "CRITICAL" || level === "VERY HIGH";
  const impact =
    isolation.level === "CRITICAL" || isolation.singleAccessVillages > 0
      ? s.impactIsolation
      : critical
        ? s.impactRoad
        : s.impactWatch;

  return {
    heading: s.heading,
    locationLabel: s.location,
    location: `${isolation.villages[0]?.asset.name ?? zone.district.name}, ${zone.district.name}, ${zone.district.state}`,
    riskLabel: s.risk,
    risk: s.levels[level] ?? level,
    reasonLabel: s.reason,
    reason: s.reasonText(zone.observation.rainfall24h, zone.observation.soilMoisture),
    impactLabel: s.impact,
    impact,
    actionLabel: s.action,
    action: critical ? s.actionCritical : level === "HIGH" ? s.actionWarning : s.actionWatch,
    footer: s.footer,
  };
}

export interface TechnicalBulletin {
  title: string;
  lines: [string, string][];
  factors: string[];
  caveat: string;
}

export function technicalBulletin(
  zone: RiskZone,
  evidence: EvidenceFusion,
  isolation: IsolationAssessment,
): TechnicalBulletin {
  return {
    title: `Technical bulletin — ${zone.district.name}, ${zone.district.state}`,
    lines: [
      ["Landslide risk", `${zone.assessment.score}/100 (${zone.assessment.level})`],
      ["Hazard probability (24 h)", `${Math.round(zone.assessment.probability * 100)} %`],
      ["Community isolation risk", `${isolation.score}/100 (${isolation.level})`],
      ["Evidence verdict", evidence.verdict],
      ["Model confidence", `${Math.round(evidence.confidence * 100)} %`],
      [
        "Data quality",
        `${evidence.dataQuality} · ${evidence.availableCount}/${evidence.totalSources} sources`,
      ],
      [
        "Rainfall 24 h / 72 h",
        `${zone.observation.rainfall24h} / ${zone.observation.rainfall72h} mm`,
      ],
      ["Soil moisture", `${zone.observation.soilMoisture} %`],
      ["Ground movement", `${zone.observation.groundMovement} mm / 24 h`],
      ["Freshest input", `${evidence.freshestInputMinutes} min old`],
    ],
    factors: zone.assessment.factors.slice(0, 6).map((f) => `+${f.points} ${f.label} (${f.value})`),
    caveat:
      "Probabilistic decision support generated from simulated demonstration inputs. Not a Government of India observation or forecast.",
  };
}
