# Gelato Print-on-Demand - Seller Guide

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Setup Instructions](#setup-instructions)
- [Creating POD Products](#creating-pod-products)
- [Order Management](#order-management)
- [Webhooks Configuration](#webhooks-configuration)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)

---

## Overview

**Gelato Print-on-Demand (POD)** integration allows you to sell custom-printed products without holding inventory. When a customer orders a POD product:

1. The order is automatically sent to Gelato
2. Gelato prints and produces the product
3. Gelato ships directly to your customer
4. You receive order status updates automatically

### Benefits

- ✅ **No Inventory Required** - Products are printed on demand
- ✅ **Global Fulfillment** - Gelato's worldwide production network
- ✅ **Automatic Processing** - Orders submitted automatically
- ✅ **Real-time Tracking** - Live updates on production and shipping
- ✅ **Your Own Account** - Use your personal Gelato account and pricing

---

## Getting Started

### Prerequisites

1. **Gelato Account**
   - Sign up at [https://www.gelato.com](https://www.gelato.com)
   - Complete business verification
   - Set up payment method

2. **API Access**
   - Navigate to Gelato Dashboard
   - Go to **Developer** → **API Keys**
   - Create a new API key for NextPik

3. **Find Your Store ID**
   - Check your Gelato dashboard URL: `dashboard.gelato.com/stores/YOUR_STORE_ID`
   - Or find it in **Settings** → **Store Information**

---

## Setup Instructions

### Step 1: Configure Gelato Integration

1. **Navigate to Settings**
   - Log in to your NextPik Seller Dashboard
   - Click **Account & Settings** in the sidebar
   - Select **Gelato POD**

2. **Enter Credentials**

   ```
   Gelato API Key:     [Your API key from Gelato dashboard]
   Gelato Store ID:    [Your store ID]
   Webhook Secret:     [Optional - for enhanced security]
   ```

3. **Test Connection**
   - Click **Test Connection** button
   - Wait for verification
   - You should see: "Connected successfully! Account: [Your Account Name]"

4. **Save Settings**
   - Click **Save Settings**
   - Your credentials are encrypted and stored securely
   - Connection status will show as "Connected & Verified"

5. **Enable Integration**
   - Toggle the "Enable" switch to ON
   - Integration is now active!

### Step 2: Configure Webhooks (Recommended)

Webhooks allow Gelato to send real-time updates about your orders.

1. **Copy Webhook URL**
   - In NextPik Gelato settings, find your unique webhook URL
   - Click **Copy** button
   - Example: `https://api.nextpik.com/api/v1/webhooks/gelato/Y2xrM3RleHQxMjM=`

2. **Configure in Gelato Dashboard**
   - Go to [Gelato Dashboard → Developer → Webhooks](https://dashboard.gelato.com/developer/webhooks)
   - Click **Create Webhook**
   - Paste your webhook URL
   - Select events:
     - ✅ `order_status_updated`
     - ✅ `order_item_tracking_code_updated`
   - (Optional) Enter webhook secret if you configured one
   - Click **Save**

3. **Verify Webhook**
   - Gelato will send a test webhook
   - Check that status shows "Active" in Gelato dashboard
   - You'll now receive automatic order updates!

---

## Creating POD Products

### Option 1: Convert Existing Product

1. Go to **Products** → Select your product
2. Scroll to **Print-on-Demand Configuration**
3. Click **Configure POD**
4. Select **Fulfillment Type**: `Gelato Print-on-Demand`
5. Choose Gelato product from catalog
6. Upload design files (if required)
7. Configure print areas
8. Click **Save Product**

### Option 2: Create New POD Product

1. Click **Add Product**
2. Fill in product details (name, description, price)
3. In **Fulfillment** section:
   - Select **Print-on-Demand**
   - Choose **Gelato** as provider
4. Browse Gelato catalog:
   - Filter by category (Apparel, Home & Living, Accessories, etc.)
   - Select product (e.g., "Premium T-Shirt")
5. Upload design:
   - Front design (recommended: 4500x5400px, 300 DPI, PNG with transparency)
   - Back design (optional)
   - Configure placement and sizing
6. Set your selling price:
   - Gelato base cost is shown automatically
   - Add your markup
   - Set final customer price
7. Click **Publish**

### Design Requirements

| Print Area       | Recommended Size | Format  | DPI |
| ---------------- | ---------------- | ------- | --- |
| T-Shirt Front    | 4500 x 5400 px   | PNG     | 300 |
| T-Shirt Back     | 4500 x 5400 px   | PNG     | 300 |
| Poster           | 5100 x 7200 px   | PNG/JPG | 300 |
| Mug (wraparound) | 2475 x 1155 px   | PNG     | 300 |
| Phone Case       | Product-specific | PNG     | 300 |

**Best Practices:**

- Use PNG with transparent background for apparel
- Use RGB color mode (not CMYK)
- Include bleed area where applicable
- Test print before launching product

---

## Order Management

### Automatic Order Submission

When a customer orders a POD product:

1. **Order Placed**
   - Customer completes checkout
   - Order created in NextPik

2. **Auto-Submission to Gelato**
   - System automatically submits to your Gelato account
   - No manual action required!
   - Order appears in Gelato dashboard within seconds

3. **Production**
   - Gelato produces the product
   - Quality check performed
   - Status updates sent via webhook

4. **Shipping**
   - Gelato ships to customer address
   - Tracking number generated
   - Customer receives tracking email

5. **Delivery**
   - Customer receives product
   - Order marked as delivered
   - You receive payment

### Manual Management

**View POD Orders:**

1. Go to **Orders** in sidebar
2. Filter by **Fulfillment Type**: POD
3. View status:
   - 🟡 Pending - Awaiting submission
   - 🔵 Submitted - Sent to Gelato
   - 🟠 Processing - Being produced
   - 🟢 Shipped - In transit
   - ✅ Delivered - Completed

**Track Individual Order:**

1. Click on order
2. View **POD Status** section
3. See:
   - Gelato order ID
   - Production status
   - Tracking number (when shipped)
   - Estimated delivery date

**Manually Submit Order:**
(If auto-submission fails or is disabled)

1. Go to order details
2. Click **Submit to Gelato**
3. Confirm submission
4. Order sent to your Gelato account

---

## Webhooks Configuration

### Why Use Webhooks?

Webhooks provide real-time updates without polling. You'll receive instant notifications when:

- Order production starts
- Order is printed
- Order ships
- Tracking number is assigned
- Order is delivered
- Any issues occur

### Webhook Events

| Event                              | Description           | When It Fires                  |
| ---------------------------------- | --------------------- | ------------------------------ |
| `order_status_updated`             | Order status changed  | Production, shipped, delivered |
| `order_item_tracking_code_updated` | Tracking number added | When order ships               |

### Webhook Payload Example

```json
{
  "event": "order_status_updated",
  "id": "evt_abc123",
  "data": {
    "orderId": "glt_order_xyz789",
    "status": "shipped",
    "trackingNumber": "1Z999AA10123456784",
    "carrier": "UPS",
    "estimatedDelivery": "2026-02-25"
  }
}
```

### Security

- Webhooks are sent to your unique URL containing your encrypted store ID
- Optional webhook secret verifies authenticity
- Uses `crypto.timingSafeEqual()` to prevent timing attacks

---

## Troubleshooting

### Connection Issues

**Problem:** "Connection test failed: API returned 403"

**Solution:**

1. Verify API key is correct (copy-paste from Gelato dashboard)
2. Check that API key has not expired
3. Ensure Store ID matches your Gelato account
4. Try generating a new API key

---

**Problem:** "Connection test failed: API returned 404"

**Solution:**

1. Double-check your Store ID
2. Ensure your Gelato account is active
3. Verify you're using the correct environment (production vs sandbox)

---

### Order Submission Issues

**Problem:** Order not submitting to Gelato

**Check:**

1. Is Gelato integration enabled? (Toggle switch ON)
2. Is connection verified? (Should show green checkmark)
3. Is product configured as POD? (Check fulfillment type)
4. Are design files uploaded?
5. Check error logs in order details

---

**Problem:** "POD product must be associated with a store"

**Solution:**

- This product is not linked to your store
- Edit product and re-save to associate with your store
- Contact support if issue persists

---

### Webhook Issues

**Problem:** Not receiving webhook updates

**Check:**

1. Webhook URL configured in Gelato dashboard?
2. Webhook status "Active" in Gelato?
3. Correct events selected?
4. Test webhook from Gelato dashboard
5. Check webhook secret matches (if used)

---

**Problem:** "Invalid webhook token" error in Gelato

**Solution:**

1. Ensure webhook secret in NextPik matches Gelato
2. If you didn't set a secret, leave it empty in both places
3. Re-save webhook in Gelato dashboard
4. Try removing and re-adding the webhook

---

## FAQ

### General

**Q: Do I need my own Gelato account?**
A: Yes! As of v2.9.0, each seller connects their own Gelato account. This gives you:

- Your own pricing and margins
- Direct relationship with Gelato
- Full control over production
- Access to Gelato dashboard

**Q: Can I use the platform's Gelato account instead?**
A: The platform account serves as a fallback only. We strongly recommend connecting your own account for better control and pricing.

**Q: How much does Gelato charge?**
A: Gelato charges per product based on type, size, and destination. View current pricing in your Gelato dashboard. You set the retail price customers pay.

**Q: Are my credentials secure?**
A: Yes! Credentials are encrypted using AES-256-GCM encryption before storage. API keys are never shown in full on the frontend.

### Products

**Q: What products can I sell?**
A: Gelato offers 100+ products including:

- Apparel (T-shirts, hoodies, tank tops)
- Home & Living (posters, canvas, mugs, pillows)
- Accessories (phone cases, tote bags)
- Stationery (notebooks, calendars)
- And more!

**Q: Can I sell the same design on multiple products?**
A: Yes! Create separate listings for each product type with the same design.

**Q: How do I set my prices?**
A: When creating a POD product:

1. Gelato base cost is shown automatically
2. Add your desired profit margin
3. Consider shipping costs
4. Set final customer-facing price

**Q: Can I order samples?**
A: Yes! Place a test order or order through your Gelato dashboard directly.

### Orders

**Q: When are orders submitted to Gelato?**
A: Automatically when customer completes payment! No manual action needed.

**Q: Can I cancel a POD order?**
A: Yes, but only before production starts. Once Gelato begins printing, cancellation may not be possible.

**Q: Who handles customer service?**
A: You handle customer inquiries. For production/shipping issues, contact Gelato support with the order ID.

**Q: What if there's a quality issue?**
A: Gelato has quality guarantees. File a claim through your Gelato dashboard within 30 days of delivery.

### Shipping

**Q: How long does production take?**
A: Typically 1-3 business days, depending on product type.

**Q: What are shipping times?**
A: Varies by destination:

- Domestic: 2-5 business days
- International: 5-10 business days

**Q: Who pays for shipping?**
A: Shipping costs are included in the product price. Gelato deducts production + shipping from your balance.

**Q: Can customers track their orders?**
A: Yes! Tracking numbers are provided automatically via webhook and shown in order details.

### Billing

**Q: When do I pay Gelato?**
A: Gelato charges your payment method when orders are produced. Set up prepayments or invoicing in your Gelato account settings.

**Q: When do I receive payment from customers?**
A: Customer payments follow NextPik's standard payout schedule (based on your payout settings).

**Q: What's my profit margin?**
A: Your profit = (Customer Price) - (Gelato Base Cost) - (Gelato Shipping) - (NextPik Commission)

---

## Support

### NextPik Support

- **Settings Issues:** Contact NextPik support
- **Integration Problems:** Check this guide first, then contact NextPik
- **Account Questions:** NextPik seller support

### Gelato Support

- **Production Issues:** Contact Gelato directly
- **Product Quality:** File claim in Gelato dashboard
- **Shipping Delays:** Gelato customer service
- **API Issues:** Gelato developer support

### Resources

- [Gelato Help Center](https://www.gelato.com/help)
- [Gelato API Documentation](https://developers.gelato.com)
- [Gelato Product Catalog](https://www.gelato.com/products)
- [NextPik Seller Guide](https://nextpik.com/seller-guide)

---

## Best Practices

### Product Setup

1. ✅ Use high-resolution designs (300 DPI minimum)
2. ✅ Test print samples before launching
3. ✅ Write clear product descriptions
4. ✅ Include multiple product images
5. ✅ Set competitive yet profitable prices

### Order Management

1. ✅ Enable webhooks for real-time updates
2. ✅ Monitor orders daily
3. ✅ Respond to customer inquiries promptly
4. ✅ Keep design files backed up
5. ✅ Review Gelato quality reports

### Customer Service

1. ✅ Set realistic delivery expectations
2. ✅ Provide tracking numbers proactively
3. ✅ Handle returns professionally
4. ✅ Collect customer feedback
5. ✅ Build a quality product portfolio

---

**Version:** 2.9.0
**Last Updated:** February 22, 2026
**Author:** NextPik Platform Team

For questions or support, contact: sellers@nextpik.com
