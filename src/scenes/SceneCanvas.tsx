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
import { ConsultationRoom, PATIENT_FOCUS, ROOM_W } from './ConsultationRoom';
import { useSceneStore } from '../stores/sceneStore';
import { SIDE_PANEL_W, WIDE_LAYOUT } from '../app/constants';
import { useSettings } from '../stores/settingsStore';
import { t, tDynamic } from '../i18n/t';

export type SceneKind =
  | { kind: 'hub' }
  | { kind: 'wing'; wing: WingId }
  | { kind: 'garde'; wing: WingId | 'toutes' }
  | { kind: 'consultation'; wing: WingId | 'toutes' };


function useViewport() {
  const [vp, setVp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return vp;
}

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

  const vp = useViewport();
  const wide = vp.w >= WIDE_LAYOUT;
  const consultView = useSceneStore((s) => s.consult?.view ?? 'room');

  const focus: CameraFocus | null = useMemo(() => {
    if (scene.kind === 'consultation') {
      return consultView === 'close' ? { position: PATIENT_FOCUS, zoomFactor: wide ? 3.6 : 2.6 } : null;
    }
    const spec = selected && HUB_PAVILLONS.find((p) => p.id === selected);
    return spec ? { position: [spec.position[0], 1, spec.position[2]], zoomFactor: 2.1 } : null;
  }, [selected, scene.kind, consultView, wide]);

  // Keep the consultation room visible beside the side panel (wide) or above the bottom sheet (phones).
  const consultShift: [number, number] = wide ? [SIDE_PANEL_W / 2, 0] : [0, Math.round(vp.h * 0.25)];

  const onArrive = useCallback(() => {
    if (scene.kind === 'hub' && selected) navigate(`/aile/${selected}`);
  }, [selected, navigate, scene.kind]);

  const framing = {
    hub: {
      fit: [HUB_SIZE * 1.5, HUB_SIZE * 1.75] as [number, number],
      // Phones: let the diamond use the full width (its empty side corners may crop; panning reveals them).
      fitPortrait: [HUB_SIZE * 1.18, HUB_SIZE * 1.75] as [number, number],
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
    consultation: {
      fit: [ROOM_W * 1.45 + (wide ? SIDE_PANEL_W / 40 : 0), ROOM_W * 1.25] as [number, number],
      // Phones: the sheet takes half the screen, so frame the table area rather than the whole room.
      fitPortrait: [ROOM_W * 0.95, ROOM_W * 2.4] as [number, number],
      center: (wide ? [0, 0.4, 0] : [0.2, 0.6, -0.6]) as [number, number, number],
      bounds: 0,
      extent: ROOM_W / 2,
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
          fitPortrait={'fitPortrait' in framing ? framing.fitPortrait : undefined}
          center={framing.center}
          panBounds={framing.bounds}
          shift={scene.kind === 'consultation' ? consultShift : undefined}
          interactive={scene.kind !== 'garde' && scene.kind !== 'consultation'}
          focus={focus}
          onFocusArrive={onArrive}
          reducedMotion={reducedMotion}
        />
        {scene.kind === 'hub' && (
          <HubScene density={quality.density} selected={selected} onSelect={setSelected} />
        )}
        {scene.kind === 'wing' && <WingScene wing={scene.wing} density={quality.density} />}
        {scene.kind === 'consultation' && <ConsultationRoom density={quality.density} reducedMotion={reducedMotion} />}
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
              aria-label={tDynamic(`wings.${id}.name`)}
              className="wing-label glass pointer-events-auto absolute top-0 left-0 rounded-full text-xs font-extrabold whitespace-nowrap text-ink"
              style={{ visibility: 'hidden' }}
            >
              <span className="dot" style={{ background: WING_THEMES[id as WingId].accent }} aria-hidden />
              <span className="text">{tDynamic(selected === id ? `wings.${id}.name` : `wings.${id}.sign`)}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
