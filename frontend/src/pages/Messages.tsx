import React, { useState, useRef, useEffect } from 'react';
import { User, Send, Smile, Paperclip, Image, ArrowLeft, Sparkles, Wifi, WifiOff, CheckCheck, X, MessageCircle } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import ConversationStarter from '../components/ConversationStarter';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';
import { profiles } from '../data/profiles';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

// Interface for file uploads
interface FileMessage {
  url: string;
  type: 'image' | 'file';
  name: string;
}

// Simple emoji array for a basic emoji picker
const commonEmojis = [
  { emoji: '😊', description: 'Smiling face with smiling eyes' },
  { emoji: '😂', description: 'Face with tears of joy' },
  { emoji: '❤️', description: 'Red heart' },
  { emoji: '👍', description: 'Thumbs up' },
  { emoji: '🔥', description: 'Fire' },
  { emoji: '😍', description: 'Smiling face with heart-eyes' },
  { emoji: '🙏', description: 'Folded hands' },
  { emoji: '😭', description: 'Loudly crying face' },
  { emoji: '😘', description: 'Face blowing a kiss' },
  { emoji: '🥰', description: 'Smiling face with hearts' },
  { emoji: '😎', description: 'Smiling face with sunglasses' },
  { emoji: '🤣', description: 'Rolling on the floor laughing' },
  { emoji: '🥺', description: 'Pleading face' },
  { emoji: '😢', description: 'Crying face' },
  { emoji: '👏', description: 'Clapping hands' },
  { emoji: '🤔', description: 'Thinking face' },
  { emoji: '😁', description: 'Beaming face with smiling eyes' }
];

