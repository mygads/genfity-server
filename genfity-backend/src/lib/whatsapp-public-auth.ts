import { prisma } from "@/lib/prisma";
import { hasActiveWhatsAppSubscription } from "@/lib/whatsapp-subscription";

/**
 * Validate API key and return user info for public WhatsApp service
 */
export async function validatePublicApiKey(apiKey: string): Promise<{ userId: string; hasActiveService: boolean } | null> {
  if (!apiKey || !apiKey.startsWith('gf_')) {
    return null;
  }

  try {
    // Find user by API key
    const user = await prisma.user.findUnique({
      where: { apiKey }
    });

    if (!user || !user.isActive) {
      return null;
    }

    // Check if user has active WhatsApp subscription
    const hasActiveService = await hasActiveWhatsAppSubscription(user.id);

    return {
      userId: user.id,
      hasActiveService,
    };
  } catch (error) {
    console.error('[VALIDATE_PUBLIC_API_KEY]', error);
    return null;
  }
}

/**
 * Validate session ownership and API key
 */
export async function validateSessionAndApiKey(sessionId: string, apiKey: string): Promise<{
  isValid: boolean;
  userId?: string;
  sessionData?: any;
  error?: string;
}> {
  try {
    const apiValidation = await validatePublicApiKey(apiKey);
    
    if (!apiValidation) {
      return {
        isValid: false,
        error: 'Invalid API key',
      };
    }

    if (!apiValidation.hasActiveService) {
      return {
        isValid: false,
        error: 'No active WhatsApp service subscription',
      };
    }

    // Find session and verify ownership
    const session = await prisma.whatsAppSession.findFirst({
      where: {
        sessionId: sessionId,
        userId: apiValidation.userId,
      },
      select: {
        id: true,
        sessionId: true,
        sessionName: true,
        status: true,
        userId: true,
      },
    });

    if (!session) {
      return {
        isValid: false,
        error: 'Session not found or does not belong to this API key owner',
      };
    }

    if (session.status !== 'connected') {
      return {
        isValid: false,
        error: 'Session is not connected',
      };
    }

    return {
      isValid: true,
      userId: apiValidation.userId,
      sessionData: session,
    };
  } catch (error) {
    console.error('[VALIDATE_SESSION_AND_API_KEY]', error);
    return {
      isValid: false,
      error: 'Internal server error during validation',
    };
  }
}
