# Quick Start Guide - Windows

## Persiapan

1. **Install Prerequisites:**
   - Docker Desktop for Windows
   - Git for Windows (optional, untuk Git Bash)
   - WSL2 (optional, untuk menjalankan bash scripts)

2. **Setup Project:**
   ```powershell
   # Clone atau copy project ke folder Anda
   cd C:\Yoga\Genfity\Server
   
   # Copy dan edit environment file
   copy .env.example .env
   ```

3. **Edit file .env:**
   ```env
   # Untuk development, cukup edit yang ini:
   DB_USER=genfity_user
   DB_PASSWORD=your_secure_password
   WUZAPI_ADMIN_TOKEN=your_secure_admin_token
   WEBHOOK_VERIFY_TOKEN=your_secure_webhook_token
   
   # Untuk production, tambahkan domain:
   WUZAPI_DOMAIN=wuzapi.yourdomain.com
   EVENTAPI_DOMAIN=eventapi.yourdomain.com
   LETSENCRYPT_EMAIL=your-email@domain.com
   ```

## Development Mode (Recommended untuk testing)

```powershell
# Start development environment
.\deploy.ps1 dev

# Check status
.\deploy.ps1 status

# View logs
.\deploy.ps1 logs
```

**Access URLs:**
- WuzAPI: http://localhost:8080
- Event API: http://localhost:8081
- PostgreSQL: localhost:5432

## Production Mode (Untuk server production)

```powershell
# Setup SSL certificates (hanya sekali)
.\deploy.ps1 setup-ssl

# Start production environment
.\deploy.ps1 prod
```

**Access URLs:**
- WuzAPI: https://wuzapi.yourdomain.com
- Event API: https://eventapi.yourdomain.com

## Management Commands

```powershell
# Start specific service only
.\deploy.ps1 dev -Service wuzapi
.\deploy.ps1 dev -Service eventapi

# View logs for specific service
.\deploy.ps1 logs -Service wuzapi

# Stop all services
.\deploy.ps1 stop

# Restart services
.\deploy.ps1 restart

# Clean up everything (remove all containers/volumes)
.\deploy.ps1 clean
```

## Troubleshooting

### Database Connection Issues
```powershell
# Check PostgreSQL logs
docker logs genfity-postgres

# Restart database
docker restart genfity-postgres
```

### Service Not Starting
```powershell
# Check service logs
docker logs genfity-wuzapi
docker logs genfity-event-api

# Rebuild and restart
.\deploy.ps1 clean
.\deploy.ps1 dev
```

### Network Issues
```powershell
# Check network
docker network ls
docker network inspect genfity-network

# Recreate network
docker network rm genfity-network
docker network create genfity-network
```

### Port Already in Use
```powershell
# Check what's using the port
netstat -ano | findstr :8080
netstat -ano | findstr :5432

# Kill process if needed
taskkill /PID <PID_NUMBER> /F
```

## Database Access

```powershell
# Connect to PostgreSQL
docker exec -it genfity-postgres psql -U genfity_user -d genfity_db

# List databases
docker exec genfity-postgres psql -U genfity_user -c "\l"

# Backup database
docker exec genfity-postgres pg_dump -U genfity_user wuzapi_db > wuzapi_backup.sql
```

## File Structure

```
Server/
├── deploy.ps1                     # Windows management script
├── deploy.sh                      # Linux management script  
├── docker-compose.yml             # Main infrastructure
├── .env                          # Your configuration
├── nginx/                        # Nginx configuration
├── scripts/                      # Helper scripts
├── genfity-wuzapi/              # WuzAPI service
└── genfity-event-api/           # Event API service
```

## Next Steps

1. **Development:**
   - Test APIs dengan Postman/curl
   - Check logs untuk errors
   - Develop your applications

2. **Production:**
   - Configure domain DNS
   - Setup SSL certificates
   - Monitor services
   - Setup backups
