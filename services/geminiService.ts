import { Tender, UserProfile, AIStrategyAnalysis } from "../types";

type ApiError = { error?: string };
type ChatHistoryItem = { role: string; parts: { text: string }[] };

type DashboardInsights = {
  summary: string;
  top3: { idWeb: string; reason: string }[];
};

type TenderMini = {
  idWeb: string;
  title: string;
  buyer: string;
  procedureType: string;
  compatibilityScore: number;
  estimatedBudget?: number;
  aiSummary: string;
};

const parseApiError = async (res: Response): Promise<string> => {
  try {
    const data = (await res.json()) as ApiError;
    return data.error || res.statusText || "Erreur API";
  } catch {
    return res.statusText || "Erreur API";
  }
};

const postJson = async <TResponse, TBody>(
  url: string,
  body: TBody,
  signal?: AbortSignal,
): Promise<TResponse> => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    throw new Error(await parseApiError(res));
  }

  return (await res.json()) as TResponse;
};

const getJson = async <TResponse>(url: string, signal?: AbortSignal): Promise<TResponse> => {
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(await parseApiError(res));
  }
  return (await res.json()) as TResponse;
};

// --- SYSTEM HEALTH CHECK ---
export const checkApiHealth = async (signal?: AbortSignal): Promise<boolean> => {
  try {
    const data = await getJson<{ ok: boolean }>("/api/gemini/health", signal);
    return Boolean(data.ok);
  } catch (error) {
    console.error("Gemini Health Check Failed:", error);
    return false;
  }
};

export const suggestCPVCodes = async (
  specialization: string,
  signal?: AbortSignal,
): Promise<string[]> => {
  try {
    const data = await postJson<{ codes: string[] }, { specialization: string }>(
      "/api/gemini/cpv",
      { specialization },
      signal,
    );
    return data.codes || [];
  } catch (error: any) {
    console.error("Gemini CPV Error:", error);
    if (error?.message?.includes("Cle API manquante")) {
      return ["45000000 (Exemple - Cle API manquante)"];
    }
    return ["Erreur generation CPV"];
  }
};

export const generateProfileSuggestions = async (
  specialization: string,
  signal?: AbortSignal,
): Promise<{ cpvCodes: string; negativeKeywords: string }> => {
  try {
    return await postJson<
      { cpvCodes: string; negativeKeywords: string },
      { specialization: string }
    >(
      "/api/gemini/profile-suggestions",
      { specialization },
      signal,
    );
  } catch (error) {
    console.error("Gemini Profile Suggestion Error:", error);
    if (String(error).includes("Cle API manquante")) {
      return {
        cpvCodes: "45000000, 72000000",
        negativeKeywords: "hors sujet, maintenance basique",
      };
    }
    return { cpvCodes: "", negativeKeywords: "" };
  }
};

export const generateStrategicAnalysis = async (
  tender: Tender,
  profile: UserProfile,
  signal?: AbortSignal,
): Promise<AIStrategyAnalysis | null> => {
  try {
    const data = await postJson<
      { analysis: AIStrategyAnalysis | null },
      { tender: Tender; profile: UserProfile }
    >(
      "/api/gemini/strategy",
      { tender, profile },
      signal,
    );
    return data.analysis;
  } catch (error) {
    console.error("Gemini Strategy Error:", error);
    return null;
  }
};

export const chatWithTender = async (
  tender: Tender,
  history: ChatHistoryItem[],
  message: string,
  profile?: UserProfile,
  signal?: AbortSignal,
): Promise<string> => {
  try {
    const data = await postJson<
      { text: string },
      { tender: Tender; history: ChatHistoryItem[]; message: string; profile?: UserProfile }
    >(
      "/api/gemini/chat",
      { tender, history, message, profile },
      signal,
    );
    return data.text || "Je n'ai pas pu generer de reponse.";
  } catch (error: any) {
    console.error("Chat Error", error);
    if (error?.message?.includes("Trop de demandes") || error?.message?.includes("429")) {
      return "Attention: Trop de demandes. Veuillez patienter quelques secondes.";
    }
    if (error?.message?.includes("Cle API manquante")) {
      return "Erreur: Cle API manquante ou mal configuree.";
    }
    return "Attention: Une erreur technique est survenue.";
  }
};

export const getDashboardInsights = async (
  tenders: TenderMini[],
  profile: Pick<UserProfile, "companyName" | "specialization" | "negativeKeywords">,
  signal?: AbortSignal,
): Promise<DashboardInsights> => {
  return postJson<DashboardInsights, { tenders: TenderMini[]; profile: typeof profile }>(
    "/api/gemini/dashboard-insights",
    { tenders, profile },
    signal,
  );
};

type ScoreTenderInput = {
  idWeb: string;
  title: string;
  buyer?: string;
  procedureType?: string;
  estimatedBudget?: number;
  fullDescription?: string;
  descriptors?: string[];
  cpv?: string[];
};

type ScoreResponse = {
  scores: { idWeb: string; score: number }[];
};

export const getAIScores = async (
  tenders: ScoreTenderInput[],
  profile: Pick<UserProfile, "companyName" | "specialization" | "cpvCodes" | "negativeKeywords">,
  signal?: AbortSignal,
): Promise<ScoreResponse> => {
  return postJson<ScoreResponse, { tenders: ScoreTenderInput[]; profile: typeof profile }>(
    "/api/gemini/score",
    { tenders, profile },
    signal,
  );
};
