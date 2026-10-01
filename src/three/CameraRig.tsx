import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MapControls, OrthographicCamera } from '@react-three/drei';
import { MathUtils, Vector3, type OrthographicCamera as OrthoCam } from 'three';
import type { MapControls as MapControlsImpl } from 'three-stdlib';

/** Isometric viewing direction: from front-right, ~35° above the horizon, no rotation. */
const ISO_OFFSET = new Vector3(1, 1.05, 1).normalize().multiplyScalar(60);

export interface CameraFocus {
  position: [number, number, number];
  zoomFactor: number;
}

interface CameraRigProps {
  /** World-space width and height the view must fit. */
  fit: [number, number];
  /** Fit used on portrait screens (phones); lets the diorama use the full width. */
  fitPortrait?: [number, number];
  /** Point the camera looks at by default. */
  center?: [number, number, number];
  /** Screen-space shift in px (positive x moves the scene left, positive y moves it up),
   *  so the scene stays visible beside or above UI panels. */
  shift?: [number, number];
  /** Max distance the target may pan from `center` on x/z. */
  panBounds?: number;
  interactive?: boolean;
  focus?: CameraFocus | null;
  onFocusArrive?: () => void;
  reducedMotion?: boolean;
  /** Changing this key resets the view (new scene). */
  sceneKey: string;
}

export function CameraRig({
  fit,
  fitPortrait,
  center = [0, 0, 0],
  shift = [0, 0],
  panBounds = 6,
  interactive = true,
  focus,
  onFocusArrive,
  reducedMotion = false,
  sceneKey,
}: CameraRigProps) {
  const size = useThree((s) => s.size);
  const cameraRef = useRef<OrthoCam>(null);
  const controlsRef = useRef<MapControlsImpl>(null);
  const arrived = useRef(false);
  const homing = useRef(false);
  const portrait = size.width / size.height < 0.75;
  const [fw, fh] = portrait && fitPortrait ? fitPortrait : fit;
  const baseZoom = Math.min(size.width / fw, size.height / fh);
  const [cx, cy, cz] = center;
  // Keyed on values, not array identity, so re-renders don't reset the view.
  const centerVec = useMemo(() => new Vector3(cx, cy, cz), [cx, cy, cz]);
  const [sx, sy] = shift;

  // Reset framing when the scene or viewport changes.
  useEffect(() => {
    const cam = cameraRef.current;
    const controls = controlsRef.current;
    if (!cam) return;
    cam.zoom = baseZoom;
    cam.position.copy(centerVec).add(ISO_OFFSET);
    cam.lookAt(centerVec);
    cam.updateProjectionMatrix();
    homing.current = false;
    if (controls) {
      controls.target.copy(centerVec);
      controls.update();
    }
  }, [sceneKey, baseZoom, centerVec]);

  // Screen-space shift through the projection, so panning and raycasting stay consistent.
  useEffect(() => {
    const cam = cameraRef.current;
    if (!cam) return;
    if (sx || sy) cam.setViewOffset(size.width, size.height, sx, sy, size.width, size.height);
    else cam.clearViewOffset();
    cam.updateProjectionMatrix();
  }, [sx, sy, size.width, size.height]);

  // Leaving a focus glides back to the default framing.
  const hadFocus = useRef(false);
  useEffect(() => {
    arrived.current = false;
    if (focus) hadFocus.current = true;
    else if (hadFocus.current) {
      hadFocus.current = false;
      homing.current = true;
    }
  }, [focus]);

  // Keep the target inside bounds by shifting camera and target together.
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const clamp = () => {
      const t = controls.target;
      const nx = MathUtils.clamp(t.x, centerVec.x - panBounds, centerVec.x + panBounds);
      const nz = MathUtils.clamp(t.z, centerVec.z - panBounds, centerVec.z + panBounds);
      const dx = nx - t.x;
      const dz = nz - t.z;
      if (dx || dz) {
        t.x = nx;
        t.z = nz;
        controls.object.position.x += dx;
        controls.object.position.z += dz;
      }
    };
    controls.addEventListener('change', clamp);
    return () => controls.removeEventListener('change', clamp);
  }, [panBounds, centerVec, sceneKey]);

  const goal = useMemo(() => new Vector3(), []);
  useFrame((_, delta) => {
    const cam = cameraRef.current;
    const controls = controlsRef.current;
    if (!cam || !controls || (!focus && !homing.current)) return;
    if (focus) goal.set(...focus.position);
    else goal.copy(centerVec);
    const goalZoom = focus ? baseZoom * focus.zoomFactor : baseZoom;
    const k = reducedMotion ? 1 : 1 - Math.exp(-delta * 7);
    controls.target.lerp(goal, k);
    cam.position.copy(controls.target).add(ISO_OFFSET);
    cam.zoom = MathUtils.lerp(cam.zoom, goalZoom, k);
    cam.updateProjectionMatrix();
    const close = controls.target.distanceTo(goal) < 0.05 && Math.abs(cam.zoom - goalZoom) < baseZoom * 0.01;
    if (!focus && close) homing.current = false;
    if (focus && !arrived.current && controls.target.distanceTo(goal) < 0.25 && Math.abs(cam.zoom - goalZoom) < baseZoom * 0.05) {
      arrived.current = true;
      onFocusArrive?.();
    }
  });

  return (
    <>
      <OrthographicCamera ref={cameraRef} makeDefault near={0.1} far={200} zoom={baseZoom} position={ISO_OFFSET.toArray()} />
      <MapControls
        ref={controlsRef}
        makeDefault
        enableRotate={false}
        enablePan={interactive && !focus}
        enableZoom={interactive && !focus}
        enableDamping={!reducedMotion}
        dampingFactor={0.12}
        minZoom={baseZoom * 0.85}
        maxZoom={baseZoom * 2.8}
        screenSpacePanning={false}
      />
    </>
  );
}
