import { Tender, UserProfile, UserInteraction, TenderStatus, AIStrategyAnalysis } from '../types';
import { MOCK_INTERACTIONS, MOCK_TENDERS } from './mockData';

const BOAMP_API_URL = "https://boamp-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/boamp/records";
const STORAGE_INTERACTIONS_KEY = 'tenderai_interactions';
const STORAGE_TENDERS_CACHE_KEY = 'tenderai_tenders_cache';

/**
 * Calcul basique d'un score de compatibilité (Simulation de l'IA côté client)
 * Compare les mots clés de la spécialisation avec le titre et le résumé de l'AO.
 */
const calculateLocalScore = (tenderText: string, profile: UserProfile): number => {
    let score = 50; // Score de base
    const text = tenderText.toLowerCase();
    
    // Bonus pour mots clés de spécialisation
    const specKeywords = profile.specialization.toLowerCase().split(' ').filter(w => w.length > 4);
    specKeywords.forEach(kw => {
        if (text.includes(kw)) score += 10;
    });

    // Malus pour mots clés négatifs
    const negKeywords = profile.negativeKeywords.toLowerCase().split(',').map(s => s.trim()).filter(s => s);
    negKeywords.forEach(kw => {
        if (text.includes(kw)) score -= 40;
    });

    // Clamp score 0-100
    return Math.max(5, Math.min(99, score));
};

// Helpers for persistence
const getStoredInteractions = (): UserInteraction[] => {
    const stored = localStorage.getItem(STORAGE_INTERACTIONS_KEY);
    return stored ? JSON.parse(stored) : [...MOCK_INTERACTIONS];
};

const saveStoredInteractions = (interactions: UserInteraction[]) => {
    localStorage.setItem(STORAGE_INTERACTIONS_KEY, JSON.stringify(interactions));
};

// Cache to store full tender objects (since we don't have a real DB to query by ID later)
const getStoredTendersCache = (): Tender[] => {
    const stored = localStorage.getItem(STORAGE_TENDERS_CACHE_KEY);
    return stored ? JSON.parse(stored) : [...MOCK_TENDERS];
};

const saveToTendersCache = (tender: Tender) => {
    const cache = getStoredTendersCache();
    if (!cache.find(t => t.id === tender.id)) {
        cache.push(tender);
        localStorage.setItem(STORAGE_TENDERS_CACHE_KEY, JSON.stringify(cache));
    }
};

