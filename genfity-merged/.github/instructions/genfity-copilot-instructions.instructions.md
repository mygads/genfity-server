---
applyTo: '**'
---

# Genfity Backend - AI Coding Instructions

## Project Overview
Genfity is a Next.js 15 full-stack application providing multi-service platform including WhatsApp API services, website development packages, and digital service management. The codebase uses TypeScript, Prisma ORM with PostgreSQL, and a microservices architecture.

## Key Architecture Patterns

### Database & ORM
- **Prisma Client**: Generated to `src/generated/prisma` (not default location)
- **Connection**: Singleton pattern in `src/lib/prisma.ts` - always import from here
- **Migrations**: Use `npx prisma migrate deploy` for production, `npx prisma migrate dev` for development
- **Seeding**: `npm run db:seed` using `prisma/seed.ts`

### Authentication & Authorization 
- **JWT-only Authentication**: No NextAuth, Supabase Auth, or session cookies - pure JWT implementation
- **Multi-device Support**: 1 user can login on multiple devices simultaneously (multiple JWT tokens per user)
- **Token Lifecycle**: 7-day expiration, stored in localStorage with automatic cleanup on expiry for frontend, and in the database for backend
- **Role-based Access Control**: JWT carries user credentials (IP, device, role, name, email, phone, etc.) for API route protection
- **Auto-redirect Logic**: 
  - Expired tokens → redirect to signin (admin users → `/admin/signin`, customers → `/signin`)
  - Dashboard access without login → redirect to signin pages
- **API Routes Security**:
  - `/api/public/*` - No authentication required
  - `/api/auth/*` - For non-authenticated users (signin, signup)  
  - `/api/account/*` - Any authenticated user (requires JWT token)
  - `/api/customer/*` - Customer role JWT token only
  - `/api/admin/*` - Admin role JWT token only
- **Request Headers**: All authenticated APIs require `Authorization: Bearer <jwt-token>` header
- **Session Check**: Frontend calls `GET /api/auth/session` on page load/reload to validate token
- **Auth helpers**: Use `getUserFromToken()` from `src/lib/auth-helpers.ts` for universal auth
- **Middleware**: `src/middleware.ts` handles route protection and JWT validation

### Internationalization & Routing
- **Auto-locale Detection**: IP-based geolocation + browser language detection
- **Indonesian IP Ranges**: Define specific IP ranges for Indonesia detection
- **Locale Logic**:
  - Indonesian IP + Indonesian language → `/id`
  - Indonesian IP + Non-Indonesian language → `/id` 
  - Foreign IP + Indonesian language → `/en`
  - Foreign IP + Non-Indonesian language → `/en`
  - Default fallback → `/en` (when IP/language detection fails)
- **Protected Routes**:
  - `/dashboard` access without login → redirect to `/signin`
  - `/admin/dashboard` access without admin role → redirect to `/admin/signin`
```
/api/auth/        # Authentication (signin, signup, OTP)
/api/account/     # Universal user routes (profile, settings)  
/api/customer/    # Customer-specific features (WhatsApp sessions)
/api/admin/       # Admin panel operations
/api/public/      # Public API with API key auth
```

### Transaction System
- **Complex status flow**: created → pending → paid → success/cancelled/expired
- **Multi-service support**: Products, Addons, WhatsApp services
- **Child entities**: `TransactionProduct`, `TransactionAddons`, `TransactionWhatsappService`
- **Service fulfillment**: Separate customer service tables (`ServicesProductCustomers`, etc.)

### WhatsApp Integration
- **Dual WhatsApp Architecture**:
  1. **System WhatsApp**: For OTP, admin notifications - uses fixed tokens from .env (WHATSAPP_ADMIN_TOKEN, WHATSAPP_USER_TOKEN)
  2. **Customer WhatsApp Services**: Paid packages allowing customer access to WhatsApp service APIs
