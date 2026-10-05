import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { FormattingControls } from '@/components/builder/formatting-controls';
import { DEFAULT_TEMPLATE_SETTINGS, settingsToCssVars } from '@/lib/types/template-settings';
import { getResumePdfUrl } from '@/lib/api/resume';
import {
  readStoredTemplateSettings,
  TEMPLATE_SETTINGS_STORAGE_KEY,
} from '@/lib/utils/stored-template-settings';

vi.mock('@/lib/i18n', () => ({ useTranslations: () => ({ t: (key: string) => key }) }));
vi.mock('@/components/builder/template-selector', () => ({ TemplateThumbnail: () => null }));

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe('local font permission and selection', () => {
  it('requests fonts only on click, lists all families once, and applies a selected font', async () => {
    const query = vi
      .fn()
      .mockResolvedValue([
        { family: 'Custom Serif' },
        { family: 'Custom Serif' },
        { family: 'A Font & Co' },
      ]);
    vi.stubGlobal('isSecureContext', true);
    vi.stubGlobal('queryLocalFonts', query);
    const onChange = vi.fn();
    const { rerender } = render(
      <FormattingControls settings={DEFAULT_TEMPLATE_SETTINGS} onChange={onChange} />
    );
    expect(query).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'builder.formatting.loadLocalFonts' }));
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('builder.formatting.localFontsLoaded')
    );
    expect(query).toHaveBeenCalledTimes(1);
    const serif = screen.getAllByRole('combobox')[0];
    expect(within(serif).getAllByRole('option', { name: 'Custom Serif' })).toHaveLength(1);
    fireEvent.change(serif, { target: { value: 'local:A Font & Co' } });
    const settings = onChange.mock.lastCall![0];
    expect(settings.typefaces.serif).toBe('local:A Font & Co');
    expect((settingsToCssVars(settings) as Record<string, string>)['--header-font']).toMatch(
      /^"A Font & Co", /
    );
    expect(
      new URL(getResumePdfUrl('r1', settings), 'http://localhost').searchParams.get('serifTypeface')
    ).toBe('local:A Font & Co');
    window.localStorage.setItem(TEMPLATE_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    expect(readStoredTemplateSettings().typefaces?.serif).toBe('local:A Font & Co');
    rerender(<FormattingControls settings={settings} onChange={onChange} />);
    expect(screen.getAllByRole('combobox')[0]).toHaveValue('local:A Font & Co');
  });

  it('shows denied permissions and allows retry without replacing selections', async () => {
    vi.stubGlobal('isSecureContext', true);
    const query = vi.fn().mockRejectedValue(new DOMException('Denied', 'NotAllowedError'));
    vi.stubGlobal('queryLocalFonts', query);
    const onChange = vi.fn();
    render(<FormattingControls settings={DEFAULT_TEMPLATE_SETTINGS} onChange={onChange} />);
    const button = screen.getByRole('button', { name: 'builder.formatting.loadLocalFonts' });
    fireEvent.click(button);
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('builder.formatting.localFontsDenied')
    );
    expect(button).toBeEnabled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('handles unsupported browsers and retains previously saved local fonts', () => {
    vi.stubGlobal('isSecureContext', true);
    vi.stubGlobal('queryLocalFonts', undefined);
    render(
      <FormattingControls
        settings={{
          ...DEFAULT_TEMPLATE_SETTINGS,
          typefaces: { serif: 'local:My Saved Font', 'sans-serif': 'default', mono: 'default' },
        }}
        onChange={vi.fn()}
      />
    );
    expect(
      screen.getByRole('button', { name: 'builder.formatting.loadLocalFonts' })
    ).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent(
      'builder.formatting.localFontsUnsupported'
    );
    expect(screen.getAllByRole('combobox')[0]).toHaveValue('local:My Saved Font');
  });
});
