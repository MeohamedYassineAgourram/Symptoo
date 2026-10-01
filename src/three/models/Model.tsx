/* eslint-disable @typescript-eslint/no-explicit-any */
import { Suspense, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { MODEL_MANIFEST, type ModelEntry, type ModelId } from './manifest';
import { InstancedProp, type PropInstance } from '../primitives/InstancedProp';

function GlbModel({ url, scale = 1, ...props }: { url: string; scale?: number } & Record<string, any>) {
  const { scene } = useGLTF(url);
  const clone = useMemo(() => scene.clone(true), [scene]);
  return <primitive object={clone} scale={scale} {...props} />;
}

/** Renders a single model by manifest ID. */
export function Model({ id, ...props }: { id: ModelId } & Record<string, any>) {
  const entry = MODEL_MANIFEST[id] as ModelEntry;
  if (entry.kind === 'primitive') return <entry.Component {...props} />;
  if (entry.kind === 'glb')
    return (
      <Suspense fallback={null}>
        <GlbModel url={entry.url} scale={entry.scale} {...props} />
      </Suspense>
    );
  return <ModelInstances id={id} items={[{ position: props.position ?? [0, 0, 0] }]} />;
}

/** Renders many copies of a model by manifest ID (instanced for primitives). */
export function ModelInstances({ id, items }: { id: ModelId; items: readonly PropInstance[] }) {
  const entry = MODEL_MANIFEST[id] as ModelEntry;
  const parts = useMemo(() => (entry.kind === 'primitive-instanced' ? entry.parts() : []), [entry]);
  if (entry.kind === 'primitive-instanced') {
    return (
      <>
        {parts.map((p, i) => (
          <InstancedProp key={i} geometry={p.geometry} material={p.material} items={items} />
        ))}
      </>
    );
  }
  return (
    <>
      {items.map((item, i) => (
        <Model key={i} id={id} position={item.position} rotation-y={item.rotationY ?? 0} scale={item.scale ?? 1} />
      ))}
    </>
  );
}
