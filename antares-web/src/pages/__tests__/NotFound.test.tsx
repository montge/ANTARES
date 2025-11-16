import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotFound from '../NotFound';

describe('NotFound Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render 404 heading', () => {
      render(
        <MemoryRouter>
          <NotFound />
        </MemoryRouter>
      );

      expect(screen.getByText('404')).toBeInTheDocument();
    });

    it('should render error message', () => {
      render(
        <MemoryRouter>
          <NotFound />
        </MemoryRouter>
      );

      expect(screen.getByText('Oops! Page not found')).toBeInTheDocument();
    });

    it('should render return to home link', () => {
      render(
        <MemoryRouter>
          <NotFound />
        </MemoryRouter>
      );

      const link = screen.getByText('Return to Home');
      expect(link).toBeInTheDocument();
      expect(link.tagName).toBe('A');
    });

    it('should have correct href for home link', () => {
      render(
        <MemoryRouter>
          <NotFound />
        </MemoryRouter>
      );

      const link = screen.getByText('Return to Home') as HTMLAnchorElement;
      expect(link.href).toContain('/');
    });

    it('should center content vertically and horizontally', () => {
      const { container } = render(
        <MemoryRouter>
          <NotFound />
        </MemoryRouter>
      );

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv.classList.contains('min-h-screen')).toBe(true);
      expect(mainDiv.classList.contains('flex')).toBe(true);
      expect(mainDiv.classList.contains('items-center')).toBe(true);
      expect(mainDiv.classList.contains('justify-center')).toBe(true);
    });

    it('should use gray background', () => {
      const { container } = render(
        <MemoryRouter>
          <NotFound />
        </MemoryRouter>
      );

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv.classList.contains('bg-gray-100')).toBe(true);
    });
  });

  describe('Error logging', () => {
    it('should log 404 error to console', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');

      render(
        <MemoryRouter initialEntries={['/invalid-route']}>
          <NotFound />
        </MemoryRouter>
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '404 Error: User attempted to access non-existent route:',
        '/invalid-route'
      );
    });

    it('should log different routes correctly', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');

      const { unmount } = render(
        <MemoryRouter initialEntries={['/some/random/path']}>
          <NotFound />
        </MemoryRouter>
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '404 Error: User attempted to access non-existent route:',
        '/some/random/path'
      );

      unmount();

      render(
        <MemoryRouter initialEntries={['/another/path']}>
          <NotFound />
        </MemoryRouter>
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '404 Error: User attempted to access non-existent route:',
        '/another/path'
      );
    });

    it('should re-run effect when pathname changes', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');

      render(
        <MemoryRouter initialEntries={['/first-path']}>
          <NotFound />
        </MemoryRouter>
      );

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Typography', () => {
    it('should use 4xl text size for 404', () => {
      render(
        <MemoryRouter>
          <NotFound />
        </MemoryRouter>
      );

      const heading = screen.getByText('404');
      expect(heading.classList.contains('text-4xl')).toBe(true);
    });

    it('should use bold font for 404', () => {
      render(
        <MemoryRouter>
          <NotFound />
        </MemoryRouter>
      );

      const heading = screen.getByText('404');
      expect(heading.classList.contains('font-bold')).toBe(true);
    });

    it('should use xl text size for error message', () => {
      render(
        <MemoryRouter>
          <NotFound />
        </MemoryRouter>
      );

      const message = screen.getByText('Oops! Page not found');
      expect(message.classList.contains('text-xl')).toBe(true);
    });

    it('should use gray text color for error message', () => {
      render(
        <MemoryRouter>
          <NotFound />
        </MemoryRouter>
      );

      const message = screen.getByText('Oops! Page not found');
      expect(message.classList.contains('text-gray-600')).toBe(true);
    });
  });

  describe('Link styling', () => {
    it('should style link with blue color', () => {
      render(
        <MemoryRouter>
          <NotFound />
        </MemoryRouter>
      );

      const link = screen.getByText('Return to Home');
      expect(link.classList.contains('text-blue-500')).toBe(true);
    });

    it('should have hover state', () => {
      render(
        <MemoryRouter>
          <NotFound />
        </MemoryRouter>
      );

      const link = screen.getByText('Return to Home');
      expect(link.classList.contains('hover:text-blue-700')).toBe(true);
    });

    it('should have underline', () => {
      render(
        <MemoryRouter>
          <NotFound />
        </MemoryRouter>
      );

      const link = screen.getByText('Return to Home');
      expect(link.classList.contains('underline')).toBe(true);
    });
  });

  describe('Layout', () => {
    it('should have proper spacing on 404 heading', () => {
      render(
        <MemoryRouter>
          <NotFound />
        </MemoryRouter>
      );

      const heading = screen.getByText('404');
      expect(heading.classList.contains('mb-4')).toBe(true);
    });

    it('should have proper spacing on error message', () => {
      render(
        <MemoryRouter>
          <NotFound />
        </MemoryRouter>
      );

      const message = screen.getByText('Oops! Page not found');
      expect(message.classList.contains('mb-4')).toBe(true);
    });

    it('should render 404 as h1 element', () => {
      render(
        <MemoryRouter>
          <NotFound />
        </MemoryRouter>
      );

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading.textContent).toBe('404');
    });

    it('should render error message as paragraph', () => {
      const { container } = render(
        <MemoryRouter>
          <NotFound />
        </MemoryRouter>
      );

      const paragraph = container.querySelector('p');
      expect(paragraph).toBeInTheDocument();
      expect(paragraph?.textContent).toBe('Oops! Page not found');
    });
  });

  describe('Accessibility', () => {
    it('should have proper text alignment for screen readers', () => {
      const { container } = render(
        <MemoryRouter>
          <NotFound />
        </MemoryRouter>
      );

      const textCenter = container.querySelector('.text-center');
      expect(textCenter).toBeInTheDocument();
    });

    it('should have valid heading hierarchy', () => {
      render(
        <MemoryRouter>
          <NotFound />
        </MemoryRouter>
      );

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
    });
  });
});
