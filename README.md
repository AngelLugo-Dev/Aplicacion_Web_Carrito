# Frontend IoT Car Control - WebSocket Puro

Interfaz web moderna con WebSocket nativo del navegador (sin Socket.IO).

## 🚀 Uso Rápido

### 1. Configurar la URL del Backend

Editar `js/config.js` y cambiar las URLs:

```javascript
const CONFIG = {
  // PRODUCCIÓN ACTUAL (IP Elástica EC2)
  API_BASE_URL: "http://54.204.39.238:5500",
  WS_URL: "ws://54.204.39.238:5500/ws",

  // Desarrollo local (comentado)
  // API_BASE_URL: "http://localhost:5500",
  // WS_URL: "ws://localhost:5500/ws",

  DEFAULT_DEVICE_ID: 1,
};
```

### 2. Abrir en el Navegador

Simplemente abrir `index.html` en tu navegador:

- Doble clic en el archivo
- O usar un servidor local (recomendado):

**Con Python:**

```powershell
python -m http.server 8080
```

**Con Node.js (http-server):**

```powershell
npx http-server -p 8080
```

Luego abrir: http://localhost:8080

### 3. Verificar Conexión

- El indicador en la esquina superior derecha debe mostrar "Conectado" en verde
- Si aparece "Desconectado" en rojo, verificar que el backend esté corriendo

## 🎮 Controles

### Con el Mouse

- Hacer clic en los botones de dirección
- Ajustar duración con el slider
- Botón rojo "DETENER" para parar

### Con el Teclado

- **W** o **↑**: Adelante
- **S** o **↓**: Atrás
- **A** o **←**: Giro 90° izquierda
- **D** o **→**: Giro 90° derecha
- **ESPACIO** o **ESC**: Detener

## 📡 Características

### WebSocket Nativo

- **Sin dependencias externas** (no Socket.IO client)
- Usa la API nativa `WebSocket` del navegador
- Reconexión automática (máximo 5 intentos)
- Heartbeat para mantener conexión viva

### Panel en Tiempo Real

- Mensajes push instantáneos
- Confirmaciones de comandos
- Alertas de obstáculos
- Actualizaciones de estado

### Estadísticas

- Contador de comandos enviados
- Contador de obstáculos detectados
- Temporizador de sesión

### Historial

- Últimos 20 eventos del dispositivo
- Fecha, hora, comando, duración
- Actualización manual con botón

## 📂 Estructura de Archivos

```
frontendws/
├── index.html              # Interfaz principal
├── css/
│   └── styles.css         # Estilos modernos
└── js/
    ├── config.js          # Configuración (URLs, etc.)
    ├── websocket.js       # Cliente WebSocket nativo
    ├── api.js             # Cliente REST
    └── app.js             # Lógica de la aplicación
```

## 🔧 Personalización

### Cambiar ID del Dispositivo

En `js/config.js`:

```javascript
DEFAULT_DEVICE_ID: 2; // Cambiar de 1 a 2
```

O usar el campo "ID de Dispositivo" en la interfaz.

### Cambiar Duración por Defecto

En `js/config.js`:

```javascript
DEFAULT_DURATION: 2000; // 2 segundos en lugar de 1
```

### Ajustar Reconexión

En `js/config.js`:

```javascript
RECONNECT_INTERVAL: 5000,      // Esperar 5 segundos entre intentos
MAX_RECONNECT_ATTEMPTS: 10     // Intentar 10 veces
```

## 📡 Comunicación WebSocket

### Mensajes que Envía el Frontend

#### Registrar dispositivo (automático al conectar)

```javascript
{
  type: 'register_device',
  data: {
    device_id: 1,
    device_name: 'Carrito-1'
  }
}
```

#### Enviar comando de movimiento

```javascript
{
  type: 'movement_command',
  data: {
    device_id: 1,
    command: 'forward',
    duration_ms: 1000,
    meta: {
      origin: 'web_interface',
      timestamp: '2025-11-12T10:30:00.000Z'
    }
  }
}
```

