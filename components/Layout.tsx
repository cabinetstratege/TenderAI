import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { userService } from '../services/userService';
import { useAuth } from '../context/AuthContext';
import NotificationCenter from './NotificationCenter';
import { 
  LayoutDashboard, 
  Briefcase, 
  BarChart2, 
  Building2, 
  CreditCard, 
  Menu,
  X,
  LogOut,
  ShieldCheck,
  User,
  Compass,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const NavItem = ({ to, icon: Icon, label, className }: { to: string; icon: any; label: string; className?: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group relative ${
        isActive 
          ? 'text-white bg-gradient-to-r from-blue-600/20 to-indigo-600/10 border-l-2 border-blue-500' 
          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/30'
      } ${className || ''}`
    }
  >
    <Icon size={20} className="relative z-10 transition-transform group-hover:scale-110" />
    <span className="font-medium relative z-10">{label}</span>
    {/* Hover Glow Effect */}
    <div className="absolute inset-0 bg-blue-500/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity blur-md"></div>
  </NavLink>
);

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { isSuperAdmin, session } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await userService.resetLocalUser();
  };

  const userEmail = session?.user?.email || 'Utilisateur';
  const userInitial = userEmail.charAt(0).toUpperCase();

  return (
    <div className="flex h-screen bg-background text-slate-200 overflow-hidden relative">
      {/* Background Ambient Glows */}
      <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      {/* Sidebar - Desktop (Glass Effect) */}
      <aside className="hidden md:flex flex-col w-72 glass border-r-0 z-20 shadow-2xl">
        <div className="flex items-center gap-3 mb-8 px-6 pt-8">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/10">
            <Compass className="text-white" size={24} />
          </div>
          <div>
              <h1 className="text-lg font-bold tracking-tight text-white leading-tight">Le Compagnon</h1>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">des Marchés Publics</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2 px-3">
          <NavItem to="/" icon={LayoutDashboard} label="Tableau de bord" />
          <NavItem to="/my-tenders" icon={Briefcase} label="Mes Appels d'Offres" />
          <NavItem to="/stats" icon={BarChart2} label="Statistiques" />
          <NavItem to="/profile" icon={Building2} label="Profil Entreprise" />
          <NavItem to="/pricing" icon={CreditCard} label="Abonnement" />
          
          {/* Super Admin Link */}
          {isSuperAdmin && (
            <div className="pt-6 mt-6 border-t border-white/5 mx-2">
                <p className="px-4 text-[10px] font-bold text-slate-500 uppercase mb-3 tracking-wider">Administration</p>
                <NavItem 
                    to="/super-admin" 
                    icon={ShieldCheck} 
                    label="Super Admin" 
                    className="text-emerald-400 hover:text-emerald-300 bg-emerald-950/10 border-l-2 border-transparent hover:border-emerald-500"
                />
            </div>
          )}
        </nav>

        <div className="mt-auto pt-4 border-t border-white/5 bg-slate-900/20">
           {/* Notification Center Integration */}
           <div className="flex justify-between items-center px-6 mb-4">
               <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Alertes</span>
               <NotificationCenter />
           </div>

           {/* User Profile / Settings Button */}
           <div className="px-3 pb-4">
               <NavLink 
                 to="/settings"
                 className={({ isActive }) => 
                    `flex items-center gap-3 p-3 rounded-xl transition-all group border ${
                        isActive ? 'bg-white/5 border-white/10 shadow-lg' : 'hover:bg-white/5 border-transparent'
                    }`
                 }
               >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white font-bold border border-white/10 shadow-inner shrink-0 ring-2 ring-transparent group-hover:ring-blue-500/30 transition-all">
                      {userInitial}
                  </div>
                  <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-100 truncate leading-none mb-1.5 group-hover:text-blue-300 transition-colors">
                          {userEmail}
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">
                          Paramètres du compte
                      </p>
                  </div>
               </NavLink>
    
               <button 
                  onClick={handleLogout}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-red-300 hover:bg-red-500/10 transition-colors"
               >
                  <LogOut size={14} /> Déconnexion
               </button>
           </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full glass z-50 flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Compass className="text-white" size={18} />
            </div>
            <span className="font-bold text-white">Le Compagnon</span>
        </div>
        <div className="flex items-center gap-4">
            <NotificationCenter />
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-300">
            {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-xl z-40 pt-20 px-4 md:hidden animate-fade-in">
           <nav className="space-y-2">
            <div onClick={() => setIsMobileMenuOpen(false)}><NavItem to="/" icon={LayoutDashboard} label="Tableau de bord" /></div>
            <div onClick={() => setIsMobileMenuOpen(false)}><NavItem to="/my-tenders" icon={Briefcase} label="Mes Appels d'Offres" /></div>
            <div onClick={() => setIsMobileMenuOpen(false)}><NavItem to="/stats" icon={BarChart2} label="Statistiques" /></div>
            <div onClick={() => setIsMobileMenuOpen(false)}><NavItem to="/profile" icon={Building2} label="Profil Entreprise" /></div>
            <div onClick={() => setIsMobileMenuOpen(false)}>
                 <NavItem to="/settings" icon={User} label="Paramètres du compte" />
            </div>
            
            {isSuperAdmin && (
                <div onClick={() => setIsMobileMenuOpen(false)}>
                    <NavItem to="/super-admin" icon={ShieldCheck} label="Super Admin" className="text-emerald-400" />
                </div>
            )}

            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-slate-400 hover:bg-red-900/20 hover:text-red-400 mt-6 border-t border-white/5"
           >
              <LogOut size={20} />
              <span className="font-medium">Déconnexion</span>
           </button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden pt-20 md:pt-0 bg-transparent text-slate-300 relative z-10 custom-scrollbar">
        <div className="container mx-auto p-4 md:p-8 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;