
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
        await page.click('a[href^="/admin/inventory/edit"]:first-child');

        // Wait for form to load
        await expect(page.locator('form')).toBeVisible();

        // 3. Upload a NEW image
        const fileInput = page.locator('input[type="file"]');
        const buffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
        await fileInput.setInputFiles({
            name: 'test-edit-image.jpg',
            mimeType: 'image/jpeg',
            buffer: buffer
        });

        // 4. Wait for upload to trigger/complete
        const saveBtn = page.locator('button:has-text("Save Product")');
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
