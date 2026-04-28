import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSensorData } from "@/hooks/useSensorData";
import { emptySensorData } from "@/lib/mockData";
import { GaugeChart } from "@/components/GaugeChart";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function ReservoirPage() {
  const { current, getFilteredHistory, loading } = useSensorData();
  const data = current || emptySensorData;
  // Boia digital: 1 = cheio, 0 = vazio
  const isFull = data.waterLevel > 0;
  const level = isFull ? 100 : 0;
  const risk = isFull ? 'Baixo' : 'Crítico';
  const riskColor = isFull ? 'text-success' : 'text-destructive';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const histData = getFilteredHistory(24)
    .filter((_, i) => i % 4 === 0)
    .map(d => ({
      time: d.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      nivel: d.waterLevel > 0 ? 100 : 0,
    }));

  const tooltipStyle = {
    background: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    fontSize: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Monitoramento do Reservatório</h2>
        <p className="text-sm text-muted-foreground">Estado da boia (sensor digital — Cheio / Vazio)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Estado Atual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <GaugeChart value={level} max={100} label="Reservatório" unit={isFull ? 'Cheio' : 'Vazio'} thresholds={{ good: 50, warning: 75 }} />
            </div>
            <Progress value={level} className="h-4" />
            <div className="flex justify-between text-sm">
              <span>Risco:</span>
              <span className={`font-semibold ${riskColor}`}>{risk}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-2 rounded bg-destructive/10 text-destructive">Vazio<br/>Risco crítico</div>
              <div className="p-2 rounded bg-success/10 text-success">Cheio<br/>Operacional</div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Sensor de boia digital — apresenta apenas dois estados.
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Histórico da Boia (24h) — Cheio (100) / Vazio (0)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {histData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={histData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line type="monotone" dataKey="nivel" stroke="hsl(var(--chart-2))" strokeWidth={2.5} dot={{ r: 3, fill: 'hsl(var(--chart-2))' }} activeDot={{ r: 6 }} name="Nível %" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Sem dados históricos</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
