
import { test, expect } from '@playwright/test';

test('Debug Product Rendering', async ({ page }) => {
    // Navigate to the specific product view
    const targetUrl = '/shop?view=mFenx0vu0TpZqKrqxHjE';
    console.log(`Navigating to ${targetUrl}`);

    // Listen for console logs
    page.on('console', msg => {
        const text = msg.text();
        if (text.includes('[ProductImageGallery]') || text.includes('[ProductDetailView]')) {
            console.log(`BROWSER LOG: ${text}`);
        }
    });

    await page.goto(targetUrl);

    // Wait for product name to appear (ensures render)
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });

    // Wait a bit for async fetch/image load
    await page.waitForTimeout(5000);

    // Capture screenshot
    await page.screenshot({ path: 'debug-product-view.png', fullPage: true });
    console.log("Screenshot saved to debug-product-view.png");
});
