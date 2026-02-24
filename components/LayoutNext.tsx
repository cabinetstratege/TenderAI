"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { userService } from "../services/userService";
import { useAuth } from "../context/AuthContext";
import NotificationCenter from "./NotificationCenter";
import TrialTimer from "./TrialTimer";
import PaywallModal from "./PaywallModal";
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
  Compass,
  Settings,
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

const NavItem = ({
  href,
  icon: Icon,
  label,
  className,
  activeClassName,
  id,
}: {
  href: string;
  icon: any;
  label: string;
  className?: string;
  activeClassName?: string;
  id?: string;
}) => {
  const pathname = usePathname();
  if (!pathname) return null;
  const isActive =
    pathname === href || (href !== "/" && pathname.startsWith(href));

  const activeClasses =
    activeClassName ||
    "text-blue-600 dark:text-blue-100 bg-transparent font-semibold";
  const inactiveClasses =
    "text-slate-500 dark:text-slate-400 hover:text-[color:var(--menu-hover-text)] hover-menu";

  return (
    <Link
      id={id}
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${className || ""} ${
        isActive ? activeClasses : inactiveClasses
      }`}
    >
      <Icon
        size={20}
        className={`relative z-10 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}
      />
      <span className="font-medium relative z-10">{label}</span>
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full"></div>
      )}
    </Link>
  );
};

