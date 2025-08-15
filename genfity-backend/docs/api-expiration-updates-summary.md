# API Expiration Updates Summary

## Overview
This document summarizes all the updates made to include expiration dates (`expiresAt`) in API responses across the payment and transaction system.

## Updated API Endpoints

### 1. Customer Checkout API
**File**: `src/app/api/customer/checkout/route.ts`
**Endpoint**: `POST /api/customer/checkout`

**Added Fields**:
- `createdAt`: Transaction creation timestamp
- `expiresAt`: Transaction expiration date (1 week from creation)
- `expirationInfo` object containing:
  - `transactionExpiresAt`: Full expiration timestamp
  - `paymentExpiresAfterCreation`: "1 day" (info)
  - `transactionExpiresAfterCreation`: "7 days" (info)
  - `timeRemaining`: Calculated remaining days

### 2. Payment Creation API
**File**: `src/app/api/customer/payment/create/route.ts`
**Endpoint**: `POST /api/customer/payment/create`

**Added Fields**:
- Payment object: `expiresAt`
- Transaction object: `expiresAt`
- `expirationInfo` object containing:
  - `paymentExpiresAt`: Payment expiration timestamp
  - `transactionExpiresAt`: Transaction expiration timestamp
  - `paymentTimeRemaining`: Calculated remaining hours
  - `transactionTimeRemaining`: Calculated remaining days

### 3. Payment Status API
**File**: `src/app/api/customer/payment/status/[paymentId]/route.ts`
**Endpoint**: `GET /api/customer/payment/status/[paymentId]`

**Added Fields**:
- Payment object: `expiresAt`
- Transaction object: `expiresAt`
- `expirationInfo` object containing:
  - `paymentExpiresAt`, `transactionExpiresAt`
  - `paymentTimeRemaining`, `transactionTimeRemaining`
  - `isPaymentExpired`, `isTransactionExpired` (boolean flags)

### 4. Payment Details API
**File**: `src/app/api/customer/payment/[paymentId]/route.ts`
**Endpoint**: `GET /api/customer/payment/[paymentId]`

**Added Fields**:
- Payment object: `expiresAt`
- Transaction object: `expiresAt`
- `expirationInfo` object with full expiration details

### 5. Customer Payment List API
**File**: `src/app/api/customer/payment/route.ts`
**Endpoint**: `GET /api/customer/payment`

**Added Fields**:
- Payment object: `expiresAt`
- Transaction object: `expiresAt`

### 6. Admin Payment Details API
**File**: `src/app/api/admin/payments/[id]/route.ts`
**Endpoint**: `GET /api/admin/payments/[id]`

**Added Fields**:
- Payment object: `expiresAt`
- Transaction object: `expiresAt`
- `expirationInfo` object with admin-relevant expiration data

### 7. Admin Payment Update Status API
**File**: `src/app/api/payments/[paymentId]/update-status/route.ts`
**Endpoint**: `POST /api/payments/[paymentId]/update-status`

**Added Fields**:
- Payment object: `expiresAt`, `updatedAt`

### 8. Transaction Details API
**File**: `src/app/api/transactions/[transactionId]/route.ts`
**Endpoint**: `GET /api/transactions/[transactionId]`

**Added Fields**:
- PaymentInfo object: `expiresAt`
- `expirationInfo` object containing:
  - `transactionExpiresAt`, `paymentExpiresAt`
  - `transactionTimeRemaining`, `paymentTimeRemaining`
  - `isTransactionExpired`, `isPaymentExpired`

### 9. Payment Processing API
**File**: `src/app/api/payments/process/route.ts`
**Endpoint**: `POST /api/payments/process`

**Added Fields**:
- `payment_expires_at`: Payment expiration timestamp
- `transaction_expires_at`: Transaction expiration timestamp

### 10. Payment Status Check API
**File**: `src/app/api/payments/status/[paymentId]/route.ts`
**Endpoint**: `GET /api/payments/status/[paymentId]`

**Added Fields**:
- StatusInfo object: `isExpired`, `timeRemaining`
- `expirationInfo` object with comprehensive expiration data

### 11. Transaction Cancellation API
**File**: `src/app/api/transactions/[transactionId]/cancel/route.ts`
**Endpoint**: `POST /api/transactions/[transactionId]/cancel`

**Added Fields**:
- Transaction object: `expiresAt`, `originalExpiresAt`

### 12. Payment Cancellation API
**File**: `src/app/api/customer/payment/cancel/[paymentId]/route.ts`
**Endpoint**: `POST /api/customer/payment/cancel/[paymentId]`

**Added Fields**:
- Payment object: `expiresAt`
- Transaction object: `expiresAt`

### 13. Admin Payment Approval API
**File**: `src/app/api/admin/payments/[id]/route.ts`
**Endpoint**: `PATCH /api/admin/payments/[id]`

**Added Fields**:
- Payment object: `expiresAt`, `updatedAt`
- Transaction object: `expiresAt`

### 14. Cron Job Expiration API
**File**: `src/app/api/cron/expire-payments/route.ts`
**Endpoint**: `POST /api/cron/expire-payments`

**Added Fields**:
- `processedAt`: Cron job execution timestamp
- ExpiredPayments array items: `originalExpiresAt`, `expiredAt`, `status`

## Expiration Info Object Structure

All major endpoints now include an `expirationInfo` object with the following structure:

```typescript
expirationInfo: {
  paymentExpiresAt: Date | null,              // Payment expiration timestamp
  transactionExpiresAt: Date | null,          // Transaction expiration timestamp
  paymentTimeRemaining: string | null,        // "X hours" remaining for payment
  transactionTimeRemaining: string | null,    // "X days" remaining for transaction
  isPaymentExpired: boolean,                  // Is payment past expiration?
  isTransactionExpired: boolean               // Is transaction past expiration?
}
```

## Time Calculation Logic

- **Payment Time Remaining**: Calculated in hours using `Math.max(0, Math.floor((expiresAt - now) / (1000 * 60 * 60)))`
- **Transaction Time Remaining**: Calculated in days using `Math.max(0, Math.floor((expiresAt - now) / (1000 * 60 * 60 * 24)))`
- **Expiration Check**: `new Date() > new Date(expiresAt)`

## Frontend Integration Benefits

With these updates, frontend applications can now:

1. **Display Countdown Timers**: Show remaining time for payments and transactions
2. **Prevent Expired Actions**: Disable payment buttons for expired transactions
3. **Show Warning Messages**: Alert users when payments/transactions are about to expire
4. **Auto-refresh Logic**: Refresh data when expiration times are reached
5. **Better UX**: Provide clear feedback about time-sensitive operations

## Example Frontend Usage

```javascript
// Check if payment is expiring soon (< 2 hours)
const isPaymentExpiringSoon = payment.expirationInfo.paymentTimeRemaining && 
  parseInt(payment.expirationInfo.paymentTimeRemaining) < 2;

// Disable payment creation for expired transactions
const canCreatePayment = !payment.expirationInfo.isTransactionExpired;

// Show countdown timer
const timeLeft = payment.expirationInfo.paymentTimeRemaining;
if (timeLeft) {
  displayTimer(`Payment expires in ${timeLeft}`);
}
```

## Migration Notes

- All changes are backward compatible
- Existing API consumers will continue to work
- New `expirationInfo` fields are optional and additive
- Legacy timestamp fields (`createdAt`, `updatedAt`) are preserved

## Testing Recommendations

1. Test API responses include all new expiration fields
2. Verify time calculations are accurate
3. Test expired payment/transaction scenarios
4. Validate cron job processes expired items correctly
5. Check admin interfaces show expiration data properly
