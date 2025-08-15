# E-commerce Checkout Flow Implementation

## Overview
This document describes the complete implementation of a multi-step checkout process for an e-commerce application with authentication, voucher validation, payment processing, and order completion.

## Architecture

### Flow Steps
1. **Information Step** - User fills personal information
2. **Verification Step** - OTP verification for guest users (skipped for authenticated users)
3. **Payment Step** - Checkout processing and payment method selection
4. **Success Page** - Payment confirmation and status tracking

### API Integration
- `POST /customer/check-voucher` - Validate voucher codes
- `POST /customer/checkout` - Process checkout and get payment options
- `POST /customer/payment/create` - Create payment transaction
- `GET /customer/payments/status/{id}` - Check payment status

## Implementation Details

### 1. Types and Interfaces (`/src/types/checkout.ts`)

#### Voucher System
```typescript
interface VoucherCheckItem {
  type: "product" | "whatsapp" | "addons"
  id: string
}

interface VoucherCheckRequest {
  code: string
  currency: "idr" | "usd"
  items: VoucherCheckItem[]
}
```

#### Checkout System
```typescript
interface CheckoutRequest {
  packages?: CheckoutPackage[]
  addons?: CheckoutAddon[]
  whatsapp?: CheckoutWhatsApp[]
  currency: "idr" | "usd"
  voucherCode?: string
  notes?: string
}

interface CheckoutResponse {
  success: boolean
  data: {
    transactionId: string
    availablePaymentMethods: PaymentMethod[]
    serviceFeePreview: ServiceFee[]
    // ... other fields
  }
}
```

#### Payment System
```typescript
interface PaymentCreateRequest {
  transactionId: string
  paymentMethod: string
}

interface PaymentCreateResponse {
  success: boolean
  data: {
    payment: {
      id: string
      paymentUrl?: string
      paymentDetails: PaymentDetails
    }
    transaction: {
      id: string
    }
    // ... other fields
  }
}
```

### 2. API Service (`/src/services/checkout-api.ts`)

```typescript
// Voucher validation
export const checkVoucher = async (voucherData: VoucherCheckRequest): Promise<VoucherCheckResponse>

// Checkout processing
export const processCheckout = async (checkoutData: CheckoutRequest): Promise<CheckoutResponse>

// Payment creation
export const createPayment = async (paymentData: PaymentCreateRequest): Promise<PaymentCreateResponse>

// Payment status checking
export const checkPaymentStatus = async (paymentId: string): Promise<PaymentStatus>
```

### 3. Main Checkout Page (`/src/app/[locale]/checkout/page.tsx`)

#### Key Features:
- **Multi-step navigation** with progress indicator
- **Authentication handling** - different flows for logged-in vs guest users
- **Voucher validation** with real-time API checking
- **Cart integration** with item grouping (regular packages, add-ons, WhatsApp packages)
- **Responsive design** with mobile optimization

#### Voucher Handling:
```typescript
const handleApplyVoucher = async () => {
  // Prepare items for voucher check according to new API structure
  const voucherItems: VoucherCheckItem[] = []
  
  // Add regular packages as "product" type
  regularItems.forEach(item => {
    voucherItems.push({
      type: "product",
      id: item.id
    })
  })
  
  // Add addons as "addons" type
  addOns.forEach(item => {
    voucherItems.push({
      type: "addons", 
      id: item.id
    })
  })
  
  // Add whatsapp items as "whatsapp" type
  whatsappItems.forEach(item => {
    voucherItems.push({
      type: "whatsapp",
      id: item.id
    })
  })

  const voucherRequest: VoucherCheckRequest = {
    code: formData.voucher,
    currency: "idr",
    items: voucherItems
  }

  const voucherResponse = await checkVoucher(voucherRequest)
  // Handle response...
}
```

### 4. Payment Step Component (`/src/components/Checkout/PaymentStep.tsx`)

#### Two-Phase Payment Process:

**Phase 1: Checkout**
```typescript
const handleCheckout = async () => {
  const checkoutData: CheckoutRequest = {
    currency: "idr",
    notes: formData.notes || undefined,
    ...(packages.length > 0 && { packages }),
    ...(addons.length > 0 && { addons }),
    ...(whatsapp.length > 0 && { whatsapp }),
    ...(voucherApplied && formData.voucher && { voucherCode: formData.voucher })
  }

  const response = await processCheckout(checkoutData)
  setCheckoutResponse(response)
}
```