### Mensajes que Recibe del Backend

#### Conexión exitosa

```javascript
{
  type: 'connected',
  message: 'Conectado al servidor WebSocket'
}
```

#### Registro exitoso

```javascript
{
  type: 'registration_success',
  device_id: 1,
  device_name: 'Carrito-1'
}
```

#### Comando confirmado

```javascript
{
  type: 'command_sent',
  device_id: 1,
  command: 'forward',
  status_clave: 1,
  duration_ms: 1000,
  timestamp: '2025-11-12T10:30:00.000Z'
}
```

#### Alerta de obstáculo

```javascript
{
  type: 'obstacle_alert',
  device_id: 1,
  status_clave: 1,
  meta: { distance_cm: 15 }
}
```

## 🚀 Desplegar en GitHub Pages

### 1. Subir a GitHub

```bash
git init
git add .
git commit -m "Frontend IoT WebSocket"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

### 2. Configurar GitHub Pages

- Ir a Settings → Pages
- Source: Deploy from a branch
- Branch: main → /root
- Save

### 3. Actualizar URLs

Editar `js/config.js` con la IP pública de tu EC2:

```javascript
API_BASE_URL: "http://54.204.39.238:5500",
WS_URL: "ws://54.204.39.238:5500/ws"
```

### 4. Acceder

Tu sitio estará en: `https://TU_USUARIO.github.io/TU_REPO/`

## 🔒 Seguridad

### CORS

El backend ya tiene CORS habilitado para cualquier origen (`*`).

Para producción, puedes restringir en el backend (`backendws/.env`):

```
CORS_ORIGINS=https://tu-usuario.github.io
```

### HTTPS

- GitHub Pages automáticamente usa HTTPS
- Si tu EC2 solo tiene HTTP, el navegador puede bloquear WebSocket
- Soluciones:
  1. Usar IP local para desarrollo
  2. Configurar certificado SSL en EC2 (Let's Encrypt)
  3. Usar proxy inverso (Nginx/Caddy)

## ❓ Troubleshooting

### "Desconectado" (rojo)

1. Verificar que el backend esté corriendo: http://localhost:5500/api/health
2. Revisar las URLs en `js/config.js`
3. Abrir consola del navegador (F12) para ver errores

### No se envían comandos

1. Verificar que el indicador esté en verde "Conectado"
2. Revisar consola del navegador
3. Verificar ID del dispositivo

### WebSocket se cierra constantemente

1. Firewall podría estar bloqueando WebSocket
2. Verificar que el puerto 5500 esté abierto
3. Revisar logs del backend

### Mixed Content (HTTP/HTTPS)

Si el frontend está en HTTPS (GitHub Pages) pero el backend en HTTP:

- El navegador bloqueará WebSocket por seguridad
- Solución: Configurar HTTPS en el backend o usar túnel (ngrok)

## 📝 Notas Técnicas

- **No usa Socket.IO**: WebSocket puro del navegador (`WebSocket` API)
- **Sin dependencias JavaScript**: Todo es vanilla JS
- **Compatible con navegadores modernos**: Chrome, Firefox, Edge, Safari
- **Responsive**: Se adapta a móviles y tablets
- **Sin build**: No necesita compilación, funciona directamente

## 🎨 Personalizar Estilos

Los estilos están en `css/styles.css`. Es fácil cambiar colores, tamaños, etc.

### Ejemplo: Cambiar color principal

```css
body {
  background: linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%);
}
```

### Ejemplo: Cambiar tamaño de botones

```css
.control-btn {
  padding: 30px 15px; /* Más grandes */
  font-size: 16px;
}
```

## 📞 Soporte

Si tienes problemas:

1. Revisar la consola del navegador (F12)
2. Verificar que el backend esté corriendo
3. Comprobar configuración de red/firewall
4. Revisar documentación del backend en `backendws/README.md`
