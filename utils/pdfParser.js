import pdfParse from "pdf-parse";

export const extractTextFromPDF = async (fileUrl) => {
  try {
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error("Failed to download PDF from cloud");

    const dataBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(dataBuffer);

    const data = await pdfParse(buffer);

    return {
      text: data.text,
      numPages: data.numpages,
      info: data.info,
    };
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
};

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