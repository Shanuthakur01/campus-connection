import { io, Socket } from 'socket.io-client';

// Define message interface
interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: string;
  read?: boolean;
}

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
  
  onNewMessage: (callback: (message: Message) => void) => {
    // This is just a mock - no real messages will be received
    console.log('Registered new message callback (mock)');
  },
  
  onUserTyping: (callback: (data: { userId: string, conversationId: string, isTyping: boolean }) => void) => {
    console.log('Registered typing status callback (mock)');
  },
  
  onMessagesRead: (callback: (data: { conversationId: string, userId: string }) => void) => {
    console.log('Registered messages read callback (mock)');
  },
  
  onUserStatusChange: (callback: (data: { userId: string, isOnline: boolean }) => void) => {
    console.log('Registered user status change callback (mock)');
  }
};

export default socketService; 