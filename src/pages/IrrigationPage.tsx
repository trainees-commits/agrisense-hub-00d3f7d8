import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useSensorData } from "@/hooks/useSensorData";
import { emptySensorData } from "@/lib/mockData";
import { Activity, Droplets, Hand, Power, Settings2, Waves, WifiOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function IrrigationPage() {
  const [irrigationOn, setIrrigationOn] = useState(true);
  const [autoMode, setAutoMode] = useState(true);
  const [moistureThreshold, setMoistureThreshold] = useState([40]);
  const [irrigationTime, setIrrigationTime] = useState([30]);
  const { current, isConnected, lastReceived } = useSensorData();
  const data = current || emptySensorData;

  const threshold = moistureThreshold[0];
  const duration = irrigationTime[0];
  const needsIrrigation = data.soilMoisture <= threshold;
  const irrigationActive = irrigationOn && isConnected && (autoMode ? needsIrrigation : true);
  const moistureProgress = Math.max(0, Math.min(100, data.soilMoisture));
  const reservoirProgress = Math.max(0, Math.min(100, data.waterLevel));
  const cycleProgress = irrigationActive ? Math.max(10, Math.min(100, (duration / 120) * 100)) : 0;
  const freshness = lastReceived
    ? Math.max(0, 100 - (Math.min(120000, Date.now() - lastReceived.getTime()) / 120000) * 100)
    : 0;

  const statusLabel = !isConnected
    ? 'Sem comunicação'
    : irrigationActive
      ? 'Irrigação ativa'
      : autoMode
        ? 'Em espera'
        : irrigationOn
          ? 'Manual preparado'
          : 'Sistema desligado';

  const statusDescription = !isConnected
    ? 'Sem telemetria recente do ESP32. O sistema espera nova leitura a cada 60 segundos.'
    : irrigationActive
      ? 'A válvula encontra-se em ciclo de rega com base no estado atual dos sensores.'
      : autoMode
        ? `O sistema vai iniciar automaticamente quando a humidade ficar abaixo de ${threshold}%.`
        : 'O operador mantém o controlo manual do acionamento da irrigação.';

  const handleToggle = (val: boolean) => {
    setIrrigationOn(val);
    toast.success(val ? 'Irrigação ativada' : 'Irrigação desativada');
  };

  const handleModeToggle = (val: boolean) => {
    setAutoMode(val);
    toast.info(val ? 'Modo automático ativado' : 'Modo manual ativado');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Controle de Irrigação</h2>
        <p className="text-sm text-muted-foreground">Gerencie o sistema de irrigação</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Power className="w-4 h-4" /> Estado da Irrigação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Irrigação</span>
              <div className="flex items-center gap-2">
                <Badge variant={irrigationOn ? "default" : "secondary"}>
                  {irrigationOn ? 'ON' : 'OFF'}
                </Badge>
                <Switch checked={irrigationOn} onCheckedChange={handleToggle} />
              </div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <Droplets className={`w-10 h-10 mx-auto ${irrigationActive ? 'text-primary animate-pulse-soft' : 'text-muted-foreground'}`} />
              <p className="text-xs text-muted-foreground mt-2">
                {irrigationActive ? 'Sistema ativo - irrigando' : irrigationOn ? 'Sistema pronto para irrigar' : 'Sistema pausado'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Modo de Operação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Modo Automático</span>
              <Switch checked={autoMode} onCheckedChange={handleModeToggle} />
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm font-medium flex items-center gap-2">
                {autoMode ? <><Settings2 className="w-4 h-4" /> Automático</> : <><Hand className="w-4 h-4" /> Manual</>}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {autoMode ? 'O sistema irriga automaticamente com base nos sensores' : 'Controle manual pelo operador'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Configurações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Limite mín. umidade</span>
                <span className="font-medium">{moistureThreshold[0]}%</span>
              </div>
              <Slider value={moistureThreshold} onValueChange={setMoistureThreshold} min={10} max={80} step={5} />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Tempo de irrigação</span>
                <span className="font-medium">{irrigationTime[0]} min</span>
              </div>
              <Slider value={irrigationTime} onValueChange={setIrrigationTime} min={5} max={120} step={5} />
            </div>
            <Button className="w-full" size="sm" onClick={() => toast.success('Configurações salvas!')}>
              Salvar Configurações
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="w-4 h-4" /> Estado Visual da Irrigação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-muted/30 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className={`rounded-xl p-3 ${irrigationActive ? 'bg-primary/10 text-primary' : isConnected ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'}`}>
                {isConnected ? <Droplets className="h-6 w-6" /> : <WifiOff className="h-6 w-6" />}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold">{statusLabel}</h3>
                  <Badge variant={!isConnected ? 'destructive' : irrigationActive ? 'default' : 'secondary'}>
                    {!isConnected ? 'Offline' : irrigationActive ? 'Ativa' : 'Standby'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{statusDescription}</p>
                <p className="text-xs text-muted-foreground">
                  Última telemetria: {lastReceived ? lastReceived.toLocaleString('pt-BR') : 'Sem dados'} · Intervalo esperado do ESP32: 60 segundos
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Humidade atual</p>
                <p className="mt-1 text-xl font-semibold">{data.soilMoisture}%</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Limiar</p>
                <p className="mt-1 text-xl font-semibold">{threshold}%</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Água disponível</p>
                <p className="mt-1 text-xl font-semibold">{data.waterLevel}%</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-xs text-muted-foreground">Ciclo configurado</p>
                <p className="mt-1 text-xl font-semibold">{duration} min</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Solo</p>
                <Badge variant={needsIrrigation ? 'destructive' : 'secondary'}>
                  {needsIrrigation ? 'Abaixo do limiar' : 'Estável'}
                </Badge>
              </div>
              <Progress value={moistureProgress} className="h-3" />
              <p className="text-xs text-muted-foreground">
                Humidade do solo em {data.soilMoisture}% face ao limiar configurado de {threshold}%.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Reservatório</p>
                <Badge variant={data.waterLevel <= 25 ? 'destructive' : 'secondary'}>
                  {data.waterLevel <= 25 ? 'Baixo' : 'Disponível'}
                </Badge>
              </div>
              <Progress value={reservoirProgress} className="h-3" />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Waves className="h-3.5 w-3.5" /> Nível atual do reservatório para suportar a rega.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Comunicação & ciclo</p>
                <Badge variant={isConnected ? 'default' : 'destructive'}>
                  {isConnected ? 'Online' : 'Offline'}
                </Badge>
              </div>
              <Progress value={isConnected ? freshness : cycleProgress} className="h-3" />
              <p className="text-xs text-muted-foreground">
                {isConnected
                  ? 'A dashboard está pronta para validar novos pacotes sem recarregar a página.'
                  : 'Sem leituras recentes do ESP32 para validar o estado da irrigação.'}
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-sm">
              <p className="font-medium">1. Sensores</p>
              <p className="mt-1 text-muted-foreground">Leitura de humidade do solo e nível de água para decisão do ciclo.</p>
            </div>
            <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-sm">
              <p className="font-medium">2. Decisão</p>
              <p className="mt-1 text-muted-foreground">Modo {autoMode ? 'automático' : 'manual'} com limite mínimo de {threshold}%.</p>
            </div>
            <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-sm">
              <p className="font-medium">3. Ação</p>
              <p className="mt-1 text-muted-foreground">Ciclo previsto de {duration} minutos com validação visual imediata do estado.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
