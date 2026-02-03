
/**
 * Helper to remove undefined values for Firestore (recursive).
 * Firestore does not support 'undefined' values in documents.
 * This function recursively traverses the object and removes keys with undefined values.
 * It also handles arrays.
 */
export const sanitizeFirestoreData = (data: any): any => {
    if (data === null || typeof data !== 'object') {
        return data; // Return primitives as is
    }

    if (data === undefined) {
        return null; // Or undefined if we want to filter it out in parent, but usually we just want to avoid undefined in values. 
        // Actually, if we return undefined here, the parent assignment might keep it as undefined.
        // Best approach for Firestore: duplicate the structure sans undefined keys.
    }

    if (Array.isArray(data)) {
        return data.map(sanitizeFirestoreData).filter(item => item !== undefined);
        // Note: filtering undefined from arrays might shift indices, but generally undefined in array is rare/bad.
        // If we want to preserve length, we should replace with null.
        // Let's replace with null for arrays if it's undefined (though recursive call handles that).
    }

    const sanitized: any = {};
    Object.keys(data).forEach(key => {
        const value = data[key];
        if (value !== undefined) {
            const cleanValue = sanitizeFirestoreData(value);
            // If the recursive result is not undefined (or we decide to accept null), keep it.
            if (cleanValue !== undefined) {
                sanitized[key] = cleanValue;
            }
        }
    });
    return sanitized;
};
