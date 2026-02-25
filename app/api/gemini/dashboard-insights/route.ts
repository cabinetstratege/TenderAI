import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = "gemini-2.5-flash-lite";

type TenderMini = {
  idWeb: string;
  title: string;
  buyer: string;
  procedureType: string;
  compatibilityScore: number;
  estimatedBudget?: number;
  aiSummary: string;
};

type InsightsRequest = {
  tenders: TenderMini[];
  profile: {
    companyName: string;
    specialization: string;
    negativeKeywords: string;
  };
};

type InsightsResponse = {
  summary: string;
  top3: { idWeb: string; reason: string }[];
};

const trimSummary = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max)}...` : text;

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Clé API manquante" }, { status: 500 });
  }

  let body: InsightsRequest;
  try {
    body = (await req.json()) as InsightsRequest;
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const { tenders, profile } = body || {};
  if (!Array.isArray(tenders) || tenders.length === 0 || !profile) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey, httpOptions: { baseUrl: "https://generativelanguage.googleapis.com" } });

    const mini = tenders.slice(0, 12).map((t) => ({
      idWeb: t.idWeb,
      title: t.title,
      buyer: t.buyer,
      procedureType: t.procedureType,
      score: t.compatibilityScore,
      budget: t.estimatedBudget ?? null,
      summary: trimSummary(t.aiSummary || "", 240),
    }));

    const prompt = `
Tu es un analyste d'appels d'offres. Réponds uniquement en JSON strict.
Entreprise: ${profile.companyName} | Spécialisation: ${profile.specialization}
Mots-clés négatifs: ${profile.negativeKeywords}

Tâches:
1) Donne un résumé très court du flux (1 phrase max).
2) Sélectionne les 3 meilleures opportunités et justifie en 1 phrase chacune.

Format strict:
{
  "summary": "string",
  "top3": [{"idWeb":"string","reason":"string"}]
}

Données:
${JSON.stringify(mini)}
`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text) as InsightsResponse;

    return NextResponse.json<InsightsResponse>({
      summary: parsed.summary || "",
      top3: Array.isArray(parsed.top3) ? parsed.top3.slice(0, 3) : [],
    });
  } catch (error) {
    console.error("Gemini Dashboard Insights Error:", error);
    return NextResponse.json({ summary: "", top3: [] });
  }
}

