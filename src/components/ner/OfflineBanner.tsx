import { WifiOff, Wifi, RefreshCw } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { cn } from "@/lib/utils";

interface OfflineBannerProps {
  pendingCount?: number;
  syncing?: boolean;
  className?: string;
}

export function OfflineBanner({
  pendingCount = 0,
  syncing = false,
  className,
}: OfflineBannerProps) {
  const online = useOnlineStatus();

  if (online && !syncing) return null;

  if (online && syncing) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 border-b border-risk-moderate/30 bg-risk-moderate/10 px-4 py-1.5 text-xs font-medium text-risk-moderate",
          className,
        )}
        role="status"
        aria-live="polite"
      >
        <RefreshCw className="size-3 animate-spin" />
        🟠 Syncing{" "}
        {pendingCount > 0 ? `${pendingCount} pending report${pendingCount > 1 ? "s" : ""}` : ""}…
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 border-b border-risk-critical/30 bg-risk-critical/10 px-4 py-1.5 text-xs font-medium text-risk-critical",
        className,
      )}
      role="alert"
      aria-live="assertive"
    >
      <WifiOff className="size-3" />
      🔴 Offline — showing cached data
      {pendingCount > 0
        ? ` · ${pendingCount} report${pendingCount > 1 ? "s" : ""} queued to sync`
        : ""}
    </div>
  );
}

export function OnlinePill({ className }: { className?: string }) {
  const online = useOnlineStatus();
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold",
        online ? "bg-risk-low/15 text-risk-low" : "bg-risk-critical/15 text-risk-critical",
        className,
      )}
    >
      {online ? (
        <>
          <Wifi className="size-2.5" />
          🟢 Online
        </>
      ) : (
        <>
          <WifiOff className="size-2.5" />
          🔴 Offline
        </>
      )}
    </span>
  );
}
