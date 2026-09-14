import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "en" | "hi" | "as" | "bn" | "ne" | "kha" | "miz" | "mni";

export const LANGUAGES: { code: Lang; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "as", label: "Assamese", native: "অসমীয়া" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
  { code: "ne", label: "Nepali", native: "नेपाली" },
  { code: "kha", label: "Khasi", native: "Khasi" },
  { code: "miz", label: "Mizo", native: "Mizo ṭawng" },
  { code: "mni", label: "Manipuri", native: "মৈতৈলোন্" },
];

type Dict = Record<string, string>;

const en: Dict = {
  "app.name": "NER-SAFE",
  "app.tagline": "AI-Powered Early Warning & Landslide Risk Monitoring System",
  "nav.command": "Command Center",
  "nav.dashboard": "Dashboard",
  "nav.map": "GIS Risk Map",
  "nav.lifelines": "Road Lifelines",
  "nav.simulator": "What-If Simulator",
  "nav.twin": "Digital Twin",
  "nav.resources": "Resource Logistics",
  "nav.sources": "Data Sources",
  "nav.zones": "Risk Zones",
  "nav.rainfall": "Rainfall Radar",
  "nav.forecast": "Risk Forecast",
  "nav.sensors": "IoT Sensors",
  "nav.roads": "Road Connectivity",
  "nav.reports": "Field Reports",
  "nav.newReport": "Log Incident",
  "nav.alerts": "Alert Dispatcher",
  "nav.response": "Emergency SOPs",
  "nav.analytics": "Analytics & Telemetry",
  "nav.settings": "System Settings",
  "nav.security": "Security Center",
  "nav.admin": "Admin Panel",
  "citizen.home": "Home",
  "citizen.map": "Risk Map",
  "citizen.alerts": "Alerts",
  "citizen.report": "Report",
  "citizen.safety": "Safety Guide",
  "citizen.profile": "Profile & SMS",
  "common.live": "LIVE",
  "common.demoMode": "DEMO MODE",
  "common.offline": "OFFLINE MODE",
  "common.riskScore": "Risk Score",
  "common.riskLevel": "Risk Level",
  "common.trend": "Trend",
  "common.rainfall24": "Rainfall (24 h)",
  "common.soilMoisture": "Soil Moisture",
  "common.slope": "Slope",
  "common.district": "District",
  "common.state": "State",
  "common.probability": "Hazard probability (24 h)",
  "common.confidence": "Model confidence",
  "common.action": "Recommended action",
  "kpi.critical": "Critical",
  "kpi.veryHigh": "Very High",
  "kpi.high": "High",
  "kpi.alerts": "Active Alerts",
  "alert.disclaimer":
    "Probabilistic decision support. Final emergency decisions remain with authorised disaster-management authorities.",
  "alert.level1": "INFORMATION",
  "alert.level2": "WATCH",
  "alert.level3": "WARNING",
  "alert.level4": "CRITICAL",
  "alert.template":
    "The model estimates elevated landslide risk based on current environmental and historical indicators.",
};

