import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Index from '../Index';

describe('Index Page', () => {
  describe('Rendering', () => {
    it('should render the main heading', () => {
      render(<Index />);

      expect(screen.getByText('Welcome to Your Blank App')).toBeInTheDocument();
    });

    it('should render the subtitle', () => {
      render(<Index />);

      expect(screen.getByText('Start building your amazing project here!')).toBeInTheDocument();
    });

    it('should center content vertically and horizontally', () => {
      const { container } = render(<Index />);

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv.classList.contains('min-h-screen')).toBe(true);
      expect(mainDiv.classList.contains('flex')).toBe(true);
      expect(mainDiv.classList.contains('items-center')).toBe(true);
      expect(mainDiv.classList.contains('justify-center')).toBe(true);
    });

    it('should use gray background', () => {
      const { container } = render(<Index />);

      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv.classList.contains('bg-gray-100')).toBe(true);
    });

    it('should center align text', () => {
      const { container } = render(<Index />);

      const textCenter = container.querySelector('.text-center');
      expect(textCenter).toBeInTheDocument();
    });
  });

  describe('Typography', () => {
    it('should use 4xl text size for heading', () => {
      render(<Index />);

      const heading = screen.getByText('Welcome to Your Blank App');
      expect(heading.classList.contains('text-4xl')).toBe(true);
    });

    it('should use bold font for heading', () => {
      render(<Index />);

      const heading = screen.getByText('Welcome to Your Blank App');
      expect(heading.classList.contains('font-bold')).toBe(true);
    });

    it('should use xl text size for subtitle', () => {
      render(<Index />);

      const subtitle = screen.getByText('Start building your amazing project here!');
      expect(subtitle.classList.contains('text-xl')).toBe(true);
    });

    it('should use gray text color for subtitle', () => {
      render(<Index />);

      const subtitle = screen.getByText('Start building your amazing project here!');
      expect(subtitle.classList.contains('text-gray-600')).toBe(true);
    });
  });

  describe('Layout', () => {
    it('should have proper spacing on heading', () => {
      render(<Index />);

      const heading = screen.getByText('Welcome to Your Blank App');
      expect(heading.classList.contains('mb-4')).toBe(true);
    });

    it('should render as h1 element', () => {
      render(<Index />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading.textContent).toBe('Welcome to Your Blank App');
    });

    it('should render subtitle as paragraph', () => {
      const { container } = render(<Index />);

      const paragraph = container.querySelector('p');
      expect(paragraph).toBeInTheDocument();
      expect(paragraph?.textContent).toBe('Start building your amazing project here!');
    });
  });
});
