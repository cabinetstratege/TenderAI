"use client";

/* eslint-disable react/no-unescaped-entities */
import React, { useState, useEffect, useRef } from 'react';
import { userService } from '../services/userService';
import { suggestCPVCodes } from '../services/geminiService';
import { Building2, Wrench, MapPin, Sparkles, Loader2, Link as LinkIcon, Cloud, CloudOff, Check, RefreshCw, Mail } from 'lucide-react';
import { UserProfile } from '../types';
import MultiSelect from '../components/MultiSelect';

const DEPARTMENTS = [
  "01 - Ain", "02 - Aisne", "03 - Allier", "04 - Alpes-de-Haute-Provence", "05 - Hautes-Alpes", "06 - Alpes-Maritimes", "07 - Ardèche", "08 - Ardennes", "09 - Ariège", "10 - Aube", 
  "11 - Aude", "12 - Aveyron", "13 - Bouches-du-Rhône", "14 - Calvados", "15 - Cantal", "16 - Charente", "17 - Charente-Maritime", "18 - Cher", "19 - Corrèze", "2A - Corse-du-Sud", 
  "2B - Haute-Corse", "21 - Côte-d'Or", "22 - Côtes-d'Armor", "23 - Creuse", "24 - Dordogne", "25 - Doubs", "26 - Drôme", "27 - Eure", "28 - Eure-et-Loir", "29 - Finistère", 
  "30 - Gard", "31 - Haute-Garonne", "32 - Gers", "33 - Gironde", "34 - Hérault", "35 - Ille-et-Vilaine", "36 - Indre", "37 - Indre-et-Loire", "38 - Isère", "39 - Jura", 
  "40 - Landes", "41 - Loir-et-Cher", "42 - Loire", "43 - Haute-Loire", "44 - Loire-Atlantique", "45 - Loiret", "46 - Lot", "47 - Lot-et-Garonne", "48 - Lozère", "49 - Maine-et-Loire", 
  "50 - Manche", "51 - Marne", "52 - Haute-Marne", "53 - Mayenne", "54 - Meurthe-et-Moselle", "55 - Meuse", "56 - Morbihan", "57 - Moselle", "58 - Nièvre", "59 - Nord", 
  "60 - Oise", "61 - Orne", "62 - Pas-de-Calais", "63 - Puy-de-Dôme", "64 - Pyrénées-Atlantiques", "65 - Hautes-Pyrénées", "66 - Pyrénées-Orientales", "67 - Bas-Rhin", "68 - Haut-Rhin", "69 - Rhône", 
  "70 - Haute-Saône", "71 - Saône-et-Loire", "72 - Sarthe", "73 - Savoie", "74 - Haute-Savoie", "75 - Paris", "76 - Seine-Maritime", "77 - Seine-et-Marne", "78 - Yvelines", "79 - Deux-Sèvres", 
  "80 - Somme", "81 - Tarn", "82 - Tarn-et-Garonne", "83 - Var", "84 - Vaucluse", "85 - Vendée", "86 - Vienne", "87 - Haute-Vienne", "88 - Vosges", "89 - Yonne", 
  "90 - Territoire de Belfort", "91 - Essonne", "92 - Hauts-de-Seine", "93 - Seine-Saint-Denis", "94 - Val-de-Marne", "95 - Val-d'Oise", "971 - Guadeloupe", "972 - Martinique", "973 - Guyane", "974 - La Réunion", "976 - Mayotte"
];

const SECTORS = ["BTP", "Informatique / IT", "Services", "Nettoyage", "Sécurité", "Formation", "Transport", "Fournitures de bureau", "Médical", "Conseil"];
const COMPANY_SIZES = ["Micro-entreprise", "TPE (< 10 salariés)", "PME (< 250 salariés)", "ETI", "Grande Entreprise"];

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

type ProfileScreenProps = { onDone?: () => void };

