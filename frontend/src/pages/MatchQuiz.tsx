import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, ArrowLeft } from 'lucide-react';
import { useQuiz } from '../context/QuizContext';

const MatchQuiz: React.FC = () => {
  const { partnerId } = useParams<{ partnerId: string }>();
  const navigate = useNavigate();
  const { 
    activeQuiz,
    startQuiz,
    answerQuestion,
    completeQuiz,
    cancelQuiz,
    timeRemaining 
  } = useQuiz();
  
  // Start quiz if not already started
  useEffect(() => {
    if (!activeQuiz && partnerId) {
      startQuiz(partnerId);
    }
  }, [activeQuiz, partnerId, startQuiz]);
  
  // Format time remaining as MM:SS
  const formatTimeRemaining = () => {
    if (timeRemaining === undefined) return "3:00";
    
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  // Handle quiz completion
  const handleCompleteQuiz = () => {
    if (!activeQuiz) return;
    completeQuiz();
    navigate('/results/latest');
  };
  
  // Handle quiz cancellation
  const handleCancelQuiz = () => {
    cancelQuiz();
    navigate('/discover');
  };
  
  // Handle selecting an answer
  const handleSelectAnswer = (questionId: string, answer: string) => {
    answerQuestion(questionId, answer);
  };
  
  if (!activeQuiz) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }
  
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-4 text-white flex justify-between items-center">
          <button 
            onClick={handleCancelQuiz}
            className="flex items-center text-white"
          >
            <ArrowLeft size={20} className="mr-1" />
            Cancel Quiz
          </button>
          <h2 className="text-xl font-bold">Compatibility Quiz</h2>
          <div className="flex items-center">
            <Clock size={20} className="mr-1" />
            <span>{formatTimeRemaining()}</span>
          </div>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <p className="text-gray-700 mb-1">
              Answer these questions to see your compatibility level with this match!
            </p>
            <p className="text-sm text-gray-500">
              You have 3 minutes to complete the quiz.
            </p>
          </div>
          
          <div className="space-y-8">
            {activeQuiz.questions.map((question, index) => {
              // Check if question is already answered
              const isSelected = activeQuiz.answers.some(
                a => a.questionId === question.id
              );
              const selectedAnswer = activeQuiz.answers.find(
                a => a.questionId === question.id
              )?.answer;
              
              return (
                <div key={question.id} className="border-b border-gray-200 pb-6 last:border-0">
                  <h3 className="font-semibold mb-4">
                    Question {index + 1}: {question.question}
                  </h3>
                  
                  <div className="space-y-3">
                    {question.options.map(option => (
                      <div 
                        key={option}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedAnswer === option 
                            ? 'border-purple-500 bg-purple-50' 
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                        onClick={() => handleSelectAnswer(question.id, option)}
                      >
                        {option}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleCompleteQuiz}
              className={`px-6 py-2 rounded-lg ${
                activeQuiz.answers.length < activeQuiz.questions.length
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
              disabled={activeQuiz.answers.length < activeQuiz.questions.length}
            >
              Complete Quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchQuiz; 