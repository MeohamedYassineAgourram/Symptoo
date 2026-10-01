import { createBrowserRouter } from 'react-router';
import { Layout } from './Layout';
import { HubScreen } from './screens/HubScreen';
import { WingScreen } from './screens/WingScreen';
import { GardeRapideScreen } from '../features/garde-rapide/GardeRapideScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { PlaceholderScreen } from './screens/PlaceholderScreen';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <HubScreen /> },
      { path: 'aile/:wingId', element: <WingScreen /> },
      { path: 'garde/:wingId', element: <GardeRapideScreen /> },
      { path: 'parametres', element: <SettingsScreen /> },
      { path: 'agenda', element: <PlaceholderScreen /> },
      { path: 'fiches', element: <PlaceholderScreen /> },
      { path: 'vestiaire', element: <PlaceholderScreen /> },
      { path: 'profil', element: <PlaceholderScreen /> },
      { path: '*', element: <HubScreen /> },
    ],
  },
]);
