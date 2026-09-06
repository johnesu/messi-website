import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'STORE_MANAGER',
  'INVENTORY_MANAGER',
  'ORDER_MANAGER',
  'CONTENT_EDITOR',
  'MARKETING_MANAGER',
  'WAREHOUSE_MANAGER',
  'CASHIER',
  'CUSTOMER',
] as const;

const PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ['*'],
  ADMIN: [
    'users.manage', 'settings.manage', 'products.*', 'orders.*', 'inventory.*',
    'cms.*', 'payments.*', 'customers.*', 'analytics.view',
  ],
  STORE_MANAGER: ['products.*', 'orders.view', 'orders.update', 'customers.view', 'analytics.view'],
  INVENTORY_MANAGER: ['inventory.*', 'products.view', 'warehouses.*', 'suppliers.*'],
  ORDER_MANAGER: ['orders.*', 'payments.refund'],
  CONTENT_EDITOR: ['cms.*', 'blog.*', 'media.*', 'pages.*'],
  MARKETING_MANAGER: ['coupons.*', 'promotions.*', 'campaigns.*', 'customers.view'],
  WAREHOUSE_MANAGER: ['inventory.adjust', 'warehouses.view', 'inventory.transfer'],
  CASHIER: ['pos.*', 'orders.create', 'orders.view'],
  CUSTOMER: ['profile.*', 'orders.view'],
};

const MONEY = (n: number) => Math.round(n * 100);

