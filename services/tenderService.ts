import { Tender, UserProfile, UserInteraction, TenderStatus, AIStrategyAnalysis } from '../types';
import { MOCK_TENDERS } from './mockData';
import { supabase } from './supabaseClient';
import { getUserId } from './userService';

const BOAMP_API_URL = "https://boamp-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/boamp/records";
const STORAGE_TENDERS_CACHE_KEY = 'tenderai_tenders_cache';

/**
 * Calcul basique d'un score de compatibilité (Simulation de l'IA côté client)
 */
const calculateLocalScore = (tenderText: string, profile: UserProfile): number => {
    let score = 50; 
    const text = tenderText.toLowerCase();
    
    if (profile.specialization) {
        const specKeywords = profile.specialization.toLowerCase().split(' ').filter(w => w.length > 4);
        specKeywords.forEach(kw => {
            if (text.includes(kw)) score += 10;
        });
    }

    if (profile.negativeKeywords) {
        const negKeywords = profile.negativeKeywords.toLowerCase().split(',').map(s => s.trim()).filter(s => s);
        negKeywords.forEach(kw => {
            if (text.includes(kw)) score -= 40;
        });
    }

    return Math.max(5, Math.min(99, score));
};

// --- CACHE HELPERS (Local Only for content) ---
// We still cache full tender objects locally because Supabase only stores IDs and Status.
const getStoredTendersCache = (): Tender[] => {
    const stored = localStorage.getItem(STORAGE_TENDERS_CACHE_KEY);
    return stored ? JSON.parse(stored) : [...MOCK_TENDERS];
};

const saveToTendersCache = (tender: Tender) => {
    const cache = getStoredTendersCache();
    // Update or push
    const index = cache.findIndex(t => t.id === tender.id);
    if (index >= 0) {
        cache[index] = tender;
    } else {
        cache.push(tender);
    }
    localStorage.setItem(STORAGE_TENDERS_CACHE_KEY, JSON.stringify(cache));
};

// --- SUPABASE HELPERS ---
const fetchUserInteractions = async (): Promise<UserInteraction[]> => {
    const userId = getUserId();
    const { data, error } = await supabase
        .from('user_interactions')
        .select('*')
        .eq('user_id', userId);
    
    if (error) {
        console.error("Error fetching interactions", error);
        return [];
    }

    // Map DB to Type
    return data.map((row: any) => ({
        tenderId: row.tender_id,
        status: row.status as TenderStatus,
        internalNotes: row.internal_notes,
        customReminderDate: row.custom_reminder_date,
        aiAnalysisResult: row.ai_analysis_result
    }));
};

export const tenderService = {
  
  getAuthorizedTenders: async (user: UserProfile): Promise<Tender[]> => {
    try {
        const interactions = await fetchUserInteractions();
        const blacklist = interactions
            .filter(i => i.status === TenderStatus.BLACKLISTED || i.status === TenderStatus.SAVED || i.status === TenderStatus.WON || i.status === TenderStatus.LOST)
            .map(i => i.tenderId);

        // 1. Construire la requête API
        const depts = user.targetDepartments
            ? user.targetDepartments.split(',').map(d => d.trim()).filter(d => d.length > 0)
            : [];
        
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

        // Cache fetched tenders
        tenders.forEach(t => saveToTendersCache(t));

        // 3. Filtrer les AO déjà traités
        return tenders.filter(t => !blacklist.includes(t.id));

    } catch (error) {
        console.error("Failed to fetch BOAMP tenders", error);
        return [];
    }
  },

  getSavedTenders: async (): Promise<{tender: Tender, interaction: UserInteraction}[]> => {
      const interactions = await fetchUserInteractions();
      const tenderCache = getStoredTendersCache();

      const workspaceInteractions = interactions.filter(i => 
          [TenderStatus.SAVED, TenderStatus.WON, TenderStatus.LOST].includes(i.status)
      );

      const results = workspaceInteractions.map(interaction => {
          // Try to find in cache
          let tender = tenderCache.find(t => t.id === interaction.tenderId);
          
          // If not in cache (e.g. data cleared), we use a placeholder or should fetch from API by ID.
          // For this demo, we assume cache hits or return partial object if we stored it in DB (we don't yet).
          if (!tender) {
              return null;
          }
          return { tender, interaction };
      }).filter(item => item !== null) as {tender: Tender, interaction: UserInteraction}[];

      return results;
  },

  updateInteraction: async (tenderId: string, status: TenderStatus, notes?: string, tenderObject?: Tender): Promise<void> => {
    // 1. Cache locally
    if (tenderObject) {
        saveToTendersCache(tenderObject);
    }

    // 2. Upsert to Supabase
    const userId = getUserId();
    const payload: any = {
        user_id: userId,
        tender_id: tenderId,
        status: status,
    };
    if (notes !== undefined) payload.internal_notes = notes;

    const { error } = await supabase
        .from('user_interactions')
        .upsert(payload, { onConflict: 'user_id, tender_id' }); // Requires DB constraint

    // Fallback: If upsert logic is tricky without explicit constraint setup on Supabase side, 
    // we might need to check existance. But usually PK handles it.
    if (error) console.error("Supabase update error", error);
  },

  getTenderById: async (id: string): Promise<{tender: Tender, interaction?: UserInteraction} | null> => {
      const cache = getStoredTendersCache();
      const interactions = await fetchUserInteractions(); // We could optimize this to fetch single interaction
      
      const tender = cache.find(t => t.id === id);
      const interaction = interactions.find(i => i.tenderId === id);

      if (!tender) return null;
      return { tender, interaction };
  },

  saveAnalysis: async (tenderId: string, analysis: AIStrategyAnalysis) => {
      const userId = getUserId();
      // We need to make sure the row exists, usually analysis is done on viewed/saved tender
      // We perform an update.
      const { error } = await supabase
        .from('user_interactions')
        .upsert({
            user_id: userId,
            tender_id: tenderId,
            ai_analysis_result: analysis
        }); // Note: if row doesn't exist (status null), it creates it.
      
      if (error) console.error("Error saving analysis", error);
  }
};