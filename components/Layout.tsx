import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  BarChart2, 
  Building2, 
  CreditCard, 
  ShieldAlert,
  Menu,
  X
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
        isActive 
          ? 'bg-primary text-white shadow-md' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`
    }
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </NavLink>
);

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

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
        </nav>

        <div className="mt-auto pt-4 border-t border-slate-700">
           <NavItem to="/admin" icon={ShieldAlert} label="Administration" />
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
            <div onClick={() => setIsMobileMenuOpen(false)}><NavItem to="/pricing" icon={CreditCard} label="Plans & Tarifs" /></div>
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