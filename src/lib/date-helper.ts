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
export function toNepali(date: any, format: string = "YYYY-MM-DD"): string {
    try {
        if (!date) return "Invalid Date";

        let jsDate: Date;
        if (typeof date.toDate === 'function') {
            jsDate = date.toDate();
        } else if (typeof date === 'object' && date.seconds !== undefined) {
            jsDate = new Date(date.seconds * 1000);
        } else {
            jsDate = new Date(date);
        }

        // Check if valid date
        if (isNaN(jsDate.getTime())) return "Invalid Date";

        const bsDate = new NepaliDate(jsDate);

        if (format === 'DD MMM YYYY') {
            return bsDate.format('DD MMM YYYY', 'en');
        }
        return bsDate.format(format, 'en');
    } catch (e) {
        console.error("Date conversion error", e);
        return "Error";
    }
}

/**
 * Converts a date to Nepali Date + Time string
 */
export function formatDateTime(date: any, formatStr: string = "DD MMM YYYY"): string {
    const nepaliDate = toNepali(date, formatStr);
    if (nepaliDate === "Invalid Date") return "Invalid Date";

    try {
        let jsDate: Date;
        if (typeof date.toDate === 'function') {
            jsDate = date.toDate();
        } else if (typeof date === 'object' && date.seconds !== undefined) {
            jsDate = new Date(date.seconds * 1000);
        } else {
            jsDate = new Date(date);
        }

        let hours = jsDate.getHours();
        const minutes = jsDate.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'

        return `${nepaliDate}, ${hours}:${minutes} ${ampm}`;
    } catch (e) {
        return nepaliDate;
    }
}

/**
 * Returns today's date in Nepali BS (YYYY-MM-DD)
 */
export function getTodayNepali(): string {
    return new NepaliDate().format('YYYY-MM-DD', 'en');
}

/**
 * Converts "HH:MM" (24-hour) string to "h:MM AM/PM" format
 * @param timeStr - e.g., "14:30" or "09:15"
 */
export function formatTime(timeStr: string | undefined): string {
    if (!timeStr) return "";
    try {
        const [hours24, minutes] = timeStr.split(':');
        if (!hours24) return "";

        let h = parseInt(hours24);
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12; // the hour '0' should be '12'

        return `${h}:${minutes || "00"} ${ampm}`;
    } catch (e) {
        return timeStr;
    }
}
