import { Color } from 'three';
import type { PatientLook } from '../stores/sceneStore';

/** Colour shifts for visible signs (pure, unit-tested). */

export const SKIN_TONES = ['#f3d2b5', '#e6b98f', '#d4a072', '#b07a4f', '#8a5a36', '#6a4128'];

export const mix = (a: string, b: string, t: number) => '#' + new Color(a).lerp(new Color(b), t).getHexString();

export interface PatientColors {
  skin: string;
  sclera: string;
  lips: string;
  fingertips: string;
}

/** Colour shifts for ictère, pâleur and cyanose (pure, unit-testable). */
export function patientColors(look: Pick<PatientLook, 'skinTone' | 'visibleSigns'>): PatientColors {
  const has = (s: string) => look.visibleSigns.includes(s);
  let skin = SKIN_TONES[Math.min(SKIN_TONES.length, Math.max(1, look.skinTone)) - 1]!;
  if (has('ictere')) skin = mix(skin, '#d8b23a', 0.42);
  if (has('paleur')) skin = mix(skin, '#f6efe8', 0.5);
  let lips = mix(skin, '#b0545a', 0.45);
  if (has('paleur')) lips = mix(skin, '#e4c4bd', 0.6);
  if (has('cyanose')) lips = '#5d6db5';
  return {
    skin,
    sclera: has('ictere') ? '#e9cf4c' : '#ffffff',
    lips,
    fingertips: has('cyanose') ? '#6c7cc2' : skin,
  };
}

