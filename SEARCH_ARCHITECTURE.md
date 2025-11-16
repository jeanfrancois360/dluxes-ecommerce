# Search System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                           │
├─────────────────────────────────────────────────────────────────┤
│  Desktop                                    Mobile               │
│  ┌──────────────────────────┐            ┌──────────────────┐  │
│  │   Navbar SearchBar       │            │  Search Icon     │  │
│  │  - Real-time autocomplete│            │  ↓               │  │
│  │  - Dropdown suggestions  │            │  SearchModal     │  │
│  │  - Keyboard navigation   │            │  - Full screen   │  │
│  └──────────────────────────┘            └──────────────────┘  │
│                                                                  │
│  Search Results Page                                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  /search?q=query                                         │  │
│  │  - Product Grid                                          │  │
│  │  - Filters Sidebar                                       │  │
│  │  - Pagination                                            │  │
│  │  - Sort Options                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      REACT COMPONENTS                            │
├─────────────────────────────────────────────────────────────────┤
│  SearchBar.tsx                                                   │
│  ├─ SearchAutocompleteItem.tsx                                  │
│  └─ SearchSuggestions.tsx                                       │
│                                                                  │
│  SearchModal.tsx (mobile)                                       │
│                                                                  │
│  SearchResults.tsx                                              │
│  └─ FiltersSidebar.tsx (shared)                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       CUSTOM HOOKS                               │
├─────────────────────────────────────────────────────────────────┤
│  useSearch()                                                     │
│  ├─ Manages full search with filters                           │
│  └─ Returns: { data, isLoading, error, search }                │
│                                                                  │
│  useAutocomplete(query, debounceMs)                            │
│  ├─ Debounced autocomplete (300ms)                             │
│  ├─ Request cancellation                                        │
│  └─ Returns: { results, isLoading, error }                     │
│                                                                  │
│  useTrendingSearches()                                          │
│  └─ Returns: { trending, isLoading, error }                    │
│                                                                  │
│  useRecentSearches()                                            │
│  ├─ localStorage-based                                          │
│  └─ Returns: { recentSearches, add, clear, remove }           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       API CLIENT                                 │
├─────────────────────────────────────────────────────────────────┤
│  searchAPI.search(params)                                       │
│  ├─ Full-text search with filters                              │
│  └─ GET /api/search?q=...&category=...&price=...              │
│                                                                  │
│  searchAPI.autocomplete(query, limit)                          │
│  ├─ Fast autocomplete (< 100ms)                                │
│  └─ GET /api/search/autocomplete?q=...&limit=8                │
│                                                                  │
│  searchAPI.getTrending(limit)                                  │
│  └─ GET /api/search/trending?limit=10                         │
│                                                                  │
│  searchAPI.trackSearch(query, resultsCount)                    │
│  ├─ Fire-and-forget analytics                                  │
│  └─ POST /api/search/analytics                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND API (Node.js)                         │
├─────────────────────────────────────────────────────────────────┤
│  GET /api/search                                                │
│  ├─ Query parsing & validation                                  │
│  ├─ Filter building                                             │
│  ├─ Meilisearch query execution                                │
│  └─ Response formatting                                         │
│                                                                  │
│  GET /api/search/autocomplete                                  │
│  ├─ Fast path (< 100ms)                                        │
│  ├─ Limited fields                                              │
│  └─ Popularity sorting                                          │
│                                                                  │
│  GET /api/search/trending                                      │
│  ├─ Cached results (1 hour)                                    │
│  └─ Analytics aggregation                                       │
│                                                                  │
│  POST /api/search/analytics                                    │
│  ├─ Background queue                                            │
│  └─ Database insertion                                          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│  Meilisearch                    PostgreSQL                      │
│  ┌──────────────────┐          ┌──────────────────┐           │
│  │  Products Index  │          │  search_analytics│           │
│  │  - Searchable    │          │  - search_term   │           │
│  │  - Filterable    │          │  - results_count │           │
│  │  - Sortable      │          │  - user_id       │           │
│  │  - Typo-tolerant│          │  - session_id    │           │
│  └──────────────────┘          │  - created_at    │           │
│                                 └──────────────────┘           │
│                                                                  │
│  localStorage                                                   │
│  ┌──────────────────┐                                          │
│  │ Recent Searches  │                                          │
│  │ - Max 5 entries  │                                          │
│  │ - User-specific  │                                          │
│  └──────────────────┘                                          │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Autocomplete Flow (Real-time)

