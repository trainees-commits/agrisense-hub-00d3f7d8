/*
 * AgroSense IoT - ESP32 Firmware
 * ---------------------------------------------------------------
 * Envia leituras a cada 60 segundos para o backend Lovable Cloud
 * (Supabase REST API) e aciona automaticamente a bomba de
 * irrigacao via rele quando a humidade do solo cai abaixo de 28%.
 *
 * Sensores utilizados:
 *   - Humidade do solo (analogico)        -> GPIO 34
 *   - Temperatura DS18B20 (1-wire)        -> GPIO 4
 *   - Boia de nivel de agua (digital)     -> GPIO 18  (0 = vazio, 1 = cheio)
 *   - Sensor de chamas (digital)          -> GPIO 19  (0 = chamas, 1 = normal -> invertido)
 *   - MQ-135 Qualidade do ar (analogico)  -> GPIO 35  (0-100%)
 *   - LDR Luminosidade (analogico)        -> GPIO 32  (0-1023 lux)
 *
 * Atuadores:
 *   - Rele bomba de irrigacao             -> GPIO 26  (LOW = ligado, HIGH = desligado)
 *
 * IMPORTANTE - VALIDACAO DUPLA com a aplicacao web:
 *   Os mesmos thresholds sao aplicados localmente no ESP32 e
 *   replicados no backend (trigger generate_alerts_from_reading)
 *   e na pagina web (src/lib/mockData.ts -> getStatusColor).
 *   Se um valor for alterado, atualizar OS TRES locais.
 *
 * Thresholds canonicos:
 *   - soil_moisture < 28%   -> liga bomba (irrigacao automatica)
 *   - soil_moisture > 32%   -> desliga bomba (histerese de 4%)
 *   - water_level   = 0     -> alerta critico (reservatorio vazio)
 *   - temperature  >= 35    -> medium ; >= 40 -> critical
 *   - air_quality  >= 40    -> medium ; >= 70 -> high
 *   - flame_detected = 1    -> critical
 * ---------------------------------------------------------------
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// ===================== CONFIG WIFI =====================
const char* WIFI_SSID     = "SUA_REDE_WIFI";
const char* WIFI_PASSWORD = "SUA_SENHA_WIFI";

// ===================== CONFIG SUPABASE =================
const char* SUPABASE_URL =
  "https://ecpukbdeypqtlvgoawku.supabase.co/rest/v1/sensor_readings";

const char* SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
  "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjcHVrYmRleXBxdGx2Z29hd2t1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MDEzNzQsImV4cCI6MjA5MDQ3NzM3NH0."
  "-ElHvetmMITaOXev34nhnR4C0ts-URFuVKfpOYj_XbI";

const char* DEVICE_ID = "ESP32-001";

// ===================== PINOS ===========================
#define PIN_SOIL        34   // analogico
#define PIN_DS18B20      4   // 1-wire (temperatura)
#define PIN_WATER       18   // digital boia (0=vazio, 1=cheio)
#define PIN_FLAME       19   // digital (modulo KY-026: 0 = chamas)
#define PIN_AIR_QUALITY 35   // analogico MQ-135
#define PIN_LDR         32   // analogico
#define PIN_RELAY_PUMP  26   // saida rele bomba (LOW=ligado)

// ===================== THRESHOLDS (sincronizados com web) ====
const float SOIL_PUMP_ON_BELOW = 28.0;   // liga abaixo de 28%
const float SOIL_PUMP_OFF_ABOVE = 32.0;  // desliga acima de 32% (histerese)

// ===================== TEMPORIZACAO ====================
const unsigned long SEND_INTERVAL_MS = 60000UL;  // 60 s
const unsigned long RETRY_DELAY_MS   = 10000UL;  // 10 s em caso de falha

// ===================== ESTADO ==========================
OneWire oneWire(PIN_DS18B20);
DallasTemperature dsSensors(&oneWire);

unsigned long lastSendAttempt = 0;
bool          pumpOn = false;

// ============================================================
void setup() {
  Serial.begin(115200);
  delay(200);

  pinMode(PIN_WATER,      INPUT_PULLUP);
  pinMode(PIN_FLAME,      INPUT_PULLUP);
  pinMode(PIN_RELAY_PUMP, OUTPUT);
  digitalWrite(PIN_RELAY_PUMP, HIGH);   // bomba desligada por defeito

  analogReadResolution(10);             // ADC 0-1023
  dsSensors.begin();

  connectWifi();
  // Forca primeiro envio imediato
  lastSendAttempt = millis() - SEND_INTERVAL_MS;
}

// ============================================================
void loop() {
  // 1) Le sensores (rapido, nao bloqueante)
  float soil        = readSoilMoisture();      // %
  float temperature = readTemperature();       // °C
  int   waterLevel  = readWaterLevel();        // 0 / 1
  int   flame       = readFlame();             // 0 / 1
  int   airQuality  = readAirQuality();        // 0-100 %
  int   ldr         = analogRead(PIN_LDR);     // 0-1023

  // 2) Controlo automatico da bomba (com histerese)
  controlPump(soil);

  // 3) Envio periodico a cada 60 s
  unsigned long now = millis();
  if (now - lastSendAttempt >= SEND_INTERVAL_MS) {
    lastSendAttempt = now;

    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("[WiFi] Reconectando...");
      connectWifi();
    }

    bool ok = sendReading(soil, temperature, waterLevel, airQuality,
                          flame, ldr);
    if (!ok) {
      // Reagenda nova tentativa em 10 s
      lastSendAttempt = now - (SEND_INTERVAL_MS - RETRY_DELAY_MS);
    }
  }

  delay(500);   // amostragem suficiente para resposta da bomba
}

// ============================================================
// LEITURA DOS SENSORES
// ============================================================
float readSoilMoisture() {
  // Solo seco ~ 3000, molhado ~ 1200 (ajustar conforme sensor real)
  int raw = analogRead(PIN_SOIL);
  float pct = map(raw, 3000, 1200, 0, 100);
  if (pct < 0)   pct = 0;
  if (pct > 100) pct = 100;
  return pct;
}

float readTemperature() {
  dsSensors.requestTemperatures();
  float t = dsSensors.getTempCByIndex(0);
  if (t == DEVICE_DISCONNECTED_C) return 0.0;
  return t;
}

int readWaterLevel() {
  // Boia: contacto fechado (LOW) quando ha agua -> reservatorio CHEIO = 1
  return (digitalRead(PIN_WATER) == LOW) ? 1 : 0;
}

int readFlame() {
  // KY-026: pino DO vai a LOW quando deteta chama
  return (digitalRead(PIN_FLAME) == LOW) ? 1 : 0;
}

int readAirQuality() {
  // MQ-135: maior tensao = ar mais poluido. Mapeamos para 0-100%
  int raw = analogRead(PIN_AIR_QUALITY);
  int pct = map(raw, 0, 1023, 0, 100);
  if (pct < 0)   pct = 0;
  if (pct > 100) pct = 100;
  return pct;
}

// ============================================================
// CONTROLO DA BOMBA — irrigacao automatica
// ============================================================
void controlPump(float soilMoisture) {
  if (!pumpOn && soilMoisture < SOIL_PUMP_ON_BELOW) {
    pumpOn = true;
    digitalWrite(PIN_RELAY_PUMP, LOW);   // ativa rele
    Serial.printf("[BOMBA] LIGADA — humidade %.1f%% < %.1f%%\n",
                  soilMoisture, SOIL_PUMP_ON_BELOW);
  } else if (pumpOn && soilMoisture > SOIL_PUMP_OFF_ABOVE) {
    pumpOn = false;
    digitalWrite(PIN_RELAY_PUMP, HIGH);  // desativa rele
    Serial.printf("[BOMBA] DESLIGADA — humidade %.1f%% > %.1f%%\n",
                  soilMoisture, SOIL_PUMP_OFF_ABOVE);
  }
}

// ============================================================
// REDE
// ============================================================
void connectWifi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("[WiFi] A ligar");
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 20000) {
    delay(400);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("[WiFi] OK  IP=%s\n", WiFi.localIP().toString().c_str());
  } else {
    Serial.println("[WiFi] Falhou — vai tentar novamente no proximo envio");
  }
}

bool sendReading(float soil, float temperature, int waterLevel,
                 int airQuality, int flame, int ldr) {
  if (WiFi.status() != WL_CONNECTED) return false;

  HTTPClient http;
  http.begin(SUPABASE_URL);
  http.addHeader("Content-Type",  "application/json");
  http.addHeader("apikey",        SUPABASE_ANON_KEY);
  http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);
  http.addHeader("Prefer",        "return=minimal");

  // Nota: smoke_level removido (sensor unificado em air_quality).
  // Enviamos 0 para manter compatibilidade com a coluna existente.
  String payload = "{";
  payload += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  payload += "\"soil_moisture\":" + String(soil, 1) + ",";
  payload += "\"temperature\":"   + String(temperature, 1) + ",";
  payload += "\"water_level\":"   + String(waterLevel) + ",";
  payload += "\"air_quality\":"   + String(airQuality) + ",";
  payload += "\"flame_detected\":" + String(flame) + ",";
  payload += "\"smoke_level\":0,";
  payload += "\"ldr_value\":"     + String(ldr);
  payload += "}";

  Serial.print("[POST] "); Serial.println(payload);

  int code = http.POST(payload);
  Serial.printf("[POST] HTTP %d\n", code);
  http.end();

  return (code >= 200 && code < 300);
}