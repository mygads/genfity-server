# WhatsApp API Frontend AI Integration Guide

**Complete Implementation Guide for Frontend AI to Integrate WhatsApp Customer Management and Public Messaging APIs**

## 🚀 Quick Start

This guide provides everything a frontend AI needs to implement WhatsApp functionality, including session management, subscription info, transaction history, and message sending capabilities.

### 🔑 Authentication Summary
- **Customer APIs**: Use Bearer token (`Authorization: Bearer gf_your_token`)
- **Public APIs**: Use API key in URL path (`/api/services/whatsapp/chat/{sessionId}/{apiKey}/...`)
- **Global API Key**: One API key per user (not per session)

---

## 📋 Table of Contents

1. [API Key Management](#api-key-management)
2. [Session Management](#session-management)
3. [Subscription & Package Info](#subscription--package-info)
4. [Transaction History](#transaction-history)
5. [Message Sending](#message-sending)
6. [Complete Implementation Examples](#complete-implementation-examples)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)

---

## 🔐 API Key Management

### Get Global API Key
```javascript
/**
 * Retrieve the user's global WhatsApp API key
 * Returns existing key or null if none exists
 */
async function getApiKey() {
  const response = await fetch('/api/customer/whatsapp/apikey', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer gf_your_token',
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  return data.success ? data.apiKey : null;
}

// Response Format:
{
  "success": true,
  "apiKey": "gf_wh4t5app_abc123def456",
  "message": "API key retrieved successfully"
}
```

### Generate New API Key
```javascript
/**
 * Generate a new global WhatsApp API key
 * Replaces any existing key
 */
async function generateApiKey(name = 'WhatsApp API Key') {
  const response = await fetch('/api/customer/whatsapp/apikey', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer gf_your_token',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name })
  });
  
  const data = await response.json();
  return data.success ? data.apiKey : null;
}

// Response Format:
{
  "success": true,
  "apiKey": "gf_wh4t5app_xyz789ghi012",
  "message": "API key generated successfully"
}
```

---

## 📱 Session Management

### List All Sessions
```javascript
/**
 * Get all WhatsApp sessions for the user
 * Includes session quota and package information
 */
async function getAllSessions() {
  const response = await fetch('/api/customer/whatsapp/sessions', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer gf_your_token',
      'Content-Type': 'application/json'
    }
  });
  
  return await response.json();
}

// Response Format:
{
  "success": true,
  "sessions": [
    {
      "id": "abc123def4",
      "name": "Main Business",
      "status": "CONNECTED",
      "phone": "+1234567890",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T14:22:00Z"
    }
  ],
  "sessionQuota": {
    "used": 1,
    "max": 5,
    "canCreateMore": true
  },
  "package": {
    "name": "Business Pro",
    "maxSessions": 5,
    "features": ["unlimited_messages", "group_chat", "broadcast"]
  }
}
```

### Create New Session
```javascript
/**
 * Create a new WhatsApp session
 * Name must be unique and 3-50 characters
 */
async function createSession(name) {
  const response = await fetch('/api/customer/whatsapp/sessions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer gf_your_token',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name })
  });
  
  return await response.json();
}

// Response Format:
{
  "success": true,
  "session": {
    "id": "xyz789ghi0",
    "name": "Customer Support",
    "status": "DISCONNECTED",
    "phone": null,
    "createdAt": "2024-01-15T15:45:00Z",
    "updatedAt": "2024-01-15T15:45:00Z"
  },
  "message": "Session created successfully"
}
```

### Get Specific Session
```javascript
/**
 * Get details of a specific session
 */
async function getSession(sessionId) {
  const response = await fetch(`/api/customer/whatsapp/sessions/${sessionId}`, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer gf_your_token',
      'Content-Type': 'application/json'
    }
  });
  
  return await response.json();
}
```

### Update Session
```javascript
/**
 * Update session name (must be unique and 3-50 characters)
 */
async function updateSession(sessionId, newName) {
  const response = await fetch(`/api/customer/whatsapp/sessions/${sessionId}`, {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer gf_your_token',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: newName })
  });
  
  return await response.json();
}
```

### Delete Session
```javascript
/**
 * Delete a WhatsApp session permanently
 */
async function deleteSession(sessionId) {
  const response = await fetch(`/api/customer/whatsapp/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': 'Bearer gf_your_token',
      'Content-Type': 'application/json'
    }
  });
  
  return await response.json();
}
```

### Get QR Code for Session
```javascript
/**
 * Get QR code for WhatsApp Web connection
 * Returns base64 image data
 */
async function getSessionQR(sessionId) {
  const response = await fetch(`/api/customer/whatsapp/sessions/${sessionId}/qr`, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer gf_your_token',
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  return data.success ? data.qr : null;
}

// Response Format:
{
  "success": true,
  "qr": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "message": "QR code generated successfully"
}

// Usage in HTML:
// <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..." alt="WhatsApp QR Code" />
```

---

## 📦 Subscription & Package Info

### Get Current Subscription
```javascript
/**
 * Get user's current WhatsApp subscription package
 * Supports both legacy and new billing systems
 */
async function getSubscription() {
  const response = await fetch('/api/customer/whatsapp/subscription', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer gf_your_token',
      'Content-Type': 'application/json'
    }
  });
  
  return await response.json();
}

// Response Format (New System):
{
  "success": true,
  "subscription": {
    "id": "sub_abc123",
    "packageName": "Business Pro",
    "status": "ACTIVE",
    "maxSessions": 5,
    "features": ["unlimited_messages", "group_chat", "broadcast"],
    "billingCycle": "monthly",
    "nextBillingDate": "2024-02-15T00:00:00Z",
    "price": 29.99,
    "currency": "USD"
  },
  "usage": {
    "sessionsUsed": 3,
    "messagesThisMonth": 1250
  }
}

// Response Format (Legacy System):
{
  "success": true,
  "subscription": {
    "packageName": "Legacy WhatsApp Package",
    "status": "ACTIVE",
    "maxSessions": 3,
    "features": ["basic_messaging"],
    "isLegacy": true
  },
  "usage": {
    "sessionsUsed": 2
  }
}
```

---

## 💰 Transaction History

### Get WhatsApp Transactions
```javascript
/**
 * Get WhatsApp-related transaction history
 * Supports filtering by status and date range
 */
async function getTransactions(options = {}) {
  const params = new URLSearchParams();
  
  if (options.status) params.append('status', options.status);
  if (options.startDate) params.append('startDate', options.startDate);
  if (options.endDate) params.append('endDate', options.endDate);
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.offset) params.append('offset', options.offset.toString());
  
  const url = `/api/customer/whatsapp/transactions${params.toString() ? '?' + params.toString() : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer gf_your_token',
      'Content-Type': 'application/json'
    }
  });
  
  return await response.json();
}

// Usage Examples:
const allTransactions = await getTransactions();
const successfulOnly = await getTransactions({ status: 'SUCCESS' });
const recentTransactions = await getTransactions({ 
  startDate: '2024-01-01',
  limit: 10 
});

// Response Format:
{
  "success": true,
  "transactions": [
    {
      "id": "txn_abc123",
      "type": "SUBSCRIPTION",
      "description": "WhatsApp Business Pro - Monthly",
      "amount": 29.99,
      "currency": "USD",
      "status": "SUCCESS",
      "createdAt": "2024-01-15T10:30:00Z",
      "packageInfo": {
        "name": "Business Pro",
        "maxSessions": 5
      }
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

---

## 💬 Message Sending

### Send Text Message
```javascript
/**
 * Send a text message via WhatsApp
 * Uses public API with API key in URL
 */
async function sendMessage(sessionId, apiKey, phone, message) {
  const response = await fetch(`/api/services/whatsapp/chat/${sessionId}/${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      phone: phone,
      message: message
    })
  });
  
  return await response.json();
}

// Alternative URL format (GET request):
async function sendMessageGet(sessionId, apiKey, phone, message) {
  const encodedMessage = encodeURIComponent(message);
  const url = `/api/services/whatsapp/chat/${sessionId}/${apiKey}/${phone}/${encodedMessage}`;
  
  const response = await fetch(url, {
    method: 'GET'
  });
  
  return await response.json();
}

// Response Format:
{
  "success": true,
  "messageId": "msg_xyz789",
  "status": "sent",
  "timestamp": "2024-01-15T16:45:00Z"
}
```

---

## 🔧 Complete Implementation Examples

### React Hook for WhatsApp Management
```javascript
import { useState, useEffect } from 'react';

export function useWhatsApp() {
  const [apiKey, setApiKey] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get user's auth token (implement based on your auth system)
  const getAuthToken = () => localStorage.getItem('token');

  // API Key Management
  const fetchApiKey = async () => {
    try {
      const response = await fetch('/api/customer/whatsapp/apikey', {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      const data = await response.json();
      if (data.success) setApiKey(data.apiKey);
    } catch (err) {
      setError('Failed to fetch API key');
    }
  };

  const generateApiKey = async (name = 'WhatsApp API Key') => {
    try {
      setLoading(true);
      const response = await fetch('/api/customer/whatsapp/apikey', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name })
      });
      const data = await response.json();
      if (data.success) {
        setApiKey(data.apiKey);
        return data.apiKey;
      }
    } catch (err) {
      setError('Failed to generate API key');
    } finally {
      setLoading(false);
    }
  };

  // Session Management
  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/customer/whatsapp/sessions', {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      const data = await response.json();
      if (data.success) setSessions(data.sessions);
    } catch (err) {
      setError('Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (name) => {
    try {
      setLoading(true);
      const response = await fetch('/api/customer/whatsapp/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name })
      });
      const data = await response.json();
      if (data.success) {
        await fetchSessions(); // Refresh sessions list
        return data.session;
      }
    } catch (err) {
      setError('Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (sessionId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/customer/whatsapp/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      const data = await response.json();
      if (data.success) {
        await fetchSessions(); // Refresh sessions list
      }
    } catch (err) {
      setError('Failed to delete session');
    } finally {
      setLoading(false);
    }
  };

  // Message Sending
  const sendMessage = async (sessionId, phone, message) => {
    if (!apiKey) throw new Error('API key required');
    
    try {
      const response = await fetch(`/api/services/whatsapp/chat/${sessionId}/${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message })
      });
      return await response.json();
    } catch (err) {
      throw new Error('Failed to send message');
    }
  };

  // Subscription Info
  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/customer/whatsapp/subscription', {
        headers: { 'Authorization': `Bearer ${getAuthToken()}` }
      });
      const data = await response.json();
      if (data.success) setSubscription(data.subscription);
    } catch (err) {
      setError('Failed to fetch subscription');
    }
  };

  // Initialize
  useEffect(() => {
    fetchApiKey();
    fetchSessions();
    fetchSubscription();
  }, []);

  return {
    apiKey,
    sessions,
    subscription,
    loading,
    error,
    generateApiKey,
    createSession,
    deleteSession,
    sendMessage,
    fetchSessions,
    fetchSubscription
  };
}
```

### Vue.js Composable
```javascript
import { ref, onMounted } from 'vue';

