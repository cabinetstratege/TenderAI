import React, { useEffect, useState } from 'react';
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
import { userService } from './services/userService';
import { UserProfile } from './types';
import { Loader2 } from 'lucide-react';

// Wrapper to handle conditional redirects based on async profile load
const AppRoutes = () => {
    const location = useLocation();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            setIsLoading(true);
            const userProfile = await userService.getCurrentProfile();
            setProfile(userProfile);
            setIsLoading(false);
        };
        checkUser();
    }, []);

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    const isNew = !profile;

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