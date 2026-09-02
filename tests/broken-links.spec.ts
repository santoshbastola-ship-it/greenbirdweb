
import { test, expect } from '@playwright/test';

test.describe('Broken Link Checker', () => {
    const visited = new Set<string>();
    const brokenLinks: { source: string, url: string, status: number }[] = [];

    // Simple recursive crawler or just a check of main pages
    // For this task, we will check main navigation and product links. 
    // A full crawler might be too slow for a deployment check, so we scope it.

    const pagesToCheck = [
        '/',
        '/shop',
        '/cart',
        '/login',
        '/booking',
        '/blog' // Added as user mentioned broken blog links before
    ];

    test('Check main pages for 404s', async ({ page }) => {
        for (const url of pagesToCheck) {
            console.log(`Checking ${url}...`);
            const response = await page.goto(url);
            expect(response?.status()).toBeLessThan(400);


        }
    });

    // Test specific known problematic areas
    test('Check Shop Product Links', async ({ page }) => {
        await page.goto('/shop');
        const productLinks = await page.locator('a[href^="/shop/"]').all();

        // Check first 3 products
        for (let i = 0; i < Math.min(productLinks.length, 3); i++) {
            const href = await productLinks[i].getAttribute('href');
            if (href) {
                console.log(`Checking product link: ${href}`);
                const response = await page.goto(href);
                if (response?.status() === 404) {
                    brokenLinks.push({ source: '/shop', url: href, status: 404 });
                }
                expect(response?.status()).toBeLessThan(400);
            }
        }
    });

    test('Report Broken Links', () => {
        if (brokenLinks.length > 0) {
            console.error('Found Broken Links:', brokenLinks);
            expect(brokenLinks.length).toBe(0);
        }
    });
});
