import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { FormattingControls } from '@/components/builder/formatting-controls';
import { DEFAULT_TEMPLATE_SETTINGS, settingsToCssVars } from '@/lib/types/template-settings';
import { DEFAULT_TYPEFACES } from '@/lib/types/resume-fonts';
import { getResumePdfUrl, toPageFitSettings } from '@/lib/api/resume';
import {
  readStoredTemplateSettings,
  TEMPLATE_SETTINGS_STORAGE_KEY,
} from '@/lib/utils/stored-template-settings';
import PrintResumePage from '@/app/print/resumes/[id]/page';

vi.mock('@/lib/i18n', () => ({ useTranslations: () => ({ t: (key: string) => key }) }));
vi.mock('@/components/builder/template-selector', () => ({ TemplateThumbnail: () => null }));

afterEach(() => {
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

describe('named CV fonts', () => {
  it('selects a font per family and preserves the other font and layout settings', () => {
    const onChange = vi.fn();
    render(<FormattingControls settings={DEFAULT_TEMPLATE_SETTINGS} onChange={onChange} />);
    const selectors = screen.getAllByRole('combobox');
    fireEvent.change(selectors[0], { target: { value: 'georgia' } });
    expect(onChange.mock.lastCall![0]).toEqual({
      ...DEFAULT_TEMPLATE_SETTINGS,
      typefaces: { ...DEFAULT_TYPEFACES, serif: 'georgia' },
    });
    fireEvent.change(selectors[1], { target: { value: 'arial' } });
    expect(onChange.mock.lastCall![0].typefaces).toEqual({
      ...DEFAULT_TYPEFACES,
      'sans-serif': 'arial',
    });
    fireEvent.change(selectors[2], { target: { value: 'consolas' } });
    expect(onChange.mock.lastCall![0].typefaces).toEqual({
      ...DEFAULT_TYPEFACES,
      mono: 'consolas',
    });
  });

  it('restores fonts, defaults older settings, and rejects invalid font IDs', () => {
    window.localStorage.setItem(
      TEMPLATE_SETTINGS_STORAGE_KEY,
      JSON.stringify({ typefaces: { serif: 'georgia', mono: 'bogus' } })
    );
    expect(readStoredTemplateSettings().typefaces).toEqual({
      ...DEFAULT_TYPEFACES,
      serif: 'georgia',
    });
    window.localStorage.setItem(
      TEMPLATE_SETTINGS_STORAGE_KEY,
      JSON.stringify({ template: 'clean' })
    );
    expect(readStoredTemplateSettings().typefaces).toEqual(DEFAULT_TYPEFACES);
  });

  it('carries named fonts into preview CSS, export URLs, and page-fit settings', () => {
    const settings = {
      ...DEFAULT_TEMPLATE_SETTINGS,
      typefaces: { serif: 'georgia', 'sans-serif': 'arial', mono: 'consolas' } as const,
    };
    const css = settingsToCssVars(settings, 'ja') as Record<string, string>;
    expect(css['--header-font']).toMatch(/^"Georgia", /);
    expect(css['--body-font']).toMatch(/^"Arial", /);
    expect(css['--link-font']).toMatch(/^"Consolas", /);
    expect(css['--header-font']).toContain('var(--font-noto-sans-jp)');
    const url = new URL(getResumePdfUrl('resume-id', settings), 'http://localhost');
    expect(url.searchParams.get('serifTypeface')).toBe('georgia');
    expect(url.searchParams.get('sansTypeface')).toBe('arial');
    expect(url.searchParams.get('monoTypeface')).toBe('consolas');
    expect(toPageFitSettings(settings)).toMatchObject({
      serifTypeface: 'georgia',
      sansTypeface: 'arial',
      monoTypeface: 'consolas',
    });
  });

  it('applies named fonts on the actual print route', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: { processed_resume: { personalInfo: { name: 'Jane' } } } }),
      })
    );
    const element = await PrintResumePage({
      params: Promise.resolve({ id: 'r1' }),
      searchParams: Promise.resolve({
        serifTypeface: 'georgia',
        sansTypeface: 'arial',
        monoTypeface: 'consolas',
      }),
    });
    const { container } = render(element);
    const resume = container.querySelector('.resume-template-swiss-single') as HTMLElement;
    expect(resume.style.getPropertyValue('--header-font')).toMatch(/^"Georgia", /);
    expect(resume.style.getPropertyValue('--body-font')).toMatch(/^"Arial", /);
    expect(resume.style.getPropertyValue('--link-font')).toMatch(/^"Consolas", /);
  });
});
