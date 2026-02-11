import admin from "firebase-admin";
import sharp from "sharp";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import { tmpdir } from "os";

// Initialize Firebase Admin
// This script assumes you have GOOGLE_APPLICATION_CREDENTIALS set 
// or are running in an environment with default credentials.
if (!admin.apps.length) {
    admin.initializeApp({
        projectId: "greenbird-56584",
        storageBucket: "greenbird-56584.firebasestorage.app"
    });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

const COLLECTIONS = [
    { name: "products", imageField: "images" }, // Array of strings
    { name: "farm_activities", imageField: "media" }, // Array of {url, type}
    { name: "testimonials", imageField: "photoUrl" }, // String
    { name: "blog_posts", imageField: "imageUrl" } // String
];

async function downloadImage(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

async function convertToWebp(buffer) {
    return await sharp(buffer)
        .webp({ quality: 60, effort: 6 }) // Aggressive compression for "lowest size"
        .toBuffer();
}

async function processCollection({ name, imageField }) {
    console.log(`\nProcessing collection: ${name}`);
    const snapshot = await db.collection(name).get();
    console.log(`Found ${snapshot.size} documents.`);

    for (const doc of snapshot.docs) {
        const data = doc.data();
        let updated = false;
        const fieldValue = data[imageField];

        if (!fieldValue) continue;

        if (Array.isArray(fieldValue)) {
            // Handle array of images or media objects
            const newArray = [];
            for (const item of fieldValue) {
                const url = typeof item === 'string' ? item : item.url;
                if (url && !url.includes('.webp') && url.startsWith('http')) {
                    const newUrl = await processImage(url, name);
                    if (newUrl) {
                        newArray.push(typeof item === 'string' ? newUrl : { ...item, url: newUrl });
                        updated = true;
                    } else {
                        newArray.push(item);
                    }
                } else {
                    newArray.push(item);
                }
            }
            if (updated) {
                await doc.ref.update({ [imageField]: newArray });
            }
        } else if (typeof fieldValue === 'string' && fieldValue.startsWith('http') && !fieldValue.includes('.webp')) {
            // Handle single image URL
            const newUrl = await processImage(fieldValue, name);
            if (newUrl) {
                await doc.ref.update({ [imageField]: newUrl });
                updated = true;
            }
        }

        if (updated) {
            console.log(`  Updated document: ${doc.id}`);
        }
    }
}

async function processImage(url, folder) {
    try {
        console.log(`    Converting: ${url}`);
        const buffer = await downloadImage(url);
        const webpBuffer = await convertToWebp(buffer);

        // Extract filename from URL or generate one
        const urlObj = new URL(url);
        const oldPath = decodeURIComponent(urlObj.pathname.split('/o/')[1].split('?')[0]);
        const filename = oldPath.split('/').pop().split('.')[0];
        const newPath = `${folder}/${Date.now()}_${filename}.webp`;

        const file = bucket.file(newPath);
        await file.save(webpBuffer, {
            contentType: 'image/webp',
            metadata: {
                firebaseStorageDownloadTokens: Date.now().toString() // Simple token hack or just use public
            }
        });

        // Make it public
        await file.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${newPath}`;

        console.log(`    Uploaded to: ${publicUrl}`);

        // Note: In real Firebase, you'd usually use getDownloadURL from the client SDK, 
        // but for migration, storage.googleapis.com is fine or we can construct the firebasestorage link.
        const firebaseLink = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(newPath)}?alt=media`;

        // Mark old file for deletion (optional, could do it here)
        try {
            console.log(`    Deleting old file: ${oldPath}`);
            await bucket.file(oldPath).delete();
        } catch (e) {
            console.warn(`    Could not delete old file ${oldPath}: ${e.message}`);
        }

        return firebaseLink;
    } catch (error) {
        console.error(`    Error processing image ${url}:`, error.message);
        return null;
    }
}

async function run() {
    try {
        for (const config of COLLECTIONS) {
            await processCollection(config);
        }
        console.log("\nMigration completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

run();
