#!/bin/sh

# Auto-generate nginx configuration from environment variables
# This script creates nginx site configurations based on .env settings

set -e

NGINX_SITES_DIR="/etc/nginx/sites-available"
TEMPLATE_DIR="/scripts/templates"

echo "=== Generating Nginx Configuration ==="
echo "WuzAPI: ${WUZAPI_DOMAIN}:${WUZAPI_PORT} -> ${WUZAPI_CONTAINER}"
echo "Event API: ${EVENTAPI_DOMAIN}:${EVENTAPI_PORT} -> ${EVENTAPI_CONTAINER}"

# Function to generate nginx config for a service
generate_service_config() {
    local service_name=$1
    local domain=$2
    local port=$3
    local container=$4
    local config_file="${NGINX_SITES_DIR}/${service_name}.conf"
    
    echo "Generating config for ${service_name}..."
    
    cat > "${config_file}" << EOF
# ${service_name} Service Configuration - Auto Generated
server {
    listen 80;
    server_name ${domain};
    
    # Certbot challenges
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Redirect to HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name ${domain};
    
    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/${domain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Rate limiting
    limit_req zone=api burst=20 nodelay;
    
    # Proxy to ${service_name} service
    location / {
        proxy_pass http://${container}:${port};
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\\n";
        add_header Content-Type text/plain;
    }
}
EOF
    
    echo "Generated: ${config_file}"
}

# Generate configurations for each service
if [ -n "${WUZAPI_DOMAIN}" ] && [ -n "${WUZAPI_PORT}" ] && [ -n "${WUZAPI_CONTAINER}" ]; then
    generate_service_config "wa" "${WUZAPI_DOMAIN}" "${WUZAPI_PORT}" "${WUZAPI_CONTAINER}"
else
    echo "Warning: Genfity WA configuration incomplete, skipping..."
fi

if [ -n "${EVENTAPI_DOMAIN}" ] && [ -n "${EVENTAPI_PORT}" ] && [ -n "${EVENTAPI_CONTAINER}" ]; then
    generate_service_config "chat-ai" "${EVENTAPI_DOMAIN}" "${EVENTAPI_PORT}" "${EVENTAPI_CONTAINER}"
else
    echo "Warning: Genfity Chat AI configuration incomplete, skipping..."
fi

echo "=== Nginx Configuration Generation Complete ==="
echo "Generated configurations:"
ls -la ${NGINX_SITES_DIR}/