const ProfileScreen: React.FC<ProfileScreenProps> = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isSuggestingCPV, setIsSuggestingCPV] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      const p = await userService.getCurrentProfile();
      setProfile(p);
      setLoading(false);
    };
    loadProfile();
  }, []);

  useEffect(() => {
    if (!profile || isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }

    setSaveStatus('saving');

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(async () => {
      try {
        await userService.saveProfile(profile);
        setSaveStatus('saved');
        setLastSaved(new Date());
      } catch (error) {
        console.error('Autosave failed', error);
        setSaveStatus('error');
      }
    }, 1500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (profile) {
      setProfile({ ...profile, [e.target.name]: e.target.value });
    }
  };

  const handleSuggestCPV = async () => {
    if (!profile?.specialization) return;
    setIsSuggestingCPV(true);
    const suggestions = await suggestCPVCodes(profile.specialization);

    if (suggestions.length > 0) {
      const currentCodes = profile.cpvCodes ? profile.cpvCodes.split(',').map((s) => s.trim()) : [];
      const newCodes = Array.from(new Set([...currentCodes, ...suggestions])).join(', ');
      setProfile({ ...profile, cpvCodes: newCodes });
    }
    setIsSuggestingCPV(false);
  };

  if (loading || !profile) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-primary" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sticky top-0 bg-background/80 backdrop-blur-md z-30 py-4 border-b border-transparent">
        <div>
          <h2 className="text-2xl font-bold text-textMain">Profil Entreprise</h2>
          <p className="text-textMuted">Ces informations servent à calibrer l'IA, filtrer les AO et préparer vos dossiers de candidature.</p>
        </div>

        <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm transition-all">
          {saveStatus === 'saving' && (
            <>
              <RefreshCw size={16} className="text-amber-500 animate-spin" />
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Enregistrement...</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <Cloud size={16} className="text-emerald-500" />
              <div className="flex flex-col items-start leading-none">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Synchronisé</span>
                {lastSaved && <span className="text-[10px] text-slate-400">{lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
              </div>
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <CloudOff size={16} className="text-red-500" />
              <span className="text-xs font-bold text-red-600 dark:text-red-400">Erreur sauvegarde</span>
            </>
          )}
          {saveStatus === 'idle' && !lastSaved && (
            <>
              <Check size={16} className="text-slate-400" />
              <span className="text-xs font-medium text-slate-500">Prêt</span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-surface p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                <Building2 size={24} />
              </div>
              <h3 className="font-bold text-lg text-textMain">Identité Administrative</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Nom de l'entreprise</label>
                <input
                  type="text"
                  name="companyName"
                  value={profile.companyName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white transition-colors"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Email de contact (pour envois AO)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="email"
                    name="contactEmail"
                    placeholder="votre.email@entreprise.com"
                    value={profile.contactEmail || ''}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white transition-colors"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Sert de destinataire par défaut pour vous envoyer les fiches AO.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 block">N° SIRET</label>
                  <input
                    type="text"
                    name="siret"
                    placeholder="14 chiffres"
                    value={profile.siret || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary outline-none font-mono text-sm text-slate-900 dark:text-white transition-colors"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Taille</label>
                  <select
                    name="companySize"
                    value={profile.companySize || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white transition-colors"
                  >
                    <option value="">Selectionner...</option>
                    {COMPANY_SIZES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Adresse du Siège</label>
                <textarea
                  name="address"
                  rows={2}
                  value={profile.address || ''}
                  onChange={handleChange}
                  placeholder="10 rue de la République..."
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none text-slate-900 dark:text-white transition-colors"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Site Web</label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="text"
                    name="website"
                    placeholder="https://www.mon-entreprise.com"
                    value={profile.website || ''}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary outline-none text-blue-600 dark:text-blue-400 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="bg-surface p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                <Wrench size={24} />
              </div>
              <h3 className="font-bold text-lg text-textMain">Expertise Technique</h3>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Spécialisation (Description IA)</label>
                <textarea
                  name="specialization"
                  value={profile.specialization}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Décrivez votre activité pour aider l'IA..."
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-slate-900 dark:text-white transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MultiSelect
                  label="Secteurs Cibles"
                  placeholder="Ajouter un secteur..."
                  suggestions={SECTORS}
                  value={profile.targetSectors || ''}
                  onChange={(val) => setProfile({ ...profile, targetSectors: val })}
                />
                <MultiSelect
                  label="Certifications / Labels"
                  placeholder="Ex: Qualibat, ISO 9001..."
                  suggestions={["Qualibat", "RGE", "ISO 9001", "ISO 14001", "Habilitation Élec"]}
                  value={profile.certifications || ''}
                  onChange={(val) => setProfile({ ...profile, certifications: val })}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Codes CPV</label>
                  <button onClick={handleSuggestCPV} disabled={isSuggestingCPV} className="text-xs flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:text-purple-500 font-medium">
                    {isSuggestingCPV ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} Suggestion Auto
                  </button>
                </div>
                <input
                  type="text"
                  name="cpvCodes"
                  value={profile.cpvCodes}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary outline-none font-mono text-sm text-slate-900 dark:text-slate-300 transition-colors"
                />
                <p className="text-xs text-slate-500 mt-1">Séparés par des virgules</p>
              </div>

              <MultiSelect
                label="Mots-clés Négatifs (Anti-bruit)"
                placeholder="Ex: maintenance, imprimante..."
                value={profile.negativeKeywords}
                onChange={(val) => setProfile({ ...profile, negativeKeywords: val })}
              />
            </div>
          </div>

          <div className="bg-surface p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <MapPin size={24} />
              </div>
              <h3 className="font-bold text-lg text-textMain">Zone d'Intervention</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">FR</span>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">France Entière</p>
                  <p className="text-xs text-slate-500">Scope de base</p>
                </div>
              </div>

              <MultiSelect
                label="Départements Prioritaires (Tapez un numéro ou un nom)"
                placeholder="Rechercher une région..."
                suggestions={DEPARTMENTS}
                value={profile.targetDepartments}
                onChange={(val) => setProfile({ ...profile, targetDepartments: val })}
              />
              <p className="text-xs text-slate-500">Seuls les départements listés ici seront interrogés dans le BOAMP. Laissez vide pour tout scanner.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
