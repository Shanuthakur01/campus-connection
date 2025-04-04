const Conversation = require('../models/conversation.model');
const Message = require('../models/message.model');
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

// Map to store user socket connections
const userSocketMap = new Map();
// Map to store typing status
const typingStatusMap = new Map();

const socketHandler = (io) => {
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      // Get token from handshake auth
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication token is required'));
      }
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Set user data to socket
      socket.user = {
        id: decoded.id,
        name: decoded.name
      };
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user.id;
    console.log(`User connected: ${userId}`);
    
    // Store user's socket connection
    userSocketMap.set(userId, socket.id);
    
    // Update user's online status
    try {
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastActive: new Date()
      });
      
      // Notify user's conversations about online status
      const conversations = await Conversation.find({
        participants: userId,
        isActive: true
      });
      
      conversations.forEach(conversation => {
        const otherParticipantId = conversation.participants.find(
          id => id.toString() !== userId
        );
        
        if (otherParticipantId && userSocketMap.has(otherParticipantId.toString())) {
          io.to(userSocketMap.get(otherParticipantId.toString()))
            .emit('user_status_change', { userId, isOnline: true });
        }
      });
    } catch (error) {
      console.error('Error updating online status:', error);
    }
    
    // Join conversation rooms
    socket.on('join_conversations', async ({ conversationIds }) => {
      try {
        if (!Array.isArray(conversationIds)) return;
        
        // Verify user is participant in these conversations
        const validConversations = await Conversation.find({
          _id: { $in: conversationIds },
          participants: userId,
          isActive: true
        }).select('_id');
        
        const validIds = validConversations.map(c => c._id.toString());
        
        // Join valid conversation rooms
        validIds.forEach(id => {
          socket.join(`conversation:${id}`);
          console.log(`User ${userId} joined conversation: ${id}`);
        });
      } catch (error) {
        console.error('Error joining conversations:', error);
      }
    });
    
    // Handle new message
    socket.on('new_message', async (data) => {
      try {
        const { conversationId, content } = data;
        
        if (!conversationId || !content || content.trim() === '') {
          return socket.emit('error', { message: 'Invalid message data' });
        }
        
        // Verify user is in this conversation
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: userId,
          isActive: true
        });
        
        if (!conversation) {
          return socket.emit('error', { message: 'Conversation not found or inactive' });
        }
        
        // Create and save message
        const message = new Message({
          conversation: conversationId,
          sender: userId,
          content: content.trim(),
          readBy: [userId] // Sender automatically reads their own message
        });
        
        await message.save();
        
        // Update conversation
        conversation.lastMessage = message._id;
        
        // Increment unread count for other participants
        conversation.participants.forEach(participantId => {
          if (participantId.toString() !== userId) {
            const currentCount = conversation.unreadCount.get(participantId.toString()) || 0;
            conversation.unreadCount.set(participantId.toString(), currentCount + 1);
          }
        });
        
        // Update word count and check if quiz should be unlocked
        conversation.totalWordsExchanged += content.trim().split(/\s+/).length;
        
        if (conversation.totalWordsExchanged >= 300 && !conversation.quizUnlocked) {
          conversation.quizUnlocked = true;
          
          // Notify users that quiz is unlocked
          conversation.participants.forEach(participantId => {
            const participantIdStr = participantId.toString();
            if (userSocketMap.has(participantIdStr)) {
              io.to(userSocketMap.get(participantIdStr)).emit('quiz_unlocked', {
                conversationId: conversation._id.toString()
              });
            }
          });
        }
        
        await conversation.save();
        
        // Populate message for response
        await message.populate({
          path: 'sender',
          select: 'name profileImage'
        });
        
        // Broadcast to conversation room
        io.to(`conversation:${conversationId}`).emit('receive_message', message);
        
        // Send notifications to offline participants
        conversation.participants.forEach(participantId => {
          const participantIdStr = participantId.toString();
          
          if (participantIdStr !== userId) {
            // If user is connected to socket, send notification
            if (userSocketMap.has(participantIdStr)) {
              io.to(userSocketMap.get(participantIdStr)).emit('new_message_notification', {
                conversationId,
                message
              });
            }
            
            // Clear typing indicator for sender
            if (typingStatusMap.has(`${userId}:${conversationId}`)) {
              clearTimeout(typingStatusMap.get(`${userId}:${conversationId}`));
              typingStatusMap.delete(`${userId}:${conversationId}`);
              
              // Notify other participants that user stopped typing
              socket.to(`conversation:${conversationId}`).emit('user_typing', {
                userId,
                conversationId,
                isTyping: false
              });
            }
          }
        });
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
    
    // Handle typing status
    socket.on('typing', ({ conversationId, isTyping }) => {
      // Clear existing timeout if any
      if (typingStatusMap.has(`${userId}:${conversationId}`)) {
        clearTimeout(typingStatusMap.get(`${userId}:${conversationId}`));
      }
      
      if (isTyping) {
        // Set a timeout to automatically clear typing status after 3 seconds
        const timeout = setTimeout(() => {
          typingStatusMap.delete(`${userId}:${conversationId}`);
          socket.to(`conversation:${conversationId}`).emit('user_typing', {
            userId,
            conversationId,
            isTyping: false
          });
        }, 3000);
        
        typingStatusMap.set(`${userId}:${conversationId}`, timeout);
      } else {
        typingStatusMap.delete(`${userId}:${conversationId}`);
      }
      
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        userId,
        conversationId,
        isTyping
      });
    });
    
    // Handle read messages
    socket.on('mark_read', async ({ conversationId }) => {
      try {
        // Check if user is in conversation
        const conversation = await Conversation.findOne({
          _id: conversationId,
          participants: userId
        });
        
        if (!conversation) return;
        
        // Mark messages as read
        await Message.updateMany(
          { 
            conversation: conversationId,
            sender: { $ne: userId },
            readBy: { $ne: userId }
          },
          { $addToSet: { readBy: userId } }
        );
        
        // Reset unread count
        conversation.unreadCount.set(userId.toString(), 0);
        await conversation.save();
        
        // Notify other participants
        socket.to(`conversation:${conversationId}`).emit('messages_read', {
          conversationId,
          userId
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });
    
    // Handle presence updates (when a user becomes active in a conversation)
    socket.on('conversation_active', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('user_active_in_conversation', {
        userId,
        conversationId
      });
    });
    
    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${userId}`);
      
      // Remove from socket map
      userSocketMap.delete(userId);
      
      // Clear any typing indicators
      for (const key of typingStatusMap.keys()) {
        if (key.startsWith(`${userId}:`)) {
          clearTimeout(typingStatusMap.get(key));
          typingStatusMap.delete(key);
          
          // Extract conversation ID from the key
          const conversationId = key.split(':')[1];
          
          // Notify others that the user stopped typing
          io.to(`conversation:${conversationId}`).emit('user_typing', {
            userId,
            conversationId,
            isTyping: false
          });
        }
      }
      
      // Update user's online status
      try {
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastActive: new Date()
        });
        
        // Notify user's conversations about offline status
        const conversations = await Conversation.find({
          participants: userId,
          isActive: true
        });
        
        conversations.forEach(conversation => {
          const otherParticipantId = conversation.participants.find(
            id => id.toString() !== userId
          );
          
          if (otherParticipantId && userSocketMap.has(otherParticipantId.toString())) {
            io.to(userSocketMap.get(otherParticipantId.toString()))
              .emit('user_status_change', { userId, isOnline: false });
          }
        });
      } catch (error) {
        console.error('Error updating offline status:', error);
      }
    });
  });
};

module.exports = socketHandler; 