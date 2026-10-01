import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { Clock, Eye, LogOut, Play, RotateCcw, Stethoscope, ZoomIn } from 'lucide-react';
import { isWingId, type WingId } from '../../content/wings';
import { t, tDynamic, type I18nKey } from '../../i18n/t';
import { useSettings } from '../../stores/settingsStore';
import { useSceneStore } from '../../stores/sceneStore';
import { Button } from '../../ui/Button';
import { GlassCard } from '../../ui/GlassCard';
import { Badge } from '../../ui/Badge';
import { ScreenHeader } from '../../app/screens/ScreenHeader';
import { SIDE_PANEL_W, WIDE_LAYOUT } from '../../app/constants';
import { formatClock, type WorkPhase } from './caseRunner';
import { useConsultationGarde } from './useConsultationGarde';
import { InterrogatoirePanel } from './panels/InterrogatoirePanel';
import { ExamenPanel, FindingCard, ZonePicker } from './panels/ExamenPanel';
import { NotesPanel } from './panels/NotesPanel';
import { SynthesePanel } from './panels/SynthesePanel';
import { FeedbackPanel } from './panels/FeedbackPanel';

type Tab = WorkPhase | 'notes';
const TABS: Tab[] = ['interrogatoire', 'examen', 'notes', 'synthese'];

