import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

// Mock socket service implementation to prevent errors
const socketService = {
  initialize: (token: string) => {
    console.log('Socket service initialized (mock)');
  },
  
  disconnect: () => {
    console.log('Socket disconnected (mock)');
  },
  
  joinConversations: (conversationIds: string[]) => {
    console.log('Joined conversations (mock):', conversationIds);
  },
  
  sendMessage: (conversationId: string, content: string) => {
    console.log('Sending message (mock):', { conversationId, content });
  },
  
  markMessagesAsRead: (conversationId: string) => {
    console.log('Marking messages as read (mock):', conversationId);
  },
  
  sendTypingStatus: (conversationId: string, isTyping: boolean) => {
    console.log('Sending typing status (mock):', { conversationId, isTyping });
  },
  
  onNewMessage: (callback: (message: any) => void) => {
    // This is just a mock - no real messages will be received
    console.log('Registered new message callback (mock)');
  },
};

export default socketService; 