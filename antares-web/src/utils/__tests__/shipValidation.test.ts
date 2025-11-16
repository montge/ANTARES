import { describe, it, expect } from 'vitest';
import { validateShipParams } from '../shipValidation';
import { ShipParams } from '../../types/radar';

describe('shipValidation', () => {
  describe('validateShipParams', () => {
    describe('Common parameter validation', () => {
      it('should reject range <= 0', () => {
        const params: ShipParams = {
          type: 'StationaryShip',
          initial_position: { range: 0, azimuth: 45 },
        };

        const result = validateShipParams(params);

        expect(result.isValid).toBe(false);
        expect(result.errors.range).toBe('Range must be greater than 0');
      });

      it('should reject negative range', () => {
        const params: ShipParams = {
          type: 'StationaryShip',
          initial_position: { range: -10, azimuth: 45 },
        };

        const result = validateShipParams(params);

        expect(result.isValid).toBe(false);
        expect(result.errors.range).toBe('Range must be greater than 0');
      });

      it('should accept positive range', () => {
        const params: ShipParams = {
          type: 'StationaryShip',
          initial_position: { range: 100, azimuth: 45 },
        };

        const result = validateShipParams(params);

        expect(result.isValid).toBe(true);
        expect(result.errors.range).toBeUndefined();
      });

      it('should reject azimuth < 0', () => {
        const params: ShipParams = {
          type: 'StationaryShip',
          initial_position: { range: 100, azimuth: -1 },
        };

        const result = validateShipParams(params);

        expect(result.isValid).toBe(false);
        expect(result.errors.azimuth).toBe('Azimuth must be between 0 and 360 degrees');
      });

      it('should reject azimuth > 360', () => {
        const params: ShipParams = {
          type: 'StationaryShip',
          initial_position: { range: 100, azimuth: 361 },
        };

        const result = validateShipParams(params);

        expect(result.isValid).toBe(false);
        expect(result.errors.azimuth).toBe('Azimuth must be between 0 and 360 degrees');
      });

      it('should accept azimuth at boundary (0)', () => {
        const params: ShipParams = {
          type: 'StationaryShip',
          initial_position: { range: 100, azimuth: 0 },
        };

        const result = validateShipParams(params);

        expect(result.isValid).toBe(true);
        expect(result.errors.azimuth).toBeUndefined();
      });

      it('should accept azimuth at boundary (360)', () => {
        const params: ShipParams = {
          type: 'StationaryShip',
          initial_position: { range: 100, azimuth: 360 },
        };

        const result = validateShipParams(params);

        expect(result.isValid).toBe(true);
        expect(result.errors.azimuth).toBeUndefined();
      });

      it('should collect multiple validation errors', () => {
        const params: ShipParams = {
          type: 'StationaryShip',
          initial_position: { range: -10, azimuth: 400 },
        };

        const result = validateShipParams(params);

        expect(result.isValid).toBe(false);
        expect(result.errors.range).toBeDefined();
        expect(result.errors.azimuth).toBeDefined();
        expect(Object.keys(result.errors)).toHaveLength(2);
      });
    });

    describe('LineShip validation', () => {
      it('should validate correct LineShip parameters', () => {
        const params: ShipParams = {
          type: 'LineShip',
          initial_position: { range: 100, azimuth: 45 },
          speed: 10,
          angle: 90,
        };

        const result = validateShipParams(params);

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual({});
      });

      it('should reject missing speed', () => {
        const params: ShipParams = {
          type: 'LineShip',
          initial_position: { range: 100, azimuth: 45 },
          angle: 90,
        };

        const result = validateShipParams(params);

        expect(result.isValid).toBe(false);
        expect(result.errors.speed).toBe('Speed must be greater than 0');
      });

      it('should reject zero speed', () => {
        const params: ShipParams = {
          type: 'LineShip',
          initial_position: { range: 100, azimuth: 45 },
          speed: 0,
          angle: 90,
        };

        const result = validateShipParams(params);

        expect(result.isValid).toBe(false);
        expect(result.errors.speed).toBe('Speed must be greater than 0');
      });

      it('should reject negative speed', () => {
        const params: ShipParams = {
          type: 'LineShip',
          initial_position: { range: 100, azimuth: 45 },
          speed: -5,
          angle: 90,
        };

        const result = validateShipParams(params);

        expect(result.isValid).toBe(false);
        expect(result.errors.speed).toBe('Speed must be greater than 0');
      });

      it('should reject missing angle', () => {
        const params: ShipParams = {
          type: 'LineShip',
          initial_position: { range: 100, azimuth: 45 },
          speed: 10,
        };

        const result = validateShipParams(params);

        expect(result.isValid).toBe(false);
        expect(result.errors.angle).toBe('Angle must be between 0 and 360 degrees');
      });

      it('should reject angle < 0', () => {
        const params: ShipParams = {
          type: 'LineShip',
          initial_position: { range: 100, azimuth: 45 },
          speed: 10,
          angle: -1,
        };

        const result = validateShipParams(params);

        expect(result.isValid).toBe(false);
        expect(result.errors.angle).toBe('Angle must be between 0 and 360 degrees');
      });

      it('should reject angle > 360', () => {
        const params: ShipParams = {
          type: 'LineShip',
          initial_position: { range: 100, azimuth: 45 },
          speed: 10,
          angle: 361,
        };

        const result = validateShipParams(params);

        expect(result.isValid).toBe(false);
        expect(result.errors.angle).toBe('Angle must be between 0 and 360 degrees');
      });

      it('should accept angle at boundary (0)', () => {
        const params: ShipParams = {
          type: 'LineShip',
          initial_position: { range: 100, azimuth: 45 },
          speed: 10,
          angle: 0,
        };

        const result = validateShipParams(params);

        expect(result.isValid).toBe(true);
        expect(result.errors.angle).toBeUndefined();
      });

      it('should accept angle at boundary (360)', () => {
        const params: ShipParams = {
          type: 'LineShip',
          initial_position: { range: 100, azimuth: 45 },
          speed: 10,
          angle: 360,
        };

        const result = validateShipParams(params);

        expect(result.isValid).toBe(true);
        expect(result.errors.angle).toBeUndefined();
      });
    });

    describe('CircleShip validation', () => {
      it('should validate correct CircleShip parameters', () => {
        const params: ShipParams = {
          type: 'CircleShip',
          initial_position: { range: 100, azimuth: 45 },
          speed: 10,
          radius: 50,
        };

        const result = validateShipParams(params);

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual({});
      });

      it('should reject missing speed', () => {
        const params: ShipParams = {
          type: 'CircleShip',
          initial_position: { range: 100, azimuth: 45 },
          radius: 50,
        };

        const result = validateShipParams(params);

        expect(result.isValid).toBe(false);
        expect(result.errors.speed).toBe('Speed must be greater than 0');
      });

      it('should reject zero speed', () => {
        const params: ShipParams = {
          type: 'CircleShip',
          initial_position: { range: 100, azimuth: 45 },
          speed: 0,
          radius: 50,
        };

        const result = validateShipParams(params);

        expect(result.isValid).toBe(false);
        expect(result.errors.speed).toBe('Speed must be greater than 0');
      });

      it('should reject missing radius', () => {
        const params: ShipParams = {
          type: 'CircleShip',
          initial_position: { range: 100, azimuth: 45 },
          speed: 10,
        };

        const result = validateShipParams(params);

        expect(result.isValid).toBe(false);
        expect(result.errors.radius).toBe('Radius must be greater than 0');
      });

      it('should reject zero radius', () => {
        const params: ShipParams = {
          type: 'CircleShip',
          initial_position: { range: 100, azimuth: 45 },
          speed: 10,
          radius: 0,
        };

        const result = validateShipParams(params);

        expect(result.isValid).toBe(false);
        expect(result.errors.radius).toBe('Radius must be greater than 0');
      });

      it('should reject negative radius', () => {
        const params: ShipParams = {
          type: 'CircleShip',
          initial_position: { range: 100, azimuth: 45 },
          speed: 10,
          radius: -10,
        };

        const result = validateShipParams(params);

        expect(result.isValid).toBe(false);
        expect(result.errors.radius).toBe('Radius must be greater than 0');
      });

      it('should collect multiple CircleShip validation errors', () => {
        const params: ShipParams = {
          type: 'CircleShip',
          initial_position: { range: -5, azimuth: 400 },
          speed: -2,
          radius: 0,
        };

        const result = validateShipParams(params);

        expect(result.isValid).toBe(false);
        expect(result.errors.range).toBeDefined();
        expect(result.errors.azimuth).toBeDefined();
        expect(result.errors.speed).toBeDefined();
        expect(result.errors.radius).toBeDefined();
        expect(Object.keys(result.errors)).toHaveLength(4);
      });
    });

    describe('RandomShip validation', () => {
      it('should validate correct RandomShip parameters', () => {
        const params: ShipParams = {
          type: 'RandomShip',
          initial_position: { range: 100, azimuth: 45 },
          max_speed: 15,
        };

        const result = validateShipParams(params);

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual({});
      });

      it('should reject missing max_speed', () => {
        const params: ShipParams = {
          type: 'RandomShip',
          initial_position: { range: 100, azimuth: 45 },
        };

        const result = validateShipParams(params);

        expect(result.isValid).toBe(false);
        expect(result.errors.maxSpeed).toBe('Maximum speed must be greater than 0');
      });

      it('should reject zero max_speed', () => {
        const params: ShipParams = {
          type: 'RandomShip',
          initial_position: { range: 100, azimuth: 45 },
          max_speed: 0,
        };

        const result = validateShipParams(params);

        expect(result.isValid).toBe(false);
        expect(result.errors.maxSpeed).toBe('Maximum speed must be greater than 0');
      });

      it('should reject negative max_speed', () => {
        const params: ShipParams = {
          type: 'RandomShip',
          initial_position: { range: 100, azimuth: 45 },
          max_speed: -5,
        };

        const result = validateShipParams(params);

        expect(result.isValid).toBe(false);
        expect(result.errors.maxSpeed).toBe('Maximum speed must be greater than 0');
      });
    });

    describe('StationaryShip validation', () => {
      it('should validate correct StationaryShip parameters', () => {
        const params: ShipParams = {
          type: 'StationaryShip',
          initial_position: { range: 100, azimuth: 45 },
        };

        const result = validateShipParams(params);

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual({});
      });

      it('should not require any type-specific parameters', () => {
        const params: ShipParams = {
          type: 'StationaryShip',
          initial_position: { range: 500, azimuth: 180 },
        };

        const result = validateShipParams(params);

        expect(result.isValid).toBe(true);
        expect(Object.keys(result.errors)).toHaveLength(0);
      });

      it('should still validate common parameters for StationaryShip', () => {
        const params: ShipParams = {
          type: 'StationaryShip',
          initial_position: { range: -10, azimuth: 400 },
        };

        const result = validateShipParams(params);

        expect(result.isValid).toBe(false);
        expect(result.errors.range).toBeDefined();
        expect(result.errors.azimuth).toBeDefined();
      });
    });

    describe('Invalid ship type', () => {
      it('should reject invalid ship type', () => {
        const params = {
          type: 'InvalidShip',
          initial_position: { range: 100, azimuth: 45 },
        } as ShipParams;

        const result = validateShipParams(params);

        expect(result.isValid).toBe(false);
        expect(result.errors.type).toBe('Invalid ship type');
      });
    });

    describe('Decimal and extreme values', () => {
      it('should accept decimal values for range', () => {
        const params: ShipParams = {
          type: 'StationaryShip',
          initial_position: { range: 123.456, azimuth: 45 },
        };

        const result = validateShipParams(params);

        expect(result.isValid).toBe(true);
      });

      it('should accept decimal values for azimuth', () => {
        const params: ShipParams = {
          type: 'StationaryShip',
          initial_position: { range: 100, azimuth: 123.456 },
        };

        const result = validateShipParams(params);

        expect(result.isValid).toBe(true);
      });

      it('should accept very large range values', () => {
        const params: ShipParams = {
          type: 'StationaryShip',
          initial_position: { range: 999999, azimuth: 45 },
        };

        const result = validateShipParams(params);

        expect(result.isValid).toBe(true);
      });

      it('should accept very small positive range values', () => {
        const params: ShipParams = {
          type: 'StationaryShip',
          initial_position: { range: 0.001, azimuth: 45 },
        };

        const result = validateShipParams(params);

        expect(result.isValid).toBe(true);
      });

      it('should accept decimal speed for LineShip', () => {
        const params: ShipParams = {
          type: 'LineShip',
          initial_position: { range: 100, azimuth: 45 },
          speed: 12.5,
          angle: 90,
        };

        const result = validateShipParams(params);

        expect(result.isValid).toBe(true);
      });
    });
  });
});
