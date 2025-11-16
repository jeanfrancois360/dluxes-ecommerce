# Backend Search API Requirements

This document outlines the exact API endpoints needed to support the frontend search system.

## Required Endpoints

### 1. Full Search (with Meilisearch)

**Endpoint:** `GET /api/search`

**Description:** Performs a full-text search across products using Meilisearch with support for filters, sorting, and pagination.

**Query Parameters:**
```typescript
{
  q: string;              // Search query (required)
  category?: string;      // Filter by category slug
  minPrice?: number;      // Minimum price filter
  maxPrice?: number;      // Maximum price filter
  brands?: string[];      // Filter by brands (can be multiple)
  tags?: string[];        // Filter by tags (can be multiple)
  inStock?: boolean;      // Filter in-stock items only
  onSale?: boolean;       // Filter items on sale only
  sortBy?: 'relevance' | 'price-asc' | 'price-desc' | 'newest' | 'popular';
  page?: number;          // Page number (default: 1)
  limit?: number;         // Items per page (default: 24)
}
```

**Example Request:**
```
GET /api/search?q=leather%20bag&category=accessories&minPrice=100&maxPrice=500&sortBy=price-asc&page=1&limit=24
```

**Response:**
```typescript
{
  data: Product[];        // Array of product objects
  total: number;          // Total number of results
  page: number;           // Current page
  limit: number;          // Items per page
  totalPages: number;     // Total number of pages
}
```

**Product Schema:**
```typescript
interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  brand?: string;
  sku: string;
  stock: number;
  heroImage: string;
  images: Array<{
    id: string;
    url: string;
    altText?: string;
  }>;
  categoryId: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  tags: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  badges?: string[];
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

**Implementation Notes:**
- Use Meilisearch for the actual search
- Support typo tolerance (1-2 typos depending on word length)
- Implement fuzzy matching
- Return results in < 500ms
- Support filtering on multiple attributes simultaneously
- Implement proper pagination

---

### 2. Autocomplete Search

**Endpoint:** `GET /api/search/autocomplete`

**Description:** Fast autocomplete endpoint for real-time suggestions as user types. Must be extremely fast (< 100ms).

**Query Parameters:**
```typescript
{
  q: string;              // Search query (required, min 2 characters)
  limit?: number;         // Max results (default: 8, max: 10)
}
```

**Example Request:**
```
GET /api/search/autocomplete?q=leat&limit=8
```

**Response:**
```typescript
{
  data: AutocompleteResult[];
  total: number;
}

interface AutocompleteResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  heroImage: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  brand?: string;
}
```

**Implementation Notes:**
- Must return in < 100ms (critical for UX)
- Return only essential fields for performance
- Limit to 8-10 results
- Use Meilisearch with restricted fields
- Prioritize exact matches and popular products
- Include typo tolerance

**Meilisearch Query Example:**
```typescript
const results = await meiliClient.index('products').search(query, {
  limit: 8,
  attributesToRetrieve: [
    'id',
    'name',
    'slug',
    'price',
    'compareAtPrice',
    'heroImage',
    'category',
    'brand',
  ],
  sort: ['_rankingScore:desc', 'popularity:desc'],
});
```

---

### 3. Trending Searches

**Endpoint:** `GET /api/search/trending`

**Description:** Returns the most popular search terms from recent search analytics.

**Query Parameters:**
```typescript
{
  limit?: number;         // Max results (default: 10)
}
```

**Example Request:**
```
GET /api/search/trending?limit=10
```

**Response:**
```typescript
{
  data: TrendingSearch[];
}

interface TrendingSearch {
  term: string;           // Search term
  count: number;          // Number of searches (optional, for display)
}
```

**Example Response:**
```json
{
  "data": [
    { "term": "leather bags", "count": 1250 },
    { "term": "designer watches", "count": 980 },
    { "term": "silk scarves", "count": 750 },
    { "term": "italian shoes", "count": 620 },
    { "term": "cashmere sweaters", "count": 540 }
  ]
}
```

**Implementation Notes:**
- Calculate from search analytics data
- Update periodically (hourly or daily)
- Consider time-based weighting (recent searches weighted higher)
- Cache results for 1 hour
- Filter out offensive/spam terms

**Simple Implementation:**
```sql
SELECT search_term, COUNT(*) as count
FROM search_analytics
WHERE created_at > NOW() - INTERVAL 7 DAYS
GROUP BY search_term
ORDER BY count DESC
LIMIT 10
```

---

### 4. Search Analytics (Tracking)

**Endpoint:** `POST /api/search/analytics`

**Description:** Track search queries for analytics and trending calculations. This is a fire-and-forget endpoint.

**Request Body:**
```typescript
{
  query: string;          // Search term
  resultsCount: number;   // Number of results returned
  timestamp: string;      // ISO timestamp
  userId?: string;        // User ID if logged in (optional)
  sessionId?: string;     // Session ID (optional)
}
```

**Example Request:**
```json
POST /api/search/analytics
Content-Type: application/json

