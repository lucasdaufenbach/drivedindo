-- ============================================================
-- Migration 001: Schema inicial do DriveDindo
-- ============================================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  avatar_url  TEXT,
  phone       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: read own"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles: update own"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Trigger: atualiza updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- VEHICLES
-- ============================================================
CREATE TABLE public.vehicles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  plate        TEXT NOT NULL,
  model        TEXT,
  year         INT CHECK (year BETWEEN 1950 AND 2100),
  color        TEXT,
  current_km   NUMERIC(10,1) NOT NULL DEFAULT 0 CHECK (current_km >= 0),
  created_by   UUID NOT NULL REFERENCES profiles(id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicles_created_by ON vehicles(created_by);

CREATE TRIGGER trg_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- VEHICLE_USERS
-- ============================================================
CREATE TYPE vehicle_role AS ENUM ('owner', 'member');

CREATE TABLE public.vehicle_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id  UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role        vehicle_role NOT NULL DEFAULT 'member',
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  is_active   BOOLEAN DEFAULT TRUE,
  UNIQUE(vehicle_id, user_id)
);

CREATE INDEX idx_vehicle_users_vehicle ON vehicle_users(vehicle_id);
CREATE INDEX idx_vehicle_users_user ON vehicle_users(user_id);

-- ============================================================
-- TRIPS
-- ============================================================
CREATE TABLE public.trips (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id   UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES profiles(id),
  km_start     NUMERIC(10,1) NOT NULL CHECK (km_start >= 0),
  km_end       NUMERIC(10,1) CHECK (km_end > km_start),
  km_driven    NUMERIC(10,1) GENERATED ALWAYS AS (
                 CASE WHEN km_end IS NOT NULL THEN km_end - km_start ELSE NULL END
               ) STORED,
  started_at   TIMESTAMPTZ DEFAULT NOW(),
  ended_at     TIMESTAMPTZ,
  notes        TEXT,
  status       TEXT NOT NULL DEFAULT 'open'
                CHECK (status IN ('open', 'closed')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trips_vehicle ON trips(vehicle_id);
CREATE INDEX idx_trips_user ON trips(user_id);
CREATE INDEX idx_trips_vehicle_status ON trips(vehicle_id, status);
CREATE INDEX idx_trips_started_at ON trips(vehicle_id, started_at DESC);

-- Trigger: atualiza current_km do veículo ao fechar viagem
CREATE OR REPLACE FUNCTION update_vehicle_km()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'closed' AND NEW.km_end IS NOT NULL THEN
    UPDATE vehicles
    SET current_km = NEW.km_end,
        updated_at = NOW()
    WHERE id = NEW.vehicle_id
      AND current_km < NEW.km_end;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_vehicle_km
  AFTER UPDATE ON trips
  FOR EACH ROW
  WHEN (OLD.status = 'open' AND NEW.status = 'closed')
  EXECUTE FUNCTION update_vehicle_km();

-- ============================================================
-- PENDING_KM
-- ============================================================
CREATE TABLE public.pending_km (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id      UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  km_start        NUMERIC(10,1) NOT NULL,
  km_end          NUMERIC(10,1) NOT NULL,
  km_gap          NUMERIC(10,1) GENERATED ALWAYS AS (km_end - km_start) STORED,
  detected_at     TIMESTAMPTZ DEFAULT NOW(),
  resolved_at     TIMESTAMPTZ,
  resolved_by     UUID REFERENCES profiles(id),
  resolution_type TEXT CHECK (
                    resolution_type IN (
                      'assigned_to_user', 'split_equally',
                      'assigned_to_trip', 'ignored'
                    )
                  ),
  trip_id         UUID REFERENCES trips(id),
  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'resolved'))
);

CREATE INDEX idx_pending_km_vehicle ON pending_km(vehicle_id, status);

-- ============================================================
-- EXPENSE_CATEGORIES
-- ============================================================
CREATE TABLE public.expense_categories (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  icon         TEXT,
  color        TEXT,
  is_recurrent BOOLEAN DEFAULT FALSE
);

INSERT INTO expense_categories (name, icon, color, is_recurrent) VALUES
  ('Combustível',   'fuel',        '#F97316', false),
  ('Seguro',        'shield',      '#3B82F6', true),
  ('Manutenção',    'wrench',      '#8B5CF6', false),
  ('Troca de Óleo', 'droplets',    '#10B981', false),
  ('Pneus',         'circle',      '#6B7280', false),
  ('IPVA',          'file-text',   '#EF4444', true),
  ('Licenciamento', 'clipboard',   '#F59E0B', true),
  ('Outros',        'more-horizontal', '#9CA3AF', false);

-- ============================================================
-- EXPENSES
-- ============================================================
CREATE TABLE public.expenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id      UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  category_id     UUID REFERENCES expense_categories(id),
  paid_by         UUID NOT NULL REFERENCES profiles(id),
  amount          NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  description     TEXT,
  receipt_url     TEXT,
  expense_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  period_start    DATE,
  period_end      DATE,
  is_recurrent    BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expenses_vehicle ON expenses(vehicle_id);
CREATE INDEX idx_expenses_paid_by ON expenses(paid_by);
CREATE INDEX idx_expenses_date ON expenses(vehicle_id, expense_date DESC);

