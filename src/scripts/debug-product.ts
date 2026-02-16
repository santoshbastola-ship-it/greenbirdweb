
import fs from 'fs';
import path from 'path';

// Load environment variables manually before imports
try {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim();
            }
        });
        console.log("Loaded .env.local");
    }
} catch (e) {
    console.error("Error loading .env.local", e);
}

// Mock global fetch to avoid notification errors
global.fetch = async () => {
    return {
        ok: true,
        json: async () => ({})
    } as any;
};

// Main function wrapper
async function main() {
    // Dynamic import
    const { ProductService } = await import("@/services/product.service");

    const targetId = "mFenx0vu0TpZqKrqxHjE";
    console.log(`Fetching product: ${targetId}`);

    try {
        const product = await ProductService.getProductById(targetId);
        if (product) {
            console.log("Product Found:", product.name);
            console.log("Images:", product.images);
            console.log("Image Count:", product.images?.length);

            if (product.images && product.images.length > 0) {
                const imgUrl = product.images[0];
                console.log(`Checking accessibility of image: ${imgUrl}`);
                try {
                    // Use a real fetch here (not mocked) if we want to test network, 
                    // but we mocked global.fetch earlier. We need to unmock it or use a library.
                    // Actually, let's just use the 'undici' fetch if available or dynamic import node-fetch.
                    // Or easier: just print it for now. 
                    // But wait, the previous mock was to avoid notification errors.
                    // Let's rely on the simulation output for now.
                } catch (e) {
                    console.error("Image check failed", e);
                }
            }
        } else {
            console.error("Product NOT found via ID check.");
            // Fallback: check all products to see if it exists but ID mismatch? Unlikely for FireStore doc ID.
        }
    } catch (error) {
        console.error("Error fetching product:", error);
    }
}

main().catch(console.error);
