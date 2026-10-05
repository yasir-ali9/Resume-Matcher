import type { AdditionalInfo, SkillRow } from '@/components/dashboard/resume-component';

export function normalizeSkillRows(value: unknown): SkillRow[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((row) => row && typeof row === 'object' && !Array.isArray(row))
    .map((row, index) => ({
      id: typeof row.id === 'string' && row.id ? row.id : `skill-row-${index}`,
      heading: typeof row.heading === 'string' ? row.heading.trim() : '',
      skills: Array.isArray(row.skills)
        ? row.skills
            .filter(
              (skill: unknown): skill is string => typeof skill === 'string' && !!skill.trim()
            )
            .map((skill: string) => skill.trim())
        : [],
    }));
}

export function getTechnicalSkills(additional?: AdditionalInfo): string[] {
  if (Array.isArray(additional?.skillRows))
    return normalizeSkillRows(additional.skillRows).flatMap((row) => row.skills);
  return (additional?.technicalSkills ?? []).filter(
    (skill) => typeof skill === 'string' && !!skill.trim()
  );
}
