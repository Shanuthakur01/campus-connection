import React, { useState } from 'react';
import { Heart, MessageCircle, MapPin, GraduationCap, ThumbsUp, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMatch } from '../context/MatchContext';
import { useMessage } from '../context/MessageContext';
import { toast } from 'react-toastify';

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

interface ProfileCardProps {
  profile: Profile;
  compatibility?: number;
  showCompatibility?: boolean;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, compatibility = 0, showCompatibility = false }) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { likeProfile, getMatchByProfileId, checkMutualMatch } = useMatch();
  const { getOrCreateConversation } = useMessage();
  
  const [liked, setLiked] = useState(!!getMatchByProfileId(profile.id));
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  
  const isMutualMatch = checkMutualMatch(profile.id);

  const handleMessageClick = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/messages' } });
      return;
    }
    
    if (!liked && !isMutualMatch) {
      toast.info("Like this profile to start chatting!");
      return;
    }
    
    // Create or get conversation
    const conversationId = getOrCreateConversation(profile.id.toString());
    navigate(`/messages/${conversationId}`);
  };

  const handleLikeClick = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/discover' } });
      return;
    }
    
    // Toggle like status
    if (!liked) {
      likeProfile(profile.id, (matchId) => {
        // Create conversation on match
        const conversationId = getOrCreateConversation(profile.id.toString());
        
        // Show notification
        const message = isMutualMatch 
          ? `It's a match! You and ${profile.name} liked each other!`
          : `You liked ${profile.name}'s profile!`;
        
        setNotificationMessage(message);
        setShowNotification(true);
        toast.success(message);
        
        // Hide notification after 3 seconds
        setTimeout(() => {
          setShowNotification(false);
        }, 3000);
      });
    }
    
    setLiked(!liked);
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-[1.02] relative">
      {showNotification && (
        <div className="absolute top-2 right-2 bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm z-10 animate-pulse">
          {notificationMessage}
        </div>
      )}
      
      {isMutualMatch && (
        <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-sm z-10 flex items-center">
          <UserCheck size={14} className="mr-1" />
          Mutual Match
        </div>
      )}
      
      {showCompatibility && compatibility > 0 && (
        <div className="absolute top-2 left-2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm z-10">
          {compatibility}% Match
        </div>
      )}
      
      <div className="h-64 overflow-hidden">
        <img 
          src={profile.image} 
          alt={profile.name} 
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-bold">{profile.name}, {profile.age}</h3>
          <div className="flex space-x-2">
            <button 
              className={`p-2 rounded-full ${
                isMutualMatch || liked
                  ? 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              } transition-colors`}
              onClick={handleMessageClick}
              title={
                isMutualMatch || liked
                  ? "Send message"
                  : "Like profile to chat"
              }
              disabled={!isMutualMatch && !liked}
            >
              <MessageCircle size={20} />
            </button>
            <button 
              className={`p-2 rounded-full ${liked ? 'bg-pink-500 text-white' : 'bg-pink-100 text-pink-600'} hover:bg-pink-200 transition-colors`}
              onClick={handleLikeClick}
              title={liked ? "Unlike profile" : "Like profile"}
            >
              {liked ? <ThumbsUp size={20} /> : <Heart size={20} />}
            </button>
          </div>
        </div>
        
        <div className="flex items-center text-gray-600 mb-2">
          <GraduationCap size={16} className="mr-1" />
          <span className="text-sm">{profile.college}</span>
        </div>
        
        <div className="flex items-center text-gray-600 mb-3">
          <MapPin size={16} className="mr-1" />
          <span className="text-sm">{profile.location}</span>
        </div>
        
        <p className="text-gray-700 mb-3 line-clamp-2">{profile.bio}</p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {profile.interests.slice(0, 3).map((interest, index) => (
            <span 
              key={index} 
              className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs"
            >
              {interest}
            </span>
          ))}
          {profile.interests.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
              +{profile.interests.length - 3} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;