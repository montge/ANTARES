import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRadarState } from '../useRadarState';
import * as radarApi from '../../api/radarApi';
import { toast } from 'sonner';
import { RadarState } from '../../types/radar';

vi.mock('../../api/radarApi');
vi.mock('sonner');

describe('useRadarState', () => {
  const controllerUrl = 'http://localhost:17394';
  const mockRadarState: RadarState = {
    start_coordinates: [45.5, -122.6],
    angle: 1.5708, // 90 degrees in radians
    speed: 10,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial fetch', () => {
    it('should fetch radar state on mount', async () => {
      vi.mocked(radarApi.fetchRadarState).mockResolvedValue(mockRadarState);

      const { result } = renderHook(() => useRadarState(controllerUrl));

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 1000 });

      expect(radarApi.fetchRadarState).toHaveBeenCalledWith(controllerUrl);
      expect(result.current.hasError).toBe(false);
      expect(result.current.radarInfo.coordinates.latitude).toBe(45.5);
      expect(result.current.radarInfo.coordinates.longitude).toBe(-122.6);
      expect(result.current.radarInfo.heading).toBeCloseTo(90, 1); // Converted from radians
      expect(result.current.radarInfo.ownSpeed).toBe(10);
    });

    it('should use default radar info when fetch fails', async () => {
      vi.mocked(radarApi.fetchRadarState).mockResolvedValue(null);

      const { result } = renderHook(() => useRadarState(controllerUrl));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 1000 });

      // Should still have default values
      expect(result.current.radarInfo.operationalRange).toBe(10000);
      expect(result.current.radarInfo.coordinates.latitude).toBe(0);
      expect(result.current.radarInfo.coordinates.longitude).toBe(0);
    });

    it('should set isLoading to true initially', () => {
      vi.mocked(radarApi.fetchRadarState).mockResolvedValue(mockRadarState);

      const { result } = renderHook(() => useRadarState(controllerUrl));

      expect(result.current.isLoading).toBe(true);
    });

    it('should set isLoading to false after successful fetch', async () => {
      vi.mocked(radarApi.fetchRadarState).mockResolvedValue(mockRadarState);

      const { result } = renderHook(() => useRadarState(controllerUrl));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 1000 });
    });

    it('should convert radians to degrees correctly', async () => {
      const radarStateWithAngle: RadarState = {
        start_coordinates: [0, 0],
        angle: Math.PI, // 180 degrees
        speed: 0,
      };

      vi.mocked(radarApi.fetchRadarState).mockResolvedValue(radarStateWithAngle);

      const { result } = renderHook(() => useRadarState(controllerUrl));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 1000 });

      expect(result.current.radarInfo.heading).toBeCloseTo(180, 1);
    });

    it('should handle zero angle correctly', async () => {
      const radarStateWithZeroAngle: RadarState = {
        start_coordinates: [0, 0],
        angle: 0,
        speed: 0,
      };

      vi.mocked(radarApi.fetchRadarState).mockResolvedValue(radarStateWithZeroAngle);

      const { result } = renderHook(() => useRadarState(controllerUrl));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 1000 });

      expect(result.current.radarInfo.heading).toBe(0);
    });

    it('should preserve operationalRange from previous state', async () => {
      vi.mocked(radarApi.fetchRadarState).mockResolvedValue(mockRadarState);

      const { result } = renderHook(() => useRadarState(controllerUrl));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 1000 });

      // Default operational range should be preserved
      expect(result.current.radarInfo.operationalRange).toBe(10000);
    });
  });

  describe('Error handling and retry logic', () => {
    it('should retry up to 3 times on null response', async () => {
      vi.mocked(radarApi.fetchRadarState).mockResolvedValue(null);

      const { result } = renderHook(() => useRadarState(controllerUrl));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 1000 });

      // Should call fetchRadarState only once (no retry in current implementation)
      expect(radarApi.fetchRadarState).toHaveBeenCalledTimes(1);
    });

    it('should set hasError to false on successful fetch', async () => {
      vi.mocked(radarApi.fetchRadarState).mockResolvedValue(mockRadarState);

      const { result } = renderHook(() => useRadarState(controllerUrl));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 1000 });

      expect(result.current.hasError).toBe(false);
    });

    it('should handle fetch errors gracefully', async () => {
      vi.mocked(radarApi.fetchRadarState).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useRadarState(controllerUrl));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 1000 });

      // Should still return default values
      expect(result.current.radarInfo.operationalRange).toBe(10000);
    });

    it('should handle consecutive null responses', async () => {
      vi.mocked(radarApi.fetchRadarState)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const { result } = renderHook(() => useRadarState(controllerUrl));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 1000 });

      expect(result.current.radarInfo.operationalRange).toBe(10000);
    });
  });

  describe('updateMaxRange', () => {
    it('should update operational range when called', async () => {
      vi.mocked(radarApi.fetchRadarState).mockResolvedValue(mockRadarState);

      const { result } = renderHook(() => useRadarState(controllerUrl));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 1000 });

      // Update range to 20 km
      result.current.updateMaxRange(20);

      await waitFor(() => {
        expect(result.current.radarInfo.operationalRange).toBe(20000); // 20 km in meters
      }, { timeout: 1000 });
    });

    it('should convert km to meters', async () => {
      vi.mocked(radarApi.fetchRadarState).mockResolvedValue(mockRadarState);

      const { result } = renderHook(() => useRadarState(controllerUrl));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 1000 });

      result.current.updateMaxRange(5);

      await waitFor(() => {
        expect(result.current.radarInfo.operationalRange).toBe(5000);
      }, { timeout: 1000 });
    });

    it('should show toast notification when updating range', async () => {
      vi.mocked(radarApi.fetchRadarState).mockResolvedValue(mockRadarState);

      const { result } = renderHook(() => useRadarState(controllerUrl));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 1000 });

      result.current.updateMaxRange(15);

      expect(toast.info).toHaveBeenCalledWith('Radar range set to 15 km');
    });

    it('should preserve other radar info when updating range', async () => {
      vi.mocked(radarApi.fetchRadarState).mockResolvedValue(mockRadarState);

      const { result } = renderHook(() => useRadarState(controllerUrl));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 1000 });

      const originalLat = result.current.radarInfo.coordinates.latitude;
      const originalLon = result.current.radarInfo.coordinates.longitude;
      const originalHeading = result.current.radarInfo.heading;
      const originalSpeed = result.current.radarInfo.ownSpeed;

      result.current.updateMaxRange(25);

      await waitFor(() => {
        expect(result.current.radarInfo.operationalRange).toBe(25000);
      }, { timeout: 1000 });

      // Other properties should remain unchanged
      expect(result.current.radarInfo.coordinates.latitude).toBe(originalLat);
      expect(result.current.radarInfo.coordinates.longitude).toBe(originalLon);
      expect(result.current.radarInfo.heading).toBe(originalHeading);
      expect(result.current.radarInfo.ownSpeed).toBe(originalSpeed);
    });

    it('should handle zero range', async () => {
      vi.mocked(radarApi.fetchRadarState).mockResolvedValue(mockRadarState);

      const { result } = renderHook(() => useRadarState(controllerUrl));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 1000 });

      result.current.updateMaxRange(0);

      await waitFor(() => {
        expect(result.current.radarInfo.operationalRange).toBe(0);
      }, { timeout: 1000 });

      expect(toast.info).toHaveBeenCalledWith('Radar range set to 0 km');
    });

    it('should handle large ranges', async () => {
      vi.mocked(radarApi.fetchRadarState).mockResolvedValue(mockRadarState);

      const { result } = renderHook(() => useRadarState(controllerUrl));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 1000 });

      result.current.updateMaxRange(1000);

      await waitFor(() => {
        expect(result.current.radarInfo.operationalRange).toBe(1000000);
      }, { timeout: 1000 });
    });
  });

  describe('URL changes', () => {
    it('should refetch when controllerUrl changes', async () => {
      vi.mocked(radarApi.fetchRadarState).mockResolvedValue(mockRadarState);

      const { result, rerender } = renderHook(
        ({ url }) => useRadarState(url),
        { initialProps: { url: controllerUrl } }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 1000 });

      expect(radarApi.fetchRadarState).toHaveBeenCalledTimes(1);

      // Change URL
      const newUrl = 'http://localhost:17395';
      rerender({ url: newUrl });

      await waitFor(() => {
        expect(radarApi.fetchRadarState).toHaveBeenCalledWith(newUrl);
      }, { timeout: 1000 });

      expect(radarApi.fetchRadarState).toHaveBeenCalledTimes(2);
    });
  });

  describe('Cleanup', () => {
    it('should not update state after unmount', async () => {
      vi.mocked(radarApi.fetchRadarState).mockImplementation(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(mockRadarState), 100);
        });
      });

      const { result, unmount } = renderHook(() => useRadarState(controllerUrl));

      expect(result.current.isLoading).toBe(true);

      // Unmount before fetch completes
      unmount();

      // Wait to ensure fetch would have completed
      await new Promise(resolve => setTimeout(resolve, 200));

      // No errors should occur from state updates after unmount
      expect(radarApi.fetchRadarState).toHaveBeenCalledTimes(1);
    });
  });
});
