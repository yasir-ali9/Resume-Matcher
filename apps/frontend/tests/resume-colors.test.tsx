import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { FormattingControls } from '@/components/builder/formatting-controls';
import { DEFAULT_TEMPLATE_SETTINGS, settingsToCssVars } from '@/lib/types/template-settings';
import { DEFAULT_RESUME_COLORS } from '@/lib/types/resume-colors';
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

describe('CV text colors', () => {
  it('changes a chosen color independently and resets only colors', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <FormattingControls settings={DEFAULT_TEMPLATE_SETTINGS} onChange={onChange} />
    );
    fireEvent.change(screen.getByLabelText('builder.formatting.colorLabels.description'), {
      target: { value: '#123456' },
    });
    const settings = onChange.mock.lastCall![0];
    expect(settings).toEqual({
      ...DEFAULT_TEMPLATE_SETTINGS,
      colors: { ...DEFAULT_RESUME_COLORS, description: '#123456' },
    });
    rerender(<FormattingControls settings={settings} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'builder.formatting.resetColors' }));
    expect(onChange.mock.lastCall![0]).toEqual(DEFAULT_TEMPLATE_SETTINGS);
  });

  it('restores colors, fills older settings, and rejects invalid saved values', () => {
    window.localStorage.setItem(
      TEMPLATE_SETTINGS_STORAGE_KEY,
      JSON.stringify({ colors: { links: '#AB1234', headings: 'red; color: white' } })
    );
    expect(readStoredTemplateSettings().colors).toEqual({
      ...DEFAULT_RESUME_COLORS,
      links: '#ab1234',
    });
    window.localStorage.setItem(
      TEMPLATE_SETTINGS_STORAGE_KEY,
      JSON.stringify({ template: 'clean' })
    );
    expect(readStoredTemplateSettings().colors).toEqual(DEFAULT_RESUME_COLORS);
  });

  it('passes chosen colors to preview CSS, PDF export, and page-fit settings', () => {
    const settings = {
      ...DEFAULT_TEMPLATE_SETTINGS,
      colors: {
        ...DEFAULT_RESUME_COLORS,
        headings: '#111122',
        links: '#223344',
        underline: '#556677',
      },
    };
    expect(settingsToCssVars(settings)).toMatchObject({
      '--resume-text-primary': '#111122',
      '--resume-link-color': '#223344',
      '--resume-link-underline-color': '#556677',
    });
    const url = new URL(getResumePdfUrl('r1', settings), 'http://localhost');
    expect(url.searchParams.get('headingsColor')).toBe('#111122');
    expect(url.searchParams.get('linksColor')).toBe('#223344');
    expect(toPageFitSettings(settings)).toMatchObject({
      headingsColor: '#111122',
      linksColor: '#223344',
      underlineColor: '#556677',
    });
  });

  it('applies colors on the PDF print route', async () => {
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
        headingsColor: '#111122',
        linksColor: '#223344',
        underlineColor: '#556677',
      }),
    });
    const { container } = render(element);
    const resume = container.querySelector('.resume-template-swiss-single') as HTMLElement;
    expect(resume.style.getPropertyValue('--resume-text-primary')).toBe('#111122');
    expect(resume.style.getPropertyValue('--resume-link-color')).toBe('#223344');
    expect(resume.style.getPropertyValue('--resume-link-underline-color')).toBe('#556677');
  });
});
