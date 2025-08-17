import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const type = searchParams.get('type') || 'all'; // Can be 'addon', 'product', 'whatsapp', or 'all'

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Status filter
    if (status !== 'all') {
      where.status = status;
    }

    // Search filter (user email/name or transaction ID)
    if (search) {
      where.OR = [
        { id: { contains: search } },
        { user: { email: { contains: search } } },
        { user: { name: { contains: search } } }
      ];
    }

    // Type filter for addon transactions
    if (type === 'addon') {
      where.addonTransactions = {
        some: {} // Must have at least one addon transaction
      };
    } else if (type === 'product') {
      where.productTransactions = {
        some: {} // Must have at least one product transaction
      };
    } else if (type === 'whatsapp') {
      where.whatsappTransaction = {
        isNot: null // Must have a whatsapp transaction
      };
    }    // Get transactions with related data
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          addonTransactions: {
            include: {
              addon: {
                select: {
                  id: true,
                  name_en: true,
                  name_id: true,
                  description_en: true,
                  price_idr: true,
                  price_usd: true,
                  categoryId: true,
                  category: {
                    select: {
                      name_en: true,
                      name_id: true
                    }
                  }
                }
              }
            }
          },
          productTransactions: {
            include: {
              package: {
                select: {
                  id: true,
                  name_en: true,
                  name_id: true,
                  description_en: true,
                  description_id: true,
                  price_idr: true,
                  price_usd: true,
                  category: {
                    select: {
                      id: true,
                      name_en: true,
                      name_id: true,
                      icon: true
                    }
                  },
                  subcategory: {
                    select: {
                      id: true,
                      name_en: true,
                      name_id: true
                    }
                  },
                  features: {
                    select: {
                      id: true,
                      name_en: true,
                      name_id: true,
                      included: true
                    }
                  }
                }
              }
            }
          },
          whatsappTransaction: {
            include: {
              whatsappPackage: {
                select: {
                  name: true,
                  description: true,
                  priceMonth: true,
                  priceYear: true
                }
              }
            }
          },
          addonCustomers: {
            select: {
              id: true,
              status: true,
              deliveredAt: true,
              notes: true,
              driveUrl: true
            }
          },
          payment: {
            select: {
              id: true,
              status: true,
              method: true,
              paymentDate: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.transaction.count({ where })
    ]);

    // Transform transactions to match frontend interface
    const transformedTransactions = transactions.map(transaction => {
      // Calculate total amount from addon transactions
      let calculatedAmount = Number(transaction.amount);
      
      // For addon transactions, calculate amount from addon prices
      if (type === 'addon' && transaction.addonTransactions.length > 0) {
        calculatedAmount = transaction.addonTransactions.reduce((total, addonTx) => {
          const addonPrice = Number(transaction.currency === 'usd' ? addonTx.addon.price_usd : addonTx.addon.price_idr || 0);
          return total + (addonPrice * addonTx.quantity);
        }, 0);
      }
      
      // Transform addon transactions to match expected format
      const transactionAddons = transaction.addonTransactions.map(addonTx => ({
        id: addonTx.id,
        addonId: addonTx.addonId,
        quantity: addonTx.quantity,
        status: addonTx.status || 'created', // Include addon status
        unitPrice: Number(transaction.currency === 'usd' ? addonTx.addon.price_usd : addonTx.addon.price_idr || 0),
        totalPrice: Number(transaction.currency === 'usd' ? addonTx.addon.price_usd : addonTx.addon.price_idr || 0) * addonTx.quantity,
        addon: {
          id: addonTx.addon.id,
          name: addonTx.addon.name_en,
          description: addonTx.addon.description_en || '',
          price: Number(transaction.currency === 'usd' ? addonTx.addon.price_usd : addonTx.addon.price_idr || 0),
          currency: transaction.currency
        }
      }));

      return {
        id: transaction.id,
        originalAmount: Number(transaction.originalAmount || transaction.amount),
        finalAmount: calculatedAmount, // Use calculated amount for addon transactions
        currency: transaction.currency,
        status: transaction.status,
        transactionDate: transaction.transactionDate.toISOString(),
        createdAt: transaction.createdAt.toISOString(),
        updatedAt: transaction.updatedAt.toISOString(),
        notes: transaction.notes, // Include transaction notes from checkout
        user: {
          id: transaction.user.id,
          name: transaction.user.name,
          email: transaction.user.email
        },
        transactionAddons,
        addonCustomers: transaction.addonCustomers,
        payment: transaction.payment
      };
    });

    // Calculate stats
    const stats = await calculateTransactionStats(where);    return NextResponse.json({
      transactions: transformedTransactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function calculateTransactionStats(baseWhere: any) {
  try {
    // Total transactions
    const totalTransactions = await prisma.transaction.count({
      where: baseWhere
    });

    // Pending transactions (created, pending, in_progress)
    const pendingTransactions = await prisma.transaction.count({
      where: {
        ...baseWhere,
        status: {
          in: ['created', 'pending', 'in_progress']
        }
      }
    });

    // Completed transactions (success)
    const completedTransactions = await prisma.transaction.count({
      where: {
        ...baseWhere,
        status: 'success'
      }
    });

    // Total revenue (from all transactions with paid status or successful status)
    // For addon transactions, we need to calculate from the addon prices directly
    let totalRevenue = 0;
    
    if (baseWhere.addonTransactions?.some) {
      // For addon transactions, calculate revenue from addon prices
      const paidTransactions = await prisma.transaction.findMany({
        where: {
          ...baseWhere,
          OR: [
            { status: 'success' },
            { 
              payment: {
                status: 'paid'
              }
            }
          ]
        },
        include: {
          addonTransactions: {
            include: {
              addon: {
                select: {
                  price_idr: true,
                  price_usd: true
                }
              }
            }
          }
        }
      });
      
      totalRevenue = paidTransactions.reduce((total, transaction) => {
        const transactionRevenue = transaction.addonTransactions.reduce((addonTotal, addonTx) => {
          const addonPrice = Number(transaction.currency === 'usd' ? addonTx.addon.price_usd : addonTx.addon.price_idr || 0);
          return addonTotal + (addonPrice * addonTx.quantity);
        }, 0);
        return total + transactionRevenue;
      }, 0);
    } else {
      // For other transaction types, use the original method
      const revenueData = await prisma.transaction.aggregate({
        where: {
          ...baseWhere,
          OR: [
            { status: 'success' },
            { 
              payment: {
                status: 'paid'
              }
            }
          ]
        },
        _sum: {
          amount: true // Use amount field which is the actual transaction amount
        }
      });
      
      totalRevenue = Number(revenueData._sum.amount || 0);
    }
    const avgOrderValue = completedTransactions > 0 ? totalRevenue / completedTransactions : 0;

    return {
      totalTransactions,
      pendingTransactions,
      completedTransactions,
      totalRevenue,
      avgOrderValue
    };
  } catch (error) {
    console.error('Error calculating stats:', error);
    return {
      totalTransactions: 0,
      pendingTransactions: 0,
      completedTransactions: 0,
      totalRevenue: 0,
      avgOrderValue: 0
    };
  }
}
