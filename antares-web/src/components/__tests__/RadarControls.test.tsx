import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RadarControls } from '../RadarControls';
import * as WebSocketContext from '../../contexts/WebSocketContext';
import { RadarInfo } from '../../types/radar';

vi.mock('../../contexts/WebSocketContext');
vi.mock('../AddShipModal', () => ({
  AddShipModal: ({ open, onOpenChange }: any) =>
    open ? <div data-testid="add-ship-modal">Add Ship Modal</div> : null,
}));

describe('RadarControls', () => {
  const mockRadarInfo: RadarInfo = {
    coordinates: { latitude: 0, longitude: 0 },
    heading: 0,
    ownSpeed: 0,
    operationalRange: 10000, // 10 km
  };

  const mockResetSimulation = vi.fn();
  const mockUpdateMaxRange = vi.fn();
  const mockOnToggleSweep = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(WebSocketContext.useWebSocket).mockReturnValue({
      radarInfo: mockRadarInfo,
      isLoading: false,
      hasError: false,
      isConnected: true,
      tracks: [],
      resetSimulation: mockResetSimulation,
      updateMaxRange: mockUpdateMaxRange,
      connectionAttempts: 1,
      maxConnectionAttempts: 3,
    });
  });

  describe('Sweep toggle', () => {
    it('should render sweep toggle switch', () => {
      render(<RadarControls showSweep={false} onToggleSweep={mockOnToggleSweep} />);

      expect(screen.getByText('Radar Sweep')).toBeInTheDocument();
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('should show checked state when showSweep is true', () => {
      render(<RadarControls showSweep={true} onToggleSweep={mockOnToggleSweep} />);

      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('data-state', 'checked');
    });

    it('should show unchecked state when showSweep is false', () => {
      render(<RadarControls showSweep={false} onToggleSweep={mockOnToggleSweep} />);

      const switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('data-state', 'unchecked');
    });

    it('should call onToggleSweep when switch is toggled', () => {
      render(<RadarControls showSweep={false} onToggleSweep={mockOnToggleSweep} />);

      const switchElement = screen.getByRole('switch');
      fireEvent.click(switchElement);

      expect(mockOnToggleSweep).toHaveBeenCalledWith(true);
    });
  });

  describe('Connection status', () => {
    it('should show "Connected" when connected', () => {
      render(<RadarControls showSweep={false} onToggleSweep={mockOnToggleSweep} />);

      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('should show "Connecting" with attempt count when not connected', () => {
      vi.mocked(WebSocketContext.useWebSocket).mockReturnValue({
        radarInfo: mockRadarInfo,
        isLoading: false,
        hasError: false,
        isConnected: false,
        tracks: [],
        resetSimulation: mockResetSimulation,
        updateMaxRange: mockUpdateMaxRange,
        connectionAttempts: 2,
        maxConnectionAttempts: 3,
      });

      render(<RadarControls showSweep={false} onToggleSweep={mockOnToggleSweep} />);

      expect(screen.getByText('Connecting (2/3)')).toBeInTheDocument();
    });

    it('should show "Failed" when max connection attempts reached', () => {
      vi.mocked(WebSocketContext.useWebSocket).mockReturnValue({
        radarInfo: mockRadarInfo,
        isLoading: false,
        hasError: false,
        isConnected: false,
        tracks: [],
        resetSimulation: mockResetSimulation,
        updateMaxRange: mockUpdateMaxRange,
        connectionAttempts: 3,
        maxConnectionAttempts: 3,
      });

      render(<RadarControls showSweep={false} onToggleSweep={mockOnToggleSweep} />);

      expect(screen.getByText('Failed')).toBeInTheDocument();
    });

    it('should render green indicator when connected', () => {
      const { container } = render(<RadarControls showSweep={false} onToggleSweep={mockOnToggleSweep} />);

      const indicator = container.querySelector('.bg-green-400');
      expect(indicator).toBeInTheDocument();
    });

    it('should render yellow indicator when connecting', () => {
      vi.mocked(WebSocketContext.useWebSocket).mockReturnValue({
        radarInfo: mockRadarInfo,
        isLoading: false,
        hasError: false,
        isConnected: false,
        tracks: [],
        resetSimulation: mockResetSimulation,
        updateMaxRange: mockUpdateMaxRange,
        connectionAttempts: 1,
        maxConnectionAttempts: 3,
      });

      const { container } = render(<RadarControls showSweep={false} onToggleSweep={mockOnToggleSweep} />);

      const indicator = container.querySelector('.bg-yellow-400');
      expect(indicator).toBeInTheDocument();
    });

    it('should render red indicator when failed', () => {
      vi.mocked(WebSocketContext.useWebSocket).mockReturnValue({
        radarInfo: mockRadarInfo,
        isLoading: false,
        hasError: false,
        isConnected: false,
        tracks: [],
        resetSimulation: mockResetSimulation,
        updateMaxRange: mockUpdateMaxRange,
        connectionAttempts: 3,
        maxConnectionAttempts: 3,
      });

      const { container } = render(<RadarControls showSweep={false} onToggleSweep={mockOnToggleSweep} />);

      const indicator = container.querySelector('.bg-red-400');
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('Action buttons', () => {
    it('should render ADD SHIP button', () => {
      render(<RadarControls showSweep={false} onToggleSweep={mockOnToggleSweep} />);

      expect(screen.getByText('ADD SHIP')).toBeInTheDocument();
    });

    it('should render RESET button', () => {
      render(<RadarControls showSweep={false} onToggleSweep={mockOnToggleSweep} />);

      expect(screen.getByText('RESET')).toBeInTheDocument();
    });

    it('should enable ADD SHIP button when connected', () => {
      render(<RadarControls showSweep={false} onToggleSweep={mockOnToggleSweep} />);

      const addShipButton = screen.getByText('ADD SHIP').closest('button');
      expect(addShipButton).not.toBeDisabled();
    });

    it('should enable RESET button when connected', () => {
      render(<RadarControls showSweep={false} onToggleSweep={mockOnToggleSweep} />);

      const resetButton = screen.getByText('RESET').closest('button');
      expect(resetButton).not.toBeDisabled();
    });

    it('should disable ADD SHIP button when not connected', () => {
      vi.mocked(WebSocketContext.useWebSocket).mockReturnValue({
        radarInfo: mockRadarInfo,
        isLoading: false,
        hasError: false,
        isConnected: false,
        tracks: [],
        resetSimulation: mockResetSimulation,
        updateMaxRange: mockUpdateMaxRange,
        connectionAttempts: 1,
        maxConnectionAttempts: 3,
      });

      render(<RadarControls showSweep={false} onToggleSweep={mockOnToggleSweep} />);

      const addShipButton = screen.getByText('ADD SHIP').closest('button');
      expect(addShipButton).toBeDisabled();
    });

    it('should disable RESET button when not connected', () => {
      vi.mocked(WebSocketContext.useWebSocket).mockReturnValue({
        radarInfo: mockRadarInfo,
        isLoading: false,
        hasError: false,
        isConnected: false,
        tracks: [],
        resetSimulation: mockResetSimulation,
        updateMaxRange: mockUpdateMaxRange,
        connectionAttempts: 1,
        maxConnectionAttempts: 3,
      });

      render(<RadarControls showSweep={false} onToggleSweep={mockOnToggleSweep} />);

      const resetButton = screen.getByText('RESET').closest('button');
      expect(resetButton).toBeDisabled();
    });

    it('should call resetSimulation when RESET button is clicked', () => {
      render(<RadarControls showSweep={false} onToggleSweep={mockOnToggleSweep} />);

      const resetButton = screen.getByText('RESET');
      fireEvent.click(resetButton);

      expect(mockResetSimulation).toHaveBeenCalled();
    });

    it('should open AddShipModal when ADD SHIP button is clicked', () => {
      render(<RadarControls showSweep={false} onToggleSweep={mockOnToggleSweep} />);

      const addShipButton = screen.getByText('ADD SHIP');
      fireEvent.click(addShipButton);

      expect(screen.getByTestId('add-ship-modal')).toBeInTheDocument();
    });
  });

  describe('Range control', () => {
    it('should display current range value', () => {
      render(<RadarControls showSweep={false} onToggleSweep={mockOnToggleSweep} />);

      // Initial range is 10 km (from mockRadarInfo.operationalRange / 1000)
      expect(screen.getByText(/Range \(10 km\)/)).toBeInTheDocument();
    });

    it('should render all range option buttons', () => {
      render(<RadarControls showSweep={false} onToggleSweep={mockOnToggleSweep} />);

      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('20')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('should highlight current range option button', () => {
      render(<RadarControls showSweep={false} onToggleSweep={mockOnToggleSweep} />);

      const button10 = screen.getByText('10').closest('button');
      expect(button10).toHaveClass('bg-radar-target');
    });

    it('should call updateMaxRange when range button is clicked', () => {
      render(<RadarControls showSweep={false} onToggleSweep={mockOnToggleSweep} />);

      const button20 = screen.getByText('20');
      fireEvent.click(button20);

      expect(mockUpdateMaxRange).toHaveBeenCalledWith(20);
    });

    it('should update displayed range when range button is clicked', () => {
      const { rerender } = render(<RadarControls showSweep={false} onToggleSweep={mockOnToggleSweep} />);

      const button50 = screen.getByText('50');
      fireEvent.click(button50);

      // After clicking, the label should update
      expect(screen.getByText(/Range \(50 km\)/)).toBeInTheDocument();
    });

    it('should render slider element', () => {
      const { container } = render(<RadarControls showSweep={false} onToggleSweep={mockOnToggleSweep} />);

      const slider = container.querySelector('[role="slider"]');
      expect(slider).toBeInTheDocument();
    });
  });

  describe('AddShipModal integration', () => {
    it('should not show modal initially', () => {
      render(<RadarControls showSweep={false} onToggleSweep={mockOnToggleSweep} />);

      expect(screen.queryByTestId('add-ship-modal')).not.toBeInTheDocument();
    });

    it('should show modal when ADD SHIP is clicked', () => {
      render(<RadarControls showSweep={false} onToggleSweep={mockOnToggleSweep} />);

      const addShipButton = screen.getByText('ADD SHIP');
      fireEvent.click(addShipButton);

      expect(screen.getByTestId('add-ship-modal')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle different initial range values', () => {
      vi.mocked(WebSocketContext.useWebSocket).mockReturnValue({
        radarInfo: {
          ...mockRadarInfo,
          operationalRange: 50000, // 50 km
        },
        isLoading: false,
        hasError: false,
        isConnected: true,
        tracks: [],
        resetSimulation: mockResetSimulation,
        updateMaxRange: mockUpdateMaxRange,
        connectionAttempts: 1,
        maxConnectionAttempts: 3,
      });

      render(<RadarControls showSweep={false} onToggleSweep={mockOnToggleSweep} />);

      expect(screen.getByText(/Range \(50 km\)/)).toBeInTheDocument();
    });

    it('should handle zero connection attempts', () => {
      vi.mocked(WebSocketContext.useWebSocket).mockReturnValue({
        radarInfo: mockRadarInfo,
        isLoading: false,
        hasError: false,
        isConnected: false,
        tracks: [],
        resetSimulation: mockResetSimulation,
        updateMaxRange: mockUpdateMaxRange,
        connectionAttempts: 0,
        maxConnectionAttempts: 3,
      });

      render(<RadarControls showSweep={false} onToggleSweep={mockOnToggleSweep} />);

      expect(screen.getByText('Connecting (0/3)')).toBeInTheDocument();
    });

    it('should handle exceeding max connection attempts', () => {
      vi.mocked(WebSocketContext.useWebSocket).mockReturnValue({
        radarInfo: mockRadarInfo,
        isLoading: false,
        hasError: false,
        isConnected: false,
        tracks: [],
        resetSimulation: mockResetSimulation,
        updateMaxRange: mockUpdateMaxRange,
        connectionAttempts: 5,
        maxConnectionAttempts: 3,
      });

      render(<RadarControls showSweep={false} onToggleSweep={mockOnToggleSweep} />);

      expect(screen.getByText('Failed')).toBeInTheDocument();
    });
  });

  describe('Layout and styling', () => {
    it('should render proper component structure', () => {
      const { container } = render(<RadarControls showSweep={false} onToggleSweep={mockOnToggleSweep} />);

      expect(container.querySelector('.flex.flex-col.gap-4')).toBeInTheDocument();
    });

    it('should render icons for buttons', () => {
      const { container } = render(<RadarControls showSweep={false} onToggleSweep={mockOnToggleSweep} />);

      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });

    it('should apply proper border styling', () => {
      const { container } = render(<RadarControls showSweep={false} onToggleSweep={mockOnToggleSweep} />);

      const borderedElements = container.querySelectorAll('.border-radar-grid');
      expect(borderedElements.length).toBeGreaterThan(0);
    });
  });

  describe('State synchronization', () => {
    it('should update onToggleSweep callback when prop changes', () => {
      const newOnToggleSweep = vi.fn();
      const { rerender } = render(<RadarControls showSweep={false} onToggleSweep={mockOnToggleSweep} />);

      rerender(<RadarControls showSweep={false} onToggleSweep={newOnToggleSweep} />);

      const switchElement = screen.getByRole('switch');
      fireEvent.click(switchElement);

      expect(newOnToggleSweep).toHaveBeenCalled();
      expect(mockOnToggleSweep).not.toHaveBeenCalled();
    });

    it('should reflect showSweep prop changes', () => {
      const { rerender } = render(<RadarControls showSweep={false} onToggleSweep={mockOnToggleSweep} />);

      let switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('data-state', 'unchecked');

      rerender(<RadarControls showSweep={true} onToggleSweep={mockOnToggleSweep} />);

      switchElement = screen.getByRole('switch');
      expect(switchElement).toHaveAttribute('data-state', 'checked');
    });
  });
});
