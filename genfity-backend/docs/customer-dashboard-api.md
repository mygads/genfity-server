# Customer Dashboard API Documentation

## Endpoint: GET /api/customer/dashboard

API ini digunakan untuk mendapatkan summary lengkap data customer untuk keperluan dashboard.

### Authentication
- **Required**: Yes
- **Type**: Bearer Token (JWT)
- **Header**: `Authorization: Bearer <token>`

### Request
```http
GET /api/customer/dashboard
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

### Response Structure

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "transactionSummary": {
      "success": {
        "total": 15,
        "product": 10,
        "whatsapp": 5
      },
      "pending": {
        "awaitingPayment": 3,
        "awaitingVerification": 2
      },
      "failed": 1,
      "totalOverall": 21
    },
    "productDeliveryLog": [
      {
        "transactionId": "clx123abc",
        "packageName": "VPS Basic",
        "addonName": "Additional Storage",
        "isDelivered": true,
        "amount": 150000,
        "currency": "idr",
        "createdAt": "2025-06-01T10:30:00Z"
      }
    ],
    "whatsappSummary": {
      "expiration": "2025-07-15T23:59:59Z",
      "sessionQuota": {
        "total": 5,
        "used": 3,
        "remaining": 2
      },
      "activeSessions": 2,
      "messageStats": {
        "sent": 1250,
        "failed": 15
      }
    },
    "recentHistory": {
      "products": [
        {
          "id": "clx123abc",
          "packageName": "VPS Basic",
          "addonName": "Additional Storage",
          "amount": 150000,
          "currency": "idr",
          "createdAt": "2025-06-01T10:30:00Z"
        }
      ],
      "whatsapp": [
        {
          "id": "clx456def",
          "packageName": "WhatsApp Pro",
          "duration": "monthly",
          "amount": 99000,
          "currency": "idr",
          "createdAt": "2025-05-28T14:20:00Z"
        }
      ]
    },
    "lastUpdated": "2025-06-08T12:00:00Z"
  }
}
```

#### Error Response (401)
```json
{
  "success": false,
  "error": "Authentication required"
}
```

#### Error Response (500)
```json
{
  "success": false,
  "error": "Failed to fetch dashboard data"
}
```

## Data Summary

### 1. Transaction Summary
- **success.total**: Total transaksi yang berhasil (completed payment)
- **success.product**: Jumlah transaksi product yang berhasil
- **success.whatsapp**: Jumlah transaksi WhatsApp yang berhasil
- **pending.awaitingPayment**: Transaksi menunggu pembayaran
- **pending.awaitingVerification**: Transaksi manual transfer menunggu verifikasi admin
- **failed**: Transaksi yang gagal
- **totalOverall**: Total semua transaksi

### 2. Product Delivery Log
Log status transaksi product yang sudah sukses dan status delivery:
- **transactionId**: ID transaksi
- **packageName**: Nama package yang dibeli
- **addonName**: Nama addon (jika ada)
- **isDelivered**: Status apakah sudah di-deliver admin (status = 'delivered')
- **amount**: Jumlah pembayaran
- **currency**: Mata uang (idr/usd)
- **createdAt**: Tanggal transaksi dibuat

### 3. WhatsApp Summary
- **expiration**: Tanggal expiry service WhatsApp aktif
- **sessionQuota.total**: Total kuota session yang tersedia
- **sessionQuota.used**: Jumlah session yang sudah digunakan
- **sessionQuota.remaining**: Sisa kuota session
- **activeSessions**: Jumlah session yang sedang aktif (status = 'connected')
- **messageStats.sent**: Total pesan terkirim bulan ini
- **messageStats.failed**: Total pesan gagal terkirim bulan ini

### 4. Recent History
- **products**: 5 transaksi product terakhir yang berhasil
- **whatsapp**: 5 transaksi WhatsApp terakhir yang berhasil

## Features

### 🔒 Security
- Memerlukan autentikasi customer yang valid
- Hanya menampilkan data milik user yang sedang login
- CORS protection

### 📊 Data Analytics
- Summary transaksi berdasarkan status dan tipe
- Tracking delivery status untuk product
- Monitoring kuota dan usage WhatsApp
- Statistik pesan WhatsApp real-time

### 🚀 Performance
- Single API call untuk semua data dashboard
- Optimized database queries dengan include/select
- Minimal data transfer dengan selective fields

### 📱 Frontend Ready
- Response structure yang mudah di-consume frontend
- Timestamp dalam format ISO untuk easy parsing
- Consistent data types dan naming convention

## Use Cases

1. **Customer Dashboard**: Menampilkan overview lengkap aktivitas customer
2. **Transaction Monitoring**: Tracking status pembayaran dan delivery
3. **WhatsApp Usage Tracking**: Monitor kuota dan performa pesan
4. **Purchase History**: Riwayat pembelian product dan WhatsApp
5. **Account Summary**: Overview general status akun customer

## Implementation Notes

- Message statistics menggunakan data dari `WhatsAppMessageStats` bulan berjalan
- WhatsApp service expiration diambil dari service yang masih aktif
- Product delivery status berdasarkan field `status` transaction ('delivered')
- Recent history dibatasi maksimal 5 item masing-masing kategori
- Semua amount dalam format Decimal untuk precision tinggi
