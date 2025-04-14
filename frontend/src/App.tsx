import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Heart, MessageCircle, User } from 'lucide-react';
import Navbar from './components/Navbar';
import Discover from './pages/Discover';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';
import MatchQuiz from './pages/MatchQuiz';
import MatchResults from './pages/MatchResults';
import { useAuth } from './context/AuthContext';
import { useMessage } from './context/MessageContext';
import socketService from './services/socketService';
import ChatNotification from './components/ChatNotification';
import { profiles } from './data/profiles';

// Error boundary component to catch rendering errors
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Rendering error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// Fallback UI to show when an error occurs
const ErrorFallback = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <div className="text-red-500 text-5xl mb-4">😟</div>
        <h2 className="text-2xl font-bold mb-4">Oops! Something went wrong</h2>
        <p className="mb-6 text-gray-600">
          We're having trouble displaying this page. Let's try to fix it!
        </p>
        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            Refresh Page
          </button>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-2 px-4 border border-purple-600 text-purple-600 rounded-md hover:bg-purple-50 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
};

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
    </div>;
  }

  if (!isAuthenticated) {
    // Redirect to login page but save the location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Add this new component
const AppLogo: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div 
      className="fixed top-4 left-4 z-50 app-logo cursor-pointer"
      onClick={() => navigate('/discover')}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#ec4899" stroke="#ec4899" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
      <span className="logo-text">Campus Connection</span>
    </div>
  );
};

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const { getTotalUnreadCount } = useMessage();
  const [authUser, setAuthUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{
    conversationId: string;
    message: any;
    senderName: string;
    senderAvatar: string;
  } | null>(null);
  
  // Determine which tab is active based on the current path
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/' || path === '/discover') return 'discover';
    if (path.startsWith('/messages')) return 'messages';
    if (path.startsWith('/profile')) return 'profile';
    return '';
  };

  const activeTab = getActiveTab();
  
  // Check if we're on an auth page or special page
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  const isQuizPage = location.pathname.startsWith('/quiz');
  const isResultsPage = location.pathname.startsWith('/results');
  const shouldHideNavigation = isAuthPage || isQuizPage || isResultsPage;

  // Redirect authenticated users away from auth pages
  useEffect(() => {
    if (isAuthenticated && isAuthPage) {
      navigate('/discover');
    }
  }, [isAuthenticated, isAuthPage, navigate]);

  // Get unread message count
  const unreadCount = getTotalUnreadCount();

  useEffect(() => {
    // Get user from local storage
    const userData = localStorage.getItem('campusConnection_user');
    if (userData) {
      const user = JSON.parse(userData);
      setAuthUser(user);
    }
    setLoading(false);
  }, []);
  
  // Setup socket listeners for notifications
  useEffect(() => {
    if (authUser) {
      // Initialize socket connection
      socketService.initialize(authUser.token);
      
      // Set up notification handler
      socketService.onNewMessage((message) => {
        // Only show notification if the sender is not the current user
        if (message.senderId !== authUser.id) {
          // Get sender details
          const profile = profiles.find(p => p.id.toString() === message.senderId);
          
          if (profile) {
            setNotification({
              conversationId: message.conversationId,
              message,
              senderName: profile.name,
              senderAvatar: profile.image
            });
          }
        }
      });
      
      return () => {
        socketService.disconnect();
      };
    }
  }, [authUser]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
    </div>;
  }

  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <div className="min-h-screen bg-black text-white">
        {/* Notification component */}
        {notification && (
          <ChatNotification
            conversationId={notification.conversationId}
            message={notification.message}
            senderName={notification.senderName}
            senderAvatar={notification.senderAvatar}
          />
        )}
        
        {!shouldHideNavigation && <AppLogo />}
        
        <main className={`responsive-container main-content ${shouldHideNavigation ? 'py-0' : ''}`}>
          <Routes>
            <Route path="/" element={<Discover />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/messages" element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            } />
            <Route path="/messages/:conversationId" element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/quiz/:partnerId" element={
              <ProtectedRoute>
                <MatchQuiz />
              </ProtectedRoute>
            } />
            <Route path="/results/:resultId" element={
              <ProtectedRoute>
                <MatchResults />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
      
        {!shouldHideNavigation && (
          <footer className="mobile-nav">
            <div className="flex justify-around py-3">
              <button 
                className={`flex flex-col items-center ${activeTab === 'discover' ? 'text-pink-500' : 'text-gray-500'}`}
                onClick={() => navigate('/discover')}
              >
                <Heart size={24} />
                <span className="text-xs mt-1">Discover</span>
              </button>
              <button 
                className={`flex flex-col items-center ${activeTab === 'messages' ? 'text-pink-500' : 'text-gray-500'} relative`}
                onClick={() => navigate('/messages')}
              >
                <MessageCircle size={24} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
                <span className="text-xs mt-1">Messages</span>
              </button>
              <button 
                className={`flex flex-col items-center ${activeTab === 'profile' ? 'text-pink-500' : 'text-gray-500'}`}
                onClick={() => navigate('/profile')}
              >
                <User size={24} />
                <span className="text-xs mt-1">Profile</span>
              </button>
            </div>
          </footer>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;