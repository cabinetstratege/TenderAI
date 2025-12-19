
import { Tender, TenderStatus, UserInteraction } from "../types";

export const MOCK_TENDERS: Tender[] = [
    {
        id: "mock-1",
        idWeb: "23-145678",
        title: "Rénovation énergétique des bâtiments communaux et installation de panneaux photovoltaïques",
        buyer: "Mairie de Bordeaux",
        deadline: "2024-12-15",
        linkDCE: "https://www.boamp.fr",
        departments: ["33"],
        descriptors: ["Travaux", "Électricité", "CVC"],
        procedureType: "Procédure adaptée",
        relevantClientIds: [],
        contact: { name: "Jean Dupont", email: "j.dupont@bordeaux.fr", phone: "05 56 00 00 00" },
        lots: [
            { lotNumber: "1", title: "Isolation extérieure", description: "Bardage et ITE" },
            { lotNumber: "2", title: "CVC", description: "Remplacement chaudières" }
        ],
        aiSummary: "Ce marché vise la rénovation thermique de 3 écoles. Budget conséquent sur le lot CVC. Critère prix pondéré à 40%.",
        compatibilityScore: 95,
        estimatedBudget: 450000,
        fullDescription: "Marché de travaux pour la rénovation énergétique..."
    },
    {
        id: "mock-2",
        idWeb: "23-998877",
        title: "Fourniture et maintenance de licences logicielles Microsoft 365",
        buyer: "Conseil Régional Occitanie",
        deadline: "2024-11-20",
        linkDCE: "https://www.boamp.fr",
        departments: ["31", "34"],
        descriptors: ["Informatique", "Logiciel"],
        procedureType: "Appel d'offres ouvert",
        relevantClientIds: [],
        lots: [],
        aiSummary: "Renouvellement de parc licences. Accord cadre sur 4 ans. Attention aux pénalités de retard mentionnées dans le CCAP.",
        compatibilityScore: 88,
        estimatedBudget: 1200000,
        fullDescription: "Acquisition de licences..."
    },
    {
        id: "mock-3",
        idWeb: "23-112233",
        title: "Prestations de nettoyage des locaux administratifs et vitrerie",
        buyer: "Hôpital Nord",
        deadline: "2024-10-30",
        linkDCE: "https://www.boamp.fr",
        departments: ["13"],
        descriptors: ["Nettoyage", "Services"],
        procedureType: "Procédure adaptée",
        relevantClientIds: [],
        lots: [],
        aiSummary: "Marché réservé en partie à l'insertion sociale. Visite obligatoire sur site avant remise des offres.",
        compatibilityScore: 45,
        estimatedBudget: 80000,
        fullDescription: "Nettoyage courant..."
    },
    {
        id: "mock-4",
        idWeb: "24-005678",
        title: "Création d'un site internet vitrine et portail citoyen",
        buyer: "Communauté de Communes du Val de Loire",
        deadline: "2024-12-05",
        linkDCE: "https://www.boamp.fr",
        departments: ["45"],
        descriptors: ["Web", "Communication"],
        procedureType: "MAPA",
        relevantClientIds: [],
        lots: [],
        aiSummary: "Refonte complète sous WordPress ou Drupal. Accessibilité RGAA niveau AA exigée.",
        compatibilityScore: 92,
        estimatedBudget: 35000,
        fullDescription: "Développement web..."
    },
     {
        id: "mock-5",
        idWeb: "24-102030",
        title: "AMO pour la construction d'un centre aquatique",
        buyer: "Métropole Grand Paris",
        deadline: "2025-01-15",
        linkDCE: "https://www.boamp.fr",
        departments: ["75", "92"],
        descriptors: ["Ingénierie", "Conseil"],
        procedureType: "Concours",
        relevantClientIds: [],
        lots: [],
        aiSummary: "Mission d'assistance à maîtrise d'ouvrage complexe. Expérience exigée sur des équipements sportifs > 10M€.",
        compatibilityScore: 60,
        estimatedBudget: 150000,
        fullDescription: "Assistance technique, juridique et financière..."
    }
];

export const MOCK_INTERACTIONS: {tender: Tender, interaction: UserInteraction}[] = [
    {
        tender: MOCK_TENDERS[0],
        interaction: {
            tenderId: MOCK_TENDERS[0].id,
            status: TenderStatus.IN_PROGRESS,
            internalNotes: "Contacter le sous-traitant pour le lot élec.",
            user_id: "demo"
        } as any
    },
    {
        tender: MOCK_TENDERS[1],
        interaction: {
            tenderId: MOCK_TENDERS[1].id,
            status: TenderStatus.TODO,
            user_id: "demo"
        } as any
    },
     {
        tender: MOCK_TENDERS[3],
        interaction: {
            tenderId: MOCK_TENDERS[3].id,
            status: TenderStatus.WON,
            internalNotes: "Gagné ! Notification reçue le 12/09.",
            user_id: "demo"
        } as any
    }
];
