import React from 'react';
import { Heart, MessageCircle, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-around items-center py-4">
          <button
            onClick={() => navigate('/discover')}
            className="flex flex-col items-center text-pink-500 hover:text-pink-400 transition-colors"
          >
            <Heart size={24} />
            <span className="text-xs mt-1">Discover</span>
          </button>
          
          <button
            onClick={() => navigate('/messages')}
            className="flex flex-col items-center text-gray-400 hover:text-white transition-colors"
          >
            <MessageCircle size={24} />
            <span className="text-xs mt-1">Messages</span>
          </button>
          
          <button
            onClick={() => navigate('/profile')}
            className="flex flex-col items-center text-gray-400 hover:text-white transition-colors"
          >
            <User size={24} />
            <span className="text-xs mt-1">Profile</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;