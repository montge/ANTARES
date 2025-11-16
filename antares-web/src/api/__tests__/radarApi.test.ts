import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { addShip, resetSimulation, fetchRadarState } from '../radarApi';
import { ShipParams, RadarState } from '../../types/radar';

describe('radarApi', () => {
  const controllerUrl = 'http://localhost:17394';
  let fetchMock: any;

  beforeEach(() => {
    fetchMock = vi.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('addShip', () => {
    it('should add a CircleShip successfully', async () => {
      const shipParams: ShipParams = {
        type: 'CircleShip',
        name: 'TestShip',
        initial_position: {
          range: 5000,
          azimuth: 90,
        },
        speed: 10,
        angle: 45,
        radius: 1000,
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const result = await addShip(controllerUrl, shipParams);

      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        `${controllerUrl}/simulation/ships`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );

      // Verify the body transformation
      const callArgs = fetchMock.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.type).toBe('circle');
      expect(body.name).toBe('TestShip');
      expect(body.speed).toBe(10);
      expect(body.radius).toBe(1000);

      // Verify coordinate conversion (polar to Cartesian)
      // azimuth 90° = East, range 5000
      // x = range * cos(azimuth), y = range * sin(azimuth)
      expect(body.initial_position[0]).toBeCloseTo(0, 1); // cos(90°) ≈ 0
      expect(body.initial_position[1]).toBeCloseTo(5000, 1); // sin(90°) = 1

      // Verify angle conversion (degrees to radians)
      expect(body.angle).toBeCloseTo(Math.PI / 4, 5); // 45° in radians
    });

    it('should add a LineShip successfully', async () => {
      const shipParams: ShipParams = {
        type: 'LineShip',
        name: 'LineShip1',
        initial_position: {
          range: 3000,
          azimuth: 0,
        },
        speed: 15,
        angle: 90,
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const result = await addShip(controllerUrl, shipParams);

      expect(result).toBe(true);

      const callArgs = fetchMock.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.type).toBe('line');
      expect(body.name).toBe('LineShip1');

      // azimuth 0° = North
      expect(body.initial_position[0]).toBeCloseTo(3000, 1); // cos(0°) = 1
      expect(body.initial_position[1]).toBeCloseTo(0, 1); // sin(0°) = 0
    });

    it('should add a RandomShip successfully', async () => {
      const shipParams: ShipParams = {
        type: 'RandomShip',
        name: 'RandomShip1',
        initial_position: {
          range: 2000,
          azimuth: 180,
        },
        speed: 20,
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const result = await addShip(controllerUrl, shipParams);

      expect(result).toBe(true);

      const callArgs = fetchMock.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.type).toBe('random');
      expect(body.angle).toBeUndefined(); // No angle for RandomShip
    });

    it('should add a StationaryShip successfully', async () => {
      const shipParams: ShipParams = {
        type: 'StationaryShip',
        name: 'StationaryShip1',
        initial_position: {
          range: 1000,
          azimuth: 270,
        },
        speed: 0,
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const result = await addShip(controllerUrl, shipParams);

      expect(result).toBe(true);

      const callArgs = fetchMock.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.type).toBe('stationary');
      expect(body.speed).toBe(0);

      // azimuth 270° = West
      expect(body.initial_position[0]).toBeCloseTo(0, 1); // cos(270°) ≈ 0
      expect(body.initial_position[1]).toBeCloseTo(-1000, 1); // sin(270°) = -1
    });

    it('should handle API errors gracefully', async () => {
      const shipParams: ShipParams = {
        type: 'CircleShip',
        name: 'TestShip',
        initial_position: { range: 5000, azimuth: 90 },
        speed: 10,
        radius: 1000,
      };

      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await addShip(controllerUrl, shipParams);

      expect(result).toBe(false);
    });

    it('should handle network errors gracefully', async () => {
      const shipParams: ShipParams = {
        type: 'CircleShip',
        name: 'TestShip',
        initial_position: { range: 5000, azimuth: 90 },
        speed: 10,
        radius: 1000,
      };

      fetchMock.mockRejectedValue(new Error('Network error'));

      const result = await addShip(controllerUrl, shipParams);

      expect(result).toBe(false);
    });

    it('should handle zero azimuth correctly', async () => {
      const shipParams: ShipParams = {
        type: 'LineShip',
        name: 'TestShip',
        initial_position: { range: 5000, azimuth: 0 },
        speed: 10,
      };

      fetchMock.mockResolvedValue({ ok: true });

      await addShip(controllerUrl, shipParams);

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.initial_position[0]).toBeCloseTo(5000, 1);
      expect(body.initial_position[1]).toBeCloseTo(0, 1);
    });

    it('should handle 360 degree azimuth correctly', async () => {
      const shipParams: ShipParams = {
        type: 'LineShip',
        name: 'TestShip',
        initial_position: { range: 5000, azimuth: 360 },
        speed: 10,
      };

      fetchMock.mockResolvedValue({ ok: true });

      await addShip(controllerUrl, shipParams);

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      // 360° should be same as 0°
      expect(body.initial_position[0]).toBeCloseTo(5000, 1);
      expect(body.initial_position[1]).toBeCloseTo(0, 1);
    });

    it('should handle ships without optional angle parameter', async () => {
      const shipParams: ShipParams = {
        type: 'StationaryShip',
        name: 'TestShip',
        initial_position: { range: 5000, azimuth: 90 },
        speed: 0,
      };

      fetchMock.mockResolvedValue({ ok: true });

      await addShip(controllerUrl, shipParams);

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.angle).toBeUndefined();
    });
  });

  describe('resetSimulation', () => {
    it('should reset simulation successfully', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const result = await resetSimulation(controllerUrl);

      expect(result).toBe(true);
      expect(fetchMock).toHaveBeenCalledWith(
        `${controllerUrl}/simulation/reset`,
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await resetSimulation(controllerUrl);

      expect(result).toBe(false);
    });

    it('should handle network errors gracefully', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'));

      const result = await resetSimulation(controllerUrl);

      expect(result).toBe(false);
    });
  });

  describe('fetchRadarState', () => {
    it('should fetch radar state successfully', async () => {
      const mockRadarState: RadarState = {
        start_coordinates: [45.5, -122.6],
        angle: 1.5708, // 90 degrees in radians
        speed: 10,
      };

      const mockResponse = {
        antares: {
          radar: {
            detector: mockRadarState,
          },
        },
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchRadarState(controllerUrl);

      expect(result).toEqual(mockRadarState);
      expect(fetchMock).toHaveBeenCalledWith(`${controllerUrl}/simulation/config`, undefined);
    });

    it('should return null when response structure is invalid', async () => {
      const mockResponse = {
        invalid: 'structure',
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchRadarState(controllerUrl);

      expect(result).toBeNull();
    });

    it('should return null when antares property is missing', async () => {
      const mockResponse = {
        radar: {
          detector: {
            start_coordinates: [0, 0],
            angle: 0,
            speed: 0,
          },
        },
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchRadarState(controllerUrl);

      expect(result).toBeNull();
    });

    it('should return null when radar property is missing', async () => {
      const mockResponse = {
        antares: {
          detector: {
            start_coordinates: [0, 0],
            angle: 0,
            speed: 0,
          },
        },
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchRadarState(controllerUrl);

      expect(result).toBeNull();
    });

    it('should return null when detector property is missing', async () => {
      const mockResponse = {
        antares: {
          radar: {},
        },
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchRadarState(controllerUrl);

      expect(result).toBeNull();
    });

    it('should handle network errors gracefully', async () => {
      fetchMock.mockRejectedValue(new Error('Network error'));

      const result = await fetchRadarState(controllerUrl);

      expect(result).toBeNull();
    });

    it('should handle JSON parse errors', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const result = await fetchRadarState(controllerUrl);

      expect(result).toBeNull();
    });

    it('should handle empty response', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => null,
      });

      const result = await fetchRadarState(controllerUrl);

      expect(result).toBeNull();
    });

    it('should handle response with partial data', async () => {
      const mockResponse = {
        antares: {
          radar: {
            detector: {
              start_coordinates: [45.5, -122.6],
              // Missing angle and speed
            },
          },
        },
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchRadarState(controllerUrl);

      // Should still return the partial detector object
      expect(result).toEqual({
        start_coordinates: [45.5, -122.6],
      });
    });
  });
});
