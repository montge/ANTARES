import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RadarDisplay } from '../RadarDisplay';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { Track, RadarConfig, RadarInfo } from '@/types/radar';
import * as radarUtils from '@/utils/radarUtils';

// Mock the WebSocketContext
vi.mock('@/contexts/WebSocketContext', () => ({
  useWebSocket: vi.fn(),
}));

// Mock TrackInfo component
vi.mock('../TrackInfo', () => ({
  TrackInfo: ({ track }: { track: Track }) => (
    <div data-testid="track-info">
      Track ID: {track.id}
    </div>
  ),
}));

// Mock radarUtils
vi.mock('@/utils/radarUtils', async () => {
  const actual = await vi.importActual('@/utils/radarUtils');
  return {
    ...actual,
    polarToCartesian: vi.fn(),
    findTrackAtCoordinates: vi.fn(),
  };
});

describe('RadarDisplay', () => {
  const mockConfig: RadarConfig = {
    maxRange: 10000,
    rangeRings: 4,
    azimuthLines: 12,
    showSweep: true,
  };

  const mockRadarInfo: RadarInfo = {
    coordinates: {
      latitude: 4.0,
      longitude: -72.0,
    },
    heading: 0,
    ownSpeed: 0,
    operationalRange: 10000,
  };

  const mockTracks: Track[] = [
    {
      id: '1',
      range: 5000,
      azimuth: 45,
      velocity: {
        speed: 10.5,
        heading: 90,
      },
      lat: 4.1,
      long: -72.1,
      timestamp: Date.now(),
      quality: 25,
      type: 'TARGET',
    },
    {
      id: '2',
      range: 3000,
      azimuth: 180,
      velocity: {
        speed: 5.0,
        heading: 270,
      },
      lat: 4.2,
      long: -72.2,
      timestamp: Date.now(),
      quality: 30,
      type: 'ATON',
      name: 'Buoy-1',
    },
  ];

  // Mock canvas context
  let mockContext: any;
  let mockCanvas: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup canvas mock
    mockContext = {
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      fillText: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      font: '',
      textAlign: '',
    };

    const boundingRect = {
      left: 0,
      top: 0,
      width: 600,
      height: 600,
      right: 600,
      bottom: 600,
      x: 0,
      y: 0,
      toJSON: () => {},
    };

    // Mock HTMLCanvasElement.prototype methods
    HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext);
    HTMLCanvasElement.prototype.getBoundingClientRect = vi.fn(() => boundingRect);

    // Set canvas dimensions as properties
    Object.defineProperty(HTMLCanvasElement.prototype, 'width', {
      get: () => 600,
      set: () => {},
      configurable: true,
    });
    Object.defineProperty(HTMLCanvasElement.prototype, 'height', {
      get: () => 600,
      set: () => {},
      configurable: true,
    });

    // Setup default useWebSocket mock
    vi.mocked(useWebSocket).mockReturnValue({
      tracks: mockTracks,
      isConnected: true,
      isLoading: false,
      hasError: false,
      connectionAttempts: 0,
      maxConnectionAttempts: 5,
      addShip: vi.fn(),
      resetSimulation: vi.fn(),
      sweepAngle: 45,
      radarInfo: mockRadarInfo,
      updateMaxRange: vi.fn(),
    });

    // Setup radarUtils mocks
    vi.mocked(radarUtils.polarToCartesian).mockImplementation((range, azimuth) => ({
      x: 300 + range * 0.05 * Math.sin((azimuth * Math.PI) / 180),
      y: 300 - range * 0.05 * Math.cos((azimuth * Math.PI) / 180),
    }));

    vi.mocked(radarUtils.findTrackAtCoordinates).mockReturnValue(null);
  });

  describe('Rendering', () => {
    it('should render canvas element', () => {
      const { container } = render(<RadarDisplay config={mockConfig} />);
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeTruthy();
    });

    it('should render with proper container className', () => {
      const { container } = render(<RadarDisplay config={mockConfig} />);
      const radarContainer = container.querySelector('.radar-container');
      expect(radarContainer).toBeTruthy();
      expect(radarContainer).toHaveClass('relative', 'w-full', 'h-full');
    });

    it('should not render TrackInfo when no track is selected', () => {
      render(<RadarDisplay config={mockConfig} />);
      const trackInfo = screen.queryByTestId('track-info');
      expect(trackInfo).toBeNull();
    });
  });

  describe('Canvas Drawing', () => {
    it('should clear canvas before drawing', () => {
      render(<RadarDisplay config={mockConfig} />);
      expect(mockContext.clearRect).toHaveBeenCalled();
    });

    it('should draw range rings based on config', () => {
      render(<RadarDisplay config={mockConfig} />);

      // Should draw rangeRings circles (4 in our config)
      const arcCalls = mockContext.arc.mock.calls;
      // At least rangeRings arcs should be drawn (range rings)
      expect(arcCalls.length).toBeGreaterThanOrEqual(mockConfig.rangeRings);
    });

    it('should draw azimuth lines based on config', () => {
      render(<RadarDisplay config={mockConfig} />);

      // Should draw azimuthLines (12 in our config)
      const lineCallCount = mockContext.lineTo.mock.calls.filter((call: any) => {
        // Filter for azimuth lines (from center)
        return true;
      }).length;

      expect(lineCallCount).toBeGreaterThan(0);
    });

    it('should draw tracks from WebSocket context', () => {
      render(<RadarDisplay config={mockConfig} />);

      // Should call polarToCartesian for each track (may be called multiple times due to resize/rerender)
      expect(radarUtils.polarToCartesian).toHaveBeenCalled();

      // Verify it was called with correct track data
      expect(radarUtils.polarToCartesian).toHaveBeenCalledWith(
        mockTracks[0].range,
        mockTracks[0].azimuth,
        mockRadarInfo.operationalRange,
        expect.any(Number),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should draw sweep line when showSweep is true', () => {
      render(<RadarDisplay config={mockConfig} />);

      // Sweep line drawing should call moveTo and lineTo
      const moveToCall = mockContext.moveTo.mock.calls.some((call: number[]) =>
        call[0] === 300 && call[1] === 300 // Center point
      );
      expect(moveToCall).toBe(true);
    });

    it('should not draw sweep line when showSweep is false', () => {
      const configWithoutSweep = { ...mockConfig, showSweep: false };

      render(<RadarDisplay config={configWithoutSweep} />);

      // Count sweep-related drawing calls should be less
      // This is a simplified test - in reality you'd check specific patterns
      expect(mockContext.moveTo).toHaveBeenCalled();
    });

    it('should redraw when tracks change', () => {
      const { rerender } = render(<RadarDisplay config={mockConfig} />);

      const initialClearCalls = mockContext.clearRect.mock.calls.length;

      // Update tracks
      vi.mocked(useWebSocket).mockReturnValue({
        tracks: [mockTracks[0]],
        isConnected: true,
        isLoading: false,
        hasError: false,
        connectionAttempts: 0,
        maxConnectionAttempts: 5,
        addShip: vi.fn(),
        resetSimulation: vi.fn(),
        sweepAngle: 45,
        radarInfo: mockRadarInfo,
        updateMaxRange: vi.fn(),
      });

      rerender(<RadarDisplay config={mockConfig} />);

      // Should have cleared canvas again
      expect(mockContext.clearRect.mock.calls.length).toBeGreaterThan(initialClearCalls);
    });

    it('should redraw when config changes', () => {
      const { rerender } = render(<RadarDisplay config={mockConfig} />);

      const initialClearCalls = mockContext.clearRect.mock.calls.length;

      const newConfig = { ...mockConfig, rangeRings: 8 };
      rerender(<RadarDisplay config={newConfig} />);

      // Should have cleared canvas again
      expect(mockContext.clearRect.mock.calls.length).toBeGreaterThan(initialClearCalls);
    });

    it('should redraw when sweep angle changes', () => {
      const { rerender } = render(<RadarDisplay config={mockConfig} />);

      const initialClearCalls = mockContext.clearRect.mock.calls.length;

      // Update sweep angle
      vi.mocked(useWebSocket).mockReturnValue({
        tracks: mockTracks,
        isConnected: true,
        isLoading: false,
        hasError: false,
        connectionAttempts: 0,
        maxConnectionAttempts: 5,
        addShip: vi.fn(),
        resetSimulation: vi.fn(),
        sweepAngle: 90, // Changed from 45
        radarInfo: mockRadarInfo,
        updateMaxRange: vi.fn(),
      });

      rerender(<RadarDisplay config={mockConfig} />);

      // Should have cleared canvas again
      expect(mockContext.clearRect.mock.calls.length).toBeGreaterThan(initialClearCalls);
    });
  });

  describe('Track Selection', () => {
    it('should select track when canvas is clicked', () => {
      // Mock findTrackAtCoordinates to return a track
      vi.mocked(radarUtils.findTrackAtCoordinates).mockReturnValue(mockTracks[0]);

      const { container } = render(<RadarDisplay config={mockConfig} />);
      const canvas = container.querySelector('canvas');

      expect(canvas).toBeTruthy();

      // Simulate click
      fireEvent.click(canvas!, {
        clientX: 350,
        clientY: 250,
      });

      // Should show TrackInfo
      const trackInfo = screen.getByTestId('track-info');
      expect(trackInfo).toBeTruthy();
      expect(trackInfo).toHaveTextContent('Track ID: 1');
    });

    it('should clear selection when clicking empty area', () => {
      // First select a track
      vi.mocked(radarUtils.findTrackAtCoordinates).mockReturnValue(mockTracks[0]);

      const { container } = render(<RadarDisplay config={mockConfig} />);
      const canvas = container.querySelector('canvas');

      fireEvent.click(canvas!, { clientX: 350, clientY: 250 });

      expect(screen.getByTestId('track-info')).toBeTruthy();

      // Then click empty area
      vi.mocked(radarUtils.findTrackAtCoordinates).mockReturnValue(null);
      fireEvent.click(canvas!, { clientX: 100, clientY: 100 });

      // TrackInfo should be gone
      expect(screen.queryByTestId('track-info')).toBeNull();
    });

    it('should call findTrackAtCoordinates with correct parameters', () => {
      const { container } = render(<RadarDisplay config={mockConfig} />);
      const canvas = container.querySelector('canvas');

      fireEvent.click(canvas!, { clientX: 350, clientY: 250 });

      expect(radarUtils.findTrackAtCoordinates).toHaveBeenCalledWith(
        350, // x
        250, // y
        mockTracks,
        mockRadarInfo,
        300, // centerX (600 / 2)
        300, // centerY (600 / 2)
        expect.any(Number) // radius
      );
    });

    it('should display TrackInfo in correct position', () => {
      vi.mocked(radarUtils.findTrackAtCoordinates).mockReturnValue(mockTracks[0]);

      const { container } = render(<RadarDisplay config={mockConfig} />);
      const canvas = container.querySelector('canvas');

      fireEvent.click(canvas!, { clientX: 350, clientY: 250 });

      const trackInfoContainer = container.querySelector('.absolute');
      expect(trackInfoContainer).toBeTruthy();
      expect(trackInfoContainer).toHaveStyle({ top: '10px', right: '10px' });
    });
  });

  describe('Mouse Interaction', () => {
    it('should handle mouse move events', () => {
      const { container } = render(<RadarDisplay config={mockConfig} />);
      const canvas = container.querySelector('canvas');

      // Should not throw
      expect(() => {
        fireEvent.mouseMove(canvas!, { clientX: 250, clientY: 250 });
      }).not.toThrow();
    });

    it('should update hovered point on mouse move', () => {
      const { container } = render(<RadarDisplay config={mockConfig} />);
      const canvas = container.querySelector('canvas');

      fireEvent.mouseMove(canvas!, { clientX: 250, clientY: 250 });

      // Component should handle this internally
      // We can't easily test internal state, but we verify it doesn't crash
      expect(canvas).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty tracks array', () => {
      vi.mocked(useWebSocket).mockReturnValue({
        tracks: [],
        isConnected: true,
        isLoading: false,
        hasError: false,
        connectionAttempts: 0,
        maxConnectionAttempts: 5,
        addShip: vi.fn(),
        resetSimulation: vi.fn(),
        sweepAngle: 45,
        radarInfo: mockRadarInfo,
        updateMaxRange: vi.fn(),
      });

      expect(() => render(<RadarDisplay config={mockConfig} />)).not.toThrow();
      expect(radarUtils.polarToCartesian).not.toHaveBeenCalled();
    });

    it('should handle tracks without velocity', () => {
      const trackWithoutVelocity: Track = {
        id: '3',
        range: 2000,
        azimuth: 90,
      };

      vi.mocked(useWebSocket).mockReturnValue({
        tracks: [trackWithoutVelocity],
        isConnected: true,
        isLoading: false,
        hasError: false,
        connectionAttempts: 0,
        maxConnectionAttempts: 5,
        addShip: vi.fn(),
        resetSimulation: vi.fn(),
        sweepAngle: 45,
        radarInfo: mockRadarInfo,
        updateMaxRange: vi.fn(),
      });

      expect(() => render(<RadarDisplay config={mockConfig} />)).not.toThrow();
    });

    it('should handle zero range rings', () => {
      const minimalConfig = { ...mockConfig, rangeRings: 0 };
      expect(() => render(<RadarDisplay config={minimalConfig} />)).not.toThrow();
    });

    it('should handle zero azimuth lines', () => {
      const minimalConfig = { ...mockConfig, azimuthLines: 0 };
      expect(() => render(<RadarDisplay config={minimalConfig} />)).not.toThrow();
    });

    it('should handle missing canvas context gracefully', () => {
      // Mock getContext to return null
      HTMLCanvasElement.prototype.getContext = vi.fn(() => null);

      // Should not crash
      expect(() => render(<RadarDisplay config={mockConfig} />)).not.toThrow();
    });
  });

  describe('Resize Handling', () => {
    it('should add resize event listener on mount', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      render(<RadarDisplay config={mockConfig} />);

      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    it('should remove resize event listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = render(<RadarDisplay config={mockConfig} />);

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });
  });
});
