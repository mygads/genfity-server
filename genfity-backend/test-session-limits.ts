// Test WhatsApp Session Limits
// Run this with: npx tsx test-session-limits.ts

import { prisma } from "./src/lib/prisma";
import { getWhatsAppSubscriptionStatus } from "./src/lib/whatsapp-subscription";

async function testSessionLimits() {
  try {
    console.log('=== TESTING WHATSAPP SESSION LIMITS ===\n');

    // Test user from your example
    const testUserId = 'cmbsnh23l0008jtww5wxqwzky';
    
    console.log(`Testing for user: ${testUserId}`);
    
    // Get subscription status
    const subscriptionStatus = await getWhatsAppSubscriptionStatus(testUserId);
    
    console.log('\n📦 SUBSCRIPTION STATUS:');
    console.log(`Package Name: ${subscriptionStatus.packageName}`);
    console.log(`Max Sessions: ${subscriptionStatus.maxSessions}`);
    console.log(`Current Sessions: ${subscriptionStatus.currentSessions}`);
    console.log(`Can Create More: ${subscriptionStatus.canCreateMoreSessions}`);
    console.log(`End Date: ${subscriptionStatus.endDate}`);
    
    // Get actual sessions from database
    const actualSessions = await prisma.whatsAppSession.findMany({
      where: { userId: testUserId },
      select: {
        id: true,
        sessionId: true,
        sessionName: true,
        status: true,
        createdAt: true
      }
    });
    
    console.log('\n📱 CURRENT SESSIONS:');
    actualSessions.forEach((session, index) => {
      console.log(`${index + 1}. ${session.sessionName || 'Unnamed'} (${session.status}) - ${session.sessionId}`);
    });
    
    console.log(`\nActual session count: ${actualSessions.length}`);
    console.log(`Sessions remaining: ${subscriptionStatus.maxSessions - actualSessions.length}`);
    
    // Get package details
    const userSubscription = await prisma.servicesWhatsappCustomers.findFirst({
      where: {
        customerId: testUserId,
        status: "active",
        expiredAt: { gt: new Date() }
      },
      include: {
        package: true
      }
    });
    
    if (userSubscription) {
      console.log('\n📋 PACKAGE DETAILS:');
      console.log(`Package ID: ${userSubscription.package.id}`);
      console.log(`Package Name: ${userSubscription.package.name}`);
      console.log(`Max Sessions: ${userSubscription.package.maxSession}`);
      console.log(`Monthly Price: ${userSubscription.package.priceMonth}`);
      console.log(`Yearly Price: ${userSubscription.package.priceYear}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing session limits:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSessionLimits();
