-- Update alert generation function: water is now binary (0=empty, 1=full),
-- air quality is a percentage (0-100), flame is binary (0/1)
CREATE OR REPLACE FUNCTION public.generate_alerts_from_reading()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Flame detected (digital sensor)
  IF NEW.flame_detected > 0 THEN
    INSERT INTO public.alerts (type, severity, message, device_id)
    VALUES ('fire', 'critical', 'Chamas detectadas pelo sensor', NEW.device_id);
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

  -- Water level (digital float sensor: 0=empty, 1=full)
  IF NEW.water_level = 0 THEN
    INSERT INTO public.alerts (type, severity, message, device_id)
    VALUES ('water', 'critical', 'Reservatório vazio — boia indica nível crítico', NEW.device_id);
  END IF;

  -- Air quality as percentage (0-100), >= 70% considered dangerous
  IF NEW.air_quality >= 70 THEN
    INSERT INTO public.alerts (type, severity, message, device_id)
    VALUES ('air', 'high', 'Qualidade do ar perigosa: ' || NEW.air_quality || '%', NEW.device_id);
  ELSIF NEW.air_quality >= 40 THEN
    INSERT INTO public.alerts (type, severity, message, device_id)
    VALUES ('air', 'medium', 'Qualidade do ar em atenção: ' || NEW.air_quality || '%', NEW.device_id);
  END IF;

  RETURN NEW;
END;
$function$;