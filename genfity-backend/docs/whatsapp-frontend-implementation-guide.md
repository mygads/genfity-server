# WhatsApp API Frontend Implementation Guide

This guide provides complete instructions for frontend AI to implement and consume the WhatsApp Customer API and Public Service API.

## Table of Contents
1. [Authentication Overview](#authentication-overview)
2. [Customer API Endpoints](#customer-api-endpoints)
3. [Public Service API Endpoints](#public-service-api-endpoints)
4. [Implementation Examples](#implementation-examples)
5. [Error Handling](#error-handling)
6. [Best Practices](#best-practices)

## Authentication Overview

### Customer API Authentication
- **Method**: Bearer Token
- **Header**: `Authorization: Bearer gf_your_api_key`
- **Requirements**: User must be logged in with valid API key

### Public Service API Authentication
- **Method**: API Key in URL path
- **Format**: API key is embedded in the URL path
- **Requirements**: Valid API key obtained from Customer API

### Getting Your API Key
First, you need to get the global API key from the Customer API:

```javascript
// Get existing API key
const response = await fetch('/api/customer/whatsapp/apikey', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer gf_your_login_token',
    'Content-Type': 'application/json'
  }
});

// Or generate new API key
const response = await fetch('/api/customer/whatsapp/apikey', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer gf_your_login_token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'My WhatsApp API Key'
  })
});
```

## Customer API Endpoints

### 1. Session Management

#### Get All Sessions
```javascript
const getSessions = async () => {
  const response = await fetch('/api/customer/whatsapp/sessions?limit=20&offset=0', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer gf_your_api_key',
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};
```

#### Create New Session
```javascript
const createSession = async (sessionName) => {
  const response = await fetch('/api/customer/whatsapp/sessions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer gf_your_api_key',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sessionName: sessionName
    })
  });
  return response.json();
};
```

#### Get Specific Session
```javascript
const getSession = async (sessionId) => {
  const response = await fetch(`/api/customer/whatsapp/sessions/${sessionId}`, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer gf_your_api_key',
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};
```

#### Update Session
```javascript
const updateSession = async (sessionId, updates) => {
  const response = await fetch(`/api/customer/whatsapp/sessions/${sessionId}`, {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer gf_your_api_key',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates) // { sessionName: "New Name", status: "active" }
  });
  return response.json();
};
```

#### Delete Session
```javascript
const deleteSession = async (sessionId) => {
  const response = await fetch(`/api/customer/whatsapp/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': 'Bearer gf_your_api_key',
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};
```

### 2. QR Code Management

#### Get QR Code for Session
```javascript
const getSessionQR = async (sessionId) => {
  const response = await fetch(`/api/customer/whatsapp/sessions/${sessionId}/qr`, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer gf_your_api_key',
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};

// Usage in React component
const QRCodeComponent = ({ sessionId }) => {
  const [qrData, setQrData] = useState(null);
  
  useEffect(() => {
    const fetchQR = async () => {
      const result = await getSessionQR(sessionId);
      if (result.success && result.data.hasQR) {
        setQrData(result.data.qr); // Base64 image data
      }
    };
    fetchQR();
  }, [sessionId]);
  
  return qrData ? <img src={qrData} alt="WhatsApp QR Code" /> : null;
};
```

### 3. API Key Management

#### Get Global API Key
```javascript
const getWhatsAppApiKey = async () => {
  const response = await fetch('/api/customer/whatsapp/apikey', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer gf_your_api_key',
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};
```

#### Generate New API Key
```javascript
const generateNewApiKey = async (keyName = 'WhatsApp API Key') => {
  const response = await fetch('/api/customer/whatsapp/apikey', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer gf_your_api_key',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: keyName
    })
  });
  return response.json();
};
```

### 4. Subscription & Billing

#### Get WhatsApp Subscription
```javascript
const getSubscription = async () => {
  const response = await fetch('/api/customer/whatsapp/subscription', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer gf_your_api_key',
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};
```

#### Get Transaction History
```javascript
const getTransactionHistory = async (limit = 10, offset = 0, status = 'paid') => {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString()
  });
  
  if (status) {
    params.append('status', status);
  }
  
  const response = await fetch(`/api/customer/whatsapp/transactions?${params}`, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer gf_your_api_key',
      'Content-Type': 'application/json'
    }
  });
  return response.json();
};
```

## Public Service API Endpoints

### 1. Send Message via URL Parameters

```javascript
const sendMessageViaURL = async (sessionId, apiKey, phoneNumber, message) => {
  // URL encode the message
  const encodedMessage = encodeURIComponent(message);
  
  const response = await fetch(
    `/api/services/whatsapp/chat/${sessionId}/${apiKey}/${phoneNumber}/${encodedMessage}`,
    {
      method: 'POST'
      // No headers needed for this endpoint
    }
  );
  return response.json();
};

// Example usage
await sendMessageViaURL(
  'customer-123-a1b2c3d4e5',
  'gf_abc123def456',
  '628123456789',
  'Hello World!'
);
```

### 2. Send Message via Request Body

#### Send Text Message
```javascript
const sendTextMessage = async (sessionId, apiKey, phoneNumber, message) => {
  const response = await fetch(`/api/services/whatsapp/chat/${sessionId}/${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      phone: phoneNumber,
      contentType: 'text',
      content: message
    })
  });
  return response.json();
};
```

#### Send Image Message
```javascript
const sendImageMessage = async (sessionId, apiKey, phoneNumber, base64Image, caption = '') => {
  const response = await fetch(`/api/services/whatsapp/chat/${sessionId}/${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      phone: phoneNumber,
      contentType: 'image',
      content: base64Image, // Base64 encoded image data
      caption: caption
    })
  });
  return response.json();
};
```

#### Send Document Message
```javascript
const sendDocumentMessage = async (sessionId, apiKey, phoneNumber, base64Document, fileName, caption = '') => {
  const response = await fetch(`/api/services/whatsapp/chat/${sessionId}/${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      phone: phoneNumber,
      contentType: 'document',
      content: base64Document, // Base64 encoded document data
      fileName: fileName,
      caption: caption
    })
  });
  return response.json();
};
```

### 3. Service Status Check

```javascript
const checkServiceStatus = async (sessionId, apiKey) => {
  const response = await fetch(`/api/services/whatsapp/chat/${sessionId}/${apiKey}`, {
    method: 'GET'
    // No headers needed
  });
  return response.json();
};
```

### 4. Test Service Connection

```javascript
const testService = async (sessionId, apiKey, phoneNumber) => {
  const response = await fetch(
    `/api/services/whatsapp/chat/${sessionId}/${apiKey}/${phoneNumber}/test`,
    {
      method: 'GET'
      // No headers needed
    }
  );
  return response.json();
};
```

## Implementation Examples

### Complete WhatsApp Session Manager Component

```javascript
import React, { useState, useEffect } from 'react';

const WhatsAppSessionManager = ({ bearerToken }) => {
  const [sessions, setSessions] = useState([]);
  const [apiKey, setApiKey] = useState('');
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeWhatsApp();
  }, []);

  const initializeWhatsApp = async () => {
    try {
      // Get API key
      const apiKeyResponse = await fetch('/api/customer/whatsapp/apikey', {
        headers: { 'Authorization': `Bearer ${bearerToken}` }
      });
      const apiKeyData = await apiKeyResponse.json();
      if (apiKeyData.success) {
        setApiKey(apiKeyData.data.apiKey);
      }

      // Get subscription
      const subResponse = await fetch('/api/customer/whatsapp/subscription', {
        headers: { 'Authorization': `Bearer ${bearerToken}` }
      });
      const subData = await subResponse.json();
      setSubscription(subData.data);

      // Get sessions
      const sessionsResponse = await fetch('/api/customer/whatsapp/sessions', {
        headers: { 'Authorization': `Bearer ${bearerToken}` }
      });
      const sessionsData = await sessionsResponse.json();
      if (sessionsData.success) {
        setSessions(sessionsData.data);
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to initialize WhatsApp:', error);
      setLoading(false);
    }
  };

  const createSession = async (sessionName) => {
    const response = await fetch('/api/customer/whatsapp/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sessionName })
    });
    
    const result = await response.json();
    if (result.success) {
      setSessions([...sessions, result.data]);
    }
    return result;
  };

  const sendMessage = async (sessionId, phoneNumber, message) => {
    if (!apiKey) {
      throw new Error('API key not available');
    }

    const response = await fetch(`/api/services/whatsapp/chat/${sessionId}/${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: phoneNumber,
        contentType: 'text',
        content: message
      })
    });
    
    return response.json();
  };

  if (loading) return <div>Loading WhatsApp...</div>;

  return (
    <div>
      <h2>WhatsApp Session Manager</h2>
      
      {/* Subscription Info */}
      {subscription && (
        <div>
          <h3>Subscription: {subscription.packageName}</h3>
          <p>Sessions: {subscription.currentSessions}/{subscription.maxSessions}</p>
          <p>Can create more: {subscription.canCreateMoreSessions ? 'Yes' : 'No'}</p>
        </div>
      )}

      {/* Sessions List */}
      <div>
        <h3>Sessions</h3>
        {sessions.map(session => (
          <div key={session.id}>
            <h4>{session.sessionName} ({session.status})</h4>
            <p>ID: {session.sessionId}</p>
            {session.status === 'disconnected' && (
              <QRCodeComponent sessionId={session.sessionId} bearerToken={bearerToken} />
            )}
          </div>
        ))}
      </div>

      {/* API Key Display */}
      <div>
        <h3>API Key</h3>
        <code>{apiKey}</code>
      </div>
    </div>
  );
};
```

### Message Sending Component

```javascript
const MessageSender = ({ sessionId, apiKey }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('text');
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState('');
  const [sending, setSending] = useState(false);

  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]); // Remove data:mime;base64, prefix
      reader.onerror = error => reject(error);
    });
  };

  const sendMessage = async () => {
    setSending(true);
    try {
      let payload = {
        phone: phoneNumber,
        contentType: messageType
      };

      if (messageType === 'text') {
        payload.content = message;
      } else if (messageType === 'image' || messageType === 'document') {
        const base64Content = await convertFileToBase64(file);
        payload.content = base64Content;
        payload.caption = caption;
        
        if (messageType === 'document') {
          payload.fileName = file.name;
        }
      }

      const response = await fetch(`/api/services/whatsapp/chat/${sessionId}/${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      if (result.success) {
        alert('Message sent successfully!');
        setMessage('');
        setCaption('');
        setFile(null);
      } else {
        alert('Failed to send message: ' + result.error);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <h3>Send Message</h3>
      
      <input
        type="text"
        placeholder="Phone Number (e.g., 628123456789)"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
      />

      <select value={messageType} onChange={(e) => setMessageType(e.target.value)}>
        <option value="text">Text</option>
        <option value="image">Image</option>
        <option value="document">Document</option>
      </select>

      {messageType === 'text' && (
        <textarea
          placeholder="Message content"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      )}

      {(messageType === 'image' || messageType === 'document') && (
        <>
          <input
            type="file"
            accept={messageType === 'image' ? 'image/*' : '*/*'}
            onChange={(e) => setFile(e.target.files[0])}
          />
          <input
            type="text"
            placeholder="Caption (optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        </>
      )}

      <button onClick={sendMessage} disabled={sending}>
        {sending ? 'Sending...' : 'Send Message'}
      </button>
    </div>
  );
};
```

## Error Handling

### Common Error Responses

```javascript
const handleApiResponse = async (response) => {
  const data = await response.json();
  
  if (!data.success) {
    switch (response.status) {
      case 401:
        throw new Error('Authentication failed. Please check your API key.');
      case 403:
        throw new Error('Access denied. ' + (data.error || 'Insufficient permissions.'));
      case 404:
        throw new Error('Resource not found. ' + (data.error || 'Check your session ID.'));
      case 400:
        throw new Error('Bad request. ' + (data.error || 'Check your input data.'));
      case 500:
        throw new Error('Server error. Please try again later.');
      default:
        throw new Error(data.error || 'An unknown error occurred.');
    }
  }
  
  return data;
};

// Usage example
const safeApiCall = async (apiFunction) => {
  try {
    const response = await apiFunction();
    return await handleApiResponse(response);
  } catch (error) {
    console.error('API Error:', error.message);
    // Handle error in UI (show notification, etc.)
    throw error;
  }
};
```

### Validation Helpers

```javascript
const validatePhoneNumber = (phone) => {
  // Indonesian phone number format: 628xxxxxxxxx
  const phoneRegex = /^62\d{9,13}$/;
  return phoneRegex.test(phone);
};

const validateSessionId = (sessionId) => {
  // Session ID format: customer-{userId}-{randomId}
  return sessionId && sessionId.includes('customer-') && sessionId.length >= 10;
};

const validateApiKey = (apiKey) => {
  // API key format: gf_xxxxxxxxxxxxxxxxxxxxxxxx
  return apiKey && apiKey.startsWith('gf_') && apiKey.length > 10;
};
```

## Best Practices

### 1. State Management
```javascript
// Use React Context for global WhatsApp state
const WhatsAppContext = createContext();

export const WhatsAppProvider = ({ children, bearerToken }) => {
  const [sessions, setSessions] = useState([]);
  const [apiKey, setApiKey] = useState('');
  const [subscription, setSubscription] = useState(null);

  // Initialize and provide context value
  return (
    <WhatsAppContext.Provider value={{
      sessions, setSessions,
      apiKey, setApiKey,
      subscription, setSubscription
    }}>
      {children}
    </WhatsAppContext.Provider>
  );
};
```

### 2. API Key Security
```javascript
// Store API key securely (not in localStorage for production)
const secureStorage = {
  setApiKey: (key) => {
    // Use secure storage method appropriate for your app
    sessionStorage.setItem('wa_api_key', key);
  },
  getApiKey: () => {
    return sessionStorage.getItem('wa_api_key');
  },
  clearApiKey: () => {
    sessionStorage.removeItem('wa_api_key');
  }
};
```

### 3. Polling for Session Status
```javascript
const useSessionStatus = (sessionId, bearerToken) => {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/customer/whatsapp/sessions/${sessionId}`, {
          headers: { 'Authorization': `Bearer ${bearerToken}` }
        });
        const data = await response.json();
        if (data.success) {
          setStatus(data.data.status);
        }
      } catch (error) {
        console.error('Failed to poll session status:', error);
      }
    };

    const interval = setInterval(pollStatus, 5000); // Poll every 5 seconds
    pollStatus(); // Initial call

    return () => clearInterval(interval);
  }, [sessionId, bearerToken]);

  return status;
};
```

### 4. File Upload Helpers
```javascript
const fileUploadHelpers = {
  validateFileSize: (file, maxSizeMB = 10) => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  },
  
  validateImageType: (file) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    return allowedTypes.includes(file.type);
  },
  
  validateDocumentType: (file) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'text/plain'];
    return allowedTypes.includes(file.type);
  },
  
  compressImage: async (file, quality = 0.8) => {
    // Implement image compression if needed
    return file;
  }
};
```

## API Base URLs and Configuration

```javascript
const API_CONFIG = {
  baseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8090',
  endpoints: {
    customer: {
      sessions: '/api/customer/whatsapp/sessions',
      apikey: '/api/customer/whatsapp/apikey',
      subscription: '/api/customer/whatsapp/subscription',
      transactions: '/api/customer/whatsapp/transactions'
    },
    public: {
      chat: '/api/services/whatsapp/chat'
    }
  }
};

// Helper function to build URLs
const buildUrl = (path, params = {}) => {
  const url = new URL(API_CONFIG.baseUrl + path);
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.append(key, value);
  });
  return url.toString();
};
```

This guide provides everything needed to implement WhatsApp functionality in your frontend application. Remember to handle errors gracefully, validate user inputs, and follow security best practices when storing API keys.
