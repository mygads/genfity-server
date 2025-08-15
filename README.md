# Genfity Server Platform

Platform server untuk Genfity yang terdiri dari WuzAPI (WhatsApp Gateway) dan Event API dengan konfigurasi Docker yang terintegrasi.

## 🏗️ Arsitektur

### Infrastruktur Utama (Root Level)
- **PostgreSQL 16**: Database utama dengan multiple databases
- **Nginx**: Reverse proxy dengan SSL otomatis
- **Certbot**: Manajemen SSL certificate otomatis

### Services
- **genfity-wuzapi**: WhatsApp Gateway Service (Port 8080)
- **genfity-event-api**: Event Management API (Port 8081)

### Profiles
- **dev**: Hanya database + aplikasi (tanpa SSL/reverse proxy)
- **prod**: Database + aplikasi + reverse proxy + SSL otomatis

## 🚀 Quick Start

### 1. Setup Environment

```bash
# Copy dan edit file environment
cp .env.example .env
```

Edit `.env` file dan sesuaikan dengan konfigurasi Anda:
```env
# Domain Configuration (untuk production)
WUZAPI_DOMAIN=wuzapi.yourdomain.com
EVENTAPI_DOMAIN=eventapi.yourdomain.com
LETSENCRYPT_EMAIL=your-email@domain.com

# Database Configuration
DB_USER=genfity_user
DB_PASSWORD=genfity_password

# Security Tokens
WUZAPI_ADMIN_TOKEN=your_secure_admin_token
WEBHOOK_VERIFY_TOKEN=your_secure_webhook_token
```

### 2. Development Mode

```bash
# Start semua services dalam mode development
./deploy.sh dev

# Start hanya WuzAPI
./deploy.sh dev --service wuzapi

# Start hanya Event API
./deploy.sh dev --service eventapi
```

**Development URLs:**
- WuzAPI: http://localhost:8080
- Event API: http://localhost:8081
- PostgreSQL: localhost:5432

### 3. Production Mode

```bash
# Setup SSL certificates (hanya sekali)
./deploy.sh setup-ssl

# Start production environment
./deploy.sh prod
```

**Production URLs:**
- WuzAPI: https://wuzapi.yourdomain.com
- Event API: https://eventapi.yourdomain.com

## 📋 Management Commands

```bash
# Lihat status semua services
./deploy.sh status

# Lihat logs
./deploy.sh logs
./deploy.sh logs --service wuzapi

# Stop semua services
./deploy.sh stop

# Restart services
./deploy.sh restart

# Cleanup (hapus semua containers & volumes)
./deploy.sh clean
```

## 🗄️ Database Management

### Struktur Database
- **genfity_db**: Database utama
- **wuzapi_db**: Database untuk WuzAPI
- **event_api_db**: Database untuk Event API

### Auto Database Creation
Database akan dibuat otomatis saat service pertama kali dijalankan:
1. Check koneksi ke PostgreSQL
2. Create database jika belum ada
3. Jalankan migrasi (jika ada)

### Manual Database Access
```bash
# Connect ke PostgreSQL container
docker exec -it genfity-postgres psql -U genfity_user -d genfity_db

# Backup database
docker exec genfity-postgres pg_dump -U genfity_user wuzapi_db > wuzapi_backup.sql

# Restore database
docker exec -i genfity-postgres psql -U genfity_user wuzapi_db < wuzapi_backup.sql
```

## 🔧 Configuration Files

### Root Level
- `docker-compose.yml`: Infrastruktur utama (PostgreSQL + Nginx)
- `nginx/nginx.conf`: Konfigurasi Nginx utama
- `nginx/sites-available/`: Konfigurasi per-service
- `scripts/`: Helper scripts

### Per Service
- `genfity-wuzapi/docker-compose.yml`: WuzAPI service
- `genfity-event-api/docker-compose.yml`: Event API service

## 🌐 Network Architecture

```
genfity-network (Docker Bridge Network)
├── genfity-postgres (5432)
├── genfity-nginx (80, 443)
├── genfity-wuzapi (internal: 8080)
└── genfity-event-api (internal: 8081)
```

### Profile Differences

#### Development Profile
- Ports exposed: 5432, 8080, 8081
- No SSL/reverse proxy
- Direct access ke services

