import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RadarInfoPanel } from '../RadarInfoPanel';
import * as WebSocketContext from '../../contexts/WebSocketContext';
import { RadarInfo } from '../../types/radar';

vi.mock('../../contexts/WebSocketContext');
vi.mock('../../utils/radarUtils', () => ({
  formatCoordinates: vi.fn((lat: number, lon: number) => `${lat}°, ${lon}°`),
}));

describe('RadarInfoPanel', () => {
  const mockRadarInfo: RadarInfo = {
    coordinates: {
      latitude: 45.5,
      longitude: -122.6,
    },
    heading: 90.5,
    ownSpeed: 10.3,
    operationalRange: 15000, // 15 km in meters
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Error state', () => {
    it('should render error state when hasError is true', () => {
      vi.mocked(WebSocketContext.useWebSocket).mockReturnValue({
        radarInfo: mockRadarInfo,
        isLoading: false,
        hasError: true,
        isConnected: false,
        tracks: [],
      });

      render(<RadarInfoPanel />);

      expect(screen.getByText('CONNECTION ERROR')).toBeInTheDocument();
      expect(screen.getByText(/Unable to connect to the radar controller/)).toBeInTheDocument();
    });

    it('should show error message with proper styling', () => {
      vi.mocked(WebSocketContext.useWebSocket).mockReturnValue({
        radarInfo: mockRadarInfo,
        isLoading: false,
        hasError: true,
        isConnected: false,
        tracks: [],
      });

      const { container } = render(<RadarInfoPanel />);

      const errorText = screen.getByText(/Unable to connect to the radar controller/);
      expect(errorText).toHaveClass('text-xs', 'text-red-500');
    });

    it('should not render radar data in error state', () => {
      vi.mocked(WebSocketContext.useWebSocket).mockReturnValue({
        radarInfo: mockRadarInfo,
        isLoading: false,
        hasError: true,
        isConnected: false,
        tracks: [],
      });

      render(<RadarInfoPanel />);

      expect(screen.queryByText('Coordinates:')).not.toBeInTheDocument();
      expect(screen.queryByText('Heading:')).not.toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('should render loading state when loading and not connected', () => {
      vi.mocked(WebSocketContext.useWebSocket).mockReturnValue({
        radarInfo: mockRadarInfo,
        isLoading: true,
        hasError: false,
        isConnected: false,
        tracks: [],
      });

      render(<RadarInfoPanel />);

      expect(screen.getByText('RADAR INFO')).toBeInTheDocument();
      // Skeletons should be present (checking for skeleton background color class)
      const skeletons = document.querySelectorAll('.bg-radar-grid\\/30');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should not render loading state when connected', () => {
      vi.mocked(WebSocketContext.useWebSocket).mockReturnValue({
        radarInfo: mockRadarInfo,
        isLoading: true,
        hasError: false,
        isConnected: true,
        tracks: [],
      });

      render(<RadarInfoPanel />);

      // Should render normal state, not loading
      expect(screen.getByText('Coordinates:')).toBeInTheDocument();
    });

    it('should render skeleton placeholders in loading state', () => {
      vi.mocked(WebSocketContext.useWebSocket).mockReturnValue({
        radarInfo: mockRadarInfo,
        isLoading: true,
        hasError: false,
        isConnected: false,
        tracks: [],
      });

      const { container } = render(<RadarInfoPanel />);

      // Should have 8 skeleton elements (2 per row, 4 rows)
      const skeletons = container.querySelectorAll('.bg-radar-grid\\/30');
      expect(skeletons.length).toBe(8);
    });
  });

  describe('Normal state', () => {
    beforeEach(() => {
      vi.mocked(WebSocketContext.useWebSocket).mockReturnValue({
        radarInfo: mockRadarInfo,
        isLoading: false,
        hasError: false,
        isConnected: true,
        tracks: [],
      });
    });

    it('should render radar info title', () => {
      render(<RadarInfoPanel />);

      expect(screen.getByText('RADAR INFO')).toBeInTheDocument();
    });

    it('should render coordinates label and value', () => {
      render(<RadarInfoPanel />);

      expect(screen.getByText('Coordinates:')).toBeInTheDocument();
      expect(screen.getByText('45.5°, -122.6°')).toBeInTheDocument();
    });

    it('should render heading with correct formatting', () => {
      render(<RadarInfoPanel />);

      expect(screen.getByText('Heading:')).toBeInTheDocument();
      expect(screen.getByText('90.5°')).toBeInTheDocument();
    });

    it('should render speed with correct formatting', () => {
      render(<RadarInfoPanel />);

      expect(screen.getByText('Speed:')).toBeInTheDocument();
      expect(screen.getByText('10.3 m/s')).toBeInTheDocument();
    });

    it('should render operational range in kilometers', () => {
      render(<RadarInfoPanel />);

      expect(screen.getByText('Range:')).toBeInTheDocument();
      expect(screen.getByText('15.0 km')).toBeInTheDocument();
    });

    it('should call formatCoordinates with correct values', async () => {
      const radarUtils = await import('../../utils/radarUtils');

      render(<RadarInfoPanel />);

      expect(radarUtils.formatCoordinates).toHaveBeenCalledWith(45.5, -122.6);
    });

    it('should render all field labels', () => {
      render(<RadarInfoPanel />);

      expect(screen.getByText('Coordinates:')).toBeInTheDocument();
      expect(screen.getByText('Heading:')).toBeInTheDocument();
      expect(screen.getByText('Speed:')).toBeInTheDocument();
      expect(screen.getByText('Range:')).toBeInTheDocument();
    });

    it('should render with correct grid layout', () => {
      const { container } = render(<RadarInfoPanel />);

      const gridElement = container.querySelector('.grid.grid-cols-2');
      expect(gridElement).toBeInTheDocument();
    });
  });

  describe('Number formatting', () => {
    it('should format heading to 1 decimal place', () => {
      vi.mocked(WebSocketContext.useWebSocket).mockReturnValue({
        radarInfo: {
          ...mockRadarInfo,
          heading: 123.456,
        },
        isLoading: false,
        hasError: false,
        isConnected: true,
        tracks: [],
      });

      render(<RadarInfoPanel />);

      expect(screen.getByText('123.5°')).toBeInTheDocument();
    });

    it('should format speed to 1 decimal place', () => {
      vi.mocked(WebSocketContext.useWebSocket).mockReturnValue({
        radarInfo: {
          ...mockRadarInfo,
          ownSpeed: 25.789,
        },
        isLoading: false,
        hasError: false,
        isConnected: true,
        tracks: [],
      });

      render(<RadarInfoPanel />);

      expect(screen.getByText('25.8 m/s')).toBeInTheDocument();
    });

    it('should format range to 1 decimal place', () => {
      vi.mocked(WebSocketContext.useWebSocket).mockReturnValue({
        radarInfo: {
          ...mockRadarInfo,
          operationalRange: 12345, // 12.345 km
        },
        isLoading: false,
        hasError: false,
        isConnected: true,
        tracks: [],
      });

      render(<RadarInfoPanel />);

      expect(screen.getByText('12.3 km')).toBeInTheDocument();
    });

    it('should handle zero values correctly', () => {
      vi.mocked(WebSocketContext.useWebSocket).mockReturnValue({
        radarInfo: {
          ...mockRadarInfo,
          heading: 0,
          ownSpeed: 0,
          operationalRange: 0,
        },
        isLoading: false,
        hasError: false,
        isConnected: true,
        tracks: [],
      });

      render(<RadarInfoPanel />);

      expect(screen.getByText('0.0°')).toBeInTheDocument();
      expect(screen.getByText('0.0 m/s')).toBeInTheDocument();
      expect(screen.getByText('0.0 km')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle very large heading values', () => {
      vi.mocked(WebSocketContext.useWebSocket).mockReturnValue({
        radarInfo: {
          ...mockRadarInfo,
          heading: 359.9,
        },
        isLoading: false,
        hasError: false,
        isConnected: true,
        tracks: [],
      });

      render(<RadarInfoPanel />);

      expect(screen.getByText('359.9°')).toBeInTheDocument();
    });

    it('should handle very high speed values', () => {
      vi.mocked(WebSocketContext.useWebSocket).mockReturnValue({
        radarInfo: {
          ...mockRadarInfo,
          ownSpeed: 999.9,
        },
        isLoading: false,
        hasError: false,
        isConnected: true,
        tracks: [],
      });

      render(<RadarInfoPanel />);

      expect(screen.getByText('999.9 m/s')).toBeInTheDocument();
    });

    it('should handle very large range values', () => {
      vi.mocked(WebSocketContext.useWebSocket).mockReturnValue({
        radarInfo: {
          ...mockRadarInfo,
          operationalRange: 999999, // 999.999 km
        },
        isLoading: false,
        hasError: false,
        isConnected: true,
        tracks: [],
      });

      render(<RadarInfoPanel />);

      expect(screen.getByText('1000.0 km')).toBeInTheDocument();
    });

    it('should handle negative heading values', () => {
      vi.mocked(WebSocketContext.useWebSocket).mockReturnValue({
        radarInfo: {
          ...mockRadarInfo,
          heading: -45.5,
        },
        isLoading: false,
        hasError: false,
        isConnected: true,
        tracks: [],
      });

      render(<RadarInfoPanel />);

      expect(screen.getByText('-45.5°')).toBeInTheDocument();
    });

    it('should handle small decimal values', () => {
      vi.mocked(WebSocketContext.useWebSocket).mockReturnValue({
        radarInfo: {
          ...mockRadarInfo,
          heading: 0.1,
          ownSpeed: 0.05,
          operationalRange: 100, // 0.1 km
        },
        isLoading: false,
        hasError: false,
        isConnected: true,
        tracks: [],
      });

      render(<RadarInfoPanel />);

      expect(screen.getByText('0.1°')).toBeInTheDocument();
      expect(screen.getByText('0.1 m/s')).toBeInTheDocument(); // 0.05 rounds to 0.1
      expect(screen.getByText('0.1 km')).toBeInTheDocument();
    });
  });

  describe('State transitions', () => {
    it('should transition from loading to normal state', () => {
      const { rerender } = render(<RadarInfoPanel />);

      // Start with loading
      vi.mocked(WebSocketContext.useWebSocket).mockReturnValue({
        radarInfo: mockRadarInfo,
        isLoading: true,
        hasError: false,
        isConnected: false,
        tracks: [],
      });

      rerender(<RadarInfoPanel />);

      const skeletons = document.querySelectorAll('.bg-radar-grid\\/30');
      expect(skeletons.length).toBeGreaterThan(0);

      // Transition to connected
      vi.mocked(WebSocketContext.useWebSocket).mockReturnValue({
        radarInfo: mockRadarInfo,
        isLoading: false,
        hasError: false,
        isConnected: true,
        tracks: [],
      });

      rerender(<RadarInfoPanel />);

      expect(screen.getByText('Coordinates:')).toBeInTheDocument();
      expect(screen.getByText('45.5°, -122.6°')).toBeInTheDocument();
    });

    it('should transition from normal to error state', () => {
      const { rerender } = render(<RadarInfoPanel />);

      // Start with normal
      vi.mocked(WebSocketContext.useWebSocket).mockReturnValue({
        radarInfo: mockRadarInfo,
        isLoading: false,
        hasError: false,
        isConnected: true,
        tracks: [],
      });

      rerender(<RadarInfoPanel />);

      expect(screen.getByText('Coordinates:')).toBeInTheDocument();

      // Transition to error
      vi.mocked(WebSocketContext.useWebSocket).mockReturnValue({
        radarInfo: mockRadarInfo,
        isLoading: false,
        hasError: true,
        isConnected: false,
        tracks: [],
      });

      rerender(<RadarInfoPanel />);

      expect(screen.getByText('CONNECTION ERROR')).toBeInTheDocument();
      expect(screen.queryByText('Coordinates:')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should render proper card structure', () => {
      vi.mocked(WebSocketContext.useWebSocket).mockReturnValue({
        radarInfo: mockRadarInfo,
        isLoading: false,
        hasError: false,
        isConnected: true,
        tracks: [],
      });

      const { container } = render(<RadarInfoPanel />);

      // Check that component renders successfully
      expect(container.firstChild).toBeTruthy();
      expect(screen.getByText('RADAR INFO')).toBeInTheDocument();
    });

    it('should render icons for visual enhancement', () => {
      vi.mocked(WebSocketContext.useWebSocket).mockReturnValue({
        radarInfo: mockRadarInfo,
        isLoading: false,
        hasError: false,
        isConnected: true,
        tracks: [],
      });

      const { container } = render(<RadarInfoPanel />);

      // Check for lucide-react icons
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });
  });
});
