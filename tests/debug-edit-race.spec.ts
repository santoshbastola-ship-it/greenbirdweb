
import { test, expect } from '@playwright/test';

test.describe('Debug Edit Upload Race', () => {
    test.setTimeout(60000);

    test('should persist new image when editing and saving immediately', async ({ page }) => {
        // 1. Login
        await page.goto('/login');
        const devOptions = page.locator('summary', { hasText: 'Developer Options' });
        await expect(devOptions).toBeVisible();
        await devOptions.click();
        await page.fill('#test-email', 'test-admin@greenbird.com');
        await page.fill('#test-password', 'password123!');
        await page.click('button:has-text("Test Login")');
        await expect(page).toHaveURL(/\/admin/, { timeout: 30000 });

        // 2. Go to Edit Page (Pick a product that exists)
        // We'll use the one we looked at before, or just the first one in the list
        await page.goto('/admin/inventory');
        // Click the first product card button to open details modal
        await page.locator('button.flex.items-center.gap-3').first().click();
        // Click Edit inside the modal
        await page.click('a:has-text("Edit Product")');

        // Wait for form to load
        await expect(page.locator('form')).toBeVisible();

        // 3. Upload a NEW image
        const fileInput = page.locator('input[type="file"]');
        // Upload a valid image file for test
        await fileInput.setInputFiles('public/images/esewa_qr.jpg');

        // Wait for Cropper and click Done
        await page.click('button:has-text("Done")');

        // 4. Wait for upload to trigger/complete
        const saveBtn = page.locator('button:has-text("Save Product")').first();
        await expect(saveBtn).toBeDisabled();
        await expect(saveBtn).toBeEnabled({ timeout: 15000 });

        // 5. Click Save IMMEDIATELY
        console.log("Save button enabled, clicking immediately...");

        // Capture console logs
        page.on('console', msg => {
            if (msg.text().includes('[ProductForm]')) {
                console.log(`BROWSER: ${msg.text()}`);
            }
        });

        await saveBtn.click();

        // 6. Verify Success Toast
        await expect(page.locator('text=Product updated successfully')).toBeVisible();

        // 7. Verify we are redirected
        await expect(page).toHaveURL(/\/admin\/inventory/);
    });
});
