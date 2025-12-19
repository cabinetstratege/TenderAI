
import { Tender, UserProfile, UserInteraction, TenderStatus, AIStrategyAnalysis, ChatMessage, TenderContact, TenderLot, DashboardFilters, CompetitorStat, MarketAnalysis } from '../types';
import { supabase } from './supabaseClient';
import { userService } from './userService';
import { MOCK_TENDERS, MOCK_INTERACTIONS } from './mockData';

const BOAMP_API_URL = "https://boamp-datadila.opendatasoft.com/api/explore/v2.1/catalog/datasets/boamp/records";
const STORAGE_TENDERS_CACHE_KEY = 'tenderai_tenders_cache_v2';
const STORAGE_VISITED_KEY = 'tenderai_visited_ids';

/**
 * Génère un résumé intelligent (Smart Snippet) basé sur les mots-clés du profil.
 */
const generateSmartSummary = (title: string, fullDescription: string, profile: UserProfile): string => {
    let text = fullDescription
        .replace(/Objet du marché :/gi, '')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    
    if (text.startsWith(title) && text.length > title.length + 50) {
        text = text.replace(title, '').trim();
    }

    if (!text || text.length < 5) {
        return "Aucune description détaillée fournie par l'acheteur.";
    }

    if (!profile.specialization) {
        return text.substring(0, 180) + (text.length > 180 ? '...' : '');
    }

    const keywords = profile.specialization
        .toLowerCase()
        .split(/[\s,]+/)
        .filter(w => w.length > 3);

    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

    let bestSentence = "";
    let maxScore = -1;

    sentences.forEach(sentence => {
        let score = 0;
        const lowerSent = sentence.toLowerCase();
        
        keywords.forEach(kw => {
            if (lowerSent.includes(kw)) score += 10;
        });

        if (/\d/.test(sentence)) score += 2;
        if (sentence.length < 20) score -= 5;

        if (score > maxScore) {
            maxScore = score;
            bestSentence = sentence;
        }
    });

    if (maxScore > 0) {
        return bestSentence.trim();
    } else {
        return text.substring(0, 180) + (text.length > 180 ? '...' : '');
    }
};

/**
 * Calcul basique d'un score de compatibilité
 */
const calculateLocalScore = (tenderText: string, profile: UserProfile): number => {
    let score = 40; 
    const text = tenderText.toLowerCase();
    
    if (profile.specialization) {
        const specKeywords = profile.specialization.toLowerCase().split(/[\s,]+/).filter(w => w.length > 3);
        let matches = 0;
        specKeywords.forEach(kw => {
            if (text.includes(kw)) matches++;
        });
        score += Math.min(40, matches * 8); 
    }

    if (profile.cpvCodes) {
        const cpvs = profile.cpvCodes.split(',').map(s => s.trim());
        cpvs.forEach(cpv => {
            if (text.includes(cpv)) score += 20;
        });
    }

    if (profile.negativeKeywords) {
        const negKeywords = profile.negativeKeywords.toLowerCase().split(',').map(s => s.trim()).filter(s => s);
        negKeywords.forEach(kw => {
            if (text.includes(kw)) score = 5; 
        });
    }

    return Math.max(5, Math.min(98, score));
};

// --- HELPER: Parse CPV Safely ---
const extractCPVs = (lot: any): string[] => {
    const cpvs: string[] = [];
    const obj = lot.CPV_OBJET;
    if (!obj) return cpvs;

    // Try CPV_MAIN
    if (obj.CPV_MAIN) {
        if (Array.isArray(obj.CPV_MAIN)) {
            obj.CPV_MAIN.forEach((c: any) => c?.CODE_CPV && cpvs.push(c.CODE_CPV));
        } else if (obj.CPV_MAIN.CODE_CPV) {
            cpvs.push(obj.CPV_MAIN.CODE_CPV);
        }
    }

    // Try CPV_SUPPLEMENTAIRE
    if (obj.CPV_SUPPLEMENTAIRE) {
        if (Array.isArray(obj.CPV_SUPPLEMENTAIRE)) {
             obj.CPV_SUPPLEMENTAIRE.forEach((c: any) => c?.CODE_CPV && cpvs.push(c.CODE_CPV));
        } else if (obj.CPV_SUPPLEMENTAIRE.CODE_CPV) {
             cpvs.push(obj.CPV_SUPPLEMENTAIRE.CODE_CPV);
        }
    }
    
    return [...new Set(cpvs)]; // Unique
};

