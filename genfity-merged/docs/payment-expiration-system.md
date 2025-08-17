# Payment & Transaction Expiration System

## Overview
Sistem ini menangani ekspirasi pembayaran dan transaksi dengan aturan sebagai berikut:
- **Payment expiration**: Maksimal 1 hari dari pembuatan
- **Transaction expiration**: Maksimal 1 minggu dari pembuatan (untuk membuat payment baru)

## Status Payment
- `pending`: Menunggu pembayaran
- `paid`: Berhasil, sukses
- `failed`: Ditolak admin, ditolak payment gateway, dll
- `expired`: Waktu pembayaran habis
- `cancelled`: Cancel by user

## Status Transaction
- `pending`: Menunggu pembayaran (default)
- `paid`: Auto berhasil jika payment berhasil
- `failed`: Jika payment failed/ditolak
- `expired`: Jika payment expired atau transaction expired
- `cancelled`: Cancel oleh user

## Alur Kerja

### 1. Pembuatan Transaction
```typescript
// Transaction otomatis memiliki expiration 1 minggu
const transaction = await PaymentExpirationService.createTransactionWithExpiration({
  userId: "user-id",
  amount: 100000,
  type: "product_purchase",
  currency: "idr"
});
```

### 2. Pembuatan Payment
```typescript
// Payment otomatis memiliki expiration 1 hari
const payment = await PaymentExpirationService.createPaymentWithExpiration({
  transactionId: "transaction-id",
  amount: 100000,
  method: "bank_transfer"
});
```

### 3. Update Status Payment
```typescript
// Sync otomatis dengan transaction status
await PaymentExpirationService.updatePaymentStatus(
  "payment-id", 
  "paid", 
  "Payment confirmed by admin",
  "admin-user-id"
);
```

## Database Migration

Jalankan SQL berikut untuk menambahkan field expiration:

```sql
-- AlterTable
ALTER TABLE `Transaction` ADD COLUMN `expiresAt` DATETIME(3) NULL,
    MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'pending';

-- AlterTable
ALTER TABLE `Payment` ADD COLUMN `expiresAt` DATETIME(3) NULL,
    MODIFY `status` VARCHAR(191) NOT NULL DEFAULT 'pending';

-- CreateIndex
CREATE INDEX `Transaction_status_idx` ON `Transaction`(`status`);
CREATE INDEX `Transaction_expiresAt_idx` ON `Transaction`(`expiresAt`);
CREATE INDEX `Payment_status_idx` ON `Payment`(`status`);
CREATE INDEX `Payment_expiresAt_idx` ON `Payment`(`expiresAt`);
```

## Setup Cron Job

### Environment Variables
Tambahkan ke `.env`:
```
CRON_SECRET=your-secure-random-string-here
```

### Vercel Cron (Recommended)
Tambahkan ke `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/expire-payments",
      "schedule": "0 */2 * * *"
    }
  ]
}
```

### Manual Cron Job
Untuk server sendiri, setup cron job untuk memanggil endpoint:
```bash
# Jalankan setiap 2 jam
0 */2 * * * curl -X POST https://your-domain.com/api/cron/expire-payments \
  -H "Authorization: Bearer your-cron-secret"
```

### GitHub Actions (Alternative)
Buat `.github/workflows/cron-payments.yml`:
```yaml
name: Expire Payments Cron Job
on:
  schedule:
    - cron: '0 */2 * * *'  # Every 2 hours
  workflow_dispatch:

jobs:
  expire-payments:
    runs-on: ubuntu-latest
    steps:
      - name: Call expire payments endpoint
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/cron/expire-payments \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

## API Endpoints

### 1. Create Transaction
`POST /api/transactions/create`
```json
{
  "amount": 100000,
  "type": "product_purchase",
  "currency": "idr"
}
```

### 2. Create Payment
`POST /api/payments/create`
```json
{
  "transactionId": "transaction-id",
  "paymentMethod": "bank_transfer",
  "amount": 100000
}
```

### 3. Update Payment Status (Admin)
`POST /api/payments/[paymentId]/update-status`
```json
{
  "status": "paid",
  "adminNotes": "Payment confirmed"
}
```

### 4. Cancel Transaction (User)
`POST /api/transactions/[transactionId]/cancel`

### 5. Cron Job - Expire Payments
`POST /api/cron/expire-payments`
Header: `Authorization: Bearer {CRON_SECRET}`

## Validasi Bisnis

### Pembatasan Transaksi
- Transaction yang sudah expired (> 1 minggu) tidak dapat membuat payment baru
- Transaction dengan status `paid`, `cancelled`, atau `expired` tidak dapat membuat payment baru

### Pembatasan Payment
- Payment yang sudah expired (> 1 hari) otomatis berubah status menjadi `expired`
- Payment yang `expired` akan mempengaruhi status transaction menjadi `expired`

### Sync Status
- Payment `paid` → Transaction `paid`
- Payment `failed` → Transaction `failed`
- Payment `expired` → Transaction `expired`
- Payment `cancelled` → Transaction `cancelled`
- Payment `pending` → Transaction tetap `pending`

## Monitoring & Logging

Cron job akan log:
- Jumlah payment yang expired
- ID payment yang diupdate
- Error jika ada

Contoh response cron job:
```json
{
  "success": true,
  "message": "Expired 5 payments",
  "expiredPayments": [
    {
      "id": "payment-1",
      "transactionId": "transaction-1",
      "amount": 100000,
      "method": "bank_transfer"
    }
  ]
}
```
