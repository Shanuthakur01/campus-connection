import React, { useState } from 'react';
import { Heart, AlertCircle } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

interface LocationState {
  from?: {
    pathname: string;
  };
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  
  const locationState = location.state as LocationState;
  const from = locationState?.from?.pathname || '/discover';
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      await login(formData.email, formData.password);
      setSuccess('Login successful!');
        setTimeout(() => navigate(from, { replace: true }), 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your credentials.');
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
          src="https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2069&q=80" 
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
          className="text-6xl font-bold mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Start something epic.
        </motion.h1>
        
        {error && (
          <div className="mb-6 p-3 bg-red-900/50 text-red-200 rounded-lg flex items-center max-w-md w-full">
            <AlertCircle size={18} className="mr-2 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-3 bg-green-900/50 text-green-200 rounded-lg max-w-md w-full">
            <span className="text-sm">{success}</span>
          </div>
        )}
        
        <motion.div 
          className="max-w-md w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <form onSubmit={handleSubmit} className="mb-6">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
              className="w-full mb-3 p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 focus:border-pink-500 focus:outline-none text-white"
              placeholder="Email"
                  required
                />
              
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
              className="w-full mb-5 p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 focus:border-pink-500 focus:outline-none text-white"
              placeholder="Password"
                  required
                />
              
            <motion.button
                type="submit"
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-full font-bold text-lg hover:from-pink-600 hover:to-pink-700 transition-colors duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Logging in...' : 'Log in'}
            </motion.button>
        </form>
        
          <div className="text-center">
            <motion.button
              onClick={() => navigate('/signup')}
              className="w-full py-4 rounded-full font-bold text-lg bg-transparent border-2 border-white mb-4 hover:bg-white/10 transition-colors duration-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Create account
            </motion.button>
          </div>

          <p className="text-white/60 text-sm mt-6">
            By clicking Log In, you agree to our <a href="#" className="underline">Terms</a>. 
            Learn how we process your data in our <a href="#" className="underline">Privacy Policy</a> and 
            <a href="#" className="underline"> Cookie Policy</a>.
          </p>
        </motion.div>
      </main>
      
      {/* Footer */}
      <footer className="py-4 text-center text-white/60 text-sm relative z-20">
        <div className="flex justify-center space-x-6 mb-2">
          <a href="#" className="hover:text-white">About</a>
          <a href="#" className="hover:text-white">Safety</a>
          <a href="#" className="hover:text-white">Support</a>
        </div>
        <p>© {new Date().getFullYear()} Campus Connection</p>
      </footer>
    </div>
  );
};

export default Login;