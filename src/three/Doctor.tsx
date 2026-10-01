import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils, Vector3, type Group, type Mesh } from 'three';
import type { Tool } from '../content/zones';
import { clay } from './materials';
import { EXAM_ANIMATION_MS } from '../app/constants';
import { bodyGeometry, hairGeometry, headGeometry } from './primitives/geometries';


interface DoctorProps {
  /** Where the doctor stands when idle (world). */
  home: [number, number, number];
  /** Latest exam action: target point on the patient (world) and tool. */
  action: { tool: Tool; target: [number, number, number]; seq: number } | null;
  reducedMotion?: boolean;
}

/**
 * The player's doctor (chibi, white coat, stethoscope). Walks along the table to the examined
 * zone and plays a short gesture per tool (README §4.3): lean to inspect, press to palpate,
 * tap to percuss, stethoscope to auscultate, hammer, lamp.
 */
export function Doctor({ home, action, reducedMotion }: DoctorProps) {
  const root = useRef<Group>(null);
  const torso = useRef<Group>(null);
  const arm = useRef<Group>(null);
  const hammer = useRef<Group>(null);
  const lamp = useRef<Group>(null);
  const steth = useRef<Mesh>(null);
  const started = useRef(-1);
  const pending = useRef(false);
  const goalX = useRef(home[0]);
  const tmp = useMemo(() => new Vector3(), []);

  useEffect(() => {
    if (!action) return;
    pending.current = true;
    goalX.current = MathUtils.clamp(action.target[0], home[0] - 1.6, home[0] + 1.6);
  }, [action, home]);

  useFrame(({ clock }, delta) => {
    const g = root.current;
    if (!g) return;
    const t = clock.elapsedTime;
    if (pending.current) {
      started.current = t;
      pending.current = false;
    }
    const k = reducedMotion ? 1 : 1 - Math.exp(-delta * 8);
    const moving = Math.abs(g.position.x - goalX.current) > 0.02;
    g.position.x = MathUtils.lerp(g.position.x, goalX.current, k);
    g.position.y = home[1] + (moving ? Math.abs(Math.sin(t * 14)) * 0.04 : 0);

    const elapsed = started.current < 0 ? Infinity : t - started.current;
    const active = action && elapsed < EXAM_ANIMATION_MS / 1000;
    const p = active ? Math.sin(Math.min(1, elapsed / (EXAM_ANIMATION_MS / 1000)) * Math.PI) : 0; // 0 → 1 → 0
    const tool = action?.tool;

    // Lean toward the patient (-z) for every gesture; deeper for inspection and auscultation.
    const lean = tool === 'inspection' || tool === 'auscultation' ? 0.28 : 0.16;
    if (torso.current) torso.current.rotation.x = p * lean + Math.sin(t * 2) * 0.01;

    // Right arm: reach out, then tool-specific motion.
    let armX = -p * 1.3;
    if (active && tool === 'percussion') armX += Math.sin(elapsed * 40) * 0.25 * p;
    if (active && tool === 'palpation') armX += Math.sin(elapsed * 14) * 0.12 * p;
    if (active && tool === 'marteau') armX += Math.sin(elapsed * 22) * 0.35 * p;
    if (active && tool === 'lampe') armX = -p * 1.9;
    // Manœuvre: a slow, wide lift-and-flex of the limb or neck.
    if (active && tool === 'manoeuvre') armX = -p * (1.0 + Math.sin(elapsed * 6) * 0.45);
    if (arm.current) arm.current.rotation.x = armX;

    if (hammer.current) hammer.current.visible = !!active && tool === 'marteau';
    if (lamp.current) lamp.current.visible = !!active && tool === 'lampe';
    if (steth.current) {
      // The chest piece travels from the neck to the patient during auscultation.
      const show = !!active && tool === 'auscultation';
      steth.current.visible = show;
      if (show && action) {
        tmp.set(...action.target);
        g.worldToLocal(tmp);
        steth.current.position.set(0, 0.62, 0.12).lerp(tmp, p);
      }
    }
  });

  return (
    <group ref={root} position={home} scale={1.35}>
      {/* Legs */}
      {[-0.07, 0.07].map((x) => (
        <mesh key={x} position={[x, 0.12, 0]} material={clay('#5b6676')} castShadow>
          <capsuleGeometry args={[0.05, 0.14, 4, 8]} />
        </mesh>
      ))}
      <group ref={torso} position={[0, 0.2, 0]}>
        <group position={[0, -0.2, 0]}>
          <mesh geometry={bodyGeometry()} material={clay('#ffffff')} position={[0, 0.2, 0]} castShadow />
          <mesh geometry={headGeometry()} material={clay('#d4a072')} position={[0, 0.2, 0]} castShadow />
          <mesh geometry={hairGeometry()} material={clay('#2b2118')} position={[0, 0.2, 0]} />
          {/* Stethoscope around the neck */}
          <mesh position={[0, 0.6, 0.02]} rotation-x={Math.PI / 2.4} material={clay('#3a7ca5')}>
            <torusGeometry args={[0.13, 0.016, 8, 24]} />
          </mesh>
          {/* Name badge */}
          <mesh position={[0.08, 0.5, 0.16]} material={clay('#2e8b7a')}>
            <boxGeometry args={[0.07, 0.04, 0.01]} />
          </mesh>
          <mesh ref={steth} visible={false} material={clay('#3a7ca5')}>
            <cylinderGeometry args={[0.04, 0.04, 0.02, 12]} />
          </mesh>
          {/* Left arm (static) */}
          <mesh position={[-0.2, 0.42, 0]} rotation-z={0.25} material={clay('#ffffff')} castShadow>
            <capsuleGeometry args={[0.045, 0.16, 4, 8]} />
          </mesh>
          {/* Right arm, pivoting at the shoulder */}
          <group ref={arm} position={[0.2, 0.52, 0]}>
            <mesh position={[0, -0.1, 0]} material={clay('#ffffff')} castShadow>
              <capsuleGeometry args={[0.045, 0.16, 4, 8]} />
            </mesh>
            <mesh position={[0, -0.22, 0]} material={clay('#d4a072')}>
              <sphereGeometry args={[0.045, 10, 8]} />
            </mesh>
            <group ref={hammer} visible={false} position={[0, -0.26, 0.04]}>
              <mesh material={clay('#8a96a3')}>
                <cylinderGeometry args={[0.012, 0.012, 0.18, 6]} />
              </mesh>
              <mesh position={[0, -0.09, 0]} rotation-z={Math.PI / 2} material={clay('#e07a6b')}>
                <cylinderGeometry args={[0.03, 0.03, 0.09, 10]} />
              </mesh>
            </group>
            <group ref={lamp} visible={false} position={[0, -0.27, 0.03]}>
              <mesh material={clay('#e2a93b', { emissive: '#ffd36b', emissiveIntensity: 1.2 })}>
                <cylinderGeometry args={[0.022, 0.018, 0.12, 8]} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
