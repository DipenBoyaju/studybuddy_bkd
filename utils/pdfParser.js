import fs from "fs/promises";
import { PDFParse } from "pdf-parse";

export const extractTextFromPDF = async (fileUrl) => {
  try {
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error('Failed to download PDF from cloud');

    const dataBuffer = await response.arrayBuffer();

    const parser = new PDFParse(new Uint8Array(dataBuffer));
    const data = await parser.getText();

    return {
      text: data.text,
      numPages: data.numPages,
      info: data.info,
    };
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error("Failed to extract text from PDF");
  }
}

// export const extractTextFromPDF = async (filePath) => {
//   try {
//     const dataBuffer = await fs.readFile(filePath);
//     //pdf-parse expects a Unit8Array not a buffer
//     const parser = new PDFParse(new Uint8Array(dataBuffer));
//     const data = await parser.getText();

//     return {
//       text: data.text,
//       numPages: data.numPages,
//       info: data.info,
//     };
//   } catch (error) {
//     console.error("PDF parsing error:", error);
//     throw new Error("Failed to extract text from  PDF");
//   }
// };