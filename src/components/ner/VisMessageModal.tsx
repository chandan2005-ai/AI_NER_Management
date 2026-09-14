import { useState, useEffect } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  Mail,
  MessageSquare,
  PhoneCall,
  Radio,
  Volume2,
  X,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface VisMessageData {
  id: string;
  type: "sms_otp" | "emergency_broadcast" | "sms_alert" | "email_alert";
  sender: string;
  recipient?: string;
  title: string;
  message: string;
  otpCode?: string;
  timestamp: string;
  priority: "critical" | "high" | "info";
  district?: string;
}

// Global event bus for triggering VIS broadcast or SMS OTP from anywhere in the app
export const triggerVisMessage = (data: Omit<VisMessageData, "id" | "timestamp">) => {
  const event = new CustomEvent("ner-vis-message", {
    detail: {
      ...data,
      id: "vis-" + Date.now(),
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    },
  });
  window.dispatchEvent(event);
};

export function VisMessageModal() {
  const [activeMessage, setActiveMessage] = useState<VisMessageData | null>(null);
  const [copied, setCopied] = useState(false);
  const [soundPlayed, setSoundPlayed] = useState(false);

  useEffect(() => {
    const handleEvent = (e: Event) => {
      const customEvent = e as CustomEvent<VisMessageData>;
      if (customEvent.detail) {
        setActiveMessage(customEvent.detail);
        setCopied(false);
        setSoundPlayed(false);

        // Play standard browser emergency chime using Web Audio API
        try {
          const ctx = new (
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
          )();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          if (customEvent.detail.priority === "critical") {
            // Emergency broadcast pulse sound
            osc.type = "sine";
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.setValueAtTime(440, ctx.currentTime + 0.15);
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.5);
          } else {
            // Friendly SMS chime
            osc.type = "sine";
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
          }
          setSoundPlayed(true);
        } catch {
          // Ignore audio policy restrictions
        }
      }
    };

    window.addEventListener("ner-vis-message", handleEvent);
    return () => window.removeEventListener("ner-vis-message", handleEvent);
  }, []);

  if (!activeMessage) return null;

  const handleCopyOtp = () => {
    if (activeMessage.otpCode) {
      navigator.clipboard.writeText(activeMessage.otpCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      // Also dispatch auto-fill event
      window.dispatchEvent(
        new CustomEvent("ner-autofill-otp", { detail: { code: activeMessage.otpCode } }),
      );
    }
  };

  const isEmergency =
    activeMessage.priority === "critical" || activeMessage.type === "emergency_broadcast";

  return (
    <div className="fixed inset-x-0 top-3 z-[9999] flex justify-center px-4 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
      <div
        className={cn(
          "pointer-events-auto w-full max-w-lg rounded-2xl border-2 p-4 shadow-2xl backdrop-blur-md transition-all",
          isEmergency
            ? "border-red-500 bg-red-950/95 text-white shadow-red-500/20"
            : "border-primary/40 bg-card/95 text-card-foreground shadow-primary/15",
        )}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
          <div className="flex items-center gap-2">
            {isEmergency ? (
              <span className="relative flex size-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex size-3 rounded-full bg-red-500" />
              </span>
            ) : activeMessage.type === "email_alert" ? (
              <span className="grid size-6 place-items-center rounded-full bg-blue-500/20 text-blue-600">
                <Mail className="size-3.5" />
              </span>
            ) : (
              <span className="grid size-6 place-items-center rounded-full bg-primary/20 text-primary">
                <MessageSquare className="size-3.5" />
              </span>
            )}

            <div>
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "text-xs font-bold font-mono tracking-wider",
                    isEmergency
                      ? "text-red-300"
                      : activeMessage.type === "email_alert"
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-primary",
                  )}
                >
                  {activeMessage.sender}
                </span>
                {isEmergency && (
                  <span className="rounded bg-red-600 px-1.5 py-0.2 text-[0.65rem] font-black uppercase text-white tracking-widest">
                    VIS BROADCAST
                  </span>
                )}
                {activeMessage.type === "email_alert" && (
                  <span className="rounded bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 px-1.5 py-0.2 text-[0.65rem] font-bold uppercase tracking-wider">
                    EMAIL ADVISORY
                  </span>
                )}
                {activeMessage.type === "sms_alert" && (
                  <span className="rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 px-1.5 py-0.2 text-[0.65rem] font-bold uppercase tracking-wider">
                    SMS ALERT
                  </span>
                )}
              </div>
              <p className="text-[0.68rem] opacity-70">
                {activeMessage.recipient ? `To: ${activeMessage.recipient} • ` : ""}
                {activeMessage.timestamp}
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveMessage(null)}
            className="rounded-lg p-1 text-muted-foreground hover:bg-black/10 hover:text-foreground transition-colors"
            aria-label="Dismiss message"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body content */}
        <div className="mt-3 space-y-2">
          <h4
            className={cn(
              "text-sm font-bold flex items-center gap-1.5",
              isEmergency ? "text-white" : "text-foreground",
            )}
          >
            {isEmergency ? <ShieldAlert className="size-4 text-red-400 shrink-0" /> : null}
            {activeMessage.title}
          </h4>
          <p
            className={cn(
              "text-xs leading-relaxed",
              isEmergency ? "text-red-100" : "text-muted-foreground",
            )}
          >
            {activeMessage.message}
          </p>

          {/* OTP Box if present */}
          {activeMessage.otpCode && (
            <div className="mt-2.5 flex items-center justify-between rounded-xl border border-primary/30 bg-primary/10 p-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-foreground">One-Time Password:</span>
                <span className="font-mono text-base font-bold tracking-widest text-primary">
                  {activeMessage.otpCode}
                </span>
              </div>
              <Button
                size="sm"
                variant="default"
                className="h-7 text-xs font-semibold gap-1.5 shadow-sm"
                onClick={handleCopyOtp}
              >
                {copied ? (
                  <Check className="size-3 text-emerald-300" />
                ) : (
                  <Copy className="size-3" />
                )}
                {copied ? "Copied & Filled!" : "Copy & Fill"}
              </Button>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="mt-3 flex items-center justify-between pt-2 border-t border-border/30 text-[0.7rem]">
          <div className="flex items-center gap-1 opacity-75">
            <Radio className="size-3 text-primary animate-pulse" />
            <span>Cell Broadcast Service (NDMA/SDMA-NER)</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-[0.7rem] px-2"
            onClick={() => setActiveMessage(null)}
          >
            Acknowledge & Close
          </Button>
        </div>
      </div>
    </div>
  );
}
