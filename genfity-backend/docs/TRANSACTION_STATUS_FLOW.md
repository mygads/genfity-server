# Transaction Status Flow Documentation

## Overview
Sistem ini mengimplementasikan status transaksi independen untuk setiap jenis layanan (Product, Addon, WhatsApp) dengan flow yang terstruktur.

## Status Flow

### 1. **Transaction Creation (Status: `created`)**
- User membuat transaksi baru
- Semua child transactions (product/addon/whatsapp) berstatus `created`
- Main transaction berstatus `created`

### 2. **Payment Creation (Status: `pending`)**
- User membuat payment untuk transaksi
- Semua child transactions berubah ke `pending`
- Main transaction berubah ke `pending`

### 3. **Payment Confirmation (Status: `in_progress`)**
- Payment gateway mengkonfirmasi pembayaran (status `paid`)
- Semua child transactions berubah ke `in_progress`  
- Main transaction berubah ke `in_progress`
- Sistem otomatis membuat delivery records untuk product dan addon

### 4. **Service Delivery (Status: `success`)**
- Admin menyelesaikan delivery untuk masing-masing layanan
- Child transaction yang sudah di-deliver berubah ke `success`
- Main transaction tetap `in_progress` sampai SEMUA child transactions `success`

### 5. **Transaction Completion (Status: `success`)**
- Ketika SEMUA child transactions sudah `success`
- Main transaction otomatis berubah ke `success`

## Implementation Details

### TransactionStatusManager Class

#### Key Methods:

1. **`updateTransactionOnPaymentCreation(transactionId)`**
   - Dipanggil saat payment dibuat
   - Update semua transactions ke `pending`

2. **`updateTransactionOnPayment(transactionId, paymentStatus)`**
   - Dipanggil saat payment status berubah ke `paid`
   - Update semua transactions ke `in_progress`
   - Membuat delivery records

3. **`updateChildTransactionStatus(transactionId, childType, childId?)`**
   - Dipanggil saat delivery selesai
   - Update child transaction ke `success`
   - Check apakah semua child sudah `success` untuk update main transaction

4. **`cancelTransaction(transactionId)`**
   - Dipanggil saat transaction dibatalkan
   - Membatalkan semua child transactions dan payment
   - Set semua status ke `cancelled`

5. **`createDeliveryRecords(transactionId)`**
   - Membuat records di `ServicesProductCustomers` dan `ServicesAddonsCustomers`
   - Dipanggil otomatis saat transactions jadi `in_progress`

### API Endpoints Updated

1. **`/api/payments/create`** - Menggunakan `updateTransactionOnPaymentCreation`
2. **`/api/payments/webhook`** - Menggunakan `updateTransactionOnPayment`
3. **`/api/package-customers/[id]`** - Menggunakan `updateChildTransactionStatus` untuk product
4. **`/api/addon-customers/[id]`** - Menggunakan `updateChildTransactionStatus` untuk addon
5. **`/api/transactions/addon/[id]/status`** - Updated untuk menggunakan status independen

### Frontend Updates

1. **`/dashboard/addon-transactions`**
   - Menampilkan quantity column
   - Menampilkan amount berdasarkan harga addon (bukan total transaksi)
   - Menampilkan status addon dari TransactionAddons (transaction status)
   - Menampilkan status delivery dari ServicesAddonsCustomers (delivery status) 
   - Action buttons berdasarkan status delivery:
     - Status `pending` → tombol "Mark In Progress"
     - Status `in_progress` → tombol "Mark Delivered"
   - Jika delivery belum dibuat (transaction belum in_progress) → tampilkan "-"
   - Legacy action buttons untuk transaction status tetap tersedia

2. **`/dashboard/package-customers`**
   - Sudah mendukung quantity field
   - Terintegrasi dengan transaction status manager
   - Menampilkan status delivery dari ServicesProductCustomers (delivery status)
   - Menampilkan status transaction dari Transaction dan TransactionProduct
   - Action buttons berdasarkan status delivery:
     - Status `pending` → tombol "Mark In Progress" 
     - Status `in_progress` → tombol "Mark Delivered"
   - Jika delivery belum dibuat (transaction belum in_progress) → tampilkan "-"
   - Modal detail menampilkan kedua status (delivery dan transaction)

## Delivery vs Transaction Status

### Status Delivery (ServicesProductCustomers & ServicesAddonsCustomers)
- `pending` - Menunggu delivery dimulai (dibuat saat transaction menjadi in_progress)
- `in_progress` - Sedang dalam proses delivery
- `delivered` - Delivery selesai

**Note:** Delivery records hanya dibuat setelah payment status menjadi `paid` dan transaction status menjadi `in_progress`. Sebelum itu akan ditampilkan "-" di UI.

### Status Transaction (TransactionProduct & TransactionAddons)  
- `created` - Transaksi baru dibuat
- `pending` - Payment dibuat, menunggu konfirmasi
- `in_progress` - Payment dikonfirmasi
- `success` - Delivery selesai (di-trigger otomatis saat delivery status = delivered)
- `cancelled` - Transaksi dibatalkan

### Cancellation Flow
Ketika transaction dibatalkan, semua status terkait akan berubah ke `cancelled`:
- Main transaction status → `cancelled`
- Child transaction status (TransactionProduct/TransactionAddons) → `cancelled`
- Payment status → `cancelled`
- WhatsApp transaction status → `cancelled`

**Note:** Delivery records tidak dibatalkan karena hanya dibuat setelah payment berhasil.

## Database Schema Changes

### TransactionProduct
```sql
ALTER TABLE TransactionProduct ADD COLUMN status VARCHAR(255) DEFAULT 'created';
ALTER TABLE TransactionProduct ADD INDEX idx_status (status);
```

### TransactionAddons  
```sql
ALTER TABLE TransactionAddons ADD COLUMN status VARCHAR(255) DEFAULT 'created';
ALTER TABLE TransactionAddons ADD INDEX idx_status (status);
```

## Status Values

- `created` - Transaksi baru dibuat
- `pending` - Payment dibuat, menunggu konfirmasi
- `in_progress` - Payment dikonfirmasi, sedang dalam proses delivery
- `success` - Delivery selesai
- `cancelled` - Transaksi dibatalkan

## WhatsApp Service Note

Flow untuk WhatsApp service tetap menggunakan sistem yang sudah ada (tidak diubah) karena sudah bekerja dengan benar. WhatsApp menggunakan sistem aktivasi yang berbeda dan langsung mengupdate masa berlaku service.

## Testing

Untuk testing flow ini:
1. Buat transaksi baru (status: created)
2. Buat payment (status: pending)  
3. Konfirmasi payment via webhook (status: in_progress)
4. Complete delivery via admin panel (child status: success)
5. Verify main transaction auto-complete when all children success
