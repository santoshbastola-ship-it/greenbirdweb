/**
 * Cleans input by removing non-ASCII characters.
 * Allows only standard English keyboard characters (ASCII 32-126).
 * This strips out symbols from other languages (like Nepali), emojis, etc.
 * 
 * @param value The input string to clean
 * @returns The cleaned string containing only ASCII printable characters
 */
export const cleanInput = (value: string): string => {
    // Replace any character that is not in the printable ASCII range space to tilde, plus newline and carriage return
    return value.replace(/[^\x20-\x7E\x0A\x0D]/g, '');
};
