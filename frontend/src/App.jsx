import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CategoryProvider } from '@/context/CategoryContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import LandingPage from '@/pages/LandingPage';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import UploadFile from '@/pages/Predictions';
import Customers from '@/pages/Customers';
import Recommendations from '@/pages/Recommendations';
import Settings from '@/pages/Settings';
import RegisterCategory from '@/pages/RegisterCategory';
import '@/index.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <CategoryProvider>
        <TooltipProvider delayDuration={200}>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected routes — wrapped in Layout with sidebar + navbar */}
              <Route element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/upload" element={<UploadFile />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/recommendations" element={<Recommendations />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/register-category" element={<RegisterCategory />} />
              </Route>
            </Routes>
          </Router>
        </TooltipProvider>
      </CategoryProvider>
    </AuthProvider>
  );
}

export default App;
