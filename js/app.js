// Inicialización de la aplicación
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Iniciando aplicación IoT Car Control");

  // Conectar WebSocket
  wsClient.connect();

  // Iniciar temporizador de sesión
  startSessionTimer();

  // Configurar botones de control
  setupControls();

  // Cargar datos iniciales
  loadInitialData();

  // Event listeners
  setupEventListeners();

  // Inicializar vistas
  switchView("control");

  // Inicializar constructor de secuencias
  renderSequenceList();
  updateSequenceControls();
});

function setupControls() {
  const controlButtons = document.querySelectorAll(".control-btn");

  controlButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const command = btn.dataset.command;
      const duration = parseInt(
        document.getElementById("durationSlider").value
      );

      if (command && wsClient.ws && wsClient.ws.readyState === WebSocket.OPEN) {
        wsClient.sendMovement(command, duration);
        btn.classList.add("active");
        setTimeout(() => btn.classList.remove("active"), 300);
      } else {
        showNotification("No hay conexión", "error");
      }
    });
  });
}

function setupEventListeners() {
  // Slider de duración
  const slider = document.getElementById("durationSlider");
  const valueDisplay = document.getElementById("durationValue");

  slider.addEventListener("input", (e) => {
    valueDisplay.textContent = `${e.target.value} ms`;
  });

  // Device ID
  const deviceInput = document.getElementById("deviceIdInput");
  deviceInput.addEventListener("change", (e) => {
    const newId = parseInt(e.target.value);
    if (newId > 0) {
      APP_STATE.deviceId = newId;
      wsClient.registerDevice(newId);
      loadDeviceInfo();
    }
  });

  // Navegación entre vistas
  document.querySelectorAll(".nav-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      const view = tab.dataset.view;
      switchView(view);
    });
  });

  // Botón refrescar historial
  document
    .getElementById("refreshHistoryBtn")
    ?.addEventListener("click", loadHistory);

  // Botón limpiar mensajes
  document
    .getElementById("clearMessagesBtn")
    ?.addEventListener("click", clearMessages);

  // Botón simular obstáculo
  document
    .getElementById("simulateObstacleBtn")
    ?.addEventListener("click", simulateObstacle);

  // Constructor de secuencias
  document
    .getElementById("addToSequenceBtn")
    ?.addEventListener("click", addMovementToSequence);
  document
    .getElementById("clearSequenceBtn")
    ?.addEventListener("click", clearSequence);
  document
    .getElementById("executeSequenceBtn")
    ?.addEventListener("click", executeCustomSequence);
  document
    .getElementById("saveSequenceBtn")
    ?.addEventListener("click", saveCustomSequence);

  // Demos predefinidos
  document.querySelectorAll(".load-demo-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const demoType = btn.dataset.demo;
      loadPredefinedDemo(demoType);
    });
  });

  // Filtros de mensajes
  document.querySelectorAll(".message-filter").forEach((filter) => {
    filter.addEventListener("click", (e) => {
      document
        .querySelectorAll(".message-filter")
        .forEach((f) => f.classList.remove("active"));
      e.target.classList.add("active");
      const filterType = e.target.dataset.filter;
      filterMessages(filterType);
    });
  });

  // Atajos de teclado
  document.addEventListener("keydown", handleKeyboard);
}

function handleKeyboard(e) {
  if (e.target.tagName === "INPUT") return;

  const duration = parseInt(document.getElementById("durationSlider").value);

  switch (e.key.toLowerCase()) {
    case "w":
    case "arrowup":
      e.preventDefault();
      wsClient.sendMovement(COMMANDS.FORWARD, duration);
      break;
    case "s":
    case "arrowdown":
      e.preventDefault();
      wsClient.sendMovement(COMMANDS.BACKWARD, duration);
      break;
    case "a":
    case "arrowleft":
      e.preventDefault();
      wsClient.sendMovement(COMMANDS.LEFT, duration);
      break;
    case "d":
    case "arrowright":
      e.preventDefault();
      wsClient.sendMovement(COMMANDS.RIGHT, duration);
      break;
    case " ":
    case "escape":
      e.preventDefault();
      wsClient.sendMovement(COMMANDS.STOP, 100);
      break;
  }
}

