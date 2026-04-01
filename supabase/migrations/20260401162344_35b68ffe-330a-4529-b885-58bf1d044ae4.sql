
CREATE TABLE public.sensor_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL DEFAULT 'ESP32-001',
  soil_moisture NUMERIC,
  temperature NUMERIC,
  humidity NUMERIC,
  water_level NUMERIC,
  air_quality NUMERIC,
  flame_detected NUMERIC DEFAULT 0,
  smoke_level NUMERIC DEFAULT 0,
  ldr_value NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts for ESP32"
  ON public.sensor_readings
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow authenticated reads"
  ON public.sensor_readings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow anon reads"
  ON public.sensor_readings
  FOR SELECT
  TO anon
  USING (true);
