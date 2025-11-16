import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useIsMobile } from '../use-mobile';

describe('useIsMobile', () => {
  let matchMediaMock: any;
  let listeners: Array<() => void> = [];

  beforeEach(() => {
    listeners = [];

    // Mock matchMedia
    matchMediaMock = vi.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn((event: string, handler: () => void) => {
        listeners.push(handler);
      }),
      removeEventListener: vi.fn((event: string, handler: () => void) => {
        const index = listeners.indexOf(handler);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }),
      dispatchEvent: vi.fn(),
    }));

    window.matchMedia = matchMediaMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    listeners = [];
  });

  describe('Initial state', () => {
    it('should return false for desktop screen width', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(false);
    });

    it('should return true for mobile screen width', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(true);
    });

    it('should return true for screen width at mobile breakpoint (767px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 767,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(true);
    });

    it('should return false for screen width at desktop breakpoint (768px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(false);
    });

    it('should call matchMedia with correct query', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      renderHook(() => useIsMobile());

      expect(matchMediaMock).toHaveBeenCalledWith('(max-width: 767px)');
    });
  });

  describe('Window resize', () => {
    it('should update when window is resized from desktop to mobile', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(false);

      // Simulate window resize to mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      // Trigger the change event
      listeners.forEach(listener => listener());

      await waitFor(() => {
        expect(result.current).toBe(true);
      });
    });

    it('should update when window is resized from mobile to desktop', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(true);

      // Simulate window resize to desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      // Trigger the change event
      listeners.forEach(listener => listener());

      await waitFor(() => {
        expect(result.current).toBe(false);
      });
    });

    it('should handle multiple resize events', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(false);

      // First resize to mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      listeners.forEach(listener => listener());

      await waitFor(() => {
        expect(result.current).toBe(true);
      });

      // Second resize back to desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      listeners.forEach(listener => listener());

      await waitFor(() => {
        expect(result.current).toBe(false);
      });

      // Third resize to tablet
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });
      listeners.forEach(listener => listener());

      await waitFor(() => {
        expect(result.current).toBe(false);
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle very small screen widths', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(true);
    });

    it('should handle very large screen widths', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 2560,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(false);
    });

    it('should handle screen width of 0', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 0,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(true);
    });

    it('should handle exactly 1px below breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 767,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(true);
    });

    it('should handle exactly 1px above breakpoint', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(result.current).toBe(false);
    });
  });

  describe('Cleanup', () => {
    it('should remove event listener on unmount', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { unmount } = renderHook(() => useIsMobile());

      expect(listeners.length).toBeGreaterThan(0);

      unmount();

      expect(listeners.length).toBe(0);
    });

    it('should not cause errors when unmounted during resize', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { unmount } = renderHook(() => useIsMobile());

      // Unmount before resize
      unmount();

      // Try to trigger resize after unmount
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      // This should not throw an error
      expect(() => {
        listeners.forEach(listener => listener());
      }).not.toThrow();
    });
  });

  describe('Return value', () => {
    it('should return boolean false for desktop', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(typeof result.current).toBe('boolean');
      expect(result.current).toBe(false);
    });

    it('should return boolean true for mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const { result } = renderHook(() => useIsMobile());

      expect(typeof result.current).toBe('boolean');
      expect(result.current).toBe(true);
    });

    it('should never return undefined after initial render', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { result } = renderHook(() => useIsMobile());

      // Wait for effect to run
      await waitFor(() => {
        expect(result.current).toBeDefined();
      });

      expect(result.current).not.toBeUndefined();
    });
  });
});
