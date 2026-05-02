import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';


dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const extractTextFromPDF = async (fileUrl) => {
  try {
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error('Failed to download PDF');
    const pdfBuffer = await response.arrayBuffer();
    const base64Data = Buffer.from(pdfBuffer).toString("base64");

    // Use gemini-3.1-flash-preview as 1.5 is deprecated
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: "application/pdf",
                data: base64Data,
              },
            },
            { text: "Extract all the text from this PDF document. Maintain the logical order of the content." },
          ],
        },
      ],
    });

    // In the @google/genai library, response text is usually at result.text
    const text = result.text;

    if (!text) throw new Error("Gemini returned empty text.");

    return {
      text: text,
      numPages: "unknown",
    };
  } catch (error) {
    console.error('Gemini Extraction Error:', error);
    throw new Error(`Failed to extract text: ${error.message}`);
  }
};