// Import WhatsApp Go service untuk menggantikan WhatsApp Web JS
import { sendWhatsAppMessage as sendWAMessage, sendWhatsAppMessageDetailed as sendWAMessageDetailed } from '../services/whatsapp-go';

interface WhatsAppResult {
    success: boolean;
    error?: {
        type: 'NETWORK_ERROR' | 'TIMEOUT' | 'AUTH_ERROR' | 'SERVER_ERROR' | 'CONFIG_ERROR';
        message: string;
        statusCode?: number;
    };
}

/**
 * Send WhatsApp message using new WhatsApp Go server
 * @deprecated Use whatsappGoService from './whatsapp-go' directly for better control
 */
export async function sendWhatsAppMessage(phoneNumber: string, message: string): Promise<boolean> {
    // console.log('[WhatsApp] Using WhatsApp Go server for message sending');
    return await sendWAMessage(phoneNumber, message);
}

/**
 * Send WhatsApp message with detailed response using new WhatsApp Go server
 * @deprecated Use whatsappGoService from './whatsapp-go' directly for better control
 */
export async function sendWhatsAppMessageDetailed(phoneNumber: string, message: string): Promise<WhatsAppResult> {
    // console.log('[WhatsApp] Using WhatsApp Go server for detailed message sending');
    return await sendWAMessageDetailed(phoneNumber, message);
}

