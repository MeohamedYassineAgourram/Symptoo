import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { mix, patientColors } from './patientLook';
import { clay } from './materials';
import type { PatientLook } from '../stores/sceneStore';

/**
 * Builds a lying patient from case `appearance` (README §4.4) with primitive parts, and shows
 * the visible clinical signs on the model so inspection is real observation.
 * Local frame: body along +x (head at -x), face up (+y), table surface at y = 0, +z toward the doctor.
 */

const CLOTHES: Record<string, string> = {
  djellaba: '#7fa7a0',
  'tenue-travail': '#7d8fa6',
  quotidien: '#8fb3d9',
  'blouse-hopital': '#9cc7c1',
};

const HAIR: Record<string, string> = {
  'court-noir': '#2b2118',
  'long-noir': '#1d1a17',
  'court-gris': '#9b9690',
  'court-brun': '#4a3121',
};

/** Root-zone anchors on the patient (local frame), shared by hotspots, highlights and the doctor. */
export const PATIENT_ANCHORS: Record<string, [number, number, number]> = {
  general: [-0.3, 0.78, 0],
  tete: [-0.98, 0.52, 0],
  cou: [-0.7, 0.3, 0.14],
  thorax: [-0.36, 0.46, 0],
  abdomen: [0.06, 0.44, 0],
  'aires-ganglionnaires': [-0.56, 0.26, 0.34],
  membres: [0.86, 0.24, 0.2],
  peau: [-0.1, 0.24, 0.38],
  neuro: [1.12, 0.34, -0.14],
};

