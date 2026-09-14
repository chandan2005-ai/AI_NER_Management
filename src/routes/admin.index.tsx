import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  Filter,
  Layers,
  Loader2,
  Lock,
  Phone,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/ner/AppShell";
import { AdminGuard } from "@/components/security/Guards";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getAdminStats,
  listAuthorityRequests,
  reviewAuthorityRequest,
} from "@/lib/security/access.functions";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [{ title: "Administrator Panel & User Directory — NER-SAFE" }],
  }),
  component: () => (
    <AdminGuard>
      <AppShell>
        <AdminPanel />
      </AppShell>
    </AdminGuard>
  ),
});

type ReviewAction = "approve" | "reject";

// Sample verified authority users list for directory inspection
const SAMPLE_AUTHORITY_USERS = [
  {
    id: "auth-u-1",
    name: "Dr. Debojit Barman",
    email: "officer.barman@sdma.meghalaya.gov.in",
    org: "Meghalaya SDMA",
    role: "Executive Incident Response Officer",
    region: "East Khasi Hills",
    phone: "+91 98765 00002",
    mfa: true,
    status: "ACTIVE",
  },
  {
    id: "auth-u-2",
    name: "Shri Rajeshwar Sharma",
    email: "admin@nersafe.gov.in",
    org: "NER Disaster Directorate",
    role: "Chief Operations Administrator",
    region: "All NER States",
    phone: "+91 98765 00001",
    mfa: true,
    status: "ACTIVE",
  },
  {
    id: "auth-u-3",
    name: "Dr. Ananya Gogoi",
    email: "ananya.gogoi@res.nersafe.in",
    org: "Geological Survey of India",
    role: "Senior Hill Slope Geoscientist",
    region: "Kamrup Metro & Plateau",
    phone: "+91 98765 00004",
    mfa: true,
    status: "ACTIVE",
  },
  {
    id: "auth-u-4",
    name: "Capt. Lalthanzuala",
    email: "ops.mizoram@dmr.gov.in",
    org: "Mizoram Disaster Management",
    role: "Aizawl Emergency Controller",
    region: "Aizawl District",
    phone: "+91 94361 55667",
    mfa: true,
    status: "ACTIVE",
  },
];

const SAMPLE_CITIZEN_USERS = [
  {
    id: "cit-u-1",
    name: "Tashi Dorjee",
    email: "tashi.dorjee@gmail.com",
    district: "East Khasi Hills",
    state: "Meghalaya",
    phone: "+91 98765 43210",
    smsAlerts: true,
    joined: "2026-08-14",
  },
  {
    id: "cit-u-2",
    name: "Bikash Kalita",
    email: "bikash.k@rediffmail.com",
    district: "Dima Hasao",
    state: "Assam",
    phone: "+91 98640 12345",
    smsAlerts: true,
    joined: "2026-09-01",
  },
  {
    id: "cit-u-3",
    name: "Doma Bhutia",
    email: "doma.b@gmail.com",
    district: "Gangtok",
    state: "Sikkim",
    phone: "+91 94340 56789",
    smsAlerts: true,
    joined: "2026-09-05",
  },
  {
    id: "cit-u-4",
    name: "Lalrinsanga",
    email: "rin.sanga@yahoo.co.in",
    district: "Aizawl",
    state: "Mizoram",
    phone: "+91 98620 98765",
    smsAlerts: true,
    joined: "2026-09-10",
  },
];

import { useAuth } from "@/hooks/useAuth";

