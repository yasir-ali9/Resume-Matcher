import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { FormattingControls } from '@/components/builder/formatting-controls';
import { DEFAULT_TEMPLATE_SETTINGS, settingsToCssVars } from '@/lib/types/template-settings';
import { getResumePdfUrl, toPageFitSettings } from '@/lib/api/resume';
import {
  readStoredTemplateSettings,
  TEMPLATE_SETTINGS_STORAGE_KEY,
} from '@/lib/utils/stored-template-settings';

vi.mock('@/lib/i18n', () => ({ useTranslations: () => ({ t: (key: string) => key }) }));
vi.mock('@/components/builder/template-selector', () => ({ TemplateThumbnail: () => null }));

afterEach(() => window.localStorage.clear());

describe('link font selection', () => {
  it('selects link fonts independently and includes them in PDF and page-fit settings', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <FormattingControls settings={DEFAULT_TEMPLATE_SETTINGS} onChange={onChange} />
    );
    for (const font of ['serif', 'sans-serif', 'mono'] as const) {
      const group = screen.getByRole('group', { name: 'builder.formatting.linkFontFamily' });
      const index = ['serif', 'sans-serif', 'mono'].indexOf(font);
      fireEvent.click(within(group).getAllByRole('button')[index]);
      const settings = onChange.mock.lastCall![0];
      expect(settings.fontSize).toEqual({ ...DEFAULT_TEMPLATE_SETTINGS.fontSize, linkFont: font });
      rerender(<FormattingControls settings={settings} onChange={onChange} />);
      expect(
        within(
          screen.getByRole('group', { name: 'builder.formatting.linkFontFamily' })
        ).getAllByRole('button')[index]
      ).toHaveAttribute('aria-pressed', 'true');
      const url = new URL(getResumePdfUrl('resume-id', settings), 'http://localhost');
      expect(url.searchParams.get('linkFont')).toBe(font);
      expect(toPageFitSettings(settings).linkFont).toBe(font);
      expect(settingsToCssVars(settings)).toHaveProperty('--link-font', expect.any(String));
    }
  });

  it('restores selected fonts and defaults older saved settings to mono', () => {
    window.localStorage.setItem(
      TEMPLATE_SETTINGS_STORAGE_KEY,
      JSON.stringify({ fontSize: { bodyFont: 'serif' } })
    );
    expect(readStoredTemplateSettings().fontSize.linkFont).toBe('mono');
    window.localStorage.setItem(
      TEMPLATE_SETTINGS_STORAGE_KEY,
      JSON.stringify({ fontSize: { linkFont: 'sans-serif' } })
    );
    expect(readStoredTemplateSettings().fontSize.linkFont).toBe('sans-serif');
  });
});
