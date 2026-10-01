import { useCallback, useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr } from '@react-three/drei';
import { useNavigate } from 'react-router';
import { isWingId, WING_THEMES, type WingId } from '../content/wings';
import { useQuality } from '../three/quality';
import { Lighting } from '../three/Lighting';
import { CameraRig, type CameraFocus } from '../three/CameraRig';
import { HUB_LABELS, HUB_PAVILLONS, HUB_SIZE, HubScene } from './HubScene';
import { registerLabel } from '../three/labels';
import { WING_SIZE, WingScene } from './WingScene';
import { GardeBackdrop, ROOM_SIZE } from './GardeBackdrop';
import { useSettings } from '../stores/settingsStore';
import { t, tDynamic } from '../i18n/t';

export type SceneKind =
  { kind: 'hub' } | { kind: 'wing'; wing: WingId } | { kind: 'garde'; wing: WingId | 'toutes' };

/**
 * One persistent WebGL canvas for the whole app (creating contexts per route is costly on
 * phones). The active scene is chosen from the route; scenes only render state and emit events.
 */
export default function SceneCanvas({ scene }: { scene: SceneKind }) {
  const quality = useQuality();
  const reducedMotion = useSettings((s) => s.settings.reducedMotion);
  const navigate = useNavigate();
  const [selected, setSelected] = useState<WingId | null>(null);

  const sceneKey = scene.kind === 'hub' ? 'hub' : `${scene.kind}-${scene.wing}`;
  useEffect(() => setSelected(null), [sceneKey]);

  const focus: CameraFocus | null = useMemo(() => {
    const spec = selected && HUB_PAVILLONS.find((p) => p.id === selected);
    return spec ? { position: [spec.position[0], 1, spec.position[2]], zoomFactor: 2.1 } : null;
  }, [selected]);

  const onArrive = useCallback(() => {
    if (selected) navigate(`/aile/${selected}`);
  }, [selected, navigate]);

  const framing = {
    hub: {
      fit: [HUB_SIZE * 1.5, HUB_SIZE * 1.75] as [number, number],
      center: [0, 0.5, 0] as [number, number, number],
      bounds: 7,
      extent: HUB_SIZE / 2,
    },
    wing: {
      fit: [WING_SIZE * 1.55, WING_SIZE * 2.05] as [number, number],
      center: [0, 1.6, 0] as [number, number, number],
      bounds: 3,
      extent: WING_SIZE / 2,
    },
    garde: {
      fit: [ROOM_SIZE * 1.5, ROOM_SIZE * 2.6] as [number, number],
      center: [0, -2.2, 0] as [number, number, number],
      bounds: 0,
      extent: ROOM_SIZE / 2,
    },
  }[scene.kind];

  return (
    <>
      <Canvas
        shadows={quality.shadows ? 'percentage' : false}
        dpr={quality.dpr}
        gl={{ antialias: quality.antialias, alpha: true, powerPreference: 'high-performance' }}
        aria-label={t('a11y.scene')}
        role="img"
      >
        <AdaptiveDpr pixelated={false} />
        <Lighting quality={quality} extent={framing.extent} />
        <CameraRig
          sceneKey={sceneKey}
          fit={framing.fit}
          center={framing.center}
          panBounds={framing.bounds}
          interactive={scene.kind !== 'garde'}
          focus={focus}
          onFocusArrive={onArrive}
          reducedMotion={reducedMotion}
        />
        {scene.kind === 'hub' && (
          <HubScene density={quality.density} selected={selected} onSelect={setSelected} />
        )}
        {scene.kind === 'wing' && <WingScene wing={scene.wing} density={quality.density} />}
        {scene.kind === 'garde' && (
          <GardeBackdrop
            accent={isWingId(scene.wing) ? WING_THEMES[scene.wing].accent : '#2E8B7A'}
            density={quality.density}
          />
        )}
      </Canvas>
      {scene.kind === 'hub' && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {HUB_LABELS.map(({ id }) => (
            <button
              key={id}
              ref={(el) => registerLabel(id, el)}
              type="button"
              onClick={() => setSelected(id as WingId)}
              className="glass pointer-events-auto absolute top-0 left-0 rounded-full px-3 py-1 text-xs font-extrabold whitespace-nowrap text-ink"
              style={{ borderBottom: `3px solid ${WING_THEMES[id as WingId].accent}`, visibility: 'hidden' }}
            >
              {tDynamic(`wings.${id}.sign`)}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
