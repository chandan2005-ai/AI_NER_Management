import { Link, useRouter } from "@tanstack/react-router";
import { Loader2, Lock, ShieldAlert, ShieldCheck } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

function Screen({
  icon,
  title,
  body,
  children,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-surface p-6 text-center">
        <div className="mx-auto mb-4 grid size-11 place-items-center rounded bg-primary/10 text-primary">
          {icon}
        </div>
        <h1 className="font-display text-lg font-bold tracking-wide">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">{children}</div>
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="grid min-h-screen place-items-center bg-background">
      <Loader2 className="size-6 animate-spin text-primary" />
    </div>
  );
}

/**
 * Frontend gate for the restricted authority interface. This is a usability
 * layer only — every authority server function independently re-checks the
 * caller's role in the database and returns 403 when it is missing.
 */
export function AuthorityGuard({ children }: { children: ReactNode }) {
  const { loading, session, access, isAuthority } = useAuth();

  if (loading) return <Loading />;

  if (!session) {
    return (
      <Screen
        icon={<Lock className="size-5" />}
        title="Restricted authority interface"
        body="This area is limited to verified disaster-management authorities. Sign in with your official account to continue."
      >
        <Button asChild size="sm">
          <Link to="/auth">Authority sign in</Link>
        </Button>
        <Button asChild size="sm" variant="secondary">
          <Link to="/citizen">Go to community app</Link>
        </Button>
      </Screen>
    );
  }

  if (!isAuthority) {
    const pending = access?.requestStatus === "pending";
    return (
      <Screen
        icon={<ShieldAlert className="size-5" />}
        title="403 — authority access required"
        body={
          pending
            ? "Your authority access request is awaiting administrator verification. Community features remain available meanwhile."
            : "Your account does not hold authority permissions. Operational data, sensor telemetry and response tools are restricted."
        }
      >
        <Button asChild size="sm">
          <Link to="/authority/verify">
            {pending ? "View request status" : "Request authority access"}
          </Link>
        </Button>
        <Button asChild size="sm" variant="secondary">
          <Link to="/citizen">Community app</Link>
        </Button>
      </Screen>
    );
  }

  return <>{children}</>;
}

/** Adds the second factor requirement on top of the authority role. */
export function MfaGuard({ children }: { children: ReactNode }) {
  const { mfa } = useAuth();
  if (!mfa) {
    return (
      <Screen
        icon={<ShieldCheck className="size-5" />}
        title="Second factor required"
        body="Alert dispatch and security records need a fresh multi-factor verification."
      >
        <Button asChild size="sm">
          <Link to="/authority/mfa">Verify now</Link>
        </Button>
      </Screen>
    );
  }
  return <>{children}</>;
}

export function AdminGuard({ children }: { children: ReactNode }) {
  const { loading, isAdmin } = useAuth();
  if (loading) return <Loading />;
  if (!isAdmin)
    return (
      <Screen
        icon={<ShieldAlert className="size-5" />}
        title="403 — administrator only"
        body="Only NER-SAFE administrators can verify authority accounts."
      >
        <Button asChild size="sm" variant="secondary">
          <Link to="/">Back to home</Link>
        </Button>
      </Screen>
    );
  return <>{children}</>;
}

/** Citizens must be signed in for personal features (reports, notifications). */
export function CitizenGuard({ children }: { children: ReactNode }) {
  const { loading, session } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !session) router.navigate({ to: "/auth", search: { role: "citizen" } });
  }, [loading, session, router]);
  if (loading) return <Loading />;
  if (!session)
    return (
      <Screen
        icon={<Lock className="size-5" />}
        title="Sign in to continue"
        body="Create a free community account to report hazards and receive alerts for your area."
      >
        <Button asChild size="sm">
          <Link to="/auth" search={{ role: "citizen" }}>
            Continue
          </Link>
        </Button>
      </Screen>
    );
  return <>{children}</>;
}
