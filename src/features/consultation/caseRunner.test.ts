import { describe, expect, it } from 'vitest';
import { CaseSchema, type ClinicalCase } from '../../content/schemas';
import pneumoCases from '../../content/pneumo/cases.json';
import digestifCases from '../../content/digestif/cases.json';
import { seededRng } from '../../utils/random';
import { createRunner, findingApplies, formatClock, runnerReducer, type RunnerEvent, type RunnerState } from './caseRunner';
import { etiologyOptions, gradeSynthesis, syndromeOptions } from './synthesis';

const load = (list: unknown[], id: string) => CaseSchema.parse((list as { id: string }[]).find((c) => c.id === id));
const tb: ClinicalCase = load(pneumoCases, 'cas-pneumo-tb-001');
const appendicite: ClinicalCase = load(digestifCases, 'cas-digestif-appendicite-001');

const play = (c: ClinicalCase, events: RunnerEvent[], start?: RunnerState) =>
  events.reduce((s, e) => runnerReducer(s, e, c), start ?? createRunner(c));

const perfectTb = { syndromes: ['Syndrome de condensation pulmonaire', 'syndrome infectieux'], etiology: 'tuberculose', bonus: [0] };

describe('case runner flow', () => {
  it('starts at arrival at 08:00 and moves to interrogatoire on BEGIN', () => {
    const s = createRunner(tb);
    expect(s.phase).toBe('arrival');
    expect(formatClock(s.clock)).toBe('08:00');
    expect(play(tb, [{ type: 'BEGIN' }]).phase).toBe('interrogatoire');
  });

  it('ignores questions and exams before the consultation begins', () => {
    const s = play(tb, [{ type: 'ASK', index: 0 }, { type: 'EXAMINE', zone: 'general', tool: 'inspection' }]);
    expect(s.asked).toEqual([]);
    expect(s.actions).toEqual([]);
  });

  it('charges 1 min per question, 3 min for an irrelevant one, and never twice', () => {
    const s = play(tb, [{ type: 'BEGIN' }, { type: 'ASK', index: 0 }, { type: 'ASK', index: 0 }, { type: 'ASK', index: 6 }]);
    expect(s.asked).toEqual([0, 6]);
    expect(s.clock - s.startClock).toBe(1 + 3);
  });

  it('reveals findings for the examined zone and tool (2 min), including mid-level zones', () => {
    const s = play(tb, [{ type: 'BEGIN' }, { type: 'GO', phase: 'examen' }, { type: 'EXAMINE', zone: 'thorax-posterieur-droit-sommet', tool: 'auscultation' }]);
    expect(s.phase).toBe('examen');
    expect(s.revealed).toEqual([1]);
    expect(s.lastExam).toMatchObject({ findings: [1], repeat: false, seq: 1 });
    expect(s.clock - s.startClock).toBe(2);
  });

  it('matches wildcard findings and charges 3 min when the finding is irrelevant', () => {
    const s = play(tb, [{ type: 'BEGIN' }, { type: 'EXAMINE', zone: 'abdomen-epigastre', tool: 'palpation' }]);
    expect(s.revealed).toEqual([4]);
    expect(s.clock - s.startClock).toBe(3);
  });

  it('returns a normal examination (no finding) for an unscripted zone', () => {
    const s = play(tb, [{ type: 'BEGIN' }, { type: 'EXAMINE', zone: 'neuro-reflexes', tool: 'marteau' }]);
    expect(s.lastExam?.findings).toEqual([]);
    expect(s.clock - s.startClock).toBe(2);
  });

  it('replays a repeated exam for free and flags it as a repeat', () => {
    const ev: RunnerEvent = { type: 'EXAMINE', zone: 'general', tool: 'inspection' };
    const s = play(tb, [{ type: 'BEGIN' }, ev, ev]);
    expect(s.actions).toHaveLength(1);
    expect(s.lastExam).toMatchObject({ repeat: true, seq: 2 });
    expect(s.clock - s.startClock).toBe(2);
  });

  it('rejects tools that are not available on a zone and unknown zones', () => {
    const s = play(tb, [{ type: 'BEGIN' }, { type: 'EXAMINE', zone: 'general', tool: 'auscultation' }, { type: 'EXAMINE', zone: 'nope', tool: 'inspection' }]);
    expect(s.actions).toEqual([]);
  });
});

