import { create } from 'zustand';

/** Thin bridge from game screens to the 3D layer: the scenes only render this state. */
interface SceneStore {
  /** Patients served in the current Garde rapide (moves the waiting-room queue). */
  served: number;
  combo: number;
  setGarde: (served: number, combo: number) => void;
}

export const useSceneStore = create<SceneStore>((set) => ({
  served: 0,
  combo: 0,
  setGarde: (served, combo) => set({ served, combo }),
}));
