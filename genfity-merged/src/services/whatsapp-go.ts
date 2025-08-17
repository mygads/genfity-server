/**
 * WhatsApp Go Server Integration
 * Server menggunakan whatsapp-go yang menggantikan whatsapp-web-js
 */

interface WhatsAppGoResult {
    success: boolean;
    error?: {
        type: 'NETWORK_ERROR' | 'TIMEOUT' | 'AUTH_ERROR' | 'SERVER_ERROR' | 'CONFIG_ERROR';
        message: string;
        statusCode?: number;
    };
    data?: any;
}

interface WhatsAppUser {
    connected: boolean;
    events: string;
    expiration: number;
    id: string;
    jid: string;
    loggedIn: boolean;
    name: string;
    proxy_config: {
        enabled: boolean;
        proxy_url: string;
    };
    proxy_url: string;
    qrcode: string;
    s3_config: {
        access_key: string;
        bucket: string;
        enabled: boolean;
        endpoint: string;
        media_delivery: string;
        path_style: boolean;
        public_url: string;
        region: string;
        retention_days: number;
    };
    token: string;
    webhook: string;
}

interface WhatsAppUsersResponse {
    code: number;
    data: WhatsAppUser[];
    success: boolean;
}

class WhatsAppGoService {
    private baseUrl: string;
    private adminToken: string;
    private userToken: string;

    constructor() {
        this.baseUrl = process.env.WHATSAPP_SERVER_API || 'https://wa.genfity.com';
        this.adminToken = process.env.WHATSAPP_ADMIN_TOKEN || '';
        this.userToken = process.env.WHATSAPP_USER_TOKEN || '';
    }

    /**
     * Get headers for admin requests
     */
    private getAdminHeaders(): Headers {
        const headers = new Headers();
        headers.set('Content-Type', 'application/json');
        headers.set('Authorization', this.adminToken);
        return headers;
    }

    /**
     * Get headers for user requests (non-admin routes)
     */
    private getUserHeaders(): Headers {
        const headers = new Headers();
        headers.set('Content-Type', 'application/json');
        headers.set('token', this.userToken);
        return headers;
    }

    /**
     * Make HTTP request with error handling
     */
    private async makeRequest(
        url: string, 
        options: RequestInit, 
        timeout: number = 30000
    ): Promise<WhatsAppGoResult> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                let errorData = { message: response.statusText };
                try {
                    errorData = await response.json();
                } catch (e) { /* ignore if parsing fails */ }

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

            const data = await response.json();
            return { success: true, data };

        } catch (error) {
            console.error('WhatsApp Go API Error:', error);

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

    /**
     * Get list of WhatsApp users (Admin only)
     */
    async getUsers(): Promise<WhatsAppGoResult> {
        if (!this.adminToken) {
            return {
                success: false,
                error: {
                    type: 'CONFIG_ERROR',
                    message: 'WhatsApp admin token not configured'
                }
            };
        }

        const url = `${this.baseUrl}/admin/users`;
        return this.makeRequest(url, {
            method: 'GET',
            headers: this.getAdminHeaders()
        });
    }

    /**
     * Create new WhatsApp user (Admin only)
     */
    async createUser(userData: {
        name: string;
        token: string;
        webhook?: string;
        events?: string;
        proxyConfig?: {
            enabled: boolean;
            proxyURL: string;
        };
        s3Config?: {
            enabled: boolean;
            endpoint: string;
            region: string;
            bucket: string;
            accessKey: string;
            secretKey: string;
            pathStyle: boolean;
            publicURL: string;
            mediaDelivery: string;
            retentionDays: number;
        };
    }): Promise<WhatsAppGoResult> {
        if (!this.adminToken) {
            return {
                success: false,
                error: {
                    type: 'CONFIG_ERROR',
                    message: 'WhatsApp admin token not configured'
                }
            };
        }

        const url = `${this.baseUrl}/admin/users`;
        return this.makeRequest(url, {
            method: 'POST',
            headers: this.getAdminHeaders(),
            body: JSON.stringify(userData)
        });
    }

    /**
     * Delete WhatsApp user (Admin only)
     */
    async deleteUser(userId: string): Promise<WhatsAppGoResult> {
        if (!this.adminToken) {
            return {
                success: false,
                error: {
                    type: 'CONFIG_ERROR',
                    message: 'WhatsApp admin token not configured'
                }
            };
        }

        const url = `${this.baseUrl}/admin/users/${userId}`;
        return this.makeRequest(url, {
            method: 'DELETE',
            headers: this.getAdminHeaders()
        });
    }

    /**
     * Send text message using user token
     */
    async sendTextMessage(phoneNumber: string, message: string): Promise<WhatsAppGoResult> {
        if (!this.userToken) {
            return {
                success: false,
                error: {
                    type: 'CONFIG_ERROR',
                    message: 'WhatsApp user token not configured'
                }
            };
        }

        // Format nomor telepon (pastikan format yang benar untuk Indonesia)
        let formattedPhone = phoneNumber.replace(/\D/g, ''); // Hapus semua non-digit
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '62' + formattedPhone.substring(1);
        } else if (formattedPhone.startsWith('+62')) {
            formattedPhone = formattedPhone.substring(1);
        } else if (!formattedPhone.startsWith('62')) {
            formattedPhone = '62' + formattedPhone;
        }

        const url = `${this.baseUrl}/chat/send/text`;
        return this.makeRequest(url, {
            method: 'POST',
            headers: this.getUserHeaders(),
            body: JSON.stringify({
                Phone: formattedPhone,
                Body: message
            })
        });
    }

    /**
     * Check if service is configured properly
     */
    isConfigured(): boolean {
        return !!(this.baseUrl && this.userToken);
    }

    /**
     * Check if admin functions are available
     */
    isAdminConfigured(): boolean {
        return !!(this.baseUrl && this.adminToken);
    }
}

// Export singleton instance
export const whatsappGoService = new WhatsAppGoService();

// Backward compatibility functions
export async function sendWhatsAppMessage(phoneNumber: string, message: string): Promise<boolean> {
    const result = await sendWhatsAppMessageDetailed(phoneNumber, message);
    return result.success;
}

export async function sendWhatsAppMessageDetailed(phoneNumber: string, message: string): Promise<WhatsAppGoResult> {
    // console.log(`[WhatsApp Go] Sending message to ${phoneNumber}: ${message.substring(0, 50)}...`);
    
    if (!whatsappGoService.isConfigured()) {
        console.error('[WhatsApp Go] Service not configured properly');
        return {
            success: false,
            error: {
                type: 'CONFIG_ERROR',
                message: 'WhatsApp service not configured'
            }
        };
    }

    const result = await whatsappGoService.sendTextMessage(phoneNumber, message);
    
    if (result.success) {
        // console.log(`[WhatsApp Go] Message sent successfully to ${phoneNumber}`);
    } else {
        console.error(`[WhatsApp Go] Failed to send message to ${phoneNumber}:`, result.error);
    }
    
    return result;
}

// Export service class for advanced usage
export { WhatsAppGoService };
export default whatsappGoService;
