export interface CheckoutForm {
    name: string
    whatsapp: string
    email: string
    notes: string
    voucher: string
  }
  
  export interface StepProps {
    title: string
    isActive: boolean
    isCompleted: boolean
    number: number
  }
  // Voucher Check Types
  export interface VoucherCheckItem {
    type: "product" | "whatsapp" | "addons"
    id: string
    duration?: "month" | "year" // Required for WhatsApp items to specify billing duration
  }

  export interface VoucherCheckRequest {
    code: string
    currency: "idr" | "usd"
    items: VoucherCheckItem[]
  }

  export interface VoucherData {
    id: string
    code: string
    name: string
    description: string
    type: string
    discountType: "percentage" | "fixed"
    value: string
    minAmount: string
    maxDiscount: string
  }

  export interface VoucherCalculation {
    originalAmount: number
    applicableAmount: number
    discountAmount: number
    finalAmount: number
    savings: number
    currency: string
    items: Array<{
      id: string
      type: string
      name: string
      price: number
      quantity: number
      total: number
    }>
  }

  export interface VoucherCheckResponse {
    success: boolean
    isValid: boolean
    data?: {
      voucher: VoucherData
      calculation: VoucherCalculation
    }
    message?: string
  }

  // Checkout Types
  export interface CheckoutPackage {
    id: string
    quantity: number
  }

  export interface CheckoutAddon {
    id: string
    quantity: number
  }

  export interface CheckoutWhatsApp {
    packageId: string
    duration: "month" | "year"
  }

  export interface CheckoutRequest {
    packages?: CheckoutPackage[]
    addons?: CheckoutAddon[]
    whatsapp?: CheckoutWhatsApp[]
    currency: "idr" | "usd"
    voucherCode?: string
    notes?: string
  }

  export interface CheckoutItem {
    id: string
    type: "package" | "addon" | "whatsapp"
    name: string
    description?: string
    price: number
    quantity: number
    total: number
    currency: string
    category?: {
      id: string
      name: string
    }
    subcategory?: {
      id: string
      name: string
    }
    features?: Array<{
      name: string
      included: boolean
    }>
  }

  export interface ServiceFee {
    paymentMethod: string
    name: string
    type: "fixed" | "fixed_amount" | "percentage"
    value: number
    feeAmount: number
    totalWithFee: number
  }

  export interface PaymentMethod {
    paymentMethod: string
    name: string
    description: string
    currency: string
  }

  export interface CheckoutResponse {
    success: boolean
    data: {
      transactionId: string
      status: "pending" | "completed" | "failed"
      currency: string
      notes?: string
      items: CheckoutItem[]
      totalItems: number
      subtotal: number
      voucher?: {
        code: string
        name: string
        type: string
        discountAmount: number
      }
      totalDiscount: number
      totalAfterDiscount: number
      serviceFeePreview: ServiceFee[]
      availablePaymentMethods: PaymentMethod[]
      nextStep: string
    }
    message: string
  }

  // Payment Creation Types
  export interface PaymentCreateRequest {
    transactionId: string
    paymentMethod: string
  }  export interface PaymentDetails {
    paymentUrl?: string
    instructions?: string
    bankDetails?: {
      bankName: string
      accountNumber: string
      accountName: string
      swiftCode?: string
      currency: string
    }
    paymentCode?: string
    note?: string
    uniqueCode?: number
    finalAmountWithCode?: number
  }
  export interface PaymentCreateResponse {
    success: boolean
    data: {      payment: {
        id: string
        transactionId: string
        amount: number
        method: string
        status: "pending" | "paid" | "failed" | "expired"
        paymentUrl?: string
        externalId?: string
        createdAt: string
        instructions?: string
        paymentDetails: PaymentDetails
        uniqueCode?: number
        paymentInstructions?: string
        instructionType?: string
        instructionImageUrl?: string
      }
      transaction: {
        id: string
        currency: string
        status: string
        type: string
        notes?: string
      }
      pricing: {
        subtotal: number
        discountAmount: number
        totalAfterDiscount: number
        serviceFee: {
          paymentMethod: string
          method: string
          type: string
          value: number
          amount: number
          currency: string
          description: string
        }
        finalAmount: number
        currency: string
      }
      items: Array<{
        type: string
        name: string
        category: string
        subcategory: string
      }>
      voucher?: {
        code: string
        name: string
        discountAmount: number
      }
    }
    message: string
  }

  // Cancel Payment Types
  export interface CancelPaymentRequest {
    reason?: string
  }

  export interface CancelPaymentResponse {
    success: boolean
    message: string
    data?: {
      paymentId: string
      status: string
      cancelledAt: string
    }
  }

  // Legacy types for backward compatibility
  export interface CheckoutProduct {
    id: string
    type: "package" | "addon"
    quantity: number
  }

  export interface PaymentProcessRequest {
    transactionId: string
    method: string
  }  export interface PaymentStatus {
    success: boolean
    data: {      
      payment: {
        id: string
        transactionId: string
        amount: number
        method: string
        status: "pending" | "paid" | "failed" | "expired" | "cancelled" | "rejected" | string
        paymentUrl: string | null
        externalId: string | null
        createdAt: string
        instructions: string
        paymentDetails: PaymentDetails
        uniqueCode: number
        paymentInstructions: string
        instructionType: string
        instructionImageUrl: string
      }
      transaction: {
        id: string
        currency: string
        status: string
        type: string
        notes?: string
      }
      pricing: {
        subtotal: number
        discountAmount: number
        totalAfterDiscount: number
        serviceFee: {
          paymentMethod: string
          method: string
          type: string
          value: number
          amount: number
          currency: string
          description: string
        }
        finalAmount: number
        currency: string
      }
      items: Array<{
        type: string
        name: string
        category: string
        subcategory: string
        price: number
        originalPriceIdr: number
        originalPriceUsd: number
        duration?: string
        priceMonth?: number
        priceYear?: number
      }>
      voucher?: {
        code: string
        name: string
        discountAmount: number
      }
      instructions: string
      additionalInfo: {
        bankDetails: {
          bankName: string
          accountNumber: string
          accountName: string
          swiftCode: string
          currency: string
        }
        note: string
        steps: string[]
      }
      bankDetails: {
        bankName: string
        accountNumber: string
        accountName: string
        swiftCode: string
        currency: string
      }
      serviceFeeInfo: {
        instructions: string
        instructionType: string
        instructionImageUrl: string
        feeType: string
        feeValue: string
        minFee: string | null
        maxFee: string | null      }
      uniqueCode: number
      statusInfo: {
        isPending: boolean
        isCompleted: boolean
        isFailed: boolean
        isCancelled: boolean
        canCancel: boolean
        nextAction: string
      }
      subscriptionInfo: {
        activated: boolean
        activationResult: Record<string, unknown> | null
        message: string
      }
    }
    message: string
  }

