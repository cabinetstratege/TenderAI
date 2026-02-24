import { GoogleGenAI } from "@google/genai";
import { Tender, UserProfile, AIStrategyAnalysis } from "../types";

const MODEL_NAME = "gemini-2.5-flash";

// --- SYSTEM HEALTH CHECK ---
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    // 1. Check if key exists in env
    const apiKey = process.env.GEMINI_KEY || process?.env?.GEMINI_KEY;
    if (!apiKey || apiKey.includes("AIza") === false) {
      // Basic format check
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

export const analyzeTenderWithGemini = async (
  tender: Tender,
  profile: UserProfile,
): Promise<string> => {
  try {
    const apiKey = process.env.GEMINI_KEY || process?.env?.GEMINI_KEY;
    if (!apiKey) {
      return "Clé API manquante. Impossible d'analyser.";
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
      Tu es un expert en réponse aux appels d'offres publics (Source: BOAMP).
      
      Analyse l'appel d'offre suivant :
      ID BOAMP: ${tender.idWeb}
      Titre: ${tender.title}
      Description Complète: ${tender.fullDescription || tender.aiSummary}
      Descripteurs: ${tender.descriptors.join(", ")}
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

export const suggestCPVCodes = async (
  specialization: string,
): Promise<string[]> => {
  try {
    const apiKey = process.env.GEMINI_KEY || process?.env?.GEMINI_KEY;
    if (!apiKey) {
      return ["45000000 (Exemple - Clé API manquante)"];
    }

    const ai = new GoogleGenAI({ apiKey });

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
    const cleanedText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

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

export const generateProfileSuggestions = async (
  specialization: string,
): Promise<{ cpvCodes: string; negativeKeywords: string }> => {
  try {
    const apiKey = process.env.GEMINI_KEY || process?.env?.GEMINI_KEY;
    if (!apiKey) {
      return {
        cpvCodes: "45000000, 72000000",
        negativeKeywords: "hors sujet, maintenance basique",
      };
    }

    const ai = new GoogleGenAI({ apiKey });

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
      config: { responseMimeType: "application/json" },
    });

    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Profile Suggestion Error:", error);
    return { cpvCodes: "", negativeKeywords: "" };
  }
};

export const generateStrategicAnalysis = async (
  tender: Tender,
  profile: UserProfile,
): Promise<AIStrategyAnalysis | null> => {
  try {
    const apiKey = process.env.GEMINI_KEY || process?.env?.GEMINI_KEY;
    if (!apiKey) return null;

    const ai = new GoogleGenAI({ apiKey });

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
      config: { responseMimeType: "application/json" },
    });

    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Strategy Error:", error);
    return null;
  }
};

export const chatWithTender = async (
  tender: Tender,
  history: { role: string; parts: { text: string }[] }[],
  message: string,
  profile?: UserProfile,
): Promise<string> => {
  try {
    const apiKey = process.env.GEMINI_KEY || process?.env?.GEMINI_KEY;
    if (!apiKey) return "Erreur: Clé API manquante ou mal configurée.";

    const ai = new GoogleGenAI({ apiKey });

    const companyContext = profile
      ? `Ton entreprise (le candidat) est "${profile.companyName}".
           Activité: ${profile.specialization}.
           Points forts/Certifications: ${profile.certifications || "Non spécifié"}.
           Adresse: ${profile.address || "Non spécifié"}.`
      : "Tu réponds au nom d'une entreprise candidate générique.";

    const systemInstruction = `
    Tu es TenderAI, un "Bid Manager" Senior.
    
    TA MISSION : 
    Rédiger des documents de haute qualité (Lettres, Mémoires, Mails).

    CONTEXTE DE L'AO :
    Titre : ${tender.title}
    Acheteur : ${tender.buyer}
    Détails : ${tender.fullDescription?.substring(0, 5000)}...

    CANDIDAT (NOUS) :
    ${companyContext}

    RÈGLES :
    1. **Formatage** : Utilise Markdown. Titres en gras (**Titre**), listes à puces.
    2. **Ton** : Professionnel, persuasif, mais sobre.
    3. **Personnalisation** : Remplis les champs avec les infos du profil.
    4. **Signature** : Signe toujours "L'équipe de ${profile?.companyName || "Candidat"}".
    `;

    const chat = ai.chats.create({
      model: MODEL_NAME,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
      history: history,
    });

    const result = await chat.sendMessage({ message });
    return result.text || "Je n'ai pas pu générer de réponse.";
  } catch (error: any) {
    console.error("Chat Error", error);
    if (error.message?.includes("429")) {
      return "⚠️ Trop de demandes. Veuillez patienter quelques secondes.";
    }
    return "⚠️ Une erreur technique est survenue.";
  }
};