export const tenderService = {
  
  /**
   * Récupère les AO depuis l'API OpenDataSoft du BOAMP
   * Filtre basé sur les départements du profil utilisateur.
   */
  getAuthorizedTenders: async (user: UserProfile): Promise<Tender[]> => {
    try {
        const interactions = getStoredInteractions();
        const blacklist = interactions
            .filter(i => i.status === TenderStatus.BLACKLISTED || i.status === TenderStatus.SAVED || i.status === TenderStatus.WON || i.status === TenderStatus.LOST)
            .map(i => i.tenderId);

        // 1. Construire la requête API
        const depts = user.targetDepartments
            .split(',')
            .map(d => d.trim())
            .filter(d => d.length > 0);
        
        let whereClause = '';
        if (user.scope !== 'France' && user.scope !== 'Europe' && depts.length > 0) {
            const deptList = depts.map(d => `"${d}"`).join(', ');
            whereClause = `code_departement in (${deptList})`;
        }

        const params = new URLSearchParams({
            limit: '50',
            order_by: 'dateparution desc',
        });
        if (whereClause) {
            params.append('where', whereClause);
        }

        const response = await fetch(`${BOAMP_API_URL}?${params.toString()}`);
        
        if (!response.ok) {
            throw new Error(`BOAMP API Error: ${response.statusText}`);
        }

        const data = await response.json();
        
        // 2. Mapper les résultats API vers notre modèle Tender
        const tenders: Tender[] = data.results.map((record: any) => {
            let details: any = {};
            try {
                details = JSON.parse(record.donnees || '{}');
            } catch (e) {
                console.warn("Erreur parsing JSON données BOAMP", e);
            }

            const description = details.OBJET?.OBJET_COMPLET || record.objet || "";
            const rawBudget = details.OBJET?.CARACTERISTIQUES?.QUANTITE || "";
            const budgetMatch = rawBudget.match(/(\d[\d\s]*)(?:€|euros)/i);
            const estimatedBudget = budgetMatch ? parseInt(budgetMatch[1].replace(/\s/g, '')) : undefined;

            const fullText = `${record.objet} ${description}`;
            const score = calculateLocalScore(fullText, user);

            return {
                id: record.idweb,
                idWeb: record.idweb,
                title: record.objet,
                buyer: record.nomacheteur,
                deadline: record.datelimitereponse ? record.datelimitereponse.split('T')[0] : 'Non spécifiée',
                linkDCE: record.url_avis,
                aiSummary: description.substring(0, 150) + (description.length > 150 ? '...' : ''),
                compatibilityScore: score,
                estimatedBudget: estimatedBudget,
                fullDescription: description,
                departments: record.code_departement || [],
                descriptors: record.descripteur_libelle || [],
                procedureType: record.procedure_libelle || "Procédure non spécifiée",
                relevantClientIds: [user.id]
            } as Tender;
        });

        // Cache fetched tenders to ensure detail view works even if not saved yet
        tenders.forEach(t => saveToTendersCache(t));

        // 3. Filtrer les AO déjà traités (Sauvegardés, Blacklistés, Gagnés...)
        return tenders.filter(t => !blacklist.includes(t.id));

    } catch (error) {
        console.error("Failed to fetch BOAMP tenders", error);
        return [];
    }
  },

  /**
   * Récupère la liste des AO sauvegardés (Mes Appels d'Offres)
   * Simule la requête JOIN SQL : SELECT * FROM Tenders JOIN Interactions WHERE Status = 'SAVED'
   */
  getSavedTenders: async (): Promise<{tender: Tender, interaction: UserInteraction}[]> => {
      const interactions = getStoredInteractions();
      const tenderCache = getStoredTendersCache();

      // Filter interactions for Saved/Won/Lost (Everything in "My Tenders" workspace)
      const workspaceInteractions = interactions.filter(i => 
          [TenderStatus.SAVED, TenderStatus.WON, TenderStatus.LOST].includes(i.status)
      );

      // Join with Tender Data
      const results = workspaceInteractions.map(interaction => {
          const tender = tenderCache.find(t => t.id === interaction.tenderId);
          if (!tender) return null;
          return { tender, interaction };
      }).filter(item => item !== null) as {tender: Tender, interaction: UserInteraction}[];

      return results;
  },

  /**
   * Sauvegarde ou met à jour une interaction
   * Si 'tender' est fourni, il est mis en cache pour persistance (Simulation DB)
   */
  updateInteraction: async (tenderId: string, status: TenderStatus, notes?: string, tenderObject?: Tender): Promise<void> => {
    console.log(`[API] Interaction updated for ${tenderId}: ${status}`);
    
    // 1. Cache the full object if provided (Essential for "Save" feature from API list)
    if (tenderObject) {
        saveToTendersCache(tenderObject);
    }

    // 2. Update Interaction Table
    const interactions = getStoredInteractions();
    const existingIndex = interactions.findIndex(i => i.tenderId === tenderId);

    if (existingIndex >= 0) {
        interactions[existingIndex].status = status;
        if (notes !== undefined) interactions[existingIndex].internalNotes = notes;
    } else {
        interactions.push({ tenderId, status, internalNotes: notes });
    }

    saveStoredInteractions(interactions);
  },

  /**
   * Retrieve a single tender by ID (for Detail Page)
   * Checks Cache first.
   */
  getTenderById: async (id: string): Promise<{tender: Tender, interaction?: UserInteraction} | null> => {
      const cache = getStoredTendersCache();
      const interactions = getStoredInteractions();
      
      const tender = cache.find(t => t.id === id);
      const interaction = interactions.find(i => i.tenderId === id);

      if (!tender) return null;
      return { tender, interaction };
  },

  /**
   * Persist AI Analysis result
   */
  saveAnalysis: async (tenderId: string, analysis: AIStrategyAnalysis) => {
      const interactions = getStoredInteractions();
      const index = interactions.findIndex(i => i.tenderId === tenderId);
      
      if (index >= 0) {
          interactions[index].aiAnalysisResult = analysis;
          saveStoredInteractions(interactions);
      } else {
          // If no interaction exists yet (viewing unsaved tender), create a temporary one or handle logic
          // For now, we assume strategy is mostly for saved/interested tenders.
          // But to be safe, we create an interaction with TODO status if missing
          interactions.push({ tenderId, status: TenderStatus.TODO, aiAnalysisResult: analysis });
          saveStoredInteractions(interactions);
      }
  }
};