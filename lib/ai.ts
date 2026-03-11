import OpenAI from "openai";

export type BibleBreakdown = {
  summary: string;
  context: string;
  keyTakeaways: string[];
  application: string;
};

const groqApiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;

if (!groqApiKey) {
  throw new Error("Missing EXPO_PUBLIC_GROQ_API_KEY");
}

const client = new OpenAI({
  apiKey: groqApiKey,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function getBibleBreakdown(
  book: string,
  chapter: string,
  text: string,
): Promise<BibleBreakdown> {
  const prompt = `
You are a biblical study assistant.
Give a short, faithful, easy-to-understand explanation of ${book} chapter ${chapter}.

Passage:
${text}

Return valid JSON in exactly this shape:
{
  "summary": "short summary",
  "context": "historical and spiritual context",
  "keyTakeaways": ["point 1", "point 2", "point 3"],
  "application": "simple daily life application"
}
`;

  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content:
          "You explain Bible passages clearly, faithfully, and practically. Always return valid JSON only.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = completion.choices[0]?.message?.content?.trim() || "";

  const cleaned = content
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
}
