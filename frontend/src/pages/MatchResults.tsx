import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, ArrowLeft, Share2, Trophy, ChevronRight } from 'lucide-react';
import { useQuiz } from '../context/QuizContext';
import { useMessage } from '../context/MessageContext';
import { profiles } from '../data/profiles';
import { motion } from 'framer-motion';

const MatchResults: React.FC = () => {
  const { resultId } = useParams<{ resultId: string }>();
  const navigate = useNavigate();
  const { quizResults, getQuizResult, getLatestResult } = useQuiz();
  const { getOrCreateConversation } = useMessage();
  const [animateScore, setAnimateScore] = useState(false);
  
  // Get the result based on resultId or latest
  const result = resultId === 'latest' 
    ? getLatestResult() 
    : resultId 
      ? getQuizResult(resultId) 
      : null;
  
  // Get the partner profile
  const partnerProfile = result 
    ? profiles.find(p => p.id.toString() === result.partnerId)
    : null;
  
  // Start animation after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateScore(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Handle sending a message
  const handleMessageClick = () => {
    if (!result) return;
    
    const conversationId = getOrCreateConversation(result.partnerId);
    navigate(`/messages/${conversationId}`);
  };
  
  // Handle sharing results (simulated)
  const handleShare = () => {
    alert("Sharing feature would be implemented here in a real app!");
  };
  
  // Handle navigating to matches page
  const handleContinue = () => {
    navigate('/discover');
  };
  
  if (!result || !partnerProfile) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No results found</p>
        <button
          onClick={() => navigate('/discover')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg"
        >
          Back to Discover
        </button>
        </div>
      </div>
    );
  }
  
  // Format percentage for display
  const formatPercentage = (value: number) => {
    return `${value}%`;
  };
  
  // Determine compatibility level based on score
  const getCompatibilityLevel = (score: number) => {
    if (score >= 90) return "Extraordinary Match!";
    if (score >= 80) return "Exceptional Match!";
    if (score >= 70) return "Great Match!";
    if (score >= 60) return "Good Match";
    return "Potential Match";
  };
  
  // Get matching advice based on score
  const getMatchingAdvice = (score: number) => {
    if (score >= 80) {
      return "You two have incredible compatibility! This is a rare connection - don't let it slip away.";
    }
    if (score >= 70) {
      return "You have strong compatibility! Your shared interests and values could make for a meaningful connection.";
    }
    if (score >= 60) {
      return "You have good compatibility. You might need to work a bit on your differences, but there's definitely potential.";
    }
    return "While you have some compatibility, you might need to explore your differences more to see if this connection will work for you.";
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
          <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-purple-600 mb-6"
          >
            <ArrowLeft size={20} className="mr-1" />
            Back
          </button>
      
      <motion.div 
        className="bg-white rounded-xl shadow-lg overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-6 text-white">
          <h1 className="text-2xl font-bold text-center">Compatibility Results</h1>
        </div>
        
        {/* Result Content */}
        <div className="p-6">
          {/* Profile Section */}
          <div className="flex flex-col md:flex-row items-center justify-center mb-8">
            <motion.div 
              className="relative"
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <img 
                  src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80" 
                  alt="Your profile" 
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>
            
            <motion.div
              className="mx-4 my-4 md:my-0 flex items-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center">
                <Heart className="text-pink-500" size={24} />
              </div>
            </motion.div>
            
            <motion.div 
              className="relative"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
            <img 
              src={partnerProfile.image} 
              alt={partnerProfile.name} 
                  className="w-full h-full object-cover"
            />
            </div>
            </motion.div>
          </div>
          
          {/* Compatibility Score */}
          <div className="text-center mb-8">
            <p className="text-gray-600 mb-2">Your compatibility with {partnerProfile.name} is</p>
            <div className="flex justify-center items-center">
              <motion.div
                className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                {animateScore ? (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
                  >
                    {formatPercentage(result.compatibilityScore)}
                  </motion.span>
                ) : (
                  <span>---</span>
                )}
              </motion.div>
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.5 }}
              >
                <Trophy className="ml-2 text-yellow-500" size={32} />
              </motion.div>
            </div>
            <motion.p 
              className="font-medium text-lg mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              {getCompatibilityLevel(result.compatibilityScore)}
            </motion.p>
          </div>
          
          {/* Compatibility Description */}
          <motion.div 
            className="bg-purple-50 p-4 rounded-lg mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.5 }}
          >
            <h3 className="font-semibold mb-2 text-purple-800">What this means</h3>
            <p className="text-gray-700">
              {getMatchingAdvice(result.compatibilityScore)}
            </p>
          </motion.div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <motion.button
              onClick={handleMessageClick}
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg font-medium flex items-center justify-center"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5, duration: 0.4 }}
            >
              <MessageCircle size={18} className="mr-2" />
              Message {partnerProfile.name}
            </motion.button>
            
            <motion.button
              onClick={handleShare}
              className="flex-1 py-3 border border-purple-300 text-purple-700 rounded-lg font-medium flex items-center justify-center"
              whileHover={{ scale: 1.03, backgroundColor: "rgba(147, 51, 234, 0.05)" }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6, duration: 0.4 }}
            >
              <Share2 size={18} className="mr-2" />
              Share Results
            </motion.button>
          </div>
        </div>
        
        {/* Continue Button */}
        <motion.div
          className="p-4 border-t border-gray-200 bg-gray-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.4 }}
        >
          <button
            onClick={handleContinue}
            className="w-full py-3 text-gray-700 hover:text-purple-700 transition-colors flex items-center justify-center font-medium"
          >
            Continue Exploring
            <ChevronRight size={18} className="ml-1" />
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default MatchResults; 