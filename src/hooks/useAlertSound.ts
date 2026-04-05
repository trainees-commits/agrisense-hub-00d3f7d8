import { useEffect, useRef, useCallback } from 'react';
import { SensorData } from '@/lib/mockData';
import { toast } from 'sonner';

function playAlertBeep(type: 'critical' | 'warning' = 'critical') {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    if (type === 'critical') {
      oscillator.frequency.value = 880;
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime + 0.2);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    } else {
      oscillator.frequency.value = 660;
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    }

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
    setTimeout(() => ctx.close(), 1000);
  } catch {
    // Audio not available
  }
}

interface CriticalCondition {
  key: string;
  message: string;
  type: 'critical' | 'warning';
}

function getCriticalConditions(data: SensorData): CriticalCondition[] {
  const conditions: CriticalCondition[] = [];

  // Flame detected
  if (data.flameDetected > 0) {
    conditions.push({ key: 'flame', message: `ALERTA CRITICO: Chamas detectadas! Intensidade: ${data.flameDetected}`, type: 'critical' });
  }
  // Critical temperature
  if (data.temperature >= 40) {
    conditions.push({ key: 'temperature', message: `ALERTA: Temperatura critica! ${data.temperature}°C`, type: 'critical' });
  }
  // Critical water level
  if (data.waterLevel <= 15) {
    conditions.push({ key: 'waterLow', message: `ALERTA: Nivel de agua critico! ${data.waterLevel}%`, type: 'critical' });
  }
  // Dangerous smoke
  if (data.smokeLevel > 200) {
    conditions.push({ key: 'smoke', message: `ALERTA: Fumaca em nivel perigoso! ${data.smokeLevel} ppm`, type: 'critical' });
  }

  // Sensors sending 0 (offline/disconnected)
  if (data.soilMoisture === 0) {
    conditions.push({ key: 'soilZero', message: 'Sensor de humidade do solo sem dados (valor 0)', type: 'warning' });
  }
  if (data.temperature === 0) {
    conditions.push({ key: 'tempZero', message: 'Sensor de temperatura sem dados (valor 0)', type: 'warning' });
  }
  if (data.waterLevel === 0) {
    conditions.push({ key: 'waterZero', message: 'Sensor de nível de água sem dados (valor 0)', type: 'warning' });
  }

  return conditions;
}

export function useAlertSound(sensorData: SensorData) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const toastShownRef = useRef<Record<string, number>>({});
  const TOAST_COOLDOWN = 30000;

  const clearInterval_ = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    const conditions = getCriticalConditions(sensorData);
    const hasCritical = conditions.some(c => c.type === 'critical');
    const hasAny = conditions.length > 0;

    // Show toasts (with cooldown)
    const now = Date.now();
    conditions.forEach(c => {
      const last = toastShownRef.current[c.key] || 0;
      if (now - last > TOAST_COOLDOWN) {
        toastShownRef.current[c.key] = now;
        if (c.type === 'critical') {
          toast.error(c.message, { duration: 8000 });
        } else {
          toast.warning(c.message, { duration: 6000 });
        }
      }
    });

    // Intermittent beep while conditions persist
    clearInterval_();

    if (hasAny) {
      const beepType = hasCritical ? 'critical' : 'warning';
      const interval = hasCritical ? 5000 : 10000; // 5s for critical, 10s for warning

      // Play immediately
      playAlertBeep(beepType);

      // Then repeat
      intervalRef.current = setInterval(() => {
        playAlertBeep(beepType);
      }, interval);
    }

    return clearInterval_;
  }, [sensorData, clearInterval_]);

  // Cleanup on unmount
  useEffect(() => clearInterval_, [clearInterval_]);
}
