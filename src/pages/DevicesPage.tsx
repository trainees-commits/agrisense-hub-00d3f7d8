import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Cpu, Droplets, Waves, Thermometer, Flame, Wind, Sun, CircleDot, Lightbulb, CloudSun, WifiOff } from "lucide-react";
import { useSensorData } from "@/hooks/useSensorData";
import { generateDevices, emptySensorData } from "@/lib/mockData";
import { SensorHeartbeat } from "@/components/SensorHeartbeat";

const typeIcons: Record<string, React.ElementType> = {
  Processador: Cpu,
  Humidade: Droplets,
  Nível: Waves,
  Temperatura: Thermometer,
  Segurança: Flame,
  Luminosidade: Sun,
};

export default function DevicesPage() {
  const { current, isConnected, lastReceived } = useSensorData();
  const data = current || emptySensorData;
  const devices = generateDevices(data, isConnected, lastReceived);
  const online = devices.filter(d => d.status === 'online').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Gestão de Dispositivos</h2>
        <p className="text-sm text-muted-foreground">{online}/{devices.length} dispositivos online</p>
      </div>

      {/* ESP32 Status Card */}
      <Card className={`border-l-4 ${isConnected ? 'border-l-primary' : 'border-l-destructive'}`}>
        <CardContent className="flex items-center gap-4 p-4">
          <div className={`p-3 rounded-lg ${isConnected ? 'bg-primary/10' : 'bg-destructive/10'}`}>
            <Cpu className={`w-6 h-6 ${isConnected ? 'text-primary' : 'text-destructive'}`} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">ESP32 - Processador Principal</p>
            <p className="text-xs text-muted-foreground">
              {isConnected 
                ? `Nó central de aquisição de dados — Última leitura: ${lastReceived?.toLocaleString('pt-BR') || 'N/A'}`
                : 'Sem comunicação — Verifique a conexão do ESP32'
              }
            </p>
          </div>
          <Badge variant={isConnected ? "default" : "destructive"} className="text-xs flex items-center gap-1">
            {isConnected ? <CircleDot className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isConnected ? 'Online' : 'Offline'}
          </Badge>
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
                      <div className="flex items-center gap-2">
                        <SensorHeartbeat
                          status={
                            device.status === 'offline' ? 'offline' :
                            (device.value === 'Sem dados' || device.value === 'Vazio' || device.value === 0) ? 'critical' : 'online'
                          }
                          size="md"
                          label={
                            device.status === 'offline' ? 'Offline' :
                            (device.value === 'Sem dados') ? 'Sem Dados' :
                            (device.value === 'Vazio') ? 'Crítico' : 'Online'
                          }
                        />
                      </div>
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
                {!isConnected ? (
                  <span>Sem dados — ESP32 offline</span>
                ) : (
                  <>
                    Luminosidade atual: <strong>{data.ldrValue} lux</strong> — 
                    {data.ldrValue < 300 && (
                      <span className="inline-flex items-center gap-1 ml-1"><Lightbulb className="w-3 h-3 inline" /> Luzes acionadas automaticamente (ambiente escuro)</span>
                    )}
                    {data.ldrValue >= 300 && data.ldrValue < 600 && (
                      <span className="inline-flex items-center gap-1 ml-1"><CloudSun className="w-3 h-3 inline" /> Iluminação parcial</span>
                    )}
                    {data.ldrValue >= 600 && (
                      <span className="inline-flex items-center gap-1 ml-1"><Sun className="w-3 h-3 inline" /> Luz natural suficiente — luzes desligadas</span>
                    )}
                  </>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
