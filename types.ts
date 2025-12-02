export enum TenderStatus {
  TODO = 'A traiter',
  SAVED = 'Sauvegardé',
  BLACKLISTED = 'Blacklisté',
  WON = 'Gagné',
  LOST = 'Perdu/Rejeté'
}

export interface DashboardFilters {
  searchTerm: string;
  minScore: number;
  minBudget?: number;
  maxBudget?: number;
  selectedRegion?: string;
  // Advanced Filters
  procedureType?: string;
  publicationDate?: string;
  rawKeywords?: string;
}

export interface UserProfile {
  id: string;
  companyName: string;
  // Permanent Filters (Backend Layer)
  cpvCodes: string; // Comma separated
  scope: 'France' | 'Europe' | 'Custom'; // New Scope Selector
  targetDepartments: string; // Comma separated
  negativeKeywords: string;
  specialization: string; 
  subscriptionStatus: 'Active' | 'Suspended';
  // Saved View State (Frontend Layer)
  savedDashboardFilters?: DashboardFilters;
}

export interface AIStrategyAnalysis {
  risks: string[];
  strengths: string[];
  workload: 'Faible' | 'Moyenne' | 'Élevée';
  questions: string[];
}

export interface Tender {
  id: string; // Internal UUID
  idWeb: string; // BOAMP ID
  title: string;
  buyer: string;
  deadline: string;
  linkDCE: string;
  
  // Backend Logic Fields
  relevantClientIds: string[]; // List of User IDs authorized to see this tender

  // New BOAMP Fields
  departments: string[]; // code_departement (Array)
  descriptors: string[]; // descripteur_libelle
  procedureType: string; // e.g., "Ouvert", "Adapté"
  
  // AI Extracted/Calculated
  aiSummary: string;
  compatibilityScore: number;
  estimatedBudget?: number; // Extracted by AI
  
  fullDescription?: string; 
}

export interface UserInteraction {
  tenderId: string;
  status: TenderStatus;
  customReminderDate?: string;
  internalNotes?: string;
  aiAnalysisResult?: AIStrategyAnalysis; // Persisted AI Analysis
}

export interface ChartData {
  name: string;
  value: number;
}