-- ============================================================
-- EXPENSE_PARTICIPANTS
-- ============================================================
CREATE TABLE public.expense_participants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id  UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id),
  percentage  NUMERIC(5,2) NOT NULL CHECK (percentage > 0 AND percentage <= 100),
  amount_owed NUMERIC(12,2) NOT NULL CHECK (amount_owed >= 0),
  UNIQUE(expense_id, user_id)
);

CREATE INDEX idx_expense_participants_expense ON expense_participants(expense_id);
CREATE INDEX idx_expense_participants_user ON expense_participants(user_id);

-- ============================================================
-- SETTLEMENTS
-- ============================================================
CREATE TABLE public.settlements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id  UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  paid_by     UUID NOT NULL REFERENCES profiles(id),
  paid_to     UUID NOT NULL REFERENCES profiles(id),
  amount      NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  notes       TEXT,
  settled_at  TIMESTAMPTZ DEFAULT NOW(),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  CHECK (paid_by <> paid_to)
);

CREATE INDEX idx_settlements_vehicle ON settlements(vehicle_id);

-- ============================================================
-- MONTHLY_CLOSINGS
-- ============================================================
CREATE TABLE public.monthly_closings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id      UUID NOT NULL REFERENCES vehicles(id),
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  total_km        NUMERIC(10,1) NOT NULL,
  total_expenses  NUMERIC(12,2) NOT NULL,
  snapshot        JSONB NOT NULL,
  closed_by       UUID REFERENCES profiles(id),
  closed_at       TIMESTAMPTZ DEFAULT NOW(),
  CHECK (period_end > period_start)
);

-- ============================================================
-- RLS — VEHICLES
-- ============================================================
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vehicles: members can read"
  ON vehicles FOR SELECT
  USING (
    id IN (
      SELECT vehicle_id FROM vehicle_users
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "vehicles: owner can update"
  ON vehicles FOR UPDATE
  USING (
    id IN (
      SELECT vehicle_id FROM vehicle_users
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "vehicles: authenticated can insert"
  ON vehicles FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- ============================================================
-- RLS — VEHICLE_USERS
-- ============================================================
ALTER TABLE vehicle_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vehicle_users: members can read"
  ON vehicle_users FOR SELECT
  USING (
    vehicle_id IN (
      SELECT vehicle_id FROM vehicle_users vu2
      WHERE vu2.user_id = auth.uid() AND vu2.is_active = TRUE
    )
  );

CREATE POLICY "vehicle_users: owner can insert"
  ON vehicle_users FOR INSERT
  WITH CHECK (
    vehicle_id IN (
      SELECT vehicle_id FROM vehicle_users vu2
      WHERE vu2.user_id = auth.uid() AND vu2.role = 'owner'
    )
    OR user_id = auth.uid()  -- permite auto-adesão por código
  );

-- ============================================================
-- RLS — TRIPS
-- ============================================================
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trips: members can read"
  ON trips FOR SELECT
  USING (
    vehicle_id IN (
      SELECT vehicle_id FROM vehicle_users
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "trips: insert own trips only"
  ON trips FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    vehicle_id IN (
      SELECT vehicle_id FROM vehicle_users
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "trips: update own open trips"
  ON trips FOR UPDATE
  USING (
    user_id = auth.uid() AND status = 'open'
  );

-- ============================================================
-- RLS — EXPENSES
-- ============================================================
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses: members can read"
  ON expenses FOR SELECT
  USING (
    vehicle_id IN (
      SELECT vehicle_id FROM vehicle_users
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "expenses: members can insert"
  ON expenses FOR INSERT
  WITH CHECK (
    paid_by = auth.uid() AND
    vehicle_id IN (
      SELECT vehicle_id FROM vehicle_users
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

-- ============================================================
-- RLS — EXPENSE_PARTICIPANTS
-- ============================================================
ALTER TABLE expense_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expense_participants: read via expense"
  ON expense_participants FOR SELECT
  USING (
    expense_id IN (
      SELECT e.id FROM expenses e
      JOIN vehicle_users vu ON e.vehicle_id = vu.vehicle_id
      WHERE vu.user_id = auth.uid() AND vu.is_active = TRUE
    )
  );

CREATE POLICY "expense_participants: insert via expense"
  ON expense_participants FOR INSERT
  WITH CHECK (
    expense_id IN (
      SELECT e.id FROM expenses e
      JOIN vehicle_users vu ON e.vehicle_id = vu.vehicle_id
      WHERE vu.user_id = auth.uid() AND vu.is_active = TRUE
    )
  );

-- ============================================================
-- RLS — PENDING_KM
-- ============================================================
ALTER TABLE pending_km ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pending_km: members can read"
  ON pending_km FOR SELECT
  USING (
    vehicle_id IN (
      SELECT vehicle_id FROM vehicle_users
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

-- ============================================================
-- RLS — SETTLEMENTS
-- ============================================================
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "settlements: members can read"
  ON settlements FOR SELECT
  USING (
    vehicle_id IN (
      SELECT vehicle_id FROM vehicle_users
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

CREATE POLICY "settlements: insert own"
  ON settlements FOR INSERT
  WITH CHECK (paid_by = auth.uid());
