-- ============================================
-- FitnessLAB — full schema (state of 2026-05-15)
-- ============================================
-- This file reflects the complete schema currently in production
-- (initial schema + migration 1 + migration 2 + timezone fix).
-- Safe to re-run idempotently.
-- ============================================

-- ============================================
-- PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users PRIMARY KEY,
  display_name text,
  avatar_url text,
  target_calories integer DEFAULT 2000,
  target_protein integer DEFAULT 150,
  target_carbs integer DEFAULT 200,
  target_fat integer DEFAULT 65,
  weight_kg numeric(5,2),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- ============================================
-- FOOD_LOGS
-- ============================================
DROP TABLE IF EXISTS scans;

CREATE TABLE IF NOT EXISTS food_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  log_date date DEFAULT (timezone('Europe/Madrid', now()))::date NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  food_name text NOT NULL,
  calories integer NOT NULL,
  protein integer NOT NULL,
  fat integer NOT NULL,
  carbs integer NOT NULL,
  fiber integer NOT NULL DEFAULT 0,
  sugar integer NOT NULL DEFAULT 0,
  meal_type text CHECK (meal_type IN ('Desayuno', 'Almuerzo', 'Cena', 'Snack')),
  image_url text,
  is_ai_estimated boolean DEFAULT true,
  notes text
);

ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own food logs" ON food_logs;
CREATE POLICY "Users can view their own food logs" ON food_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own food logs" ON food_logs;
CREATE POLICY "Users can insert their own food logs" ON food_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own food logs" ON food_logs;
CREATE POLICY "Users can update their own food logs" ON food_logs
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own food logs" ON food_logs;
CREATE POLICY "Users can delete their own food logs" ON food_logs
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- SAVED_MEALS
-- ============================================
CREATE TABLE IF NOT EXISTS saved_meals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  meal_name text NOT NULL,
  calories integer NOT NULL,
  protein integer NOT NULL,
  fat integer NOT NULL,
  carbs integer NOT NULL,
  fiber integer NOT NULL DEFAULT 0,
  sugar integer NOT NULL DEFAULT 0,
  meal_type text CHECK (meal_type IN ('Desayuno', 'Almuerzo', 'Cena', 'Snack')),
  times_used integer DEFAULT 0 NOT NULL,
  last_used_at timestamp with time zone
);

ALTER TABLE saved_meals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own saved meals" ON saved_meals;
CREATE POLICY "Users can view their own saved meals" ON saved_meals
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own saved meals" ON saved_meals;
CREATE POLICY "Users can insert their own saved meals" ON saved_meals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own saved meals" ON saved_meals;
CREATE POLICY "Users can update their own saved meals" ON saved_meals
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own saved meals" ON saved_meals;
CREATE POLICY "Users can delete their own saved meals" ON saved_meals
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- WEIGHT_LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS weight_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  weight_kg numeric(5,2) NOT NULL,
  log_date date DEFAULT current_date NOT NULL,
  logged_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  notes text
);

ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own weight logs" ON weight_logs;
CREATE POLICY "Users can view their own weight logs" ON weight_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own weight logs" ON weight_logs;
CREATE POLICY "Users can insert their own weight logs" ON weight_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own weight logs" ON weight_logs;
CREATE POLICY "Users can update their own weight logs" ON weight_logs
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own weight logs" ON weight_logs;
CREATE POLICY "Users can delete their own weight logs" ON weight_logs
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- Populates display_name / avatar_url from OAuth metadata (Google)
-- or falls back to email prefix.
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    COALESCE(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- USE_SAVED_MEAL — bump usage counter
-- ============================================
CREATE OR REPLACE FUNCTION public.use_saved_meal(meal_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE saved_meals
  SET times_used = times_used + 1,
      last_used_at = now()
  WHERE id = meal_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- DAILY_TOTALS view (RLS-respecting via security_invoker)
-- ============================================
CREATE OR REPLACE VIEW daily_totals
WITH (security_invoker = true) AS
SELECT
  user_id,
  log_date,
  COUNT(*)::integer            AS entries,
  SUM(calories)::integer       AS calories,
  SUM(protein)::integer        AS protein,
  SUM(fat)::integer            AS fat,
  SUM(carbs)::integer          AS carbs,
  SUM(fiber)::integer          AS fiber,
  SUM(sugar)::integer          AS sugar
FROM food_logs
GROUP BY user_id, log_date;

-- ============================================
-- GET_USER_STREAK — consecutive days with at least one log
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_streak(user_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  streak integer := 0;
  check_date date;
BEGIN
  IF EXISTS (SELECT 1 FROM food_logs WHERE user_id = user_uuid AND log_date = current_date) THEN
    check_date := current_date;
  ELSE
    check_date := current_date - interval '1 day';
  END IF;

  WHILE EXISTS (SELECT 1 FROM food_logs WHERE user_id = user_uuid AND log_date = check_date) LOOP
    streak := streak + 1;
    check_date := check_date - interval '1 day';
  END LOOP;

  RETURN streak;
END;
$$;

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_food_logs_user_date    ON food_logs    (user_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_food_logs_user_created ON food_logs    (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_meals_user       ON saved_meals  (user_id);
CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date  ON weight_logs  (user_id, log_date DESC);

-- ============================================
-- STORAGE BUCKET — food photos (private per user)
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('food-photos', 'food-photos', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can upload their own food photos" ON storage.objects;
CREATE POLICY "Users can upload their own food photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'food-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can view their own food photos" ON storage.objects;
CREATE POLICY "Users can view their own food photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'food-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete their own food photos" ON storage.objects;
CREATE POLICY "Users can delete their own food photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'food-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
