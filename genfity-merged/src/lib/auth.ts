import { prisma } from './prisma';

// Fungsi untuk normalisasi nomor telepon
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  if (phone.startsWith('0')) {
    return '62' + phone.substring(1);
  } else if (phone.startsWith('+62')) {
    return phone.substring(1); // Simpan sebagai 62...
  } else if (phone.startsWith('62')) {
    return phone;
  }
  return '62' + phone.replace(/\D/g, '');
}
