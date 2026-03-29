import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import { createReadStream } from 'fs';
import { join } from 'path';

const API_URL = 'http://localhost:4000/api/v1';

export interface TestResult {
  test: string;
  status: 'pass' | 'fail' | 'warn' | 'skip';
  message?: string;
  duration?: number;
  error?: any;
}

export function pass(test: string, message?: string, duration?: number): TestResult {
  return { test, status: 'pass', message, duration };
}

export function fail(test: string, message: string, error?: any, duration?: number): TestResult {
  return { test, status: 'fail', message, error, duration };
}

export function warn(test: string, message: string, duration?: number): TestResult {
  return { test, status: 'warn', message, duration };
}

export function skip(test: string, message: string): TestResult {
  return { test, status: 'skip', message };
}

interface Tokens {
  buyerToken?: string;
  sellerToken?: string;
  adminToken?: string;
}

export class ProductAgent {
  private client: AxiosInstance;
  private tokens: Tokens;
  private createdProductId?: string;
  private createdProductSlug?: string;
  private testCategoryId?: string;

  constructor(tokens: Tokens = {}) {
    this.client = axios.create({
      baseURL: API_URL,
      validateStatus: () => true, // Don't throw on any status
    });
    this.tokens = tokens;
  }

  async runAll(): Promise<TestResult[]> {
    const results: TestResult[] = [];

    // Run tests in sequence
    results.push(await this.testGetProducts());
    results.push(await this.testGetFeaturedProducts());
    results.push(await this.testGetTrendingProducts());
    results.push(await this.testGetCategories());
    results.push(await this.testSearchProducts());
    results.push(await this.testFilterByCategory());
    results.push(await this.testFilterByPriceRange());
    results.push(await this.testPaginationProducts());
    results.push(await this.testCreateProduct());
    results.push(await this.testGetProductBySlug());
    results.push(await this.testUpdateProduct());
    results.push(await this.testGetSellerProducts());
    results.push(await this.testUploadProductImage());
    results.push(await this.testUpdateInventory());
    results.push(await this.testCreateProductUnauth());
    results.push(await this.testCreateProductBuyer());
    results.push(await this.testInvalidProductData());

    return results;
  }

