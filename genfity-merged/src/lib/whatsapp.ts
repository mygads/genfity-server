interface WhatsAppResult {
    success: boolean;
    error?: {
        type: 'NETWORK_ERROR' | 'TIMEOUT' | 'AUTH_ERROR' | 'SERVER_ERROR' | 'CONFIG_ERROR';
        message: string;
        statusCode?: number;
    };
}

export async function sendWhatsAppMessage(phoneNumber: string, message: string): Promise<boolean> {
    const result = await sendWhatsAppMessageDetailed(phoneNumber, message);
    return result.success;
}

export async function sendWhatsAppMessageDetailed(phoneNumber: string, message: string): Promise<WhatsAppResult> {
    const SESSION_ID = process.env.WHATSAPP_SESSION_ID;
    const WA_URL = "/client/sendMessage/" + SESSION_ID;
    const API_URL = process.env.WHATSAPP_SERVER_API;
    const CHAT_ID_SUFFIX = '@c.us';
    
    // Pastikan nomor telepon diawali dengan 62 dan tanpa +
    let formattedPhoneNumber = phoneNumber.replace(/\D/g, ''); // Hapus semua non-digit
    if (formattedPhoneNumber.startsWith('0')) {
        formattedPhoneNumber = '62' + formattedPhoneNumber.substring(1);
    } else if (formattedPhoneNumber.startsWith('+62')) {
        formattedPhoneNumber = formattedPhoneNumber.substring(1);
    } else if (!formattedPhoneNumber.startsWith('62')) {
        formattedPhoneNumber = '62' + formattedPhoneNumber;
    }

    if (!API_URL || !WA_URL) {
        console.error('WHATSAPP_API_ENDPOINT is not defined.');
        return {
            success: false,
            error: {
                type: 'CONFIG_ERROR',
                message: 'WhatsApp API URL not configured'
            }
        };
    }

    if (!process.env.WHATSAPP_API_KEY) {
        console.error('WHATSAPP_API_KEY is not defined.');
        return {
            success: false,
            error: {
                type: 'CONFIG_ERROR',
                message: 'WhatsApp API key not configured'
            }
        };
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch(API_URL + WA_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'access-token': `${process.env.WHATSAPP_API_KEY}`,
            },
            body: JSON.stringify({
                chatId: `${formattedPhoneNumber}${CHAT_ID_SUFFIX}`,
                contentType: "string",
                content: message,
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            let errorData = { message: response.statusText };
            try {
                errorData = await response.json();
            } catch (e) { /* ignore if parsing fails */ }
              console.error('WhatsApp API error:', response.status, errorData);
            
            let errorType: 'NETWORK_ERROR' | 'TIMEOUT' | 'AUTH_ERROR' | 'SERVER_ERROR' | 'CONFIG_ERROR' = 'SERVER_ERROR';
            if (response.status === 401 || response.status === 403) {
                errorType = 'AUTH_ERROR';
            } else if (response.status >= 500) {
                errorType = 'SERVER_ERROR';
            }
            
            return {
                success: false,
                error: {
                    type: errorType,
                    message: errorData.message || `HTTP ${response.status}`,
                    statusCode: response.status
                }
            };
        }
        
        console.log('WhatsApp message sent successfully to:', formattedPhoneNumber);
        return { success: true };
        
    } catch (error) {        console.error('Error sending WhatsApp message:', error);
        
        let errorType: 'NETWORK_ERROR' | 'TIMEOUT' | 'AUTH_ERROR' | 'SERVER_ERROR' | 'CONFIG_ERROR' = 'NETWORK_ERROR';
        let errorMessage = 'Network error occurred';
        
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                errorType = 'TIMEOUT';
                errorMessage = 'Request timeout after 30 seconds';
            } else if (error.message.includes('fetch') || error.message.includes('ENOTFOUND')) {
                errorType = 'NETWORK_ERROR';
                errorMessage = 'Unable to connect to WhatsApp server';
            }
        }
        
        return {
            success: false,
            error: {
                type: errorType,
                message: errorMessage
            }
        };
    }
}

