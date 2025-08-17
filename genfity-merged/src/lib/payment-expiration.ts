import { prisma } from './prisma';

export class PaymentExpirationService {
  
  // Static map to track activation locks per transaction
  private static activationLocks: Map<string, boolean> = new Map();

  /**
   * Check if transaction activation is currently locked
   */
  private static isActivationLocked(transactionId: string): boolean {
    return this.activationLocks.get(transactionId) === true;
  }

  /**
   * Lock transaction activation to prevent concurrent processing
   */
  private static lockActivation(transactionId: string): void {
    this.activationLocks.set(transactionId, true);
  }

  /**
   * Unlock transaction activation
   */
  private static unlockActivation(transactionId: string): void {
    this.activationLocks.delete(transactionId);
  }

  /**
   * Create a payment with automatic expiration (1 day from now)
   */
  static async createPaymentWithExpiration(paymentData: {
    transactionId: string;
    amount: number;
    method: string;
    serviceFee?: number;
    externalId?: string;
    paymentUrl?: string;
  }) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1); // 1 day from now

    return await prisma.payment.create({
      data: {
        ...paymentData,
        status: 'pending',
        expiresAt,
        amount: paymentData.amount,
        serviceFee: paymentData.serviceFee || 0
      }
    });
  }
  /**
   * Create a transaction with automatic expiration (1 week from now)
   */
  static async createTransactionWithExpiration(transactionData: {
    userId: string;
    amount: number;
    type: string;
    currency?: string;
    voucherId?: string;
    notes?: string;
    discountAmount?: number;
    originalAmount?: number;
    finalAmount?: number;
    serviceFeeAmount?: number;
    totalAfterDiscount?: number;
  }) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 1 week from now

    return await prisma.transaction.create({
      data: {
        ...transactionData,
        status: 'created', // Transaction created, ready for payment selection
        currency: transactionData.currency || 'idr',
        expiresAt
      }
    });
  }
  /**
   * Check if a transaction is expired and can still create payments
   */
  static async canCreatePaymentForTransaction(transactionId: string): Promise<boolean> {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId }
    });

    if (!transaction) {
      return false;
    }

    // Check if transaction is expired
    if (transaction.expiresAt && new Date() > transaction.expiresAt) {
      return false;
    }    // Check if transaction status allows payment creation
    // Can create payment for 'created' and 'pending' status transactions
    if (!['created', 'pending'].includes(transaction.status)) {
      return false;
    }

    return true;
  }
  /**
   * Update payment status and sync with transaction
   */
  static async updatePaymentStatus(
    paymentId: string, 
    status: 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled',
    adminNotes?: string,
    adminUserId?: string
  ) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { transaction: true }
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Clear expiration dates based on new rules
    let paymentExpiresAt = payment.expiresAt;
    let transactionExpiresAt = payment.transaction?.expiresAt;

    // Expired date should only apply for 'created' or 'pending' status
    if (status !== 'pending') {
      paymentExpiresAt = null; // Clear payment expiration
    }

    // Update payment
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status,
        paymentDate: status === 'paid' ? new Date() : payment.paymentDate,
        adminNotes,
        adminUserId,
        actionDate: new Date(),
        updatedAt: new Date(),
        expiresAt: paymentExpiresAt
      }
    });    // Sync transaction status based on new consolidated status model
    if (payment.transaction) {
      let newTransactionStatus = payment.transaction.status;
      
      if (status === 'paid') {
        // Payment successful -> move to in_progress (waiting for delivery/activation)
        newTransactionStatus = 'in_progress';
        transactionExpiresAt = null; // Clear transaction expiration when paid
      } else if (status === 'failed' || status === 'expired') {
        // Payment failed/expired -> mark transaction as expired
        newTransactionStatus = 'expired';
        transactionExpiresAt = null; // Clear transaction expiration
      }
      // For 'pending' and 'cancelled', transaction status should move to 'pending' (waiting for new payment)
      else if (status === 'cancelled' && payment.transaction.status === 'created') {
        // If payment cancelled but transaction was created, move back to created (can create new payment)
        newTransactionStatus = 'created';
      }

      // Only update transaction status if it actually needs to change
      if (newTransactionStatus !== payment.transaction.status || 
          transactionExpiresAt !== payment.transaction.expiresAt) {
        const updatedTransaction = await prisma.transaction.update({
          where: { id: payment.transaction.id },
          data: {
            status: newTransactionStatus,
            updatedAt: new Date(),
            expiresAt: transactionExpiresAt
          },          include: {
            whatsappTransaction: {
              include: { whatsappPackage: true }
            },
            productTransactions: {
              include: { package: true }
            },
            addonTransactions: {
              include: { addon: true }
            }
          }
        });

        // Auto-activate services when payment is paid and transaction moves to in_progress
        if (status === 'paid' && newTransactionStatus === 'in_progress') {
          // Update child transaction statuses to in_progress when payment is paid
          await this.updateChildTransactionStatuses(payment.transaction.id, 'in_progress');
          
          // NOTE: Activation will be handled by admin API using activateServicesAfterPaymentUpdate
          // This prevents double activation from both updatePaymentStatus and admin approval
          console.log(`[ACTIVATION_QUEUED] Services activation queued for transaction ${payment.transaction.id}`);
        }
      }
    }

    return updatedPayment;
  }

  /**
   * Cancel transaction by user
   */
  static async cancelTransactionByUser(transactionId: string, userId: string) {
    const transaction = await prisma.transaction.findFirst({
      where: { 
        id: transactionId,
        userId: userId
      },
      include: { payment: true }
    });

    if (!transaction) {
      throw new Error('Transaction not found or unauthorized');
    }

    // Update transaction status
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'cancelled',
        updatedAt: new Date()
      }
    });

    // Update payment status if exists
    if (transaction.payment) {
      await prisma.payment.update({
        where: { id: transaction.payment.id },
        data: {
          status: 'cancelled',
          updatedAt: new Date()
        }
      });
    }

    return transaction;
  }
  /**
   * Get expired payments (for cron job)
   */
  static async getExpiredPayments() {
    return await prisma.payment.findMany({
      where: {
        status: 'pending',
        expiresAt: {
          lt: new Date()
        }
      },
      include: {
        transaction: true
      }
    });
  }

  /**
   * Get expired transactions (for cron job)
   */  static async getExpiredTransactions() {
    return await prisma.transaction.findMany({
      where: {
        status: {
          in: ['created', 'pending'] // Only expire transactions that haven't been paid
        },
        expiresAt: {
          lt: new Date()
        }
      }
    });
  }

  /**
   * Process expired payments (for cron job)
   */
  static async processExpiredPayments() {
    const expiredPayments = await this.getExpiredPayments();
    
    const updatePromises = expiredPayments.map(async (payment) => {
      return await this.updatePaymentStatus(payment.id, 'expired');
    });

    return await Promise.all(updatePromises);
  }

  /**
   * Process expired transactions (for cron job)
   */
  static async processExpiredTransactions() {
    const expiredTransactions = await this.getExpiredTransactions();
    
    const updatePromises = expiredTransactions.map(async (transaction) => {
      return await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'expired',
          updatedAt: new Date()
        }
      });
    });

    return await Promise.all(updatePromises);
  }
  /**
   * Auto-expire payments and transactions on API calls
   * This will be called on every payment/transaction API request
   */
  static async autoExpireOnApiCall(transactionId?: string, paymentId?: string) {
    const now = new Date();
    
    try {
      // Expire specific payment if paymentId provided
      if (paymentId) {
        await prisma.payment.updateMany({
          where: {
            id: paymentId,
            status: 'pending',
            expiresAt: {
              lt: now
            }
          },
          data: {
            status: 'expired',
            updatedAt: now
          }
        });
      }      // Expire specific transaction if transactionId provided
      if (transactionId) {
        await prisma.transaction.updateMany({
          where: {
            id: transactionId,
            status: {
              in: ['created', 'pending']
            },
            expiresAt: {
              lt: now
            }
          },
          data: {
            status: 'expired',
            updatedAt: now
          }
        });
      }

      // If no specific IDs provided, expire all pending expired items
      if (!paymentId && !transactionId) {
        const [expiredPayments, expiredTransactions] = await Promise.all([
          prisma.payment.updateMany({
            where: {
              status: 'pending',
              expiresAt: {
                lt: now
              }
            },
            data: {
              status: 'expired',
              updatedAt: now
            }
          }),          prisma.transaction.updateMany({
            where: {
              status: {
                in: ['created', 'pending']
              },
              expiresAt: {
                lt: now
              }
            },
            data: {
              status: 'expired',
              updatedAt: now
            }
          })
        ]);        
        if (expiredPayments.count > 0 || expiredTransactions.count > 0) {
          console.log(`[AUTO_EXPIRE] Expired ${expiredPayments.count} payments and ${expiredTransactions.count} transactions`);
        }

        // Clear expiration dates for items that are no longer in created/pending status
        await this.clearExpiredDatesForCompletedItems();
      }
    } catch (error) {
      console.error('[AUTO_EXPIRE] Error during auto-expiration:', error);
      // Don't throw error to avoid breaking the main API call
    }
  }

  /**
   * Clear expiration dates for transactions and payments that are no longer in created/pending status
   */
  private static async clearExpiredDatesForCompletedItems() {
    try {
      const now = new Date();

      // Clear payment expiration dates for non-pending payments
      const clearedPayments = await prisma.payment.updateMany({
        where: {
          status: {
            notIn: ['pending']
          },
          expiresAt: {
            not: null
          }
        },
        data: {
          expiresAt: null,
          updatedAt: now
        }
      });

      // Clear transaction expiration dates for non-created/pending transactions
      const clearedTransactions = await prisma.transaction.updateMany({
        where: {
          status: {
            notIn: ['created', 'pending']
          },
          expiresAt: {
            not: null
          }
        },
        data: {
          expiresAt: null,
          updatedAt: now
        }
      });

      if (clearedPayments.count > 0 || clearedTransactions.count > 0) {        
        console.log(`[CLEAR_EXPIRED_DATES] Cleared expiration dates for ${clearedPayments.count} payments and ${clearedTransactions.count} transactions`);
      }
    } catch (error: any) {
      console.error('[CLEAR_EXPIRED_DATES] Error:', error);
    }
  }

  /**
   * Check if payment is expired (real-time check)
   */
  static isPaymentExpired(payment: { expiresAt: Date | null, status: string }): boolean {
    if (!payment.expiresAt) return false;
    if (payment.status !== 'pending') return false;
    return new Date() > payment.expiresAt;
  }
  /**
   * Check if transaction is expired (real-time check)
   */
  static isTransactionExpired(transaction: { expiresAt: Date | null, status: string }): boolean {
    if (!transaction.expiresAt) return false;
    if (!['created', 'pending'].includes(transaction.status)) return false;
    return new Date() > transaction.expiresAt;
  }

  /**
   * Get valid transaction status transitions
   */
  static getValidStatusTransitions(currentStatus: string): string[] {
    const transitions: Record<string, string[]> = {
      'created': ['pending', 'cancelled', 'expired'],
      'pending': ['in_progress', 'cancelled', 'expired'],
      'in_progress': ['success', 'cancelled'],
      'success': [], // Terminal state
      'cancelled': [], // Terminal state  
      'expired': [] // Terminal state
    };
    
    return transitions[currentStatus] || [];
  }

  /**
   * Update transaction status with validation
   */
  static async updateTransactionStatus(
    transactionId: string,
    newStatus: string,
    userId?: string
  ) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },      
      include: { 
        payment: true,
        productTransactions: { include: { package: true } },
        addonTransactions: { include: { addon: true } },
        whatsappTransaction: { include: { whatsappPackage: true } }
      }
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Validate status transition
    const validTransitions = this.getValidStatusTransitions(transaction.status);
    if (!validTransitions.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${transaction.status} to ${newStatus}`);
    }

    // Update transaction
    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: newStatus,
        updatedAt: new Date()
      }
    });

    // Handle status-specific business logic
    if (newStatus === 'in_progress') {
      // Auto-activate WhatsApp services
      if (transaction.type === 'whatsapp_service' && transaction.whatsappTransaction) {
        await this.activateWhatsAppService(transaction);
      }
    }

    return updatedTransaction;
  }
  /**
   * Activate WhatsApp service after payment (create ServicesWhatsappCustomers record)
   */
  private static async activateWhatsAppService(transaction: any) {
    try {
      const { whatsappTransaction } = transaction;
      const duration = whatsappTransaction.duration;
      const packageId = whatsappTransaction.whatsappPackageId;
      const userId = transaction.userId;

      const existingService = await prisma.servicesWhatsappCustomers.findFirst({
        where: { customerId: userId, packageId }
      });

      const now = new Date();
      let newExpiredAt: Date;

      if (existingService && existingService.expiredAt > now) {
        // Extend existing subscription
        newExpiredAt = new Date(existingService.expiredAt);
        if (duration === 'year') {
          newExpiredAt.setFullYear(newExpiredAt.getFullYear() + 1);
        } else {
          newExpiredAt.setMonth(newExpiredAt.getMonth() + 1);
        }

        await prisma.servicesWhatsappCustomers.update({
          where: { id: existingService.id },
          data: { 
            expiredAt: newExpiredAt,
            status: 'active',
            activatedAt: new Date()
          }
        });
      } else {
        // Create new subscription
        newExpiredAt = new Date();
        if (duration === 'year') {
          newExpiredAt.setFullYear(newExpiredAt.getFullYear() + 1);
        } else {
          newExpiredAt.setMonth(newExpiredAt.getMonth() + 1);
        }

        await prisma.servicesWhatsappCustomers.create({
          data: { 
            transactionId: transaction.id,
            customerId: userId, 
            packageId, 
            expiredAt: newExpiredAt,
            status: 'active',
            activatedAt: new Date()
          }
        });      }

      console.log(`[WHATSAPP_ACTIVATION] Activated service for user ${userId}, expires at ${newExpiredAt}`);
    } catch (error) {
      console.error('[WHATSAPP_ACTIVATION] Error:', error);
      // Don't throw - let transaction stay in in_progress for manual handling
    }
  }  /**
   * Auto-activate services when payment is paid and transaction is in-progress
   */  
  static async autoActivateServices(transaction: any) {
    // Check if activation is already in progress for this transaction
    if (this.isActivationLocked(transaction.id)) {
      console.log(`[AUTO_ACTIVATION] Transaction ${transaction.id} activation already in progress, skipping`);
      return;
    }

    // Lock activation for this transaction
    this.lockActivation(transaction.id);

    try {
      const hasProducts = transaction.productTransactions && transaction.productTransactions.length > 0;
      const hasAddons = transaction.addonTransactions && transaction.addonTransactions.length > 0;
      const hasWhatsapp = transaction.whatsappTransaction?.whatsappPackage;

      let whatsappActivated = false;
      let productCreated = false;
      let addonsCreated = false;

      // Auto-activate WhatsApp service if present (full automation)
      if (hasWhatsapp) {
        const result = await this.activateWhatsAppServiceForTransaction(transaction);
        whatsappActivated = result.success;
      }

      // Create PackageCustomer records for products but keep manual delivery
      if (hasProducts) {
        const result = await this.createProductPackageRecords(transaction);
        productCreated = result.success;
      }

      // Create AddonsCustomer record for add-ons but keep manual delivery
      if (hasAddons) {
        const result = await this.createAddonDeliveryRecord(transaction);
        addonsCreated = result.success;
      }

      // Check if transaction should be completed
      await this.checkTransactionCompletion(transaction.id);

      console.log(`[AUTO_ACTIVATION] Transaction ${transaction.id} completed - WhatsApp: ${whatsappActivated ? 'Activated' : 'Failed'}, Products: ${productCreated ? 'Records Created (Manual Delivery)' : 'Failed'}, Add-ons: ${addonsCreated ? 'Record Created (Manual Delivery)' : 'Failed'}`);
    } catch (error) {
      console.error(`[AUTO_ACTIVATION] Error processing transaction ${transaction.id}:`, error);
      // Don't throw - let transaction stay in in_progress for manual handling
    } finally {
      // Always unlock activation
      this.unlockActivation(transaction.id);
      console.log(`[AUTO_ACTIVATION] Released lock for transaction ${transaction.id}`);
    }
  }
  /**
   * Activate WhatsApp service for a transaction
   */
  private static async activateWhatsAppServiceForTransaction(transaction: any) {
    if (!transaction.whatsappTransaction?.whatsappPackageId) {
      return { success: false, reason: 'No WhatsApp package found' };
    }

    // Check if this WhatsApp transaction has already been processed
    if (transaction.whatsappTransaction.status === 'success') {
      console.log(`[WHATSAPP_ACTIVATION] Transaction ${transaction.id} already processed, skipping`);
      return { success: true, reason: 'Already processed' };
    }

    const { whatsappTransaction } = transaction;
    const duration = whatsappTransaction.duration;
    const packageId = whatsappTransaction.whatsappPackageId;
    const userId = transaction.userId;

    try {
      // First, mark the WhatsApp transaction as 'processing' to prevent concurrent activation
      const updateResult = await prisma.transactionWhatsappService.updateMany({
        where: { 
          id: whatsappTransaction.id,
          status: { notIn: ['success', 'failed'] } // Only update if not already processed
        },
        data: { status: 'processing' }
      });

      // If no rows were updated, it means transaction was already processed
      if (updateResult.count === 0) {
        console.log(`[WHATSAPP_ACTIVATION] Transaction ${transaction.id} already processed by another request, skipping`);
        return { success: true, reason: 'Already processed by another request' };
      }

      // Check if there's already an active service created from this specific transaction
      const existingServiceFromTransaction = await prisma.servicesWhatsappCustomers.findFirst({
        where: { 
          transactionId: transaction.id,
          customerId: userId, 
          packageId 
        }
      });

      if (existingServiceFromTransaction) {
        console.log(`[WHATSAPP_ACTIVATION] Service already created from transaction ${transaction.id}, skipping duplicate`);
        
        // Mark WhatsApp transaction as success
        await prisma.transactionWhatsappService.update({
          where: { id: whatsappTransaction.id },
          data: { 
            status: 'success',
            startDate: existingServiceFromTransaction.activatedAt || new Date(),
            endDate: existingServiceFromTransaction.expiredAt
          },
        });
        
        return { success: true, reason: 'Already created from this transaction' };
      }

      const existingService = await prisma.servicesWhatsappCustomers.findFirst({
        where: { customerId: userId, packageId }
      });

      const now = new Date();
      let newExpiredAt: Date;

      if (existingService && existingService.expiredAt > now) {
        // Extend existing subscription
        newExpiredAt = new Date(existingService.expiredAt);
        if (duration === 'year') {
          newExpiredAt.setFullYear(newExpiredAt.getFullYear() + 1);
        } else {
          newExpiredAt.setMonth(newExpiredAt.getMonth() + 1);
        }

        await prisma.servicesWhatsappCustomers.update({
          where: { id: existingService.id },
          data: { 
            expiredAt: newExpiredAt,
            status: 'active',
            activatedAt: new Date(),
            updatedAt: new Date()
          }
        });

        console.log(`[WHATSAPP_SERVICE] Extended subscription for user ${userId} from ${existingService.expiredAt} to ${newExpiredAt} (Transaction: ${transaction.id})`);
      } else {
        // Create new subscription or handle if exists (race condition protection)
        newExpiredAt = new Date();
        if (duration === 'year') {
          newExpiredAt.setFullYear(newExpiredAt.getFullYear() + 1);
        } else {
          newExpiredAt.setMonth(newExpiredAt.getMonth() + 1);
        }

        try {
          await prisma.servicesWhatsappCustomers.create({
            data: { 
              transactionId: transaction.id,
              customerId: userId, 
              packageId, 
              expiredAt: newExpiredAt,
              status: 'active',
              activatedAt: new Date()
            }
          });
          
          console.log(`[WHATSAPP_SERVICE] Created new subscription for user ${userId}, expires at ${newExpiredAt} (Transaction: ${transaction.id})`);
        } catch (createError: any) {
          // Handle unique constraint error - likely race condition
          if (createError.code === 'P2002' && createError.meta?.target?.includes('customerId_packageId')) {
            console.log(`[WHATSAPP_SERVICE] Unique constraint error, attempting to extend existing subscription for user ${userId}`);
            
            // Get the existing service and extend it
            const existingServiceAfterError = await prisma.servicesWhatsappCustomers.findFirst({
              where: { customerId: userId, packageId }
            });
            
            if (existingServiceAfterError) {
              const extendedExpiredAt = new Date(existingServiceAfterError.expiredAt);
              if (duration === 'year') {
                extendedExpiredAt.setFullYear(extendedExpiredAt.getFullYear() + 1);
              } else {
                extendedExpiredAt.setMonth(extendedExpiredAt.getMonth() + 1);
              }
              
              await prisma.servicesWhatsappCustomers.update({
                where: { id: existingServiceAfterError.id },
                data: { 
                  expiredAt: extendedExpiredAt,
                  status: 'active',
                  activatedAt: new Date(),
                  updatedAt: new Date()
                }
              });
              
              newExpiredAt = extendedExpiredAt;
              console.log(`[WHATSAPP_SERVICE] Extended subscription for user ${userId} after race condition from ${existingServiceAfterError.expiredAt} to ${newExpiredAt} (Transaction: ${transaction.id})`);
            } else {
              throw createError; // Re-throw if we can't find the conflicting record
            }
          } else {
            throw createError; // Re-throw other errors
          }
        }
      }

      // Mark WhatsApp transaction as success
      await prisma.transactionWhatsappService.update({
        where: { id: whatsappTransaction.id },
        data: { 
          status: 'success',
          startDate: now,
          endDate: newExpiredAt
        },
      });

      // Check if transaction should be completed after WhatsApp activation
      await this.checkTransactionCompletion(transaction.id);

      console.log(`[WHATSAPP_SERVICE] Service activated for user ${userId}, expires at ${newExpiredAt} (Transaction: ${transaction.id})`);
      return { success: true, expiredAt: newExpiredAt };
    } catch (error: any) {
      console.error('[WHATSAPP_ACTIVATION] Error:', error);
      
      // Mark WhatsApp transaction as failed
      try {
        await prisma.transactionWhatsappService.update({
          where: { id: whatsappTransaction.id },
          data: { status: 'failed' },
        });
      } catch (updateError) {
        console.error('[WHATSAPP_ACTIVATION] Failed to mark transaction as failed:', updateError);
      }
      
      return { success: false, error: error.message };
    }
  }  /**
   * Create ServicesProductCustomers records for multiple products (manual delivery required)
   * Creates separate record for each product type with aggregated quantity
   */
  private static async createProductPackageRecords(transaction: any) {
    if (!transaction.productTransactions || transaction.productTransactions.length === 0) {
      return { success: false, reason: 'No product transactions found' };
    }

    try {
      let totalRecordsCreated = 0;

      // Group by packageId and sum quantities (requirement: 2 different products with qty 3 each = 2 records)
      for (const productTransaction of transaction.productTransactions) {
        if (!productTransaction.packageId) {
          console.warn(`[PRODUCT_SERVICE] Product transaction ${productTransaction.id} has no packageId, skipping`);
          continue;
        }

        // Check if ServicesProductCustomers already exists for this transaction and package
        const existingProductCustomer = await prisma.servicesProductCustomers.findFirst({
          where: { 
            transactionId: transaction.id,
            packageId: productTransaction.packageId
          }
        });

        if (existingProductCustomer) {
          console.log(`[PRODUCT_SERVICE] Record already exists for transaction ${transaction.id} and package ${productTransaction.packageId}, skipping`);
          continue;
        }

        // Get quantity from TransactionProduct (default to 1 if not available)
        const quantity = productTransaction.quantity || 1;

        // Create ONE ServicesProductCustomers record per product type with total quantity
        await prisma.servicesProductCustomers.create({
          data: {
            transactionId: transaction.id,
            customerId: transaction.userId,
            packageId: productTransaction.packageId,
            quantity: quantity, // Store total quantity for this product type
            status: 'pending',
            deliveredAt: null,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        totalRecordsCreated++;
      }

      console.log(`[PRODUCT_SERVICE] Created ${totalRecordsCreated} product delivery record(s) for transaction ${transaction.id} - awaiting manual delivery`);
      return { success: true, recordsCreated: totalRecordsCreated };
    } catch (error: any) {
      console.error('[PRODUCT_SERVICE] Error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create ServicesProductCustomers record for product (manual delivery required)
   * @deprecated Use createProductPackageRecords for multiple products support
   */
  private static async createProductPackageRecord(transaction: any) {
    if (!transaction.productTransaction?.packageId) {
      return { success: false, reason: 'No product package found in transaction' };
    }

    try {
      // Check if ServicesProductCustomers already exists for this transaction and package
      const existingProductCustomer = await prisma.servicesProductCustomers.findFirst({
        where: { 
          transactionId: transaction.id,
          packageId: transaction.productTransaction.packageId
        }
      });

      if (existingProductCustomer) {
        console.log(`[PRODUCT_SERVICE] Record already exists for transaction ${transaction.id}, skipping duplicate creation`);
        return { success: true, reason: 'Record already exists' };
      }

      // Get quantity from TransactionProduct (default to 1 if not available)
      const quantity = transaction.productTransaction.quantity || 1;

      // Create ServicesProductCustomers records based on quantity
      const records = [];
      for (let i = 0; i < quantity; i++) {
        const record = await prisma.servicesProductCustomers.create({
          data: {
            transactionId: transaction.id,
            customerId: transaction.userId,
            packageId: transaction.productTransaction.packageId,
            status: 'pending',
            deliveredAt: null,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        records.push(record);
      }

      console.log(`[PRODUCT_SERVICE] Created ${records.length} product delivery record(s) for transaction ${transaction.id} - awaiting manual delivery`);
      return { success: true, recordsCreated: records.length };
    } catch (error: any) {
      console.error('[PRODUCT_SERVICE] Error:', error);
      return { success: false, error: error.message };
    }
  }
  /**
   * Create ServicesAddonsCustomers record for add-ons (manual delivery required)
   * Creates ONE record with all addons combined with their quantities
   */
  private static async createAddonDeliveryRecord(transaction: any) {
    if (!transaction.addonTransactions || transaction.addonTransactions.length === 0) {
      return { success: false, reason: 'No addon transactions found' };
    }

    try {
      // Check if ServicesAddonsCustomers already exists for this transaction
      const existingAddonCustomer = await prisma.servicesAddonsCustomers.findFirst({
        where: { transactionId: transaction.id }
      });

      if (existingAddonCustomer) {
        console.log(`[ADDON_SERVICE] Record already exists for transaction ${transaction.id}, skipping duplicate creation`);
        return { success: true, reason: 'Record already exists' };
      }      // Collect addon details with quantities (addon IDs will be retrieved from TransactionAddons via transactionId)
      const addonDetails = transaction.addonTransactions.map((at: any) => ({
        addonId: at.addonId,
        quantity: at.quantity || 1,
        addon: {
          id: at.addon?.id,
          name_en: at.addon?.name_en,
          name_id: at.addon?.name_id,
          price_idr: at.addon?.price_idr,
          price_usd: at.addon?.price_usd,
        }
      }));

      // Create ONE ServicesAddonsCustomers record with all addons combined
      const record = await prisma.servicesAddonsCustomers.create({
        data: {
          transactionId: transaction.id,
          customerId: transaction.userId,
          addonDetails: JSON.stringify(addonDetails),
          status: 'pending',
          deliveredAt: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      console.log(`[ADDON_SERVICE] Created ONE addon delivery record for transaction ${transaction.id} with ${transaction.addonTransactions.length} add-on types combined - awaiting manual delivery`);
      return { success: true, recordCreated: !!record };
    } catch (error: any) {
      console.error('[ADDON_SERVICE] Error:', error);
      return { success: false, error: error.message };
    }
  }
  /**
   * Manual activation check for transactions that are in-progress with paid payment
   */  static async checkAndActivateTransaction(transactionId: string, userId: string) {
    const transaction = await prisma.transaction.findFirst({
      where: { 
        id: transactionId,
        userId: userId,
        status: 'in_progress'
      },
      include: {
        payment: true,
        whatsappTransaction: {
          include: { whatsappPackage: true }
        },
        productTransactions: {
          include: { package: true }
        },
        addonTransactions: {
          include: { addon: true }
        }
      }
    });

    if (!transaction) {
      throw new Error('Transaction not found or not in valid status for activation');
    }

    if (!transaction.payment || transaction.payment.status !== 'paid') {
      throw new Error('Transaction payment is not paid');
    }

    // Activate services
    await this.autoActivateServices(transaction);

    return {
      success: true,
      transaction: transaction
    };
  }

  /**
   * Manual activation method that can be called after admin payment update
   * This prevents double activation during the main payment update flow
   */
  static async activateServicesAfterPaymentUpdate(transactionId: string) {
    // Check if activation is already in progress for this transaction
    if (this.isActivationLocked(transactionId)) {
      console.log(`[MANUAL_ACTIVATION] Transaction ${transactionId} activation already in progress, skipping`);
      return { success: false, reason: 'Activation already in progress' };
    }

    try {
      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
          payment: true,
          whatsappTransaction: {
            include: { whatsappPackage: true }
          },
          productTransactions: {
            include: { package: true }
          },
          addonTransactions: {
            include: { addon: true }
          }
        }
      });

      if (!transaction) {
        console.log(`[MANUAL_ACTIVATION] Transaction ${transactionId} not found`);
        return { success: false, reason: 'Transaction not found' };
      }

      if (transaction.status !== 'in_progress') {
        console.log(`[MANUAL_ACTIVATION] Transaction ${transactionId} status is ${transaction.status}, expected in_progress`);
        return { success: false, reason: 'Transaction not in progress' };
      }

      if (!transaction.payment || transaction.payment.status !== 'paid') {
        console.log(`[MANUAL_ACTIVATION] Transaction ${transactionId} payment is not paid`);
        return { success: false, reason: 'Payment not paid' };
      }

      // Additional check: If WhatsApp transaction already processed, skip activation
      if (transaction.whatsappTransaction && transaction.whatsappTransaction.status === 'success') {
        console.log(`[MANUAL_ACTIVATION] WhatsApp transaction ${transactionId} already processed, skipping`);
        return { success: true, reason: 'WhatsApp transaction already processed' };
      }

      // Activate services using the same method with lock protection
      await this.autoActivateServices(transaction);

      console.log(`[MANUAL_ACTIVATION] Successfully activated services for transaction ${transactionId}`);
      return { success: true, transactionId };

    } catch (error: any) {
      console.error(`[MANUAL_ACTIVATION] Error activating services for transaction ${transactionId}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if transaction should be completed based on delivery/activation status
   */
  static async checkTransactionCompletion(transactionId: string) {
    try {      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
          productTransactions: true,
          addonTransactions: true,
          whatsappTransaction: true,
          payment: true
        }
      });

      if (!transaction || transaction.status !== 'in_progress') {
        return { completed: false, reason: 'Transaction not found or not in progress' };
      }

      const hasProduct = transaction.productTransactions && transaction.productTransactions.length > 0;
      const hasAddons = transaction.addonTransactions && transaction.addonTransactions.length > 0;
      const hasWhatsapp = transaction.whatsappTransaction?.whatsappPackageId;// Check completion status for each service
      const productCompleted = hasProduct ? await this.isProductDelivered(transactionId) : true;
      const addonsCompleted = hasAddons ? await this.isAddonsDelivered(transactionId) : true;
      const whatsappCompleted = hasWhatsapp ? await this.isWhatsAppActivated(transaction.userId, transaction.whatsappTransaction?.whatsappPackageId) : true;

      // Transaction is complete when ALL services are completed
      if (productCompleted && addonsCompleted && whatsappCompleted) {
        await prisma.transaction.update({
          where: { id: transactionId },
          data: { 
            status: 'success', 
            updatedAt: new Date() 
          }
        });

        console.log(`[TRANSACTION_COMPLETION] Transaction ${transactionId} completed - Product: ${productCompleted}, Add-ons: ${addonsCompleted}, WhatsApp: ${whatsappCompleted}`);
        return { completed: true };
      }

      console.log(`[TRANSACTION_COMPLETION] Transaction ${transactionId} not yet complete - Product: ${productCompleted}, Add-ons: ${addonsCompleted}, WhatsApp: ${whatsappCompleted}`);
      return { completed: false, productCompleted, addonsCompleted, whatsappCompleted };

    } catch (error: any) {
      console.error('[TRANSACTION_COMPLETION] Error:', error);
      return { completed: false, error: error.message };
    }
  }  /**
   * Check if product is delivered for a transaction
   */
  private static async isProductDelivered(transactionId: string): Promise<boolean> {
    // Check if ALL products for this transaction are delivered
    const productCustomers = await prisma.servicesProductCustomers.findMany({
      where: { transactionId: transactionId }
    });

    if (productCustomers.length === 0) return true; // No products to deliver

    // All product records must have status 'delivered'
    return productCustomers.every(pc => pc.status === 'delivered');
  }
  /**
   * Check if WhatsApp service is activated for a user and package
   */
  private static async isWhatsAppActivated(userId: string, packageId?: string): Promise<boolean> {
    if (!packageId) return false;
    
    const whatsappService = await prisma.servicesWhatsappCustomers.findFirst({
      where: { 
        customerId: userId,
        packageId: packageId,
        status: 'active',
        expiredAt: { gt: new Date() } // Must be active (not expired)
      }
    });    return !!whatsappService;
  }

  /**
   * Check if add-ons are delivered for a transaction
   */
  private static async isAddonsDelivered(transactionId: string): Promise<boolean> {
    const addonCustomer = await prisma.servicesAddonsCustomers.findFirst({
      where: { 
        transactionId: transactionId,
        status: 'delivered'
      }
    });
    return !!addonCustomer;
  }

  /**
   * Manual trigger for product delivery completion (called by admin)
   */  static async completeProductDelivery(transactionId: string, adminUserId?: string) {
    try {
      // Update ServicesProductCustomers status to delivered
      const productCustomer = await prisma.servicesProductCustomers.findFirst({
        where: { transactionId: transactionId }
      });

      if (!productCustomer) {
        throw new Error('ServicesProductCustomers record not found');
      }

      await prisma.servicesProductCustomers.update({
        where: { id: productCustomer.id },
        data: {
          status: 'delivered',
          deliveredAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Check if transaction should be completed
      const completionResult = await this.checkTransactionCompletion(transactionId);
      
      console.log(`[PRODUCT_DELIVERY_COMPLETION] Product delivered for transaction ${transactionId}, completed: ${completionResult.completed}`);
      
      return { 
        success: true, 
        delivered: true, 
        transactionCompleted: completionResult.completed 
      };    } catch (error: any) {
      console.error('[PRODUCT_DELIVERY_COMPLETION] Error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Manual trigger for add-ons delivery completion (called by admin)
   */
  static async completeAddonsDelivery(transactionId: string, adminUserId?: string) {
    try {
      // Update ServicesAddonsCustomers status to delivered
      const addonCustomer = await prisma.servicesAddonsCustomers.findFirst({
        where: { transactionId: transactionId }
      });

      if (!addonCustomer) {
        throw new Error('ServicesAddonsCustomers record not found');
      }

      await prisma.servicesAddonsCustomers.update({
        where: { id: addonCustomer.id },
        data: {
          status: 'delivered',
          deliveredAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Check if transaction should be completed
      const completionResult = await this.checkTransactionCompletion(transactionId);
      
      console.log(`[ADDONS_DELIVERY_COMPLETION] Add-ons delivered for transaction ${transactionId}, completed: ${completionResult.completed}`);
      
      return { 
        success: true, 
        delivered: true, 
        transactionCompleted: completionResult.completed 
      };

    } catch (error: any) {
      console.error('[ADDONS_DELIVERY_COMPLETION] Error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update child transaction statuses (TransactionProduct and TransactionAddons)
   */
  static async updateChildTransactionStatuses(
    transactionId: string, 
    status: 'created' | 'pending' | 'in_progress' | 'success' | 'cancelled'
  ) {
    try {
      // Update all TransactionProduct statuses
      await prisma.transactionProduct.updateMany({
        where: { transactionId },
        data: { status }
      });

      // Update all TransactionAddons statuses
      await prisma.transactionAddons.updateMany({
        where: { transactionId },
        data: { status }
      });

      console.log(`[CHILD_STATUS_UPDATE] Updated child transaction statuses to ${status} for transaction ${transactionId}`);
    } catch (error) {
      console.error(`[CHILD_STATUS_UPDATE] Error updating child transaction statuses:`, error);
    }
  }
}
