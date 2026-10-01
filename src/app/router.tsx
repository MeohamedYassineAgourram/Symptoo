import { createBrowserRouter } from 'react-router';
import { Layout } from './Layout';
import { HubScreen } from './screens/HubScreen';
import { WingScreen } from './screens/WingScreen';
import { GardeRapideScreen } from '../features/garde-rapide/GardeRapideScreen';
import { ConsultationScreen } from '../features/consultation/ConsultationScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { PlaceholderScreen } from './screens/PlaceholderScreen';
import { RouteError } from './RouteError';
import { SignsGallery } from './screens/SignsGallery';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <HubScreen /> },
      { path: 'aile/:wingId', element: <WingScreen /> },
      { path: 'garde/:wingId', element: <GardeRapideScreen /> },
      { path: 'consultation/:wingId', element: <ConsultationScreen /> },
      { path: 'parametres', element: <SettingsScreen /> },
      { path: 'agenda', element: <PlaceholderScreen /> },
      { path: 'fiches', element: <PlaceholderScreen /> },
      { path: 'vestiaire', element: <PlaceholderScreen /> },
      { path: 'profil', element: <PlaceholderScreen /> },
      // Dev-only visual check of the clinical signs on the 3D patient.
      ...(import.meta.env.DEV ? [{ path: 'dev/signes', element: <SignsGallery /> }] : []),
      { path: '*', element: <HubScreen /> },
    ],
  },
]);
