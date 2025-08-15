# Genfity Server Platform

Platform server modular untuk Genfity yang terdiri dari 4 layanan utama dengan arsitektur microservices menggunakan Docker.

## 🏗️ Arsitektur Modular

### Root Level (Infrastructure)
- **PostgreSQL 16**: Database utama dengan multiple databases
- **Nginx**: Reverse proxy dengan auto-generated configuration  
- **Certbot**: SSL certificate management otomatis

### Individual Projects
- **genfity-wa**: WhatsApp Gateway Service (mandiri dengan `.env` sendiri)
- **genfity-chat-ai**: Chat AI (mandiri dengan `.env` sendiri)
- **genfity-backend**: Backend API Next.js (dengan database connection)
- **genfity-frontend**: Frontend Next.js (UI/Dashboard)

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
DB_NAME=genfity_app
LETSENCRYPT_EMAIL=genfity@gmail.com

# Domain Mapping (untuk production)
WA_DOMAIN=wa.genfity.com
WA_PORT=8080
WA_CONTAINER=genfity-wa

CHAT_AI_DOMAIN=api.genfity.com
CHAT_AI_PORT=8081
CHAT_AI_CONTAINER=genfity-chat-ai

BACKEND_DOMAIN=api-v1.genfity.com
BACKEND_PORT=8090
BACKEND_CONTAINER=genfity-backend

FRONTEND_DOMAIN=fe.genfity.com
FRONTEND_PORT=8050
FRONTEND_CONTAINER=genfity-frontend
```

**Per Project:**
```bash
# WA
cd genfity-wa
cp .env.example .env
# Edit .env dengan konfigurasi WA

# CHAT AI
cd genfity-chat-ai
cp .env.example .env
# Edit .env dengan konfigurasi CHAT AI

# Backend API
cd genfity-backend
cp .env.example .env
# Edit .env dengan konfigurasi Backend

# Frontend
cd genfity-frontend
cp .env.example .env
# Edit .env dengan konfigurasi Frontend
```

### 2. Development Mode

```bash
# Windows PowerShell
.\deploy.ps1 dev                  # Start semua services dalam development mode
.\deploy.ps1 dev wa             # Start hanya WA + database
.\deploy.ps1 dev chat-ai        # Start hanya Chat AI + database
.\deploy.ps1 dev backend         # Start hanya Backend + database (npm run dev)
.\deploy.ps1 dev frontend        # Start hanya Frontend (npm run dev)

# Linux/Mac
./deploy.sh dev                   # Start semua services dalam development mode
./deploy.sh dev wa           # Start hanya WA + database
./deploy.sh dev backend          # Start hanya Backend + database (npm run dev)
```

**Development Mode Features:**
- **Next.js projects** menjalankan `npm run dev` untuk hot reload
- **Volume mounting** untuk live code changes
- **No SSL/Nginx** - direct port access
- **Development optimizations** aktif

**Development URLs:**
- WA: http://localhost:8080
- Chat AI: http://localhost:8081
- Backend API: http://localhost:8090 (npm run dev)
- Frontend: http://localhost:8050 (npm run dev)
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

**Production Mode Features:**
- **Next.js projects** menjalankan `npm run build` + `npm run start`
- **Optimized builds** dengan standalone output
- **SSL termination** di Nginx dengan auto-renewal
- **Reverse proxy** configuration
- **Production optimizations** aktif

**Production URLs:**
- WA: https://wa.genfity.com
- Chat AI: https://api.genfity.com
- Backend API: https://api-v1.genfity.com (built & optimized)
- Frontend: https://fe.genfity.com (built & optimized)

## 📋 Management Commands

### Basic Operations
```bash
# Status semua services
.\deploy.ps1 status

# Logs specific service
.\deploy.ps1 logs wa
.\deploy.ps1 logs chat-ai

# Stop services
.\deploy.ps1 stop all
.\deploy.ps1 stop wa
.\deploy.ps1 stop backend

# Restart services
.\deploy.ps1 restart chat-ai
.\deploy.ps1 restart frontend

# Generate nginx config
.\deploy.ps1 config

# Cleanup everything
.\deploy.ps1 clean
```

### Service-Specific Deployment
```bash
# Development
.\deploy.ps1 dev infrastructure  # Hanya database
.\deploy.ps1 dev wa          # wa + database
.\deploy.ps1 dev chat-ai        # Event API + database
.\deploy.ps1 dev backend         # Backend + database
.\deploy.ps1 dev frontend        # Frontend saja
.\deploy.ps1 dev all             # Semua services

