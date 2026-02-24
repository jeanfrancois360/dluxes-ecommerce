# Gelato Print-on-Demand (POD) - UX Guide

## Overview

This guide explains how the Gelato POD integration works in NextPik and the complete user experience for sellers.

---

## Key Concepts

### 1. Design File Upload - What is it and when is it needed?

**Purpose:**
The design file is the artwork that will be PRINTED on the physical product by Gelato.

**Examples:**

- Your logo for t-shirts
- Custom graphic for mugs
- Artwork for posters
- Photo for phone cases

**Important Distinction:**

- **Design File** (for Gelato printing) ≠ **Product Images** (for NextPik storefront)
- Design file goes to Gelato's printing facility
- Product images are what customers see when browsing your store

**File Requirements:**

- Formats: PNG, JPG, TIFF, PDF
- Max size: 50MB
- Should be print-ready and high-resolution

**Upload Options:**

- Upload a file from your computer
- Enter a URL to an existing design file

---

### 2. Markup Percentage - What is it and its impact?

**What is Markup Percentage?**

Markup percentage is YOUR profit margin added on top of Gelato's base production cost.

**How it Works:**

```
Gelato Base Cost: $10.00 (cost to produce and ship)
Markup: 50%
Your Profit: $5.00 (50% of $10)
Final Selling Price: $15.00

OR

Gelato Base Cost: $10.00
Markup: 100%
Your Profit: $10.00 (100% of $10)
Final Selling Price: $20.00
```

**Impact on Your Business:**

| Markup % | Profit per Sale | Price Competitiveness | Sales Volume |
| -------- | --------------- | --------------------- | ------------ |
| 30-50%   | Lower           | Very competitive      | Higher       |
| 50-80%   | Moderate        | Competitive           | Moderate     |
| 80-150%  | Higher          | Premium pricing       | Lower        |
| 150%+    | Very high       | Luxury pricing        | Much lower   |

**Recommendation:**

- Start with 50% markup (default)
- Adjust based on your market and competition
- Consider customer perceived value

**Where to Set Markup:**

- Global default: System Settings → Gelato POD
- Per-product override: Product Form → POD Configuration → "Markup Percentage"

---

### 3. What Happens After Selecting a Gelato Product?

When you select a Gelato product from the catalog, NextPik **automatically** populates the following product details to save you time:

#### **Auto-Populated Fields:**

1. **Product Name**
   - Populated from: Gelato product title
   - Example: "Bella Canvas 3001 - Unisex Short Sleeve T-Shirt"
   - You can edit this to make it more customer-friendly

2. **Product Description**
   - Populated from: Gelato product description + available variants
   - Includes: Base product details and available options (sizes, colors)
   - Example:

     ```
     High-quality unisex t-shirt made from 100% combed cotton.

     Available options:
     - Small (Size: S, Color: White)
     - Medium (Size: M, Color: Black)
     - Large (Size: L, Color: Navy)
     ```

3. **Suggested Price**
   - Calculated from: Gelato's base cost + your markup percentage
   - Formula: `Price = Base Cost × (1 + Markup% / 100)`
   - Example: If base cost is $10 and markup is 50%, suggested price is $15
   - You can adjust this price based on your strategy

4. **Product Preview Image** (if available)
   - The Gelato product preview is added to your product images
   - This gives customers a visual reference
   - You should replace this with mockups showing YOUR design on the product

#### **What You Still Need to Fill Manually:**

1. **Design File** - Your artwork that will be printed
2. **Product Category** - Where the product appears on your store
3. **Tags** - For better searchability
4. **Custom product images** - Mockups showing your design
5. **Inventory settings** - Stock management

---

## Complete Workflow: Creating a POD Product

### Step 1: Create Product Base

1. Go to Products → Add Product
2. Fill in basic product information (the system will auto-populate this later)
3. **Save the product** (POD configuration only works on saved products)

### Step 2: Configure POD Settings

1. Scroll to "Print-on-Demand (POD)" section
2. Click "Gelato POD" fulfillment type
3. Click "Search Gelato product catalog..."
4. Search for your desired base product (e.g., "t-shirt", "mug", "poster")
5. **Click on a product** from the list

### Step 3: Auto-Population Magic ✨

When you select a Gelato product, NextPik automatically:

- ✅ Fills product name
- ✅ Fills product description with variants
- ✅ Calculates and sets suggested price
- ✅ Adds preview image
- ✅ Shows success notification

### Step 4: Customize Auto-Filled Data

1. **Edit product name** to make it customer-friendly
   - From: "Bella Canvas 3001 - Unisex Short Sleeve T-Shirt"
   - To: "Premium Custom T-Shirt - Your Design Here"

2. **Enhance description** with your unique selling points
   - Add information about your design
   - Mention care instructions
   - Highlight unique features

3. **Adjust price** based on your market research
   - Compare with competitors
   - Consider customer perceived value

### Step 5: Upload Your Design

1. Click "Upload File" or "Enter URL" tab
2. Upload your print-ready design file
3. Verify file preview
4. Save

