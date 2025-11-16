import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrackInfo } from '../TrackInfo';
import { Track } from '../../types/radar';

describe('TrackInfo', () => {
  const baseTrack: Track = {
    id: 'T001',
    range: 5000, // 5000 meters = 5 km
    azimuth: 45.5,
    velocity: {
      speed: 10.5,
      heading: 90.2,
    },
    timestamp: Date.now(),
  };

  describe('Basic rendering', () => {
    it('should render track ID', () => {
      render(<TrackInfo track={baseTrack} />);

      expect(screen.getByText('ID:')).toBeInTheDocument();
      expect(screen.getByText('T001')).toBeInTheDocument();
    });

    it('should render track range in kilometers', () => {
      render(<TrackInfo track={baseTrack} />);

      expect(screen.getByText('Range:')).toBeInTheDocument();
      expect(screen.getByText('5.0km')).toBeInTheDocument();
    });

    it('should render track azimuth in degrees', () => {
      render(<TrackInfo track={baseTrack} />);

      expect(screen.getByText('Azimuth:')).toBeInTheDocument();
      expect(screen.getByText('45.5°')).toBeInTheDocument();
    });

    it('should render Track Info title', () => {
      render(<TrackInfo track={baseTrack} />);

      expect(screen.getByText('Track Info')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<TrackInfo track={baseTrack} className="custom-class" />);

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });

  describe('Velocity rendering', () => {
    it('should render velocity speed when present', () => {
      render(<TrackInfo track={baseTrack} />);

      expect(screen.getByText('Speed:')).toBeInTheDocument();
      expect(screen.getByText('10.5 m/s')).toBeInTheDocument();
    });

    it('should render velocity heading when present', () => {
      render(<TrackInfo track={baseTrack} />);

      expect(screen.getByText('Heading:')).toBeInTheDocument();
      expect(screen.getByText('90.2°')).toBeInTheDocument();
    });

    it('should not render velocity fields when velocity is undefined', () => {
      const trackWithoutVelocity: Track = {
        ...baseTrack,
        velocity: undefined,
      };

      render(<TrackInfo track={trackWithoutVelocity} />);

      expect(screen.queryByText('Speed:')).not.toBeInTheDocument();
      expect(screen.queryByText('Heading:')).not.toBeInTheDocument();
    });

    it('should render zero velocity correctly', () => {
      const trackWithZeroVelocity: Track = {
        ...baseTrack,
        velocity: {
          speed: 0,
          heading: 0,
        },
      };

      render(<TrackInfo track={trackWithZeroVelocity} />);

      expect(screen.getByText('0.0 m/s')).toBeInTheDocument();
      expect(screen.getByText('0.0°')).toBeInTheDocument();
    });
  });

  describe('Optional fields', () => {
    it('should render type when present', () => {
      const trackWithType: Track = {
        ...baseTrack,
        type: 'TARGET',
      };

      render(<TrackInfo track={trackWithType} />);

      expect(screen.getByText('Type:')).toBeInTheDocument();
      expect(screen.getByText('TARGET')).toBeInTheDocument();
    });

    it('should not render type field when type is undefined', () => {
      render(<TrackInfo track={baseTrack} />);

      expect(screen.queryByText('Type:')).not.toBeInTheDocument();
    });

    it('should render name when present', () => {
      const trackWithName: Track = {
        ...baseTrack,
        name: 'Ship Alpha',
      };

      render(<TrackInfo track={trackWithName} />);

      expect(screen.getByText('Name:')).toBeInTheDocument();
      expect(screen.getByText('Ship Alpha')).toBeInTheDocument();
    });

    it('should not render name field when name is undefined', () => {
      render(<TrackInfo track={baseTrack} />);

      expect(screen.queryByText('Name:')).not.toBeInTheDocument();
    });

    it('should render all optional fields when present', () => {
      const fullTrack: Track = {
        ...baseTrack,
        type: 'ATON',
        name: 'Lighthouse-1',
      };

      render(<TrackInfo track={fullTrack} />);

      expect(screen.getByText('ATON')).toBeInTheDocument();
      expect(screen.getByText('Lighthouse-1')).toBeInTheDocument();
    });
  });

  describe('Number formatting', () => {
    it('should format range with 1 decimal place', () => {
      const track: Track = {
        ...baseTrack,
        range: 5432.1, // 5.4321 km
      };

      render(<TrackInfo track={track} />);

      expect(screen.getByText('5.4km')).toBeInTheDocument();
    });

    it('should format azimuth with 1 decimal place', () => {
      const track: Track = {
        ...baseTrack,
        azimuth: 123.456,
      };

      render(<TrackInfo track={track} />);

      expect(screen.getByText('123.5°')).toBeInTheDocument();
    });

    it('should format speed with 1 decimal place', () => {
      const track: Track = {
        ...baseTrack,
        velocity: {
          speed: 15.789,
          heading: 90,
        },
      };

      render(<TrackInfo track={track} />);

      expect(screen.getByText('15.8 m/s')).toBeInTheDocument();
    });

    it('should format heading with 1 decimal place', () => {
      const track: Track = {
        ...baseTrack,
        velocity: {
          speed: 10,
          heading: 359.999,
        },
      };

      render(<TrackInfo track={track} />);

      expect(screen.getByText('360.0°')).toBeInTheDocument();
    });

    it('should round values correctly', () => {
      const track: Track = {
        ...baseTrack,
        range: 5555.55, // Should round to 5.6 km
        azimuth: 45.56, // Should round to 45.6°
      };

      render(<TrackInfo track={track} />);

      expect(screen.getByText('5.6km')).toBeInTheDocument();
      expect(screen.getByText('45.6°')).toBeInTheDocument();
    });
  });

  describe('Edge cases', () => {
    it('should handle very small range values', () => {
      const track: Track = {
        ...baseTrack,
        range: 10, // 0.01 km
      };

      render(<TrackInfo track={track} />);

      expect(screen.getByText('0.0km')).toBeInTheDocument();
    });

    it('should handle very large range values', () => {
      const track: Track = {
        ...baseTrack,
        range: 999999, // 999.999 km
      };

      render(<TrackInfo track={track} />);

      expect(screen.getByText('1000.0km')).toBeInTheDocument();
    });

    it('should handle zero range', () => {
      const track: Track = {
        ...baseTrack,
        range: 0,
      };

      render(<TrackInfo track={track} />);

      expect(screen.getByText('0.0km')).toBeInTheDocument();
    });

    it('should handle zero azimuth', () => {
      const track: Track = {
        ...baseTrack,
        azimuth: 0,
      };

      render(<TrackInfo track={track} />);

      expect(screen.getByText('0.0°')).toBeInTheDocument();
    });

    it('should handle 360 degree azimuth', () => {
      const track: Track = {
        ...baseTrack,
        azimuth: 360,
      };

      render(<TrackInfo track={track} />);

      expect(screen.getByText('360.0°')).toBeInTheDocument();
    });

    it('should handle negative velocity heading', () => {
      const track: Track = {
        ...baseTrack,
        velocity: {
          speed: 10,
          heading: -45.5,
        },
      };

      render(<TrackInfo track={track} />);

      expect(screen.getByText('-45.5°')).toBeInTheDocument();
    });

    it('should handle very high speed values', () => {
      const track: Track = {
        ...baseTrack,
        velocity: {
          speed: 999.9,
          heading: 180,
        },
      };

      render(<TrackInfo track={track} />);

      expect(screen.getByText('999.9 m/s')).toBeInTheDocument();
    });

    it('should handle empty string track ID', () => {
      const track: Track = {
        ...baseTrack,
        id: '',
      };

      render(<TrackInfo track={track} />);

      expect(screen.getByText('ID:')).toBeInTheDocument();
    });

    it('should handle special characters in track ID', () => {
      const track: Track = {
        ...baseTrack,
        id: 'T-001_#A',
      };

      render(<TrackInfo track={track} />);

      expect(screen.getByText('T-001_#A')).toBeInTheDocument();
    });

    it('should handle special characters in name', () => {
      const track: Track = {
        ...baseTrack,
        name: 'Ship-#1_Test (Alpha)',
      };

      render(<TrackInfo track={track} />);

      expect(screen.getByText('Ship-#1_Test (Alpha)')).toBeInTheDocument();
    });

    it('should handle long track names', () => {
      const track: Track = {
        ...baseTrack,
        name: 'This is a very long ship name that might overflow',
      };

      render(<TrackInfo track={track} />);

      expect(screen.getByText('This is a very long ship name that might overflow')).toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('should render all labels in correct structure', () => {
      const fullTrack: Track = {
        ...baseTrack,
        type: 'TARGET',
        name: 'Test Ship',
      };

      render(<TrackInfo track={fullTrack} />);

      // Check all labels are present
      expect(screen.getByText('ID:')).toBeInTheDocument();
      expect(screen.getByText('Range:')).toBeInTheDocument();
      expect(screen.getByText('Azimuth:')).toBeInTheDocument();
      expect(screen.getByText('Speed:')).toBeInTheDocument();
      expect(screen.getByText('Heading:')).toBeInTheDocument();
      expect(screen.getByText('Type:')).toBeInTheDocument();
      expect(screen.getByText('Name:')).toBeInTheDocument();
    });

    it('should maintain correct field order', () => {
      const fullTrack: Track = {
        ...baseTrack,
        type: 'TARGET',
        name: 'Test Ship',
      };

      const { container } = render(<TrackInfo track={fullTrack} />);
      const flexDivs = container.querySelectorAll('.flex.justify-between');

      // Verify order: ID, Range, Azimuth, Speed, Heading, Type, Name
      expect(flexDivs[0]).toHaveTextContent('ID:');
      expect(flexDivs[1]).toHaveTextContent('Range:');
      expect(flexDivs[2]).toHaveTextContent('Azimuth:');
      expect(flexDivs[3]).toHaveTextContent('Speed:');
      expect(flexDivs[4]).toHaveTextContent('Heading:');
      expect(flexDivs[5]).toHaveTextContent('Type:');
      expect(flexDivs[6]).toHaveTextContent('Name:');
    });
  });
});
