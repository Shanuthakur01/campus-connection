import React, { useState, useRef } from 'react';
import { Heart, AlertCircle, Upload, X, Check, Loader } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

// Predefined list of interests for users to select from
const INTERESTS = [
  'Sports', 'Fitness', 'Music', 'Art', 'Movies', 'Reading',
  'Travel', 'Photography', 'Cooking', 'Dancing', 'Gaming',
  'Technology', 'Fashion', 'Outdoors', 'Pets', 'Science',
  'History', 'Politics', 'Volunteering', 'Yoga'
];

// Update the formData type to match our new SignupData interface
interface FormData {
  name: string;
  email: string;
  password: string;
  age: number | string; // String for input, converted to number on submit
  photos: string[];
  interests: string[];
}

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { signup, isAuthenticated } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    age: '',
    photos: [],
    interests: []
  });
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload only image files');
        return;
      }
      
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (reader.result) {
          // Add the new photo to the photos array
          setFormData(prev => ({
            ...prev,
            photos: [...prev.photos, reader.result as string]
          }));
          
          // Clear the input field to allow selecting the same file again if needed
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          
          toast.success('Photo added successfully');
        }
      };
      reader.onerror = () => {
        toast.error('Error reading file');
      };
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...formData.photos];
    newPhotos.splice(index, 1);
    setFormData(prev => ({ ...prev, photos: newPhotos }));
  };

  // Toggle an interest selection
  const toggleInterest = (interest: string) => {
    setFormData(prev => {
      if (prev.interests.includes(interest)) {
        return {
          ...prev,
          interests: prev.interests.filter(i => i !== interest)
        };
      } else {
        // Limit to 5 interests
        if (prev.interests.length >= 5) {
          setError('You can select up to 5 interests');
          return prev;
        }
        return {
          ...prev,
          interests: [...prev.interests, interest]
        };
      }
    });
    setError('');
  };

  // Improve the validateForm function
  const validateForm = (): { isValid: boolean, message: string } => {
    // Email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!formData.name.trim()) {
      return { isValid: false, message: 'Please enter your name' };
    }
    
    if (!formData.email.trim()) {
      return { isValid: false, message: 'Please enter your email' };
    }
    
    if (!emailRegex.test(formData.email)) {
      return { isValid: false, message: 'Please enter a valid email address' };
    }
    
    if (!formData.password) {
      return { isValid: false, message: 'Please enter a password' };
    }
    
    if (formData.password.length < 6) {
      return { isValid: false, message: 'Password must be at least 6 characters' };
    }
    
    if (!formData.age) {
      return { isValid: false, message: 'Please enter your age' };
    }
    
    const ageNum = Number(formData.age);
    if (isNaN(ageNum) || ageNum < 18) {
      return { isValid: false, message: 'You must be at least 18 years old' };
    }
    
    if (formData.photos.length === 0) {
      return { isValid: false, message: 'Please upload at least one photo' };
    }
    
    if (formData.interests.length < 3) {
      return { isValid: false, message: 'Please select at least 3 interests' };
    }
    
    return { isValid: true, message: '' };
  };

  // Update handleSubmit with better error handling
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      const validation = validateForm();
      
      if (!validation.isValid) {
        setError(validation.message);
        toast.error(validation.message);
        setIsSubmitting(false);
        return;
      }
      
      // Convert age to number before submitting
      const submitData = {
        ...formData,
        age: Number(formData.age)
      };
      
      const result = signup(submitData);
      
      if (result.success) {
        toast.success('Account created successfully!');
        // Redirect to main app page upon successful signup
        navigate('/discover');
      } else {
        setError(result.message);
        toast.error(result.message);
      }
    } catch (err) {
      console.error('Signup error:', err);
      const errorMessage = 'An error occurred during signup. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect authenticated users
  if (isAuthenticated) {
    navigate('/discover');
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Background image */}
      <div className="fixed inset-0 overflow-hidden z-0">
        <div className="absolute inset-0 bg-black/70 z-10"></div>
        <img 
          src="https://images.unsplash.com/photo-1529369462133-c0a06cf32bad?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2070&q=80" 
          alt="" 
          className="w-full h-full object-cover opacity-80"
        />
      </div>

      {/* Header with logo */}
      <header className="relative z-20 py-5 px-6">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#ec4899" stroke="#ec4899" strokeWidth="1" className="mr-2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <span className="text-2xl font-bold">Campus Connection</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow flex flex-col items-center justify-center relative z-20 px-4 py-12">
        <motion.h1 
          className="text-5xl font-bold mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          Create your account
        </motion.h1>

        {error && (
          <motion.div 
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4 flex items-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </motion.div>
        )}

        {success && (
          <motion.div 
            className="mb-6 p-3 bg-green-900/50 text-green-200 rounded-lg max-w-md w-full flex items-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-green-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm">{success}</span>
          </motion.div>
        )}

        <motion.div 
          className="max-w-md w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        >
          <form onSubmit={handleSubmit} className="mb-6 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 focus:border-pink-500 focus:outline-none text-white transition-all duration-300"
                placeholder="Full Name"
                required
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="w-full p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 focus:border-pink-500 focus:outline-none text-white transition-all duration-300"
                placeholder="Age"
                required
                min="18"
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 focus:border-pink-500 focus:outline-none text-white transition-all duration-300"
                placeholder="Email"
                required
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            >
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 focus:border-pink-500 focus:outline-none text-white transition-all duration-300"
                placeholder="Password"
                required
                minLength={6}
              />
            </motion.div>

            {/* Photo upload section */}
            <motion.div 
              className="mt-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.7 }}
            >
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              
              <div className="p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:border-pink-500 transition-all duration-300">
                {formData.photos.length > 0 ? (
                  <div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.photos.map((photo, index) => (
                        <div key={index} className="relative w-20 h-20 rounded-md overflow-hidden">
                          <img src={photo} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            className="absolute top-1 right-1 bg-black/50 p-1 rounded-full hover:bg-red-500/80 transition-colors duration-300"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center w-full py-2 rounded-lg border border-dashed border-pink-400 text-pink-400 hover:bg-pink-500/10 transition-all duration-300"
                    >
                      <Upload size={18} className="mr-2" />
                      Add more photos
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center w-full py-4 px-2 transition-all duration-300"
                  >
                    <Upload size={24} className="mr-2 text-pink-400" />
                    <span>Upload profile photos</span>
                  </button>
                )}
              </div>
            </motion.div>

            {/* Interests selection section */}
            <motion.div 
              className="mt-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.8 }}
            >
              <label className="block mb-2 text-white/80">
                Select your interests (3-5)
                <span className="ml-2 text-sm text-pink-400">{formData.interests.length}/5 selected</span>
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {INTERESTS.map((interest, index) => (
                  <motion.button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`flex items-center justify-between p-3 rounded-lg transition-all duration-300 ${
                      formData.interests.includes(interest)
                        ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white'
                        : 'bg-white/10 hover:bg-white/20 text-white/80'
                    }`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ 
                      duration: 0.3, 
                      delay: 0.8 + (index % 6) * 0.05 
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span>{interest}</span>
                    {formData.interests.includes(interest) && 
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Check size={18} />
                      </motion.div>
                    }
                  </motion.button>
                ))}
              </div>
            </motion.div>

            <motion.button
              className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-6 rounded-full shadow-lg w-full flex items-center justify-center"
              type="submit"
              whileHover={!isSubmitting ? { scale: 1.03 } : {}}
              whileTap={!isSubmitting ? { scale: 0.97 } : {}}
              disabled={isSubmitting}
            >
              <motion.div
                className="flex items-center justify-center"
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </motion.div>
            </motion.button>
          </form>

          <div className="text-center">
            <motion.p 
              className="text-white/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 1.1 }}
            >
              Already have an account?{' '}
              <Link to="/login" className="text-pink-400 hover:underline transition-all duration-300">
                Login
              </Link>
            </motion.p>
          </div>
        </motion.div>
      </main>
      
      {/* Footer */}
      <footer className="py-4 text-center text-white/60 text-sm relative z-20">
        <div className="flex justify-center space-x-6 mb-2">
          <a href="#" className="hover:text-white transition-colors duration-300">About</a>
          <a href="#" className="hover:text-white transition-colors duration-300">Safety</a>
          <a href="#" className="hover:text-white transition-colors duration-300">Support</a>
        </div>
        <p>© {new Date().getFullYear()} Campus Connection</p>
      </footer>
    </div>
  );
};

export default Signup; 