# Production  
.\deploy.ps1 prod infrastructure # Database + Nginx + SSL
.\deploy.ps1 prod wa         # wa + infrastructure
.\deploy.ps1 prod chat-ai       # Event API + infrastructure
.\deploy.ps1 prod backend        # Backend + infrastructure
.\deploy.ps1 prod frontend       # Frontend + infrastructure
.\deploy.ps1 prod all            # Semua services + infrastructure
```

## 🔧 Configuration Structure

### Root Level Configuration (`.env`)
```env
# Infrastructure only
DB_USER=genfity_user
DB_PASSWORD=genfity_password
DB_NAME=genfity_app
POSTGRES_MULTIPLE_DATABASES=wa_db,chat-ai_db

# Domain mapping for reverse proxy
WA_DOMAIN=wa.genfity.com
WA_PORT=8080
WA_CONTAINER=genfity-wa

CHAT_AI_DOMAIN=api.genfity.com  
CHAT_AI_PORT=8081
CHAT_AI_CONTAINER=genfity-chat-ai

BACKEND_DOMAIN=api-v1.genfity.com
BACKEND_PORT=8090
BACKEND_CONTAINER=genfity-backend

FRONTEND_DOMAIN=fe.genfity.com
FRONTEND_PORT=8050
FRONTEND_CONTAINER=genfity-frontend
```

### Per Project Configuration

**genfity-wa/.env:**
```env
# Database connection
DB_HOST=genfity-postgres
DB_USER=genfity_user
DB_PASSWORD=genfity_password
DB_NAME=wa_db

# Application settings
PORT=8080
WA_ADMIN_TOKEN=your_secure_token
```

**genfity-chat-ai/.env:**
```env
# Database connection
DB_HOST=genfity-postgres
DB_USER=genfity_user
DB_PASSWORD=genfity_password
DB_NAME=chat-ai_db

# Application settings
PORT=8081
WEBHOOK_VERIFY_TOKEN=your_secure_token
```

**genfity-backend/.env:**
```env
# Database connection
DB_USER=genfity_user
DB_PASSWORD=genfity_password
DB_NAME=genfity_app
DATABASE_URL=postgresql://genfity_user:genfity_password@genfity-db-postgres:5432/genfity_app

# Application settings
PORT=8090
NEXTAUTH_SECRET=your_nextauth_secret
JWT_SECRET=your_jwt_secret

# API integrations
WHATSAPP_API_URL=http://genfity-wa:8080
CHAT_AI_API_URL=http://genfity-chat-ai:8070
```

**genfity-frontend/.env:**
```env
# Application settings
PORT=8050
NEXT_PUBLIC_API_URL=http://localhost:8090
NEXT_PUBLIC_APP_NAME=Genfity Digital Solutions

# NextAuth
NEXTAUTH_URL=http://localhost:8050
NEXTAUTH_SECRET=your_nextauth_secret

# External services
NEXT_PUBLIC_WHATSAPP_API_URL=http://localhost:8080
NEXT_PUBLIC_CHAT_AI_API_URL=http://localhost:8070
```

## 🌐 Network Architecture

```
genfity-network (Docker Bridge Network)
├── genfity-postgres (5432)
├── genfity-nginx (80, 443) [prod only]
├── genfity-wa (internal: 8080)
├── genfity-chat-ai (internal: 8070)
├── genfity-backend (internal: 8090)
└── genfity-frontend (internal: 8050)
```

### Mode Differences

#### Development Mode
- Ports exposed: 5432, 8080, 8070, 8090, 8050
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
- `WA_DOMAIN` → `nginx/sites-available/wa.conf`
- `CHAT_AI_DOMAIN` → `nginx/sites-available/chat-ai.conf`
- `BACKEND_DOMAIN` → `nginx/sites-available/backend.conf`
- `FRONTEND_DOMAIN` → `nginx/sites-available/frontend.conf`

### SSL Management
```bash
# Setup SSL certificates (manual)
docker exec genfity-certbot certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email genfity@gmail.com \
  --agree-tos \
  -d wa.genfity.com \
  -d api.genfity.com \
  -d api-v1.genfity.com \
  -d fe.genfity.com

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
.\deploy.ps1 config

# Start new service
.\deploy.ps1 prod newservice
```

## 🔍 Monitoring & Debugging

### Health Checks
```bash
# Check semua service status
.\deploy.ps1 status

