import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { CheckCircle2, Clock, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthorityGuard } from "@/components/security/Guards";
import { useAuth } from "@/hooks/useAuth";
import { getDemoMfaChallenge, verifyMfa } from "@/lib/security/access.functions";

export const Route = createFileRoute("/authority/mfa")({
  head: () => ({
    meta: [{ title: "MFA Verification — NER-SAFE Authority" }],
  }),
  component: () => (
    <AuthorityGuard>
      <MfaPage />
    </AuthorityGuard>
  ),
});

function MfaPage() {
  const { mfa, setMfa, access } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const challengeQuery = useQuery({
    queryKey: ["mfa-challenge"],
    queryFn: () => getDemoMfaChallenge(),
    refetchInterval: 10_000,
  });

  const verify = useMutation({
    mutationFn: () => verifyMfa({ data: { code } }),
    onSuccess: (token) => {
      setMfa(token);
      toast.success("Multi-factor authentication verified");
      router.navigate({ to: "/command-center", replace: true });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Verification failed");
      setCode("");
      inputRef.current?.focus();
    },
  });

  // Already verified — skip
  useEffect(() => {
    if (mfa) router.navigate({ to: "/command-center", replace: true });
  }, [mfa, router]);

  const secondsLeft = challengeQuery.data?.secondsLeft ?? 30;
  const demoCode = challengeQuery.data?.code ?? "------";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-xl border border-border bg-surface p-8">
          <div className="text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-xl bg-primary/15 text-primary">
              <ShieldCheck className="size-7" />
            </span>
            <h1 className="mt-4 font-display text-xl font-bold">Multi-Factor Authentication</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Second factor required for authority operations
            </p>
            <p className="mt-1 text-xs font-semibold text-primary">
              🔐 Multi-Factor Authentication Enabled
            </p>
          </div>

          {/* Demo notice */}
          <div className="mt-5 rounded-lg border border-primary/30 bg-primary/10 p-4">
            <p className="text-[0.7rem] font-semibold uppercase tracking-widest text-primary">
              Demo TOTP Code
            </p>
            <p className="mt-1.5 font-display text-4xl font-bold tracking-[0.3em] text-primary">
              {demoCode}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-surface-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${(secondsLeft / 30) * 100}%` }}
                />
              </div>
              <span className="text-[0.65rem] text-muted-foreground">{secondsLeft}s</span>
            </div>
            <p className="mt-2 text-[0.65rem] text-muted-foreground">
              In a production deployment, this code is delivered through an authenticator app, email
              OTP, or hardware security key — not shown here.
            </p>
          </div>

          <form
            className="mt-5 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              verify.mutate();
            }}
          >
            <div>
              <Label htmlFor="mfa-code" className="text-xs">
                Verification code
              </Label>
              <Input
                ref={inputRef}
                id="mfa-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 8))}
                placeholder="Enter 6-digit code"
                autoComplete="one-time-code"
                inputMode="numeric"
                className="text-center font-display text-lg tracking-widest"
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={verify.isPending || code.length < 6}>
              {verify.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Verify & Access Operations Center"
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/auth" className="text-xs text-muted-foreground underline">
              Sign out
            </Link>
          </div>

          {access?.authority && (
            <div className="mt-5 rounded border border-border bg-surface p-3 text-[0.7rem] text-muted-foreground">
              <p className="font-semibold">{access.authority.organization_name}</p>
              <p>
                {access.authority.designation} · {access.authority.region}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
