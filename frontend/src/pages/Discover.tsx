import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, X, Shuffle, Sparkles, ChevronDown, ChevronUp, Loader, User, LogOut, Heart } from 'lucide-react';
import SwipeCard from '../components/SwipeCard';
import { profiles } from '../data/profiles';
import { useAuth } from '../context/AuthContext';
import { useMatch } from '../context/MatchContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { toast } from 'react-toastify';

// Keep background effects minimal
const BackgroundEffects = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden opacity-30">
      {[...Array(3)].map((_, i) => (
        <div 
          key={i}
          className="absolute rounded-full blur-xl bg-gradient-to-tr from-purple-300/20 to-pink-300/20"
          style={{
            width: 20 + Math.random() * 80,
            height: 20 + Math.random() * 80,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`
          }}
        />
      ))}
    </div>
  );
};

// Custom navbar for Discover page
const DiscoverNavbar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  
  return (
    <div className="bg-black/80 backdrop-blur-md py-3 px-4 flex items-center justify-between sticky top-0 z-50 border-b border-white/10">
      <div className="flex items-center">
        <Heart className="text-pink-500 mr-2" />
        <h1 className="text-white text-xl font-bold">Campus Connect</h1>
      </div>
      
      <div className="flex items-center space-x-3">
        <button 
          onClick={() => navigate('/profile')}
          className="p-2 rounded-full hover:bg-gray-800 transition-colors"
        >
          <User size={20} className="text-white" />
        </button>
        <button 
          onClick={logout}
          className="p-2 rounded-full hover:bg-gray-800 transition-colors"
        >
          <LogOut size={20} className="text-white" />
        </button>
      </div>
    </div>
  );
};

const Discover: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { calculateCompatibility } = useMatch();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    college: '',
    minAge: '',
    maxAge: '',
    interests: [] as string[]
  });
  
  // Confession state
  const [confessionText, setConfessionText] = useState('');
  const [isSendingConfession, setIsSendingConfession] = useState(false);
  const [showConfessionSuccess, setShowConfessionSuccess] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState<any[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  
  // State for swipe view
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<string | null>(null);
  const [isCardsVisible, setIsCardsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Refs for interactive elements
  const searchInputRef = useRef<HTMLInputElement>(null);
  const confessionTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  // 3D perspective values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [0, window.innerHeight], [5, -5]);
  const rotateY = useTransform(mouseX, [0, window.innerWidth], [-5, 5]);

  // Handle mouse move for 3D effect
  const handleMouseMove = (e: React.MouseEvent) => {
    if (typeof window !== 'undefined' && window.innerWidth > 768) {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    }
  };
  
  // Extract all unique colleges and interests for filter options
  const allColleges = [...new Set(profiles.map(profile => profile.college))];
  const allInterests = [...new Set(profiles.flatMap(profile => profile.interests))];
  
  // Apply filters and search
  const filteredProfiles = profiles.filter(profile => {
    // Search query filter
    const matchesSearch = 
      searchQuery === '' || 
      profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.college.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.interests.some(interest => interest.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // College filter
    const matchesCollege = filters.college === '' || profile.college === filters.college;
    
    // Age range filter
    const matchesMinAge = filters.minAge === '' || profile.age >= parseInt(filters.minAge);
    const matchesMaxAge = filters.maxAge === '' || profile.age <= parseInt(filters.maxAge);
    
    // Interests filter
    const matchesInterests = 
      filters.interests.length === 0 || 
      filters.interests.some(interest => profile.interests.includes(interest));
    
    return matchesSearch && matchesCollege && matchesMinAge && matchesMaxAge && matchesInterests;
  });
  
  // Sort profiles by compatibility if user is authenticated
  const sortedProfiles = [...filteredProfiles].sort((a, b) => {
    if (isAuthenticated) {
      return calculateCompatibility(b.id) - calculateCompatibility(a.id);
    }
    return 0;
  });

  // Handle swipe action
  const handleSwipe = (direction: 'left' | 'right') => {
    setDirection(direction);
    
    // Go to next card
    if (currentIndex < sortedProfiles.length - 1) {
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        setDirection(null);
      }, 300);
    } else {
      // Reset to first card if we've gone through all profiles
      setTimeout(() => {
        setCurrentIndex(0);
        setDirection(null);
      }, 300);
    }
  };
  
  // Reset index when profiles are filtered
  useEffect(() => {
    setCurrentIndex(0);
  }, [searchQuery, filters]);
  
  // Improve the useEffect for card visibility to include loading state
  useEffect(() => {
    // Simulate loading time for better transition
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    const visibilityTimer = setTimeout(() => {
      setIsCardsVisible(true);
    }, 1500); // Slightly longer delay for better loading experience
    
    return () => {
      clearTimeout(loadingTimer);
      clearTimeout(visibilityTimer);
    };
  }, []);

  // Handle shuffle deck
  const handleShuffle = () => {
    setCurrentIndex(0);
  };
  
  const handleInterestToggle = (interest: string) => {
    setFilters(prev => {
      if (prev.interests.includes(interest)) {
        return { ...prev, interests: prev.interests.filter(i => i !== interest) };
      } else {
        return { ...prev, interests: [...prev.interests, interest] };
      }
    });
  };
  
  const clearFilters = () => {
    setFilters({
      college: '',
      minAge: '',
      maxAge: '',
      interests: []
    });
  };
  
  // Focus input field when clicking on search container
  const handleSearchContainerClick = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Handle confession text change with tagging
  const handleConfessionTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setConfessionText(text);
    
    // Track cursor position for tag suggestions
    setCursorPosition(e.target.selectionStart || 0);
    
    // Check if we need to show tag suggestions
    const lastAtIndex = text.lastIndexOf('@', cursorPosition);
    if (lastAtIndex !== -1 && cursorPosition > lastAtIndex) {
      // Get the partial tag text after the @ symbol
      const partialTag = text.substring(lastAtIndex + 1, cursorPosition).toLowerCase();
      
      // Show suggestions if we have at least 1 character after @
      if (partialTag.length > 0) {
        // Filter profiles based on the partial tag
        const suggestions = profiles.filter(profile => 
          profile.name.toLowerCase().includes(partialTag)
        ).slice(0, 5); // Limit to 5 suggestions
        
        setTagSuggestions(suggestions);
        setShowTagSuggestions(suggestions.length > 0);
      } else {
        setShowTagSuggestions(false);
      }
    } else {
      setShowTagSuggestions(false);
    }
  };
  
  // Insert a tag into the confession text
  const insertTag = (profileName: string) => {
    const lastAtIndex = confessionText.lastIndexOf('@', cursorPosition);
    if (lastAtIndex !== -1) {
      // Replace the partial tag with the full profile name
      const beforeTag = confessionText.substring(0, lastAtIndex);
      const afterTag = confessionText.substring(cursorPosition);
      const newText = `${beforeTag}@${profileName}${afterTag}`;
      
      setConfessionText(newText);
      
      // Move cursor position after the inserted tag
      const newPosition = lastAtIndex + profileName.length + 1; // +1 for the @ symbol
      setTimeout(() => {
        if (confessionTextareaRef.current) {
          confessionTextareaRef.current.selectionStart = newPosition;
          confessionTextareaRef.current.selectionEnd = newPosition;
          confessionTextareaRef.current.focus();
        }
      }, 0);
    }
    
    setShowTagSuggestions(false);
  };
  
  // Handle confession submission
  const handleConfessionSubmit = () => {
    if (!confessionText.trim()) {
      // Don't submit empty confessions
      toast.error('Please write something before sending');
      return;
    }
    
    // Show loading state
    setIsSendingConfession(true);
    
    // Check if the confession is directed at someone specific
    let targetName = sortedProfiles[currentIndex]?.name;
    const isPublic = confessionText.includes('@');
    
    if (isPublic) {
      targetName = "the Campus Connect community";
    }
    
    // Simulate API call with timeout
    setTimeout(() => {
      // Reset loading state
      setIsSendingConfession(false);
      
      // Show success message
      setShowConfessionSuccess(true);
      toast.success(`Your confession to ${targetName} was sent ${isAnonymous ? 'anonymously' : 'with your name'}!`);
      
      // Reset form
      setConfessionText('');
      setIsAnonymous(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowConfessionSuccess(false);
      }, 3000);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <DiscoverNavbar />
      <BackgroundEffects />

      <motion.div 
        className="responsive-container py-4"
        onMouseMove={handleMouseMove}
        style={{ rotateX, rotateY }}
      >
        {/* Simplified Search and Filter Section - Moved below the card */}
        
        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-500"></div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && sortedProfiles.length === 0 && (
          <div className="text-center py-20">
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-xl max-w-md mx-auto">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-pink-500" />
              <h3 className="text-xl font-bold mb-2">No profiles found</h3>
              <p className="text-gray-400 mb-6">Try adjusting your filters or search query to find more people.</p>
          <button 
                onClick={clearFilters}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-full hover:opacity-90 transition-all"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}
        
        {/* Swipe View */}
        {!isLoading && sortedProfiles.length > 0 && (
          <motion.div 
            className="flex flex-col items-center perspective-container"
            style={{ 
              perspective: "2000px",
              willChange: "transform" 
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: isLoading ? 0 : 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="swipe-card-container relative mb-6">
              <AnimatePresence mode="wait">
                {isCardsVisible && !isLoading && 
                  sortedProfiles
                    .filter((_, index) => index === currentIndex) // Only show the current card
                    .map((profile) => (
                      <motion.div
                        key={profile.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, x: direction === 'left' ? -300 : 300, rotate: direction === 'left' ? -20 : 20 }}
                        transition={{ duration: 0.3, type: "spring", damping: 30 }}
                        className="card-wrapper"
                        style={{ willChange: "transform" }}
                      >
                        <SwipeCard
                          profile={profile} 
                          onSwipe={handleSwipe}
                          isActive={true}
                        />
                      </motion.div>
                    ))
                }
              </AnimatePresence>
              
              {/* Next card preview (shows a glimpse of the next card) */}
              {isCardsVisible && !isLoading && currentIndex < sortedProfiles.length - 1 && (
                <div 
                  className="absolute top-0 left-0 w-full h-full z-0 transform scale-[0.92] -translate-y-2 opacity-50 pointer-events-none"
                  style={{ filter: "blur(1px)" }}
                >
                  <div className="w-full h-full rounded-2xl overflow-hidden bg-gray-900">
                    <img 
                      src={sortedProfiles[currentIndex + 1].image} 
                      alt="Next profile" 
                      className="w-full h-full object-cover opacity-60"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = "https://via.placeholder.com/500x700?text=Next";
                      }}
                    />
                  </div>
        </div>
      )}
      
              {/* Card deck indicator */}
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-1">
                {sortedProfiles.slice(0, 5).map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-2 h-2 rounded-full ${i === currentIndex % 5 ? 'bg-pink-500' : 'bg-gray-600'}`}
                  />
                ))}
              </div>
              
              {/* Profile counter */}
              <motion.div 
                className="absolute -bottom-16 left-0 right-0 text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full">
                  <p className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-medium">
                    {currentIndex + 1} of {sortedProfiles.length}
                  </p>
                  
                  {/* Shuffle button */}
                  {currentIndex > 0 && (
                    <button 
                      onClick={handleShuffle}
                      className="ml-3 px-3 py-1 bg-white/10 text-white rounded-full text-sm hover:bg-white/20 transition-colors"
                    >
                      <Shuffle size={14} className="inline mr-1" />
                      Restart
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
        
        {/* Search box positioned below the card */}
        <div className="mt-20 max-w-md mx-auto">
          {/* Enhanced Confession Section */}
          <div className="mb-8 bg-white/10 backdrop-blur-md p-5 rounded-lg shadow-lg">
            <h3 className="text-white font-semibold mb-3 flex items-center justify-between">
              <div className="flex items-center">
                <Heart size={18} className="text-pink-400 mr-2" fill="currentColor" />
                {!isLoading && sortedProfiles.length > 0 && currentIndex < sortedProfiles.length ? (
                  <span>Send Confession to {sortedProfiles[currentIndex].name}</span>
                ) : (
                  <span>Send Confession</span>
                )}
              </div>
              <div className="text-xs text-gray-400">
                Use @ to tag someone
              </div>
            </h3>
            
            <div className="relative">
              <textarea
                ref={confessionTextareaRef}
                placeholder={`Write your confession... Use @username to tag someone specific`}
                className="w-full bg-black/50 border border-gray-700 rounded-lg p-3 text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-pink-500 mb-3 min-h-[100px]"
                value={confessionText}
                onChange={handleConfessionTextChange}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setShowTagSuggestions(false);
                }}
                disabled={isSendingConfession || showConfessionSuccess}
              ></textarea>
              
              {/* Tag suggestions dropdown */}
              {showTagSuggestions && (
                <div className="absolute z-10 bg-black/90 backdrop-blur-md border border-gray-700 rounded-lg shadow-lg max-h-40 overflow-y-auto w-60">
                  {tagSuggestions.map((profile) => (
                    <div 
                      key={profile.id}
                      className="flex items-center p-2 hover:bg-white/10 cursor-pointer"
                      onClick={() => insertTag(profile.name)}
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden mr-2">
                        <img 
                          src={profile.image} 
                          alt={profile.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";
                          }}
                        />
                      </div>
                      <span className="text-white">{profile.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input 
                  type="checkbox"
                  id="anonymous-toggle"
                  className="mr-2 accent-pink-500"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  disabled={isSendingConfession || showConfessionSuccess}
                />
                <label 
                  htmlFor="anonymous-toggle" 
                  className={`text-sm ${isAnonymous ? "text-green-400" : "text-gray-400"}`}
                >
                  {isAnonymous ? "Send anonymously" : "Show my name"}
                </label>
              </div>
              
              <button 
                className={`px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-full hover:opacity-90 transition-all flex items-center ${
                  isSendingConfession ? 'opacity-70 cursor-not-allowed' : ''
                }`}
                onClick={handleConfessionSubmit}
                disabled={isSendingConfession || showConfessionSuccess}
              >
                {isSendingConfession ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Sending...
                  </>
                ) : showConfessionSuccess ? (
                  "Sent ✓"
                ) : (
                  "Send Confession"
                )}
              </button>
            </div>
          </div>
          
          <div className="mb-5">
        <div className="flex items-center mb-4">
              <div 
                className="flex-1 bg-white/10 backdrop-blur-sm rounded-lg flex items-center px-3 py-2 mr-3"
                onClick={handleSearchContainerClick}
              >
                <Search size={18} className="text-gray-400 mr-2" />
            <input
                  ref={searchInputRef}
              type="text"
                  placeholder="Search by name, college, or interest..."
                  className="bg-transparent w-full focus:outline-none text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
                {searchQuery && (
                  <button
                    className="text-gray-400 hover:text-white"
                    onClick={() => setSearchQuery('')}
                  >
                    <X size={18} />
                  </button>
                )}
          </div>

          <button 
                className={`p-3 rounded-lg border ${showFilters ? 'bg-pink-600 border-pink-700 text-white' : 'border-white/20 text-white/80'}`}
            onClick={() => setShowFilters(!showFilters)}
          >
                <Filter size={18} />
          </button>
        </div>
        
            <AnimatePresence>
        {showFilters && (
                <motion.div 
                  className="bg-white/10 backdrop-blur-md p-5 rounded-lg shadow-lg mb-6"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-white">Filters</h3>
              <button 
                onClick={clearFilters}
                      className="text-sm text-pink-400 hover:text-pink-300"
              >
                Clear all
              </button>
            </div>
            
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                      <label className="block text-sm text-gray-300 mb-2">College</label>
                <select
                        className="w-full p-2 bg-black/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 text-white"
                  value={filters.college}
                  onChange={(e) => setFilters(prev => ({ ...prev, college: e.target.value }))}
                >
                  <option value="">All Colleges</option>
                  {allColleges.map((college, index) => (
                    <option key={index} value={college}>{college}</option>
                  ))}
                </select>
              </div>
              
                    <div className="space-y-4">
              <div>
                        <label className="block text-sm text-gray-300 mb-2">Min Age</label>
                  <input
                    type="number"
                          className="w-full p-2 bg-black/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 text-white"
                    value={filters.minAge}
                    onChange={(e) => setFilters(prev => ({ ...prev, minAge: e.target.value }))}
                    min="18"
                          max="99"
                  />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">Max Age</label>
                  <input
                    type="number"
                          className="w-full p-2 bg-black/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-pink-500 text-white"
                    value={filters.maxAge}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxAge: e.target.value }))}
                          min="18"
                          max="99"
                  />
              </div>
            </div>
            
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Interests</label>
                      <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-1">
                {allInterests.map((interest, index) => (
                  <button
                    key={index}
                            onClick={() => handleInterestToggle(interest)}
                            className={`text-xs px-3 py-1 rounded-full transition-colors ${
                      filters.interests.includes(interest)
                                ? 'bg-pink-600 text-white' 
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>
          </div>
                </motion.div>
        )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
        </div>
  );
};

export default Discover;

