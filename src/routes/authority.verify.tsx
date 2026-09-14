import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Building2,
  CheckCircle2,
  Clock,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AuthorityGuard } from "@/components/security/Guards";
import { useAuth } from "@/hooks/useAuth";
import { getMyAccess, submitAuthorityRequest } from "@/lib/security/access.functions";
import { AUTHORITY_ORG_TYPES } from "@/lib/security/classification";

export const Route = createFileRoute("/authority/verify")({
  head: () => ({
    meta: [{ title: "Authority Verification — NER-SAFE" }],
  }),
  component: () => (
    <AuthorityPageShell>
      <VerifyPage />
    </AuthorityPageShell>
  ),
});

function AuthorityPageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-xl">{children}</div>
    </div>
  );
}

const WORKFLOW_STEPS = [
  "Registration Request",
  "Organization Verification",
  "Administrator Review",
  "Account Approval",
  "MFA Enrollment",
  "Authority Dashboard Access",
];

function VerifyPage() {
  const { session } = useAuth();
  const router = useRouter();

  const accessQuery = useQuery({
    queryKey: ["my-access"],
    queryFn: () => getMyAccess(),
    enabled: !!session,
  });

  const access = accessQuery.data;
  const requestStatus = access?.requestStatus;
  const isAuthority = access?.isAuthority;

  const [orgType, setOrgType] = useState("");
  const [orgName, setOrgName] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");
  const [region, setRegion] = useState("");
  const [officialEmail, setOfficialEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  const submit = useMutation({
    mutationFn: () =>
      submitAuthorityRequest({
        data: {
          official_email: officialEmail,
          organization_type: orgType,
          organization_name: orgName,
          department: department || "",
          designation,
          region,
          contact_number: contactNumber || "",
        },
      }),
    onSuccess: (result) => {
      toast.success(result.message);
      void accessQuery.refetch();
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Submission failed"),
  });

  if (isAuthority) {
    return (
      <div className="rounded-xl border border-risk-low/40 bg-surface p-8 text-center">
        <ShieldCheck className="mx-auto size-12 text-risk-low" />
        <h1 className="mt-4 font-display text-xl font-bold">Authority Access Active</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your organization verification is complete. Authority access is enabled.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Button asChild>
            <Link to="/authority/mfa">Complete MFA enrollment</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/command-center">Go to Operations Center</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (requestStatus === "pending" || requestStatus === "organization_verified") {
    return (
      <div className="rounded-xl border border-border bg-surface p-8">
        <Clock className="mx-auto size-10 text-risk-moderate" />
        <h1 className="mt-4 text-center font-display text-xl font-bold">Request Under Review</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Your authority access request is awaiting administrator verification. Community features
          remain available meanwhile.
        </p>
        <div className="mt-6">
          <p className="label-eyebrow mb-3">Verification workflow</p>
          <ol className="space-y-2">
            {WORKFLOW_STEPS.map((step, i) => {
              const done =
                (requestStatus === "organization_verified" && i <= 1) ||
                (requestStatus === "pending" && i === 0);
              const current = requestStatus === "pending" ? i === 1 : i === 2;
              return (
                <li key={step} className="flex items-center gap-3 text-sm">
                  <span
                    className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                      done
                        ? "bg-risk-low/20 text-risk-low"
                        : current
                          ? "bg-primary/20 text-primary"
                          : "bg-surface-2 text-muted-foreground"
                    }`}
                  >
                    {done ? <CheckCircle2 className="size-3.5" /> : i + 1}
                  </span>
                  <span
                    className={
                      done ? "text-risk-low" : current ? "font-medium" : "text-muted-foreground"
                    }
                  >
                    {step}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
        <Button asChild className="mt-6 w-full" variant="secondary">
          <Link to="/citizen">Go to Community App</Link>
        </Button>
      </div>
    );
  }

  if (requestStatus === "rejected") {
    return (
      <div className="rounded-xl border border-risk-critical/40 bg-surface p-8 text-center">
        <XCircle className="mx-auto size-10 text-risk-critical" />
        <h1 className="mt-4 font-display text-xl font-bold">Request Not Approved</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your authority access request was not approved. Contact your organization administrator
          for assistance.
        </p>
        <Button asChild className="mt-5" variant="secondary">
          <Link to="/citizen">Go to Community App</Link>
        </Button>
      </div>
    );
  }

  // No request yet — show submission form
  if (!session) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <ShieldAlert className="mx-auto size-10 text-risk-critical" />
        <h1 className="mt-4 font-display text-xl font-bold">Sign in first</h1>
        <Button asChild className="mt-5">
          <Link to="/auth" search={{ role: "authority" }}>
            Authority sign in
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-lg bg-risk-critical/15 text-risk-critical">
          <Building2 className="size-5" />
        </span>
        <div>
          <h1 className="font-display text-lg font-bold">Authority Verification Request</h1>
          <p className="text-xs text-muted-foreground">
            DEMO AUTHORITY VERIFICATION — Organization details for administrator review
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-2 rounded border border-risk-moderate/40 bg-risk-moderate/10 p-3 text-[0.72rem] leading-relaxed text-risk-moderate">
        <ShieldAlert className="mt-0.5 size-4 shrink-0" />
        <span>
          Authority accounts require administrator review. Organization credentials are never
          automatically granted. All requests are logged.
        </span>
      </div>

      <div className="mt-5">
        <p className="label-eyebrow mb-3">Verification workflow</p>
        <ol className="flex flex-wrap gap-2 text-[0.68rem]">
          {WORKFLOW_STEPS.map((step, i) => (
            <li key={step} className="flex items-center gap-1 text-muted-foreground">
              <span className="grid size-4 place-items-center rounded-full bg-surface-2 text-[0.6rem] font-bold">
                {i + 1}
              </span>
              {step}
              {i < WORKFLOW_STEPS.length - 1 && <span className="ml-1">→</span>}
            </li>
          ))}
        </ol>
      </div>

      <form
        className="mt-5 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          submit.mutate();
        }}
      >
        <div>
          <Label htmlFor="official-email" className="text-xs">
            Official email / authorized ID
          </Label>
          <Input
            id="official-email"
            type="email"
            value={officialEmail}
            onChange={(e) => setOfficialEmail(e.target.value)}
            required
            placeholder="official@organization.gov.in"
          />
        </div>
        <div>
          <Label htmlFor="org-type" className="text-xs">
            Organization type
          </Label>
          <Select value={orgType} onValueChange={setOrgType} required>
            <SelectTrigger id="org-type" className="h-9 text-xs">
              <SelectValue placeholder="Select organization type" />
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
          <Label htmlFor="org-name" className="text-xs">
            Organization name
          </Label>
          <Input
            id="org-name"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            required
            placeholder="e.g. Meghalaya State Disaster Management Authority"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="dept" className="text-xs">
              Department (optional)
            </Label>
            <Input
              id="dept"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Operations"
            />
          </div>
          <div>
            <Label htmlFor="desig" className="text-xs">
              Designation
            </Label>
            <Input
              id="desig"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              required
              placeholder="e.g. District Collector"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="region" className="text-xs">
              Region / state
            </Label>
            <Input
              id="region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              required
              placeholder="e.g. Meghalaya"
            />
          </div>
          <div>
            <Label htmlFor="contact" className="text-xs">
              Contact number (optional)
            </Label>
            <Input
              id="contact"
              type="tel"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="+91 XXXXX XXXXX"
            />
          </div>
        </div>
        <Button type="submit" className="w-full" disabled={submit.isPending}>
          {submit.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Submit Verification Request"
          )}
        </Button>
      </form>
    </div>
  );
}
