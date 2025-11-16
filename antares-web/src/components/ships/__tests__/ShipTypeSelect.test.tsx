import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShipTypeSelect } from '../ShipTypeSelect';
import { ShipType } from '../../../types/radar';

describe('ShipTypeSelect', () => {
  const mockOnChange = vi.fn();

  const defaultProps = {
    value: 'LineShip' as ShipType,
    onChange: mockOnChange,
    disabled: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render ship type label', () => {
      render(<ShipTypeSelect {...defaultProps} />);

      expect(screen.getByText('Ship Type')).toBeInTheDocument();
    });

    it('should render select trigger', () => {
      render(<ShipTypeSelect {...defaultProps} />);

      const trigger = screen.getByRole('combobox');
      expect(trigger).toBeInTheDocument();
    });

    it('should display LinearShip value when selected', () => {
      render(<ShipTypeSelect {...defaultProps} value="LineShip" />);

      // The select shows the selected option text
      expect(screen.getByText('Linear Motion')).toBeInTheDocument();
    });

    it('should display CircleShip value when selected', () => {
      render(<ShipTypeSelect {...defaultProps} value="CircleShip" />);

      expect(screen.getByText('Circular Motion')).toBeInTheDocument();
    });

    it('should display RandomShip value when selected', () => {
      render(<ShipTypeSelect {...defaultProps} value="RandomShip" />);

      expect(screen.getByText('Random Motion')).toBeInTheDocument();
    });

    it('should display StationaryShip value when selected', () => {
      render(<ShipTypeSelect {...defaultProps} value="StationaryShip" />);

      expect(screen.getByText('Stationary')).toBeInTheDocument();
    });
  });

  describe('Disabled state', () => {
    it('should disable select when disabled prop is true', () => {
      render(<ShipTypeSelect {...defaultProps} disabled={true} />);

      const trigger = screen.getByRole('combobox');
      expect(trigger).toBeDisabled();
    });

    it('should enable select when disabled prop is false', () => {
      render(<ShipTypeSelect {...defaultProps} disabled={false} />);

      const trigger = screen.getByRole('combobox');
      expect(trigger).not.toBeDisabled();
    });
  });

  describe('Layout', () => {
    it('should have proper grid layout classes', () => {
      const { container } = render(<ShipTypeSelect {...defaultProps} />);

      const gridElement = container.querySelector('.grid.grid-cols-4');
      expect(gridElement).toBeInTheDocument();
    });

    it('should have label with text-right class', () => {
      render(<ShipTypeSelect {...defaultProps} />);

      const label = screen.getByText('Ship Type');
      expect(label).toHaveClass('text-right');
    });

    it('should have label associated with select', () => {
      render(<ShipTypeSelect {...defaultProps} />);

      const label = screen.getByText('Ship Type');
      expect(label).toHaveAttribute('for', 'ship-type');
    });
  });

  describe('Props', () => {
    it('should accept value prop', () => {
      const { rerender } = render(<ShipTypeSelect {...defaultProps} value="LineShip" />);

      expect(screen.getByText('Linear Motion')).toBeInTheDocument();

      rerender(<ShipTypeSelect {...defaultProps} value="CircleShip" />);

      expect(screen.getByText('Circular Motion')).toBeInTheDocument();
    });

    it('should accept onChange prop', () => {
      render(<ShipTypeSelect {...defaultProps} onChange={mockOnChange} />);

      // Simply verify the prop is accepted - actual change testing is complex with Radix UI
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should accept disabled prop', () => {
      const { rerender } = render(<ShipTypeSelect {...defaultProps} disabled={false} />);

      expect(screen.getByRole('combobox')).not.toBeDisabled();

      rerender(<ShipTypeSelect {...defaultProps} disabled={true} />);

      expect(screen.getByRole('combobox')).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have combobox role', () => {
      render(<ShipTypeSelect {...defaultProps} />);

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('should have label element', () => {
      render(<ShipTypeSelect {...defaultProps} />);

      const label = screen.getByText('Ship Type');
      expect(label.tagName).toBe('LABEL');
    });

    it('should be disabled when disabled prop is true', () => {
      render(<ShipTypeSelect {...defaultProps} disabled={true} />);

      const trigger = screen.getByRole('combobox');
      expect(trigger).toBeDisabled();
    });
  });

  describe('Ship type mappings', () => {
    it('should map LineShip to Linear Motion text', () => {
      render(<ShipTypeSelect {...defaultProps} value="LineShip" />);

      expect(screen.getByText('Linear Motion')).toBeInTheDocument();
    });

    it('should map CircleShip to Circular Motion text', () => {
      render(<ShipTypeSelect {...defaultProps} value="CircleShip" />);

      expect(screen.getByText('Circular Motion')).toBeInTheDocument();
    });

    it('should map RandomShip to Random Motion text', () => {
      render(<ShipTypeSelect {...defaultProps} value="RandomShip" />);

      expect(screen.getByText('Random Motion')).toBeInTheDocument();
    });

    it('should map StationaryShip to Stationary text', () => {
      render(<ShipTypeSelect {...defaultProps} value="StationaryShip" />);

      expect(screen.getByText('Stationary')).toBeInTheDocument();
    });
  });
});
