#!/usr/bin/env node

/**
 * PWA Icon Generator
 * Generates all required PWA icon sizes from the base 512x512 icon
 * Requires: sharp (already installed in package.json)
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '../public/icons');
const BASE_ICON = path.join(ICONS_DIR, 'icon-512x512.png');

// Icon sizes to generate
const SIZES = [72, 96, 128, 144, 152, 180, 384];

// Maskable icon sizes (with safe zone padding)
const MASKABLE_SIZES = [192, 512];

async function generateIcons() {
    console.log('🎨 Generating PWA icons...\n');

    // Check if base icon exists
    if (!fs.existsSync(BASE_ICON)) {
        console.error('❌ Base icon not found:', BASE_ICON);
        process.exit(1);
    }

    // Generate standard icons
    for (const size of SIZES) {
        const outputPath = path.join(ICONS_DIR, `icon-${size}x${size}.png`);

        try {
            await sharp(BASE_ICON)
                .resize(size, size, {
                    fit: 'contain',
                    background: { r: 255, g: 255, b: 255, alpha: 0 }
                })
                .png()
                .toFile(outputPath);

            console.log(`✅ Generated: icon-${size}x${size}.png`);
        } catch (error) {
            console.error(`❌ Failed to generate icon-${size}x${size}.png:`, error.message);
        }
    }

    // Generate maskable icons (with 20% safe zone padding)
    for (const size of MASKABLE_SIZES) {
        const outputPath = path.join(ICONS_DIR, `icon-maskable-${size}x${size}.png`);
        const innerSize = Math.floor(size * 0.8); // 80% of total size
        const padding = Math.floor((size - innerSize) / 2);

        try {
            // Create a canvas with the full size
            await sharp(BASE_ICON)
                .resize(innerSize, innerSize, {
                    fit: 'contain',
                    background: { r: 255, g: 255, b: 255, alpha: 0 }
                })
                .extend({
                    top: padding,
                    bottom: padding,
                    left: padding,
                    right: padding,
                    background: { r: 252, g: 249, b: 241, alpha: 1 } // Cream background
                })
                .png()
                .toFile(outputPath);

            console.log(`✅ Generated: icon-maskable-${size}x${size}.png`);
        } catch (error) {
            console.error(`❌ Failed to generate icon-maskable-${size}x${size}.png:`, error.message);
        }
    }

    // Generate favicon.ico (using 32x32)
    const faviconPath = path.join(__dirname, '../public/favicon.ico');
    try {
        await sharp(BASE_ICON)
            .resize(32, 32, {
                fit: 'contain',
                background: { r: 255, g: 255, b: 255, alpha: 0 }
            })
            .toFile(faviconPath);

        console.log(`✅ Generated: favicon.ico`);
    } catch (error) {
        console.error(`❌ Failed to generate favicon.ico:`, error.message);
    }

    console.log('\n✨ Icon generation complete!');
}

generateIcons().catch(error => {
    console.error('❌ Icon generation failed:', error);
    process.exit(1);
});
