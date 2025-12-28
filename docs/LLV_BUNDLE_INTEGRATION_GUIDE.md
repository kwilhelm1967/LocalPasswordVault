# Local Legacy Vault Bundle Pricing Integration Guide

## Overview

This guide explains how to add bundle pricing to Local Legacy Vault's pricing page, similar to what exists on Local Password Vault's pricing page.

## Bundle Pricing Details

### Personal Bundle
- **Products**: Local Legacy Vault Personal ($49) + Local Password Vault Personal ($49)
- **Regular Price**: $98
- **Bundle Price**: $84
- **Savings**: $14 (14.3% discount)

### Family Protection Bundle
- **Products**: Local Legacy Vault Family ($129) + Local Password Vault Family ($79)
- **Regular Price**: $208
- **Bundle Price**: $179
- **Savings**: $29 (13.9% discount)

## Integration Steps

### Step 1: Add CSS Styles

1. Open your LLV `pricing.html` file
2. Find the `<style>` tag (or create one in the `<head>` section)
3. Copy the CSS from `docs/LLV_BUNDLE_PRICING_SECTION.html` (the `<style>` section)
4. Paste it into your existing styles
5. **Important**: Ensure your LLV site has these CSS variables defined:
   - `--bg-card`: Background color for cards
   - `--bg-darker`: Dark background color
   - `--text-primary`: Primary text color
   - `--text-secondary`: Secondary text color
   - `--text-muted`: Muted text color
   - `--border-subtle`: Subtle border color
   - `--brandGold`: Your gold brand color (e.g., `#c9ae66`)
   - `--green`: Green color for checkmarks and savings badges

### Step 2: Add HTML Section

1. In your `pricing.html`, find where you display individual pricing cards
2. After the individual pricing cards section, add the bundle section HTML from `docs/LLV_BUNDLE_PRICING_SECTION.html`
3. Place it before your comparison table or footer section

### Step 3: Update Links

1. Replace `REPLACE_WITH_BUNDLE_LINK` with your actual Stripe bundle checkout link
   - Personal Bundle: Should link to bundle checkout with personal bundle product
   - Family Bundle: Should link to bundle checkout with family bundle product
   - You may need separate links for each bundle, or use query parameters

2. Verify the link to Local Password Vault:
   - Currently set to: `https://localpasswordvault.com`
   - Update if your LPV site uses a different domain

### Step 4: Test Responsive Design

The bundle section is responsive and will stack on mobile devices. Test on:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (< 768px)

### Step 5: Verify Styling Matches Your Brand

The bundle section uses:
- **Gold colors** (`--brandGold`) for borders and buttons (matching LLV branding)
- **Green** for checkmarks and savings badges
- **Dark theme** matching your existing LLV design

Adjust colors if needed to match your exact brand colors.

## Color Customization

If your LLV site uses different color variables, update these in the CSS:

```css
/* Replace var(--brandGold) with your gold color */
border: 2px solid var(--brandGold);  /* or #c9ae66 */

/* Update gradient if needed */
background: linear-gradient(135deg, #c9ae66 0%, #a6873e 100%);
```

## Backend Integration

Ensure your backend supports bundle checkout:

1. **Stripe Products**: Create bundle products in Stripe:
   - Personal Bundle product
   - Family Bundle product

2. **Checkout Endpoint**: Your backend should handle:
   - `/api/checkout/bundle` - Create Stripe checkout session for bundles
   - Apply discount code `FAMILYBUNDLE` automatically (or handle discount server-side)

3. **License Generation**: When bundle is purchased:
   - Generate both LLV and LPV license keys
   - Send both keys in confirmation email
   - Activate both products for the customer

## Bundle Discount Code

The bundle uses discount code: **`FAMILYBUNDLE`**

- This should be applied automatically at checkout
- Or handled server-side when processing bundle purchases
- Update the code if you use a different discount code

## Testing Checklist

- [ ] Bundle section displays correctly on desktop
- [ ] Bundle section is responsive on mobile
- [ ] Bundle CTA buttons link to correct Stripe checkout
- [ ] "Learn About" links point to correct LPV pages
- [ ] Colors match LLV brand (gold theme)
- [ ] Pricing amounts are correct ($84 Personal, $179 Family)
- [ ] Savings badges display correctly
- [ ] Bundle info section explains LPV clearly

## Files Reference

- **Bundle HTML/CSS**: `docs/LLV_BUNDLE_PRICING_SECTION.html`
- **LPV Bundle Page**: `LPV/bundle.html` (for reference)
- **LPV Pricing Page**: `LPV/pricing.html` (for reference)

## Support

If you need to adjust the bundle pricing or styling, refer to:
- `LPV/bundle.html` - Full bundle page example
- `LPV/pricing.html` - Bundle section in pricing page example

Both files show how bundle pricing is implemented on the LPV site.

