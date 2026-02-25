import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = "gemini-2.5-flash-lite";

type ProfileSuggestionsRequest = {
  specialization: string;
};

type ProfileSuggestionsResponse = {
  cpvCodes: string;
  negativeKeywords: string;
};

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Clé API manquante" }, { status: 500 });
  }

  let body: ProfileSuggestionsRequest;
  try {
    body = (await req.json()) as ProfileSuggestionsRequest;
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const { specialization } = body || {};
  if (!specialization) {
    return NextResponse.json({ error: "Spécialisation requise" }, { status: 400 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey, httpOptions: { baseUrl: "https://generativelanguage.googleapis.com" } });

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
    const parsed = JSON.parse(text) as ProfileSuggestionsResponse;

    return NextResponse.json<ProfileSuggestionsResponse>({
      cpvCodes: parsed.cpvCodes || "",
      negativeKeywords: parsed.negativeKeywords || "",
    });
  } catch (error) {
    console.error("Gemini Profile Suggestion Error:", error);
    return NextResponse.json<ProfileSuggestionsResponse>({
      cpvCodes: "",
      negativeKeywords: "",
    });
  }
}

