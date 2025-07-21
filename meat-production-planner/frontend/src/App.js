import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import MainLayout from './components/common/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SalesPlanning from './pages/SalesPlanning';
import ProductionPlanning from './pages/ProductionPlanning';
import Products from './pages/Products';
import Pricing from './pages/Pricing';
import PlanningOverview from './pages/PlanningOverview';
import Workers from './pages/Workers';
import Customers from './pages/Customers';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="sales-planning" element={<SalesPlanning />} />
        <Route path="production-planning" element={<ProductionPlanning />} />
        <Route path="products" element={<Products />} />
        <Route path="pricing" element={<Pricing />} />
        <Route path="planning-overview" element={<PlanningOverview />} />
        <Route path="workers" element={<Workers />} />
        <Route path="customers" element={<Customers />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;