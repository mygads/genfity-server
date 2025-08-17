import { randomBytes } from 'crypto';
import { prisma } from './prisma';

/**
 * Generate a unique API key for a user
 */
export function generateApiKey(): string {
  // Generate a 32-byte random key and encode as base64url
  const buffer = randomBytes(32);
  return 'gf_' + buffer.toString('base64url');
}

/**
 * Get or create API key for a user
 */
export async function getOrCreateUserApiKey(userId: string): Promise<string> {
  // Check if user already has an API key
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { apiKey: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Return existing API key if available
  if (user.apiKey) {
    return user.apiKey;
  }

  // Generate new API key
  let apiKey: string = '';
  let isUnique = false;
  
  // Ensure uniqueness
  while (!isUnique) {
    apiKey = generateApiKey();
    const existingKey = await prisma.user.findUnique({
      where: { apiKey }
    });
    isUnique = !existingKey;
  }

  // Update user with new API key
  await prisma.user.update({
    where: { id: userId },
    data: { apiKey }
  });

  return apiKey;
}

/**
 * Validate API key and return user ID
 */
export async function validateApiKey(apiKey: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { apiKey },
    select: { id: true }
  });

  return user?.id || null;
}

/**
 * Regenerate API key for a user
 */
export async function regenerateApiKey(userId: string): Promise<string> {
  let apiKey: string = '';
  let isUnique = false;
  
  // Ensure uniqueness
  while (!isUnique) {
    apiKey = generateApiKey();
    const existingKey = await prisma.user.findUnique({
      where: { apiKey }
    });
    isUnique = !existingKey;
  }

  // Update user with new API key
  await prisma.user.update({
    where: { id: userId },
    data: { apiKey }
  });

  return apiKey;
}
