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
  const level = data.waterLevel;
  const risk = level > 50 ? 'Baixo' : level > 25 ? 'Médio' : 'Alto';
  const riskColor = level > 50 ? 'text-success' : level > 25 ? 'text-warning' : 'text-destructive';

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
      nivel: d.waterLevel,
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
        <p className="text-sm text-muted-foreground">Nível e consumo de água</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Nível Atual</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <GaugeChart value={level} max={100} label="Nível do Reservatório" unit="%" thresholds={{ good: 50, warning: 75 }} />
            </div>
            <Progress value={level} className="h-4" />
            <div className="flex justify-between text-sm">
              <span>Risco:</span>
              <span className={`font-semibold ${riskColor}`}>{risk}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded bg-destructive/10 text-destructive">0-25%<br/>Alto</div>
              <div className="p-2 rounded bg-warning/10 text-warning">25-50%<br/>Médio</div>
              <div className="p-2 rounded bg-success/10 text-success">50-100%<br/>Baixo</div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Evolução do Nível (24h)</CardTitle>
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
