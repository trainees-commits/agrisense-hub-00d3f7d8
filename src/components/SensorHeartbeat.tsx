import { cn } from "@/lib/utils";

interface SensorHeartbeatProps {
  status: 'online' | 'offline' | 'critical';
  size?: 'sm' | 'md';
  label?: string;
}

export function SensorHeartbeat({ status, size = 'sm', label }: SensorHeartbeatProps) {
  const sizeClasses = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5';

  return (
    <div className="flex items-center gap-1.5">
      <span className="relative flex">
        <span
          className={cn(
            sizeClasses,
            'rounded-full',
            status === 'online' && 'bg-success',
            status === 'offline' && 'bg-muted-foreground/40',
            status === 'critical' && 'bg-destructive',
          )}
        />
        {/* Pulse ring for online and critical */}
        {status === 'online' && (
          <span className={cn(sizeClasses, 'absolute rounded-full bg-success/40 animate-ping')} />
        )}
        {status === 'critical' && (
          <span className={cn(sizeClasses, 'absolute rounded-full bg-destructive/40 animate-ping')} />
        )}
      </span>
      {label && (
        <span className={cn(
          'text-[10px] font-medium',
          status === 'online' && 'text-success',
          status === 'offline' && 'text-muted-foreground',
          status === 'critical' && 'text-destructive',
        )}>
          {label}
        </span>
      )}
    </div>
  );
}
