import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Alert } from '@/lib/mockData';

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const mapRow = useCallback((row: any): Alert => ({
    id: row.id,
    type: row.type,
    severity: row.severity,
    message: row.message,
    timestamp: new Date(row.created_at),
    resolved: row.resolved,
  }), []);

  // Fetch alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        setAlerts(data.map(mapRow));
      }
      setLoading(false);
    };

    fetchAlerts();
  }, [mapRow]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('alerts_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alerts' },
        (payload) => {
          const newAlert = mapRow(payload.new);
          setAlerts(prev => [newAlert, ...prev].slice(0, 100));
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'alerts' },
        (payload) => {
          const updated = mapRow(payload.new);
          setAlerts(prev => prev.map(a => a.id === updated.id ? updated : a));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mapRow]);

  const resolveAlert = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('alerts')
      .update({ resolved: true, resolved_at: new Date().toISOString() } as any)
      .eq('id', id);

    if (!error) {
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
    }
    return !error;
  }, []);

  return { alerts, loading, resolveAlert };
}
