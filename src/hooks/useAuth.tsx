import { useRouter } from "@tanstack/react-router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import {
  getMyAccess,
  recordSecurityEvent,
  type AccessContext,
} from "@/lib/security/access.functions";

const MFA_KEY = "ner-safe-mfa";
const DEMO_SESSION_KEY = "ner-safe-demo-session";
const USERS_DB_KEY = "ner-safe-users-db-v2";

interface MfaSession {
  token: string;
  expiresAt: number;
}

export type DemoRole = "authority" | "citizen" | "admin" | "researcher";

export interface StoredUser {
  id: string;
  email: string;
  password?: string | undefined;
  role: "citizen" | "authority" | "admin";
  fullName: string;
  phone?: string | undefined;
  district?: string | undefined;
  state?: string | undefined;
  // Citizen specific
  emergencyContact?: string | undefined;
  pincode?: string | undefined;
  bloodGroup?: string | undefined;
  // Authority specific
  organizationName?: string | undefined;
  organizationType?: string | undefined;
  department?: string | undefined;
  designation?: string | undefined;
  officerId?: string | undefined;
  region?: string | undefined;
  status: "pending_approval" | "approved" | "rejected" | "active";
  reviewNote?: string | undefined;
  createdAt: string;
}

export interface CitizenSignupData {
  fullName: string;
  email: string;
  password?: string | undefined;
  phone: string;
  district: string;
  state: string;
  emergencyContact?: string | undefined;
  pincode?: string | undefined;
  bloodGroup?: string | undefined;
}

export interface AuthoritySignupData {
  fullName: string;
  email: string;
  password?: string | undefined;
  phone: string;
  district?: string | undefined;
  state: string;
  organizationName: string;
  organizationType: string;
  department: string;
  designation: string;
  officerId: string;
}

interface DemoSessionState {
  role: DemoRole;
  user: {
    id: string;
    email: string;
  };
  access: AccessContext;
  mfa: MfaSession;
}

/** ONLY the Admin demo account is kept for rapid administrative evaluation */
export const NEW_DEMO_ACCOUNTS = [
  {
    role: "admin" as DemoRole,
    title: "NER Incident Commander / Admin",
    name: "Shri Rajeshwar Sharma",
    email: "admin@nersafe.gov.in",
    password: "Demo@Admin2026",
    org: "North Eastern Disaster Management Directorate",
    designation: "Chief Operations Administrator",
    badge: "Super Admin",
    badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
  },
];

