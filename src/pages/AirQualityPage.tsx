import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSensorData } from "@/hooks/useSensorData";
import { getAirQualityLabel, getStatusColor, emptySensorData } from "@/lib/mockData";
import { GaugeChart } from "@/components/GaugeChart";
import { Wind, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function AirQualityPage() {
  const { current, getFilteredHistory, loading } = useSensorData();
  const data = current || emptySensorData;
  const aqi = data.airQuality;
  const label = getAirQualityLabel(aqi);
  const status = getStatusColor(aqi, 'air');
  const colorMap = { good: 'text-success', warning: 'text-warning', danger: 'text-destructive' };
  const bgMap = { good: 'bg-success/10', warning: 'bg-warning/10', danger: 'bg-destructive/10' };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const histData = getFilteredHistory(12)
    .filter((_, i) => i % 3 === 0)
    .map(d => ({
      time: d.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      aqi: d.airQuality,
    }));

  const getBarColor = (value: number) => {
    if (value < 40) return 'hsl(var(--chart-1))';
    if (value < 70) return 'hsl(var(--chart-5))';
    return 'hsl(var(--destructive))';
  };

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
        <h2 className="text-xl font-bold">Qualidade do Ar & Segurança</h2>
        <p className="text-sm text-muted-foreground">Monitoramento ambiental</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Qualidade do Ar Atual</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex justify-center">
              <GaugeChart value={aqi} max={100} label="Qualidade do Ar" unit="%" thresholds={{ good: 60, warning: 80 }} />
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${bgMap[status]} ${colorMap[status]} font-medium text-sm`}>
              <Wind className="w-4 h-4" /> {label}
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs text-center">
              <div className="p-2 rounded bg-success/10 text-success">0-40%<br/>Normal</div>
              <div className="p-2 rounded bg-warning/10 text-warning">40-70%<br/>Atenção</div>
              <div className="p-2 rounded bg-destructive/10 text-destructive">70-100%<br/>Perigo</div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Histórico Qualidade do Ar (12h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {histData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={histData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="aqi" radius={[4, 4, 0, 0]} name="Qualidade do Ar (%)" maxBarSize={28}>
                      {histData.map((entry, index) => (
                        <Cell key={index} fill={getBarColor(entry.aqi)} />
                      ))}
                    </Bar>
                  </BarChart>
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
