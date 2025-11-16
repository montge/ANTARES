import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsModal } from '../SettingsModal';
import * as ConfigContext from '../../contexts/ConfigContext';
import { ConnectionSettings } from '../../types/radar';

vi.mock('../../contexts/ConfigContext');

describe('SettingsModal', () => {
  const mockConnectionSettings: ConnectionSettings = {
    host: 'localhost',
    controllerPort: 17394,
    radarPort: 17396,
  };

  const mockUpdateConnectionSettings = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(ConfigContext.useConfig).mockReturnValue({
      connectionSettings: mockConnectionSettings,
      updateConnectionSettings: mockUpdateConnectionSettings,
    });
  });

  describe('Trigger button', () => {
    it('should render settings trigger button', () => {
      render(<SettingsModal />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });

    it('should have settings icon', () => {
      const { container } = render(<SettingsModal />);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should have screen reader text', () => {
      render(<SettingsModal />);

      expect(screen.getByText('Settings')).toHaveClass('sr-only');
    });

    it('should open dialog when trigger button is clicked', async () => {
      render(<SettingsModal />);

      const triggerButton = screen.getByRole('button');
      fireEvent.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByText('ANTARES Connection Settings')).toBeInTheDocument();
      });
    });
  });

  describe('Dialog content', () => {
    beforeEach(async () => {
      render(<SettingsModal />);
      const triggerButton = screen.getByRole('button');
      fireEvent.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByText('ANTARES Connection Settings')).toBeInTheDocument();
      });
    });

    it('should render dialog title', () => {
      expect(screen.getByText('ANTARES Connection Settings')).toBeInTheDocument();
    });

    it('should render dialog description', () => {
      expect(screen.getByText(/Configure connection parameters for the ANTARES radar system/)).toBeInTheDocument();
    });

    it('should render Host label', () => {
      expect(screen.getByText('Host')).toBeInTheDocument();
    });

    it('should render Controller Port label', () => {
      expect(screen.getByText('Controller Port')).toBeInTheDocument();
    });

    it('should render Radar Port label', () => {
      expect(screen.getByText('Radar Port')).toBeInTheDocument();
    });

    it('should render Save Changes button', () => {
      expect(screen.getByText('SAVE CHANGES')).toBeInTheDocument();
    });
  });

  describe('Input fields', () => {
    beforeEach(async () => {
      render(<SettingsModal />);
      const triggerButton = screen.getByRole('button');
      fireEvent.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByText('ANTARES Connection Settings')).toBeInTheDocument();
      });
    });

    it('should display current host value', () => {
      const hostInput = screen.getByPlaceholderText('localhost or IP address') as HTMLInputElement;
      expect(hostInput.value).toBe('localhost');
    });

    it('should display current controller port value', () => {
      const controllerPortInput = screen.getByPlaceholderText('17394') as HTMLInputElement;
      expect(controllerPortInput.value).toBe('17394');
    });

    it('should display current radar port value', () => {
      const radarPortInput = screen.getByPlaceholderText('17396') as HTMLInputElement;
      expect(radarPortInput.value).toBe('17396');
    });

    it('should allow changing host value', () => {
      const hostInput = screen.getByPlaceholderText('localhost or IP address') as HTMLInputElement;

      fireEvent.change(hostInput, { target: { value: '192.168.1.100' } });

      expect(hostInput.value).toBe('192.168.1.100');
    });

    it('should allow changing controller port value', () => {
      const controllerPortInput = screen.getByPlaceholderText('17394') as HTMLInputElement;

      fireEvent.change(controllerPortInput, { target: { value: '8080' } });

      expect(controllerPortInput.value).toBe('8080');
    });

    it('should allow changing radar port value', () => {
      const radarPortInput = screen.getByPlaceholderText('17396') as HTMLInputElement;

      fireEvent.change(radarPortInput, { target: { value: '9090' } });

      expect(radarPortInput.value).toBe('9090');
    });

    it('should handle invalid port numbers gracefully', () => {
      const controllerPortInput = screen.getByPlaceholderText('17394') as HTMLInputElement;

      fireEvent.change(controllerPortInput, { target: { value: 'invalid' } });

      expect(controllerPortInput.value).toBe('0');
    });

    it('should handle empty port values', () => {
      const radarPortInput = screen.getByPlaceholderText('17396') as HTMLInputElement;

      fireEvent.change(radarPortInput, { target: { value: '' } });

      expect(radarPortInput.value).toBe('0');
    });
  });

  describe('Save functionality', () => {
    beforeEach(async () => {
      render(<SettingsModal />);
      const triggerButton = screen.getByRole('button');
      fireEvent.click(triggerButton);

      await waitFor(() => {
        expect(screen.getByText('ANTARES Connection Settings')).toBeInTheDocument();
      });
    });

    it('should call updateConnectionSettings with new values when saved', () => {
      const hostInput = screen.getByPlaceholderText('localhost or IP address');
      const controllerPortInput = screen.getByPlaceholderText('17394');
      const radarPortInput = screen.getByPlaceholderText('17396');

      fireEvent.change(hostInput, { target: { value: '192.168.1.50' } });
      fireEvent.change(controllerPortInput, { target: { value: '8080' } });
      fireEvent.change(radarPortInput, { target: { value: '9090' } });

      const saveButton = screen.getByText('SAVE CHANGES');
      fireEvent.click(saveButton);

      expect(mockUpdateConnectionSettings).toHaveBeenCalledWith({
        host: '192.168.1.50',
        controllerPort: 8080,
        radarPort: 9090,
      });
    });

    it('should close dialog after saving', async () => {
      const saveButton = screen.getByText('SAVE CHANGES');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.queryByText('ANTARES Connection Settings')).not.toBeInTheDocument();
      });
    });

    it('should save without modifications', () => {
      const saveButton = screen.getByText('SAVE CHANGES');
      fireEvent.click(saveButton);

      expect(mockUpdateConnectionSettings).toHaveBeenCalledWith(mockConnectionSettings);
    });

    it('should convert port strings to numbers', () => {
      const controllerPortInput = screen.getByPlaceholderText('17394');
      fireEvent.change(controllerPortInput, { target: { value: '12345' } });

      const saveButton = screen.getByText('SAVE CHANGES');
      fireEvent.click(saveButton);

      expect(mockUpdateConnectionSettings).toHaveBeenCalledWith({
        host: 'localhost',
        controllerPort: 12345, // Number, not string
        radarPort: 17396,
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle very large port numbers', async () => {
      render(<SettingsModal />);
      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText('ANTARES Connection Settings')).toBeInTheDocument();
      });

      const controllerPortInput = screen.getByPlaceholderText('17394');
      fireEvent.change(controllerPortInput, { target: { value: '65535' } });

      const saveButton = screen.getByText('SAVE CHANGES');
      fireEvent.click(saveButton);

      expect(mockUpdateConnectionSettings).toHaveBeenCalledWith({
        host: 'localhost',
        controllerPort: 65535,
        radarPort: 17396,
      });
    });

    it('should handle zero port numbers', async () => {
      render(<SettingsModal />);
      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText('ANTARES Connection Settings')).toBeInTheDocument();
      });

      const radarPortInput = screen.getByPlaceholderText('17396');
      fireEvent.change(radarPortInput, { target: { value: '0' } });

      const saveButton = screen.getByText('SAVE CHANGES');
      fireEvent.click(saveButton);

      expect(mockUpdateConnectionSettings).toHaveBeenCalledWith({
        host: 'localhost',
        controllerPort: 17394,
        radarPort: 0,
      });
    });

    it('should handle empty host value', async () => {
      render(<SettingsModal />);
      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText('ANTARES Connection Settings')).toBeInTheDocument();
      });

      const hostInput = screen.getByPlaceholderText('localhost or IP address');
      fireEvent.change(hostInput, { target: { value: '' } });

      const saveButton = screen.getByText('SAVE CHANGES');
      fireEvent.click(saveButton);

      expect(mockUpdateConnectionSettings).toHaveBeenCalledWith({
        host: '',
        controllerPort: 17394,
        radarPort: 17396,
      });
    });

    it('should handle IP address as host', async () => {
      render(<SettingsModal />);
      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText('ANTARES Connection Settings')).toBeInTheDocument();
      });

      const hostInput = screen.getByPlaceholderText('localhost or IP address');
      fireEvent.change(hostInput, { target: { value: '192.168.1.100' } });

      const saveButton = screen.getByText('SAVE CHANGES');
      fireEvent.click(saveButton);

      expect(mockUpdateConnectionSettings).toHaveBeenCalledWith({
        host: '192.168.1.100',
        controllerPort: 17394,
        radarPort: 17396,
      });
    });

    it('should handle hostname as host', async () => {
      render(<SettingsModal />);
      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText('ANTARES Connection Settings')).toBeInTheDocument();
      });

      const hostInput = screen.getByPlaceholderText('localhost or IP address');
      fireEvent.change(hostInput, { target: { value: 'radar.example.com' } });

      const saveButton = screen.getByText('SAVE CHANGES');
      fireEvent.click(saveButton);

      expect(mockUpdateConnectionSettings).toHaveBeenCalledWith({
        host: 'radar.example.com',
        controllerPort: 17394,
        radarPort: 17396,
      });
    });
  });

  describe('State initialization', () => {
    it('should initialize with context values', async () => {
      vi.mocked(ConfigContext.useConfig).mockReturnValue({
        connectionSettings: {
          host: 'custom-host',
          controllerPort: 5000,
          radarPort: 6000,
        },
        updateConnectionSettings: mockUpdateConnectionSettings,
      });

      render(<SettingsModal />);
      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText('ANTARES Connection Settings')).toBeInTheDocument();
      });

      const hostInput = screen.getByPlaceholderText('localhost or IP address') as HTMLInputElement;
      const controllerPortInput = screen.getByPlaceholderText('17394') as HTMLInputElement;
      const radarPortInput = screen.getByPlaceholderText('17396') as HTMLInputElement;

      expect(hostInput.value).toBe('custom-host');
      expect(controllerPortInput.value).toBe('5000');
      expect(radarPortInput.value).toBe('6000');
    });
  });

  describe('Dialog state management', () => {
    it('should start with dialog closed', () => {
      render(<SettingsModal />);

      expect(screen.queryByText('ANTARES Connection Settings')).not.toBeInTheDocument();
    });

    it('should open dialog on trigger click', async () => {
      render(<SettingsModal />);

      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText('ANTARES Connection Settings')).toBeInTheDocument();
      });
    });

    it('should show saved values when reopening after save', async () => {
      render(<SettingsModal />);

      // Open dialog
      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText('ANTARES Connection Settings')).toBeInTheDocument();
      });

      // Change a value
      const hostInput = screen.getByPlaceholderText('localhost or IP address');
      fireEvent.change(hostInput, { target: { value: 'test-host' } });

      // Save changes - this updates the context
      fireEvent.click(screen.getByText('SAVE CHANGES'));

      await waitFor(() => {
        expect(screen.queryByText('ANTARES Connection Settings')).not.toBeInTheDocument();
      });

      // Mock context now returns the updated value
      vi.mocked(ConfigContext.useConfig).mockReturnValue({
        connectionSettings: {
          host: 'test-host',
          controllerPort: 17394,
          radarPort: 17396,
        },
        updateConnectionSettings: mockUpdateConnectionSettings,
      });

      // Reopen dialog - should show saved values from context
      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText('ANTARES Connection Settings')).toBeInTheDocument();
      });

      const hostInputReopened = screen.getByPlaceholderText('localhost or IP address') as HTMLInputElement;
      expect(hostInputReopened.value).toBe('test-host');
    });
  });

  describe('Accessibility', () => {
    it('should have proper input labels', async () => {
      render(<SettingsModal />);
      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText('ANTARES Connection Settings')).toBeInTheDocument();
      });

      expect(screen.getByLabelText('Host')).toBeInTheDocument();
      expect(screen.getByLabelText('Controller Port')).toBeInTheDocument();
      expect(screen.getByLabelText('Radar Port')).toBeInTheDocument();
    });

    it('should have proper input types', async () => {
      render(<SettingsModal />);
      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText('ANTARES Connection Settings')).toBeInTheDocument();
      });

      const controllerPortInput = screen.getByPlaceholderText('17394');
      const radarPortInput = screen.getByPlaceholderText('17396');

      expect(controllerPortInput).toHaveAttribute('type', 'number');
      expect(radarPortInput).toHaveAttribute('type', 'number');
    });
  });
});
