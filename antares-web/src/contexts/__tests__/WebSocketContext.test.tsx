import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { WebSocketProvider, useWebSocket } from '../WebSocketContext';
import * as ConfigContext from '../ConfigContext';
import * as useRadarWebSocketModule from '../../hooks/useRadarWebSocket';
import * as useRadarStateModule from '../../hooks/useRadarState';
import * as radarApi from '../../api/radarApi';
import { toast } from 'sonner';
import React from 'react';

vi.mock('../ConfigContext');
vi.mock('../../hooks/useRadarWebSocket');
vi.mock('../../hooks/useRadarState');
vi.mock('../../api/radarApi');
vi.mock('sonner');

describe('WebSocketContext', () => {
  const mockControllerUrl = 'http://localhost:17394';
  const mockRadarUrl = 'ws://localhost:17396';

  const mockRadarInfo = {
    operationalRange: 10000,
    latitude: 45.5,
    longitude: -122.6,
    sweepAngle: 0,
    isSweeping: true,
    ships: [],
  };

  const mockTracks = [
    { id: 'track-1', range: 5000, azimuth: 90, speed: 10, course: 180 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(ConfigContext.useConfig).mockReturnValue({
      connectionSettings: {
        host: 'localhost',
        controllerPort: 17394,
        radarPort: 17396,
      },
      updateConnectionSettings: vi.fn(),
      controllerUrl: mockControllerUrl,
      radarUrl: mockRadarUrl,
    });

    vi.mocked(useRadarWebSocketModule.useRadarWebSocket).mockReturnValue({
      tracks: mockTracks,
      isConnected: true,
      sweepAngle: 0,
      connectionAttempts: 1,
      maxAttempts: 3,
    });

    vi.mocked(useRadarStateModule.useRadarState).mockReturnValue({
      radarInfo: mockRadarInfo,
      updateMaxRange: vi.fn(),
      isLoading: false,
      hasError: false,
    });

    vi.mocked(radarApi.addShip).mockResolvedValue(true);
    vi.mocked(radarApi.resetSimulation).mockResolvedValue(true);
  });

  describe('useWebSocket hook', () => {
    it('should throw error when used outside WebSocketProvider', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useWebSocket());
      }).toThrow('useWebSocket must be used within a WebSocketProvider');

      consoleErrorSpy.mockRestore();
    });

    it('should return context when used within WebSocketProvider', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WebSocketProvider>{children}</WebSocketProvider>
      );

      const { result } = renderHook(() => useWebSocket(), { wrapper });

      expect(result.current).toBeDefined();
      expect(result.current.tracks).toBeDefined();
      expect(result.current.isConnected).toBeDefined();
      expect(result.current.radarInfo).toBeDefined();
    });
  });

  describe('Context values', () => {
    it('should provide tracks from useRadarWebSocket', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WebSocketProvider>{children}</WebSocketProvider>
      );

      const { result } = renderHook(() => useWebSocket(), { wrapper });

      expect(result.current.tracks).toEqual(mockTracks);
    });

    it('should provide isConnected from useRadarWebSocket', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WebSocketProvider>{children}</WebSocketProvider>
      );

      const { result } = renderHook(() => useWebSocket(), { wrapper });

      expect(result.current.isConnected).toBe(true);
    });

    it('should provide radarInfo from useRadarState', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WebSocketProvider>{children}</WebSocketProvider>
      );

      const { result } = renderHook(() => useWebSocket(), { wrapper });

      expect(result.current.radarInfo).toEqual(mockRadarInfo);
    });

    it('should provide sweepAngle from useRadarWebSocket', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WebSocketProvider>{children}</WebSocketProvider>
      );

      const { result } = renderHook(() => useWebSocket(), { wrapper });

      expect(result.current.sweepAngle).toBe(0);
    });

    it('should provide isLoading from useRadarState', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WebSocketProvider>{children}</WebSocketProvider>
      );

      const { result } = renderHook(() => useWebSocket(), { wrapper });

      expect(result.current.isLoading).toBe(false);
    });

    it('should provide hasError from useRadarState', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WebSocketProvider>{children}</WebSocketProvider>
      );

      const { result } = renderHook(() => useWebSocket(), { wrapper });

      expect(result.current.hasError).toBe(false);
    });

    it('should provide connectionAttempts from useRadarWebSocket', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WebSocketProvider>{children}</WebSocketProvider>
      );

      const { result } = renderHook(() => useWebSocket(), { wrapper });

      expect(result.current.connectionAttempts).toBe(1);
    });

    it('should provide maxConnectionAttempts from useRadarWebSocket', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WebSocketProvider>{children}</WebSocketProvider>
      );

      const { result } = renderHook(() => useWebSocket(), { wrapper });

      expect(result.current.maxConnectionAttempts).toBe(3);
    });
  });

  describe('addShip function', () => {
    it('should call radarApi.addShip with correct parameters', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WebSocketProvider>{children}</WebSocketProvider>
      );

      const { result } = renderHook(() => useWebSocket(), { wrapper });

      const shipParams = {
        type: 'LineShip' as const,
        initial_position: { range: 5000, azimuth: 180 },
        speed: 10,
        angle: 90,
      };

      await result.current.addShip(shipParams);

      expect(radarApi.addShip).toHaveBeenCalledWith(mockControllerUrl, shipParams);
    });

    it('should show success toast when ship is added successfully', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WebSocketProvider>{children}</WebSocketProvider>
      );

      const { result } = renderHook(() => useWebSocket(), { wrapper });

      const shipParams = {
        type: 'CircleShip' as const,
        initial_position: { range: 3000, azimuth: 45 },
        speed: 15,
        radius: 2000,
      };

      await result.current.addShip(shipParams);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Ship added successfully');
      });
    });

    it('should show error toast when ship addition fails', async () => {
      vi.mocked(radarApi.addShip).mockResolvedValue(false);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WebSocketProvider>{children}</WebSocketProvider>
      );

      const { result } = renderHook(() => useWebSocket(), { wrapper });

      const shipParams = {
        type: 'StationaryShip' as const,
        initial_position: { range: 1000, azimuth: 0 },
      };

      await result.current.addShip(shipParams);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to add ship');
      });
    });
  });

  describe('resetSimulation function', () => {
    it('should call radarApi.resetSimulation with correct URL', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WebSocketProvider>{children}</WebSocketProvider>
      );

      const { result } = renderHook(() => useWebSocket(), { wrapper });

      await result.current.resetSimulation();

      expect(radarApi.resetSimulation).toHaveBeenCalledWith(mockControllerUrl);
    });

    it('should show success toast when simulation is reset successfully', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WebSocketProvider>{children}</WebSocketProvider>
      );

      const { result } = renderHook(() => useWebSocket(), { wrapper });

      await result.current.resetSimulation();

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Simulation reset successfully');
      });
    });

    it('should show error toast when simulation reset fails', async () => {
      vi.mocked(radarApi.resetSimulation).mockResolvedValue(false);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WebSocketProvider>{children}</WebSocketProvider>
      );

      const { result } = renderHook(() => useWebSocket(), { wrapper });

      await result.current.resetSimulation();

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to reset simulation');
      });
    });
  });

  describe('updateMaxRange function', () => {
    it('should provide updateMaxRange from useRadarState', () => {
      const mockUpdateMaxRange = vi.fn();

      vi.mocked(useRadarStateModule.useRadarState).mockReturnValue({
        radarInfo: mockRadarInfo,
        updateMaxRange: mockUpdateMaxRange,
        isLoading: false,
        hasError: false,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WebSocketProvider>{children}</WebSocketProvider>
      );

      const { result } = renderHook(() => useWebSocket(), { wrapper });

      result.current.updateMaxRange(15000);

      expect(mockUpdateMaxRange).toHaveBeenCalledWith(15000);
    });
  });

  describe('Hook integration', () => {
    it('should call useConfig to get URLs', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WebSocketProvider>{children}</WebSocketProvider>
      );

      renderHook(() => useWebSocket(), { wrapper });

      expect(ConfigContext.useConfig).toHaveBeenCalled();
    });

    it('should call useRadarWebSocket with radarUrl', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WebSocketProvider>{children}</WebSocketProvider>
      );

      renderHook(() => useWebSocket(), { wrapper });

      expect(useRadarWebSocketModule.useRadarWebSocket).toHaveBeenCalledWith(mockRadarUrl);
    });

    it('should call useRadarState with controllerUrl', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WebSocketProvider>{children}</WebSocketProvider>
      );

      renderHook(() => useWebSocket(), { wrapper });

      expect(useRadarStateModule.useRadarState).toHaveBeenCalledWith(mockControllerUrl);
    });
  });

  describe('State changes', () => {
    it('should reflect changes in connection state', () => {
      vi.mocked(useRadarWebSocketModule.useRadarWebSocket).mockReturnValue({
        tracks: [],
        isConnected: false,
        sweepAngle: 45,
        connectionAttempts: 2,
        maxAttempts: 3,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WebSocketProvider>{children}</WebSocketProvider>
      );

      const { result } = renderHook(() => useWebSocket(), { wrapper });

      expect(result.current.isConnected).toBe(false);
      expect(result.current.sweepAngle).toBe(45);
      expect(result.current.connectionAttempts).toBe(2);
    });

    it('should reflect changes in radar state', () => {
      const updatedRadarInfo = {
        ...mockRadarInfo,
        operationalRange: 20000,
        sweepAngle: 90,
      };

      vi.mocked(useRadarStateModule.useRadarState).mockReturnValue({
        radarInfo: updatedRadarInfo,
        updateMaxRange: vi.fn(),
        isLoading: true,
        hasError: false,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WebSocketProvider>{children}</WebSocketProvider>
      );

      const { result } = renderHook(() => useWebSocket(), { wrapper });

      expect(result.current.radarInfo.operationalRange).toBe(20000);
      expect(result.current.isLoading).toBe(true);
    });

    it('should reflect error state', () => {
      vi.mocked(useRadarStateModule.useRadarState).mockReturnValue({
        radarInfo: mockRadarInfo,
        updateMaxRange: vi.fn(),
        isLoading: false,
        hasError: true,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WebSocketProvider>{children}</WebSocketProvider>
      );

      const { result } = renderHook(() => useWebSocket(), { wrapper });

      expect(result.current.hasError).toBe(true);
    });
  });

  describe('Multiple ship types', () => {
    it('should handle LineShip parameters', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WebSocketProvider>{children}</WebSocketProvider>
      );

      const { result } = renderHook(() => useWebSocket(), { wrapper });

      const shipParams = {
        type: 'LineShip' as const,
        initial_position: { range: 5000, azimuth: 180 },
        speed: 10,
        angle: 90,
      };

      await result.current.addShip(shipParams);

      expect(radarApi.addShip).toHaveBeenCalledWith(mockControllerUrl, shipParams);
    });

    it('should handle CircleShip parameters', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WebSocketProvider>{children}</WebSocketProvider>
      );

      const { result } = renderHook(() => useWebSocket(), { wrapper });

      const shipParams = {
        type: 'CircleShip' as const,
        initial_position: { range: 3000, azimuth: 45 },
        speed: 15,
        radius: 2000,
      };

      await result.current.addShip(shipParams);

      expect(radarApi.addShip).toHaveBeenCalledWith(mockControllerUrl, shipParams);
    });

    it('should handle RandomShip parameters', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WebSocketProvider>{children}</WebSocketProvider>
      );

      const { result } = renderHook(() => useWebSocket(), { wrapper });

      const shipParams = {
        type: 'RandomShip' as const,
        initial_position: { range: 7000, azimuth: 270 },
        max_speed: 20,
      };

      await result.current.addShip(shipParams);

      expect(radarApi.addShip).toHaveBeenCalledWith(mockControllerUrl, shipParams);
    });

    it('should handle StationaryShip parameters', async () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WebSocketProvider>{children}</WebSocketProvider>
      );

      const { result } = renderHook(() => useWebSocket(), { wrapper });

      const shipParams = {
        type: 'StationaryShip' as const,
        initial_position: { range: 2000, azimuth: 135 },
      };

      await result.current.addShip(shipParams);

      expect(radarApi.addShip).toHaveBeenCalledWith(mockControllerUrl, shipParams);
    });
  });
});