**Phase 2: Payment Creation**
```typescript
const handlePayment = async (paymentMethod: string) => {
  const paymentData: PaymentCreateRequest = {
    transactionId: checkoutResponse.data.transactionId,
    paymentMethod: paymentMethod
  }

  const response = await createPayment(paymentData)
  
  // Handle different payment types
  if (response.data.payment.paymentUrl) {
    // Payment gateway - open in new tab
    window.open(response.data.payment.paymentUrl, '_blank')
    router.push(`/checkout/success?paymentId=${response.data.payment.id}&transactionId=${response.data.transaction.id}`)
  } else {
    // Manual transfer - show instructions
    setPaymentResponse(response)
    setTimeout(() => {
      router.push(`/checkout/success?paymentId=${response.data.payment.id}&transactionId=${response.data.transaction.id}`)
    }, 3000)
  }
}
```

#### Features:
- **Service fee preview** for each payment method
- **Payment method selection** with radio buttons
- **Real-time total calculation** including fees
- **Payment instructions display** for manual transfers
- **Bank details display** with copy functionality
- **Automatic redirect** to success page

### 5. Success Page (`/src/app/[locale]/checkout/success/page.tsx`)

#### Features:
- **Payment status tracking** with automatic refresh
- **Dynamic UI** based on payment status (paid/pending/failed)
- **Payment details display** with formatted information
- **Next steps guidance** for users
- **Print receipt functionality**
- **Navigation options** to dashboard or retry payment

#### Status Handling:
```typescript
const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null)

useEffect(() => {
  const fetchPaymentStatus = async () => {
    const status = await checkPaymentStatus(paymentId)
    setPaymentStatus(status)
  }
  fetchPaymentStatus()
}, [paymentId])
```

## User Experience Flow

### For Authenticated Users:
1. **Step 1**: Information form → **Step 3**: Payment
2. Skip verification step entirely
3. Direct access to payment options

### For Guest Users:
1. **Step 1**: Information form → **Step 2**: OTP Verification → **Step 3**: Payment
2. OTP sent via WhatsApp
3. Account creation upon successful verification

### Payment Process:
1. **Checkout**: Get available payment methods and service fees
2. **Method Selection**: Choose payment method with fee preview
3. **Payment Creation**: Create payment transaction
4. **Completion**: 
   - Gateway payments: Redirect to external processor
   - Manual transfers: Show bank details and instructions
5. **Success Page**: Track payment status and show next steps

## Error Handling

### Voucher Validation:
- Invalid voucher codes
- Expired vouchers
- Network errors
- API response validation

### Payment Processing:
- Transaction creation failures
- Payment gateway errors
- Network timeouts
- Invalid payment methods

### Status Tracking:
- Payment status polling
- Connection failures
- Status update handling

## Security Considerations

### Authentication:
- JWT token validation
- Session management
- Secure cookie handling

### API Communication:
- HTTPS enforcement
- Request signing
- Error message sanitization
- Rate limiting (handled by backend)

### Data Validation:
- Input sanitization
- Type checking with TypeScript
- API response validation

## Performance Optimizations

### Code Splitting:
- Component-based lazy loading
- Route-based code splitting

### API Efficiency:
- Request debouncing for voucher validation
- Optimistic UI updates
- Error boundary implementation

### User Experience:
- Loading states for all async operations
- Progress indicators
- Auto-focus management
- Responsive design

## Testing Strategy

### Unit Tests:
- Component rendering
- API service functions
- Utility functions
- Type validation

### Integration Tests:
- Complete checkout flow
- Payment processing
- Error scenarios
- Cross-browser compatibility

### E2E Tests:
- Full user journeys
- Payment gateway integration
- Mobile responsiveness
- Performance benchmarks

## Deployment Considerations

### Environment Variables:
- API endpoints
- Payment gateway configurations
- Feature flags

### Monitoring:
- Error tracking (Sentry)
- Performance monitoring
- User analytics
- Payment success rates

### Rollback Strategy:
- Feature flags for new payment methods
- Database migration compatibility
- API versioning support

## Future Enhancements

### Planned Features:
- Multiple currency support
- Subscription management
- Recurring payments
- Payment method saving
- Order history integration
- Real-time payment notifications

### Technical Improvements:
- GraphQL API migration
- WebSocket for real-time updates
- Progressive Web App (PWA) features
- Offline payment queue
- Advanced caching strategies

---

## Summary

This implementation provides a robust, scalable checkout system with:
- ✅ Complete multi-step checkout flow
- ✅ Authentication integration (logged-in and guest users)
- ✅ Real-time voucher validation
- ✅ Multiple payment method support
- ✅ Service fee calculation and preview
- ✅ Payment status tracking
- ✅ Responsive design
- ✅ Comprehensive error handling
- ✅ Type-safe API integration
- ✅ Order completion tracking

The system is production-ready and follows modern web development best practices with TypeScript, Next.js, and a component-based architecture.
