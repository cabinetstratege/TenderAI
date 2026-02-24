"use client";

import React, { useState } from "react";
import { userService } from "../services/userService";
import { tenderService } from "../services/tenderService";
import {
  LogOut,
  Download,
  Database,
  Bell,
  BellOff,
  Trash2,
  CheckCircle,
} from "lucide-react";

type SettingsScreenProps = {
  onLogout?: () => void;
};

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onLogout }) => {
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [cacheCleared, setCacheCleared] = useState(false);

  const handleLogout = async () => {
    await userService.resetLocalUser();
    onLogout?.();
  };

  const handleExportData = async () => {
    await tenderService.exportUserData();
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
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-textMain">Paramètres</h2>
          <p className="text-textMuted text-sm mt-1">
            Personnalisez votre expérience et gérez vos données.
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <h3 className="text-lg font-bold text-textMain flex items-center gap-2">
          <Database size={20} className="text-primary" /> Système & Données
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface p-5 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
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

          <div className="bg-surface p-5 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <div className="flex gap-3 items-center">
              <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                <Trash2 size={20} />
              </div>
              <div>
                <h4 className="font-bold text-textMain text-sm">Cache Local</h4>
                <p className="text-xs text-textMuted">
                  Forcer la mise à  jour des AO.
                </p>
              </div>
            </div>
            <button
              onClick={handleClearCache}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                cacheCleared
                  ? "bg-green-500/10 text-green-500 border-green-500/30"
                  : "bg-surfaceHighlight text-textMain border-slate-200 dark:border-slate-700 hover:bg-slate-700 hover:text-white"
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

          <div className="bg-surface p-5 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center md:col-span-2">
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
              className="px-4 py-2 bg-surfaceHighlight border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-textMain hover:bg-slate-700 hover:text-white transition-colors flex items-center gap-2"
            >
              <Download size={14} /> Exporter
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-1 gap-4">
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
