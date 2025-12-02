import { Tender, TenderStatus, UserInteraction } from '../types';

// Deprecated: Profile logic moved to userService.ts
// We keep ADMIN_STATS and some MOCK_TENDERS for initial cache population or fallback

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
    relevantClientIds: [],
    departments: ['92'],
    descriptors: ['Travaux'],
    estimatedBudget: 550000,
    procedureType: 'Procédure Ouverte',
    fullDescription: "Description exemple."
  }
];

export const MOCK_INTERACTIONS: UserInteraction[] = [];

export const ADMIN_STATS = {
    totalTenders: 14503,
    activeUsers: 342,
    aiAnalysesPerformed: 8902,
    conversionRate: 12.5
};