const Quiz = require('../models/quiz.model');
const Conversation = require('../models/conversation.model');
const User = require('../models/user.model');

// @desc    Create a new quiz for a conversation
// @route   POST /api/quiz/conversations/:conversationId
// @access  Private
exports.createQuiz = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { title, description, questions, category } = req.body;
    const userId = req.user.id;
    
    // Validation
    if (!title || !description || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, and questions'
      });
    }
    
    // Check if conversation exists and user is a participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
      isActive: true
    });
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found or you are not a participant'
      });
    }
    
    // Check if quiz is unlocked for this conversation
    if (!conversation.quizUnlocked) {
      return res.status(403).json({
        success: false,
        message: 'Quiz feature is not yet unlocked for this conversation'
      });
    }
    
    // Get other participant
    const otherParticipantId = conversation.participants.find(
      p => p.toString() !== userId
    );
    
    if (!otherParticipantId) {
      return res.status(400).json({
        success: false,
        message: 'Could not find other participant'
      });
    }
    
    // Check if there's already an active quiz for this conversation
    const existingQuiz = await Quiz.findOne({
      conversation: conversationId,
      status: 'active'
    });
    
    if (existingQuiz) {
      return res.status(400).json({
        success: false,
        message: 'There is already an active quiz for this conversation'
      });
    }
    
    // Create new quiz
    const quiz = new Quiz({
      title,
      description,
      category: category || 'compatibility',
      conversation: conversationId,
      questions,
      user1: userId,
      user2: otherParticipantId,
      createdBy: userId
    });
    
    await quiz.save();
    
    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      quiz
    });
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create quiz',
      error: error.message
    });
  }
};

// @desc    Get all quizzes for a conversation
// @route   GET /api/quiz/conversations/:conversationId
// @access  Private
exports.getQuizzesByConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    
    // Check if user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found or you are not a participant'
      });
    }
    
    // Find quizzes for this conversation
    const quizzes = await Quiz.find({ conversation: conversationId })
      .select('-user1Answers -user2Answers') // Don't send answers in list view
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: quizzes.length,
      quizzes
    });
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve quizzes',
      error: error.message
    });
  }
};

// @desc    Get a specific quiz
// @route   GET /api/quiz/:quizId
// @access  Private
exports.getQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.user.id;
    
    // Find quiz
    const quiz = await Quiz.findById(quizId)
      .populate('user1', 'name profileImage')
      .populate('user2', 'name profileImage');
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }
    
    // Check if user is part of this quiz
    if (quiz.user1.toString() !== userId && quiz.user2.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this quiz'
      });
    }
    
    // Determine if user is user1 or user2
    const isUser1 = quiz.user1._id.toString() === userId;
    
    // Hide the other user's answers if quiz is not completed
    if (quiz.status !== 'completed') {
      if (isUser1) {
        quiz.user2Answers = [];
      } else {
        quiz.user1Answers = [];
      }
    }
    
    res.status(200).json({
      success: true,
      quiz,
      isUser1
    });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve quiz',
      error: error.message
    });
  }
};

// @desc    Submit answers to a quiz
// @route   POST /api/quiz/:quizId/answers
// @access  Private
exports.submitAnswers = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body;
    const userId = req.user.id;
    
    if (!Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide answers'
      });
    }
    
    // Find quiz
    const quiz = await Quiz.findById(quizId);
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }
    
    // Check if quiz is active
    if (quiz.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `Quiz is ${quiz.status}, cannot submit answers`
      });
    }
    
    // Check if user is part of this quiz
    const isUser1 = quiz.user1.toString() === userId;
    const isUser2 = quiz.user2.toString() === userId;
    
    if (!isUser1 && !isUser2) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to submit answers to this quiz'
      });
    }
    
    // Check if user has already submitted answers
    if ((isUser1 && quiz.user1Completed) || (isUser2 && quiz.user2Completed)) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted answers to this quiz'
      });
    }
    
    // Check if answers match question indices
    const validQuestionIndices = quiz.questions.map((_, index) => index);
    for (const answer of answers) {
      if (!validQuestionIndices.includes(answer.questionIndex)) {
        return res.status(400).json({
          success: false,
          message: `Invalid question index: ${answer.questionIndex}`
        });
      }
    }
    
    // Add answers
    if (isUser1) {
      quiz.user1Answers = answers;
      quiz.user1Completed = true;
      quiz.user1CompletedAt = new Date();
    } else {
      quiz.user2Answers = answers;
      quiz.user2Completed = true;
      quiz.user2CompletedAt = new Date();
    }
    
    // Check if both users have completed the quiz
    if (quiz.user1Completed && quiz.user2Completed) {
      quiz.status = 'completed';
      
      // Calculate compatibility
      const compatibilityScore = calculateCompatibility(quiz);
      quiz.compatibilityScore = compatibilityScore;
    }
    
    await quiz.save();
    
    res.status(200).json({
      success: true,
      message: 'Answers submitted successfully',
      quiz,
      isCompleted: quiz.status === 'completed'
    });
  } catch (error) {
    console.error('Submit answers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit answers',
      error: error.message
    });
  }
};

// @desc    Get active quiz for a conversation
// @route   GET /api/quiz/conversations/:conversationId/active
// @access  Private
exports.getActiveQuiz = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    
    // Check if user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId
    });
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found or you are not a participant'
      });
    }
    
    // Find active quiz for this conversation
    const quiz = await Quiz.findOne({
      conversation: conversationId,
      status: 'active'
    })
    .populate('user1', 'name profileImage')
    .populate('user2', 'name profileImage');
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'No active quiz found for this conversation'
      });
    }
    
    // Determine if user is user1 or user2
    const isUser1 = quiz.user1._id.toString() === userId;
    
    // Hide the other user's answers
    if (isUser1) {
      quiz.user2Answers = [];
    } else {
      quiz.user1Answers = [];
    }
    
    res.status(200).json({
      success: true,
      quiz,
      isUser1,
      hasSubmitted: isUser1 ? quiz.user1Completed : quiz.user2Completed
    });
  } catch (error) {
    console.error('Get active quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve active quiz',
      error: error.message
    });
  }
};

// Helper function to calculate compatibility
const calculateCompatibility = (quiz) => {
  try {
    // Get answers from both users
    const user1Answers = quiz.user1Answers;
    const user2Answers = quiz.user2Answers;
    
    // Calculate total possible score
    const maxPossibleDifference = quiz.questions.length * 4; // Assuming 5-point scale (0-4 difference)
    
    // Calculate actual difference
    let totalDifference = 0;
    
    quiz.questions.forEach((_, questionIndex) => {
      const user1Answer = user1Answers.find(a => a.questionIndex === questionIndex);
      const user2Answer = user2Answers.find(a => a.questionIndex === questionIndex);
      
      if (user1Answer && user2Answer) {
        const user1Value = parseInt(user1Answer.answer);
        const user2Value = parseInt(user2Answer.answer);
        
        if (!isNaN(user1Value) && !isNaN(user2Value)) {
          const difference = Math.abs(user1Value - user2Value);
          totalDifference += difference;
        }
      }
    });
    
    // Calculate compatibility (inverse of difference)
    // 0 difference = 100% compatibility
    // max difference = 0% compatibility
    const compatibilityScore = Math.round((1 - (totalDifference / maxPossibleDifference)) * 100);
    
    return Math.max(0, Math.min(100, compatibilityScore)); // Ensure between 0-100
  } catch (error) {
    console.error('Calculate compatibility error:', error);
    return 50; // Default to 50% if calculation fails
  }
}; 