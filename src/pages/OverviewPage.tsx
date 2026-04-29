import { Droplets, Thermometer, Waves, Wind, Power, AlertTriangle, Flame, Sun, Activity, Loader2, WifiOff } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { GaugeChart } from "@/components/GaugeChart";
import { useSensorData } from "@/hooks/useSensorData";
import { useAlertSound } from "@/hooks/useAlertSound";
import { useAlerts } from "@/hooks/useAlerts";
import { getStatusColor, emptySensorData, scaleAirQuality, isReservoirFull } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Badge } from "@/components/ui/badge";

export default function OverviewPage() {
  const { current, getFilteredHistory, loading, isConnected } = useSensorData();
  const data = current || emptySensorData;
  useAlertSound(data);
  const { alerts: allAlerts } = useAlerts();
  const activeAlerts = allAlerts.filter(a => !a.resolved);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">A carregar dados dos sensores...</span>
      </div>
    );
  }

  const lineData = getFilteredHistory(6).map(d => ({
    time: d.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    umidade: d.soilMoisture,
    temperatura: d.temperature,
  }));

  const barData = getFilteredHistory(12)
    .filter((_, i) => i % 3 === 0)
    .map(d => ({
      time: d.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      // Boia invertida no hardware — apresentamos como 100% (cheio) ou 0% (vazio) para visualização
      agua: isReservoirFull(d.waterLevel) ? 100 : 0,
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Visão Geral</h2>
          <p className="text-sm text-muted-foreground">Monitoramento em tempo real da sua propriedade</p>
        </div>
        <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center gap-1">
          {isConnected ? <Activity className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
          {isConnected ? 'ESP32 Online' : 'ESP32 Offline'}
        </Badge>
      </div>

      {!isConnected && !current && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-4 p-4">
            <WifiOff className="w-6 h-6 text-destructive" />
            <div>
              <p className="text-sm font-medium">Sem dados dos sensores</p>
              <p className="text-xs text-muted-foreground">Nenhuma leitura recebida. Verifique a conexão do ESP32 e envie dados para a API.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Umidade do Solo" value={data.soilMoisture} unit="%" icon={Droplets} status={getStatusColor(data.soilMoisture, 'moisture')} />
        <StatCard title="Temperatura" value={data.temperature} unit="°C" icon={Thermometer} status={getStatusColor(data.temperature, 'temperature')} />
        <StatCard title="Nível de Água" value={isReservoirFull(data.waterLevel) ? 'Cheio' : 'Vazio'} icon={Waves} status={getStatusColor(data.waterLevel, 'water')} />
        <StatCard title="Qualidade do Ar" value={scaleAirQuality(data.airQuality)} unit="%" icon={Wind} status={getStatusColor(scaleAirQuality(data.airQuality), 'air')} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Sensor de Chamas" value={data.flameDetected > 0 ? 'DETECTADO' : 'Normal'} icon={Flame} status={data.flameDetected > 0 ? 'danger' : 'good'} />
        <StatCard title="Luminosidade (LDR)" value={data.ldrValue} unit="lux" icon={Sun} status={data.ldrValue < 300 ? 'warning' : 'good'} />
        <StatCard title="Conexão ESP32" value={isConnected ? 'Online' : 'Offline'} icon={Power} status={isConnected ? 'good' : 'danger'} />
        <StatCard title="Alertas Ativos" value={activeAlerts.length} icon={AlertTriangle} status={activeAlerts.length > 2 ? 'danger' : activeAlerts.length > 0 ? 'warning' : 'good'} />
      </div>

      {/* All Sensor Gauges */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Leituras Instantâneas — Todos os Sensores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-6">
            <GaugeChart value={data.soilMoisture} max={100} label="Umidade do Solo" unit="%" thresholds={{ good: 60, warning: 80 }} />
            <GaugeChart value={data.temperature} max={50} label="Temperatura" unit="°C" thresholds={{ good: 60, warning: 76 }} />
            <GaugeChart value={isReservoirFull(data.waterLevel) ? 100 : 0} max={100} label="Nível de Água" unit={isReservoirFull(data.waterLevel) ? 'Cheio' : 'Vazio'} thresholds={{ good: 50, warning: 75 }} />
            <GaugeChart value={scaleAirQuality(data.airQuality)} max={100} label="Qualidade do Ar" unit="%" thresholds={{ good: 60, warning: 80 }} />
            <GaugeChart value={data.flameDetected > 0 ? 100 : 0} max={100} label="Sensor de Chamas" unit={data.flameDetected > 0 ? 'Detectado' : 'Normal'} thresholds={{ good: 50, warning: 75 }} />
            <GaugeChart value={data.ldrValue} max={1023} label="Luminosidade (LDR)" unit="lux" thresholds={{ good: 50, warning: 75 }} />
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Umidade & Temperatura (6h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              {lineData.length > 0 ? (
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
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Sem dados históricos disponíveis</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Nível de Água — Boia (12h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              {barData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="agua" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Cheio (100) / Vazio (0)" maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">Sem dados históricos disponíveis</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Alertas Ativos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeAlerts.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum alerta ativo — sistema normal</p>
            )}
            {activeAlerts.map(alert => (
              <div key={alert.id} className={`flex items-start gap-3 p-2 rounded-lg text-sm ${alert.severity === 'critical' ? 'bg-destructive/5' : 'bg-muted/50'}`}>
                <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${alert.severity === 'critical' ? 'text-destructive' : alert.severity === 'high' ? 'text-destructive' : 'text-warning'}`} />
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{alert.message}</p>
                  <p className="text-[10px] text-muted-foreground">{alert.timestamp.toLocaleString('pt-BR')}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
