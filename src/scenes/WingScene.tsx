import { useMemo } from 'react';
import { WING_THEMES, type WingId } from '../content/wings';
import { Diorama } from '../three/Diorama';
import { clay, PALETTE } from '../three/materials';
import { Crowd, makeWalkers } from '../three/primitives/Crowd';
import { InstancedProp, type PropInstance } from '../three/primitives/InstancedProp';
import { Pavillon, pavillonHeight, pavillonOpenings, type PavillonSpec } from '../three/primitives/Pavillon';
import { archGeometry } from '../three/primitives/geometries';
import { Model, ModelInstances } from '../three/models/Model';

export const WING_SIZE = 13;

/** One specialty on its own diorama tile, with its emblem (README §4.2). */
export function WingScene({ wing, density }: { wing: WingId; density: number }) {
  const accent = WING_THEMES[wing].accent;
  const spec: PavillonSpec = useMemo(
    () => ({ id: wing, position: [-0.4, 0, -2], width: 6.4, depth: 4.6, floors: 3, wall: PALETTE.wallWhite, accent }),
    [wing, accent],
  );
  const h = pavillonHeight(spec.floors);
  const openings = useMemo(() => pavillonOpenings(spec), [spec]);

  const palms = useMemo<PropInstance[]>(
    () => [[-5.2, -4.6], [4.8, -4.8], [-5.3, 4.6], [5.2, 1.6]].map(([x, z], i) => ({ position: [x!, 0, z!], rotationY: i * 1.7, scale: 0.95 })),
    [],
  );
  const bushes = useMemo<PropInstance[]>(
    () =>
      [[-3.6, 1.4], [-2.4, 1.6], [2.0, 1.6], [3.2, 1.4], [-5.4, -1], [5.3, -2.2], [-1.2, 5.4], [3.6, 5.2]]
        .slice(0, Math.max(4, Math.round(8 * density)))
        .map(([x, z], i) => ({ position: [x!, 0, z!], scale: 0.5 + (i % 3) * 0.1 })),
    [density],
  );
  const walkers = useMemo(() => {
    const n = Math.round(9 * density);
    return makeWalkers(n, 3, (i) =>
      i < 3
        ? { path: [[-3.8, 0, 3.2], [3.8, 0, 3.2], [3.8, 0, 4.6], [-3.8, 0, 4.6]], speed: 0.4, phase: i / 3, scale: 0.95 }
        : { position: [-4 + i * 1.3, 0, 2.4 + (i % 2) * 0.6], phase: i, scale: 0.95 },
    );
  }, [density]);

  return (
    <Diorama width={WING_SIZE} depth={WING_SIZE}>
      <mesh rotation-x={-Math.PI / 2} position={[-0.4, 0.025, 3.4]} receiveShadow material={clay(PALETTE.path)}>
        <planeGeometry args={[9.5, 3.4]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[4.6, 0.02, -2]} receiveShadow material={clay(PALETTE.grass)}>
        <planeGeometry args={[2.6, 6]} />
      </mesh>
      <Pavillon {...spec} />
      <InstancedProp geometry={archGeometry()} material={clay(PALETTE.arch)} items={openings.arches} castShadow={false} />
      <InstancedProp geometry={archGeometry()} material={clay(PALETTE.wood)} items={openings.windows} castShadow={false} />

      {wing === 'cardio' && <Model id="emblem.heart" position={[-0.4, h + 1.35, 0.3]} scale={1.2} color={accent} />}
      {wing === 'pneumo' && (
        <>
          <Model id="emblem.lungs" position={[-3, 0, 2]} scale={1.1} />
          <Model id="emblem.lungs" position={[2.2, 0, 2]} scale={1.1} />
        </>
      )}
      {wing !== 'cardio' && <Model id="prop.cross-sign" position={[3.6, 0, 1.4]} color={accent} />}

      <ModelInstances id="nature.palm" items={palms} />
      <ModelInstances id="nature.bush" items={bushes} />
      <Crowd walkers={walkers} />
      <Model id="prop.bench" position={[-4.6, 0, 5.4]} rotationY={0} />
      <Model id="prop.bench" position={[1.0, 0, 5.6]} rotationY={0} />
      {wing === 'cardio' || wing === 'generale' ? (
        <Model id="vehicle.ambulance" position={[4.8, 0, 5.2]} rotationY={-Math.PI / 2} />
      ) : (
        <Model id="vehicle.petit-taxi" position={[4.8, 0, 5.2]} rotationY={-Math.PI / 2} />
      )}
      <Model id="prop.cat" position={[-2.2, 0, 5.8]} rotationY={-0.6} color="#8c8c8c" />
    </Diorama>
  );
}