// Customer Products and Payments List Types
export interface ProductItem {
  id: string
  name_en: string
  name_id: string
  description_en: string
  description_id: string
  price_idr: number
  price_usd: number
  image: string
  popular: boolean
  features: Array<{
    id: string
    name_en: string
    name_id: string
    included: boolean
  }>
  category: {
    id: string
    name_en: string
    name_id: string
  }
  subcategory: {
    id: string
    name_en: string
    name_id: string
  }
}

export interface AddonItem {
  id: string
  name_en: string
  name_id: string
  description_en: string
  description_id: string
  price_idr: number
  price_usd: number
  image: string
  popular?: boolean
  category: {
    id: string
    name_en: string
    name_id: string
  }
}

export interface WhatsAppProductItem {
  id: string
  name: string
  description: string | null
  priceMonth: number
  priceYear: number
  maxSession: number
  yearlyDiscount: number
  recommended: boolean
  features: string[]
}

export interface CustomerProductsResponse {
  success: boolean
  data: {
    packages: ProductItem[]
    addons: AddonItem[]
    whatsapp: WhatsAppProductItem[]
  }
  message: string
}

export interface PaymentListItem {
  id: string
  transactionId: string
  amount: number
  serviceFee: number
  method: string
  status: "pending" | "paid" | "failed" | "expired" | "cancelled"
  paymentUrl: string | null
  externalId: string | null
  paymentDate: string | null
  createdAt: string
  updatedAt: string
  transaction: {
    id: string
    type: string
    currency: string
    status: string
    transactionStatus: string
    originalAmount: number
    discountAmount: number
    totalAfterDiscount: number
    finalAmount: number
    items: Array<{
      type: string
      name: string
      id: string
    }>
  }
  voucher: {
    code: string
    name: string
  } | null
}

