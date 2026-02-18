"use client";

import React, { useEffect, useState } from "react";
import { userService } from "../services/userService";
import { tenderService } from "../services/tenderService";
import {
  LogOut,
  Download,
  Database,
  Shield,
  PlayCircle,
  Moon,
  Sun,
  Bell,
  BellOff,
  Trash2,
  CheckCircle,
  RefreshCcw,
} from "lucide-react";

type SettingsScreenProps = {
  onLogout?: () => void;
  onRestartTutorial?: () => void;
};

const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onLogout,
  onRestartTutorial,
}) => {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [cacheCleared, setCacheCleared] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem("tenderai_theme");
    if (storedTheme === "light") setTheme("light");
    else setTheme("dark");
  }, []);

  const handleLogout = async () => {
    await userService.resetLocalUser();
    onLogout?.();
  };

  const handleExportData = async () => {
    await tenderService.exportUserData();
  };

  const handleRestartTutorial = () => {
    localStorage.setItem("tenderai_show_tutorial", "true");
    onRestartTutorial?.();
    window.location.reload();
  };

  const toggleTheme = (newTheme: "dark" | "light") => {
    setTheme(newTheme);
    const root = window.document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
      localStorage.setItem("tenderai_theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("tenderai_theme", "light");
    }
  };

  const handleClearCache = () => {
    try {
      localStorage.removeItem("tenderai_tenders_cache_v2");
      localStorage.removeItem("tenderai_visited_ids");
      setCacheCleared(true);
      setTimeout(() => setCacheCleared(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div className="flex justify-between items-center border-b border-border pb-6">
        <div>
          <h2 className="text-2xl font-bold text-textMain">Paramètres</h2>
          <p className="text-textMuted text-sm mt-1">
            Personnalisez votre expérience et gérez vos données.
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <h3 className="text-lg font-bold text-textMain flex items-center gap-2">
          <Sun size={20} className="text-primary" /> Apparence
        </h3>
        <div className="bg-surface rounded-xl border border-border p-1 flex gap-1 max-w-md">
          <button
            onClick={() => toggleTheme("light")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              theme === "light"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                : "text-textMuted hover:text-textMain"
            }`}
          >
            <Sun size={16} /> Mode Clair
          </button>
          <button
            onClick={() => toggleTheme("dark")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              theme === "dark"
                ? "bg-slate-700 text-white shadow-sm"
                : "text-textMuted hover:text-textMain"
            }`}
          >
            <Moon size={16} /> Mode Sombre
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-bold text-textMain flex items-center gap-2">
          <Database size={20} className="text-primary" /> Système & Données
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface p-5 rounded-xl border border-border flex justify-between items-center">
            <div className="flex gap-3 items-center">
              <div
                className={`p-2 rounded-lg ${notifEnabled ? "bg-primary/10 text-primary" : "bg-slate-700/50 text-slate-500"}`}
              >
                {notifEnabled ? <Bell size={20} /> : <BellOff size={20} />}
              </div>
              <div>
                <h4 className="font-bold text-textMain text-sm">
                  Notifications
                </h4>
                <p className="text-xs text-textMuted">
                  Alertes échéances et rappels.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notifEnabled}
                onChange={() => setNotifEnabled(!notifEnabled)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="bg-surface p-5 rounded-xl border border-border flex justify-between items-center">
            <div className="flex gap-3 items-center">
              <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                <Trash2 size={20} />
              </div>
              <div>
                <h4 className="font-bold text-textMain text-sm">Cache Local</h4>
                <p className="text-xs text-textMuted">
                  Forcer la mise à jour des AO.
                </p>
              </div>
            </div>
            <button
              onClick={handleClearCache}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                cacheCleared
                  ? "bg-green-500/10 text-green-500 border-green-500/30"
                  : "bg-surfaceHighlight text-textMain border-border hover:bg-slate-700 hover:text-white"
              }`}
            >
              {cacheCleared ? (
                <span className="flex items-center gap-1">
                  <CheckCircle size={12} /> Vidé
                </span>
              ) : (
                "Vider"
              )}
            </button>
          </div>

          <div className="bg-surface p-5 rounded-xl border border-border flex justify-between items-center md:col-span-2">
            <div className="flex gap-3 items-center">
              <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                <Download size={20} />
              </div>
              <div>
                <h4 className="font-bold text-textMain text-sm">
                  Export Données (GDPR)
                </h4>
                <p className="text-xs text-textMuted">
                  Télécharger toutes vos données personnelles au format JSON.
                </p>
              </div>
            </div>
            <button
              onClick={handleExportData}
              className="px-4 py-2 bg-surfaceHighlight border border-border rounded-lg text-sm font-medium text-textMain hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-2"
            >
              <Download size={14} /> Exporter
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4 pt-4 border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={handleRestartTutorial}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-surface border border-border rounded-xl text-textMuted font-medium hover:text-primary hover:border-primary/50 transition-colors"
          >
            <PlayCircle size={18} /> Revoir le tutoriel
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-500/5 border border-red-500/20 rounded-xl text-red-500 font-medium hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={18} /> Déconnexion
          </button>
        </div>
      </section>

      <div className="text-center text-xs text-textMuted pt-8">
        <p>Le Compagnon des Marchés v1.4.0</p>
        <p className="mt-1">
          ID Session: {Math.random().toString(36).substr(2, 9).toUpperCase()}
        </p>
      </div>
    </div>
  );
};

export default SettingsScreen;
