import type { QualityProfile } from './quality';

/**
 * One warm "sun" from the top-left of the screen casting a long soft shadow toward the
 * bottom-right, plus a sky/ground fill so shadows are never black (README §3.1).
 */
export function Lighting({ quality, extent = 16 }: { quality: QualityProfile; extent?: number }) {
  return (
    <>
      <hemisphereLight args={['#fffaf2', '#c9b89c', 1.35]} />
      <directionalLight
        position={[-16, 17, 7]}
        intensity={2.3}
        color="#fff0d8"
        castShadow={quality.shadows}
        shadow-mapSize={[quality.shadowMapSize, quality.shadowMapSize]}
        shadow-camera-left={-extent * 1.4}
        shadow-camera-right={extent * 1.4}
        shadow-camera-top={extent * 1.4}
        shadow-camera-bottom={-extent * 1.4}
        shadow-camera-near={1}
        shadow-camera-far={90}
        shadow-bias={-0.0005}
        shadow-normalBias={0.03}
        shadow-intensity={0.62}
      />
    </>
  );
}