async function loadInitialData() {
  try {
    // Health check
    const health = await api.healthCheck();
    console.log("💚 Servidor OK:", health);

    // Cargar info del dispositivo
    await loadDeviceInfo();

    // Cargar historial
    await loadHistory();
  } catch (error) {
    console.error("Error cargando datos iniciales:", error);
    showNotification("Error al conectar con la API", "error");
  }
}

async function loadDeviceInfo() {
  try {
    const response = await api.getDevice(APP_STATE.deviceId);
    const container = document.getElementById("deviceInfo");

    if (response.success && response.device) {
      const device = response.device;
      container.innerHTML = `
        <div class="info-item">
          <span class="label">Nombre:</span>
          <span class="value">${device.device_name}</span>
        </div>
        <div class="info-item">
          <span class="label">IP:</span>
          <span class="value">${device.client_ip}</span>
        </div>
        ${
          device.city
            ? `
        <div class="info-item">
          <span class="label">Ubicación:</span>
          <span class="value">${device.city}, ${device.country || ""}</span>
        </div>
        `
            : ""
        }
      `;
    } else {
      container.innerHTML =
        '<p class="text-warning">Dispositivo no encontrado</p>';
    }
  } catch (error) {
    console.error("Error cargando dispositivo:", error);
  }
}

async function loadHistory() {
  try {
    const response = await api.getEvents(APP_STATE.deviceId, 20);
    const tbody = document.getElementById("historyTable");

    if (response.success && response.events.length > 0) {
      tbody.innerHTML = response.events
        .map(
          (event) => `
        <tr>
          <td>${formatDate(event.event_ts)}</td>
          <td><span class="badge">${
            event.status_description || event.status_clave
          }</span></td>
          <td>${
            event.meta ? JSON.parse(event.meta).duration_ms || "-" : "-"
          } ms</td>
          <td><span class="badge badge-success">OK</span></td>
        </tr>
      `
        )
        .join("");
    } else {
      tbody.innerHTML =
        '<tr><td colspan="4" class="text-center">Sin historial</td></tr>';
    }
  } catch (error) {
    console.error("Error cargando historial:", error);
  }
}

async function simulateObstacle() {
  try {
    const distance = Math.floor(Math.random() * 30) + 5; // 5-35 cm
    await api.simulateObstacle(APP_STATE.deviceId, distance);
    showNotification(`Obstáculo simulado a ${distance}cm`, "warning");
  } catch (error) {
    console.error("Error simulando obstáculo:", error);
    showNotification("Error en simulación", "error");
  }
}

function addMessageToUI(message, type) {
  const container = document.getElementById("messagesContainer");
  const messageDiv = document.createElement("div");
  messageDiv.className = `message message-${type}`;

  let content = "";
  if (type === "movement") {
    const commandName = COMMAND_NAMES[message.command] || message.command;
    content = `<strong>${commandName}</strong> (${message.duration_ms}ms)`;
  } else if (type === "obstacle") {
    content = `<strong>⚠️ Obstáculo detectado</strong>`;
  } else {
    content = `<strong>Estado actualizado</strong>`;
  }

  messageDiv.innerHTML = `
    <div class="message-content">
      <div>${content}</div>
      <div class="message-time">${formatTime(new Date())}</div>
    </div>
  `;

  container.insertBefore(messageDiv, container.firstChild);

  // Limitar cantidad
  while (container.children.length > CONFIG.MAX_MESSAGES) {
    container.removeChild(container.lastChild);
  }

  APP_STATE.messages.unshift(message);
}

function clearMessages() {
  const container = document.getElementById("messagesContainer");
  container.innerHTML = '<p class="text-center">Sin mensajes</p>';
  APP_STATE.messages = [];
}

