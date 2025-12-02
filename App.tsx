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
import Auth from './pages/Auth';
import { useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';

const AppRoutes = () => {
    const location = useLocation();
    const { session, profile, loading } = useAuth();

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    // SCENARIO 1: Not Authenticated -> Force Auth Page
    if (!session && location.pathname !== '/auth') {
        return <Navigate to="/auth" replace />;
    }

    // SCENARIO 2: Authenticated but No Profile -> Force Welcome
    const hasProfile = !!profile;
    if (session && !hasProfile && location.pathname !== '/welcome' && location.pathname !== '/auth') {
        return <Navigate to="/welcome" replace />;
    }

    // SCENARIO 3: Authenticated AND Has Profile -> Prevent access to Welcome or Auth
    if (session && hasProfile && (location.pathname === '/welcome' || location.pathname === '/auth')) {
        return <Navigate to="/" replace />;
    }

    return (
        <Routes>
            {/* Public/Auth Routes */}
            <Route path="/auth" element={<Auth />} />
            
            {/* Standalone Route (Onboarding) */}
            <Route path="/welcome" element={<Welcome />} />

            {/* Main App Routes (Protected) */}
            <Route path="/*" element={
                <Layout>
                    <Routes>
                        <Route path="/" element={<Dashboard userProfile={profile} />} />
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