export function PatientBuilder({ look, position }: { look: PatientLook; position: [number, number, number] }) {
  const has = (s: string) => look.visibleSigns.includes(s);
  const colors = useMemo(() => patientColors(look), [look]);
  const cloth = CLOTHES[look.clothing] ?? '#8fb3d9';
  const pants = mix(cloth, '#2f3b4c', 0.35);
  const hairColor = look.age >= 65 && !look.hijab ? '#a9a49c' : (HAIR[look.hair] ?? '#2b2118');
  const thin = has('amaigrissement') ? 0.78 : 1;
  const oedema = has('oedemes-mi') ? 1.55 : 1;
  const painPose = has('douleur-abdominale');

  const chest = useRef<Group>(null);
  const upper = useRef<Group>(null);
  const breath = has('dyspnee') ? { speed: 7.5, amp: 0.07 } : { speed: 2.2, amp: 0.02 };
  const coughs = has('toux');

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (chest.current) chest.current.scale.y = 1 + Math.sin(t * breath.speed) * breath.amp;
    if (upper.current) {
      // Periodic cough: a quick lift of the head and shoulders every ~3.4 s.
      const phase = t % 3.4;
      const lift = coughs && phase < 0.36 ? Math.sin((phase / 0.36) * Math.PI) * 0.06 : 0;
      upper.current.position.y = lift;
      upper.current.rotation.z = -lift * 0.8;
    }
  });

  const skin = clay(colors.skin);
  const clothes = clay(cloth);
  const side = [-1, 1] as const;

  return (
    <group position={position}>
      {/* Head, neck and shoulders move together when coughing */}
      <group ref={upper}>
        <mesh position={[-0.98, 0.25, 0]} material={skin} castShadow>
          <sphereGeometry args={[0.24, 20, 16]} />
        </mesh>
        {/* Eyes (sclera tint shows ictère), pupils, nose, lips */}
        {side.map((s) => (
          <group key={s} position={[-1.03, 0.47, s * 0.085]} scale={has('exophtalmie') ? 1.45 : 1}>
            <mesh material={clay(colors.sclera)}>
              <sphereGeometry args={[0.045, 12, 10]} />
            </mesh>
            <mesh position={[0, 0.034, 0]} material={clay('#2a211c')}>
              <sphereGeometry args={[0.02, 10, 8]} />
            </mesh>
          </group>
        ))}
        <mesh position={[-0.95, 0.5, 0]} material={skin}>
          <sphereGeometry args={[0.032, 10, 8]} />
        </mesh>
        <mesh position={[-0.87, 0.455, 0]} scale={[0.6, 0.35, 1.3]} material={clay(colors.lips)}>
          <sphereGeometry args={[0.045, 12, 8]} />
        </mesh>
        {has('fievre') && (
          <>
            {side.map((s) => (
              <mesh key={s} position={[-0.92, 0.44, s * 0.14]} material={clay('#ff7a7a', { transparent: true, opacity: 0.55 })}>
                <sphereGeometry args={[0.05, 10, 8]} />
              </mesh>
            ))}
            {[-0.1, 0.03, 0.12].map((z, i) => (
              <mesh key={z} position={[-1.1 + i * 0.02, 0.43, z]} material={clay('#cfeeff', { transparent: true, opacity: 0.75, roughness: 0.1 })}>
                <sphereGeometry args={[0.022, 8, 6]} />
              </mesh>
            ))}
          </>
        )}
        {look.hijab ? (
          <mesh position={[-1.05, 0.16, 0]} scale={[1, 0.95, 1.06]} material={clay('#5f86b0')} castShadow>
            <sphereGeometry args={[0.27, 20, 14]} />
          </mesh>
        ) : look.hair !== 'chauve' ? (
          <mesh position={[-1.06, 0.2, 0]} scale={[1, 0.86, 1]} material={clay(hairColor)} castShadow>
            <sphereGeometry args={[0.255, 18, 14]} />
          </mesh>
        ) : null}
        {look.hair === 'long-noir' && !look.hijab && (
          <mesh position={[-1.28, 0.06, 0]} scale={[1.2, 0.35, 1.4]} material={clay(hairColor)}>
            <sphereGeometry args={[0.22, 14, 10]} />
          </mesh>
        )}
        {look.beard && (
          <mesh position={[-0.82, 0.33, 0]} scale={[0.75, 0.6, 1.05]} material={clay(look.age >= 65 ? '#a9a49c' : '#2b2118')}>
            <sphereGeometry args={[0.17, 14, 10]} />
          </mesh>
        )}
        {/* Neck, with a visible distended jugular vein when turgescent */}
        <mesh position={[-0.72, 0.17, 0]} rotation-z={Math.PI / 2} material={skin}>
          <cylinderGeometry args={[0.09, 0.09, 0.22, 12]} />
        </mesh>
        {has('turgescence-jugulaire') && (
          // Distended vein on the camera-facing side of the neck, from the jaw to the clavicle.
          <mesh position={[-0.74, 0.25, 0.165]} rotation={[0.5, 0, Math.PI / 2]} material={clay('#5368b0')}>
            <capsuleGeometry args={[0.03, 0.17, 4, 8]} />
          </mesh>
        )}
      </group>

      {/* Chest and belly breathe (fast and deep in dyspnée) */}
      <group ref={chest}>
        <mesh position={[-0.38, 0.2, 0]} rotation-z={Math.PI / 2} scale={[thin, 1, thin]} material={clothes} castShadow>
          <capsuleGeometry args={[0.22, 0.4, 6, 14]} />
        </mesh>
        <mesh
          position={[0, 0.18, 0]}
          scale={has('ascite') ? [1.2, 1.7, 1.25] : [1, thin, thin]}
          material={clothes}
          castShadow
        >
          <sphereGeometry args={[0.21, 18, 14]} />
        </mesh>
      </group>
      <mesh position={[0.26, 0.16, 0]} rotation-z={Math.PI / 2} scale={[thin, 1, thin]} material={clay(pants)} castShadow>
        <capsuleGeometry args={[0.19, 0.12, 4, 12]} />
      </mesh>

      {/* Arms; with abdominal pain the right hand rests on the belly */}
      {side.map((s) => {
        const onBelly = painPose && s === 1;
        return (
          <group key={s}>
            <mesh position={[-0.42, 0.13, s * 0.3]} rotation-z={Math.PI / 2} scale={[thin, 1, thin]} material={clothes} castShadow>
              <capsuleGeometry args={[0.065, 0.24, 4, 10]} />
            </mesh>
            <mesh
              position={onBelly ? [-0.14, 0.24, 0.22] : [-0.12, 0.12, s * 0.31]}
              rotation={onBelly ? [0.9, 0, Math.PI / 2] : [0, 0, Math.PI / 2]}
              scale={[thin, 1, thin]}
              material={skin}
              castShadow
            >
              <capsuleGeometry args={[0.058, 0.22, 4, 10]} />
            </mesh>
            <group position={onBelly ? [0.02, 0.37, 0.1] : [0.07, 0.12, s * 0.31]}>
              <mesh material={skin}>
                <sphereGeometry args={[0.07, 12, 10]} />
              </mesh>
              {/* Fingertips: bluish in cyanose, clubbed in hippocratisme digital */}
              <mesh position={[0.075, 0, 0]} scale={has('hippocratisme') ? 1.7 : 1} material={clay(colors.fingertips)}>
                <sphereGeometry args={[0.034, 10, 8]} />
              </mesh>
            </group>
          </group>
        );
      })}

      {/* Legs: swollen lower legs and feet with œdèmes */}
      {side.map((s) => (
        <group key={s}>
          <mesh position={[0.52, 0.11, s * 0.12]} rotation-z={Math.PI / 2} scale={[thin, 1, thin]} material={clay(pants)} castShadow>
            <capsuleGeometry args={[0.095, 0.3, 4, 10]} />
          </mesh>
          <mesh position={[0.88, 0.09, s * 0.12]} rotation-z={Math.PI / 2} scale={[thin * oedema, 1, thin * oedema]} material={skin} castShadow>
            <capsuleGeometry args={[0.072, 0.3, 4, 10]} />
          </mesh>
          <mesh position={[1.1, 0.15, s * 0.12]} scale={[0.8 * Math.min(oedema, 1.3), 1.4, Math.min(oedema, 1.3)]} material={skin} castShadow>
            <sphereGeometry args={[0.07, 10, 8]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
