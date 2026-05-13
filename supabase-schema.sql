CREATE TABLE scans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  nombre_comida text NOT NULL,
  calorias integer NOT NULL,
  proteinas integer NOT NULL,
  grasas integer NOT NULL,
  carbohidratos integer NOT NULL
);

-- Enable RLS but allow anon access for testing purposes
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable insert for anonymous users" ON "public"."scans" AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable read access for all users" ON "public"."scans" AS PERMISSIVE FOR SELECT TO public USING (true);
