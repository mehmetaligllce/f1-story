import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY is not defined in environment variables. Gemini calls will fail.");
}

// Initialize the Google Generative AI client
export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

/**
 * Generates content using the preferred Gemini model (defaults to gemini-3.5-flash).
 * This function should only be called on the server side (API Routes, Server Actions, Server Components).
 * 
 * @param prompt The prompt to send to Gemini
 * @param modelName The model to use (default: gemini-3.5-flash)
 * @returns The text response from the model
 */
export async function generateContent(prompt: string, modelName: string = 'gemini-3.5-flash'): Promise<string> {
  if (!genAI) {
    throw new Error("Gemini client is not initialized.");
  }

  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const response =  result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating content via Gemini:", error);
    throw error;
  }
}
