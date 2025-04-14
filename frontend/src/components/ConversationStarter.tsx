import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, MessageSquare, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConversationStarterProps {
  onSelect?: (topic: string) => void;
}

const ConversationStarter: React.FC<ConversationStarterProps> = ({ onSelect }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const conversationStarters = [
    "Hey, I noticed we share an interest in music. What artists are you currently listening to?",
    "I see you're studying Computer Science. What made you choose that field?",
    "I love your profile photo! Where was that taken?",
    "What's your favorite spot on campus to hang out?",
    "Have you tried any of the new restaurants near campus?",
    "What are you most looking forward to this semester?",
    "If you could travel anywhere right now, where would you go?",
    "What's your favorite class you've taken so far?",
    "Any recommendations for good study spots around campus?",
    "What do you like to do on weekends?",
    "Have you been to any good events on campus lately?",
    "What's one thing you want to accomplish before graduating?",
    "Coffee or tea? And what's your go-to cafe around here?",
    "Are you part of any clubs or organizations on campus?",
    "What made you join Campus Connection?"
  ];
  
  const handlePrevious = () => {
    setCurrentIndex(prev => 
      prev === 0 ? conversationStarters.length - 1 : prev - 1
    );
  };
  
  const handleNext = () => {
    setCurrentIndex(prev => 
      prev === conversationStarters.length - 1 ? 0 : prev + 1
    );
  };
  
  const handleSelect = () => {
    if (onSelect) {
      onSelect(conversationStarters[currentIndex]);
    }
  };
  
  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-xl shadow-sm border border-purple-100/50">
      <div className="flex items-center mb-3">
        <MessageSquare className="text-purple-500 mr-2" size={18} />
        <h3 className="text-sm font-semibold text-purple-800">Conversation Starters</h3>
      </div>
      
      <div className="relative min-h-[80px] flex items-center">
        <button 
          onClick={handlePrevious}
          className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-purple-500 hover:text-purple-700 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentIndex}
            className="text-center px-10 text-gray-700"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {conversationStarters[currentIndex]}
          </motion.div>
        </AnimatePresence>
        
        <button 
          onClick={handleNext}
          className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-purple-500 hover:text-purple-700 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      
      {onSelect && (
        <motion.button
          onClick={handleSelect}
          className="mt-4 flex items-center justify-center w-full p-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90 transition-opacity"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Send size={16} className="mr-2" />
          <span>Use this starter</span>
        </motion.button>
      )}
      
      <div className="flex justify-center mt-3">
        {conversationStarters.map((_, index) => (
          <div 
            key={index}
            className={`w-1.5 h-1.5 rounded-full mx-0.5 ${
              index === currentIndex 
                ? 'bg-purple-500' 
                : 'bg-purple-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ConversationStarter;