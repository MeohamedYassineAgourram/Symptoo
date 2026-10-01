import { ROOT_ZONES, ZONES, type Tool } from '../../content/zones';

export interface LeafGroup {
  /** Parent zone of the leaves (the root itself for flat regions). */
  parent: string;
  leaves: string[];
}

const childrenOf = (id: string) => [...ZONES.values()].filter((z) => z.parent === id).map((z) => z.id);

/** Examinable (leaf) zones under a root, grouped by parent, e.g. thorax → antérieur, foyers, postérieur droit… */
export function leafGroups(root: string): LeafGroup[] {
  const groups = new Map<string, string[]>();
  const visit = (id: string) => {
    const kids = childrenOf(id);
    if (!kids.length) {
      const parent = ZONES.get(id)?.parent ?? id;
      groups.set(parent, [...(groups.get(parent) ?? []), id]);
      return;
    }
    kids.forEach(visit);
  };
  if (!childrenOf(root).length) return [{ parent: root, leaves: [root] }];
  visit(root);
  return [...groups.entries()].map(([parent, leaves]) => ({ parent, leaves }));
}

export const TOOL_ICONS: Record<Tool, string> = {
  inspection: '👁',
  palpation: '✋',
  percussion: '👆',
  auscultation: '🩺',
  marteau: '🔨',
  lampe: '🔦',
};

export const EXAM_ROOTS = ROOT_ZONES.map((r) => r.id);

/** The 9 abdominal regions in anatomical grid order (patient's right on the viewer's left). */
export const ABDOMEN_GRID = [
  'abdomen-hypochondre-droit',
  'abdomen-epigastre',
  'abdomen-hypochondre-gauche',
  'abdomen-flanc-droit',
  'abdomen-ombilicale',
  'abdomen-flanc-gauche',
  'abdomen-fosse-iliaque-droite',
  'abdomen-hypogastre',
  'abdomen-fosse-iliaque-gauche',
];
