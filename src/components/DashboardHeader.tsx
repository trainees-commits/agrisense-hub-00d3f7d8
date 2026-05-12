import { Bell, LogOut, User, Wifi, AlertTriangle, Flame, Droplets, Thermometer, Wind } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAlerts } from "@/hooks/useAlerts";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const typeIcons: Record<string, React.ElementType> = {
  fire: Flame,
  water: Droplets,
  temperature: Thermometer,
  air: Wind,
};

export function DashboardHeader() {
  const [online, setOnline] = useState(true);
  const { user, signOut } = useAuth();
  const { alerts } = useAlerts();
  const navigate = useNavigate();
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('readAlertIds');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });

  const activeAlerts = alerts.filter(a => !a.resolved);
  const unreadCount = useMemo(() => activeAlerts.filter(a => !readIds.has(a.id)).length, [activeAlerts, readIds]);
  const recentAlerts = activeAlerts.slice(0, 5);

  const markAllRead = useCallback(() => {
    const newReadIds = new Set(readIds);
    activeAlerts.forEach(a => newReadIds.add(a.id));
    setReadIds(newReadIds);
    localStorage.setItem('readAlertIds', JSON.stringify([...newReadIds]));
  }, [activeAlerts, readIds]);

  useEffect(() => {
    const i = setInterval(() => setOnline(Math.random() > 0.05), 10000);
    return () => clearInterval(i);
  }, []);

  const handleLogout = async () => {
    await signOut();
    toast.success('Sessão encerrada');
  };

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between px-4 flex-shrink-0">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <div className="flex items-center gap-2">
          <Wifi className={`w-3.5 h-3.5 ${online ? 'text-success' : 'text-destructive'}`} />
          <span className="text-xs text-muted-foreground">{online ? 'Sistema Online' : 'Offline'}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu onOpenChange={(open) => { if (open) markAllRead(); }}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="px-3 py-2 flex items-center justify-between">
              <span className="text-sm font-semibold">Notificações</span>
              {activeAlerts.length > 0 && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                  {activeAlerts.length} ativo{activeAlerts.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <DropdownMenuSeparator />
            {recentAlerts.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                Nenhum alerta ativo
              </div>
            ) : (
              recentAlerts.map(alert => {
                const Icon = typeIcons[alert.type] || AlertTriangle;
                return (
                  <DropdownMenuItem
                    key={alert.id}
                    className="flex items-start gap-3 px-3 py-2.5 cursor-pointer"
                    onClick={() => navigate('/alerts')}
                  >
                    <div className={`p-1.5 rounded-md mt-0.5 flex-shrink-0 ${
                      alert.severity === 'critical' || alert.severity === 'high'
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-warning/10 text-warning'
                    }`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{alert.message}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {alert.timestamp.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </DropdownMenuItem>
                );
              })
            )}
            {activeAlerts.length > 5 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-center text-xs text-primary cursor-pointer justify-center py-2"
                  onClick={() => navigate('/alerts')}
                >
                  Ver mais {activeAlerts.length - 5} alerta{activeAlerts.length - 5 !== 1 ? 's' : ''}
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-center text-xs cursor-pointer justify-center py-2 font-medium"
              onClick={() => navigate('/alerts')}
            >
              Ver todos os alertas
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 ml-2 hover:bg-accent rounded-md p-1 transition-colors"
          title="Ver perfil"
        >
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-medium truncate max-w-[120px]">{user?.email || 'Admin'}</p>
            <p className="text-[10px] text-muted-foreground">Administrador</p>
          </div>
        </button>
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}
