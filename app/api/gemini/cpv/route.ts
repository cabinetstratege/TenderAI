import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = "gemini-2.5-flash-lite";

type CPVRequest = {
  specialization: string;
};

type CPVResponse = {
  codes: string[];
};

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Clé API manquante" }, { status: 500 });
  }

  let body: CPVRequest;
  try {
    body = (await req.json()) as CPVRequest;
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
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();

    try {
      const codes = JSON.parse(cleanedText);
      return NextResponse.json<CPVResponse>({
        codes: Array.isArray(codes) ? codes : [],
      });
    } catch {
      return NextResponse.json<CPVResponse>({
        codes: text.match(/\d{8}/g) || [],
      });
    }
  } catch (error) {
    console.error("Gemini CPV Error:", error);
    return NextResponse.json<CPVResponse>({ codes: ["Erreur génération CPV"] });
  }
}

