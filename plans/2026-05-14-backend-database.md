# Backend Database Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a scalable Supabase PostgreSQL schema with `profiles`, `food_logs`, and `saved_meals` tables, including strict Row Level Security (RLS) policies.

**Architecture:** The database will use three main tables. `profiles` will store user targets. `food_logs` will store exact daily food entries (including AI confidence and exact dates). `saved_meals` will act as a personal catalog. All tables will use `auth.uid() = user_id` for RLS.

**Tech Stack:** PostgreSQL (Supabase SQL).

---

### Task 1: Update the Supabase Schema File (Profiles)

**Files:**
- Modify: `supabase-schema.sql`

- [ ] **Step 1: Write the SQL for the `profiles` table and its RLS policies**

Overwrite or append this section in `supabase-schema.sql`. (Currently it only has the `scans` table, we will replace its contents sequentially).

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users PRIMARY KEY,
  target_calories integer DEFAULT 2000,
  target_protein integer DEFAULT 150,
  target_carbs integer DEFAULT 200,
  target_fat integer DEFAULT 65,
  weight_kg numeric(5,2),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
```

- [ ] **Step 2: Commit the changes**

```bash
git add supabase-schema.sql
git commit -m "feat(db): add profiles table and RLS policies"
```

### Task 2: Update the Supabase Schema File (Food Logs)

**Files:**
- Modify: `supabase-schema.sql`

- [ ] **Step 1: Replace `scans` table with `food_logs` table definition**

If the file contains the old `scans` table, drop it and replace it with `food_logs`.

```sql
-- Drop the old scans table if it exists to cleanly migrate
DROP TABLE IF EXISTS scans;

-- Create food_logs table
CREATE TABLE IF NOT EXISTS food_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  log_date date DEFAULT current_date NOT NULL,
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
  is_ai_estimated boolean DEFAULT true
);

-- Enable RLS for food_logs
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;

-- Food Logs Policies
CREATE POLICY "Users can view their own food logs" ON food_logs
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own food logs" ON food_logs
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own food logs" ON food_logs
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
```

- [ ] **Step 2: Commit the changes**

```bash
git add supabase-schema.sql
git commit -m "feat(db): add food_logs table replacing scans with advanced macros"
```

### Task 3: Update the Supabase Schema File (Saved Meals)

**Files:**
- Modify: `supabase-schema.sql`

- [ ] **Step 1: Write the SQL for the `saved_meals` table and its RLS policies**

Append this to the bottom of `supabase-schema.sql`.

```sql
-- Create saved_meals table
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
  meal_type text CHECK (meal_type IN ('Desayuno', 'Almuerzo', 'Cena', 'Snack'))
);

-- Enable RLS for saved_meals
ALTER TABLE saved_meals ENABLE ROW LEVEL SECURITY;

-- Saved Meals Policies
CREATE POLICY "Users can view their own saved meals" ON saved_meals
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved meals" ON saved_meals
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved meals" ON saved_meals
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
```

- [ ] **Step 2: Commit the changes**

```bash
git add supabase-schema.sql
git commit -m "feat(db): add saved_meals table and RLS policies"
```