import { validateApiKey } from './api-key';

/**
 * Extract and validate API key from request headers
 */
export async function validateApiKeyFromRequest(request: Request): Promise<string | null> {
  // Check Authorization header for Bearer token (API key)
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  if (!apiKey || !apiKey.startsWith('gf_')) {
    return null;
  }

  // Validate API key and return user ID
  return await validateApiKey(apiKey);
}

/**
 * Authentication wrapper for customer API endpoints
 */
export async function authenticateApiKey(request: Request): Promise<{ userId: string } | { error: string; status: number }> {
  const userId = await validateApiKeyFromRequest(request);
  
  if (!userId) {
    return {
      error: 'Authentication required',
      status: 401
    };
  }

  return { userId };
}
