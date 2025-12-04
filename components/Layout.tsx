
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { userService } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Briefcase, 
  BarChart2, 
  Building2, 
  CreditCard, 
  ShieldAlert,
  Menu,
  X,
  LogOut,
  ShieldCheck
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const NavItem = ({ to, icon: Icon, label, className }: { to: string; icon: any; label: string; className?: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
        isActive 
          ? 'bg-primary text-white shadow-md' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      } ${className || ''}`
    }
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </NavLink>
);

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await userService.resetLocalUser();
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white p-4">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-lg flex items-center justify-center font-bold text-lg">
            T
          </div>
          <h1 className="text-xl font-bold tracking-tight">TenderAI</h1>
        </div>

        <nav className="flex-1 space-y-1">
          <NavItem to="/" icon={LayoutDashboard} label="Tableau de bord" />
          <NavItem to="/my-tenders" icon={Briefcase} label="Mes Appels d'Offres" />
          <NavItem to="/stats" icon={BarChart2} label="Statistiques" />
          <NavItem to="/profile" icon={Building2} label="Profil Entreprise" />
          <NavItem to="/pricing" icon={CreditCard} label="Plans & Tarifs" />
          
          {/* Super Admin Link */}
          {isSuperAdmin && (
            <div className="pt-4 mt-4 border-t border-slate-800">
                <p className="px-4 text-xs font-bold text-slate-500 uppercase mb-2">Backoffice</p>
                <NavItem 
                    to="/super-admin" 
                    icon={ShieldCheck} 
                    label="Super Admin" 
                    className="text-green-400 hover:text-green-300 hover:bg-slate-800/50"
                />
            </div>
          )}
        </nav>

        <div className="mt-auto pt-4 border-t border-slate-700 space-y-1">
           {/* Standard User Admin (Settings) */}
           <NavItem to="/admin" icon={ShieldAlert} label="Paramètres" />
           <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-slate-400 hover:bg-red-900/50 hover:text-red-200"
           >
              <LogOut size={20} />
              <span className="font-medium">Déconnexion</span>
           </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-slate-900 text-white z-20 flex items-center justify-between p-4">
        <span className="font-bold">TenderAI</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900 z-10 pt-16 px-4 md:hidden">
           <nav className="space-y-2">
            <div onClick={() => setIsMobileMenuOpen(false)}><NavItem to="/" icon={LayoutDashboard} label="Tableau de bord" /></div>
            <div onClick={() => setIsMobileMenuOpen(false)}><NavItem to="/my-tenders" icon={Briefcase} label="Mes Appels d'Offres" /></div>
            <div onClick={() => setIsMobileMenuOpen(false)}><NavItem to="/stats" icon={BarChart2} label="Statistiques" /></div>
            <div onClick={() => setIsMobileMenuOpen(false)}><NavItem to="/profile" icon={Building2} label="Profil Entreprise" /></div>
            
            {/* Super Admin Mobile */}
            {isSuperAdmin && (
                <div onClick={() => setIsMobileMenuOpen(false)}>
                    <NavItem to="/super-admin" icon={ShieldCheck} label="Super Admin" className="text-green-400" />
                </div>
            )}

            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-slate-400 hover:bg-red-900/50 hover:text-red-200 mt-4 border-t border-slate-700"
           >
              <LogOut size={20} />
              <span className="font-medium">Déconnexion</span>
           </button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pt-16 md:pt-0">
        <div className="container mx-auto p-4 md:p-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
