import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY is not defined in environment variables. Gemini calls will fail.");
}

export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function generateContent(
  prompt: string,
  modelName: string = 'gemini-2.5-flash',
  maxRetries: number = 3
): Promise<string> {
  if (!genAI) {
    throw new Error("Gemini client is not initialized.");
  }

  const model = genAI.getGenerativeModel({ model: modelName });

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error: any) {
      const is503 = error?.status === 503 || error?.message?.includes('503');

      // Sadece 503 ve kalan deneme hakkı varsa bekle ve tekrar dene
      if (is503 && attempt < maxRetries) {
        const waitTime = attempt * 2000; // 2s, 4s...
        console.warn(`Gemini 503 yoğunluk hatası verdi. ${waitTime}ms sonra tekrar deneniyor (${attempt}/${maxRetries})...`);
        await new Promise((res) => setTimeout(res, waitTime));
        continue;
      }

      console.error("Error generating content via Gemini:", error);
      throw error;
    }
  }

  throw new Error("Gemini isteği maksimum deneme sayısına ulaştı.");
}