import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { Tender, UserProfile, AIStrategyAnalysis } from "../../../../types";

const MODEL_NAME = "gemini-2.5-flash";

type StrategyRequest = {
  tender: Tender;
  profile: UserProfile;
};

type StrategyResponse = {
  analysis: AIStrategyAnalysis | null;
};

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Clé API manquante" }, { status: 500 });
  }

  let body: StrategyRequest;
  try {
    body = (await req.json()) as StrategyRequest;
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const { tender, profile } = body || {};
  if (!tender || !profile) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  try {
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
    const analysis = JSON.parse(text) as AIStrategyAnalysis;

    return NextResponse.json<StrategyResponse>({ analysis });
  } catch (error) {
    console.error("Gemini Strategy Error:", error);
    return NextResponse.json<StrategyResponse>({ analysis: null });
  }
}
