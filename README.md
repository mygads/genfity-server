# Genfity Server Platform

Platform server modular untuk Genfity yang terdiri dari WuzAPI (WhatsApp Gateway) dan Event API dengan arsitektur microservices menggunakan Docker.

## 🏗️ Arsitektur Modular

### Root Level (Infrastructure)
- **PostgreSQL 16**: Database utama dengan multiple databases
- **Nginx**: Reverse proxy dengan auto-generated configuration  
- **Certbot**: SSL certificate management otomatis

### Individual Projects
- **genfity-wa**: WhatsApp Gateway Service (mandiri dengan `.env` sendiri)
- **genfity-chat-ai**: Event Management API (mandiri dengan `.env` sendiri)

Setiap project dapat dijalankan independen atau bersama-sama melalui script management di root.

## 🚀 Quick Start

### 1. Setup Environment

**Root Level (Infrastructure):**
```bash
# Copy dan edit file environment infrastruktur
cp .env.example .env
```

Edit `.env` root untuk infrastruktur dan domain mapping:
```env
# Database & Infrastructure
DB_USER=genfity_user
DB_PASSWORD=genfity_password
LETSENCRYPT_EMAIL=genfity@gmail.com

# Domain Mapping (untuk production)
WUZAPI_DOMAIN=wa.genfity.com
WUZAPI_PORT=8080
WUZAPI_CONTAINER=genfity-wa

EVENTAPI_DOMAIN=api.genfity.com
EVENTAPI_PORT=8081
EVENTAPI_CONTAINER=genfity-chat-ai
```

**Per Project:**
```bash
# WuzAPI
cd genfity-wa
cp .env.example .env
# Edit .env dengan konfigurasi WuzAPI

# Event API  
cd genfity-chat-ai
cp .env.example .env
# Edit .env dengan konfigurasi Event API
```

### 2. Development Mode

```bash
# Windows PowerShell
.\deploy.ps1 dev                  # Start semua services
.\deploy.ps1 dev wuzapi          # Start hanya WuzAPI + database
.\deploy.ps1 dev eventapi        # Start hanya Event API + database

# Linux/Mac
./deploy.sh dev                   # Start semua services
./deploy.sh dev wuzapi           # Start hanya WuzAPI + database
```

**Development URLs:**
- WuzAPI: http://localhost:8080
- Event API: http://localhost:8081
- PostgreSQL: localhost:5432

### 3. Production Mode

```bash
# Windows PowerShell
.\deploy.ps1 config              # Generate nginx config dari .env
.\deploy.ps1 prod                # Start production environment

# Linux/Mac  
./deploy.sh config               # Generate nginx config dari .env
./deploy.sh prod                 # Start production environment
```

**Production URLs:**
- WuzAPI: https://wa.genfity.com
- Event API: https://api.genfity.com

## 📋 Management Commands

### Basic Operations
```bash
# Status semua services
.\deploy.ps1 status

# Logs specific service
.\deploy.ps1 logs wuzapi
.\deploy.ps1 logs eventapi

# Stop services
.\deploy.ps1 stop all
.\deploy.ps1 stop wuzapi

# Restart services
.\deploy.ps1 restart eventapi

# Generate nginx config
.\deploy.ps1 config

# Cleanup everything
.\deploy.ps1 clean
```

### Service-Specific Deployment
```bash
# Development
.\deploy.ps1 dev infrastructure  # Hanya database
.\deploy.ps1 dev wuzapi          # WuzAPI + database
.\deploy.ps1 dev eventapi        # Event API + database
.\deploy.ps1 dev all             # Semua services

# Production  
.\deploy-simple.ps1 prod infrastructure # Database + Nginx + SSL
.\deploy-simple.ps1 prod wuzapi         # WuzAPI + infrastructure
.\deploy-simple.ps1 prod eventapi       # Event API + infrastructure
.\deploy-simple.ps1 prod all            # Semua services + infrastructure
```

## 🔧 Configuration Structure

### Root Level Configuration (`.env`)
```env
# Infrastructure only
DB_USER=genfity_user
DB_PASSWORD=genfity_password
POSTGRES_MULTIPLE_DATABASES=wuzapi_db,event_api_db

# Domain mapping for reverse proxy
WUZAPI_DOMAIN=wa.genfity.com
WUZAPI_PORT=8080
WUZAPI_CONTAINER=genfity-wa

EVENTAPI_DOMAIN=api.genfity.com  
EVENTAPI_PORT=8081
EVENTAPI_CONTAINER=genfity-chat-ai
```

### Per Project Configuration

**genfity-wa/.env:**
```env
# Database connection
DB_HOST=genfity-postgres
DB_USER=genfity_user
DB_PASSWORD=genfity_password
DB_NAME=wuzapi_db

# Application settings
PORT=8080
WUZAPI_ADMIN_TOKEN=your_secure_token
```

**genfity-chat-ai/.env:**
```env
# Database connection
DB_HOST=genfity-postgres
DB_USER=genfity_user
DB_PASSWORD=genfity_password
DB_NAME=event_api_db

# Application settings
PORT=8081
WEBHOOK_VERIFY_TOKEN=your_secure_token
```

## 🌐 Network Architecture

```
genfity-network (Docker Bridge Network)
├── genfity-postgres (5432)
├── genfity-nginx (80, 443) [prod only]
├── genfity-wa (internal: 8080)
└── genfity-chat-ai (internal: 8081)
```

### Mode Differences

#### Development Mode
- Ports exposed: 5432, 8080, 8081
- No SSL/reverse proxy
- Direct access to services
- Each service runs independently

