import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import errorHandler from './middleware/errorHandler.js';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import flashcardRoutes from './routes/flashcardRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import { createRouteHandler } from "uploadthing/express";
import { ourFileRouter } from './config/uploadthing.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

connectDB();

app.use(
  cors({
    origin: "https://study-buddy-nine-sable.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
)

app.use("/api/uploadthing", createRouteHandler({
  router: ourFileRouter
}));

app.use(express.json());

//static folder for uploads
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  // Sending HTML so it looks nice in the browser
  res.send(`
    <div style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh;">
      <h1 style="color: #10b981;">🚀 Welcome to Study Buddy API</h1>
      <p style="color: #64748b;">The server is running smoothly in <b>${process.env.NODE_ENV || 'development'}</b> mode.</p>
      <div style="margin-top: 20px; padding: 10px; background: #f1f5f9; border-radius: 8px; font-family: monospace;">
        Status: Online | Version: 1.0.0
      </div>
    </div>
  `);
});

//Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/progress', progressRoutes);

app.use(errorHandler);

//404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    statusCode: 404
  });
});

//start server
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 8000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

process.on('unhandledRejection', (err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});

export default app;

