import { useEffect, useRef, useCallback } from 'react';
import { SensorData } from '@/lib/mockData';
import { toast } from 'sonner';

// Generate alert beep using Web Audio API
function playAlertBeep(type: 'critical' | 'warning' = 'critical') {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    if (type === 'critical') {
      // Urgent double beep
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

interface AlertCondition {
  triggered: boolean;
  message: string;
  type: 'critical' | 'warning';
}

export function useAlertSound(sensorData: SensorData) {
  const lastAlertRef = useRef<Record<string, number>>({});
  const COOLDOWN = 30000; // 30s between same alert

  const checkAlerts = useCallback((data: SensorData) => {
    const now = Date.now();
    const conditions: Record<string, AlertCondition> = {
      flame: {
        triggered: data.flameDetected > 0,
        message: `🔥 ALERTA CRÍTICO: Chamas detectadas! Intensidade: ${data.flameDetected}`,
        type: 'critical',
      },
      temperature: {
        triggered: data.temperature >= 40,
        message: `🌡️ ALERTA: Temperatura crítica! ${data.temperature}°C`,
        type: 'critical',
      },
      waterLow: {
        triggered: data.waterLevel <= 15,
        message: `💧 ALERTA: Nível de água crítico! ${data.waterLevel}%`,
        type: 'critical',
      },
      smoke: {
        triggered: data.smokeLevel > 200,
        message: `💨 ALERTA: Fumaça em nível perigoso! ${data.smokeLevel} ppm`,
        type: 'critical',
      },
    };

    Object.entries(conditions).forEach(([key, condition]) => {
      if (condition.triggered) {
        const lastTime = lastAlertRef.current[key] || 0;
        if (now - lastTime > COOLDOWN) {
          lastAlertRef.current[key] = now;
          playAlertBeep(condition.type);
          toast.error(condition.message, { duration: 8000 });
        }
      }
    });
  }, []);

  useEffect(() => {
    checkAlerts(sensorData);
  }, [sensorData, checkAlerts]);
}