const hi: Dict = {
  ...en,
  "app.tagline": "एआई-आधारित पूर्व चेतावनी एवं भूस्खलन जोखिम निगरानी प्रणाली",
  "nav.command": "कमांड सेंटर",
  "nav.dashboard": "डैशबोर्ड",
  "nav.map": "जीआईएस जोखिम नक्शा",
  "nav.lifelines": "जीवनरेखा सड़कें",
  "nav.simulator": "परिदृश्य सिमुलेटर",
  "nav.twin": "डिजिटल ट्विन",
  "nav.resources": "संसाधन आवंटन",
  "nav.sources": "डेटा स्रोत",
  "nav.zones": "जोखिम क्षेत्र",
  "nav.rainfall": "वर्षा रडार",
  "nav.forecast": "जोखिम पूर्वानुमान",
  "nav.sensors": "आईओटी सेंसर",
  "nav.roads": "सड़क संपर्क",
  "nav.reports": "क्षेत्रीय रिपोर्ट",
  "nav.newReport": "नई रिपोर्ट दर्ज करें",
  "nav.alerts": "अलर्ट प्रेषक",
  "nav.response": "आपातकालीन प्रक्रिया",
  "nav.analytics": "विश्लेषण एवं टेलीमेट्री",
  "nav.settings": "सिस्टम सेटिंग्स",
  "nav.security": "सुरक्षा केंद्र",
  "nav.admin": "प्रशासक पैनल",
  "citizen.home": "मुख्य पृष्ठ",
  "citizen.map": "जोखिम नक्शा",
  "citizen.alerts": "चेतावनियाँ",
  "citizen.report": "रिपोर्ट करें",
  "citizen.safety": "सुरक्षा मार्गदर्शिका",
  "citizen.profile": "प्रोफ़ाइल एवं एसएमएस",
  "common.live": "लाइव",
  "common.demoMode": "डेमो मोड",
  "common.offline": "ऑफ़लाइन मोड",
  "common.riskScore": "जोखिम स्कोर",
  "common.riskLevel": "जोखिम स्तर",
  "common.trend": "प्रवृत्ति",
  "common.rainfall24": "वर्षा (24 घंटे)",
  "common.soilMoisture": "मृदा नमी",
  "common.slope": "ढलान",
  "common.district": "जिला",
  "common.state": "राज्य",
  "kpi.critical": "अति गंभीर",
  "kpi.veryHigh": "बहुत अधिक",
  "kpi.high": "अधिक",
  "kpi.alerts": "सक्रिय चेतावनियाँ",
  "alert.disclaimer":
    "यह संभाव्य निर्णय-सहायता प्रणाली है। अंतिम आपातकालीन निर्णय अधिकृत आपदा प्रबंधन अधिकारियों का होगा।",
};

const as: Dict = {
  ...en,
  "app.tagline": "এআই-ভিত্তিক আগতীয়া সতৰ্কবাণী আৰু ভূমিস্খলন বিপদ নিৰীক্ষণ প্ৰণালী",
  "nav.command": "কমাণ্ড চেণ্টাৰ",
  "nav.dashboard": "ডেশব’ৰ্ড",
  "nav.map": "জিআইএছ বিপদ মেপ",
  "nav.lifelines": "জীৱনৰেখা পথ",
  "nav.simulator": "ছিমুলেটৰ",
  "nav.twin": "ডিজিটেল টুইন",
  "nav.resources": "সম্পদ যোগান",
  "nav.sources": "তথ্য উৎস",
  "nav.zones": "বিপদ অঞ্চল",
  "nav.rainfall": "বৰষুণ ৰাডাৰ",
  "nav.forecast": "বিপদ পূৰ্বানুমান",
  "nav.sensors": "চেন্সৰ",
  "nav.roads": "পথ সংযোগ",
  "nav.reports": "ক্ষেত্ৰ প্ৰতিবেদন",
  "nav.newReport": "নতুন প্ৰতিবেদন",
  "nav.alerts": "সতৰ্কবাণী প্ৰেৰক",
  "nav.response": "আপাতকালীন ব্যৱস্থা",
  "nav.analytics": "বিশ্লেষণ",
  "nav.settings": "ছেটিংছ",
  "nav.security": "নিৰাপত্তা কেন্দ্ৰ",
  "nav.admin": "প্ৰশাসক পেনেল",
  "citizen.home": "গৃহ",
  "citizen.map": "বিপদ মেপ",
  "citizen.alerts": "সতৰ্কবাণী",
  "citizen.report": "বিপদ জনাওক",
  "citizen.safety": "নিৰাপত্তা নিৰ্দেশনা",
  "citizen.profile": "প্ৰফাইল আৰু এছএমএছ",
  "common.live": "লাইভ",
  "common.demoMode": "ডেমো ম’ড",
  "common.offline": "অফলাইন ম’ড",
  "common.riskScore": "বিপদ স্ক’ৰ",
  "common.riskLevel": "বিপদৰ স্তৰ",
  "common.rainfall24": "বৰষুণ (২৪ ঘণ্টা)",
  "common.district": "জিলা",
  "common.state": "ৰাজ্য",
  "kpi.critical": "অতি সংকটজনক",
  "kpi.veryHigh": "অতি উচ্চ",
  "kpi.high": "উচ্চ",
  "kpi.alerts": "সক্ৰিয় সতৰ্কবাণী",
};

