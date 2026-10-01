/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ComponentType } from 'react';
import type { BufferGeometry, Material } from 'three';
import { Pavillon } from '../primitives/Pavillon';
import { Fountain } from '../primitives/Courtyard';
import { Vehicle } from '../primitives/Vehicles';
import { Bench, Cat, CrossSign, HeartEmblem, LungTopiary } from '../primitives/Props';
import { bushGeometry, orangeTreeGeometry, palmCrownGeometry, palmTrunkGeometry } from '../primitives/geometries';
import { clay, vertexClay, PALETTE } from '../materials';

/**
 * Model manifest (README §4.5): scenes reference models by ID only. Today every entry is a
 * primitive-shape fallback; in Phase 4 an entry can switch to `{ kind: 'glb', url }`
 * without touching scene or game code.
 */
export type ModelEntry =
  | { kind: 'primitive'; Component: ComponentType<any> }
  | { kind: 'primitive-instanced'; parts: () => { geometry: BufferGeometry; material: Material }[] }
  | { kind: 'glb'; url: string; scale?: number };

export const MODEL_MANIFEST = {
  'building.pavillon': { kind: 'primitive', Component: Pavillon },
  'prop.fountain': { kind: 'primitive', Component: Fountain },
  'prop.bench': { kind: 'primitive', Component: Bench },
  'prop.cat': { kind: 'primitive', Component: Cat },
  'prop.cross-sign': { kind: 'primitive', Component: CrossSign },
  'emblem.heart': { kind: 'primitive', Component: HeartEmblem },
  'emblem.lungs': { kind: 'primitive', Component: LungTopiary },
  'vehicle.car': { kind: 'primitive', Component: (p: any) => <Vehicle {...p} variant="car" /> },
  'vehicle.petit-taxi': { kind: 'primitive', Component: (p: any) => <Vehicle {...p} variant="petit-taxi" /> },
  'vehicle.ambulance': { kind: 'primitive', Component: (p: any) => <Vehicle {...p} variant="ambulance" /> },
  'nature.palm': {
    kind: 'primitive-instanced',
    parts: () => [
      { geometry: palmTrunkGeometry(), material: clay(PALETTE.trunk) },
      { geometry: palmCrownGeometry(), material: vertexClay() },
    ],
  },
  'nature.orange-tree': { kind: 'primitive-instanced', parts: () => [{ geometry: orangeTreeGeometry(), material: vertexClay() }] },
  'nature.bush': { kind: 'primitive-instanced', parts: () => [{ geometry: bushGeometry(), material: clay(PALETTE.leaf) }] },
} satisfies Record<string, ModelEntry>;

export type ModelId = keyof typeof MODEL_MANIFEST;
