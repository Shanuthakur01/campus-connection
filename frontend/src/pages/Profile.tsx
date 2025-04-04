import React, { useState, useRef, useEffect } from 'react';
import { Camera, Edit2, Upload, Check, X, LogOut, MessageCircle, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMatch } from '../context/MatchContext';
import { useQuiz } from '../context/QuizContext';
import { profiles } from '../data/profiles';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const { user, logout, updateProfile } = useAuth();
  const { matches } = useMatch();
  const { quizResults } = useQuiz();
  const navigate = useNavigate();
  
  // Initialize profileData from user data
  const [profileData, setProfileData] = useState({
    name: user?.name || "User",
    age: user?.age || 22,
    college: user?.college || "College",
    bio: user?.bio || "Architecture student with a passion for sustainable design. Love photography and exploring hidden gems in the city.",
    interests: user?.interests || ["Architecture", "Photography", "Sustainability", "Cycling"],
    location: user?.location || "Bhawarkuan, Indore",
    email: user?.email || "user@example.com",
    gender: user?.gender || "Male",
    profileImage: user?.profileImage || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80",
    coverImage: user?.coverImage || "https://images.unsplash.com/photo-1557682250-33bd709cbe85?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
    photos: user?.photos || []
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(profileData);
  const [isChangingProfilePic, setIsChangingProfilePic] = useState(false);
  const [isChangingCoverPic, setIsChangingCoverPic] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [uploading, setUploading] = useState(false);

  // Update profileData and formData when user data changes
  useEffect(() => {
    if (user) {
      const updatedData = {
        name: user.name || "User",
        age: user.age || 22,
        college: user.college || "College",
        bio: user.bio || "Architecture student with a passion for sustainable design. Love photography and exploring hidden gems in the city.",
        interests: user.interests || ["Architecture", "Photography", "Sustainability", "Cycling"],
        location: user.location || "Bhawarkuan, Indore",
        email: user.email || "user@example.com",
        gender: user.gender || "Male",
        profileImage: user.profileImage || "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80",
        coverImage: user.coverImage || "https://images.unsplash.com/photo-1557682250-33bd709cbe85?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
        photos: user.photos || []
      };
      
      setProfileData(updatedData);
      // Only update formData if not currently editing to avoid overwriting user input
      if (!isEditing) {
        setFormData(updatedData);
      }
    }
  }, [user, isEditing]);

  // Handle starting edit mode
  const startEditing = () => {
    // Ensure we have the latest user data in the form
    if (user) {
      setFormData({
        name: user.name || profileData.name,
        age: user.age || profileData.age,
        college: user.college || profileData.college,
        bio: user.bio || profileData.bio,
        interests: user.interests || profileData.interests,
        location: user.location || profileData.location,
        email: user.email || profileData.email,
        gender: user.gender || profileData.gender,
        profileImage: user.profileImage || profileData.profileImage,
        coverImage: user.coverImage || profileData.coverImage,
        photos: user.photos || profileData.photos
      });
    }
    setIsEditing(true);
  };

  const profileFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Use a callback to ensure we're working with the latest state
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      // For age field, convert to number
      if (name === 'age' && value) {
        updated.age = parseInt(value, 10);
      }
      return updated;
    });
  };

  const handleInterestChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const interests = value.split(',').map(interest => interest.trim());
    setFormData(prev => ({ ...prev, interests }));
  };

  // Convert file to base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle profile image file change
  const handleProfileFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload only image files');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      const base64 = await convertFileToBase64(file);
      
      // Update local state first
      const updatedPhotos = [...(formData.photos || []), base64];
      setFormData(prev => ({ 
        ...prev, 
        profileImage: base64,
        photos: updatedPhotos
      }));
      
      // Save to context and localStorage immediately for persistence
      updateProfile({
        profileImage: base64,
        photos: updatedPhotos
      });
      
      setIsChangingProfilePic(false);
      toast.success('Profile picture updated!');
    } catch (err) {
      toast.error('Error processing image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Handle cover image file change
  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload only image files');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      const base64 = await convertFileToBase64(file);
      
      // Update local state
      setFormData(prev => ({ ...prev, coverImage: base64 }));
      
      // Save to context and localStorage immediately for persistence
      updateProfile({
        coverImage: base64
      });
      
      setIsChangingCoverPic(false);
      toast.success('Cover photo updated!');
    } catch (err) {
      toast.error('Error processing image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update local state
    setProfileData(formData);
    setIsEditing(false);
    
    // Update user profile in context and localStorage with all form data
    updateProfile({
      name: formData.name,
      age: formData.age,
      college: formData.college,
      bio: formData.bio,
      interests: formData.interests,
      location: formData.location,
      gender: formData.gender,
      profileImage: formData.profileImage,
      coverImage: formData.coverImage,
      photos: formData.photos
    });
    
    toast.success('Profile updated successfully!');
  };

  // Close the form without saving
  const cancelEditing = () => {
    // Reset form data to current profile data
    setFormData(profileData);
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
  };

  const handleStartChat = (partnerId: string) => {
    // Implement the logic to start a chat with the partner
    console.log(`Starting chat with ${partnerId}`);
  };

  const handleTakeQuiz = (partnerId: string) => {
    // Implement the logic to take a quiz with the partner
    console.log(`Taking quiz with ${partnerId}`);
  };

  const handleViewResult = (resultId: string) => {
    // Implement the logic to view the result details
    console.log(`Viewing result details for ${resultId}`);
  };

  const getCompatibilityMessage = (score: number) => {
    if (score >= 80) return "Excellent match!";
    if (score >= 60) return "Good match!";
    if (score >= 40) return "Moderate match.";
    return "Poor match.";
  };

  return (
    <div className="responsive-container">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Profile Header */}
        <div className="relative h-48 md:h-64 bg-gray-200">
          {/* Cover image with fallback */}
          <div 
            className="cover-image-container h-full w-full bg-cover bg-center"
            style={{ 
              backgroundImage: `url(${formData.coverImage})`, 
              backgroundPosition: 'center',
              backgroundSize: 'cover',
              backgroundRepeat: 'no-repeat'
            }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
          </div>
          
          {/* Cover image controls */}
          <div className="absolute top-4 right-4 flex space-x-2 z-10">
            <button 
              className="bg-purple-600 text-white p-2 rounded-full shadow-md hover:bg-purple-700 transition-colors"
              onClick={() => coverFileInputRef.current?.click()}
              disabled={uploading}
            >
              <Edit2 size={16} />
            </button>
            <button 
              className="bg-purple-600 text-white p-2 rounded-full shadow-md hover:bg-purple-700 transition-colors"
              onClick={startEditing}
            >
              <Edit2 size={16} />
            </button>
          </div>
          <input 
            type="file"
            ref={coverFileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleCoverFileChange}
          />
          
          <div className="absolute -bottom-16 left-4 md:left-8">
            <div className="relative">
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-white overflow-hidden bg-gray-200">
                <img 
                  src={formData.profileImage}
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  loading="eager"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80";
                  }}
                />
              </div>
              <button
                className="absolute bottom-0 right-0 bg-purple-600 text-white p-2 rounded-full shadow-md hover:bg-purple-700 transition-colors"
                onClick={() => profileFileInputRef.current?.click()}
                disabled={uploading}
              >
                <Camera size={16} />
              </button>
              <input 
                type="file"
                ref={profileFileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleProfileFileChange}
              />
            </div>
          </div>
        </div>
        
        {/* Profile Content */}
        <div className="pt-20 px-4 md:px-8 pb-8">
          {uploading && (
            <div className="mb-6 p-4 bg-purple-50 rounded-lg flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-700"></div>
              <span className="ml-2">Uploading image...</span>
            </div>
          )}
          
          {/* Profile Tabs */}
          <div className="flex overflow-x-auto border-b border-gray-200 mb-6">
            <button
              className={`py-2 px-4 font-medium whitespace-nowrap ${activeTab === 'profile' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
            <button
              className={`py-2 px-4 font-medium whitespace-nowrap ${activeTab === 'matches' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('matches')}
            >
              Matches
            </button>
            <button
              className={`py-2 px-4 font-medium whitespace-nowrap ${activeTab === 'quizzes' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('quizzes')}
            >
              Quiz Results
            </button>
          </div>
          
          {/* Profile Tab Content */}
          {activeTab === 'profile' && (
            isEditing ? (
              <form onSubmit={handleSubmit} className="responsive-form">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="age" className="block text-gray-700 mb-2">Age</label>
                      <input
                        type="number"
                        id="age"
                        name="age"
                        value={formData.age}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        readOnly
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="gender" className="block text-gray-700 mb-2">Gender</label>
                      <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      <option value="Non-binary">Non-binary</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="college" className="block text-gray-700 mb-2">College</label>
                      <input
                        type="text"
                        id="college"
                        name="college"
                        value={formData.college}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="location" className="block text-gray-700 mb-2">Location</label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label htmlFor="interests" className="block text-gray-700 mb-2">Interests (comma separated)</label>
                      <input
                        type="text"
                        id="interests"
                        name="interests"
                        value={formData.interests.join(', ')}
                        onChange={handleInterestChange}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  
                  <div className="md:col-span-2">
                    <label htmlFor="bio" className="block text-gray-700 mb-2">Bio</label>
                    <textarea
                      id="bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      rows={4}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    ></textarea>
                  </div>
                  
                  <div className="md:col-span-2 flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg"
                    >
                      Save Changes
                    </button>
                  </div>
                  </div>
                </form>
              ) : (
              <div className="profile-layout">
                <div className="profile-content">
                  <div className="mb-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800">{profileData.name}, {profileData.age}</h2>
                    <p className="text-purple-600">{profileData.college}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="col-span-2">
                      <h3 className="text-lg font-semibold mb-2 text-gray-700">About Me</h3>
                      <p className="text-gray-600">{profileData.bio}</p>
                      
                      <h3 className="text-lg font-semibold mt-6 mb-2 text-gray-700">Interests</h3>
                    <div className="flex flex-wrap gap-2">
                        {profileData.interests.map((interest, index) => (
                        <span 
                          key={index} 
                            className="px-4 py-1 bg-purple-100 text-purple-600 rounded-full text-sm"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold mb-2 text-gray-700">Contact Info</h3>
                      <p className="flex items-center text-gray-600 mb-2">
                        <span className="font-medium w-20">Email:</span>
                        {profileData.email}
                      </p>
                      <p className="flex items-center text-gray-600 mb-2">
                        <span className="font-medium w-20">Location:</span>
                        {profileData.location}
                      </p>
                      <p className="flex items-center text-gray-600">
                        <span className="font-medium w-20">Gender:</span>
                        {profileData.gender}
                      </p>
                      
                      <button 
                        onClick={startEditing}
                        className="mt-4 w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Edit Profile
                      </button>
                      
                      <button 
                        onClick={handleLogout}
                        className="mt-2 w-full px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center"
                      >
                        <LogOut size={16} className="mr-2" />
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          )}
          
          {activeTab === 'matches' && (
            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-700">Your Matches</h3>
              
              {matches.length === 0 ? (
                <div className="text-center p-8 bg-purple-50 rounded-lg">
                  <p className="text-gray-600 mb-4">You haven't matched with anyone yet.</p>
                  <button 
                    onClick={() => navigate('/discover')}
                    className="px-6 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
                  >
                    Discover People
                  </button>
                </div>
              ) : (
                <div className="responsive-grid">
                  {matches.map(match => {
                    const matchProfile = profiles.find(p => p.id.toString() === match.profileId);
                    if (!matchProfile) return null;
                    
                    return (
                      <div key={match.id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
                        <div className="h-48 overflow-hidden">
                          <img 
                            src={matchProfile.image} 
                            alt={matchProfile.name} 
                            className="w-full h-full object-cover"
                          />
                            </div>
                        <div className="p-4">
                          <h4 className="font-semibold text-gray-800">{matchProfile.name}, {matchProfile.age}</h4>
                          <p className="text-purple-600 text-sm mb-2">{matchProfile.college}</p>
                          <p className="text-gray-600 text-sm line-clamp-2 mb-3">{matchProfile.bio}</p>
                          
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleStartChat(matchProfile.id.toString())}
                              className="flex-1 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm flex items-center justify-center"
                            >
                              <MessageCircle size={14} className="mr-1" />
                              Message
                            </button>
                            <button 
                              onClick={() => handleTakeQuiz(matchProfile.id.toString())}
                              className="flex-1 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors text-sm flex items-center justify-center"
                            >
                              <UserCheck size={14} className="mr-1" />
                              Quiz
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'quizzes' && (
            <div>
              <h3 className="text-xl font-semibold mb-4 text-gray-700">Quiz Results</h3>
              
              {quizResults.length === 0 ? (
                <div className="text-center p-8 bg-purple-50 rounded-lg">
                  <p className="text-gray-600 mb-4">You haven't taken any compatibility quizzes yet.</p>
                  <button 
                    onClick={() => navigate('/discover')}
                    className="px-6 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
                  >
                    Discover People
                  </button>
                </div>
              ) : (
                <div className="responsive-grid">
                  {quizResults.map(result => {
                    const partnerProfile = profiles.find(p => p.id.toString() === result.partnerId);
                    if (!partnerProfile) return null;
                    
                    return (
                      <div key={result.id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
                        <div className="p-4">
                          <div className="flex items-center mb-4">
                          <img 
                              src={partnerProfile.image} 
                              alt={partnerProfile.name} 
                            className="w-12 h-12 rounded-full object-cover mr-3"
                          />
                          <div>
                              <h4 className="font-semibold text-gray-800">{partnerProfile.name}</h4>
                              <p className="text-purple-600 text-sm">{partnerProfile.college}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Compatibility Score:</span>
                            <span className="font-semibold text-lg text-pink-600">{result.score}%</span>
                          </div>
                          
                          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                            <div 
                              className="bg-gradient-to-r from-purple-600 to-pink-500 h-2.5 rounded-full" 
                              style={{ width: `${result.score}%` }}
                            ></div>
                        </div>
                        
                          <p className="text-gray-600 text-sm mb-4">{getCompatibilityMessage(result.score)}</p>
                          
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleViewResult(result.id)}
                              className="flex-1 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
                            >
                              View Details
                            </button>
                            <button 
                              onClick={() => handleStartChat(result.partnerId)}
                              className="flex-1 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors text-sm"
                            >
                              Message
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;