// --- CACHE HELPERS ---
const getStoredTendersCache = (): Tender[] => {
    try {
        const stored = localStorage.getItem(STORAGE_TENDERS_CACHE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch(e) {
        return [];
    }
};

const saveToTendersCache = (tender: Tender) => {
    try {
        const cache = getStoredTendersCache();
        const index = cache.findIndex(t => t.id === tender.id);
        if (index >= 0) {
            cache[index] = tender;
        } else {
            cache.push(tender);
        }
        // Limit cache size to avoid localStorage quotas
        if (cache.length > 500) cache.shift();
        localStorage.setItem(STORAGE_TENDERS_CACHE_KEY, JSON.stringify(cache));
    } catch(e) {
        console.error("Cache save failed", e);
    }
};

// --- SUPABASE HELPERS ---
const fetchUserInteractions = async (): Promise<UserInteraction[]> => {
    // FALLBACK: If user is "demo-user", return mock interactions
    if (userService.isDemoMode()) {
        const local = localStorage.getItem('demo_interactions');
        return local ? JSON.parse(local) : MOCK_INTERACTIONS.map(i => i.interaction);
    }

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
        chatHistory: row.chat_history
    }));
};

// Helper to map API record to Tender object
const mapRecordToTender = (record: any, user: UserProfile): Tender => {
    let details: any = {};
    try {
        details = JSON.parse(record.donnees || '{}');
    } catch (e) {
        // Ignore parsing errors
    }

    const title = record.objet || "Sans titre";
    
    const descriptionParts = [
        details.OBJET?.OBJET_COMPLET,
        details.OBJET?.CARACTERISTIQUES?.QUANTITE,
        details.RESUME_OBJET,
        record.objet
    ];
    const rawDescription = descriptionParts.filter(Boolean).join(' ');

    const rawBudget = details.OBJET?.CARACTERISTIQUES?.QUANTITE || "";
    const budgetMatch = rawBudget.match(/(\d[\d\s]*)(?:€|euros)/i);
    const estimatedBudget = budgetMatch ? parseInt(budgetMatch[1].replace(/\s/g, '')) : undefined;

    const fullText = `${title} ${rawDescription} ${record.descripteur_libelle?.join(' ') || ''}`;
    
    const score = calculateLocalScore(fullText, user);
    const smartSummary = generateSmartSummary(title, rawDescription, user);
    
    const identity = details.IDENTITE || {};
    const contact: TenderContact = {
        name: identity.CORRESPONDANT || identity.CONTACT || "Non spécifié",
        email: identity.MEL,
        phone: identity.TEL,
        address: [identity.ADRESSE, identity.CP, identity.VILLE].filter(Boolean).join(', '),
        urlBuyerProfile: identity.URL_PROFIL_ACHETEUR
    };

    let lots: TenderLot[] = [];
    try {
        const rawLots = details.OBJET?.LOTS?.LOT;
        if (Array.isArray(rawLots)) {
            lots = rawLots.map((l: any) => ({
                lotNumber: l.NUMERO || '?',
                title: l.LIBELLE || 'Lot sans titre',
                description: l.DESCRIPTION,
                cpv: extractCPVs(l)
            }));
        } else if (rawLots) {
            lots.push({
                lotNumber: rawLots.NUMERO || '1',
                title: rawLots.LIBELLE || 'Lot Unique',
                description: rawLots.DESCRIPTION,
                cpv: extractCPVs(rawLots)
            });
        }
    } catch (e) {
        console.warn("Error parsing lots", e);
    }

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
        contact: contact,
        lots: lots
    } as Tender;
};

