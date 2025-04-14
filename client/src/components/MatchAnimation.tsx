import React, { useEffect, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useMessage } from '../context/MessageContext';
import confetti from 'canvas-confetti';

interface MatchAnimationProps {
  profile: {
    id: number;
    name: string;
    image: string;
  };
  onClose: () => void;
}

const MatchAnimation: React.FC<MatchAnimationProps> = ({ profile, onClose }) => {
  const navigate = useNavigate();
  const { getOrCreateConversation } = useMessage();
  const [showConfetti, setShowConfetti] = useState(false);
  
  useEffect(() => {
    // Trigger confetti effect
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    
    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };
    
    const triggerConfetti = () => {
      const timeLeft = animationEnd - Date.now();
      
      if (timeLeft <= 0) {
        return;
      }
      
      const particleCount = 50 * (timeLeft / duration);
      
      // Launch confetti from both sides
      confetti({
        particleCount: Math.floor(randomInRange(particleCount / 2, particleCount)),
        angle: randomInRange(55, 125),
        spread: randomInRange(50, 70),
        origin: { x: 0 },
        colors: ['#9C27B0', '#E91E63', '#F44336', '#FF9800', '#FFEB3B']
      });
      
      confetti({
        particleCount: Math.floor(randomInRange(particleCount / 2, particleCount)),
        angle: randomInRange(55, 125),
        spread: randomInRange(50, 70),
        origin: { x: 1 },
        colors: ['#9C27B0', '#E91E63', '#F44336', '#FF9800', '#FFEB3B']
      });
      
      requestAnimationFrame(triggerConfetti);
    };
    
    setShowConfetti(true);
    triggerConfetti();
    
    // Cleanup
    return () => {
      setShowConfetti(false);
      confetti.reset();
    };
  }, []);
  
  const handleMessageClick = () => {
    const conversationId = getOrCreateConversation(profile.id.toString());
    navigate(`/messages/${conversationId}`);
    onClose();
  };
  
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { 
        duration: 0.5,
        type: "spring",
        bounce: 0.4
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      transition: { duration: 0.3 }
    }
  };
  
  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: custom * 0.2 + 0.5,
        duration: 0.5,
        type: "spring"
      }
    })
  };
  
  const buttonVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        delay: 1.3,
        duration: 0.5,
        type: "spring",
        bounce: 0.6
      }
    },
    hover: {
      scale: 1.05,
      boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)",
      transition: { duration: 0.3 }
    },
    tap: { scale: 0.95 }
  };
  
  const imageContainerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.3,
        duration: 0.5,
        type: "spring"
      }
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        className="relative bg-white rounded-2xl overflow-hidden shadow-2xl p-6 max-w-lg w-full mx-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <X size={20} className="text-gray-500" />
        </button>
        
        <motion.div
          className="text-center mb-6"
          variants={textVariants}
          custom={0}
          initial="hidden"
          animate="visible"
        >
          <h2 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
            It's a Match!
          </h2>
          <p className="text-gray-600">
            You and {profile.name} liked each other.
          </p>
        </motion.div>
        
        <motion.div 
          className="flex justify-center items-center gap-4 mb-8"
          variants={imageContainerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80" 
                alt="Your profile" 
                className="w-full h-full object-cover"
              />
            </div>
            <motion.div 
              className="absolute -bottom-2 -right-2 bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
              initial={{ scale: 0 }}
              animate={{ 
                scale: [0, 1.2, 1],
                rotate: [0, 15, 0]
              }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              ❤️
            </motion.div>
          </div>
          
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden">
              <img 
                src={profile.image} 
                alt={profile.name} 
                className="w-full h-full object-cover"
              />
            </div>
            <motion.div 
              className="absolute -bottom-2 -left-2 bg-pink-600 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg"
              initial={{ scale: 0 }}
              animate={{ 
                scale: [0, 1.2, 1],
                rotate: [0, -15, 0] 
              }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              ❤️
            </motion.div>
          </div>
        </motion.div>
        
        <motion.div
          className="text-center mb-8"
          variants={textVariants}
          custom={1}
          initial="hidden"
          animate="visible"
        >
          <p className="text-gray-700">
            Start a conversation now and see where it leads!
          </p>
        </motion.div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <motion.button
            onClick={onClose}
            className="flex-1 py-3 px-6 border border-gray-300 rounded-xl font-medium text-gray-700"
            variants={buttonVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            whileTap="tap"
          >
            Keep Swiping
          </motion.button>
          
          <motion.button
            onClick={handleMessageClick}
            className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl font-medium text-white flex items-center justify-center"
            variants={buttonVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
            whileTap="tap"
          >
            <MessageCircle size={18} className="mr-2" />
            Send Message
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default MatchAnimation; 