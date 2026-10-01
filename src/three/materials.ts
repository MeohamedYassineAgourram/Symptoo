import { Color, MeshStandardMaterial, type MeshStandardMaterialParameters } from 'three';

const cache = new Map<string, MeshStandardMaterial>();

/**
 * Shared matte "clay" materials (README §3.1). Cached by parameters so identical colours
 * reuse one material: fewer shader programs and state changes.
 */
export function clay(color: string, extra: MeshStandardMaterialParameters = {}): MeshStandardMaterial {
  const key = `${color}|${JSON.stringify(extra)}`;
  let m = cache.get(key);
  if (!m) {
    m = new MeshStandardMaterial({ color: new Color(color), roughness: 0.85, metalness: 0, ...extra });
    cache.set(key, m);
  }
  return m;
}

export const glass = () => clay('#9fcbe6', { roughness: 0.25, metalness: 0.15 });
export const water = () => clay('#5cc6c9', { roughness: 0.15, transparent: true, opacity: 0.82 });
export const vertexClay = () => clay('#ffffff', { vertexColors: true });

/** Palette for scene props. */
export const PALETTE = {
  wallWhite: '#f6f1e7',
  wallSand: '#ecd9b8',
  roofGreen: '#3f8f6b',
  roofGreenDeep: '#2f6f53',
  arch: '#55636e',
  wood: '#a06d45',
  slabTop: '#efe6d6',
  slabEarth: '#c4a57f',
  slabEarthDeep: '#9c7d5c',
  courtyard: '#f3ead9',
  path: '#e4d6bd',
  grass: '#9cc98a',
  leaf: '#6fae6a',
  leafDeep: '#4f8f53',
  trunk: '#9a7350',
  road: '#7b8590',
  white: '#ffffff',
} as const;
