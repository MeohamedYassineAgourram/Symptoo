import { createBrowserRouter } from 'react-router';
import { Layout } from './Layout';
import { HubScreen } from './screens/HubScreen';
import { WingScreen } from './screens/WingScreen';
import { GardeRapideScreen } from '../features/garde-rapide/GardeRapideScreen';
import { ConsultationScreen } from '../features/consultation/ConsultationScreen';
import { QuiSuisJeScreen } from '../features/qui-suis-je/QuiSuisJeScreen';
import { MemoScreen } from '../features/memo/MemoScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { PlaceholderScreen } from './screens/PlaceholderScreen';
import { StaffScreen } from './screens/StaffScreen';
import { AgendaScreen } from './screens/AgendaScreen';
import { FichesScreen } from './screens/FichesScreen';
import { ProfilScreen } from './screens/ProfilScreen';
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
      { path: 'qui-suis-je/:wingId', element: <QuiSuisJeScreen /> },
      { path: 'memo/:wingId', element: <MemoScreen /> },
      { path: 'visite', element: <ConsultationScreen key="visite" mode="visite" /> },
      { path: 'parametres', element: <SettingsScreen /> },
      { path: 'agenda', element: <AgendaScreen /> },
      { path: 'fiches', element: <FichesScreen /> },
      { path: 'staff', element: <StaffScreen /> },
      { path: 'vestiaire', element: <PlaceholderScreen /> },
      { path: 'profil', element: <ProfilScreen /> },
      // Dev-only visual check of the clinical signs on the 3D patient.
      ...(import.meta.env.DEV ? [{ path: 'dev/signes', element: <SignsGallery /> }] : []),
      { path: '*', element: <HubScreen /> },
    ],
  },
]);
