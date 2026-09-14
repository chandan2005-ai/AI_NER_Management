import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  Info,
  Loader2,
  Lock,
  MapPin,
  Mountain,
  PlusCircle,
  Shield,
  ShieldCheck,
  Sparkles,
  Upload,
  User,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CitizenShell } from "@/components/security/CitizenShell";
import { useApproxLocation } from "@/hooks/useApproxLocation";
import { useAuth } from "@/hooks/useAuth";
import { HAZARD_TYPES } from "@/lib/security/classification";
import { listMyReports, submitHazardReport } from "@/lib/security/citizen.functions";
import { DISTRICTS } from "@/lib/ner/districts";

export const Route = createFileRoute("/citizen/report")({
  head: () => ({
    meta: [
      { title: "Report a Landslide Hazard — NER-SAFE Community" },
      {
        name: "description",
        content:
          "Report ground cracks, rockfalls, culvert blockages or landslide activity to disaster response teams in North East India.",
      },
      { property: "og:title", content: "Report a Hazard — NER-SAFE Community" },
      {
        property: "og:description",
        content: "Send a hazard report with photo, description and optional location.",
      },
    ],
  }),
  component: ReportHazardPage,
});

const HAZARD_OPTIONS = [
  { id: "Rockfall", label: "Rockfall / Falling Debris", icon: "🪨" },
  { id: "Mudflow", label: "Mudflow / Debris Slurry", icon: "🌊" },
  { id: "Slope Crack", label: "New Fissures / Ground Cracks", icon: "⚡" },
  { id: "Road Blockage", label: "Road / Highway Blocked", icon: "🚧" },
  { id: "Culvert Overflow", label: "Culvert Overflow / Drainage Failure", icon: "💧" },
  { id: "Structure Tilt", label: "Tilting Trees / Buildings", icon: "📐" },
];

const LOCAL_REPORTS_KEY = "ner-safe-citizen-reports-v2";

interface StoredReportItem {
  id: string;
  hazard_type: string;
  severity: string;
  description: string;
  district: string;
  lat?: number | null | undefined;
  lng?: number | null | undefined;
  created_at: string;
  status: string;
}

const INITIAL_REPORTS: StoredReportItem[] = [
  {
    id: "rep-demo-1",
    hazard_type: "Slope Crack",
    severity: "MEDIUM",
    description: "Noticed 4-inch deep crack along hillside retaining wall above local school.",
    district: "East Khasi Hills",
    lat: 25.467,
    lng: 91.88,
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    status: "UNDER REVIEW",
  },
  {
    id: "rep-demo-2",
    hazard_type: "Rockfall",
    severity: "HIGH",
    description: "Minor boulder detachment near Sonapur bypass milestone 44. Traffic moving slow.",
    district: "East Jaintia Hills",
    lat: 25.132,
    lng: 92.361,
    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    status: "VERIFIED",
  },
];

function getStoredCitizenReports(): StoredReportItem[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_REPORTS_KEY);
    if (!raw) {
      window.localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(INITIAL_REPORTS));
      return INITIAL_REPORTS;
    }
    const parsed = JSON.parse(raw) as StoredReportItem[];
    return parsed.length ? parsed : INITIAL_REPORTS;
  } catch {
    return INITIAL_REPORTS;
  }
}

function saveStoredCitizenReports(reports: StoredReportItem[]) {
  try {
    window.localStorage.setItem(LOCAL_REPORTS_KEY, JSON.stringify(reports));
  } catch {
    /* ignore storage errors */
  }
}

