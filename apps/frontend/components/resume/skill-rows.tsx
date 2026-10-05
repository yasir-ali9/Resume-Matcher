import type { SkillRow } from '@/components/dashboard/resume-component';
import { normalizeSkillRows } from '@/lib/utils/skill-rows';

export function SkillRows({
  rows,
  headingClassName = '',
}: {
  rows: SkillRow[];
  headingClassName?: string;
}) {
  return (
    <div className="flex flex-col gap-1" style={{ color: 'var(--resume-text-body)' }}>
      {normalizeSkillRows(rows)
        .filter((row) => row.skills.length > 0)
        .map((row) => (
          <div key={row.id} className={row.heading ? '' : 'flex items-baseline gap-2'}>
            {row.heading ? (
              <span
                className={headingClassName}
                style={{ fontWeight: 500, color: 'var(--resume-text-secondary)' }}
              >
                {row.heading.replace(/:\s*$/, '')}:{' '}
              </span>
            ) : (
              <span aria-hidden="true" className="shrink-0">
                •
              </span>
            )}
            <span>{row.skills.join(', ')}</span>
          </div>
        ))}
    </div>
  );
}