const INITIAL_USERS: StoredUser[] = [
  {
    id: "admin-root",
    email: "admin@nersafe.gov.in",
    password: "Demo@Admin2026",
    role: "admin",
    fullName: "Shri Rajeshwar Sharma",
    phone: "+91 98765 00001",
    district: "East Khasi Hills",
    state: "Meghalaya",
    organizationName: "North Eastern Disaster Management Directorate",
    organizationType: "SDMA",
    department: "NER Unified Incident Command",
    designation: "Chief Operations Administrator",
    officerId: "NER-DIR-001",
    region: "All NER States",
    status: "approved",
    createdAt: "2026-08-01T00:00:00.000Z",
  },
  {
    id: "auth-sample-1",
    email: "eoc.gangtok@sdma.sikkim.gov.in",
    password: "Password@123",
    role: "authority",
    fullName: "Sonam Tshering Lepcha",
    phone: "+91 94360 11223",
    district: "Gangtok",
    state: "Sikkim",
    organizationName: "Sikkim State Disaster Management Authority (SSDMA)",
    organizationType: "SDMA",
    department: "Emergency Operations & Slope Response",
    designation: "District Project Officer",
    officerId: "SSDMA-EOC-042",
    region: "Gangtok & Pakyong Districts",
    status: "pending_approval",
    createdAt: "2026-09-12T09:30:00.000Z",
  },
  {
    id: "auth-sample-2",
    email: "ddma.dimahasao@assam.gov.in",
    password: "Password@123",
    role: "authority",
    fullName: "Pranjal Saikia",
    phone: "+91 94350 44556",
    district: "Dima Hasao",
    state: "Assam",
    organizationName: "Dima Hasao District Disaster Management Authority",
    organizationType: "DDMA",
    department: "Hill Road & Lifeline Protection Cell",
    designation: "Field Incident Commander",
    officerId: "DDMA-DH-108",
    region: "Haflong & Jatinga Valley",
    status: "pending_approval",
    createdAt: "2026-09-13T11:15:00.000Z",
  },
  {
    id: "auth-sample-3",
    email: "hq.1bn@ndrf.gov.in",
    password: "Password@123",
    role: "authority",
    fullName: "Maj. Vikramjit Singh",
    phone: "+91 98640 77889",
    district: "Kamrup Metropolitan",
    state: "Assam",
    organizationName: "1st Battalion National Disaster Response Force (NDRF)",
    organizationType: "NDRF_SDRF",
    department: "Search & Rescue Operations Command",
    designation: "Deputy Commandant",
    officerId: "NDRF-1BN-019",
    region: "Guwahati / NER Regional Base",
    status: "pending_approval",
    createdAt: "2026-09-13T14:45:00.000Z",
  },
  {
    id: "auth-sample-4",
    email: "ee.nh6@pwd.meghalaya.gov.in",
    password: "Password@123",
    role: "authority",
    fullName: "Wanborlang Kharbhih",
    phone: "+91 94361 99001",
    district: "Ri-Bhoi",
    state: "Meghalaya",
    organizationName: "Meghalaya Public Works Department (Roads)",
    organizationType: "PWD_INFRASTRUCTURE",
    department: "NH-6 Highway Maintenance Division",
    designation: "Executive Engineer",
    officerId: "MPWD-NH6-88",
    region: "Byrnihat - Shillong Corridor",
    status: "approved",
    reviewNote: "Verified official government credentials and PWD deployment order.",
    createdAt: "2026-09-10T10:00:00.000Z",
  },
  {
    id: "cit-sample-1",
    email: "biren.gogoi@gmail.com",
    password: "Password@123",
    role: "citizen",
    fullName: "Biren Gogoi",
    phone: "+91 98640 12345",
    district: "Kamrup Metropolitan",
    state: "Assam",
    emergencyContact: "+91 98640 54321",
    pincode: "781001",
    bloodGroup: "O+",
    status: "active",
    createdAt: "2026-09-01T08:00:00.000Z",
  },
  {
    id: "cit-sample-2",
    email: "tashi.lepcha@gmail.com",
    password: "Password@123",
    role: "citizen",
    fullName: "Tashi Lepcha",
    phone: "+91 94340 56789",
    district: "East Sikkim",
    state: "Sikkim",
    emergencyContact: "+91 94340 98765",
    pincode: "737101",
    bloodGroup: "A+",
    status: "active",
    createdAt: "2026-09-05T12:00:00.000Z",
  },
];

