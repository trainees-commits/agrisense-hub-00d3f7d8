import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useSensorData } from "@/hooks/useSensorData";
import { scaleAirQuality, isReservoirFull } from "@/lib/mockData";
import { useState } from "react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const tooltipStyle = {
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
};

export default function HistoryPage() {
  const { history, getFilteredHistory, loading } = useSensorData();
  const [period, setPeriod] = useState(24);

  const filtered = getFilteredHistory(period);
  const displayed = filtered.filter((_, i) => i % Math.max(1, Math.floor(filtered.length / 50)) === 0);

  const chartData = filtered
    .filter((_, i) => i % Math.max(1, Math.floor(filtered.length / 20)) === 0)
    .map(d => ({
      time: d.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      umidade: d.soilMoisture,
      temperatura: d.temperature,
      agua: d.waterLevel,
      ar: scaleAirQuality(d.airQuality),
    }));

  const exportCSV = () => {
    const header = 'Data/Hora,Umidade Solo (%),Temperatura (°C),Nível Água,Qualidade Ar (%),Chama (IR),LDR (lux)\n';
    const rows = filtered.map(d =>
      `${d.timestamp.toLocaleString('pt-BR')},${d.soilMoisture},${d.temperature},${isReservoirFull(d.waterLevel) ? 'Cheio' : 'Vazio'},${scaleAirQuality(d.airQuality)},${d.flameDetected},${d.ldrValue}`
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

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const generatedAt = new Date().toLocaleString('pt-BR');

    doc.setFontSize(16);
    doc.text('Historico de Leituras dos Sensores', 14, 16);
    doc.setFontSize(10);
    doc.text(`Periodo analisado: ultimas ${period}h`, 14, 23);
    doc.text(`Registos exportados: ${filtered.length}`, 90, 23);
    doc.text(`Gerado em: ${generatedAt}`, 180, 23);

    autoTable(doc, {
      startY: 28,
      head: [[
        'Data/Hora',
        'Umidade (%)',
        'Temp (C)',
        'Agua',
        'Ar (%)',
        'Chama',
        'LDR',
      ]],
      body: filtered.map(d => [
        d.timestamp.toLocaleString('pt-BR'),
        `${d.soilMoisture}`,
        `${d.temperature}`,
        isReservoirFull(d.waterLevel) ? 'Cheio' : 'Vazio',
        `${scaleAirQuality(d.airQuality)}`,
        `${d.flameDetected}`,
        `${d.ldrValue}`,
      ]),
      styles: {
        fontSize: 7,
        cellPadding: 1.5,
      },
      headStyles: {
        fillColor: [39, 110, 74],
      },
      alternateRowStyles: {
        fillColor: [245, 248, 246],
      },
      margin: { top: 28, left: 12, right: 12, bottom: 12 },
    });

    doc.save(`sensores_${period}h.pdf`);
    toast.success('Arquivo PDF exportado!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">A carregar histórico...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold">Histórico de Dados</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} registros</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1">
            {[{ l: '1h', h: 1 }, { l: '6h', h: 6 }, { l: '24h', h: 24 }].map(p => (
              <Button key={p.h} variant={period === p.h ? "default" : "outline"} size="sm" onClick={() => setPeriod(p.h)}>
                {p.l}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={exportPDF} disabled={filtered.length === 0}>
            <Download className="w-3 h-3 mr-1" /> Exportar PDF
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={filtered.length === 0}>
            <Download className="w-3 h-3 mr-1" /> Exportar CSV
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p className="text-sm">Sem dados históricos para o período selecionado</p>
            <p className="text-xs">Os dados serão exibidos quando o ESP32 enviar leituras</p>
          </CardContent>
        </Card>
      ) : (
        <>
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
                      <TableHead>Água</TableHead>
                      <TableHead>Ar (%)</TableHead>
                      <TableHead>Chama</TableHead>
                      <TableHead>LDR</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayed.map((d, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-xs">{d.timestamp.toLocaleString('pt-BR')}</TableCell>
                        <TableCell>{d.soilMoisture}</TableCell>
                        <TableCell>{d.temperature}</TableCell>
                        <TableCell>{isReservoirFull(d.waterLevel) ? 'Cheio' : 'Vazio'}</TableCell>
                        <TableCell>{scaleAirQuality(d.airQuality)}</TableCell>
                        <TableCell>{d.flameDetected}</TableCell>
                        <TableCell>{d.ldrValue}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
