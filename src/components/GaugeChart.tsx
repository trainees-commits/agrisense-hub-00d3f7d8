import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface GaugeChartProps {
  value: number;
  max: number;
  label: string;
  unit: string;
  thresholds: { good: number; warning: number };
}

export function GaugeChart({ value, max, label, unit, thresholds }: GaugeChartProps) {
  const clampedValue = Math.min(Math.max(value, 0), max);
  const percentage = (clampedValue / max) * 100;

  const getColor = () => {
    if (percentage <= thresholds.good) return 'hsl(var(--success))';
    if (percentage <= thresholds.warning) return 'hsl(var(--warning))';
    return 'hsl(var(--destructive))';
  };

  const data = [
    { value: clampedValue },
    { value: max - clampedValue },
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-40 h-24 overflow-hidden">
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius={55}
              outerRadius={75}
              paddingAngle={0}
              dataKey="value"
              stroke="none"
            >
              <Cell fill={getColor()} />
              <Cell fill="hsl(var(--muted))" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
          <span className="text-2xl font-bold">{clampedValue}</span>
          <span className="text-xs text-muted-foreground ml-0.5">{unit}</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-1 font-medium">{label}</p>
    </div>
  );
}
