import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageSquare } from 'lucide-react';

interface ChatNotificationProps {
  conversationId: string;
  message: {
    content: string;
    senderId: string;
    timestamp: string;
  };
  senderName: string;
  senderAvatar: string;
}

const ChatNotification: React.FC<ChatNotificationProps> = ({
  conversationId,
  message,
  senderName,
  senderAvatar
}) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  
  // Auto-dismiss after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleClick = () => {
    navigate(`/messages/${conversationId}`);
    setIsVisible(false);
  };
  
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsVisible(false);
  };
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: "50%" }}
          animate={{ opacity: 1, y: 0, x: "50%" }}
          exit={{ opacity: 0, y: -50, x: "50%" }}
          className="fixed top-5 right-1/2 transform translate-x-1/2 z-50 max-w-sm w-full"
          onClick={handleClick}
        >
          <div className="bg-white rounded-lg shadow-lg border border-purple-100 p-4 cursor-pointer">
            <div className="flex items-center">
              <div className="relative flex-shrink-0">
                <img 
                  src={senderAvatar} 
                  alt={senderName} 
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center text-white text-xs">
                  <MessageSquare size={12} />
                </div>
              </div>
              <div className="ml-3 flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-semibold text-gray-800">{senderName}</h4>
                  <button 
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mt-1">{message.content}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatNotification; 