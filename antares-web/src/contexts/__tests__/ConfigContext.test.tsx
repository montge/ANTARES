import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { ConfigProvider, useConfig } from '../ConfigContext';
import { ConnectionSettings } from '../../types/radar';
import React from 'react';

describe('ConfigContext', () => {
  const mockLocalStorage: Record<string, string> = {};

  beforeEach(() => {
    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockLocalStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockLocalStorage[key];
      }),
      clear: vi.fn(() => {
        Object.keys(mockLocalStorage).forEach(key => delete mockLocalStorage[key]);
      }),
      length: 0,
      key: vi.fn(),
    } as Storage;

    // Clear mock storage
    Object.keys(mockLocalStorage).forEach(key => delete mockLocalStorage[key]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('useConfig hook', () => {
    it('should throw error when used outside ConfigProvider', () => {
      // Suppress console.error for this test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useConfig());
      }).toThrow('useConfig must be used within a ConfigProvider');

      consoleErrorSpy.mockRestore();
    });

    it('should return context when used within ConfigProvider', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ConfigProvider>{children}</ConfigProvider>
      );

      const { result } = renderHook(() => useConfig(), { wrapper });

      expect(result.current).toBeDefined();
      expect(result.current.connectionSettings).toBeDefined();
      expect(result.current.updateConnectionSettings).toBeDefined();
      expect(result.current.controllerUrl).toBeDefined();
      expect(result.current.radarUrl).toBeDefined();
    });
  });

  describe('Default values', () => {
    it('should initialize with default connection settings', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ConfigProvider>{children}</ConfigProvider>
      );

      const { result } = renderHook(() => useConfig(), { wrapper });

      expect(result.current.connectionSettings).toEqual({
        host: 'localhost',
        controllerPort: 17394,
        radarPort: 17396,
      });
    });

    it('should generate correct default controller URL', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ConfigProvider>{children}</ConfigProvider>
      );

      const { result } = renderHook(() => useConfig(), { wrapper });

      expect(result.current.controllerUrl).toBe('http://localhost:17394');
    });

    it('should generate correct default radar URL', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ConfigProvider>{children}</ConfigProvider>
      );

      const { result } = renderHook(() => useConfig(), { wrapper });

      expect(result.current.radarUrl).toBe('ws://localhost:17396');
    });
  });

  describe('localStorage loading', () => {
    it('should load saved settings from localStorage on mount', async () => {
      const savedSettings: ConnectionSettings = {
        host: '192.168.1.100',
        controllerPort: 8080,
        radarPort: 9090,
      };

      mockLocalStorage['antares_connection_settings'] = JSON.stringify(savedSettings);

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ConfigProvider>{children}</ConfigProvider>
      );

      const { result } = renderHook(() => useConfig(), { wrapper });

      await waitFor(() => {
        expect(result.current.connectionSettings).toEqual(savedSettings);
      });
    });

    it('should use default settings when localStorage is empty', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ConfigProvider>{children}</ConfigProvider>
      );

      const { result } = renderHook(() => useConfig(), { wrapper });

      expect(result.current.connectionSettings).toEqual({
        host: 'localhost',
        controllerPort: 17394,
        radarPort: 17396,
      });
    });

    it('should handle invalid JSON in localStorage gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockLocalStorage['antares_connection_settings'] = 'invalid json {';

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ConfigProvider>{children}</ConfigProvider>
      );

      const { result } = renderHook(() => useConfig(), { wrapper });

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to parse saved connection settings:',
          expect.any(Error)
        );
      });

      // Should fall back to defaults
      expect(result.current.connectionSettings).toEqual({
        host: 'localhost',
        controllerPort: 17394,
        radarPort: 17396,
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('updateConnectionSettings', () => {
    it('should update connection settings', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ConfigProvider>{children}</ConfigProvider>
      );

      const { result } = renderHook(() => useConfig(), { wrapper });

      const newSettings: ConnectionSettings = {
        host: '10.0.0.1',
        controllerPort: 5000,
        radarPort: 6000,
      };

      act(() => {
        result.current.updateConnectionSettings(newSettings);
      });

      expect(result.current.connectionSettings).toEqual(newSettings);
    });

    it('should save settings to localStorage', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ConfigProvider>{children}</ConfigProvider>
      );

      const { result } = renderHook(() => useConfig(), { wrapper });

      const newSettings: ConnectionSettings = {
        host: '192.168.1.50',
        controllerPort: 7000,
        radarPort: 8000,
      };

      act(() => {
        result.current.updateConnectionSettings(newSettings);
      });

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'antares_connection_settings',
        JSON.stringify(newSettings)
      );
    });

    it('should handle localStorage setItem errors gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      vi.mocked(global.localStorage.setItem).mockImplementation(() => {
        throw new Error('localStorage full');
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ConfigProvider>{children}</ConfigProvider>
      );

      const { result } = renderHook(() => useConfig(), { wrapper });

      const newSettings: ConnectionSettings = {
        host: '10.0.0.1',
        controllerPort: 5000,
        radarPort: 6000,
      };

      act(() => {
        result.current.updateConnectionSettings(newSettings);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to save connection settings to localStorage:',
        expect.any(Error)
      );

      // Settings should still update in state even if localStorage fails
      expect(result.current.connectionSettings).toEqual(newSettings);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('URL generation', () => {
    it('should generate controller URL from settings', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ConfigProvider>{children}</ConfigProvider>
      );

      const { result } = renderHook(() => useConfig(), { wrapper });

      const newSettings: ConnectionSettings = {
        host: '192.168.1.100',
        controllerPort: 8080,
        radarPort: 9090,
      };

      act(() => {
        result.current.updateConnectionSettings(newSettings);
      });

      expect(result.current.controllerUrl).toBe('http://192.168.1.100:8080');
    });

    it('should generate radar URL from settings', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ConfigProvider>{children}</ConfigProvider>
      );

      const { result } = renderHook(() => useConfig(), { wrapper });

      const newSettings: ConnectionSettings = {
        host: '10.0.0.5',
        controllerPort: 5000,
        radarPort: 6000,
      };

      act(() => {
        result.current.updateConnectionSettings(newSettings);
      });

      expect(result.current.radarUrl).toBe('ws://10.0.0.5:6000');
    });

    it('should update URLs when settings change', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ConfigProvider>{children}</ConfigProvider>
      );

      const { result } = renderHook(() => useConfig(), { wrapper });

      const firstSettings: ConnectionSettings = {
        host: 'server1.com',
        controllerPort: 3000,
        radarPort: 4000,
      };

      act(() => {
        result.current.updateConnectionSettings(firstSettings);
      });

      expect(result.current.controllerUrl).toBe('http://server1.com:3000');
      expect(result.current.radarUrl).toBe('ws://server1.com:4000');

      const secondSettings: ConnectionSettings = {
        host: 'server2.com',
        controllerPort: 5000,
        radarPort: 6000,
      };

      act(() => {
        result.current.updateConnectionSettings(secondSettings);
      });

      expect(result.current.controllerUrl).toBe('http://server2.com:5000');
      expect(result.current.radarUrl).toBe('ws://server2.com:6000');
    });

    it('should handle hostname with special characters', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ConfigProvider>{children}</ConfigProvider>
      );

      const { result } = renderHook(() => useConfig(), { wrapper });

      const newSettings: ConnectionSettings = {
        host: 'radar-server.example.com',
        controllerPort: 8080,
        radarPort: 9090,
      };

      act(() => {
        result.current.updateConnectionSettings(newSettings);
      });

      expect(result.current.controllerUrl).toBe('http://radar-server.example.com:8080');
      expect(result.current.radarUrl).toBe('ws://radar-server.example.com:9090');
    });

    it('should handle IPv6 addresses', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ConfigProvider>{children}</ConfigProvider>
      );

      const { result } = renderHook(() => useConfig(), { wrapper });

      const newSettings: ConnectionSettings = {
        host: '::1',
        controllerPort: 8080,
        radarPort: 9090,
      };

      act(() => {
        result.current.updateConnectionSettings(newSettings);
      });

      expect(result.current.controllerUrl).toBe('http://::1:8080');
      expect(result.current.radarUrl).toBe('ws://::1:9090');
    });
  });

  describe('Edge cases', () => {
    it('should handle port number 0', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ConfigProvider>{children}</ConfigProvider>
      );

      const { result } = renderHook(() => useConfig(), { wrapper });

      const newSettings: ConnectionSettings = {
        host: 'localhost',
        controllerPort: 0,
        radarPort: 0,
      };

      act(() => {
        result.current.updateConnectionSettings(newSettings);
      });

      expect(result.current.controllerUrl).toBe('http://localhost:0');
      expect(result.current.radarUrl).toBe('ws://localhost:0');
    });

    it('should handle maximum port number', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ConfigProvider>{children}</ConfigProvider>
      );

      const { result } = renderHook(() => useConfig(), { wrapper });

      const newSettings: ConnectionSettings = {
        host: 'localhost',
        controllerPort: 65535,
        radarPort: 65535,
      };

      act(() => {
        result.current.updateConnectionSettings(newSettings);
      });

      expect(result.current.controllerUrl).toBe('http://localhost:65535');
      expect(result.current.radarUrl).toBe('ws://localhost:65535');
    });

    it('should handle empty host string', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ConfigProvider>{children}</ConfigProvider>
      );

      const { result } = renderHook(() => useConfig(), { wrapper });

      const newSettings: ConnectionSettings = {
        host: '',
        controllerPort: 8080,
        radarPort: 9090,
      };

      act(() => {
        result.current.updateConnectionSettings(newSettings);
      });

      expect(result.current.controllerUrl).toBe('http://:8080');
      expect(result.current.radarUrl).toBe('ws://:9090');
    });

    it('should handle multiple rapid updates', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ConfigProvider>{children}</ConfigProvider>
      );

      const { result } = renderHook(() => useConfig(), { wrapper });

      act(() => {
        result.current.updateConnectionSettings({
          host: 'server1',
          controllerPort: 1000,
          radarPort: 2000,
        });
        result.current.updateConnectionSettings({
          host: 'server2',
          controllerPort: 3000,
          radarPort: 4000,
        });
        result.current.updateConnectionSettings({
          host: 'server3',
          controllerPort: 5000,
          radarPort: 6000,
        });
      });

      expect(result.current.connectionSettings).toEqual({
        host: 'server3',
        controllerPort: 5000,
        radarPort: 6000,
      });
      expect(result.current.controllerUrl).toBe('http://server3:5000');
      expect(result.current.radarUrl).toBe('ws://server3:6000');
    });
  });

  describe('Persistence', () => {
    it('should persist settings across provider remounts', async () => {
      const settings: ConnectionSettings = {
        host: 'persistent.com',
        controllerPort: 9999,
        radarPort: 8888,
      };

      mockLocalStorage['antares_connection_settings'] = JSON.stringify(settings);

      const wrapper1 = ({ children }: { children: React.ReactNode }) => (
        <ConfigProvider>{children}</ConfigProvider>
      );

      const { result: result1, unmount } = renderHook(() => useConfig(), { wrapper: wrapper1 });

      await waitFor(() => {
        expect(result1.current.connectionSettings).toEqual(settings);
      });

      unmount();

      // Remount with new provider
      const wrapper2 = ({ children }: { children: React.ReactNode }) => (
        <ConfigProvider>{children}</ConfigProvider>
      );

      const { result: result2 } = renderHook(() => useConfig(), { wrapper: wrapper2 });

      await waitFor(() => {
        expect(result2.current.connectionSettings).toEqual(settings);
      });
    });

    it('should load from localStorage only once on mount', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ConfigProvider>{children}</ConfigProvider>
      );

      renderHook(() => useConfig(), { wrapper });

      // getItem should be called once during mount
      expect(localStorage.getItem).toHaveBeenCalledTimes(1);
      expect(localStorage.getItem).toHaveBeenCalledWith('antares_connection_settings');
    });
  });
});
