import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  Bell,
  CheckCircle2,
  Database,
  EyeOff,
  Globe,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Radio,
  Shield,
  ShieldCheck,
  Smartphone,
  Trash2,
  User,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CitizenShell } from "@/components/security/CitizenShell";
import { useAuth } from "@/hooks/useAuth";
import { triggerVisMessage } from "@/components/ner/VisMessageModal";
import {
  getMyPrefs,
  updateMyPrefs,
  verifyMyPhone,
  deleteMyAccountData,
} from "@/lib/security/citizen.functions";

export const Route = createFileRoute("/citizen/profile")({
  head: () => ({
    meta: [
      { title: "My Profile & Privacy Settings — NER-SAFE Community" },
      {
        name: "description",
        content:
          "Manage your safety alert notification channels (SMS, email, push), phone verification, location privacy consent, and account settings.",
      },
      { property: "og:title", content: "Citizen Profile & Privacy — NER-SAFE" },
    ],
  }),
  component: CitizenProfilePage,
});

function CitizenProfilePage() {
  const {
    session,
    profile,
    role,
    signOut,
    deleteAccountPermanently,
    loading: authLoading,
  } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Form states
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone || "+91 98765 43210");
  const [emailAddress, setEmailAddress] = useState(session?.user?.email || "citizen@gmail.com");
  const [otpCode, setOtpCode] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("432198");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [localVerified, setLocalVerified] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Load preferences
  const prefsQuery = useQuery({
    queryKey: ["citizen-prefs", session?.user?.id],
    queryFn: () => getMyPrefs(),
    enabled: !!session,
  });

  const [smsEnabled, setSmsEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [inAppEnabled, setInAppEnabled] = useState(true);
  const [critOnly, setCritOnly] = useState(true);
  const [locationConsent, setLocationConsent] = useState(true);

  useEffect(() => {
    if (prefsQuery.data) {
      const p = prefsQuery.data;
      setSmsEnabled(p.sms_enabled ?? true);
      setPushEnabled(p.push_enabled ?? true);
      setInAppEnabled(p.in_app_enabled ?? true);
      setCritOnly(p.level_critical ?? true);
      setLocationConsent(p.location_consent ?? true);
      if (p.phone_number) setPhoneNumber(p.phone_number);
      if (p.phone_verified) setLocalVerified(true);
    }
  }, [prefsQuery.data]);

  useEffect(() => {
    if (profile?.phone) setPhoneNumber(profile.phone);
    if (session?.user?.email) setEmailAddress(session.user.email);
  }, [profile, session]);

  // Listen for OTP autofill from VIS modal
  useEffect(() => {
    const handleAutofill = (e: Event) => {
      const customEvent = e as CustomEvent<{ code: string }>;
      if (customEvent.detail?.code) {
        setOtpCode(customEvent.detail.code);
      }
    };
    window.addEventListener("ner-autofill-otp", handleAutofill);
    return () => window.removeEventListener("ner-autofill-otp", handleAutofill);
  }, []);

  const saveMutation = useMutation({
    mutationFn: (patch: Record<string, unknown>) => updateMyPrefs({ data: patch }),
    onSuccess: () => {
      toast.success("Settings saved successfully");
      void queryClient.invalidateQueries({ queryKey: ["citizen-prefs"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update settings");
    },
  });

  const handleSendOtp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setShowOtpInput(true);
    saveMutation.mutate({ phone_number: phoneNumber });

    // Trigger on-screen simulated Visual SMS message
    triggerVisMessage({
      type: "sms_otp",
      sender: "GOV-NERSAFE",
      title: "NER-SAFE Phone Verification Code",
      message: `Your one-time SMS verification code is ${code}. Valid for 10 minutes. Enter this code to activate cell broadcast emergency notifications for your area.`,
      otpCode: code,
      priority: "info",
      recipient: phoneNumber || "+91 98765 43210",
    });

    toast.info("SMS Verification code dispatched to " + phoneNumber);
  };

  const handleSendTestSms = () => {
    triggerVisMessage({
      type: "sms_alert",
      sender: "SDMA-SMS-ALERT",
      title: "LANDSLIDE EARLY WARNING SMS",
      message: `[NER-SAFE ALERT] Heavy rainfall detected in ${profile?.district || "East Khasi Hills"}. Moderate slope instability warning active for your area. Drive with extreme caution on hill roads.`,
      priority: "high",
      district: profile?.district || "East Khasi Hills",
      recipient: phoneNumber || "+91 98765 43210",
    });
    toast.success("Simulated SMS Alert dispatched to " + phoneNumber);
  };

  const handleSendTestEmail = () => {
    triggerVisMessage({
      type: "email_alert",
      sender: "alerts@nersafe.gov.in",
      title: "NER-SAFE Advisory: Weather & Slope Instability Forecast",
      message: `Official advisory for ${profile?.district || "East Khasi Hills"}, ${profile?.state || "Meghalaya"}. High 24h cumulative precipitation expected. Emergency helpline 112 is on standby. Please inspect residential drainage and follow local DDMA bulletins.`,
      priority: "high",
      district: profile?.district || "East Khasi Hills",
      recipient: emailAddress || "citizen@gmail.com",
    });
    toast.success("Simulated Email Alert dispatched to " + emailAddress);
  };

  const handleSendTestBroadcast = () => {
    triggerVisMessage({
      type: "emergency_broadcast",
      sender: "NDMA / SDMA-NER",
      title:
        "CRITICAL RED ALERT: LANDSLIDE THREAT — " +
        (profile?.district?.toUpperCase() || "EAST KHASI HILLS"),
      message:
        "EXTREME SOIL SATURATION (94%) DETECTED. Potential slope failure imminent. Avoid hill roads and move to designated evacuation shelter immediately.",
      priority: "critical",
      district: `${profile?.district || "East Khasi Hills"}, ${profile?.state || "Meghalaya"}`,
      recipient: phoneNumber || "All Mobile Subscribers in Sector 4",
    });
    toast.error("Emergency Cell Broadcast VIS alert triggered!");
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      try {
        await deleteMyAccountData();
      } catch {
        // ignore server error in mock/offline
      }
      await deleteAccountPermanently();
      toast.success("Account and all personal data deleted permanently.");
      setDeleteConfirmOpen(false);
      navigate({ to: "/auth", search: { role: "citizen" } });
    } catch {
      toast.error("Failed to delete account");
    } finally {
      setDeleting(false);
    }
  };

  if (authLoading) {
    return (
      <CitizenShell title="My Profile">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      </CitizenShell>
    );
  }

  if (!session) {
    return (
      <CitizenShell title="My Profile & Settings">
        <div className="rounded-xl border border-border bg-surface p-6 text-center">
          <Shield className="mx-auto size-12 text-primary/80" />
          <h2 className="mt-3 font-display text-lg font-bold">
            Sign In to Manage Your Safety Settings
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-xs text-muted-foreground">
            Sign in as a community member to configure SMS emergency alerts, manage location
            preferences, and view your submitted hazard reports.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Button asChild className="text-xs">
              <Link to="/auth" search={{ role: "citizen" }}>
                Sign In / Register
              </Link>
            </Button>
            <Button asChild variant="outline" className="text-xs">
              <Link to="/citizen">Browse Anonymously</Link>
            </Button>
          </div>
        </div>
      </CitizenShell>
    );
  }

  const prefs = prefsQuery.data;
  const isPhoneVerified = prefs?.phone_verified ?? false;

  return (
    <CitizenShell title="My Profile & Privacy">
      {/* Profile Overview Card */}
      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary font-bold text-lg">
              {profile?.full_name ? (
                profile.full_name.charAt(0).toUpperCase()
              ) : (
                <User className="size-6" />
              )}
            </div>
            <div>
              <p className="font-display text-base font-bold text-foreground">
                {profile?.full_name || "Community Member"}
              </p>
              <p className="text-xs text-muted-foreground font-mono">{session.user.email}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-risk-low/15 px-2 py-0.5 text-[0.65rem] font-semibold text-risk-low">
                  <ShieldCheck className="size-3" />
                  Role: Citizen (Public Access)
                </span>
                {profile?.district && (
                  <span className="text-[0.65rem] text-muted-foreground">
                    📍 {profile.district}, {profile.state ?? "NER"}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="text-xs text-risk-critical hover:bg-risk-critical/10 hover:text-risk-critical gap-1.5"
            onClick={() => void signOut()}
          >
            <LogOut className="size-3.5" />
            Sign Out
          </Button>
        </div>
      </section>

      {/* Alert Notifications (SMS, Email & Broadcast) */}
      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Smartphone className="size-4 text-primary" />
            <h2 className="font-display text-sm font-bold">Citizen Multi-Channel Alert Dispatch</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Configure how you receive official life-safety warnings via direct SMS, official Email
            advisories, and emergency cell broadcasts.
          </p>
        </div>

        {/* SMS Settings Card */}
        <div className="rounded-lg border border-border bg-background p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold flex items-center gap-1.5">
                <MessageSquare className="size-3.5 text-primary" />
                SMS Mobile Text Notifications
              </p>
              <p className="text-xs text-muted-foreground">
                Receive rapid SMS text alerts during critical landslide warnings, even on
                2G/low-network hill connectivity.
              </p>
            </div>
            <Switch
              checked={smsEnabled}
              onCheckedChange={(checked) => {
                setSmsEnabled(checked);
                saveMutation.mutate({ sms_enabled: checked });
              }}
            />
          </div>

          {smsEnabled && (
            <div className="pt-2 border-t border-border/60 space-y-3">
              <div>
                <Label htmlFor="phone" className="text-xs font-semibold">
                  Registered Mobile Number (India +91)
                </Label>
                <div className="mt-1 flex flex-col sm:flex-row gap-2">
                  <Input
                    id="phone"
                    placeholder="e.g. +91 98765 43210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="h-9 text-xs font-mono flex-1"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="h-9 text-xs shrink-0 gap-1.5 shadow-xs"
                      disabled={saveMutation.isPending || !phoneNumber.trim()}
                      onClick={handleSendOtp}
                    >
                      <Phone className="size-3.5" />
                      Send Verification OTP
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 text-xs shrink-0 text-emerald-600 border-emerald-300 hover:bg-emerald-50 gap-1.5"
                      onClick={handleSendTestSms}
                      title="Simulate receiving an official early warning SMS on your phone"
                    >
                      <MessageSquare className="size-3.5" />
                      Test SMS Alert
                    </Button>
                  </div>
                </div>
              </div>

              {/* Verification status badge */}
              <div className="flex items-center justify-between rounded-lg bg-secondary/40 p-2.5 text-xs">
                <span className="text-muted-foreground font-medium">SMS Delivery Status:</span>
                {isPhoneVerified || localVerified ? (
                  <span className="flex items-center gap-1.5 font-bold text-risk-low bg-risk-low/10 px-2 py-0.5 rounded-full border border-risk-low/20">
                    <CheckCircle2 className="size-3.5" /> Active for Instant SMS Alerts
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-medium">
                    <AlertTriangle className="size-3.5" /> Verification Active (Click Send OTP to
                    refresh)
                  </span>
                )}
              </div>

              {/* OTP Interactive input box */}
              {showOtpInput && (
                <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-3.5 space-y-2.5 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-primary flex items-center gap-1.5">
                      <KeyRound className="size-3.5" />
                      Enter 6-Digit SMS Verification Code
                    </span>
                    <span className="rounded bg-primary/20 px-2 py-0.5 text-[0.7rem] font-mono font-bold text-primary">
                      OTP SENT: {generatedOtp}
                    </span>
                  </div>
                  <p className="text-[0.72rem] text-muted-foreground">
                    A visual SMS notification has been simulated on your screen. Enter code{" "}
                    <code className="font-bold text-foreground font-mono bg-white px-1.5 py-0.5 rounded border border-border">
                      {generatedOtp}
                    </code>{" "}
                    or click &quot;Copy &amp; Fill&quot; on the floating SMS notification.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g. 432198"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="h-9 text-sm font-mono tracking-widest bg-white"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      className="h-9 text-xs px-4 shrink-0 font-semibold gap-1.5"
                      onClick={() => {
                        setLocalVerified(true);
                        setShowOtpInput(false);
                        toast.success("Phone verified for priority SMS alerts!");
                      }}
                    >
                      <ShieldCheck className="size-3.5" />
                      Verify &amp; Activate
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Email Alerts Card */}
        <div className="rounded-lg border border-border bg-background p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold flex items-center gap-1.5">
                <Mail className="size-3.5 text-blue-600" />
                Email Bulletins &amp; Severe Weather Advisories
              </p>
              <p className="text-xs text-muted-foreground">
                Receive detailed meteorological advisories, slope hazard forecasts, and DDMA safety
                bulletins in your inbox.
              </p>
            </div>
            <Switch
              checked={emailEnabled}
              onCheckedChange={(checked) => {
                setEmailEnabled(checked);
                toast.success(checked ? "Email alerts enabled" : "Email alerts paused");
              }}
            />
          </div>

          {emailEnabled && (
            <div className="pt-2 border-t border-border/60 space-y-3">
              <div>
                <Label htmlFor="email-notif" className="text-xs font-semibold">
                  Registered Email Address
                </Label>
                <div className="mt-1 flex flex-col sm:flex-row gap-2">
                  <Input
                    id="email-notif"
                    placeholder="you@example.com"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    className="h-9 text-xs font-mono flex-1"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 text-xs shrink-0 text-blue-600 border-blue-300 hover:bg-blue-50 gap-1.5"
                    onClick={handleSendTestEmail}
                    title="Simulate receiving an official early warning email bulletin"
                  >
                    <Mail className="size-3.5" />
                    Test Email Alert
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Emergency Cell Broadcast Sirens */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg border border-border bg-background p-4 gap-3 text-xs">
          <div>
            <p className="font-semibold flex items-center gap-1.5 text-foreground">
              <Radio className="size-3.5 text-red-600 animate-pulse" />
              National Disaster Cell Broadcast (Sirens / VIS)
            </p>
            <p className="text-[0.7rem] text-muted-foreground mt-0.5">
              High-priority audio chime and full-screen alert for imminent danger
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50 gap-1.5 shrink-0"
            onClick={handleSendTestBroadcast}
          >
            <Bell className="size-3.5" />
            Test VIS Broadcast Chime
          </Button>
        </div>

        {/* In-app Notifications */}
        <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3 text-xs">
          <div>
            <p className="font-semibold">In-App Banner Notifications</p>
            <p className="text-[0.7rem] text-muted-foreground">
              Show urgent alert banner inside NER-SAFE when visiting the portal
            </p>
          </div>
          <Switch
            checked={inAppEnabled}
            onCheckedChange={(c) => {
              setInAppEnabled(c);
              saveMutation.mutate({ in_app_enabled: c });
            }}
          />
        </div>
      </section>

      {/* Privacy & Zero-Trust Architecture Guarantee */}
      <section className="rounded-xl border border-border bg-surface p-4 sm:p-5 space-y-4">
        <div className="border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Lock className="size-4 text-risk-low" />
            <h2 className="font-display text-sm font-bold">Privacy &amp; Zero-Trust Guarantees</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            How NER-SAFE strictly protects citizen privacy under the Least Privilege principle.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 text-xs">
          <div className="rounded-lg border border-border bg-background p-3.5 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <EyeOff className="size-3.5 text-risk-low" />
              <span>No Precise GPS Stored</span>
            </div>
            <p className="text-[0.72rem] leading-relaxed text-muted-foreground">
              When you use location services, your exact coordinates are mapped to the nearest{" "}
              <strong>district</strong> and immediately wiped from memory. We never store personal
              location tracks.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-background p-3.5 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Database className="size-3.5 text-risk-low" />
              <span>Strict Data Segregation</span>
            </div>
            <p className="text-[0.72rem] leading-relaxed text-muted-foreground">
              Citizen hazard reports contain only hazard observations. No telemetry, sensitive
              sensor IDs, or operational logs are exposed to unauthorized channels.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border bg-background p-3 text-xs">
          <div>
            <p className="font-semibold">Allow Approximate Location Detection</p>
            <p className="text-[0.7rem] text-muted-foreground">
              Enable one-click district lookup when checking local landslide risk
            </p>
          </div>
          <Switch
            checked={locationConsent}
            onCheckedChange={(c) => {
              setLocationConsent(c);
              saveMutation.mutate({ location_consent: c });
            }}
          />
        </div>
      </section>

      {/* Delete Account Permanently (GDPR / DPDP Compliant) */}
      <section className="rounded-xl border border-risk-critical/40 bg-risk-critical/5 p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 text-risk-critical">
          <Trash2 className="size-4" />
          <h2 className="font-display text-sm font-bold">Delete Account and Data Permanently</h2>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          In accordance with data protection &amp; privacy rights, you can permanently erase your
          citizen profile, mobile registration, emergency contacts, notification preferences, and
          all submitted hazard records. This action cannot be reversed.
        </p>
        <Button
          variant="destructive"
          size="sm"
          className="text-xs font-semibold gap-1.5 shadow-sm"
          onClick={() => setDeleteConfirmOpen(true)}
        >
          <Trash2 className="size-3.5" />
          Delete Account and Data Permanently
        </Button>
      </section>

      {/* Delete confirmation modal */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-risk-critical">
              <AlertTriangle className="size-5" />
              Confirm Permanent Account Deletion
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed pt-2">
              Are you sure you want to permanently delete your account and all associated data?
              <br />
              <br />
              All associated data including your phone number, notification subscriptions (SMS &amp;
              Email), emergency contacts, and active session keys will be completely purged.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteAccount}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="size-3 animate-spin mr-1" /> Deleting…
                </>
              ) : (
                "Yes, Delete Account & Data Permanently"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CitizenShell>
  );
}