export interface CustomerPaymentsResponse {
  success: boolean
  data: {
    payments: PaymentListItem[]
    pagination: {
      page: number
      limit: number
      totalCount: number
      totalPages: number
      hasNextPage: boolean
      hasPreviousPage: boolean
    }
  }
  message: string
}

// Transaction Types
export interface TransactionItem {
  id: string
  userId: string
  transactionDate: string
  status: "created" | "pending" | "in-progress" | "success" | "cancelled" | "expired" | "failed"
  amount: string
  createdAt: string
  type: string
  updatedAt: string
  discountAmount: string
  originalAmount: string
  voucherId: string | null
  notes: string | null
  currency: string
  finalAmount: string | null
  serviceFeeAmount: string | null
  totalAfterDiscount: string
  expiresAt: string | null
  // Support both old and new structure
  productTransaction?: {
    id: string
    transactionId: string
    packageId: string | null
    addonId: string | null
    startDate: string | null
    endDate: string | null
    referenceLink: string | null
    package: {
      id: string
      name_en: string
      name_id: string
      price_idr: string
      price_usd: string
      image: string
    } | null
    addon: {
      id: string
      name_en: string
      name_id: string
      price_idr: string
      price_usd: string
      image: string
    } | null
  } | null
  // New structure for multiple products/addons
  productTransactions?: Array<{
    id: string
    transactionId: string
    packageId: string
    quantity: number
    status: string
    startDate: string | null
    endDate: string | null
    referenceLink: string | null
    package: {
      id: string
      name_en: string
      name_id: string
      description_en: string
      description_id: string
      price_idr: string
      price_usd: string
      image: string
      features: any[]
    }
  }>
  addonTransactions?: Array<{
    id: string
    transactionId: string
    addonId: string
    quantity: number
    status: string
    startDate: string | null
    endDate: string | null
    addon: {
      id: string
      name_en: string
      name_id: string
      description_en: string
      description_id: string
      price_idr: string
      price_usd: string
      image: string
    }
  }>
  whatsappTransaction: {
    id: string
    transactionId: string
    whatsappPackageId: string
    duration: "month" | "year"
    status: string
    startDate: string | null
    endDate: string | null
    whatsappPackage: {
      id: string
      name: string
      description: string
      priceMonth: number
      priceYear: number
    }
  } | null
  payment: {
    id: string
    transactionId: string
    amount: number | string
    method: string
    status: "pending" | "paid" | "failed" | "expired" | "cancelled"
    paymentUrl: string | null
    externalId: string | null
    createdAt: string
    paymentDate: string | null
  } | null
}

export interface TransactionListResponse {
  success: boolean
  data: TransactionItem[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface TransactionDetailResponse {
  success: boolean
  data: TransactionItem
  message: string
}

export interface CancelTransactionRequest {
  reason?: string
}

export interface CancelTransactionResponse {
  success: boolean
  message: string
  data?: {
    transactionId: string
    status: string
    cancelledAt: string
  }
}

// Payment Status Types
export interface PaymentStatusResponse {
  success: boolean
  data: PaymentStatusData
  error?: {
    message: string
  }
}

export interface PaymentStatusData {
  id: string
  transactionId: string
  amount: string
  method: string
  status: "pending" | "paid" | "cancelled" | "expired" | "failed"
  createdAt: string
  updatedAt: string
  paymentDate?: string
  externalId?: string
  paymentUrl?: string
  instructionsText?: string
  qrCode?: string
  virtualAccount?: string
  accountNumber?: string
  bankName?: string
  accountName?: string
  expiresAt?: string
  instructionSteps?: string[]
  bankDetails?: {
    bankName: string
    accountNumber: string
    accountName: string
  }
  notes?: string[]
}