#### Production Profile
- Only ports 80, 443 exposed
- SSL termination di Nginx
- Services hanya accessible melalui reverse proxy

## 🔒 SSL Management

### Automatic SSL (Production)
SSL certificates dikelola otomatis oleh Certbot:
- Initial setup: `./deploy.sh setup-ssl`
- Auto-renewal setiap 12 jam
- Certificates tersimpan di volume `certbot_certs`

### Manual SSL Operations
```bash
# Check certificate status
docker exec genfity-certbot certbot certificates

# Renew certificates manually
docker exec genfity-certbot certbot renew

# Add new domain
docker exec genfity-certbot certbot certonly --webroot \
  --webroot-path=/var/www/certbot \
  --email your-email@domain.com \
  --agree-tos \
  -d newdomain.com
```

## 🔍 Monitoring & Debugging

### Health Checks
Semua services memiliki health checks:
```bash
# Check health status
docker ps --format "table {{.Names}}\t{{.Status}}"

# Detailed health check
docker inspect --format='{{.State.Health.Status}}' genfity-wuzapi
```

### Logs
```bash
# Real-time logs
./deploy.sh logs

# Specific service logs
docker logs -f genfity-wuzapi

# Filter logs
docker logs genfity-postgres | grep ERROR
```

### Database Debugging
```bash
# Check database connections
docker exec genfity-postgres pg_stat_activity

# Check database size
docker exec genfity-postgres psql -U genfity_user -c "
SELECT 
    datname,
    pg_size_pretty(pg_database_size(datname)) as size
FROM pg_database 
WHERE datistemplate = false;
"
```

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
# Check PostgreSQL status
docker logs genfity-postgres

# Restart PostgreSQL
docker restart genfity-postgres

# Reset database
./deploy.sh clean
./deploy.sh dev
```

#### SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in /etc/letsencrypt/live/yourdomain.com/fullchain.pem -text -noout

# Recreate certificates
docker exec genfity-certbot certbot delete --cert-name yourdomain.com
./deploy.sh setup-ssl
```

#### Network Issues
```bash
# Recreate network
docker network rm genfity-network
docker network create genfity-network

# Check network connectivity
docker exec genfity-wuzapi ping genfity-postgres
```

### Service-Specific Issues

#### WuzAPI Issues
```bash
# Check WuzAPI logs
docker logs genfity-wuzapi

# Restart WuzAPI only
cd genfity-wuzapi && docker compose restart
```

#### Event API Issues
```bash
# Check Event API logs
docker logs genfity-event-api

# Database migration issues
docker exec genfity-event-api go run main.go migrate
```

## 🔄 Updates & Maintenance

### Update Services
```bash
# Pull latest images
docker compose pull

# Rebuild services
cd genfity-wuzapi && docker compose build --no-cache
cd ../genfity-event-api && docker compose build --no-cache

# Restart with new images
./deploy.sh restart
```

### Backup Strategy
```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)

# Backup databases
docker exec genfity-postgres pg_dump -U genfity_user wuzapi_db > "backup_wuzapi_${DATE}.sql"
docker exec genfity-postgres pg_dump -U genfity_user event_api_db > "backup_eventapi_${DATE}.sql"

# Backup SSL certificates
docker run --rm -v certbot_certs:/certs -v $(pwd):/backup alpine tar czf /backup/ssl_backup_${DATE}.tar.gz -C /certs .
```

## 📞 Support

Untuk bantuan dan support:
1. Check logs untuk error messages
2. Verify network connectivity
3. Check database status
4. Review SSL certificate validity
5. Ensure environment variables are correctly set

## 📝 File Structure

```
Server/
├── docker-compose.yml              # Main infrastructure
├── .env.example                    # Environment template
├── deploy.sh                       # Management script
├── nginx/
│   ├── nginx.conf                  # Main nginx config
│   └── sites-available/
│       ├── wuzapi.conf             # WuzAPI proxy config
│       └── eventapi.conf           # Event API proxy config
├── scripts/
│   ├── init-multiple-databases.sh  # DB initialization
│   └── setup-ssl.sh               # SSL setup script
├── genfity-wuzapi/
│   └── docker-compose.yml         # WuzAPI service
└── genfity-event-api/
    └── docker-compose.yml         # Event API service
```
