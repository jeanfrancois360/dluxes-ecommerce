# Search Components

Production-ready search system with Meilisearch autocomplete for luxury e-commerce.

## Quick Start

```tsx
import { SearchBar, SearchModal, SearchResults } from '@/components/search';

// In your navbar
<SearchBar />

// Mobile search modal
<SearchModal isOpen={isOpen} onClose={() => setIsOpen(false)} />

// Search results page
<SearchResults initialQuery="luxury bags" />
```

## Components

### SearchBar
Main search input with real-time autocomplete dropdown.

```tsx
<SearchBar
  className="w-full"
  placeholder="Search products..."
  autoFocus={false}
  onSearch={(query) => console.log('Searched:', query)}
/>
```

**Features:**
- Debounced autocomplete (300ms)
- Keyboard navigation (↑↓ arrows, Enter, Esc)
- Recent & trending searches
- Product suggestions with images
- Loading & empty states
- Mobile responsive

### SearchAutocompleteItem
Individual product result in autocomplete dropdown.

```tsx
<SearchAutocompleteItem
  product={product}
  searchQuery="leather"
  onClick={() => router.push(`/products/${product.slug}`)}
/>
```

**Features:**
- Product thumbnail
- Highlighted matching text
- Category & brand badges
- Price with discount
- Hover animation

### SearchSuggestions
Shows when search input is empty - displays recent/trending searches and categories.

```tsx
<SearchSuggestions
  onSelectSearch={(query) => router.push(`/search?q=${query}`)}
/>
```

**Features:**
- Recent searches (localStorage)
- Trending searches (API)
- Popular categories
- Clear/remove options

### SearchResults
Full search results page component with filters and pagination.

```tsx
<SearchResults
  initialQuery="luxury bags"
  initialCategory="accessories"
/>
```

**Features:**
- Product grid (1-4 columns responsive)
- Filters sidebar
- Sort options
- Pagination
- Loading skeletons
- Empty state

### SearchModal
Full-screen mobile search experience.

```tsx
<SearchModal
  isOpen={isMobileSearchOpen}
  onClose={() => setIsMobileSearchOpen(false)}
/>
```

**Features:**
- Slide-in animation
- Auto-focus input
- Search tips
- Body scroll lock
- Close on backdrop/Escape

## Hooks

### useSearch
```tsx
const { data, isLoading, error, search } = useSearch();

search({
  q: 'leather bags',
  category: 'accessories',
  minPrice: 100,
  maxPrice: 1000,
  sortBy: 'price-asc',
  page: 1,
  limit: 24,
});
```

### useAutocomplete
```tsx
const { results, isLoading, error } = useAutocomplete(query, 300);
```

### useTrendingSearches
```tsx
const { trending, isLoading, error } = useTrendingSearches();
```

### useRecentSearches
```tsx
const {
  recentSearches,
  addRecentSearch,
  clearRecentSearches,
  removeRecentSearch,
} = useRecentSearches();
```

## API Client

```tsx
import { searchAPI } from '@/lib/api/search';

// Full search
await searchAPI.search({ q: 'bags', limit: 24 });

// Autocomplete
await searchAPI.autocomplete('leat', 8);

// Trending
await searchAPI.getTrending(10);

// Track (fire-and-forget)
searchAPI.trackSearch('leather bags', 42);
```

## Styling

Uses luxury brand aesthetic:
- Gold highlights: `#CBB57B`
- Smooth animations via Framer Motion
- Glass morphism effects
- Professional shadows & borders

## Keyboard Shortcuts

- `⌘K` / `Ctrl+K` - Focus search (planned)
- `↑` / `↓` - Navigate results
- `Enter` - Select result
- `Esc` - Close dropdown

## Performance

- Debounced input (300ms)
- Request cancellation
- Lazy loading images
- Local storage caching
- < 100ms autocomplete response

## Accessibility

- ARIA attributes
- Keyboard navigation
- Screen reader support
- Focus management
- Proper labels

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Safari 14+
- Chrome Android 90+