const bn: Dict = {
  ...en,
  "app.tagline": "এআই-ভিত্তিক ভূমিধস পূর্ব সতর্কতা ও ঝুঁকি পর্যবেক্ষণ ব্যবস্থা",
  "nav.command": "কমান্ড সেন্টার",
  "nav.dashboard": "ড্যাশবোর্ড",
  "nav.map": "জিআইএস ঝুঁকি মানচিত্র",
  "nav.lifelines": "লাইফলাইন সড়ক",
  "nav.simulator": "সিমুলেটর",
  "nav.twin": "ডিজিটাল টুইন",
  "nav.resources": "লজিস্টিকস ও সম্পদ",
  "nav.zones": "ঝুঁকিপূর্ণ অঞ্চল",
  "nav.rainfall": "বৃষ্টিপাত রাডার",
  "nav.forecast": "ঝুঁকি পূর্বাভাস",
  "nav.sensors": "আইওটি সেন্সর",
  "nav.roads": "সড়ক যোগাযোগ",
  "nav.reports": "ফিল্ড রিপোর্ট",
  "nav.newReport": "নতুন রিপোর্ট",
  "nav.alerts": "সতর্কবার্তা প্রেরক",
  "nav.response": "জরুরি প্রস্তুতি",
  "nav.analytics": "টেলিমেট্রি ও বিশ্লেষণ",
  "nav.settings": "সিস্টেম সেটিংস",
  "nav.security": "নিরাপত্তা কেন্দ্র",
  "nav.admin": "প্রশাসনিক প্যানেল",
  "citizen.home": "মূল পাতা",
  "citizen.map": "ঝুঁকি মানচিত্র",
  "citizen.alerts": "সতর্কবার্তা",
  "citizen.report": "ঝুঁকি জানান",
  "citizen.safety": "নিরাপত্তা নির্দেশিকা",
  "citizen.profile": "প্রোফাইল ও এসএমএস",
  "common.live": "লাইভ",
  "common.demoMode": "ডেমো মোড",
  "common.riskScore": "ঝুঁকি স্কোর",
  "common.riskLevel": "ঝুঁকির মাত্রা",
  "common.rainfall24": "বৃষ্টিপাত (২৪ ঘণ্টা)",
  "common.district": "জেলা",
  "common.state": "রাজ্য",
  "kpi.critical": "সংকটজনক",
  "kpi.veryHigh": "খুব উচ্চ",
  "kpi.high": "উচ্চ",
  "kpi.alerts": "সক্রিয় সতর্কতা",
};

const ne: Dict = {
  ...en,
  "app.tagline": "पहिरो जोखिम पूर्व चेतावनी तथा निगरानी प्रणाली",
  "nav.command": "कमान्ड सेन्टर",
  "nav.dashboard": "ड्यासबोर्ड",
  "nav.map": "जोखिम नक्सा",
  "nav.zones": "जोखिम क्षेत्र",
  "nav.rainfall": "वर्षा राडार",
  "nav.forecast": "पूर्वानुमान",
  "nav.sensors": "सेन्सरहरू",
  "nav.roads": "सडक सम्पर्क",
  "nav.reports": "रिपोर्टहरू",
  "nav.alerts": "सतर्कता सूचना",
  "nav.security": "सुरक्षा केन्द्र",
  "nav.admin": "प्रशासक प्यानल",
  "citizen.home": "गृह पृष्ठ",
  "citizen.map": "जोखिम नक्सा",
  "citizen.alerts": "सतर्कता",
  "citizen.report": "जोखिम रिपोर्ट",
  "citizen.safety": "सुरक्षा निर्देशिका",
  "citizen.profile": "प्रोफाइल र एसएमएस",
  "common.live": "लाइभ",
  "common.riskScore": "जोखिम अङ्क",
  "common.riskLevel": "जोखिम स्तर",
  "common.district": "जिल्ला",
  "common.state": "राज्य",
};