- **Authentication Patterns**:
  - Customer API: Uses JWT tokens (`/api/customer/whatsapp/sessions`)
  - System usage: Uses fixed environment tokens for internal OTP/notifications
- **Session Management**: 
  - System sessions: Pre-configured, unlimited usage for internal functions
  - Customer sessions: Package-based quotas, session limits, paid subscriptions
- **External Go Service**: Single WhatsApp Go Server handles both system and customer requests
- **Content Types**: Support for text, image, document, audio, video messages
- **Access Control**: Customers can access all WhatsApp service routes except `/admin` routes

### CORS & Cross-Origin Access
- **Environment-based CORS**: Configure allowed origins via `.env` variables
- **Origin Control**: 
  - Empty = Block all origins
  - `*` or `true` = Allow all origins  
  - Specific domains = Allow only listed origins
- **Method Support**: All HTTP methods (GET, POST, PUT, DELETE, OPTIONS) enabled

## Development Workflow

### Environment Setup
```bash
npm run dev          # Development server on port 8090
npm run db:reset     # Reset DB and seed data
npm run build        # Production build
```

### Docker Development
```bash
docker-compose --profile dev up    # Development mode with hot reload
docker-compose --profile prod up   # Production mode
```

### Database Changes
1. Modify `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name your-change`
3. Update seed data in `prisma/seed.ts` if needed

### API Development Patterns
- **CORS**: Use `withCORS()` from `src/lib/cors.ts` for responses
- **Authentication**: Use `withAuthentication()` or `withRoleAuthentication()` from `src/lib/request-auth.ts`
- **Error handling**: Return consistent `{ success: false, error: string }` format
- **Validation**: Use Zod schemas for input validation
- **Route Organization**:
  - `/api/customer/*` - Customer dashboard features
  - `/api/admin/*` - Admin panel operations
  - `/api/public/*` - Global/unauthenticated access

### Key Libraries & Utilities
- **Phone normalization**: `normalizePhoneNumber()` from `src/lib/auth.ts`
- **Payment expiration**: `PaymentExpirationService` from `src/lib/payment-expiration.ts`
- **Transaction status**: `TransactionStatusManager` from `src/lib/transaction-status-manager.ts`
- **Prisma client**: Always import from `src/lib/prisma.ts`

## Service Integration Points
- **Email notifications**: `src/services/mailer.ts` with Nodemailer
- **WhatsApp messaging**: External Go service integration via `src/lib/whatsapp.ts`
- **File storage**: Vercel Blob storage for uploads
- **Server monitoring**: DigitalOcean droplet management in admin panel

## Business Logic Systems

### Payment & Transaction Flow
- **Two-step Checkout Process**: 
  1. `POST /api/customer/checkout` - Creates transaction with pricing breakdown and service fee preview
  2. `POST /api/customer/payment/create` - Creates payment record with selected method and applies service fees
- **Auto-Expiration Logic**: Payments expire in 1 day, transactions in 7 days
- **Status Synchronization**: Payment status changes automatically sync to transaction status
- **Service Activation**: Auto-triggered when payment=paid and transaction=in_progress
- **Service Fee System**: Dynamic fees based on `ServiceFee` model - payment methods are only available if admin has configured active service fees for that currency

### Transaction Status Flow
- **Creation Flow**: created → pending (payment created) → in_progress (payment paid) → success (all services delivered)
- **Multi-service Support**: Products, Addons, WhatsApp services with independent status tracking
- **Child Transaction Status**: Each service type (`TransactionProduct`, `TransactionAddons`, `TransactionWhatsappService`) has independent status
- **Completion Logic**: Main transaction completes only when ALL child services reach "success" status

### Service Delivery Architecture
- **Product Services**: Manual delivery via `ServicesProductCustomers` table (status: awaiting_delivery → in_progress → delivered)
- **WhatsApp Services**: Auto-activation via `ServicesWhatsappCustomers` table (status: activating → active)  
- **Addon Services**: Manual delivery via `ServicesAddonsCustomers` table (combined delivery record for all addons in transaction)
- **Mixed Transactions**: Support both product and WhatsApp services in single transaction
- **Delivery Records**: Created automatically when payment status becomes "paid" and transaction becomes "in_progress"

