
CREATE TABLE public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('fire', 'water', 'temperature', 'air', 'smoke')),
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message text NOT NULL,
  device_id text NOT NULL DEFAULT 'ESP32-001',
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon reads on alerts" ON public.alerts FOR SELECT TO anon USING (true);
CREATE POLICY "Allow authenticated reads on alerts" ON public.alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated update alerts" ON public.alerts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Function to auto-generate alerts from sensor readings
CREATE OR REPLACE FUNCTION public.generate_alerts_from_reading()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Flame detected
  IF NEW.flame_detected > 0 THEN
    INSERT INTO public.alerts (type, severity, message, device_id)
    VALUES ('fire', 'critical', 'Sensor de chamas ativado — Intensidade: ' || NEW.flame_detected, NEW.device_id);
  END IF;

  -- High smoke
  IF NEW.smoke_level > 200 THEN
    INSERT INTO public.alerts (type, severity, message, device_id)
    VALUES ('smoke', 'high', 'Fumaça em nível elevado: ' || NEW.smoke_level || ' ppm', NEW.device_id);
  END IF;

  -- Critical temperature
  IF NEW.temperature >= 40 THEN
    INSERT INTO public.alerts (type, severity, message, device_id)
    VALUES ('temperature', 'critical', 'Temperatura crítica: ' || NEW.temperature || '°C', NEW.device_id);
  ELSIF NEW.temperature >= 35 THEN
    INSERT INTO public.alerts (type, severity, message, device_id)
    VALUES ('temperature', 'medium', 'Temperatura elevada: ' || NEW.temperature || '°C', NEW.device_id);
  END IF;

  -- Critical water level
  IF NEW.water_level <= 15 THEN
    INSERT INTO public.alerts (type, severity, message, device_id)
    VALUES ('water', 'critical', 'Nível de água crítico: ' || NEW.water_level || '%', NEW.device_id);
  ELSIF NEW.water_level <= 25 THEN
    INSERT INTO public.alerts (type, severity, message, device_id)
    VALUES ('water', 'medium', 'Nível de água baixo: ' || NEW.water_level || '%', NEW.device_id);
  END IF;

  -- Bad air quality
  IF NEW.air_quality >= 100 THEN
    INSERT INTO public.alerts (type, severity, message, device_id)
    VALUES ('air', 'high', 'Qualidade do ar perigosa: ' || NEW.air_quality || ' AQI', NEW.device_id);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_alerts
  AFTER INSERT ON public.sensor_readings
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_alerts_from_reading();

-- Enable realtime for alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