#### Production Mode  
- Only ports 80, 443 exposed
- SSL termination at Nginx
- Auto-generated nginx configuration
- Services accessible via reverse proxy

## 🔒 SSL & Nginx Auto-Configuration

### Automatic Nginx Configuration
Nginx configuration dibuat otomatis berdasarkan variabel di `.env` root:

```bash
# Generate config dari .env
.\deploy.ps1 config
```

Script akan membuat file nginx configuration untuk setiap service yang didefinisikan:
- `WUZAPI_DOMAIN` → `nginx/sites-available/wuzapi.conf`
- `EVENTAPI_DOMAIN` → `nginx/sites-available/eventapi.conf`

### SSL Management
```bash
# Setup SSL certificates (manual)
docker exec genfity-certbot certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email genfity@gmail.com \
  --agree-tos \
  -d wa.genfity.com

# Auto-renewal berjalan setiap 12 jam
```

## ➕ Menambah Service Baru

### 1. Tambah di `.env` Root
```env
# New Service Configuration
NEWSERVICE_DOMAIN=new.genfity.com
NEWSERVICE_PORT=8082
NEWSERVICE_CONTAINER=genfity-newservice
```

### 2. Buat Project Directory
```bash
mkdir genfity-newservice
cd genfity-newservice

# Buat .env.example
cat > .env.example << EOF
DB_HOST=genfity-postgres
DB_PORT=5432
DB_USER=genfity_user
DB_PASSWORD=genfity_password
DB_NAME=newservice_db
PORT=8082
EOF

# Buat docker-compose.yml (ikuti pattern existing)
```

### 3. Generate dan Deploy
```bash
# Generate nginx config otomatis
.\deploy-simple.ps1 config

# Start new service
.\deploy-simple.ps1 prod newservice
```

## 🔍 Monitoring & Debugging

### Health Checks
```bash
# Check semua service status
.\deploy-simple.ps1 status

# Check specific service health
docker inspect --format='{{.State.Health.Status}}' genfity-wa
```

### Logs Analysis
```bash
# Real-time logs per service
.\deploy-simple.ps1 logs wuzapi
.\deploy-simple.ps1 logs eventapi

# Filter logs
docker logs genfity-postgres | findstr ERROR
```

### Database Operations
```bash
# Connect to PostgreSQL
docker exec -it genfity-postgres psql -U genfity_user -d genfity_db

# List databases
docker exec genfity-postgres psql -U genfity_user -c "\l"

# Backup specific database
docker exec genfity-postgres pg_dump -U genfity_user wuzapi_db > backup.sql
```

## 🚨 Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check .env file exists
ls genfity-wa/.env

# Check container logs
.\deploy-simple.ps1 logs wuzapi

# Restart service
.\deploy-simple.ps1 restart wuzapi
```

#### Database Connection Issues
```bash
# Check PostgreSQL status
docker logs genfity-postgres

# Test database connectivity  
docker exec genfity-postgres pg_isready -U genfity_user

# Restart database
.\deploy-simple.ps1 restart infrastructure
```

#### SSL/Nginx Issues
```bash
# Regenerate nginx config
.\deploy-simple.ps1 config

# Check nginx config
docker exec genfity-nginx nginx -t

# Check SSL certificates
docker exec genfity-certbot certbot certificates
```

### Recovery Procedures

#### Complete Reset
```bash
# Stop everything
.\deploy-simple.ps1 stop all

# Clean all resources  
.\deploy-simple.ps1 clean

# Restart from scratch
.\deploy-simple.ps1 dev
```

#### Database Recovery
```bash
# Restore from backup
docker exec -i genfity-postgres psql -U genfity_user wuzapi_db < backup.sql
```

## 📁 Project Structure

```
Server/
├── docker-compose.yml              # Infrastructure (PostgreSQL + Nginx)
├── .env.example                    # Infrastructure configuration template
├── deploy-simple.ps1               # Windows management script
├── deploy-simple.sh                # Linux/Mac management script
├── nginx/
│   ├── nginx.conf                  # Main nginx configuration
│   └── sites-available/            # Auto-generated service configs
├── scripts/
│   ├── generate-nginx-config.sh    # Auto-generate nginx configs
│   └── init-multiple-databases.sh  # Database initialization
├── genfity-wa/
│   ├── docker-compose.yml         # WuzAPI service only
│   ├── .env.example               # WuzAPI configuration template
│   ├── Dockerfile
│   └── ... (source code)
└── genfity-chat-ai/
    ├── docker-compose.yml         # Event API service only  
    ├── .env.example               # Event API configuration template
    ├── Dockerfile
    └── ... (source code)
```

## 🎯 Key Benefits

- ✅ **True Modularity**: Each service can run independently
- ✅ **Auto-Configuration**: Nginx configs generated from environment
- ✅ **Flexible Deployment**: Deploy specific services or all together
- ✅ **Easy Scaling**: Add new services by editing `.env` and creating project folder
- ✅ **Clean Separation**: Infrastructure vs application configuration
- ✅ **Development Friendly**: No need for SSL/proxy in development
- ✅ **Production Ready**: Automatic SSL and reverse proxy in production

## 📞 Support

Untuk bantuan:
1. Check service status: `.\deploy-simple.ps1 status`
2. Check logs: `.\deploy-simple.ps1 logs [service]`
3. Verify `.env` files exist and are configured correctly
4. Restart problematic service: `.\deploy-simple.ps1 restart [service]`
5. Generate fresh nginx config: `.\deploy-simple.ps1 config`
