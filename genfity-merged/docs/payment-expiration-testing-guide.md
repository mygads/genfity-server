# Payment Expiration System Test Guide

## Testing the Updated APIs

### 1. Test Checkout with Expiration Info

```bash
curl -X POST http://localhost:3000/api/customer/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "packages": [{"id": "package_id", "quantity": 1}],
    "currency": "idr"
  }'
```

**Expected Response** should include:
```json
{
  "success": true,
  "data": {
    "transactionId": "...",
    "expiresAt": "2025-06-17T...",
    "expirationInfo": {
      "transactionExpiresAt": "2025-06-17T...",
      "paymentExpiresAfterCreation": "1 day",
      "transactionExpiresAfterCreation": "7 days",
      "timeRemaining": "7 days"
    }
  }
}
```

### 2. Test Payment Creation with Expiration

```bash
curl -X POST http://localhost:3000/api/customer/payment/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "transactionId": "transaction_id",
    "paymentMethod": "manual_bank_transfer"
  }'
```

**Expected Response** should include:
```json
{
  "success": true,
  "data": {
    "payment": {
      "id": "...",
      "expiresAt": "2025-06-11T...",
      "createdAt": "2025-06-10T..."
    },
    "transaction": {
      "expiresAt": "2025-06-17T..."
    },
    "expirationInfo": {
      "paymentExpiresAt": "2025-06-11T...",
      "transactionExpiresAt": "2025-06-17T...",
      "paymentTimeRemaining": "24 hours",
      "transactionTimeRemaining": "7 days"
    }
  }
}
```

### 3. Test Payment Status with Expiration

```bash
curl -X GET http://localhost:3000/api/customer/payment/status/PAYMENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response** should include:
```json
{
  "success": true,
  "data": {
    "payment": {
      "expiresAt": "2025-06-11T..."
    },
    "transaction": {
      "expiresAt": "2025-06-17T..."
    },
    "expirationInfo": {
      "paymentExpiresAt": "2025-06-11T...",
      "transactionExpiresAt": "2025-06-17T...",
      "paymentTimeRemaining": "X hours",
      "transactionTimeRemaining": "X days",
      "isPaymentExpired": false,
      "isTransactionExpired": false
    }
  }
}
```

### 4. Test Admin Payment Details

```bash
curl -X GET http://localhost:3000/api/admin/payments/PAYMENT_ID \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Expected Response** should include expiration info for admin use.

### 5. Test Cron Job

```bash
curl -X POST http://localhost:3000/api/cron/expire-payments \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Expected Response** for processing expired payments:
```json
{
  "success": true,
  "message": "Expired 2 payments",
  "processedAt": "2025-06-10T...",
  "expiredPayments": [
    {
      "id": "payment_1",
      "originalExpiresAt": "2025-06-09T...",
      "expiredAt": "2025-06-10T...",
      "status": "expired"
    }
  ]
}
```

## Frontend Implementation Examples

### React Hook for Payment Timer

```jsx
import { useState, useEffect } from 'react';

function usePaymentTimer(expirationInfo) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!expirationInfo?.paymentExpiresAt) return;

    const updateTimer = () => {
      const now = new Date();
      const expiresAt = new Date(expirationInfo.paymentExpiresAt);
      const diff = expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft('Expired');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${hours}h ${minutes}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [expirationInfo?.paymentExpiresAt]);

  return { timeLeft, isExpired };
}

// Usage in component
function PaymentCard({ payment }) {
  const { timeLeft, isExpired } = usePaymentTimer(payment.expirationInfo);

  return (
    <div className="payment-card">
      <div className="payment-status">
        Status: {payment.status}
      </div>
      {payment.status === 'pending' && (
        <div className={`expiration-timer ${isExpired ? 'expired' : ''}`}>
          {isExpired ? '⚠️ Payment Expired' : `⏰ Expires in: ${timeLeft}`}
        </div>
      )}
      <button 
        disabled={isExpired || payment.expirationInfo.isPaymentExpired}
        onClick={() => handlePayment(payment.id)}
      >
        {isExpired ? 'Payment Expired' : 'Complete Payment'}
      </button>
    </div>
  );
}
```

### Transaction Expiration Check

```jsx
function CreatePaymentButton({ transaction }) {
  const canCreatePayment = !transaction.expirationInfo?.isTransactionExpired;
  const timeLeft = transaction.expirationInfo?.transactionTimeRemaining;

  if (!canCreatePayment) {
    return (
      <div className="alert alert-error">
        ❌ Transaction expired. Cannot create new payments.
      </div>
    );
  }

  return (
    <div>
      <div className="transaction-timer">
        🕒 Transaction expires in: {timeLeft}
      </div>
      <button onClick={() => createPayment(transaction.id)}>
        Create Payment
      </button>
    </div>
  );
}
```

## Database Verification

Check that payments and transactions have expiration dates:

```sql
-- Check recent transactions with expiration
SELECT id, status, createdAt, expiresAt, 
       DATEDIFF(expiresAt, NOW()) as daysRemaining
FROM Transaction 
WHERE createdAt > DATE_SUB(NOW(), INTERVAL 1 DAY)
ORDER BY createdAt DESC;

-- Check recent payments with expiration
SELECT id, status, createdAt, expiresAt,
       TIMESTAMPDIFF(HOUR, NOW(), expiresAt) as hoursRemaining
FROM Payment 
WHERE createdAt > DATE_SUB(NOW(), INTERVAL 1 DAY)
ORDER BY createdAt DESC;

-- Check for expired but not processed payments
SELECT id, status, expiresAt 
FROM Payment 
WHERE status = 'pending' AND expiresAt < NOW();
```

## Environment Setup

Ensure these environment variables are set:

```env
# For cron job authentication
CRON_SECRET=your-secure-random-string

# Database connection
DATABASE_URL=your-database-url

# NextAuth configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Monitoring Commands

```bash
# Check cron job logs
tail -f /var/log/cron.log

# Manual cron trigger (for testing)
curl -X POST http://localhost:3000/api/cron/expire-payments \
  -H "Authorization: Bearer $CRON_SECRET"

# Check API health
curl -X GET http://localhost:3000/api/health
```
