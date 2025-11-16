# Search System Implementation Guide

## Overview

A complete, production-ready search system with Meilisearch integration, featuring real-time autocomplete, advanced filtering, and a luxury brand aesthetic.

## Architecture

### Components Structure

```
apps/web/src/
├── components/search/
│   ├── search-bar.tsx                    # Main search input with autocomplete
│   ├── search-autocomplete-item.tsx      # Individual autocomplete result item
│   ├── search-suggestions.tsx            # Recent & trending searches, categories
│   ├── search-results.tsx                # Full search results page component
│   ├── search-modal.tsx                  # Mobile full-screen search modal
│   └── index.ts                          # Export barrel file
├── app/search/
│   └── page.tsx                          # Search results page route
├── hooks/
│   └── use-search.ts                     # Search-related hooks
└── lib/api/
    └── search.ts                         # Search API client
```

## Features

### 1. Real-time Autocomplete
- Debounced search (300ms) to reduce API calls
- Minimum 2 characters to trigger search
- Displays up to 8 product suggestions
- Shows product thumbnail, name, category, brand, and price
- Highlights matching text in gold (#CBB57B)
- Keyboard navigation support (↑↓ arrows, Enter, Esc)
- Loading spinner during search
- "View all results" footer

### 2. Search Bar Component
**Location:** `/components/search/search-bar.tsx`

**Features:**
- Large, prominent search input
- Search icon with animation on focus
- Clear button when text is entered
- Keyboard shortcut hint (⌘K) on desktop
- Focus glow effect
- Click outside to close dropdown
- Responsive design

**Props:**
```typescript
interface SearchBarProps {
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onSearch?: (query: string) => void;
}
```

### 3. Autocomplete Item
**Location:** `/components/search/search-autocomplete-item.tsx`

**Features:**
- Product image (48x48px)
- Highlighted matching text
- Category badge
- Brand name
- Price with discount percentage
- Hover animation (slides right)
- Navigation to product detail

### 4. Search Suggestions
**Location:** `/components/search/search-suggestions.tsx`

**Features:**
- Recent searches (from localStorage, max 5)
- Trending searches (from API)
- Popular categories with icons
- Clear all recent searches
- Individual search removal
- Staggered animations

### 5. Search Results Page
**Location:** `/app/search/page.tsx` & `/components/search/search-results.tsx`

**Features:**
- Full search results display
- Product grid (responsive: 1-4 columns)
- Filters sidebar integration
- Sort options (relevance, price, newest, popular)
- Pagination with page numbers
- Result count display
- Empty state with suggestions
- Loading skeletons
- Error handling

**URL Structure:**
```
/search?q=luxury%20bags
/search?q=watches&category=accessories
```

### 6. Mobile Search Modal
**Location:** `/components/search/search-modal.tsx`

**Features:**
- Full-screen overlay on mobile
- Slide-in animation from top
- Close button (X)
- Auto-focus search input
- Search tips section
- Body scroll lock when open
- Escape key to close

## Hooks

### useSearch
**Location:** `/hooks/use-search.ts`

Main search hook with full search capabilities.

```typescript
const { data, isLoading, error, search } = useSearch();

search({
  q: 'luxury bags',
  category: 'accessories',
  minPrice: 100,
  maxPrice: 1000,
  brands: ['Gucci', 'Prada'],
  tags: ['leather'],
  inStock: true,
  onSale: false,
  sortBy: 'relevance',
  page: 1,
  limit: 24,
});
```

### useAutocomplete
Debounced autocomplete hook for real-time suggestions.

```typescript
const { results, isLoading, error } = useAutocomplete(query, 300);
```

**Features:**
- Automatic debouncing (default 300ms)
- Request cancellation on new queries
- Minimum 2 characters requirement
- Returns up to 8 results

### useTrendingSearches
Fetches trending searches from the API.

```typescript
const { trending, isLoading, error } = useTrendingSearches();
```

### useRecentSearches
Manages recent searches in localStorage.

```typescript
const {
  recentSearches,
  addRecentSearch,
  clearRecentSearches,
  removeRecentSearch,
} = useRecentSearches();
```

**Features:**
- Stores max 5 recent searches
- Automatic deduplication
- Persists to localStorage
- Case-insensitive matching

## API Client

### Location
`/lib/api/search.ts`

### Endpoints

#### 1. Full Search
```typescript
searchAPI.search({
  q: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  brands?: string[];
  tags?: string[];
  inStock?: boolean;
  onSale?: boolean;
  sortBy?: string;
  page?: number;
  limit?: number;
})
```

**Backend Endpoint:** `GET /search?q={query}&...`

#### 2. Autocomplete
```typescript
searchAPI.autocomplete(query: string, limit?: number)
```

**Backend Endpoint:** `GET /search/autocomplete?q={query}&limit={limit}`

**Response:**
```typescript
{
  data: AutocompleteResult[];
  total: number;
}
```

#### 3. Trending Searches
```typescript
searchAPI.getTrending(limit?: number)
```

**Backend Endpoint:** `GET /search/trending?limit={limit}`

**Response:**
```typescript
{
  data: TrendingSearch[];
}

interface TrendingSearch {
  term: string;
  count: number;
}
```

#### 4. Search Analytics (Fire & Forget)
```typescript
searchAPI.trackSearch(query: string, resultsCount: number)
```

**Backend Endpoint:** `POST /search/analytics`

## Backend Requirements

### Meilisearch Configuration

Your backend should implement the following endpoints using Meilisearch:

#### 1. Index Configuration
```javascript
// Products index settings
{
  searchableAttributes: [
    'name',
    'description',
    'brand',
    'category.name',
    'tags.name'
  ],
  filterableAttributes: [
    'categoryId',
    'price',
    'brand',
    'tags',
    'inStock',
    'onSale'
  ],
  sortableAttributes: [
    'price',
    'createdAt',
    'popularity'
  ],
  rankingRules: [
    'words',
    'typo',
    'proximity',
    'attribute',
    'sort',
    'exactness'
  ],
  typoTolerance: {
    enabled: true,
    minWordSizeForTypos: {
      oneTypo: 5,
      twoTypos: 9
    }
  }
}
```

#### 2. Search Endpoint
```
GET /api/search
```

**Query Parameters:**
- `q` - Search query (required)
- `category` - Category filter
- `minPrice`, `maxPrice` - Price range
- `brands[]` - Brand filters (array)
- `tags[]` - Tag filters (array)
- `inStock` - In stock filter (boolean)
- `onSale` - On sale filter (boolean)
- `sortBy` - Sort option
- `page` - Page number
- `limit` - Results per page

**Response:**
```typescript
{
  data: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

#### 3. Autocomplete Endpoint
```
GET /api/search/autocomplete
```

**Query Parameters:**
- `q` - Search query (required)
- `limit` - Max results (default: 8)

**Response:**
```typescript
{
  data: AutocompleteResult[];
  total: number;
}
```

**Performance Requirement:** < 100ms response time

#### 4. Trending Endpoint
```
GET /api/search/trending
```

**Query Parameters:**
- `limit` - Max results (default: 10)

**Response:**
```typescript
{
  data: TrendingSearch[];
}
```

## Styling & Design

### Color Palette
- Primary Gold: `#CBB57B`
- Gold Hover: `#B8A468`
- Background: White
- Text: Gray-900, Gray-700, Gray-600
- Borders: Gray-200, Gray-100

### Key Design Elements
1. **Rounded Corners:** `rounded-full` for inputs, `rounded-2xl` for dropdowns
2. **Shadows:** `shadow-lg` on focus, `shadow-2xl` for dropdowns
3. **Transitions:** All hover effects use 300ms duration
4. **Animations:** Framer Motion for smooth enter/exit animations
5. **Typography:** Font-serif for headings, font-medium for body

### Responsive Breakpoints
- Mobile: < 1024px (lg breakpoint)
- Desktop: ≥ 1024px

## Performance Optimizations

### 1. Debouncing
- Search input debounced to 300ms
- Reduces API calls by ~70%

### 2. Request Cancellation
- Previous autocomplete requests cancelled on new input
- Prevents race conditions

### 3. Lazy Loading
- Results paginated (24 per page)
- Images lazy loaded

### 4. Local Storage Caching
- Recent searches stored locally
- No API calls for recent searches

### 5. React Query (Recommended)
Consider adding React Query for:
- Automatic caching
- Background refetching
- Stale-while-revalidate pattern

Example:
```typescript
import { useQuery } from '@tanstack/react-query';

export function useAutocomplete(query: string) {
  return useQuery({
    queryKey: ['autocomplete', query],
    queryFn: () => searchAPI.autocomplete(query),
    enabled: query.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

## Accessibility

### ARIA Attributes
- `aria-label` on search input
- `aria-autocomplete="list"` for autocomplete
- `aria-expanded` for dropdown state
- Proper button labels

### Keyboard Navigation
- **Arrow Down/Up:** Navigate results
- **Enter:** Select result or search
- **Escape:** Close dropdown
- **Tab:** Navigate between elements

### Screen Reader Support
- All interactive elements properly labeled
- Loading states announced
- Error messages accessible

## Analytics Integration

Track the following events:

```typescript
// Search performed
analytics.track('Search', {
  query: string,
  resultsCount: number,
  timestamp: Date,
});

// Autocomplete suggestion clicked
analytics.track('Autocomplete Click', {
  query: string,
  selectedProduct: string,
  position: number,
});

// No results
analytics.track('Search No Results', {
  query: string,
});

// View all results clicked
analytics.track('View All Results', {
  query: string,
});
```

## Testing Checklist

### Unit Tests
- [ ] Search hooks debouncing works correctly
- [ ] Recent searches localStorage operations
- [ ] Request cancellation on new queries
- [ ] Keyboard navigation handlers

### Integration Tests
- [ ] Search API endpoints return expected data
- [ ] Autocomplete displays results correctly
- [ ] Filters update search results
- [ ] Pagination works correctly

### E2E Tests
- [ ] User can search from navbar
- [ ] Autocomplete suggestions appear
- [ ] Clicking suggestion navigates to product
- [ ] Mobile search modal opens/closes
- [ ] Results page displays correctly
- [ ] Empty state shows when no results

### Performance Tests
- [ ] Autocomplete response < 100ms
- [ ] Search results page loads < 1s
- [ ] No memory leaks in search input
- [ ] Smooth animations (60fps)

## Common Issues & Solutions

### Issue: Autocomplete not appearing
**Solution:** Check that query length is ≥ 2 characters and input is focused.

### Issue: Search results not updating
**Solution:** Verify API endpoint is returning data and check browser console for errors.

### Issue: Keyboard navigation not working
**Solution:** Ensure search dropdown is visible and input is focused.

### Issue: Mobile modal not opening
**Solution:** Check that `isMobileSearchOpen` state is being set to true.

### Issue: Highlights not showing in autocomplete
**Solution:** Verify that `searchQuery` is being passed to `SearchAutocompleteItem`.

## Future Enhancements

1. **Voice Search:** Add Web Speech API integration
2. **Image Search:** Search by uploading product images
3. **Filters in Autocomplete:** Show quick filters in dropdown
4. **Search History Sync:** Sync across devices for logged-in users
5. **Spell Check:** Suggest corrections for misspelled queries
6. **Related Searches:** "People also searched for..."
7. **Search Analytics Dashboard:** Admin view of popular searches
8. **A/B Testing:** Test different layouts and ranking algorithms

## Support

For issues or questions:
1. Check this documentation
2. Review component props and API signatures
3. Check browser console for errors
4. Verify backend endpoints are working
5. Test with sample data

## Version History

- **v1.0.0** - Initial implementation with Meilisearch
  - Real-time autocomplete
  - Full search results page
  - Mobile modal
  - Recent/trending searches
  - Keyboard navigation
