/**
 * Cleans input by removing non-ASCII characters.
 * Allows only standard English keyboard characters (ASCII 32-126).
 * This strips out symbols from other languages (like Nepali), emojis, etc.
 * 
 * @param value The input string to clean
 * @returns The cleaned string containing only ASCII printable characters
 */
export const cleanInput = (value: string): string => {
    // Replace any character that is not in the printable ASCII range (hex 20 to 7E)
    return value.replace(/[^\x20-\x7E]/g, '');
};
