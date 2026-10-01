import type { ClinicalCase } from '../../../content/schemas';
import { t, tDynamic } from '../../../i18n/t';
import type { RunnerState } from '../caseRunner';
import { TOOL_ICONS } from '../zoneTree';

export function NotesPanel({ c, runner, note, onNote }: { c: ClinicalCase; runner: RunnerState; note: string; onNote: (s: string) => void }) {
  const empty = !runner.asked.length && !runner.actions.length;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-ink-soft">{t('consult.notesHint')}</p>
      {empty ? (
        <p className="rounded-2xl bg-surface-strong p-3 text-sm text-ink-soft">{t('consult.notesEmpty')}</p>
      ) : (
        <ul className="flex flex-col gap-1.5 text-sm">
          <li className="font-bold">{c.chiefComplaint}</li>
          {runner.asked.map((i) => (
            <li key={`q${i}`} className="rounded-xl bg-surface-strong px-3 py-1.5">
              {c.history[i]!.a}
            </li>
          ))}
          {runner.actions.map((a) => (
            <li key={`${a.zone}-${a.tool}`} className="rounded-xl bg-surface-strong px-3 py-1.5">
              <span className="mr-1">{TOOL_ICONS[a.tool]}</span>
              <span className="font-bold">{tDynamic(`zones.${a.zone}`)} : </span>
              {a.findings.length ? a.findings.map((i) => c.exam[i]!.finding).join(' ') : tDynamic(`normal.${a.tool}`)}
            </li>
          ))}
        </ul>
      )}
      <label className="block">
        <span className="mb-1 block text-sm font-bold">{t('consult.notesFree')}</span>
        <textarea
          value={note}
          onChange={(e) => onNote(e.target.value)}
          placeholder={t('consult.notesPlaceholder')}
          rows={3}
          className="w-full rounded-2xl border-0 bg-surface-strong p-3 text-sm text-ink focus-visible:outline-3 focus-visible:outline-gold"
        />
      </label>
    </div>
  );
}
