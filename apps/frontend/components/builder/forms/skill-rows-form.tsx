'use client';

import type { SkillRow } from '@/components/dashboard/resume-component';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { useTranslations } from '@/lib/i18n';

export function SkillRowsForm({
  rows,
  onChange,
}: {
  rows: SkillRow[];
  onChange: (rows: SkillRow[]) => void;
}) {
  const { t } = useTranslations();
  const update = (index: number, change: Partial<SkillRow>) =>
    onChange(rows.map((row, position) => (position === index ? { ...row, ...change } : row)));
  const move = (index: number, offset: number) => {
    const reordered = [...rows];
    [reordered[index], reordered[index + offset]] = [reordered[index + offset], reordered[index]];
    onChange(reordered);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-ink-soft">{t('builder.additionalForm.skillRowsHint')}</p>
      {rows.map((row, index) => (
        <div key={row.id} className="space-y-2 border border-steel-grey bg-white p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-ink-soft">
              {t('builder.additionalForm.skillRow', { number: index + 1 })}
            </span>
            <div className="flex gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={index === 0}
                aria-label={t('builder.additionalForm.moveRowUp')}
                onClick={() => move(index, -1)}
              >
                <ArrowUp size={14} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={index === rows.length - 1}
                aria-label={t('builder.additionalForm.moveRowDown')}
                onClick={() => move(index, 1)}
              >
                <ArrowDown size={14} />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={t('builder.additionalForm.removeRow')}
                onClick={() => onChange(rows.filter((_, position) => position !== index))}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
          <label className="block space-y-1">
            <span className="text-xs text-ink-soft">{t('builder.additionalForm.rowHeading')}</span>
            <Input
              value={row.heading ?? ''}
              onChange={(event) => update(index, { heading: event.target.value })}
              placeholder={t('builder.additionalForm.rowHeadingPlaceholder')}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-ink-soft">{t('builder.additionalForm.rowSkills')}</span>
            <Textarea
              value={row.skills.join(',')}
              onChange={(event) => update(index, { skills: event.target.value.split(',') })}
              placeholder={t('builder.additionalForm.rowSkillsPlaceholder')}
              className="min-h-[64px]"
            />
          </label>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...rows, { id: crypto.randomUUID(), heading: '', skills: [] }])}
      >
        <Plus size={14} className="mr-1" />
        {t('builder.additionalForm.addSkillRow')}
      </Button>
    </div>
  );
}
