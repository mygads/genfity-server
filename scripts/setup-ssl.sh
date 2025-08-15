#!/bin/bash

# SSL Setup Script for Genfity Services
# This script helps obtain SSL certificates for your domains

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Genfity SSL Setup Script ===${NC}"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Warning: .env file not found. Copying from .env.example${NC}"
    cp .env.example .env
    echo -e "${RED}Please edit .env file and set your domain names and email before continuing!${NC}"
    exit 1
fi

# Load environment variables
source .env

# Validate required variables
if [ -z "$WUZAPI_DOMAIN" ] || [ -z "$EVENTAPI_DOMAIN" ] || [ -z "$LETSENCRYPT_EMAIL" ]; then
    echo -e "${RED}Error: Please set WUZAPI_DOMAIN, EVENTAPI_DOMAIN, and LETSENCRYPT_EMAIL in .env file${NC}"
    exit 1
fi

echo -e "${GREEN}Setting up SSL certificates for:${NC}"
echo -e "  - WuzAPI: ${WUZAPI_DOMAIN}"
echo -e "  - Event API: ${EVENTAPI_DOMAIN}"
echo -e "  - Email: ${LETSENCRYPT_EMAIL}"
echo

# Update nginx configuration with actual domain names
echo -e "${YELLOW}Updating nginx configuration with your domains...${NC}"

# Update WuzAPI nginx config
sed -i "s/wuzapi.yourdomain.com/${WUZAPI_DOMAIN}/g" nginx/sites-available/wuzapi.conf

# Update Event API nginx config
sed -i "s/eventapi.yourdomain.com/${EVENTAPI_DOMAIN}/g" nginx/sites-available/eventapi.conf

echo -e "${GREEN}Step 1: Starting infrastructure (PostgreSQL + Nginx)${NC}"
docker compose --profile prod up -d postgres nginx

echo -e "${GREEN}Step 2: Obtaining SSL certificates${NC}"
echo -e "${YELLOW}This may take a few minutes...${NC}"

# Get SSL certificate for WuzAPI
docker compose run --rm certbot certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $LETSENCRYPT_EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $WUZAPI_DOMAIN

# Get SSL certificate for Event API
docker compose run --rm certbot certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $LETSENCRYPT_EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $EVENTAPI_DOMAIN

echo -e "${GREEN}Step 3: Reloading nginx with SSL configuration${NC}"
docker compose exec nginx nginx -s reload

echo -e "${GREEN}SSL setup completed successfully!${NC}"
echo -e "${YELLOW}Your services will be available at:${NC}"
echo -e "  - https://${WUZAPI_DOMAIN}"
echo -e "  - https://${EVENTAPI_DOMAIN}"
echo
echo -e "${YELLOW}SSL certificates will be automatically renewed by certbot.${NC}"