# Check specific service health
docker inspect --format='{{.State.Health.Status}}' genfity-wa
docker inspect --format='{{.State.Health.Status}}' genfity-backend
```

### Logs Analysis
```bash
# Real-time logs per service
.\deploy.ps1 logs wa
.\deploy.ps1 logs chat-ai
.\deploy.ps1 logs backend
.\deploy.ps1 logs frontend

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
docker exec genfity-postgres pg_dump -U genfity_user wa_db > backup.sql
```

## 🚨 Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check .env file exists
ls genfity-wa/.env
ls genfity-backend/.env

# Check container logs
.\deploy.ps1 logs wa
.\deploy.ps1 logs backend

# Restart service
.\deploy.ps1 restart wa
.\deploy.ps1 restart backend
```

#### Database Connection Issues
```bash
# Check PostgreSQL status
docker logs genfity-postgres

# Test database connectivity  
docker exec genfity-postgres pg_isready -U genfity_user

# Restart database
.\deploy.ps1 restart infrastructure
```

#### SSL/Nginx Issues
```bash
# Regenerate nginx config
.\deploy.ps1 config

# Check nginx config
docker exec genfity-nginx nginx -t

# Check SSL certificates
docker exec genfity-certbot certbot certificates
```

#### Backend/Frontend Issues
```bash
# Check database connection from backend
docker exec genfity-backend npm run db:status

# Check build issues
.\deploy.ps1 logs backend
.\deploy.ps1 logs frontend

# Rebuild containers
docker compose down
docker compose build --no-cache
.\deploy.ps1 dev backend
```

### Recovery Procedures

#### Complete Reset
```bash
# Stop everything
.\deploy.ps1 stop all

# Clean all resources  
.\deploy.ps1 clean

# Restart from scratch
.\deploy.ps1 dev
```

#### Database Recovery
```bash
# Restore from backup
docker exec -i genfity-postgres psql -U genfity_user genfity_app < backup.sql

# Reset backend database
cd genfity-backend
docker compose exec genfity-backend npm run db:reset
```

## 📁 Project Structure

```
Server/
├── docker-compose.yml              # Infrastructure (PostgreSQL + Nginx)
├── .env.example                    # Infrastructure configuration template
├── deploy.ps1                      # Windows management script
├── deploy.sh                       # Linux/Mac management script
├── nginx/
│   ├── nginx.conf                  # Main nginx configuration
│   └── sites-available/            # Auto-generated service configs
├── scripts/
│   ├── generate-nginx-config.sh    # Auto-generate nginx configs
│   └── init-multiple-databases.sh  # Database initialization
├── genfity-wa/
│   ├── docker-compose.yml         # WA service only
│   ├── .env.example               # WA configuration template
│   ├── Dockerfile
│   └── ... (source code)
├── genfity-chat-ai/
│   ├── docker-compose.yml         # Event API service only  
│   ├── .env.example               # Event API configuration template
│   ├── Dockerfile
│   └── ... (source code)
├── genfity-backend/
│   ├── docker-compose.yml         # Backend API service
│   ├── .env.example               # Backend configuration template
│   ├── Dockerfile
│   ├── Dockerfile.setup           # Setup dependencies
│   ├── healthcheck.js             # Health check script
│   └── ... (Next.js source code)
└── genfity-frontend/
    ├── docker-compose.yml         # Frontend service
    ├── .env.example               # Frontend configuration template
    ├── Dockerfile
    ├── Dockerfile.setup           # Setup dependencies
    ├── healthcheck.js             # Health check script
    └── ... (Next.js source code)
```

## 🎯 Key Benefits

- ✅ **True Modularity**: Each service can run independently
- ✅ **Auto-Configuration**: Nginx configs generated from environment
- ✅ **Flexible Deployment**: Deploy specific services or all together
- ✅ **Easy Scaling**: Add new services by editing `.env` and creating project folder
- ✅ **Clean Separation**: Infrastructure vs application configuration
- ✅ **Development Friendly**: No need for SSL/proxy in development
- ✅ **Production Ready**: Automatic SSL and reverse proxy in production
- ✅ **Next.js Optimized**: Standalone builds for efficient containerization
- ✅ **Database Integration**: Prisma ORM with automated migrations
- ✅ **Health Monitoring**: Built-in health checks for all services

## 📞 Support

Untuk bantuan:
1. Check service status: `.\deploy.ps1 status`
2. Check logs: `.\deploy.ps1 logs [service]`
3. Verify `.env` files exist and are configured correctly
4. Restart problematic service: `.\deploy.ps1 restart [service]`
5. Generate fresh nginx config: `.\deploy.ps1 config`
