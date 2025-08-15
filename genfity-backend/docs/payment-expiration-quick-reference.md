# Payment Expiration Quick Reference

## Auto-Expiration Usage

### In API Routes
```typescript
import { PaymentExpirationService } from '@/lib/payment-expiration';

// Auto-expire all items
await PaymentExpirationService.autoExpireOnApiCall();

// Auto-expire specific transaction
await PaymentExpirationService.autoExpireOnApiCall(transactionId);

// Auto-expire specific payment
await PaymentExpirationService.autoExpireOnApiCall(undefined, paymentId);
```

### In Frontend Components
```tsx
import { ExpirationTimer } from '@/components/payments/ExpirationTimer';
import { PaymentStatusBadge } from '@/components/payments/PaymentStatusBadge';

// Payment with timer
<PaymentStatusBadge 
  status={payment.status} 
  expiresAt={payment.expiresAt}
  showTimer={true}
/>

// Full expiration info
<ExpirationInfo 
  paymentExpiresAt={payment.expiresAt}
  transactionExpiresAt={transaction.expiresAt}
  paymentStatus={payment.status}
  transactionStatus={transaction.status}
/>
```

### Service Methods
```typescript
// Business validation
const canCreate = await PaymentExpirationService.canCreatePaymentForTransaction(transactionId);

// Update payment status (with sync)
const payment = await PaymentExpirationService.updatePaymentStatus(paymentId, 'paid');

// Create with expiration
const payment = await PaymentExpirationService.createPaymentWithExpiration(paymentData);

// Real-time checks
const isExpired = PaymentExpirationService.isPaymentExpired(payment);
```

## Expiration Rules

- **Payments**: 1 day from creation
- **Transactions**: 7 days from creation  
- **Auto-sync**: Payment status changes sync to transaction
- **Cancellation**: Payment cancellation doesn't affect transaction

## API Response Format

```typescript
{
  // Standard fields
  id: string,
  status: string,
  expiresAt: Date | null,
  
  // Auto-included expiration info
  expirationInfo: {
    paymentExpiresAt: Date | null,
    transactionExpiresAt: Date | null,
    paymentTimeRemaining: "X hours" | null,
    transactionTimeRemaining: "X days" | null,
    isPaymentExpired: boolean,
    isTransactionExpired: boolean
  }
}
```
