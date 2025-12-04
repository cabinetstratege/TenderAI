import { GoogleGenAI } from "@google/genai";
import { Tender, UserProfile, AIStrategyAnalysis } from "../types";

const MODEL_NAME = "gemini-2.5-flash";

// --- SYSTEM HEALTH CHECK ---
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    // 1. Check if key exists in env
    const apiKey = process.env.API_KEY || process?.env?.API_KEY;
    if (!apiKey || apiKey.includes("AIza") === false) { // Basic format check
       return false;
    }

    // 2. Perform a minimal real request to check validity
    const ai = new GoogleGenAI({ apiKey });
    await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Ping",
    });
    
    return true;
  } catch (error) {
    console.error("Gemini Health Check Failed:", error);
    return false;
  }
};

export const analyzeTenderWithGemini = async (tender: Tender, profile: UserProfile): Promise<string> => {
  try {
    if (!process.env.API_KEY) {
      return "Clé API manquante. Impossible d'analyser.";
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
      Tu es un expert en réponse aux appels d'offres publics (Source: BOAMP).
      
      Analyse l'appel d'offre suivant :
      ID BOAMP: ${tender.idWeb}
      Titre: ${tender.title}
      Description Complète: ${tender.fullDescription || tender.aiSummary}
      Descripteurs: ${tender.descriptors.join(', ')}
      Acheteur: ${tender.buyer}

      Pour l'entreprise suivante :
      Nom: ${profile.companyName}
      Spécialisation: ${profile.specialization}
      Mots clés à éviter: ${profile.negativeKeywords}

      Tâche :
      1. Tente d'extraire le BUDGET ESTIMÉ du texte s'il est mentionné (même approximatif).
      2. Donne une analyse stratégique en 3 points concis sur pourquoi c'est une opportunité (ou un risque).
      3. Suggère 2 arguments clés à mettre en avant dans le mémoire technique.
      
      Format de réponse souhaité : Markdown, très court et direct. Commence par "Budget Estimé: X €" si trouvé, sinon "Budget Estimé: Non spécifié".
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "Pas d'analyse générée.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Erreur lors de l'analyse IA. Veuillez vérifier votre connexion ou clé API.";
  }
};

export const suggestCPVCodes = async (specialization: string): Promise<string[]> => {
  try {
    if (!process.env.API_KEY) {
      return ["45000000 (Exemple - Clé API manquante)"];
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      Tu es un expert en marchés publics.
      L'entreprise a la spécialisation suivante : "${specialization}".
      
      Donne-moi UNIQUEMENT une liste de 5 codes CPV (Vocabulaire commun pour les marchés publics) les plus pertinents pour cette activité.
      Format de sortie : Une liste JSON simple de chaines de caractères, sans explications. Ex: ["12345678", "87654321"]
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    const text = response.text || "[]";
    // Basic cleaning to try and parse JSON array if markdown code blocks are used
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    try {
        const codes = JSON.parse(cleanedText);
        return Array.isArray(codes) ? codes : [];
    } catch (e) {
        return text.match(/\d{8}/g) || [];
    }

  } catch (error) {
    console.error("Gemini CPV Error:", error);
    return ["Erreur génération CPV"];
  }
};

export const generateProfileSuggestions = async (specialization: string): Promise<{ cpvCodes: string, negativeKeywords: string }> => {
  try {
    if (!process.env.API_KEY) {
      return { 
          cpvCodes: "45000000, 72000000", 
          negativeKeywords: "hors sujet, maintenance basique" 
      };
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
      Tu es un consultant en stratégie de marchés publics.
      Une entreprise a la spécialisation suivante : "${specialization}".
      
      Génère deux choses pour configurer son profil de veille :
      1. Une liste de 5 Codes CPV pertinents (séparés par des virgules).
      2. Une liste de 5 à 10 "Mots-clés Négatifs" (Mots qui, s'ils sont présents dans un AO, signifient que ce n'est PAS pour nous. Ex: Si je suis dev web, mot négatif = "imprimante", "réseau physique").
      
      Réponds UNIQUEMENT en JSON strict :
      {
        "cpvCodes": "code1, code2, code3",
        "negativeKeywords": "mot1, mot2, mot3"
      }
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const text = response.text || "{}";
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Profile Suggestion Error:", error);
    return { cpvCodes: "", negativeKeywords: "" };
  }
};

export const generateStrategicAnalysis = async (tender: Tender, profile: UserProfile): Promise<AIStrategyAnalysis | null> => {
  try {
    if (!process.env.API_KEY) return null;

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
      Tu es un directeur commercial expert en B2B.
      Analyse cet Appel d'Offre pour mon entreprise.
      
      AO:
      Titre: ${tender.title}
      Description: ${tender.fullDescription}
      
      Mon Entreprise:
      Activité: ${profile.specialization}
      
      Réponds UNIQUEMENT en format JSON strict respectant cette structure :
      {
        "risks": ["Risque 1", "Risque 2"],
        "strengths": ["Point fort 1", "Point fort 2"],
        "workload": "Faible" | "Moyenne" | "Élevée",
        "questions": ["Question 1 à poser à l'acheteur ?", "Question 2 ?"]
      }
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const text = response.text || "{}";
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Strategy Error:", error);
    return null;
  }
};

export const chatWithTender = async (tender: Tender, history: {role: string, parts: {text: string}[]}[], message: string): Promise<string> => {
   try {
    if (!process.env.API_KEY) return "Erreur: Clé API manquante.";

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const systemInstruction = `Tu es TenderAI, un assistant spécialisé pour aider à répondre à cet Appel d'Offre précis : "${tender.title}".
    Utilise le contexte suivant :
    Description: ${tender.fullDescription}
    Acheteur: ${tender.buyer}
    
    Tes réponses doivent être courtes, professionnelles et orientées vers la rédaction du mémoire technique ou la compréhension du besoin.`;

    const chat = ai.chats.create({
      model: MODEL_NAME,
      config: { systemInstruction },
      history: history
    });

    const result = await chat.sendMessage({ message });
    return result.text || "Je n'ai pas compris.";

   } catch (error) {
     console.error("Chat Error", error);
     return "Désolé, je ne peux pas répondre pour le moment.";
   }
};