import { useLiveQuery } from 'dexie-react-hooks';
import { ClipboardList } from 'lucide-react';
import { itemsById } from '../../content';
import { t } from '../../i18n/t';
import { lastSessionWithReview } from '../../db/repositories';
import { GlassCard } from '../../ui/GlassCard';
import { Badge } from '../../ui/Badge';
import { ScreenHeader } from './ScreenHeader';

/** Staff / RMM: a cozy review of the last session's mistakes (README §5.2). */
export function StaffScreen() {
  const session = useLiveQuery(() => lastSessionWithReview(), [], undefined);
  const entries = session?.review?.filter((r) => r.quality < 4) ?? [];
  const date = session ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' }).format(session.startedAt) : '';

  return (
    <>
      <ScreenHeader />
      <div className="pointer-events-auto mt-3 flex-1 overflow-y-auto px-4 pb-[max(24px,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-2xl flex-col gap-3" data-testid="staff">
          <h1 className="diorama-title text-center text-4xl">{t('staff.title')}</h1>
          <GlassCard className="flex gap-3 p-4">
            <ClipboardList className="shrink-0 text-accent" size={28} aria-hidden />
            <div>
              <p>{t('staff.intro')}</p>
              {session && <p className="mt-1 text-xs font-bold text-ink-soft">{t('staff.session', { date })}</p>}
            </div>
          </GlassCard>
          {session !== undefined && entries.length === 0 && <GlassCard className="p-4 text-center font-semibold">{t('staff.empty')}</GlassCard>}
          {entries.map((e) => {
            const item = itemsById.get(e.itemId);
            if (!item) return null;
            return (
              <GlassCard key={e.itemId} className="p-4 text-sm">
                <div className="mb-1 flex flex-wrap gap-1.5">{item.status === 'draft' && <Badge tone="draft">{t('fiches.draft')}</Badge>}</div>
                {item.type === 'case' ? (
                  <>
                    <h2 className="text-base font-extrabold">
                      {item.patient.name}, {t('consult.years', { n: item.patient.age })} — {item.chiefComplaint}
                    </h2>
                    <p className="mt-2">
                      <b>{t('staff.expected')} :</b> {item.answer.syndrome.join(' + ')}
                      {item.answer.etiology ? ` — ${item.answer.etiology}` : ''}
                    </p>
                    <p className="text-ink-soft">
                      <b>{t('staff.given')} :</b> {e.given || t('staff.skipped')}
                    </p>
                    {!!e.missed?.length && (
                      <>
                        <p className="mt-2 font-bold text-[#c4651f]">{t('staff.missed')}</p>
                        <ul className="ml-4 list-disc">
                          {e.missed.map((m) => (
                            <li key={m}>{m}</li>
                          ))}
                        </ul>
                      </>
                    )}
                    <p className="mt-2 rounded-xl border-2 border-dashed border-[color-mix(in_oklab,var(--accent)_45%,transparent)] p-2">
                      📋 <b>{t('staff.fiche')} :</b> {item.teaching}
                    </p>
                  </>
                ) : item.type === 'card' ? (
                  <>
                    <h2 className="text-base font-extrabold">{item.front}</h2>
                    <p className="mt-1">
                      <b>{t('staff.expected')} :</b> {item.term ? `${item.term} — ${item.back}` : item.back}
                    </p>
                    <p className="text-ink-soft">
                      <b>{t('staff.given')} :</b> {e.given || t('staff.skipped')}
                    </p>
                    {item.explanation && <p className="mt-1 text-ink-soft">{item.explanation}</p>}
                  </>
                ) : null}
              </GlassCard>
            );
          })}
        </div>
      </div>
    </>
  );
}
