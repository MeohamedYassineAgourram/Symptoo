import { useRouteError } from 'react-router';
import { CrashScreen } from './ErrorBoundary';

export function RouteError() {
  return <CrashScreen error={useRouteError()} />;
}
