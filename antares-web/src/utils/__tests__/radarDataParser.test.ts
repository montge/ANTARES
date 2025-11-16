import { describe, it, expect } from 'vitest';
import { parseCSVTrack } from '../radarDataParser';

describe('radarDataParser', () => {
  describe('parseCSVTrack', () => {
    const validCSVLine = '1,2025,11,15,12,30,45,123,CA,TARGET,,0,100,500.5,1.2,4.0,-72.0,10.5,0.5,25,12,0,50,0.1,5.0';

    it('should parse a valid CSV line correctly', () => {
      const result = parseCSVTrack(validCSVLine);

      expect(result).not.toBeNull();
      expect(result?.id).toBe('1');
      expect(result?.range).toBe(500.5);
      expect(result?.lat).toBe(4.0);
      expect(result?.long).toBe(-72.0);
      expect(result?.quality).toBe(25);
      expect(result?.type).toBe('TARGET');
    });

    it('should convert azimuth from radians to degrees', () => {
      // 1.2 radians = ~68.755 degrees
      const result = parseCSVTrack(validCSVLine);

      expect(result).not.toBeNull();
      expect(result?.azimuth).toBeCloseTo(68.755, 2);
    });

    it('should convert course from radians to degrees', () => {
      // 0.5 radians = ~28.648 degrees
      const result = parseCSVTrack(validCSVLine);

      expect(result).not.toBeNull();
      expect(result?.velocity?.heading).toBeCloseTo(28.648, 2);
    });

    it('should parse velocity correctly', () => {
      const result = parseCSVTrack(validCSVLine);

      expect(result).not.toBeNull();
      expect(result?.velocity).toBeDefined();
      expect(result?.velocity?.speed).toBe(10.5);
    });

    it('should create a valid timestamp from date components', () => {
      const result = parseCSVTrack(validCSVLine);

      expect(result).not.toBeNull();
      expect(result?.timestamp).toBeDefined();

      // Verify it's a valid timestamp
      const date = new Date(result!.timestamp!);
      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(10); // November (0-indexed)
      expect(date.getDate()).toBe(15);
      expect(date.getHours()).toBe(12);
      expect(date.getMinutes()).toBe(30);
      expect(date.getSeconds()).toBe(45);
      expect(date.getMilliseconds()).toBe(123);
    });

    it('should handle empty name field correctly', () => {
      const result = parseCSVTrack(validCSVLine);

      expect(result).not.toBeNull();
      expect(result?.name).toBeUndefined();
    });

    it('should parse name when present', () => {
      const csvWithName = '1,2025,11,15,12,30,45,123,CA,ATON,Lighthouse-1,0,100,500.5,1.2,4.0,-72.0,10.5,0.5,25,12,0,50,0.1,5.0';
      const result = parseCSVTrack(csvWithName);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Lighthouse-1');
    });

    it('should handle empty size as undefined', () => {
      const csvWithEmptySize = '1,2025,11,15,12,30,45,123,CA,TARGET,,0,,500.5,1.2,4.0,-72.0,10.5,0.5,25,12,0,50,0.1,5.0';
      const result = parseCSVTrack(csvWithEmptySize);

      expect(result).not.toBeNull();
      expect(result?.size).toBeUndefined();
    });

    it('should parse size when present', () => {
      const result = parseCSVTrack(validCSVLine);

      expect(result).not.toBeNull();
      expect(result?.size).toBe(100);
    });

    it('should return null for malformed CSV with too few fields', () => {
      const invalidCSV = '1,2025,11,15,12,30,45,123,CA,TARGET';
      const result = parseCSVTrack(invalidCSV);

      expect(result).toBeNull();
    });

    it('should handle CSV with extra fields gracefully', () => {
      const csvWithExtra = validCSVLine + ',extra,fields';
      const result = parseCSVTrack(csvWithExtra);

      // Should still parse the first 25 fields correctly
      expect(result).not.toBeNull();
      expect(result?.id).toBe('1');
    });

    it('should return null for empty string', () => {
      const result = parseCSVTrack('');

      expect(result).toBeNull();
    });

    it('should handle invalid numeric values gracefully', () => {
      const invalidNumeric = '1,2025,11,15,12,30,45,123,CA,TARGET,,0,100,invalid,1.2,4.0,-72.0,10.5,0.5,25,12,0,50,0.1,5.0';
      const result = parseCSVTrack(invalidNumeric);

      // parseFloat('invalid') returns NaN
      expect(result).not.toBeNull();
      expect(result?.range).toBeNaN();
    });

    it('should handle negative coordinates correctly', () => {
      const result = parseCSVTrack(validCSVLine);

      expect(result).not.toBeNull();
      expect(result?.long).toBe(-72.0);
      expect(result?.lat).toBe(4.0);
    });

    it('should handle zero speed correctly', () => {
      const csvWithZeroSpeed = '1,2025,11,15,12,30,45,123,CA,TARGET,,0,100,500.5,1.2,4.0,-72.0,0.0,0.5,25,12,0,50,0.1,5.0';
      const result = parseCSVTrack(csvWithZeroSpeed);

      expect(result).not.toBeNull();
      expect(result?.velocity?.speed).toBe(0.0);
    });

    it('should handle very large range values', () => {
      const csvWithLargeRange = '1,2025,11,15,12,30,45,123,CA,TARGET,,0,100,999999.99,1.2,4.0,-72.0,10.5,0.5,25,12,0,50,0.1,5.0';
      const result = parseCSVTrack(csvWithLargeRange);

      expect(result).not.toBeNull();
      expect(result?.range).toBe(999999.99);
    });

    it('should handle special characters in name field', () => {
      const csvWithSpecialChars = '1,2025,11,15,12,30,45,123,CA,ATON,Ship-#1_Test,0,100,500.5,1.2,4.0,-72.0,10.5,0.5,25,12,0,50,0.1,5.0';
      const result = parseCSVTrack(csvWithSpecialChars);

      expect(result).not.toBeNull();
      expect(result?.name).toBe('Ship-#1_Test');
    });

    it('should handle full circle azimuth (2π radians)', () => {
      const csv2Pi = '1,2025,11,15,12,30,45,123,CA,TARGET,,0,100,500.5,6.283185307,4.0,-72.0,10.5,0.5,25,12,0,50,0.1,5.0';
      const result = parseCSVTrack(csv2Pi);

      expect(result).not.toBeNull();
      // 2π radians = 360 degrees
      expect(result?.azimuth).toBeCloseTo(360, 1);
    });

    it('should handle invalid date components', () => {
      const csvInvalidDate = 'invalid,invalid,invalid,invalid,invalid,invalid,invalid,invalid,CA,TARGET,,0,100,500.5,1.2,4.0,-72.0,10.5,0.5,25,12,0,50,0.1,5.0';
      const result = parseCSVTrack(csvInvalidDate);

      // Should still create result but with Invalid Date
      expect(result).not.toBeNull();
      expect(result?.timestamp).toBeDefined();
      expect(Number.isNaN(result?.timestamp)).toBe(true);
    });

    it('should preserve precision for decimal values', () => {
      const csvPrecise = '1,2025,11,15,12,30,45,123,CA,TARGET,,0,100.123456,500.654321,1.234567,4.0,-72.0,10.5,0.5,25,12,0,50,0.1,5.0';
      const result = parseCSVTrack(csvPrecise);

      expect(result).not.toBeNull();
      expect(result?.size).toBeCloseTo(100.123456, 5);
      expect(result?.range).toBeCloseTo(500.654321, 5);
    });

    it('should handle whitespace in fields', () => {
      const csvWithSpaces = '1 ,2025,11,15,12,30,45,123, CA , TARGET ,,0,100,500.5,1.2,4.0,-72.0,10.5,0.5,25,12,0,50,0.1,5.0';
      const result = parseCSVTrack(csvWithSpaces);

      // String fields preserve whitespace, numeric parsing ignores it
      expect(result).not.toBeNull();
      expect(result?.id).toBe('1 ');
      expect(result?.type).toBe(' TARGET ');
    });

    it('should parse all track types correctly', () => {
      const targetCSV = '1,2025,11,15,12,30,45,123,CA,TARGET,,0,100,500.5,1.2,4.0,-72.0,10.5,0.5,25,12,0,50,0.1,5.0';
      const atonCSV = '2,2025,11,15,12,30,45,123,CA,ATON,Buoy-1,0,100,500.5,1.2,4.0,-72.0,0.0,0.0,25,12,0,50,0.1,5.0';

      const targetResult = parseCSVTrack(targetCSV);
      const atonResult = parseCSVTrack(atonCSV);

      expect(targetResult?.type).toBe('TARGET');
      expect(atonResult?.type).toBe('ATON');
    });

    it('should handle scientific notation in numeric fields', () => {
      const csvScientific = '1,2025,11,15,12,30,45,123,CA,TARGET,,0,1e2,5.005e2,1.2,4.0,-7.2e1,10.5,0.5,25,12,0,50,0.1,5.0';
      const result = parseCSVTrack(csvScientific);

      expect(result).not.toBeNull();
      expect(result?.size).toBe(100); // 1e2 = 100
      expect(result?.range).toBe(500.5); // 5.005e2 = 500.5
      expect(result?.long).toBe(-72); // -7.2e1 = -72
    });
  });
});
