
import { Tender, UserProfile, UserInteraction, TenderStatus, AIStrategyAnalysis, ChatMessage, TenderContact } from '../types';
import { MOCK_TENDERS } from './mockData';
import { supabase } from './supabaseClient';

const BOAMP_API_URL = "https://boamp-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/boamp/records";
const STORAGE_TENDERS_CACHE_KEY = 'tenderai_tenders_cache';
const STORAGE_VISITED_KEY = 'tenderai_visited_ids';

/**
 * Génère un résumé intelligent (Smart Snippet) basé sur les mots-clés du profil.
 * Évite de répéter le titre et cherche la phrase la plus pertinente.
 */
const generateSmartSummary = (title: string, fullDescription: string, profile: UserProfile): string => {
    // 1. Nettoyage de base
    let text = fullDescription
        .replace(/Objet du marché :/gi, '')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    
    // Si le texte commence par le titre, on le retire pour éviter la répétition,
    // MAIS SEULEMENT si le texte restant est assez long. Sinon on garde tout.
    if (text.startsWith(title) && text.length > title.length + 50) {
        text = text.replace(title, '').trim();
    }

    // Si on a rien, on renvoie une phrase générique
    if (!text || text.length < 5) {
        return "Aucune description détaillée fournie par l'acheteur.";
    }

    if (!profile.specialization) {
        return text.substring(0, 180) + (text.length > 180 ? '...' : '');
    }

    // 2. Identification des mots-clés importants
    const keywords = profile.specialization
        .toLowerCase()
        .split(/[\s,]+/)
        .filter(w => w.length > 3); // Ignorer les mots courts (le, de, et...)

    // 3. Découpage en phrases
    // Regex simple pour couper sur . ! ?
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

    // 4. Scoring des phrases
    let bestSentence = "";
    let maxScore = -1;

    sentences.forEach(sentence => {
        let score = 0;
        const lowerSent = sentence.toLowerCase();
        
        keywords.forEach(kw => {
            if (lowerSent.includes(kw)) score += 10;
        });

        // Bonus si la phrase contient des chiffres (souvent des quantités ou budget)
        if (/\d/.test(sentence)) score += 2;

        // Pénalité si la phrase est trop courte (souvent du bruit)
        if (sentence.length < 20) score -= 5;

        if (score > maxScore) {
            maxScore = score;
            bestSentence = sentence;
        }
    });

    // 5. Résultat
    if (maxScore > 0) {
        // On retourne la meilleure phrase, et peut-être la suivante pour le contexte
        return bestSentence.trim();
    } else {
        // Fallback propre : on prend le début mais on saute les phrases administratives courantes
        return text.substring(0, 180) + (text.length > 180 ? '...' : '');
    }
};

/**
 * Calcul basique d'un score de compatibilité (Simulation de l'IA côté client)
 */
const calculateLocalScore = (tenderText: string, profile: UserProfile): number => {
    let score = 40; // Score de base plus bas
    const text = tenderText.toLowerCase();
    
    // Bonus Spécialisation
    if (profile.specialization) {
        const specKeywords = profile.specialization.toLowerCase().split(/[\s,]+/).filter(w => w.length > 3);
        let matches = 0;
        specKeywords.forEach(kw => {
            if (text.includes(kw)) matches++;
        });
        // Logarithmique pour ne pas exploser le score juste avec des répétitions
        score += Math.min(40, matches * 8); 
    }

    // Bonus CPV (Si le code CPV match, c'est très fort)
    if (profile.cpvCodes) {
        const cpvs = profile.cpvCodes.split(',').map(s => s.trim());
        // Note: BOAMP ne renvoie pas toujours les CPV dans la liste simple, faudrait checker le raw data plus profond
        // Ici on suppose que le texte contient peut-être le code
        cpvs.forEach(cpv => {
            if (text.includes(cpv)) score += 20;
        });
    }

    // Malus Mots-clés Négatifs (Très fort)
    if (profile.negativeKeywords) {
        const negKeywords = profile.negativeKeywords.toLowerCase().split(',').map(s => s.trim()).filter(s => s);
        negKeywords.forEach(kw => {
            if (text.includes(kw)) score = 5; // Disqualification quasi immédiate
        });
    }

    // Malus Région (Si Scope France, pas de malus, sinon on vérifie)
    // Ce check est déjà fait en amont par l'API filter, mais on affine ici
    if (profile.targetDepartments && profile.scope === 'Custom') {
        // Si aucun département du user n'est trouvé dans le texte (ou les métadonnées), on baisse le score
        // (Difficile à faire parfaitement sur le texte seul sans structured data, on laisse ça au filtre API)
    }

    return Math.max(5, Math.min(98, score));
};

// --- CACHE HELPERS (Local Only for content) ---
const getStoredTendersCache = (): Tender[] => {
    const stored = localStorage.getItem(STORAGE_TENDERS_CACHE_KEY);
    return stored ? JSON.parse(stored) : [...MOCK_TENDERS];
};

const saveToTendersCache = (tender: Tender) => {
    const cache = getStoredTendersCache();
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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];
    
    const userId = session.user.id;

    const { data, error } = await supabase
        .from('user_interactions')
        .select('*')
        .eq('user_id', userId);
    
    if (error) {
        console.error("Error fetching interactions", error);
        return [];
    }

    return data.map((row: any) => ({
        tenderId: row.tender_id,
        status: row.status as TenderStatus,
        internalNotes: row.internal_notes,
        customReminderDate: row.custom_reminder_date,
        aiAnalysisResult: row.ai_analysis_result,
        chatHistory: row.chat_history // Mapping chat history
    }));
};

