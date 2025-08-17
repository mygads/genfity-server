import { PrismaClient } from '../generated/prisma'; // Adjusted path
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// User interface for JWT payload
export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  phone?: string | null;
  role?: string | null;
}

// JWT payload interface
export interface JWTPayload {
  id: string;
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  role?: string | null;
  iat?: number;
  exp?: number;
}

const prisma = new PrismaClient();

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

// Generate JWT token
export function generateToken(user: User): string {
  const payload: JWTPayload = {
    id: user.id,
    email: user.email,
    phone: user.phone,
    name: user.name,
    role: user.role,
  };

  return jwt.sign(payload, process.env.NEXTAUTH_SECRET || 'fallback-secret', {
    expiresIn: '7d',
  });
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET || 'fallback-secret') as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

// Login function
export async function loginUser(identifier: string, password: string): Promise<{ user: User; token: string } | null> {
  if (!identifier || !password) {
    throw new Error('Email/Telepon dan kata sandi diperlukan.');
  }

  let user;
  const isEmail = identifier.includes('@');

  if (isEmail) {
    user = await prisma.user.findUnique({
      where: { email: identifier },
      select: { id: true, name: true, email: true, image: true, password: true, phone: true, phoneVerified: true, emailVerified: true, role: true },
    });
  } else {
    const normalizedPhone = normalizePhoneNumber(identifier);
    user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
      select: { id: true, name: true, email: true, image: true, password: true, phone: true, phoneVerified: true, emailVerified: true, role: true },
    });
  }

  if (!user) {
    throw new Error('Pengguna tidak ditemukan.');
  }

  if (isEmail && !user.emailVerified) {
    throw new Error('Email belum diverifikasi. Silakan cek email Anda untuk link verifikasi atau daftar ulang untuk OTP WhatsApp.');
  }
  if (!isEmail && !user.phoneVerified) {
    throw new Error('Nomor WhatsApp belum diverifikasi. Silakan selesaikan proses OTP.');
  }

  if (user.role !== 'admin') {
    throw new Error('Akses hanya untuk admin.');
  }

  if (!user.password) {
    throw new Error('Konfigurasi akun tidak lengkap (tidak ada kata sandi).');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new Error('Kata sandi salah.');
  }

  const userForToken: User = {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    phone: user.phone,
    role: user.role,
  };

  const token = generateToken(userForToken);

  return {
    user: userForToken,
    token,
  };
}
