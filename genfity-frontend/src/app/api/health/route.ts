import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'genfity-frontend',
      uptime: process.uptime()
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'genfity-frontend',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
