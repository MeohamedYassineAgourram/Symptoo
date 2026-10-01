/**
 * Body-zone taxonomy for the physical exam. Every fine zone rolls up to exactly one
 * root zone (README §4.3), so the 2D zone list and the 3D hotspots stay consistent.
 * IDs are hierarchical: a child's id always starts with `<parentId>-`.
 * Case findings may use a wildcard `<zoneId>-*` meaning "any zone below <zoneId>".
 */

export const TOOLS = ['inspection', 'palpation', 'percussion', 'auscultation', 'manoeuvre', 'marteau', 'lampe'] as const;
export type Tool = (typeof TOOLS)[number];

interface ZoneNode {
  id: string;
  children?: ZoneNode[];
}

interface RootZone extends ZoneNode {
  tools: Tool[];
}

const leaves = (parent: string, names: string[]): ZoneNode[] => names.map((n) => ({ id: `${parent}-${n}` }));

export const ROOT_ZONES: RootZone[] = [
  // Not listed in §4.3, but required by case findings such as the general inspection in §8.3.
  { id: 'general', tools: ['inspection'] },
  {
    id: 'tete',
    tools: ['inspection', 'palpation', 'lampe'],
    children: leaves('tete', ['yeux', 'conjonctives', 'bouche', 'langue']),
  },
  {
    id: 'cou',
    tools: ['inspection', 'palpation', 'auscultation'],
    children: leaves('cou', ['thyroide', 'veines-jugulaires']),
  },
  {
    id: 'thorax',
    tools: ['inspection', 'palpation', 'percussion', 'auscultation'],
    children: [
      {
        id: 'thorax-anterieur',
        children: [
          ...leaves('thorax-anterieur', ['droit', 'gauche']),
          {
            id: 'thorax-anterieur-cardiaque',
            children: leaves('thorax-anterieur-cardiaque', ['aortique', 'pulmonaire', 'tricuspide', 'mitral']),
          },
        ],
      },
      {
        id: 'thorax-posterieur',
        children: [
          { id: 'thorax-posterieur-droit', children: leaves('thorax-posterieur-droit', ['sommet', 'base']) },
          { id: 'thorax-posterieur-gauche', children: leaves('thorax-posterieur-gauche', ['sommet', 'base']) },
        ],
      },
    ],
  },
  {
    id: 'abdomen',
    tools: ['inspection', 'palpation', 'percussion', 'auscultation', 'manoeuvre'],
    children: leaves('abdomen', [
      'hypochondre-droit',
      'epigastre',
      'hypochondre-gauche',
      'flanc-droit',
      'ombilicale',
      'flanc-gauche',
      'fosse-iliaque-droite',
      'hypogastre',
      'fosse-iliaque-gauche',
      // Posterior, for renal examination (ébranlement lombaire).
      'fosse-lombaire-droite',
      'fosse-lombaire-gauche',
    ]),
  },
  {
    id: 'aires-ganglionnaires',
    tools: ['inspection', 'palpation'],
    children: leaves('aires-ganglionnaires', ['cervicales', 'sus-claviculaires', 'axillaires', 'inguinales']),
  },
  {
    id: 'membres',
    tools: ['inspection', 'palpation', 'manoeuvre'],
    children: [
      { id: 'membres-superieurs', children: leaves('membres-superieurs', ['mains-ongles', 'pouls']) },
      { id: 'membres-inferieurs', children: leaves('membres-inferieurs', ['jambes', 'pouls', 'pieds']) },
    ],
  },
  { id: 'peau', tools: ['inspection', 'palpation', 'lampe'] },
  {
    // Meningeal signs, Lasègue and muscle testing are manœuvres; reflexes use the hammer.
    id: 'neuro',
    tools: ['inspection', 'manoeuvre', 'marteau'],
    children: leaves('neuro', ['reflexes', 'force', 'sensibilite', 'marche', 'coordination', 'signes-meninges']),
  },
];

export interface ZoneInfo {
  id: string;
  parent: string | null;
  root: string;
  depth: number;
}

function flatten(): Map<string, ZoneInfo> {
  const map = new Map<string, ZoneInfo>();
  const visit = (node: ZoneNode, parent: string | null, root: string, depth: number) => {
    if (map.has(node.id)) throw new Error(`Duplicate zone id: ${node.id}`);
    if (parent && !node.id.startsWith(`${parent}-`)) throw new Error(`Zone ${node.id} must start with ${parent}-`);
    map.set(node.id, { id: node.id, parent, root, depth });
    node.children?.forEach((c) => visit(c, node.id, root, depth + 1));
  };
  ROOT_ZONES.forEach((r) => visit(r, null, r.id, 0));
  return map;
}

export const ZONES: ReadonlyMap<string, ZoneInfo> = flatten();

export function isWildcard(pattern: string): boolean {
  return pattern.endsWith('-*');
}

/** True for a known zone id, or a wildcard whose base is a zone with descendants. */
export function isValidZonePattern(pattern: string): boolean {
  if (!isWildcard(pattern)) return ZONES.has(pattern);
  const base = pattern.slice(0, -2);
  return ZONES.has(base) && [...ZONES.values()].some((z) => z.parent === base);
}

export function isDescendant(zoneId: string, ancestorId: string): boolean {
  let current = ZONES.get(zoneId)?.parent ?? null;
  while (current) {
    if (current === ancestorId) return true;
    current = ZONES.get(current)?.parent ?? null;
  }
  return false;
}

/** Does a finding's zone pattern apply to the zone the player examined? */
export function zoneMatches(pattern: string, zoneId: string): boolean {
  if (isWildcard(pattern)) return isDescendant(zoneId, pattern.slice(0, -2));
  return pattern === zoneId;
}

/** The §4.3 root zone a zone (or wildcard) belongs to. */
export function rootOf(zoneOrPattern: string): string | undefined {
  const id = isWildcard(zoneOrPattern) ? zoneOrPattern.slice(0, -2) : zoneOrPattern;
  return ZONES.get(id)?.root;
}

export function toolsForZone(zoneId: string): Tool[] {
  const root = rootOf(zoneId);
  return ROOT_ZONES.find((r) => r.id === root)?.tools ?? [];
}
