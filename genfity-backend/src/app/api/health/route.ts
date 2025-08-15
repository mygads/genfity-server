import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check database connection if needed
    // You can add more health checks here
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'genfity-backend',
      database: 'connected', // Add actual DB check here
      uptime: process.uptime()
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'genfity-backend',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
