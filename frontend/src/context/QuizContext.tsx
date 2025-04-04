import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';

// Quiz types
interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
}

interface QuizAnswer {
  questionId: string;
  answer: string;
}

interface ActiveQuiz {
  id: string;
  partnerId: string;
  questions: QuizQuestion[];
  answers: QuizAnswer[];
  startTime: string;
}

interface QuizResult {
  id: string;
  quizId: string;
  userId: string;
  partnerId: string;
  compatibilityScore: number;
  completedAt: string;
  answers: QuizAnswer[];
}

interface QuizContextType {
  activeQuiz: ActiveQuiz | null;
  quizResults: QuizResult[];
  startQuiz: (partnerId: string) => void;
  answerQuestion: (questionId: string, answer: string) => void;
  completeQuiz: () => void;
  cancelQuiz: () => void;
  getQuizResult: (resultId: string) => QuizResult | null;
  getLatestResult: () => QuizResult | null;
  timeRemaining: number | undefined;
}

// Create quiz questions
const createQuizQuestions = (): QuizQuestion[] => {
  return [
    {
      id: uuidv4(),
      question: "What's your ideal weekend activity?",
      options: [
        "Netflix and chill at home",
        "Outdoor adventure like hiking or biking",
        "Exploring new restaurants or cafes",
        "Attending concerts or cultural events"
      ]
    },
    {
      id: uuidv4(),
      question: "Which quality do you value most in a relationship?",
      options: [
        "Honest communication",
        "Shared interests and activities",
        "Independence and personal space",
        "Emotional support and understanding"
      ]
    },
    {
      id: uuidv4(),
      question: "How would you describe your social energy?",
      options: [
        "Very outgoing and love big gatherings",
        "Enjoy socializing but need alone time to recharge",
        "Prefer small groups of close friends",
        "Mostly introverted and value one-on-one interactions"
      ]
    },
    {
      id: uuidv4(),
      question: "What's your approach to trying new things?",
      options: [
        "Love spontaneity and jumping into new experiences",
        "Like planning and researching before trying something new",
        "Prefer sticking to what I know and enjoy",
        "Occasionally try new things if friends recommend them"
      ]
    },
    {
      id: uuidv4(),
      question: "How do you handle disagreements?",
      options: [
        "Address issues immediately and directly",
        "Take time to process before discussing calmly",
        "Try to find a compromise that works for everyone",
        "Sometimes avoid conflict to keep the peace"
      ]
    }
  ];
};

// Create context
const QuizContext = createContext<QuizContextType | undefined>(undefined);

// Provider
export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeQuiz, setActiveQuiz] = useState<ActiveQuiz | null>(null);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number | undefined>(undefined);
  
  // Load quiz results from localStorage on mount
  useEffect(() => {
    if (user) {
      const storedResults = localStorage.getItem(`quiz_results_${user.id}`);
      if (storedResults) {
        setQuizResults(JSON.parse(storedResults));
      }
    }
  }, [user]);
  
  // Save quiz results to localStorage when they change
  useEffect(() => {
    if (user) {
      localStorage.setItem(`quiz_results_${user.id}`, JSON.stringify(quizResults));
    }
  }, [quizResults, user]);
  
  // Timer for quiz
  useEffect(() => {
    if (!activeQuiz) {
      setTimeRemaining(undefined);
      return;
    }
    
    // Set initial time (3 minutes)
    const quizDuration = 3 * 60; // 3 minutes in seconds
    const startTime = new Date(activeQuiz.startTime).getTime();
    const endTime = startTime + (quizDuration * 1000);
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        // Time's up - automatically complete quiz
        completeQuiz();
      }
    };
    
    // Update timer immediately
    updateTimer();
    
    // Update timer every second
    const timer = setInterval(updateTimer, 1000);
    
    return () => clearInterval(timer);
  }, [activeQuiz]);
  
  // Start a new quiz
  const startQuiz = (partnerId: string) => {
    if (!user) return;
    
    // Cancel any active quiz
    if (activeQuiz) {
      cancelQuiz();
    }
    
    // Create a new quiz
    const newQuiz: ActiveQuiz = {
      id: uuidv4(),
      partnerId,
      questions: createQuizQuestions(),
      answers: [],
      startTime: new Date().toISOString()
    };
    
    setActiveQuiz(newQuiz);
  };
  
  // Answer a question
  const answerQuestion = (questionId: string, answer: string) => {
    if (!activeQuiz) return;
    
    // Check if question is already answered
    const existingAnswerIndex = activeQuiz.answers.findIndex(a => a.questionId === questionId);
    
    if (existingAnswerIndex !== -1) {
      // Update existing answer
      const updatedAnswers = [...activeQuiz.answers];
      updatedAnswers[existingAnswerIndex] = { questionId, answer };
      
      setActiveQuiz({
        ...activeQuiz,
        answers: updatedAnswers
      });
    } else {
      // Add new answer
      setActiveQuiz({
        ...activeQuiz,
        answers: [...activeQuiz.answers, { questionId, answer }]
      });
    }
  };
  
  // Complete quiz and generate results
  const completeQuiz = () => {
    if (!activeQuiz || !user) return;
    
    // Calculate compatibility score
    const scorePerQuestion = 20; // 5 questions, 20 points each = 100 max
    const answeredQuestions = activeQuiz.answers.length;
    
    // Base score is the percentage of questions answered
    let baseScore = Math.round((answeredQuestions / activeQuiz.questions.length) * 100);
    
    // Add random factor for demo purposes (±15%)
    const randomFactor = Math.floor(Math.random() * 31) - 15;
    
    // Calculate final score (between 65-95 for demo purposes)
    const finalScore = Math.min(95, Math.max(65, baseScore + randomFactor));
    
    // Create quiz result
    const newResult: QuizResult = {
      id: uuidv4(),
      quizId: activeQuiz.id,
      userId: user.id,
      partnerId: activeQuiz.partnerId,
      compatibilityScore: finalScore,
      completedAt: new Date().toISOString(),
      answers: activeQuiz.answers
    };
    
    // Add to results
    setQuizResults(prev => [newResult, ...prev]);
    
    // Reset active quiz
    setActiveQuiz(null);
  };
  
  // Cancel quiz
  const cancelQuiz = () => {
    setActiveQuiz(null);
  };
  
  // Get a specific quiz result
  const getQuizResult = (resultId: string): QuizResult | null => {
    return quizResults.find(result => result.id === resultId) || null;
  };
  
  // Get the latest quiz result
  const getLatestResult = (): QuizResult | null => {
    return quizResults.length > 0 ? quizResults[0] : null;
  };
  
  return (
    <QuizContext.Provider
      value={{
        activeQuiz,
        quizResults,
        startQuiz,
        answerQuestion,
        completeQuiz,
        cancelQuiz,
        getQuizResult,
        getLatestResult,
        timeRemaining
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};

// Hook for using the quiz context
export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};