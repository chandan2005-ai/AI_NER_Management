import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Camera, Loader2, MapPin, WifiOff } from "lucide-react";

import { AppShell } from "@/components/ner/AppShell";
import { DemoDataNotice } from "@/components/ner/bits";
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
import { DISTRICTS } from "@/lib/ner/districts";
import {
  analyseHazardImage,
  validateImage,
  type ImageAnalysisResult,
} from "@/lib/ner/image-analysis";
import { useSystem } from "@/lib/ner/store";
import type { ReportType } from "@/lib/ner/demo-data";

export const Route = createFileRoute("/reports/new")({
  head: () => ({
    meta: [
      { title: "Report a Landslide Hazard | NER-SAFE" },
      {
        name: "description",
        content:
          "Mobile-friendly hazard reporting: capture GPS location, photo, hazard type and severity. Works offline and syncs when connectivity returns.",
      },
      { property: "og:title", content: "Report a Landslide Hazard — NER-SAFE" },
      {
        property: "og:description",
        content:
          "Citizens and field officers can report cracks, slope movement, debris, rockfall and road blockages directly into NER-SAFE.",
      },
    ],
  }),
  component: NewReportPage,
});

const TYPES: ReportType[] = [
  "CRACK",
  "SLOPE MOVEMENT",
  "LANDSLIDE",
  "ROAD BLOCKAGE",
  "ROCKFALL",
  "WATERLOGGING",
  "OTHER",
];

