import { GoogleGenAI, Type } from "@google/genai";

// Interface for the structured response we expect from Gemini
export interface GeneratedSlidePlan {
  slides: {
    title: string;
    durationSeconds: number;
    notes?: string;
  }[];
}

export const generateSlidePlan = async (
  topic: string,
  totalSlides: number,
  totalMinutes: number
): Promise<GeneratedSlidePlan | null> => {
  if (!process.env.API_KEY) {
    console.warn("API Key is missing. Cannot call Gemini.");
    return null;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Create a presentation plan for a talk about "${topic}".
    The presentation must have exactly ${totalSlides} slides.
    The total duration must be exactly ${totalMinutes} minutes (${totalMinutes * 60} seconds).
    Distribute the time logically based on the complexity of typical slide content (e.g., Intro is short, deep dives are long).
    Return a list of slides with titles and duration in seconds.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            slides: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  durationSeconds: { type: Type.NUMBER, description: "Duration in seconds" },
                  notes: { type: Type.STRING, description: "Short speaker note idea" }
                },
                required: ["title", "durationSeconds"]
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as GeneratedSlidePlan;

  } catch (error) {
    console.error("Error generating slide plan:", error);
    return null;
  }
};
