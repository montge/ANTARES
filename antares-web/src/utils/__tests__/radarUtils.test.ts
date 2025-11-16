import { describe, it, expect } from 'vitest';
import { polarToCartesian, findTrackAtCoordinates, formatCoordinates } from '../radarUtils';
import { Track, RadarInfo } from '../../types/radar';

describe('radarUtils', () => {
  describe('polarToCartesian', () => {
    const centerX = 300;
    const centerY = 300;
    const radius = 250;
    const maxRange = 10000; // 10km in meters

    it('should convert 0 degrees (North) correctly', () => {
      const result = polarToCartesian(5000, 0, maxRange, centerX, centerY, radius);

      // At 0 degrees (North), x should be centerX, y should be centerY - distance
      expect(result.x).toBeCloseTo(centerX, 1);
      expect(result.y).toBeCloseTo(centerY - 125, 1); // 5000/10000 * 250 = 125
    });

    it('should convert 90 degrees (East) correctly', () => {
      const result = polarToCartesian(5000, 90, maxRange, centerX, centerY, radius);

      // At 90 degrees (East), x should be centerX + distance, y should be centerY
      expect(result.x).toBeCloseTo(centerX + 125, 1);
      expect(result.y).toBeCloseTo(centerY, 1);
    });

    it('should convert 180 degrees (South) correctly', () => {
      const result = polarToCartesian(5000, 180, maxRange, centerX, centerY, radius);

      // At 180 degrees (South), x should be centerX, y should be centerY + distance
      expect(result.x).toBeCloseTo(centerX, 1);
      expect(result.y).toBeCloseTo(centerY + 125, 1);
    });

    it('should convert 270 degrees (West) correctly', () => {
      const result = polarToCartesian(5000, 270, maxRange, centerX, centerY, radius);

      // At 270 degrees (West), x should be centerX - distance, y should be centerY
      expect(result.x).toBeCloseTo(centerX - 125, 1);
      expect(result.y).toBeCloseTo(centerY, 1);
    });

    it('should handle zero range', () => {
      const result = polarToCartesian(0, 45, maxRange, centerX, centerY, radius);

      // Zero range should place point at center
      expect(result.x).toBe(centerX);
      expect(result.y).toBe(centerY);
    });

    it('should handle maximum range', () => {
      const result = polarToCartesian(maxRange, 0, maxRange, centerX, centerY, radius);

      // Max range at 0 degrees should be at the edge
      expect(result.x).toBeCloseTo(centerX, 1);
      expect(result.y).toBeCloseTo(centerY - radius, 1);
    });

    it('should handle arbitrary angles correctly', () => {
      const result = polarToCartesian(7500, 45, maxRange, centerX, centerY, radius);

      // At 45 degrees, both x and y offsets should be equal
      const distance = (7500 / maxRange) * radius; // 187.5
      const offset = distance * Math.sin(45 * Math.PI / 180); // ~132.6

      expect(result.x).toBeCloseTo(centerX + offset, 1);
      expect(result.y).toBeCloseTo(centerY - offset, 1);
    });

    it('should scale correctly with different radar sizes', () => {
      const smallRadius = 100;
      const largeRadius = 500;

      const smallResult = polarToCartesian(5000, 0, maxRange, centerX, centerY, smallRadius);
      const largeResult = polarToCartesian(5000, 0, maxRange, centerX, centerY, largeRadius);

      // Distance from center should scale with radius
      expect(Math.abs(smallResult.y - centerY)).toBe(50); // 100 * 0.5
      expect(Math.abs(largeResult.y - centerY)).toBe(250); // 500 * 0.5
    });

    it('should handle ranges beyond maxRange', () => {
      const result = polarToCartesian(15000, 0, maxRange, centerX, centerY, radius);

      // Should extrapolate beyond the display radius
      const expectedDistance = (15000 / maxRange) * radius; // 375
      expect(result.y).toBeCloseTo(centerY - expectedDistance, 1);
    });

    it('should handle negative azimuths', () => {
      const result = polarToCartesian(5000, -90, maxRange, centerX, centerY, radius);

      // -90 degrees should be equivalent to 270 degrees (West)
      expect(result.x).toBeCloseTo(centerX - 125, 1);
      expect(result.y).toBeCloseTo(centerY, 1);
    });
  });

  describe('findTrackAtCoordinates', () => {
    const centerX = 300;
    const centerY = 300;
    const radius = 250;
    const radarInfo: RadarInfo = {
      operationalRange: 10000,
      latitude: 0,
      longitude: 0,
      heading: 0,
    };

    const createTrack = (id: string, range: number, azimuth: number): Track => ({
      id,
      range,
      azimuth,
      strength: 50,
      timestamp: Date.now(),
    });

    it('should find track at exact coordinates', () => {
      const track = createTrack('T1', 5000, 0);
      const tracks = [track];

      // Calculate where the track should be
      const trackPos = polarToCartesian(5000, 0, 10000, centerX, centerY, radius);

      const found = findTrackAtCoordinates(
        trackPos.x,
        trackPos.y,
        tracks,
        radarInfo,
        centerX,
        centerY,
        radius,
        10
      );

      expect(found).toEqual(track);
    });

    it('should find track within click radius', () => {
      const track = createTrack('T1', 5000, 0);
      const tracks = [track];

      const trackPos = polarToCartesian(5000, 0, 10000, centerX, centerY, radius);

      // Click 5 pixels away (within default 10px radius)
      const found = findTrackAtCoordinates(
        trackPos.x + 5,
        trackPos.y,
        tracks,
        radarInfo,
        centerX,
        centerY,
        radius,
        10
      );

      expect(found).toEqual(track);
    });

    it('should not find track outside click radius', () => {
      const track = createTrack('T1', 5000, 0);
      const tracks = [track];

      const trackPos = polarToCartesian(5000, 0, 10000, centerX, centerY, radius);

      // Click 15 pixels away (outside 10px radius)
      const found = findTrackAtCoordinates(
        trackPos.x + 15,
        trackPos.y,
        tracks,
        radarInfo,
        centerX,
        centerY,
        radius,
        10
      );

      expect(found).toBeNull();
    });

    it('should return first matching track when multiple tracks overlap', () => {
      const track1 = createTrack('T1', 5000, 0);
      const track2 = createTrack('T2', 5000, 0); // Same position
      const tracks = [track1, track2];

      const trackPos = polarToCartesian(5000, 0, 10000, centerX, centerY, radius);

      const found = findTrackAtCoordinates(
        trackPos.x,
        trackPos.y,
        tracks,
        radarInfo,
        centerX,
        centerY,
        radius,
        10
      );

      // Should return the first matching track
      expect(found).toEqual(track1);
    });

    it('should handle empty track array', () => {
      const found = findTrackAtCoordinates(
        centerX,
        centerY,
        [],
        radarInfo,
        centerX,
        centerY,
        radius,
        10
      );

      expect(found).toBeNull();
    });

    it('should respect custom click radius', () => {
      const track = createTrack('T1', 5000, 0);
      const tracks = [track];

      const trackPos = polarToCartesian(5000, 0, 10000, centerX, centerY, radius);

      // Click 15 pixels away with larger click radius
      const found = findTrackAtCoordinates(
        trackPos.x + 15,
        trackPos.y,
        tracks,
        radarInfo,
        centerX,
        centerY,
        radius,
        20 // Larger radius
      );

      expect(found).toEqual(track);
    });

    it('should find closest track among multiple tracks', () => {
      const track1 = createTrack('T1', 5000, 0);
      const track2 = createTrack('T2', 5000, 45);
      const track3 = createTrack('T3', 7500, 90);
      const tracks = [track1, track2, track3];

      const track2Pos = polarToCartesian(5000, 45, 10000, centerX, centerY, radius);

      const found = findTrackAtCoordinates(
        track2Pos.x,
        track2Pos.y,
        tracks,
        radarInfo,
        centerX,
        centerY,
        radius,
        10
      );

      expect(found).toEqual(track2);
    });

    it('should handle tracks at center', () => {
      const track = createTrack('T1', 0, 0);
      const tracks = [track];

      const found = findTrackAtCoordinates(
        centerX,
        centerY,
        tracks,
        radarInfo,
        centerX,
        centerY,
        radius,
        10
      );

      expect(found).toEqual(track);
    });

    it('should handle tracks at edge of radar', () => {
      const track = createTrack('T1', 10000, 0);
      const tracks = [track];

      const trackPos = polarToCartesian(10000, 0, 10000, centerX, centerY, radius);

      const found = findTrackAtCoordinates(
        trackPos.x,
        trackPos.y,
        tracks,
        radarInfo,
        centerX,
        centerY,
        radius,
        10
      );

      expect(found).toEqual(track);
    });

    it('should handle diagonal clicks correctly', () => {
      const track = createTrack('T1', 5000, 45);
      const tracks = [track];

      const trackPos = polarToCartesian(5000, 45, 10000, centerX, centerY, radius);

      // Click diagonally offset
      const found = findTrackAtCoordinates(
        trackPos.x + 3,
        trackPos.y + 3,
        tracks,
        radarInfo,
        centerX,
        centerY,
        radius,
        10
      );

      expect(found).toEqual(track);
    });
  });

  describe('formatCoordinates', () => {
    it('should format positive latitude and longitude', () => {
      const result = formatCoordinates(45.1234, 120.5678);
      expect(result).toBe('45.1234° N, 120.5678° E');
    });

    it('should format negative latitude (South)', () => {
      const result = formatCoordinates(-33.8688, 151.2093);
      expect(result).toBe('33.8688° S, 151.2093° E');
    });

    it('should format negative longitude (West)', () => {
      const result = formatCoordinates(40.7128, -74.0060);
      expect(result).toBe('40.7128° N, 74.0060° W');
    });

    it('should format both negative coordinates', () => {
      const result = formatCoordinates(-34.6037, -58.3816);
      expect(result).toBe('34.6037° S, 58.3816° W');
    });

    it('should handle zero latitude', () => {
      const result = formatCoordinates(0, 100);
      expect(result).toBe('0.0000° N, 100.0000° E');
    });

    it('should handle zero longitude', () => {
      const result = formatCoordinates(50, 0);
      expect(result).toBe('50.0000° N, 0.0000° E');
    });

    it('should handle both zero coordinates', () => {
      const result = formatCoordinates(0, 0);
      expect(result).toBe('0.0000° N, 0.0000° E');
    });

    it('should round to 4 decimal places', () => {
      const result = formatCoordinates(45.123456789, 120.987654321);
      expect(result).toBe('45.1235° N, 120.9877° E');
    });

    it('should handle extreme latitude values', () => {
      const northPole = formatCoordinates(90, 0);
      const southPole = formatCoordinates(-90, 0);

      expect(northPole).toBe('90.0000° N, 0.0000° E');
      expect(southPole).toBe('90.0000° S, 0.0000° E');
    });

    it('should handle extreme longitude values', () => {
      const eastEdge = formatCoordinates(0, 180);
      const westEdge = formatCoordinates(0, -180);

      expect(eastEdge).toBe('0.0000° N, 180.0000° E');
      expect(westEdge).toBe('0.0000° N, 180.0000° W');
    });

    it('should format very small values correctly', () => {
      const result = formatCoordinates(0.0001, -0.0001);
      expect(result).toBe('0.0001° N, 0.0001° W');
    });

    it('should handle integer coordinates', () => {
      const result = formatCoordinates(45, 120);
      expect(result).toBe('45.0000° N, 120.0000° E');
    });
  });
});
