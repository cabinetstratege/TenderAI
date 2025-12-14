
export enum TenderStatus {
  TODO = 'À Qualifier',      // Arrivée depuis le Dashboard
  IN_PROGRESS = 'En Rédaction', // On bosse dessus
  SUBMITTED = 'Offre Soumise', // En attente réponse
  WON = 'Gagné',
  LOST = 'Perdu',
  BLACKLISTED = 'Rejeté',     // Archivé/Poubelle
  SAVED = 'Sauvegardé'
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
  // Identity
  companyName: string;
  siret?: string;
  address?: string;
  website?: string;
  companySize?: string; // TPE, PME, ETI...

  // Expertise (Backend Layer)
  specialization: string; 
  cpvCodes: string; // Comma separated
  targetSectors?: string; // Comma separated (Tags)
  certifications?: string; // Comma separated (Tags)
  negativeKeywords: string;

  // Geography
  scope: string; // Changed from 'France' to allow comparisons with 'Custom', 'Europe'
  targetDepartments: string; // Comma separated (Tags)
  
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

export interface TenderContact {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    urlBuyerProfile?: string;
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
  
  // Contact Info
  contact?: TenderContact;

  // AI Extracted/Calculated
  aiSummary: string;
  compatibilityScore: number;
  estimatedBudget?: number; // Extracted by AI
  
  fullDescription?: string; 
}

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

export interface UserInteraction {
  tenderId: string;
  status: TenderStatus;
  customReminderDate?: string;
  internalNotes?: string;
  aiAnalysisResult?: AIStrategyAnalysis; // Persisted AI Analysis
  chatHistory?: ChatMessage[]; // Persisted Chat History
}

export interface AppNotification {
    id: string;
    type: 'deadline' | 'reminder';
    title: string;
    message: string;
    date: string; // ISO Date
    tenderId: string;
    isRead: boolean;
}

export interface ChartData {
  name: string;
  value: number;
}