export const tenderService = {
  
  getAuthorizedTenders: async (user: UserProfile, offset: number = 0, filters?: DashboardFilters): Promise<Tender[]> => {
    try {
        const interactions = await fetchUserInteractions();
        const blacklist = interactions
            .filter(i => i.status === TenderStatus.BLACKLISTED || i.status === TenderStatus.SAVED || i.status === TenderStatus.WON || i.status === TenderStatus.LOST)
            .map(i => i.tenderId);

        // --- FILTERING LOGIC (Server Side) ---
        const whereConditions: string[] = [];

        // 1. Department Filter
        let targetDepts: string[] = [];
        if (filters?.selectedRegion) {
            targetDepts = [filters.selectedRegion];
        } else if (user.targetDepartments && user.scope !== 'France' && user.scope !== 'Europe') {
            targetDepts = user.targetDepartments.split(',').map(d => d.trim()).filter(Boolean);
        }

        if (targetDepts.length > 0) {
            const deptList = targetDepts.map(d => `"${d}"`).join(', ');
            whereConditions.push(`code_departement in (${deptList})`);
        }

        // 2. Search Term (Full Text)
        if (filters?.searchTerm) {
            whereConditions.push(`search(objet, "${filters.searchTerm}") OR search(donnees, "${filters.searchTerm}")`);
        } else if (filters?.rawKeywords) {
             whereConditions.push(`search(objet, "${filters.rawKeywords}")`);
        }

        // 3. Procedure Type
        if (filters?.procedureType) {
            whereConditions.push(`search(procedure_libelle, "${filters.procedureType}")`);
        }

        // 4. Publication Date
        if (filters?.publicationDate) {
             whereConditions.push(`dateparution >= "${filters.publicationDate}"`);
        }
        
        const whereClause = whereConditions.join(' AND ');
        const params = new URLSearchParams({
            limit: '20', 
            offset: offset.toString(), 
            order_by: 'dateparution desc',
        });
        
        if (whereClause) {
            params.append('where', whereClause);
        }

        const response = await fetch(`${BOAMP_API_URL}?${params.toString()}`);
        if (!response.ok) throw new Error(`BOAMP API Error: ${response.statusText}`);

        const data = await response.json();
        
        let tenders: Tender[] = [];

        // FALLBACK: If API returns empty (likely CORS or Filter issue in Sandbox), use Mocks
        if (!data.results || data.results.length === 0) {
            console.warn("API returned 0 results. Falling back to MOCK DATA for demonstration.");
            tenders = MOCK_TENDERS.map(t => ({...t, compatibilityScore: calculateLocalScore(t.fullDescription||'', user)}));
        } else {
            tenders = data.results.map((record: any) => mapRecordToTender(record, user));
        }

        tenders.forEach(t => saveToTendersCache(t));

        return tenders.filter(t => !blacklist.includes(t.id));
    } catch (error) {
        console.error("Failed to fetch BOAMP tenders, using MOCKS", error);
        // ON ERROR (Network/CORS): Return Mocks
        return MOCK_TENDERS.map(t => ({...t, compatibilityScore: calculateLocalScore(t.fullDescription||'', user)}));
    }
  },

  getCompetitorStats: async (user: UserProfile): Promise<MarketAnalysis> => {
      // Demo Mode Fallback
      if (userService.isDemoMode()) {
          return {
              topCompetitors: [
                  { name: "VINCI CONSTRUCTION", winCount: 15, totalAmount: 4500000, topBuyer: "Métropole Lyon" },
                  { name: "EIFFAGE", winCount: 12, totalAmount: 3200000, topBuyer: "Région Occitanie" },
                  { name: "SNEF", winCount: 8, totalAmount: 1200000, topBuyer: "Hôpital Nord" }
              ],
              avgAwardAmount: 250000,
              totalAwardsAnalyzed: 150
          };
      }

      try {
          const keywords = user.specialization.split(' ').slice(0, 3).join(' '); 
          const whereClause = `search(objet, "${keywords}") AND search(donnees, "titulaire")`;
          
          const params = new URLSearchParams({
              limit: '100', 
              order_by: 'dateparution desc',
              where: whereClause
          });

          const response = await fetch(`${BOAMP_API_URL}?${params.toString()}`);
          if (!response.ok) throw new Error("API Error");
          
          const data = await response.json();
          const records = data.results || [];
          
          const competitorMap = new Map<string, { winCount: number; totalAmount: number; buyers: Map<string, number> }>();
          let totalMarketAmount = 0;
          let awardCountWithAmount = 0;

          records.forEach((record: any) => {
             try {
                const details = JSON.parse(record.donnees || '{}');
                let winners: any[] = [];
                
                if (details.ATTRIBUTION) {
                    if (Array.isArray(details.ATTRIBUTION)) winners = details.ATTRIBUTION;
                    else winners = [details.ATTRIBUTION];
                } 
                else if (details.OBJET?.LOTS?.LOT) {
                     const lots = Array.isArray(details.OBJET.LOTS.LOT) ? details.OBJET.LOTS.LOT : [details.OBJET.LOTS.LOT];
                     lots.forEach((lot: any) => {
                         if (lot.ATTRIBUTION) {
                             if(Array.isArray(lot.ATTRIBUTION)) winners.push(...lot.ATTRIBUTION);
                             else winners.push(lot.ATTRIBUTION);
                         }
                     });
                }

                winners.forEach(win => {
                    const nameRaw = win.TITULAIRE?.DENOMINATION || win.TITULAIRE || "Inconnu";
                    const name = nameRaw.toUpperCase().replace(/SAS|SARL|SA|EURL/g, '').trim();
                    
                    if (name.length < 3 || name === "INCONNU") return;

                    let amount = 0;
                    if (win.MONTANT) {
                        if (typeof win.MONTANT === 'number') amount = win.MONTANT;
                        else if (typeof win.MONTANT === 'string') {
                            amount = parseFloat(win.MONTANT.replace(',', '.').replace(/[^0-9.]/g, ''));
                        }
                    }

                    if (amount > 0) {
                        totalMarketAmount += amount;
                        awardCountWithAmount++;
                    }

                    if (!competitorMap.has(name)) {
                        competitorMap.set(name, { winCount: 0, totalAmount: 0, buyers: new Map() });
                    }
                    const comp = competitorMap.get(name)!;
                    comp.winCount++;
                    comp.totalAmount += amount;
                    
                    const buyer = record.nomacheteur || "Divers";
                    comp.buyers.set(buyer, (comp.buyers.get(buyer) || 0) + 1);
                });

             } catch (e) {
             }
          });

          const competitors: CompetitorStat[] = Array.from(competitorMap.entries()).map(([name, data]) => {
              let topBuyer = "N/A";
              let maxDeals = 0;
              data.buyers.forEach((count, buyer) => {
                  if (count > maxDeals) {
                      maxDeals = count;
                      topBuyer = buyer;
                  }
              });

              return {
                  name,
                  winCount: data.winCount,
                  totalAmount: data.totalAmount,
                  topBuyer
              };
          });

          return {
              topCompetitors: competitors.sort((a, b) => b.winCount - a.winCount).slice(0, 10),
              avgAwardAmount: awardCountWithAmount > 0 ? Math.round(totalMarketAmount / awardCountWithAmount) : 0,
              totalAwardsAnalyzed: records.length
          };

      } catch (e) {
          return { topCompetitors: [], avgAwardAmount: 0, totalAwardsAnalyzed: 0 };
      }
  },

  getSavedTenders: async (): Promise<{tender: Tender, interaction: UserInteraction}[]> => {
      // DEMO MODE
      if (userService.isDemoMode()) {
           const local = localStorage.getItem('demo_interactions');
           const interactions: UserInteraction[] = local ? JSON.parse(local) : MOCK_INTERACTIONS.map(i => i.interaction);
           
           return interactions.map(interaction => {
               let tender = MOCK_TENDERS.find(t => t.id === interaction.tenderId);
               if (!tender) tender = MOCK_TENDERS[0]; // fallback
               return { tender, interaction };
           });
      }

      const interactions = await fetchUserInteractions();
      const tenderCache = getStoredTendersCache();

      const workspaceInteractions = interactions.filter(i => 
          [TenderStatus.SAVED, TenderStatus.WON, TenderStatus.LOST, TenderStatus.IN_PROGRESS, TenderStatus.SUBMITTED, TenderStatus.TODO].includes(i.status)
      );

      const resultsPromise = workspaceInteractions.map(async (interaction) => {
          let tender = tenderCache.find(t => t.id === interaction.tenderId);
          
          if (!tender) {
             try {
                const whereClause = `idweb = "${interaction.tenderId}"`;
                const params = new URLSearchParams({
                    limit: '1', 
                    where: whereClause
                });
                const res = await fetch(`${BOAMP_API_URL}?${params.toString()}`);
                const data = await res.json();
                
                if (data.results && data.results.length > 0) {
                     const user = await userService.getCurrentProfile();
                     if (user) {
                        tender = mapRecordToTender(data.results[0], user);
                        saveToTendersCache(tender);
                     }
                }
             } catch (e) {
                 console.error("Failed to refetch missing tender", interaction.tenderId);
             }
          }

          if (!tender) return null;
          return { tender, interaction };
      });

      const results = (await Promise.all(resultsPromise)).filter(item => item !== null) as {tender: Tender, interaction: UserInteraction}[];

      return results;
  },

  updateInteraction: async (tenderId: string, status: TenderStatus, notes?: string, tenderObject?: Tender): Promise<void> => {
    if (tenderObject) {
        saveToTendersCache(tenderObject);
    }

    if (userService.isDemoMode()) {
        const local = localStorage.getItem('demo_interactions');
        let interactions: UserInteraction[] = local ? JSON.parse(local) : MOCK_INTERACTIONS.map(i => i.interaction);
        
        const existingIdx = interactions.findIndex(i => i.tenderId === tenderId);
        if (existingIdx >= 0) {
            interactions[existingIdx] = { ...interactions[existingIdx], status, ...(notes && {internalNotes: notes}) };
        } else {
            interactions.push({
                tenderId, 
                status, 
                internalNotes: notes, 
                user_id: 'demo-user' // Fake ID need to be string
            } as any);
        }
        localStorage.setItem('demo_interactions', JSON.stringify(interactions));
        return;
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
        .upsert(payload, { onConflict: 'user_id,tender_id' });

    if (error) console.error("Supabase update error", error);
  },

  getTenderById: async (id: string): Promise<{tender: Tender, interaction?: UserInteraction} | null> => {
      // Demo Mode Fallback
      if (userService.isDemoMode()) {
           const tender = MOCK_TENDERS.find(t => t.id === id);
           if (tender) {
                const local = localStorage.getItem('demo_interactions');
                const interactions: UserInteraction[] = local ? JSON.parse(local) : MOCK_INTERACTIONS.map(i => i.interaction);
                const interaction = interactions.find(i => i.tenderId === id);
                return { tender, interaction };
           }
      }

      // Try cache first
      let tender = getStoredTendersCache().find(t => t.id === id);
      
      // If not in cache, try fetch
      if (!tender) {
           try {
                const whereClause = `idweb = "${id}"`;
                const params = new URLSearchParams({ limit: '1', where: whereClause });
                const res = await fetch(`${BOAMP_API_URL}?${params.toString()}`);
                const data = await res.json();
                
                if (data.results && data.results.length > 0) {
                     const user = await userService.getCurrentProfile();
                     if (user) {
                        tender = mapRecordToTender(data.results[0], user);
                        saveToTendersCache(tender);
                     }
                }
             } catch (e) {
                 console.error("Failed to fetch tender details", id);
             }
      }

      const interactions = await fetchUserInteractions(); 
      const interaction = interactions.find(i => i.tenderId === id);

      if (!tender) return null;
      return { tender, interaction };
  },

  saveAnalysis: async (tenderId: string, analysis: AIStrategyAnalysis) => {
      if (userService.isDemoMode()) return; // No persistence in demo for now

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const userId = session.user.id;
      
      const { error } = await supabase
        .from('user_interactions')
        .upsert({
            user_id: userId,
            tender_id: tenderId,
            ai_analysis_result: analysis
        }, { onConflict: 'user_id,tender_id' });
      
      if (error) console.error("Error saving analysis", error);
  },

  saveChatHistory: async (tenderId: string, history: ChatMessage[]) => {
      if (userService.isDemoMode()) return; // No persistence in demo

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const userId = session.user.id;

      const { error } = await supabase
        .from('user_interactions')
        .upsert({
            user_id: userId,
            tender_id: tenderId,
            chat_history: history,
        }, { onConflict: 'user_id,tender_id' });

      if (error) console.error("Error saving chat history", error);
  },

  exportUserData: async () => {
      // Mock export
      const exportObj = {
          profile: await userService.getCurrentProfile(),
          tenders: await tenderService.getSavedTenders(),
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
