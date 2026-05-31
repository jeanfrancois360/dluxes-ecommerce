-- CreateTable
CREATE TABLE "blog_post_products" (
    "id" TEXT NOT NULL,
    "blogPostId" TEXT NOT NULL,
    "affiliateProductId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_post_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "blog_post_products_blogPostId_idx" ON "blog_post_products"("blogPostId");

-- CreateIndex
CREATE INDEX "blog_post_products_affiliateProductId_idx" ON "blog_post_products"("affiliateProductId");

-- CreateIndex
CREATE UNIQUE INDEX "blog_post_products_blogPostId_affiliateProductId_key" ON "blog_post_products"("blogPostId", "affiliateProductId");

-- AddForeignKey
ALTER TABLE "blog_post_products" ADD CONSTRAINT "blog_post_products_blogPostId_fkey" FOREIGN KEY ("blogPostId") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_post_products" ADD CONSTRAINT "blog_post_products_affiliateProductId_fkey" FOREIGN KEY ("affiliateProductId") REFERENCES "affiliate_products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