const LayoutNext: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { isSuperAdmin, session, profile, refreshProfile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isTrialExpired, setIsTrialExpired] = useState(false);

  useEffect(() => {
    if (profile?.subscriptionStatus === "Expired") {
      setIsTrialExpired(true);
    } else {
      setIsTrialExpired(false);
    }
  }, [profile]);

  const handleLogout = async () => {
    await userService.resetLocalUser();
    router.push("/auth");
  };

  const userEmail = session?.user?.email || "Utilisateur";
  const userInitial = userEmail.charAt(0).toUpperCase();

  const isBlocking =
    !isSuperAdmin &&
    isTrialExpired &&
    pathname !== "/pricing" &&
    pathname !== "/settings";

  return (
    <div className="flex h-screen bg-background text-textMain overflow-hidden relative selection:bg-indigo-500/30">
      <PaywallModal
        isOpen={isBlocking}
        onGoToPricing={() => router.push("/pricing")}
      />

      {/* Background Ambient Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 dark:bg-blue-600/5 rounded-full blur-[130px] pointer-events-none animate-blob"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 dark:bg-indigo-500/5 rounded-full blur-[130px] pointer-events-none animate-blob animation-delay-2000"></div>
      <div className="fixed top-[40%] left-[60%] w-[400px] h-[400px] bg-purple-600/10 dark:bg-purple-500/5 rounded-full blur-[100px] pointer-events-none animate-blob animation-delay-4000"></div>

      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-72 glass z-20 transition-all duration-300">
        <div className="flex items-center gap-3 mb-4 px-6 pt-8">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 ring-1 ring-white/10 relative overflow-hidden group">
            <div className="absolute inset-0 bg-white/20 skew-x-12 -translate-x-full group-hover:animate-shimmer"></div>
            <Compass className="text-white relative z-10" size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-textMain leading-tight">
              Le Compagnon
            </h1>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider opacity-90">
              des Marchés Publics
            </p>
          </div>
        </div>

        {profile &&
          profile.subscriptionStatus === "Trial" &&
          profile.trialStartedAt && (
            <TrialTimer
              startDate={profile.trialStartedAt}
              onExpire={() => {
                setIsTrialExpired(true);
                refreshProfile();
              }}
            />
          )}

        <nav className="flex-1 space-y-1.5 px-4 mt-2">
          <NavItem
            href="/"
            icon={LayoutDashboard}
            label="Tableau de bord"
            id="tour-sidebar-dashboard"
          />
          <NavItem
            href="/mes-opportunites"
            icon={Briefcase}
            label="Mes Opportunités"
            id="tour-sidebar-tenders"
          />
          <NavItem href="/stats" icon={BarChart2} label="Statistiques" />
          <NavItem
            href="/profile"
            icon={Building2}
            label="Profil Entreprise"
            id="tour-sidebar-profile"
          />
          <NavItem
            href="/pricing"
            icon={CreditCard}
            label="Abonnement"
            className={
              isTrialExpired ? "animate-pulse text-primary font-bold" : ""
            }
          />
          <div className="my-3 mx-2 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
          <NavItem href="/settings" icon={Settings} label="Paramètres" />

          {isSuperAdmin && (
            <div className="pt-4 mt-2">
              <p className="px-4 text-[10px] font-bold text-slate-500 uppercase mb-2 tracking-wider">
                Admin
              </p>
              <NavItem
                href="/super-admin"
                icon={ShieldCheck}
                label="Super Admin"
                className="text-emerald-600 dark:text-emerald-200 !text-emerald-600 dark:!text-emerald-200 hover:!text-emerald-700 dark:hover:text-emerald-200 bg-transparent dark:bg-transparent dark:hover:bg-emerald-500/20 border border-emerald-600/50 dark:border-emerald-600/80"
                activeClassName="!text-emerald-700 dark:!text-emerald-200 !bg-emerald-500/10 dark:!bg-emerald-500/20 border border-emerald-200/50 dark:border-emerald-600/70 font-semibold"
              />
            </div>
          )}
        </nav>

        <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800 sidebar-gradient">
          <div className="flex justify-between items-center px-6 mb-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Alertes
            </span>
            <NotificationCenter onNavigate={(path) => router.push(path)} />
          </div>

          <div className="px-4 pb-6">
            <Link
              href="/settings"
              className={`flex items-center gap-3 p-3 rounded-xl transition-all group border ${
                pathname === "/settings"
                  ? "bg-surface"
                  : "hover:bg-surface/50 border-transparent hover:border-slate-300 dark:hover:border-slate-600"
              }`}
              style={{
                borderColor:
                  pathname === "/settings"
                    ? "color-mix(in srgb, var(--color-border) 40%, transparent)"
                    : "color-mix(in srgb, var(--color-border) 30%, transparent)",
              }}
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-slate-600 dark:text-white font-bold border border-white/10 shadow-inner shrink-0 relative">
                {userInitial}
                <div
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-background rounded-full ${isTrialExpired ? "bg-red-500" : "bg-emerald-500"}`}
                ></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-textMain truncate leading-none mb-1 group-hover:text-primary transition-colors">
                  {userEmail.split("@")[0]}
                </p>
                <p className="text-[10px] text-textMuted font-medium truncate">
                  {isTrialExpired ? "Abonnement Expiré" : "Gérer mon compte"}
                </p>
              </div>
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full glass z-50 flex items-center justify_between p-4 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <Compass className="text-white" size={18} />
          </div>
          <span className="font-bold text-textMain">Le Compagnon</span>
        </div>
        <div className="flex items-center gap-4">
          <NotificationCenter
            onNavigate={(path) => {
              setIsMobileMenuOpen(false);
              router.push(path);
            }}
          />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-textMuted p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-xl z-40 pt-24 px-6 md:hidden animate-fade-in flex flex-col">
          {profile &&
            profile.subscriptionStatus === "Trial" &&
            profile.trialStartedAt && (
              <TrialTimer startDate={profile.trialStartedAt} />
            )}
          <nav className="space-y-3">
            <div onClick={() => setIsMobileMenuOpen(false)}>
              <NavItem
                href="/"
                icon={LayoutDashboard}
                label="Tableau de bord"
              />
            </div>
            <div onClick={() => setIsMobileMenuOpen(false)}>
              <NavItem
            href="/mes-opportunites"
                icon={Briefcase}
                label="Mes Appels d'Offres"
              />
            </div>
            <div onClick={() => setIsMobileMenuOpen(false)}>
              <NavItem href="/stats" icon={BarChart2} label="Statistiques" />
            </div>
            <div onClick={() => setIsMobileMenuOpen(false)}>
              <NavItem
                href="/profile"
                icon={Building2}
                label="Profil Entreprise"
              />
            </div>
            <div onClick={() => setIsMobileMenuOpen(false)}>
              <NavItem href="/pricing" icon={CreditCard} label="Abonnement" />
            </div>
            <div className="my-4 border-t border-slate-200 dark:border-slate-800"></div>
            <div onClick={() => setIsMobileMenuOpen(false)}>
              <NavItem href="/settings" icon={Settings} label="Paramètres" />
            </div>

            {isSuperAdmin && (
              <div onClick={() => setIsMobileMenuOpen(false)}>
                <NavItem
                  href="/super-admin"
                  icon={ShieldCheck}
                  label="Super Admin"
                  className="text-emerald-400"
                />
              </div>
            )}

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-slate-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 mt-6 border border-transparent hover:border-red-200 dark:hover:border-red-900/30 cursor-pointer"
            >
              <LogOut size={20} />
              <span className="font-medium">Déconnexion</span>
            </button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main
        className={`flex-1 overflow-y-auto overflow-x-hidden pt-20 md:pt-0 bg-transparent text-textMain relative z-10 custom-scrollbar scroll-smooth ${
          isBlocking ? "blur-sm pointer-events-none select-none" : ""
        }`}
      >
        <div className="container mx-auto p-4 md:p-8 max-w-7xl min-h-[calc(100vh-2rem)]">
          {children}
        </div>
      </main>
    </div>
  );
};

export default LayoutNext;
