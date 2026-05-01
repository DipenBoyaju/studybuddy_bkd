import pdf from 'pdf-parse';

export const extractTextFromPDF = async (fileUrl) => {
  try {
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error('Failed to download PDF from cloud');

    const dataBuffer = await response.arrayBuffer();

    // pdf-parse expects a Buffer in Node.js
    const buffer = Buffer.from(dataBuffer);

    const data = await pdf(buffer);

    return {
      text: data.text,
      numPages: data.numpages,
      info: data.info,
    };
  } catch (error) {
    console.error("PDF parsing error:", error);
    // Don't mask the real error; let's see it in the logs
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}