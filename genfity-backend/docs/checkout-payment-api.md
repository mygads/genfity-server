# Checkout & Payment API Documentation

## Overview

This document describes the complete checkout and payment flow for the Genfity API system. The system uses a two-step process to ensure proper transaction handling and service fee calculation.

**Important Note about Payment Methods:**
Payment methods are dynamically configured through the Admin Service Fees panel. Only payment methods with active service fee configurations for the selected currency will be available to customers. This approach ensures that:
- Payment methods are centrally managed by admins
- Service fees are properly calculated and applied
- Currency-specific payment options are enforced
- New payment methods can be added without code changes

## Flow Architecture

```
1. Product Selection
   ↓
2. POST /api/customer/checkout
   - Creates transaction (status: 'pending')
   - Calculates subtotal, discounts, vouchers
   - Returns available payment methods based on active service fees
   - Returns service fee preview for each available method
   ↓
3. Payment Method Selection (from available methods only)
   ↓
4. POST /api/customer/payment/create
   - Validates payment method against active service fees
   - Creates payment record
   - Applies service fee for selected method
   - Returns payment gateway URL
   ↓
5. POST /api/customer/payments/process (Optional)
   - Validates payment method availability
   - Direct payment processing
   - Simulates gateway interaction
   ↓
6. Payment Gateway Processing
   - Customer completes payment
   - Webhook updates transaction status
   ↓
7. GET /api/customer/payments/status/[paymentId]
   - Check payment status
   - Monitor transaction completion
```

## API Endpoints

### 1. Unified Checkout
**Endpoint:** `POST /api/customer/checkout`

**Description:** Creates a transaction with pricing breakdown and service fee preview.

**Request Body:**
```json
{
  // Option 1: Simple items format
  "items": [
    {
      "productId": "clp123456789",
      "type": "package",
      "quantity": 1
    }
  ],
  
  // Option 2: Detailed format
  "packages": [
    {
      "id": "clp123456789",
      "quantity": 1
    }
  ],
  "addons": [
    {
      "id": "cla123456789",
      "quantity": 2
    }
  ],
  "whatsapp": [
    {
      "packageId": "clw123456789",
      "duration": "month"
    }
  ],
  
  // Common fields
  "currency": "idr",
  "referenceLink": "https://example.com/reference",
  "voucherCode": "DISCOUNT20",
  "notes": "Special requirements"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": "clt123456789",
    "status": "pending",
    "currency": "idr",
    "notes": "Special requirements",
    
    "items": [
      {
        "id": "clp123456789",
        "type": "package",
        "name": "Basic Package",
        "description": "Basic feature package",
        "price": 100000,
        "quantity": 1,
        "total": 100000,
        "currency": "idr",
        "category": {
          "id": "clc123456789",
          "name": "Digital Services"
        },
        "features": [
          {
            "name": "Feature 1",
            "included": true
          }
        ]
      }
    ],
    "totalItems": 1,
    
    "subtotal": 100000,
    "voucher": {
      "code": "DISCOUNT20",
      "name": "20% Discount",
      "type": "percentage",
      "discountAmount": 20000
    },
    "totalDiscount": 20000,
    "totalAfterDiscount": 80000,
    
    "serviceFeePreview": [
      {
        "paymentMethod": "midtrans",
        "name": "Midtrans Credit Card Fee",
        "type": "percentage",
        "value": 2.9,
        "feeAmount": 2320,
        "totalWithFee": 82320
      },
      {
        "paymentMethod": "xendit",
        "name": "Xendit E-Wallet Fee",
        "type": "fixed_amount",
        "value": 5000,
        "feeAmount": 5000,
        "totalWithFee": 85000
      }
    ],
    
    "nextStep": "Select payment method and call /api/customer/payment/create"
  },
  "message": "Checkout successful. Please proceed with payment selection."
}
```

### 2. Get Available Payment Methods
**Endpoint:** `GET /api/customer/payment/method`

**Description:** Get available payment methods for a specific currency. Payment methods are determined by active service fees configured by admins.

**Query Parameters:**
- `currency` (optional): Currency code ('idr' or 'usd'). Defaults to 'idr'.

**Example Request:**
```
GET /api/customer/payment/method?currency=idr
```

**Response:**
```json
{
  "success": true,
  "data": {
    "currency": "idr",
    "availablePaymentMethods": [
      {
        "paymentMethod": "midtrans",
        "name": "Midtrans Credit Card Fee",
        "currency": "idr",
        "type": "percentage",
        "value": 2.9,
        "minFee": null,
        "maxFee": null,
        "description": "2.9% fee",
        "isActive": true
      },
      {
        "paymentMethod": "xendit",
        "name": "Xendit E-Wallet Fee",
        "currency": "idr",
        "type": "fixed_amount",
        "value": 5000,
        "minFee": null,
        "maxFee": null,
        "description": "Fixed fee Rp 5,000",
        "isActive": true
      }
    ],
    "totalMethods": 2,
    "note": "These payment methods are configured through the admin service fees panel. Only active service fees for the selected currency are shown."
  }
}
```

### 3. Payment Creation
**Endpoint:** `POST /api/customer/payment/create`

**Description:** Creates payment record with selected method and applies service fee. The payment method must be available for the transaction's currency.

**Request Body:**
```json
{
  "transactionId": "clt123456789",
  "paymentMethod": "midtrans"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "clp123456789",
    "transactionId": "clt123456789",
    "method": "midtrans",
    "status": "pending",
    
    "amount": 80000,
    "serviceFee": 2320,
    "finalAmount": 82320,
    "currency": "idr",
    
    "paymentUrl": "https://app.sandbox.midtrans.com/snap/v1/transactions/clt123456789",
    "externalId": "xendit_1234567890",
    
    "items": [
      {
        "type": "package",
        "name": "Basic Package",
        "category": "Digital Services"
      }
    ],
    
    "voucher": {
      "code": "DISCOUNT20",
      "name": "20% Discount",
      "discountAmount": 20000
    },
    
    "transactionDate": "2025-06-02T10:30:00Z",
    "notes": "Special requirements"
  },
  "message": "Payment created successfully. Please complete payment using the provided URL."
}
```

### 4. Payment Processing
**Endpoint:** `POST /api/customer/payments/process`

**Description:** Direct payment processing endpoint (optional - can use gateway URLs instead). The payment method must be available for the transaction's currency.

**Request Body:**
```json
{
  "transactionId": "clt123456789",
  "paymentMethod": "midtrans",
  "amount": 82320
}
```

**Note:** The `paymentMethod` must match one of the available payment methods from the service fees configuration for the transaction's currency.

**Response:**
```json
{
  "success": true,
  "data": {
    "transaction_id": "clt123456789",
    "payment_id": "clp123456789",
    "method": "midtrans",
    "amount": 82320,
    "status": "pending",
    "transaction_type": "product",
    "item_name": "Basic Package",
    
    "payment_url": "https://app.sandbox.midtrans.com/snap/v1/transactions/clt123456789",
    "token": "mt_1735123456789",
    "redirect_url": "https://app.sandbox.midtrans.com/snap/v4/redirection/clt123456789",
    "instructions": "Complete payment via Midtrans payment page"
  },
  "message": "Payment processing initiated"
}
```

**Error Response (Invalid Payment Method):**
```json
{
  "success": false,
  "error": "Payment method 'invalid_method' is not available for currency 'idr'"
}
```

### 4. Payment Status Check
**Endpoint:** `GET /api/customer/payments/status/[paymentId]`

**Description:** Check current payment status and gateway information.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clp123456789",
    "method": "midtrans",
    "amount": 82320,
    "serviceFee": 2320,
    "status": "pending",
    "externalId": "xendit_1234567890",
    "paymentUrl": "https://app.sandbox.midtrans.com/snap/v1/transactions/clt123456789",
    "createdAt": "2025-06-02T10:30:00Z",
    "updatedAt": "2025-06-02T10:30:00Z",
    
    "transaction": {
      "id": "clt123456789",
      "status": "pending",
      "type": "product",
      "amount": 80000,
      "totalAfterDiscount": 80000,
      "currency": "idr"
    },
    
    "gateway_info": {
      "gateway_status": "pending",
      "fraud_status": "accept",
      "transaction_time": "2025-06-02T10:30:00Z"
    }
  }
}
```

## Service Fee Management

### Overview
Service fees serve a dual purpose in the system:
1. **Payment Gateway Configuration**: Service fees define which payment methods are available to customers
2. **Fee Calculation**: They determine the exact fee structure for each payment method

**Key Principles:**
- Only payment methods with active service fees are available to customers
- Service fees are currency-specific (IDR/USD)
- Each payment method can have different fee structures per currency
- Admins control payment method availability by managing service fee configurations

### Admin Service Fee APIs

#### Get All Service Fees
**Endpoint:** `GET /api/admin/service-fees`

**Description:** Manage payment methods and their fee structures. Creating a service fee makes that payment method available to customers.

#### Create Service Fee
**Endpoint:** `POST /api/admin/service-fees`

**Request Body:**
```json
{
  "name": "Midtrans Credit Card Fee",
  "paymentMethod": "midtrans",
  "currency": "idr",
  "type": "percentage",
  "value": 2.9,
  "minFee": 1000,
  "maxFee": 50000,
  "isActive": true
}
```

**Note:** Creating this service fee will make "midtrans" payment method available for IDR transactions.

#### Update Service Fee
**Endpoint:** `PATCH /api/admin/service-fees/[id]`

**Description:** Update fee structure or activate/deactivate payment methods.

#### Delete Service Fee
**Endpoint:** `DELETE /api/admin/service-fees/[id]`

**Description:** Remove payment method availability by deleting its service fee configuration.

### Customer Service Fee APIs

#### Get Available Payment Methods
**Endpoint:** `GET /api/customer/payment/method?currency=idr`

**Description:** Get payment methods available for a specific currency (based on active service fees).

#### Get Active Service Fees (Legacy)
**Endpoint:** `GET /api/customer/service-fees`

#### Preview Service Fee Calculation
**Endpoint:** `POST /api/customer/service-fees/preview`

**Request Body:**
```json
{
  "amount": 100000,
  "paymentMethod": "midtrans"
}
```

## Voucher System

### Check Voucher Validity
**Endpoint:** `POST /api/customer/check-voucher`

**Request Body:**
```json
{
  "code": "DISCOUNT20",
  "orderAmount": 100000,
  "items": [
    {
      "type": "product",
      "id": "clp123456789",
      "amount": 100000
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "isValid": true,
  "data": {
    "voucher": {
      "id": "clv123456789",
      "code": "DISCOUNT20",
      "name": "20% Discount",
      "description": "Special discount for new customers",
      "type": "percentage",
      "discountType": "total",
      "value": 20,
      "minAmount": 50000,
      "maxDiscount": 100000
    },
    "calculation": {
      "originalAmount": 100000,
      "applicableAmount": 100000,
      "discountAmount": 20000,
      "finalAmount": 80000,
      "savings": 20000
    }
  }
}
```

## Error Handling

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Error message description",
  "details": [
    {
      "field": "fieldName",
      "message": "Specific validation error"
    }
  ]
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

## Authentication

All customer endpoints require JWT authentication via Authorization header:

```
Authorization: Bearer <jwt_token>
```

Admin endpoints require admin-level authentication.

## Testing

### Test Payment Method

Use `method: "test"` for automatic payment completion (3-second delay):

```json
{
  "transactionId": "clt123456789",
  "method": "test",
  "amount": 82320
}
```

This will automatically mark the payment as completed after 3 seconds for testing purposes.

## Database Schema

### Key Models

- **Transaction** - Main transaction record
- **Payment** - Payment processing record
- **ServiceFee** - Service fee configuration
- **Voucher** - Discount voucher system
- **VoucherUsage** - Voucher usage tracking
- **TransactionProduct** - Product transaction details
- **TransactionWhatsappService** - WhatsApp service transaction details

## Integration Examples

### Frontend Integration Example

```javascript
// 1. Get available payment methods for currency
const paymentMethodsResponse = await fetch('/api/customer/payment/method?currency=idr', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const availableMethods = await paymentMethodsResponse.json();

// 2. Create checkout
const checkoutResponse = await fetch('/api/customer/checkout', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    packages: [{ id: 'clp123456789', quantity: 1 }],
    currency: 'idr',
    voucherCode: 'DISCOUNT20'
  })
});

const checkout = await checkoutResponse.json();
const transactionId = checkout.data.transactionId;

// 3. Display available payment methods to user (from checkout response)
const availablePaymentMethods = checkout.data.availablePaymentMethods;
const serviceFeePreview = checkout.data.serviceFeePreview;

// Show user the options with fees
availablePaymentMethods.forEach(method => {
  const feeInfo = serviceFeePreview.find(fee => fee.paymentMethod === method.paymentMethod);
  console.log(`${method.name}: Total with fee = ${feeInfo.totalWithFee}`);
});

// 4. User selects payment method (must be from available methods)
const selectedMethod = 'midtrans'; // Must be in availablePaymentMethods

// 5. Create payment
const paymentResponse = await fetch('/api/customer/payment/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    transactionId,
    paymentMethod: selectedMethod
  })
});

const payment = await paymentResponse.json();

// 6. Redirect user to payment URL
window.location.href = payment.data.paymentUrl;
```