function NewReportPage() {
  const { submitReport, online, pendingCount } = useSystem();
  const navigate = useNavigate();

  const [type, setType] = useState<ReportType>("CRACK");
  const [severity, setSeverity] = useState<"LOW" | "MEDIUM" | "HIGH">("MEDIUM");
  const [districtId, setDistrictId] = useState(DISTRICTS[0]!.id);
  const [description, setDescription] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [locating, setLocating] = useState(false);
  const [photoName, setPhotoName] = useState<string | undefined>();
  const [analysing, setAnalysing] = useState(false);
  const [analysis, setAnalysis] = useState<ImageAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const district = DISTRICTS.find((d) => d.id === districtId)!;

  const captureLocation = () => {
    // Check secure context
    if (
      typeof window !== "undefined" &&
      window.isSecureContext === false &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      toast.warning(
        "Browser security requires HTTPS or localhost for automatic GPS. You can enter coordinates manually or use the district centroid.",
      );
      setLat(district.lat.toFixed(5));
      setLng(district.lng.toFixed(5));
      return;
    }

    if (!("geolocation" in navigator)) {
      toast.error("This device does not expose GPS to the browser.");
      return;
    }

    setLocating(true);
    toast.info("Requesting GPS coordinates…");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(5));
        setLng(pos.coords.longitude.toFixed(5));
        setLocating(false);
        toast.success(
          `GPS Acquired: ${pos.coords.latitude.toFixed(4)}°N, ${pos.coords.longitude.toFixed(4)}°E`,
        );
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error(
            "Location permission was denied. Enable location in browser settings or use the district centroid.",
          );
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          toast.error("GPS position unavailable. Please ensure device location is switched on.");
        } else if (err.code === err.TIMEOUT) {
          toast.error("GPS request timed out. Please click retry.");
        } else {
          toast.error("Could not read GPS. You can enter coordinates manually.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const useDistrictCentroid = () => {
    setLat(district.lat.toFixed(5));
    setLng(district.lng.toFixed(5));
    toast.success(
      `Set coordinates to ${district.name} centroid: ${district.lat}°N, ${district.lng}°E`,
    );
  };

  const onPhoto = async (file: File | undefined) => {
    if (!file) return;
    const invalid = validateImage(file);
    if (invalid) {
      setError(invalid);
      toast.error(invalid);
      return;
    }
    setError(null);
    setPhotoName(file.name);
    setAnalysing(true);
    try {
      const result = await analyseHazardImage(file);
      setAnalysis(result);
      setSeverity(result.suggestedSeverity);
      toast.success(`${result.detected} — ${result.confidence}% confidence`);
    } catch {
      toast.error("Image analysis failed. The report can still be submitted without it.");
    } finally {
      setAnalysing(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 10) {
      setError("Please describe what you observed in at least 10 characters.");
      return;
    }
    const latitude = lat ? Number(lat) : district.lat;
    const longitude = lng ? Number(lng) : district.lng;
    if (
      Number.isNaN(latitude) ||
      Number.isNaN(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      setError("Invalid GPS coordinates.");
      return;
    }

    setError(null);
    setSubmitting(true);
    const { queued } = submitReport({
      type,
      severity,
      description: description.trim(),
      lat: latitude,
      lng: longitude,
      district: district.name,
      state: district.state,
      photoName,
      imageAnalysis: analysis
        ? {
            detected: analysis.detected,
            confidence: analysis.confidence,
            suggestedSeverity: analysis.suggestedSeverity,
          }
        : undefined,
    });
    setSubmitting(false);

    if (queued) {
      toast.warning("Saved offline — will sync automatically", {
        description: `${pendingCount + 1} report(s) waiting to sync.`,
      });
    } else {
      toast.success("Report submitted to NER-SAFE");
    }
    navigate({ to: "/reports" });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-4 p-3 sm:p-5">
        <div>
          <h1 className="text-2xl font-semibold uppercase">New field report</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reports feed directly into the risk engine as a corroborating factor.
          </p>
        </div>

        {!online ? (
          <div className="flex items-center gap-2 rounded border border-risk-moderate/40 bg-risk-moderate/10 p-3 text-xs text-risk-moderate">
            <WifiOff className="size-4" /> Offline mode — this report will be stored on the device
            and synced automatically. {pendingCount} already waiting.
          </div>
        ) : null}

        <form onSubmit={submit} className="panel space-y-4 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="type">Report type</Label>
              <Select value={type} onValueChange={(v) => setType(v as ReportType)}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="severity">Severity</Label>
              <Select value={severity} onValueChange={(v) => setSeverity(v as typeof severity)}>
                <SelectTrigger id="severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">LOW</SelectItem>
                  <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                  <SelectItem value="HIGH">HIGH</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="district">District</Label>
            <Select value={districtId} onValueChange={setDistrictId}>
              <SelectTrigger id="district">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DISTRICTS.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name} — {d.state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">What did you observe?</Label>
            <Textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. New cracks about 3 m long above the road, mud flowing from the cut slope since last night."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="lat">Latitude</Label>
              <Input
                id="lat"
                inputMode="decimal"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder={district.lat.toFixed(5)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lng">Longitude</Label>
              <Input
                id="lng"
                inputMode="decimal"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder={district.lng.toFixed(5)}
              />
            </div>
            <div className="flex gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={useDistrictCentroid}
                className="text-xs h-9"
                title="Use district centroid coordinates"
              >
                Centroid
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={captureLocation}
                disabled={locating}
                className="text-xs h-9 gap-1.5"
              >
                {locating ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <MapPin className="size-3.5 text-primary" />
                )}
                {locating ? "Locating…" : "GPS"}
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="photo" className="flex items-center gap-2">
              <Camera className="size-4" /> Photo (optional, max 8 MB)
            </Label>
            <Input
              id="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={(e) => onPhoto(e.target.files?.[0])}
            />
            {analysing ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" /> Running hazard image analysis…
              </p>
            ) : null}
            {analysis ? (
              <div className="rounded border border-primary/30 bg-primary/10 p-3 text-xs">
                <p className="font-semibold text-primary">{analysis.detected}</p>
                <p className="metric mt-0.5">Confidence: {analysis.confidence} %</p>
                <p>Suggested severity: {analysis.suggestedSeverity}</p>
                <p className="mt-1 text-[0.68rem] text-muted-foreground">{analysis.note}</p>
              </div>
            ) : null}
          </div>

          {error ? (
            <p className="rounded border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Submit report
          </Button>
          <p className="text-[0.7rem] text-muted-foreground">
            Timestamp and coordinates are attached automatically. Do not enter personal information
            about other people.
          </p>
        </form>

        <DemoDataNotice />
      </div>
    </AppShell>
  );
}
