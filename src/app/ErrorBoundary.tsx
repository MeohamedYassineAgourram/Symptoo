import { Component, type ErrorInfo, type ReactNode } from 'react';
import { t } from '../i18n/t';

interface Props {
  children: ReactNode;
  /** Rendered instead of the default full-screen message (e.g. for the 3D layer only). */
  fallback?: (error: Error) => ReactNode;
}

/** Catches render errors so a crash shows a readable message instead of a blank screen. */
export class ErrorBoundary extends Component<Props, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[SémioGarde]', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error);
    return <CrashScreen error={error} />;
  }
}

export function CrashScreen({ error }: { error: unknown }) {
  const message = error instanceof Error ? `${error.message}\n\n${error.stack ?? ''}` : String(error);
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[var(--bg-hub)] p-4">
      <div className="glass max-h-full w-full max-w-lg overflow-auto rounded-3xl p-5">
        <h1 className="text-xl font-extrabold">{t('errors.title')}</h1>
        <p className="mt-1 text-ink-soft">{t('errors.body')}</p>
        <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-surface-strong p-3 text-xs whitespace-pre-wrap">
          {message}
        </pre>
        <button
          type="button"
          className="toy-btn mt-4 min-h-11 rounded-2xl px-5 font-extrabold"
          onClick={() => location.reload()}
        >
          {t('errors.reload')}
        </button>
      </div>
    </div>
  );
}
