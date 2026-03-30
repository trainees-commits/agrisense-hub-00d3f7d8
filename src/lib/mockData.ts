export interface SensorData {
  timestamp: Date;
  soilMoisture: number;
  temperature: number;
  waterLevel: number;
  airQuality: number;
  flameDetected: number;    // 0 = no flame (sensor offline/safe), >0 = flame intensity
  smokeLevel: number;       // 0 = no smoke (sensor offline), >0 = smoke density
  ldrValue: number;         // 0-1023 light intensity (0 = dark, 1023 = bright)
}

export interface Alert {
  id: string;
  type: 'fire' | 'water' | 'temperature' | 'air' | 'smoke';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
}

export interface Device {
  id: string;
  name: string;
  status: 'online' | 'offline';
  lastCommunication: Date;
  location: string;
  type: string;
  value?: number | string;
  unit?: string;
}

const rand = (min: number, max: number) => Math.round((Math.random() * (max - min) + min) * 10) / 10;

export function generateCurrentData(): SensorData {
  return {
    timestamp: new Date(),
    soilMoisture: rand(30, 85),
    temperature: rand(18, 42),
    waterLevel: rand(15, 95),
    airQuality: rand(20, 180),
    flameDetected: Math.random() > 0.9 ? rand(100, 900) : 0,
    smokeLevel: Math.random() > 0.85 ? rand(50, 500) : 0,
    ldrValue: rand(100, 900),
  };
}

export function generateHistoricalData(hours: number): SensorData[] {
  const data: SensorData[] = [];
  const now = Date.now();
  for (let i = hours * 6; i >= 0; i--) {
    data.push({
      timestamp: new Date(now - i * 10 * 60 * 1000),
      soilMoisture: rand(35, 80),
      temperature: rand(20, 38),
      waterLevel: rand(20, 90),
      airQuality: rand(30, 150),
      flameDetected: 0,
      smokeLevel: 0,
      ldrValue: rand(100, 900),
    });
  }
  return data;
}

// Generate device list based on current sensor data
export function generateDevices(sensorData: SensorData): Device[] {
  const esp32Online = true; // ESP32 is the main controller

  return [
    {
      id: 'ESP32-001',
      name: 'ESP32 - Processador Principal',
      status: esp32Online ? 'online' : 'offline',
      lastCommunication: new Date(),
      location: 'Central de Controle',
      type: 'Processador',
      value: esp32Online ? 'Ativo' : 'Inativo',
    },
    {
      id: 'SNS-HUM-001',
      name: 'Sensor de Humidade do Solo',
      status: esp32Online && sensorData.soilMoisture > 0 ? 'online' : 'offline',
      lastCommunication: new Date(),
      location: 'Setor A - Lote 1',
      type: 'Humidade',
      value: sensorData.soilMoisture,
      unit: '%',
    },
    {
      id: 'SNS-NIV-001',
      name: 'Sensor de Nível de Água',
      status: esp32Online && sensorData.waterLevel > 0 ? 'online' : 'offline',
      lastCommunication: new Date(Date.now() - 60000),
      location: 'Reservatório Principal',
      type: 'Nível',
      value: sensorData.waterLevel,
      unit: '%',
    },
    {
      id: 'SNS-TMP-001',
      name: 'Sensor de Temperatura',
      status: esp32Online && sensorData.temperature > 0 ? 'online' : 'offline',
      lastCommunication: new Date(),
      location: 'Setor A - Lote 1',
      type: 'Temperatura',
      value: sensorData.temperature,
      unit: '°C',
    },
    {
      id: 'SNS-FLM-001',
      name: 'Sensor de Chamas',
      status: esp32Online ? (sensorData.flameDetected > 0 ? 'online' : 'offline') : 'offline',
      lastCommunication: sensorData.flameDetected > 0 ? new Date() : new Date(Date.now() - 3600000),
      location: 'Setor C - Perímetro',
      type: 'Segurança',
      value: sensorData.flameDetected > 0 ? `${sensorData.flameDetected}` : 'Sem detecção',
      unit: sensorData.flameDetected > 0 ? 'IR' : undefined,
    },
    {
      id: 'SNS-SMK-001',
      name: 'Sensor de Fumaça',
      status: esp32Online ? (sensorData.smokeLevel > 0 ? 'online' : 'offline') : 'offline',
      lastCommunication: sensorData.smokeLevel > 0 ? new Date() : new Date(Date.now() - 7200000),
      location: 'Setor C - Perímetro',
      type: 'Segurança',
      value: sensorData.smokeLevel > 0 ? `${sensorData.smokeLevel}` : 'Sem detecção',
      unit: sensorData.smokeLevel > 0 ? 'ppm' : undefined,
    },
    {
      id: 'SNS-LDR-001',
      name: 'Sensor LDR - Luminosidade',
      status: esp32Online && sensorData.ldrValue > 0 ? 'online' : 'offline',
      lastCommunication: new Date(),
      location: 'Área Externa',
      type: 'Luminosidade',
      value: sensorData.ldrValue,
      unit: 'lux',
    },
  ];
}

export const mockAlerts: Alert[] = [
  { id: '1', type: 'temperature', severity: 'high', message: 'Temperatura acima de 38°C no Setor A', timestamp: new Date(Date.now() - 300000), resolved: false },
  { id: '2', type: 'water', severity: 'critical', message: 'Nível de água do reservatório abaixo de 20%', timestamp: new Date(Date.now() - 600000), resolved: false },
  { id: '3', type: 'air', severity: 'medium', message: 'Qualidade do ar em nível de atenção', timestamp: new Date(Date.now() - 1200000), resolved: false },
  { id: '4', type: 'fire', severity: 'critical', message: 'Sensor de chamas ativado no Setor C', timestamp: new Date(Date.now() - 1800000), resolved: true },
  { id: '5', type: 'water', severity: 'low', message: 'Irrigação do Setor B concluída', timestamp: new Date(Date.now() - 3600000), resolved: true },
  { id: '6', type: 'smoke', severity: 'high', message: 'Fumaça detectada no Setor C - nível elevado', timestamp: new Date(Date.now() - 5400000), resolved: true },
  { id: '7', type: 'temperature', severity: 'medium', message: 'Temperatura subindo rapidamente no Setor D', timestamp: new Date(Date.now() - 7200000), resolved: true },
];

export function getStatusColor(value: number, type: 'moisture' | 'temperature' | 'water' | 'air'): 'good' | 'warning' | 'danger' {
  switch (type) {
    case 'moisture':
      return value > 60 ? 'good' : value > 35 ? 'warning' : 'danger';
    case 'temperature':
      return value < 30 ? 'good' : value < 38 ? 'warning' : 'danger';
    case 'water':
      return value > 50 ? 'good' : value > 25 ? 'warning' : 'danger';
    case 'air':
      return value < 50 ? 'good' : value < 100 ? 'warning' : 'danger';
  }
}

export function getAirQualityLabel(value: number): string {
  if (value < 50) return 'Normal';
  if (value < 100) return 'Atenção';
  return 'Perigo';
}

export function getSeverityColor(severity: string) {
  switch (severity) {
    case 'critical': return 'destructive';
    case 'high': return 'destructive';
    case 'medium': return 'warning';
    default: return 'secondary';
  }
}
