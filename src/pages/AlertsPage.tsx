import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Flame, Droplets, Thermometer, Wind, Check, Loader2 } from "lucide-react";
import { useAlerts } from "@/hooks/useAlerts";
import { useState } from "react";
import { toast } from "sonner";

const typeIcons: Record<string, typeof Flame> = { fire: Flame, water: Droplets, temperature: Thermometer, air: Wind, smoke: Wind };
const severityLabels: Record<string, string> = { critical: 'Crítico', high: 'Alto', medium: 'Médio', low: 'Baixo' };

export default function AlertsPage() {
  const { alerts, loading, resolveAlert } = useAlerts();
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');

  const handleResolve = async (id: string) => {
    const ok = await resolveAlert(id);
    if (ok) toast.success('Alerta marcado como resolvido');
    else toast.error('Erro ao resolver alerta');
  };

  const filtered = alerts.filter(a => {
    if (filter === 'active') return !a.resolved;
    if (filter === 'resolved') return a.resolved;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">A carregar alertas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold">Gestão de Alertas</h2>
          <p className="text-sm text-muted-foreground">{alerts.filter(a => !a.resolved).length} alertas ativos</p>
        </div>
        <div className="flex gap-1">
          {(['all', 'active', 'resolved'] as const).map(f => (
            <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)}>
              {f === 'all' ? 'Todos' : f === 'active' ? 'Ativos' : 'Resolvidos'}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum alerta registado</p>
              <p className="text-xs">Os alertas são gerados automaticamente pelo sistema quando os sensores ultrapassam os limites definidos</p>
            </CardContent>
          </Card>
        )}
        {filtered.map(alert => {
          const Icon = typeIcons[alert.type] || AlertTriangle;
          return (
            <Card key={alert.id} className={`${alert.severity === 'critical' && !alert.resolved ? 'border-destructive/50 bg-destructive/5' : ''} ${alert.resolved ? 'opacity-60' : ''}`}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`p-2 rounded-lg ${alert.severity === 'critical' || alert.severity === 'high' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{alert.message}</p>
                  <p className="text-xs text-muted-foreground">{alert.timestamp.toLocaleString('pt-BR')}</p>
                </div>
                <Badge variant={alert.severity === 'critical' || alert.severity === 'high' ? 'destructive' : 'secondary'}>
                  {severityLabels[alert.severity]}
                </Badge>
                {!alert.resolved && (
                  <Button size="sm" variant="outline" onClick={() => handleResolve(alert.id)}>
                    <Check className="w-3 h-3 mr-1" /> Resolver
                  </Button>
                )}
                {alert.resolved && <span className="text-xs text-muted-foreground">Resolvido</span>}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
