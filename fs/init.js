load('api_rpc.js');
load('api_bme280.js');
load('api_timer.js');
load('api_log.js');
load('api_mqtt.js');
load('ready.js');

let zone = Cfg.get('app.zone');
let temp_offset = Cfg.get('app.temp_offset');
let topic = Cfg.get('app.mqtt_topic');
let freq = Cfg.get('app.sample_frequency');
let bme = BME280.createI2C(0x76);

function readSensorData() {
  let v, data = {};
  v = bme.readTemp();
  if (v !== BME280.MGOS_BME280_ERROR) data.temperature = Math.round(v * 90 / 5 + 320 + temp_offset * 10)/10; // C -> F
  v = bme.readHumid();
  if (v !== BME280.MGOS_BME280_ERROR && v > 0) data.humidity = Math.round(v); // % RH
  v = bme.readPress();
  if (v !== BME280.MGOS_BME280_ERROR) data.pressure = Math.round(v * 2.9529983071445)/100; // hPa -> inHG
  if (zone > 0) data.zone = zone;
  return data;
}

function logSensorData() {
  let data = readSensorData();
  let s = JSON.stringify(data);
  Log.info("logging to " + topic + ": " + s);
  MQTT.pub(topic, s);
  return data;
}

if (bme !== null) {
  Log.error("initialized BME280 sensor");
  RPC.addHandler('Sensors.Read', readSensorData);
  RPC.addHandler('Sensors.Log', logSensorData);
  Timer.set(freq, Timer.REPEAT, logSensorData, null);
} else {
  Log.error("no BME280 sensor found");
}