  async testGetProducts(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.get('/products');

      if (response.status === 200) {
        if (Array.isArray(response.data) || Array.isArray(response.data.data)) {
          const products = Array.isArray(response.data) ? response.data : response.data.data;
          return pass('Get Products', `Retrieved ${products.length} products`, Date.now() - start);
        } else {
          return warn('Get Products', 'Response is not an array', Date.now() - start);
        }
      } else {
        return fail(
          'Get Products',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Get Products', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testGetFeaturedProducts(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.get('/products?featured=true');

      if (response.status === 200) {
        const products = Array.isArray(response.data) ? response.data : response.data.data;
        return pass(
          'Get Featured Products',
          `Retrieved ${products?.length || 0} featured products`,
          Date.now() - start
        );
      } else {
        return fail(
          'Get Featured Products',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Get Featured Products', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testGetTrendingProducts(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.get('/products?trending=true');

      if (response.status === 200) {
        const products = Array.isArray(response.data) ? response.data : response.data.data;
        return pass(
          'Get Trending Products',
          `Retrieved ${products?.length || 0} trending products`,
          Date.now() - start
        );
      } else {
        return fail(
          'Get Trending Products',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Get Trending Products', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testGetCategories(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.get('/categories');

      if (response.status === 200) {
        const categories = Array.isArray(response.data) ? response.data : response.data.data;
        if (categories && categories.length > 0) {
          this.testCategoryId = categories[0].id;
          return pass(
            'Get Categories',
            `Retrieved ${categories.length} categories`,
            Date.now() - start
          );
        } else {
          return warn('Get Categories', 'No categories found', Date.now() - start);
        }
      } else {
        return fail(
          'Get Categories',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Get Categories', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testSearchProducts(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.get('/products?search=luxury');

      if (response.status === 200) {
        const products = Array.isArray(response.data) ? response.data : response.data.data;
        return pass(
          'Search Products',
          `Found ${products?.length || 0} products matching "luxury"`,
          Date.now() - start
        );
      } else {
        return fail(
          'Search Products',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Search Products', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testFilterByCategory(): Promise<TestResult> {
    const start = Date.now();
    if (!this.testCategoryId) {
      return skip('Filter by Category', 'No category ID available');
    }

    try {
      const response = await this.client.get(`/products?categoryId=${this.testCategoryId}`);

      if (response.status === 200) {
        const products = Array.isArray(response.data) ? response.data : response.data.data;
        return pass(
          'Filter by Category',
          `Found ${products?.length || 0} products in category`,
          Date.now() - start
        );
      } else {
        return fail(
          'Filter by Category',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Filter by Category', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testFilterByPriceRange(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.get('/products?minPrice=10&maxPrice=1000');

      if (response.status === 200) {
        const products = Array.isArray(response.data) ? response.data : response.data.data;
        return pass(
          'Filter by Price Range',
          `Found ${products?.length || 0} products in price range`,
          Date.now() - start
        );
      } else {
        return fail(
          'Filter by Price Range',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Filter by Price Range', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testPaginationProducts(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.get('/products?page=1&limit=5');

      if (response.status === 200) {
        const products = Array.isArray(response.data) ? response.data : response.data.data;
        if (products && products.length <= 5) {
          return pass(
            'Pagination Products',
            `Retrieved ${products.length} products (limit 5)`,
            Date.now() - start
          );
        } else {
          return warn(
            'Pagination Products',
            'Pagination may not be working correctly',
            Date.now() - start
          );
        }
      } else {
        return fail(
          'Pagination Products',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Pagination Products', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testCreateProduct(): Promise<TestResult> {
    const start = Date.now();
    if (!this.tokens.sellerToken) {
      return skip('Create Product', 'No seller token available');
    }

    try {
      const productData = {
        name: `Test Product ${Date.now()}`,
        description: 'This is a test product created by automated tests',
        price: 99.99,
        inventory: 50,
        categoryId: this.testCategoryId || undefined,
        sku: `TEST-SKU-${Date.now()}`,
        fulfillmentType: 'SELF_FULFILLMENT',
      };

      const response = await this.client.post('/products', productData, {
        headers: {
          Authorization: `Bearer ${this.tokens.sellerToken}`,
        },
      });

      if (response.status === 201 || response.status === 200) {
        this.createdProductId = response.data.id;
        this.createdProductSlug = response.data.slug;
        return pass(
          'Create Product',
          `Product created with ID: ${this.createdProductId}`,
          Date.now() - start
        );
      } else {
        return fail(
          'Create Product',
          `Expected 201, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Create Product', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testGetProductBySlug(): Promise<TestResult> {
    const start = Date.now();
    if (!this.createdProductSlug) {
      return skip('Get Product by Slug', 'No product slug available');
    }

    try {
      const response = await this.client.get(`/products/${this.createdProductSlug}`);

      if (response.status === 200) {
        if (response.data.slug === this.createdProductSlug) {
          return pass('Get Product by Slug', 'Product retrieved successfully', Date.now() - start);
        } else {
          return warn('Get Product by Slug', 'Product slug mismatch', Date.now() - start);
        }
      } else {
        return fail(
          'Get Product by Slug',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Get Product by Slug', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testUpdateProduct(): Promise<TestResult> {
    const start = Date.now();
    if (!this.tokens.sellerToken || !this.createdProductId) {
      return skip('Update Product', 'No seller token or product ID available');
    }

    try {
      const response = await this.client.patch(
        `/products/${this.createdProductId}`,
        {
          price: 149.99,
          description: 'Updated test product description',
        },
        {
          headers: {
            Authorization: `Bearer ${this.tokens.sellerToken}`,
          },
        }
      );

      if (response.status === 200) {
        if (response.data.price === 149.99 || response.data.price === '149.99') {
          return pass('Update Product', 'Product updated successfully', Date.now() - start);
        } else {
          return warn('Update Product', 'Price may not have been updated', Date.now() - start);
        }
      } else {
        return fail(
          'Update Product',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Update Product', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testGetSellerProducts(): Promise<TestResult> {
    const start = Date.now();
    if (!this.tokens.sellerToken) {
      return skip('Get Seller Products', 'No seller token available');
    }

    try {
      const response = await this.client.get('/seller/products', {
        headers: {
          Authorization: `Bearer ${this.tokens.sellerToken}`,
        },
      });

      if (response.status === 200) {
        const products = Array.isArray(response.data) ? response.data : response.data.data;
        return pass(
          'Get Seller Products',
          `Retrieved ${products?.length || 0} seller products`,
          Date.now() - start
        );
      } else {
        return fail(
          'Get Seller Products',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Get Seller Products', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testUploadProductImage(): Promise<TestResult> {
    const start = Date.now();
    if (!this.tokens.sellerToken || !this.createdProductId) {
      return skip('Upload Product Image', 'No seller token or product ID available');
    }

    try {
      // Try to find a test image, skip if not available
      const testImagePath = join(process.cwd(), 'test', 'fixtures', 'test-image.jpg');

      // For now, skip this test as we don't have a test image
      return skip('Upload Product Image', 'Test image not available (implement fixture setup)');

      // Uncomment when test fixtures are available:
      /*
      const form = new FormData();
      form.append('file', createReadStream(testImagePath));
      form.append('productId', this.createdProductId);

      const response = await this.client.post('/upload/product', form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${this.tokens.sellerToken}`,
        },
      });

      if (response.status === 200 || response.status === 201) {
        return pass('Upload Product Image', 'Image uploaded successfully', Date.now() - start);
      } else {
        return fail(
          'Upload Product Image',
          `Expected 200 or 201, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
      */
    } catch (error: any) {
      return fail('Upload Product Image', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testUpdateInventory(): Promise<TestResult> {
    const start = Date.now();
    if (!this.tokens.sellerToken || !this.createdProductId) {
      return skip('Update Inventory', 'No seller token or product ID available');
    }

    try {
      const response = await this.client.patch(
        `/products/${this.createdProductId}/inventory`,
        {
          inventory: 100,
        },
        {
          headers: {
            Authorization: `Bearer ${this.tokens.sellerToken}`,
          },
        }
      );

      if (response.status === 200) {
        return pass('Update Inventory', 'Inventory updated successfully', Date.now() - start);
      } else {
        return fail(
          'Update Inventory',
          `Expected 200, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Update Inventory', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testCreateProductUnauth(): Promise<TestResult> {
    const start = Date.now();
    try {
      const response = await this.client.post('/products', {
        name: 'Unauthorized Product',
        description: 'This should fail',
        price: 99.99,
        inventory: 10,
      });

      if (response.status === 401) {
        return pass(
          'Create Product (Unauth)',
          'Correctly rejected unauthorized request',
          Date.now() - start
        );
      } else {
        return fail(
          'Create Product (Unauth)',
          `Expected 401, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Create Product (Unauth)', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testCreateProductBuyer(): Promise<TestResult> {
    const start = Date.now();
    if (!this.tokens.buyerToken) {
      return skip('Create Product (Buyer)', 'No buyer token available');
    }

    try {
      const response = await this.client.post(
        '/products',
        {
          name: 'Buyer Product',
          description: 'This should fail - buyers cannot create products',
          price: 99.99,
          inventory: 10,
        },
        {
          headers: {
            Authorization: `Bearer ${this.tokens.buyerToken}`,
          },
        }
      );

      if (response.status === 403) {
        return pass(
          'Create Product (Buyer)',
          'Correctly rejected buyer creating product',
          Date.now() - start
        );
      } else if (response.status === 401) {
        return pass('Create Product (Buyer)', 'Rejected (unauthorized)', Date.now() - start);
      } else {
        return fail(
          'Create Product (Buyer)',
          `Expected 403, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Create Product (Buyer)', 'Request failed', error.message, Date.now() - start);
    }
  }

  async testInvalidProductData(): Promise<TestResult> {
    const start = Date.now();
    if (!this.tokens.sellerToken) {
      return skip('Invalid Product Data', 'No seller token available');
    }

    try {
      const response = await this.client.post(
        '/products',
        {
          name: '', // Invalid - empty name
          price: -10, // Invalid - negative price
          inventory: 'not-a-number', // Invalid - not a number
        },
        {
          headers: {
            Authorization: `Bearer ${this.tokens.sellerToken}`,
          },
        }
      );

      if (response.status === 400) {
        return pass(
          'Invalid Product Data',
          'Server correctly rejected invalid data',
          Date.now() - start
        );
      } else {
        return fail(
          'Invalid Product Data',
          `Expected 400, got ${response.status}`,
          response.data,
          Date.now() - start
        );
      }
    } catch (error: any) {
      return fail('Invalid Product Data', 'Request failed', error.message, Date.now() - start);
    }
  }

  getCreatedProductId(): string | undefined {
    return this.createdProductId;
  }

  getCreatedProductSlug(): string | undefined {
    return this.createdProductSlug;
  }
}
