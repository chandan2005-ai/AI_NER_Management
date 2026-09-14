import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { resolvePublicArea } from "@/lib/security/citizen.functions";

const KEY = "ner-safe-area";

export interface ApproxArea {
  district: string;
  state: string;
  lat?: number | undefined;
  lng?: number | undefined;
  /** "device" = resolved from browser geolocation, "manual" = chosen by the user. */
  source: "device" | "manual";
}

export type GeolocationStatus =
  "idle" | "asking" | "granted" | "denied" | "unavailable" | "timeout" | "insecure_context";

/**
 * Approximate-area location with full browser permission handling.
 * Works across desktop, mobile, secure context (HTTPS / localhost),
 * and handles permission denials gracefully with manual fallback.
 */
export function useApproxLocation() {
  const [area, setArea] = useState<ApproxArea | null>(null);
  const [status, setStatus] = useState<GeolocationStatus>("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number; timestamp?: number } | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setArea(JSON.parse(raw) as ApproxArea);
    } catch {
      /* ignore malformed storage */
    }
  }, []);

  const persist = useCallback((next: ApproxArea | null) => {
    setArea(next);
    if (next) window.localStorage.setItem(KEY, JSON.stringify(next));
    else window.localStorage.removeItem(KEY);
  }, []);

  const requestDeviceLocation = useCallback(() => {
    setErrorMessage(null);

    // Check secure context requirement (Chrome/Safari/Firefox block geolocation on HTTP LAN IP)
    if (
      typeof window !== "undefined" &&
      window.isSecureContext === false &&
      window.location.hostname !== "localhost" &&
      window.location.hostname !== "127.0.0.1"
    ) {
      setStatus("insecure_context");
      const msg =
        "Browser security requires HTTPS or localhost for automatic GPS. Please select your district from the dropdown or use manual coordinates.";
      setErrorMessage(msg);
      toast.warning(msg);
      return;
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable");
      const msg = "Geolocation is not supported by your browser or device.";
      setErrorMessage(msg);
      toast.error(msg);
      return;
    }

    setStatus("asking");
    toast.info("Requesting GPS location access…");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        setCoords({
          lat: latitude,
          lng: longitude,
          timestamp: position.timestamp,
        });
        setStatus("granted");
        toast.success(`GPS Acquired: ${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E`);

        try {
          const resolved = await resolvePublicArea({
            data: { lat: latitude, lng: longitude },
          });
          persist({ ...resolved, lat: latitude, lng: longitude, source: "device" });
        } catch {
          // Centroid fallback
          persist({
            district: "East Khasi Hills",
            state: "Meghalaya",
            lat: latitude,
            lng: longitude,
            source: "device",
          });
        }
      },
      (error) => {
        let msg = "Could not retrieve GPS coordinates.";
        if (error.code === error.PERMISSION_DENIED) {
          setStatus("denied");
          msg =
            "Location permission was denied. Enable location permissions for this site in your browser settings and try again.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setStatus("unavailable");
          msg =
            "Location information is currently unavailable. Please check that your device GPS is enabled.";
        } else if (error.code === error.TIMEOUT) {
          setStatus("timeout");
          msg = "Location request timed out. Please click retry.";
        }
        setErrorMessage(msg);
        toast.error(msg);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }, [persist]);

  const setManualArea = useCallback(
    (district: string, state: string, lat?: number, lng?: number) => {
      persist({ district, state, lat, lng, source: "manual" });
      if (lat && lng) setCoords({ lat, lng });
      setStatus("idle");
      setErrorMessage(null);
    },
    [persist],
  );

  const clearArea = useCallback(() => {
    persist(null);
    setCoords(null);
    setStatus("idle");
    setErrorMessage(null);
  }, [persist]);

  return {
    area,
    status,
    coords,
    errorMessage,
    requestDeviceLocation,
    setManualArea,
    clearArea,
  };
}
