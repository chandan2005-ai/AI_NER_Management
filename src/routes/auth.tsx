import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  KeyRound,
  LifeBuoy,
  Loader2,
  Lock,
  Mail,
  Phone,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserPlus,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth, type DemoRole, NEW_DEMO_ACCOUNTS } from "@/hooks/useAuth";
import { AUTHORITY_ORG_TYPES } from "@/lib/security/classification";
import { DISTRICTS, ALL_INDIAN_STATES } from "@/lib/ner/districts";

const searchSchema = z.object({
  role: z.enum(["citizen", "authority", "admin"]).optional(),
  mode: z.enum(["signin", "signup"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Authentication — NER-SAFE Community & Authority Portals" },
      {
        name: "description",
        content:
          "Secure authentication for the NER-SAFE Disaster Management & Early Warning Platform. Sign in or register as a community citizen or official disaster authority.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { role, mode: queryMode } = Route.useSearch();
  const router = useRouter();
  const {
    session,
    access,
    loading,
    loginAsDemo,
    registerCitizen,
    registerAuthority,
    loginWithCredentials,
  } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">(queryMode || "signin");

  // Common fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState("Meghalaya");
  const [district, setDistrict] = useState("East Khasi Hills");

  // Citizen-specific fields
  const [emergencyContact, setEmergencyContact] = useState("");
  const [pincode, setPincode] = useState("");
  const [bloodGroup, setBloodGroup] = useState("O+");

  // Authority-specific fields
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState("SDMA");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [officerId, setOfficerId] = useState("");

  const [busy, setBusy] = useState(false);
  const [pendingAuthorityScreen, setPendingAuthorityScreen] = useState(false);
  const [authErrorMsg, setAuthErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (queryMode) {
      setMode(queryMode);
    }
  }, [queryMode]);

  // If already signed in, navigate to appropriate portal
  useEffect(() => {
    if (loading || !session || !access) return;
    if (access.isAuthority || access.isAdmin) {
      void router.navigate({ to: "/command-center", replace: true });
    } else {
      void router.navigate({ to: "/citizen", replace: true });
    }
  }, [loading, session, access, router]);

  if (!role) {
    return <RoleChooser onSelectAdminDemo={() => loginAsDemo("admin")} />;
  }

  const isAuthority = role === "authority";
  const isAdmin = role === "admin";

  const handleAdminDemoLogin = async () => {
    setBusy(true);
    try {
      await loginAsDemo("admin");
      toast.success("Signed in as Administrator (Shri Rajeshwar Sharma)!");
    } catch {
      toast.error("Administrator sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setAuthErrorMsg(null);

    try {
      if (mode === "signup") {
        if (password.length < 6) {
          toast.error("Password must be at least 6 characters");
          setBusy(false);
          return;
        }

        if (password !== confirmPassword) {
          toast.error("Passwords do not match. Please verify your confirm password.");
          setBusy(false);
          return;
        }

        if (isAuthority) {
          // Register Authority
          if (!orgName || !designation || !officerId || !department) {
            toast.error("Please fill in all required official organization fields");
            setBusy(false);
            return;
          }

          const result = await registerAuthority({
            fullName,
            email,
            password,
            phone,
            district,
            state,
            organizationName: orgName,
            organizationType: orgType,
            department,
            designation,
            officerId,
          });

          if (result.success) {
            setPendingAuthorityScreen(true);
            toast.success("Authority registration submitted for Administrator review!");
          }
        } else {
          // Register Citizen (Instant Access)
          await registerCitizen({
            fullName,
            email,
            password,
            phone,
            district,
            state,
            emergencyContact,
            pincode,
            bloodGroup,
          });
          toast.success("Welcome to NER-SAFE! Your citizen safety account is active.");
        }
      } else {
        // Sign In
        await loginWithCredentials({
          email,
          password,
          role: isAuthority ? "authority" : isAdmin ? "admin" : "citizen",
        });
        toast.success(
          `Signed in successfully as ${isAuthority ? "Authority Officer" : "Citizen"}!`,
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setAuthErrorMsg(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  // Pending Authority Verification Screen
  if (pendingAuthorityScreen) {
    return (
      <Wrapper authority={isAuthority}>
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 text-center shadow-lg max-w-lg mx-auto">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <Clock className="size-7 animate-pulse" />
          </div>
          <span className="mt-4 inline-block rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 px-3 py-0.5 text-xs font-bold uppercase tracking-wider">
            Verification Pending
          </span>
          <h1 className="mt-2 font-display text-xl font-bold tracking-tight text-foreground">
            Official Registration Submitted
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Your authority registration credentials for{" "}
            <strong className="text-foreground">
              {orgName || "Disaster Management Authority"}
            </strong>{" "}
            have been recorded.
          </p>

          <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-left space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <ShieldAlert className="size-4 text-amber-600 shrink-0" />
              <span>Restricted Government Access Policy</span>
            </div>
            <p>
              To maintain operational data security, all Authority accounts require manual
              verification and approval by the{" "}
              <strong>NER Incident Commander / System Administrator</strong> before login access is
              granted.
            </p>
            <div className="pt-2 border-t border-border/50 text-[0.7rem] font-mono">
              <p>
                Officer ID: <span className="text-foreground font-semibold">{officerId}</span>
              </p>
              <p>
                Official Email: <span className="text-foreground font-semibold">{email}</span>
              </p>
              <p>
                Status: <span className="text-amber-600 font-bold">PENDING ADMIN APPROVAL</span>
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <Button
              className="w-full text-xs font-semibold"
              variant="outline"
              onClick={() => {
                setPendingAuthorityScreen(false);
                setMode("signin");
              }}
            >
              Back to Authority Sign In
            </Button>
            <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground">
              <Link to="/">Back to Homepage</Link>
            </Button>
          </div>
        </div>
      </Wrapper>
    );
  }

  return (
    <Wrapper authority={isAuthority}>
      {/* Admin Quick Demo Evaluator Banner (ONLY Admin demo account is kept) */}
      <div className="mb-4 rounded-xl border border-purple-300/40 bg-purple-50/50 dark:bg-purple-950/20 p-3.5 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-purple-600 text-white shadow-xs">
              <Sparkles className="size-4" />
            </span>
            <div>
              <p className="text-xs font-bold text-foreground">Admin Demo Account</p>
              <p className="text-[0.68rem] text-muted-foreground">
                Evaluator quick login for Admin Incident Commander privileges
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="h-8 bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold gap-1.5 shadow-xs"
            onClick={handleAdminDemoLogin}
            disabled={busy}
          >
            {busy ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <KeyRound className="size-3.5" />
            )}
            Log in as Admin
          </Button>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-7 shadow-md">
        {/* Header with Role Title & Sign In/Up Segment */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div className="flex items-center gap-3">
            <span
              className={
                isAuthority
                  ? "grid size-11 place-items-center rounded-xl bg-risk-critical/10 text-risk-critical border border-risk-critical/20"
                  : "grid size-11 place-items-center rounded-xl bg-risk-low/10 text-risk-low border border-risk-low/20"
              }
            >
              {isAuthority ? <Lock className="size-5" /> : <LifeBuoy className="size-5" />}
            </span>
            <div>
              <h1 className="font-display text-lg font-bold tracking-tight text-foreground">
                {isAuthority ? "Authority Access Console" : "Citizen Safety Portal"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {isAuthority
                  ? "Disaster management officials & emergency responders"
                  : "Community alerts, hazard reporting & family safety"}
              </p>
            </div>
          </div>

          {/* Mode Switcher Pills */}
          <div className="inline-flex rounded-lg bg-muted p-1 text-xs">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setAuthErrorMsg(null);
              }}
              className={`rounded-md px-3 py-1 font-semibold transition-all ${
                mode === "signin"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setAuthErrorMsg(null);
              }}
              className={`rounded-md px-3 py-1 font-semibold transition-all ${
                mode === "signup"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Security / Advisory Notices */}
        {isAuthority ? (
          <div className="mt-4 flex gap-2.5 rounded-xl border border-risk-critical/30 bg-risk-critical/5 p-3 text-[0.72rem] leading-relaxed text-risk-critical">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
            <span>
              <strong>Restricted Authority Operations.</strong> New authority accounts require
              official Admin review before login is approved.
            </span>
          </div>
        ) : (
          <div className="mt-4 flex gap-2.5 rounded-xl border border-border bg-muted/40 p-3 text-[0.72rem] leading-relaxed text-muted-foreground">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-risk-low" />
            <span>
              <strong>Instant Citizen Protection.</strong> Community registration is free and
              activates immediately. Your data remains private and protected.
            </span>
          </div>
        )}

        {/* Error Alert Display */}
        {authErrorMsg && (
          <div className="mt-4 flex gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400 leading-relaxed">
            <XCircle className="mt-0.5 size-4 shrink-0" />
            <div>
              <p className="font-semibold">Authentication Notice</p>
              <p className="text-[0.72rem] mt-0.5">{authErrorMsg}</p>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="mt-5 space-y-3.5">
          {/* Sign Up Fields */}
          {mode === "signup" && (
            <>
              <div>
                <Label htmlFor="fullname" className="text-xs font-semibold">
                  {isAuthority ? "Officer Full Name *" : "Full Name *"}
                </Label>
                <Input
                  id="fullname"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={isAuthority ? "e.g. Dr. Debojit Barman" : "e.g. Tashi Dorjee"}
                  required
                  className="mt-1 h-9 text-xs"
                />
              </div>

              {/* Citizen Specific Registration Fields */}
              {!isAuthority && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="phone" className="text-xs font-semibold">
                        Mobile Number (for SMS Alerts) *
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        required
                        className="mt-1 h-9 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <Label htmlFor="emergency-contact" className="text-xs font-semibold">
                        Emergency Contact Phone
                      </Label>
                      <Input
                        id="emergency-contact"
                        type="tel"
                        value={emergencyContact}
                        onChange={(e) => setEmergencyContact(e.target.value)}
                        placeholder="+91 98765 00000"
                        className="mt-1 h-9 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="state" className="text-xs font-semibold">
                        State *
                      </Label>
                      <Select value={state} onValueChange={setState}>
                        <SelectTrigger id="state" className="mt-1 h-9 text-xs">
                          <SelectValue placeholder="State" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {ALL_INDIAN_STATES.map((s) => (
                            <SelectItem key={s} value={s} className="text-xs">
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="district" className="text-xs font-semibold">
                        District *
                      </Label>
                      <Select value={district} onValueChange={setDistrict}>
                        <SelectTrigger id="district" className="mt-1 h-9 text-xs">
                          <SelectValue placeholder="District" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {DISTRICTS.map((d) => (
                            <SelectItem key={d.id} value={d.name} className="text-xs">
                              {d.name} ({d.state})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="blood" className="text-xs font-semibold">
                        Blood Group (SOS)
                      </Label>
                      <Select value={bloodGroup} onValueChange={setBloodGroup}>
                        <SelectTrigger id="blood" className="mt-1 h-9 text-xs">
                          <SelectValue placeholder="Blood Group" />
                        </SelectTrigger>
                        <SelectContent>
                          {["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"].map((b) => (
                            <SelectItem key={b} value={b} className="text-xs">
                              {b}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              {/* Authority Specific Registration Fields */}
              {isAuthority && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="org-type" className="text-xs font-semibold">
                        Agency Type *
                      </Label>
                      <Select value={orgType} onValueChange={setOrgType}>
                        <SelectTrigger id="org-type" className="mt-1 h-9 text-xs">
                          <SelectValue placeholder="Select Agency Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {AUTHORITY_ORG_TYPES.map((o) => (
                            <SelectItem key={o.value} value={o.value} className="text-xs">
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="org-name" className="text-xs font-semibold">
                        Organization / Authority Name *
                      </Label>
                      <Input
                        id="org-name"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        placeholder="e.g. Meghalaya SDMA / NDRF 1st Bn"
                        required
                        className="mt-1 h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="dept" className="text-xs font-semibold">
                        Department / Wing *
                      </Label>
                      <Input
                        id="dept"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="e.g. Emergency Operations Centre"
                        required
                        className="mt-1 h-9 text-xs"
                      />
                    </div>

                    <div>
                      <Label htmlFor="designation" className="text-xs font-semibold">
                        Official Designation *
                      </Label>
                      <Input
                        id="designation"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        placeholder="e.g. Executive Incident Officer"
                        required
                        className="mt-1 h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="officer-id" className="text-xs font-semibold">
                        Official Officer ID / Badge *
                      </Label>
                      <Input
                        id="officer-id"
                        value={officerId}
                        onChange={(e) => setOfficerId(e.target.value)}
                        placeholder="e.g. SDMA-EOC-088"
                        required
                        className="mt-1 h-9 text-xs font-mono"
                      />
                    </div>

                    <div>
                      <Label htmlFor="auth-phone" className="text-xs font-semibold">
                        Official Contact Phone *
                      </Label>
                      <Input
                        id="auth-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 94360 12345"
                        required
                        className="mt-1 h-9 text-xs font-mono"
                      />
                    </div>

                    <div>
                      <Label htmlFor="auth-state" className="text-xs font-semibold">
                        State Jurisdiction *
                      </Label>
                      <Select value={state} onValueChange={setState}>
                        <SelectTrigger id="auth-state" className="mt-1 h-9 text-xs">
                          <SelectValue placeholder="Jurisdiction State" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {ALL_INDIAN_STATES.map((s) => (
                            <SelectItem key={s} value={s} className="text-xs">
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* Email & Password (Common to both Sign In & Sign Up) */}
          <div>
            <Label htmlFor="email" className="text-xs font-semibold">
              {isAuthority ? "Official Email Address *" : "Email Address *"}
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isAuthority ? "officer@sdma.gov.in" : "citizen@example.com"}
              required
              autoComplete="email"
              className="mt-1 h-9 text-xs font-mono"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-semibold">
                Password *
              </Label>
              {mode === "signin" && (
                <span className="text-[0.68rem] text-muted-foreground">
                  Default format supported
                </span>
              )}
            </div>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              className="mt-1 h-9 text-xs"
            />
          </div>

          {mode === "signup" && (
            <div>
              <Label htmlFor="confirm-password" className="text-xs font-semibold">
                Confirm Password *
              </Label>
              <PasswordInput
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete="new-password"
                className="mt-1 h-9 text-xs"
              />
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-9 mt-2 text-xs font-semibold gap-1.5 shadow-sm"
            disabled={busy}
          >
            {busy ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : mode === "signup" ? (
              <UserPlus className="size-3.5" />
            ) : (
              <ArrowRight className="size-3.5" />
            )}
            {mode === "signup"
              ? isAuthority
                ? "Submit Authority Registration for Approval"
                : "Create Free Citizen Account & Enter"
              : isAuthority
                ? "Sign In to Authority Console"
                : "Sign In to Citizen Portal"}
          </Button>
        </form>

        {/* Footer toggles between Sign In and Sign Up */}
        <div className="mt-5 border-t border-border pt-4 text-center">
          {mode === "signin" ? (
            <p className="text-xs text-muted-foreground">
              Don&apos;t have an account yet?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setAuthErrorMsg(null);
                }}
                className="font-bold text-primary hover:underline"
              >
                Create an account
              </button>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setAuthErrorMsg(null);
                }}
                className="font-bold text-primary hover:underline"
              >
                Sign in here
              </button>
            </p>
          )}
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        <Link to="/" className="text-primary hover:underline">
          ← Back to NER-SAFE Homepage
        </Link>
      </p>
    </Wrapper>
  );
}

function RoleChooser({ onSelectAdminDemo }: { onSelectAdminDemo: () => void }) {
  return (
    <div className="min-h-screen bg-background px-4 py-12 flex items-center justify-center">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <span className="label-eyebrow">Select Secure Portal</span>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-wide uppercase text-foreground">
            NER-SAFE Access Gateways
          </h1>
          <p className="mt-2 text-xs text-muted-foreground max-w-md mx-auto">
            Choose your designated interface to sign in or create an account with role-appropriate
            permissions.
          </p>
        </div>

        {/* Admin Quick Evaluator Strip */}
        <div className="mb-6 rounded-xl border border-purple-300/40 bg-purple-50/60 dark:bg-purple-950/20 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-purple-600 text-white">
              <Sparkles className="size-4" />
            </span>
            <div>
              <p className="text-xs font-bold text-foreground">System Administrator Access</p>
              <p className="text-[0.68rem] text-muted-foreground">
                Incident Commander approval rights & administrative control panel
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={onSelectAdminDemo}
            className="h-8 bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold gap-1.5 shadow-xs"
          >
            <KeyRound className="size-3.5" />
            Log in as Admin (Shri Rajeshwar Sharma)
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Authority Access Card */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-risk-critical/30 bg-card p-6 shadow-md transition-shadow hover:shadow-risk-critical/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="grid size-12 place-items-center rounded-xl bg-risk-critical/10 text-risk-critical border border-risk-critical/20">
                  <Lock className="size-6" />
                </span>
                <span className="rounded-full bg-risk-critical/10 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-risk-critical">
                  Restricted Authority
                </span>
              </div>
              <h2 className="mt-4 font-display text-xl font-bold tracking-wide text-foreground">
                Official Authority Console
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                For verified SDMA, DDMA, NDRF, SDRF, IMD, and emergency response officers across
                NER.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="size-3.5 text-risk-critical shrink-0" />
                  Live GIS Slope Instability & 3D Digital Twin
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="size-3.5 text-risk-critical shrink-0" />
                  MFA-Secured Multi-Channel Alert Dispatcher (SMS/Email)
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="size-3.5 text-risk-critical shrink-0" />
                  IoT Telemetry, Sensor Feeds & Road Corridors
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="size-3.5 text-risk-critical shrink-0" />
                  Official Account requires Administrator Approval
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-border space-y-2">
              <Button asChild className="w-full text-xs font-semibold gap-2 shadow-sm" size="sm">
                <Link to="/auth" search={{ role: "authority", mode: "signin" }}>
                  Sign In to Authority Console
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
              <div className="text-center">
                <Link
                  to="/auth"
                  search={{ role: "authority", mode: "signup" }}
                  className="text-[0.7rem] text-primary hover:underline font-semibold"
                >
                  Register New Authority Account →
                </Link>
              </div>
            </div>
          </div>

          {/* Citizen Access Card */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-risk-low/40 bg-card p-6 shadow-md transition-shadow hover:shadow-risk-low/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="grid size-12 place-items-center rounded-xl bg-risk-low/10 text-risk-low border border-risk-low/20">
                  <Users className="size-6" />
                </span>
                <span className="rounded-full bg-risk-low/10 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-risk-low">
                  Public Safety Access
                </span>
              </div>
              <h2 className="mt-4 font-display text-xl font-bold tracking-wide text-foreground">
                Citizen Safety Portal
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                For local communities, residents, students, and tourists across North East India.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-risk-low shrink-0" />
                  Real-time landslide risk level for your district
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-risk-low shrink-0" />
                  SMS & Email notifications for localized weather alerts
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-risk-low shrink-0" />
                  Report slope hazards, mudflow, and road blockage
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-risk-low shrink-0" />
                  Instant access · No admin approval delay required
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-border space-y-2">
              <Button
                asChild
                className="w-full text-xs font-semibold gap-2 shadow-sm"
                size="sm"
                variant="secondary"
              >
                <Link to="/auth" search={{ role: "citizen", mode: "signin" }}>
                  Sign In to Citizen Safety Portal
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
              <div className="text-center">
                <Link
                  to="/auth"
                  search={{ role: "citizen", mode: "signup" }}
                  className="text-[0.7rem] text-risk-low hover:underline font-semibold"
                >
                  Create Free Citizen Account →
                </Link>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          <Link to="/" className="text-primary hover:underline">
            ← Back to NER-SAFE Homepage
          </Link>
        </p>
      </div>
    </div>
  );
}

function Wrapper({ children, authority }: { children: React.ReactNode; authority: boolean }) {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-10 px-4 sm:px-6">
      <div className="mx-auto w-full max-w-lg">
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-white font-bold text-sm shadow-xs">
              ⚡
            </span>
            <span className="font-display text-xl font-bold tracking-[0.12em] text-foreground">
              NER-SAFE
            </span>
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">
            North Eastern Region Disaster Management & Early Warning Platform
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
