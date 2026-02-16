
import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Debug Edit Mode Persistence', () => {
    test.setTimeout(60000);

    test('should show image in edit mode for reported product', async ({ page, context }) => {
        // 1. Login
        await page.goto('/login');
        const devOptions = page.locator('summary', { hasText: 'Developer Options' });
        await expect(devOptions).toBeVisible();
        await devOptions.click();
        await page.fill('#test-email', 'test-admin@greenbird.com');
        await page.fill('#test-password', 'password123!');
        await page.click('button:has-text("Test Login")');
        await expect(page).toHaveURL(/\/admin/, { timeout: 30000 });

        // 2. Go to Edit Page for specific ID
        const targetId = 'mFenx0vu0TpZqKrqxHjE';
        console.log(`Navigating to edit page for ${targetId}`);
        await page.goto(`/admin/inventory/edit?id=${targetId}`);

        // 3. Wait for form to load
        await expect(page.locator('form')).toBeVisible();

        // 4. Check for image
        // Wait for potential async data load
        await page.waitForTimeout(5000);

        const previewImage = page.locator('img[alt="Product 0"]'); // Index might be 0 or 1 based on gallery
        // Or generic check
        const anyImage = page.locator('.grid img');

        if (await anyImage.count() > 0) {
            console.log("SUCCESS: Image found in edit mode.");
            const src = await anyImage.first().getAttribute('src');
            console.log("Image Source:", src);
        } else {
            console.error("FAILURE: No images found in edit mode.");
        }

        await page.screenshot({ path: 'debug-edit-view.png', fullPage: true });
    });
});
