import { useSensorData } from "@/hooks/useSensorData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useState } from "react";

const periods = [
  { label: "1h", hours: 1 },
  { label: "6h", hours: 6 },
  { label: "24h", hours: 24 },
];

const tooltipStyle = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
};

export default function MonitoringPage() {
  const { getFilteredHistory, loading } = useSensorData();
  const [selectedPeriod, setSelectedPeriod] = useState(6);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">A carregar dados...</span>
      </div>
    );
  }

  const rawData = getFilteredHistory(selectedPeriod);
  const step = Math.max(1, Math.floor(rawData.length / 30));
  const sampled = rawData.filter((_, i) => i % step === 0);

  const lineData = sampled.map(d => ({
    time: d.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    umidade: d.soilMoisture,
    temperatura: d.temperature,
  }));

  const barDataWater = sampled.map(d => ({
    time: d.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    agua: d.waterLevel,
  }));

  const barDataAir = sampled.map(d => ({
    time: d.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    ar: d.airQuality,
  }));

  const noData = rawData.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold">Monitoramento em Tempo Real</h2>
          <p className="text-sm text-muted-foreground">
            {noData ? 'Aguardando dados dos sensores' : `${rawData.length} leituras no período`}
          </p>
        </div>
        <div className="flex gap-1">
          {periods.map(p => (
            <Button key={p.hours} variant={selectedPeriod === p.hours ? "default" : "outline"} size="sm" onClick={() => setSelectedPeriod(p.hours)}>
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {noData ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p className="text-sm">Sem dados para o período selecionado</p>
            <p className="text-xs">Os gráficos serão atualizados automaticamente quando o ESP32 enviar leituras</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Umidade do Solo & Temperatura</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line type="monotone" dataKey="umidade" stroke="hsl(var(--chart-1))" strokeWidth={2.5} dot={{ r: 2, fill: 'hsl(var(--chart-1))' }} activeDot={{ r: 5 }} name="Umidade %" />
                    <Line type="monotone" dataKey="temperatura" stroke="hsl(var(--chart-3))" strokeWidth={2.5} dot={{ r: 2, fill: 'hsl(var(--chart-3))' }} activeDot={{ r: 5 }} name="Temp °C" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Nível de Água (%)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barDataWater}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="agua" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Nível %" maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Qualidade do Ar (AQI)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barDataAir}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="ar" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} name="AQI" maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
