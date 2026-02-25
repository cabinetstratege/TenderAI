import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const MODEL_NAME = "gemini-2.5-flash";

type HealthResponse = {
  ok: boolean;
};

export async function GET() {
  const apiKey = process.env.GEMINI_KEY;
  if (!apiKey || !apiKey.includes("AIza")) {
    return NextResponse.json<HealthResponse>({ ok: false });
  }

  try {
    const ai = new GoogleGenAI({ apiKey, httpOptions: { baseUrl: "https://generativelanguage.googleapis.com" } });
    await ai.models.generateContent({
      model: MODEL_NAME,
      contents: "Ping",
    });
    return NextResponse.json<HealthResponse>({ ok: true });
  } catch (error) {
    console.error("Gemini Health Check Failed:", error);
    return NextResponse.json<HealthResponse>({ ok: false });
  }
}