### WhatsApp Integration Architecture
- **Dual WhatsApp Concepts**:
  1. **System WhatsApp** (OTP, admin notifications): Uses WHATSAPP_ADMIN_TOKEN & WHATSAPP_USER_TOKEN from .env
  2. **Customer WhatsApp Services** (paid packages): Customer-owned sessions with API access to all WhatsApp service routes except `/admin`
- **External Go Service**: Both concepts use same WhatsApp Go Server URL but different authentication
- **Session Management**: 
  - System sessions: Pre-configured in server with fixed tokens
  - Customer sessions: Created through customer API with package-based quotas and limits
- **API Authentication Patterns**:
  - Admin routes (`/admin/*`): Use `Authorization: WHATSAPP_ADMIN_TOKEN` header
  - User routes (all others): Use `token: WHATSAPP_USER_TOKEN` header (for system), or customer API keys (for customer services)

### Server Monitoring System
- **DigitalOcean Integration**: Real-time server metrics from DO API
- **Live Dashboard**: 30-second auto-refresh with CPU, memory, disk monitoring
- **Historical Data**: Time-range support (1 hour to 1 month)
- **Fallback System**: Mock data when external API unavailable

## Testing & Debugging
- **Health check**: `/api/health` endpoint
- **Debug utilities**: `debug-signin.js` for quick admin access
- **Postman collections**: Complete API collections in `/docs` directory
- **API documentation**: Comprehensive implementation guides in `/docs`

## Documentation & Implementation Status

### Complete Features (See `/docs` for details)
- **✅ Payment System**: Two-step checkout with auto-expiration (payment-expiration-*.md)
- **✅ Transaction Completion**: Mixed service delivery with status sync (TRANSACTION_COMPLETION_FINAL.md)
- **✅ WhatsApp API**: Customer sessions + Public messaging API (WHATSAPP_API_FINAL_SUMMARY.md)
- **✅ Server Monitoring**: DigitalOcean integration with live metrics (server-monitoring-summary.md)
- **✅ Service Tables**: Restructured for proper separation (TABLE_RESTRUCTURING_COMPLETE.md)


## Important Notes
- **Next.js 15**: Uses App Router, not Pages Router
- **TypeScript strict mode**: Type everything properly
- **Internationalization**: next-intl configured for multi-language support
- **Containerized**: Production uses Docker with health checks
- **Multi-service**: Backend integrates with separate WhatsApp Go service
- **UI/UX Standards**:
  - Shared design system between customer and admin dashboards
  - Dark mode support - ensure all UI components work in dark theme
  - Responsive design required for all components
- **Code Quality**:
  - Remove redundant/unused functions immediately
  - Replace old logic completely when implementing new features
  - Keep `/services` for external/3rd party integrations
  - Keep `/lib` for reusable business logic functions
  - Keep `/types` for TypeScript type definitions

### Language & Localization System
- **Default Language**: English (en) - all server responses and API data default to English
- **Supported Languages**: 
    - English (`en`) - Default server language
    - Indonesian (`id`) - Secondary language support
- **API Language Support**: All API endpoints can serve content in both English and Indonesian
- **Page Localization**: Frontend pages support both `/en` and `/id` routes with full content translation
- **Language Detection Priority**:
    1. URL path prefix (`/en` or `/id`)
    2. User preference stored in localStorage
    3. Browser Accept-Language header
    4. IP-based geolocation (Indonesia → `id`, Others → `en`)
    5. Default fallback → English (`en`)
- **API Response Format**: All API responses include `locale` field indicating content language
- **Database Content**: Multilingual content stored with language-specific fields (e.g., `title_en`, `title_id`)
- **Translation Keys**: Use next-intl for frontend translations with JSON files in `/messages` directory