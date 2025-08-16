# AI MIGRATION TERMS & CONDITIONS

**⚠️ WAJIB DIBACA SEBELUM MELAKUKAN PERUBAHAN KODE ⚠️**

## KETENTUAN UMUM

1. **STEP-BY-STEP MIGRATION**: AI wajib mengikuti rencana migrasi yang telah disusun secara bertahap
2. **KONFIRMASI SETIAP STEP**: AI WAJIB menunggu konfirmasi dari user sebelum melanjutkan ke step berikutnya
3. **BACKUP PROTECTION**: Tidak boleh menghapus atau mengubah folder backup-20250816-144259
4. **LOGIC PRESERVATION**: Logic bisnis dari kedua project harus tetap utuh dan tidak boleh berubah

## ATURAN MIGRASI

### 1. PRIORITY FRONTEND DEPENDENCIES
- Jika ada konflik dependency, gunakan versi dari genfity-frontend
- Config Tailwind, PostCSS menggunakan dari frontend
- Styling dan UI components prioritas frontend

### 2. ROUTING STRUCTURE
```
http://localhost:8090/ → redirect ke http://localhost:8090/[locale]
http://localhost:8090/admin → redirect ke http://localhost:8090/[locale]/admin/
```

### 3. MIDDLEWARE REQUIREMENTS
- User akses `/` → redirect ke `/[locale]` (user dashboard)
- User akses `/admin` → redirect ke `/[locale]/admin/` (admin dashboard)
- IP geolocation detection di-comment (tidak diterapkan karena masih bug)

### 4. AUTHENTICATION LOGIC
- Frontend auth untuk user area
- Backend auth untuk admin area
- Tidak boleh menghapus existing auth logic

### 5. CODE QUALITY STANDARDS
- Preserve existing TypeScript types
- Maintain existing API endpoints
- Keep database schema intact
- Preserve component structure

## FORBIDDEN ACTIONS

❌ Menghapus backup folder
❌ Mengubah database schema tanpa konfirmasi
❌ Menghapus API endpoints yang ada
❌ Mengubah authentication flow tanpa backup
❌ Melanjutkan ke step berikutnya tanpa konfirmasi user

## REQUIRED CONFIRMATIONS

Setiap step wajib mendapat konfirmasi:
"✅ Step [X] selesai. Lanjut ke Step [X+1]? (Yes/No)"

User harus menjawab "Yes" atau "Ya" untuk melanjutkan.

---

**AI ACKNOWLEDGMENT**: Saya memahami dan akan mematuhi semua ketentuan di atas dalam proses migrasi ini.
