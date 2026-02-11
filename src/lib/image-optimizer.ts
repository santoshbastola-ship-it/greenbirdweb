import imageCompression from 'browser-image-compression';

export type ImageType = 'product' | 'activity' | 'blog' | 'bill';

interface OptimizationSettings {
    maxSizeMB: number;
    maxWidthOrHeight: number;
    useWebWorker: boolean;
}

const SETTINGS: Record<ImageType, OptimizationSettings & { fileType?: string }> = {
    product: {
        maxSizeMB: 0.1, // Reduced from 0.15 for lower size
        maxWidthOrHeight: 1024, // Reduced from 1200
        useWebWorker: true,
        fileType: 'image/webp'
    },
    activity: {
        maxSizeMB: 0.2, // Reduced from 0.25
        maxWidthOrHeight: 1600, // Reduced from 1920
        useWebWorker: true,
        fileType: 'image/webp'
    },
    blog: {
        maxSizeMB: 0.2, // Reduced from 0.25
        maxWidthOrHeight: 1600, // Reduced from 1920
        useWebWorker: true,
        fileType: 'image/webp'
    },
    bill: {
        maxSizeMB: 0.08, // Reduced from 0.1
        maxWidthOrHeight: 1024, // Reduced from 1200
        useWebWorker: true,
        fileType: 'image/webp'
    }
};

/**
 * Optimizes an image file by resizing and compressing it.
 * @param file The original image file
 * @param type The type of image (product, activity, blog) to apply specific settings
 * @returns A promise that resolves to the optimized File object
 */
export async function optimizeImage(file: File, type: ImageType = 'product'): Promise<File> {
    // If it's not an image, return it as is
    if (!file.type.startsWith('image/')) {
        return file;
    }

    try {
        const settings = SETTINGS[type];
        console.log(`Optimizing ${type} image: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);

        const optimizedFile = await imageCompression(file, settings);

        console.log(`Optimization complete: ${optimizedFile.name} (${(optimizedFile.size / 1024).toFixed(2)} KB)`);
        return optimizedFile;
    } catch (error) {
        console.error('Image optimization failed, returning original file:', error);
        return file;
    }
}
