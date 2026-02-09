import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../database/prisma.service';
import { ProductsModule } from './products.module';
import { AuthModule } from '../auth/auth.module';
import { JwtService } from '@nestjs/jwt';

/**
 * Comprehensive Product CRUD Test Suite
 * Tests both Seller and Admin product operations
 *
 * Run with: pnpm test products.crud.spec.ts
 */
describe('Product CRUD Operations (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  // Test users
  let sellerToken: string;
  let adminToken: string;
  let sellerId: string;
  let adminId: string;
  let storeId: string;

  // Test data
  let createdProductId: string;
  let createdProductSlug: string;
  let categoryId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ProductsModule, AuthModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    jwtService = app.get<JwtService>(JwtService);

    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();
    await app.close();
  });

  /**
   * Setup test users and dependencies
   */
  async function setupTestData() {
    // Create test seller
    const seller = await prisma.user.create({
      data: {
        email: 'test-seller@nextpik.test',
        password: 'hashed_password',
        firstName: 'Test',
        lastName: 'Seller',
        role: 'SELLER',
        emailVerified: true,
      },
    });
    sellerId = seller.id;

    // Create seller's store
    const store = await prisma.store.create({
      data: {
        userId: sellerId,
        name: 'Test Store',
        slug: 'test-store',
        email: seller.email,
        status: 'ACTIVE',
      },
    });
    storeId = store.id;

    // Create test admin
    const admin = await prisma.user.create({
      data: {
        email: 'test-admin@nextpik.test',
        password: 'hashed_password',
        firstName: 'Test',
        lastName: 'Admin',
        role: 'ADMIN',
        emailVerified: true,
      },
    });
    adminId = admin.id;

    // Create test category
    const category = await prisma.category.create({
      data: {
        name: 'Test Category',
        slug: 'test-category',
      },
    });
    categoryId = category.id;

    // Generate JWT tokens
    sellerToken = jwtService.sign({ sub: sellerId, email: seller.email, role: 'SELLER' });
    adminToken = jwtService.sign({ sub: adminId, email: admin.email, role: 'ADMIN' });
  }

  /**
   * Cleanup test data
   */
  async function cleanupTestData() {
    await prisma.product.deleteMany({ where: { storeId } });
    await prisma.store.deleteMany({ where: { userId: sellerId } });
    await prisma.user.deleteMany({ where: { id: { in: [sellerId, adminId] } } });
    await prisma.category.deleteMany({ where: { id: categoryId } });
  }

  // ==================== SELLER TESTS ====================

  describe('Seller Product Operations', () => {
    describe('POST /seller/products (Create)', () => {
      it('should create a product with all required fields', async () => {
        const productData = {
          name: 'Test Product 1',
          slug: 'test-product-1',
          description: 'This is a test product',
          price: 99.99,
          inventory: 10,
          status: 'ACTIVE',
          productType: 'PHYSICAL',
          purchaseType: 'INSTANT',
        };

        const response = await request(app.getHttpServer())
          .post('/seller/products')
          .set('Authorization', `Bearer ${sellerToken}`)
          .send(productData)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe(productData.name);
        expect(response.body.sku).toBeDefined(); // Auto-generated
        expect(response.body.storeId).toBe(storeId);

        createdProductId = response.body.id;
        createdProductSlug = response.body.slug;
      });

      it('should create a product without category (optional)', async () => {
        const productData = {
          name: 'Test Product No Category',
          slug: 'test-product-no-category',
          description: 'Product without category',
          price: 49.99,
          inventory: 5,
          // categoryId: '' // Empty string should be cleaned up
        };

        const response = await request(app.getHttpServer())
          .post('/seller/products')
          .set('Authorization', `Bearer ${sellerToken}`)
          .send(productData)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.categoryId).toBeNull();
      });

      it('should create a product with category', async () => {
        const productData = {
          name: 'Test Product With Category',
          slug: 'test-product-with-category',
          description: 'Product with category',
          price: 79.99,
          inventory: 8,
          categoryId: categoryId,
        };

        const response = await request(app.getHttpServer())
          .post('/seller/products')
          .set('Authorization', `Bearer ${sellerToken}`)
          .send(productData)
          .expect(201);

        expect(response.body.categoryId).toBe(categoryId);
      });

      it('should reject product with missing required fields', async () => {
        const productData = {
          name: 'Incomplete Product',
          // Missing: slug, description, price
        };

        const response = await request(app.getHttpServer())
          .post('/seller/products')
          .set('Authorization', `Bearer ${sellerToken}`)
          .send(productData)
          .expect(400);

        expect(response.body.message).toBeDefined();
      });

      it('should reject product with negative price', async () => {
        const productData = {
          name: 'Negative Price Product',
          slug: 'negative-price',
          description: 'Invalid price',
          price: -10,
          inventory: 5,
        };

        const response = await request(app.getHttpServer())
          .post('/seller/products')
          .set('Authorization', `Bearer ${sellerToken}`)
          .send(productData)
          .expect(400);
      });

      it('should auto-generate SKU in correct format', async () => {
        const productData = {
          name: 'SKU Test Product',
          slug: 'sku-test-product',
          description: 'Testing SKU generation',
          price: 29.99,
          inventory: 3,
        };

        const response = await request(app.getHttpServer())
          .post('/seller/products')
          .set('Authorization', `Bearer ${sellerToken}`)
          .send(productData)
          .expect(201);

        // SKU format: NEXTPIK-MM-DD-XXXX
        expect(response.body.sku).toMatch(/^NEXTPIK-\d{2}-\d{2}-\d{4}$/);
      });
    });

    describe('GET /seller/products (Read)', () => {
      it('should list all seller products', async () => {
        const response = await request(app.getHttpServer())
          .get('/seller/products')
          .set('Authorization', `Bearer ${sellerToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        // All products should belong to this seller's store
        response.body.forEach((product: any) => {
          expect(product.storeId).toBe(storeId);
        });
      });

      it('should filter products by status', async () => {
        const response = await request(app.getHttpServer())
          .get('/seller/products?status=ACTIVE')
          .set('Authorization', `Bearer ${sellerToken}`)
          .expect(200);

        response.body.forEach((product: any) => {
          expect(product.status).toBe('ACTIVE');
        });
      });

      it('should paginate products', async () => {
        const response = await request(app.getHttpServer())
          .get('/seller/products?limit=2&offset=0')
          .set('Authorization', `Bearer ${sellerToken}`)
          .expect(200);

        expect(response.body.length).toBeLessThanOrEqual(2);
      });
    });

    describe('GET /seller/products/:id (Read One)', () => {
      it('should get a single product by ID', async () => {
        const response = await request(app.getHttpServer())
          .get(`/seller/products/${createdProductId}`)
          .set('Authorization', `Bearer ${sellerToken}`)
          .expect(200);

        expect(response.body.id).toBe(createdProductId);
        expect(response.body.storeId).toBe(storeId);
      });

      it('should return 404 for non-existent product', async () => {
        await request(app.getHttpServer())
          .get('/seller/products/non-existent-id')
          .set('Authorization', `Bearer ${sellerToken}`)
          .expect(404);
      });
    });

    describe('PATCH /seller/products/:id (Update)', () => {
      it('should update product details', async () => {
        const updateData = {
          name: 'Updated Product Name',
          price: 149.99,
          inventory: 20,
        };

        const response = await request(app.getHttpServer())
          .patch(`/seller/products/${createdProductId}`)
          .set('Authorization', `Bearer ${sellerToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.name).toBe(updateData.name);
        expect(Number(response.body.price)).toBe(updateData.price);
        expect(response.body.inventory).toBe(updateData.inventory);
      });

      it('should update product status', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/seller/products/${createdProductId}`)
          .set('Authorization', `Bearer ${sellerToken}`)
          .send({ status: 'DRAFT' })
          .expect(200);

        expect(response.body.status).toBe('DRAFT');
      });

      it('should reject update with invalid data', async () => {
        await request(app.getHttpServer())
          .patch(`/seller/products/${createdProductId}`)
          .set('Authorization', `Bearer ${sellerToken}`)
          .send({ price: -50 })
          .expect(400);
      });
    });

    describe('DELETE /seller/products/:id (Delete)', () => {
      let productToDelete: string;

      beforeAll(async () => {
        // Create a product specifically for deletion test
        const product = await prisma.product.create({
          data: {
            name: 'Product to Delete',
            slug: 'product-to-delete-' + Date.now(),
            description: 'Will be deleted',
            price: 10,
            inventory: 1,
            storeId: storeId,
            sku: 'DELETE-TEST-' + Date.now(),
          },
        });
        productToDelete = product.id;
      });

      it('should delete a product', async () => {
        await request(app.getHttpServer())
          .delete(`/seller/products/${productToDelete}`)
          .set('Authorization', `Bearer ${sellerToken}`)
          .expect(200);

        // Verify product is deleted
        const product = await prisma.product.findUnique({
          where: { id: productToDelete },
        });
        expect(product).toBeNull();
      });

      it('should return 404 when deleting non-existent product', async () => {
        await request(app.getHttpServer())
          .delete('/seller/products/non-existent-id')
          .set('Authorization', `Bearer ${sellerToken}`)
          .expect(404);
      });
    });
  });

  // ==================== ADMIN TESTS ====================

  describe('Admin Product Operations', () => {
    let adminCreatedProductId: string;

    describe('POST /products (Admin Create)', () => {
      it('should allow admin to create product without store', async () => {
        const productData = {
          name: 'Admin Created Product',
          slug: 'admin-created-product',
          description: 'Created by admin',
          price: 199.99,
          inventory: 15,
          status: 'ACTIVE',
          // No storeId - admin products can be independent
        };

        const response = await request(app.getHttpServer())
          .post('/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(productData)
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe(productData.name);
        adminCreatedProductId = response.body.id;
      });
    });

    describe('GET /products (Admin Read)', () => {
      it('should list all products (including seller products)', async () => {
        const response = await request(app.getHttpServer())
          .get('/products')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
        // Should include both seller and admin products
        expect(response.body.length).toBeGreaterThan(0);
      });

      it('should filter products by store', async () => {
        const response = await request(app.getHttpServer())
          .get(`/products?storeId=${storeId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        response.body.forEach((product: any) => {
          expect(product.storeId).toBe(storeId);
        });
      });
    });

    describe('PATCH /products/:id (Admin Update)', () => {
      it('should allow admin to update any product', async () => {
        // Update a seller's product
        const response = await request(app.getHttpServer())
          .patch(`/products/${createdProductId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ featured: true })
          .expect(200);

        expect(response.body.featured).toBe(true);
      });

      it('should allow admin to update admin-created product', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/products/${adminCreatedProductId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ price: 249.99 })
          .expect(200);

        expect(Number(response.body.price)).toBe(249.99);
      });
    });

    describe('DELETE /products/:id (Admin Delete)', () => {
      it('should allow admin to delete any product', async () => {
        await request(app.getHttpServer())
          .delete(`/products/${adminCreatedProductId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        // Verify deletion
        const product = await prisma.product.findUnique({
          where: { id: adminCreatedProductId },
        });
        expect(product).toBeNull();
      });
    });

    describe('Bulk Operations (Admin Only)', () => {
      let bulkTestProductIds: string[] = [];

      beforeAll(async () => {
        // Create multiple products for bulk testing
        const products = await Promise.all([
          prisma.product.create({
            data: {
              name: 'Bulk Test 1',
              slug: 'bulk-test-1-' + Date.now(),
              description: 'Bulk test',
              price: 10,
              inventory: 5,
              storeId: storeId,
              sku: 'BULK-1-' + Date.now(),
            },
          }),
          prisma.product.create({
            data: {
              name: 'Bulk Test 2',
              slug: 'bulk-test-2-' + Date.now(),
              description: 'Bulk test',
              price: 20,
              inventory: 5,
              storeId: storeId,
              sku: 'BULK-2-' + Date.now(),
            },
          }),
        ]);
        bulkTestProductIds = products.map((p) => p.id);
      });

      it('should bulk update product status', async () => {
        const response = await request(app.getHttpServer())
          .post('/products/bulk-update-status')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            productIds: bulkTestProductIds,
            status: 'INACTIVE',
          })
          .expect(200);

        // Verify all products updated
        const products = await prisma.product.findMany({
          where: { id: { in: bulkTestProductIds } },
        });
        products.forEach((product) => {
          expect(product.status).toBe('INACTIVE');
        });
      });

      it('should bulk delete products', async () => {
        await request(app.getHttpServer())
          .post('/products/bulk-delete')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ productIds: bulkTestProductIds })
          .expect(200);

        // Verify deletion
        const products = await prisma.product.findMany({
          where: { id: { in: bulkTestProductIds } },
        });
        expect(products.length).toBe(0);
      });
    });
  });

  // ==================== EDGE CASES & SECURITY ====================

  describe('Security & Authorization', () => {
    it('should reject unauthorized requests', async () => {
      await request(app.getHttpServer()).get('/seller/products').expect(401);
    });

    it('should prevent seller from accessing other seller products', async () => {
      // Create another seller
      const otherSeller = await prisma.user.create({
        data: {
          email: 'other-seller@nextpik.test',
          password: 'hashed',
          firstName: 'Other',
          lastName: 'Seller',
          role: 'SELLER',
          emailVerified: true,
        },
      });

      const otherStore = await prisma.store.create({
        data: {
          userId: otherSeller.id,
          name: 'Other Store',
          slug: 'other-store',
          email: otherSeller.email,
          status: 'ACTIVE',
        },
      });

      const otherSellerToken = jwtService.sign({
        sub: otherSeller.id,
        email: otherSeller.email,
        role: 'SELLER',
      });

      // Try to access first seller's product
      await request(app.getHttpServer())
        .get(`/seller/products/${createdProductId}`)
        .set('Authorization', `Bearer ${otherSellerToken}`)
        .expect(404); // Should not find product from different store

      // Cleanup
      await prisma.store.delete({ where: { id: otherStore.id } });
      await prisma.user.delete({ where: { id: otherSeller.id } });
    });

    it('should reject invalid JWT tokens', async () => {
      await request(app.getHttpServer())
        .get('/seller/products')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('Data Validation Edge Cases', () => {
    it('should handle empty string categoryId correctly', async () => {
      const productData = {
        name: 'Empty Category Test',
        slug: 'empty-category-test',
        description: 'Testing empty category',
        price: 39.99,
        inventory: 5,
        categoryId: '', // Empty string should be cleaned up
      };

      const response = await request(app.getHttpServer())
        .post('/seller/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(productData)
        .expect(201);

      expect(response.body.categoryId).toBeNull();
    });

    it('should handle very long product names', async () => {
      const longName = 'A'.repeat(500);
      const productData = {
        name: longName,
        slug: 'long-name-test',
        description: 'Long name test',
        price: 19.99,
        inventory: 1,
      };

      const response = await request(app.getHttpServer())
        .post('/seller/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(productData);

      // Should either accept or reject with clear error
      expect([201, 400]).toContain(response.status);
    });

    it('should handle special characters in product data', async () => {
      const productData = {
        name: 'Product with "quotes" & <tags>',
        slug: 'special-chars-test',
        description: 'Testing special chars: @#$%^&*()',
        price: 29.99,
        inventory: 3,
      };

      const response = await request(app.getHttpServer())
        .post('/seller/products')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(productData)
        .expect(201);

      expect(response.body.name).toBe(productData.name);
    });
  });
});
