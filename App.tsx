
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MyTenders from './pages/MyTenders';
import TenderDetail from './pages/TenderDetail';
import Stats from './pages/Stats';
import Profile from './pages/Profile';
import Pricing from './pages/Pricing';
import Settings from './pages/Settings';
import SuperAdmin from './pages/SuperAdmin';
import Welcome from './pages/Welcome';
import Auth from './pages/Auth';
import { useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';
import RequireSuperAdmin from './components/RequireSuperAdmin';
import OnboardingTour from './components/OnboardingTour';

const AppContent = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { session, profile, loading } = useAuth();
    const [showTour, setShowTour] = useState(false);

    // Theme Initialization
    useEffect(() => {
        const storedTheme = localStorage.getItem('tenderai_theme');
        const root = window.document.documentElement;
        
        if (storedTheme === 'light') {
            root.classList.remove('dark');
        } else {
            // Default to dark
            root.classList.add('dark');
        }
    }, []);

    // Check for tour trigger on mount and route changes
    useEffect(() => {
        const shouldShow = localStorage.getItem('tenderai_show_tutorial');
        const hasSeen = localStorage.getItem('tenderai_has_seen_tutorial');

        // Show if explicitly requested OR (never seen AND on dashboard)
        if (shouldShow === 'true') {
            if (location.pathname === '/') {
                setShowTour(true);
            }
        }
    }, [location.pathname]);

    const handleTourComplete = () => {
        setShowTour(false);
        localStorage.removeItem('tenderai_show_tutorial');
        localStorage.setItem('tenderai_has_seen_tutorial', 'true');
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
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
        <>
            <OnboardingTour isActive={showTour} onComplete={handleTourComplete} />
            <Routes>
                {/* Public/Auth Routes */}
                <Route path="/auth" element={<Auth />} />
                
                {/* Standalone Route (Onboarding) */}
                <Route path="/welcome" element={<Welcome />} />

                {/* Main App Routes (Protected) */}
                <Route path="/*" element={
                    <Layout>
                        <Routes>
                            <Route path="/" element={<Dashboard userProfile={profile} onOpenTender={(id) => navigate(`/tender/${id}`)} />} />
                            <Route path="/tender/:id" element={<TenderDetail />} />
                            <Route path="/my-tenders" element={<MyTenders />} />
                            <Route path="/stats" element={<Stats />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/pricing" element={<Pricing />} />
                            <Route path="/settings" element={<Settings />} />
                            
                            {/* Protected Super Admin Route */}
                            <Route 
                            path="/super-admin" 
                            element={
                                <RequireSuperAdmin>
                                <SuperAdmin />
                                </RequireSuperAdmin>
                            } 
                            />
                            
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </Layout>
                } />
            </Routes>
        </>
    );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