function useWide() {
  const [wide, setWide] = useState(() => window.innerWidth >= WIDE_LAYOUT);
  useEffect(() => {
    const on = () => setWide(window.innerWidth >= WIDE_LAYOUT);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return wide;
}

export function ConsultationScreen() {
  const { wingId } = useParams();
  const wing: WingId | 'toutes' = isWingId(wingId) ? wingId : 'toutes';
  const includeDrafts = useSettings((s) => s.settings.includeDrafts);
  const g = useConsultationGarde(wing, includeDrafts);
  const backTo = wing === 'toutes' ? '/' : `/aile/${wing}`;

  if (!g.garde) return <Setup wing={wing} backTo={backTo} g={g} />;
  if (g.garde.finished) return <Summary g={g} backTo={backTo} />;
  return <Playing g={g} backTo={backTo} />;
}

type Garde = ReturnType<typeof useConsultationGarde>;

function Setup({ wing, backTo, g }: { wing: WingId | 'toutes'; backTo: string; g: Garde }) {
  return (
    <>
      <ScreenHeader to={backTo} label={t('nav.back')} />
      <h1 className="diorama-title mt-3 px-4 text-center text-4xl sm:text-6xl">{t('consult.title')}</h1>
      <p className="diorama-title px-4 text-center text-lg opacity-80">{tDynamic(`wings.${wing}.title`)}</p>
      <div className="flex-1" />
      <motion.div
        className="pointer-events-auto px-4 pb-[max(16px,env(safe-area-inset-bottom))]"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      >
        <GlassCard className="mx-auto max-w-xl p-5">
          {g.pool.length === 0 ? (
            <p className="font-semibold">{t('consult.empty')}</p>
          ) : (
            <>
              <p className="text-ink-soft">{t('consult.intro')}</p>
              <div className="mt-2">
                <Badge>{t('consult.patients', { count: Math.min(10, g.pool.length) })}</Badge>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                {g.saved && (
                  <Button size="lg" variant="gold" icon={<Play size={20} aria-hidden />} onClick={g.resume} data-testid="resume-garde">
                    {t('consult.resume')}
                  </Button>
                )}
                <Button
                  size="lg"
                  variant={g.saved ? 'soft' : 'primary'}
                  icon={g.saved ? <RotateCcw size={20} aria-hidden /> : <Stethoscope size={20} aria-hidden />}
                  onClick={() => void g.start()}
                  disabled={!g.loaded}
                  data-testid="start-garde"
                >
                  {g.saved ? t('consult.restart') : t('consult.start')}
                </Button>
              </div>
            </>
          )}
        </GlassCard>
      </motion.div>
    </>
  );
}

function Playing({ g, backTo }: { g: Garde; backTo: string }) {
  const navigate = useNavigate();
  const wide = useWide();
  const showDarija = useSettings((s) => s.settings.showDarija);
  const c = g.currentCase!;
  const runner = g.garde!.runner;
  const [tab, setTab] = useState<Tab>('interrogatoire');
  const [picker, setPicker] = useState<string | null>(null);
  const [findingOpen, setFindingOpen] = useState(false);
  const pickedZone = useSceneStore((s) => s.pickedZone);

  const patientIndex = g.garde!.index;
  // New patient: back to the first tab.
  useEffect(() => {
    setTab('interrogatoire');
    setPicker(null);
    setFindingOpen(false);
  }, [c.id, patientIndex]);

  // A body zone tapped in 3D opens the same tool menu as the 2D list.
  useEffect(() => {
    if (!pickedZone) return;
    setPicker(pickedZone.root);
    setFindingOpen(false);
    setTab('examen');
  }, [pickedZone]);

  useEffect(() => g.setActiveRoot(picker), [picker]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close-up view to examine and to read the feedback highlights; room view to talk.
  useEffect(() => {
    if (runner.phase === 'feedback' || tab === 'examen') g.setView('close');
    else if (tab === 'interrogatoire') g.setView('room');
  }, [tab, runner.phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const goTab = (next: Tab) => {
    setTab(next);
    if (next !== 'notes') g.dispatch({ type: 'GO', phase: next });
  };

  const isFeedback = runner.phase === 'feedback';
  const last = g.garde!.index + 1 >= g.garde!.slots.length;

  const panelBody = isFeedback ? (
    <FeedbackPanel c={c} runner={runner} answer={runner.result?.answer ?? null} last={last} onNext={g.next} />
  ) : tab === 'interrogatoire' ? (
    <InterrogatoirePanel c={c} runner={runner} onAsk={(i) => g.dispatch({ type: 'ASK', index: i })} />
  ) : tab === 'examen' ? (
    <ExamenPanel c={c} runner={runner} onPickRoot={(root) => setPicker(root)} />
  ) : tab === 'notes' ? (
    <NotesPanel c={c} runner={runner} note={g.garde!.notes[c.id] ?? ''} onNote={(s) => g.setNote(c.id, s)} />
  ) : (
    <SynthesePanel key={`${c.id}-${g.garde!.index}`} c={c} onSubmit={g.submit} />
  );

  const overlay = (
    <AnimatePresence mode="wait">
      {!isFeedback && picker && !findingOpen && (
        <ZonePicker
          key={picker}
          root={picker}
          onClose={() => setPicker(null)}
          onExamine={(zone, tool) => {
            g.dispatch({ type: 'EXAMINE', zone, tool });
            setFindingOpen(true);
          }}
        />
      )}
      {!isFeedback && findingOpen && runner.lastExam && (
        <FindingCard
          key={`f${runner.lastExam.seq}`}
          c={c}
          runner={runner}
          onClose={() => {
            setFindingOpen(false);
          }}
        />
      )}
    </AnimatePresence>
  );

  return (
    <>
      {/* HUD: clock, view toggle, patient card */}
      <div className="pointer-events-auto flex items-start gap-2 px-4 pt-[max(12px,env(safe-area-inset-top))]" style={wide ? { marginRight: SIDE_PANEL_W } : undefined}>
        <div className="glass flex h-11 shrink-0 items-center gap-1.5 rounded-2xl px-3 font-extrabold tabular-nums" aria-label={t('consult.clock')}>
          <Clock size={18} className="text-accent" aria-hidden />
          <span data-testid="clock">{formatClock(runner.clock)}</span>
        </div>
        <button
          type="button"
          onClick={() => g.setView(g.view === 'room' ? 'close' : 'room')}
          className="glass flex h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-2xl px-2.5 text-sm font-extrabold"
          data-testid="toggle-view"
          aria-label={g.view === 'room' ? t('consult.view.close') : t('consult.view.room')}
        >
          {g.view === 'room' ? <ZoomIn size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
          <span className="hidden sm:inline">{g.view === 'room' ? t('consult.view.close') : t('consult.view.room')}</span>
        </button>
        <div className="glass min-w-0 flex-1 rounded-2xl px-3 py-1.5 text-right">
          <div className="truncate text-sm font-extrabold">
            {c.patient.name}, {t('consult.years', { n: c.patient.age })}
          </div>
          <div className="truncate text-xs text-ink-soft">{c.chiefComplaint}</div>
        </div>
        <button type="button" onClick={() => navigate(backTo)} className="glass flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" aria-label={t('consult.quit')}>
          <LogOut size={18} aria-hidden />
        </button>
      </div>

      {/* Arrival card */}
      <AnimatePresence>
        {runner.phase === 'arrival' && (
          <motion.div
            className="pointer-events-auto absolute inset-x-0 bottom-0 px-4 pb-[max(16px,env(safe-area-inset-bottom))]"
            style={wide ? { right: SIDE_PANEL_W } : undefined}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          >
            <GlassCard className="mx-auto max-w-lg p-5">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge>{t('consult.arrival')}</Badge>
                {g.slot?.kind === 'due' && <Badge tone="followUp">{t('consult.followUp')}</Badge>}
                {c.status === 'draft' && <Badge tone="draft">{t('consult.draft')}</Badge>}
              </div>
              <h2 className="mt-2 text-2xl font-extrabold">
                {c.patient.name}, {t('consult.years', { n: c.patient.age })}
              </h2>
              <p className="text-sm text-ink-soft">
                {c.patient.profession} · {c.patient.origin}
              </p>
              <p className="mt-3 text-xs font-bold tracking-wide text-ink-soft uppercase">{t('consult.motif')}</p>
              <p className="text-lg font-extrabold">« {c.chiefComplaint} »</p>
              {showDarija && c.patient.darija && (
                <div className="mt-3 rounded-2xl rounded-tl-sm bg-white/90 px-3 py-2 dark:bg-white/10">
                  <p className="font-bold italic">« {c.patient.darija} »</p>
                  {c.patient.darijaTranslation && <p className="text-sm text-ink-soft">« {c.patient.darijaTranslation} »</p>}
                </div>
              )}
              <Button size="lg" className="mt-4 w-full" onClick={() => g.dispatch({ type: 'BEGIN' })} data-testid="begin">
                {t('consult.begin')}
              </Button>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1" />

      {/* Bottom sheet (phones) or side panel (wide screens) with the four tabs */}
      {runner.phase !== 'arrival' && (
        <div
          className={`pointer-events-auto ${
            wide ? 'absolute top-0 right-0 bottom-0 flex flex-col p-3' : 'relative flex h-[50dvh] flex-col px-2 pb-[max(8px,env(safe-area-inset-bottom))]'
          }`}
          style={wide ? { width: SIDE_PANEL_W } : undefined}
        >
          {/* Zone picker / finding card float just above the sheet on phones, at the top of the panel on wide screens */}
          <div className="glass flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl">
            {!isFeedback && (
              <div role="tablist" className="flex gap-1 p-1.5">
                {TABS.map((id) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={tab === id}
                    data-testid={`tab-${id}`}
                    onClick={() => goTab(id)}
                    className={`min-h-11 flex-1 rounded-2xl px-1 text-xs font-extrabold sm:text-sm ${tab === id ? 'bg-accent text-white' : 'text-ink-soft hover:text-ink'}`}
                  >
                    {t(`consult.tabs.${id}` as I18nKey)}
                  </button>
                ))}
              </div>
            )}
            <div className="px-2">{overlay}</div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3 pt-1">{panelBody}</div>
          </div>
        </div>
      )}
    </>
  );
}

function Summary({ g, backTo }: { g: Garde; backTo: string }) {
  const o = g.garde!.outcomes;
  const total = o.reduce((a, x) => a + x.score, 0);
  const stats = [
    { label: t('consult.summary.patients'), value: o.length },
    { label: t('consult.summary.correct'), value: o.filter((x) => x.correct).length },
    { label: t('consult.summary.score'), value: total },
    { label: t('consult.summary.xp'), value: `+${Math.round(total / 10)}` },
  ];
  return (
    <>
      <h1 className="diorama-title mt-[max(24px,env(safe-area-inset-top))] px-4 text-center text-4xl sm:text-6xl">{t('consult.summary.title')}</h1>
      <div className="flex-1" />
      <div className="pointer-events-auto px-4 pb-[max(16px,env(safe-area-inset-bottom))]">
        <GlassCard className="mx-auto max-w-xl p-5 text-center" data-testid="garde-summary">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl bg-surface-strong p-2">
                <div className="text-xs text-ink-soft">{s.label}</div>
                <div className="text-xl font-extrabold tabular-nums">{s.value}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-ink-soft">
            {t('consult.summary.end')} : {formatClock(g.garde!.runner.clock)}
          </p>
          {g.saveState === 'saved' && <p className="mt-1 text-xs font-bold text-ink-soft">✓ {t('result.saved')}</p>}
          <div className="mt-4 flex gap-2">
            <Link to={backTo} className="toy-btn soft flex min-h-12 flex-1 items-center justify-center rounded-2xl font-extrabold">
              {t('consult.summary.back')}
            </Link>
            <Button className="flex-1" onClick={() => void g.start()} icon={<RotateCcw size={18} aria-hidden />}>
              {t('consult.restart')}
            </Button>
          </div>
        </GlassCard>
      </div>
    </>
  );
}
