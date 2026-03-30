import { Droplets, Thermometer, Waves, Wind, Power, AlertTriangle, Flame, Sun } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { GaugeChart } from "@/components/GaugeChart";
import { useSensorData } from "@/hooks/useSensorData";
import { useAlertSound } from "@/hooks/useAlertSound";
import { getStatusColor, mockAlerts } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useState } from "react";

export default function OverviewPage() {
  const { current, getFilteredHistory } = useSensorData();
  useAlertSound(current);
  const activeAlerts = mockAlerts.filter(a => !a.resolved);
  const [irrigationOn] = useState(true);

  const chartData = getFilteredHistory(6).map(d => ({
    time: d.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    umidade: d.soilMoisture,
    temperatura: d.temperature,
  }));

  const areaData = getFilteredHistory(12).map(d => ({
    time: d.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    agua: d.waterLevel,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Visão Geral</h2>
        <p className="text-sm text-muted-foreground">Monitoramento em tempo real da sua propriedade</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Umidade do Solo" value={current.soilMoisture} unit="%" icon={Droplets} status={getStatusColor(current.soilMoisture, 'moisture')} />
        <StatCard title="Temperatura" value={current.temperature} unit="°C" icon={Thermometer} status={getStatusColor(current.temperature, 'temperature')} />
        <StatCard title="Nível de Água" value={current.waterLevel} unit="%" icon={Waves} status={getStatusColor(current.waterLevel, 'water')} />
        <StatCard title="Qualidade do Ar" value={current.airQuality} unit="AQI" icon={Wind} status={getStatusColor(current.airQuality, 'air')} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Sensor de Chamas" value={current.flameDetected > 0 ? 'DETECTADO' : 'Normal'} icon={Flame} status={current.flameDetected > 0 ? 'danger' : 'good'} />
        <StatCard title="Luminosidade (LDR)" value={current.ldrValue} unit="lux" icon={Sun} status={current.ldrValue < 300 ? 'warning' : 'good'} />
        <StatCard title="Irrigação" value={irrigationOn ? 'Ativo' : 'Inativo'} icon={Power} status={irrigationOn ? 'good' : 'warning'} />
        <StatCard title="Alertas Ativos" value={activeAlerts.length} icon={AlertTriangle} status={activeAlerts.length > 2 ? 'danger' : activeAlerts.length > 0 ? 'warning' : 'good'} />
      </div>

      {/* Gauge Charts */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Leituras Instantâneas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <GaugeChart value={current.soilMoisture} max={100} label="Umidade do Solo" unit="%" thresholds={{ good: 60, warning: 80 }} />
            <GaugeChart value={current.temperature} max={50} label="Temperatura" unit="°C" thresholds={{ good: 60, warning: 76 }} />
            <GaugeChart value={current.waterLevel} max={100} label="Nível Reservatório" unit="%" thresholds={{ good: 50, warning: 75 }} />
            <GaugeChart value={current.airQuality} max={200} label="Qualidade do Ar" unit="AQI" thresholds={{ good: 25, warning: 50 }} />
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Line Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Umidade & Temperatura (6h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="umidade" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} name="Umidade %" />
                  <Line type="monotone" dataKey="temperatura" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} name="Temp °C" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Area Chart - Water Consumption */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Consumo de Água (12h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaData}>
                  <defs>
                    <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="agua" stroke="hsl(var(--chart-2))" fill="url(#waterGradient)" strokeWidth={2} name="Nível %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Alertas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockAlerts.slice(0, 5).map(alert => (
              <div key={alert.id} className={`flex items-start gap-3 p-2 rounded-lg text-sm ${alert.resolved ? 'opacity-50' : ''} ${alert.severity === 'critical' ? 'bg-destructive/5' : 'bg-muted/50'}`}>
                <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${alert.severity === 'critical' ? 'text-destructive' : alert.severity === 'high' ? 'text-destructive' : 'text-warning'}`} />
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{alert.message}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {alert.timestamp.toLocaleString('pt-BR')} {alert.resolved && '• Resolvido'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
