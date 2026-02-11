import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { optimizeImage } from "@/lib/image-optimizer";

export const UploadService = {
    /**
     * Optimizes and uploads a document to Firebase Storage
     * @param file The file to upload
     * @param folder The folder path in storage (e.g., 'bills', 'tasks')
     * @returns Promise resolving to the download URL
     */
    uploadDocument: async (file: File, folder: string): Promise<string> => {
        try {
            console.log(`Starting document upload to ${folder}:`, file.name);

            // 1. Optimize image (convert to webp and compress)
            const optimizedFile = await optimizeImage(file, 'bill');

            // 2. Create storage reference
            // Use timestamp and sanitized filename to avoid collisions
            const fileName = `${Date.now()}_${optimizedFile.name.split('.')[0]}.webp`;
            const storageRef = ref(storage, `${folder}/${fileName}`);

            // 3. Upload
            const snapshot = await uploadBytes(storageRef, optimizedFile);

            // 4. Get URL
            const downloadURL = await getDownloadURL(snapshot.ref);

            console.log("Document upload successful:", downloadURL);
            return downloadURL;
        } catch (error) {
            console.error("Error in UploadService.uploadDocument:", error);
            throw error;
        }
    }
};
