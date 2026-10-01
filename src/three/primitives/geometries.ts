import {
  BoxGeometry,
  BufferAttribute,
  CapsuleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Shape,
  SphereGeometry,
  type BufferGeometry,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { PALETTE } from '../materials';

/** Geometries are built once and shared by every instance. */
const memo = <T,>(fn: () => T) => {
  let v: T | undefined;
  return () => (v ??= fn());
};

function paint(geo: BufferGeometry, color: string): BufferGeometry {
  const col = new Color(color);
  const count = geo.getAttribute('position').count;
  const data = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) data.set([col.r, col.g, col.b], i * 3);
  geo.setAttribute('color', new BufferAttribute(data, 3));
  return geo;
}

function nonIndexed(geo: BufferGeometry): BufferGeometry {
  return geo.index ? geo.toNonIndexed() : geo;
}

/** Arched opening (arcade / door / window), facing +z, base at y = 0, 1 unit tall. */
export const archGeometry = memo(() => {
  const w = 0.5;
  const shape = new Shape();
  shape.moveTo(-w / 2, 0);
  shape.lineTo(-w / 2, 1 - w / 2);
  shape.absarc(0, 1 - w / 2, w / 2, Math.PI, 0, true);
  shape.lineTo(w / 2, 0);
  shape.closePath();
  const geo = new ExtrudeGeometry(shape, { depth: 0.08, bevelEnabled: false, curveSegments: 10 });
  geo.translate(0, 0, -0.04);
  return geo;
});

/** Pyramid hip roof with a square base of side 1, base at y = 0. */
export const roofGeometry = memo(() => {
  const geo = new ConeGeometry(Math.SQRT1_2, 0.55, 4, 1);
  geo.rotateY(Math.PI / 4);
  geo.translate(0, 0.275, 0);
  return geo;
});

export const palmTrunkGeometry = memo(() => {
  const geo = new CylinderGeometry(0.07, 0.12, 2.2, 7);
  geo.translate(0, 1.1, 0);
  return geo;
});

/** Palm crown: fronds radiating from the top, plus a coconut cluster. Vertex-coloured. */
export const palmCrownGeometry = memo(() => {
  const parts: BufferGeometry[] = [];
  for (let i = 0; i < 7; i++) {
    const frond = new SphereGeometry(0.5, 8, 4);
    frond.scale(1.25, 0.12, 0.36);
    frond.translate(0.62, -0.12, 0);
    frond.rotateZ(-0.35);
    frond.rotateY((i / 7) * Math.PI * 2);
    parts.push(paint(nonIndexed(frond), i % 2 ? PALETTE.leaf : PALETTE.leafDeep));
  }
  const nuts = new SphereGeometry(0.16, 8, 6);
  nuts.translate(0, -0.12, 0);
  parts.push(paint(nonIndexed(nuts), '#8a6a3c'));
  const geo = mergeGeometries(parts)!;
  geo.translate(0, 2.2, 0);
  return geo;
});

/** Orange tree: trunk, round crown and a few oranges, merged with vertex colours. */
export const orangeTreeGeometry = memo(() => {
  const trunk = new CylinderGeometry(0.08, 0.11, 0.7, 6);
  trunk.translate(0, 0.35, 0);
  const crown = new SphereGeometry(0.6, 14, 10);
  crown.scale(1, 0.92, 1);
  crown.translate(0, 1.15, 0);
  const parts = [paint(nonIndexed(trunk), PALETTE.trunk), paint(nonIndexed(crown), '#5f9f58')];
  const spots: [number, number, number][] = [
    [0.45, 1.3, 0.3],
    [-0.35, 1.0, 0.45],
    [0.15, 1.55, -0.4],
    [0.5, 0.95, -0.2],
    [-0.5, 1.35, -0.1],
    [0.0, 1.05, 0.58],
  ];
  for (const [x, y, z] of spots) {
    const o = new SphereGeometry(0.09, 6, 5);
    o.translate(x, y, z);
    parts.push(paint(nonIndexed(o), '#f0962e'));
  }
  return mergeGeometries(parts)!;
});

export const bushGeometry = memo(() => {
  const geo = new SphereGeometry(0.5, 12, 8);
  geo.scale(1, 0.8, 1);
  geo.translate(0, 0.35, 0);
  return geo;
});

/** Chibi body (README §4.4): torso capsule, base at y = 0, ~0.55 tall. */
export const bodyGeometry = memo(() => {
  const geo = new CapsuleGeometry(0.16, 0.22, 4, 10);
  geo.translate(0, 0.27, 0);
  return geo;
});

/** Big head, about a third of total height. */
export const headGeometry = memo(() => {
  const geo = new SphereGeometry(0.2, 14, 10);
  geo.translate(0, 0.7, 0);
  return geo;
});

export const hairGeometry = memo(() => {
  const geo = new SphereGeometry(0.215, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.55);
  geo.rotateX(-0.25);
  geo.translate(0, 0.72, -0.01);
  return geo;
});

/** Hijab: a slightly larger head-and-shoulders wrap, open at the face (+z). */
export const hijabGeometry = memo(() => {
  const geo = new SphereGeometry(0.235, 14, 10, Math.PI * 0.72, Math.PI * 1.56);
  geo.scale(1, 1.1, 1);
  geo.translate(0, 0.69, -0.01);
  return geo;
});

export const wheelsGeometry = memo(() => {
  const parts: BufferGeometry[] = [];
  for (const x of [-0.42, 0.42]) {
    for (const z of [-0.27, 0.27]) {
      const w = new CylinderGeometry(0.13, 0.13, 0.1, 12);
      w.rotateX(Math.PI / 2);
      w.translate(x, 0.13, z);
      parts.push(w);
    }
  }
  return mergeGeometries(parts)!;
});

export const unitBox = memo(() => new BoxGeometry(1, 1, 1));