{
  "query": "leather bags",
  "resultsCount": 42,
  "timestamp": "2025-11-11T10:30:00Z",
  "sessionId": "abc123"
}
```

**Response:**
```typescript
{
  success: boolean;
  message?: string;
}
```

**Implementation Notes:**
- Should not block or slow down search
- Fire-and-forget pattern (frontend doesn't wait for response)
- Store in a separate analytics table
- Consider using a queue/message broker for high traffic
- Track additional metrics: click-through rate, time to click, etc.

**Database Schema:**
```sql
CREATE TABLE search_analytics (
  id UUID PRIMARY KEY,
  search_term VARCHAR(255) NOT NULL,
  results_count INTEGER NOT NULL,
  user_id UUID,
  session_id VARCHAR(255),
  clicked_product_id UUID,
  position INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_search_term ON search_analytics(search_term);
CREATE INDEX idx_created_at ON search_analytics(created_at);
```

---

### 5. Search Suggestions (Optional)

**Endpoint:** `GET /api/search/suggestions`

**Description:** Returns query suggestions based on partial input (different from autocomplete which returns products).

**Query Parameters:**
```typescript
{
  q: string;              // Partial query (required, min 2 characters)
  limit?: number;         // Max results (default: 5)
}
```

**Example Request:**
```
GET /api/search/suggestions?q=leath&limit=5
```

**Response:**
```typescript
{
  data: SearchSuggestion[];
}

interface SearchSuggestion {
  query: string;          // Suggested query
  category?: string;      // Category context (optional)
}
```

**Example Response:**
```json
{
  "data": [
    { "query": "leather bags", "category": "accessories" },
    { "query": "leather shoes", "category": "footwear" },
    { "query": "leather jackets", "category": "clothing" },
    { "query": "leather wallets", "category": "accessories" }
  ]
}
```

---

## Meilisearch Setup

### Installation

```bash
# Using Docker
docker run -d \
  --name meilisearch \
  -p 7700:7700 \
  -v $(pwd)/meili_data:/meili_data \
  getmeili/meilisearch:latest

# Or using Meilisearch Cloud (recommended for production)
```

### Index Creation

```typescript
import { MeiliSearch } from 'meilisearch';

const client = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILISEARCH_API_KEY,
});

// Create products index
const index = client.index('products');

// Configure searchable attributes (what fields to search)
await index.updateSearchableAttributes([
  'name',
  'description',
  'brand',
  'category.name',
  'tags.name',
  'sku',
]);

// Configure filterable attributes (what fields can be filtered)
await index.updateFilterableAttributes([
  'categoryId',
  'category.slug',
  'price',
  'brand',
  'tags.slug',
  'inStock',
  'onSale',
  'isFeatured',
  'isActive',
]);

// Configure sortable attributes
await index.updateSortableAttributes([
  'price',
  'createdAt',
  'popularity',
  'name',
]);

// Configure ranking rules
await index.updateRankingRules([
  'words',
  'typo',
  'proximity',
  'attribute',
  'sort',
  'exactness',
]);

// Configure typo tolerance
await index.updateTypoTolerance({
  enabled: true,
  minWordSizeForTypos: {
    oneTypo: 5,
    twoTypos: 9,
  },
  disableOnAttributes: ['sku'],
});

// Configure pagination
await index.updatePagination({
  maxTotalHits: 1000,
});
```

### Indexing Products

```typescript
// Index all products
async function indexProducts() {
  const products = await db.product.findMany({
    where: { isActive: true },
    include: {
      category: true,
      tags: true,
      images: true,
    },
  });

  // Transform products for Meilisearch
  const documents = products.map(product => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    brand: product.brand,
    sku: product.sku,
    stock: product.stock,
    heroImage: product.heroImage,
    images: product.images.map(img => ({
      id: img.id,
      url: img.url,
      altText: img.altText,
    })),
    categoryId: product.categoryId,
    category: product.category ? {
      id: product.category.id,
      name: product.category.name,
      slug: product.category.slug,
    } : null,
    tags: product.tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
    })),
    badges: product.badges,
    isFeatured: product.isFeatured,
    isActive: product.isActive,
    inStock: product.stock > 0,
    onSale: product.compareAtPrice ? product.compareAtPrice > product.price : false,
    popularity: product.viewCount || 0, // Add popularity metric
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  }));

  // Add documents to index
  await index.addDocuments(documents, { primaryKey: 'id' });
}

