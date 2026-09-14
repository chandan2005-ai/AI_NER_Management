import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  ExternalLink,
  HeartPulse,
  Info,
  PhoneCall,
  Shield,
  ShieldAlert,
  Sparkles,
  Volume2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { CitizenShell } from "@/components/security/CitizenShell";
import { OfflineBanner } from "@/components/ner/OfflineBanner";

export const Route = createFileRoute("/citizen/safety")({
  head: () => ({
    meta: [
      { title: "Landslide Safety & Guidelines — NER-SAFE Community" },
      {
        name: "description",
        content:
          "Official landslide safety steps, early warning signs, emergency helpline numbers (112, 1070, 1077), and offline emergency preparedness checklist.",
      },
      { property: "og:title", content: "Landslide Safety Guidelines — NER-SAFE Community" },
      {
        property: "og:description",
        content:
          "Clear, offline-accessible landslide emergency protocols, warnings signs, and disaster helplines for North East India.",
      },
    ],
  }),
  component: CitizenSafetyPage,
});

const EMERGENCY_CONTACTS = [
  {
    name: "National Emergency SOS",
    number: "112",
    desc: "Police, Fire, Ambulance & SDRF — All India unified emergency number",
    primary: true,
  },
  {
    name: "National Disaster Response Force (NDRF)",
    number: "1078",
    desc: "Specialized national search, evacuation and landslide rescue operations",
    primary: true,
  },
  {
    name: "State Disaster Management (SDMA)",
    number: "1070",
    desc: "Toll-free state emergency operations center 24x7 control room",
  },
  {
    name: "District Disaster Management (DDMA)",
    number: "1077",
    desc: "District-level incident commander and rapid emergency response teams",
  },
  {
    name: "Ambulance / Urgent Medical Aid",
    number: "108",
    desc: "Emergency medical transport and paramedics for trauma victims",
  },
  {
    name: "National Highway Emergency (NHAI)",
    number: "1033",
    desc: "Highway accidents, major debris blockage, and road clearance assistance",
  },
  {
    name: "Fire & Mountain Rescue",
    number: "101",
    desc: "Fire services, structural extrication, and slope hazard clearance",
  },
  {
    name: "Police Emergency Control",
    number: "100",
    desc: "Law enforcement, cordon security, and immediate ground intervention",
  },
  {
    name: "Women in Distress Helpline",
    number: "1091",
    desc: "24x7 crisis support, safe evacuation, and women safety assistance",
  },
  {
    name: "Childline Emergency Helpline",
    number: "1098",
    desc: "Emergency protection and care for children in disaster situations",
  },
  {
    name: "Railway Emergency & Safety",
    number: "139",
    desc: "Rail accident response, train disruption info, and emergency support",
  },
  {
    name: "Central Water Commission (CWC Flood Alert)",
    number: "1800-180-1551",
    desc: "Flash flood forecasting, river level alerts, and reservoir advisories",
  },
];

const WARNING_SIGNS = [
  {
    title: "New cracks in roads or buildings",
    desc: "Cracks appearing in foundations, walls, retaining walls, paved roads, or on the ground hillside.",
    urgency: "HIGH",
  },
  {
    title: "Tilting trees, fences, or utility poles",
    desc: "Progressive leaning or sudden displacement of telephone poles, trees, or fences on a slope.",
    urgency: "CRITICAL",
  },
  {
    title: "Sudden changes in stream water",
    desc: "Stream or river water suddenly turning muddy, or flow drastically reducing or stopping (may indicate upstream blockage/damming).",
    urgency: "CRITICAL",
  },
  {
    title: "Unusual rumbling or cracking sounds",
    desc: "Sounds of trees snapping, rocks knocking together, or a low rumbling sound that grows louder.",
    urgency: "CRITICAL",
  },
  {
    title: "Doors or windows sticking",
    desc: "Doors or window frames jamming unexpectedly due to structural warping caused by slope creep.",
    urgency: "MODERATE",
  },
  {
    title: "Water springing from new hillside locations",
    desc: "New springs, wet patches, or soil bulging at the base of slopes where water did not seep before.",
    urgency: "HIGH",
  },
];

