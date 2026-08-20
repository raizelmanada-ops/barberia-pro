-- =============================================================================
-- BARBERIA_PRO - Schema de Base de Datos Multi-Tenant & Row Level Security (RLS)
-- Migración Inicial: PostgreSQL + Supabase
-- =============================================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. TABLA: subscription_plans (Catálogo SaaS de Planes Comerciales)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    tagline VARCHAR(255) NOT NULL,
    price_cop NUMERIC(12, 2) NOT NULL DEFAULT 0,
    billing_period VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'annual')),
    max_barbers INTEGER NOT NULL DEFAULT 3,
    max_services INTEGER NOT NULL DEFAULT 15,
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_popular BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 2. TABLA: businesses (Tenants / Barberías)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.businesses (
    id VARCHAR(50) PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    slogan VARCHAR(255) DEFAULT '',
    logo_url TEXT NOT NULL,
    banner_url TEXT,
    business_type VARCHAR(50) NOT NULL DEFAULT 'barbershop' CHECK (business_type IN ('barbershop', 'salon', 'unisex', 'studio', 'spa')),
    enabled_categories JSONB NOT NULL DEFAULT '["Corte Clásico", "Barba & Perfilado", "Combos"]'::jsonb,
    address TEXT NOT NULL DEFAULT 'Pendiente de configuración',
    city VARCHAR(100) NOT NULL DEFAULT 'Bogotá',
    neighborhood VARCHAR(100) DEFAULT 'Pendiente de confirmación',
    phone VARCHAR(30) NOT NULL DEFAULT '',
    whatsapp VARCHAR(30) NOT NULL DEFAULT '',
    instagram_url TEXT DEFAULT '',
    owner_name VARCHAR(150),
    owner_email VARCHAR(150),
    owner_phone VARCHAR(30),
    theme JSONB NOT NULL DEFAULT '{
        "primary": "#eab308",
        "primaryHover": "#ca8a04",
        "primaryLight": "rgba(234, 179, 8, 0.15)",
        "accent": "#fbbf24",
        "surface": "#09090b",
        "surfaceCard": "#18181b",
        "border": "#27272a",
        "radius": "14px",
        "fontHeading": "Outfit",
        "fontBody": "Plus Jakarta Sans"
    }'::jsonb,
    schedules JSONB NOT NULL DEFAULT '[
        {"dayOfWeek": 1, "openTime": "08:00", "closeTime": "20:00", "isOpen": true},
        {"dayOfWeek": 2, "openTime": "08:00", "closeTime": "20:00", "isOpen": true},
        {"dayOfWeek": 3, "openTime": "08:00", "closeTime": "20:00", "isOpen": true},
        {"dayOfWeek": 4, "openTime": "08:00", "closeTime": "20:00", "isOpen": true},
        {"dayOfWeek": 5, "openTime": "08:00", "closeTime": "21:00", "isOpen": true},
        {"dayOfWeek": 6, "openTime": "08:00", "closeTime": "21:00", "isOpen": true},
        {"dayOfWeek": 0, "openTime": "09:00", "closeTime": "18:00", "isOpen": true}
    ]'::jsonb,
    loyalty JSONB NOT NULL DEFAULT '{
        "type": "stamps",
        "stampsThreshold": 8,
        "rewardDescription": "1 Servicio de cortesía",
        "pointsPerPeso": 0,
        "birthdayDiscountPercent": 20
    }'::jsonb,
    subscription JSONB NOT NULL DEFAULT '{
        "status": "trial_active",
        "planId": "plan_pro",
        "trialStartedAt": "2026-08-18T10:00:00Z",
        "trialEndsAt": "2026-08-25T10:00:00Z",
        "currentPeriodEnd": "2026-08-25T10:00:00Z",
        "cancelAtPeriodEnd": false
    }'::jsonb,
    is_verified BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 3. TABLA: users (Usuarios del Sistema)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) REFERENCES public.businesses(id) ON DELETE CASCADE,
    role VARCHAR(30) NOT NULL CHECK (role IN ('superadmin', 'owner', 'manager', 'barber', 'client')),
    roles JSONB NOT NULL DEFAULT '["client"]'::jsonb,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(150),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 4. TABLA: business_memberships (Membresías Multi-Rol por Tenant)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.business_memberships (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    business_id VARCHAR(50) NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    roles JSONB NOT NULL DEFAULT '["client"]'::jsonb,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, business_id)
);