async function main() {
  console.log('Seeding database...');

  // Roles
  for (const role of ROLES) {
    await prisma.roleName.upsert({
      where: { name: role },
      update: {},
      create: { name: role },
    });
  }

  // Permissions from role map
  const permSet = new Set<string>();
  for (const perms of Object.values(PERMISSIONS)) {
    for (const p of perms.flatMap((x) => (x === '*' ? [] : [x]))) permSet.add(p);
  }
  for (const codename of permSet) {
    await prisma.permission.upsert({
      where: { codename },
      update: {},
      create: { name: codename, codename },
    });
  }

  // Assign permissions to roles
  for (const [role, perms] of Object.entries(PERMISSIONS)) {
    const roleRef = await prisma.roleName.findUnique({ where: { name: role } });
    await prisma.rolePermission.deleteMany({ where: { role } });
    if (!roleRef) continue;
    for (const p of perms) {
      if (p === '*') continue;
      const perm = await prisma.permission.findUnique({ where: { codename: p } });
      if (perm) {
        await prisma.rolePermission.upsert({
          where: { role_permissionId: { role, permissionId: perm.id } },
          update: {},
          create: { role, permissionId: perm.id },
        });
      }
    }
  }

  const hash = await bcrypt.hash('Admin@1234', 10);

  // Admin users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@mesi.test' },
    update: {},
    create: {
      email: 'admin@mesi.test',
      passwordHash: hash,
      firstName: 'Super',
      lastName: 'Admin',
      emailVerified: true,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_role: { userId: admin.id, role: 'SUPER_ADMIN' } },
    update: {},
    create: { userId: admin.id, role: 'SUPER_ADMIN' },
  });

  const storeManager = await prisma.user.upsert({
    where: { email: 'manager@mesi.test' },
    update: {},
    create: {
      email: 'manager@mesi.test',
      passwordHash: hash,
      firstName: 'Store',
      lastName: 'Manager',
      emailVerified: true,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_role: { userId: storeManager.id, role: 'STORE_MANAGER' } },
    update: {},
    create: { userId: storeManager.id, role: 'STORE_MANAGER' },
  });

  const inventoryManager = await prisma.user.upsert({
    where: { email: 'inventory@mesi.test' },
    update: {},
    create: {
      email: 'inventory@mesi.test',
      passwordHash: hash,
      firstName: 'Inventory',
      lastName: 'Manager',
      emailVerified: true,
    },
  });
  await prisma.userRole.upsert({
    where: { userId_role: { userId: inventoryManager.id, role: 'INVENTORY_MANAGER' } },
    update: {},
    create: { userId: inventoryManager.id, role: 'INVENTORY_MANAGER' },
  });

  // Customers
  const customerUsers: { email: string; first: string; last: string }[] = [
    { email: 'customer1@mesi.test', first: 'Ada', last: 'Okafor' },
    { email: 'customer2@mesi.test', first: 'Chidi', last: 'Eze' },
    { email: 'customer3@mesi.test', first: 'Ngozi', last: 'Adebayo' },
    { email: 'customer4@mesi.test', first: 'Emeka', last: 'Umeh' },
    { email: 'customer5@mesi.test', first: 'Blessing', last: 'Ibrahim' },
  ];

  const customers: { id: string; name: string }[] = [];
  for (const c of customerUsers) {
    const u = await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: {
        email: c.email,
        passwordHash: hash,
        firstName: c.first,
        lastName: c.last,
        emailVerified: true,
      },
    });
    await prisma.userRole.upsert({
      where: { userId_role: { userId: u.id, role: 'CUSTOMER' } },
      update: {},
      create: { userId: u.id, role: 'CUSTOMER' },
    });
    const cust = await prisma.customer.upsert({
      where: { userId: u.id },
      update: {},
      create: { userId: u.id, referralCode: `REF-${c.first.toUpperCase().slice(0, 3)}-${Math.floor(Math.random() * 9000 + 1000)}` },
    });
    customers.push({ id: cust.id, name: `${c.first} ${c.last}` });
  }

  // Warehouses
  const whMain = await prisma.warehouse.upsert({
    where: { code: 'WH-MAIN' },
    update: {},
    create: { name: 'Main Warehouse', code: 'WH-MAIN', type: 'WAREHOUSE', city: 'Lagos', state: 'Lagos', country: 'Nigeria' },
  });
  const whStore = await prisma.warehouse.upsert({
    where: { code: 'ST-ONLINE' },
    update: {},
    create: { name: 'Online Store', code: 'ST-ONLINE', type: 'STORE', city: 'Abuja', state: 'FCT', country: 'Nigeria' },
  });

  // Categories
  const categories = [
    { name: 'Electronics', slug: 'electronics', desc: 'Devices and gadgets' },
    { name: 'Fashion', slug: 'fashion', desc: 'Clothing and accessories' },
    { name: 'Home & Kitchen', slug: 'home-kitchen', desc: 'Home living essentials' },
    { name: 'Beauty', slug: 'beauty', desc: 'Beauty and personal care' },
    { name: 'Sports', slug: 'sports', desc: 'Sports and fitness' },
    { name: 'Books', slug: 'books', desc: 'Books and literature' },
  ];
  const catIds: Record<string, string> = {};
  for (const c of categories) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: { name: c.name, slug: c.slug, description: c.desc },
    });
    catIds[c.slug] = cat.id;
  }

  // Brands
  const brands = ['Acme', 'Globex', 'Technova', 'Lumen', 'Velta', 'Nova'];
  const brandIds: Record<string, string> = {};
  for (const b of brands) {
    const br = await prisma.brand.upsert({
      where: { slug: b.toLowerCase() },
      update: {},
      create: { name: b, slug: b.toLowerCase() },
    });
    brandIds[b] = br.id;
  }

  // Products
  const products = [
    { name: 'Wireless Bluetooth Headphones', slug: 'wireless-bluetooth-headphones', sku: 'MES-001', price: 25000, desc: 'Premium over-ear wireless headphones with active noise cancellation and 30-hour battery life.', cat: 'electronics', brand: 'Acme', featured: true },
    { name: 'Smart Fitness Tracker', slug: 'smart-fitness-tracker', sku: 'MES-002', price: 18000, desc: 'Track your steps, heart rate and sleep with this water-resistant smart band.', cat: 'electronics', brand: 'Technova', featured: true },
    { name: 'Classic Denim Jacket', slug: 'classic-denim-jacket', sku: 'MES-003', price: 32000, desc: 'Timeless denim jacket, medium weight, perfect for all seasons.', cat: 'fashion', brand: 'Velta', featured: true },
    { name: 'Stainless Steel Cookware Set', slug: 'stainless-steel-cookware-set', sku: 'MES-004', price: 45000, desc: '10-piece stainless steel cookware set with heat-resistant handles.', cat: 'home-kitchen', brand: 'Globex', featured: true },
    { name: 'Organic Face Serum', slug: 'organic-face-serum', sku: 'MES-005', price: 12000, desc: 'Vitamin C enriched face serum for radiant, glowing skin.', cat: 'beauty', brand: 'Lumen', featured: false },
    { name: 'Yoga Mat Premium', slug: 'yoga-mat-premium', sku: 'MES-006', price: 15000, desc: 'Non-slip eco-friendly yoga mat with alignment lines.', cat: 'sports', brand: 'Nova', featured: false },
    { name: 'Leather Crossbody Bag', slug: 'leather-crossbody-bag', sku: 'MES-007', price: 28000, desc: 'Genuine leather crossbody bag with adjustable strap.', cat: 'fashion', brand: 'Velta', featured: true },
    { name: 'Espresso Coffee Maker', slug: 'espresso-coffee-maker', sku: 'MES-008', price: 55000, desc: '15-bar pressure espresso machine with milk frother.', cat: 'home-kitchen', brand: 'Globex', featured: false },
  ];

  const productIds: Record<string, string> = {};
  for (const p of products) {
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    let prod;
    if (existing) {
      prod = existing;
    } else {
      prod = await prisma.product.create({
        data: {
          name: p.name,
          slug: p.slug,
          sku: p.sku,
          description: p.desc,
          shortDescription: p.desc,
          price: MONEY(p.price),
          status: 'ACTIVE',
          featured: p.featured,
          brandId: brandIds[p.brand],
          images: {
            create: [
              { url: `https://picsum.photos/seed/${p.slug}/600/600`, alt: p.name, position: 0 },
            ],
          },
          variants: {
            create: [
              { sku: p.sku, price: MONEY(p.price), stock: 50, attributes: {}, isDefault: true },
            ],
          },
        },
      });
    }
    productIds[p.slug] = prod.id;

    await prisma.productCategory.upsert({
      where: { productId_categoryId: { productId: prod.id, categoryId: catIds[p.cat] } },
      update: {},
      create: { productId: prod.id, categoryId: catIds[p.cat] },
    });

    // Inventory at main warehouse
    const variant = await prisma.productVariant.findFirst({ where: { productId: prod.id } });
    if (variant) {
      const existingInv = await prisma.inventory.findUnique({
        where: { productId_variantId_warehouseId: { productId: prod.id, variantId: variant.id, warehouseId: whMain.id } },
      });
      if (!existingInv) {
        await prisma.inventory.create({
          data: {
            productId: prod.id,
            variantId: variant.id,
            warehouseId: whMain.id,
            quantity: 50,
            reserved: 0,
            lowStockThreshold: 5,
            transactions: {
              create: [{ type: 'PURCHASE', quantity: 50, beforeQty: 0, afterQty: 50, reason: 'Initial stock' }],
            },
          },
        });
      }
    }
  }

  // Coupons
  const promoCode = 'WELCOME10';
  const existingCoupon = await prisma.coupon.findUnique({ where: { code: promoCode } });
  if (!existingCoupon) {
    await prisma.coupon.create({
      data: {
        code: promoCode,
        type: 'PERCENTAGE',
        value: 10,
        minOrderAmount: MONEY(5000),
        isActive: true,
      },
    });
  }
  const shipCode = 'FREESHIP';
  if (!(await prisma.coupon.findUnique({ where: { code: shipCode } }))) {
    await prisma.coupon.create({
      data: { code: shipCode, type: 'FREE_SHIPPING', value: 100, isActive: true },
    });
  }

  // Shipping zone + method
  const zone = await prisma.shippingZone.upsert({
    where: { name: 'Nigeria Nationwide' },
    update: {},
    create: { name: 'Nigeria Nationwide', countries: ['Nigeria'] },
  });
  await prisma.shippingMethod.upsert({
    where: {
      name_zoneId: { name: 'Standard Delivery', zoneId: zone.id },
    },
    update: {},
    create: {
      zoneId: zone.id,
      name: 'Standard Delivery',
      type: 'FLAT',
      price: MONEY(2500),
      etaDays: 3,
      isActive: true,
    },
  });
  await prisma.shippingMethod.upsert({
    where: { name_zoneId: { name: 'Express Delivery', zoneId: zone.id } },
    update: {},
    create: {
      zoneId: zone.id,
      name: 'Express Delivery',
      type: 'FLAT',
      price: MONEY(5000),
      etaDays: 1,
      isActive: true,
    },
  });

  // Blog
  const blogCat = await prisma.blogCategory.upsert({
    where: { slug: 'shopping-tips' },
    update: {},
    create: { name: 'Shopping Tips', slug: 'shopping-tips' },
  });
  await prisma.blogPost.upsert({
    where: { slug: 'how-to-choose-the-perfect-headphones' },
    update: {},
    create: {
      title: 'How to Choose the Perfect Wireless Headphones',
      slug: 'how-to-choose-the-perfect-headphones',
      excerpt: 'A practical guide to picking headphones that match your lifestyle.',
      content: 'Choosing the right headphones can transform your daily experience. Consider sound quality, battery life, comfort and connectivity before you buy.',
      status: 'PUBLISHED',
      categoryId: blogCat.id,
      tags: ['audio', 'electronics', 'guide'],
      authorId: storeManager.id,
      publishedAt: new Date(),
    },
  });

  // Sample order for dashboard
  const sampleOrder = await prisma.order.findFirst({ where: { orderNumber: 'MESI-1001' } });
  if (!sampleOrder && customers[0]) {
    const cu = await prisma.user.findUnique({ where: { email: customerUsers[0].email } });
    const variant = await prisma.productVariant.findFirst({ where: { productId: productIds['wireless-bluetooth-headphones'] } });
    const prod = await prisma.product.findUnique({ where: { id: productIds['wireless-bluetooth-headphones'] } });
    if (cu && variant && prod) {
      await prisma.order.create({
        data: {
          orderNumber: 'MESI-1001',
          userId: cu.id,
          customerEmail: cu.email,
          customerFirstName: cu.firstName,
          customerLastName: cu.lastName,
          status: 'PROCESSING',
          paymentStatus: 'SUCCESSFUL',
          currency: 'NGN',
          subtotal: prod.price,
          discount: 0,
          shipping: MONEY(2500),
          tax: Math.round(prod.price * 0.075),
          total: prod.price + MONEY(2500) + Math.round(prod.price * 0.075),
          items: {
            create: [
              {
                productId: prod.id,
                variantId: variant.id,
                productName: prod.name,
                unitPrice: prod.price,
                quantity: 1,
                lineTotal: prod.price,
              },
            ],
          },
        },
      });
    }
  }

  // Site settings
  const settings: [string, unknown, string][] = [
    ['store.name', 'MESI Marketplace', 'general'],
    ['store.email', 'hello@mesi.local', 'contact'],
    ['store.phone', '+234 800 000 0000', 'contact'],
    ['store.address', '12 Marina Street, Lagos', 'contact'],
    ['store.currency', 'NGN', 'general'],
    ['store.taxRate', 0.075, 'tax'],
    ['store.logo', '', 'branding'],
    ['seo.title', 'MESI Marketplace - Premium Shopping', 'seo'],
    ['seo.description', 'Shop premium electronics, fashion and home essentials at MESI.', 'seo'],
    ['social.instagram', 'https://instagram.com/mesi', 'social'],
    ['social.twitter', 'https://twitter.com/mesi', 'social'],
    ['social.facebook', 'https://facebook.com/mesi', 'social'],
    ['checkout.guestCheckout', true, 'checkout'],
    ['inventory.lowStockThreshold', 5, 'inventory'],
    ['theme.primaryColor', '#0f172a', 'theme'],
    ['theme.secondaryColor', '#f59e0b', 'theme'],
  ];
  for (const [key, value, group] of settings) {
    const exists = await prisma.siteSettings.findUnique({ where: { key } });
    if (!exists) {
      await prisma.siteSettings.create({ data: { key, value: value as never, group } });
    }
  }

  console.log('Seeding complete.');
  console.log('  Admin login: admin@mesi.test / Admin@1234');
  console.log('  Manager login: manager@mesi.test / Admin@1234');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