function ReportHazardPage() {
  const {
    area,
    status: geoStatus,
    coords: geoCoords,
    errorMessage: geoError,
    requestDeviceLocation,
    setManualArea,
  } = useApproxLocation();
  const { session, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [hazard, setHazard] = useState<string>(HAZARD_OPTIONS[0]?.id ?? "Rockfall");
  const [severity, setSeverity] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [description, setDescription] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number; timestamp?: number } | null>(
    null,
  );
  const [selectedDistrict, setSelectedDistrict] = useState(area?.district || "East Khasi Hills");
  const [busy, setBusy] = useState(false);
  const [localReports, setLocalReports] = useState<StoredReportItem[]>(() => {
    if (typeof window === "undefined") return INITIAL_REPORTS;
    return getStoredCitizenReports();
  });

  const reportsQuery = useQuery({
    queryKey: ["my-reports", session?.user?.id],
    queryFn: async () => {
      const stored = getStoredCitizenReports();
      try {
        if (session && !session.access_token?.startsWith("mock-")) {
          const res = await listMyReports();
          if (res && res.length > 0) {
            const mapped: StoredReportItem[] = res.map((r) => ({
              id: r.id,
              hazard_type: r.hazard_type,
              severity: r.severity,
              description: r.description,
              district: r.district ?? "East Khasi Hills",
              lat: null,
              lng: null,
              created_at: r.created_at,
              status: r.status,
            }));
            const merged = [...mapped, ...stored.filter((s) => !mapped.some((r) => r.id === s.id))];
            saveStoredCitizenReports(merged);
            return merged;
          }
        }
      } catch (err) {
        console.warn("[citizen-reports] backend query fallback:", err);
      }
      return stored;
    },
    refetchInterval: 30_000,
  });

  // Sync coords if resolved by hook
  useEffect(() => {
    if (geoCoords && !coords) {
      setCoords(geoCoords);
    }
  }, [geoCoords, coords]);

  function attachLocation() {
    requestDeviceLocation();
  }

  function handleDistrictChange(districtName: string) {
    setSelectedDistrict(districtName);
    const d = DISTRICTS.find((item) => item.name === districtName);
    if (d) {
      setManualArea(d.name, d.state, d.lat, d.lng);
    }
  }

  function setDistrictCentroid() {
    const d = DISTRICTS.find((item) => item.name === selectedDistrict);
    if (d) {
      setCoords({ lat: d.lat, lng: d.lng, timestamp: Date.now() });
      toast.success(`Coordinates set to ${d.name} centroid: ${d.lat}°N, ${d.lng}°E`);
    }
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);

    const targetDistrict = DISTRICTS.find((d) => d.name === selectedDistrict);
    const resolvedLat = coords?.lat ?? targetDistrict?.lat ?? 25.467;
    const resolvedLng = coords?.lng ?? targetDistrict?.lng ?? 91.88;

    const newReportItem: StoredReportItem = {
      id: `rep-${Date.now()}`,
      hazard_type: hazard,
      severity,
      description: description.trim(),
      district: selectedDistrict,
      lat: resolvedLat,
      lng: resolvedLng,
      created_at: new Date().toISOString(),
      status: "RECEIVED",
    };

    try {
      if (session && !session.access_token?.startsWith("mock-")) {
        await submitHazardReport({
          data: {
            hazard_type: hazard,
            severity,
            description: description.trim(),
            district: selectedDistrict,
            state: targetDistrict?.state || "Meghalaya",
            lat: resolvedLat,
            lng: resolvedLng,
            photo_url: photoPreview ? "attached-photo.jpg" : null,
          },
        });
      }
    } catch (err) {
      console.warn("[citizen-reports] backend submit fallback:", err);
    }

    const updated = [newReportItem, ...getStoredCitizenReports()];
    saveStoredCitizenReports(updated);
    setLocalReports(updated);

    toast.success(
      `Hazard report submitted successfully! GPS coordinates (${resolvedLat.toFixed(4)}°N, ${resolvedLng.toFixed(4)}°E) attached.`,
    );

    setDescription("");
    setPhotoPreview(null);
    setCoords(null);
    setBusy(false);
    void queryClient.invalidateQueries({ queryKey: ["my-reports"] });
  }

  const allReportsList = reportsQuery.data ?? localReports;

  return (
    <CitizenShell title="Report a Landslide Hazard">
      {/* Informational banner */}
      <section className="rounded-2xl border border-border bg-white p-4.5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-600">
            <AlertTriangle className="size-5" />
          </span>
          <div>
            <p className="text-xs font-bold text-foreground">
              Crowdsourced Community Hazard Network
            </p>
            <p className="text-[0.72rem] text-muted-foreground leading-relaxed">
              Your ground observations help SDMA emergency units dispatch road-clearing machinery
              and issue early warnings.
            </p>
          </div>
        </div>

        {!session && (
          <Button
            asChild
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5 shrink-0 border-primary/40 text-primary hover:bg-primary/10"
          >
            <Link to="/auth" search={{ role: "citizen", mode: "signin" }}>
              Sign In to Report
            </Link>
          </Button>
        )}
      </section>

      {/* Main Reporting Form */}
      <form
        onSubmit={submit}
        className="rounded-2xl border border-border bg-white p-5 sm:p-6 shadow-xs space-y-4"
      >
        <div>
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            1. Select Hazard Type
          </Label>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {HAZARD_OPTIONS.map((opt) => {
              const active = hazard === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setHazard(opt.id)}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-left text-xs transition-all ${
                    active
                      ? "border-primary bg-primary/10 font-bold text-primary ring-1 ring-primary"
                      : "border-border bg-surface hover:border-primary/40 text-foreground"
                  }`}
                >
                  <span className="text-base" aria-hidden>
                    {opt.icon}
                  </span>
                  <span className="truncate">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            2. Estimated Hazard Severity
          </Label>
          <div className="mt-2 flex gap-2">
            {(["LOW", "MEDIUM", "HIGH"] as const).map((lvl) => {
              const active = severity === lvl;
              return (
                <Button
                  key={lvl}
                  type="button"
                  size="sm"
                  variant={active ? "default" : "outline"}
                  onClick={() => setSeverity(lvl)}
                  className={`flex-1 text-xs font-bold h-9 ${
                    active
                      ? lvl === "HIGH"
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : lvl === "MEDIUM"
                          ? "bg-orange-500 hover:bg-orange-600 text-white"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-surface"
                  }`}
                >
                  {lvl === "LOW" && "🟢 Minor (Small stones/cracks)"}
                  {lvl === "MEDIUM" && "🟡 Medium (Partial road block)"}
                  {lvl === "HIGH" && "🔴 Severe (Active slide/Danger)"}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="district" className="text-xs font-bold text-foreground">
              District Location *
            </Label>
            <Select value={selectedDistrict} onValueChange={handleDistrictChange}>
              <SelectTrigger id="district" className="mt-1 h-9 text-xs bg-surface">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {DISTRICTS.map((d) => (
                  <SelectItem key={d.id} value={d.name} className="text-xs">
                    {d.name}, {d.state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground">GPS Location Attachment</Label>
              <button
                type="button"
                onClick={setDistrictCentroid}
                className="text-[0.68rem] text-primary hover:underline font-semibold"
              >
                Use District Centroid
              </button>
            </div>

            <div className="mt-1 flex flex-col gap-1.5">
              {coords ? (
                <div className="flex items-center justify-between rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                    <span className="font-mono text-[0.7rem] truncate">
                      📍 {coords.lat.toFixed(4)}°N, {coords.lng.toFixed(4)}°E
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCoords(null)}
                    className="text-red-500 hover:text-red-700 ml-2 shrink-0 text-xs font-medium"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={attachLocation}
                  disabled={geoStatus === "asking"}
                  className="w-full h-9 text-xs gap-1.5 bg-surface border-primary/30 text-primary hover:bg-primary/5"
                >
                  {geoStatus === "asking" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <MapPin className="size-3.5" />
                  )}
                  {geoStatus === "asking"
                    ? "Acquiring GPS Position…"
                    : "Use My Current GPS Location"}
                </Button>
              )}

              {/* Actionable Geolocation Error Message */}
              {geoError && (
                <div className="rounded-lg border border-amber-300/60 bg-amber-50/70 p-2 text-[0.7rem] text-amber-800 space-y-1">
                  <p className="font-semibold flex items-center gap-1">
                    <Info className="size-3 shrink-0" /> GPS Notice
                  </p>
                  <p className="leading-snug">{geoError}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="desc" className="text-xs font-bold text-foreground">
            3. Detailed Observation
          </Label>
          <Textarea
            id="desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the hazard: exact milestone / landmark, width of slope movement, any stranded vehicles or blocked waterways…"
            minLength={5}
            required
            rows={3}
            className="mt-1 text-xs bg-surface"
          />
        </div>

        <div>
          <Label className="text-xs font-bold text-foreground">Photo Evidence (Recommended)</Label>
          <div className="mt-1.5 flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border bg-surface px-4 py-3 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors">
              <Camera className="size-4" />
              <span>{photoPreview ? "Change photo" : "Take photo or upload"}</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoSelect}
              />
            </label>
            {photoPreview && (
              <div className="relative size-12 overflow-hidden rounded-lg border border-border">
                <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotoPreview(null)}
                  className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-black"
                >
                  <X className="size-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-10 text-xs font-bold gap-2 shadow-sm"
          disabled={busy}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <PlusCircle className="size-4" />}
          Submit Hazard Report to Response Teams
        </Button>
      </form>

      {/* Community Reports Feed */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Mountain className="size-3.5 text-primary" />
            Recent Ground Reports ({allReportsList.length})
          </h3>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              void reportsQuery.refetch();
              toast.info("Reports refreshed");
            }}
            className="h-7 text-[0.68rem] text-muted-foreground hover:text-foreground gap-1"
          >
            <Clock className="size-3" />
            Refresh Feed
          </Button>
        </div>

        {reportsQuery.isLoading ? (
          <div className="rounded-xl border border-border bg-white p-8 text-center text-xs text-muted-foreground">
            <Loader2 className="size-6 animate-spin mx-auto text-primary mb-2" />
            Loading hazard reports…
          </div>
        ) : allReportsList.length === 0 ? (
          <div className="rounded-xl border border-border bg-white p-8 text-center text-xs text-muted-foreground space-y-1">
            <CheckCircle2 className="size-6 text-emerald-600 mx-auto mb-1" />
            <p className="font-bold text-foreground">No reports recorded yet</p>
            <p className="text-[0.7rem]">Be the first to submit a community hazard observation.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {allReportsList.map((rep) => (
              <div
                key={rep.id}
                className="rounded-xl border border-border bg-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">{rep.hazard_type}</span>
                    <span
                      className={`rounded px-1.5 py-0.2 text-[0.65rem] font-bold ${
                        rep.severity === "HIGH"
                          ? "bg-red-100 text-red-700"
                          : rep.severity === "MEDIUM"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {rep.severity}
                    </span>
                    <span className="text-[0.68rem] text-muted-foreground font-medium">
                      📍 {rep.district}{" "}
                      {rep.lat && rep.lng
                        ? `(${rep.lat.toFixed(3)}°N, ${rep.lng.toFixed(3)}°E)`
                        : ""}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-foreground/90 leading-relaxed">
                    {rep.description}
                  </p>
                  <p className="mt-1 text-[0.65rem] text-muted-foreground font-mono">
                    Reported {new Date(rep.created_at).toLocaleTimeString()} ·{" "}
                    {new Date(rep.created_at).toLocaleDateString()}
                  </p>
                </div>

                <span className="inline-flex items-center gap-1 rounded-full bg-surface border border-border px-2.5 py-1 text-[0.65rem] font-semibold text-primary shrink-0 self-start sm:self-center">
                  <CheckCircle2 className="size-3 text-risk-low" />
                  {rep.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </CitizenShell>
  );
}
