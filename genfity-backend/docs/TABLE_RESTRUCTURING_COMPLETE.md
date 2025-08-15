# Table Restructuring: Consistent Service Tables

## Overview

The confusing mixed-purpose tables have been restructured into consistent, service-specific tables for better separation of concerns and clearer business logic.

## New Table Structure

### 1. ServicesProductCustomers (NEW)
- **Purpose**: Track manual product delivery services (websites, designs, etc.)
- **Default Status**: `awaiting_delivery` (requires manual admin action)
- **Delivery Flow**: Admin must manually change status to `delivered`

### 2. ServicesWhatsappCustomers (NEW)
- **Purpose**: Track WhatsApp service activation and management
- **Default Status**: `activating` → `active` (automatic)
- **Delivery Flow**: Fully automated via API

### 3. Legacy Tables (DEPRECATED)
- **PackageCustomer**: Maintained for backward compatibility
- **WhatsappApiService**: Maintained for backward compatibility

## Key Changes

### Consistent Service Separation Logic

```typescript
// OLD: Confusing mixed tables
PackageCustomer (product + WhatsApp mixed)
WhatsappApiService (only WhatsApp, inconsistent naming)

// NEW: Consistent service-specific tables
ServicesProductCustomers (product only - manual delivery)
ServicesWhatsappCustomers (WhatsApp only - auto delivery)
```

### Status Updates

```typescript
// Product Services (Manual)
'awaiting_delivery' → 'in_progress' → 'delivered' (admin action required)

// WhatsApp Services (Automatic)  
'activating' → 'active' (auto-activated)
'active' → 'expired' (based on expiredAt date)
```

### Transaction Completion Logic

```typescript
// Transaction completes when ALL services are ready:
const productCompleted = hasProduct ? await isProductDelivered(transactionId) : true;
const whatsappCompleted = hasWhatsapp ? await isWhatsAppActivated(userId, packageId) : true;

if (productCompleted && whatsappCompleted) {
  // Transaction status → 'success'
}
```

## API Changes

### New Endpoints

```
# Product Services
GET    /api/product-services           # List all product services
GET    /api/product-services/[id]      # Get specific product service
PATCH  /api/product-services/[id]      # Update product service
POST   /api/transactions/[id]/complete-product-delivery  # Complete delivery

# WhatsApp Services  
GET    /api/whatsapp-services          # List all WhatsApp services
GET    /api/whatsapp-services/[id]     # Get specific WhatsApp service
PATCH  /api/whatsapp-services/[id]     # Update WhatsApp service
```

### Legacy Endpoints (Deprecated)

```
GET    /api/package-customers          # ⚠️ Legacy - use product-services
PATCH  /api/package-customers/[id]     # ⚠️ Legacy - use product-services
```

## Database Schema

### ServicesProductCustomers Table

```sql
CREATE TABLE ServicesProductCustomers (
  id                VARCHAR(191) PRIMARY KEY,
  transactionId     VARCHAR(191) NOT NULL,
  customerId        VARCHAR(191) NOT NULL,
  packageId         VARCHAR(191),
  addonId           VARCHAR(191),
  websiteUrl        TEXT,
  driveUrl          TEXT,
  textDescription   LONGTEXT,
  domainName        VARCHAR(191),
  domainExpiredAt   DATETIME,
  fileAssets        LONGTEXT,
  status            VARCHAR(191) DEFAULT 'awaiting_delivery',
  deliveredAt       DATETIME,
  notes             TEXT,
  createdAt         DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt         DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Migration Process

### 1. Database Migration
```bash
npx prisma generate
npx prisma db push
```

### 2. Data Migration
```bash
node migrate-product-services.js
```

### 3. Code Updates
- ✅ PaymentExpirationService updated to use new tables
- ✅ Customer dashboard updated for backward compatibility
- ✅ New API endpoints created
- ✅ Legacy endpoints marked as deprecated

### 4. Testing
```bash
# Test new product service creation
POST /api/transactions (product purchase)
# Should create ServicesProductCustomers record with status 'awaiting_delivery'

# Test manual delivery completion
PATCH /api/product-services/[id] 
{ "status": "delivered" }
# Should trigger transaction completion check

# Test mixed transactions
POST /api/transactions (product + WhatsApp purchase)
# Should create both ServicesProductCustomers + WhatsappApiService
# Transaction completes only when both services are ready
```

## Updated Service Flow

### Product Purchase Flow
1. **Transaction Created**: User purchases product
2. **Payment Completed**: Payment status → 'paid'
3. **Service Created**: `ServicesProductCustomers` record created with status `awaiting_delivery`
4. **Manual Delivery**: Admin updates delivery details and status → `delivered`
5. **Transaction Completion Check**: Auto-triggered when delivery completed
6. **Transaction Success**: If all services complete → transaction status `success`

### WhatsApp Purchase Flow
1. **Transaction Created**: User purchases WhatsApp service
2. **Payment Completed**: Payment status → 'paid'
3. **Auto-Activation**: `WhatsappApiService` record auto-created and activated
4. **Transaction Completion Check**: Auto-triggered after activation
5. **Transaction Success**: If all services complete → transaction status `success`

### Mixed Purchase Flow
1. **Transaction Created**: User purchases both product + WhatsApp
2. **Payment Completed**: Payment status → 'paid'
3. **Services Created**: 
   - `ServicesProductCustomers` (awaiting_delivery)
   - `WhatsappApiService` (auto-activated)
4. **Partial Completion**: WhatsApp ready, product still awaiting delivery
5. **Manual Delivery**: Admin completes product delivery
6. **Transaction Success**: Both services complete → transaction status `success`

## Benefits

1. **Clear Separation**: Product vs WhatsApp services clearly separated
2. **Proper Status Flow**: No more confusion about delivery vs activation
3. **Better Admin UX**: Clear distinction between manual and automatic services
4. **Scalable**: Easy to add new service types in the future
5. **Backward Compatible**: Legacy API still works during transition

## Next Steps

1. ✅ Database migration completed 
2. ✅ Core service logic updated
3. ✅ API endpoints created
4. 🔄 **Run data migration script**
5. 🔄 **Test new endpoints**
6. 🔄 **Update admin interfaces**
7. 🔄 **Phase out legacy endpoints**

## Rollback Plan

If issues arise:
1. Legacy `PackageCustomer` table is preserved
2. Legacy API endpoints still functional
3. Can revert service logic to use old table
4. New table can be dropped if needed

## Monitoring

Track the following metrics:
- Migration success rate
- API endpoint usage (new vs legacy)
- Transaction completion accuracy
- Service delivery status accuracy
