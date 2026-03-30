import { useEffect, useRef } from 'react';

interface GaugeChartProps {
  value: number;
  max: number;
  label: string;
  unit: string;
  thresholds: { good: number; warning: number };
  size?: number;
}

export function GaugeChart({ value, max, label, unit, thresholds, size = 160 }: GaugeChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const clampedValue = Math.min(Math.max(value, 0), max);
  const percentage = (clampedValue / max) * 100;

  const getColor = () => {
    if (percentage <= thresholds.good) return { main: '#22c55e', glow: 'rgba(34,197,94,0.3)' };
    if (percentage <= thresholds.warning) return { main: '#f59e0b', glow: 'rgba(245,158,11,0.3)' };
    return { main: '#ef4444', glow: 'rgba(239,68,68,0.3)' };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = (size * 0.65) * dpr;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size * 0.58;
    const radius = size * 0.38;
    const lineWidth = size * 0.08;
    const startAngle = Math.PI;
    const endAngle = 2 * Math.PI;
    const valueAngle = startAngle + (percentage / 100) * Math.PI;
    const colors = getColor();

    // Background track
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.strokeStyle = 'rgba(148,163,184,0.15)';
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Tick marks
    for (let i = 0; i <= 10; i++) {
      const angle = startAngle + (i / 10) * Math.PI;
      const innerR = radius - lineWidth / 2 - 4;
      const outerR = radius - lineWidth / 2 - (i % 5 === 0 ? 10 : 7);
      ctx.beginPath();
      ctx.moveTo(centerX + innerR * Math.cos(angle), centerY + innerR * Math.sin(angle));
      ctx.lineTo(centerX + outerR * Math.cos(angle), centerY + outerR * Math.sin(angle));
      ctx.strokeStyle = 'rgba(148,163,184,0.3)';
      ctx.lineWidth = i % 5 === 0 ? 1.5 : 0.8;
      ctx.stroke();
    }

    // Value arc with gradient
    if (percentage > 0) {
      const gradient = ctx.createLinearGradient(
        centerX - radius, centerY, centerX + radius, centerY
      );
      gradient.addColorStop(0, '#22c55e');
      gradient.addColorStop(0.5, '#f59e0b');
      gradient.addColorStop(1, '#ef4444');

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, valueAngle);
      ctx.strokeStyle = colors.main;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Glow effect
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, valueAngle);
      ctx.strokeStyle = colors.glow;
      ctx.lineWidth = lineWidth + 6;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Needle dot
      const dotX = centerX + radius * Math.cos(valueAngle);
      const dotY = centerY + radius * Math.sin(valueAngle);
      ctx.beginPath();
      ctx.arc(dotX, dotY, 4, 0, 2 * Math.PI);
      ctx.fillStyle = colors.main;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(dotX, dotY, 2, 0, 2 * Math.PI);
      ctx.fillStyle = '#fff';
      ctx.fill();
    }

    // Min/Max labels
    ctx.font = `${Math.max(9, size * 0.06)}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(148,163,184,0.6)';
    ctx.textAlign = 'center';
    ctx.fillText('0', centerX - radius + 5, centerY + 14);
    ctx.fillText(`${max}`, centerX + radius - 5, centerY + 14);
  }, [value, max, percentage, size, thresholds]);

  const colors = getColor();

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size * 0.65 }}>
        <canvas
          ref={canvasRef}
          style={{ width: size, height: size * 0.65 }}
          className="block"
        />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center pb-1">
          <span className="text-2xl font-bold" style={{ color: colors.main }}>
            {clampedValue}
          </span>
          <span className="text-xs text-muted-foreground ml-0.5">{unit}</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-1 font-medium">{label}</p>
    </div>
  );
}
