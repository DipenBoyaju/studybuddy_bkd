import Document from '../models/Document.js';
import FlashCard from '../models/Flashcard.js';
import Quiz from '../models/Quiz.js';
import ChatHistory from '../models/ChatHistory.js';
import { extractTextFromPDF } from '../utils/pdfParser.js';
import { chunkText } from '../utils/textChunker.js';
import fs from 'fs/promises';
import mongoose from 'mongoose';
import path from 'path';
import { UTApi } from "uploadthing/server";

const utapi = new UTApi();

export const uploadDocument = async (req, res, next) => {
  try {
    const { title, fileUrl, fileKey, fileSize, fileName } = req.body;

    if (!fileUrl || !fileKey) {
      return res.status(400).json({
        success: false,
        error: 'Please upload a PDF file',
        statusCode: 400
      });
    }

    if (!title) {
      //delete uploaded file if no title provided
      await utapi.deleteFiles(fileKey);
      return res.status(400).json({
        success: false,
        error: 'Please provide a document title',
        statusCode: 400
      });
    }

    //create document record
    const document = await Document.create({
      userId: req.user._id,
      title,
      fileName: fileName,
      filePath: fileUrl,
      fileKey: fileKey,
      fileSize: fileSize,
      status: 'processing'
    });

    //Process PDF in background (in production, use a queue like bull)
    processPDF(document._id, fileUrl).catch(err => {
      console.error('PDF processing error:', err);
    });

    res.status(201).json({
      success: true,
      data: document,
      message: 'Document uploaded successfully, Processing in progress...'
    });
  } catch (error) {
    next(error);
  }
}

//Helper function to process PDF
const processPDF = async (documentId, fileUrl) => {
  try {
    const { text } = await extractTextFromPDF(fileUrl);

    //create chunks
    const chunks = chunkText(text, 500, 50);

    //update document
    await Document.findByIdAndUpdate(documentId, {
      extractedText: text,
      chunks: chunks,
      status: 'ready'
    });

    console.log(`Document ${documentId} processed successfully`);
  } catch (error) {
    console.error(`Error processing document ${documentId}:`, error);
    await Document.findByIdAndUpdate(documentId, {
      status: 'failed'
    });
  }
};

export const getDocuments = async (req, res, next) => {
  try {
    const documents = await Document.aggregate([
      {
        $match: { userId: new mongoose.Types.ObjectId(req.user._id) }
      },
      {
        $lookup: {
          from: 'flashcards',
          localField: '_id',
          foreignField: 'documentId',
          as: 'flashcardSets'
        }
      },
      {
        $lookup: {
          from: 'quizzes',
          localField: '_id',
          foreignField: 'documentId',
          as: 'quizzes'
        }
      },
      {
        $addFields: {
          flashcardCount: { $size: '$flashcardSets' },
          quizCount: { $size: '$quizzes' }
        }
      },
      {
        $project: {
          extractedText: 0,
          chunks: 0,
          flashcardSets: 0,
          quizzes: 0
        }
      },
      {
        $sort: {
          uploadDate: -1,
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents
    })
  } catch (error) {
    next(error);
  }
}

export const getDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found',
        statusCode: 404
      });
    }

    //get counts of associated flashcards and quizzes
    const flashcardCount = await FlashCard.countDocuments({ documentId: document._id, userId: req.user._id });
    const quizCount = await Quiz.countDocuments({ documentId: document._id, userId: req.user._id });

    //upload last accessed
    document.lastAccessed = Date.now();
    await document.save();

    //Combine document data with counts
    const documentData = document.toObject();
    documentData.flashcardCount = flashcardCount;
    documentData.quizCount = quizCount;

    res.status(200).json({
      success: true,
      data: documentData
    })
  } catch (error) {
    next(error);
  }
}

export const deleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!document) {
      return res.status(404).json({
        sucess: false,
        error: 'Document not found',
        statusCode: 404
      });
    }

    // Delete file from UploadThing Cloud using the stored fileKey
    if (document.fileKey) {
      try {
        await utapi.deleteFiles(document.fileKey);
      } catch (err) {
        console.error('UploadThing deletion error:', err.message);
      }
    }

    //delete document
    await Promise.all([
      FlashCard.deleteMany({ documentId: document._id }),
      Quiz.deleteMany({ documentId: document._id }),
      ChatHistory.deleteMany({ documentId: document._id }),
    ]);

    await document.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Document and all associated data deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}
