import Document from "../models/Document.js";
import FlashCard from "../models/Flashcard.js";
import Quiz from "../models/Quiz.js";

export const getDashboard = async (req, res, next) {
  try {
    const userId = req.user._id;

    //get counts
    const totalDocuments = await Document.countDocuments({ userId });
    const totalFlashCard = await FlashCard.countDocuments({ userId });
    const totalQuizzes = await Quiz.countDocuments({ userId });
    const completedQuizzes = await Quiz.countDocuments({ userId, completedAt: { $ne: null } });

    //Get flashcard statistics
    const flashCardSets = await Flashcard.find({ userId });
    let totalFlashcards = 0;
    let reviewedFlashcards = 0;
    let starredFlashcards = 0;

  } catch (error) {
    next(error);
  }
}