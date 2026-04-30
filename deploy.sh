#!/bin/bash
set -e

echo "================================================"
echo "  VulcaCRM — Deploy Script para DigitalOcean"
echo "================================================"

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# 1. Verificar Node
log "Verificando Node.js..."
node --version || error "Node.js no instalado"
npm --version || error "npm no instalado"

# 2. Instalar PM2 y NestJS CLI globalmente
log "Instalando PM2 y NestJS CLI..."
npm install -g pm2 @nestjs/cli 2>/dev/null || warn "Ya instalados"

# 3. Crear base de datos PostgreSQL
log "Configurando PostgreSQL..."
sudo -u postgres psql -c "CREATE USER crm_user WITH PASSWORD 'CrmVulcan2024!' CREATEDB;" 2>/dev/null || warn "Usuario ya existe"
sudo -u postgres psql -c "CREATE DATABASE crm_vulcanizadora OWNER crm_user;" 2>/dev/null || warn "BD ya existe"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE crm_vulcanizadora TO crm_user;" 2>/dev/null

log "Base de datos lista"

# 4. Crear .env del backend
log "Creando archivo .env..."
cat > /root/crm-vulcanizadora/backend/.env << 'EOF'
DB_HOST=localhost
DB_PORT=5432
DB_USER=crm_user
DB_PASSWORD=CrmVulcan2024!
DB_NAME=crm_vulcanizadora
PORT=3001
NODE_ENV=production
TWILIO_ACCOUNT_SID=REEMPLAZA_CON_TU_SID
TWILIO_AUTH_TOKEN=REEMPLAZA_CON_TU_AUTH_TOKEN
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
CORS_ORIGIN=*
EOF

warn "IMPORTANTE: Edita el .env con tus credenciales de Twilio:"
warn "  nano /root/crm-vulcanizadora/backend/.env"

# 5. Instalar dependencias y compilar backend
log "Instalando dependencias del backend..."
cd /root/crm-vulcanizadora/backend
npm install

log "Compilando backend..."
npm run build

# 6. Configurar PM2
log "Configurando PM2..."
pm2 delete crm-vulcanizadora 2>/dev/null || true
pm2 start dist/main.js --name crm-vulcanizadora --env production
pm2 save
pm2 startup | tail -1 | bash 2>/dev/null || warn "Ejecuta manualmente: pm2 startup"

# 7. Configurar firewall
log "Configurando firewall..."
ufw allow 3001/tcp 2>/dev/null || warn "ufw no disponible"
ufw allow 22/tcp 2>/dev/null || true
ufw allow 80/tcp 2>/dev/null || true

log "================================================"
log "Backend desplegado en http://104.131.163.248:3001"
log "Swagger docs: http://104.131.163.248:3001/api/docs"
log "================================================"
echo ""
warn "Próximos pasos:"
echo "  1. Edita el .env con tus tokens de Twilio"
echo "  2. Reinicia: pm2 restart crm-vulcanizadora"
echo "  3. Despliega el frontend en Vercel"
echo ""
log "Para ver logs: pm2 logs crm-vulcanizadora"
