export interface SensorData {
  timestamp: Date;
  soilMoisture: number;
  temperature: number;
  waterLevel: number;
  airQuality: number;
  flameDetected: number;
  smokeLevel: number;
  ldrValue: number;
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

// Empty default for when no data is available
export const emptySensorData: SensorData = {
  timestamp: new Date(),
  soilMoisture: 0,
  temperature: 0,
  waterLevel: 0,
  airQuality: 0,
  flameDetected: 0,
  smokeLevel: 0,
  ldrValue: 0,
};

// Generate device list based on current sensor data and connection status
export function generateDevices(sensorData: SensorData, isConnected: boolean, lastReceived: Date | null): Device[] {
  const lastComm = lastReceived || new Date(0);
  
  return [
    {
      id: 'ESP32-001',
      name: 'ESP32 - Processador Principal',
      status: isConnected ? 'online' : 'offline',
      lastCommunication: lastComm,
      location: 'Central de Controle',
      type: 'Processador',
      value: isConnected ? 'Ativo' : 'Inativo',
    },
    {
      id: 'SNS-HUM-001',
      name: 'Sensor de Humidade do Solo',
      status: isConnected && sensorData.soilMoisture > 0 ? 'online' : 'offline',
      lastCommunication: lastComm,
      location: 'Setor A - Lote 1',
      type: 'Humidade',
      value: isConnected ? sensorData.soilMoisture : 'Sem dados',
      unit: isConnected && sensorData.soilMoisture > 0 ? '%' : undefined,
    },
    {
      id: 'SNS-NIV-001',
      name: 'Boia de Nível de Água',
      status: isConnected ? 'online' : 'offline',
      lastCommunication: lastComm,
      location: 'Reservatório Principal',
      type: 'Nível',
      value: isConnected ? (sensorData.waterLevel > 0 ? 'Cheio' : 'Vazio') : 'Sem dados',
      unit: undefined,
    },
    {
      id: 'SNS-TMP-001',
      name: 'Sensor de Temperatura',
      status: isConnected && sensorData.temperature > 0 ? 'online' : 'offline',
      lastCommunication: lastComm,
      location: 'Setor A - Lote 1',
      type: 'Temperatura',
      value: isConnected ? sensorData.temperature : 'Sem dados',
      unit: isConnected && sensorData.temperature > 0 ? '°C' : undefined,
    },
    {
      id: 'SNS-FLM-001',
      name: 'Sensor de Chamas',
      status: isConnected ? 'online' : 'offline',
      lastCommunication: lastComm,
      location: 'Setor C - Perímetro',
      type: 'Segurança',
      value: isConnected ? (sensorData.flameDetected > 0 ? 'Detectado' : 'Sem detecção') : 'Sem dados',
      unit: undefined,
    },
    {
      id: 'SNS-SMK-001',
      name: 'Sensor de Fumaça',
      status: isConnected ? (sensorData.smokeLevel > 0 ? 'online' : 'offline') : 'offline',
      lastCommunication: lastComm,
      location: 'Setor C - Perímetro',
      type: 'Segurança',
      value: isConnected && sensorData.smokeLevel > 0 ? `${sensorData.smokeLevel}` : 'Sem detecção',
      unit: sensorData.smokeLevel > 0 ? 'ppm' : undefined,
    },
    {
      id: 'SNS-AIR-001',
      name: 'Sensor de Qualidade do Ar',
      status: isConnected ? 'online' : 'offline',
      lastCommunication: lastComm,
      location: 'Setor B - Estufa',
      type: 'Qualidade do Ar',
      value: isConnected ? sensorData.airQuality : 'Sem dados',
      unit: isConnected ? '%' : undefined,
    },
    {
      id: 'SNS-LDR-001',
      name: 'Sensor LDR - Luminosidade',
      status: isConnected && sensorData.ldrValue > 0 ? 'online' : 'offline',
      lastCommunication: lastComm,
      location: 'Área Externa',
      type: 'Luminosidade',
      value: isConnected ? sensorData.ldrValue : 'Sem dados',
      unit: isConnected && sensorData.ldrValue > 0 ? 'lux' : undefined,
    },
  ];
}

export function getStatusColor(value: number, type: 'moisture' | 'temperature' | 'water' | 'air'): 'good' | 'warning' | 'danger' {
  switch (type) {
    case 'moisture':
      // Sincronizado com Arduino: bomba liga abaixo de 28% (danger),
      // zona de atencao 28-40%, normal acima de 40%.
      return value > 40 ? 'good' : value >= 28 ? 'warning' : 'danger';
    case 'temperature':
      return value < 30 ? 'good' : value < 38 ? 'warning' : 'danger';
    case 'water':
      // Digital float sensor: 1 = full (good), 0 = empty (danger)
      return value > 0 ? 'good' : 'danger';
    case 'air':
      // Air quality as percentage (0-100)
      return value < 40 ? 'good' : value < 70 ? 'warning' : 'danger';
  }
}

export function getAirQualityLabel(value: number): string {
  if (value < 40) return 'Normal';
  if (value < 70) return 'Atenção';
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

// Generate alerts from current sensor data thresholds
export function generateAlertsFromData(data: SensorData): Alert[] {
  const alerts: Alert[] = [];
  const now = data.timestamp;

  if (data.flameDetected > 0) {
    alerts.push({ id: `flame-${now.getTime()}`, type: 'fire', severity: 'critical', message: 'Chamas detectadas pelo sensor', timestamp: now, resolved: false });
  }
  if (data.smokeLevel > 200) {
    alerts.push({ id: `smoke-${now.getTime()}`, type: 'smoke', severity: 'high', message: `Fumaça em nível elevado: ${data.smokeLevel} ppm`, timestamp: now, resolved: false });
  }
  if (data.temperature >= 40) {
    alerts.push({ id: `temp-${now.getTime()}`, type: 'temperature', severity: 'critical', message: `Temperatura crítica: ${data.temperature}°C`, timestamp: now, resolved: false });
  }
  if (data.temperature >= 35 && data.temperature < 40) {
    alerts.push({ id: `temp-warn-${now.getTime()}`, type: 'temperature', severity: 'medium', message: `Temperatura elevada: ${data.temperature}°C`, timestamp: now, resolved: false });
  }
  if (data.waterLevel === 0) {
    alerts.push({ id: `water-${now.getTime()}`, type: 'water', severity: 'critical', message: 'Reservatório vazio — boia indica nível crítico', timestamp: now, resolved: false });
  }
  if (data.airQuality >= 70) {
    alerts.push({ id: `air-${now.getTime()}`, type: 'air', severity: 'high', message: `Qualidade do ar perigosa: ${data.airQuality}%`, timestamp: now, resolved: false });
  } else if (data.airQuality >= 40) {
    alerts.push({ id: `air-warn-${now.getTime()}`, type: 'air', severity: 'medium', message: `Qualidade do ar em atenção: ${data.airQuality}%`, timestamp: now, resolved: false });
  }

  return alerts;
}