export const tenderService = {
  
  getAuthorizedTenders: async (user: UserProfile, offset: number = 0): Promise<Tender[]> => {
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
            limit: '20', 
            offset: offset.toString(), 
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
        
        if (!data.results) return [];

        // 2. Mapper les résultats API vers notre modèle Tender
        const tenders: Tender[] = data.results.map((record: any) => {
            let details: any = {};
            try {
                details = JSON.parse(record.donnees || '{}');
            } catch (e) {
                // Ignore parsing errors
            }

            const title = record.objet || "Sans titre";
            
            // Construction d'une description riche en concaténant plusieurs champs
            const descriptionParts = [
                details.OBJET?.OBJET_COMPLET,
                details.OBJET?.CARACTERISTIQUES?.QUANTITE, // Contient souvent le détail technique
                details.RESUME_OBJET,
                record.objet // Titre en dernier recours
            ];
            const rawDescription = descriptionParts.filter(Boolean).join(' '); // Join non-null parts

            const rawBudget = details.OBJET?.CARACTERISTIQUES?.QUANTITE || "";
            const budgetMatch = rawBudget.match(/(\d[\d\s]*)(?:€|euros)/i);
            const estimatedBudget = budgetMatch ? parseInt(budgetMatch[1].replace(/\s/g, '')) : undefined;

            const fullText = `${title} ${rawDescription} ${record.descripteur_libelle?.join(' ') || ''}`;
            
            // Nouveau calcul de score plus précis
            const score = calculateLocalScore(fullText, user);
            
            // Nouveau résumé intelligent
            const smartSummary = generateSmartSummary(title, rawDescription, user);
            
            // Extraction des contacts
            const identity = details.IDENTITE || {};
            const contact: TenderContact = {
                name: identity.CORRESPONDANT || identity.CONTACT || "Non spécifié",
                email: identity.MEL,
                phone: identity.TEL,
                address: [identity.ADRESSE, identity.CP, identity.VILLE].filter(Boolean).join(', '),
                urlBuyerProfile: identity.URL_PROFIL_ACHETEUR
            };

            return {
                id: record.idweb,
                idWeb: record.idweb,
                title: title,
                buyer: record.nomacheteur,
                deadline: record.datelimitereponse ? record.datelimitereponse.split('T')[0] : 'Non spécifiée',
                linkDCE: record.url_avis,
                aiSummary: smartSummary,
                compatibilityScore: score,
                estimatedBudget: estimatedBudget,
                fullDescription: rawDescription,
                departments: record.code_departement || [],
                descriptors: record.descripteur_libelle || [],
                procedureType: record.procedure_libelle || "Procédure non spécifiée",
                relevantClientIds: [user.id],
                contact: contact // Ajout du contact
            } as Tender;
        });

        tenders.forEach(t => saveToTendersCache(t));

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
          let tender = tenderCache.find(t => t.id === interaction.tenderId);
          if (!tender) {
              return null;
          }
          return { tender, interaction };
      }).filter(item => item !== null) as {tender: Tender, interaction: UserInteraction}[];

      return results;
  },

  updateInteraction: async (tenderId: string, status: TenderStatus, notes?: string, tenderObject?: Tender): Promise<void> => {
    if (tenderObject) {
        saveToTendersCache(tenderObject);
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const userId = session.user.id;

    const payload: any = {
        user_id: userId,
        tender_id: tenderId,
        status: status,
    };
    if (notes !== undefined) payload.internal_notes = notes;

    const { error } = await supabase
        .from('user_interactions')
        .upsert(payload, { onConflict: 'user_id, tender_id' });

    if (error) console.error("Supabase update error", error);
  },

  getTenderById: async (id: string): Promise<{tender: Tender, interaction?: UserInteraction} | null> => {
      const cache = getStoredTendersCache();
      const interactions = await fetchUserInteractions(); 
      
      const tender = cache.find(t => t.id === id);
      const interaction = interactions.find(i => i.tenderId === id);

      if (!tender) return null;
      return { tender, interaction };
  },

  saveAnalysis: async (tenderId: string, analysis: AIStrategyAnalysis) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const userId = session.user.id;
      
      const { error } = await supabase
        .from('user_interactions')
        .upsert({
            user_id: userId,
            tender_id: tenderId,
            ai_analysis_result: analysis
        });
      
      if (error) console.error("Error saving analysis", error);
  },

  saveChatHistory: async (tenderId: string, history: ChatMessage[]) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const userId = session.user.id;

      // Upsert with history
      const { error } = await supabase
        .from('user_interactions')
        .upsert({
            user_id: userId,
            tender_id: tenderId,
            chat_history: history,
        }, { onConflict: 'user_id, tender_id' });

      if (error) console.error("Error saving chat history", error);
  },

  exportUserData: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const interactions = await fetchUserInteractions();
      const profileData = await supabase.from('profiles').select('*').eq('id', session.user.id).single();

      const exportObj = {
          profile: profileData.data,
          interactions: interactions,
          exportedAt: new Date().toISOString()
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "tenderai_export.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  },

  // --- VISITED (READ) STATUS METHODS ---
  getVisitedIds: (): string[] => {
      try {
          const stored = localStorage.getItem(STORAGE_VISITED_KEY);
          return stored ? JSON.parse(stored) : [];
      } catch (e) {
          return [];
      }
  },

  markTenderAsVisited: (tenderId: string) => {
      try {
          const visited = tenderService.getVisitedIds();
          if (!visited.includes(tenderId)) {
              visited.push(tenderId);
              localStorage.setItem(STORAGE_VISITED_KEY, JSON.stringify(visited));
          }
      } catch (e) {
          console.error("Error marking tender as visited", e);
      }
  }
};
