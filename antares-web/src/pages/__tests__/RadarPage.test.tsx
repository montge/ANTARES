import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import RadarPage from '../RadarPage';
import * as ConfigContext from '../../contexts/ConfigContext';
import * as WebSocketContext from '../../contexts/WebSocketContext';

vi.mock('../../contexts/ConfigContext', async () => {
  const actual = await vi.importActual('../../contexts/ConfigContext');
  return {
    ...actual,
    ConfigProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    useConfig: vi.fn(),
  };
});

vi.mock('../../contexts/WebSocketContext', async () => {
  const actual = await vi.importActual('../../contexts/WebSocketContext');
  return {
    ...actual,
    WebSocketProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    useWebSocket: vi.fn(),
  };
});

describe('RadarPage', () => {
  const mockRadarInfo = {
    operationalRange: 10000,
    coordinates: {
      latitude: 45.5,
      longitude: -122.6,
    },
    heading: 0,
    ownSpeed: 0,
    sweepAngle: 0,
    isSweeping: true,
    ships: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(ConfigContext.useConfig).mockReturnValue({
      connectionSettings: {
        host: 'localhost',
        controllerPort: 17394,
        radarPort: 17396,
      },
      updateConnectionSettings: vi.fn(),
      controllerUrl: 'http://localhost:17394',
      radarUrl: 'ws://localhost:17396',
    });

    vi.mocked(WebSocketContext.useWebSocket).mockReturnValue({
      tracks: [],
      isConnected: true,
      isLoading: false,
      hasError: false,
      connectionAttempts: 1,
      maxConnectionAttempts: 3,
      addShip: vi.fn(),
      resetSimulation: vi.fn(),
      sweepAngle: 0,
      radarInfo: mockRadarInfo,
      updateMaxRange: vi.fn(),
    });
  });

  describe('Rendering', () => {
    it('should render page header', async () => {
      render(<RadarPage />);

      await waitFor(() => {
        expect(screen.getByText('ANTARES Radar System')).toBeInTheDocument();
      });
    });

    it('should render footer', async () => {
      render(<RadarPage />);

      await waitFor(() => {
        expect(screen.getByText(/ANTARES.*TheSoftwareDesignLab @ Uniandes.*ICMT 2025/)).toBeInTheDocument();
      });
    });

    it('should render main content area', async () => {
      render(<RadarPage />);

      await waitFor(() => {
        expect(screen.getByText('ANTARES Radar System')).toBeInTheDocument();
      });

      const main = document.querySelector('main');
      expect(main).toBeInTheDocument();
    });
  });

  describe('Layout', () => {
    it('should render responsive grid layout', async () => {
      render(<RadarPage />);

      await waitFor(() => {
        expect(screen.getByText('ANTARES Radar System')).toBeInTheDocument();
      });

      const main = document.querySelector('main');
      expect(main).toBeInTheDocument();
      expect(main?.classList.contains('max-w-6xl')).toBe(true);
      expect(main?.classList.contains('mx-auto')).toBe(true);
    });

    it('should use radar theme classes', async () => {
      render(<RadarPage />);

      await waitFor(() => {
        expect(screen.getByText('ANTARES Radar System')).toBeInTheDocument();
      });

      const container = document.querySelector('.bg-radar-background');
      expect(container).toBeInTheDocument();
    });

    it('should have min-height screen', async () => {
      render(<RadarPage />);

      await waitFor(() => {
        expect(screen.getByText('ANTARES Radar System')).toBeInTheDocument();
      });

      const minHeightDiv = document.querySelector('.min-h-screen');
      expect(minHeightDiv).toBeInTheDocument();
    });
  });

  describe('Components integration', () => {
    it('should render header with title', async () => {
      render(<RadarPage />);

      await waitFor(() => {
        const header = document.querySelector('header');
        expect(header).toBeInTheDocument();
      });
    });

    it('should render footer with branding', async () => {
      render(<RadarPage />);

      await waitFor(() => {
        const footer = document.querySelector('footer');
        expect(footer).toBeInTheDocument();
      });
    });
  });

  describe('Typography', () => {
    it('should use uppercase text for title', async () => {
      render(<RadarPage />);

      await waitFor(() => {
        const title = screen.getByText('ANTARES Radar System');
        expect(title.classList.contains('uppercase')).toBe(true);
      });
    });

    it('should use radar-target color for title', async () => {
      render(<RadarPage />);

      await waitFor(() => {
        const title = screen.getByText('ANTARES Radar System');
        expect(title.classList.contains('text-radar-target')).toBe(true);
      });
    });

    it('should use bold font for title', async () => {
      render(<RadarPage />);

      await waitFor(() => {
        const title = screen.getByText('ANTARES Radar System');
        expect(title.classList.contains('font-bold')).toBe(true);
      });
    });
  });
});
