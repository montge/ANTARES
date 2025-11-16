import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InitialPositionInputs } from '../InitialPositionInputs';

describe('InitialPositionInputs', () => {
  const mockOnRangeChange = vi.fn();
  const mockOnAzimuthChange = vi.fn();

  const defaultProps = {
    range: 5000,
    azimuth: 180,
    onRangeChange: mockOnRangeChange,
    onAzimuthChange: mockOnAzimuthChange,
    errors: {},
    disabled: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Range input', () => {
    it('should render range label', () => {
      render(<InitialPositionInputs {...defaultProps} />);

      expect(screen.getByText('Range (m)')).toBeInTheDocument();
    });

    it('should render range input', () => {
      render(<InitialPositionInputs {...defaultProps} />);

      expect(screen.getByLabelText('Range (m)')).toBeInTheDocument();
    });

    it('should display current range value', () => {
      render(<InitialPositionInputs {...defaultProps} range={7500} />);

      const rangeInput = screen.getByLabelText('Range (m)') as HTMLInputElement;
      expect(rangeInput.value).toBe('7500');
    });

    it('should call onRangeChange when range input changes', () => {
      render(<InitialPositionInputs {...defaultProps} />);

      const rangeInput = screen.getByLabelText('Range (m)');
      fireEvent.change(rangeInput, { target: { value: '10000' } });

      expect(mockOnRangeChange).toHaveBeenCalledWith(10000);
    });

    it('should have number type for range input', () => {
      render(<InitialPositionInputs {...defaultProps} />);

      const rangeInput = screen.getByLabelText('Range (m)') as HTMLInputElement;
      expect(rangeInput.type).toBe('number');
    });

    it('should have min value of 0 for range', () => {
      render(<InitialPositionInputs {...defaultProps} />);

      const rangeInput = screen.getByLabelText('Range (m)') as HTMLInputElement;
      expect(rangeInput.min).toBe('0');
    });

    it('should have default max value of 10000 for range', () => {
      render(<InitialPositionInputs {...defaultProps} />);

      const rangeInput = screen.getByLabelText('Range (m)') as HTMLInputElement;
      expect(rangeInput.max).toBe('10000');
    });

    it('should use custom maxRange when provided', () => {
      render(<InitialPositionInputs {...defaultProps} maxRange={20000} />);

      const rangeInput = screen.getByLabelText('Range (m)') as HTMLInputElement;
      expect(rangeInput.max).toBe('20000');
    });

    it('should display range error message', () => {
      render(
        <InitialPositionInputs
          {...defaultProps}
          errors={{ range: 'Range must be positive' }}
        />
      );

      expect(screen.getByText('Range must be positive')).toBeInTheDocument();
    });

    it('should apply error styling to range label when error exists', () => {
      render(
        <InitialPositionInputs
          {...defaultProps}
          errors={{ range: 'Error' }}
        />
      );

      const label = screen.getByText('Range (m)');
      expect(label).toHaveClass('text-red-500');
    });

    it('should apply error styling to range input when error exists', () => {
      render(
        <InitialPositionInputs
          {...defaultProps}
          errors={{ range: 'Error' }}
        />
      );

      const input = screen.getByLabelText('Range (m)');
      expect(input).toHaveClass('border-red-500');
    });

    it('should disable range input when disabled prop is true', () => {
      render(<InitialPositionInputs {...defaultProps} disabled={true} />);

      expect(screen.getByLabelText('Range (m)')).toBeDisabled();
    });
  });

  describe('Azimuth input', () => {
    it('should render azimuth label', () => {
      render(<InitialPositionInputs {...defaultProps} />);

      expect(screen.getByText('Azimuth (°)')).toBeInTheDocument();
    });

    it('should render azimuth input', () => {
      render(<InitialPositionInputs {...defaultProps} />);

      expect(screen.getByLabelText('Azimuth (°)')).toBeInTheDocument();
    });

    it('should display current azimuth value', () => {
      render(<InitialPositionInputs {...defaultProps} azimuth={90} />);

      const azimuthInput = screen.getByLabelText('Azimuth (°)') as HTMLInputElement;
      expect(azimuthInput.value).toBe('90');
    });

    it('should call onAzimuthChange when azimuth input changes', () => {
      render(<InitialPositionInputs {...defaultProps} />);

      const azimuthInput = screen.getByLabelText('Azimuth (°)');
      fireEvent.change(azimuthInput, { target: { value: '270' } });

      expect(mockOnAzimuthChange).toHaveBeenCalledWith(270);
    });

    it('should have number type for azimuth input', () => {
      render(<InitialPositionInputs {...defaultProps} />);

      const azimuthInput = screen.getByLabelText('Azimuth (°)') as HTMLInputElement;
      expect(azimuthInput.type).toBe('number');
    });

    it('should have min value of 0 for azimuth', () => {
      render(<InitialPositionInputs {...defaultProps} />);

      const azimuthInput = screen.getByLabelText('Azimuth (°)') as HTMLInputElement;
      expect(azimuthInput.min).toBe('0');
    });

    it('should have max value of 360 for azimuth', () => {
      render(<InitialPositionInputs {...defaultProps} />);

      const azimuthInput = screen.getByLabelText('Azimuth (°)') as HTMLInputElement;
      expect(azimuthInput.max).toBe('360');
    });

    it('should display azimuth error message', () => {
      render(
        <InitialPositionInputs
          {...defaultProps}
          errors={{ azimuth: 'Azimuth must be between 0 and 360' }}
        />
      );

      expect(screen.getByText('Azimuth must be between 0 and 360')).toBeInTheDocument();
    });

    it('should apply error styling to azimuth label when error exists', () => {
      render(
        <InitialPositionInputs
          {...defaultProps}
          errors={{ azimuth: 'Error' }}
        />
      );

      const label = screen.getByText('Azimuth (°)');
      expect(label).toHaveClass('text-red-500');
    });

    it('should apply error styling to azimuth input when error exists', () => {
      render(
        <InitialPositionInputs
          {...defaultProps}
          errors={{ azimuth: 'Error' }}
        />
      );

      const input = screen.getByLabelText('Azimuth (°)');
      expect(input).toHaveClass('border-red-500');
    });

    it('should disable azimuth input when disabled prop is true', () => {
      render(<InitialPositionInputs {...defaultProps} disabled={true} />);

      expect(screen.getByLabelText('Azimuth (°)')).toBeDisabled();
    });
  });

  describe('Both inputs', () => {
    it('should render both range and azimuth inputs', () => {
      render(<InitialPositionInputs {...defaultProps} />);

      expect(screen.getByLabelText('Range (m)')).toBeInTheDocument();
      expect(screen.getByLabelText('Azimuth (°)')).toBeInTheDocument();
    });

    it('should display multiple error messages simultaneously', () => {
      render(
        <InitialPositionInputs
          {...defaultProps}
          errors={{
            range: 'Range error',
            azimuth: 'Azimuth error',
          }}
        />
      );

      expect(screen.getByText('Range error')).toBeInTheDocument();
      expect(screen.getByText('Azimuth error')).toBeInTheDocument();
    });

    it('should disable all inputs when disabled prop is true', () => {
      render(<InitialPositionInputs {...defaultProps} disabled={true} />);

      expect(screen.getByLabelText('Range (m)')).toBeDisabled();
      expect(screen.getByLabelText('Azimuth (°)')).toBeDisabled();
    });

    it('should enable all inputs when disabled prop is false', () => {
      render(<InitialPositionInputs {...defaultProps} disabled={false} />);

      expect(screen.getByLabelText('Range (m)')).not.toBeDisabled();
      expect(screen.getByLabelText('Azimuth (°)')).not.toBeDisabled();
    });
  });

  describe('Edge cases', () => {
    it('should handle zero values', () => {
      render(<InitialPositionInputs {...defaultProps} range={0} azimuth={0} />);

      const rangeInput = screen.getByLabelText('Range (m)') as HTMLInputElement;
      const azimuthInput = screen.getByLabelText('Azimuth (°)') as HTMLInputElement;

      expect(rangeInput.value).toBe('0');
      expect(azimuthInput.value).toBe('0');
    });

    it('should handle maximum azimuth value', () => {
      render(<InitialPositionInputs {...defaultProps} azimuth={360} />);

      const azimuthInput = screen.getByLabelText('Azimuth (°)') as HTMLInputElement;
      expect(azimuthInput.value).toBe('360');
    });

    it('should handle decimal values', () => {
      render(<InitialPositionInputs {...defaultProps} range={5500.5} azimuth={45.7} />);

      const rangeInput = screen.getByLabelText('Range (m)') as HTMLInputElement;
      const azimuthInput = screen.getByLabelText('Azimuth (°)') as HTMLInputElement;

      expect(rangeInput.value).toBe('5500.5');
      expect(azimuthInput.value).toBe('45.7');
    });

    it('should handle very large range values', () => {
      render(<InitialPositionInputs {...defaultProps} range={999999} maxRange={1000000} />);

      const rangeInput = screen.getByLabelText('Range (m)') as HTMLInputElement;
      expect(rangeInput.value).toBe('999999');
    });

    it('should call handlers with parsed number values', () => {
      render(<InitialPositionInputs {...defaultProps} />);

      const rangeInput = screen.getByLabelText('Range (m)');
      const azimuthInput = screen.getByLabelText('Azimuth (°)');

      fireEvent.change(rangeInput, { target: { value: '8500' } });
      fireEvent.change(azimuthInput, { target: { value: '120' } });

      expect(mockOnRangeChange).toHaveBeenCalledWith(8500);
      expect(mockOnAzimuthChange).toHaveBeenCalledWith(120);
      expect(typeof mockOnRangeChange.mock.calls[0][0]).toBe('number');
      expect(typeof mockOnAzimuthChange.mock.calls[0][0]).toBe('number');
    });
  });

  describe('Layout', () => {
    it('should have proper grid layout classes', () => {
      const { container } = render(<InitialPositionInputs {...defaultProps} />);

      const gridElements = container.querySelectorAll('.grid.grid-cols-4');
      expect(gridElements.length).toBeGreaterThan(0);
    });

    it('should render labels with text-right class', () => {
      render(<InitialPositionInputs {...defaultProps} />);

      const rangeLabel = screen.getByText('Range (m)');
      const azimuthLabel = screen.getByText('Azimuth (°)');

      expect(rangeLabel).toHaveClass('text-right');
      expect(azimuthLabel).toHaveClass('text-right');
    });
  });
});
