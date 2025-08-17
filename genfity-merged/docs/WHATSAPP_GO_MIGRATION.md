# WhatsApp Go Server Migration

## Overview
Sistem WhatsApp telah dimigrasi dari WhatsApp Web JS ke WhatsApp Go Server untuk performa dan stabilitas yang lebih baik.

## Perubahan Konfigurasi

### Environment Variables yang Dibutuhkan

```env
# WhatsApp Go Server Configuration
WHATSAPP_SERVER_API="https://wa.genfity.com"
WHATSAPP_ADMIN_TOKEN="rahasiagenfitywa"
WHATSAPP_USER_TOKEN="rahasiagenfitywa"
```

### Environment Variables yang Tidak Digunakan Lagi

```env
# DEPRECATED - Tidak digunakan lagi
# WHATSAPP_SESSION_ID="..."
# WHATSAPP_API_KEY="..."
```

## API Endpoints WhatsApp Go Server

### Perbedaan Header Authentication

- **Admin Routes** (routes yang dimulai dengan `/admin/`): Menggunakan header `Authorization`
- **User Routes** (routes lainnya): Menggunakan header `token`

### Admin Routes (menggunakan WHATSAPP_ADMIN_TOKEN)

#### 1. GET /admin/users
Mengecek daftar user WhatsApp yang terdaftar

**Headers:**
```
Authorization: rahasiagenfitywa
Content-Type: application/json
```

**Response:**
```json
{
    "code": 200,
    "data": [
        {
            "connected": true,
            "events": "All",
            "expiration": 0,
            "id": "3002079c7878190a302d75063ec98406",
            "jid": "6289668176764:75@s.whatsapp.net",
            "loggedIn": true,
            "name": "genfity-wa",
            "token": "rahasiagenfitywa",
            "webhook": ""
        }
    ],
    "success": true
}
```

#### 2. POST /admin/users
Menambah user WhatsApp baru

**Headers:**
```
Authorization: rahasiagenfitywa
Content-Type: application/json
```

**Payload:**
```json
{
  "name": "test_user",
  "token": "user_token",
  "webhook": "https://webhook.site/1234567890",
  "events": "All",
  "proxyConfig": {
    "enabled": false,
    "proxyURL": "socks5://user:pass@host:port"
  }, 
  "s3Config": {
    "enabled": false,
    "endpoint": "https://s3.amazonaws.com",
    "region": "us-east-1",
    "bucket": "my-bucket",
    "accessKey": "AKIAIOSFODNN7EXAMPLE",
    "secretKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    "pathStyle": false,
    "publicURL": "https://cdn.meusite.com",
    "mediaDelivery": "both",
    "retentionDays": 30
  }
}
```

#### 3. DELETE /admin/users/{userId}
Menghapus user WhatsApp

**Headers:**
```
Authorization: rahasiagenfitywa
```

**Response:**
```json
{
    "code": 200,
    "data": {"id": "c16c0359072a95bd17248ca58bd2551b"},
    "details": "user deleted successfully",
    "success": true
}
```

### User Routes (menggunakan WHATSAPP_USER_TOKEN)

#### POST /chat/send/text
Mengirim pesan teks WhatsApp

**Headers:**
```
token: rahasiagenfitywa
Content-Type: application/json
```

**Payload:**
```json
{
  "Phone": "6281233784490",
  "Body": "tes webhook send?"
}
```

**Response:**
```json
{
    "code": 200,
    "data": {
        "Details": "Sent",
        "Id": "3EB0744E286B549C2DECD9",
        "Timestamp": 1755436294
    },
    "success": true
}
```

## Perubahan Implementasi

### 1. File Utama yang Diubah

- `src/lib/whatsapp-go.ts` - Service baru untuk WhatsApp Go
- `src/lib/whatsapp.ts` - Diperbarui menggunakan service baru
- `src/lib/whatsapp-services.ts` - Deprecated beberapa fungsi lama
- `src/app/api/auth/signup/route.ts` - Menggunakan service baru
- `src/app/api/auth/send-otp/route.ts` - Menggunakan service baru

### 2. Struktur Service Baru

```typescript
import { whatsappGoService } from '@/lib/whatsapp-go';

// Untuk pengiriman pesan (menggunakan USER_TOKEN)
const result = await whatsappGoService.sendTextMessage(phoneNumber, message);

// Untuk operasi admin (menggunakan ADMIN_TOKEN)
const users = await whatsappGoService.getUsers();
const newUser = await whatsappGoService.createUser(userData);
await whatsappGoService.deleteUser(userId);
```

### 3. Backward Compatibility

Fungsi lama masih tersedia untuk kompatibilitas:

```typescript
// Masih berfungsi - akan redirect ke service baru
import { sendWhatsAppMessage } from '@/lib/whatsapp';
const success = await sendWhatsAppMessage(phoneNumber, message);
```

## User Management

### User Aktif untuk Aplikasi
- **Name**: genfity-wa
- **Token**: rahasiagenfitywa (sama dengan WHATSAPP_USER_TOKEN)
- **Status**: Connected dan loggedIn

### User Customer
User tambahan dapat didaftarkan oleh customer melalui sistem dan akan menggunakan token berbeda.

## Keuntungan Migrasi

1. **Performa Lebih Baik**: WhatsApp Go lebih cepat dan stabil
2. **API yang Lebih Sederhana**: Endpoint yang lebih mudah dipahami
3. **Manajemen User yang Lebih Baik**: Dapat mengelola multiple user WhatsApp
4. **Konfigurasi yang Lebih Fleksibel**: Support proxy, S3, webhook, dll

## Testing

### Signup Flow
1. User mengisi form signup dengan nomor WhatsApp
2. Sistem mengirim OTP menggunakan `whatsappGoService.sendTextMessage()`
3. OTP dikirim melalui WhatsApp Go server dengan format:
   ```
   Your OTP *1234*
   
   Please do not share this code with anyone.
   ```

### Error Handling
Service baru menangani berbagai jenis error:
- `NETWORK_ERROR`: Tidak dapat terhubung ke server
- `TIMEOUT`: Request timeout
- `AUTH_ERROR`: Token tidak valid
- `SERVER_ERROR`: Error di server WhatsApp
- `CONFIG_ERROR`: Konfigurasi tidak lengkap

## Migration Checklist

- [x] Buat service WhatsApp Go baru (`whatsapp-go.ts`)
- [x] Update fungsi pengiriman OTP di signup
- [x] Update fungsi pengiriman OTP di send-otp
- [x] Update konfigurasi environment variables
- [x] Deprecate fungsi lama di `whatsapp-services.ts`
- [x] Maintain backward compatibility
- [x] Dokumentasi perubahan

## Next Steps

1. **Testing**: Test semua flow signup dan OTP
2. **Monitoring**: Monitor log untuk memastikan service baru bekerja
3. **Cleanup**: Hapus konfigurasi lama setelah yakin tidak ada masalah
4. **Customer Integration**: Implement user management untuk customer yang mau registrasi WhatsApp sendiri
