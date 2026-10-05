export const DEFAULT_RESUME_COLORS = {
  headings: '#000000',
  subheadings: '#374151',
  description: '#1f2937',
  secondary: '#4b5563',
  links: '#1f2937',
  underline: '#6b7280',
  divider: '#d1d5db',
};

export type ResumeColorKey = keyof typeof DEFAULT_RESUME_COLORS;
export type ResumeColors = Record<ResumeColorKey, string>;

export function parseResumeColor(value: unknown, fallback: string): string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)
    ? value.toLowerCase()
    : fallback;
}

export function resolveResumeColors(colors?: Partial<ResumeColors>): ResumeColors {
  return Object.fromEntries(
    Object.entries(DEFAULT_RESUME_COLORS).map(([key, fallback]) => [
      key,
      parseResumeColor(colors?.[key as ResumeColorKey], fallback),
    ])
  ) as ResumeColors;
}
