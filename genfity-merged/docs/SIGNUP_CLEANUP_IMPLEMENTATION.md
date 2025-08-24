# Signup Immediate Cleanup Implementation

## Overview
Implementasi sistem cleanup otomatis untuk mengatasi masalah duplicate account dan user yang tidak menyelesaikan verifikasi OTP.

## Changes Made

### 1. Immediate Cleanup Strategy di Signup (`/api/auth/signup`)

**Problem Solved:**
- User tidak bisa re-register karena akun zombie masih ada di database
- Gap timing antara OTP expired dan cron cleanup

**Solution:**
- Cleanup dilakukan langsung saat signup jika ditemukan existing user yang expired
- Tidak perlu menunggu cron job

**Logic Flow:**
```typescript
if (existingUser.phone === normalizedPhone) {
  if (existingUser.phoneVerified) {
    // Return error - user sudah verified
  } else {
    // Check expiry
    const otpExpired = existingUser.otpExpires < now
    const deadlinePassed = existingUser.otpVerificationDeadline < now
    
    if (otpExpired || deadlinePassed) {
      // Delete expired user dan lanjutkan signup baru
    } else {
      // Return error - registrasi masih dalam progress
    }
  }
}
```

### 2. Enhanced Cleanup Logic di Cron Job

**Status:** DEPRECATED (kept as backup only)

**Changes:**
- Gunakan kedua field (`otpExpires` dan `otpVerificationDeadline`) untuk cleanup
- Tambah logging dan marking sebagai deprecated
- Cron job sekarang hanya sebagai backup mechanism

### 3. Timing Configuration

- **OTP Expires:** 10 menit (untuk keamanan kode OTP)
- **Verification Deadline:** 1 jam (untuk cleanup akun)

## Benefits

1. **User Experience:**
   - User bisa langsung re-register jika OTP expired
   - Tidak ada "stuck" state

2. **Database Hygiene:**
   - Cleanup dilakukan real-time
   - Tidak ada akumulasi zombie accounts

3. **System Performance:**
   - Reduced dependency pada cron jobs
   - Immediate problem resolution

## Error Codes

- `DUPLICATE_PHONE_VERIFIED`: Phone sudah registered dan verified
- `REGISTRATION_IN_PROGRESS`: Registrasi masih dalam progress (OTP masih valid)
- `DUPLICATE_EMAIL`: Email sudah digunakan (untuk phone number yang berbeda)

## Logging

### Immediate Cleanup Logs:
```
[IMMEDIATE-CLEANUP] Deleting expired unverified user: +6281234567890, reason: OTP_EXPIRED, otpExpired: true, deadlinePassed: false
```

### Backup Cron Logs:
```
[DEPRECATED-CRON] Backup cleanup deleted 0 unverified users at 2025-08-24T10:00:00.000Z
```

## Testing Scenarios

1. **Normal Flow:**
   - Signup → Verify OTP dalam 10 menit → Success

2. **OTP Expired:**
   - Signup → Wait 11 menit → Signup again → Immediate cleanup → Success

3. **Deadline Passed:**
   - Signup → Wait 1.5 jam → Signup again → Immediate cleanup → Success

4. **Registration In Progress:**
   - Signup → Wait 5 menit → Signup again → Error REGISTRATION_IN_PROGRESS

## Migration Notes

- **Backward Compatible:** Existing users tidak terpengaruh
- **Cron Job:** Masih berfungsi sebagai backup, bisa dinonaktifkan
- **Database:** Tidak ada perubahan schema

## Monitoring

Monitor logs untuk:
- Frequency of immediate cleanups
- Backup cron job activity (should be minimal)
- Error patterns pada duplicate registrations

## Next Steps (Optional)

1. Completely disable cron job setelah monitoring 1-2 minggu
2. Add metrics tracking untuk cleanup frequency
3. Consider adding rate limiting untuk prevent abuse
