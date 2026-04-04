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
    smokeLevel: Number(row.smoke_level) || 0,
    ldrValue: Number(row.ldr_value) || 0,
  }), []);

  // Fetch initial data — last 24h
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const since = new Date(Date.now() - 24 * 3600000).toISOString();

      const { data, error } = await supabase
        .from('sensor_readings')
        .select('*')
        .gte('created_at', since)
        .order('created_at', { ascending: true })
        .limit(1000);

      if (!error && data && data.length > 0) {
        const mapped = data.map(mapRow);
        setHistory(mapped);
        const latest = mapped[mapped.length - 1];
        setCurrent(latest);
        setLastReceived(latest.timestamp);
      }
      setLoading(false);
    };

    fetchData();
  }, [mapRow]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('sensor_readings_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sensor_readings' },
        (payload) => {
          const newData = mapRow(payload.new);
          setCurrent(newData);
          setLastReceived(new Date());
          setHistory(prev => [...prev.slice(-500), newData]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mapRow]);

  const getFilteredHistory = useCallback((hours: number) => {
    const cutoff = Date.now() - hours * 3600000;
    return history.filter(d => d.timestamp.getTime() > cutoff);
  }, [history]);

  // Connection status: consider online if last reading < 2 minutes ago
  const isConnected = useMemo(() => {
    if (!lastReceived) return false;
    return Date.now() - lastReceived.getTime() < 120000;
  }, [lastReceived]);

  return { current, history, getFilteredHistory, loading, isConnected, lastReceived };
}
