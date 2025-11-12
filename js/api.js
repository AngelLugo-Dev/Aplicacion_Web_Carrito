// Cliente API REST
class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("❌ Error en petición:", error);
      throw error;
    }
  }

  async get(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${endpoint}?${query}` : endpoint;
    return this.request(url, { method: "GET" });
  }

  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Endpoints específicos
  async healthCheck() {
    return this.get("/api/health");
  }

  async getDevices() {
    return this.get("/api/devices");
  }

  async getDevice(id) {
    return this.get(`/api/devices/${id}`);
  }

  async getEvents(deviceId, limit = 50) {
    return this.get(`/api/events/${deviceId}`, { limit });
  }

  async getOperationalStatus() {
    return this.get("/api/status/operational");
  }

  async getLastMovement(deviceId) {
    return this.get(`/api/movements/last/${deviceId}`);
  }

  async getLastObstacle(deviceId) {
    return this.get(`/api/obstacles/last/${deviceId}`);
  }

  async sendMovement(deviceId, command, duration, meta = {}) {
    return this.post("/api/movements/send", {
      device_id: deviceId,
      command,
      duration_ms: duration,
      meta,
    });
  }

  async simulateObstacle(deviceId, distance) {
    return this.post("/api/simulate/obstacle", {
      device_id: deviceId,
      distance_cm: distance,
      timestamp: new Date().toISOString(),
    });
  }
}

// Instancia global
const api = new APIClient(CONFIG.API_BASE_URL);
