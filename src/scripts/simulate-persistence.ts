
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
    // Dynamic import to ensure env vars are set first
    const { ProductService } = await import("@/services/product.service");

    console.log("Starting persistence simulation...");

    const testProduct = {
        name: "Test Persistence Product " + Date.now(),
        businessType: "product" as const,
        categoryId: "test-category",
        currentPrice: 100,
        currentStock: 10,
        unit: "pcs",
        priceUnit: "pcs",
        images: ["https://example.com/test-image-1.jpg", "https://example.com/test-image-2.jpg"],
        description: "Test description",
        isAvailableForSale: true,
        showInApp: true,
        isFeatured: false,
        tags: ["Test"]
    };

    let productIdString = "";

    try {
        // 1. Create Product
        console.log("Creating product with images:", testProduct.images);
        const productId = await ProductService.createProduct(testProduct as any, "SimulationScript");
        productIdString = productId;
        console.log("Product created with ID:", productId);

        // 2. Fetch immediately
        const createdProduct = await ProductService.getProductById(productId);
        console.log("Fetched created product images:", createdProduct?.images);

        if (!createdProduct?.images || createdProduct.images.length === 0) {
            console.error("FAILURE: Images missing immediately after creation.");
            process.exit(1);
        } else {
            console.log("SUCCESS: Images persisted after creation.");
        }

        // 3. Update Product (simulate edit)
        const updates = {
            name: testProduct.name + " Updated",
            images: [...(createdProduct?.images || []), "https://example.com/test-image-3.jpg"]
        };

        console.log("Updating product with new image set:", updates.images);
        await ProductService.updateProduct(productId, updates as any, "SimulationScript");

        // 4. Fetch again
        const updatedProduct = await ProductService.getProductById(productId);
        console.log("Fetched updated product images:", updatedProduct?.images);

        if (updatedProduct?.images.length === 3) {
            console.log("SUCCESS: Images persisted after update.");
        } else {
            console.error(`FAILURE: Images missing or incorrect after update. Found: ${updatedProduct?.images.length} Expected: 3`);
            process.exit(1);
        }

        // Clean up
        await ProductService.deleteProduct(productId);
        console.log("Test product deleted.");
        console.log("FINAL RESULT: ALL TESTS PASSED");

    } catch (error) {
        console.error("Simulation failed:", error);
        // Attempt cleanup if possible
        if (productIdString) {
            try {
                await ProductService.deleteProduct(productIdString);
                console.log("Cleanup performed after error.");
            } catch (e) { }
        }
        process.exit(1);
    }
}

main().catch(console.error);
