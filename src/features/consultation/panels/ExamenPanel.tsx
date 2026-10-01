import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, X } from 'lucide-react';
import type { ClinicalCase } from '../../../content/schemas';
import { toolsForZone, type Tool } from '../../../content/zones';
import { t, tDynamic } from '../../../i18n/t';
import { EXAM_ANIMATION_MS } from '../../../app/constants';
import type { RunnerState } from '../caseRunner';
import { ABDOMEN_GRID, EXAM_ROOTS, leafGroups, TOOL_ICONS } from '../zoneTree';

/** Region list (2D equivalent of the 3D hotspots) and the revealed findings. */
export function ExamenPanel({ c, runner, onPickRoot }: { c: ClinicalCase; runner: RunnerState; onPickRoot: (root: string) => void }) {
  return (
    <div>
      <p className="mb-2 text-sm text-ink-soft">{t('consult.examHint')}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {EXAM_ROOTS.map((root) => (
          <button
            key={root}
            type="button"
            data-testid={`zone-${root}`}
            onClick={() => onPickRoot(root)}
            className="toy-btn soft min-h-11 rounded-2xl px-2 py-2 text-sm font-extrabold"
          >
            {tDynamic(`zones.${root}`)}
          </button>
        ))}
      </div>
      {runner.actions.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {[...runner.actions].reverse().map((a) => (
            <li key={`${a.zone}-${a.tool}`} className="rounded-2xl bg-surface-strong p-3 text-sm">
              <div className="text-xs font-extrabold text-ink-soft">
                {TOOL_ICONS[a.tool]} {tDynamic(`tools.${a.tool}`)} · {tDynamic(`zones.${a.zone}`)}
              </div>
              {a.findings.length ? (
                a.findings.map((i) => <p key={i}>{c.exam[i]!.finding}</p>)
              ) : (
                <p className="text-ink-soft">{tDynamic(`normal.${a.tool}`)}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface ZonePickerProps {
  root: string;
  onExamine: (zone: string, tool: Tool) => void;
  onClose: () => void;
}

/** Radial-style tool menu for a body region: choose the precise sub-zone, then a tool (README §4.3). */
export function ZonePicker({ root, onExamine, onClose }: ZonePickerProps) {
  const groups = leafGroups(root);
  const leaves = groups.flatMap((g) => g.leaves);
  const [zone, setZone] = useState<string | null>(leaves.length === 1 ? leaves[0]! : null);
  useEffect(() => setZone(leaves.length === 1 ? leaves[0]! : null), [root]); // eslint-disable-line react-hooks/exhaustive-deps
  const tools = toolsForZone(root);

  return (
    <motion.div
      initial={{ y: 24, opacity: 0, scale: 0.97 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: 24, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      className="glass rounded-3xl p-4"
      role="dialog"
      aria-label={tDynamic(`zones.${root}`)}
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-lg font-extrabold">{tDynamic(`zones.${root}`)}</h3>
        <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-xl" aria-label={t('consult.close')}>
          <X size={20} aria-hidden />
        </button>
      </div>

      {leaves.length > 1 && (
        <div className="mb-3">
          <p className="mb-1 text-sm font-bold text-ink-soft">{t('consult.subzone')}</p>
          {root === 'abdomen' ? (
            <>
              <div className="grid grid-cols-3 gap-1.5">
                {ABDOMEN_GRID.map((z) => (
                  <ZoneChip key={z} id={z} active={zone === z} onClick={() => setZone(z)} />
                ))}
              </div>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                {leaves
                  .filter((z) => !ABDOMEN_GRID.includes(z))
                  .map((z) => (
                    <ZoneChip key={z} id={z} active={zone === z} onClick={() => setZone(z)} />
                  ))}
              </div>
            </>
          ) : (
            groups.map((g) => (
              <div key={g.parent} className="mb-1.5">
                {groups.length > 1 && <div className="mb-1 text-xs font-bold text-ink-soft">{tDynamic(`zones.${g.parent}`)}</div>}
                <div className="flex flex-wrap gap-1.5">
                  {g.leaves.map((z) => (
                    <ZoneChip key={z} id={z} active={zone === z} onClick={() => setZone(z)} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <p className="mb-1 text-sm font-bold text-ink-soft">{t('consult.chooseTool')}</p>
      <div className="grid grid-cols-3 gap-2">
        {(['inspection', 'palpation', 'percussion', 'auscultation', 'marteau', 'lampe'] as Tool[]).map((tool) => {
          const enabled = tools.includes(tool) && !!zone;
          return (
            <button
              key={tool}
              type="button"
              data-testid={`tool-${tool}`}
              disabled={!enabled}
              onClick={() => zone && onExamine(zone, tool)}
              className="toy-btn flex min-h-14 flex-col items-center justify-center rounded-2xl px-1 text-xs font-extrabold"
            >
              <span className="text-xl" aria-hidden>
                {TOOL_ICONS[tool]}
              </span>
              {tDynamic(`tools.${tool}`)}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

function ZoneChip({ id, active, onClick }: { id: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      data-testid={`sub-${id}`}
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-11 rounded-xl px-2 py-1 text-xs leading-tight font-bold transition-colors ${
        active ? 'bg-accent text-white' : 'bg-surface-strong text-ink hover:bg-white'
      }`}
    >
      {tDynamic(`zones.${id}`)}
    </button>
  );
}

/** Finding card shown after the doctor's gesture (immediately for a repeat). */
export function FindingCard({ c, runner, onClose }: { c: ClinicalCase; runner: RunnerState; onClose: () => void }) {
  const last = runner.lastExam!;
  const [ready, setReady] = useState(last.repeat);
  useEffect(() => {
    setReady(last.repeat);
    if (last.repeat) return;
    const id = setTimeout(() => setReady(true), EXAM_ANIMATION_MS);
    return () => clearTimeout(id);
  }, [last.seq, last.repeat]);

  return (
    <motion.div
      key={last.seq}
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      className="glass rounded-3xl p-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-extrabold">
          {TOOL_ICONS[last.tool]} {tDynamic(`tools.${last.tool}`)} · {tDynamic(`zones.${last.zone}`)}
        </div>
        <button type="button" onClick={onClose} data-testid="finding-close" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" aria-label={t('consult.close')}>
          <X size={20} aria-hidden />
        </button>
      </div>
      <AnimatePresence mode="wait">
        {ready ? (
          <motion.div key="f" initial={{ opacity: 0 }} animate={{ opacity: 1 }} data-testid="finding-text">
            {last.repeat && <p className="text-xs font-bold text-ink-soft">{t('consult.repeat')}</p>}
            {last.findings.length ? (
              last.findings.map((i) => (
                <p key={i} className="mt-1 font-semibold">
                  {c.exam[i]!.finding}
                </p>
              ))
            ) : (
              <p className="mt-1 font-semibold text-ink-soft">{tDynamic(`normal.${last.tool}`)}</p>
            )}
          </motion.div>
        ) : (
          <motion.p key="l" className="mt-1 flex items-center gap-2 text-ink-soft" exit={{ opacity: 0 }}>
            <Loader2 size={16} className="animate-spin" aria-hidden />
            {t('consult.examining')}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
