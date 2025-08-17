import { NextResponse } from 'next/server';
import { addMonths, addYears } from 'date-fns';
import { prisma } from '../../../../../../lib/prisma';
import { withCORS, corsOptionsResponse } from "@/lib/cors";

// POST /api/whatsapp-api/service/activate
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, transactionId } = body;
    if (!transactionId) {
      return withCORS(NextResponse.json({ success: false, error: 'transactionId is required' }, { status: 400 }));
    }

    // Get transaction with WhatsApp service details
    const trx = await prisma.transaction.findFirst({
      where: { 
        id: transactionId,
        type: 'whatsapp_service',
      },
      include: { 
        whatsappTransaction: {
          include: {
            whatsappPackage: true,
          },
        },
      },
    });
    if (!trx || !trx.whatsappTransaction) {
      return withCORS(NextResponse.json({ success: false, error: 'WhatsApp service transaction not found' }, { status: 404 }));
    }
    
    // If userId is provided, validate it matches the transaction userId
    if (userId && trx.userId !== userId) {
      return withCORS(NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 }));
    }
    
    if (trx.status !== 'paid') {
      return withCORS(NextResponse.json({ success: false, error: 'Transaction not paid' }, { status: 400 }));    }    // Check if this transaction has already been used to create a service
    const existingServiceFromTransaction = await prisma.servicesWhatsappCustomers.findFirst({
      where: {
        customerId: trx.userId,
        packageId: trx.whatsappTransaction.whatsappPackageId,
        createdAt: {
          gte: trx.createdAt, // Service created after transaction
        },
      },
    });

    if (existingServiceFromTransaction) {
      return withCORS(NextResponse.json({ 
        success: false, 
        error: 'This transaction has already been used to activate a service' 
      }, { status: 400 }));
    }

    // Calculate expiredAt
    const now = new Date();
    let expiredAt = now;
    if (trx.whatsappTransaction.duration === 'year') {
      expiredAt = addYears(now, 1);
    } else {
      expiredAt = addMonths(now, 1);
    }    // Check if user already has an active service for this package
    const existingService = await prisma.servicesWhatsappCustomers.findFirst({
      where: {
        customerId: trx.userId,
        packageId: trx.whatsappTransaction.whatsappPackageId,
        expiredAt: { gt: now },
      },
      orderBy: { expiredAt: 'desc' },
    });

    let service;
    if (existingService) {
      // Extend existing service
      const newExpiredAt = trx.whatsappTransaction.duration === 'year' 
        ? addYears(existingService.expiredAt, 1)
        : addMonths(existingService.expiredAt, 1);
      
      service = await prisma.servicesWhatsappCustomers.update({
        where: { id: existingService.id },
        data: { expiredAt: newExpiredAt },
      });
    } else {
      // Create new service
      service = await prisma.servicesWhatsappCustomers.create({
        data: {
          customerId: trx.userId,
          transactionId: trx.id,
          packageId: trx.whatsappTransaction.whatsappPackageId,
          expiredAt,
          status: 'activating',
        },
      });
    }

    return withCORS(NextResponse.json({ success: true, data: service }));
  } catch (error) {
    return withCORS(NextResponse.json({ success: false, error: error?.toString() }));
  }
}

export async function OPTIONS() {
  return corsOptionsResponse();
}
