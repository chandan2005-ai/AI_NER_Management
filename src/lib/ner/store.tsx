import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { buildSnapshot, type CitizenReport, type ReportType, type Snapshot } from "./demo-data";
import { buildIntelligence, type Intelligence } from "./intelligence";
import { DEMO_STEPS, type DemoStep } from "./judge-demo";
import { MODE_BANNER, type SystemMode } from "./adapters";

const QUEUE_KEY = "ner-safe-report-queue";
const SUBMITTED_KEY = "ner-safe-reports";

export interface DraftReport {
  id: string;
  type: ReportType;
  severity: "LOW" | "MEDIUM" | "HIGH";
  description: string;
  lat: number;
  lng: number;
  district: string;
  state: string;
  createdAt: string;
  photoName?: string | undefined;
  imageAnalysis?: { detected: string; confidence: number; suggestedSeverity: string } | undefined;
}

interface SystemValue {
  snapshot: Snapshot;
  tick: number;
  demoMode: boolean;
  setDemoMode: (v: boolean) => void;
  simulating: boolean;
  setSimulating: (v: boolean) => void;
  online: boolean;
  /** Reports created in this browser (synced + pending). */
  localReports: DraftReport[];
  pendingCount: number;
  submitReport: (r: Omit<DraftReport, "id" | "createdAt">) => { queued: boolean };
  syncNow: () => void;
  lastUpdate: string;
  /** Full decision-intelligence pipeline derived from the current snapshot. */
  intelligence: Intelligence;
  /** DEMO uses local synthetic generators; LIVE expects registered adapters. */
  mode: SystemMode;
  setMode: (m: SystemMode) => void;
  modeBanner: { label: string; detail: string };
  /** Guided judge walkthrough. */
  judgeDemo: boolean;
  setJudgeDemo: (v: boolean) => void;
  judgeStep: number;
  setJudgeStep: (n: number) => void;
  steps: DemoStep[];
}

const SystemContext = createContext<SystemValue | null>(null);

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function SystemProvider({ children }: { children: ReactNode }) {
  const [tick, setTick] = useState(0);
  const [demoMode, setDemoMode] = useState(true);
  const [simulating, setSimulating] = useState(true);
  const [online, setOnline] = useState(true);
  const [localReports, setLocalReports] = useState<DraftReport[]>([]);
  const [queue, setQueue] = useState<DraftReport[]>([]);
  const [lastUpdate, setLastUpdate] = useState("—");
  const [mode, setMode] = useState<SystemMode>("DEMO");
  const [judgeDemo, setJudgeDemo] = useState(false);
  const [judgeStep, setJudgeStep] = useState(1);
  const prevCritical = useRef<number | null>(null);

  // Restore offline queue + previously submitted reports.
  useEffect(() => {
    setQueue(readJson<DraftReport[]>(QUEUE_KEY, []));
    setLocalReports(readJson<DraftReport[]>(SUBMITTED_KEY, []));
    setOnline(navigator.onLine);
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  // Live simulation engine: advances the environmental signal every 6 seconds.
  useEffect(() => {
    if (!simulating || !demoMode) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 6000);
    return () => window.clearInterval(id);
  }, [simulating, demoMode]);

  const snapshot = useMemo(() => buildSnapshot(demoMode ? tick : 0), [tick, demoMode]);
  const intelligence = useMemo(() => buildIntelligence(snapshot), [snapshot]);

  useEffect(() => {
    setLastUpdate(new Date().toLocaleTimeString());
    const critical = snapshot.summary.critical;
    if (prevCritical.current !== null && critical > prevCritical.current) {
      const worst = snapshot.zones[0];
      toast.error(`LEVEL 4 alert — ${worst?.district.name}`, {
        description: `Risk score ${worst?.assessment.score}/100 · ${Math.round(
          (worst?.assessment.probability ?? 0) * 100,
        )}% hazard probability. Verification by field team recommended.`,
      });
    }
    prevCritical.current = critical;
  }, [snapshot]);

  const persistQueue = useCallback((next: DraftReport[]) => {
    setQueue(next);
    window.localStorage.setItem(QUEUE_KEY, JSON.stringify(next));
  }, []);

  const persistReports = useCallback((next: DraftReport[]) => {
    setLocalReports(next);
    window.localStorage.setItem(SUBMITTED_KEY, JSON.stringify(next));
  }, []);

  const submitReport = useCallback<SystemValue["submitReport"]>(
    (draft) => {
      const report: DraftReport = {
        ...draft,
        id: `RPT-LOCAL-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      if (!navigator.onLine) {
        persistQueue([...queue, report]);
        return { queued: true };
      }
      persistReports([report, ...localReports]);
      return { queued: false };
    },
    [queue, localReports, persistQueue, persistReports],
  );

  const syncNow = useCallback(() => {
    if (queue.length === 0) return;
    persistReports([...queue, ...localReports]);
    persistQueue([]);
    toast.success(`${queue.length} queued report(s) synced to NER-SAFE`);
  }, [queue, localReports, persistQueue, persistReports]);

  // Background synchronisation when connectivity returns.
  useEffect(() => {
    if (online && queue.length > 0) syncNow();
  }, [online, queue.length, syncNow]);

  const value: SystemValue = {
    snapshot,
    tick,
    demoMode,
    setDemoMode,
    simulating,
    setSimulating,
    online,
    localReports,
    pendingCount: queue.length,
    submitReport,
    syncNow,
    lastUpdate,
    intelligence,
    mode,
    setMode,
    modeBanner: MODE_BANNER[mode],
    judgeDemo,
    setJudgeDemo,
    judgeStep,
    setJudgeStep,
    steps: DEMO_STEPS,
  };

  return <SystemContext.Provider value={value}>{children}</SystemContext.Provider>;
}

export function useSystem(): SystemValue {
  const ctx = useContext(SystemContext);
  if (!ctx) throw new Error("useSystem must be used inside <SystemProvider>");
  return ctx;
}

/** Merges generated demo reports with reports created in this browser. */
export function mergeReports(snapshot: Snapshot, local: DraftReport[]): CitizenReport[] {
  const mapped: CitizenReport[] = local.map((r) => ({
    id: r.id,
    type: r.type,
    severity: r.severity,
    districtId: "LOCAL",
    district: r.district,
    state: r.state,
    lat: r.lat,
    lng: r.lng,
    description: r.description,
    reportedBy: "Citizen",
    minutesAgo: Math.max(0, Math.round((Date.now() - new Date(r.createdAt).getTime()) / 60000)),
    status: "OPEN",
    imageAnalysis: r.imageAnalysis,
  }));
  return [...mapped, ...snapshot.reports];
}
