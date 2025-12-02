import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MyTenders from './pages/MyTenders';
import TenderDetail from './pages/TenderDetail';
import Stats from './pages/Stats';
import Profile from './pages/Profile';
import Pricing from './pages/Pricing';
import Admin from './pages/Admin';
import Welcome from './pages/Welcome';
import { isNewUser } from './services/mockData';

// Wrapper to handle conditional redirects
const AppRoutes = () => {
    const location = useLocation();
    const isNew = isNewUser();

    // 1. If user is NEW and NOT on welcome page -> Force Welcome
    if (isNew && location.pathname !== '/welcome') {
        return <Navigate to="/welcome" replace />;
    }

    // 2. If user is NOT NEW (Configured) and tries to access Welcome -> Force Dashboard
    if (!isNew && location.pathname === '/welcome') {
        return <Navigate to="/" replace />;
    }

    return (
        <Routes>
            {/* Standalone Route (No Layout) */}
            <Route path="/welcome" element={<Welcome />} />

            {/* Main App Routes (With Layout) */}
            <Route path="/*" element={
                <Layout>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/tender/:id" element={<TenderDetail />} />
                        <Route path="/my-tenders" element={<MyTenders />} />
                        <Route path="/stats" element={<Stats />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/pricing" element={<Pricing />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Layout>
            } />
        </Routes>
    );
};

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;