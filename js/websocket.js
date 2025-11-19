// Cliente WebSocket nativo
class WebSocketClient {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.handlers = new Map();
  }

  connect() {
    console.log("🔌 Conectando a WebSocket:", CONFIG.WS_URL);

    try {
      this.ws = new WebSocket(CONFIG.WS_URL);

      this.ws.onopen = () => {
        console.log("✅ WebSocket conectado");
        APP_STATE.connected = true;
        APP_STATE.reconnectAttempts = 0;
        this.updateUI(true);

        // Registrar dispositivo automáticamente
        this.registerDevice(APP_STATE.deviceId);

        showNotification("Conectado al servidor", "success");
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error("Error parseando mensaje:", error);
        }
      };

      this.ws.onerror = (error) => {
        console.error("❌ Error WebSocket:", error);
        showNotification("Error de conexión", "error");
      };

      this.ws.onclose = () => {
        console.log("🔌 WebSocket cerrado");
        APP_STATE.connected = false;
        this.updateUI(false);
        showNotification("Desconectado del servidor", "warning");

        // Auto-reconexión
        if (APP_STATE.reconnectAttempts < CONFIG.MAX_RECONNECT_ATTEMPTS) {
          APP_STATE.reconnectAttempts++;
          console.log(
            `🔄 Reintentando conexión (${APP_STATE.reconnectAttempts}/${CONFIG.MAX_RECONNECT_ATTEMPTS})...`
          );
          setTimeout(() => this.connect(), CONFIG.RECONNECT_INTERVAL);
        }
      };

      APP_STATE.ws = this.ws;
    } catch (error) {
      console.error("Error al crear WebSocket:", error);
      showNotification("No se pudo conectar", "error");
    }
  }

  registerDevice(deviceId) {
    this.send({
      type: "register_device",
      data: {
        device_id: deviceId,
        device_name: `Carrito-${deviceId}`,
      },
    });
  }

  sendMovement(command, duration, speed) {
    this.send({
      type: "movement_command",
      data: {
        device_id: APP_STATE.deviceId,
        command: command,
        duration_ms: duration,
        speed: speed || APP_STATE.currentSpeed,
        meta: {
          origin: "web_interface",
          timestamp: new Date().toISOString(),
        },
      },
    });
  }

  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      showNotification("No hay conexión activa", "error");
    }
  }

  handleMessage(message) {
    console.log("📨 Mensaje recibido:", message);

    switch (message.type) {
      case "connected":
        console.log("✅ Conexión confirmada");
        break;

      case "registration_success":
        console.log("✅ Dispositivo registrado:", message.device_id);
        showNotification(
          `Dispositivo ${message.device_id} registrado`,
          "success"
        );
        break;

      case "registration_error":
        console.error("❌ Error de registro:", message.error);
        showNotification(message.error, "error");
        break;

      case "command_sent":
        console.log("✅ Comando confirmado");
        addMessageToUI(message, "movement");
        APP_STATE.commandCount++;
        updateStats();
        break;

      case "command_error":
        console.error("❌ Error de comando:", message.error);
        showNotification(message.error, "error");
        break;

      case "execute_movement":
        console.log("🎮 Comando ejecutado:", message.command);
        addMessageToUI(message, "movement");
        break;

      case "obstacle_alert":
        console.log("⚠️ Alerta de obstáculo");
        APP_STATE.obstacleCount++;
        addMessageToUI(message, "obstacle");
        updateStats();
        showNotification("¡Obstáculo detectado!", "warning");
        break;

      case "status_update":
        console.log("📊 Actualización de estado");
        addMessageToUI(message, "status");
        break;

      case "pong":
        console.log("🏓 Pong recibido");
        break;

      default:
        console.log("📩 Mensaje desconocido:", message);
    }
  }

  updateUI(connected) {
    const statusIndicator = document.getElementById("statusIndicator");
    const statusText = document.getElementById("statusText");

    if (connected) {
      statusIndicator.className = "status-indicator online";
      statusText.textContent = "Conectado";
    } else {
      statusIndicator.className = "status-indicator offline";
      statusText.textContent = "Desconectado";
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Instancia global
const wsClient = new WebSocketClient();
