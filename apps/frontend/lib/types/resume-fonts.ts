export type FontCategory = 'serif' | 'sans-serif' | 'mono';

export const FONT_FACE_OPTIONS = {
  serif: [
    { id: 'default', name: 'Default' },
    { id: 'georgia', name: 'Georgia' },
    { id: 'times-new-roman', name: 'Times New Roman' },
    { id: 'cambria', name: 'Cambria' },
    { id: 'garamond', name: 'Garamond' },
  ],
  'sans-serif': [
    { id: 'default', name: 'Default' },
    { id: 'arial', name: 'Arial' },
    { id: 'calibri', name: 'Calibri' },
    { id: 'segoe-ui', name: 'Segoe UI' },
    { id: 'verdana', name: 'Verdana' },
    { id: 'trebuchet-ms', name: 'Trebuchet MS' },
  ],
  mono: [
    { id: 'default', name: 'Default' },
    { id: 'consolas', name: 'Consolas' },
    { id: 'courier-new', name: 'Courier New' },
    { id: 'lucida-console', name: 'Lucida Console' },
  ],
} as const;

export type LocalTypeface = `local:${string}`;
export type SerifTypeface = (typeof FONT_FACE_OPTIONS.serif)[number]['id'] | LocalTypeface;
export type SansTypeface = (typeof FONT_FACE_OPTIONS)['sans-serif'][number]['id'] | LocalTypeface;
export type MonoTypeface = (typeof FONT_FACE_OPTIONS.mono)[number]['id'] | LocalTypeface;

export function getLocalFontName(value: unknown): string | null {
  if (typeof value !== 'string' || !value.startsWith('local:')) return null;
  const name = value.slice(6);
  if (!name.trim() || name.length > 180) return null;
  if (Array.from(name).some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127))
    return null;
  return name;
}

export interface TypefaceSettings {
  serif: SerifTypeface;
  'sans-serif': SansTypeface;
  mono: MonoTypeface;
}

export const DEFAULT_TYPEFACES: TypefaceSettings = {
  serif: 'default',
  'sans-serif': 'default',
  mono: 'default',
};

/** Resolve saved/query values through the catalog before using them in CSS. */
export function parseTypeface<C extends FontCategory>(
  category: C,
  value: unknown
): TypefaceSettings[C] {
  if (getLocalFontName(value)) return value as TypefaceSettings[C];
  const option = FONT_FACE_OPTIONS[category].find((font) => font.id === value);
  return (option?.id ?? 'default') as TypefaceSettings[C];
}

export function withSelectedTypeface(category: FontCategory, value: unknown, fallback: string) {
  const localName = getLocalFontName(value);
  if (localName) {
    const escapedName = localName.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return `"${escapedName}", ${fallback}`;
  }
  const option = FONT_FACE_OPTIONS[category].find((font) => font.id === value);
  return option && option.id !== 'default' ? `"${option.name}", ${fallback}` : fallback;
}
