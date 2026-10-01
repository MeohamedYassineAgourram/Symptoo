import { lazy, Suspense, useEffect, useMemo, type CSSProperties } from 'react';
import { Outlet, useLocation } from 'react-router';
import { isWingId, WING_THEMES } from '../content/wings';
import { useSettings } from '../stores/settingsStore';
import { useProgress } from '../stores/progressStore';
import { IvDripLoader } from '../ui/IvDripLoader';
import { useTheme } from './useTheme';
import type { SceneKind } from '../scenes/SceneCanvas';
import { ErrorBoundary } from './ErrorBoundary';
import { hasWebGL } from '../three/webgl';
import { t } from '../i18n/t';

const WEBGL = hasWebGL();

function SceneNotice({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <p className="glass max-w-sm rounded-2xl p-4 text-center text-sm font-semibold">{text}</p>
    </div>
  );
}

// The 3D bundle (three + r3f) loads after the UI shell paints.
const SceneCanvas = lazy(() => import('../scenes/SceneCanvas'));

function sceneFromPath(pathname: string): SceneKind {
  const [, section, id] = pathname.split('/');
  if (section === 'aile' && isWingId(id)) return { kind: 'wing', wing: id };
  if (section === 'garde' && (isWingId(id) || id === 'toutes')) return { kind: 'garde', wing: id };
  return { kind: 'hub' };
}

export function Layout() {
  useTheme();
  const { pathname } = useLocation();
  const loadSettings = useSettings((s) => s.load);
  const refreshProgress = useProgress((s) => s.refresh);

  useEffect(() => {
    void loadSettings();
    void refreshProgress();
  }, [loadSettings, refreshProgress]);

  const scene = useMemo(() => sceneFromPath(pathname), [pathname]);
  const bgVar = scene.kind !== 'hub' && isWingId(scene.wing) ? WING_THEMES[scene.wing].bgVar : '--bg-hub';

  return (
    <div
      className="scene-root fixed inset-0 overflow-hidden"
      style={{ '--scene-bg': `var(${bgVar})` } as CSSProperties}
    >
      <div className="absolute inset-0">
        {/* A 3D failure must never take the menus down with it: the UI overlay keeps working. */}
        {WEBGL ? (
          <ErrorBoundary fallback={(e) => <SceneNotice text={t('errors.scene', { message: e.message })} />}>
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center">
                  <IvDripLoader />
                </div>
              }
            >
              <SceneCanvas scene={scene} />
            </Suspense>
          </ErrorBoundary>
        ) : (
          <SceneNotice text={t('errors.noWebgl')} />
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 flex flex-col">
        <Outlet />
      </div>
    </div>
  );
}
