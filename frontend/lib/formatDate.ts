
// frontend/lib/formatDate.ts

/**
 * A reusable utility function to format ISO 8601 timestamp strings
 * into the user's local time zone using the browser's Intl API.
 *
 * @param timestamp - The ISO string or datetime object to format.
 * @returns A formatted string (e.g., "10/29/25, 4:09:14 PM") or 'N/A' if the input is invalid.
 */
export function formatTimestampToLocal(timestamp: string | Date | undefined | null): string {
    // Return a fallback if the timestamp is null or undefined
    if (!timestamp) {
        return 'N/A';
    }

    let dateString = typeof timestamp === 'string' ? timestamp : timestamp.toISOString();

    // Append 'Z' to the timestamp to ensure it's parsed as UTC, if it doesn't already have timezone info
    if (!dateString.endsWith('Z') && !/[-+]\d{2}:\d{2}$/.test(dateString)) {
        dateString += 'Z';
    }

    const utcDate = new Date(dateString);

    // Check for an invalid date
    if (isNaN(utcDate.getTime())) {
        return 'N/A';
    }

    // Use Intl.DateTimeFormat to format the date in the user's local timezone
    const formatter = new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });

    return formatter.format(utcDate);
}

