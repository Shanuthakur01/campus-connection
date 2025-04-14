import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, MapPin, GraduationCap, UserCheck, X, ThumbsUp, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMatch } from '../context/MatchContext';
import { useMessage } from '../context/MessageContext';
import { motion, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import { toast } from 'react-toastify';
import MatchAnimation from './MatchAnimation';

// Define a simple Badge component instead of importing it
const Badge = ({ 
  className = "", 
  children, 
  variant = "default" 
}: { 
  className?: string; 
  children: React.ReactNode; 
  variant?: "default" | "primary" | "secondary" | "success" | "warning" | "danger"; 
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case "primary":
        return "bg-blue-100 text-blue-800";
      case "secondary":
        return "bg-purple-100 text-purple-800";
      case "success":
        return "bg-green-100 text-green-800";
      case "warning":
        return "bg-yellow-100 text-yellow-800";
      case "danger":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVariantClasses()} ${className}`}>
      {children}
    </span>
  );
};

interface Profile {
  id: number;
  name: string;
  age: number;
  college: string;
  bio: string;
  interests: string[];
  image: string;
  location: string;
}

interface SwipeCardProps {
  profile: Profile;
  onSwipe: (direction: 'left' | 'right') => void;
  isActive: boolean;
}

const SwipeCard: React.FC<SwipeCardProps> = ({ profile, onSwipe, isActive }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { likeProfile, getMatchByProfileId, checkMutualMatch, calculateCompatibility } = useMatch();
  const { getOrCreateConversation } = useMessage();
  
  const [liked, setLiked] = useState(!!getMatchByProfileId(profile.id));
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [showMatchAnimation, setShowMatchAnimation] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showMessageOption, setShowMessageOption] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [heartPosition, setHeartPosition] = useState({ x: 0, y: 0 });
  const [cardDirection, setCardDirection] = useState<'left' | 'right' | null>(null);
  
  const isMutualMatch = checkMutualMatch(profile.id);
  const compatibility = isAuthenticated ? calculateCompatibility(profile.id) : 0;

  // Motion values for swipe functionality
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
  const scale = useTransform(
    x, 
    [-300, -150, 0, 150, 300], 
    [0.8, 0.9, 1, 0.9, 0.8]
  );
  const opacity = useTransform(
    x, 
    [-300, -150, 0, 150, 300], 
    [0.5, 0.9, 1, 0.9, 0.5]
  );
  
  // 3D tilt effect
  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);
  
  // Like/Nope indicators
  const likeOpacity = useTransform(x, [0, 100, 200], [0, 0.8, 1]);
  const nopeOpacity = useTransform(x, [-200, -100, 0], [1, 0.8, 0]);

  // Update showMessageOption based on liked status or mutual match
  useEffect(() => {
    setShowMessageOption(liked || isMutualMatch);
  }, [liked, isMutualMatch]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 120) {
      if (info.offset.x > 0) {
        // Swiped right = like
        setCardDirection('right');
        handleLike();
        onSwipe('right');
      } else {
        // Swiped left = nope
        setCardDirection('left');
        onSwipe('left');
      }
      
      // Reset direction after animation completes
      setTimeout(() => {
        setCardDirection(null);
      }, 300);
    }
  };

  const handleLike = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/discover' } });
      return;
    }
    
    if (!liked) {
      // Set heart burst animation position at center of card
      setHeartPosition({ 
        x: window.innerWidth / 2, 
        y: window.innerHeight / 2 - 100 
      });
      setShowHeartBurst(true);
      
      // Hide the heart burst after animation completes
      setTimeout(() => {
        setShowHeartBurst(false);
      }, 800);
      
      likeProfile(profile.id, (matchId) => {
        // Create conversation on match
        const conversationId = getOrCreateConversation(profile.id.toString());
        
        // Show match animation if it's a mutual match
        if (isMutualMatch) {
          setShowMatchAnimation(true);
        } else {
          // Otherwise just show notification
          const message = `You liked ${profile.name}'s profile!`;
          setNotificationMessage(message);
          setShowNotification(true);
          toast.success(message);
          
          // Hide notification after 3 seconds
          setTimeout(() => {
            setShowNotification(false);
          }, 3000);
        }
      });
      
      setShowMessageOption(true);
    }
    
    setLiked(true);
  };

  const handleMessageClick = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/messages' } });
      return;
    }
    
    // Create or get conversation
    const conversationId = getOrCreateConversation(profile.id.toString());
    navigate(`/messages/${conversationId}`);
  };
  
  const handleCloseMatchAnimation = () => {
    setShowMatchAnimation(false);
  };
  
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <>
      <motion.div 
        className="absolute w-full h-full bg-black rounded-2xl overflow-hidden swipe-card shadow-xl border border-gray-800"
        style={{ 
          x, 
          y, 
          rotate, 
          opacity,
          rotateX,
          rotateY,
          scale,
          zIndex: 100,
          transformStyle: "preserve-3d",
        }}
        drag={isActive ? "x" : false}
        dragConstraints={{ top: 0, right: 0, bottom: 0, left: 0 }}
        dragElastic={0.9}
        onDragEnd={handleDragEnd}
        animate={{ 
          scale: 1,
          opacity: 1,
          rotateY: cardDirection === 'left' ? -15 : cardDirection === 'right' ? 15 : 0,
        }}
        initial={{ scale: 0.9, opacity: 0 }}
        whileTap={{ scale: 1.02 }}
        onClick={toggleExpanded}
        transition={{ type: "spring", damping: 30 }}
      >
        {/* Full height image */}
        <div className="w-full h-full relative bg-gray-900">
          <img 
            src={profile.image} 
            alt={profile.name} 
            className="w-full h-full object-cover"
            loading="eager"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80";
            }}
          />
          
          {/* Gradient overlay for text visibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80 pointer-events-none"></div>
          
          {/* Recently Active indicator */}
          <div className="absolute top-6 left-6 flex items-center bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-white text-sm font-medium">Recently Active</span>
          </div>
          
          {/* User info overlay at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h2 className="text-3xl font-bold mb-2 flex items-center">
              {profile.name} <span className="ml-2">{profile.age}</span>
              {isMutualMatch && (
                <Badge className="ml-2 bg-pink-500 text-white" variant="default">
                  <Heart size={12} className="mr-1" /> Match
                </Badge>
              )}
            </h2>
            
            <div className="flex items-center mb-3">
              <MapPin size={18} className="mr-1.5 text-pink-400" />
              <span className="font-medium">3 kilometers away</span>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {profile.interests.slice(0, 3).map((interest, i) => (
                <span 
                  key={i} 
                  className="bg-white/20 backdrop-blur-sm text-white text-sm rounded-full px-3 py-1.5"
                >
                  {interest}
                </span>
              ))}
              {profile.interests.length > 3 && (
                <span className="bg-white/20 backdrop-blur-sm text-white text-sm rounded-full px-3 py-1.5">
                  +{profile.interests.length - 3} more
                </span>
              )}
            </div>
          </div>
          
          {/* Action buttons */}
          {isActive && (
            <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center space-x-5 z-20">
              <button
                className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  onSwipe('left');
                }}
              >
                <X size={24} className="text-red-500" />
              </button>
              
              <button
                className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike();
                }}
              >
                <Heart size={30} className="text-white" />
              </button>
              
              {showMessageOption && (
                <button
                  className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMessageClick();
                  }}
                >
                  <MessageCircle size={24} className="text-blue-500" />
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Like/Nope indicators */}
        <motion.div 
          className="absolute top-1/4 right-6 z-20 transform rotate-12"
          style={{ opacity: likeOpacity }}
        >
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xl font-bold py-2 px-6 rounded-lg border-2 border-white shadow-lg backdrop-blur-sm">
            LIKE
          </div>
        </motion.div>
        
        <motion.div 
          className="absolute top-1/4 left-6 z-20 transform -rotate-12"
          style={{ opacity: nopeOpacity }}
        >
          <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xl font-bold py-2 px-6 rounded-lg border-2 border-white shadow-lg backdrop-blur-sm">
            NOPE
          </div>
        </motion.div>
        
        {/* 3D particle effects for swipe animation */}
        {cardDirection && (
          <div className="absolute inset-0 pointer-events-none z-40">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className={`absolute rounded-full 
                  ${cardDirection === 'right' ? 'bg-green-500' : 'bg-red-500'}`}
                style={{
                  width: Math.random() * 8 + 3,
                  height: Math.random() * 8 + 3,
                  top: `${Math.random() * 100}%`,
                  left: `${cardDirection === 'right' ? Math.random() * 30 + 70 : Math.random() * 30}%`,
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0, 0.8, 0],
                  scale: [0, 1, 0.5],
                  x: cardDirection === 'right' ? [0, 100] : [0, -100],
                  y: [0, Math.random() * 100 - 50],
                }}
                transition={{ duration: 0.6 }}
              />
            ))}
          </div>
        )}
      </motion.div>
      
      {/* Heart burst animation */}
      {showHeartBurst && (
        <motion.div 
          className="fixed z-50 pointer-events-none" 
          style={{ 
            top: heartPosition.y, 
            left: heartPosition.x, 
            translateX: "-50%", 
            translateY: "-50%" 
          }}
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.5, 0] }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div className="relative">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-pink-500"
                style={{
                  width: 10 + Math.random() * 10,
                  height: 10 + Math.random() * 10,
                  left: "50%",
                  top: "50%",
                  translateX: "-50%",
                  translateY: "-50%",
                }}
                animate={{
                  x: Math.cos(i * 30 * (Math.PI / 180)) * 100,
                  y: Math.sin(i * 30 * (Math.PI / 180)) * 100,
                  opacity: [1, 0],
                  scale: [1, 0],
                }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            ))}
            <motion.div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              animate={{ scale: [0, 2, 0], opacity: [1, 0] }}
              transition={{ duration: 0.8 }}
            >
              <Heart size={40} className="text-pink-500 fill-pink-500" />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
      
      {/* Match animation */}
      {showMatchAnimation && <MatchAnimation profile={profile} onClose={handleCloseMatchAnimation} />}
    </>
  );
};

export default SwipeCard; 