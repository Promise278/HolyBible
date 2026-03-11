import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  process.env.EXPO_PUBLIC_GEMINI_API_KEY || "",
);

export interface BibleBreakdown {
  summary: string;
  context: string;
  keyTakeaways: string[];
  application: string;
}

export async function getBibleBreakdown(
  book: string,
  chapter: string,
  text: string,
): Promise<BibleBreakdown | null> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      You are a biblical scholar. Break down the following Bible text (${book} Chapter ${chapter}).
      Provide the response in raw JSON format with these exact keys:
      "summary": A concise summary of the chapter.
      "context": Historical or cultural context relevant to these verses.
      "keyTakeaways": An array of 3-5 bullet points of main themes.
      "application": A practical daily application for a modern reader.

      Text:
      ${text}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const cleanJson = response
      .text()
      .replace(/```json|```/g, "")
      .trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("AI Breakdown Error:", error);
    return null;
  }
}

export async function getVerseInsight(
  reference: string,
  text: string,
): Promise<string | null> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Provide a deep spiritual insight for the following verse (${reference}): "${text}". Keep it to 2-3 sentences.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Verse Insight Error:", error);
    return null;
  }
}
