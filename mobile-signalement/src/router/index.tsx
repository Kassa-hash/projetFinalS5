// Configuration du routeur React
import { createBrowserRouter, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import MapPage from '../pages/MapPage';
import AddSignalementPage from '../pages/AddSignalementPage';
import MesSignalementsPage from '../pages/MesSignalementsPage';
import ProtectedRoute from '../components/ProtectedRoute';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    // Routes protégées (nécessitent une authentification)
    element: <ProtectedRoute />,
    children: [
      {
        path: '/map',
        element: <MapPage />,
      },
      {
        path: '/add',
        element: <AddSignalementPage />,
      },
      {
        path: '/mes-signalements',
        element: <MesSignalementsPage />,
      },
    ],
  },
  {
    // Route 404
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);

export default router;
