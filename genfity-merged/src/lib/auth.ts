import { prisma } from './prisma';

// Fungsi untuk normalisasi nomor telepon - International format with country codes
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove spaces, dashes, parentheses but keep +
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Handle different input formats
  if (cleanPhone.startsWith('+')) {
    // Already in international format: +628123456789 -> 628123456789
    return cleanPhone.substring(1);
  } else if (cleanPhone.startsWith('0') && cleanPhone.length >= 10) {
    // Indonesian local format: 08123456789 -> 628123456789 (default to Indonesia)
    return '62' + cleanPhone.substring(1);
  } else if (cleanPhone.match(/^[1-9]\d+$/)) {
    // Numbers without + or 0, need to determine country code
    // For backward compatibility, if it looks like Indonesian mobile (8xxxxxxxx), add 62
    if (cleanPhone.startsWith('8') && cleanPhone.length >= 10 && cleanPhone.length <= 13) {
      return '62' + cleanPhone;
    }
    // Otherwise, assume it already includes country code
    return cleanPhone;
  }
  
  // Fallback: assume Indonesian if no clear format
  return '62' + cleanPhone.replace(/\D/g, '');
}
