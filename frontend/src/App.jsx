import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoadingSpinner } from './components/common/LoadingSpinner';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { MovesPage } from './pages/MovesPage';
import { TasksPage } from './pages/TasksPage';
import { RoomsPage } from './pages/RoomsPage';
import { BoxesPage } from './pages/BoxesPage';
import { InventoryPage } from './pages/InventoryPage';
import { BudgetPage } from './pages/BudgetPage';
import { BookingsPage } from './pages/BookingsPage';
import { TrackingPage } from './pages/TrackingPage';
import { MembersPage } from './pages/MembersPage';
import { ActivityPage } from './pages/ActivityPage';

// Guard for protected routes
const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" text="Authenticating..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

// Guard for guest-only auth pages (login, register)
const GuestRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" text="Loading MoveMate..." />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default function App() {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* Guest-only routes */}
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        }
      />

      {/* Protected App Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/moves" element={<MovesPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/boxes" element={<BoxesPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/tracking" element={<TrackingPage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/activity" element={<ActivityPage />} />
        </Route>
      </Route>

      {/* Catch-all Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

