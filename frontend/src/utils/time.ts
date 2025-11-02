/**
 * Converts a date string to Kuala Lumpur timezone and formats it as a string
 * @param dateString - Date string to convert (in UTC format)
 * @returns Formatted date string in Kuala Lumpur timezone
 */
export const convertToKualaLumpurTime = (dateString?: string | null): string => {
  if (!dateString) {
    return 'N/A';
  }

  try {
    // Ensure the date string is parsed as UTC
    let date;
    if (dateString.endsWith('Z')) {
      // Already in UTC format
      date = new Date(dateString);
    } else {
      // Assume it's UTC and add 'Z' if not present
      date = new Date(dateString + 'Z');
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    // Format to Kuala Lumpur timezone with full time
    return date.toLocaleString('en-US', { 
      timeZone: 'Asia/Kuala_Lumpur',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error converting time to Kuala Lumpur timezone:', error);
    return 'Invalid Date';
  }
};

/**
 * Converts a date string to Kuala Lumpur timezone and formats it as a time string only
 * @param dateString - Date string to convert (in UTC format)
 * @returns Formatted time string in Kuala Lumpur timezone
 */
export const convertToKualaLumpurTimeOnly = (dateString?: string | null): string => {
  if (!dateString) {
    return 'N/A';
  }

  try {
    // Ensure the date string is parsed as UTC
    let date;
    if (dateString.endsWith('Z')) {
      // Already in UTC format
      date = new Date(dateString);
    } else {
      // Assume it's UTC and add 'Z' if not present
      date = new Date(dateString + 'Z');
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    // Format to Kuala Lumpur timezone with time only
    return date.toLocaleTimeString('en-US', { 
      timeZone: 'Asia/Kuala_Lumpur',
      hour12: true
    });
  } catch (error) {
    console.error('Error converting time to Kuala Lumpur timezone:', error);
    return 'Invalid Date';
  }
};

/**
 * Converts a date string to Kuala Lumpur timezone and formats it as a date string only
 * @param dateString - Date string to convert (in UTC format)
 * @returns Formatted date string in Kuala Lumpur timezone
 */
export const convertToKualaLumpurDateOnly = (dateString?: string | null): string => {
  if (!dateString) {
    return 'N/A';
  }

  try {
    // Ensure the date string is parsed as UTC
    let date;
    if (dateString.endsWith('Z')) {
      // Already in UTC format
      date = new Date(dateString);
    } else {
      // Assume it's UTC and add 'Z' if not present
      date = new Date(dateString + 'Z');
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    // Format to Kuala Lumpur timezone with date only
    return date.toLocaleDateString('en-US', { 
      timeZone: 'Asia/Kuala_Lumpur'
    });
  } catch (error) {
    console.error('Error converting date to Kuala Lumpur timezone:', error);
    return 'Invalid Date';
  }
};

/**
 * Converts a recorded_at timestamp from heatmap data to Kuala Lumpur timezone
 * @param recordedAt - The recorded_at timestamp from VehiclePosition
 * @returns Formatted time string in Kuala Lumpur timezone
 */
export const convertHeatmapTimeToKualaLumpur = (recordedAt?: string | null): string => {
  return convertToKualaLumpurTimeOnly(recordedAt);
};

/**
 * Checks if a given UTC timestamp is within the specified time limit in the app's preferred timezone (Kuala Lumpur)
 * @param utcTimestamp - The UTC timestamp to check
 * @param timeLimitMinutes - The time limit in minutes
 * @returns boolean - true if the timestamp is within the time limit
 */
export const isWithinTimeLimitInKualaLumpur = (utcTimestamp: string, timeLimitMinutes: number): boolean => {
  try {
    // Parse the UTC timestamp
    let date;
    if (utcTimestamp.endsWith('Z')) {
      date = new Date(utcTimestamp);
    } else {
      date = new Date(utcTimestamp + 'Z');
    }
    
    if (isNaN(date.getTime())) {
      return false;
    }
    
    // Get current time in Kuala Lumpur timezone
    const nowKL = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kuala_Lumpur"}));
    
    // Convert the given timestamp to KL timezone equivalent 
    const timestampKL = new Date(date.toLocaleString("en-US", {timeZone: "Asia/Kuala_Lumpur"}));
    
    // Calculate time difference in milliseconds
    const timeDiffMs = nowKL.getTime() - timestampKL.getTime();
    
    // Convert time limit to milliseconds
    const timeLimitMs = timeLimitMinutes * 60 * 1000;
    
    // Return whether the difference is within the limit
    return timeDiffMs <= timeLimitMs;
  } catch (error) {
    console.error('Error checking time limit in Kuala Lumpur timezone:', error);
    return false;
  }
};
