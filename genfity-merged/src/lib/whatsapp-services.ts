import { prisma } from '@/lib/prisma';
import { whatsappGoService } from '../services/whatsapp-go';

export async function waFetch(path: string, method: string = 'GET', body?: any) {

    // Redirect to new service for admin operations
    if (path.includes('/admin/users') && method === 'GET') {
        const result = await whatsappGoService.getUsers();
        return result.data || [];
    }
    
    throw new Error(`waFetch: Unsupported operation. Please use whatsappGoService methods directly.`);
}

// Validasi apakah user boleh membuat session baru
export async function canCreateWhatsappSession(userId: string): Promise<{ allowed: boolean; maxSession: number; currentSession: number; isAdmin: boolean; }> {
  // Cek role user
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { allowed: false, maxSession: 0, currentSession: 0, isAdmin: false };
  }
  if (user.role === 'admin') {
    // Admin boleh membuat session tanpa batas
    return { allowed: true, maxSession: Number.MAX_SAFE_INTEGER, currentSession: 0, isAdmin: true };
  }  // Ambil paket aktif user
  const now = new Date();
  const service = await prisma.servicesWhatsappCustomers.findFirst({
    where: { customerId: userId, expiredAt: { gt: now } },
    include: { package: true },
    orderBy: { expiredAt: 'desc' },
  });
  if (!service || !service.package) {
    return { allowed: false, maxSession: 0, currentSession: 0, isAdmin: false };
  }
  // Hitung jumlah session WhatsApp aktif milik user
  const currentSession = await prisma.whatsAppSession.count({
    where: { userId },
  });
  return {
    allowed: currentSession < service.package.maxSession,
    maxSession: service.package.maxSession,
    currentSession,
    isAdmin: false,
  };
}