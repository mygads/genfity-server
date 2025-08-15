# Database Seeding Guide

## Overview
File seed ini akan mengisi database dengan data sample untuk:
- **Categories & Subcategories**: Kategori layanan (Web Development, SEO, Design)
- **Packages**: Paket layanan dengan harga dan fitur
- **Addons**: Add-on tambahan untuk enhance layanan
- **WhatsApp Services**: Layanan WhatsApp API dengan berbagai tier

## Data yang Dibuat

### 1. Categories (3 items)
- **Web Development**: Layanan pengembangan website
- **SEO Services**: Layanan optimasi SEO  
- **Design Services**: Layanan desain grafis dan branding

### 2. Subcategories (7 items)
- Landing Pages
- E-Commerce
- Custom Web Apps
- Local SEO
- Technical SEO
- Logo Design
- UI/UX Design

### 3. Packages (5 items)
- **Basic Landing Page**: Rp 2,500,000 / $165
- **Premium Landing Page**: Rp 5,000,000 / $330
- **Basic E-Commerce Store**: Rp 15,000,000 / $990
- **Local SEO Optimization**: Rp 3,500,000 / $230
- **Professional Logo Design**: Rp 1,500,000 / $99

### 4. Addons (10 items)
#### Web Development Addons:
- Extra Page: Rp 500,000 / $33
- Premium SSL Certificate: Rp 750,000 / $49
- Private Server Hosting: Rp 2,000,000 / $132
- Automated Database Backup: Rp 300,000 / $20

#### SEO Addons:
- Extended Keyword Research: Rp 800,000 / $53
- Social Media SEO Integration: Rp 600,000 / $40

#### Design Addons:
- Comprehensive Brand Guidelines: Rp 1,000,000 / $66
- Business Card Design: Rp 400,000 / $26
- Complete UI Kit: Rp 1,500,000 / $99

### 5. WhatsApp Services (3 tiers)
- **Basic**: Rp 150,000 / $10 (1 session, 1K messages)
- **Professional**: Rp 500,000 / $33 (5 sessions, 10K messages)
- **Enterprise**: Rp 1,500,000 / $99 (unlimited)

### 6. WhatsApp Packages (3 packages)
- Starter Package (30 days)
- Business Package (30 days)  
- Enterprise Package (30 days)

## Running the Seed

### Prerequisites
```bash
npm install tsx --save-dev
```

### Run Seed
```bash
# Seed database
npm run db:seed

# Reset database and seed
npm run db:reset
```

### Manual Run
```bash
npx tsx prisma/seed.ts
```

## Important Notes

⚠️ **Warning**: Seed script akan menghapus data yang ada di tabel berikut:
- Categories & Subcategories
- Packages & Addons  
- WhatsApp Services & Packages
- Transaction data terkait

✅ **Safe**: Seed script tidak akan menghapus:
- User data
- Payment data
- Transaction data yang tidak terkait

## Verification

Setelah menjalankan seed, Anda dapat memverifikasi data dengan:

```sql
-- Check categories
SELECT COUNT(*) as categories FROM Category WHERE isActive = true;

-- Check packages
SELECT COUNT(*) as packages FROM Package WHERE isActive = true;

-- Check addons
SELECT COUNT(*) as addons FROM Addon WHERE isActive = true;

-- Check WhatsApp services
SELECT COUNT(*) as whatsapp_services FROM WhatsappService WHERE isActive = true;
```

## Customization

Untuk mengcustomize data seed:

1. Edit file `prisma/seed.ts`
2. Modify data sesuai kebutuhan
3. Run seed ulang: `npm run db:seed`

## Troubleshooting

### Error: Module not found
```bash
npm install tsx --save-dev
```

### Error: Database connection
Pastikan file `.env` sudah configured dengan benar:
```
DATABASE_URL="mysql://username:password@localhost:3306/database_name"
```

### Error: Foreign key constraint
Pastikan database dalam keadaan bersih atau gunakan:
```bash
npm run db:reset
```