export function useWhatsApp() {
  const apiKey = ref(null);
  const sessions = ref([]);
  const subscription = ref(null);
  const loading = ref(false);
  const error = ref(null);

  const authToken = localStorage.getItem('auth_token');

  const fetchApiKey = async () => {
    try {
      const response = await fetch('/api/customer/whatsapp/apikey', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await response.json();
      if (data.success) apiKey.value = data.apiKey;
    } catch (err) {
      error.value = 'Failed to fetch API key';
    }
  };

  const createSession = async (name) => {
    try {
      loading.value = true;
      const response = await fetch('/api/customer/whatsapp/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name })
      });
      const data = await response.json();
      if (data.success) {
        sessions.value.push(data.session);
        return data.session;
      }
    } catch (err) {
      error.value = 'Failed to create session';
    } finally {
      loading.value = false;
    }
  };

  const sendMessage = async (sessionId, phone, message) => {
    if (!apiKey.value) throw new Error('API key required');
    
    const response = await fetch(`/api/services/whatsapp/chat/${sessionId}/${apiKey.value}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message })
    });
    return await response.json();
  };

  onMounted(() => {
    fetchApiKey();
  });

  return {
    apiKey,
    sessions,
    subscription,
    loading,
    error,
    createSession,
    sendMessage
  };
}
```

### Vanilla JavaScript Class
```javascript
class WhatsAppAPI {
  constructor(authToken) {
    this.authToken = authToken;
    this.apiKey = null;
    this.baseHeaders = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
  }

  async init() {
    await this.fetchApiKey();
  }

  async fetchApiKey() {
    const response = await fetch('/api/customer/whatsapp/apikey', {
      headers: { 'Authorization': `Bearer ${this.authToken}` }
    });
    const data = await response.json();
    if (data.success) this.apiKey = data.apiKey;
    return this.apiKey;
  }

  async generateApiKey(name = 'WhatsApp API Key') {
    const response = await fetch('/api/customer/whatsapp/apikey', {
      method: 'POST',
      headers: this.baseHeaders,
      body: JSON.stringify({ name })
    });
    const data = await response.json();
    if (data.success) this.apiKey = data.apiKey;
    return data;
  }

  async getSessions() {
    const response = await fetch('/api/customer/whatsapp/sessions', {
      headers: { 'Authorization': `Bearer ${this.authToken}` }
    });
    return await response.json();
  }

  async createSession(name) {
    const response = await fetch('/api/customer/whatsapp/sessions', {
      method: 'POST',
      headers: this.baseHeaders,
      body: JSON.stringify({ name })
    });
    return await response.json();
  }

  async sendMessage(sessionId, phone, message) {
    if (!this.apiKey) throw new Error('API key required');
    
    const response = await fetch(`/api/services/whatsapp/chat/${sessionId}/${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message })
    });
    return await response.json();
  }

  async getSubscription() {
    const response = await fetch('/api/customer/whatsapp/subscription', {
      headers: { 'Authorization': `Bearer ${this.authToken}` }
    });
    return await response.json();
  }

  async getTransactions(options = {}) {
    const params = new URLSearchParams(options);
    const url = `/api/customer/whatsapp/transactions${params.toString() ? '?' + params : ''}`;
    
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${this.authToken}` }
    });
    return await response.json();
  }
}

// Usage:
const whatsApp = new WhatsAppAPI('gf_your_auth_token');
await whatsApp.init();
const sessions = await whatsApp.getSessions();
```

---

## ⚠️ Error Handling

### Common Error Responses
```javascript
// Authentication errors
{
  "success": false,
  "error": "UNAUTHORIZED",
  "message": "Invalid or missing authentication token"
}

// Subscription errors
{
  "success": false,
  "error": "NO_WHATSAPP_SUBSCRIPTION",
  "message": "User does not have an active WhatsApp subscription"
}

// Session limit errors
{
  "success": false,
  "error": "SESSION_LIMIT_REACHED",
  "message": "Maximum number of sessions reached for your package"
}

// Validation errors
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "Session name must be between 3 and 50 characters",
  "details": {
    "field": "name",
    "constraint": "length"
  }
}

// Not found errors
{
  "success": false,
  "error": "SESSION_NOT_FOUND",
  "message": "Session not found or you don't have permission to access it"
}
```

### Error Handling Best Practices
```javascript
async function handleApiCall(apiCall) {
  try {
    const response = await apiCall();
    const data = await response.json();
    
    if (!data.success) {
      switch (data.error) {
        case 'UNAUTHORIZED':
          // Redirect to login or refresh token
          window.location.href = '/login';
          break;
        case 'NO_WHATSAPP_SUBSCRIPTION':
          // Show subscription upgrade prompt
          showSubscriptionDialog();
          break;
        case 'SESSION_LIMIT_REACHED':
          // Show upgrade package prompt
          showUpgradeDialog();
          break;
        case 'VALIDATION_ERROR':
          // Show field-specific error message
          showFieldError(data.details.field, data.message);
          break;
        default:
          // Show generic error message
          showError(data.message || 'An error occurred');
      }
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('API call failed:', error);
    showError('Network error. Please try again.');
    return null;
  }
}

// Usage:
const result = await handleApiCall(() => 
  fetch('/api/customer/whatsapp/sessions', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
);
```

---

## ✅ Best Practices

### 1. API Key Security
```javascript
// ✅ Good: Store API key securely
const apiKey = await fetchApiKey();
sessionStorage.setItem('whatsapp_api_key', apiKey);

// ❌ Bad: Hardcode API key
const apiKey = 'gf_wh4t5app_hardcoded123';
```

### 2. Session Management
```javascript
// ✅ Good: Check session limits before creating
const sessions = await getSessions();
if (sessions.sessionQuota.canCreateMore) {
  await createSession(name);
} else {
  showUpgradePrompt();
}

// ❌ Bad: Create without checking limits
await createSession(name); // May fail
```

### 3. Message Validation
```javascript
// ✅ Good: Validate before sending
function validateMessage(phone, message) {
  if (!phone.match(/^\+[1-9]\d{1,14}$/)) {
    throw new Error('Invalid phone number format');
  }
  if (!message.trim() || message.length > 4096) {
    throw new Error('Message must be 1-4096 characters');
  }
}

await validateMessage(phone, message);
await sendMessage(sessionId, phone, message);
```

### 4. Loading States
```javascript
// ✅ Good: Show loading states
const [loading, setLoading] = useState(false);

const handleSendMessage = async () => {
  setLoading(true);
  try {
    await sendMessage(sessionId, phone, message);
    showSuccess('Message sent successfully');
  } catch (error) {
    showError('Failed to send message');
  } finally {
    setLoading(false);
  }
};
```

### 5. Real-time Updates
```javascript
// ✅ Good: Implement polling for session status
useEffect(() => {
  const interval = setInterval(async () => {
    const sessions = await getSessions();
    setSessions(sessions.sessions);
  }, 30000); // Poll every 30 seconds

  return () => clearInterval(interval);
}, []);
```

### 6. Caching Strategy
```javascript
// ✅ Good: Cache subscription and session data
const cache = new Map();

async function getCachedSubscription() {
  if (cache.has('subscription')) {
    return cache.get('subscription');
  }
  
  const subscription = await getSubscription();
  cache.set('subscription', subscription);
  
  // Clear cache after 5 minutes
  setTimeout(() => cache.delete('subscription'), 5 * 60 * 1000);
  
  return subscription;
}
```

---

## 🔍 Testing Your Implementation

### Test Checklist
- [ ] Can fetch/generate API key
- [ ] Can list all sessions with quota info
- [ ] Can create new session (respects limits)
- [ ] Can update session name
- [ ] Can delete session
- [ ] Can get QR code for connection
- [ ] Can send messages via public API
- [ ] Can view subscription details
- [ ] Can view transaction history
- [ ] Error handling works for all scenarios
- [ ] Loading states are shown appropriately
- [ ] API responses are validated

### Sample Test Data
```javascript
// Test phone numbers (use WhatsApp test numbers)
const testPhone = '+1234567890';

// Test session names
const testSessionNames = [
  'Customer Support',
  'Sales Team',
  'Marketing Bot'
];

// Test messages
const testMessages = [
  'Hello! This is a test message.',
  'Welcome to our service! 🎉',
  'Your order has been confirmed.'
];
```

---

## 📖 Summary

This guide provides everything needed to implement WhatsApp functionality in your frontend:

1. **API Key Management**: Get/generate global API keys
2. **Session CRUD**: Create, read, update, delete WhatsApp sessions
3. **QR Code Generation**: Connect sessions to WhatsApp Web
4. **Message Sending**: Send messages via public API
5. **Subscription Info**: View current package and limits
6. **Transaction History**: View WhatsApp-related billing
7. **Error Handling**: Comprehensive error management
8. **Best Practices**: Security, validation, and UX guidelines

All endpoints are production-ready with authentication, validation, and proper error handling. The public messaging API supports both POST (JSON) and GET (URL parameters) formats for maximum flexibility.

For additional help, refer to:
- `docs/whatsapp-api-documentation.md` - Detailed API documentation
- `docs/whatsapp-api-postman-collection.json` - Postman collection for testing
- `docs/whatsapp-api-testing-guide.md` - Testing scenarios and examples
