import { useEffect, useState } from 'react';
import { useSceneStore, type PatientLook } from '../../stores/sceneStore';
import { tDynamic } from '../../i18n/t';
import { ScreenHeader } from './ScreenHeader';

const SIGNS = ['ictere', 'paleur', 'cyanose', 'dyspnee', 'toux', 'oedemes-mi', 'amaigrissement', 'turgescence-jugulaire', 'hippocratisme', 'fievre', 'exophtalmie', 'ascite', 'douleur-abdominale'];

/** Dev-only gallery of the visible clinical signs on the 3D patient (not shipped in production builds). */
export function SignsGallery() {
  const setConsult = useSceneStore((s) => s.setConsult);
  const [sign, setSign] = useState<string | null>(null);
  const [tone, setTone] = useState(2);
  useEffect(() => {
    const look: PatientLook = { sex: 'M', age: 40, skinTone: tone, hair: 'court-noir', clothing: 'blouse-hopital', visibleSigns: sign ? [sign] : [] };
    setConsult(null);
    setConsult({ caseId: `gallery-${sign}-${tone}`, look, view: 'close', hotspots: false, activeRoot: null, action: null, highlights: null });
  }, [sign, tone, setConsult]);
  useEffect(() => () => setConsult(null), [setConsult]);
  return (
    <>
      <ScreenHeader />
      <div className="flex-1" />
      <div className="pointer-events-auto glass m-3 flex flex-wrap gap-1.5 rounded-3xl p-3">
        <button type="button" onClick={() => setSign(null)} className="rounded-xl bg-surface-strong px-3 py-2 text-sm font-bold">
          Aucun
        </button>
        {SIGNS.map((s) => (
          <button key={s} type="button" data-testid={`sign-${s}`} onClick={() => setSign(s)} className={`rounded-xl px-3 py-2 text-sm font-bold ${sign === s ? 'bg-accent text-white' : 'bg-surface-strong'}`}>
            {tDynamic(`signs.${s}`)}
          </button>
        ))}
        {[1, 3, 5].map((n) => (
          <button key={n} type="button" data-testid={`tone-${n}`} onClick={() => setTone(n)} className="rounded-xl bg-surface-strong px-3 py-2 text-sm font-bold">
            Peau {n}
          </button>
        ))}
      </div>
    </>
  );
}
