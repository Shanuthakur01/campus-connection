import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// User type
export interface User {
  id: string;
  email: string;
  name: string;
  age: number;
  photos: string[];
  interests: string[];
  bio?: string;
  college?: string;
  location?: string;
  gender?: string;
  profileImage?: string;
  coverImage?: string;
  matches?: string[];
  isVerified?: boolean;
}

interface SignupData {
  email: string;
  password: string;
  name: string;
  age: number;
  photos: string[];
  interests: string[];
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signup: (data: SignupData) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem('campus_connection_user');
    if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          
          // If user exists but missing profileImage or photos, try to retrieve from full user data
          if (parsedUser && parsedUser.id) {
            const fullUserData = localStorage.getItem(`campus_connection_user_${parsedUser.id}`);
            if (fullUserData) {
              const fullUser = JSON.parse(fullUserData);
              
              // Merge missing images/photos from full user data if they exist
              if ((!parsedUser.profileImage || !parsedUser.coverImage || !parsedUser.photos || parsedUser.photos.length === 0) && 
                  (fullUser.profileImage || fullUser.coverImage || (fullUser.photos && fullUser.photos.length > 0))) {
                
                parsedUser.profileImage = parsedUser.profileImage || fullUser.profileImage;
                parsedUser.coverImage = parsedUser.coverImage || fullUser.coverImage;
                parsedUser.photos = parsedUser.photos && parsedUser.photos.length > 0 ? 
                  parsedUser.photos : 
                  (fullUser.photos || []);
                
                // Update localStorage with restored data
                localStorage.setItem('campus_connection_user', JSON.stringify(parsedUser));
              }
            }
          }
          
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Signup function
  const signup = async (data: SignupData): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Validate required fields
      if (!data.email || !data.password || !data.name || !data.age || data.photos.length === 0 || data.interests.length < 3) {
        throw new Error('All fields are required');
      }
      