function getStoredUsers(): StoredUser[] {
  try {
    const raw = window.localStorage.getItem(USERS_DB_KEY);
    if (!raw) {
      window.localStorage.setItem(USERS_DB_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    const parsed = JSON.parse(raw) as StoredUser[];
    return parsed.length ? parsed : INITIAL_USERS;
  } catch {
    return INITIAL_USERS;
  }
}

function saveStoredUsers(users: StoredUser[]) {
  try {
    window.localStorage.setItem(USERS_DB_KEY, JSON.stringify(users));
    window.dispatchEvent(new Event("ner-users-updated"));
  } catch (err) {
    console.error("Failed to save users", err);
  }
}

export interface CustomUserData {
  email: string;
  fullName?: string;
  phone?: string;
  district?: string;
  state?: string;
  role?: DemoRole;
}

interface AuthValue {
  loading: boolean;
  session: Session | null;
  access: AccessContext | null;
  role: "citizen" | "authority" | "admin" | "researcher" | null;
  profile: {
    full_name: string | null;
    district: string | null;
    state: string | null;
    phone?: string | null;
  } | null;
  authorityProfile: {
    organization: string | null;
    role: string | null;
  } | null;
  isAuthority: boolean;
  isAdmin: boolean;
  isDemoSession: boolean;
  mfa: MfaSession | null;
  setMfa: (value: MfaSession | null) => void;
  loginAsDemo: (role: DemoRole) => Promise<void>;
  loginCustomUser: (userData: CustomUserData) => Promise<void>;
  registerCitizen: (data: CitizenSignupData) => Promise<void>;
  registerAuthority: (
    data: AuthoritySignupData,
  ) => Promise<{ success: boolean; status: string; message: string }>;
  loginWithCredentials: (params: {
    email: string;
    password?: string;
    role: "citizen" | "authority" | "admin";
  }) => Promise<{ success: boolean; message?: string }>;
  deleteAccountPermanently: (userId?: string) => Promise<void>;
  getRegisteredUsers: () => StoredUser[];
  updateAuthorityApprovalStatus: (
    userIdOrEmail: string,
    status: "approved" | "rejected" | "pending_approval",
    reviewNote?: string,
  ) => void;
  getAuthorityAndCitizenCounts: () => {
    totalAuthorities: number;
    pendingAuthorities: number;
    activeAuthorities: number;
    totalCitizens: number;
  };
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

function createMockAdminState(): DemoSessionState {
  const mfaToken: MfaSession = {
    token: `admin-mfa-token-${Date.now()}`,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  };

  return {
    role: "admin",
    user: { id: "admin-root", email: "admin@nersafe.gov.in" },
    access: {
      userId: "admin-root",
      roles: ["authority", "admin"],
      isAuthority: true,
      isAdmin: true,
      profile: {
        full_name: "Shri Rajeshwar Sharma",
        phone: "+91 98765 00001",
        preferred_language: "en",
        district: "East Khasi Hills",
        state: "Meghalaya",
      },
      authority: {
        organization_name: "North Eastern Disaster Management Directorate",
        organization_type: "SDMA",
        department: "NER Unified Incident Command",
        designation: "Chief Operations Administrator",
        region: "North Eastern Region (8 States)",
        mfa_enrolled: true,
        approved_at: new Date().toISOString(),
      },
      requestStatus: "approved",
    },
    mfa: mfaToken,
  };
}

function readMfa(): MfaSession | null {
  try {
    const raw = window.sessionStorage.getItem(MFA_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MfaSession;
    return parsed.expiresAt > Date.now() ? parsed : null;
  } catch {
    return null;
  }
}

function readSavedDemoSession(): DemoSessionState | null {
  try {
    const raw = window.localStorage.getItem(DEMO_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DemoSessionState;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [demoState, setDemoState] = useState<DemoSessionState | null>(() => {
    if (typeof window === "undefined") return null;
    return readSavedDemoSession();
  });

  const [session, setSession] = useState<Session | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = readSavedDemoSession();
    if (saved) {
      return {
        user: saved.user as unknown as Session["user"],
        access_token: "mock-demo-jwt",
        token_type: "bearer",
        expires_in: 86400,
        expires_at: Math.floor(Date.now() / 1000) + 86400,
        refresh_token: "mock-refresh",
      } as Session;
    }
    return null;
  });

  const [access, setAccess] = useState<AccessContext | null>(() => {
    if (typeof window === "undefined") return null;
    return readSavedDemoSession()?.access ?? null;
  });

  const [mfa, setMfaState] = useState<MfaSession | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = readSavedDemoSession();
    return saved?.mfa ?? readMfa();
  });

  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return !readSavedDemoSession();
  });

  const loadAccess = useCallback(async (next: Session | null) => {
    if (!next) {
      setAccess(null);
      setLoading(false);
      return;
    }
    try {
      setAccess(await getMyAccess());
    } catch (error) {
      console.error("[auth] could not read permissions", error);
      setAccess(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedDemo = readSavedDemoSession();
    if (savedDemo) {
      setDemoState(savedDemo);
      setAccess(savedDemo.access);
      setMfaState(savedDemo.mfa);
      setLoading(false);
      return;
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === "SIGNED_OUT") {
        setAccess(null);
        setMfaState(null);
        window.sessionStorage.removeItem(MFA_KEY);
        setLoading(false);
        return;
      }
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "USER_UPDATED") {
        void loadAccess(next);
      }
    });

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      void loadAccess(data.session);
    });

    return () => sub.subscription.unsubscribe();
  }, [loadAccess]);

  const setMfa = useCallback((value: MfaSession | null) => {
    setMfaState(value);
    if (value) window.sessionStorage.setItem(MFA_KEY, JSON.stringify(value));
    else window.sessionStorage.removeItem(MFA_KEY);
  }, []);

  const loginAsDemo = useCallback(
    async (role: DemoRole) => {
      setLoading(true);
      // Only Admin demo is retained
      const mock = createMockAdminState();
      setDemoState(mock);
      window.localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(mock));
      window.sessionStorage.setItem(MFA_KEY, JSON.stringify(mock.mfa));

      const mockSession = {
        user: mock.user as unknown as Session["user"],
        access_token: "mock-admin-jwt",
        token_type: "bearer",
        expires_in: 86400,
        expires_at: Math.floor(Date.now() / 1000) + 86400,
        refresh_token: "mock-refresh",
      } as Session;

      setSession(mockSession);
      setAccess(mock.access);
      setMfaState(mock.mfa);
      setLoading(false);

      await router.navigate({ to: "/admin" });
    },
    [router],
  );

  const registerCitizen = useCallback(
    async (data: CitizenSignupData) => {
      setLoading(true);
      const userId = "cit-" + Date.now();
      const users = getStoredUsers();

      // Check if already registered
      const existing = users.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
      const newUser: StoredUser = {
        id: existing?.id || userId,
        email: data.email,
        password: data.password || "Password@123",
        role: "citizen",
        fullName: data.fullName,
        phone: data.phone,
        district: data.district,
        state: data.state,
        emergencyContact: data.emergencyContact,
        pincode: data.pincode,
        bloodGroup: data.bloodGroup,
        status: "active",
        createdAt: new Date().toISOString(),
      };

      const updatedUsers = existing
        ? users.map((u) => (u.id === existing.id ? newUser : u))
        : [newUser, ...users];
      saveStoredUsers(updatedUsers);

      // Create active citizen session immediately without admin approval
      const mfaToken: MfaSession = {
        token: `mfa-cit-${Date.now()}`,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      };

      const citizenState: DemoSessionState = {
        role: "citizen",
        user: { id: newUser.id, email: newUser.email },
        access: {
          userId: newUser.id,
          roles: ["citizen"],
          isAuthority: false,
          isAdmin: false,
          profile: {
            full_name: newUser.fullName,
            phone: newUser.phone || null,
            preferred_language: "en",
            district: newUser.district || null,
            state: newUser.state || null,
          },
          authority: null,
          requestStatus: "approved",
        },
        mfa: mfaToken,
      };

      setDemoState(citizenState);
      window.localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(citizenState));
      window.sessionStorage.setItem(MFA_KEY, JSON.stringify(mfaToken));

      const mockSession = {
        user: citizenState.user as unknown as Session["user"],
        access_token: "mock-citizen-jwt",
        token_type: "bearer",
        expires_in: 86400,
        expires_at: Math.floor(Date.now() / 1000) + 86400,
        refresh_token: "mock-refresh",
      } as Session;

      setSession(mockSession);
      setAccess(citizenState.access);
      setMfaState(mfaToken);
      setLoading(false);

      await router.navigate({ to: "/citizen" });
    },
    [router],
  );

  const registerAuthority = useCallback(async (data: AuthoritySignupData) => {
    const userId = "auth-" + Date.now();
    const users = getStoredUsers();

    const existing = users.find((u) => u.email.toLowerCase() === data.email.toLowerCase());
    const newUser: StoredUser = {
      id: existing?.id || userId,
      email: data.email,
      password: data.password || "Password@123",
      role: "authority",
      fullName: data.fullName,
      phone: data.phone,
      district: data.district || "East Khasi Hills",
      state: data.state || "Meghalaya",
      organizationName: data.organizationName,
      organizationType: data.organizationType,
      department: data.department,
      designation: data.designation,
      officerId: data.officerId,
      region: `${data.district || "NER"}, ${data.state || "Meghalaya"}`,
      status: "pending_approval", // Must be approved by Admin
      createdAt: new Date().toISOString(),
    };

    const updatedUsers = existing
      ? users.map((u) => (u.id === existing.id ? newUser : u))
      : [newUser, ...users];
    saveStoredUsers(updatedUsers);

    return {
      success: true,
      status: "pending_approval",
      message:
        "Authority registration submitted. Your account is pending administrator verification and approval before login access is granted.",
    };
  }, []);

  const loginWithCredentials = useCallback(
    async (params: {
      email: string;
      password?: string;
      role: "citizen" | "authority" | "admin";
    }) => {
      const { email, password, role } = params;
      const lower = email.trim().toLowerCase();
      const users = getStoredUsers();

      // Check Admin
      if (lower === "admin@nersafe.gov.in" || lower.includes("admin")) {
        await loginAsDemo("admin");
        return { success: true };
      }

      // Check Authority login flow
      if (role === "authority") {
        const user = users.find(
          (u) => u.email.toLowerCase() === lower && (u.role === "authority" || u.role === "admin"),
        );

        if (!user) {
          throw new Error("No authority account found with this email. Please create an account.");
        }

        if (password && user.password && user.password !== password) {
          throw new Error("Invalid password. Please verify your credentials.");
        }

        if (user.status === "pending_approval") {
          throw new Error(
            "Account Pending Administrator Approval: Your official authority credentials have been submitted and are currently awaiting review by the NER-SAFE Incident Commander.",
          );
        }

        if (user.status === "rejected") {
          throw new Error(
            `Authority Access Not Approved: Your registration was rejected by the administrator. ${user.reviewNote ? `Reason: ${user.reviewNote}` : ""}`,
          );
        }

        // Account is approved / active -> create authority session
        const mfaToken: MfaSession = {
          token: `mfa-auth-${Date.now()}`,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        };

        const authorityState: DemoSessionState = {
          role: "authority",
          user: { id: user.id, email: user.email },
          access: {
            userId: user.id,
            roles: ["authority"],
            isAuthority: true,
            isAdmin: false,
            profile: {
              full_name: user.fullName,
              phone: user.phone || null,
              preferred_language: "en",
              district: user.district || null,
              state: user.state || null,
            },
            authority: {
              organization_name: user.organizationName || "State Disaster Management Authority",
              organization_type: user.organizationType || "SDMA",
              department: user.department || "Operations",
              designation: user.designation || "Incident Officer",
              region: user.region || "NER",
              mfa_enrolled: true,
              approved_at: new Date().toISOString(),
            },
            requestStatus: "approved",
          },
          mfa: mfaToken,
        };

        setDemoState(authorityState);
        window.localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(authorityState));
        window.sessionStorage.setItem(MFA_KEY, JSON.stringify(mfaToken));

        const mockSession = {
          user: authorityState.user as unknown as Session["user"],
          access_token: "mock-auth-jwt",
          token_type: "bearer",
          expires_in: 86400,
          expires_at: Math.floor(Date.now() / 1000) + 86400,
          refresh_token: "mock-refresh",
        } as Session;

        setSession(mockSession);
        setAccess(authorityState.access);
        setMfaState(mfaToken);
        setLoading(false);

        await router.navigate({ to: "/command-center" });
        return { success: true };
      }

      // Citizen login flow
      let citizen = users.find((u) => u.email.toLowerCase() === lower && u.role === "citizen");
      if (!citizen) {
        // Auto-create active citizen if not found during sign-in
        citizen = {
          id: "cit-" + Date.now(),
          email: lower,
          password: password || "Password@123",
          role: "citizen",
          fullName: lower.split("@")[0] || "Community Member",
          phone: "+91 98765 43210",
          district: "East Khasi Hills",
          state: "Meghalaya",
          status: "active",
          createdAt: new Date().toISOString(),
        };
        saveStoredUsers([citizen, ...users]);
      } else if (password && citizen.password && citizen.password !== password) {
        throw new Error("Invalid password. Please check your credentials.");
      }

      const mfaToken: MfaSession = {
        token: `mfa-cit-${Date.now()}`,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      };

      const citizenState: DemoSessionState = {
        role: "citizen",
        user: { id: citizen.id, email: citizen.email },
        access: {
          userId: citizen.id,
          roles: ["citizen"],
          isAuthority: false,
          isAdmin: false,
          profile: {
            full_name: citizen.fullName,
            phone: citizen.phone || null,
            preferred_language: "en",
            district: citizen.district || null,
            state: citizen.state || null,
          },
          authority: null,
          requestStatus: "approved",
        },
        mfa: mfaToken,
      };

      setDemoState(citizenState);
      window.localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(citizenState));
      window.sessionStorage.setItem(MFA_KEY, JSON.stringify(mfaToken));

      const mockSession = {
        user: citizenState.user as unknown as Session["user"],
        access_token: "mock-cit-jwt",
        token_type: "bearer",
        expires_in: 86400,
        expires_at: Math.floor(Date.now() / 1000) + 86400,
        refresh_token: "mock-refresh",
      } as Session;

      setSession(mockSession);
      setAccess(citizenState.access);
      setMfaState(mfaToken);
      setLoading(false);

      await router.navigate({ to: "/citizen" });
      return { success: true };
    },
    [loginAsDemo, router],
  );

  const loginCustomUser = useCallback(
    async (userData: CustomUserData) => {
      await loginWithCredentials({
        email: userData.email,
        role:
          userData.role === "authority"
            ? "authority"
            : userData.role === "admin"
              ? "admin"
              : "citizen",
      });
    },
    [loginWithCredentials],
  );

  const deleteAccountPermanently = useCallback(
    async (targetUserId?: string) => {
      const currentId = targetUserId || demoState?.user?.id || session?.user?.id;
      const users = getStoredUsers();
      if (currentId) {
        const filtered = users.filter(
          (u) => u.id !== currentId && u.email !== session?.user?.email,
        );
        saveStoredUsers(filtered);
      }
      try {
        window.localStorage.removeItem("ner-safe-citizen-prefs");
        window.localStorage.removeItem("ner-safe-user-profile");
      } catch {
        // ignore
      }
      setDemoState(null);
      window.localStorage.removeItem(DEMO_SESSION_KEY);
      window.sessionStorage.removeItem(MFA_KEY);
      setMfaState(null);
      setSession(null);
      setAccess(null);
      await router.navigate({ to: "/auth", search: { role: "citizen" } });
    },
    [demoState, session, router],
  );

  const getRegisteredUsersList = useCallback(() => {
    return getStoredUsers();
  }, []);

  const updateAuthorityApprovalStatus = useCallback(
    (
      userIdOrEmail: string,
      status: "approved" | "rejected" | "pending_approval",
      reviewNote?: string | undefined,
    ) => {
      const users = getStoredUsers();
      const updated: StoredUser[] = users.map((u) => {
        if (u.id === userIdOrEmail || u.email.toLowerCase() === userIdOrEmail.toLowerCase()) {
          return {
            ...u,
            status,
            reviewNote: reviewNote || u.reviewNote || undefined,
          };
        }
        return u;
      });
      saveStoredUsers(updated);
    },
    [],
  );

  const getAuthorityAndCitizenCounts = useCallback(() => {
    const users = getStoredUsers();
    const authorities = users.filter((u) => u.role === "authority" || u.role === "admin");
    const pendingAuthorities = authorities.filter((u) => u.status === "pending_approval").length;
    const activeAuthorities = authorities.filter(
      (u) => u.status === "approved" || u.status === "active",
    ).length;
    const totalCitizens = users.filter((u) => u.role === "citizen").length;

    return {
      totalAuthorities: authorities.length,
      pendingAuthorities,
      activeAuthorities,
      totalCitizens,
    };
  }, []);

  const refresh = useCallback(async () => {
    if (demoState) {
      setLoading(false);
      return;
    }
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    await loadAccess(data.session);
  }, [demoState, loadAccess]);

  const signOut = useCallback(async () => {
    try {
      await recordSecurityEvent({ data: { action: "auth.signed_out" } });
    } catch {
      /* auditing must never block sign-out */
    }
    setDemoState(null);
    window.localStorage.removeItem(DEMO_SESSION_KEY);
    window.sessionStorage.removeItem(MFA_KEY);
    setMfa(null);
    await supabase.auth.signOut();
    setSession(null);
    setAccess(null);
    await router.navigate({ to: "/auth", search: {} });
  }, [router, setMfa]);

  const effectiveRole = useMemo(() => {
    if (demoState) return demoState.role;
    if (access?.isAdmin) return "admin";
    if (access?.isAuthority) return "authority";
    if (session) return "citizen";
    return null;
  }, [demoState, access, session]);

  const profileData = useMemo(() => {
    if (demoState) {
      return {
        full_name: demoState.access.profile?.full_name ?? null,
        district: demoState.access.profile?.district ?? null,
        state: demoState.access.profile?.state ?? null,
        phone: demoState.access.profile?.phone ?? null,
      };
    }
    return access?.profile
      ? {
          full_name: access.profile.full_name,
          district: access.profile.district,
          state: access.profile.state,
          phone: access.profile.phone,
        }
      : null;
  }, [demoState, access]);

  const authorityProfileData = useMemo(() => {
    if (demoState && demoState.access.authority) {
      return {
        organization: demoState.access.authority.organization_name,
        role: demoState.access.authority.designation,
      };
    }
    return access?.authority
      ? {
          organization: access.authority.organization_name,
          role: access.authority.designation,
        }
      : null;
  }, [demoState, access]);

  const value = useMemo<AuthValue>(
    () => ({
      loading,
      session,
      access,
      role: effectiveRole,
      profile: profileData,
      authorityProfile: authorityProfileData,
      isAuthority: Boolean(
        access?.isAuthority ||
        (demoState &&
          (demoState.role === "authority" ||
            demoState.role === "admin" ||
            demoState.role === "researcher")),
      ),
      isAdmin: Boolean(access?.isAdmin || demoState?.role === "admin"),
      isDemoSession: Boolean(demoState),
      mfa,
      setMfa,
      loginAsDemo,
      loginCustomUser,
      registerCitizen,
      registerAuthority,
      loginWithCredentials,
      deleteAccountPermanently,
      getRegisteredUsers: getRegisteredUsersList,
      updateAuthorityApprovalStatus,
      getAuthorityAndCitizenCounts,
      refresh,
      signOut,
    }),
    [
      loading,
      session,
      access,
      effectiveRole,
      profileData,
      authorityProfileData,
      demoState,
      mfa,
      setMfa,
      loginAsDemo,
      loginCustomUser,
      registerCitizen,
      registerAuthority,
      loginWithCredentials,
      deleteAccountPermanently,
      getRegisteredUsersList,
      updateAuthorityApprovalStatus,
      getAuthorityAndCitizenCounts,
      refresh,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