const kha: Dict = {
  ...en,
  "app.tagline": "Ka Jingai Jingthoh Shaphang Ka Jingtwap Khyndew Ha NER",
  "nav.command": "Kynhun Pyniaid",
  "nav.dashboard": "Ka Dashboard",
  "nav.map": "Ka Map Jingma",
  "nav.zones": "Ki Jylli Jingma",
  "nav.rainfall": "Jingthew Slap",
  "nav.alerts": "Ki Khubor Jingma",
  "citizen.home": "Iing",
  "citizen.map": "Map Jingma",
  "citizen.alerts": "Khubor Maham",
  "citizen.report": "Ai Khubor",
  "citizen.safety": "Jingshngain",
  "citizen.profile": "Profile & SMS",
  "common.live": "MYNTA",
  "common.district": "Distrik",
  "common.state": "Jylla",
};

const miz: Dict = {
  ...en,
  "app.tagline": "Lei Min Hriattirna Leh Enzuihna Khawl",
  "nav.command": "Thununna Hmun",
  "nav.dashboard": "Dashboard",
  "nav.map": "Leilung Map",
  "nav.zones": "Hmun Hlauhawm",
  "nav.rainfall": "Ruah Sur Zat",
  "nav.alerts": "Vantlang Hriattirna",
  "citizen.home": "Inpui",
  "citizen.map": "Hlauhawm Map",
  "citizen.alerts": "Hriattirna",
  "citizen.report": "Thil Hmuh Hriattir",
  "citizen.safety": "Himna Kaihhruaina",
  "citizen.profile": "Profile & SMS",
  "common.live": "NUNLAI",
  "common.district": "District",
  "common.state": "State",
};

const mni: Dict = {
  ...en,
  "app.tagline": "চিংশিৎ তুবা মাংওইননা খংহনবা অমসুং য়েংশিনবা সিস্তেম",
  "nav.command": "কমান্ড সেন্টার",
  "nav.dashboard": "দ্যাশবোর্ড",
  "nav.map": "লৈফম মেপ",
  "nav.zones": "অকিবা লৈবা মফম",
  "nav.rainfall": "নোং চুবগী চাং",
  "nav.alerts": "চেকশিনৱা",
  "citizen.home": "য়ুম্লৈফম",
  "citizen.map": "অকিবা মেপ",
  "citizen.alerts": "চেকশিনৱা",
  "citizen.report": "রিপোর্ত তৌবা",
  "citizen.safety": "কান্নবা ৱাফম",
  "citizen.profile": "প্রোফাইল অমসুং এসএমএস",
  "common.live": "লাইভ",
  "common.district": "ডিস্ট্রিক্ট",
  "common.state": "স্টেট",
};

const DICTS: Record<Lang, Dict> = { en, hi, as, bn, ne, kha, miz, mni };

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("ner-safe-lang") as Lang | null;
      if (stored && DICTS[stored]) setLangState(stored);
    } catch {
      // ignore
    }
  }, []);

  const setLang = (newL: Lang) => {
    setLangState(newL);
    try {
      window.localStorage.setItem("ner-safe-lang", newL);
    } catch {
      // ignore
    }
  };

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang,
      t: (key: string) => DICTS[lang]?.[key] ?? en[key] ?? key,
    }),
    [lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) return { lang: "en", setLang: () => {}, t: (k) => en[k] ?? k };
  return ctx;
}
