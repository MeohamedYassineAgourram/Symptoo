import { describe, expect, it } from 'vitest';
import { validateContent } from '../src/content/validate.ts';
import type { Card, ContentItem } from '../src/content/schemas.ts';
import { readContentFiles } from './content-files.ts';

const { items, errors } = validateContent(readContentFiles());
const byId = new Map<string, ContentItem>(items.map((i) => [i.id, i]));
const card = (id: string) => byId.get(id) as Card;

describe('content files', () => {
  it('are all valid', () => {
    expect(errors).toEqual([]);
  });

  it('mark every assistant-written item as draft', () => {
    const drafts = items.filter((i) => i.id.includes('-d-'));
    expect(drafts.length).toBeGreaterThan(100);
    expect(drafts.every((i) => i.status === 'draft')).toBe(true);
  });

  it('only validate items from the spec', () => {
    const validated = items.filter((i) => i.status === 'validated').map((i) => i.id);
    expect(validated).toHaveLength(23); // 22 seed cards + qcm-neuro-012
  });
});

describe('seed content (README §8.5) is present word for word', () => {
  const signs: [string, string, string, string][] = [
    ['digestif-murphy', 'Signe de Murphy', "Douleur à la palpation de l'hypochondre droit provoquant un arrêt de l'inspiration profonde", 'Cholécystite aiguë'],
    ['digestif-blumberg', 'Signe de Blumberg', 'Douleur provoquée par la décompression brutale de la fosse iliaque droite', 'Irritation péritonéale (appendicite)'],
    ['digestif-rovsing', 'Signe de Rovsing', 'Douleur en fosse iliaque droite lors de la pression de la fosse iliaque gauche', 'Appendicite aiguë'],
    ['neuro-babinski', 'Signe de Babinski', 'Extension lente du gros orteil à la stimulation de la plante du pied', 'Atteinte du faisceau pyramidal'],
    ['neuro-kernig', 'Signe de Kernig', "Résistance douloureuse à l'extension de la jambe, cuisse fléchie sur le bassin", 'Syndrome méningé'],
    ['neuro-brudzinski', 'Signe de Brudzinski', 'Flexion involontaire des membres inférieurs lors de la flexion forcée de la nuque', 'Syndrome méningé'],
    ['locomoteur-lasegue', 'Signe de Lasègue', "Douleur radiculaire lors de l'élévation de la jambe tendue", 'Radiculalgie (sciatique L5/S1)'],
    ['endo-chvostek', 'Signe de Chvostek', 'Contraction de la commissure labiale à la percussion de la joue', 'Hypocalcémie (hyperexcitabilité neuromusculaire)'],
    ['endo-trousseau', 'Signe de Trousseau', "Spasme de la main (« main d'accoucheur ») après gonflement d'un brassard", 'Hypocalcémie'],
    ['nephro-godet', 'Signe du godet', 'Dépression persistante après pression du doigt sur un œdème', 'Œdème (rétention hydrosodée)'],
    ['hemato-troisier', 'Ganglion de Troisier', 'Adénopathie sus-claviculaire gauche', 'Cancer digestif (néoplasie abdominale)'],
  ];
  it.each(signs)('%s', (id, name, description, meaning) => {
    expect(card(id)).toMatchObject({ term: name, explanation: description, back: meaning, status: 'validated' });
  });

  it('includes the three pleuro-pulmonary syndromes', () => {
    expect(card('pneumo-condensation-001').back).toContain('Matité');
    expect(card('pneumo-epanchement-liquidien').back).toBe(
      'Percussion : matité. Vibrations vocales : abolies. Auscultation : murmure vésiculaire aboli, souffle pleurétique possible.',
    );
    expect(card('pneumo-pneumothorax').back).toBe(
      'Percussion : tympanisme. Vibrations vocales : abolies. Auscultation : murmure vésiculaire aboli.',
    );
  });

  it('includes the other key cards', () => {
    expect(card('digestif-charcot').back).toBe("Douleur de l'hypochondre droit, puis fièvre, puis ictère, en 24–48 heures.");
    expect(card('digestif-ictere-cholestatique').back).toBe('Urines foncées, selles décolorées, prurit.');
    expect(card('cardio-icd').back).toBe(
      'Turgescence jugulaire, reflux hépato-jugulaire, hépatomégalie douloureuse, œdèmes des membres inférieurs.',
    );
    expect(card('neuro-syndrome-meninge').back).toBe('Céphalées, vomissements, photophobie, raideur de nuque.');
    expect(card('generale-glasgow').back).toBe(
      'Ouverture des yeux (1–4), réponse verbale (1–5), réponse motrice (1–6); total 3–15.',
    );
    expect(card('cardio-nyha').back).toBe('Stade I (pas de gêne) à stade IV (dyspnée de repos).');
    expect(card('locomoteur-inflammatoire-vs-mecanique').back).toBe(
      "Inflammatoire = nocturne, réveil, dérouillage matinal prolongé; mécanique = à l'effort, calmée par le repos.",
    );
    expect(card('pneumo-hippocratisme').back).toBe(
      'Bombement des ongles en verre de montre et élargissement des dernières phalanges en baguettes de tambour.',
    );
  });

  it('keeps the tuberculosis case as a draft with percussion as a key finding', () => {
    const tb = byId.get('cas-pneumo-tb-001');
    expect(tb?.type).toBe('case');
    if (tb?.type !== 'case') return;
    expect(tb.status).toBe('draft');
    expect(tb.exam.find((f) => f.tool === 'percussion')).toMatchObject({ finding: 'Légère matité du sommet droit.', key: true });
    expect(tb.patient.darija).toBe('Hadi chi chhar o nass w ana kankoh, o kan3req bzaf f lil');
    expect(tb.patient.darijaTranslation).toBe('Ça fait environ un mois et demi que je tousse, et je transpire beaucoup la nuit.');
  });
});

describe('seed cases (README §8.5)', () => {
  const expected = [
    'cas-digestif-cholecystite-001',
    'cas-digestif-appendicite-001',
    'cas-digestif-kyste-hydatique-001',
    'cas-cardio-icd-001',
    'cas-pneumo-epanchement-001',
    'cas-neuro-meningite-001',
    'cas-hemato-anemie-001',
    'cas-generale-brucellose-001',
  ];
  it.each(expected)('%s exists as a draft with key history and exam findings', (id) => {
    const c = byId.get(id);
    expect(c?.type).toBe('case');
    if (c?.type !== 'case') return;
    expect(c.status).toBe('draft');
    expect(c.history.some((h) => h.key)).toBe(true);
    expect(c.exam.some((f) => f.key)).toBe(true);
    expect(c.patient.darijaTranslation).toBeTruthy();
  });
});
