import { create } from 'zustand';
import type { Tool } from '../content/zones';

export interface PatientLook {
  sex: 'M' | 'F';
  age: number;
  skinTone: number;
  hair: string;
  beard?: boolean;
  hijab?: boolean;
  clothing: string;
  visibleSigns: string[];
}

export type ZoneHighlight = 'found' | 'missed';

/** What the consultation room renders. Written by the Consultation screen, read by the 3D scene. */
export interface ConsultSceneState {
  caseId: string;
  look: PatientLook;
  view: 'room' | 'close';
  /** Hotspots are shown only while the patient can be examined (and on feedback). */
  hotspots: boolean;
  /** Root zone currently selected in the zone picker (glows). */
  activeRoot: string | null;
  /** Latest exam action: the doctor animates when `seq` changes. */
  action: { tool: Tool; root: string; seq: number } | null;
  /** Feedback: key signs found / missed, per root zone. */
  highlights: Record<string, ZoneHighlight> | null;
}

/** What the hub diorama renders: locked wings, mastery tier per wing, wings to "pop". */
export interface HubSceneState {
  locked: string[];
  tiers: Record<string, number>;
  celebrate: string[];
}

/** Thin bridge from game screens to the 3D layer: the scenes only render this state and emit events. */
interface SceneStore {
  hub: HubSceneState;
  setHub: (h: HubSceneState) => void;

  /** Patients served in the current Garde rapide (moves the waiting-room queue). */
  served: number;
  combo: number;
  setGarde: (served: number, combo: number) => void;

  consult: ConsultSceneState | null;
  setConsult: (patch: Partial<ConsultSceneState> | null) => void;
  /** Event emitted by the 3D scene when a body zone hotspot is tapped. */
  pickedZone: { root: string; seq: number } | null;
  pickZone: (root: string) => void;
}

export const useSceneStore = create<SceneStore>((set, get) => ({
  hub: { locked: [], tiers: {}, celebrate: [] },
  setHub: (hub) => set({ hub }),
  served: 0,
  combo: 0,
  setGarde: (served, combo) => set({ served, combo }),

  consult: null,
  setConsult: (patch) =>
    set((s) => ({
      consult: patch === null ? null : s.consult ? { ...s.consult, ...patch } : (patch as ConsultSceneState),
    })),
  pickedZone: null,
  pickZone: (root) => set({ pickedZone: { root, seq: (get().pickedZone?.seq ?? 0) + 1 } }),
}));
