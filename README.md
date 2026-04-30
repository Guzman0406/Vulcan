# VulcaCRM — CRM para Vulcanizadora

Sistema de gestión de clientes, vehículos y servicios con recordatorios automáticos por WhatsApp.

## Stack
- **Backend**: NestJS + TypeORM + PostgreSQL
- **Frontend**: React + Tailwind CSS + React Query
- **Mensajería**: Twilio WhatsApp Sandbox
- **Deploy**: DigitalOcean (backend) + Vercel (frontend)

---

## Deploy — Backend en DigitalOcean

### 1. Conectarte al droplet
```bash
ssh root@104.131.163.248
```

### 2. Subir el proyecto
Desde tu computadora local, copia el proyecto al servidor:
```bash
scp -r ./crm-vulcanizadora root@104.131.163.248:/root/
```

O clónalo desde GitHub si ya lo subiste:
```bash
git clone https://github.com/TU_USUARIO/crm-vulcanizadora.git /root/crm-vulcanizadora
```

### 3. Ejecutar el script de deploy
```bash
cd /root/crm-vulcanizadora
chmod +x deploy.sh
bash deploy.sh
```

### 4. Agregar credenciales de Twilio
```bash
nano /root/crm-vulcanizadora/backend/.env
```

Reemplaza estos valores:
```
TWILIO_ACCOUNT_SID=AC...   ← tu SID real
TWILIO_AUTH_TOKEN=...      ← tu Auth Token real
```

### 5. Reiniciar el backend
```bash
pm2 restart crm-vulcanizadora
pm2 logs crm-vulcanizadora   # ver que arrancó bien
```

### 6. Verificar que funciona
Abre en el navegador:
```
http://104.131.163.248:3001/api/docs
```
Deberías ver la documentación Swagger de la API.

---

## Deploy — Frontend en Vercel

### 1. Instalar Vercel CLI
```bash
npm install -g vercel
```

### 2. Entrar a la carpeta del frontend
```bash
cd crm-vulcanizadora/frontend
```

### 3. Crear el archivo .env
```bash
cp .env.example .env
```
El contenido ya tiene la URL correcta del backend:
```
VITE_API_URL=http://104.131.163.248:3001/api
```

### 4. Desplegar
```bash
vercel --prod
```

Vercel te pedirá iniciar sesión. Sigue las instrucciones en pantalla.

Cuando termine, te dará una URL tipo:
```
https://crm-vulcanizadora-xxx.vercel.app
```

### 5. Actualizar CORS en el backend
Edita el `.env` en tu droplet y pon la URL de Vercel:
```bash
nano /root/crm-vulcanizadora/backend/.env
# Cambia: CORS_ORIGIN=https://crm-vulcanizadora-xxx.vercel.app
```
```bash
pm2 restart crm-vulcanizadora
```

---

## Configurar Twilio WhatsApp Sandbox

1. Ve a [console.twilio.com](https://console.twilio.com)
2. En el menú izquierdo: **Messaging → Try it out → Send a WhatsApp message**
3. Sigue las instrucciones para conectar tu WhatsApp al sandbox:
   - Envía el código que te dan (ej: `join bright-example`) al número `+1 415 523 8886`
4. Todos los teléfonos que quieras recibir recordatorios deben hacer este paso una vez

---

## Comandos útiles en producción

```bash
# Ver estado del backend
pm2 status

# Ver logs en tiempo real
pm2 logs crm-vulcanizadora

# Reiniciar
pm2 restart crm-vulcanizadora

# Ver uso de memoria/CPU
pm2 monit

# Si cambias código, recompilar y reiniciar
cd /root/crm-vulcanizadora/backend
npm run build
pm2 restart crm-vulcanizadora
```

---

## Estructura del proyecto

```
crm-vulcanizadora/
├── backend/
│   ├── src/
│   │   ├── customers/          # Módulo de clientes
│   │   ├── vehicles/           # Módulo de vehículos
│   │   ├── service-records/    # Módulo de servicios
│   │   ├── notifications/      # Scheduler + WhatsApp
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── ecosystem.config.js     # Configuración PM2
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/              # Dashboard, Clientes, Servicios, etc.
│   │   ├── components/         # Layout, componentes reutilizables
│   │   ├── services/           # Llamadas a la API
│   │   └── types/              # Tipos TypeScript
│   └── package.json
├── deploy.sh                   # Script de deploy automático
└── README.md
```

---

## Endpoints principales de la API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /api/customers | Crear cliente |
| GET | /api/customers | Listar clientes |
| GET | /api/customers?search=juan | Buscar clientes |
| GET | /api/customers/telefono/:tel | Buscar por teléfono |
| GET | /api/customers/:id | Detalle de cliente |
| POST | /api/vehicles | Agregar vehículo |
| GET | /api/vehicles/customer/:id | Vehículos de un cliente |
| POST | /api/service-records | Registrar servicio |
| GET | /api/service-records/upcoming | Próximos servicios (30 días) |
| GET | /api/service-records/dashboard | Estadísticas |
| POST | /api/notifications/send/:id | Enviar recordatorio manual |
| POST | /api/notifications/run-scheduler | Ejecutar scheduler |