```
User types "leat"
    ↓
SearchBar component updates query state
    ↓
useAutocomplete hook (debounced 300ms)
    ↓
After 300ms: searchAPI.autocomplete("leat", 8)
    ↓
Backend: GET /api/search/autocomplete?q=leat&limit=8
    ↓
Meilisearch query with typo tolerance
    ↓
Returns: [
  { id, name: "Leather Bag", price, image, category, brand },
  { id, name: "Leather Shoes", price, image, category, brand },
  ...
]
    ↓
SearchAutocompleteItem renders each result
    ↓
User clicks item → Navigate to /products/{slug}
OR
User presses Enter → Navigate to /search?q=leat
```

### 2. Full Search Flow

```
User submits search query
    ↓
Navigate to /search?q=leather%20bags&category=accessories
    ↓
SearchResults component mounts
    ↓
useSearch hook calls searchAPI.search({
  q: "leather bags",
  category: "accessories",
  page: 1,
  limit: 24
})
    ↓
Backend: GET /api/search?q=leather%20bags&category=accessories&...
    ↓
Meilisearch:
  - Full-text search
  - Apply filters
  - Sort by relevance
  - Paginate results
    ↓
Returns: {
  data: [products],
  total: 42,
  page: 1,
  totalPages: 2
}
    ↓
SearchResults renders:
  - Product grid (24 items)
  - Pagination controls
  - Filter sidebar
  - Sort dropdown
    ↓
searchAPI.trackSearch("leather bags", 42)
    ↓
POST /api/search/analytics (fire-and-forget)
    ↓
Store in database for trending calculation
```

### 3. Recent Searches Flow

```
User performs search
    ↓
useRecentSearches().addRecentSearch("leather bags")
    ↓
localStorage.setItem("luxury_recent_searches", [
  "leather bags",
  "silk scarves",
  "watches",
  "designer shoes",
  "cashmere"
])
    ↓
SearchSuggestions displays recent searches
    ↓
User clicks recent search → Navigate to search page
```

### 4. Trending Searches Flow

```
Background job (hourly):
  SELECT search_term, COUNT(*) as count
  FROM search_analytics
  WHERE created_at > NOW() - INTERVAL 7 DAYS
  GROUP BY search_term
  ORDER BY count DESC
  LIMIT 10
    ↓
Store in cache (Redis or memory)
    ↓
Frontend: useTrendingSearches()
    ↓
GET /api/search/trending?limit=10
    ↓
Returns cached trending searches
    ↓
SearchSuggestions displays trending
```

## Performance Optimizations

### 1. Debouncing
```typescript
Input: "l" → "le" → "lea" → "leat" → "leath"
Time:  0ms   50ms   100ms   150ms    200ms

Without debouncing: 5 API calls
With 300ms debouncing: 1 API call (at 500ms)

Reduction: 80% fewer API calls
```

### 2. Request Cancellation
```typescript
Query 1: "leather" (sent at 0ms)
Query 2: "leather bags" (sent at 400ms)

Without cancellation:
  - Both queries complete
  - Race condition possible
  - Wasted resources

With cancellation:
  - Query 1 cancelled
  - Only Query 2 completes
  - No race condition
```

### 3. Caching Strategy

```
Level 1: Browser Memory (React State)
  ├─ Recent autocomplete results
  └─ Duration: Until page refresh

Level 2: localStorage
  ├─ Recent searches
  └─ Duration: Persistent

Level 3: API Cache (Backend)
  ├─ Trending searches (1 hour)
  └─ Popular queries (5 minutes)

Level 4: Meilisearch Cache
  └─ Built-in query caching
```

## Component Hierarchy

