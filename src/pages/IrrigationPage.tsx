import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Droplets, Power, Settings2, Hand } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function IrrigationPage() {
  const [irrigationOn, setIrrigationOn] = useState(true);
  const [autoMode, setAutoMode] = useState(true);
  const [moistureThreshold, setMoistureThreshold] = useState([40]);
  const [irrigationTime, setIrrigationTime] = useState([30]);

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
              <Droplets className={`w-10 h-10 mx-auto ${irrigationOn ? 'text-primary animate-pulse-soft' : 'text-muted-foreground'}`} />
              <p className="text-xs text-muted-foreground mt-2">
                {irrigationOn ? 'Sistema ativo - irrigando' : 'Sistema pausado'}
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
    </div>
  );
}
