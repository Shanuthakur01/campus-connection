const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const quizController = require('../controllers/quiz.controller');

// Routes for conversation-specific quizzes
router.post('/conversations/:conversationId', protect, quizController.createQuiz);
router.get('/conversations/:conversationId', protect, quizController.getQuizzesByConversation);
router.get('/conversations/:conversationId/active', protect, quizController.getActiveQuiz);

// Routes for specific quizzes
router.get('/:quizId', protect, quizController.getQuiz);
router.post('/:quizId/answers', protect, quizController.submitAnswers);

module.exports = router; 