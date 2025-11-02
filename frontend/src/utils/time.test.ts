import { 
  convertToKualaLumpurTime, 
  convertToKualaLumpurTimeOnly, 
  convertToKualaLumpurDateOnly,
  convertHeatmapTimeToKualaLumpur 
} from './time';

describe('Time Utility Functions', () => {
  // Mock a specific date for testing
  const testDateString = '2025-10-30T10:30:00Z'; // UTC time

  test('convertToKualaLumpurTime should convert UTC to Kuala Lumpur time', () => {
    // Kuala Lumpur is UTC+8, so 10:30 UTC should be 18:30 in KL
    const result = convertToKualaLumpurTime(testDateString);
    expect(result).toContain('18:30:00'); // Contains the time component
    expect(result).toContain('10/30/2025'); // Contains the date component
  });

  test('convertToKualaLumpurTimeOnly should return time only in Kuala Lumpur timezone', () => {
    const result = convertToKualaLumpurTimeOnly(testDateString);
    expect(result).toBe('6:30:00 PM'); // 18:30 in 12-hour format
  });

  test('convertToKualaLumpurDateOnly should return date only in Kuala Lumpur timezone', () => {
    const result = convertToKualaLumpurDateOnly(testDateString);
    expect(result).toBe('10/30/2025'); // Date should be the same in this example
  });

  test('convertHeatmapTimeToKualaLumpur should work the same as convertToKualaLumpurTimeOnly', () => {
    const heatmapTimeResult = convertHeatmapTimeToKualaLumpur(testDateString);
    const timeOnlyResult = convertToKualaLumpurTimeOnly(testDateString);
    
    expect(heatmapTimeResult).toBe(timeOnlyResult);
  });

  test('should handle null input gracefully', () => {
    expect(convertToKualaLumpurTime(null)).toBe('N/A');
    expect(convertToKualaLumpurTimeOnly(null)).toBe('N/A');
    expect(convertToKualaLumpurDateOnly(null)).toBe('N/A');
    expect(convertToKualaLumpurTime(undefined)).toBe('N/A');
    expect(convertToKualaLumpurTimeOnly(undefined)).toBe('N/A');
    expect(convertToKualaLumpurDateOnly(undefined)).toBe('N/A');
  });

  test('should handle invalid date strings', () => {
    expect(convertToKualaLumpurTime('invalid date')).toBe('Invalid Date');
    expect(convertToKualaLumpurTimeOnly('invalid date')).toBe('Invalid Date');
    expect(convertToKualaLumpurDateOnly('invalid date')).toBe('Invalid Date');
  });
});