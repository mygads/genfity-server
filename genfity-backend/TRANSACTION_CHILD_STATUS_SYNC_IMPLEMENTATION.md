# Transaction Child Status Sync Implementation

## Overview
Implementasi untuk memastikan sinkronisasi status antara transaction parent dan child (TransactionProduct, TransactionAddons) serta delivery status management.

## Changes Made

### 1. Child Transaction Status Update saat Payment Created
**File:** `src/app/api/customer/payment/create/route.ts`
- **Perubahan:** Menambahkan update status child transaction menjadi `pending` ketika payment dibuat
- **Code Added:**
```typescript
// 5.1. Update child transaction statuses to pending when payment is created
await tx.transactionProduct.updateMany({
  where: { transactionId: transaction.id },
  data: { status: 'pending' }
});

await tx.transactionAddons.updateMany({
  where: { transactionId: transaction.id },
  data: { status: 'pending' }
});
```

### 2. Child Transaction Status Update saat Payment Paid
**File:** `src/lib/payment-expiration.ts`
- **Perubahan:** Menambahkan fungsi `updateChildTransactionStatuses` untuk sync status
- **Code Added:**
```typescript
static async updateChildTransactionStatuses(
  transactionId: string, 
  status: 'created' | 'pending' | 'in_progress' | 'success' | 'cancelled'
) {
  // Update all TransactionProduct and TransactionAddons statuses
}
```
- **Integration:** Dipanggil ketika payment status berubah menjadi `paid`

### 3. Auto-Activation Service (One-Time Only)
**File:** `src/app/api/customer/payment/status/[paymentId]/route.ts`
- **Perubahan:** Memastikan auto-activation hanya dijalankan sekali
- **Logic:** Cek apakah delivery record sudah ada sebelum menjalankan activation
- **Condition:** Hanya aktivasi jika:
  - Payment status = `paid`
  - Transaction status = `in_progress`
  - Belum ada delivery record untuk service tersebut

### 4. Button Logic Update - Product Transactions
**File:** `src/app/dashboard/product-transactions/page.tsx`
- **Start Progress Button:** Muncul ketika:
  - Payment status = `paid`
  - Child transaction status = `pending`
  - Delivery record exists dengan status `pending` atau `awaiting_delivery`
- **Mark Completed Button:** Muncul ketika:
  - Payment status = `paid`
  - Child transaction status = `in_progress`
  - Delivery status = `in_progress`

### 5. Delivery Status Badge Update
**File:** `src/app/dashboard/product-transactions/page.tsx`
- **Perubahan:** Menambahkan status `awaiting_delivery`
- **Display:** Tampilkan `-` jika tidak ada delivery record

### 6. API Status Update Logic
**File:** `src/app/api/transactions/product/[id]/status/route.ts`
- **Start Action:** Update child transaction status ke `in_progress` dan delivery status ke `in_progress`
- **Complete Action:** Update child transaction status ke `success` dan delivery status ke `delivered`
- **Validation:** Hanya izinkan action jika status sesuai

## Status Flow

### Product Transactions
1. **Created** → Payment dibuat → Child status: `pending`
2. **Pending** → Payment paid → Child status: `pending`, Transaction: `in_progress`, Delivery record dibuat dengan status `pending`
3. **Pending** → Start Progress → Child status: `in_progress`, Delivery status: `in_progress`
4. **In Progress** → Mark Completed → Child status: `success`, Delivery status: `delivered`

### Delivery Status Flow
1. **No Record** → Display: `-`
2. **pending** → Button: "Start Progress"
3. **in_progress** → Button: "Mark Completed"
4. **delivered** → No button (completed)

## Button Display Logic

### Start Progress Button
```typescript
{transaction.payment?.status === 'paid' && 
 transaction.status === 'pending' && 
 transaction.deliveryStatus && 
 ['pending', 'awaiting_delivery'].includes(transaction.deliveryStatus) && (
  // Show Start Progress Button
)}
```

### Mark Completed Button
```typescript
{transaction.status === 'in_progress' && 
 transaction.deliveryStatus === 'in_progress' && (
  // Show Mark Completed Button
)}
```

## API Endpoints Updated

1. **POST** `/api/customer/payment/create` - Update child status saat payment dibuat
2. **GET** `/api/customer/payment/status/[paymentId]` - Auto-activation dengan one-time check
3. **POST** `/api/transactions/product/[id]/status` - Handle start/complete actions
4. **GET** `/api/transactions/product/[id]/detail` - Return correct button states
5. **GET** `/api/transactions/product` - Return delivery status dari services table

## Database Impact

### Tables Modified
- `TransactionProduct.status` - Updated saat payment created/paid
- `TransactionAddons.status` - Updated saat payment created/paid
- `ServicesProductCustomers.status` - Untuk delivery tracking
- `ServicesAddonsCustomers.status` - Untuk delivery tracking

### Status Values
- **Child Transaction Status:** `created`, `pending`, `in_progress`, `success`, `cancelled`
- **Delivery Status:** `pending`, `in_progress`, `delivered`

## Testing Scenarios

1. **Payment Creation:** Verify child status changes to `pending`
2. **Payment Paid:** Verify child status remains `pending`, delivery record created
3. **Start Progress:** Verify child status → `in_progress`, delivery status → `in_progress`
4. **Mark Completed:** Verify child status → `success`, delivery status → `delivered`
5. **One-Time Activation:** Verify services only activated once per transaction
6. **Button Display:** Verify correct buttons show at each status

## Notes
- Delivery status hanya tampil jika ada record di services table
- Auto-activation hanya berjalan sekali per transaction
- Button logic mengikuti status child transaction dan delivery status
- Backward compatibility maintained untuk existing data