const PROTOCOLS = [
  {
    phase: "Before (Preparedness)",
    steps: [
      "Identify safe evacuation routes leading uphill or to designated community shelters away from steep slopes.",
      "Assemble an Emergency Go-Bag: battery torch, water, dry food, first-aid kit, medicines, important identity documents in waterproof pouches.",
      "Stay tuned to local weather advisories and rainfall forecasts during monsoon months (June–September).",
      "Avoid building or staying in temporary structures directly beneath or above steep unreinforced hillsides.",
      "Ensure slope drainage channels around your home are kept clear of debris, garbage, and fallen leaves.",
    ],
  },
  {
    phase: "During (Immediate Action)",
    steps: [
      "If you suspect landslide activity, EVACUATE IMMEDIATELY — do not attempt to collect non-essential possessions.",
      "Move perpendicular to the path of the flow, heading toward higher, stable ground or ridge lines.",
      "If escaping is impossible, curl into a tight ball, protect your head and neck with your arms, and take shelter under a sturdy table.",
      "Do NOT cross flooded streams, active mudflows, or recently blocked culverts on foot or in vehicles.",
      "Listen for unusual sounds: cracking wood, breaking rocks, or sudden locomotive-like roaring.",
    ],
  },
  {
    phase: "After (Post-Event Safety)",
    steps: [
      "Stay away from the slide area — secondary slides, rockfalls, or flash floods frequently follow.",
      "Check for injured or trapped people NEAR the slide perimeter WITHOUT entering the active slide zone directly.",
      "Report broken power lines, ruptured water pipes, gas leaks, and road blockages to authorities via 112 or 1077.",
      "Check your house foundations and surrounding soil for stability before re-entering.",
      "Report observed slope changes or fresh hazards on the NER-SAFE Community Report page to alert response teams.",
    ],
  },
];

const CHECKLIST_KEY = "ner_safe_emergency_checklist";

const DEFAULT_CHECKLIST = [
  { id: "torch", text: "High-intensity flashlight / torch + spare batteries", checked: false },
  { id: "water", text: "Bottled drinking water (at least 2 litres per person)", checked: false },
  {
    id: "firstaid",
    text: "First-aid kit (antiseptic, bandages, gauze, pain relievers)",
    checked: false,
  },
  {
    id: "medicines",
    text: "Essential regular prescription medications for 3–5 days",
    checked: false,
  },
  { id: "powerbank", text: "Fully charged power bank + charging cables", checked: false },
  {
    id: "docs",
    text: "Identity documents (Aadhaar, Voter ID) in a sealed waterproof pouch",
    checked: false,
  },
  {
    id: "whistle",
    text: "Whistle (to signal location if trapped or in dense fog/rain)",
    checked: false,
  },
  { id: "radio", text: "Battery or hand-crank FM radio for emergency broadcasts", checked: false },
  { id: "cash", text: "Cash in small denominations (ATMs/networks may be down)", checked: false },
  { id: "clothing", text: "Sturdy waterproof footwear and rain poncho/jacket", checked: false },
];

