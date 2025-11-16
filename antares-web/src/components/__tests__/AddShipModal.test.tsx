import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddShipModal } from '../AddShipModal';
import * as WebSocketContext from '../../contexts/WebSocketContext';
import * as useShipFormModule from '../ships/useShipForm';
import { ShipParams } from '../../types/radar';

vi.mock('../../contexts/WebSocketContext');
vi.mock('../ships/useShipForm');

describe('AddShipModal', () => {
  const mockAddShip = vi.fn();
  const mockOnOpenChange = vi.fn();
  const mockSetRange = vi.fn();
  const mockSetAzimuth = vi.fn();
  const mockSetSpeed = vi.fn();
  const mockSetAngle = vi.fn();
  const mockSetRadius = vi.fn();
  const mockSetMaxSpeed = vi.fn();
  const mockSetIsSubmitting = vi.fn();
  const mockHandleShipTypeChange = vi.fn();
  const mockCreateShipParams = vi.fn();
  const mockValidateForm = vi.fn();

  const defaultRadarInfo = {
    operationalRange: 10000,
    latitude: 45.5,
    longitude: -122.6,
    sweepAngle: 0,
    isSweeping: true,
    ships: [],
  };

  const defaultShipFormReturn = {
    shipType: 'LineShip' as const,
    range: 5000,
    azimuth: 180,
    speed: 10,
    angle: 90,
    radius: 2000,
    maxSpeed: 15,
    errors: {},
    isSubmitting: false,
    setRange: mockSetRange,
    setAzimuth: mockSetAzimuth,
    setSpeed: mockSetSpeed,
    setAngle: mockSetAngle,
    setRadius: mockSetRadius,
    setMaxSpeed: mockSetMaxSpeed,
    setIsSubmitting: mockSetIsSubmitting,
    handleShipTypeChange: mockHandleShipTypeChange,
    createShipParams: mockCreateShipParams,
    validateForm: mockValidateForm,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(WebSocketContext.useWebSocket).mockReturnValue({
      addShip: mockAddShip,
      radarInfo: defaultRadarInfo,
      isConnected: true,
      tracks: [],
      resetSimulation: vi.fn(),
      updateMaxRange: vi.fn(),
      connectionAttempts: 1,
      maxConnectionAttempts: 3,
    });

    vi.mocked(useShipFormModule.useShipForm).mockReturnValue(defaultShipFormReturn);

    mockValidateForm.mockReturnValue(true);
    mockAddShip.mockResolvedValue(undefined);
  });

  describe('Rendering', () => {
    it('should not render dialog when closed', () => {
      render(<AddShipModal open={false} onOpenChange={mockOnOpenChange} />);

      expect(screen.queryByText('Add New Ship')).not.toBeInTheDocument();
    });

    it('should render dialog when open', async () => {
      render(<AddShipModal open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(screen.getByText('Add New Ship')).toBeInTheDocument();
      });
    });

    it('should render dialog title', async () => {
      render(<AddShipModal open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(screen.getByText('Add New Ship')).toBeInTheDocument();
      });
    });

    it('should render dialog description', async () => {
      render(<AddShipModal open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(screen.getByText('Configure parameters for the new ship')).toBeInTheDocument();
      });
    });

    it('should render Cancel button', async () => {
      render(<AddShipModal open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });
    });

    it('should render Add Ship button', async () => {
      render(<AddShipModal open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(screen.getByText('Add Ship')).toBeInTheDocument();
      });
    });
  });

  describe('Props', () => {
    it('should accept open prop', async () => {
      const { rerender } = render(<AddShipModal open={false} onOpenChange={mockOnOpenChange} />);

      expect(screen.queryByText('Add New Ship')).not.toBeInTheDocument();

      rerender(<AddShipModal open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(screen.getByText('Add New Ship')).toBeInTheDocument();
      });
    });

    it('should accept onOpenChange prop', async () => {
      render(<AddShipModal open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(screen.getByText('Add New Ship')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('useShipForm integration', () => {
    it('should call useShipForm with open prop', () => {
      render(<AddShipModal open={true} onOpenChange={mockOnOpenChange} />);

      expect(useShipFormModule.useShipForm).toHaveBeenCalledWith(true);
    });

    it('should pass shipType to ShipTypeSelect', async () => {
      render(<AddShipModal open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(screen.getByText('Linear Motion')).toBeInTheDocument();
      });
    });

    it('should pass handleShipTypeChange to ShipTypeSelect', async () => {
      render(<AddShipModal open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(screen.getByText('Add New Ship')).toBeInTheDocument();
      });

      // ShipTypeSelect should receive handleShipTypeChange
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  describe('WebSocket integration', () => {
    it('should use radarInfo.operationalRange for InitialPositionInputs', async () => {
      render(<AddShipModal open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(screen.getByText('Add New Ship')).toBeInTheDocument();
      });

      const rangeInput = screen.getByLabelText('Range (m)') as HTMLInputElement;
      expect(rangeInput.max).toBe('10000');
    });

    it('should call addShip when form is submitted', async () => {
      const mockShipParams: ShipParams = {
        type: 'LineShip',
        initial_position: { range: 5000, azimuth: 180 },
        speed: 10,
        angle: 90,
      };

      mockCreateShipParams.mockReturnValue(mockShipParams);

      render(<AddShipModal open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(screen.getByText('Add Ship')).toBeInTheDocument();
      });

      const addButton = screen.getByText('Add Ship');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(mockAddShip).toHaveBeenCalledWith(mockShipParams);
      });
    });
  });

  describe('Form submission', () => {
    it('should validate form before submission', async () => {
      render(<AddShipModal open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(screen.getByText('Add Ship')).toBeInTheDocument();
      });

      const addButton = screen.getByText('Add Ship');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(mockValidateForm).toHaveBeenCalled();
      });
    });

    it('should not submit if validation fails', async () => {
      mockValidateForm.mockReturnValue(false);

      render(<AddShipModal open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(screen.getByText('Add Ship')).toBeInTheDocument();
      });

      const addButton = screen.getByText('Add Ship');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(mockValidateForm).toHaveBeenCalled();
      });

      expect(mockAddShip).not.toHaveBeenCalled();
      expect(mockOnOpenChange).not.toHaveBeenCalled();
    });

    it('should close dialog after successful submission', async () => {
      const mockShipParams: ShipParams = {
        type: 'LineShip',
        initial_position: { range: 5000, azimuth: 180 },
        speed: 10,
        angle: 90,
      };

      mockCreateShipParams.mockReturnValue(mockShipParams);

      render(<AddShipModal open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(screen.getByText('Add Ship')).toBeInTheDocument();
      });

      const addButton = screen.getByText('Add Ship');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('should handle submission errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockAddShip.mockRejectedValue(new Error('Network error'));

      const mockShipParams: ShipParams = {
        type: 'LineShip',
        initial_position: { range: 5000, azimuth: 180 },
        speed: 10,
        angle: 90,
      };

      mockCreateShipParams.mockReturnValue(mockShipParams);

      render(<AddShipModal open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(screen.getByText('Add Ship')).toBeInTheDocument();
      });

      const addButton = screen.getByText('Add Ship');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error adding ship:',
          expect.any(Error)
        );
      });

      expect(mockOnOpenChange).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should set isSubmitting during submission', async () => {
      const mockShipParams: ShipParams = {
        type: 'LineShip',
        initial_position: { range: 5000, azimuth: 180 },
        speed: 10,
        angle: 90,
      };

      mockCreateShipParams.mockReturnValue(mockShipParams);

      render(<AddShipModal open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(screen.getByText('Add Ship')).toBeInTheDocument();
      });

      const addButton = screen.getByText('Add Ship');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(mockSetIsSubmitting).toHaveBeenCalledWith(true);
      });

      await waitFor(() => {
        expect(mockSetIsSubmitting).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('Submitting state', () => {
    beforeEach(() => {
      vi.mocked(useShipFormModule.useShipForm).mockReturnValue({
        ...defaultShipFormReturn,
        isSubmitting: true,
      });
    });

    it('should show "Adding..." text when submitting', async () => {
      render(<AddShipModal open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(screen.getByText('Adding...')).toBeInTheDocument();
      });
    });

    it('should disable Add Ship button when submitting', async () => {
      render(<AddShipModal open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        const addButton = screen.getByText('Adding...');
        expect(addButton).toBeDisabled();
      });
    });

    it('should disable Cancel button when submitting', async () => {
      render(<AddShipModal open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        const cancelButton = screen.getByText('Cancel');
        expect(cancelButton).toBeDisabled();
      });
    });

    it('should disable ShipTypeSelect when submitting', async () => {
      render(<AddShipModal open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        const select = screen.getByRole('combobox');
        expect(select).toBeDisabled();
      });
    });
  });

  describe('Button behavior', () => {
    it('should call onOpenChange(false) when Cancel is clicked', async () => {
      render(<AddShipModal open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('should trigger handleAddShip when Add Ship is clicked', async () => {
      const mockShipParams: ShipParams = {
        type: 'LineShip',
        initial_position: { range: 5000, azimuth: 180 },
        speed: 10,
        angle: 90,
      };

      mockCreateShipParams.mockReturnValue(mockShipParams);

      render(<AddShipModal open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(screen.getByText('Add Ship')).toBeInTheDocument();
      });

      const addButton = screen.getByText('Add Ship');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(mockValidateForm).toHaveBeenCalled();
        expect(mockCreateShipParams).toHaveBeenCalled();
        expect(mockAddShip).toHaveBeenCalled();
      });
    });
  });

  describe('Child component integration', () => {
    it('should render ShipTypeSelect with correct props', async () => {
      render(<AddShipModal open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(screen.getByText('Ship Type')).toBeInTheDocument();
      });

      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('Linear Motion')).toBeInTheDocument();
    });

    it('should render InitialPositionInputs with correct props', async () => {
      render(<AddShipModal open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Range (m)')).toBeInTheDocument();
        expect(screen.getByLabelText('Azimuth (°)')).toBeInTheDocument();
      });
    });

    it('should render ShipSpecificInputs for LineShip', async () => {
      render(<AddShipModal open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Speed (m/s)')).toBeInTheDocument();
        expect(screen.getByLabelText('Angle (°)')).toBeInTheDocument();
      });
    });

    it('should render ShipSpecificInputs for CircleShip', async () => {
      vi.mocked(useShipFormModule.useShipForm).mockReturnValue({
        ...defaultShipFormReturn,
        shipType: 'CircleShip',
      });

      render(<AddShipModal open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Speed (m/s)')).toBeInTheDocument();
        expect(screen.getByLabelText('Radius (m)')).toBeInTheDocument();
      });
    });

    it('should render ShipSpecificInputs for RandomShip', async () => {
      vi.mocked(useShipFormModule.useShipForm).mockReturnValue({
        ...defaultShipFormReturn,
        shipType: 'RandomShip',
      });

      render(<AddShipModal open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(screen.getByLabelText('Max Speed (m/s)')).toBeInTheDocument();
      });
    });

    it('should not render ship-specific inputs for StationaryShip', async () => {
      vi.mocked(useShipFormModule.useShipForm).mockReturnValue({
        ...defaultShipFormReturn,
        shipType: 'StationaryShip',
      });

      render(<AddShipModal open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(screen.getByText('Add New Ship')).toBeInTheDocument();
      });

      expect(screen.queryByLabelText('Speed (m/s)')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Angle (°)')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Radius (m)')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Max Speed (m/s)')).not.toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('should display validation errors', async () => {
      vi.mocked(useShipFormModule.useShipForm).mockReturnValue({
        ...defaultShipFormReturn,
        errors: { range: 'Range must be within operational range' },
      });

      render(<AddShipModal open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(screen.getByText('Range must be within operational range')).toBeInTheDocument();
      });
    });

    it('should not clear errors on dialog close', async () => {
      vi.mocked(useShipFormModule.useShipForm).mockReturnValue({
        ...defaultShipFormReturn,
        errors: { azimuth: 'Invalid azimuth' },
      });

      render(<AddShipModal open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(screen.getByText('Invalid azimuth')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle missing radarInfo gracefully', async () => {
      vi.mocked(WebSocketContext.useWebSocket).mockReturnValue({
        addShip: mockAddShip,
        radarInfo: {
          operationalRange: 0,
          latitude: 0,
          longitude: 0,
          sweepAngle: 0,
          isSweeping: false,
          ships: [],
        },
        isConnected: false,
        tracks: [],
        resetSimulation: vi.fn(),
        updateMaxRange: vi.fn(),
        connectionAttempts: 0,
        maxConnectionAttempts: 3,
      });

      render(<AddShipModal open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(screen.getByText('Add New Ship')).toBeInTheDocument();
      });

      const rangeInput = screen.getByLabelText('Range (m)') as HTMLInputElement;
      expect(rangeInput.max).toBe('0');
    });

    it('should handle rapid open/close toggling', async () => {
      const { rerender } = render(<AddShipModal open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(screen.getByText('Add New Ship')).toBeInTheDocument();
      });

      rerender(<AddShipModal open={false} onOpenChange={mockOnOpenChange} />);
      expect(screen.queryByText('Add New Ship')).not.toBeInTheDocument();

      rerender(<AddShipModal open={true} onOpenChange={mockOnOpenChange} />);

      await waitFor(() => {
        expect(screen.getByText('Add New Ship')).toBeInTheDocument();
      });
    });
  });
});
