import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Cpu, Droplets, Waves, Thermometer, Flame, Wind, Sun } from "lucide-react";
import { useSensorData } from "@/hooks/useSensorData";
import { generateDevices } from "@/lib/mockData";

const typeIcons: Record<string, React.ElementType> = {
  Processador: Cpu,
  Humidade: Droplets,
  Nível: Waves,
  Temperatura: Thermometer,
  Segurança: Flame,
  Luminosidade: Sun,
};

export default function DevicesPage() {
  const { current } = useSensorData();
  const devices = generateDevices(current);
  const online = devices.filter(d => d.status === 'online').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Gestão de Dispositivos</h2>
        <p className="text-sm text-muted-foreground">{online}/{devices.length} dispositivos online</p>
      </div>

      {/* ESP32 Status Card */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <Cpu className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">ESP32 - Processador Principal</p>
            <p className="text-xs text-muted-foreground">Nó central de aquisição de dados • Comunicação MQTT/HTTPS</p>
          </div>
          <Badge variant="default" className="text-xs">🟢 Online</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Dispositivo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valor Atual</TableHead>
                <TableHead>Última Comunicação</TableHead>
                <TableHead>Localização</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {devices.filter(d => d.id !== 'ESP32-001').map(device => {
                const Icon = typeIcons[device.type] || Wind;
                return (
                  <TableRow key={device.id} className={device.status === 'offline' ? 'opacity-50' : ''}>
                    <TableCell>
                      <div className={`p-1.5 rounded ${device.status === 'online' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{device.id}</TableCell>
                    <TableCell className="font-medium text-sm">{device.name}</TableCell>
                    <TableCell className="text-sm">{device.type}</TableCell>
                    <TableCell>
                      <Badge variant={device.status === 'online' ? 'default' : 'secondary'} className="text-xs">
                        {device.status === 'online' ? '🟢 Online' : '🔴 Offline'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {device.value !== undefined ? (
                        <span>
                          {device.value}
                          {device.unit && <span className="text-xs text-muted-foreground ml-1">{device.unit}</span>}
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{device.lastCommunication.toLocaleString('pt-BR')}</TableCell>
                    <TableCell className="text-sm">{device.location}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* LDR Info Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Sun className="w-5 h-5 text-warning" />
            <div>
              <p className="text-sm font-medium">Controle de Iluminação (LDR)</p>
              <p className="text-xs text-muted-foreground">
                Luminosidade atual: <strong>{current.ldrValue} lux</strong> — 
                {current.ldrValue < 300 ? ' 💡 Luzes acionadas automaticamente (ambiente escuro)' : 
                 current.ldrValue < 600 ? ' 🌤 Iluminação parcial' : 
                 ' ☀️ Luz natural suficiente — luzes desligadas'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
