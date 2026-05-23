-- CreateTable
CREATE TABLE "blog_post_views" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_post_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_post_likes" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_post_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_post_comments" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,
    "body" TEXT NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_post_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "blog_post_views_postId_idx" ON "blog_post_views"("postId");

-- CreateIndex
CREATE INDEX "blog_post_views_userId_idx" ON "blog_post_views"("userId");

-- CreateIndex
CREATE INDEX "blog_post_likes_postId_idx" ON "blog_post_likes"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "blog_post_likes_postId_userId_key" ON "blog_post_likes"("postId", "userId");

-- CreateIndex
CREATE INDEX "blog_post_comments_postId_idx" ON "blog_post_comments"("postId");

-- CreateIndex
CREATE INDEX "blog_post_comments_parentId_idx" ON "blog_post_comments"("parentId");

-- AddForeignKey
ALTER TABLE "blog_post_views" ADD CONSTRAINT "blog_post_views_postId_fkey" FOREIGN KEY ("postId") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_post_views" ADD CONSTRAINT "blog_post_views_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_post_likes" ADD CONSTRAINT "blog_post_likes_postId_fkey" FOREIGN KEY ("postId") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_post_likes" ADD CONSTRAINT "blog_post_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_post_comments" ADD CONSTRAINT "blog_post_comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_post_comments" ADD CONSTRAINT "blog_post_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_post_comments" ADD CONSTRAINT "blog_post_comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "blog_post_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