```
Navbar
├─ SearchBar (desktop)
│  ├─ input
│  ├─ dropdown (when focused)
│  │  ├─ SearchSuggestions (when query empty)
│  │  │  ├─ Recent searches
│  │  │  ├─ Trending searches
│  │  │  └─ Popular categories
│  │  └─ Autocomplete results (when query.length >= 2)
│  │     ├─ SearchAutocompleteItem (×8)
│  │     └─ "View all results" footer
│  └─ loading spinner / clear button
├─ Search icon button (mobile)
└─ SearchModal (mobile)
   └─ SearchBar (full-width)

SearchPage (/search?q=...)
└─ SearchResults
   ├─ Search header (query, count)
   ├─ FiltersSidebar
   ├─ Sort dropdown
   ├─ Product grid
   │  └─ ProductCard (×24)
   └─ Pagination
```

## State Management

```typescript
// Component-level state
SearchBar:
  - searchQuery: string
  - isFocused: boolean
  - selectedIndex: number

SearchModal:
  - isOpen: boolean

SearchResults:
  - filters: FilterState
  - sortBy: SortOption
  - page: number

// Hook-managed state
useAutocomplete:
  - results: AutocompleteResult[]
  - isLoading: boolean
  - error: Error | null

useSearch:
  - data: SearchResult<Product> | null
  - isLoading: boolean
  - error: Error | null

useRecentSearches:
  - recentSearches: string[]

useTrendingSearches:
  - trending: TrendingSearch[]
  - isLoading: boolean
```

## Error Handling

```
Error Scenarios:

1. Network Error
   ├─ Autocomplete: Show empty state, continue with cached
   └─ Search: Show error message with retry button

2. API Error (4xx/5xx)
   ├─ Autocomplete: Silently fail, show empty
   └─ Search: Show error with details

3. Timeout
   ├─ Cancel request after 10s
   └─ Show timeout message

4. No Results
   ├─ Show empty state
   ├─ Search suggestions
   └─ Popular categories

5. Invalid Query
   ├─ Client-side validation
   └─ Min 2 characters for autocomplete
```

## Security Considerations

```
Input Sanitization:
  ✓ Escape HTML in search queries
  ✓ Prevent XSS in autocomplete highlights
  ✓ Validate query length (max 200 chars)
  ✓ Rate limiting per IP

API Security:
  ✓ Never expose Meilisearch API key
  ✓ Use backend proxy for all queries
  ✓ Implement request throttling
  ✓ CORS configuration

Data Privacy:
  ✓ Recent searches stored locally only
  ✓ Analytics anonymized (no PII)
  ✓ GDPR compliant (user can clear data)
```

## Monitoring & Metrics

```
Key Metrics to Track:

Performance:
  - p50, p95, p99 response times
  - Autocomplete latency
  - Search query latency
  - Frontend render time

Usage:
  - Searches per day
  - Top search terms
  - No-result queries
  - Click-through rate
  - Autocomplete usage rate

Quality:
  - Typo correction rate
  - Filter usage
  - Refinement rate
  - Exit rate from search results
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│              Load Balancer (Nginx)              │
└─────────────────────────────────────────────────┘
                     ↓
    ┌────────────────────────────────┐
    │                                │
    ↓                                ↓
┌─────────┐                    ┌─────────┐
│ Next.js │                    │ Next.js │
│ Server  │                    │ Server  │
│  (SSR)  │                    │  (SSR)  │
└─────────┘                    └─────────┘
    ↓                                ↓
    └────────────────┬───────────────┘
                     ↓
            ┌─────────────────┐
            │  Backend API    │
            │   (Node.js)     │
            └─────────────────┘
                     ↓
         ┌───────────┴──────────┐
         ↓                      ↓
    ┌────────────┐      ┌─────────────┐
    │Meilisearch │      │ PostgreSQL  │
    │  Cluster   │      │  (Analytics)│
    └────────────┘      └─────────────┘
```

## Future Enhancements

```
Phase 2:
  - Voice search (Web Speech API)
  - Search history sync (for logged-in users)
  - Personalized results
  - A/B testing framework

Phase 3:
  - Visual search (image upload)
  - Natural language queries
  - ML-powered recommendations
  - Advanced filters UI

Phase 4:
  - Multi-language support
  - Synonym suggestions
  - Related products in results
  - Search analytics dashboard
```
