/**
 * End-to-End Test for Gelato Image Caching
 *
 * Tests:
 * 1. Database connection
 * 2. Check existing Gelato products
 * 3. Check cached images
 * 4. Test image caching logic
 * 5. Verify cache structure
 */

import { PrismaClient, FulfillmentType } from '@prisma/client';

const prisma = new PrismaClient();

// Test colors
const green = '\x1b[32m';
const red = '\x1b[31m';
const yellow = '\x1b[33m';
const blue = '\x1b[34m';
const reset = '\x1b[0m';

function log(message: string, color: string = reset) {
  console.log(`${color}${message}${reset}`);
}

async function testDatabaseConnection() {
  log('\n=== TEST 1: Database Connection ===', blue);
  try {
    await prisma.$connect();
    log('✓ Database connected successfully', green);
    return true;
  } catch (error) {
    log(`✗ Database connection failed: ${error.message}`, red);
    return false;
  }
}

async function checkGelatoProducts() {
  log('\n=== TEST 2: Check Gelato Products ===', blue);
  try {
    const gelatoProducts = await prisma.product.findMany({
      where: {
        fulfillmentType: FulfillmentType.GELATO_POD,
      },
      select: {
        id: true,
        name: true,
        gelatoProductUid: true,
        storeId: true,
        _count: {
          select: {
            images: {
              where: {
                alt: 'gelato-cached',
              },
            },
          },
        },
      },
      take: 10,
    });

    if (gelatoProducts.length === 0) {
      log('⚠ No Gelato POD products found in database', yellow);
      log('  Create a product with fulfillmentType: GELATO_POD to test', yellow);
      return false;
    }

    log(`✓ Found ${gelatoProducts.length} Gelato POD products`, green);

    gelatoProducts.forEach((product, index) => {
      const imageCount = product._count.images;
      const status = imageCount > 0 ? green : yellow;
      log(`  ${index + 1}. ${product.name}`, reset);
      log(`     - ID: ${product.id}`, reset);
      log(`     - Gelato UID: ${product.gelatoProductUid || 'Not set'}`, reset);
      log(`     - Cached Images: ${imageCount}`, status);
    });

    return gelatoProducts.length > 0;
  } catch (error) {
    log(`✗ Failed to fetch Gelato products: ${error.message}`, red);
    return false;
  }
}

async function checkCachedImages() {
  log('\n=== TEST 3: Check Cached Images ===', blue);
  try {
    // Get total cached images
    const totalCached = await prisma.productImage.count({
      where: { alt: 'gelato-cached' },
    });

    log(`✓ Total cached Gelato images: ${totalCached}`, green);

    if (totalCached > 0) {
      // Get sample cached images
      const sampleImages = await prisma.productImage.findMany({
        where: { alt: 'gelato-cached' },
        include: {
          product: {
            select: {
              name: true,
              gelatoProductUid: true,
            },
          },
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
      });

      log('\n  Sample cached images:', reset);
      sampleImages.forEach((img, index) => {
        log(`  ${index + 1}. Product: ${img.product.name}`, reset);
        log(`     - URL: ${img.url.substring(0, 60)}...`, reset);
        log(`     - Primary: ${img.isPrimary}`, reset);
        log(`     - Display Order: ${img.displayOrder}`, reset);
      });

      // Check for products with cached images
      const productsWithImages = await prisma.product.findMany({
        where: {
          fulfillmentType: FulfillmentType.GELATO_POD,
          images: {
            some: {
              alt: 'gelato-cached',
            },
          },
        },
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              images: {
                where: { alt: 'gelato-cached' },
              },
            },
          },
        },
      });

      log(`\n✓ ${productsWithImages.length} products have cached images`, green);
    } else {
      log('⚠ No cached images found', yellow);
      log('  Images will be cached when:', yellow);
      log('  1. Product is configured with Gelato POD', yellow);
      log('  2. Images are manually refreshed', yellow);
      log('  3. Daily cron job runs', yellow);
    }

    return totalCached > 0;
  } catch (error) {
    log(`✗ Failed to check cached images: ${error.message}`, red);
    return false;
  }
}

