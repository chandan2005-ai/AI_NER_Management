-- ============ ROLES ============
CREATE TYPE public.app_role AS ENUM ('citizen', 'authority', 'admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_approved_authority(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('authority', 'admin')
  )
$$;

CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ SHARED TIMESTAMP TRIGGER ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  preferred_language text NOT NULL DEFAULT 'en',
  district text,
  state text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own profile" ON public.profiles
  FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins read profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- New signups get a profile and the least-privileged role.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, preferred_language, district, state)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'phone',
    COALESCE(NEW.raw_user_meta_data ->> 'preferred_language', 'en'),
    NEW.raw_user_meta_data ->> 'district',
    NEW.raw_user_meta_data ->> 'state'
  ) ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'citizen') ON CONFLICT DO NOTHING;
  INSERT INTO public.citizen_alert_prefs (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

-- ============ CITIZEN ALERT PREFERENCES ============
CREATE TABLE public.citizen_alert_prefs (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  sms_enabled boolean NOT NULL DEFAULT false,
  push_enabled boolean NOT NULL DEFAULT false,
  in_app_enabled boolean NOT NULL DEFAULT true,
  phone_number text,
  phone_verified boolean NOT NULL DEFAULT false,
  level_critical boolean NOT NULL DEFAULT true,
  level_very_high boolean NOT NULL DEFAULT true,
  level_area boolean NOT NULL DEFAULT true,
  level_general boolean NOT NULL DEFAULT false,
  location_consent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.citizen_alert_prefs TO authenticated;
GRANT ALL ON public.citizen_alert_prefs TO service_role;
ALTER TABLE public.citizen_alert_prefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own alert prefs" ON public.citizen_alert_prefs
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER citizen_alert_prefs_updated_at BEFORE UPDATE ON public.citizen_alert_prefs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ AUTHORITY ACCESS REQUESTS ============
CREATE TYPE public.authority_org_type AS ENUM (
  'state_disaster_management_authority',
  'district_disaster_management_authority',
  'police',
  'fire_and_emergency_services',
  'public_works_department',
  'government_administration',
  'authorized_research_institution'
);
CREATE TYPE public.request_status AS ENUM ('pending', 'organization_verified', 'approved', 'rejected');

CREATE TABLE public.authority_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  official_email text NOT NULL,
  organization_type public.authority_org_type NOT NULL,
  organization_name text NOT NULL,
  department text,
  designation text NOT NULL,
  region text NOT NULL,
  contact_number text,
  status public.request_status NOT NULL DEFAULT 'pending',
  review_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.authority_requests TO authenticated;
GRANT UPDATE, DELETE ON public.authority_requests TO authenticated;
GRANT ALL ON public.authority_requests TO service_role;
ALTER TABLE public.authority_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own request" ON public.authority_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Create own request" ON public.authority_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Admins read requests" ON public.authority_requests
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins review requests" ON public.authority_requests
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER authority_requests_updated_at BEFORE UPDATE ON public.authority_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ AUTHORITY PROFILES ============
CREATE TABLE public.authority_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_type public.authority_org_type NOT NULL,
  organization_name text NOT NULL,
  department text,
  designation text NOT NULL,
  region text NOT NULL,
  mfa_enrolled boolean NOT NULL DEFAULT false,
  approved_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.authority_profiles TO authenticated;
GRANT ALL ON public.authority_profiles TO service_role;
ALTER TABLE public.authority_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own authority profile" ON public.authority_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Update own mfa state" ON public.authority_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage authority profiles" ON public.authority_profiles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER authority_profiles_updated_at BEFORE UPDATE ON public.authority_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ HAZARD REPORTS ============
CREATE TABLE public.hazard_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hazard_type text NOT NULL,
  severity text NOT NULL DEFAULT 'MEDIUM',
  description text NOT NULL,
  photo_url text,
  lat double precision,
  lng double precision,
  district text,
  state text,
  location_attached boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'OPEN',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hazard_reports TO authenticated;
GRANT ALL ON public.hazard_reports TO service_role;
ALTER TABLE public.hazard_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Citizens manage own reports" ON public.hazard_reports
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Authorities read all reports" ON public.hazard_reports
  FOR SELECT TO authenticated USING (public.is_approved_authority(auth.uid()));
CREATE POLICY "Authorities triage reports" ON public.hazard_reports
  FOR UPDATE TO authenticated
  USING (public.is_approved_authority(auth.uid()))
  WITH CHECK (public.is_approved_authority(auth.uid()));
CREATE TRIGGER hazard_reports_updated_at BEFORE UPDATE ON public.hazard_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ OFFICIAL ALERTS ============
CREATE TYPE public.alert_level AS ENUM ('information', 'watch', 'warning', 'critical');
CREATE TYPE public.alert_status AS ENUM ('draft', 'queued', 'sent', 'failed');

CREATE TABLE public.official_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level public.alert_level NOT NULL,
  target_state text,
  target_district text,
  target_zone text,
  headline text NOT NULL,
  message text NOT NULL,
  safety_guidance text,
  status public.alert_status NOT NULL DEFAULT 'draft',
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sent_at timestamptz,
  recipients_total integer NOT NULL DEFAULT 0,
  delivered_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  mfa_confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.official_alerts TO authenticated;
GRANT ALL ON public.official_alerts TO service_role;
ALTER TABLE public.official_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone signed in reads sent alerts" ON public.official_alerts
  FOR SELECT TO authenticated USING (status = 'sent');
CREATE POLICY "Authorities read all alerts" ON public.official_alerts
  FOR SELECT TO authenticated USING (public.is_approved_authority(auth.uid()));
CREATE POLICY "Authorities create alerts" ON public.official_alerts
  FOR INSERT TO authenticated
  WITH CHECK (public.is_approved_authority(auth.uid()) AND auth.uid() = created_by);
CREATE POLICY "Authorities update own alerts" ON public.official_alerts
  FOR UPDATE TO authenticated
  USING (public.is_approved_authority(auth.uid()))
  WITH CHECK (public.is_approved_authority(auth.uid()));
CREATE TRIGGER official_alerts_updated_at BEFORE UPDATE ON public.official_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ ALERT DELIVERIES ============
CREATE TABLE public.alert_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id uuid NOT NULL REFERENCES public.official_alerts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  channel text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  provider text,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.alert_deliveries TO authenticated;
GRANT ALL ON public.alert_deliveries TO service_role;
ALTER TABLE public.alert_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own deliveries" ON public.alert_deliveries
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authorities read deliveries" ON public.alert_deliveries
  FOR SELECT TO authenticated USING (public.is_approved_authority(auth.uid()));
CREATE TRIGGER alert_deliveries_updated_at BEFORE UPDATE ON public.alert_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ AUDIT LOG ============
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_label text,
  action text NOT NULL,
  detail text,
  severity text NOT NULL DEFAULT 'info',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authorities read audit log" ON public.audit_logs
  FOR SELECT TO authenticated USING (public.is_approved_authority(auth.uid()));
CREATE INDEX audit_logs_created_at_idx ON public.audit_logs (created_at DESC);
CREATE INDEX hazard_reports_user_idx ON public.hazard_reports (user_id, created_at DESC);
CREATE INDEX official_alerts_sent_idx ON public.official_alerts (status, sent_at DESC);