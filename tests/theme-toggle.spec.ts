import { test, expect } from '@playwright/test';

test.describe('Dark Mode Toggle', () => {
    test('should toggle dark mode class on html element', async ({ page }) => {
        // Go to homepage
        await page.goto('/');

        // Check initial state (assuming system default or light)
        // We can't easily predict system default in headless, but we can check the toggle interaction.

        // Find the toggle button in the desktop navbar (it's visible on desktop)
        // There are two toggles (desktop and mobile), let's target the desktop one if visible, or force mobile view.
        // Let's assume desktop view for this test.
        await page.setViewportSize({ width: 1280, height: 720 });

        const toggleBtn = page.locator('button[aria-label="Toggle theme"]').first();
        await expect(toggleBtn).toBeVisible();

        // Get current html class
        const html = page.locator('html');
        const initialClass = await html.getAttribute('class');

        // Click toggle
        await toggleBtn.click();

        // Check if class changed
        const newClass = await html.getAttribute('class');
        expect(newClass).not.toBe(initialClass);

        // Verify specific class presence
        if (initialClass?.includes('dark')) {
            expect(newClass).not.toContain('dark');
        } else {
            expect(newClass).toContain('dark');
        }

        // Click again to revert
        await toggleBtn.click();
        const revertedClass = await html.getAttribute('class');

        // Should be back to initial state (or close to it, next-themes manages 'style' attribute too)
        if (initialClass?.includes('dark')) {
            expect(revertedClass).toContain('dark');
        } else {
            expect(revertedClass).not.toContain('dark');
        }
    });

    test('should persist theme preference', async ({ page }) => {
        await page.goto('/');

        // Force dark mode
        const toggleBtn = page.locator('button[aria-label="Toggle theme"]').first();
        const html = page.locator('html');

        // Ensure we start in a known state (Light)
        const initialClass = await html.getAttribute('class');
        if (initialClass?.includes('dark')) {
            await toggleBtn.click();
        }

        // Now switch to Dark
        await toggleBtn.click();
        await expect(html).toHaveClass(/dark/);

        // Reload page
        await page.reload();

        // Should still be dark
        await expect(html).toHaveClass(/dark/);
    });
});
