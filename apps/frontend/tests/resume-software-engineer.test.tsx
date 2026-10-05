import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import Resume, { type ResumeData } from '@/components/dashboard/resume-component';
import { applyTemplatePreset, DEFAULT_TEMPLATE_SETTINGS } from '@/lib/types/template-settings';
import PrintResumePage from '@/app/print/resumes/[id]/page';

vi.mock('@/lib/i18n', () => ({ useTranslations: () => ({ t: (key: string) => key }) }));

const data: ResumeData = {
  personalInfo: { name: 'Jane Engineer', email: 'jane@example.com', github: 'github.com/jane' },
  summary: 'Builds reliable software.',
  workExperience: [
    {
      id: 1,
      company: 'Example',
      title: 'Engineer',
      years: '2024-Present',
      description: ['Built APIs.'],
    },
  ],
  education: [],
  personalProjects: [],
  additional: { technicalSkills: ['TypeScript', 'Python'] },
};

afterEach(() => vi.unstubAllGlobals());

describe('Software Engineer template', () => {
  it('groups project links and dates separately from the name without empty separators', () => {
    const { container } = render(
      <Resume
        resumeData={{
          ...data,
          personalProjects: [
            {
              id: 1,
              name: 'Full Project',
              github: 'github.com/jane/project',
              website: 'project.dev',
              years: '2025',
              description: [],
            },
            { id: 2, name: 'Website Only', website: 'other.dev', description: [] },
          ],
        }}
        settings={applyTemplatePreset(DEFAULT_TEMPLATE_SETTINGS, 'software-engineer')}
      />
    );
    const github = container.querySelector('a[href="https://github.com/jane/project"]')!;
    expect(github.textContent).toBe('project');
    expect(github.parentElement!.textContent).toBe('project|project.dev|2025');
    expect(github.parentElement!.previousElementSibling!.textContent).toBe('Full Project');
    const websiteOnly = container.querySelector('a[href="https://other.dev"]')!;
    expect(websiteOnly.parentElement!.textContent).toBe('other.dev');
  });

  it('renders the same content and links as Clean under its own template identity', () => {
    const cleanSettings = applyTemplatePreset(DEFAULT_TEMPLATE_SETTINGS, 'clean');
    const softwareSettings = applyTemplatePreset(DEFAULT_TEMPLATE_SETTINGS, 'software-engineer');
    expect(softwareSettings.fontSize).toEqual(cleanSettings.fontSize);
    const clean = render(<Resume resumeData={data} settings={cleanSettings} />);
    const software = render(<Resume resumeData={data} settings={softwareSettings} />);
    expect(software.container.querySelector('.resume-template-software-engineer')).not.toBeNull();
    expect(software.container.textContent).toBe(clean.container.textContent);
    const links = (container: HTMLElement) =>
      Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(links(software.container)).toEqual(links(clean.container));
  });

  it('accepts the new template in the PDF print route', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: { processed_resume: data } }),
      })
    );
    const element = await PrintResumePage({
      params: Promise.resolve({ id: 'resume-id' }),
      searchParams: Promise.resolve({
        template: 'software-engineer',
        headerFont: 'sans-serif',
        bodyFont: 'sans-serif',
      }),
    });
    const { container } = render(element);
    expect(
      container.querySelector('.resume-print .resume-template-software-engineer')
    ).not.toBeNull();
    expect(container.textContent).toContain('Jane Engineer');
    expect(container.textContent).toContain('Built APIs.');
  });
});
