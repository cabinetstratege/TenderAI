import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = "gemini-2.5-flash-lite";

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

type ScoreRequest = {
  tenders: ScoreTenderInput[];
  profile: {
    companyName: string;
    specialization: string;
    cpvCodes: string;
    negativeKeywords: string;
  };
};

type ScoreResponse = {
  scores: { idWeb: string; score: number }[];
};

const clampScore = (value: number) => Math.max(0, Math.min(100, value));

const trimText = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max)}...` : text;

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Clé API manquante" }, { status: 500 });
  }

  let body: ScoreRequest;
  try {
    body = (await req.json()) as ScoreRequest;
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const { tenders, profile } = body || {};
  if (!Array.isArray(tenders) || tenders.length === 0 || !profile) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const mini = tenders.slice(0, 20).map((t) => ({
      idWeb: t.idWeb,
      title: trimText(t.title || "", 160),
      buyer: trimText(t.buyer || "", 120),
      procedureType: trimText(t.procedureType || "", 120),
      budget: t.estimatedBudget ?? null,
      cpv: Array.isArray(t.cpv) ? t.cpv.slice(0, 12) : [],
      descriptors: Array.isArray(t.descriptors) ? t.descriptors.slice(0, 12) : [],
      description: trimText(t.fullDescription || "", 800),
    }));

    const prompt = `
Tu es un analyste d'appels d'offres. Réponds uniquement en JSON strict.
Entreprise: ${profile.companyName} | Spécialisation: ${profile.specialization}
CPV: ${profile.cpvCodes}
Mots-clés négatifs: ${profile.negativeKeywords}

Tâche:
Pour chaque appel d'offres, calcule un score global de compatibilité entre 0 et 100.
Le score doit refléter l'adéquation globale avec la spécialisation et les CPV.
Si des mots-clés négatifs sont présents, baisse nettement le score.

Format strict:
{
  "scores": [{"idWeb":"string","score": number}]
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
    const parsed = JSON.parse(text) as ScoreResponse;

    const scores = Array.isArray(parsed.scores)
      ? parsed.scores.map((s) => ({
          idWeb: String(s.idWeb || ""),
          score: clampScore(Number(s.score)),
        }))
      : [];

    return NextResponse.json<ScoreResponse>({ scores });
  } catch (error) {
    console.error("Gemini Score Error:", error);
    return NextResponse.json<ScoreResponse>({ scores: [] }, { status: 200 });
  }
}
