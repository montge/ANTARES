import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShipSpecificInputs } from '../ShipSpecificInputs';
import { ShipType } from '../../../types/radar';

describe('ShipSpecificInputs', () => {
  const mockOnSpeedChange = vi.fn();
  const mockOnAngleChange = vi.fn();
  const mockOnRadiusChange = vi.fn();
  const mockOnMaxSpeedChange = vi.fn();

  const defaultProps = {
    speed: 10,
    angle: 90,
    radius: 2000,
    maxSpeed: 15,
    onSpeedChange: mockOnSpeedChange,
    onAngleChange: mockOnAngleChange,
    onRadiusChange: mockOnRadiusChange,
    onMaxSpeedChange: mockOnMaxSpeedChange,
    errors: {},
    disabled: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('StationaryShip', () => {
    it('should render nothing for StationaryShip', () => {
      const { container } = render(
        <ShipSpecificInputs shipType="StationaryShip" {...defaultProps} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should not render any input fields for StationaryShip', () => {
      render(<ShipSpecificInputs shipType="StationaryShip" {...defaultProps} />);

      expect(screen.queryByLabelText(/Speed/)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Angle/)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Radius/)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/Max Speed/)).not.toBeInTheDocument();
    });
  });

  describe('LineShip', () => {
    const shipType: ShipType = 'LineShip';

    it('should render speed input for LineShip', () => {
      render(<ShipSpecificInputs shipType={shipType} {...defaultProps} />);

      expect(screen.getByLabelText('Speed (m/s)')).toBeInTheDocument();
    });

    it('should render angle input for LineShip', () => {
      render(<ShipSpecificInputs shipType={shipType} {...defaultProps} />);

      expect(screen.getByLabelText('Angle (°)')).toBeInTheDocument();
    });

    it('should not render radius input for LineShip', () => {
      render(<ShipSpecificInputs shipType={shipType} {...defaultProps} />);

      expect(screen.queryByLabelText(/Radius/)).not.toBeInTheDocument();
    });

    it('should not render max speed input for LineShip', () => {
      render(<ShipSpecificInputs shipType={shipType} {...defaultProps} />);

      expect(screen.queryByLabelText(/Max Speed/)).not.toBeInTheDocument();
    });

    it('should display current speed value', () => {
      render(<ShipSpecificInputs shipType={shipType} {...defaultProps} speed={12} />);

      const speedInput = screen.getByLabelText('Speed (m/s)') as HTMLInputElement;
      expect(speedInput.value).toBe('12');
    });

    it('should display current angle value', () => {
      render(<ShipSpecificInputs shipType={shipType} {...defaultProps} angle={45} />);

      const angleInput = screen.getByLabelText('Angle (°)') as HTMLInputElement;
      expect(angleInput.value).toBe('45');
    });

    it('should call onSpeedChange when speed input changes', () => {
      render(<ShipSpecificInputs shipType={shipType} {...defaultProps} />);

      const speedInput = screen.getByLabelText('Speed (m/s)');
      fireEvent.change(speedInput, { target: { value: '20' } });

      expect(mockOnSpeedChange).toHaveBeenCalledWith(20);
    });

    it('should call onAngleChange when angle input changes', () => {
      render(<ShipSpecificInputs shipType={shipType} {...defaultProps} />);

      const angleInput = screen.getByLabelText('Angle (°)');
      fireEvent.change(angleInput, { target: { value: '180' } });

      expect(mockOnAngleChange).toHaveBeenCalledWith(180);
    });

    it('should display speed error message', () => {
      render(
        <ShipSpecificInputs
          shipType={shipType}
          {...defaultProps}
          errors={{ speed: 'Speed must be positive' }}
        />
      );

      expect(screen.getByText('Speed must be positive')).toBeInTheDocument();
    });

    it('should display angle error message', () => {
      render(
        <ShipSpecificInputs
          shipType={shipType}
          {...defaultProps}
          errors={{ angle: 'Invalid angle' }}
        />
      );

      expect(screen.getByText('Invalid angle')).toBeInTheDocument();
    });

    it('should disable inputs when disabled prop is true', () => {
      render(<ShipSpecificInputs shipType={shipType} {...defaultProps} disabled={true} />);

      expect(screen.getByLabelText('Speed (m/s)')).toBeDisabled();
      expect(screen.getByLabelText('Angle (°)')).toBeDisabled();
    });
  });

  describe('CircleShip', () => {
    const shipType: ShipType = 'CircleShip';

    it('should render speed input for CircleShip', () => {
      render(<ShipSpecificInputs shipType={shipType} {...defaultProps} />);

      expect(screen.getByLabelText('Speed (m/s)')).toBeInTheDocument();
    });

    it('should render radius input for CircleShip', () => {
      render(<ShipSpecificInputs shipType={shipType} {...defaultProps} />);

      expect(screen.getByLabelText('Radius (m)')).toBeInTheDocument();
    });

    it('should not render angle input for CircleShip', () => {
      render(<ShipSpecificInputs shipType={shipType} {...defaultProps} />);

      expect(screen.queryByLabelText('Angle (°)')).not.toBeInTheDocument();
    });

    it('should not render max speed input for CircleShip', () => {
      render(<ShipSpecificInputs shipType={shipType} {...defaultProps} />);

      expect(screen.queryByLabelText(/Max Speed/)).not.toBeInTheDocument();
    });

    it('should display current radius value', () => {
      render(<ShipSpecificInputs shipType={shipType} {...defaultProps} radius={3000} />);

      const radiusInput = screen.getByLabelText('Radius (m)') as HTMLInputElement;
      expect(radiusInput.value).toBe('3000');
    });

    it('should call onRadiusChange when radius input changes', () => {
      render(<ShipSpecificInputs shipType={shipType} {...defaultProps} />);

      const radiusInput = screen.getByLabelText('Radius (m)');
      fireEvent.change(radiusInput, { target: { value: '5000' } });

      expect(mockOnRadiusChange).toHaveBeenCalledWith(5000);
    });

    it('should display radius error message', () => {
      render(
        <ShipSpecificInputs
          shipType={shipType}
          {...defaultProps}
          errors={{ radius: 'Radius too small' }}
        />
      );

      expect(screen.getByText('Radius too small')).toBeInTheDocument();
    });

    it('should have minimum value of 100 for radius', () => {
      render(<ShipSpecificInputs shipType={shipType} {...defaultProps} />);

      const radiusInput = screen.getByLabelText('Radius (m)') as HTMLInputElement;
      expect(radiusInput.min).toBe('100');
    });

    it('should disable inputs when disabled prop is true', () => {
      render(<ShipSpecificInputs shipType={shipType} {...defaultProps} disabled={true} />);

      expect(screen.getByLabelText('Speed (m/s)')).toBeDisabled();
      expect(screen.getByLabelText('Radius (m)')).toBeDisabled();
    });
  });

  describe('RandomShip', () => {
    const shipType: ShipType = 'RandomShip';

    it('should render max speed input for RandomShip', () => {
      render(<ShipSpecificInputs shipType={shipType} {...defaultProps} />);

      expect(screen.getByLabelText('Max Speed (m/s)')).toBeInTheDocument();
    });

    it('should not render speed input for RandomShip', () => {
      render(<ShipSpecificInputs shipType={shipType} {...defaultProps} />);

      expect(screen.queryByLabelText('Speed (m/s)')).not.toBeInTheDocument();
    });

    it('should not render angle input for RandomShip', () => {
      render(<ShipSpecificInputs shipType={shipType} {...defaultProps} />);

      expect(screen.queryByLabelText('Angle (°)')).not.toBeInTheDocument();
    });

    it('should not render radius input for RandomShip', () => {
      render(<ShipSpecificInputs shipType={shipType} {...defaultProps} />);

      expect(screen.queryByLabelText('Radius (m)')).not.toBeInTheDocument();
    });

    it('should display current max speed value', () => {
      render(<ShipSpecificInputs shipType={shipType} {...defaultProps} maxSpeed={25} />);

      const maxSpeedInput = screen.getByLabelText('Max Speed (m/s)') as HTMLInputElement;
      expect(maxSpeedInput.value).toBe('25');
    });

    it('should call onMaxSpeedChange when max speed input changes', () => {
      render(<ShipSpecificInputs shipType={shipType} {...defaultProps} />);

      const maxSpeedInput = screen.getByLabelText('Max Speed (m/s)');
      fireEvent.change(maxSpeedInput, { target: { value: '30' } });

      expect(mockOnMaxSpeedChange).toHaveBeenCalledWith(30);
    });

    it('should display max speed error message', () => {
      render(
        <ShipSpecificInputs
          shipType={shipType}
          {...defaultProps}
          errors={{ maxSpeed: 'Max speed required' }}
        />
      );

      expect(screen.getByText('Max speed required')).toBeInTheDocument();
    });

    it('should disable input when disabled prop is true', () => {
      render(<ShipSpecificInputs shipType={shipType} {...defaultProps} disabled={true} />);

      expect(screen.getByLabelText('Max Speed (m/s)')).toBeDisabled();
    });
  });

  describe('Error styling', () => {
    it('should apply error styling to speed label when speed has error', () => {
      render(
        <ShipSpecificInputs
          shipType="LineShip"
          {...defaultProps}
          errors={{ speed: 'Error' }}
        />
      );

      const label = screen.getByText('Speed (m/s)');
      expect(label).toHaveClass('text-red-500');
    });

    it('should apply error styling to angle label when angle has error', () => {
      render(
        <ShipSpecificInputs
          shipType="LineShip"
          {...defaultProps}
          errors={{ angle: 'Error' }}
        />
      );

      const label = screen.getByText('Angle (°)');
      expect(label).toHaveClass('text-red-500');
    });

    it('should apply error styling to radius label when radius has error', () => {
      render(
        <ShipSpecificInputs
          shipType="CircleShip"
          {...defaultProps}
          errors={{ radius: 'Error' }}
        />
      );

      const label = screen.getByText('Radius (m)');
      expect(label).toHaveClass('text-red-500');
    });

    it('should apply error styling to max speed label when maxSpeed has error', () => {
      render(
        <ShipSpecificInputs
          shipType="RandomShip"
          {...defaultProps}
          errors={{ maxSpeed: 'Error' }}
        />
      );

      const label = screen.getByText('Max Speed (m/s)');
      expect(label).toHaveClass('text-red-500');
    });
  });

  describe('Input constraints', () => {
    it('should have min value of 0 for speed', () => {
      render(<ShipSpecificInputs shipType="LineShip" {...defaultProps} />);

      const speedInput = screen.getByLabelText('Speed (m/s)') as HTMLInputElement;
      expect(speedInput.min).toBe('0');
    });

    it('should have min and max values for angle', () => {
      render(<ShipSpecificInputs shipType="LineShip" {...defaultProps} />);

      const angleInput = screen.getByLabelText('Angle (°)') as HTMLInputElement;
      expect(angleInput.min).toBe('0');
      expect(angleInput.max).toBe('360');
    });

    it('should have min value of 0 for max speed', () => {
      render(<ShipSpecificInputs shipType="RandomShip" {...defaultProps} />);

      const maxSpeedInput = screen.getByLabelText('Max Speed (m/s)') as HTMLInputElement;
      expect(maxSpeedInput.min).toBe('0');
    });
  });
});
