import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { Tender, UserProfile } from "../../../../types";

const MODEL_NAME = "gemini-2.5-flash";

type ChatHistoryItem = { role: string; parts: { text: string }[] };

type ChatRequest = {
  tender: Tender;
  history: ChatHistoryItem[];
  message: string;
  profile?: UserProfile;
};

type ChatResponse = {
  text: string;
};

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Clé API manquante" }, { status: 500 });
  }

  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const { tender, history, message, profile } = body || {};
  if (!tender || !message || !Array.isArray(history)) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  try {
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
      history,
    });

    const result = await chat.sendMessage({ message });
    const text = result.text || "Je n'ai pas pu générer de réponse.";

    return NextResponse.json<ChatResponse>({ text });
  } catch (error: any) {
    console.error("Chat Error", error);
    if (error?.message?.includes("429")) {
      return NextResponse.json({ error: "Trop de demandes" }, { status: 429 });
    }
    return NextResponse.json({ error: "Erreur technique" }, { status: 500 });
  }
}
