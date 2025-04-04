const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const Message = require('../models/message.model');
const Conversation = require('../models/conversation.model');

const socketHandler = (io) => {
  // Store online users
  const onlineUsers = new Map();

  // Authentication middleware for socket.io
  io.use(async (socket, next) => {
    try {
      // Get token from handshake auth
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: Token not provided'));
      }
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      
      // Set user data to socket
      socket.user = user;
      next();
    } catch (error) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.name} (${socket.user._id})`);
    
    // Add user to online users
    onlineUsers.set(socket.user._id.toString(), socket.id);
    
    // Emit online users to all connected clients
    io.emit('userStatus', {
      onlineUsers: Array.from(onlineUsers.keys())
    });

    // Add user to their personal room (for private messages)
    socket.join(socket.user._id.toString());
    
    // Handle getting user conversations
    socket.on('getConversations', async () => {
      try {
        const conversations = await Conversation.find({
          participants: socket.user._id
        })
        .populate('participants', 'name email profileImage')
        .sort({ updatedAt: -1 });
        
        socket.emit('conversations', conversations);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      }
    });

    // Handle join conversation
    socket.on('joinConversation', (conversationId) => {
      socket.join(conversationId);
      console.log(`${socket.user.name} joined conversation: ${conversationId}`);
    });

    // Handle chat message event
    socket.on('sendMessage', async (data) => {
      try {
        const { recipientId, content } = data;
        
        if (!recipientId || !content) {
          return socket.emit('error', { message: 'Recipient ID and content are required' });
        }
        
        const messageData = {
          sender: socket.user._id,
          senderName: socket.user.name,
          senderImage: socket.user.profileImage,
          content,
          timestamp: new Date()
        };
        
        // Send message to recipient
        io.to(recipientId).emit('receiveMessage', messageData);
        
        // Send confirmation to sender
        socket.emit('messageSent', { success: true, message: messageData });
        
      } catch (error) {
        console.error('Socket message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('typing', (data) => {
      const { recipientId } = data;
      
      if (recipientId) {
        io.to(recipientId).emit('userTyping', {
          userId: socket.user._id,
          userName: socket.user.name
        });
      }
    });

    // Handle stop typing indicator
    socket.on('stopTyping', (data) => {
      const { recipientId } = data;
      
      if (recipientId) {
        io.to(recipientId).emit('userStoppedTyping', {
          userId: socket.user._id
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.name} (${socket.user._id})`);
      
      // Remove user from online users
      onlineUsers.delete(socket.user._id.toString());
      
      // Emit updated online users
      io.emit('userStatus', {
        onlineUsers: Array.from(onlineUsers.keys())
      });
    });
  });
};

module.exports = socketHandler; 