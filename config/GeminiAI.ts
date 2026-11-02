import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY as string);
export const LLMModel = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });