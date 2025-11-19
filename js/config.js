// Configuración global
const CONFIG = {
  // IP Elástica de EC2 en producción
  API_BASE_URL: "http://54.204.39.238:5500",
  WS_URL: "ws://54.204.39.238:5500/ws",

  // Dispositivo por defecto
  DEFAULT_DEVICE_ID: 1,

  // Configuración
  DEFAULT_DURATION: 1000,
  DEFAULT_SPEED: 2,
  MAX_MESSAGES: 100,
  RECONNECT_INTERVAL: 3000,
  MAX_RECONNECT_ATTEMPTS: 5,
};

// Estado global
const APP_STATE = {
  ws: null,
  connected: false,
  deviceId: CONFIG.DEFAULT_DEVICE_ID,
  reconnectAttempts: 0,
  messages: [],
  commandCount: 0,
  obstacleCount: 0,
  sessionStart: Date.now(),
  currentSpeed: CONFIG.DEFAULT_SPEED,
};

// Mapeo de comandos
const COMMANDS = {
  FORWARD: "forward",
  BACKWARD: "backward",
  LEFT: "left",
  RIGHT: "right",
  STOP: "stop",
  ROTATE_LEFT: "rotate_left",
  ROTATE_RIGHT: "rotate_right",
  FORWARD_LEFT: "forward_left",
  FORWARD_RIGHT: "forward_right",
  BACKWARD_LEFT: "backward_left",
  BACKWARD_RIGHT: "backward_right",
};

const COMMAND_NAMES = {
  forward: "Adelante",
  backward: "Atrás",
  left: "Giro 90° Izq",
  right: "Giro 90° Der",
  stop: "Detener",
  rotate_left: "Giro 360° Izq",
  rotate_right: "Giro 360° Der",
  forward_left: "Vuelta Adel. Izq",
  forward_right: "Vuelta Adel. Der",
  backward_left: "Vuelta Atrás Izq",
  backward_right: "Vuelta Atrás Der",
};

// Estado adicional para secuencias
const SEQUENCE_STATE = {
  customSequence: [],
  savedSequences: {},
  isExecuting: false,
};