function updateStats() {
  // Actualizar stats en vista de control
  document.getElementById("commandCount").textContent = APP_STATE.commandCount;
  document.getElementById("obstacleCount").textContent =
    APP_STATE.obstacleCount;

  // Actualizar stats en vista de monitor
  const commandCountMonitor = document.getElementById("commandCountMonitor");
  const obstacleCountMonitor = document.getElementById("obstacleCountMonitor");
  if (commandCountMonitor)
    commandCountMonitor.textContent = APP_STATE.commandCount;
  if (obstacleCountMonitor)
    obstacleCountMonitor.textContent = APP_STATE.obstacleCount;
}

function startSessionTimer() {
  setInterval(() => {
    const elapsed = Math.floor((Date.now() - APP_STATE.sessionStart) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timeString = `${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;

    // Actualizar en vista de control
    document.getElementById("sessionTime").textContent = timeString;

    // Actualizar en vista de monitor
    const sessionTimeMonitor = document.getElementById("sessionTimeMonitor");
    if (sessionTimeMonitor) sessionTimeMonitor.textContent = timeString;
  }, 1000);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function formatTime(date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ========================================
// NAVEGACIÓN ENTRE VISTAS
// ========================================

function switchView(targetView) {
  const views = {
    control: document.getElementById("controlView"),
    monitor: document.getElementById("monitorView"),
    config: document.getElementById("configView"),
  };

  Object.entries(views).forEach(([name, view]) => {
    if (view) {
      const isActive = name === targetView;
      view.classList.toggle("hidden", !isActive);
      view.setAttribute("aria-hidden", String(!isActive));
    }
  });

  document.querySelectorAll(".nav-tab").forEach((tab) => {
    const isActive = tab.dataset.view === targetView;
    tab.classList.toggle("active", isActive);
  });

  // Actualizar URLs en vista de configuración
  if (targetView === "config") {
    updateConfigView();
  }
}

// ========================================
// CONSTRUCTOR DE SECUENCIAS
// ========================================

function addMovementToSequence() {
  const commandSelect = document.getElementById("sequenceCommandSelect");
  const durationInput = document.getElementById("sequenceDurationInput");

  const command = commandSelect.value;
  const duration = parseInt(durationInput.value);

  if (duration < 100 || duration > 10000) {
    showNotification("Duración debe estar entre 100 y 10000 ms", "warning");
    return;
  }

  const movement = {
    id: Date.now() + Math.random(),
    command: command,
    duration: duration,
    description: COMMAND_NAMES[command],
  };

  SEQUENCE_STATE.customSequence.push(movement);
  renderSequenceList();
  updateSequenceControls();
  showNotification(`Agregado: ${movement.description}`, "success");
}

function renderSequenceList() {
  const container = document.getElementById("sequenceList");
  const countDisplay = document.getElementById("sequenceCount");

  if (SEQUENCE_STATE.customSequence.length === 0) {
    container.innerHTML = `
      <div class="text-center" style="padding: 20px; opacity: 0.6;">
        <i class="fas fa-list" style="font-size: 24px; margin-bottom: 10px;"></i>
        <p>Sin movimientos. Agrega uno arriba.</p>
      </div>
    `;
    countDisplay.textContent = "0";
    return;
  }

  countDisplay.textContent = SEQUENCE_STATE.customSequence.length;

  container.innerHTML = SEQUENCE_STATE.customSequence
    .map(
      (movement, index) => `
    <div class="sequence-item">
      <span class="sequence-number">${index + 1}.</span>
      <span class="sequence-command">${movement.description}</span>
      <span class="sequence-duration">${movement.duration}ms</span>
      <button class="sequence-remove" onclick="removeMovementFromSequence('${
        movement.id
      }')">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `
    )
    .join("");
}

function removeMovementFromSequence(movementId) {
  SEQUENCE_STATE.customSequence = SEQUENCE_STATE.customSequence.filter(
    (m) => m.id != movementId
  );
  renderSequenceList();
  updateSequenceControls();
  showNotification("Movimiento eliminado", "info");
}

function clearSequence() {
  if (SEQUENCE_STATE.customSequence.length === 0) return;

  SEQUENCE_STATE.customSequence = [];
  renderSequenceList();
  updateSequenceControls();
  showNotification("Secuencia limpiada", "info");
}

function updateSequenceControls() {
  const hasMovements = SEQUENCE_STATE.customSequence.length > 0;
  const executeBtn = document.getElementById("executeSequenceBtn");
  const saveBtn = document.getElementById("saveSequenceBtn");

  if (executeBtn) executeBtn.disabled = !hasMovements;
  if (saveBtn) saveBtn.disabled = !hasMovements;
}

async function executeCustomSequence() {
  if (SEQUENCE_STATE.customSequence.length === 0) {
    showNotification("La secuencia está vacía", "warning");
    return;
  }

  if (!wsClient.ws || wsClient.ws.readyState !== WebSocket.OPEN) {
    showNotification("No hay conexión WebSocket activa", "error");
    return;
  }

  if (SEQUENCE_STATE.isExecuting) {
    showNotification("Ya hay una secuencia ejecutándose", "warning");
    return;
  }

  SEQUENCE_STATE.isExecuting = true;
  const statusEl = document.getElementById("demoStatus");
  const statusTextEl = document.getElementById("demoStatusText");

  if (statusEl) statusEl.classList.remove("hidden");
  disableSequenceControls(true);

  try {
    showNotification("Iniciando secuencia personalizada", "info");

    for (let i = 0; i < SEQUENCE_STATE.customSequence.length; i++) {
      const movement = SEQUENCE_STATE.customSequence[i];

      if (statusTextEl) {
        statusTextEl.textContent = `Paso ${i + 1}/${
          SEQUENCE_STATE.customSequence.length
        }: ${movement.description}`;
      }

      wsClient.sendMovement(movement.command, movement.duration);
      await sleep(movement.duration + 200);
    }

    showNotification("Secuencia completada exitosamente", "success");
  } catch (error) {
    console.error("Error ejecutando secuencia:", error);
    showNotification("Error en la secuencia", "error");
  } finally {
    if (statusEl) statusEl.classList.add("hidden");
    disableSequenceControls(false);
    SEQUENCE_STATE.isExecuting = false;
  }
}

function saveCustomSequence() {
  if (SEQUENCE_STATE.customSequence.length === 0) {
    showNotification("La secuencia está vacía", "warning");
    return;
  }

  const sequenceName = prompt(
    "Nombre para la secuencia:",
    `Secuencia ${Object.keys(SEQUENCE_STATE.savedSequences).length + 1}`
  );

  if (!sequenceName) return;

  SEQUENCE_STATE.savedSequences[sequenceName] = [
    ...SEQUENCE_STATE.customSequence,
  ];
  localStorage.setItem(
    "iot_saved_sequences",
    JSON.stringify(SEQUENCE_STATE.savedSequences)
  );

  showNotification(`Secuencia "${sequenceName}" guardada`, "success");
}

function loadPredefinedDemo(demoType) {
  const predefinedSequences = {
    square: [
      { command: "forward", duration: 2000 },
      { command: "right", duration: 500 },
      { command: "forward", duration: 2000 },
      { command: "right", duration: 500 },
      { command: "forward", duration: 2000 },
      { command: "right", duration: 500 },
      { command: "forward", duration: 2000 },
      { command: "right", duration: 500 },
    ],
    circle: [
      { command: "forward_right", duration: 1000 },
      { command: "forward_right", duration: 1000 },
      { command: "forward_right", duration: 1000 },
      { command: "forward_right", duration: 1000 },
      { command: "forward_right", duration: 1000 },
      { command: "forward_right", duration: 1000 },
      { command: "forward_right", duration: 1000 },
      { command: "forward_right", duration: 1000 },
    ],
    zigzag: [
      { command: "forward", duration: 1000 },
      { command: "right", duration: 300 },
      { command: "forward", duration: 1000 },
      { command: "left", duration: 600 },
      { command: "forward", duration: 1000 },
      { command: "right", duration: 600 },
      { command: "forward", duration: 1000 },
      { command: "left", duration: 300 },
    ],
  };

  const sequence = predefinedSequences[demoType];
  if (!sequence) {
    showNotification("Demo no encontrado", "error");
    return;
  }

  SEQUENCE_STATE.customSequence = [];
  sequence.forEach((movement) => {
    SEQUENCE_STATE.customSequence.push({
      id: Date.now() + Math.random(),
      command: movement.command,
      duration: movement.duration,
      description: COMMAND_NAMES[movement.command],
    });
  });

  renderSequenceList();
  updateSequenceControls();
  showNotification(
    `Demo "${demoType}" cargado (${sequence.length} pasos)`,
    "success"
  );
}

function disableSequenceControls(disabled) {
  const buttons = [
    "addToSequenceBtn",
    "clearSequenceBtn",
    "executeSequenceBtn",
    "saveSequenceBtn",
    "simulateObstacleBtn",
  ];

  buttons.forEach((btnId) => {
    const btn = document.getElementById(btnId);
    if (btn) btn.disabled = disabled;
  });

  document.querySelectorAll(".load-demo-btn").forEach((btn) => {
    btn.disabled = disabled;
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ========================================
// FILTRADO DE MENSAJES
// ========================================

function filterMessages(filterType) {
  const container = document.getElementById("messagesContainer");
  const messages = container.querySelectorAll(".message");

  messages.forEach((message) => {
    if (filterType === "all") {
      message.style.display = "block";
    } else {
      const hasClass = message.classList.contains(`message-${filterType}`);
      message.style.display = hasClass ? "block" : "none";
    }
  });
}

// ========================================
// VISTA DE CONFIGURACIÓN
// ========================================

function updateConfigView() {
  // Actualizar URLs mostradas dinámicamente desde CONFIG
  document.getElementById("apiUrlDisplay").textContent =
    CONFIG.API_BASE_URL + "/api";
  document.getElementById("wsUrlDisplay").textContent = CONFIG.WS_URL;

  // Actualizar estado de conexión
  const statusBadge = document.getElementById("wsConnectionStatus");
  const statusText = document.getElementById("wsConnectionText");

  if (wsClient.ws && wsClient.ws.readyState === WebSocket.OPEN) {
    statusBadge.classList.add("connected");
    statusBadge.classList.remove("disconnected");
    statusText.textContent = "Conectado";
  } else {
    statusBadge.classList.add("disconnected");
    statusBadge.classList.remove("connected");
    statusText.textContent = "Desconectado";
  }
}

function copyToClipboard(elementId) {
  const element = document.getElementById(elementId);
  const text = element.textContent;

  navigator.clipboard
    .writeText(text)
    .then(() => {
      showNotification("Copiado al portapapeles", "success");
    })
    .catch((err) => {
      console.error("Error al copiar:", err);
      showNotification("Error al copiar", "error");
    });
}

async function testAPIConnection() {
  showNotification("Probando conexión API...", "info");
  try {
    const response = await fetch(`${CONFIG.API_URL}/health`);
    if (response.ok) {
      const data = await response.json();
      showNotification("✅ API REST funcionando correctamente", "success");
      console.log("Health check:", data);
    } else {
      showNotification("❌ API respondió con error", "error");
    }
  } catch (error) {
    console.error("Error al conectar con API:", error);
    showNotification("❌ No se pudo conectar con la API", "error");
  }
}

function testWSConnection() {
  if (wsClient.ws && wsClient.ws.readyState === WebSocket.OPEN) {
    showNotification("✅ WebSocket ya está conectado", "success");
  } else {
    showNotification("Intentando conectar WebSocket...", "info");
    wsClient.connect();
  }
}
