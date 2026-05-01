import { createUploadthing } from "uploadthing/express";

const f = createUploadthing();

export const ourFileRouter = {
  // Define a "slug" (like pdfUploader) to match your frontend
  pdfUploader: f({ pdf: { maxFileSize: "4MB" } })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);

      // Here you would usually save file.url to your MongoDB
      return { uploadedBy: "Server" };
    }),
};