describe('case runner grading', () => {
  const thorough: RunnerEvent[] = [
    { type: 'BEGIN' },
    ...[0, 1, 2, 3, 4].map((index) => ({ type: 'ASK', index }) as RunnerEvent),
    { type: 'EXAMINE', zone: 'general', tool: 'inspection' },
    { type: 'EXAMINE', zone: 'thorax-posterieur-droit-sommet', tool: 'auscultation' },
    { type: 'EXAMINE', zone: 'thorax-posterieur-droit-sommet', tool: 'percussion' },
  ];

  it('gives a perfect score and quality 5 for an efficient, correct diagnosis', () => {
    const s = play(tb, [...thorough, { type: 'SUBMIT', answer: perfectTb, streak: 0 }]);
    expect(s.phase).toBe('feedback');
    expect(s.result?.synthesis).toMatchObject({ syndrome: 'correct', etiology: 'correct', bonus: 'correct' });
    expect(s.result?.keys.every((k) => k.found)).toBe(true);
    expect(s.result?.score).toBe(200);
    expect(s.result?.quality).toBe(5);
  });

  it('lists missed key signs and lowers the efficiency bonus', () => {
    const s = play(tb, [
      { type: 'BEGIN' },
      { type: 'ASK', index: 0 },
      { type: 'ASK', index: 6 },
      { type: 'EXAMINE', zone: 'abdomen-epigastre', tool: 'palpation' },
      { type: 'SUBMIT', answer: perfectTb, streak: 0 },
    ]);
    const missed = s.result!.keys.filter((k) => !k.found);
    expect(missed.map((k) => `${k.kind}-${k.index}`)).toContain('exam-2');
    expect(s.result!.score).toBe(150 + Math.round(50 * (1 / 3)));
    expect(s.result!.quality).toBe(4);
  });

  it('grades partial and wrong syndromes with SM-2 qualities 2 and 1', () => {
    const partial = play(tb, [...thorough, { type: 'SUBMIT', answer: { ...perfectTb, syndromes: ['syndrome infectieux'] }, streak: 0 }]);
    expect(partial.result?.synthesis.syndrome).toBe('partial');
    expect(partial.result?.quality).toBe(2);
    expect(partial.result?.score).toBe(10);
    const wrong = play(tb, [...thorough, { type: 'SUBMIT', answer: { ...perfectTb, syndromes: ['pneumothorax'] }, streak: 0 }]);
    expect(wrong.result?.quality).toBe(1);
  });

  it('grades a right syndrome with a wrong étiologie as quality 3', () => {
    const s = play(tb, [...thorough, { type: 'SUBMIT', answer: { ...perfectTb, etiology: 'Cancer bronchique' }, streak: 0 }]);
    expect(s.result?.synthesis.etiology).toBe('wrong');
    expect(s.result?.quality).toBe(3);
  });

  it('gives quality 0 and no score for « Je ne sais pas »', () => {
    const s = play(tb, [{ type: 'BEGIN' }, { type: 'SUBMIT', answer: { syndromes: [], etiology: null, bonus: null, gaveUp: true }, streak: 3 }]);
    expect(s.result).toMatchObject({ score: 0, quality: 0 });
  });

  it('applies the streak multiplier', () => {
    const s = play(tb, [...thorough, { type: 'SUBMIT', answer: perfectTb, streak: 3 }]);
    expect(s.result?.score).toBe(260);
  });

  it('locks the case after submission', () => {
    const s = play(tb, [...thorough, { type: 'SUBMIT', answer: perfectTb, streak: 0 }, { type: 'ASK', index: 5 }]);
    expect(s.asked).toHaveLength(5);
  });
});

describe('synthesis', () => {
  it('accepts typed étiologies with accents/typos via the synonym list', () => {
    const base = { syndromes: appendicite.answer.syndrome, bonus: [0] };
    expect(gradeSynthesis(appendicite, { ...base, etiology: 'appendicite aigue' }).etiology).toBe('correct');
    expect(gradeSynthesis(appendicite, { ...base, etiology: 'Appendicitte aiguë' }).etiology).toBe('correct');
    expect(gradeSynthesis(appendicite, { ...base, etiology: 'Colique néphrétique droite' }).etiology).toBe('wrong');
  });

  it('flags extra syndromes as partial', () => {
    const g = gradeSynthesis(appendicite, { syndromes: [...appendicite.answer.syndrome, 'syndrome occlusif'], etiology: null, bonus: null });
    expect(g).toMatchObject({ syndrome: 'partial', extraSyndromes: ['syndrome occlusif'] });
  });

  it('builds syndrome options with every expected syndrome and no duplicates', () => {
    const opts = syndromeOptions(appendicite, seededRng(1));
    expect(opts).toHaveLength(8);
    expect(new Set(opts).size).toBe(8);
    for (const s of appendicite.answer.syndrome) expect(opts).toContain(s);
  });

  it('builds étiologie options from the étiologie and its distractors', () => {
    const opts = etiologyOptions(appendicite, seededRng(2));
    expect(opts).toHaveLength(5);
    expect(opts).toContain('Appendicite aiguë');
  });

  it('matches mid-level and wildcard finding zones', () => {
    expect(findingApplies('abdomen-*', 'abdomen-hypogastre')).toBe(true);
    expect(findingApplies('thorax-posterieur-droit', 'thorax-posterieur-droit-base')).toBe(true);
    expect(findingApplies('thorax-posterieur-droit-base', 'thorax-posterieur-droit')).toBe(false);
  });
});
