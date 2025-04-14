import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { v4 as uuidv4 } from 'uuid';
import socketService from '../services/socketService';

// Message types
interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: {
    content: string;
    timestamp: string;
    senderId: string;
  };
  createdAt: string;
  totalWordsExchanged: number;
  quizUnlocked: boolean;
  unreadCount: number;
}

interface MessageContextType {
  conversations: Conversation[];
  messages: { [conversationId: string]: Message[] };
  sendMessage: (conversationId: string, content: string) => void;
  getOrCreateConversation: (targetUserId: string) => string;
  markConversationAsRead: (conversationId: string) => void;
  getUnreadCount: (conversationId: string) => number;
  getTotalUnreadCount: () => number;
  isQuizUnlocked: (conversationId: string) => boolean;
  countWordsInMessage: (message: string) => number;
  userTypingMap: { [conversationId: string]: boolean };
  sendTypingStatus: (conversationId: string, isTyping: boolean) => void;
  userOnlineStatus: { [userId: string]: boolean };
}

// Create context
const MessageContext = createContext<MessageContextType | undefined>(undefined);

// Provider
export const MessageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<{ [conversationId: string]: Message[] }>({});
  const [userTypingMap, setUserTypingMap] = useState<{ [conversationId: string]: boolean }>({});
  const [userOnlineStatus, setUserOnlineStatus] = useState<{ [userId: string]: boolean }>({});

  // Initialize WebSocket when user is authenticated
  useEffect(() => {
    if (user && user.token) {
      // Initialize socket connection
      socketService.initialize(user.token);
      
      // Join all conversation rooms
      const conversationIds = conversations.map(c => c.id);
      if (conversationIds.length > 0) {
        socketService.joinConversations(conversationIds);
      }
      
      // Set up listeners for real-time events
      setupSocketListeners();
      
      // Cleanup on unmount
      return () => {
        socketService.disconnect();
      };
    }
  }, [user, conversations.map(c => c.id).join(',')]);
  
  // Set up socket listeners
  const setupSocketListeners = () => {
    // Listen for new messages
    socketService.onNewMessage((message) => {
      const { id, conversationId, content, senderId, timestamp } = message;
      
      // If this is a message from someone else, add it to the conversation
      if (senderId !== user?.id) {
        // Format the message to match our interface
        const newMessage: Message = {
          id,
          conversationId,
          senderId,
          content,
          timestamp,
          read: false
        };
        
        // Add message to conversation
        setMessages(prev => ({
          ...prev,
          [conversationId]: [...(prev[conversationId] || []), newMessage]
        }));
        
        // Update conversation's last message
        setConversations(prev => 
          prev.map(conv => {
            if (conv.id === conversationId) {
              return { 
                ...conv, 
                lastMessage: {
                  content,
                  timestamp,
                  senderId
                }
              };
            }
            return conv;
          })
        );
      }
    });
    
    // Listen for typing status
    socketService.onUserTyping(({ userId, conversationId, isTyping }) => {
      if (userId !== user?.id) {
        setUserTypingMap(prev => ({
          ...prev,
          [conversationId]: isTyping
        }));
      }
    });
    
    // Listen for read receipts
    socketService.onMessagesRead(({ conversationId, userId }) => {
      if (userId !== user?.id) {
        setMessages(prev => {
          const conversationMessages = prev[conversationId] || [];
          const updatedMessages = conversationMessages.map(msg => 
            msg.senderId === user?.id && !msg.read 
              ? { ...msg, read: true } 
              : msg
          );
          
          return {
            ...prev,
            [conversationId]: updatedMessages
          };
        });
      }
    });
    
    // Listen for user status changes
    socketService.onUserStatusChange(({ userId, isOnline }) => {
      setUserOnlineStatus(prev => ({
        ...prev,
        [userId]: isOnline
      }));
    });
  };

  // Load conversations and messages from localStorage
  useEffect(() => {
    if (user) {
      const storedConversations = localStorage.getItem(`campusConnection_conversations_${user.id}`);
      const storedMessages = localStorage.getItem(`campusConnection_messages_${user.id}`);
      
      if (storedConversations) {
        setConversations(JSON.parse(storedConversations));
      }
      
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      }
    }
  }, [user]);

  // Save conversations and messages to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(`campusConnection_conversations_${user.id}`, JSON.stringify(conversations));
      localStorage.setItem(`campusConnection_messages_${user.id}`, JSON.stringify(messages));
    }
  }, [conversations, messages, user]);

  // Simulate online status changes
  useEffect(() => {
    // Set all users to be online initially with some randomness
    const initialOnlineStatus: { [userId: string]: boolean } = {};
    
    // Get all unique user IDs from conversations
    const userIds = new Set<string>();
    conversations.forEach(conversation => {
      conversation.participants.forEach(participantId => {
        if (participantId !== user?.id) {
          userIds.add(participantId);
        }
      });
    });
    
    // Set random online status
    userIds.forEach(userId => {
      initialOnlineStatus[userId] = Math.random() > 0.3; // 70% chance of being online
    });
    
    setUserOnlineStatus(initialOnlineStatus);
    
    // Periodically change online status
    const interval = setInterval(() => {
      setUserOnlineStatus(prev => {
        const updatedStatus = { ...prev };
        
        // Randomly change status for some users
        userIds.forEach(userId => {
          if (Math.random() > 0.95) { // 5% chance to change status every interval
            updatedStatus[userId] = !updatedStatus[userId];
          }
        });
        
        return updatedStatus;
      });
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
  }, [conversations, user]);

  // Send a new message
  const sendMessage = (conversationId: string, content: string) => {
    if (!user) return;
    
    // Create new message
    const newMessage: Message = {
      id: uuidv4(),
      conversationId,
      senderId: user.id,
      content,
      timestamp: new Date().toISOString(),
      read: false
    };
    
    // Add to messages
    setMessages(prev => {
      const conversationMessages = prev[conversationId] || [];
      return {
      ...prev,
        [conversationId]: [...conversationMessages, newMessage]
      };
    });
    
    // Update conversation's last message
    setConversations(prev => 
      prev.map(conversation => {
        if (conversation.id === conversationId) {
          return { 
            ...conversation,
            lastMessage: {
              content,
              timestamp: newMessage.timestamp,
              senderId: user.id
            }
          };
        }
        return conversation;
      })
    );
    
    // Simulate response after a random delay (1-3 seconds)
    setTimeout(() => {
      simulateResponse(conversationId);
    }, 1000 + Math.random() * 2000);
  };
  
  // Simulate a response from the other user
  const simulateResponse = (conversationId: string) => {
    if (!user) return;
    
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;
    
    // Get the other participant
    const otherUserId = conversation.participants.find(id => id !== user.id);
    if (!otherUserId) return;
    
    // Show typing indicator
    setUserTypingMap(prev => ({
      ...prev,
      [conversationId]: true
    }));
    
    // Clear typing indicator and send message after 1-2 seconds
    setTimeout(() => {
      setUserTypingMap(prev => ({
        ...prev,
        [conversationId]: false
      }));
      
      // Create response message
      const responseMessage: Message = {
        id: uuidv4(),
        conversationId,
        senderId: otherUserId,
        content: getRandomResponse(conversationId),
        timestamp: new Date().toISOString(),
        read: false
      };
      
      // Add to messages
      setMessages(prev => {
        const conversationMessages = prev[conversationId] || [];
        return {
          ...prev,
          [conversationId]: [...conversationMessages, responseMessage]
        };
      });
      
      // Update conversation's last message
      setConversations(prev => 
        prev.map(conversation => {
          if (conversation.id === conversationId) {
            return {
              ...conversation,
              lastMessage: {
                content: responseMessage.content,
                timestamp: responseMessage.timestamp,
                senderId: otherUserId
              },
              unreadCount: conversation.unreadCount + 1
            };
          }
          return conversation;
        })
      );
    }, 1000 + Math.random() * 1000);
  };
  
  // Get a random response message
  const getRandomResponse = (conversationId: string): string => {
    const responses = [
      "That sounds interesting! Tell me more.",
      "I've been thinking about that too recently.",
      "Hmm, I'm not sure I agree. What do you think?",
      "That's a great point! I never thought of it that way.",
      "I'd love to chat more about this sometime.",
      "Have you ever tried the new cafe near campus?",
      "What are your plans for the weekend?",
      "Did you finish that assignment for the class yet?",
      "I've been meaning to ask you about that!",
      "Let's meet up sometime this week if you're free?",
      "Haha, that's so funny!",
      "I feel the same way about that.",
      "Really? That's surprising to hear.",
      "What made you interested in that topic?",
      "I'd love to hear more about your perspective on this.",
      "That reminds me of something I read the other day.",
      "Have you heard about the event happening on campus this Friday?",
      "What do you think about meeting up for coffee someday?",
      "I'm curious to know what you think about this.",
      "That's actually one of my favorite topics to discuss!"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };
  
  // Mark a conversation as read
  const markConversationAsRead = (conversationId: string) => {
    if (!user) return;
    
    // Mark all messages in the conversation as read
    setMessages(prev => {
      const conversationMessages = prev[conversationId] || [];
      
      if (conversationMessages.some(m => m.senderId !== user.id && !m.read)) {
      return {
        ...prev,
          [conversationId]: conversationMessages.map(message => 
            message.senderId !== user.id && !message.read
              ? { ...message, read: true }
              : message
          )
        };
      }
      
      return prev;
    });
    
    // Reset unread count for the conversation
    setConversations(prev => 
      prev.map(conversation => 
        conversation.id === conversationId
          ? { ...conversation, unreadCount: 0 }
          : conversation
      )
    );
  };
  
  // Get unread count for a conversation
  const getUnreadCount = (conversationId: string): number => {
    const conversation = conversations.find(c => c.id === conversationId);
    return conversation?.unreadCount || 0;
  };
  
  // Get total unread count across all conversations
  const getTotalUnreadCount = (): number => {
    return conversations.reduce((total, conversation) => total + conversation.unreadCount, 0);
  };
  
  // Get or create a conversation with a user
  const getOrCreateConversation = (targetUserId: string): string => {
    if (!user) return '';
    
    // Check if conversation already exists
    const existingConversation = conversations.find(conversation => 
      conversation.participants.includes(user.id) && 
      conversation.participants.includes(targetUserId)
    );
    
    if (existingConversation) {
      return existingConversation.id;
    }
    
    // Create new conversation
    const newConversation: Conversation = {
      id: uuidv4(),
      participants: [user.id, targetUserId],
      createdAt: new Date().toISOString(),
      totalWordsExchanged: 0,
      quizUnlocked: false,
      unreadCount: 0
    };
    
    // Add to conversations
    setConversations(prev => [...prev, newConversation]);
    
    return newConversation.id;
  };
  
  // Check if quiz is unlocked for a conversation (after 5+ messages exchanged)
  const isQuizUnlocked = (conversationId: string): boolean => {
    const conversationMessages = messages[conversationId] || [];
    return conversationMessages.length >= 5;
  };
  
  // Send typing status
  const sendTypingStatus = (conversationId: string, isTyping: boolean) => {
    // Update typing status
    setUserTypingMap(prev => ({
      ...prev,
      [conversationId]: isTyping
    }));
  };

  // Count words in a message
  const countWordsInMessage = (message: string): number => {
    if (!message) return 0;
    
    return message.trim().split(/\s+/).length;
  };

  return (
    <MessageContext.Provider
      value={{
      conversations,
      messages,
      sendMessage,
      getOrCreateConversation,
      markConversationAsRead,
      getUnreadCount,
      getTotalUnreadCount,
      isQuizUnlocked,
        countWordsInMessage,
        userTypingMap,
        sendTypingStatus,
        userOnlineStatus
      }}
    >
      {children}
    </MessageContext.Provider>
  );
};

// Hook for using the message context
export const useMessage = () => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return context;
};