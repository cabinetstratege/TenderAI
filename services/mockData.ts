import { Tender, UserProfile, UserInteraction, TenderStatus } from '../types';

const DEFAULT_PROFILE: UserProfile = {
  id: 'usr_123',
  companyName: 'TechBuild Solutions',
  // Layer 1: Permanent Backend Filters
  cpvCodes: '45421000, 72200000',
  scope: 'Custom',
  targetDepartments: '75, 92, 69, 33',
  negativeKeywords: 'plomberie, nettoyage, sécurité physique',
  subscriptionStatus: 'Active',
  specialization: 'Digitalisation des bâtiments et rénovation énergétique intelligente',
  // Layer 2: Saved Frontend Filters
  savedDashboardFilters: {
    searchTerm: '',
    minScore: 0, // Reset default for real data
    minBudget: 0,
    selectedRegion: ''
  }
};

// --- PERSISTENCE LAYER ---
// Modification de la clé pour forcer le reset (V3)
const PROFILE_STORAGE_KEY = 'tenderai_user_profile_v3';

export const getUserProfile = (): UserProfile => {
  const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  // If nothing stored, we return the DEFAULT for types safety, 
  // but logic elsewhere should check `isNewUser`
  return DEFAULT_PROFILE;
};

export const isNewUser = (): boolean => {
    return localStorage.getItem(PROFILE_STORAGE_KEY) === null;
};

export const saveUserProfile = (profile: UserProfile): void => {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  // Update the MOCK_PROFILE reference for immediate usage in current session if needed
  Object.assign(MOCK_PROFILE, profile); 
};

export const resetUserProfile = (): void => {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    window.location.reload(); // Hard reload to force router check
};

export const MOCK_PROFILE: UserProfile = getUserProfile();

// Keep mock tenders only for fallback or specific testing
export const MOCK_TENDERS: Tender[] = [
  {
    id: 't_mock_001',
    idWeb: '24-110235',
    title: '[EXEMPLE MOCK] Rénovation énergétique du Lycée Pasteur',
    buyer: 'Région Île-de-France',
    deadline: '2024-12-31',
    linkDCE: '#',
    aiSummary: 'Ceci est une donnée de démonstration (Mock).',
    compatibilityScore: 92,
    relevantClientIds: ['usr_123'],
    departments: ['92'],
    descriptors: ['Travaux'],
    estimatedBudget: 550000,
    procedureType: 'Procédure Ouverte',
    fullDescription: "Description exemple."
  }
];

export const MOCK_INTERACTIONS: UserInteraction[] = [
  { 
    tenderId: 't_002', 
    status: TenderStatus.SAVED, 
    customReminderDate: '2024-05-25',
    internalNotes: 'Contact pris avec le MOA. Attente retour technique.'
  },
];

export const ADMIN_STATS = {
    totalTenders: 14503,
    activeUsers: 342,
    aiAnalysesPerformed: 8902,
    conversionRate: 12.5
};