const Messages: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    conversations, 
    messages, 
    sendMessage, 
    markConversationAsRead,
    getUnreadCount,
    getTotalUnreadCount,
    isQuizUnlocked,
    userTypingMap,
    sendTypingStatus,
    userOnlineStatus
  } = useMessage();
  
  const [messageInput, setMessageInput] = useState('');
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  
  // Mark conversation as read when viewing
  useEffect(() => {
    if (conversationId) {
      markConversationAsRead(conversationId);
    }
  }, [conversationId, markConversationAsRead, messages]);
  
  // Scroll to bottom of messages when a new message is added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, conversationId]);
  
  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Get conversation partner
  const getConversationPartner = (conversation: any) => {
    if (!user) return null;
    
    const partnerId = conversation.participants.find((id: string) => id !== user.id);
    
    // Check if partner is a profile from our data
    const profile = profiles.find(p => p.id.toString() === partnerId);
    if (profile) {
      return {
        id: profile.id.toString(),
        name: profile.name,
        avatar: profile.image
      };
    }
    
    // If not found in profiles, it might be a user
    return {
      id: partnerId,
      name: 'User',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80'
    };
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return format(date, 'h:mm a');
    }
    
    // If this year, show month and day
    if (date.getFullYear() === now.getFullYear()) {
      return format(date, 'MMM d');
    }
    
    // Otherwise show full date
    return format(date, 'MMM d, yyyy');
  };
  
  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setMessageInput(prev => prev + emoji);
    setShowEmojiPicker(false);
  };
  
  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'file' | 'image') => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit.');
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview for images
      if (type === 'image' && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else if (type === 'file') {
        setFilePreview(null);
      }
    }
  };
  
  // Remove selected file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
  };
  
  // Convert file to base64 for demo purposes
  // (In a real app, you'd upload to a server/cloud storage)
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };
  
  // Send file message
  const handleSendFile = async () => {
    if (!selectedFile || !conversationId) return;
    
    try {
      setUploading(true);
      
      // In a real app, you'd upload the file to a server/cloud storage
      // and get back a URL. For demo purposes, we'll use base64.
      const base64 = await fileToBase64(selectedFile);
      
      // Determine if it's an image or other file
      const isImage = selectedFile.type.startsWith('image/');
      
      // Create file message object
      const fileMessage: FileMessage = {
        url: base64,
        type: isImage ? 'image' : 'file',
        name: selectedFile.name
      };
      
      // Send as a JSON string
      sendMessage(conversationId, JSON.stringify(fileMessage));
      
      // Clear file selection
      handleRemoveFile();
    } catch (error) {
      console.error('Error sending file:', error);
      alert('Failed to send file. Please try again.');
    } finally {
      setUploading(false);
    }
  };
  
  // Check if the message is a file/image message
  const isFileMessage = (content: string): FileMessage | null => {
    try {
      const parsed = JSON.parse(content);
      if (parsed && parsed.url && parsed.type && parsed.name) {
        return parsed as FileMessage;
      }
      return null;
    } catch {
      return null;
    }
  };
  
  const handleSendMessage = () => {
    if (selectedFile && conversationId) {
      handleSendFile();
      return;
    }
    
    if (messageInput.trim() && conversationId) {
      // Send message
      sendMessage(conversationId, messageInput);
      
      // Clear input
      setMessageInput('');
      
      // Clear typing indicator
      handleStopTyping();
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessageInput(value);
    
    // Handle typing indicator
    if (conversationId) {
      // Show typing indicator
      sendTypingStatus(conversationId, true);
      
      // Clear previous timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      // Set new timeout to clear typing indicator after 2 seconds of inactivity
      const timeout = setTimeout(() => {
        handleStopTyping();
      }, 2000);
      
      setTypingTimeout(timeout);
    }
  };
  
  const handleStopTyping = () => {
    if (conversationId) {
      sendTypingStatus(conversationId, false);
      
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }
    }
  };
  
  const handleUseConversationStarter = (topic: string) => {
    if (conversationId) {
      setMessageInput(topic);
    }
  };
  
  // Get current conversation
  const currentConversation = conversationId 
    ? conversations.find(c => c.id === conversationId)
    : null;
  
  // Get conversation partner
  const conversationPartner = currentConversation 
    ? getConversationPartner(currentConversation)
    : null;
  
  // Get conversation messages
  const conversationMessages = conversationId 
    ? messages[conversationId] || []
    : [];
  
  // Check if user is typing
  const isPartnerTyping = conversationId ? userTypingMap[conversationId] : false;
  
  // Check if partner is online
  const isPartnerOnline = conversationPartner ? userOnlineStatus[conversationPartner.id] : false;
  
  // Check if quiz is unlocked for this conversation
  const quizUnlocked = conversationId ? isQuizUnlocked(conversationId) : false;
  
  // Get conversation partner ID for quiz
  const getPartnerIdForQuiz = () => {
    if (!user || !conversationId) return '';
    
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return '';
    
    return conversation.participants.find(id => id !== user.id) || '';
  };
  
  // Handle starting the quiz
  const handleStartQuiz = () => {
    const partnerId = getPartnerIdForQuiz();
    if (partnerId) {
      navigate(`/quiz/${partnerId}`);
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-xl overflow-hidden h-full flex flex-col">
      {!conversationId ? (
        // Messages list view
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-pink-500 text-white">
            <h2 className="text-xl font-semibold">Messages</h2>
            <p className="text-white/80 text-sm">
              {getTotalUnreadCount() > 0 
                ? `You have ${getTotalUnreadCount()} unread message(s)` 
                : 'No new messages'}
            </p>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6">
                <div className="bg-purple-100 rounded-full p-6 mb-4">
                  <MessageCircle size={32} className="text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
                <p className="text-gray-500 text-sm text-center mb-4">
                  When you match with other users, you'll be able to message them here.
                </p>
                <button
                  onClick={() => navigate('/discover')}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-full hover:opacity-90 transition-colors"
                >
                  Discover People
                </button>
              </div>
            ) : (
              // Conversations list
              <div>
            {conversations.map(conversation => {
              const partner = getConversationPartner(conversation);
              const unreadCount = getUnreadCount(conversation.id);
              const lastMessage = conversation.lastMessage;
                  const isOnline = partner ? userOnlineStatus[partner.id] : false;
              
              return (
                <div 
                  key={conversation.id}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-purple-50 transition-colors ${conversationId === conversation.id ? 'bg-purple-50' : ''}`}
                  onClick={() => navigate(`/messages/${conversation.id}`)}
                >
                  <div className="flex items-center">
                    <div className="relative">
                      <img 
                        src={partner?.avatar} 
                        alt={partner?.name} 
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center text-xs text-white">
                              {unreadCount}
                            </span>
                      )}
                          <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    </div>
                        
                        <div className="ml-4 flex-1">
                      <div className="flex justify-between">
                            <h3 className="font-semibold text-gray-900">{partner?.name}</h3>
                          <span className="text-xs text-gray-500">
                              {lastMessage && formatTimestamp(lastMessage.timestamp)}
                            </span>
                          </div>
                          
                          <div className="flex items-center">
                            <p className="text-sm text-gray-500 truncate max-w-[180px]">
                              {lastMessage && lastMessage.content}
                            </p>
                            
                            {unreadCount > 0 && (
                              <span className="ml-2 text-xs text-purple-600 font-semibold">
                                {unreadCount > 1 ? `${unreadCount} new` : 'new'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
              </div>
            )}
          </div>
        </div>
      ) : (
        // Conversation view
        <div className="chat-container">
          {/* Conversation header */}
          <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
                  <div className="flex items-center">
                    <button 
                      onClick={() => navigate('/messages')}
                className="mr-3 p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                <ArrowLeft size={20} className="text-gray-600" />
                    </button>
              
                    <img 
                src={conversationPartner?.avatar} 
                alt={conversationPartner?.name} 
                      className="w-10 h-10 rounded-full object-cover"
                    />
              
              <div className="ml-3">
                <h3 className="font-semibold">{conversationPartner?.name}</h3>
                <div className="flex items-center text-xs text-gray-500">
                  {isPartnerOnline ? (
                    <>
                      <Wifi size={12} className="text-green-500 mr-1" />
                      <span>Online</span>
                    </>
                  ) : (
                    <>
                      <WifiOff size={12} className="text-gray-400 mr-1" />
                      <span>Offline</span>
                    </>
                  )}
                </div>
              </div>
                  </div>
                  
                  {quizUnlocked && (
                    <button
                      onClick={handleStartQuiz}
                className="flex items-center px-3 py-1.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full text-sm hover:opacity-90 transition-all"
                    >
                <Sparkles size={16} className="mr-1" />
                <span>Compatibility Quiz</span>
                    </button>
                  )}
          </div>
          
          {/* Messages Area */}
          <div 
            className="message-list"
            ref={messageContainerRef}
          >
            {conversationMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="bg-gray-100 rounded-full p-4 mb-4">
                  <User size={32} className="text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
                <p className="text-gray-500 text-sm text-center mb-4">
                  Say hello to {conversationPartner.name} and start connecting!
                </p>
                
                <ConversationStarter onSelect={handleUseConversationStarter} />
              </div>
            ) :
              <div className="space-y-3">
                {conversationMessages.map((message, index) => {
                  const isUser = message.senderId === user?.id;
                  const showAvatar = index === 0 || 
                    conversationMessages[index - 1].senderId !== message.senderId;
                  
                  // Check if message is a file/image
                  const fileMessage = isFileMessage(message.content);
                  
                  return (
                    <div 
                      key={message.id} 
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-end ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                        {!isUser && showAvatar && (
                          <img 
                            src={conversationPartner.avatar} 
                            alt={conversationPartner.name} 
                            className="w-8 h-8 rounded-full object-cover mr-2"
                          />
                        )}
                        
                        {!isUser && !showAvatar && <div className="w-8 mr-2" />}
                        
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            isUser 
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white mr-2' 
                              : 'bg-gray-100 text-gray-800 ml-2'
                          }`}
                        >
                          {fileMessage ? (
                            fileMessage.type === 'image' ? (
                              <div className="w-full">
                                <img 
                                  src={fileMessage.url} 
                                  alt={fileMessage.name}
                                  className="rounded-md max-h-48 w-auto mb-2" 
                                />
                                <p className="text-xs truncate">{fileMessage.name}</p>
                              </div>
                            ) : (
                              <div className="flex flex-col">
                                <div className="bg-white/20 p-2 rounded-md flex items-center mb-2">
                                  <Paperclip size={16} className="mr-2" />
                                  <span className="text-sm truncate">{fileMessage.name}</span>
                                </div>
                                <a 
                                  href={fileMessage.url} 
                                  download={fileMessage.name}
                                  className="text-xs underline"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Download file
                                </a>
                              </div>
                            )
                          ) : (
                            <p>{message.content}</p>
                          )}
                          <div className={`flex items-center text-xs mt-1 ${
                            isUser ? 'text-white/70 justify-end' : 'text-gray-500'
                          }`}>
                            <span>{formatTimestamp(message.timestamp)}</span>
                            {isUser && message.read && (
                              <CheckCheck size={12} className="ml-1" />
                            )}
                        </div>
                        </motion.div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Show typing indicator */}
                {isPartnerTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-end">
                      <img 
                        src={conversationPartner.avatar} 
                        alt={conversationPartner.name} 
                        className="w-8 h-8 rounded-full object-cover mr-2"
                      />
                      <div className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800 ml-2">
                          <div className="flex space-x-1">
                          <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></span>
                          <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                          <span className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                        </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
              </div>
            }
          </div>
            
          {/* File Upload Preview */}
          {selectedFile && (
            <div className="p-4 border-t border-gray-200 bg-purple-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-white p-2 rounded-md mr-3">
                    {filePreview && filePreview.startsWith('data:image') ? (
                      <img src={filePreview} alt="Preview" className="h-12 w-12 object-cover rounded" />
                    ) : (
                      <Paperclip size={24} className="text-purple-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 truncate max-w-[200px]">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
                <button 
                  onClick={handleRemoveFile}
                  className="p-1 rounded-full hover:bg-red-100 text-red-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          )}
                
                {/* Message Input */}
          <div className="message-input-container">
            <div className="flex items-end space-x-2">
              <div className="relative flex-1">
                <textarea
                  value={messageInput}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={1}
                  style={{ maxHeight: '120px', minHeight: '44px' }}
                  disabled={!!selectedFile}
                />
                <div className="absolute right-2 bottom-2 flex space-x-1">
                  <button 
                    className="p-1 text-gray-500 hover:text-purple-600 transition-colors"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    disabled={!!selectedFile}
                  >
                        <Smile size={20} />
                      </button>
                  <button 
                    className="p-1 text-gray-500 hover:text-purple-600 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!!selectedFile}
                  >
                        <Paperclip size={20} />
                      </button>
                  <button 
                    className="p-1 text-gray-500 hover:text-purple-600 transition-colors"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={!!selectedFile}
                  >
                        <Image size={20} />
                      </button>
                  
                  {/* Hidden file inputs */}
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    onChange={(e) => handleFileChange(e, 'file')}
                    accept=".pdf,.doc,.docx,.txt"
                  />
                  <input 
                    type="file" 
                    ref={imageInputRef} 
                    className="hidden" 
                    onChange={(e) => handleFileChange(e, 'image')}
                    accept="image/*"
                  />
                </div>
              </div>
              
              <button
                onClick={handleSendMessage}
                className={`p-3 rounded-full ${
                  (messageInput.trim() || selectedFile) 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90' 
                    : 'bg-gray-200 cursor-not-allowed'
                } transition-colors`}
                disabled={!messageInput.trim() && !selectedFile}
              >
                <Send size={20} className={`${(messageInput.trim() || selectedFile) ? 'text-white' : 'text-gray-500'}`} />
              </button>
            </div>
            
            {/* Emoji picker */}
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div 
                  ref={emojiPickerRef}
                  className="absolute bottom-20 right-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <Picker data={data} onEmojiSelect={handleEmojiSelect} previewPosition="none" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;