function CitizenSafetyPage() {
  const [checklist, setChecklist] = useState(DEFAULT_CHECKLIST);
  const [activeTab, setActiveTab] = useState<"helplines" | "warning" | "steps" | "kit">(
    "helplines",
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHECKLIST_KEY);
      if (saved) {
        setChecklist(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleCheck = (id: string) => {
    const next = checklist.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item,
    );
    setChecklist(next);
    try {
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const completedCount = checklist.filter((c) => c.checked).length;

  return (
    <CitizenShell title="Landslide Safety Guidelines">
      <OfflineBanner />

      {/* Emergency Call Banner */}
      <section className="rounded-xl border border-risk-critical/40 bg-gradient-to-r from-risk-critical/15 to-risk-critical/5 p-4 text-card-foreground shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-risk-critical text-white shadow">
              <PhoneCall className="size-5" />
            </span>
            <div>
              <p className="font-display text-base font-bold tracking-wide text-foreground">
                Immediate Life Threat or Landslide in Progress?
              </p>
              <p className="text-xs text-muted-foreground">
                Do not wait. Evacuate immediately and dial the National Emergency Helpline.
              </p>
            </div>
          </div>
          <Button
            asChild
            size="lg"
            className="bg-risk-critical text-white hover:bg-risk-critical/90 shadow-md"
          >
            <a href="tel:112" className="flex items-center gap-2">
              <PhoneCall className="size-4 animate-bounce" />
              Call 112 Now
            </a>
          </Button>
        </div>
      </section>

      {/* Category selector tabs */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Button
          type="button"
          variant={activeTab === "helplines" ? "default" : "outline"}
          size="sm"
          className="h-10 text-xs justify-start gap-2"
          onClick={() => setActiveTab("helplines")}
        >
          <PhoneCall className="size-3.5" />
          Helplines
        </Button>
        <Button
          type="button"
          variant={activeTab === "warning" ? "default" : "outline"}
          size="sm"
          className="h-10 text-xs justify-start gap-2"
          onClick={() => setActiveTab("warning")}
        >
          <AlertTriangle className="size-3.5" />
          Warning Signs
        </Button>
        <Button
          type="button"
          variant={activeTab === "steps" ? "default" : "outline"}
          size="sm"
          className="h-10 text-xs justify-start gap-2"
          onClick={() => setActiveTab("steps")}
        >
          <BookOpen className="size-3.5" />
          Safety Steps
        </Button>
        <Button
          type="button"
          variant={activeTab === "kit" ? "default" : "outline"}
          size="sm"
          className="h-10 text-xs justify-start gap-2"
          onClick={() => setActiveTab("kit")}
        >
          <Shield className="size-3.5" />
          Emergency Kit ({completedCount}/{checklist.length})
        </Button>
      </div>

      {/* Tab: Helplines */}
      {activeTab === "helplines" && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Official Disaster & Emergency Helplines (India)
            </p>
            <span className="rounded bg-surface px-2 py-0.5 text-[0.65rem] text-muted-foreground border">
              Toll-free · 24/7 Available
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {EMERGENCY_CONTACTS.map((c) => (
              <div
                key={c.number}
                className={`flex flex-col justify-between rounded-lg border p-4 transition-all hover:border-primary/50 ${
                  c.primary
                    ? "border-risk-critical/40 bg-risk-critical/5 shadow-sm"
                    : "border-border bg-surface"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{c.name}</p>
                    <span className="font-mono text-base font-bold text-primary">{c.number}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{c.desc}</p>
                </div>
                <div className="mt-4 pt-2">
                  <Button
                    asChild
                    size="sm"
                    variant={c.primary ? "default" : "secondary"}
                    className="w-full text-xs gap-1.5"
                  >
                    <a href={`tel:${c.number}`}>
                      <PhoneCall className="size-3" />
                      Dial {c.number}
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-border bg-surface/60 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">
              State Emergency Operations Centers (SEOCs):
            </p>
            <ul className="mt-1.5 grid gap-1 sm:grid-cols-2 text-[0.75rem]">
              <li>• Assam SDMA: 1070 / 1079</li>
              <li>• Meghalaya SDMA: 1070</li>
              <li>• Sikkim SDMA: 1070 / 1077</li>
              <li>• Nagaland NSDMA: 1070</li>
              <li>• Mizoram DM&R: 1070</li>
              <li>• Arunachal Pradesh SDMA: 1070</li>
              <li>• Manipur SDMA: 1070</li>
              <li>• Tripura SDMA: 1070</li>
            </ul>
          </div>
        </section>
      )}

      {/* Tab: Warning Signs */}
      {activeTab === "warning" && (
        <section className="space-y-3">
          <div className="rounded-lg border border-risk-moderate/40 bg-risk-moderate/10 p-3 text-xs text-risk-moderate">
            <p className="font-semibold">Early Warning Signs Save Lives</p>
            <p className="mt-0.5 text-[0.75rem]">
              Landslides rarely happen without prior physical indicators on the slope. If you
              observe two or more of the following indicators, evacuate and notify your community
              and authorities.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {WARNING_SIGNS.map((sign, i) => (
              <div key={i} className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold">{sign.title}</p>
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-[0.65rem] font-bold ${
                      sign.urgency === "CRITICAL"
                        ? "bg-risk-critical/20 text-risk-critical"
                        : sign.urgency === "HIGH"
                          ? "bg-risk-high/20 text-risk-high"
                          : "bg-risk-moderate/20 text-risk-moderate"
                    }`}
                  >
                    {sign.urgency}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{sign.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tab: Safety Protocols */}
      {activeTab === "steps" && (
        <section className="space-y-4">
          {PROTOCOLS.map((p, idx) => (
            <div key={idx} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {idx + 1}
                </span>
                <p className="font-display text-sm font-bold tracking-wide">{p.phase}</p>
              </div>
              <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
                {p.steps.map((step, sIdx) => (
                  <li key={sIdx} className="flex items-start gap-2">
                    <ChevronRight className="size-3.5 shrink-0 text-primary mt-0.5" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {/* Tab: Emergency Kit Checklist */}
      {activeTab === "kit" && (
        <section className="space-y-4">
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-sm font-bold">Emergency Go-Bag Checklist</p>
                <p className="text-xs text-muted-foreground">
                  Prepare these essential items in a lightweight, waterproof backpack. Saved on your
                  device.
                </p>
              </div>
              <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                {completedCount} / {checklist.length} ready
              </span>
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full bg-risk-low transition-all duration-300"
                style={{ width: `${(completedCount / checklist.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            {checklist.map((item) => (
              <label
                key={item.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-xs transition-colors ${
                  item.checked
                    ? "border-risk-low/40 bg-risk-low/5 text-foreground line-through opacity-80"
                    : "border-border bg-surface hover:border-primary/50 text-foreground"
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => toggleCheck(item.id)}
                  className="size-4 rounded border-border accent-primary"
                />
                <span className="flex-1">{item.text}</span>
                {item.checked ? <CheckCircle2 className="size-4 text-risk-low" /> : null}
              </label>
            ))}
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => {
                const reset = DEFAULT_CHECKLIST.map((c) => ({ ...c, checked: false }));
                setChecklist(reset);
                localStorage.setItem(CHECKLIST_KEY, JSON.stringify(reset));
              }}
            >
              Reset Checklist
            </Button>
          </div>
        </section>
      )}
    </CitizenShell>
  );
}
