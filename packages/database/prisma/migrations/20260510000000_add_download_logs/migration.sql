-- CreateTable: download_logs
-- Tracks every file download per user/order/product for limit enforcement and auditing

CREATE TABLE "download_logs" (
    "id"            TEXT NOT NULL,
    "user_id"       TEXT NOT NULL,
    "order_id"      TEXT NOT NULL,
    "product_id"    TEXT NOT NULL,
    "downloaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address"    TEXT,

    CONSTRAINT "download_logs_pkey" PRIMARY KEY ("id")
);

-- Index for fast per-user lookups and limit checks
CREATE INDEX "download_logs_user_id_order_id_product_id_idx"
    ON "download_logs"("user_id", "order_id", "product_id");

CREATE INDEX "download_logs_downloaded_at_idx"
    ON "download_logs"("downloaded_at");
