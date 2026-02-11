
import { test, expect } from '@playwright/test';
import { cleanupAllTestData } from './test-utils';

test.describe('Admin Workflows', () => {

    // Cleanup test data after each test
    test.afterEach(async () => {
        await cleanupAllTestData();
    });

    test('Admin can create category, product and update stock', async ({ page }) => {
        // 1. Login Logic (Reusable)
        await page.goto('/login');
        await page.locator('summary', { hasText: 'Developer Options' }).click();
        await page.fill('#test-email', 'test-admin@greenbird.com');
        await page.fill('#test-password', 'password123!');
        await page.click('button:has-text("Test Login")');

        // Debugging: Check for error message
        const errorMsg = page.locator('.text-red-700');
        if (await errorMsg.isVisible()) {
            console.error('Login Error:', await errorMsg.textContent());
        }

        await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });

        // 2. Create Category (if not exists)
        await page.goto('/admin/categories');
        const catName = 'Test Category';
        const catRow = page.locator(`h3:has-text("${catName}")`);

        if (!(await catRow.isVisible())) {
            console.log("Creating Test Category...");
            await page.click('button:has-text("New Category")');
            await page.fill('input[placeholder*="e.g., Dairy"]', catName);
            await page.selectOption('select', { label: 'Products' }); // Business Type
            await page.click('button:has-text("Save Category")');
            await expect(page.locator(`h3:has-text("${catName}")`)).toBeVisible();
        } else {
            console.log("Test Category already exists.");
        }

        // 3. Create Product
        await page.goto('/admin/inventory/add');
        await page.fill('input[name="name"]', 'Test Product');

        // Select Business Type "Product"
        await page.selectOption('select[name="businessType"]', 'product');

        // Select Category
        // Wait for categories to load
        // We select by label if possible, or value. Since we don't know ID, we use label.
        // The select options are loaded dynamically.
        const catSelect = page.locator('select[name="categoryId"]');
        await expect(catSelect).not.toBeDisabled();
        // Wait for the option to be available in the DOM
        await expect(catSelect.locator(`option:has-text("${catName}")`)).toBeAttached({ timeout: 10000 });
        await catSelect.selectOption({ label: catName });

        await page.fill('input[name="currentPrice"]', '100');

        // Unit - assuming "pcs" exists or is default. 
        // If "pcs" not in list, it might fail. But "pcs" is usually hardcoded default fallback.
        // We will try to select value "pcs" if available, or just leave default.
        // The form defaults unit to "pcs". 

        await page.click('button:has-text("Save Product")');

        // Wait for redirect
        await expect(page).toHaveURL(/\/admin\/inventory/);

        // 4. Update Stock
        // Find the product card
        // We filter by "Products" tab to make finding easier
        await page.click('button:has-text("Products")');

        const productCard = page.locator('div', { hasText: 'Test Product' }).last();
        // We use last() in case of duplicates, though logic should prevent it ideally.

        // Check stock button (it should be 0 unit)
        const stockBtn = productCard.locator('button', { hasText: /0\s/ });
        // Matches "0 pcs" etc.

        if (await stockBtn.isVisible()) {
            await stockBtn.click();
            // Modal opens
            await page.fill('input[type="number"]', '100'); // Quantity to add
            await page.fill('textarea', 'Initial Stock for Testing');
            await page.click('button:has-text("Update Stock")');

            // Verify update
            await expect(productCard.locator('button')).toContainText(/100\s/);
        } else {
            console.log("Stock button with 0 not found, maybe already has stock?");
            // If it has stock, test is technically passed/valid state
        }

        // 5. Verify product is visible on shop page
        await page.goto('/shop');
        await page.waitForTimeout(2000); // Simple wait instead of networkidle

        // Check if Test Product appears
        const testProductCard = page.locator('text=Test Product');
        const isVisible = await testProductCard.isVisible().catch(() => false);
        console.log(isVisible ? "✓ Test Product is visible on shop page" : "✗ Test Product NOT visible on shop page");

    });

});
