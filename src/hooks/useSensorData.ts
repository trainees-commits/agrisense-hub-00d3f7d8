import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SensorData } from '@/lib/mockData';

export function useSensorData() {
  const [current, setCurrent] = useState<SensorData | null>(null);
  const [history, setHistory] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastReceived, setLastReceived] = useState<Date | null>(null);

  // Map DB row to SensorData
  const mapRow = useCallback((row: any): SensorData => ({
    timestamp: new Date(row.created_at),
    soilMoisture: Number(row.soil_moisture) || 0,
    temperature: Number(row.temperature) || 0,
    waterLevel: Number(row.water_level) || 0,
    airQuality: Number(row.air_quality) || 0,
    flameDetected: Number(row.flame_detected) || 0,
    ldrValue: Number(row.ldr_value) || 0,
  }), []);

  const mergeReading = useCallback((reading: SensorData) => {
    setCurrent(reading);
    setLastReceived(reading.timestamp);
    setHistory(prev => {
      const next = [...prev.filter(item => item.timestamp.getTime() !== reading.timestamp.getTime()), reading]
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      return next.slice(-1000);
    });
  }, []);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      const since = new Date(Date.now() - 24 * 3600000).toISOString();

      const { data, error } = await supabase
        .from('sensor_readings')
        .select('*')
        .gte('created_at', since)
        .order('created_at', { ascending: true })
        .limit(1000);

      if (!error) {
        const mapped = (data ?? []).map(mapRow);
        const latest = mapped.length > 0 ? mapped[mapped.length - 1] : null;

        setHistory(mapped);
        setCurrent(latest);
        setLastReceived(latest?.timestamp ?? null);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [mapRow]);

  // Fetch initial data — last 24h
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Polling fallback to keep the dashboard fresh even if the realtime socket drops
  useEffect(() => {
    const interval = window.setInterval(() => {
      fetchData(true);
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [fetchData]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('sensor_readings_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sensor_readings' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            mergeReading(mapRow(payload.new));
            return;
          }

          fetchData(true);
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          fetchData(true);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData, mapRow, mergeReading]);

  const getFilteredHistory = useCallback((hours: number) => {
    const cutoff = Date.now() - hours * 3600000;
    return history.filter(d => d.timestamp.getTime() > cutoff);
  }, [history]);

  // Connection status: consider online if last reading < 2 minutes ago
  const isConnected = useMemo(() => {
    if (!lastReceived) return false;
    return Date.now() - lastReceived.getTime() < 30000;
  }, [lastReceived]);

  return { current, history, getFilteredHistory, loading, isConnected, lastReceived };
}
