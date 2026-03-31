import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { generateHistoricalData } from "@/lib/mockData";
import { useState } from "react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const allData = generateHistoricalData(168);

const tooltipStyle = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
};

export default function HistoryPage() {
  const [period, setPeriod] = useState(24);
  const cutoff = Date.now() - period * 3600000;
  const filtered = allData.filter(d => d.timestamp.getTime() > cutoff);
  const displayed = filtered.filter((_, i) => i % Math.max(1, Math.floor(filtered.length / 50)) === 0);

  const chartData = filtered
    .filter((_, i) => i % Math.max(1, Math.floor(filtered.length / 20)) === 0)
    .map(d => ({
      time: d.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      umidade: d.soilMoisture,
      temperatura: d.temperature,
      agua: d.waterLevel,
      ar: d.airQuality,
    }));

  const exportCSV = () => {
    const header = 'Data/Hora,Umidade Solo (%),Temperatura (°C),Nível Água (%),Qualidade Ar (AQI)\n';
    const rows = filtered.map(d =>
      `${d.timestamp.toLocaleString('pt-BR')},${d.soilMoisture},${d.temperature},${d.waterLevel},${d.airQuality}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sensores_${period}h.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Arquivo CSV exportado!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold">Histórico de Dados</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} registros</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1">
            {[{ l: '24h', h: 24 }, { l: '3d', h: 72 }, { l: '7d', h: 168 }].map(p => (
              <Button key={p.h} variant={period === p.h ? "default" : "outline"} size="sm" onClick={() => setPeriod(p.h)}>
                {p.l}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-3 h-3 mr-1" /> Exportar CSV
          </Button>
        </div>
      </div>

      {/* Column Chart overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Visão Geral do Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="umidade" fill="hsl(var(--chart-1))" radius={[3, 3, 0, 0]} name="Umidade %" maxBarSize={16} />
                <Bar dataKey="temperatura" fill="hsl(var(--chart-3))" radius={[3, 3, 0, 0]} name="Temp °C" maxBarSize={16} />
                <Bar dataKey="agua" fill="hsl(var(--chart-2))" radius={[3, 3, 0, 0]} name="Água %" maxBarSize={16} />
                <Bar dataKey="ar" fill="hsl(var(--chart-4))" radius={[3, 3, 0, 0]} name="Ar AQI" maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Umidade (%)</TableHead>
                  <TableHead>Temp (°C)</TableHead>
                  <TableHead>Água (%)</TableHead>
                  <TableHead>Ar (AQI)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayed.map((d, i) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs">{d.timestamp.toLocaleString('pt-BR')}</TableCell>
                    <TableCell>{d.soilMoisture}</TableCell>
                    <TableCell>{d.temperature}</TableCell>
                    <TableCell>{d.waterLevel}</TableCell>
                    <TableCell>{d.airQuality}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
