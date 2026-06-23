import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Assets } from './pages/Assets';
import { Loans } from './pages/Loans';
import { Users } from './pages/Users';
import { Loader, Text } from '@mantine/core';
import './index.css';

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#05080f]">
        <Loader color="blue" size="xl" type="bars" />
        <Text c="blue.4" mt="md" fw={500} className="animate-pulse">Memverifikasi Sesi Akses...</Text>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Unauthorized access based on role
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Public Route Component (Only accessible if NOT logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#05080f]">
        <Loader color="blue" size="xl" type="bars" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Main App Router
function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public / Auth Route */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        
        {/* Protected System Routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Menu Utama (Bisa diakses Admin & User) */}
          <Route index element={<Dashboard />} />
          <Route path="loans" element={<Loans />} />

          {/* Menu Khusus Admin */}
          <Route 
            path="assets" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Assets />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="users" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Users />
              </ProtectedRoute>
            } 
          />

          {/* Fallback 404 Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