      // Check email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new Error('Please enter a valid email address');
      }
      
      // Check password length
      if (data.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      
      // Check age
      if (data.age < 18) {
        throw new Error('You must be at least 18 years old');
      }
      
      // Check if user already exists
      const storedUsers = JSON.parse(localStorage.getItem('campus_connection_users') || '[]');
      const existingUser = storedUsers.find((u: any) => u.email === data.email);
      
      if (existingUser) {
        throw new Error('User with this email already exists');
      }
      
      // Optimize photos to prevent localStorage quota issues
      const optimizedPhotos = data.photos.map(photo => {
        // If it's a very long data URL, resize/compress it
        if (photo.length > 50000) { // Over ~50KB
          try {
            // Extract base64 data from data URL
            const base64Data = photo.split(',')[1];
            // Keep only the first 50KB of base64 data to prevent quota issues
            const truncatedBase64 = base64Data.substring(0, 50000);
            // Rebuild data URL with truncated data
            return photo.split(',')[0] + ',' + truncatedBase64;
          } catch (e) {
            console.error('Error optimizing photo:', e);
            return photo;
          }
        }
        return photo;
      });
      
      // Create new user with optimized photos
    const newUser: User = {
        id: `user_${Date.now()}`,
        email: data.email,
        name: data.name,
        age: data.age,
        photos: optimizedPhotos,
        interests: data.interests,
        profileImage: optimizedPhotos[0], // Use first photo as profile image
        matches: [],
        isVerified: false
      };
      
      // Save user with password in separate object to avoid storing raw user data
      const userWithPassword = { ...newUser, password: data.password };
      
      // Instead of storing all users in one item, store each user in a separate localStorage item
      localStorage.setItem(`campus_connection_user_${newUser.id}`, JSON.stringify(userWithPassword));
      
      // Store only user IDs and emails in the users list to avoid quota issues
      const usersList = [...storedUsers.map((u: any) => ({ 
        id: u.id, 
        email: u.email 
      })), { 
        id: newUser.id, 
        email: newUser.email 
      }];
      
      localStorage.setItem('campus_connection_users', JSON.stringify(usersList));
      
      // Log in user
      localStorage.setItem('campus_connection_user', JSON.stringify(newUser));
    setUser(newUser);
      
      toast.success('Account created successfully! Welcome to Campus Connection.');
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Error creating account. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Login function
  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Validate inputs
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      
      // Get stored user list (ids and emails only)
      const storedUsersList = JSON.parse(localStorage.getItem('campus_connection_users') || '[]');
      
      // Find user by email
      const userInfo = storedUsersList.find((u: any) => u.email === email);
      
      if (!userInfo) {
        throw new Error('Invalid email or password');
      }
      
      // Get full user data from individual storage
      const storedUser = localStorage.getItem(`campus_connection_user_${userInfo.id}`);
      
      if (!storedUser) {
        throw new Error('User data not found. Please try signing up again.');
      }
      
      const user = JSON.parse(storedUser);
      
      // Check password
      if (user.password !== password) {
        throw new Error('Invalid email or password');
      }
      
      // Remove password from user object
      const { password: _, ...userWithoutPassword } = user;
      
      // Ensure photos, profileImage and coverImage are preserved
      const userToStore = {
        ...userWithoutPassword,
        photos: userWithoutPassword.photos || [],
        profileImage: userWithoutPassword.profileImage || (userWithoutPassword.photos && userWithoutPassword.photos.length > 0 ? userWithoutPassword.photos[0] : undefined),
      };
      
      // Save to local storage
      localStorage.setItem('campus_connection_user', JSON.stringify(userToStore));
      
      // Update state
      setUser(userToStore);
      
      toast.success(`Welcome back, ${userToStore.name}!`);
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Error logging in. Please check your credentials.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout function
  const logout = () => {
    localStorage.removeItem('campus_connection_user');
    setUser(null);
    toast.info('You have been logged out');
    navigate('/login');
  };
  
  // Update profile
  const updateProfile = (data: Partial<User>) => {
    if (!user) return;
    
    try {
      // Optimize photos if they're being updated
      let updatedData = { ...data };
      
      if (data.photos) {
        const optimizedPhotos = data.photos.map(photo => {
          // If it's a very long data URL, resize/compress it
          if (photo && photo.length > 50000) { // Over ~50KB
            try {
              // Extract base64 data from data URL
              const base64Data = photo.split(',')[1];
              // Keep only the first 50KB of base64 data to prevent quota issues
              const truncatedBase64 = base64Data.substring(0, 50000);
              // Rebuild data URL with truncated data
              return photo.split(',')[0] + ',' + truncatedBase64;
            } catch (e) {
              console.error('Error optimizing photo:', e);
              return photo;
            }
          }
          return photo;
        });
        
        updatedData.photos = optimizedPhotos;
        
        // Update profile image if photo array changes and no specific profileImage was provided
        if (optimizedPhotos.length > 0 && !data.profileImage) {
          updatedData.profileImage = optimizedPhotos[0];
        }
      }
      
      // Ensure we're preserving existing photos if none were provided
      if (!updatedData.photos && user.photos) {
        updatedData.photos = user.photos;
      }
      
      // Update user state with optimized data
      const updatedUser = { 
        ...user, 
        ...updatedData,
        // Ensure photos array is preserved
        photos: updatedData.photos || user.photos || []
      };
      
      // Set the user state
      setUser(updatedUser);
      
      // Update in localStorage for current user
      localStorage.setItem('campus_connection_user', JSON.stringify(updatedUser));
      
      // Get the full user data including password
      const storedUserData = localStorage.getItem(`campus_connection_user_${user.id}`);
      
      if (storedUserData) {
        const userWithPassword = JSON.parse(storedUserData);
        const updatedUserWithPassword = { 
          ...userWithPassword, 
          ...updatedData,
          // Ensure photos array is preserved
          photos: updatedData.photos || userWithPassword.photos || [] 
        };
        
        // Update the full user data
        localStorage.setItem(`campus_connection_user_${user.id}`, JSON.stringify(updatedUserWithPassword));
      }
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    }
  };

  return (
    <AuthContext.Provider
      value={{
      user, 
        isAuthenticated: !!user,
        isLoading,
        signup,
      login, 
      logout, 
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook for using the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};