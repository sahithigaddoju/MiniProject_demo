import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ConfigureResources from './pages/ConfigureResources';
import UploadWorkloads from './pages/UploadWorkloads';
import ScheduledWorkloads from './pages/ScheduledWorkloads';
import History from './pages/History';
import Help from './pages/Help';
import DashboardLayout from './components/DashboardLayout';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Toaster
          position="top-right"
          toastOptions={{ className: 'text-sm font-medium' }}
          containerStyle={{ zIndex: 9999 }}
        />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/app"
            element={<PrivateRoute><DashboardLayout /></PrivateRoute>}
          >
            <Route index element={<Dashboard />} />
            <Route path="resources" element={<ConfigureResources />} />
            <Route path="upload" element={<UploadWorkloads />} />
            <Route path="scheduled" element={<ScheduledWorkloads />} />
            <Route path="history" element={<History />} />
            <Route path="help" element={<Help />} />
          </Route>
        </Routes>
      </ThemeProvider>
    </AuthProvider>
  );
}