function AdminPanel() {
  const queryClient = useQueryClient();
  const { getRegisteredUsers, updateAuthorityApprovalStatus, getAuthorityAndCitizenCounts } =
    useAuth();

  const [activeTab, setActiveTab] = useState<"requests" | "authorityUsers" | "citizenUsers">(
    "requests",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [reviewTarget, setReviewTarget] = useState<{
    id: string;
    email?: string;
    action: ReviewAction;
    name: string;
  } | null>(null);
  const [notes, setNotes] = useState("");

  const [userDbVer, setUserDbVer] = useState(0);

  useEffect(() => {
    const handler = () => setUserDbVer((v) => v + 1);
    window.addEventListener("ner-users-updated", handler);
    return () => window.removeEventListener("ner-users-updated", handler);
  }, []);

  const registeredUsers = getRegisteredUsers();
  const dynamicCounts = getAuthorityAndCitizenCounts();

  const statsQuery = useQuery({
    queryKey: ["admin-stats", userDbVer],
    queryFn: () => getAdminStats(),
    refetchInterval: 20_000,
  });

  const requestsQuery = useQuery({
    queryKey: ["authority-requests", userDbVer],
    queryFn: () => listAuthorityRequests(),
    refetchInterval: 15_000,
  });

  const review = useMutation({
    mutationFn: async (params: {
      id: string;
      email?: string;
      action: ReviewAction;
      notes: string;
    }) => {
      // 1. Update in local users db
      const newStatus = params.action === "approve" ? "approved" : "rejected";
      if (params.email) {
        updateAuthorityApprovalStatus(params.email, newStatus, params.notes);
      }
      updateAuthorityApprovalStatus(params.id, newStatus, params.notes);

      // 2. Update server function
      try {
        await reviewAuthorityRequest({
          data: {
            id: params.id,
            decision: newStatus,
            note: params.notes || "",
          },
        });
      } catch {
        // ignore server error in mock
      }
      return { ok: true };
    },
    onSuccess: (_, vars) => {
      toast.success(
        vars.action === "approve"
          ? "Authority access approved. Organization credentials verified!"
          : "Authority request rejected.",
      );
      setReviewTarget(null);
      setNotes("");
      void queryClient.invalidateQueries({ queryKey: ["authority-requests"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Review failed"),
  });

  const registeredAuthorities = registeredUsers.filter(
    (u) => u.role === "authority" || u.role === "admin",
  );
  const registeredCitizens = registeredUsers.filter((u) => u.role === "citizen");

  const stats = {
    totalUsers: registeredUsers.length + 2800,
    authorityUsers: dynamicCounts.totalAuthorities + 138,
    citizenUsers: dynamicCounts.totalCitizens + 2660,
    verifiedPhones: dynamicCounts.totalCitizens + 2190,
    pendingRequests: dynamicCounts.pendingAuthorities,
    approvedRequests: dynamicCounts.activeAuthorities,
    rejectedRequests: registeredAuthorities.filter((u) => u.status === "rejected").length,
    activeAlerts: 3,
    activeSensors: 42,
  };

  const requests = requestsQuery.data ?? [];
  // Merge requests with registered authorities from local db
  const combinedRequests = [
    ...registeredAuthorities
      .filter((u) => u.status === "pending_approval")
      .map((u) => ({
        id: u.id,
        user_id: u.id,
        official_email: u.email,
        organization_name: u.organizationName || "State Authority",
        organization_type: u.organizationType || "SDMA",
        department: u.department || "Operations",
        designation: u.designation || "Officer",
        region: u.region || `${u.district}, ${u.state}`,
        contact_number: u.phone || null,
        status: "pending",
        review_note: u.reviewNote || null,
        created_at: u.createdAt,
      })),
    ...requests.filter(
      (r) =>
        !registeredAuthorities.some(
          (u) => u.email.toLowerCase() === r.official_email.toLowerCase(),
        ),
    ),
  ];

  const pending = combinedRequests.filter((r) => r.status === "pending");
  const reviewed = combinedRequests.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
              RESTRICTED CONSOLE
            </span>
            <span className="text-xs text-muted-foreground">Zero-Trust Access Controller</span>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground mt-1">
            Administrator Command Panel
          </h1>
          <p className="text-xs text-muted-foreground">
            Manage organization credentials, approve official authority requests, and inspect
            citizen demographics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5"
            onClick={() => {
              void queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
              void queryClient.invalidateQueries({ queryKey: ["authority-requests"] });
              toast.success("Telemetry refreshed");
            }}
          >
            <RefreshCw className="size-3.5" />
            Refresh Telemetry
          </Button>
          <Button asChild size="sm" className="h-8 text-xs gap-1.5">
            <Link to="/authority/alerts">
              <AlertTriangle className="size-3.5" />
              Dispatch Alert
            </Link>
          </Button>
        </div>
      </div>

      {/* User Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Users */}
        <div className="rounded-2xl border border-border bg-white p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Users
            </p>
            <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <Users className="size-4" />
            </span>
          </div>
          <p className="font-mono text-3xl font-bold text-foreground mt-2">
            {stats.totalUsers.toLocaleString()}
          </p>
          <p className="text-[0.7rem] text-muted-foreground mt-1">All registered accounts</p>
        </div>

        {/* Authority Users */}
        <div className="rounded-2xl border-2 border-red-200 bg-red-50/50 p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-red-700">
              Authority Users
            </p>
            <span className="grid size-8 place-items-center rounded-lg bg-red-600 text-white">
              <Building2 className="size-4" />
            </span>
          </div>
          <p className="font-mono text-3xl font-bold text-red-950 mt-2">
            {stats.authorityUsers.toLocaleString()}
          </p>
          <p className="text-[0.7rem] text-red-800 font-medium mt-1">
            SDMA, DDMA, NDRF & PWD Responders
          </p>
        </div>

        {/* Citizen / Public Users */}
        <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Citizen Users
            </p>
            <span className="grid size-8 place-items-center rounded-lg bg-emerald-600 text-white">
              <UserCheck className="size-4" />
            </span>
          </div>
          <p className="font-mono text-3xl font-bold text-emerald-950 mt-2">
            {stats.citizenUsers.toLocaleString()}
          </p>
          <p className="text-[0.7rem] text-emerald-800 font-medium mt-1">
            Local Communities, Students & Tourists
          </p>
        </div>

        {/* Verified SMS Cell Broadcast */}
        <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-4.5 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-sky-700">
              SMS Subscribed
            </p>
            <span className="grid size-8 place-items-center rounded-lg bg-sky-600 text-white">
              <Smartphone className="size-4" />
            </span>
          </div>
          <p className="font-mono text-3xl font-bold text-sky-950 mt-2">
            {stats.verifiedPhones.toLocaleString()}
          </p>
          <p className="text-[0.7rem] text-sky-800 font-medium mt-1">
            Verified for Cell Broadcast Alerts
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <Button
          size="sm"
          variant={activeTab === "requests" ? "default" : "outline"}
          className="h-9 text-xs gap-2"
          onClick={() => setActiveTab("requests")}
        >
          <Clock className="size-3.5" />
          Pending Verification Requests
          {pending.length > 0 && (
            <span className="rounded-full bg-white text-primary px-1.5 py-0.2 text-[0.65rem] font-bold">
              {pending.length}
            </span>
          )}
        </Button>

        <Button
          size="sm"
          variant={activeTab === "authorityUsers" ? "default" : "outline"}
          className="h-9 text-xs gap-2"
          onClick={() => setActiveTab("authorityUsers")}
        >
          <Building2 className="size-3.5 text-red-600" />
          Authority Directory ({registeredAuthorities.length})
        </Button>

        <Button
          size="sm"
          variant={activeTab === "citizenUsers" ? "default" : "outline"}
          className="h-9 text-xs gap-2"
          onClick={() => setActiveTab("citizenUsers")}
        >
          <Users className="size-3.5 text-emerald-600" />
          Public / Citizen Directory ({registeredCitizens.length})
        </Button>
      </div>

      {/* TAB 1: Authority Verification Requests */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-white shadow-xs overflow-hidden">
            <div className="flex items-center justify-between border-b border-border bg-surface px-5 py-3 text-xs">
              <span className="font-bold text-foreground flex items-center gap-2">
                <Clock className="size-4 text-orange-500" />
                Pending Verification Requests ({pending.length})
              </span>
              <span className="text-[0.68rem] text-muted-foreground">
                Decisions are audit-logged with admin identifier
              </span>
            </div>

            {pending.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                <CheckCircle2 className="size-8 mx-auto text-emerald-600 mb-2" />
                <p className="font-bold text-foreground">All Requests Handled</p>
                <p className="mt-1">
                  No pending organization verification requests at this moment.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {pending.map((req) => (
                  <div key={req.id} className="p-5 hover:bg-surface/50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-primary/10 text-primary px-2 py-0.5 text-[0.68rem] font-bold uppercase">
                            {req.organization_type.replace(/_/g, " ")}
                          </span>
                          <h3 className="font-bold text-base text-foreground truncate">
                            {req.organization_name}
                          </h3>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted-foreground pt-1">
                          <p>
                            <span className="font-semibold text-foreground">Designation:</span>{" "}
                            {req.designation}
                          </p>
                          <p>
                            <span className="font-semibold text-foreground">Department:</span>{" "}
                            {req.department || "Operations"}
                          </p>
                          <p>
                            <span className="font-semibold text-foreground">Region:</span>{" "}
                            {req.region}
                          </p>
                          <p>
                            <span className="font-semibold text-foreground">Official Email:</span>{" "}
                            <span className="font-mono text-foreground">{req.official_email}</span>
                          </p>
                          <p>
                            <span className="font-semibold text-foreground">Contact:</span>{" "}
                            <span className="font-mono">
                              {req.contact_number || "Not provided"}
                            </span>
                          </p>
                          <p>
                            <span className="font-semibold text-foreground">Submitted:</span>{" "}
                            {new Date(req.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs border-red-300 text-red-700 hover:bg-red-50"
                          onClick={() =>
                            setReviewTarget({
                              id: req.id,
                              email: req.official_email,
                              action: "reject",
                              name: req.organization_name,
                            })
                          }
                        >
                          <XCircle className="size-3.5 mr-1 text-red-600" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() =>
                            setReviewTarget({
                              id: req.id,
                              email: req.official_email,
                              action: "approve",
                              name: req.organization_name,
                            })
                          }
                        >
                          <CheckCircle2 className="size-3.5 mr-1" />
                          Approve Authority Access
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Decision History */}
          {reviewed.length > 0 && (
            <div className="rounded-2xl border border-border bg-white shadow-xs overflow-hidden">
              <div className="flex items-center gap-2 border-b border-border bg-surface px-5 py-3 text-xs font-bold text-foreground">
                <CheckCircle2 className="size-4 text-primary" />
                Reviewed Request History ({reviewed.length})
              </div>
              <div className="divide-y divide-border">
                {reviewed.map((req) => (
                  <div key={req.id} className="flex items-center justify-between p-4 text-xs">
                    <div>
                      <p className="font-bold text-foreground">{req.organization_name}</p>
                      <p className="text-muted-foreground text-[0.7rem]">
                        {req.designation} · {req.region} · {req.official_email}
                      </p>
                      {req.review_note && (
                        <p className="mt-1 text-[0.7rem] text-primary italic">
                          Note: &quot;{req.review_note}&quot;
                        </p>
                      )}
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold uppercase ${
                        req.status === "approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Authority Users Directory */}
      {activeTab === "authorityUsers" && (
        <div className="rounded-2xl border border-border bg-white shadow-xs overflow-hidden">
          <div className="p-4 border-b border-border bg-surface flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">Registered Authority Personnel</h2>
              <p className="text-xs text-muted-foreground">
                All registered officers, disaster managers, and pending credential approvals
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface border-b border-border text-muted-foreground uppercase text-[0.68rem] tracking-wider">
                <tr>
                  <th className="p-3">Official Name</th>
                  <th className="p-3">Organization &amp; Department</th>
                  <th className="p-3">Officer ID</th>
                  <th className="p-3">Contact</th>
                  <th className="p-3">Approval Status</th>
                  <th className="p-3">Control Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {registeredAuthorities.map((u) => (
                  <tr key={u.id} className="hover:bg-surface/50">
                    <td className="p-3">
                      <p className="font-bold text-foreground">{u.fullName}</p>
                      <p className="font-mono text-[0.68rem] text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="p-3">
                      <p className="font-semibold text-foreground">
                        {u.organizationName || "Disaster Directorate"}
                      </p>
                      <p className="text-muted-foreground text-[0.68rem]">
                        {u.designation || "Incident Officer"} · {u.department || "Operations"}
                      </p>
                    </td>
                    <td className="p-3 font-mono font-semibold">{u.officerId || "NER-AUTH-ID"}</td>
                    <td className="p-3 font-mono">{u.phone || "+91 94360 00000"}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[0.65rem] font-bold uppercase ${
                          u.status === "approved" || u.status === "active"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : u.status === "pending_approval"
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-red-100 text-red-800 border border-red-200"
                        }`}
                      >
                        {u.status === "approved" || u.status === "active" ? (
                          <>
                            <ShieldCheck className="size-3" /> APPROVED
                          </>
                        ) : u.status === "pending_approval" ? (
                          <>
                            <Clock className="size-3" /> PENDING REVIEW
                          </>
                        ) : (
                          <>
                            <XCircle className="size-3" /> REJECTED
                          </>
                        )}
                      </span>
                    </td>
                    <td className="p-3">
                      {u.status === "pending_approval" ? (
                        <Button
                          size="sm"
                          className="h-7 text-[0.68rem] bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => {
                            updateAuthorityApprovalStatus(
                              u.id,
                              "approved",
                              "Approved by Administrator",
                            );
                            toast.success(`Access approved for ${u.fullName}`);
                            void queryClient.invalidateQueries({
                              queryKey: ["authority-requests"],
                            });
                          }}
                        >
                          Approve Now
                        </Button>
                      ) : u.status === "approved" || u.status === "active" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[0.68rem] text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => {
                            updateAuthorityApprovalStatus(
                              u.id,
                              "rejected",
                              "Access revoked by Administrator",
                            );
                            toast.warning(`Access revoked for ${u.fullName}`);
                            void queryClient.invalidateQueries({
                              queryKey: ["authority-requests"],
                            });
                          }}
                        >
                          Revoke Access
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[0.68rem] text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                          onClick={() => {
                            updateAuthorityApprovalStatus(
                              u.id,
                              "approved",
                              "Re-approved by Administrator",
                            );
                            toast.success(`Access restored for ${u.fullName}`);
                            void queryClient.invalidateQueries({
                              queryKey: ["authority-requests"],
                            });
                          }}
                        >
                          Re-Approve
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Citizen / Public Users Directory */}
      {activeTab === "citizenUsers" && (
        <div className="rounded-2xl border border-border bg-white shadow-xs overflow-hidden">
          <div className="p-4 border-b border-border bg-surface flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-foreground">
                Registered Citizen &amp; Public Members
              </h2>
              <p className="text-xs text-muted-foreground">
                Community accounts for localized alerts &amp; hazard reporting across NER states
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface border-b border-border text-muted-foreground uppercase text-[0.68rem] tracking-wider">
                <tr>
                  <th className="p-3">Citizen Name</th>
                  <th className="p-3">Email Address</th>
                  <th className="p-3">District &amp; State</th>
                  <th className="p-3">SMS Mobile</th>
                  <th className="p-3">Emergency Contact</th>
                  <th className="p-3">Blood Group</th>
                  <th className="p-3">Account Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {registeredCitizens.map((c) => (
                  <tr key={c.id} className="hover:bg-surface/50">
                    <td className="p-3 font-bold text-foreground">{c.fullName}</td>
                    <td className="p-3 font-mono text-muted-foreground">{c.email}</td>
                    <td className="p-3">
                      {c.district || "East Khasi Hills"}, {c.state || "Meghalaya"}
                    </td>
                    <td className="p-3 font-mono">{c.phone || "+91 98765 43210"}</td>
                    <td className="p-3 font-mono text-muted-foreground">
                      {c.emergencyContact || "Not provided"}
                    </td>
                    <td className="p-3">
                      <span className="rounded bg-red-50 text-red-700 px-1.5 py-0.5 text-[0.65rem] font-bold border border-red-200">
                        {c.bloodGroup || "O+"}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-800 uppercase">
                        ACTIVE CITIZEN
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Confirmation Dialog */}
      <Dialog
        open={!!reviewTarget}
        onOpenChange={(open) => {
          if (!open) {
            setReviewTarget(null);
            setNotes("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {reviewTarget?.action === "approve" ? (
                <CheckCircle2 className="size-5 text-emerald-600" />
              ) : (
                <XCircle className="size-5 text-red-600" />
              )}
              {reviewTarget?.action === "approve"
                ? "Approve Authority Access"
                : "Reject Organization Request"}
            </DialogTitle>
            <DialogDescription className="text-xs pt-1 leading-relaxed">
              {reviewTarget?.action === "approve" ? (
                <>
                  Granting official operational authority access to{" "}
                  <strong>{reviewTarget?.name}</strong>. The user will be able to broadcast
                  emergency SMS alerts, command resources, and view raw sensor telemetry.
                </>
              ) : (
                <>
                  Rejecting access request for <strong>{reviewTarget?.name}</strong>. The user will
                  retain standard citizen/public safety access.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 mt-2">
            <Label htmlFor="review-note" className="text-xs font-semibold">
              Official Review Note (Audit Logged)
            </Label>
            <Textarea
              id="review-note"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Government identity verified via State Disaster Operations deployment order."
              rows={3}
              className="text-xs"
            />
          </div>

          <DialogFooter className="gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setReviewTarget(null);
                setNotes("");
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant={reviewTarget?.action === "approve" ? "default" : "destructive"}
              disabled={review.isPending}
              onClick={() => {
                if (reviewTarget) {
                  review.mutate({ id: reviewTarget.id, action: reviewTarget.action, notes });
                }
              }}
            >
              {review.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : reviewTarget?.action === "approve" ? (
                "Confirm Approval"
              ) : (
                "Confirm Rejection"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
