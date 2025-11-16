import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useShipForm } from '../useShipForm';
import * as shipValidation from '../../../utils/shipValidation';

vi.mock('../../../utils/shipValidation');

describe('useShipForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock: validation passes
    vi.mocked(shipValidation.validateShipParams).mockReturnValue({
      isValid: true,
      errors: {},
    });
  });

  describe('Initial state', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useShipForm(false));

      expect(result.current.shipType).toBe('LineShip');
      expect(result.current.range).toBe(5000);
      expect(result.current.azimuth).toBe(180);
      expect(result.current.speed).toBe(10);
      expect(result.current.angle).toBe(90);
      expect(result.current.radius).toBe(2000);
      expect(result.current.maxSpeed).toBe(15);
      expect(result.current.errors).toEqual({});
      expect(result.current.isSubmitting).toBe(false);
    });
  });

  describe('State setters', () => {
    it('should update range', () => {
      const { result } = renderHook(() => useShipForm(false));

      act(() => {
        result.current.setRange(10000);
      });

      expect(result.current.range).toBe(10000);
    });

    it('should update azimuth', () => {
      const { result } = renderHook(() => useShipForm(false));

      act(() => {
        result.current.setAzimuth(45);
      });

      expect(result.current.azimuth).toBe(45);
    });

    it('should update speed', () => {
      const { result } = renderHook(() => useShipForm(false));

      act(() => {
        result.current.setSpeed(20);
      });

      expect(result.current.speed).toBe(20);
    });

    it('should update angle', () => {
      const { result } = renderHook(() => useShipForm(false));

      act(() => {
        result.current.setAngle(45);
      });

      expect(result.current.angle).toBe(45);
    });

    it('should update radius', () => {
      const { result } = renderHook(() => useShipForm(false));

      act(() => {
        result.current.setRadius(5000);
      });

      expect(result.current.radius).toBe(5000);
    });

    it('should update maxSpeed', () => {
      const { result } = renderHook(() => useShipForm(false));

      act(() => {
        result.current.setMaxSpeed(25);
      });

      expect(result.current.maxSpeed).toBe(25);
    });

    it('should update isSubmitting', () => {
      const { result } = renderHook(() => useShipForm(false));

      act(() => {
        result.current.setIsSubmitting(true);
      });

      expect(result.current.isSubmitting).toBe(true);
    });
  });

  describe('Ship type changes', () => {
    it('should change to CircleShip with correct defaults', () => {
      const { result } = renderHook(() => useShipForm(false));

      act(() => {
        result.current.handleShipTypeChange('CircleShip');
      });

      expect(result.current.shipType).toBe('CircleShip');
      expect(result.current.speed).toBe(5);
      expect(result.current.radius).toBe(2000);
      expect(result.current.errors).toEqual({});
    });

    it('should change to LineShip with correct defaults', () => {
      const { result } = renderHook(() => useShipForm(false));

      // First change to CircleShip
      act(() => {
        result.current.handleShipTypeChange('CircleShip');
      });

      // Then change back to LineShip
      act(() => {
        result.current.handleShipTypeChange('LineShip');
      });

      expect(result.current.shipType).toBe('LineShip');
      expect(result.current.speed).toBe(10);
      expect(result.current.angle).toBe(90);
      expect(result.current.errors).toEqual({});
    });

    it('should change to RandomShip with correct defaults', () => {
      const { result } = renderHook(() => useShipForm(false));

      act(() => {
        result.current.handleShipTypeChange('RandomShip');
      });

      expect(result.current.shipType).toBe('RandomShip');
      expect(result.current.maxSpeed).toBe(15);
      expect(result.current.errors).toEqual({});
    });

    it('should change to StationaryShip', () => {
      const { result } = renderHook(() => useShipForm(false));

      act(() => {
        result.current.handleShipTypeChange('StationaryShip');
      });

      expect(result.current.shipType).toBe('StationaryShip');
      expect(result.current.errors).toEqual({});
    });

    it('should clear errors when changing ship type', () => {
      const { result } = renderHook(() => useShipForm(false));

      // Set some errors
      vi.mocked(shipValidation.validateShipParams).mockReturnValue({
        isValid: false,
        errors: { speed: 'Speed is required' },
      });

      act(() => {
        result.current.validateForm();
      });

      expect(result.current.errors).toEqual({ speed: 'Speed is required' });

      // Change ship type - should clear errors
      act(() => {
        result.current.handleShipTypeChange('CircleShip');
      });

      expect(result.current.errors).toEqual({});
    });
  });

  describe('createShipParams', () => {
    it('should create params for LineShip', () => {
      const { result } = renderHook(() => useShipForm(false));

      act(() => {
        result.current.setRange(7000);
        result.current.setAzimuth(90);
        result.current.setSpeed(15);
        result.current.setAngle(45);
      });

      const params = result.current.createShipParams();

      expect(params).toEqual({
        type: 'LineShip',
        initial_position: {
          range: 7000,
          azimuth: 90,
        },
        speed: 15,
        angle: 45,
      });
    });

    it('should create params for CircleShip', () => {
      const { result } = renderHook(() => useShipForm(false));

      act(() => {
        result.current.handleShipTypeChange('CircleShip');
        result.current.setRange(6000);
        result.current.setAzimuth(270);
        result.current.setSpeed(8);
        result.current.setRadius(3000);
      });

      const params = result.current.createShipParams();

      expect(params).toEqual({
        type: 'CircleShip',
        initial_position: {
          range: 6000,
          azimuth: 270,
        },
        speed: 8,
        radius: 3000,
      });
    });

    it('should create params for RandomShip', () => {
      const { result } = renderHook(() => useShipForm(false));

      act(() => {
        result.current.handleShipTypeChange('RandomShip');
        result.current.setRange(8000);
        result.current.setAzimuth(0);
        result.current.setMaxSpeed(20);
      });

      const params = result.current.createShipParams();

      expect(params).toEqual({
        type: 'RandomShip',
        initial_position: {
          range: 8000,
          azimuth: 0,
        },
        max_speed: 20,
      });
    });

    it('should create params for StationaryShip', () => {
      const { result } = renderHook(() => useShipForm(false));

      act(() => {
        result.current.handleShipTypeChange('StationaryShip');
        result.current.setRange(4000);
        result.current.setAzimuth(180);
      });

      const params = result.current.createShipParams();

      expect(params).toEqual({
        type: 'StationaryShip',
        initial_position: {
          range: 4000,
          azimuth: 180,
        },
      });
    });
  });

  describe('Form validation', () => {
    it('should return true when validation passes', () => {
      const { result } = renderHook(() => useShipForm(false));

      vi.mocked(shipValidation.validateShipParams).mockReturnValue({
        isValid: true,
        errors: {},
      });

      let isValid;
      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid).toBe(true);
      expect(result.current.errors).toEqual({});
    });

    it('should return false when validation fails', () => {
      const { result } = renderHook(() => useShipForm(false));

      const validationErrors = {
        range: 'Range must be positive',
        speed: 'Speed must be positive',
      };

      vi.mocked(shipValidation.validateShipParams).mockReturnValue({
        isValid: false,
        errors: validationErrors,
      });

      let isValid;
      act(() => {
        isValid = result.current.validateForm();
      });

      expect(isValid).toBe(false);
      expect(result.current.errors).toEqual(validationErrors);
    });

    it('should call validateShipParams with current params', () => {
      const { result } = renderHook(() => useShipForm(false));

      act(() => {
        result.current.setRange(9000);
        result.current.setAzimuth(120);
      });

      act(() => {
        result.current.validateForm();
      });

      expect(shipValidation.validateShipParams).toHaveBeenCalledWith({
        type: 'LineShip',
        initial_position: {
          range: 9000,
          azimuth: 120,
        },
        speed: 10,
        angle: 90,
      });
    });

    it('should clear errors when validation passes after failure', () => {
      const { result } = renderHook(() => useShipForm(false));

      // First validation fails
      vi.mocked(shipValidation.validateShipParams).mockReturnValue({
        isValid: false,
        errors: { range: 'Invalid range' },
      });

      act(() => {
        result.current.validateForm();
      });

      expect(result.current.errors).toEqual({ range: 'Invalid range' });

      // Second validation passes
      vi.mocked(shipValidation.validateShipParams).mockReturnValue({
        isValid: true,
        errors: {},
      });

      act(() => {
        result.current.validateForm();
      });

      expect(result.current.errors).toEqual({});
    });
  });

  describe('Reset on modal state change', () => {
    it('should reset errors when modal opens', async () => {
      const { result, rerender } = renderHook(
        ({ isOpen }) => useShipForm(isOpen),
        { initialProps: { isOpen: false } }
      );

      // Set some errors
      vi.mocked(shipValidation.validateShipParams).mockReturnValue({
        isValid: false,
        errors: { range: 'Invalid' },
      });

      act(() => {
        result.current.validateForm();
      });

      expect(result.current.errors).toEqual({ range: 'Invalid' });

      // Open modal
      rerender({ isOpen: true });

      await waitFor(() => {
        expect(result.current.errors).toEqual({});
      });
    });

    it('should reset isSubmitting when modal opens', async () => {
      const { result, rerender } = renderHook(
        ({ isOpen }) => useShipForm(isOpen),
        { initialProps: { isOpen: false } }
      );

      // Set isSubmitting
      act(() => {
        result.current.setIsSubmitting(true);
      });

      expect(result.current.isSubmitting).toBe(true);

      // Open modal
      rerender({ isOpen: true });

      await waitFor(() => {
        expect(result.current.isSubmitting).toBe(false);
      });
    });

    it('should not reset values when modal closes', () => {
      const { result, rerender } = renderHook(
        ({ isOpen }) => useShipForm(isOpen),
        { initialProps: { isOpen: true } }
      );

      // Change some values
      act(() => {
        result.current.setRange(12000);
        result.current.setAzimuth(45);
      });

      // Close modal
      rerender({ isOpen: false });

      // Values should remain
      expect(result.current.range).toBe(12000);
      expect(result.current.azimuth).toBe(45);
    });

    it('should preserve shipType across modal open/close', () => {
      const { result, rerender } = renderHook(
        ({ isOpen }) => useShipForm(isOpen),
        { initialProps: { isOpen: false } }
      );

      act(() => {
        result.current.handleShipTypeChange('CircleShip');
      });

      expect(result.current.shipType).toBe('CircleShip');

      // Open then close modal
      rerender({ isOpen: true });
      rerender({ isOpen: false });

      expect(result.current.shipType).toBe('CircleShip');
    });
  });

  describe('Edge cases', () => {
    it('should handle zero values', () => {
      const { result } = renderHook(() => useShipForm(false));

      act(() => {
        result.current.setRange(0);
        result.current.setAzimuth(0);
        result.current.setSpeed(0);
      });

      const params = result.current.createShipParams();

      expect(params.initial_position.range).toBe(0);
      expect(params.initial_position.azimuth).toBe(0);
      expect(params.speed).toBe(0);
    });

    it('should handle very large values', () => {
      const { result } = renderHook(() => useShipForm(false));

      act(() => {
        result.current.setRange(999999);
        result.current.setAzimuth(360);
        result.current.setSpeed(100);
      });

      const params = result.current.createShipParams();

      expect(params.initial_position.range).toBe(999999);
      expect(params.initial_position.azimuth).toBe(360);
      expect(params.speed).toBe(100);
    });

    it('should handle negative values', () => {
      const { result } = renderHook(() => useShipForm(false));

      act(() => {
        result.current.setRange(-1000);
        result.current.setAzimuth(-90);
        result.current.setSpeed(-5);
      });

      const params = result.current.createShipParams();

      expect(params.initial_position.range).toBe(-1000);
      expect(params.initial_position.azimuth).toBe(-90);
      expect(params.speed).toBe(-5);
    });

    it('should handle decimal values', () => {
      const { result } = renderHook(() => useShipForm(false));

      act(() => {
        result.current.setRange(5000.5);
        result.current.setAzimuth(45.7);
        result.current.setSpeed(10.3);
      });

      const params = result.current.createShipParams();

      expect(params.initial_position.range).toBe(5000.5);
      expect(params.initial_position.azimuth).toBe(45.7);
      expect(params.speed).toBe(10.3);
    });

    it('should handle rapid ship type changes', () => {
      const { result } = renderHook(() => useShipForm(false));

      act(() => {
        result.current.handleShipTypeChange('CircleShip');
        result.current.handleShipTypeChange('RandomShip');
        result.current.handleShipTypeChange('StationaryShip');
        result.current.handleShipTypeChange('LineShip');
      });

      expect(result.current.shipType).toBe('LineShip');
      expect(result.current.speed).toBe(10);
      expect(result.current.angle).toBe(90);
    });

    it('should handle multiple validations', () => {
      const { result } = renderHook(() => useShipForm(false));

      // First validation
      vi.mocked(shipValidation.validateShipParams).mockReturnValue({
        isValid: false,
        errors: { range: 'Too small' },
      });

      act(() => {
        result.current.validateForm();
      });

      expect(result.current.errors).toEqual({ range: 'Too small' });

      // Second validation
      vi.mocked(shipValidation.validateShipParams).mockReturnValue({
        isValid: false,
        errors: { speed: 'Too fast' },
      });

      act(() => {
        result.current.validateForm();
      });

      expect(result.current.errors).toEqual({ speed: 'Too fast' });

      // Third validation passes
      vi.mocked(shipValidation.validateShipParams).mockReturnValue({
        isValid: true,
        errors: {},
      });

      act(() => {
        result.current.validateForm();
      });

      expect(result.current.errors).toEqual({});
    });
  });

  describe('Multiple state updates', () => {
    it('should handle multiple state updates in sequence', () => {
      const { result } = renderHook(() => useShipForm(false));

      act(() => {
        result.current.setRange(8000);
        result.current.setAzimuth(270);
        result.current.setSpeed(12);
        result.current.setAngle(180);
      });

      expect(result.current.range).toBe(8000);
      expect(result.current.azimuth).toBe(270);
      expect(result.current.speed).toBe(12);
      expect(result.current.angle).toBe(180);
    });

    it('should maintain consistency across ship type and parameter changes', () => {
      const { result } = renderHook(() => useShipForm(false));

      act(() => {
        result.current.handleShipTypeChange('CircleShip');
        result.current.setRadius(4000);
        result.current.setSpeed(7);
      });

      const params = result.current.createShipParams();

      expect(params.type).toBe('CircleShip');
      expect(params.radius).toBe(4000);
      expect(params.speed).toBe(7);
      expect(params).not.toHaveProperty('angle');
    });
  });
});