// Keep index in sync with database
async function syncProduct(productId: string) {
  const product = await db.product.findUnique({
    where: { id: productId },
    include: { category: true, tags: true, images: true },
  });

  if (!product || !product.isActive) {
    // Remove from index if deleted or inactive
    await index.deleteDocument(productId);
  } else {
    // Update in index
    await index.updateDocuments([transformProduct(product)]);
  }
}
```

### Search Implementation

```typescript
// Full search endpoint
app.get('/api/search', async (req, res) => {
  const {
    q,
    category,
    minPrice,
    maxPrice,
    brands,
    tags,
    inStock,
    onSale,
    sortBy = 'relevance',
    page = 1,
    limit = 24,
  } = req.query;

  // Build filters
  const filters = [];
  filters.push('isActive = true');

  if (category) filters.push(`category.slug = "${category}"`);
  if (minPrice) filters.push(`price >= ${minPrice}`);
  if (maxPrice) filters.push(`price <= ${maxPrice}`);
  if (brands) {
    const brandFilters = Array.isArray(brands) ? brands : [brands];
    filters.push(`brand IN [${brandFilters.map(b => `"${b}"`).join(', ')}]`);
  }
  if (tags) {
    const tagFilters = Array.isArray(tags) ? tags : [tags];
    filters.push(`tags.slug IN [${tagFilters.map(t => `"${t}"`).join(', ')}]`);
  }
  if (inStock === 'true') filters.push('inStock = true');
  if (onSale === 'true') filters.push('onSale = true');

  // Build sort
  let sort = [];
  switch (sortBy) {
    case 'price-asc':
      sort = ['price:asc'];
      break;
    case 'price-desc':
      sort = ['price:desc'];
      break;
    case 'newest':
      sort = ['createdAt:desc'];
      break;
    case 'popular':
      sort = ['popularity:desc'];
      break;
    default:
      sort = []; // Relevance (Meilisearch default)
  }

  // Search
  const results = await index.search(q, {
    filter: filters.join(' AND '),
    sort,
    limit: Number(limit),
    offset: (Number(page) - 1) * Number(limit),
  });

  res.json({
    data: results.hits,
    total: results.estimatedTotalHits,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(results.estimatedTotalHits / Number(limit)),
  });
});

// Autocomplete endpoint
app.get('/api/search/autocomplete', async (req, res) => {
  const { q, limit = 8 } = req.query;

  if (!q || q.length < 2) {
    return res.json({ data: [], total: 0 });
  }

  const results = await index.search(q, {
    filter: 'isActive = true',
    limit: Number(limit),
    attributesToRetrieve: [
      'id',
      'name',
      'slug',
      'price',
      'compareAtPrice',
      'heroImage',
      'category',
      'brand',
    ],
    sort: ['popularity:desc'],
  });

  res.json({
    data: results.hits,
    total: results.estimatedTotalHits,
  });
});
```

---

## Performance Requirements

| Endpoint | Max Response Time | Notes |
|----------|------------------|-------|
| `/search/autocomplete` | 100ms | Critical for UX |
| `/search` | 500ms | Full search |
| `/search/trending` | 200ms | Cached |
| `/search/analytics` | N/A | Fire-and-forget |

---

## Error Handling

All endpoints should return proper error responses:

```typescript
// 400 Bad Request
{
  error: 'Invalid request',
  message: 'Query parameter "q" is required',
  statusCode: 400
}

// 500 Internal Server Error
{
  error: 'Search failed',
  message: 'Unable to connect to search service',
  statusCode: 500
}
```

---

## Testing

### Sample cURL Commands

```bash
# Full search
curl "http://localhost:3001/api/search?q=leather%20bag&limit=10"

# Autocomplete
curl "http://localhost:3001/api/search/autocomplete?q=leath&limit=8"

# Trending
curl "http://localhost:3001/api/search/trending?limit=10"

# Analytics
curl -X POST "http://localhost:3001/api/search/analytics" \
  -H "Content-Type: application/json" \
  -d '{"query":"leather bags","resultsCount":42,"timestamp":"2025-11-11T10:30:00Z"}'
```

---

## Monitoring

Track these metrics:
- Search response times (p50, p95, p99)
- Autocomplete response times
- Search error rates
- Popular search terms
- No-result queries
- Click-through rates

---

## Security

1. **Rate Limiting:** Implement rate limiting on search endpoints (e.g., 100 requests/minute per IP)
2. **Input Validation:** Sanitize all query parameters
3. **SQL Injection:** Use parameterized queries for analytics
4. **API Key Protection:** Never expose Meilisearch master key to frontend

---

## Deployment Checklist

- [ ] Meilisearch instance deployed
- [ ] Products indexed in Meilisearch
- [ ] All 4 endpoints implemented
- [ ] Error handling implemented
- [ ] Rate limiting configured
- [ ] Analytics database created
- [ ] Background job for trending searches
- [ ] Monitoring and logging set up
- [ ] Load testing completed
- [ ] Documentation updated
