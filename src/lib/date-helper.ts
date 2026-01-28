import NepaliDate from "nepali-date-converter";

/**
 * Converts a JavaScript Date object (AD) to a Nepali Date string (BS)
 * @param date - standard JS Date object
 * @param format - output format (default: 'YYYY-MM-DD')
 *                 Formats:
 *                 'YYYY-MM-DD' -> 2080-12-15
 *                 'DD MMM YYYY' -> 15 Chaitra 2080
 *                 'np' -> Returns raw NepaliDate object
 */
export function toNepali(date: Date | string | number, format: string = "YYYY-MM-DD"): string {
    try {
        const jsDate = new Date(date);

        // Check if valid date
        if (isNaN(jsDate.getTime())) return "Invalid Date";

        const bsDate = new NepaliDate(jsDate);

        // Global override: Always formatted as YYYY-MM-DD as per user request
        // if (format === 'DD MMM YYYY') {
        //    return bsDate.format('DD MMM YYYY', 'en');
        // }
        return bsDate.format('YYYY-MM-DD', 'en');
    } catch (e) {
        console.error("Date conversion error", e);
        return "Error";
    }
}

/**
 * Returns today's date in Nepali BS (YYYY-MM-DD)
 */
export function getTodayNepali(): string {
    return new NepaliDate().format('YYYY-MM-DD', 'en');
}