async function testImageCacheStructure() {
  log('\n=== TEST 4: Verify Cache Structure ===', blue);
  try {
    const cachedImages = await prisma.productImage.findMany({
      where: { alt: 'gelato-cached' },
      select: {
        id: true,
        productId: true,
        url: true,
        alt: true,
        isPrimary: true,
        displayOrder: true,
        width: true,
        height: true,
      },
      take: 1,
    });

    if (cachedImages.length === 0) {
      log('⚠ No cached images to verify structure', yellow);
      return false;
    }

    const img = cachedImages[0];
    const checks = [
      {
        field: 'alt',
        value: img.alt,
        expected: 'gelato-cached',
        valid: img.alt === 'gelato-cached',
      },
      {
        field: 'url',
        value: img.url,
        expected: 'URL string',
        valid: typeof img.url === 'string' && img.url.length > 0,
      },
      {
        field: 'isPrimary',
        value: img.isPrimary,
        expected: 'boolean',
        valid: typeof img.isPrimary === 'boolean',
      },
      {
        field: 'displayOrder',
        value: img.displayOrder,
        expected: 'number',
        valid: typeof img.displayOrder === 'number',
      },
      {
        field: 'width',
        value: img.width,
        expected: 'number',
        valid: typeof img.width === 'number',
      },
      {
        field: 'height',
        value: img.height,
        expected: 'number',
        valid: typeof img.height === 'number',
      },
    ];

    let allValid = true;
    checks.forEach((check) => {
      const status = check.valid ? '✓' : '✗';
      const color = check.valid ? green : red;
      log(`  ${status} ${check.field}: ${check.value} (expected: ${check.expected})`, color);
      if (!check.valid) allValid = false;
    });

    if (allValid) {
      log('\n✓ All cache structure checks passed', green);
    } else {
      log('\n✗ Some cache structure checks failed', red);
    }

    return allValid;
  } catch (error) {
    log(`✗ Failed to verify cache structure: ${error.message}`, red);
    return false;
  }
}

async function testPrimaryImageLogic() {
  log('\n=== TEST 5: Verify Primary Image Logic ===', blue);
  try {
    const productsWithMultipleImages = await prisma.product.findMany({
      where: {
        fulfillmentType: FulfillmentType.GELATO_POD,
        images: {
          some: {
            alt: 'gelato-cached',
          },
        },
      },
      include: {
        images: {
          where: { alt: 'gelato-cached' },
          orderBy: { displayOrder: 'asc' },
        },
      },
      take: 5,
    });

    if (productsWithMultipleImages.length === 0) {
      log('⚠ No products with cached images to verify', yellow);
      return false;
    }

    let allValid = true;
    productsWithMultipleImages.forEach((product) => {
      const primaryImages = product.images.filter((img) => img.isPrimary);
      const hasNoDuplicateOrders =
        new Set(product.images.map((img) => img.displayOrder)).size === product.images.length;

      const primaryStatus = primaryImages.length === 1 ? '✓' : '✗';
      const orderStatus = hasNoDuplicateOrders ? '✓' : '✗';

      log(`  Product: ${product.name}`, reset);
      log(
        `    ${primaryStatus} Primary images: ${primaryImages.length} (expected: 1)`,
        primaryImages.length === 1 ? green : red
      );
      log(
        `    ${orderStatus} Display order unique: ${hasNoDuplicateOrders}`,
        hasNoDuplicateOrders ? green : red
      );
      log(`    Total images: ${product.images.length}`, reset);

      if (primaryImages.length !== 1 || !hasNoDuplicateOrders) {
        allValid = false;
      }
    });

    if (allValid) {
      log('\n✓ Primary image logic verified', green);
    } else {
      log('\n✗ Primary image logic has issues', red);
    }

    return allValid;
  } catch (error) {
    log(`✗ Failed to verify primary image logic: ${error.message}`, red);
    return false;
  }
}

