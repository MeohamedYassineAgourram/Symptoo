import { useLayoutEffect, useRef } from 'react';
import { Color, Euler, InstancedMesh, Matrix4, Quaternion, Vector3, type BufferGeometry, type Material } from 'three';

export interface PropInstance {
  position: [number, number, number];
  rotationY?: number;
  scale?: number | [number, number, number];
  color?: string;
}

interface InstancedPropProps {
  geometry: BufferGeometry;
  material: Material;
  items: readonly PropInstance[];
  castShadow?: boolean;
  receiveShadow?: boolean;
}

const m = new Matrix4();
const q = new Quaternion();
const e = new Euler();
const p = new Vector3();
const s = new Vector3();
const c = new Color();

export function composeInstance(item: PropInstance, out: Matrix4): Matrix4 {
  p.set(...item.position);
  q.setFromEuler(e.set(0, item.rotationY ?? 0, 0));
  const sc = item.scale ?? 1;
  if (typeof sc === 'number') s.setScalar(sc);
  else s.set(...sc);
  return out.compose(p, q, s);
}

/** Renders many copies of one geometry in a single draw call (README §4.5 budget). */
export function InstancedProp({ geometry, material, items, castShadow = true, receiveShadow = false }: InstancedPropProps) {
  const ref = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    items.forEach((item, i) => {
      mesh.setMatrixAt(i, composeInstance(item, m));
      if (item.color) mesh.setColorAt(i, c.set(item.color));
    });
    mesh.count = items.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items]);

  if (!items.length) return null;
  return (
    <instancedMesh
      key={items.length}
      ref={ref}
      args={[geometry, material, items.length]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    />
  );
}
