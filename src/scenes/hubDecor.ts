import type { PropInstance } from '../three/primitives/InstancedProp';
import { pavillonHeight, type PavillonSpec } from '../three/primitives/Pavillon';

/** Everything the hub adds around wings: construction for locked ones, life for mastered ones. */
export interface HubDecor {
  trees: PropInstance[];
  bushes: PropInstance[];
  flowers: PropInstance[];
  lanternPosts: PropInstance[];
  lanternLamps: PropInstance[];
  benches: { position: [number, number, number]; rotationY: number }[];
  people: [number, number, number][];
  poles: PropInstance[];
  planks: PropInstance[];
  cones: PropInstance[];
}

const LIMIT = 10.8;
const ROAD_Z = 9.6;
const clamp = (x: number, z: number): [number, number] => [Math.max(-LIMIT, Math.min(LIMIT, x)), Math.min(ROAD_Z, Math.max(-LIMIT, z))];

/**
 * Pure layout (unit-tested). Tiers follow README §4.1/§6.3: 25 % trees, 50 % people and a bench,
 * 75 % lanterns and flower beds, 100 % a golden flag (drawn by the pavilion) and a busy crowd.
 */
export function hubDecor(specs: readonly PavillonSpec[], tiers: Record<string, number>, locked: readonly string[]): HubDecor {
  const d: HubDecor = { trees: [], bushes: [], flowers: [], lanternPosts: [], lanternLamps: [], benches: [], people: [], poles: [], planks: [], cones: [] };
  for (const s of specs) {
    const [px, , pz] = s.position;
    const hw = s.width / 2;
    const hd = s.depth / 2;
    const at = (dx: number, dz: number, y = 0): [number, number, number] => {
      const [x, z] = clamp(px + dx, pz + dz);
      return [x, y, z];
    };

    if (locked.includes(s.id)) {
      const h = pavillonHeight(s.floors) + 0.5;
      for (const [cx, cz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as const) {
        d.poles.push({ position: at(cx * (hw + 0.18), cz * (hd + 0.18), h / 2), scale: [0.05, h, 0.05] });
      }
      for (const y of [h * 0.35, h * 0.7]) {
        d.planks.push({ position: at(0, hd + 0.2, y), scale: [s.width + 0.5, 0.06, 0.14] });
        d.planks.push({ position: at(hw + 0.2, 0, y), rotationY: Math.PI / 2, scale: [s.depth + 0.5, 0.06, 0.14] });
      }
      d.cones.push({ position: at(-hw * 0.5, hd + 0.75) }, { position: at(hw * 0.5, hd + 0.75) });
      continue;
    }

    const tier = tiers[s.id] ?? 0;
    if (tier >= 1) {
      d.trees.push({ position: at(hw + 0.65, hd + 0.65), scale: 1.05, rotationY: px }, { position: at(-hw - 0.5, hd + 0.6), scale: 0.95, rotationY: pz });
      d.bushes.push({ position: at(hw + 0.5, -hd - 0.35), scale: 0.6 });
      d.flowers.push({ position: at(0, hd + 0.5), scale: [s.width * 0.35, 0.3, 0.32], color: '#ef7fa4' });
    }
    if (tier >= 2) {
      d.people.push(at(-0.5, hd + 0.75), at(0.6, hd + 0.85));
      d.benches.push({ position: at(hw + 0.55, 0), rotationY: -Math.PI / 2 });
    }
    if (tier >= 3) {
      for (const dx of [-hw + 0.1, hw - 0.1]) {
        d.lanternPosts.push({ position: at(dx, hd + 0.55, 0.45), scale: [0.04, 0.9, 0.04] });
        d.lanternLamps.push({ position: at(dx, hd + 0.55, 0.95), scale: 0.11 });
      }
      d.flowers.push(
        { position: at(-0.2, hd + 0.35), scale: [0.45, 0.25, 0.25], color: '#e88aa8' },
        { position: at(hw + 0.3, hd * 0.4), scale: [0.25, 0.25, 0.45], color: '#f2c14e' },
      );
    }
    if (tier >= 4) d.people.push(at(hw + 0.9, hd + 0.2), at(-hw - 0.6, hd + 0.9), at(0.1, hd + 1.15));
  }
  return d;
}
