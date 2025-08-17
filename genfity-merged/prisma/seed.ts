import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data (optional - be careful in production)
  console.log('🧹 Cleaning existing data...');
  await prisma.feature.deleteMany();
  await prisma.transactionAddons.deleteMany();
  await prisma.transactionProduct.deleteMany();
  await prisma.transactionWhatsappService.deleteMany();
  await prisma.addon.deleteMany();
  await prisma.package.deleteMany();
  await prisma.subcategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.whatsappApiPackage.deleteMany();
  await prisma.userSession.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Categories
  console.log('📂 Creating categories...');
  const webDevCategory = await prisma.category.create({
    data: {
      name_en: 'Web Development',
      name_id: 'Pengembangan Web',
      icon: '🌐'
    }
  });

  const seoCategory = await prisma.category.create({
    data: {
      name_en: 'SEO Services',
      name_id: 'Layanan SEO',
      icon: '🔍'
    }
  });

  const designCategory = await prisma.category.create({
    data: {
      name_en: 'Design Services',
      name_id: 'Layanan Desain',
      icon: '🎨'
    }
  });

  // 2. Create Subcategories
  console.log('📁 Creating subcategories...');
  const landingPageSub = await prisma.subcategory.create({
    data: {
      categoryId: webDevCategory.id,
      name_en: 'Landing Pages',
      name_id: 'Landing Page'
    }
  });

  const ecommerceSub = await prisma.subcategory.create({
    data: {
      categoryId: webDevCategory.id,
      name_en: 'E-Commerce',
      name_id: 'E-Commerce'
    }
  });

  const customWebSub = await prisma.subcategory.create({
    data: {
      categoryId: webDevCategory.id,
      name_en: 'Custom Web Apps',
      name_id: 'Aplikasi Web Kustom'
    }
  });

  const localSeoSub = await prisma.subcategory.create({
    data: {
      categoryId: seoCategory.id,
      name_en: 'Local SEO',
      name_id: 'SEO Lokal'
    }
  });

  const technicalSeoSub = await prisma.subcategory.create({
    data: {
      categoryId: seoCategory.id,
      name_en: 'Technical SEO',
      name_id: 'SEO Teknis'
    }
  });

  const logoDesignSub = await prisma.subcategory.create({
    data: {
      categoryId: designCategory.id,
      name_en: 'Logo Design',
      name_id: 'Desain Logo'
    }
  });

  const uiuxDesignSub = await prisma.subcategory.create({
    data: {
      categoryId: designCategory.id,
      name_en: 'UI/UX Design',
      name_id: 'Desain UI/UX'
    }
  });

  // 3. Create Packages
  console.log('📦 Creating packages...');
  
  const basicLandingPackage = await prisma.package.create({
    data: {
      categoryId: webDevCategory.id,
      subcategoryId: landingPageSub.id,
      name_en: 'Basic Landing Page',
      name_id: 'Landing Page Basic',
      description_en: 'Simple and effective landing page with responsive design, contact form, and basic SEO optimization',
      description_id: 'Landing page sederhana dan efektif dengan desain responsif, form kontak, dan optimasi SEO dasar',
      price_idr: 2500000,
      price_usd: 165,
      image: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80',
      popular: true,
      bgColor: '#E3F2FD'
    }
  });

  const premiumLandingPackage = await prisma.package.create({
    data: {
      categoryId: webDevCategory.id,
      subcategoryId: landingPageSub.id,
      name_en: 'Premium Landing Page',
      name_id: 'Landing Page Premium',
      description_en: 'Advanced landing page with animations, advanced SEO, analytics integration, and premium support',
      description_id: 'Landing page lanjutan dengan animasi, SEO lanjutan, integrasi analytics, dan dukungan premium',
      price_idr: 5000000,
      price_usd: 330,
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2015&q=80',
      popular: false,
      bgColor: '#F3E5F5'
    }
  });

  const basicEcommercePackage = await prisma.package.create({
    data: {
      categoryId: webDevCategory.id,
      subcategoryId: ecommerceSub.id,
      name_en: 'Basic E-Commerce Store',
      name_id: 'Toko E-Commerce Basic',
      description_en: 'Complete e-commerce solution with product catalog, shopping cart, and payment integration',
      description_id: 'Solusi e-commerce lengkap dengan katalog produk, keranjang belanja, dan integrasi pembayaran',
      price_idr: 15000000,
      price_usd: 990,
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80',
      popular: false,
      bgColor: '#E8F5E8'
    }
  });

  const localSeoPackage = await prisma.package.create({
    data: {
      categoryId: seoCategory.id,
      subcategoryId: localSeoSub.id,
      name_en: 'Local SEO Optimization',
      name_id: 'Optimasi SEO Lokal',
      description_en: 'Complete local SEO package to improve your local search visibility and attract nearby customers',
      description_id: 'Paket SEO lokal lengkap untuk meningkatkan visibilitas pencarian lokal dan menarik pelanggan terdekat',
      price_idr: 3500000,
      price_usd: 230,
      image: 'https://images.unsplash.com/photo-1562577309-4932fdd64cd1?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80',
      popular: true,
      bgColor: '#FFF3E0'
    }
  });

  const logoDesignPackage = await prisma.package.create({
    data: {
      categoryId: designCategory.id,
      subcategoryId: logoDesignSub.id,
      name_en: 'Professional Logo Design',
      name_id: 'Desain Logo Profesional',
      description_en: 'Professional logo design with multiple concepts, unlimited revisions, and complete brand package',
      description_id: 'Desain logo profesional dengan beberapa konsep, revisi unlimited, dan paket brand lengkap',
      price_idr: 1500000,
      price_usd: 99,
      image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2071&q=80',
      popular: true,
      bgColor: '#FFEBEE'
    }
  });

  // 4. Create Package Features
  console.log('✨ Creating package features...');
  
  // Basic Landing Page Features
  await prisma.feature.createMany({
    data: [
      { name_en: 'Responsive Design', name_id: 'Desain Responsif', included: true, packageId: basicLandingPackage.id },
      { name_en: 'Contact Form', name_id: 'Form Kontak', included: true, packageId: basicLandingPackage.id },
      { name_en: 'Basic SEO', name_id: 'SEO Dasar', included: true, packageId: basicLandingPackage.id },
      { name_en: '3 Sections', name_id: '3 Bagian', included: true, packageId: basicLandingPackage.id },
      { name_en: 'Premium Support', name_id: 'Dukungan Premium', included: false, packageId: basicLandingPackage.id }
    ]
  });

  // Premium Landing Page Features
  await prisma.feature.createMany({
    data: [
      { name_en: 'Premium Design', name_id: 'Desain Premium', included: true, packageId: premiumLandingPackage.id },
      { name_en: 'Animations & Effects', name_id: 'Animasi & Efek', included: true, packageId: premiumLandingPackage.id },
      { name_en: 'Advanced SEO', name_id: 'SEO Lanjutan', included: true, packageId: premiumLandingPackage.id },
      { name_en: 'Analytics Integration', name_id: 'Integrasi Analytics', included: true, packageId: premiumLandingPackage.id },
      { name_en: 'Unlimited Revisions', name_id: 'Revisi Unlimited', included: true, packageId: premiumLandingPackage.id }
    ]
  });

  // E-Commerce Features
  await prisma.feature.createMany({
    data: [
      { name_en: 'Product Catalog', name_id: 'Katalog Produk', included: true, packageId: basicEcommercePackage.id },
      { name_en: 'Shopping Cart', name_id: 'Keranjang Belanja', included: true, packageId: basicEcommercePackage.id },
      { name_en: 'Payment Gateway', name_id: 'Payment Gateway', included: true, packageId: basicEcommercePackage.id },
      { name_en: 'Order Management', name_id: 'Manajemen Pesanan', included: true, packageId: basicEcommercePackage.id },
      { name_en: 'Multi-vendor Support', name_id: 'Dukungan Multi-vendor', included: false, packageId: basicEcommercePackage.id }
    ]
  });

  // 5. Create Addons
  console.log('🔧 Creating addons...');
  
  const extraPageAddon = await prisma.addon.create({
    data: {
      categoryId: webDevCategory.id,
      name_en: 'Extra Page',
      name_id: 'Halaman Tambahan',
      description_en: 'Add an additional page to your website with matching design and content',
      description_id: 'Tambahkan halaman tambahan ke website Anda dengan desain dan konten yang sesuai',
      price_idr: 500000,
      price_usd: 33,
      image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2072&q=80'
    }
  });

  const sslPremiumAddon = await prisma.addon.create({
    data: {
      categoryId: webDevCategory.id,
      name_en: 'Premium SSL Certificate',
      name_id: 'Sertifikat SSL Premium',
      description_en: 'Extended Validation SSL certificate for maximum security and trust',
      description_id: 'Sertifikat SSL Extended Validation untuk keamanan dan kepercayaan maksimum',
      price_idr: 750000,
      price_usd: 49,
      image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80'
    }
  });

  const privateServerAddon = await prisma.addon.create({
    data: {
      categoryId: webDevCategory.id,
      name_en: 'Private Server Hosting',
      name_id: 'Hosting Server Pribadi',
      description_en: 'Dedicated private server hosting for better performance and security',
      description_id: 'Hosting server pribadi khusus untuk performa dan keamanan yang lebih baik',
      price_idr: 2000000,
      price_usd: 132,
      image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80'
    }
  });

  const customIntegrationAddon = await prisma.addon.create({
    data: {
      categoryId: webDevCategory.id,
      name_en: 'Custom Integration',
      name_id: 'Integrasi Kustom',
      description_en: 'Custom third-party service integration (CRM, ERP, API)',
      description_id: 'Integrasi layanan pihak ketiga kustom (CRM, ERP, API)',
      price_idr: 750000,
      price_usd: 50,
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80'
    }
  });

  const seoOptimizationAddon = await prisma.addon.create({
    data: {
      categoryId: seoCategory.id,
      name_en: 'SEO Optimization',
      name_id: 'Optimasi SEO',
      description_en: 'Advanced SEO optimization for better search engine rankings',
      description_id: 'Optimasi SEO lanjutan untuk peringkat search engine yang lebih baik',
      price_idr: 450000,
      price_usd: 30,
      image: 'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?ixlib=rb-4.0.3&auto=format&fit=crop&w=2074&q=80'
    }
  });

  const logoVariationsAddon = await prisma.addon.create({
    data: {
      categoryId: designCategory.id,
      name_en: 'Logo Variations',
      name_id: 'Variasi Logo',
      description_en: 'Additional logo variations and formats for different use cases',
      description_id: 'Variasi logo tambahan dan format untuk berbagai kebutuhan',
      price_idr: 300000,
      price_usd: 20,
      image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2071&q=80'
    }
  });

  const businessCardAddon = await prisma.addon.create({
    data: {
      categoryId: designCategory.id,
      name_en: 'Business Card Design',
      name_id: 'Desain Kartu Nama',
      description_en: 'Professional business card design matching your brand identity',
      description_id: 'Desain kartu nama profesional yang sesuai dengan identitas brand Anda',
      price_idr: 225000,
      price_usd: 15,
      image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2064&q=80'
    }
  });

  const socialMediaKitAddon = await prisma.addon.create({
    data: {
      categoryId: designCategory.id,
      name_en: 'Social Media Kit',
      name_id: 'Kit Media Sosial',
      description_en: 'Complete social media templates and assets for all major platforms',
      description_id: 'Template media sosial lengkap dan aset untuk semua platform utama',
      price_idr: 450000,
      price_usd: 30,
      image: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?ixlib=rb-4.0.3&auto=format&fit=crop&w=2339&q=80'
    }
  });

  const brandGuidelinesAddon = await prisma.addon.create({
    data: {
      categoryId: designCategory.id,
      name_en: 'Brand Guidelines',
      name_id: 'Panduan Brand',
      description_en: 'Comprehensive brand guidelines document with usage rules and standards',
      description_id: 'Dokumen panduan brand komprehensif dengan aturan penggunaan dan standar',
      price_idr: 600000,
      price_usd: 40,
      image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2064&q=80'
    }
  });

  const monthlyMaintenanceAddon = await prisma.addon.create({
    data: {
      categoryId: webDevCategory.id,
      name_en: 'Monthly Maintenance',
      name_id: 'Maintenance Bulanan',
      description_en: 'Monthly website maintenance, updates, and technical support',
      description_id: 'Maintenance website bulanan, update, dan dukungan teknis',
      price_idr: 375000,
      price_usd: 25,
      image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'
    }
  });

  // 6. Create WhatsApp API Packages
  console.log('💬 Creating WhatsApp packages...');
  
  const basicWhatsappPackage = await prisma.whatsappApiPackage.create({
    data: {
      name: 'WhatsApp Starter',
      description: 'Perfect for small businesses starting with WhatsApp automation',
      priceMonth: 150000,
      priceYear: 1500000,
      maxSession: 1
    }
  });

  const businessWhatsappPackage = await prisma.whatsappApiPackage.create({
    data: {
      name: 'WhatsApp Business',
      description: 'Ideal for growing businesses with higher message volumes',
      priceMonth: 500000,
      priceYear: 5000000,
      maxSession: 5
    }
  });

  const enterpriseWhatsappPackage = await prisma.whatsappApiPackage.create({
    data: {
      name: 'WhatsApp Enterprise',
      description: 'Enterprise-grade solution with unlimited sessions and priority support',
      priceMonth: 1500000,
      priceYear: 15000000,
      maxSession: 99
    }
  });

  // 7. Create Users
  console.log('👥 Creating users...');
  
  // Hash password for both users
  const hashedPassword = await bcrypt.hash('1234abcd', 12);
  
  // Create customer user
  const customerUser = await prisma.user.create({
    data: {
      name: 'M. Yoga Adi',
      email: 'm.yogaadi1234@gmail.com',
      phone: '081233784490',
      password: hashedPassword,
      role: 'customer',
      isActive: true,
      emailVerified: new Date(),
      phoneVerified: new Date()
    }
  });

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      name: 'Genfity Admin',
      email: 'genfity@gmail.com',
      phone: '081234567890',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      emailVerified: new Date(),
      phoneVerified: new Date()
    }
  });

  console.log('✅ Database seeding completed successfully!');
  
  // Print summary
  console.log('\n📊 Seeding Summary:');
  console.log(`🏷️  Categories: 3`);
  console.log(`📂 Subcategories: 7`);
  console.log(`📦 Packages: 5`);
  console.log(`🔧 Addons: 10`);
  console.log(`💬 WhatsApp Packages: 3`);
  console.log(`👥 Users: 2`);
  
  console.log('\n🎯 Categories Created:');
  console.log(`   • Web Development (${webDevCategory.id})`);
  console.log(`   • SEO Services (${seoCategory.id})`);
  console.log(`   • Design Services (${designCategory.id})`);
  
  console.log('\n📦 Sample Package IDs:');
  console.log(`   • Basic Landing Page: ${basicLandingPackage.id}`);
  console.log(`   • Premium Landing Page: ${premiumLandingPackage.id}`);
  console.log(`   • Basic E-Commerce: ${basicEcommercePackage.id}`);
  console.log(`   • Local SEO: ${localSeoPackage.id}`);
  console.log(`   • Logo Design: ${logoDesignPackage.id}`);

  console.log('\n🔧 Sample Addon IDs:');
  console.log(`   • Extra Page: ${extraPageAddon.id}`);
  console.log(`   • SSL Premium: ${sslPremiumAddon.id}`);
  console.log(`   • Private Server: ${privateServerAddon.id}`);

  console.log('\n💬 WhatsApp Package IDs:');
  console.log(`   • Starter: ${basicWhatsappPackage.id}`);
  console.log(`   • Business: ${businessWhatsappPackage.id}`);
  console.log(`   • Enterprise: ${enterpriseWhatsappPackage.id}`);

  console.log('\n👥 Test Users Created:');
  console.log(`   • Customer: m.yogaadi1234@gmail.com (${customerUser.id})`);
  console.log(`   • Admin: genfity@gmail.com (${adminUser.id})`);
  console.log(`   • Password: 1234abcd (for both users)`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