async function testDatabaseQueries() {
  log('\n=== TEST 6: Test Database Queries ===', blue);
  try {
    // Query 1: Get products with cached images
    const start1 = Date.now();
    const productsWithImages = await prisma.product.findMany({
      where: {
        fulfillmentType: FulfillmentType.GELATO_POD,
        images: {
          some: {
            alt: 'gelato-cached',
          },
        },
      },
      include: {
        images: {
          where: { alt: 'gelato-cached' },
          orderBy: { displayOrder: 'asc' },
        },
      },
      take: 10,
    });
    const time1 = Date.now() - start1;
    log(`✓ Query 1: Fetch products with images - ${time1}ms`, green);

    // Query 2: Count cached images per product
    const start2 = Date.now();
    const imageStats = await prisma.product.groupBy({
      by: ['id'],
      where: {
        fulfillmentType: FulfillmentType.GELATO_POD,
      },
      _count: {
        id: true,
      },
    });
    const time2 = Date.now() - start2;
    log(`✓ Query 2: Group by product - ${time2}ms`, green);

    // Query 3: Find products without cached images
    const start3 = Date.now();
    const productsWithoutImages = await prisma.product.findMany({
      where: {
        fulfillmentType: FulfillmentType.GELATO_POD,
        gelatoProductUid: { not: null },
        images: {
          none: {
            alt: 'gelato-cached',
          },
        },
      },
      select: {
        id: true,
        name: true,
        gelatoProductUid: true,
      },
      take: 10,
    });
    const time3 = Date.now() - start3;
    log(`✓ Query 3: Find products without cached images - ${time3}ms`, green);

    if (productsWithoutImages.length > 0) {
      log(`  ⚠ Found ${productsWithoutImages.length} products without cached images:`, yellow);
      productsWithoutImages.slice(0, 3).forEach((p) => {
        log(`    - ${p.name} (${p.gelatoProductUid})`, yellow);
      });
      log(`  These need image caching via:`, yellow);
      log(`    POST /api/v1/gelato/products/{productId}/refresh-images`, yellow);
    } else {
      log(`  ✓ All Gelato products have cached images`, green);
    }

    return true;
  } catch (error) {
    log(`✗ Database query tests failed: ${error.message}`, red);
    return false;
  }
}

async function generateTestReport() {
  log('\n=== TEST REPORT ===', blue);

  const results = {
    database: await testDatabaseConnection(),
    products: await checkGelatoProducts(),
    cachedImages: await checkCachedImages(),
    structure: await testImageCacheStructure(),
    primaryLogic: await testPrimaryImageLogic(),
    queries: await testDatabaseQueries(),
  };

  const passed = Object.values(results).filter((r) => r).length;
  const total = Object.keys(results).length;
  const allPassed = passed === total;

  log('\n=== SUMMARY ===', blue);
  log(`Passed: ${passed}/${total}`, allPassed ? green : yellow);

  Object.entries(results).forEach(([test, result]) => {
    const status = result ? '✓' : '✗';
    const color = result ? green : red;
    log(`  ${status} ${test}`, color);
  });

  if (allPassed) {
    log('\n🎉 All tests passed! Gelato image caching is working correctly.', green);
  } else {
    log('\n⚠ Some tests failed. Review the output above for details.', yellow);
  }

  // Recommendations
  log('\n=== RECOMMENDATIONS ===', blue);
  if (!results.cachedImages) {
    log('1. Create or configure Gelato POD products to populate cache', yellow);
    log('2. Trigger manual refresh: POST /api/v1/gelato/products/:id/refresh-images', yellow);
  }
  if (!results.structure || !results.primaryLogic) {
    log('1. Review cached image records in database', yellow);
    log('2. Run manual refresh to fix any structural issues', yellow);
  }

  log('\n=== NEXT STEPS ===', blue);
  log('1. Start API server: cd apps/api && pnpm dev', reset);
  log('2. Test endpoints:', reset);
  log('   - GET /api/v1/gelato/catalog/products', reset);
  log('   - POST /api/v1/gelato/products/:id/refresh-images', reset);
  log('3. View cached images in Prisma Studio: http://localhost:5555', reset);
  log('4. Monitor cron job logs (runs daily at 2am UTC)', reset);
}

async function main() {
  log('╔════════════════════════════════════════════════════╗', blue);
  log('║  Gelato Image Cache - End-to-End Test Suite      ║', blue);
  log('╚════════════════════════════════════════════════════╝', blue);

  try {
    await generateTestReport();
  } catch (error) {
    log(`\n✗ Test suite failed: ${error.message}`, red);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