-- -----------------------------------------------------------------------------
-- 5. TABLA: clients (Registro de Clientes por Tenant)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clients (
    id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    birthday DATE,
    notes TEXT,
    loyalty_stamps INTEGER NOT NULL DEFAULT 0,
    loyalty_points INTEGER NOT NULL DEFAULT 0,
    rewards_available INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clients_business_phone ON public.clients(business_id, phone);

-- -----------------------------------------------------------------------------
-- 6. TABLA: services (Catálogo de Servicios por Tenant)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.services (
    id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT DEFAULT '',
    category VARCHAR(50) NOT NULL DEFAULT 'Caballero',
    price_cop NUMERIC(10, 2) NOT NULL DEFAULT 0,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    image_url TEXT,
    is_popular BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_business_active ON public.services(business_id, is_active);

-- -----------------------------------------------------------------------------
-- 7. TABLA: barber_profiles (Perfiles de Profesionales por Tenant)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.barber_profiles (
    id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id VARCHAR(50) REFERENCES public.users(id) ON DELETE SET NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    avatar_url TEXT,
    specialties JSONB NOT NULL DEFAULT '["Fade clásico", "Barba esculpida"]'::jsonb,
    bio TEXT,
    rating_average NUMERIC(3, 2) NOT NULL DEFAULT 5.0,
    happy_clients_pct INTEGER NOT NULL DEFAULT 100,
    total_cuts_completed INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_barber_business ON public.barber_profiles(business_id);

-- -----------------------------------------------------------------------------
-- 8. TABLA: appointments (Citas y Turnos Agendados)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.appointments (
    id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    client_id VARCHAR(50) NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    client_name VARCHAR(150) NOT NULL,
    client_phone VARCHAR(30) NOT NULL,
    barber_id VARCHAR(50) NOT NULL REFERENCES public.barber_profiles(id) ON DELETE CASCADE,
    barber_name VARCHAR(150) NOT NULL,
    service_id VARCHAR(50) NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    service_name VARCHAR(150) NOT NULL,
    price_cop NUMERIC(10, 2) NOT NULL DEFAULT 0,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    booking_mode VARCHAR(30) NOT NULL DEFAULT 'standard' CHECK (booking_mode IN ('repeat_style', 'try_on_reference', 'standard')),
    style_memory_id VARCHAR(50),
    client_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_business_date ON public.appointments(business_id, date);

-- -----------------------------------------------------------------------------
-- 9. TABLA: style_memories (Memoria Visual y Fórmula de Corte)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.style_memories (
    id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    client_id VARCHAR(50) NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    barber_id VARCHAR(50) NOT NULL REFERENCES public.barber_profiles(id) ON DELETE CASCADE,
    appointment_id VARCHAR(50),
    photo_url TEXT NOT NULL,
    photo_angle VARCHAR(20) DEFAULT 'front',
    liked_aspects JSONB NOT NULL DEFAULT '[]'::jsonb,
    keep_aspects JSONB NOT NULL DEFAULT '[]'::jsonb,
    change_aspects JSONB NOT NULL DEFAULT '[]'::jsonb,
    technical_formula TEXT NOT NULL,
    customer_remarks TEXT,
    consent_photo_granted BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_style_memories_client ON public.style_memories(business_id, client_id);

-- -----------------------------------------------------------------------------
-- 10. TABLA: photo_consents (Registro Legal de Consentimiento Habeas Data)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.photo_consents (
    id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    client_id VARCHAR(50) NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    style_memory_id VARCHAR(50) REFERENCES public.style_memories(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'granted' CHECK (status IN ('granted', 'not_granted', 'revoked')),
    version VARCHAR(50) NOT NULL DEFAULT 'v1.0-co-habeas-data',
    source VARCHAR(50) NOT NULL DEFAULT 'barber_chair',
    given_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 11. TABLA: feedbacks (Sensor Multidimensional de Calidad)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feedbacks (
    id VARCHAR(50) PRIMARY KEY,
    business_id VARCHAR(50) NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    appointment_id VARCHAR(50),
    client_id VARCHAR(50) NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    barber_id VARCHAR(50) NOT NULL REFERENCES public.barber_profiles(id) ON DELETE CASCADE,
    rating_cut INTEGER NOT NULL CHECK (rating_cut BETWEEN 1 AND 5),
    rating_attention INTEGER NOT NULL CHECK (rating_attention BETWEEN 1 AND 5),
    rating_listening INTEGER NOT NULL CHECK (rating_listening BETWEEN 1 AND 5),
    rating_wait_time INTEGER NOT NULL CHECK (rating_wait_time BETWEEN 1 AND 5),
    rating_overall INTEGER NOT NULL CHECK (rating_overall BETWEEN 1 AND 5),
    liked_most_comment TEXT,
    improve_next_time_comment TEXT,
    is_private BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedbacks_business ON public.feedbacks(business_id);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) - SEGURIDAD ESTRICTA MULTI-TENANT
-- =============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barber_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.style_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- FUNCIONES AUXILIARES DE AUTENTICACIÓN & RLS
-- -----------------------------------------------------------------------------

-- Obtener el business_id del JWT claim del usuario autenticado
CREATE OR REPLACE FUNCTION auth.current_business_id() 
RETURNS VARCHAR AS $$
BEGIN
    RETURN COALESCE(
        current_setting('request.jwt.claim.business_id', true),
        (current_setting('request.jwt.claims', true)::jsonb ->> 'business_id')
    );
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Verificar si el usuario es SuperAdmin
CREATE OR REPLACE FUNCTION auth.is_superadmin() 
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        current_setting('request.jwt.claim.role', true) = 'superadmin' OR
        (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'superadmin' OR
        auth.current_business_id() = 'global'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- -----------------------------------------------------------------------------
-- POLÍTICAS RLS POR TABLA
-- -----------------------------------------------------------------------------

-- 1. subscription_plans: Lectura pública, escritura solo superadmin
CREATE POLICY "Lectura pública de planes" ON public.subscription_plans
    FOR SELECT USING (true);

CREATE POLICY "Solo superadmin modifica planes" ON public.subscription_plans
    FOR ALL USING (auth.is_superadmin());

-- 2. businesses: Lectura pública por slug, escritura aislada por tenant o superadmin
CREATE POLICY "Lectura pública de negocios por slug" ON public.businesses
    FOR SELECT USING (true);

CREATE POLICY "Owner o SuperAdmin modifica su negocio" ON public.businesses
    FOR UPDATE USING (
        id = auth.current_business_id() OR auth.is_superadmin()
    );

CREATE POLICY "Solo SuperAdmin crea nuevos tenants" ON public.businesses
    FOR INSERT WITH CHECK (auth.is_superadmin());

-- 3. services: Lectura pública por tenant, modificación solo personal del tenant
CREATE POLICY "Lectura de servicios del tenant" ON public.services
    FOR SELECT USING (
        business_id = auth.current_business_id() OR auth.is_superadmin() OR is_active = true
    );

CREATE POLICY "Modificación de servicios por staff del tenant" ON public.services
    FOR ALL USING (
        business_id = auth.current_business_id() OR auth.is_superadmin()
    );

-- 4. clients: Aislamiento estricto por tenant
CREATE POLICY "Aislamiento estricto de clientes" ON public.clients
    FOR ALL USING (
        business_id = auth.current_business_id() OR auth.is_superadmin()
    );

-- 5. barber_profiles: Lectura de equipo del tenant, modificación por staff
CREATE POLICY "Lectura de barberos del tenant" ON public.barber_profiles
    FOR SELECT USING (
        business_id = auth.current_business_id() OR auth.is_superadmin() OR is_active = true
    );

CREATE POLICY "Modificación de barberos por staff del tenant" ON public.barber_profiles
    FOR ALL USING (
        business_id = auth.current_business_id() OR auth.is_superadmin()
    );

-- 6. appointments: Aislamiento estricto de citas
CREATE POLICY "Aislamiento estricto de citas" ON public.appointments
    FOR ALL USING (
        business_id = auth.current_business_id() OR auth.is_superadmin()
    );

-- 7. style_memories: Aislamiento confidencial por tenant y cliente
CREATE POLICY "Aislamiento confidencial de memorias de estilo" ON public.style_memories
    FOR ALL USING (
        business_id = auth.current_business_id() OR auth.is_superadmin()
    );

-- 8. photo_consents: Aislamiento legal por tenant
CREATE POLICY "Aislamiento legal de consentimientos" ON public.photo_consents
    FOR ALL USING (
        business_id = auth.current_business_id() OR auth.is_superadmin()
    );

-- 9. feedbacks: Aislamiento de diagnósticos por tenant
CREATE POLICY "Aislamiento de diagnósticos y feedbacks" ON public.feedbacks
    FOR ALL USING (
        business_id = auth.current_business_id() OR auth.is_superadmin()
    );
