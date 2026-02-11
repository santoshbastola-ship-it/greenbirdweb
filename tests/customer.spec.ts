import { test, expect } from '@playwright/test';

test.describe('Customer User Flows', () => {

    test('Homepage loads correctly', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/Greenbird/i);
        // "Farm Fresh" is in the main hero h1
        await expect(page.locator('text=Farm Fresh').first()).toBeVisible();
    });

    test('Shop page lists products', async ({ page }) => {
        await page.goto('/shop');
        // Check identifying element. The grid is always there, so let's check for either products or the "No products" message
        // using valid locators
        const productCard = page.locator('a[href^="/shop/"]').first();
        const noProductsMsg = page.locator('text=No products found');

        await expect(productCard.or(noProductsMsg)).toBeVisible();

        if (await productCard.isVisible()) {
            await expect(page.locator('button:has-text("Add")').first()).toBeVisible();
        }
    });

    test('Product detail page loads', async ({ page }) => {
        await page.goto('/shop');
        // Target the product title link which is less likely to be obstructed than the image
        // The structure is Link > h3
        const productTitleLink = page.locator('a:has(h3)').first();

        // Only run if there are products
        if (await productTitleLink.isVisible()) {
            await productTitleLink.click();
            // Verify we are on a detail page
            await expect(page).toHaveURL(/\/shop\/.+/);
            // Verify product title (h1) or specific detail element
            await expect(page.locator('h1')).toBeVisible();
        } else {
            console.log('Skipping product detail test: No products found');
        }
    });

    // Basic Cart Flow
    test('Can add item to cart', async ({ page }) => {
        await page.goto('/shop');

        const addButton = page.locator('button:has-text("Add")').first();

        if (await addButton.isVisible()) {
            await addButton.click();

            // Verify button text changes to "Added"
            await expect(page.locator('button:has-text("Added")').first()).toBeVisible();

            // Go to cart page (assuming /cart)
            await page.goto('/cart');
            // Cart page says "Checkout" in h1 when items are present
            await expect(page.locator('h1')).toContainText('Checkout');
        } else {
            console.log('Skipping add to cart test: No products found');
        }
    });

});
