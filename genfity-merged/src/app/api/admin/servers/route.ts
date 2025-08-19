import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const adminVerification = await verifyAdminToken(request);
    if (!adminVerification.success) {
      return NextResponse.json({ error: adminVerification.error }, { status: 401 });
    }

    // Get servers from database
    const servers = await prisma.server.findMany({
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return NextResponse.json({ servers });
  } catch (error) {
    console.error('Error fetching servers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const adminVerification = await verifyAdminToken(request);
    if (!adminVerification.success) {
      return NextResponse.json({ error: adminVerification.error }, { status: 401 });
    }

    const digitalOceanToken = process.env.DO_API_TOKEN;
    if (!digitalOceanToken) {
      return NextResponse.json(
        { error: 'DigitalOcean token not configured' },
        { status: 500 }
      );
    }

    // Fetch droplets from DigitalOcean API
    const response = await fetch('https://api.digitalocean.com/v2/droplets', {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${digitalOceanToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch droplets from DigitalOcean');
    }

    const data = await response.json();
    const droplets = data.droplets;

    // Update or create servers in database
    const updatedServers = [];
    
    for (const droplet of droplets) {
      const publicIpv4 = droplet.networks.v4.find((network: any) => network.type === 'public');
      const privateIpv4 = droplet.networks.v4.find((network: any) => network.type === 'private');
      
      const serverData = {
        dropletId: droplet.id.toString(),
        name: droplet.name,
        memory: droplet.memory,
        vcpus: droplet.vcpus,
        disk: droplet.disk,
        status: droplet.status,
        region: droplet.region.name,
        regionSlug: droplet.region.slug,
        sizeSlug: droplet.size_slug,
        publicIp: publicIpv4?.ip_address || null,
        privateIp: privateIpv4?.ip_address || null,
        priceMonthly: droplet.size.price_monthly,
        priceHourly: droplet.size.price_hourly,
        createdAt: new Date(droplet.created_at),
        tags: droplet.tags,
        features: droplet.features,
        imageDistribution: droplet.image.distribution,
        imageName: droplet.image.name,
        updatedAt: new Date()
      };

      const server = await prisma.server.upsert({
        where: { dropletId: droplet.id.toString() },
        update: serverData,
        create: serverData
      });

      updatedServers.push(server);
    }

    return NextResponse.json({ 
      message: 'Servers updated successfully',
      servers: updatedServers,
      count: updatedServers.length
    });
  } catch (error) {
    console.error('Error updating servers:', error);
    return NextResponse.json(
      { error: 'Failed to update servers' },
      { status: 500 }
    );
  }
}
