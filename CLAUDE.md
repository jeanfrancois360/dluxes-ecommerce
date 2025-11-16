- # Error Type
Runtime TypeError

## Error Message
can't access property "toFixed", price is undefined


    at ProductCard (webpack-internal:///(app-pages-browser)/../../packages/ui/src/components/product-card.tsx:432:37)
    at ProductCarousel/<.children<.children<.children< (src/components/product-carousel.tsx:132:15)
    at ProductCarousel (src/components/product-carousel.tsx:124:21)
    at Home (src/app/page.tsx:209:9)

## Code Frame
  130 |               className="flex-none w-[280px] snap-start"
  131 |             >
> 132 |               <ProductCard
      |               ^
  133 |                 product={product}
  134 |                 onQuickView={onQuickView ? () => onQuickView(product.id) : undefined}
  135 |                 onAddToWishlist={onAddToWishlist ? () => onAddToWishlist(product.id) : undefined}

Next.js version: 15.5.6 (Webpack)
- # Error Type
Runtime TypeError

## Error Message
can't access property "toFixed", price is undefined


    at ProductCard (webpack-internal:///(app-pages-browser)/../../packages/ui/src/components/product-card.tsx:432:37)
    at ProductCarousel/<.children<.children<.children< (src/components/product-carousel.tsx:132:15)
    at ProductCarousel (src/components/product-carousel.tsx:124:21)
    at Home (src/app/page.tsx:209:9)

## Code Frame
  130 |               className="flex-none w-[280px] snap-start"
  131 |             >
> 132 |               <ProductCard
      |               ^
  133 |                 product={product}
  134 |                 onQuickView={onQuickView ? () => onQuickView(product.id) : undefined}
  135 |                 onAddToWishlist={onAddToWishlist ? () => onAddToWishlist(product.id) : undefined}

Next.js version: 15.5.6 (Webpack)
- Go back to the state we were before we implemented the below"

# Error Type
Console AxiosError

## Error Message
Network Error

Next.js version: 15.5.6 (Webpack)


the above error is on the public products page http://localhost:3000/products  fix it and improve the UI/UX of it, all components/elements should be functional