### Step 6: Set Markup (Optional)

- Use default global markup (recommended for most products)
- OR override with product-specific markup for premium items

### Step 7: Add Custom Product Images

1. Replace the auto-added Gelato preview with your own mockups
2. Show your design on the product from multiple angles
3. Use professional mockup generators (e.g., Placeit, Smartmockups)

### Step 8: Finalize & Publish

1. Review all auto-populated data
2. Add tags for SEO
3. Set product status to "ACTIVE"
4. Save & publish

---

## Customer Order Flow

### What Happens When a Customer Orders Your POD Product?

1. **Customer places order** on NextPik
2. **Payment is processed** via Stripe
3. **Gelato receives order automatically** (if auto-submit enabled)
4. **Gelato produces the product** using your design file
5. **Gelato ships directly to customer** from nearest facility
6. **Tracking info** is updated in NextPik
7. **You get paid** your profit (selling price - Gelato cost - platform commission)

### Important Notes:

**Shipping:**

- Gelato handles all shipping from their global network
- You should include estimated Gelato shipping costs in your product price or markup
- Platform shipping rates shown at checkout apply to non-POD items only

**Inventory:**

- POD products have unlimited "virtual" inventory
- No need to maintain physical stock
- Products are made on-demand

**Returns:**

- Platform return policy applies
- Gelato handles production quality issues
- You handle customer service for design-related concerns

---

## Pricing Strategy Guide

### How to Price Your POD Products Competitively

1. **Research Competitor Pricing**
   - Check similar products on Etsy, Redbubble, Printful
   - Note the price range for your product type

2. **Calculate Your Costs**

   ```
   Gelato Base Cost:        $10.00
   Platform Commission:     $2.00 (varies by plan)
   Gelato Shipping (est):   $4.00
   Total Cost:              $16.00
   ```

3. **Determine Your Profit Goal**

   ```
   If you want $5 profit per sale:
   Selling Price = $16.00 (costs) + $5.00 (profit) = $21.00

   Markup % = ($5 / $10) × 100 = 50%
   ```

4. **Test and Adjust**
   - Start with 50% markup
   - Monitor sales volume
   - Adjust based on market response

---

## Tips for Success

### Design Files:

- ✅ Use high-resolution images (300 DPI minimum)
- ✅ Follow Gelato's print area guidelines
- ✅ Test your design on Gelato's preview tools first
- ❌ Don't use low-resolution images from Google
- ❌ Don't violate copyright or trademarks

### Product Descriptions:

- ✅ Customize auto-filled descriptions
- ✅ Add your unique selling points
- ✅ Mention care instructions
- ✅ Highlight quality and sustainability
- ❌ Don't leave generic Gelato descriptions unchanged

### Pricing:

- ✅ Include shipping estimates in price
- ✅ Research competitor pricing
- ✅ Consider customer perceived value
- ✅ Test different price points
- ❌ Don't race to the bottom on price

### Marketing:

- ✅ Use professional product mockups
- ✅ Showcase your design in lifestyle photos
- ✅ Build your brand identity
- ✅ Engage with your target audience
- ❌ Don't just rely on Gelato's preview images

---

## Troubleshooting

### "Failed to load product details"

- **Cause:** Network issue or Gelato API unavailable
- **Solution:** Try refreshing the page and selecting the product again

### "Product price seems too low"

- **Cause:** Markup percentage not set correctly
- **Solution:** Verify markup percentage in POD configuration (default is 50%)

### "Design file upload failed"

- **Cause:** File too large or invalid format
- **Solution:** Check file size (<50MB) and format (PNG, JPG, TIFF, PDF)

### "Order not submitted to Gelato"

- **Cause:** Auto-submit might be disabled in system settings
- **Solution:** Contact admin or manually submit from Orders → POD Orders

---

## Frequently Asked Questions

**Q: Can I use the same design on multiple products?**
A: Yes! Create separate products for each Gelato base product (t-shirt, mug, poster) and upload the same design file.

**Q: Can I change the markup after publishing?**
A: Yes, you can update the markup percentage anytime. Existing orders are not affected.

**Q: What if the auto-filled price is too low?**
A: Always review and adjust the auto-filled price. It's just a suggestion based on your markup percentage.

**Q: Can I sell POD and self-fulfilled products together?**
A: Yes! You can have both types of products in your store. Each product can have its own fulfillment type.

**Q: Who handles customer support for POD orders?**
A: You handle general customer inquiries. Gelato handles production quality issues. Platform handles payment issues.

---

## Version

- **Feature Version:** 2.8.0
- **Last Updated:** February 23, 2026
- **Auto-Population Feature:** ✅ Active

---

## Need Help?

- **Technical Issues:** Contact platform support
- **Gelato Integration:** Check System Settings → Gelato POD
- **Design Guidelines:** Visit Gelato's design guide
- **Pricing Help:** Use the built-in markup calculator

---

_This guide is part of the NextPik Gelato POD Integration (v2.8.0)_
