import { useEffect, useRef, useCallback } from 'react';
import { SensorData } from '@/lib/mockData';
import { toast } from 'sonner';

function playAlertBeep(type: 'critical' | 'warning' | 'fire' = 'critical') {
  try {
    const ctx = new AudioContext();

    if (type === 'fire') {
      // Sirene de incêndio: varredura ascendente/descendente repetida
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      const now = ctx.currentTime;
      // Sweep up and down twice
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.linearRampToValueAtTime(1200, now + 0.4);
      osc.frequency.linearRampToValueAtTime(500, now + 0.8);
      osc.frequency.linearRampToValueAtTime(1200, now + 1.2);
      osc.frequency.linearRampToValueAtTime(500, now + 1.6);
      gain.gain.setValueAtTime(0.35, now + 1.5);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.7);
      osc.start(now);
      osc.stop(now + 1.7);
      setTimeout(() => ctx.close(), 2000);
      return;
    }

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
  type: 'critical' | 'warning' | 'fire';
}

function getCriticalConditions(data: SensorData): CriticalCondition[] {
  const conditions: CriticalCondition[] = [];

  // Flame detected
  if (data.flameDetected > 0) {
    conditions.push({ key: 'flame', message: 'ALERTA CRITICO: Chamas detectadas pelo sensor!', type: 'fire' });
  }
  // Critical temperature
  if (data.temperature >= 40) {
    conditions.push({ key: 'temperature', message: `ALERTA: Temperatura critica! ${data.temperature}°C`, type: 'critical' });
  }
  // Boia digital invertida no hardware: 1 = vazio, 0 = cheio
  if (data.waterLevel !== 0) {
    conditions.push({ key: 'waterLow', message: 'ALERTA: Reservatorio vazio (boia indica nivel critico)', type: 'critical' });
  }
  // Dangerous air quality (percentage)
  const airDisplay = Math.round(data.airQuality * 0.08 * 10) / 10;
  if (airDisplay >= 70) {
    conditions.push({ key: 'airBad', message: `ALERTA: Qualidade do ar perigosa! ${airDisplay}%`, type: 'critical' });
  }

  // Sensors sending 0 (offline/disconnected)
  if (data.soilMoisture === 0) {
    conditions.push({ key: 'soilZero', message: 'Sensor de humidade do solo sem dados (valor 0)', type: 'warning' });
  }
  if (data.temperature === 0) {
    conditions.push({ key: 'tempZero', message: 'Sensor de temperatura sem dados (valor 0)', type: 'warning' });
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
    const hasFire = conditions.some(c => c.type === 'fire');
    const hasCritical = conditions.some(c => c.type === 'critical' || c.type === 'fire');
    const hasAny = conditions.length > 0;

    // Show toasts (with cooldown)
    const now = Date.now();
    conditions.forEach(c => {
      const last = toastShownRef.current[c.key] || 0;
      if (now - last > TOAST_COOLDOWN) {
        toastShownRef.current[c.key] = now;
          if (c.type === 'critical' || c.type === 'fire') {
          toast.error(c.message, { duration: 8000 });
        } else {
          toast.warning(c.message, { duration: 6000 });
        }
      }
    });

    // Intermittent beep while conditions persist
    clearInterval_();

    if (hasAny) {
      const beepType: 'fire' | 'critical' | 'warning' = hasFire ? 'fire' : hasCritical ? 'critical' : 'warning';
      const interval = hasFire ? 3000 : hasCritical ? 5000 : 10000;

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
